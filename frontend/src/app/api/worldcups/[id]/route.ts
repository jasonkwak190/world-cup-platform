import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';

// Validation schema for worldcup ID
const worldcupIdSchema = z.string().uuid();

// Helper function to generate Supabase image URL
function getSupabaseImageUrl(path: string, bucket: string): string {
  if (!path) return '';
  
  // Already full URL
  if (path.startsWith('http')) {
    return path;
  }
  
  // Generate public URL from storage
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return publicUrl;
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

    const { id } = await params;
    
    // Validate UUID format
    const validationResult = worldcupIdSchema.safeParse(id);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid worldcup ID format' },
        { status: 400 }
      );
    }
    
    console.log('🔍 Fetching worldcup detail via API route for ID:', id);
    const startTime = Date.now();
    
    // 1. Fetch worldcup basic info with author
    const { data: worldcupData, error: worldcupError } = await supabase
      .from('worldcups')
      .select(`
        *,
        author:users(id, username, profile_image_url)
      `)
      .eq('id', id)
      .single();
    
    if (worldcupError) {
      console.error('❌ Error fetching worldcup:', worldcupError);
      return NextResponse.json(
        { error: 'Worldcup not found' },
        { status: 404 }
      );
    }
    
    // 2. Fetch worldcup items separately for better performance
    const { data: itemsData, error: itemsError } = await supabase
      .from('worldcup_items')
      .select(`
        id, title, image_url, description, order_index,
        media_type, video_url, video_id, video_start_time, 
        video_end_time, video_thumbnail, video_duration, video_metadata
      `)
      .eq('worldcup_id', id)
      .order('order_index');
    
    if (itemsError) {
      console.error('❌ Error fetching worldcup items:', itemsError);
      return NextResponse.json(
        { error: 'Failed to fetch worldcup items' },
        { status: 500 }
      );
    }

    const elapsed = Date.now() - startTime;
    console.log(`⏱️ Detail API query took ${elapsed}ms`);

    // 3. Process thumbnail URL
    let thumbnailUrl = '/placeholder.svg';
    
    if (worldcupData.thumbnail_url) {
      if (worldcupData.thumbnail_url.startsWith('http')) {
        thumbnailUrl = worldcupData.thumbnail_url;
      } else {
        thumbnailUrl = getSupabaseImageUrl(worldcupData.thumbnail_url, 'worldcup-thumbnails');
      }
    }

    // 4. Process items with media type handling
    const processedItems = itemsData?.map((item: any) => {
      const baseItem = {
        id: item.id,
        title: item.title,
        description: item.description || '',
        mediaType: item.media_type || 'image'
      };

      if (item.media_type === 'video') {
        // Video item processing
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
          // For video items, image field is the thumbnail
          image: item.video_thumbnail
        };
      } else {
        // Image item processing
        let imageUrl = item.image_url ? 
          getSupabaseImageUrl(item.image_url, 'worldcup-images') : 
          null;

        // Fix corrupted localhost URLs that might be in the database
        if (imageUrl && typeof imageUrl === 'string' && imageUrl.includes('localhost:3000')) {
          console.error('❌ Found corrupted localhost URL in database:', imageUrl);
          
          // Try to extract the actual path and reconstruct proper Supabase URL
          const pathMatch = imageUrl.match(/([0-9a-f-]+\/items\/[^\/]+\.(gif|jpg|jpeg|png|webp))$/i);
          if (pathMatch) {
            const path = pathMatch[1];
            imageUrl = `https://rctoxfcyzz5iikopbsne.supabase.co/storage/v1/object/public/worldcup-images/${path}`;
            console.log('✅ Fixed corrupted URL to:', imageUrl);
          } else {
            console.warn('⚠️ Could not fix corrupted localhost URL, setting to null');
            imageUrl = null;
          }
        }

        return {
          ...baseItem,
          mediaType: 'image' as const,
          image: imageUrl
        };
      }
    }) || [];

    // 5. Format response to match expected client format
    const result = {
      id: worldcupData.id,
      title: worldcupData.title,
      description: worldcupData.description || '',
      thumbnail: thumbnailUrl,
      author: worldcupData.author?.username || 'Unknown',
      createdAt: new Date(worldcupData.created_at).toISOString().split('T')[0],
      participants: worldcupData.participants || 0,
      comments: worldcupData.comments || 0,
      likes: worldcupData.likes || 0,
      category: worldcupData.category || 'entertainment',
      isPublic: worldcupData.is_public,
      items: processedItems
    };

    console.log('✅ Successfully processed worldcup detail:', {
      id: result.id,
      title: result.title,
      itemsCount: result.items.length,
      performanceMs: elapsed
    });
    
    return NextResponse.json({
      worldcup: result
    }, {
      headers: {
        'Cache-Control': 'public, max-age=180, stale-while-revalidate=300',
        'X-Performance-Timing': `${elapsed}ms`,
        'X-Items-Count': result.items.length.toString()
      }
    });
    
  } catch (error) {
    console.error('API error in worldcup detail:', error);
    
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