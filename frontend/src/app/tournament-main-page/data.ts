import { TournamentCategory, Tournament, User } from './types';

export const categories: TournamentCategory[] = [
  { id: 'all', name: '전체', icon: '🌐', color: 'bg-gray-600' },
  { id: 'celebrity', name: '연예인', icon: '🌟', color: 'bg-pink-600' },
  { id: 'food', name: '음식', icon: '🍔', color: 'bg-yellow-600' },
  { id: 'animal', name: '동물', icon: '🐱', color: 'bg-green-600' },
  { id: 'place', name: '장소', icon: '🏝️', color: 'bg-blue-600' },
  { id: 'movie', name: '영화', icon: '🎬', color: 'bg-purple-600' },
  { id: 'music', name: '음악', icon: '🎵', color: 'bg-red-600' },
  { id: 'sports', name: '스포츠', icon: '⚽', color: 'bg-indigo-600' },
  { id: 'game', name: '게임', icon: '🎮', color: 'bg-cyan-600' },
];

export const tournaments: Tournament[] = [
  {
    id: '1',
    title: '최애 아이돌 월드컵',
    description: '당신이 가장 좋아하는 K-POP 아이돌은 누구인가요?',
    imageUrl: 'https://images.unsplash.com/photo-1605902711622-cfb43c4437b5?w=800&auto=format&fit=crop',
    category: 'celebrity',
    participants: 64,
    rounds: 6,
    plays: 15243,
    createdAt: '2023-10-15',
    creator: {
      name: '케이팝러버',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face'
    },
    tags: ['아이돌', 'K-POP', '음악'],
    featured: true,
    isHot: true
  },
  {
    id: '2',
    title: '맛있는 라면 월드컵',
    description: '대한민국 최고의 라면은 무엇일까요?',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop',
    category: 'food',
    participants: 32,
    rounds: 5,
    plays: 8752,
    createdAt: '2023-11-02',
    creator: {
      name: '라면킹',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=60&h=60&fit=crop&crop=face'
    },
    tags: ['라면', '음식', '인스턴트'],
    isHot: true
  },
  {
    id: '3',
    title: '귀여운 고양이 월드컵',
    description: '세상에서 가장 귀여운 고양이를 뽑아보세요!',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop',
    category: 'animal',
    participants: 32,
    rounds: 5,
    plays: 12567,
    createdAt: '2023-09-28',
    creator: {
      name: '캣맘',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=60&h=60&fit=crop&crop=face'
    },
    tags: ['고양이', '동물', '귀여움'],
    featured: true
  },
  {
    id: '4',
    title: '가보고 싶은 여행지 월드컵',
    description: '당신이 꼭 가보고 싶은 세계 여행지는?',
    imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&auto=format&fit=crop',
    category: 'place',
    participants: 64,
    rounds: 6,
    plays: 7865,
    createdAt: '2023-10-05',
    creator: {
      name: '여행자',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face'
    },
    tags: ['여행', '관광', '휴가'],
    isNew: true
  },
  {
    id: '5',
    title: '역대 최고의 영화 월드컵',
    description: '역사상 최고의 영화를 투표로 결정하세요!',
    imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop',
    category: 'movie',
    participants: 128,
    rounds: 7,
    plays: 23456,
    createdAt: '2023-08-15',
    creator: {
      name: '영화광',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face'
    },
    tags: ['영화', '할리우드', '시네마'],
    featured: true
  },
  {
    id: '6',
    title: '최고의 게임 OST 월드컵',
    description: '게임 역사상 최고의 배경음악은?',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop',
    category: 'music',
    participants: 32,
    rounds: 5,
    plays: 4321,
    createdAt: '2023-11-10',
    creator: {
      name: '게임음악덕후',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&crop=face'
    },
    tags: ['게임', '음악', 'OST'],
    isNew: true
  },
  {
    id: '7',
    title: '역대 월드컵 레전드 월드컵',
    description: '축구 월드컵 역사상 최고의 선수는?',
    imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop',
    category: 'sports',
    participants: 32,
    rounds: 5,
    plays: 9876,
    createdAt: '2023-09-15',
    creator: {
      name: '축구팬',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=60&h=60&fit=crop&crop=face'
    },
    tags: ['축구', '스포츠', '월드컵'],
    isHot: true
  },
  {
    id: '8',
    title: '인기 게임 캐릭터 월드컵',
    description: '가장 인기 있는 게임 캐릭터를 뽑아보세요!',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop',
    category: 'game',
    participants: 64,
    rounds: 6,
    plays: 11234,
    createdAt: '2023-10-20',
    creator: {
      name: '게이머',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=60&h=60&fit=crop&crop=face'
    },
    tags: ['게임', '캐릭터', '콘솔'],
    isNew: true
  }
];

export const popularTournaments = tournaments
  .sort((a, b) => b.plays - a.plays)
  .slice(0, 4);

export const newTournaments = tournaments
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 4);

export const featuredTournaments = tournaments
  .filter(t => t.featured)
  .slice(0, 3);

export const users: User[] = [
  {
    id: '1',
    name: '토너먼트마스터',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
    level: 42,
    createdTournaments: 15,
    playedTournaments: 230
  },
  {
    id: '2',
    name: '월드컵매니아',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face',
    level: 38,
    createdTournaments: 8,
    playedTournaments: 187
  },
  {
    id: '3',
    name: '게임러버',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face',
    level: 27,
    createdTournaments: 5,
    playedTournaments: 142
  }
];