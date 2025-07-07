// PIKU 스타일 전체 랭킹 시스템 (기존 worldcup_items 테이블 활용)
// View를 통한 실시간 랭킹 조회

import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 전체 랭킹 조회 (기존 테이블 기반 View 사용)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const category = searchParams.get('category') || '';

    console.log('📊 Fetching PIKU-style global rankings...');

    // global_item_rankings View에서 랭킹 조회
    let query = supabase
      .from('global_item_rankings')
      .select(`
        rank,
        title,
        image_url,
        total_wins,
        total_losses,
        total_appearances,
        total_championships,
        total_participants,
        worldcup_count,
        categories,
        win_rate,
        popularity_score,
        last_updated
      `)
      .order('rank', { ascending: true })
      .limit(limit);

    // 카테고리 필터링
    if (category) {
      query = query.contains('categories', [category]);
    }

    const { data: rankings, error } = await query;

    if (error) {
      console.error('❌ Error fetching global rankings:', error);
      throw error;
    }

    console.log(`✅ Found ${rankings?.length || 0} global rankings`);

    return NextResponse.json({
      rankings: rankings || [],
      totalItems: rankings?.length || 0,
      isRealtime: true, // View는 항상 최신 데이터
      lastUpdated: new Date().toISOString(),
      message: `PIKU-style rankings (${rankings?.length || 0} items)`,
      note: "Rankings update automatically based on game results"
    });

  } catch (error) {
    console.error('❌ Error in global rankings API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global rankings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 랭킹 수동 업데이트 (관리자용)
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Manual ranking update requested...');
    
    const result = await generateGlobalRankings();
    
    return NextResponse.json({
      success: true,
      message: 'Global rankings updated successfully',
      updatedItems: result.updatedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating global rankings:', error);
    return NextResponse.json(
      { error: 'Failed to update global rankings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PIKU 스타일 전체 랭킹 계산
async function generateGlobalRankings() {
  console.log('📊 Generating PIKU-style global rankings...');

  // 1. 모든 아이템의 통계 수집
  const { data: allItems, error: itemsError } = await supabase
    .from('worldcup_items')
    .select(`
      id,
      title,
      image_url,
      win_count,
      loss_count,
      total_appearances,
      championship_wins,
      worldcup_id,
      worldcups!inner(
        title,
        category,
        participants,
        is_public
      )
    `)
    .eq('worldcups.is_public', true);

  if (itemsError || !allItems) {
    throw new Error(`Failed to fetch items: ${itemsError?.message}`);
  }

  console.log(`📊 Processing ${allItems.length} items from public worldcups...`);

  // 2. 아이템별 통계 집계 (제목 기준으로 합산)
  const itemStats = new Map<string, {
    title: string;
    image_url: string;
    totalParticipants: number;
    totalMatches: number;
    totalWins: number;
    totalLosses: number;
    totalChampionships: number;
    worldcupCategories: Set<string>;
    worldcupCount: number;
  }>();

  allItems.forEach(item => {
    const key = item.title.toLowerCase().trim();
    
    if (!itemStats.has(key)) {
      itemStats.set(key, {
        title: item.title,
        image_url: item.image_url || '',
        totalParticipants: 0,
        totalMatches: 0,
        totalWins: 0,
        totalLosses: 0,
        totalChampionships: 0,
        worldcupCategories: new Set(),
        worldcupCount: 0
      });
    }

    const stats = itemStats.get(key)!;
    const worldcup = Array.isArray(item.worldcups) ? item.worldcups[0] : item.worldcups;
    
    stats.totalMatches += item.total_appearances || 0;
    stats.totalWins += item.win_count || 0;
    stats.totalLosses += item.loss_count || 0;
    stats.totalChampionships += item.championship_wins || 0;
    stats.totalParticipants += worldcup?.participants || 0;
    stats.worldcupCategories.add(worldcup?.category || 'misc');
    stats.worldcupCount += 1;
  });

  // 3. PIKU 스타일 인기도 점수 계산
  const rankingData = Array.from(itemStats.entries()).map(([_, stats]) => {
    const winRate = stats.totalMatches > 0 ? (stats.totalWins / stats.totalMatches) * 100 : 0;
    
    // PIKU 스타일 인기도 점수 계산
    // - 참여자 수가 많을수록 높은 점수
    // - 승률이 높을수록 높은 점수  
    // - 여러 월드컵에 등장할수록 높은 점수
    // - 우승 경험이 많을수록 높은 점수
    const popularityScore = 
      (stats.totalParticipants * 0.3) +           // 참여자 수 가중치
      (winRate * stats.totalMatches * 0.4) +     // 승률 × 경기수 가중치
      (stats.worldcupCount * 50) +               // 월드컵 출현 횟수 가중치
      (stats.totalChampionships * 100);          // 우승 횟수 가중치

    return {
      item_title: stats.title,
      item_image_url: stats.image_url,
      total_participants: stats.totalParticipants,
      total_matches: stats.totalMatches,
      win_rate: Math.round(winRate * 100) / 100,
      popularity_score: Math.round(popularityScore * 100) / 100,
      total_championships: stats.totalChampionships,
      worldcup_count: stats.worldcupCount,
      worldcup_categories: Array.from(stats.worldcupCategories),
      last_updated: new Date().toISOString()
    };
  });

  // 4. 인기도 점수 기준으로 정렬
  rankingData.sort((a, b) => b.popularity_score - a.popularity_score);

  // 5. 순위 할당
  const rankedData = rankingData.map((item, index) => ({
    ...item,
    rank: index + 1
  }));

  console.log(`📊 Generated rankings for ${rankedData.length} unique items`);
  console.log(`🏆 Top 3: ${rankedData.slice(0, 3).map(item => `${item.rank}. ${item.item_title} (${item.popularity_score})`).join(', ')}`);

  // 6. global_item_rankings 테이블 업데이트
  try {
    // 기존 데이터 삭제
    await supabase.from('global_item_rankings').delete().neq('rank', 0);

    // 새 데이터 삽입 (배치 처리)
    const batchSize = 100;
    let updatedCount = 0;

    for (let i = 0; i < rankedData.length; i += batchSize) {
      const batch = rankedData.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('global_item_rankings')
        .insert(batch);

      if (insertError) {
        console.error(`❌ Batch insert error (${i}-${i + batch.length}):`, insertError);
      } else {
        updatedCount += batch.length;
        console.log(`✅ Inserted batch ${Math.ceil((i + 1) / batchSize)} (${batch.length} items)`);
      }
    }

    console.log(`✅ Global rankings updated: ${updatedCount} items`);
    return { success: true, updatedCount };

  } catch (error) {
    console.error('❌ Error updating global rankings table:', error);
    throw error;
  }
}