'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ChevronRight, TrendingUp, Clock, Star, Plus, Filter, Play } from 'lucide-react';
import { getStoredWorldCups } from '@/utils/storage';
import { getUserWorldCups } from '@/lib/api/worldcups';
import { useAuth } from '@/contexts/AuthContext';
import { useStats } from '@/hooks/useStats';
import { ModernLogo } from './tournament-logo/components';

interface Tournament {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  author: string;
  createdAt: string;
  participants: number;
  comments: number;
  likes: number;
  category: string;
  isNew: boolean;
  isHot: boolean;
  format: string;
  playCount: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const categories: Category[] = [
  { id: 'all', name: '전체', icon: '🏆', color: 'bg-purple-500' },
  { id: 'entertainment', name: '연예인', icon: '🎭', color: 'bg-pink-500' },
  { id: 'sports', name: '스포츠', icon: '⚽', color: 'bg-blue-500' },
  { id: 'food', name: '음식', icon: '🍔', color: 'bg-orange-500' },
  { id: 'game', name: '게임', icon: '🎮', color: 'bg-green-500' },
  { id: 'music', name: '음악', icon: '🎵', color: 'bg-indigo-500' },
  { id: 'movie', name: '영화', icon: '🎬', color: 'bg-red-500' },
  { id: 'animal', name: '동물', icon: '🐱', color: 'bg-yellow-500' },
  { id: 'travel', name: '여행', icon: '✈️', color: 'bg-teal-500' },
  { id: 'etc', name: '기타', icon: '📚', color: 'bg-gray-500' }
];

// Helper function to map frontend sortBy values to API values
function mapSortByToAPI(sortBy: string): { sortBy: string; sortOrder: string } {
  switch (sortBy) {
    case 'popular':
      return { sortBy: 'participants', sortOrder: 'desc' };
    case 'recent':
    case 'latest':
      return { sortBy: 'created_at', sortOrder: 'desc' };
    case 'participants':
      return { sortBy: 'participants', sortOrder: 'desc' };
    case 'comments':
      return { sortBy: 'comments', sortOrder: 'desc' };
    case 'likes':
      return { sortBy: 'likes', sortOrder: 'desc' };
    default:
      return { sortBy: 'participants', sortOrder: 'desc' };
  }
}

export default function Home() {
  const { user } = useAuth();
  const { data: stats } = useStats();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryCounts, setCategoryCounts] = useState<{ [key: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [userWorldCupCount, setUserWorldCupCount] = useState(0);
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const totalPages = stats?.totalPages || 1; // Dynamic total pages from stats

  // 토너먼트 데이터 로드
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        setIsLoading(true);
        
        // API에서 데이터 가져오기
        const { sortBy: apiSortBy, sortOrder: apiSortOrder } = mapSortByToAPI('popular');
        const pageApiUrl = `/api/worldcups?offset=0&limit=100&sortBy=${apiSortBy}&sortOrder=${apiSortOrder}`;
        
        const [apiWorldCups, localWorldCups] = await Promise.allSettled([
          fetch(pageApiUrl)
            .then(async res => {
              if (!res.ok) throw new Error(`API request failed: ${res.status}`);
              return res.json();
            })
            .then(result => result.worldcups || []),
          Promise.resolve(getStoredWorldCups())
        ]);
        
        const apiData = apiWorldCups.status === 'fulfilled' ? apiWorldCups.value as any[] : [];
        const localData = localWorldCups.status === 'fulfilled' ? localWorldCups.value as any[] : [];
        
        // 중복 제거
        const worldCupMap = new Map();
        apiData.forEach((wc: any) => worldCupMap.set(wc.id, wc));
        localData.forEach((wc: any) => {
          if (!worldCupMap.has(wc.id)) {
            worldCupMap.set(wc.id, wc);
          }
        });
        
        const allWorldCups = Array.from(worldCupMap.values());
        
        // 태그 계산 (신규: 1주일 이내, 인기: 플레이수 + 좋아요수 기준)
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const avgPlays = allWorldCups.reduce((sum, wc) => sum + wc.participants, 0) / allWorldCups.length;
        const avgLikes = allWorldCups.reduce((sum, wc) => sum + wc.likes, 0) / allWorldCups.length;
        
        const tournaments: Tournament[] = allWorldCups.map(wc => {
          const createdDate = new Date(wc.createdAt);
          const isNew = createdDate > oneWeekAgo;
          const popularityScore = wc.participants + (wc.likes * 2); // 좋아요에 더 높은 가중치
          const isHot = popularityScore > avgPlays + (avgLikes * 2);
          
          return {
            id: wc.id,
            title: wc.title,
            description: wc.description || '',
            thumbnail: wc.thumbnail || '',
            author: wc.author,
            createdAt: wc.createdAt,
            participants: wc.participants,
            comments: wc.comments,
            likes: wc.likes,
            category: wc.category || 'entertainment',
            isNew,
            isHot,
            format: `${Math.ceil(Math.log2(wc.participants || 16))}강`, // 예: 32강
            playCount: wc.participants
          };
        });
        
        setAllTournaments(tournaments);
        
        // 카테고리별 개수 계산
        const counts: { [key: string]: number } = {
          all: tournaments.length,
        };
        
        tournaments.forEach((tournament) => {
          const category = tournament.category || 'entertainment';
          counts[category] = (counts[category] || 0) + 1;
        });
        
        setCategoryCounts(counts);
        
      } catch (error) {
        console.error('Failed to load tournaments:', error);
        setAllTournaments([]);
        setCategoryCounts({ all: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    loadTournaments();
  }, []);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // 첫 페이지로 리셋
  };

  // 사용자 월드컵 개수 가져오기 (필요시 나중에 추가)
  useEffect(() => {
    if (user && user.id) {
      getUserWorldCups(user.id)
        .then(userWorldCups => setUserWorldCupCount(userWorldCups.length))
        .catch(error => console.error('Failed to load user worldcup count:', error));
    } else {
      setUserWorldCupCount(0);
    }
  }, [user]);

  const popularTournaments = allTournaments
    .filter(t => t.isHot)
    .sort((a, b) => (b.participants + b.likes * 2) - (a.participants + a.likes * 2))
    .slice(0, 8);
  
  const newTournaments = allTournaments
    .filter(t => t.isNew)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);
  
  const featuredTournaments = allTournaments
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 4);
  
  const filteredTournaments = allTournaments.filter(tournament => {
    const matchesCategory = selectedCategory === 'all' || tournament.category === selectedCategory;
    const matchesSearch = tournament.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         tournament.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const TournamentCard = ({ tournament }: { tournament: Tournament }) => (
    <Link href={`/play/${tournament.id}`} className="group">
      <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        <div className="relative h-48">
          <Image
            src={tournament.thumbnail || '/placeholder.svg'}
            alt={tournament.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {tournament.isHot && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              🔥 인기
            </div>
          )}
          {tournament.isNew && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              ✨ 신규
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex items-center text-white text-xs gap-2">
              <span className="bg-black/50 px-2 py-1 rounded-full">
                {tournament.format}
              </span>
              <span className="bg-black/50 px-2 py-1 rounded-full">
                {tournament.playCount.toLocaleString()}회 플레이
              </span>
              <span className="bg-black/50 px-2 py-1 rounded-full">
                ❤️ {tournament.likes}
              </span>
            </div>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{tournament.title}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{tournament.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center mr-2">
                <span className="text-white text-xs font-bold">
                  {tournament.author.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-gray-700 text-xs">{tournament.author}</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              <span>{new Date(tournament.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">토너먼트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ModernLogo className="h-8" />
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Link href="#" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                홈
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                인기 토너먼트
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                새로운 토너먼트
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                내 토너먼트
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                로그인
              </button>
              <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                회원가입
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4">나만의 월드컵 토너먼트</h1>
              <p className="text-lg text-blue-100 mb-8">
                재미있는 주제로 월드컵 토너먼트를 만들고 친구들과 함께 즐겨보세요!
                다양한 카테고리의 토너먼트가 여러분을 기다리고 있습니다.
              </p>
              <div className="flex space-x-4">
                <Link href="/create" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                  토너먼트 만들기
                </Link>
                <button className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-400 transition-colors">
                  인기 토너먼트 보기
                </button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-64 h-64 bg-blue-400 rounded-lg transform rotate-6 opacity-30"></div>
                <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-indigo-400 rounded-lg transform -rotate-6 opacity-30"></div>
                <div className="relative z-10 bg-white p-4 rounded-xl shadow-xl">
                  <div className="grid grid-cols-2 gap-4">
                    {featuredTournaments.map((tournament) => (
                      <div key={tournament.id} className="relative rounded-lg overflow-hidden h-32">
                        <Image
                          src={tournament.thumbnail || '/placeholder.svg'}
                          alt={tournament.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-2">
                          <p className="text-white text-xs font-medium line-clamp-2">{tournament.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="py-6 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="토너먼트 검색..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? `${category.color} text-white`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{category.icon} {category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 인기 토너먼트 */}
        {popularTournaments.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-red-500 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">인기 토너먼트</h2>
              </div>
              <Link href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                더보기 <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          </div>
        )}

        {/* 새로운 토너먼트 */}
        {newTournaments.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Clock className="h-6 w-6 text-green-500 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">새로운 토너먼트</h2>
              </div>
              <Link href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                더보기 <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          </div>
        )}

        {/* 카테고리별 토너먼트 */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Filter className="h-6 w-6 text-purple-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCategory === 'all' ? '모든 토너먼트' : `${categories.find(c => c.id === selectedCategory)?.name} 토너먼트`}
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <select 
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="popular">인기순</option>
                <option value="recent">최신순</option>
                <option value="participants">참여자순</option>
              </select>
            </div>
          </div>
          
          {filteredTournaments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-500 mb-4">검색 결과가 없습니다.</p>
              <button 
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                모든 토너먼트 보기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 토너먼트 만들기 CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-white mb-2">나만의 토너먼트를 만들어보세요!</h2>
              <p className="text-blue-100">
                원하는 주제로 직접 월드컵 토너먼트를 만들고 친구들과 공유해보세요.
              </p>
            </div>
            <div>
              <Link href="/create" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                토너먼트 만들기
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <ModernLogo className="h-8 mb-4" />
              <p className="text-gray-400 text-sm">
                재미있는 월드컵 토너먼트를 만들고 즐기는 공간입니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">서비스</h3>
              <ul className="space-y-2">
                <li><Link href="/create" className="text-gray-400 hover:text-white text-sm">토너먼트 만들기</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">인기 토너먼트</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">새로운 토너먼트</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">카테고리</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">정보</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">이용약관</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">개인정보처리방침</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">FAQ</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">문의하기</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">소셜 미디어</h3>
              <div className="flex space-x-4">
                <Link href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">© 2025 월드컵 토너먼트. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}