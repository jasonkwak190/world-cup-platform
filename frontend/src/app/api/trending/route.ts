import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TrendingWorldCup, TrendingResponse } from '@/types/trending';

export async function GET() {
  try {
    // Get trending worldcups based on participants count
    const { data: worldcups, error } = await supabase
      .from('worldcups')
      .select(`
        id,
        title,
        participants,
        created_at
      `)
      .eq('is_public', true)
      .order('participants', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching trending worldcups:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trending worldcups' },
        { status: 500 }
      );
    }

    // Calculate trending scores and add status indicators
    const trendingData: TrendingWorldCup[] = worldcups.map((wc, index) => {
      const rank = index + 1;
      const isNew = new Date(wc.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
      const isHot = wc.participants > 1000;
      const isRising = wc.participants > 500 && wc.participants <= 1000;
      
      return {
        id: wc.id,
        title: wc.title,
        play_count: wc.participants,
        view_count: wc.participants,
        created_at: wc.created_at,
        rank,
        trending_score: wc.participants,
        isHot,
        isRising,
        isNew
      };
    });

    const response: TrendingResponse = {
      data: trendingData,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60', // 5 minutes cache
      },
    });
  } catch (error) {
    console.error('Unexpected error in trending API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}