import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';

// Validation schema for query parameters
const listQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(12),
  offset: z.coerce.number().min(0).default(0),
  category: z.string().optional(),
  sortBy: z.enum(['created_at', 'participants', 'likes', 'comments']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  authorId: z.string().uuid().optional(),
  isPublic: z.coerce.boolean().default(true)
});

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

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.api, identifier);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = listQuerySchema.parse(queryParams);

    console.log('🔍 Fetching worldcups via API route...', validatedParams);

    // Build optimized query with author join
    let query = supabase
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
        author_id,
        author:users(id, username)
      `)
      .eq('is_public', validatedParams.isPublic)
      .order(validatedParams.sortBy, { ascending: validatedParams.sortOrder === 'asc' })
      .range(validatedParams.offset, validatedParams.offset + validatedParams.limit - 1);

    // Apply filters
    if (validatedParams.category) {
      query = query.eq('category', validatedParams.category);
    }

    if (validatedParams.search) {
      query = query.ilike('title', `%${validatedParams.search}%`);
    }

    if (validatedParams.authorId) {
      query = query.eq('author_id', validatedParams.authorId);
    }

    const startTime = Date.now();
    const { data: worldcups, error } = await query;
    const elapsed = Date.now() - startTime;

    console.log(`⏱️ API query took ${elapsed}ms`);

    if (error) {
      console.error('WorldCups fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch worldcups' },
        { status: 500 }
      );
    }

    if (!worldcups || worldcups.length === 0) {
      console.log('📭 No worldcups found');
      return NextResponse.json({
        worldcups: [],
        pagination: {
          limit: validatedParams.limit,
          offset: validatedParams.offset,
          total: 0,
          hasMore: false
        }
      });
    }

    console.log(`✅ Found ${worldcups.length} worldcups`);

    // Transform data to match expected format
    const transformedWorldcups = worldcups.map(worldcup => {
      // Process thumbnail URL - already full URL check
      let thumbnailUrl = '/placeholder.svg';
      
      if (worldcup.thumbnail_url) {
        if (worldcup.thumbnail_url.startsWith('http')) {
          thumbnailUrl = worldcup.thumbnail_url;
        } else {
          thumbnailUrl = getSupabaseImageUrl(worldcup.thumbnail_url, 'worldcup-thumbnails');
        }
      }

      return {
        id: worldcup.id,
        title: worldcup.title,
        description: worldcup.description || '',
        thumbnail: thumbnailUrl,
        author: worldcup.author?.username || 'Unknown',
        createdAt: new Date(worldcup.created_at).toISOString().split('T')[0],
        participants: worldcup.participants || 0,
        comments: worldcup.comments || 0,
        likes: worldcup.likes || 0,
        category: worldcup.category || 'entertainment',
        isPublic: worldcup.is_public,
        items: [] // Items loaded separately for performance
      };
    });

    // Get total count for pagination (optimized separate query)
    const { count, error: countError } = await supabase
      .from('worldcups')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', validatedParams.isPublic);

    if (countError) {
      console.error('Count fetch error:', countError);
    }

    return NextResponse.json({
      worldcups: transformedWorldcups,
      pagination: {
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        total: count || 0,
        hasMore: (validatedParams.offset + validatedParams.limit) < (count || 0)
      }
    }, {
      headers: {
        // Server-side caching with CDN support
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
        'X-Performance-Timing': `${elapsed}ms`
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