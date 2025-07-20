import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';
import { withOptionalAuth } from '@/lib/auth';

// Validation schema for comment creation
const commentSchema = z.object({
  content: z.string().min(1).max(2000),
  guestName: z.string().optional(),
  parentId: z.string().uuid().optional()
});

// GET - Get comments for a specific worldcup
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.api, identifier);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const resolvedParams = await params;
    const worldcupId = resolvedParams.id;

    // Get query parameters
    const url = new URL(request.url);
    const sortBy = url.searchParams.get('sortBy') || 'recent'; // recent, likes
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Verify worldcup exists
    const { data: worldcup, error: worldcupError } = await supabase
      .from('worldcups')
      .select('id, is_public, visibility')
      .eq('id', worldcupId)
      .single();

    if (worldcupError) {
      return NextResponse.json(
        { error: 'WorldCup not found' },
        { status: 404 }
      );
    }

    // Build query for comments
    let query = supabase
      .from('comments')
      .select(`
        id,
        content,
        guest_name,
        like_count,
        reply_count,
        is_pinned,
        created_at,
        updated_at,
        author_id,
        parent_id
      `)
      .eq('worldcup_id', worldcupId)
      .eq('is_deleted', false)
      .range(offset, offset + limit - 1);

    // Apply sorting
    if (sortBy === 'likes') {
      query = query.order('like_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: comments, error: commentsError } = await query;

    if (commentsError) {
      console.error('Comments fetch error:', commentsError);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // Get user details for authenticated comments
    const userIds = comments
      .filter(comment => comment.author_id)
      .map(comment => comment.author_id);

    let userDetails = {};
    if (userIds.length > 0) {
      // Get user metadata from auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (!authError && authUsers?.users) {
        userDetails = authUsers.users.reduce((acc, user) => {
          // Extract display name from Google OAuth metadata
          const displayName = 
            user.user_metadata?.full_name || 
            user.user_metadata?.name || 
            user.identities?.[0]?.identity_data?.full_name || 
            user.identities?.[0]?.identity_data?.name || 
            user.email?.split('@')[0] || 
            'Unknown User';
          
          acc[user.id] = {
            displayName,
            avatar: user.user_metadata?.avatar_url || 
                   user.user_metadata?.picture || 
                   user.identities?.[0]?.identity_data?.avatar_url || 
                   user.identities?.[0]?.identity_data?.picture || 
                   `https://avatar.vercel.sh/${user.email}.png`
          };
          return acc;
        }, {});
      }
    }

    // Transform comments to match frontend expectations
    const transformedComments = comments.map(comment => {
      let authorName = 'Anonymous';
      
      if (comment.author_id && userDetails[comment.author_id]) {
        // Use display name from auth metadata
        authorName = userDetails[comment.author_id].displayName;
      } else if (comment.guest_name) {
        // For guest comments, use guest_name
        authorName = comment.guest_name;
      }

      return {
        id: comment.id,
        content: comment.content,
        author: authorName,
        authorId: comment.author_id,
        guestName: comment.guest_name,
        likes: comment.like_count || 0,
        replies: comment.reply_count || 0,
        isCreator: false, // Would need to check if author is worldcup creator
        isPinned: comment.is_pinned,
        level: 'user', // Default level
        createdAt: comment.created_at,
        parentId: comment.parent_id
      };
    });

    return NextResponse.json({
      success: true,
      comments: transformedComments,
      total: comments.length,
      hasMore: comments.length === limit
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOptionalAuth(request, async (user) => {
    try {
      // Rate limiting - stricter for comment creation
      const identifier = getUserIdentifier(request);
      const rateLimitResult = await checkRateLimit(rateLimiters.comment, identifier);
      
      if (!rateLimitResult.success) {
        return createRateLimitResponse(rateLimitResult);
      }

      const resolvedParams = await params;
      const worldcupId = resolvedParams.id;
      const body = await request.json();
      const validatedData = commentSchema.parse(body);

      // Verify worldcup exists
      const { data: worldcup, error: worldcupError } = await supabase
        .from('worldcups')
        .select('id, is_public, visibility, author_id')
        .eq('id', worldcupId)
        .single();

      if (worldcupError) {
        return NextResponse.json(
          { error: 'WorldCup not found' },
          { status: 404 }
        );
      }

      // Prepare comment data
      const commentData: any = {
        worldcup_id: worldcupId,
        content: validatedData.content.trim(),
        parent_id: validatedData.parentId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add user or guest information
      if (user) {
        commentData.author_id = user.id;
      } else {
        if (!validatedData.guestName) {
          return NextResponse.json(
            { error: 'Guest name is required for anonymous comments' },
            { status: 400 }
          );
        }
        commentData.guest_name = validatedData.guestName.trim();
        commentData.guest_session_id = request.ip || 'anonymous';
      }

      // Insert comment
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .insert(commentData)
        .select(`
          id,
          content,
          guest_name,
          like_count,
          reply_count,
          created_at,
          author_id,
          parent_id,
          users!author_id (
            id,
            username,
            display_name,
            avatar_url,
            role
          )
        `)
        .single();

      if (commentError) {
        console.error('Comment insert error:', commentError);
        return NextResponse.json(
          { error: 'Failed to create comment' },
          { status: 500 }
        );
      }

      // Update worldcup comment count
      // First get current count, then increment
      const { data: currentWorldcup, error: fetchError } = await supabase
        .from('worldcups')
        .select('comments')
        .eq('id', worldcupId)
        .single();

      if (!fetchError && currentWorldcup) {
        const { error: updateError } = await supabase
          .from('worldcups')
          .update({ 
            comments: (currentWorldcup.comments || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', worldcupId);

        if (updateError) {
          console.warn('Failed to update worldcup comment count:', updateError);
        }
      }

      // Get user display name for the new comment
      let authorName = 'Anonymous';
      if (user) {
        // Get user details from auth
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id);
        
        if (!authError && authUser?.user) {
          authorName = 
            authUser.user.user_metadata?.full_name || 
            authUser.user.user_metadata?.name || 
            authUser.user.identities?.[0]?.identity_data?.full_name || 
            authUser.user.identities?.[0]?.identity_data?.name || 
            authUser.user.email?.split('@')[0] || 
            'Unknown User';
        }
      } else if (comment.guest_name) {
        authorName = comment.guest_name;
      }

      // Transform comment to match frontend expectations
      const transformedComment = {
        id: comment.id,
        content: comment.content,
        author: authorName,
        authorId: comment.author_id,
        guestName: comment.guest_name,
        likes: comment.like_count || 0,
        replies: comment.reply_count || 0,
        isCreator: comment.author_id === worldcup.author_id,
        isPinned: false,
        level: 'user',
        createdAt: comment.created_at,
        parentId: comment.parent_id
      };

      return NextResponse.json({
        success: true,
        message: 'Comment created successfully',
        comment: transformedComment
      });

    } catch (error) {
      console.error('API error:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

// PUT - Update an existing comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOptionalAuth(request, async (user) => {
    try {
      const resolvedParams = await params;
      const worldcupId = resolvedParams.id;
      const body = await request.json();
      
      const { commentId, content } = body;
      
      if (!commentId || !content) {
        return NextResponse.json(
          { error: 'Comment ID and content are required' },
          { status: 400 }
        );
      }

      // Get the comment to verify ownership
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('id, author_id, guest_session_id')
        .eq('id', commentId)
        .eq('worldcup_id', worldcupId)
        .single();

      if (fetchError || !comment) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      // Verify ownership
      if (user) {
        if (comment.author_id !== user.id) {
          return NextResponse.json(
            { error: 'Not authorized to edit this comment' },
            { status: 403 }
          );
        }
      } else {
        // For guests, check session ID (simplified check)
        return NextResponse.json(
          { error: 'Guests cannot edit comments after page refresh' },
          { status: 403 }
        );
      }

      // Update the comment
      const { data: updatedComment, error: updateError } = await supabase
        .from('comments')
        .update({ 
          content: content.trim(),
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select(`
          id,
          content,
          guest_name,
          like_count,
          reply_count,
          created_at,
          updated_at,
          author_id,
          parent_id,
          users!author_id (
            id,
            username,
            display_name,
            avatar_url,
            role
          )
        `)
        .single();

      if (updateError) {
        console.error('Comment update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update comment' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Comment updated successfully',
        comment: updatedComment
      });

    } catch (error) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

// DELETE - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOptionalAuth(request, async (user) => {
    try {
      const resolvedParams = await params;
      const worldcupId = resolvedParams.id;
      const url = new URL(request.url);
      const commentId = url.searchParams.get('commentId');
      
      if (!commentId) {
        return NextResponse.json(
          { error: 'Comment ID is required' },
          { status: 400 }
        );
      }

      // Get the comment to verify ownership
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('id, author_id, guest_session_id')
        .eq('id', commentId)
        .eq('worldcup_id', worldcupId)
        .single();

      if (fetchError || !comment) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      // Verify ownership
      if (user) {
        if (comment.author_id !== user.id) {
          return NextResponse.json(
            { error: 'Not authorized to delete this comment' },
            { status: 403 }
          );
        }
      } else {
        // For guests, check session ID (simplified check)
        return NextResponse.json(
          { error: 'Guests cannot delete comments after page refresh' },
          { status: 403 }
        );
      }

      // Soft delete the comment
      const { error: deleteError } = await supabase
        .from('comments')
        .update({ 
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (deleteError) {
        console.error('Comment delete error:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete comment' },
          { status: 500 }
        );
      }

      // Update worldcup comment count
      const { data: currentWorldcup, error: fetchWorldcupError } = await supabase
        .from('worldcups')
        .select('comments')
        .eq('id', worldcupId)
        .single();

      if (!fetchWorldcupError && currentWorldcup) {
        const { error: updateError } = await supabase
          .from('worldcups')
          .update({ 
            comments: Math.max((currentWorldcup.comments || 1) - 1, 0),
            updated_at: new Date().toISOString()
          })
          .eq('id', worldcupId);

        if (updateError) {
          console.warn('Failed to update worldcup comment count:', updateError);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Comment deleted successfully'
      });

    } catch (error) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}