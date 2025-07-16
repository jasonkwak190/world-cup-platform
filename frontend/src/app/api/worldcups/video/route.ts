import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';
import type { WorldCupMediaItem, VideoMetadata } from '@/types/media';
import type { SupabaseWorldCupItemInsert } from '@/types/supabase';

// Validation schemas
const createVideoItemSchema = z.object({
  worldcupId: z.string().uuid(),
  videoItem: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    mediaType: z.literal('video'),
    videoUrl: z.string().url(),
    videoId: z.string(),
    videoStartTime: z.number().optional(),
    videoEndTime: z.number().optional(), 
    videoThumbnail: z.string().url(),
    videoDuration: z.number().optional(),
    videoMetadata: z.any().optional()
  }),
  orderIndex: z.number()
});

const createMultipleVideoItemsSchema = z.object({
  worldcupId: z.string().uuid(),
  videoItems: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    mediaType: z.literal('video'),
    videoUrl: z.string().url(),
    videoId: z.string(),
    videoStartTime: z.number().optional(),
    videoEndTime: z.number().optional(),
    videoThumbnail: z.string().url(), 
    videoDuration: z.number().optional(),
    videoMetadata: z.any().optional()
  }))
});

const updateVideoMetadataSchema = z.object({
  itemId: z.string().uuid(),
  metadata: z.record(z.any())
});

/**
 * Create a single video worldcup item
 */
async function createVideoWorldCupItem(
  worldcupId: string,
  videoItem: WorldCupMediaItem,
  orderIndex: number
): Promise<string | null> {
  try {
    if (videoItem.mediaType !== 'video') {
      throw new Error('This function is only for video items');
    }

    const insertData: SupabaseWorldCupItemInsert = {
      worldcup_id: worldcupId,
      title: videoItem.title,
      description: videoItem.description || '',
      order_index: orderIndex,
      media_type: 'video',
      video_url: videoItem.videoUrl!,
      video_id: videoItem.videoId!,
      video_start_time: videoItem.videoStartTime || 0,
      video_end_time: videoItem.videoEndTime,
      video_thumbnail: videoItem.videoThumbnail!,
      video_duration: videoItem.videoDuration,
      video_metadata: videoItem.videoMetadata,
      image_url: videoItem.videoThumbnail! // Thumbnail as image_url too
    };

    const { data, error } = await supabase
      .from('worldcup_items')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error creating video item:', error);
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error('❌ Error in createVideoWorldCupItem:', error);
    return null;
  }
}

/**
 * Create multiple video items in batch
 */
async function createMultipleVideoItems(
  worldcupId: string,
  videoItems: WorldCupMediaItem[]
): Promise<{ 
  successful: string[], 
  failed: Array<{ item: WorldCupMediaItem, error: string }> 
}> {
  const result = {
    successful: [] as string[],
    failed: [] as Array<{ item: WorldCupMediaItem, error: string }>
  };

  const videoOnlyItems = videoItems.filter(item => item.mediaType === 'video');
  
  if (videoOnlyItems.length === 0) {
    return result;
  }

  // Batch insert preparation
  const insertDataArray: SupabaseWorldCupItemInsert[] = videoOnlyItems.map((item, index) => ({
    worldcup_id: worldcupId,
    title: item.title,
    description: item.description || '',
    order_index: index,
    media_type: 'video',
    video_url: item.videoUrl!,
    video_id: item.videoId!,
    video_start_time: item.videoStartTime || 0,
    video_end_time: item.videoEndTime,
    video_thumbnail: item.videoThumbnail!,
    video_duration: item.videoDuration,
    video_metadata: item.videoMetadata,
    image_url: item.videoThumbnail!
  }));

  try {
    const { data, error } = await supabase
      .from('worldcup_items')
      .insert(insertDataArray)
      .select('id');

    if (error) {
      console.error('❌ Batch video insert failed:', error);
      // Fallback to individual processing
      for (let i = 0; i < videoOnlyItems.length; i++) {
        const itemId = await createVideoWorldCupItem(worldcupId, videoOnlyItems[i], i);
        if (itemId) {
          result.successful.push(itemId);
        } else {
          result.failed.push({ 
            item: videoOnlyItems[i], 
            error: 'Individual insert failed' 
          });
        }
      }
    } else {
      result.successful = data.map(item => item.id);
    }
  } catch (error) {
    console.error('❌ Error in batch video creation:', error);
    // Full fallback to individual processing
    for (let i = 0; i < videoOnlyItems.length; i++) {
      const itemId = await createVideoWorldCupItem(worldcupId, videoOnlyItems[i], i);
      if (itemId) {
        result.successful.push(itemId);
      } else {
        result.failed.push({ 
          item: videoOnlyItems[i], 
          error: 'Fallback insert failed' 
        });
      }
    }
  }

  return result;
}

// POST - Create video items
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.api, identifier);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'create-single') {
      // Create single video item
      const validatedData = createVideoItemSchema.parse(body);
      
      const itemId = await createVideoWorldCupItem(
        validatedData.worldcupId,
        validatedData.videoItem,
        validatedData.orderIndex
      );

      if (!itemId) {
        return NextResponse.json(
          { error: 'Failed to create video item' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        itemId
      });

    } else if (action === 'create-multiple') {
      // Create multiple video items
      const validatedData = createMultipleVideoItemsSchema.parse(body);
      
      const result = await createMultipleVideoItems(
        validatedData.worldcupId,
        validatedData.videoItems
      );

      return NextResponse.json({
        success: true,
        result
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action parameter' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Video API error:', error);
    
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
}

// PUT - Update video metadata
export async function PUT(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.api, identifier);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const validatedData = updateVideoMetadataSchema.parse(body);

    const { error } = await supabase
      .from('worldcup_items')
      .update({
        video_metadata: validatedData.metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.itemId)
      .eq('media_type', 'video');

    if (error) {
      console.error('❌ Error updating video metadata:', error);
      return NextResponse.json(
        { error: 'Failed to update video metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Video metadata update error:', error);
    
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
}