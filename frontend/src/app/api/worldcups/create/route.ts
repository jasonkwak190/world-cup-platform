import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';

// Validation schema
const createWorldCupSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(50),
  isPublic: z.boolean().default(true),
  thumbnailUrl: z.string().url().optional(),
  items: z.array(z.object({
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
  })).min(2).max(100)
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.create, identifier);
    
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createWorldCupSchema.parse(body);

    // Start transaction-like operation
    const { data: worldcup, error: worldcupError } = await supabase
      .from('worldcups')
      .insert({
        title: validatedData.title,
        description: validatedData.description || '',
        category: validatedData.category,
        author_id: user.id,
        is_public: validatedData.isPublic,
        thumbnail_url: validatedData.thumbnailUrl || null,
        participants: 0,
        likes: 0,
        comments: 0
      })
      .select('id, title, created_at')
      .single();

    if (worldcupError) {
      console.error('WorldCup creation error:', worldcupError);
      return NextResponse.json(
        { error: 'Failed to create worldcup', details: worldcupError.message },
        { status: 500 }
      );
    }

    // Create worldcup items
    const itemsToInsert = validatedData.items.map((item, index) => ({
      worldcup_id: worldcup.id,
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

    const { data: items, error: itemsError } = await supabase
      .from('worldcup_items')
      .insert(itemsToInsert)
      .select('id, title, order_index');

    if (itemsError) {
      console.error('WorldCup items creation error:', itemsError);
      
      // Rollback: Delete the worldcup if items creation failed
      await supabase
        .from('worldcups')
        .delete()
        .eq('id', worldcup.id);
      
      return NextResponse.json(
        { error: 'Failed to create worldcup items', details: itemsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      worldcup: {
        id: worldcup.id,
        title: worldcup.title,
        createdAt: worldcup.created_at,
        itemsCount: items.length
      }
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