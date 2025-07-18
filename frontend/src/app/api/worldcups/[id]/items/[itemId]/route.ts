import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    // Rate limiting
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.api, identifier);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const resolvedParams = await params;
    const worldcupId = resolvedParams.id;
    const itemId = resolvedParams.itemId;

    // Verify worldcup exists and is accessible
    const { data: worldcup, error: worldcupError } = await supabase
      .from('worldcups')
      .select('id, is_public, visibility')
      .eq('id', worldcupId)
      .single();

    if (worldcupError) {
      return NextResponse.json(
        { error: 'WorldCup not found' },
        { status: 404 }
      );
    }

    // Get the specific item
    const { data: item, error: itemError } = await supabase
      .from('worldcup_items')
      .select(`
        id,
        title,
        image_url,
        description,
        order_index,
        win_count,
        loss_count,
        win_rate,
        total_appearances,
        championship_wins,
        video_url,
        video_start_time,
        video_end_time,
        media_type,
        video_duration,
        video_id,
        video_thumbnail,
        source_url,
        attribution,
        created_at,
        updated_at
      `)
      .eq('worldcup_id', worldcupId)
      .eq('id', itemId)
      .single();

    if (itemError) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}