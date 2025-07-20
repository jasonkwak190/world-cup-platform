import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentSupabaseUser } from '@/utils/supabaseAuth';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.interaction, identifier);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const { id: commentId } = await params;
    
    // Get current user
    const user = await getCurrentSupabaseUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if comment exists
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, like_count')
      .eq('id', commentId)
      .eq('is_deleted', false)
      .single();

    if (commentError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user already liked this comment
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();

    let liked = false;
    let newLikeCount = comment.like_count || 0;

    if (existingLike) {
      // Remove like
      const { error: deleteLikeError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);

      if (deleteLikeError) {
        console.error('Failed to remove like:', deleteLikeError);
        return NextResponse.json(
          { error: 'Failed to remove like' },
          { status: 500 }
        );
      }

      newLikeCount = Math.max(newLikeCount - 1, 0);
      liked = false;
    } else {
      // Add like
      const { error: addLikeError } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          created_at: new Date().toISOString()
        });

      if (addLikeError) {
        console.error('Failed to add like:', addLikeError);
        return NextResponse.json(
          { error: 'Failed to add like' },
          { status: 500 }
        );
      }

      newLikeCount = newLikeCount + 1;
      liked = true;
    }

    // Update comment like count
    const { error: updateError } = await supabase
      .from('comments')
      .update({ 
        like_count: newLikeCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId);

    if (updateError) {
      console.error('Failed to update comment like count:', updateError);
      return NextResponse.json(
        { error: 'Failed to update like count' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      liked,
      likeCount: newLikeCount,
      message: liked ? 'Like added successfully' : 'Like removed successfully'
    });

  } catch (error) {
    console.error('Comment like API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { id: commentId } = await params;
    
    // Get current user
    const user = await getCurrentSupabaseUser();
    
    if (!user) {
      return NextResponse.json(
        { liked: false, requiresAuth: true },
        { status: 200 }
      );
    }

    // Check if user liked this comment
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      liked: !!existingLike,
      requiresAuth: false
    });

  } catch (error) {
    console.error('Comment like status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}