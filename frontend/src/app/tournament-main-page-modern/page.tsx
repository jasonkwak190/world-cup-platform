'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ChevronRight, TrendingUp, Clock, Star, Plus, Filter, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import { ModernLogo } from '../tournament-logo/components';

// 카테고리 정의
const categories = [
  { id: 'all', name: '전체', icon: '🌟', color: 'bg-blue-500' },
  { id: 'celebrity', name: '연예인', icon: '⭐', color: 'bg-pink-500' },
  { id: 'food', name: '음식', icon: '🍔', color: 'bg-orange-500' },
  { id: 'travel', name: '여행', icon: '✈️', color: 'bg-indigo-500' },
  { id: 'anime', name: '애니메이션', icon: '🎌', color: 'bg-purple-500' },
  { id: 'game', name: '게임', icon: '🎮', color: 'bg-green-500' },
  { id: 'movie', name: '영화', icon: '🎬', color: 'bg-red-500' },
  { id: 'music', name: '음악', icon: '🎵', color: 'bg-yellow-500' },
  { id: 'entertainment', name: '엔터테인먼트', icon: '🎪', color: 'bg-cyan-500' },
  { id: 'sports', name: '스포츠', icon: '⚽', color: 'bg-emerald-500' },
  { id: 'other', name: '기타', icon: '📦', color: 'bg-gray-500' }
];

interface WorldCup {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  created_at: string;
  creator_name: string;
  creator_id: string;
  participants: number;
  category: string;
  is_public: boolean;
  likes: number;
  comments: number;
}

export default function TournamentMainPageModern() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('participants');
  const [sortOrder, setSortOrder] = useState('desc');
  const [worldcups, setWorldcups] = useState<WorldCup[]>([]);
  const [popularWorldcups, setPopularWorldcups] = useState<WorldCup[]>([]);
  const [newWorldcups, setNewWorldcups] = useState<WorldCup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // API에서 월드컵 데이터 가져오기
  const fetchWorldcups = async () => {
    try {
      setIsLoading(true);
      
      // 전체 월드컵 조회
      const params = new URLSearchParams({
        offset: '0',
        limit: '50',
        sortBy: sortBy,
        sortOrder: sortOrder,
        isPublic: 'true'
      });
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery);
      }
      
      const response = await fetch(`/api/worldcups?${params}`);
      const data = await response.json();
      
      if (data.worldcups) {
        setWorldcups(data.worldcups);
      }
    } catch (error) {
      console.error('Failed to fetch worldcups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 인기 월드컵 및 새로운 월드컵 가져오기
  const fetchSpecialWorldcups = async () => {
    try {
      // 인기 월드컵 (참여자 순)
      const popularResponse = await fetch('/api/worldcups?offset=0&limit=8&sortBy=participants&sortOrder=desc&isPublic=true');
      const popularData = await popularResponse.json();
      if (popularData.worldcups) {
        setPopularWorldcups(popularData.worldcups);
      }
      
      // 새로운 월드컵 (최신순)
      const newResponse = await fetch('/api/worldcups?offset=0&limit=8&sortBy=created_at&sortOrder=desc&isPublic=true');
      const newData = await newResponse.json();
      if (newData.worldcups) {
        setNewWorldcups(newData.worldcups);
      }
    } catch (error) {
      console.error('Failed to fetch special worldcups:', error);
    }
  };

  useEffect(() => {
    fetchWorldcups();
    fetchSpecialWorldcups();
  }, [selectedCategory, searchQuery, sortBy, sortOrder]);

  const filteredTournaments = worldcups;

  const handleLoginClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleCreateTournament = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    router.push('/create');
  };

  const handleLogout = async () => {
    await logout();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '오늘';
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 30) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

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
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{user?.username || user?.email}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors flex items-center space-x-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>로그아웃</span>
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={handleLoginClick}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    로그인
                  </button>
                  <button 
                    onClick={handleLoginClick}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    회원가입
                  </button>
                </>
              )}
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
                <button 
                  onClick={handleCreateTournament}
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  토너먼트 만들기
                </button>
                <button 
                  onClick={() => {
                    const popularSection = document.getElementById('popular-tournaments');
                    popularSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-400 transition-colors"
                >
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
                    {popularWorldcups.slice(0, 4).map((tournament, index) => (
                      <div key={tournament.id} className="relative rounded-lg overflow-hidden h-32">
                        <Image
                          src={tournament.thumbnail_url || '/images/placeholder.svg'}
                          alt={tournament.title}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 12vw"
                          className="object-cover"
                          priority={true}
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
        <div id="popular-tournaments" className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 text-red-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">인기 토너먼트</h2>
            </div>
            <button 
              onClick={() => {
                setSelectedCategory('all');
                setSortBy('participants');
                setSortOrder('desc');
                setSearchQuery('');
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              더보기 <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
                  <div className="h-48 bg-gray-300"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded mb-3"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-gray-300 rounded w-20"></div>
                      <div className="h-3 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularWorldcups.map((tournament, index) => (
                <Link href={`/worldcup/${tournament.id}/play`} key={tournament.id} className="group">
                  <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <div className="relative h-48">
                      <Image
                        src={tournament.thumbnail_url || '/images/placeholder.svg'}
                        alt={tournament.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        priority={index < 4}
                      />
                      {tournament.participants >= 1000 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          🔥 인기
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <div className="flex items-center text-white text-xs">
                          <span className="bg-black/50 px-2 py-1 rounded-full mr-2">
                            {tournament.participants}명 참여
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
                          <div className="w-6 h-6 rounded-full bg-gray-300 mr-2 flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-600" />
                          </div>
                          <span className="text-gray-700 text-xs">{tournament.creator_name}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{formatDate(tournament.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 새로운 토너먼트 */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-green-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">새로운 토너먼트</h2>
            </div>
            <button 
              onClick={() => {
                setSelectedCategory('all');
                setSortBy('created_at');
                setSortOrder('desc');
                setSearchQuery('');
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              더보기 <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
                  <div className="h-48 bg-gray-300"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded mb-3"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-gray-300 rounded w-20"></div>
                      <div className="h-3 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newWorldcups.map((tournament) => {
                const isNew = new Date(tournament.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return (
                  <Link href={`/worldcup/${tournament.id}/play`} key={tournament.id} className="group">
                    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                      <div className="relative h-48">
                        <Image
                          src={tournament.thumbnail_url || '/images/placeholder.svg'}
                          alt={tournament.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          priority={false}
                        />
                        {isNew && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            ✨ 신규
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <div className="flex items-center text-white text-xs">
                            <span className="bg-black/50 px-2 py-1 rounded-full mr-2">
                              {tournament.participants}명 참여
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
                            <div className="w-6 h-6 rounded-full bg-gray-300 mr-2 flex items-center justify-center">
                              <User className="w-3 h-3 text-gray-600" />
                            </div>
                            <span className="text-gray-700 text-xs">{tournament.creator_name}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{formatDate(tournament.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

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
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="created_at-desc">최신순</option>
                <option value="participants-desc">참여자순</option>
                <option value="likes-desc">인기순</option>
                <option value="comments-desc">댓글많은순</option>
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
                  <div className="h-48 bg-gray-300"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded mb-3"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-gray-300 rounded w-20"></div>
                      <div className="h-3 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTournaments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredTournaments.map((tournament) => {
                const isNew = new Date(tournament.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                const isHot = tournament.participants >= 100;
                return (
                  <Link href={`/worldcup/${tournament.id}/play`} key={tournament.id} className="group">
                    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                      <div className="relative h-48">
                        <Image
                          src={tournament.thumbnail_url || '/images/placeholder.svg'}
                          alt={tournament.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          priority={false}
                        />
                        {isHot && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            🔥 인기
                          </div>
                        )}
                        {isNew && !isHot && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            ✨ 신규
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <div className="flex items-center text-white text-xs">
                            <span className="bg-black/50 px-2 py-1 rounded-full mr-2">
                              {tournament.participants}명 참여
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
                            <div className="w-6 h-6 rounded-full bg-gray-300 mr-2 flex items-center justify-center">
                              <User className="w-3 h-3 text-gray-600" />
                            </div>
                            <span className="text-gray-700 text-xs">{tournament.creator_name}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{formatDate(tournament.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
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
              <button 
                onClick={handleCreateTournament}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                토너먼트 만들기
              </button>
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
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">토너먼트 만들기</Link></li>
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

      {/* 인증 모달 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="로그인이 필요합니다"
        subtitle="월드컵 토너먼트를 만들고 참여하려면 로그인해주세요"
      />
    </div>
  );
}