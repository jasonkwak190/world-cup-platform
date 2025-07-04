// 게임 통계 및 랭킹 계산 유틸리티
import { WorldCupItem, Match, Tournament } from '@/types/game';

export interface GameResult {
  worldcupId: string;
  sessionId: string;
  timestamp: number;
  winner: WorldCupItem;
  matches: Match[];
  totalRounds: number;
  playTime: number; // milliseconds
}

export interface ItemStats {
  id: string;
  title: string;
  image?: string;
  
  // 기본 통계
  totalAppearances: number; // 총 등장 횟수
  totalWins: number; // 총 승리 횟수
  totalLosses: number; // 총 패배 횟수
  winRate: number; // 승률 (%)
  
  // 라운드별 통계
  roundStats: {
    [roundName: string]: {
      appearances: number;
      wins: number;
      winRate: number;
    };
  };
  
  // 우승 관련 통계
  championshipWins: number; // 우승 횟수
  finalAppearances: number; // 결승 진출 횟수
  
  // 상대전 기록
  vsRecord: {
    [opponentId: string]: {
      wins: number;
      losses: number;
      winRate: number;
    };
  };
  
  // 순위 정보
  rank: number;
  averageRoundReached: number; // 평균 도달 라운드
  bestRoundReached: string; // 최고 도달 라운드
}

export interface WorldCupStats {
  worldcupId: string;
  title: string;
  totalGamesPlayed: number;
  totalParticipants: number;
  itemStats: Map<string, ItemStats>;
  lastUpdated: number;
}

// 로컬스토리지 키
const GAME_RESULTS_KEY = 'worldcup_game_results';
const WORLDCUP_STATS_KEY = 'worldcup_stats';

/**
 * 게임 결과를 로컬스토리지에 저장
 */
export function saveGameResult(result: GameResult): void {
  try {
    const existingResults = getGameResults();
    existingResults.push(result);
    
    // 최대 1000개의 게임 결과만 보관 (용량 관리)
    if (existingResults.length > 1000) {
      existingResults.splice(0, existingResults.length - 1000);
    }
    
    localStorage.setItem(GAME_RESULTS_KEY, JSON.stringify(existingResults));
    
    // 통계 업데이트
    updateWorldCupStats(result);
    
    console.log('✅ Game result saved:', result.sessionId);
  } catch (error) {
    console.error('❌ Failed to save game result:', error);
  }
}

/**
 * 모든 게임 결과 조회
 */
export function getGameResults(worldcupId?: string): GameResult[] {
  try {
    const stored = localStorage.getItem(GAME_RESULTS_KEY);
    if (!stored) return [];
    
    const results: GameResult[] = JSON.parse(stored);
    
    if (worldcupId) {
      return results.filter(result => result.worldcupId === worldcupId);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Failed to get game results:', error);
    return [];
  }
}

/**
 * 특정 월드컵의 통계 업데이트
 */
function updateWorldCupStats(gameResult: GameResult): void {
  try {
    const stats = getWorldCupStats(gameResult.worldcupId) || createEmptyStats(gameResult.worldcupId);
    
    // 기본 정보 업데이트
    stats.totalGamesPlayed++;
    stats.lastUpdated = Date.now();
    
    // 각 아이템의 통계 업데이트
    gameResult.matches.forEach(match => {
      if (match.isCompleted && match.winner) {
        // 승자 통계 업데이트
        updateItemStats(stats, match.item1, match.item2, match.winner, match.round);
        updateItemStats(stats, match.item2, match.item1, match.winner, match.round);
      }
    });
    
    // 우승자 특별 처리
    if (gameResult.winner) {
      const winnerStats = stats.itemStats.get(gameResult.winner.id);
      if (winnerStats) {
        winnerStats.championshipWins++;
      }
    }
    
    // 랭킹 재계산
    recalculateRankings(stats);
    
    // 저장
    saveWorldCupStats(stats);
    
  } catch (error) {
    console.error('❌ Failed to update worldcup stats:', error);
  }
}

/**
 * 개별 아이템 통계 업데이트
 */
function updateItemStats(
  stats: WorldCupStats, 
  item: WorldCupItem, 
  opponent: WorldCupItem, 
  winner: WorldCupItem, 
  round: number
): void {
  
  let itemStats = stats.itemStats.get(item.id);
  if (!itemStats) {
    itemStats = createEmptyItemStats(item);
    stats.itemStats.set(item.id, itemStats);
  }
  
  // 기본 통계 업데이트
  itemStats.totalAppearances++;
  
  const isWinner = item.id === winner.id;
  if (isWinner) {
    itemStats.totalWins++;
  } else {
    itemStats.totalLosses++;
  }
  
  // 승률 재계산
  itemStats.winRate = (itemStats.totalWins / itemStats.totalAppearances) * 100;
  
  // 라운드별 통계
  const roundName = getRoundName(round);
  if (!itemStats.roundStats[roundName]) {
    itemStats.roundStats[roundName] = { appearances: 0, wins: 0, winRate: 0 };
  }
  
  itemStats.roundStats[roundName].appearances++;
  if (isWinner) {
    itemStats.roundStats[roundName].wins++;
  }
  itemStats.roundStats[roundName].winRate = 
    (itemStats.roundStats[roundName].wins / itemStats.roundStats[roundName].appearances) * 100;
  
  // 상대전 기록
  if (!itemStats.vsRecord[opponent.id]) {
    itemStats.vsRecord[opponent.id] = { wins: 0, losses: 0, winRate: 0 };
  }
  
  if (isWinner) {
    itemStats.vsRecord[opponent.id].wins++;
  } else {
    itemStats.vsRecord[opponent.id].losses++;
  }
  
  const totalVsMatches = itemStats.vsRecord[opponent.id].wins + itemStats.vsRecord[opponent.id].losses;
  itemStats.vsRecord[opponent.id].winRate = 
    (itemStats.vsRecord[opponent.id].wins / totalVsMatches) * 100;
}

/**
 * 빈 통계 객체 생성
 */
function createEmptyStats(worldcupId: string): WorldCupStats {
  return {
    worldcupId,
    title: '',
    totalGamesPlayed: 0,
    totalParticipants: 0,
    itemStats: new Map(),
    lastUpdated: Date.now()
  };
}

/**
 * 빈 아이템 통계 객체 생성
 */
function createEmptyItemStats(item: WorldCupItem): ItemStats {
  return {
    id: item.id,
    title: item.title,
    image: item.image || item.image_url,
    totalAppearances: 0,
    totalWins: 0,
    totalLosses: 0,
    winRate: 0,
    roundStats: {},
    championshipWins: 0,
    finalAppearances: 0,
    vsRecord: {},
    rank: 0,
    averageRoundReached: 0,
    bestRoundReached: '1라운드'
  };
}

/**
 * 라운드 번호를 이름으로 변환
 */
function getRoundName(round: number): string {
  switch (round) {
    case 1: return '결승';
    case 2: return '준결승';
    case 3: return '8강';
    case 4: return '16강';
    case 5: return '32강';
    case 6: return '64강';
    default: return `${round}라운드`;
  }
}

/**
 * 랭킹 재계산
 */
function recalculateRankings(stats: WorldCupStats): void {
  const items = Array.from(stats.itemStats.values());
  
  // 정렬 기준: 1) 승률, 2) 총 승수, 3) 우승 횟수, 4) 총 경기수
  items.sort((a, b) => {
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
    if (b.championshipWins !== a.championshipWins) return b.championshipWins - a.championshipWins;
    return b.totalAppearances - a.totalAppearances;
  });
  
  // 순위 할당
  items.forEach((item, index) => {
    item.rank = index + 1;
  });
}

/**
 * 월드컵 통계 조회
 */
export function getWorldCupStats(worldcupId: string): WorldCupStats | null {
  try {
    const stored = localStorage.getItem(`${WORLDCUP_STATS_KEY}_${worldcupId}`);
    if (!stored) return null;
    
    const stats = JSON.parse(stored);
    // Map 객체 복원
    stats.itemStats = new Map(Object.entries(stats.itemStats));
    
    return stats;
  } catch (error) {
    console.error('❌ Failed to get worldcup stats:', error);
    return null;
  }
}

/**
 * 월드컵 통계 저장
 */
function saveWorldCupStats(stats: WorldCupStats): void {
  try {
    // Map을 객체로 변환하여 저장
    const statsToSave = {
      ...stats,
      itemStats: Object.fromEntries(stats.itemStats)
    };
    
    localStorage.setItem(`${WORLDCUP_STATS_KEY}_${stats.worldcupId}`, JSON.stringify(statsToSave));
  } catch (error) {
    console.error('❌ Failed to save worldcup stats:', error);
  }
}

/**
 * 특정 월드컵의 랭킹 데이터 생성 (실제 통계 기반)
 */
export function generateRealRankingData(worldcupId: string, winner?: WorldCupItem): ItemStats[] {
  const stats = getWorldCupStats(worldcupId);
  if (!stats || stats.itemStats.size === 0) {
    console.warn('No stats found for worldcup:', worldcupId);
    return [];
  }
  
  const items = Array.from(stats.itemStats.values());
  
  // 승률 기준 정렬
  return items.sort((a, b) => {
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
    if (b.championshipWins !== a.championshipWins) return b.championshipWins - a.championshipWins;
    return b.totalAppearances - a.totalAppearances;
  });
}

/**
 * 통계 초기화 (디버깅용)
 */
export function clearAllStats(): void {
  try {
    localStorage.removeItem(GAME_RESULTS_KEY);
    
    // 모든 월드컵 통계 삭제
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(WORLDCUP_STATS_KEY)) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ All stats cleared');
  } catch (error) {
    console.error('❌ Failed to clear stats:', error);
  }
}