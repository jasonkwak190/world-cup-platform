import { ReactNode } from 'react';

// 샘플 결과 데이터
export const tournamentResult = {
  winner: {
    id: 'winner1',
    name: 'IU',
    subtitle: '솔로 아티스트',
    image: 'https://images.unsplash.com/photo-1494790108755-2616c9c0b8d3?w=600&h=600&fit=crop&crop=face',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // 샘플 유튜브 URL
    votes: 2847,
    winRate: 89.2
  },
  tournament: {
    type: '16강',
    totalParticipants: 16,
    playTime: '7분 32초',
    totalVotes: 3194,
    category: '최고의 K-POP 아이돌 월드컵'
  },
  stats: {
    totalMatches: 15,
    averageVoteTime: '2.3초',
    mostVotedMatch: 'IU vs NewJeans',
    closestMatch: 'BLACKPINK vs TWICE (52% vs 48%)'
  }
};