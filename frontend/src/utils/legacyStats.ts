// 레거시 스타일 통계 유틸리티 함수
import { supabase } from '@/lib/supabase';
import { LegacyItemStats, WorldcupStatsSummary, LegacyRankingData } from '@/types/legacyStats';

/**
 * 특정 월드컵의 레거시 스타일 랭킹 조회
 * 사용자들이 얼마나 많이 선택했는지 기준으로 순위 매김
 */
export async function getLegacyRanking(worldcupId: string): Promise<LegacyRankingData> {
  try {
    console.log('📊 Fetching legacy-style ranking for worldcup:', worldcupId);

    // 1. 레거시 스타일 랭킹 데이터 조회
    const { data: rankingData, error: rankingError } = await supabase
      .rpc('get_piku_ranking', { target_worldcup_id: worldcupId });

    if (rankingError) {
      console.error('❌ Error fetching legacy ranking:', rankingError);
      throw rankingError;
    }

    // 2. 월드컵 통계 요약 조회
    const { data: summaryData, error: summaryError } = await supabase
      .rpc('get_worldcup_stats_summary', { target_worldcup_id: worldcupId });

    if (summaryError) {
      console.error('❌ Error fetching worldcup summary:', summaryError);
      throw summaryError;
    }

    const stats: LegacyItemStats[] = rankingData || [];
    const summary: WorldcupStatsSummary = summaryData?.[0] || {
      total_players: 0,
      total_matches: 0,
      total_items: 0,
      avg_selection_rate: 0,
      most_popular_item: '',
      most_popular_rate: 0
    };

    console.log('✅ Legacy ranking loaded:', {
      items: stats.length,
      totalPlayers: summary.total_players,
      totalMatches: summary.total_matches
    });

    return {
      stats,
      summary,
      last_updated: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in getLegacyRanking:', error);
    throw error;
  }
}

/**
 * 특정 월드컵의 선택 빈도 통계 업데이트
 * 새로운 게임 결과가 추가된 후 호출
 */
export async function updateSelectionStatistics(worldcupId: string): Promise<void> {
  try {
    console.log('🔄 Updating selection statistics for worldcup:', worldcupId);

    const { error } = await supabase
      .rpc('update_selection_statistics', { target_worldcup_id: worldcupId });

    if (error) {
      console.error('❌ Error updating selection statistics:', error);
      throw error;
    }

    console.log('✅ Selection statistics updated successfully');

  } catch (error) {
    console.error('❌ Error in updateSelectionStatistics:', error);
    throw error;
  }
}

/**
 * 모든 월드컵의 선택 빈도 통계 업데이트 (관리자용)
 */
export async function updateAllSelectionStatistics(): Promise<void> {
  try {
    console.log('🔄 Updating all selection statistics...');

    const { error } = await supabase
      .rpc('update_all_selection_statistics');

    if (error) {
      console.error('❌ Error updating all selection statistics:', error);
      throw error;
    }

    console.log('✅ All selection statistics updated successfully');

  } catch (error) {
    console.error('❌ Error in updateAllSelectionStatistics:', error);
    throw error;
  }
}

/**
 * 선택률을 레거시 스타일로 포맷팅
 */
export function formatSelectionRate(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

/**
 * 인기도에 따른 색상 클래스 반환
 */
export function getPopularityColor(rank: number, totalItems: number): string {
  const percentage = rank / totalItems;
  
  if (percentage <= 0.1) return 'bg-red-500';      // 상위 10% - 빨간색
  if (percentage <= 0.25) return 'bg-orange-500';  // 상위 25% - 주황색
  if (percentage <= 0.5) return 'bg-yellow-500';   // 상위 50% - 노란색
  if (percentage <= 0.75) return 'bg-green-500';   // 상위 75% - 초록색
  return 'bg-blue-500';                             // 나머지 - 파란색
}

/**
 * 선택률 막대 그래프 너비 계산
 */
export function getSelectionBarWidth(rate: number, maxRate: number): number {
  if (maxRate === 0) return 0;
  return Math.max(1, (rate / maxRate) * 100); // 최소 1% 너비 보장
}

/**
 * 레거시 스타일 통계를 기존 ItemStats 형식으로 변환 (호환성)
 */
export function convertLegacyToItemStats(legacyStats: LegacyItemStats[]): any[] {
  return legacyStats.map(item => ({
    id: item.item_id,
    title: item.title,
    image: item.image_url,
    totalWins: Math.round(item.total_selections), // 선택된 횟수를 승리로 표시
    totalLosses: Math.round(item.total_appearances - item.total_selections), // 선택되지 않은 횟수
    totalGames: item.total_appearances,
    winRate: item.selection_rate, // 선택률
    totalAppearances: item.total_appearances,
    championshipWins: 0, // 레거시 스타일에서는 사용하지 않음
    rank: item.popularity_rank,
    roundStats: {},
    // 레거시 전용 필드 추가
    selectionRate: item.selection_rate,
    totalSelections: item.total_selections,
    popularityRank: item.popularity_rank,
    isLegacyStyle: true
  }));
}