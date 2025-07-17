'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, TrendingUp, Clock, Star, Filter, User, ChevronRight, Play, Heart, MessageCircle, Eye, Calendar } from 'lucide-react';

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

// 샘플 토너먼트 데이터
const sampleTournaments = [
  {
    id: '1',
    title: '최고의 K-POP 아이돌 월드컵',
    description: '가장 인기 있는 K-POP 아이돌을 선택해보세요! BTS, 블랙핑크, 뉴진스 등 다양한 아이돌들이 참여합니다.',
    thumbnail_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    created_at: '2024-01-15T10:30:00Z',
    creator_name: '음악매니아',
    creator_id: 'user1',
    participants: 15420,
    category: 'celebrity',
    is_public: true,
    likes: 2847,
    comments: 892,
    views: 45230
  },
  {
    id: '2',
    title: '전국 맛집 라면 월드컵',
    description: '전국 각지의 유명한 라면집들이 한자리에! 당신이 가장 좋아하는 라면은?',
    thumbnail_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop',
    created_at: '2024-01-14T15:20:00Z',
    creator_name: '라면왕',
    creator_id: 'user2',
    participants: 8934,
    category: 'food',
    is_public: true,
    likes: 1523,
    comments: 445,
    views: 23450
  },
  {
    id: '3',
    title: '애니메이션 OST 월드컵',
    description: '명작 애니메이션의 감동적인 OST들을 비교해보세요. 지브리부터 최신 애니까지!',
    thumbnail_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    created_at: '2024-01-13T09:15:00Z',
    creator_name: '애니덕후',
    creator_id: 'user3',
    participants: 12567,
    category: 'anime',
    is_public: true,
    likes: 3421,
    comments: 1205,
    views: 34560
  },
  {
    id: '4',
    title: '국내 여행지 월드컵',
    description: '코로나 이후 가장 가고 싶은 국내 여행지는? 제주도부터 강원도까지 전국 명소 대결!',
    thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    created_at: '2024-01-12T14:45:00Z',
    creator_name: '여행러버',
    creator_id: 'user4',
    participants: 6789,
    category: 'travel',
    is_public: true,
    likes: 987,
    comments: 234,
    views: 18900
  },
  {
    id: '5',
    title: '역대 최고 영화 월드컵',
    description: 'IMDb 평점 9점대 영화들의 최종 대결! 당신이 생각하는 최고의 영화는?',
    thumbnail_url: 'https://images.unsplash.com/photo-1489599904472-af35ff2c7c3f?w=400&h=300&fit=crop',
    created_at: '2024-01-11T11:30:00Z',
    creator_name: '영화광',
    creator_id: 'user5',
    participants: 11234,
    category: 'movie',
    is_public: true,
    likes: 2156,
    comments: 678,
    views: 28900
  },
  {
    id: '6',
    title: '게임 캐릭터 월드컵',
    description: '역대 게임 역사상 가장 매력적인 캐릭터는? 마리오부터 최신 게임까지!',
    thumbnail_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
    created_at: '2024-01-10T16:20:00Z',
    creator_name: '게이머',
    creator_id: 'user6',
    participants: 9876,
    category: 'game',
    is_public: true,
    likes: 1789,
    comments: 456,
    views: 22340
  }
];

export default function TournamentGamesAllPage() {
  const [activeTab, setActiveTab] = useState<'popular' | 'new'>('popular');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('participants');
  const [tournaments, setTournaments] = useState(sampleTournaments);
  const [isLoading, setIsLoading] = useState(false);

  // 탭에 따른 데이터 필터링
  const getFilteredTournaments = () => {
    let filtered = [...tournaments];

    // 카테고리 필터
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // 검색 필터
    if (searchQuery.trim()) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 정렬
    if (activeTab === 'popular') {
      filtered.sort((a, b) => b.participants - a.participants);
    } else {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return filtered;
  };

  const filteredTournaments = getFilteredTournaments();

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

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return `${Math.floor(num / 1000)}k`;
    }
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">토너먼트 게임</h1>
                <p className="text-gray-600 mt-1">다양한 주제의 토너먼트를 즐겨보세요</p>
              </div>
              <Link 
                href="/create"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Star className="w-5 h-5" />
                토너먼트 만들기
              </Link>
            </div>

            {/* 탭 네비게이션 */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
              <button
                onClick={() => setActiveTab('popular')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
                  activeTab === 'popular'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                인기 토너먼트
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
                  activeTab === 'new'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Clock className="w-5 h-5" />
                새로운 토너먼트
              </button>
            </div>

            {/* 검색 및 필터 */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* 검색바 */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="토너먼트 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 정렬 옵션 */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
                >
                  <option value="participants">참여자순</option>
                  <option value="likes">좋아요순</option>
                  <option value="comments">댓글순</option>
                  <option value="views">조회수순</option>
                  <option value="created_at">최신순</option>
                </select>
              </div>
            </div>

            {/* 카테고리 필터 */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? `${category.color} text-white shadow-md`
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
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
        {/* 탭 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {activeTab === 'popular' ? (
              <>
                <TrendingUp className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-900">인기 토너먼트</h2>
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                  🔥 HOT
                </span>
              </>
            ) : (
              <>
                <Clock className="w-6 h-6 text-green-500" />
                <h2 className="text-2xl font-bold text-gray-900">새로운 토너먼트</h2>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  ✨ NEW
                </span>
              </>
            )}
          </div>
          <div className="text-sm text-gray-500">
            총 {filteredTournaments.length}개의 토너먼트
          </div>
        </div>

        {/* 토너먼트 그리드 */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTournaments.map((tournament, index) => {
              const isNew = new Date(tournament.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              const isHot = tournament.participants >= 10000;
              const categoryInfo = categories.find(c => c.id === tournament.category);
              
              return (
                <Link href={`/worldcup/${tournament.id}/play`} key={tournament.id} className="group">
                  <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                    <div className="relative h-48">
                      <Image
                        src={tournament.thumbnail_url}
                        alt={tournament.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* 배지들 */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {categoryInfo && (
                          <span className={`${categoryInfo.color} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                            {categoryInfo.icon} {categoryInfo.name}
                          </span>
                        )}
                        {activeTab === 'popular' && index < 3 && (
                          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            👑 TOP {index + 1}
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {isHot && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            🔥 인기
                          </span>
                        )}
                        {isNew && !isHot && (
                          <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            ✨ 신규
                          </span>
                        )}
                      </div>

                      {/* 플레이 버튼 */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-8 h-8 text-blue-600 ml-1" />
                        </div>
                      </div>

                      {/* 하단 그라데이션 */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <div className="flex items-center justify-between text-white text-xs">
                          <div className="flex items-center gap-2">
                            <span className="bg-black/50 px-2 py-1 rounded-full flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {formatNumber(tournament.participants)}
                            </span>
                            <span className="bg-black/50 px-2 py-1 rounded-full flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {formatNumber(tournament.views)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {tournament.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {tournament.description}
                      </p>
                      
                      {/* 통계 정보 */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {formatNumber(tournament.likes)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {formatNumber(tournament.comments)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(tournament.created_at)}</span>
                        </div>
                      </div>

                      {/* 제작자 정보 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-600" />
                          </div>
                          <span className="text-gray-700 text-sm font-medium">{tournament.creator_name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-600 mb-6">다른 검색어나 카테고리를 시도해보세요.</p>
            <button 
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              모든 토너먼트 보기
            </button>
          </div>
        )}

        {/* 더보기 버튼 (무한 스크롤 대신) */}
        {filteredTournaments.length > 0 && (
          <div className="text-center mt-12">
            <button className="bg-white text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors border border-gray-200">
              더 많은 토너먼트 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}