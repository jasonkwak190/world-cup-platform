import { WorldCupItem, Match, Tournament, TournamentSize } from '@/types/game';

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function calculateTotalRounds(itemCount: number): number {
  return Math.ceil(Math.log2(itemCount));
}

export function getNextPowerOfTwo(num: number): TournamentSize {
  const powers: TournamentSize[] = [4, 8, 16, 32, 64, 128];
  return powers.find(p => p >= num) || 128;
}

export function createInitialMatches(items: WorldCupItem[]): Match[] {
  const matches: Match[] = [];
  
  for (let i = 0; i < items.length; i += 2) {
    const match: Match = {
      id: `match-1-${Math.floor(i / 2) + 1}`,
      round: 1,
      matchNumber: Math.floor(i / 2) + 1,
      item1: items[i],
      item2: items[i + 1],
      isCompleted: false,
    };
    matches.push(match);
  }
  
  return matches;
}

export function createTournament(
  title: string,
  items: WorldCupItem[],
  description?: string
): Tournament {
  const shuffledItems = shuffleArray(items);
  const targetSize = getNextPowerOfTwo(items.length);
  
  // 부족한 항목은 빈 항목으로 채우기 (실제로는 BYE 처리)
  while (shuffledItems.length < targetSize) {
    shuffledItems.push({
      id: `bye-${shuffledItems.length}`,
      title: 'BYE',
      description: 'Automatic advancement',
    });
  }
  
  const matches = createInitialMatches(shuffledItems);
  const totalRounds = calculateTotalRounds(targetSize);
  
  return {
    id: `tournament-${Date.now()}`,
    title,
    description,
    items: shuffledItems,
    totalRounds,
    currentRound: 1,
    currentMatch: 1,
    isCompleted: false,
    matches,
  };
}

export function getCurrentMatch(tournament: Tournament): Match | null {
  const currentRoundMatches = tournament.matches.filter(
    match => match.round === tournament.currentRound
  );
  
  return currentRoundMatches.find(match => !match.isCompleted) || null;
}

export function selectWinner(
  tournament: Tournament,
  winner: WorldCupItem
): Tournament {
  const currentMatch = getCurrentMatch(tournament);
  if (!currentMatch) return tournament;
  
  // 현재 매치 완료
  const updatedMatches = tournament.matches.map(match =>
    match.id === currentMatch.id
      ? { ...match, winner, isCompleted: true }
      : match
  );
  
  // 현재 라운드의 모든 매치가 완료되었는지 확인
  const currentRoundMatches = updatedMatches.filter(
    match => match.round === tournament.currentRound
  );
  const allCurrentRoundCompleted = currentRoundMatches.every(match => match.isCompleted);
  
  let newTournament = {
    ...tournament,
    matches: updatedMatches,
  };
  
  if (allCurrentRoundCompleted) {
    if (tournament.currentRound === tournament.totalRounds) {
      // 토너먼트 완료
      newTournament = {
        ...newTournament,
        isCompleted: true,
        winner,
      };
    } else {
      // 다음 라운드 생성
      newTournament = createNextRound(newTournament);
    }
  } else {
    // 같은 라운드 내 다음 매치로 이동
    newTournament.currentMatch++;
  }
  
  return newTournament;
}

export function undoLastMatch(tournament: Tournament): Tournament | null {
  // 되돌릴 수 있는 완료된 매치가 있는지 확인
  const completedMatches = tournament.matches.filter(match => match.isCompleted);
  if (completedMatches.length === 0) return null;
  
  // 가장 최근에 완료된 매치를 찾기
  const lastCompletedMatch = completedMatches[completedMatches.length - 1];
  
  // 해당 매치를 미완료 상태로 되돌리기
  const updatedMatches = tournament.matches.map(match =>
    match.id === lastCompletedMatch.id
      ? { ...match, winner: undefined, isCompleted: false }
      : match
  );
  
  // 다음 라운드 매치들이 있다면 제거
  const filteredMatches = updatedMatches.filter(match => 
    match.round <= lastCompletedMatch.round
  );
  
  // 현재 라운드와 매치 번호 재설정
  return {
    ...tournament,
    matches: filteredMatches,
    currentRound: lastCompletedMatch.round,
    currentMatch: lastCompletedMatch.matchNumber,
    isCompleted: false,
    winner: undefined,
  };
}

function createNextRound(tournament: Tournament): Tournament {
  const currentRoundMatches = tournament.matches.filter(
    match => match.round === tournament.currentRound && match.isCompleted
  );
  
  const winners = currentRoundMatches
    .map(match => match.winner!)
    .filter(winner => winner.title !== 'BYE'); // BYE 제거
  
  const nextRoundMatches: Match[] = [];
  const nextRound = tournament.currentRound + 1;
  
  for (let i = 0; i < winners.length; i += 2) {
    if (i + 1 < winners.length) {
      const match: Match = {
        id: `match-${nextRound}-${Math.floor(i / 2) + 1}`,
        round: nextRound,
        matchNumber: Math.floor(i / 2) + 1,
        item1: winners[i],
        item2: winners[i + 1],
        isCompleted: false,
      };
      nextRoundMatches.push(match);
    }
  }
  
  return {
    ...tournament,
    currentRound: nextRound,
    currentMatch: 1,
    matches: [...tournament.matches, ...nextRoundMatches],
  };
}

export function getRoundName(round: number, totalRounds: number): string {
  const remainingRounds = totalRounds - round + 1;
  
  switch (remainingRounds) {
    case 1:
      return '결승';
    case 2:
      return '준결승';
    case 3:
      return '8강';
    case 4:
      return '16강';
    case 5:
      return '32강';
    case 6:
      return '64강';
    case 7:
      return '128강';
    default:
      return `${Math.pow(2, remainingRounds)}강`;
  }
}

export function getRoundBorderStyle(round: number, totalRounds: number): string {
  const remainingRounds = totalRounds - round + 1;
  
  switch (remainingRounds) {
    case 1: // 결승
      return 'ring-8 ring-gradient-to-r from-yellow-400 via-red-500 to-pink-500 shadow-2xl shadow-yellow-500/80 animate-pulse';
    case 2: // 준결승
      return 'ring-6 ring-purple-500 shadow-2xl shadow-purple-500/60 animate-pulse';
    case 3: // 8강
      return 'ring-5 ring-blue-500 shadow-xl shadow-blue-500/50';
    case 4: // 16강
      return 'ring-4 ring-green-500 shadow-lg shadow-green-500/40';
    default: // 32강 이상
      return 'ring-4 ring-emerald-500 shadow-lg shadow-emerald-500/30';
  }
}

export function getRoundCheckmarkStyle(round: number, totalRounds: number): string {
  const remainingRounds = totalRounds - round + 1;
  
  switch (remainingRounds) {
    case 1: // 결승
      return 'bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500';
    case 2: // 준결승
      return 'bg-purple-500';
    case 3: // 8강
      return 'bg-blue-500';
    case 4: // 16강
      return 'bg-green-500';
    default: // 32강 이상
      return 'bg-emerald-500';
  }
}

export function getRoundStyle(round: number, totalRounds: number): {
  textSize: string;
  gradient: string;
  glowColor: string;
  particleCount: number;
} {
  const remainingRounds = totalRounds - round + 1;
  
  switch (remainingRounds) {
    case 1: // 결승
      return {
        textSize: 'text-6xl md:text-7xl',
        gradient: 'bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500',
        glowColor: 'drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]',
        particleCount: 50
      };
    case 2: // 준결승
      return {
        textSize: 'text-5xl md:text-6xl',
        gradient: 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500',
        glowColor: 'drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]',
        particleCount: 30
      };
    case 3: // 8강
      return {
        textSize: 'text-4xl md:text-5xl',
        gradient: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
        glowColor: 'drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]',
        particleCount: 20
      };
    case 4: // 16강
      return {
        textSize: 'text-3xl md:text-4xl',
        gradient: 'bg-gradient-to-r from-green-500 via-blue-500 to-purple-500',
        glowColor: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]',
        particleCount: 15
      };
    default: // 32강 이상
      return {
        textSize: 'text-2xl md:text-3xl',
        gradient: 'bg-gradient-to-r from-emerald-500 to-blue-500',
        glowColor: 'drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]',
        particleCount: 10
      };
  }
}

export function getTournamentProgress(tournament: Tournament): {
  current: number;
  total: number;
  percentage: number;
} {
  const totalMatches = Math.pow(2, tournament.totalRounds) - 1; // 전체 매치 수
  const completedMatches = tournament.matches.filter(match => match.isCompleted).length;
  
  return {
    current: completedMatches,
    total: totalMatches,
    percentage: Math.round((completedMatches / totalMatches) * 100),
  };
}