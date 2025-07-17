'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ChevronRight, TrendingUp, Clock, Plus, Filter, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import AuthModal from '@/components/AuthModal';
import ThemeSelector from '@/components/ThemeSelector';
import RankingModal from '@/components/shared/RankingModal';
import TournamentCard from '@/components/TournamentCard';
import TournamentCardSkeleton from '@/components/TournamentCardSkeleton';
import { ModernLogo } from './tournament-logo/components';
import { getStoredWorldCups } from '@/utils/storage';
import { getUserWorldCups } from '@/lib/api/worldcups';

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
  thumbnail_url?: string;
  thumbnail?: string; // Legacy support
  created_at?: string;
  createdAt?: string; // Legacy support
  creator_name?: string;
  author?: string; // Legacy support
  creator_id?: string;
  author_id?: string; // Legacy support
  participants: number;
  category: string;
  is_public?: boolean;
  isPublic?: boolean; // Legacy support
  likes: number;
  comments: number;
  itemsCount?: number; // Number of items for tournament bracket calculation
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('participants');
  const [sortOrder, setSortOrder] = useState('desc');
  const [allWorldcups, setAllWorldcups] = useState<WorldCup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [userWorldCupCount, setUserWorldCupCount] = useState(0);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [selectedTournamentForRanking, setSelectedTournamentForRanking] = useState<{ id: string; title: string } | null>(null);
  
  const { user, isAuthenticated, logout } = useAuth();
  const { getThemeClass } = useTheme();
  const router = useRouter();

  // Helper function to normalize worldcup data from different API formats
  const normalizeWorldCup = (wc: any): WorldCup => {
    const normalized = {
      id: wc.id,
      title: wc.title,
      description: wc.description || '',
      thumbnail_url: wc.thumbnail_url || wc.thumbnail || '/placeholder.svg',
      created_at: wc.created_at || wc.createdAt,
      creator_name: wc.creator_name || wc.author || 'Unknown',
      creator_id: wc.creator_id || wc.author_id || '',
      participants: wc.participants || 0,
      category: wc.category || 'entertainment',
      is_public: wc.is_public !== undefined ? wc.is_public : (wc.isPublic !== undefined ? wc.isPublic : true),
      likes: wc.likes || 0,
      comments: wc.comments || 0,
      itemsCount: wc.itemsCount || 0
    };
    
    
    return normalized;
  };

  // 초기 데이터 로드 (한 번만 실행)
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // 한 번의 API 호출로 충분한 데이터 가져오기
      const params = new URLSearchParams({
        offset: '0',
        limit: '50', // 최대 허용치
        sortBy: 'created_at',
        sortOrder: 'desc',
        isPublic: 'true'
      });
      
      const [apiWorldCups, localWorldCups] = await Promise.allSettled([
        fetch(`/api/worldcups?${params}`)
          .then(async res => {
            if (!res.ok) throw new Error(`API request failed: ${res.status}`);
            return res.json();
          })
          .then(result => result.worldcups || []),
        Promise.resolve(getStoredWorldCups())
      ]);
      
      const apiData = apiWorldCups.status === 'fulfilled' ? apiWorldCups.value as any[] : [];
      const localData = localWorldCups.status === 'fulfilled' ? localWorldCups.value as any[] : [];
      
      // 중복 제거 및 데이터 정규화
      const worldCupMap = new Map();
      
      apiData.forEach((wc: any) => {
        const normalizedWc = normalizeWorldCup(wc);
        worldCupMap.set(normalizedWc.id, normalizedWc);
      });
      
      localData.forEach((wc: any) => {
        if (!worldCupMap.has(wc.id)) {
          const normalizedWc = normalizeWorldCup(wc);
          worldCupMap.set(normalizedWc.id, normalizedWc);
        }
      });
      
      const allWorldCups = Array.from(worldCupMap.values());
      setAllWorldcups(allWorldCups);
      
      
    } catch (error) {
      console.error('Failed to fetch worldcups:', error);
      setAllWorldcups([]);
    } finally {
      setIsLoading(false);
    }
  };

  // useMemo로 파생 상태 계산
  const popularWorldcups = useMemo(() => {
    return [...allWorldcups]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 8);
  }, [allWorldcups]);

  const newWorldcups = useMemo(() => {
    return [...allWorldcups]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 8);
  }, [allWorldcups]);

  const filteredTournaments = useMemo(() => {
    let filtered = [...allWorldcups];
    
    // 카테고리 필터링
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(wc => wc.category === selectedCategory);
    }
    
    // 검색 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(wc => 
        wc.title.toLowerCase().includes(query) || 
        (wc.description && wc.description.toLowerCase().includes(query))
      );
    }
    
    // 정렬 적용
    switch (`${sortBy}-${sortOrder}`) {
      case 'likes-desc':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'participants-desc':
        filtered.sort((a, b) => b.participants - a.participants);
        break;
      case 'comments-desc':
        filtered.sort((a, b) => b.comments - a.comments);
        break;
      case 'created_at-desc':
      default:
        filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
    }
    
    return filtered;
  }, [allWorldcups, selectedCategory, searchQuery, sortBy, sortOrder]);

  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = {
      all: allWorldcups.length,
    };
    
    allWorldcups.forEach((wc: WorldCup) => {
      const category = wc.category || 'other';
      counts[category] = (counts[category] || 0) + 1;
    });
    
    return counts;
  }, [allWorldcups]);

  // 초기 데이터 로드 (한 번만 실행)
  useEffect(() => {
    loadInitialData();
  }, []);

  // 사용자 월드컵 개수 가져오기
  useEffect(() => {
    if (user && user.id) {
      getUserWorldCups(user.id)
        .then(userWorldCups => setUserWorldCupCount(userWorldCups.length))
        .catch(error => console.error('Failed to load user worldcup count:', error));
    } else {
      setUserWorldCupCount(0);
    }
  }, [user]);


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

  const handleShowRanking = (tournament: WorldCup) => {
    setSelectedTournamentForRanking({ id: tournament.id, title: tournament.title });
    setIsRankingModalOpen(true);
  };

  const handleCloseRanking = () => {
    setIsRankingModalOpen(false);
    setSelectedTournamentForRanking(null);
  };


  return (
    <div className={`min-h-screen ${getThemeClass('background')}`}>
      {/* 헤더 */}
      <header className={getThemeClass('header')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ModernLogo className="h-8" />
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Link href="#" className={`${getThemeClass('textSecondary')} hover:${getThemeClass('text')} px-3 py-2 text-sm font-medium`}>
                홈
              </Link>
              {isAuthenticated ? (
                <Link href="/my" className={`${getThemeClass('textSecondary')} hover:${getThemeClass('text')} px-3 py-2 text-sm font-medium`}>
                  내 토너먼트
                </Link>
              ) : (
                <button 
                  onClick={handleLoginClick}
                  className={`${getThemeClass('textSecondary')} hover:${getThemeClass('text')} px-3 py-2 text-sm font-medium`}
                >
                  내 토너먼트
                </button>
              )}
              <ThemeSelector />
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <User className={`w-5 h-5 ${getThemeClass('textSecondary')}`} />
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${getThemeClass('text')}`}>{user?.username || user?.email}</span>
                      {userWorldCupCount > 0 && (
                        <span className={`text-xs ${getThemeClass('textSecondary')}`}>토너먼트 {userWorldCupCount}개</span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className={`${getThemeClass('secondary')} ${getThemeClass('text')} px-4 py-2 ${getThemeClass('button')} text-sm font-medium hover:bg-gray-300 transition-colors flex items-center space-x-1`}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>로그아웃</span>
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={handleLoginClick}
                    className={`bg-blue-600 text-white px-4 py-2 ${getThemeClass('button')} text-sm font-medium hover:bg-blue-700 transition-colors`}
                  >
                    로그인
                  </button>
                  <button 
                    onClick={handleLoginClick}
                    className={`${getThemeClass('secondary')} ${getThemeClass('text')} px-4 py-2 ${getThemeClass('button')} text-sm font-medium hover:bg-gray-300 transition-colors`}
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
      <div className={`bg-gradient-to-r ${getThemeClass('primary')} text-white py-16`}>
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
                  className={`bg-white text-blue-600 px-6 py-3 ${getThemeClass('button')} font-medium hover:bg-blue-50 transition-colors`}
                >
                  토너먼트 만들기
                </button>
                <button 
                  onClick={() => {
                    const allTournamentsSection = document.querySelector('[data-section="all-tournaments"]');
                    allTournamentsSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`bg-blue-500 text-white px-6 py-3 ${getThemeClass('button')} font-medium hover:bg-blue-400 transition-colors`}
                >
                  전체 토너먼트 보기
                </button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-64 h-64 bg-blue-400 rounded-lg transform rotate-6 opacity-30"></div>
                <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-indigo-400 rounded-lg transform -rotate-6 opacity-30"></div>
                <div className={`relative z-10 ${getThemeClass('surface')} p-4 rounded-xl shadow-xl`}>
                  <div className="grid grid-cols-2 gap-4">
                    {popularWorldcups.slice(0, 4).map((tournament, index) => (
                      <div key={tournament.id} className="relative rounded-lg overflow-hidden h-32">
                        <Image
                          src={tournament.thumbnail_url || '/placeholder.svg'}
                          alt={tournament.title}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 12vw"
                          className="object-cover"
                          priority={true}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
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
      <div className={`py-6 ${getThemeClass('surface')} shadow-sm`}>
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
                  <span>
                    {category.icon} {category.name}
                    {categoryCounts[category.id] !== undefined && (
                      <span className="ml-1 opacity-75">({categoryCounts[category.id]})</span>
                    )}
                  </span>
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
              <h2 className={`text-2xl font-bold ${getThemeClass('text')}`}>인기 토너먼트</h2>
            </div>
            <button 
              onClick={() => {
                setSelectedCategory('all');
                setSortBy('likes');
                setSortOrder('desc');
                setSearchQuery('');
                // 모든 토너먼트 섹션으로 스크롤
                const allTournamentsSection = document.querySelector('[data-section="all-tournaments"]');
                allTournamentsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              더보기 <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <TournamentCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularWorldcups.map((tournament, index) => (
                <TournamentCard 
                  key={tournament.id} 
                  tournament={tournament} 
                  onShowRanking={handleShowRanking}
                  priority={index < 8}
                />
              ))}
            </div>
          )}
        </div>

        {/* 새로운 토너먼트 */}
        <div id="new-tournaments" className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-green-500 mr-2" />
              <h2 className={`text-2xl font-bold ${getThemeClass('text')}`}>새로운 토너먼트</h2>
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
                <TournamentCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newWorldcups.map((tournament, index) => (
                <TournamentCard 
                  key={tournament.id} 
                  tournament={tournament} 
                  onShowRanking={handleShowRanking}
                  priority={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* 카테고리별 토너먼트 */}
        <div data-section="all-tournaments">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Filter className="h-6 w-6 text-purple-500 mr-2" />
              <h2 className={`text-2xl font-bold ${getThemeClass('text')}`}>
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
                className={`${getThemeClass('surface')} border border-gray-300 ${getThemeClass('button')} px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                <TournamentCardSkeleton key={index} />
              ))}
            </div>
          ) : filteredTournaments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredTournaments.map((tournament, index) => (
                <TournamentCard 
                  key={tournament.id} 
                  tournament={tournament} 
                  onShowRanking={handleShowRanking}
                  priority={false}
                />
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 ${getThemeClass('secondary')} rounded-xl`}>
              <p className={`${getThemeClass('textSecondary')} mb-4`}>검색 결과가 없습니다.</p>
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
      <div className={`bg-gradient-to-r ${getThemeClass('primary')} py-12`}>
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
                className={`bg-white text-blue-600 px-6 py-3 ${getThemeClass('button')} font-medium hover:bg-blue-50 transition-colors flex items-center`}
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
                <li><button onClick={handleCreateTournament} className="text-gray-400 hover:text-white text-sm">토너먼트 만들기</button></li>
                <li><Link href="#popular-tournaments" className="text-gray-400 hover:text-white text-sm">인기 토너먼트</Link></li>
                <li><Link href="#new-tournaments" className="text-gray-400 hover:text-white text-sm">새로운 토너먼트</Link></li>
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

      {/* 랭킹 모달 */}
      {selectedTournamentForRanking && (
        <RankingModal
          isOpen={isRankingModalOpen}
          onClose={handleCloseRanking}
          worldcupId={selectedTournamentForRanking.id}
          worldcupTitle={selectedTournamentForRanking.title}
        />
      )}
    </div>
  );
}