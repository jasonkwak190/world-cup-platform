import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSupabaseUser } from '@/utils/supabaseAuth';
import { addBookmark, removeBookmark, getUserBookmarks } from '@/utils/userInteractions';
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
        { bookmarked: false, requiresAuth: true },
        { status: 200 }
      );
    }

    // Check if user has bookmarked this worldcup
    const userBookmarks = await getUserBookmarks(user.id);
    const bookmarked = userBookmarks.includes(worldcupId);
    
    return NextResponse.json({ 
      bookmarked,
      requiresAuth: false 
    });
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return NextResponse.json(
      { error: 'Failed to check bookmark status' },
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

    // Check current bookmark status
    const userBookmarks = await getUserBookmarks(user.id);
    const currentlyBookmarked = userBookmarks.includes(worldcupId);
    
    let success: boolean;
    let action: string;
    
    if (currentlyBookmarked) {
      // Remove bookmark
      success = await removeBookmark(user.id, worldcupId);
      action = 'removed';
    } else {
      // Add bookmark
      success = await addBookmark(user.id, worldcupId);
      action = 'added';
    }

    if (!success) {
      return NextResponse.json(
        { error: `Failed to ${action} bookmark` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      bookmarked: !currentlyBookmarked,
      action,
      message: `Bookmark ${action} successfully`
    });
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to toggle bookmark' },
      { status: 500 }
    );
  }
}