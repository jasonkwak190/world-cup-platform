import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';
import type { WorldCupMediaItem } from '@/types/media';
import type { SupabaseWorldCupItemInsert } from '@/types/supabase';

// Validation schema
const createMixedMediaWorldCupSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.string().min(1),
  authorId: z.string().uuid(),
  mediaItems: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    mediaType: z.enum(['image', 'video']),
    // Image fields
    image: z.string().optional(),
    // Video fields  
    videoUrl: z.string().optional(),
    videoId: z.string().optional(),
    videoStartTime: z.number().optional(),
    videoEndTime: z.number().optional(),
    videoThumbnail: z.string().optional(),
    videoDuration: z.number().optional(),
    videoMetadata: z.any().optional()
  })).min(4, 'At least 4 items required'),
  isPublic: z.boolean().default(true)
});

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
      throw error;
    } else {
      result.successful = data.map(item => item.id);
    }
  } catch (error) {
    console.error('❌ Error in batch video creation:', error);
    // Mark all as failed for simplicity
    videoOnlyItems.forEach(item => {
      result.failed.push({ 
        item, 
        error: 'Batch insert failed' 
      });
    });
  }

  return result;
}

/**
 * Create multiple image items in batch  
 */
async function createMultipleImageItems(
  worldcupId: string,
  imageItems: WorldCupMediaItem[]
): Promise<{ 
  successful: string[], 
  failed: Array<{ item: WorldCupMediaItem, error: string }> 
}> {
  const result = {
    successful: [] as string[],
    failed: [] as Array<{ item: WorldCupMediaItem, error: string }>
  };

  const imageOnlyItems = imageItems.filter(item => item.mediaType === 'image');
  
  if (imageOnlyItems.length === 0) {
    return result;
  }

  // Batch insert preparation
  const insertDataArray: SupabaseWorldCupItemInsert[] = imageOnlyItems.map((item, index) => ({
    worldcup_id: worldcupId,
    title: item.title,
    description: item.description || '',
    order_index: index,
    media_type: 'image',
    image_url: item.image!
  }));

  try {
    const { data, error } = await supabase
      .from('worldcup_items')
      .insert(insertDataArray)
      .select('id');

    if (error) {
      console.error('❌ Batch image insert failed:', error);
      throw error;
    } else {
      result.successful = data.map(item => item.id);
    }
  } catch (error) {
    console.error('❌ Error in batch image creation:', error);
    // Mark all as failed for simplicity
    imageOnlyItems.forEach(item => {
      result.failed.push({ 
        item, 
        error: 'Batch insert failed' 
      });
    });
  }

  return result;
}

// POST - Create mixed media worldcup
export async function POST(request: NextRequest) {
  try {
    // Rate limiting  
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.api, identifier);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const validatedData = createMixedMediaWorldCupSchema.parse(body);

    console.log('🎬 Creating mixed media worldcup:', {
      title: validatedData.title,
      totalItems: validatedData.mediaItems.length,
      imageItems: validatedData.mediaItems.filter(item => item.mediaType === 'image').length,
      videoItems: validatedData.mediaItems.filter(item => item.mediaType === 'video').length
    });

    // 1. Create worldcup basic info
    const { data: worldcupData, error: worldcupError } = await supabase
      .from('worldcups')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        author_id: validatedData.authorId,
        is_public: validatedData.isPublic,
        thumbnail_url: '/placeholder.svg' // Will be updated with first item thumbnail
      })
      .select('id')
      .single();

    if (worldcupError) {
      console.error('❌ Error creating worldcup:', worldcupError);
      return NextResponse.json(
        { error: 'Failed to create worldcup' },
        { status: 500 }
      );
    }

    const worldcupId = worldcupData.id;
    console.log('✅ Worldcup created with ID:', worldcupId);

    // 2. Separate media items by type
    const imageItems = validatedData.mediaItems.filter(item => item.mediaType === 'image');
    const videoItems = validatedData.mediaItems.filter(item => item.mediaType === 'video');

    let totalSuccessful = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    // 3. Process image items
    if (imageItems.length > 0) {
      console.log(`📸 Processing ${imageItems.length} image items...`);
      try {
        const imageResult = await createMultipleImageItems(worldcupId, imageItems);
        totalSuccessful += imageResult.successful.length;
        totalFailed += imageResult.failed.length;
        
        if (imageResult.failed.length > 0) {
          errors.push(`${imageResult.failed.length} image items failed`);
        }
      } catch (error) {
        console.error('❌ Image processing failed:', error);
        errors.push('Image processing failed');
        totalFailed += imageItems.length;
      }
    }

    // 4. Process video items
    if (videoItems.length > 0) {
      console.log(`🎥 Processing ${videoItems.length} video items...`);
      try {
        const videoResult = await createMultipleVideoItems(worldcupId, videoItems);
        totalSuccessful += videoResult.successful.length;
        totalFailed += videoResult.failed.length;

        if (videoResult.failed.length > 0) {
          errors.push(`${videoResult.failed.length} video items failed`);
        }
      } catch (error) {
        console.error('❌ Video processing failed:', error);
        errors.push('Video processing failed');
        totalFailed += videoItems.length;
      }
    }

    // 5. Update thumbnail if we have items
    if (totalSuccessful > 0) {
      try {
        // Get first item for thumbnail
        const { data: firstItem } = await supabase
          .from('worldcup_items')
          .select('image_url, video_thumbnail, media_type')
          .eq('worldcup_id', worldcupId)
          .order('order_index')
          .limit(1)
          .single();

        if (firstItem) {
          const thumbnailUrl = firstItem.media_type === 'video' 
            ? firstItem.video_thumbnail 
            : firstItem.image_url;
          
          if (thumbnailUrl) {
            await supabase
              .from('worldcups')
              .update({ thumbnail_url: thumbnailUrl })
              .eq('id', worldcupId);
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to update thumbnail:', error);
      }
    }

    const result = {
      worldcupId,
      totalItems: validatedData.mediaItems.length,
      successful: totalSuccessful,
      failed: totalFailed,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log(`🎉 Mixed media worldcup creation completed:`, result);

    if (totalSuccessful === 0) {
      return NextResponse.json(
        { error: 'No items were successfully created' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      worldcup: result
    });

  } catch (error) {
    console.error('Mixed media worldcup API error:', error);
    
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