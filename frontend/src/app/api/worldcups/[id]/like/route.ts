import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSupabaseUser } from '@/utils/supabaseAuth';
import { addLike, removeLike, getUserLikes } from '@/utils/userInteractions';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';
import { z } from 'zod';

// Validation schema for worldcup ID
const worldcupIdSchema = z.string().uuid();

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

    const { id: worldcupId } = await params;
    
    // Validate worldcup ID
    const validationResult = worldcupIdSchema.safeParse(worldcupId);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid World Cup ID format' },
        { status: 400 }
      );
    }

    // Get current user
    const user = await getCurrentSupabaseUser();
    
    if (!user) {
      return NextResponse.json(
        { liked: false, requiresAuth: true },
        { status: 200 }
      );
    }

    // Check if user has liked this worldcup
    const userLikes = await getUserLikes(user.id);
    const liked = userLikes.includes(worldcupId);
    
    return NextResponse.json({ 
      liked,
      requiresAuth: false 
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Failed to check like status' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting - Use interaction limiter for POST operations
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.interaction, identifier);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const { id: worldcupId } = await params;
    
    // Validate worldcup ID
    const validationResult = worldcupIdSchema.safeParse(worldcupId);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid World Cup ID format' },
        { status: 400 }
      );
    }

    // Get current user
    const user = await getCurrentSupabaseUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check current like status
    const userLikes = await getUserLikes(user.id);
    const currentlyLiked = userLikes.includes(worldcupId);
    
    let success: boolean;
    let action: string;
    
    if (currentlyLiked) {
      // Remove like
      success = await removeLike(user.id, worldcupId);
      action = 'removed';
    } else {
      // Add like
      success = await addLike(user.id, worldcupId);
      action = 'added';
    }

    if (!success) {
      return NextResponse.json(
        { error: `Failed to ${action} like` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      liked: !currentlyLiked,
      action,
      message: `Like ${action} successfully`
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}