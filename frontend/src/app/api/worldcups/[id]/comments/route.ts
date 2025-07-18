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
        parent_id,
        users!author_id (
          id,
          username,
          display_name,
          avatar_url,
          role
        )
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

    // Transform comments to match frontend expectations
    const transformedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      author: comment.users?.display_name || comment.users?.username || comment.guest_name || 'Anonymous',
      authorId: comment.author_id,
      guestName: comment.guest_name,
      likes: comment.like_count || 0,
      replies: comment.reply_count || 0,
      isCreator: false, // Would need to check if author is worldcup creator
      isPinned: comment.is_pinned,
      level: comment.users?.role || 'user',
      createdAt: comment.created_at,
      parentId: comment.parent_id
    }));

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

      // Transform comment to match frontend expectations
      const transformedComment = {
        id: comment.id,
        content: comment.content,
        author: comment.users?.display_name || comment.users?.username || comment.guest_name || 'Anonymous',
        authorId: comment.author_id,
        guestName: comment.guest_name,
        likes: comment.like_count || 0,
        replies: comment.reply_count || 0,
        isCreator: comment.author_id === worldcup.author_id,
        isPinned: false,
        level: comment.users?.role || 'user',
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