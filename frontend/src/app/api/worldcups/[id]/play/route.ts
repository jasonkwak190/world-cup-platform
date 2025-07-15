import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.api, identifier);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const worldcupId = params.id;

    // Get worldcup with items
    const { data: worldcup, error: worldcupError } = await supabase
      .from('worldcups')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        created_at,
        participants,
        comments,
        likes,
        category,
        is_public,
        author:users(id, username, profile_image_url)
      `)
      .eq('id', worldcupId)
      .single();

    if (worldcupError) {
      console.error('WorldCup fetch error:', worldcupError);
      return NextResponse.json(
        { error: 'WorldCup not found' },
        { status: 404 }
      );
    }

    // Get worldcup items
    const { data: items, error: itemsError } = await supabase
      .from('worldcup_items')
      .select(`
        id,
        title,
        image_url,
        description,
        order_index,
        media_type,
        video_url,
        video_id,
        video_start_time,
        video_end_time,
        video_thumbnail,
        video_duration,
        video_metadata
      `)
      .eq('worldcup_id', worldcupId)
      .order('order_index');

    if (itemsError) {
      console.error('Items fetch error:', itemsError);
      return NextResponse.json(
        { error: 'Failed to fetch worldcup items' },
        { status: 500 }
      );
    }

    // Transform items to match expected format
    const transformedItems = items.map(item => {
      const baseItem = {
        id: item.id,
        title: item.title,
        description: item.description || '',
        mediaType: item.media_type || 'image'
      };

      if (item.media_type === 'video') {
        return {
          ...baseItem,
          mediaType: 'video' as const,
          videoUrl: item.video_url,
          videoId: item.video_id,
          videoStartTime: item.video_start_time || 0,
          videoEndTime: item.video_end_time,
          videoThumbnail: item.video_thumbnail,
          videoDuration: item.video_duration,
          videoMetadata: item.video_metadata,
          image: item.video_thumbnail // Use thumbnail as image
        };
      } else {
        return {
          ...baseItem,
          mediaType: 'image' as const,
          image: item.image_url
        };
      }
    });

    // Transform worldcup data
    const transformedWorldcup = {
      id: worldcup.id,
      title: worldcup.title,
      description: worldcup.description || '',
      thumbnail: worldcup.thumbnail_url || '/placeholder.svg',
      author: worldcup.author?.username || 'Unknown',
      createdAt: new Date(worldcup.created_at).toISOString().split('T')[0],
      participants: worldcup.participants || 0,
      comments: worldcup.comments || 0,
      likes: worldcup.likes || 0,
      category: worldcup.category || 'entertainment',
      isPublic: worldcup.is_public,
      items: transformedItems
    };

    return NextResponse.json({
      worldcup: transformedWorldcup
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update worldcup statistics after playing
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.stats, identifier);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const worldcupId = params.id;
    const body = await request.json();

    // Validate request body
    const { action, value } = body;
    
    if (!action || !['increment_participants', 'increment_likes', 'increment_comments'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Update statistics
    const updateData: any = {};
    
    switch (action) {
      case 'increment_participants':
        // Increment participants count
        const { data: currentStats, error: fetchError } = await supabase
          .from('worldcups')
          .select('participants')
          .eq('id', worldcupId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        updateData.participants = (currentStats.participants || 0) + 1;
        break;
        
      case 'increment_likes':
        const { data: currentLikes, error: likesError } = await supabase
          .from('worldcups')
          .select('likes')
          .eq('id', worldcupId)
          .single();

        if (likesError) {
          throw likesError;
        }

        updateData.likes = (currentLikes.likes || 0) + (value || 1);
        break;
        
      case 'increment_comments':
        const { data: currentComments, error: commentsError } = await supabase
          .from('worldcups')
          .select('comments')
          .eq('id', worldcupId)
          .single();

        if (commentsError) {
          throw commentsError;
        }

        updateData.comments = (currentComments.comments || 0) + (value || 1);
        break;
    }

    const { error: updateError } = await supabase
      .from('worldcups')
      .update(updateData)
      .eq('id', worldcupId);

    if (updateError) {
      console.error('Stats update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Statistics updated successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}