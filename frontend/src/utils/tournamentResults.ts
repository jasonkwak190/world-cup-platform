// 토너먼트 결과를 Supabase에 저장하고 불러오는 유틸리티 함수들
import { supabase } from '@/lib/supabase';
import { Tournament, WorldCupItem } from '@/types/game';

// UUID 유효성 검사
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// UUID 생성 함수 제거됨 - 사용되지 않음

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

    // 중복 저장 방지: 같은 세션 토큰으로 이미 저장된 결과가 있는지 확인
    const sessionTokenToCheck = sessionToken || generateSessionToken();
    if (sessionToken) {
      const { data: existingSession, error } = await supabase
        .from('game_sessions')
        .select('id')
        .eq('session_token', sessionTokenToCheck)
        .eq('worldcup_id', worldcupId)
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing session:', error);
      }

      if (existingSession && existingSession.length > 0) {
        console.log('⚠️ Session already exists, skipping save:', sessionTokenToCheck);
        return { 
          sessionId: existingSession[0].id,
          message: 'Result already saved',
          skipped: true 
        };
      }
    }

    // 1. 우승자와 준우승자의 정보 (UUID 사용 - 객체에서 직접 추출)
    console.log('🏆 Processing tournament result with simplified UUID extraction');
    
    // 우승자 UUID 추출
    let winnerUuid = null;
    if (tournament.winner) {
      if ((tournament.winner as any).uuid && isValidUUID((tournament.winner as any).uuid)) {
        winnerUuid = (tournament.winner as any).uuid;
        console.log(`🏆 Winner UUID from object: ${tournament.winner.id} → ${winnerUuid}`);
      }
    }
    
    // 준우승자 UUID 추출
    let runnerUpUuid = null;
    const runnerUp = findRunnerUp(tournament);
    if (runnerUp) {
      if ((runnerUp as any).uuid && isValidUUID((runnerUp as any).uuid)) {
        runnerUpUuid = (runnerUp as any).uuid;
        console.log(`🥈 Runner-up UUID from object: ${runnerUp.id} → ${runnerUpUuid}`);
      }
    }

    // 게임 세션 저장 (UUID 사용)
    const sessionData = {
      worldcup_id: worldcupId,
      player_id: userId || null,
      session_token: sessionTokenToCheck,
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
      winner_item_id: winnerUuid,
      runner_up_item_id: runnerUpUuid,
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

    // 2. 매치 결과 저장 (간소화된 방식 - 객체에서 직접 UUID 추출)
    console.log('📋 Creating match data with simplified UUID extraction');
    
    // 매치 데이터 생성 (UUID를 객체에서 직접 추출)
    const matchesData = tournament.matches
      .filter(match => match.isCompleted && match.winner)
      .map(match => {
        const item1Uuid = (match.item1 as any).uuid;
        const item2Uuid = (match.item2 as any).uuid;
        const winnerUuid = (match.winner as any).uuid;
        
        return {
          session_id: session.id,
          worldcup_id: worldcupId,
          round_number: match.round,
          match_number: match.matchNumber,
          item1_id: item1Uuid && isValidUUID(item1Uuid) ? item1Uuid : null,
          item2_id: item2Uuid && isValidUUID(item2Uuid) ? item2Uuid : null,
          winner_id: winnerUuid && isValidUUID(winnerUuid) ? winnerUuid : null,
          decision_time_ms: null // 현재는 결정 시간을 추적하지 않음
        };
      })
      .filter(match => match.item1_id && match.item2_id && match.winner_id); // UUID가 없는 매치 제외

    if (matchesData.length > 0) {
      console.log(`📋 Saving ${matchesData.length} match records...`);
      const { error: matchesError } = await supabase
        .from('game_matches')
        .insert(matchesData);

      if (matchesError) {
        console.error('❌ Error saving game matches:', matchesError);
        throw matchesError;
      }

      console.log(`✅ ${matchesData.length} game matches saved successfully`);
    } else {
      console.warn('⚠️ No valid match data to save (missing UUIDs)');
    }

    // 3. 월드컵 통계 업데이트 (participants 증가)
    // 먼저 현재 participants를 가져와서 +1 해줌
    const { data: currentData, error: fetchError } = await supabase
      .from('worldcups')
      .select('participants')
      .eq('id', worldcupId)
      .single();

    if (!fetchError && currentData) {
      const { error: updateError } = await supabase
        .from('worldcups')
        .update({ 
          participants: (currentData.participants || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', worldcupId);

      if (updateError) {
        console.warn('⚠️ Error updating worldcup participants:', updateError);
        // 이건 중요하지 않으므로 에러를 던지지 않음
      }
    }

    // 4. 아이템별 승패 통계 업데이트 (간소화된 방식)
    await updateItemStatistics(tournament, worldcupId, sessionTokenToCheck);

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

// 월드컵 아이템별 통합 통계 가져오기 (직접 worldcup_items에서 조회)
export async function getItemStatistics(worldcupId: string) {
  try {
    console.log('📈 Fetching item statistics for worldcup:', worldcupId);

    // Input validation
    if (!worldcupId || typeof worldcupId !== 'string') {
      console.error('❌ Invalid worldcupId provided:', worldcupId);
      return [];
    }

    // 캐시 무력화를 위해 타임스탬프 추가 및 API 직접 호출
    const timestamp = Date.now();
    console.log('🔄 Cache-busting timestamp:', timestamp);

    // API를 직접 호출하여 최신 데이터 보장
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

    let response: Response;
    try {
      response = await fetch(`/api/worldcups/${worldcupId}/stats?_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('❌ API call timed out after 10 seconds');
      } else {
        console.error('❌ Network error during API call:', fetchError);
      }
      return [];
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('❌ API response not ok:', response.status, response.statusText);
      // Try to get error details from response
      try {
        const errorData = await response.text();
        console.error('❌ API error details:', errorData);
      } catch (e) {
        console.error('❌ Could not read error response');
      }
      return [];
    }

    let data;
    try {
      data = await response.json();
      console.log('📊 Raw API response data:', data);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      return [];
    }

    const itemStats = data?.items;
    console.log('📊 Extracted itemStats:', itemStats?.length || 0, 'items');

    if (!itemStats || !Array.isArray(itemStats)) {
      console.log('📭 No valid statistics found for worldcup:', worldcupId);
      console.log('📭 Data structure:', { hasData: !!data, hasItems: !!data?.items, itemsType: typeof data?.items });
      return [];
    }

    if (itemStats.length === 0) {
      console.log('📭 Empty statistics array for worldcup:', worldcupId);
      return [];
    }

    console.log('✅ Fetched statistics for', itemStats.length, 'items via API');
    
    // 승률 기준으로 정렬된 결과 반환 (API에서 이미 정렬되어 있지만 재정렬)
    const sortedStats = itemStats.sort((a, b) => {
      if (b.win_rate !== a.win_rate) return b.win_rate - a.win_rate;
      if (b.championship_wins !== a.championship_wins) return b.championship_wins - a.championship_wins;
      return (b.win_count || 0) - (a.win_count || 0);
    });

    const result = sortedStats.map((item, index) => ({
      id: item.id || '',
      title: item.title || 'Unknown',
      image: item.image_url || null,
      totalWins: item.win_count || 0,
      totalLosses: item.loss_count || 0,
      totalGames: (item.win_count || 0) + (item.loss_count || 0),
      winRate: item.win_rate || 0,
      totalAppearances: item.total_appearances || 0,
      championshipWins: item.championship_wins || 0,
      rank: index + 1,
      roundStats: {} // 간단하게 빈 객체로 설정
    }));

    console.log('📊 Processed statistics sample:', result.slice(0, 3).map(item => ({
      title: item.title,
      wins: item.totalWins,
      losses: item.totalLosses,
      winRate: item.winRate,
      championships: item.championshipWins
    })));

    console.log('🎯 Returning', result.length, 'processed items');
    return result;

  } catch (error) {
    console.error('❌ Unexpected error in getItemStatistics:', error);
    // Return empty array instead of throwing to prevent navigation issues
    return [];
  }
}

// 이 함수는 더 이상 사용하지 않으므로 제거
async function getFallbackStatistics(worldcupId: string) {
  return [];
}

// 월드컵의 전체 랭킹 데이터 생성 (통합 통계 기반)
export async function getAggregatedRanking(worldcupId: string, worldcupItems: WorldCupItem[]) {
  try {
    const itemStatistics = await getItemStatistics(worldcupId);
    
    // itemStatistics는 배열이므로 Map으로 변환
    const statsMap = new Map();
    if (Array.isArray(itemStatistics)) {
      itemStatistics.forEach(stat => {
        statsMap.set(stat.id, stat);
      });
    }
    
    const rankingData = worldcupItems.map(item => {
      const stats = statsMap.get(item.id) || {
        totalWins: 0,
        totalLosses: 0,
        totalGames: 0,
        winRate: 0,
        totalAppearances: 0,
        championshipWins: 0
      };

      return {
        ...item,
        rank: 0, // 나중에 정렬 후 설정
        winRate: stats.winRate || 0,
        totalMatches: stats.totalGames || 0,
        wins: stats.totalWins || 0,
        losses: stats.totalLosses || 0,
        roundReached: '1라운드', // 기본값
        appearances: stats.totalAppearances || 0
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
async function updateItemStatistics(tournament: Tournament, _worldcupId: string, sessionToken?: string) {
  try {
    console.log('📊 Updating item statistics for tournament:', tournament.id);
    
    // 이미 처리된 토너먼트인지 확인 (메모리 캐시 사용)
    const tournamentCacheKey = `stats_updated_${tournament.id}`;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const alreadyProcessed = window.sessionStorage.getItem(tournamentCacheKey);
      if (alreadyProcessed) {
        console.log('⚠️ Statistics already updated for this tournament, skipping...');
        return;
      }
    }
    
    const itemStats = new Map<string, { wins: number; losses: number; appearances: number }>();
    
    // 중복 방지를 위해 매치 ID 추적
    const processedMatches = new Set<string>();

    // 토너먼트 매치에서 승패 계산 (중복 제거)
    tournament.matches.forEach(match => {
      const matchKey = `${match.item1.id}-${match.item2.id}-${match.round}`;
      
      if (match.isCompleted && match.winner && !processedMatches.has(matchKey)) {
        processedMatches.add(matchKey);
        
        const winnerId = match.winner.id;
        const loserId = match.item1.id === winnerId ? match.item2.id : match.item1.id;

        console.log(`🔄 Processing match: ${match.item1.title} vs ${match.item2.title}, Winner: ${match.winner.title} (ID: ${winnerId})`);

        // 승자 통계
        if (!itemStats.has(winnerId)) {
          itemStats.set(winnerId, { wins: 0, losses: 0, appearances: 0 });
        }
        const winnerStats = itemStats.get(winnerId)!;
        winnerStats.wins++;
        winnerStats.appearances++;

        // 패자 통계
        if (!itemStats.has(loserId)) {
          itemStats.set(loserId, { wins: 0, losses: 0, appearances: 0 });
        }
        const loserStats = itemStats.get(loserId)!;
        loserStats.losses++;
        loserStats.appearances++;
      }
    });
    
    console.log(`📊 Processed ${processedMatches.size} unique matches`);
    console.log(`🏆 Tournament winner: ${tournament.winner?.title} (ID: ${tournament.winner?.id})`);
    console.log(`📊 Items with stats:`, Array.from(itemStats.keys()).map(id => {
      const stats = itemStats.get(id);
      const isWinner = tournament.winner?.id === id;
      return `${id} (W:${stats?.wins} L:${stats?.losses} ${isWinner ? '🏆 WINNER' : ''})`;
    }));

    // 각 아이템의 통계를 데이터베이스에 업데이트 (간소화된 방식)
    console.log(`📊 Starting optimized statistics update for ${itemStats.size} items`);
    
    // 처리할 UUID 목록 먼저 수집
    const itemUpdates = [];
    for (const [itemId, stats] of itemStats) {
      const tournamentItem = tournament.items.find(item => item.id === itemId);
      if (tournamentItem && (tournamentItem as any).uuid) {
        itemUpdates.push({
          itemId,
          uuid: (tournamentItem as any).uuid,
          stats,
          isChampion: tournament.winner?.id === itemId
        });
      } else {
        console.warn(`⚠️ Could not find UUID for tournament item: ${itemId}`);
      }
    }
    
    console.log(`📊 Found ${itemUpdates.length} items with valid UUIDs to update`);
    
    // 각 아이템 순차 처리 (복잡한 통계 계산 때문에 병렬 처리하지 않음)
    for (const { itemId, uuid, stats, isChampion } of itemUpdates) {
      try {
        console.log(`📊 Processing stats for ${itemId} → UUID: ${uuid}`);
        
        // 현재 통계를 UUID로 직접 조회
        const { data: currentStats, error: fetchError } = await supabase
          .from('worldcup_items')
          .select('id, win_count, loss_count, total_appearances, championship_wins')
          .eq('id', uuid)
          .single();

        if (fetchError) {
          console.warn(`⚠️ Could not fetch stats for item ${itemId} (UUID: ${uuid}):`, fetchError);
          continue;
        }

        if (currentStats) {
          const newWinCount = (currentStats.win_count || 0) + stats.wins;
          const newLossCount = (currentStats.loss_count || 0) + stats.losses;
          const newTotalAppearances = (currentStats.total_appearances || 0) + stats.appearances;
          const totalMatches = newWinCount + newLossCount;
          const newWinRate = totalMatches > 0 ? (newWinCount / totalMatches) * 100 : 0;
          
          // 우승자인 경우 championship_wins 증가
          let newChampionshipWins = currentStats.championship_wins || 0;
          if (isChampion) {
            newChampionshipWins += 1;
            console.log(`🏆 Championship win added for ${itemId}: ${(currentStats.championship_wins || 0)} → ${newChampionshipWins}`);
          }

          console.log(`🎯 Item ${itemId}: Champion=${isChampion}, Wins +${stats.wins}, Losses +${stats.losses}`);

          // 통계 업데이트
          const { data: updateData, error: updateError } = await supabase
            .from('worldcup_items')
            .update({
              win_count: newWinCount,
              loss_count: newLossCount,
              win_rate: Math.round(newWinRate * 100) / 100,
              total_appearances: newTotalAppearances,
              championship_wins: newChampionshipWins,
              updated_at: new Date().toISOString()
            })
            .eq('id', uuid)
            .select();

          if (updateError) {
            console.warn(`⚠️ Could not update stats for item ${itemId}:`, updateError);
          } else if (!updateData || updateData.length === 0) {
            console.warn(`⚠️ No rows updated for item ${itemId} - item may not exist in database`);
          } else {
            const championText = isChampion ? ` 🏆 CHAMPION! Championships: ${newChampionshipWins}` : '';
            console.log(`✅ Updated stats for item ${itemId}: W:${newWinCount} L:${newLossCount} Rate:${newWinRate.toFixed(2)}%${championText}`);
          }
        }
      } catch (itemError) {
        console.warn(`⚠️ Error processing item ${itemId}:`, itemError);
      }
    }

    console.log(`✅ Updated statistics for ${itemStats.size} items`);
    
    // 성공적으로 완료되면 캐시에 기록
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(tournamentCacheKey, Date.now().toString());
    }
  } catch (error) {
    console.error('❌ Error updating item statistics:', error);
    // 통계 업데이트 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
}