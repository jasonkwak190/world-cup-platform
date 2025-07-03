// 토너먼트 결과를 Supabase에 저장하고 불러오는 유틸리티 함수들
import { supabase } from '@/lib/supabase';
import { Tournament, WorldCupItem, Match } from '@/types/game';

// 게임 세션을 Supabase에 저장
export async function saveTournamentResult(
  tournament: Tournament,
  playTimeMs: number,
  worldcupId: string, // 실제 worldcupId를 파라미터로 받음
  userId?: string,
  sessionToken?: string
) {
  try {
    console.log('🏆 Saving tournament result to Supabase:', {
      tournamentId: tournament.id,
      worldcupId: worldcupId,
      isCompleted: tournament.isCompleted,
      hasWinner: !!tournament.winner
    });

    if (!tournament.isCompleted || !tournament.winner) {
      throw new Error('Tournament is not completed or has no winner');
    }

    // 1. 게임 세션 저장
    const sessionData = {
      worldcup_id: worldcupId,
      player_id: userId || null,
      session_token: sessionToken || generateSessionToken(),
      tournament_bracket: {
        tournament_data: {
          id: tournament.id,
          title: tournament.title,
          description: tournament.description,
          totalRounds: tournament.totalRounds,
          currentRound: tournament.currentRound,
          isCompleted: tournament.isCompleted
        },
        winner: tournament.winner,
        final_ranking: generateFinalRanking(tournament)
      },
      current_round: tournament.currentRound,
      status: 'completed',
      winner_item_id: tournament.winner.id,
      runner_up_item_id: findRunnerUp(tournament)?.id || null,
      total_rounds: tournament.totalRounds,
      total_matches: tournament.matches.filter(m => m.isCompleted).length,
      play_time_seconds: Math.round(playTimeMs / 1000),
      player_ip: null, // 클라이언트에서는 IP를 가져올 수 없음
      user_agent: navigator.userAgent
    };

    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Error saving game session:', sessionError);
      throw sessionError;
    }

    console.log('✅ Game session saved:', session.id);

    // 2. 모든 매치 결과 저장
    const matchesData = tournament.matches
      .filter(match => match.isCompleted && match.winner)
      .map(match => ({
        session_id: session.id,
        worldcup_id: worldcupId,
        round_number: match.round,
        match_number: match.matchNumber,
        item1_id: match.item1.id,
        item2_id: match.item2.id,
        winner_id: match.winner!.id,
        decision_time_ms: null // 현재는 결정 시간을 추적하지 않음
      }));

    if (matchesData.length > 0) {
      const { error: matchesError } = await supabase
        .from('game_matches')
        .insert(matchesData);

      if (matchesError) {
        console.error('❌ Error saving game matches:', matchesError);
        throw matchesError;
      }

      console.log(`✅ ${matchesData.length} game matches saved`);
    }

    // 3. 월드컵 통계 업데이트 (play_count 증가)
    // 먼저 현재 play_count를 가져와서 +1 해줌
    const { data: currentData, error: fetchError } = await supabase
      .from('worldcups')
      .select('play_count')
      .eq('id', worldcupId)
      .single();

    if (!fetchError && currentData) {
      const { error: updateError } = await supabase
        .from('worldcups')
        .update({ 
          play_count: (currentData.play_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', worldcupId);

      if (updateError) {
        console.warn('⚠️ Error updating worldcup play_count:', updateError);
        // 이건 중요하지 않으므로 에러를 던지지 않음
      }
    }

    // 4. 아이템별 승패 통계 업데이트
    await updateItemStatistics(tournament, worldcupId);

    return {
      sessionId: session.id,
      success: true
    };
  } catch (error) {
    console.error('❌ Error saving tournament result:', error);
    throw error;
  }
}

// 특정 월드컵의 모든 토너먼트 결과 불러오기
export async function getTournamentResults(worldcupId: string, limit = 50) {
  try {
    console.log('📊 Fetching tournament results for worldcup:', worldcupId);

    const { data, error } = await supabase
      .from('game_sessions')
      .select(`
        id,
        tournament_bracket,
        status,
        winner_item_id,
        runner_up_item_id,
        total_rounds,
        total_matches,
        play_time_seconds,
        created_at,
        completed_at,
        player_id,
        users (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('worldcup_id', worldcupId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching tournament results:', error);
      throw error;
    }

    console.log(`✅ Found ${data.length} tournament results`);
    return data;
  } catch (error) {
    console.error('❌ Error fetching tournament results:', error);
    throw error;
  }
}

// 월드컵 아이템별 통합 통계 가져오기
export async function getItemStatistics(worldcupId: string) {
  try {
    console.log('📈 Fetching item statistics for worldcup:', worldcupId);

    // 모든 게임 매치에서 아이템별 승패 통계 계산
    const { data, error } = await supabase
      .from('game_matches')
      .select(`
        item1_id,
        item2_id,
        winner_id,
        round_number
      `)
      .eq('worldcup_id', worldcupId);

    if (error) {
      console.error('❌ Error fetching item statistics:', error);
      throw error;
    }

    // 아이템별 통계 계산
    const itemStats = new Map<string, {
      wins: number;
      losses: number;
      totalMatches: number;
      winRate: number;
      bestRound: number;
      appearances: number;
    }>();

    data.forEach(match => {
      const { item1_id, item2_id, winner_id, round_number } = match;
      
      // 각 아이템의 통계 초기화
      [item1_id, item2_id].forEach(itemId => {
        if (!itemStats.has(itemId)) {
          itemStats.set(itemId, {
            wins: 0,
            losses: 0,
            totalMatches: 0,
            winRate: 0,
            bestRound: 0,
            appearances: 0
          });
        }
      });

      // 승패 통계 업데이트
      const winnerStats = itemStats.get(winner_id)!;
      const loserId = item1_id === winner_id ? item2_id : item1_id;
      const loserStats = itemStats.get(loserId)!;

      winnerStats.wins++;
      winnerStats.totalMatches++;
      winnerStats.bestRound = Math.max(winnerStats.bestRound, round_number);
      winnerStats.appearances++;

      loserStats.losses++;
      loserStats.totalMatches++;
      loserStats.appearances++;
    });

    // 승률 계산
    itemStats.forEach(stats => {
      stats.winRate = stats.totalMatches > 0 ? 
        Math.round((stats.wins / stats.totalMatches) * 100) : 0;
    });

    console.log(`✅ Calculated statistics for ${itemStats.size} items`);
    return itemStats;
  } catch (error) {
    console.error('❌ Error fetching item statistics:', error);
    throw error;
  }
}

// 월드컵의 전체 랭킹 데이터 생성 (통합 통계 기반)
export async function getAggregatedRanking(worldcupId: string, worldcupItems: WorldCupItem[]) {
  try {
    const itemStatistics = await getItemStatistics(worldcupId);
    
    const rankingData = worldcupItems.map(item => {
      const stats = itemStatistics.get(item.id) || {
        wins: 0,
        losses: 0,
        totalMatches: 0,
        winRate: 0,
        bestRound: 0,
        appearances: 0
      };

      return {
        ...item,
        rank: 0, // 나중에 정렬 후 설정
        winRate: stats.winRate,
        totalMatches: stats.totalMatches,
        wins: stats.wins,
        losses: stats.losses,
        roundReached: getRoundNameFromNumber(stats.bestRound),
        appearances: stats.appearances
      };
    });

    // 정렬: 1. 승률, 2. 총 경기수, 3. 등장 횟수
    rankingData.sort((a, b) => {
      if (a.winRate !== b.winRate) return b.winRate - a.winRate;
      if (a.totalMatches !== b.totalMatches) return b.totalMatches - a.totalMatches;
      return b.appearances - a.appearances;
    });

    // 순위 설정
    rankingData.forEach((item, index) => {
      item.rank = index + 1;
    });

    return rankingData;
  } catch (error) {
    console.error('❌ Error getting aggregated ranking:', error);
    return [];
  }
}

// 헬퍼 함수들

function generateSessionToken(): string {
  return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function findRunnerUp(tournament: Tournament): WorldCupItem | null {
  // 결승전에서 진 사람을 찾기
  const finalMatches = tournament.matches.filter(
    match => match.round === tournament.totalRounds && match.isCompleted
  );
  
  if (finalMatches.length === 0) return null;
  
  const finalMatch = finalMatches[0];
  if (!finalMatch.winner) return null;
  
  return finalMatch.winner.id === finalMatch.item1.id ? 
    finalMatch.item2 : finalMatch.item1;
}

function generateFinalRanking(tournament: Tournament) {
  // 토너먼트에서 각 아이템의 최종 순위 생성
  const ranking = [];
  
  // 우승자
  if (tournament.winner) {
    ranking.push({
      rank: 1,
      item: tournament.winner,
      roundReached: '우승'
    });
  }
  
  // 준우승자
  const runnerUp = findRunnerUp(tournament);
  if (runnerUp) {
    ranking.push({
      rank: 2,
      item: runnerUp,
      roundReached: '결승'
    });
  }
  
  return ranking;
}

function getRoundNameFromNumber(roundNumber: number): string {
  switch (roundNumber) {
    case 1: return '1라운드';
    case 2: return '2라운드';
    case 3: return '8강';
    case 4: return '준결승';
    case 5: return '결승';
    default: return `${roundNumber}라운드`;
  }
}

// 아이템별 승패 통계 업데이트 (worldcup_items 테이블의 캐시 업데이트)
async function updateItemStatistics(tournament: Tournament, worldcupId: string) {
  try {
    const itemStats = new Map<string, { wins: number; losses: number }>();

    // 토너먼트 매치에서 승패 계산
    tournament.matches.forEach(match => {
      if (match.isCompleted && match.winner) {
        const winnerId = match.winner.id;
        const loserId = match.item1.id === winnerId ? match.item2.id : match.item1.id;

        // 승자 통계
        if (!itemStats.has(winnerId)) {
          itemStats.set(winnerId, { wins: 0, losses: 0 });
        }
        itemStats.get(winnerId)!.wins++;

        // 패자 통계
        if (!itemStats.has(loserId)) {
          itemStats.set(loserId, { wins: 0, losses: 0 });
        }
        itemStats.get(loserId)!.losses++;
      }
    });

    // 각 아이템의 통계를 데이터베이스에 업데이트
    for (const [itemId, stats] of itemStats) {
      // 먼저 현재 통계를 가져옴
      const { data: currentStats, error: fetchError } = await supabase
        .from('worldcup_items')
        .select('win_count, loss_count')
        .eq('id', itemId)
        .single();

      if (!fetchError && currentStats) {
        const newWinCount = (currentStats.win_count || 0) + stats.wins;
        const newLossCount = (currentStats.loss_count || 0) + stats.losses;
        const totalMatches = newWinCount + newLossCount;
        const newWinRate = totalMatches > 0 ? newWinCount / totalMatches : 0;

        await supabase
          .from('worldcup_items')
          .update({
            win_count: newWinCount,
            loss_count: newLossCount,
            win_rate: newWinRate,
            updated_at: new Date().toISOString()
          })
          .eq('id', itemId);
      }
    }

    console.log(`✅ Updated statistics for ${itemStats.size} items`);
  } catch (error) {
    console.error('❌ Error updating item statistics:', error);
    // 통계 업데이트 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
}