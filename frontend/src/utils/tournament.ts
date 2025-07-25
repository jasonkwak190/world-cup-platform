import { WorldCupItem, Match, Tournament, TournamentSize } from '@/types/game';

// 안전한 Base64 인코딩 함수 - btoa 에러 방지
function safeBase64Encode(str: string): string {
  try {
    // 한글이나 특수문자를 안전하게 처리
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  } catch (error) {
    console.warn('Base64 encoding failed, using fallback:', error);
    return encodeURIComponent(str);
  }
}

// 🎲 향상된 랜덤 셔플 함수 (시간 기반 시드 포함)
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  
  // 현재 시간과 랜덤값을 조합한 시드로 더 강력한 랜덤성 확보
  const timeSeed = Date.now() % 1000000;
  const randomSeed = Math.random() * 1000000;
  const combinedSeed = timeSeed + randomSeed;
  
  // Fisher-Yates 셔플 알고리즘에 시드 기반 랜덤성 추가
  for (let i = shuffled.length - 1; i > 0; i--) {
    const seedInfluence = (combinedSeed * (i + 1)) % 1;
    const j = Math.floor((Math.random() + seedInfluence) * (i + 1)) % (i + 1);
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

// 📊 아이템 수에 따라 선택 가능한 라운드 옵션들을 반환하는 함수
export function getAvailableRounds(itemCount: number): Array<{size: TournamentSize, name: string, description: string}> {
  const maxSize = getNextPowerOfTwo(itemCount);
  const availableRounds = [];
  
  // 최대 토너먼트 크기부터 시작해서 가능한 모든 라운드 추가
  const powers: TournamentSize[] = [4, 8, 16, 32, 64, 128, 256, 512, 1024];
  
  for (const size of powers) {
    if (size <= maxSize) {
      let name = '';
      let description = '';
      
      switch (size) {
        case 4:
          name = '4강';
          description = '빠르고 간단한 토너먼트';
          break;
        case 8:
          name = '8강';
          description = '표준 토너먼트 구조';
          break;
        case 16:
          name = '16강';
          description = '대규모 토너먼트';
          break;
        case 32:
          name = '32강';
          description = '매우 큰 토너먼트';
          break;
        case 64:
          name = '64강';
          description = '거대한 토너먼트';
          break;
        case 128:
          name = '128강';
          description = '거대한 토너먼트';
          break;
        case 256:
          name = '256강';
          description = '초대형 토너먼트';
          break;
        case 512:
          name = '512강';
          description = '대규모 토너먼트';
          break;
        case 1024:
          name = '1024강';
          description = '최대 규모 토너먼트';
          break;
      }
      
      // 부전승이 있을 경우 설명에 추가
      const byeCount = size - itemCount;
      if (byeCount > 0) {
        description += ` • 부전승 ${byeCount}개`;
      }
      
      availableRounds.push({ size, name, description });
    }
  }
  
  return availableRounds.reverse(); // 큰 라운드부터 표시
}

export function createInitialMatches(items: WorldCupItem[]): Match[] {
  const matches: Match[] = [];
  
  // 🎲 매치 생성시에도 추가 랜덤화 (항목들의 순서를 다시 한번 섞기)
  const randomizedItems = shuffleArray([...items]);
  
  for (let i = 0; i < randomizedItems.length; i += 2) {
    const match: Match = {
      id: `match-1-${Math.floor(i / 2) + 1}`,
      round: 1,
      matchNumber: Math.floor(i / 2) + 1,
      item1: randomizedItems[i],
      item2: randomizedItems[i + 1],
      isCompleted: false,
    };
    matches.push(match);
  }
  
  return matches;
}

export function createTournament(
  title: string,
  items: WorldCupItem[],
  description?: string,
  targetTournamentSize?: TournamentSize
): Tournament {
  // 완전히 안전한 처리 - 모든 로깅 제거
  const safeTitle = 'Tournament';
  const safeDescription = 'Tournament Description';
  
  // 아이템 안전 처리
  let shuffledItems = [...items];
  
  // 간단한 셔플
  for (let i = shuffledItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
  }

  // 타겟 크기 설정
  const targetSize = targetTournamentSize || getNextPowerOfTwo(items.length);
  
  // 아이템 수 조정
  if (shuffledItems.length > targetSize) {
    shuffledItems = shuffledItems.slice(0, targetSize);
  }
  
  // BYE 아이템 추가
  while (shuffledItems.length < targetSize) {
    shuffledItems.push({
      id: `bye-${shuffledItems.length}`,
      title: 'BYE',
      description: 'Auto Advance',
      image_url: 'https://via.placeholder.com/400x300/cccccc/666666?text=BYE',
      is_bye: true,
      uuid: undefined,
    });
  }
  
  const matches = createInitialMatches(shuffledItems);
  const totalRounds = calculateTotalRounds(targetSize);
  
  return {
    id: `tournament-${Date.now()}`,
    title: safeTitle,
    description: safeDescription,
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

// 🏆 BYE 매치 감지 및 자동 승자 결정 함수
export function isByeMatch(match: Match): { isBye: boolean; winner?: WorldCupItem } {
  const item1IsBye = match.item1.is_bye || match.item1.title === 'BYE';
  const item2IsBye = match.item2.is_bye || match.item2.title === 'BYE';
  
  if (item1IsBye && !item2IsBye) {
    return { isBye: true, winner: match.item2 };
  } else if (item2IsBye && !item1IsBye) {
    return { isBye: true, winner: match.item1 };
  } else if (item1IsBye && item2IsBye) {
    // 둘 다 BYE인 경우 첫 번째를 승자로 (이런 경우는 거의 없음)
    return { isBye: true, winner: match.item1 };
  }
  
  return { isBye: false };
}

// 🚀 자동으로 BYE 매치들을 처리하는 함수
export function autoAdvanceByes(tournament: Tournament): Tournament {
  let updatedTournament = { ...tournament };
  let foundBye = true;
  
  // BYE 매치가 더 이상 없을 때까지 반복
  while (foundBye) {
    foundBye = false;
    const currentMatch = getCurrentMatch(updatedTournament);
    
    if (currentMatch) {
      const byeResult = isByeMatch(currentMatch);
      if (byeResult.isBye && byeResult.winner) {
        console.log(`🏆 Auto-advancing BYE match: ${byeResult.winner.title} vs BYE`);
        updatedTournament = selectWinner(updatedTournament, byeResult.winner);
        foundBye = true;
      }
    }
  }
  
  return updatedTournament;
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
  
  let winners = currentRoundMatches
    .map(match => match.winner!)
    .filter(winner => !winner.is_bye && winner.title !== 'BYE'); // BYE 제거
  
  const nextRound = tournament.currentRound + 1;
  
  // 🎲 매 라운드마다 승자들을 다시 랜덤하게 섞어서 새로운 대진 생성
  console.log(`🎲 Round ${nextRound} - Shuffling ${winners.length} winners for random matchups`);
  winners = shuffleArray(winners);
  
  const nextRoundMatches: Match[] = [];
  
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
  const participantsInRound = Math.pow(2, remainingRounds);
  
  // 특별한 라운드 이름들
  if (remainingRounds === 1) {
    return '결승';
  }
  
  // 토너먼트 크기에 따른 라운드 이름
  if (participantsInRound === 2) {
    return '결승';
  } else if (participantsInRound === 4) {
    return totalRounds === 2 ? '준결승' : '4강'; // 4강 토너먼트면 "준결승", 더 큰 토너먼트면 "4강"
  } else if (participantsInRound === 8) {
    return '8강';
  } else if (participantsInRound === 16) {
    return '16강';
  } else if (participantsInRound === 32) {
    return '32강';
  } else if (participantsInRound === 64) {
    return '64강';
  } else if (participantsInRound === 128) {
    return '128강';
  } else {
    return `${participantsInRound}강`;
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
  // 라운드 기반 프로그래스 계산
  const currentRound = tournament.currentRound;
  const totalRounds = tournament.totalRounds;
  
  // 현재 라운드에서의 진행도 계산
  const currentRoundMatches = tournament.matches.filter(m => m.round === currentRound);
  const completedCurrentRoundMatches = currentRoundMatches.filter(m => m.isCompleted).length;
  const totalCurrentRoundMatches = currentRoundMatches.length;
  
  // 이전 라운드들은 100% 완료된 것으로 간주
  const completedRounds = currentRound - 1;
  const roundCompletionPercentage = totalRounds > 0 ? (100 / totalRounds) : 0;
  
  // 현재 라운드 내에서의 진행률
  const currentRoundProgress = totalCurrentRoundMatches > 0 
    ? (completedCurrentRoundMatches / totalCurrentRoundMatches) * roundCompletionPercentage 
    : 0;
  
  // 전체 진행률 = 이전 라운드 완료율 + 현재 라운드 진행률
  const totalProgress = (completedRounds * roundCompletionPercentage) + currentRoundProgress;
  
  // 토너먼트가 완료되었다면 100%
  const finalPercentage = tournament.isCompleted ? 100 : Math.min(Math.round(totalProgress), 100);
  
  return {
    current: currentRound,
    total: totalRounds,
    percentage: Math.max(0, finalPercentage), // 최소 0%, 최대 100%
  };
}