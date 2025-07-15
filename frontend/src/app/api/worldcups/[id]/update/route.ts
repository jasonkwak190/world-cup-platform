import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';

// Validation schema
const updateWorldCupSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(50).optional(),
  isPublic: z.boolean().optional(),
  thumbnailUrl: z.string().url().optional(),
  items: z.array(z.object({
    id: z.string().optional(), // For existing items
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    imageUrl: z.string().url().optional(),
    mediaType: z.enum(['image', 'video']).default('image'),
    videoUrl: z.string().url().optional(),
    videoId: z.string().optional(),
    videoStartTime: z.number().optional(),
    videoEndTime: z.number().optional(),
    videoThumbnail: z.string().url().optional(),
    videoDuration: z.number().optional(),
    videoMetadata: z.any().optional(),
    orderIndex: z.number().optional()
  })).min(2).max(100).optional()
});

export async function PUT(
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

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const worldcupId = params.id;

    // Check if user owns this worldcup
    const { data: existingWorldcup, error: ownershipError } = await supabase
      .from('worldcups')
      .select('id, author_id, title')
      .eq('id', worldcupId)
      .eq('author_id', user.id)
      .single();

    if (ownershipError || !existingWorldcup) {
      return NextResponse.json(
        { error: 'WorldCup not found or access denied' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateWorldCupSchema.parse(body);

    // Update worldcup basic info
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.category) updateData.category = validatedData.category;
    if (validatedData.isPublic !== undefined) updateData.is_public = validatedData.isPublic;
    if (validatedData.thumbnailUrl !== undefined) updateData.thumbnail_url = validatedData.thumbnailUrl;

    const { error: updateError } = await supabase
      .from('worldcups')
      .update(updateData)
      .eq('id', worldcupId);

    if (updateError) {
      console.error('WorldCup update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update worldcup', details: updateError.message },
        { status: 500 }
      );
    }

    // Update items if provided
    if (validatedData.items) {
      // Smart update: check if only metadata changed for performance
      const { data: existingItems, error: itemsFetchError } = await supabase
        .from('worldcup_items')
        .select('*')
        .eq('worldcup_id', worldcupId)
        .order('order_index');

      if (itemsFetchError) {
        console.error('Failed to fetch existing items:', itemsFetchError);
        return NextResponse.json(
          { error: 'Failed to fetch existing items' },
          { status: 500 }
        );
      }

      // Check if it's a metadata-only update (same number of items, same titles)
      const isMetadataOnlyUpdate = existingItems.length === validatedData.items.length &&
        existingItems.every((existing, index) => {
          const newItem = validatedData.items![index];
          return existing.title === newItem.title && 
                 existing.media_type === newItem.mediaType &&
                 existing.image_url === (newItem.imageUrl || '');
        });

      if (isMetadataOnlyUpdate) {
        // Optimized update: only update video metadata
        const videoUpdates = validatedData.items
          .filter(item => item.mediaType === 'video')
          .map((item, index) => ({
            id: existingItems[index].id,
            video_url: item.videoUrl || null,
            video_start_time: item.videoStartTime || null,
            video_end_time: item.videoEndTime || null,
            video_metadata: item.videoMetadata || null
          }));

        if (videoUpdates.length > 0) {
          const updatePromises = videoUpdates.map(update => 
            supabase
              .from('worldcup_items')
              .update({
                video_url: update.video_url,
                video_start_time: update.video_start_time,
                video_end_time: update.video_end_time,
                video_metadata: update.video_metadata
              })
              .eq('id', update.id)
          );

          const results = await Promise.allSettled(updatePromises);
          const failed = results.filter(r => r.status === 'rejected').length;
          
          if (failed > 0) {
            console.warn(`${failed} video metadata updates failed`);
          }
        }
      } else {
        // Full recreation: delete and recreate items
        const { error: deleteError } = await supabase
          .from('worldcup_items')
          .delete()
          .eq('worldcup_id', worldcupId);

        if (deleteError) {
          console.error('Failed to delete existing items:', deleteError);
          return NextResponse.json(
            { error: 'Failed to delete existing items' },
            { status: 500 }
          );
        }

        // Create new items
        const itemsToInsert = validatedData.items.map((item, index) => ({
          worldcup_id: worldcupId,
          title: item.title,
          description: item.description || '',
          order_index: item.orderIndex ?? index,
          media_type: item.mediaType,
          image_url: item.imageUrl || '',
          video_url: item.videoUrl || null,
          video_id: item.videoId || null,
          video_start_time: item.videoStartTime || null,
          video_end_time: item.videoEndTime || null,
          video_thumbnail: item.videoThumbnail || null,
          video_duration: item.videoDuration || null,
          video_metadata: item.videoMetadata || null
        }));

        const { error: insertError } = await supabase
          .from('worldcup_items')
          .insert(itemsToInsert);

        if (insertError) {
          console.error('Failed to create new items:', insertError);
          return NextResponse.json(
            { error: 'Failed to create new items' },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'WorldCup updated successfully'
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
}