'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ChevronRight, Star, Sparkles, Clock, Zap, Gift } from 'lucide-react';
import { categories, tournaments, popularTournaments, newTournaments, featuredTournaments } from '../tournament-main-page/data';
import { PlayfulLogo } from '../tournament-logo/components';

export default function TournamentMainPagePlayful() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredTournaments = tournaments.filter(tournament => {
    const matchesCategory = selectedCategory === 'all' || tournament.category === selectedCategory;
    const matchesSearch = tournament.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         tournament.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tournament.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      {/* 헤더 */}
      <header className="bg-white border-b-4 border-purple-400 border-dotted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <PlayfulLogo className="h-12" />
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="#" className="text-purple-600 hover:text-purple-800 px-3 py-2 text-base font-medium rounded-full hover:bg-purple-100 transition-colors">
                🏠 홈
              </Link>
              <Link href="#" className="text-purple-600 hover:text-purple-800 px-3 py-2 text-base font-medium rounded-full hover:bg-purple-100 transition-colors">
                🔥 인기 토너먼트
              </Link>
              <Link href="#" className="text-purple-600 hover:text-purple-800 px-3 py-2 text-base font-medium rounded-full hover:bg-purple-100 transition-colors">
                ✨ 새로운 토너먼트
              </Link>
              <Link href="#" className="text-purple-600 hover:text-purple-800 px-3 py-2 text-base font-medium rounded-full hover:bg-purple-100 transition-colors">
                👤 내 토너먼트
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2 rounded-full text-base font-medium hover:from-purple-600 hover:to-pink-600 transition-colors transform hover:scale-105 duration-200">
                로그인
              </button>
              <button className="bg-white text-purple-600 border-2 border-purple-400 px-5 py-2 rounded-full text-base font-medium hover:bg-purple-100 transition-colors transform hover:scale-105 duration-200">
                회원가입
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden py-16 bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300">
        {/* 배경 장식 요소들 */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white opacity-20 rounded-full"></div>
          <div className="absolute top-40 left-40 w-16 h-16 bg-yellow-300 opacity-30 rounded-full"></div>
          <div className="absolute top-20 right-20 w-24 h-24 bg-pink-300 opacity-30 rounded-full"></div>
          <div className="absolute bottom-10 right-40 w-16 h-16 bg-purple-300 opacity-30 rounded-full"></div>
          <div className="absolute bottom-40 left-20 w-12 h-12 bg-blue-300 opacity-30 rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white drop-shadow-md">
                <span className="block">재미있는</span>
                <span className="block text-yellow-300">월드컵 토너먼트</span>
                <span className="block">함께 즐겨요! 🎮</span>
              </h1>
              <p className="text-lg text-white mb-8">
                친구들과 함께 즐길 수 있는 다양한 주제의 월드컵 토너먼트!
                당신의 최애는 과연 누구일까요? 지금 바로 시작해보세요!
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:bg-yellow-100 transition-colors transform hover:scale-105 duration-200 shadow-lg">
                  ✨ 토너먼트 만들기
                </button>
                <button className="bg-purple-700 text-white px-6 py-3 rounded-full font-bold hover:bg-purple-800 transition-colors transform hover:scale-105 duration-200 shadow-lg">
                  🎮 게임 시작하기
                </button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                {/* 카드 스택 효과 */}
                <div className="absolute transform rotate-[-15deg] translate-x-[-10%] translate-y-[5%] w-64 h-64 bg-white rounded-2xl shadow-xl border-4 border-yellow-300">
                  <div className="w-full h-full rounded-xl overflow-hidden">
                    <Image
                      src={tournaments[0].imageUrl}
                      alt="토너먼트 이미지"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="absolute transform rotate-[5deg] translate-x-[10%] translate-y-[-5%] w-64 h-64 bg-white rounded-2xl shadow-xl border-4 border-pink-300">
                  <div className="w-full h-full rounded-xl overflow-hidden">
                    <Image
                      src={tournaments[1].imageUrl}
                      alt="토너먼트 이미지"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="relative w-64 h-64 bg-white rounded-2xl shadow-xl border-4 border-purple-300 z-10">
                  <div className="w-full h-full rounded-xl overflow-hidden">
                    <Image
                      src={tournaments[2].imageUrl}
                      alt="토너먼트 이미지"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-purple-900/70 to-transparent flex items-end p-4">
                    <p className="text-white font-bold text-lg">최애 아이돌 월드컵</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 transform -translate-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  type="text"
                  placeholder="재미있는 토너먼트 찾기..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 border-2 border-purple-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-purple-800"
                />
              </div>
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 transform hover:scale-105 ${
                      selectedCategory === category.id
                        ? `bg-gradient-to-r from-${category.color.split('-')[1]}-400 to-${category.color.split('-')[1]}-500 text-white shadow-md`
                        : 'bg-white border-2 border-purple-200 text-purple-700 hover:border-purple-300'
                    }`}
                  >
                    <span className="text-lg mr-1">{category.icon}</span> {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 인기 토너먼트 */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-red-400 to-pink-500 w-12 h-12 rounded-full flex items-center justify-center shadow-lg mr-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-purple-900">인기 토너먼트</h2>
            </div>
            <Link href="#" className="text-purple-600 hover:text-purple-800 text-base font-medium flex items-center group">
              더보기 <ChevronRight className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {popularTournaments.map((tournament) => (
              <Link href={`/tournament/${tournament.id}`} key={tournament.id} className="group">
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow border-2 border-purple-100 transform group-hover:scale-[1.02] duration-200">
                  <div className="relative h-52">
                    <Image
                      src={tournament.imageUrl}
                      alt={tournament.title}
                      fill
                      className="object-cover"
                    />
                    {tournament.isHot && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                        🔥 인기 폭발
                      </div>
                    )}
                    {tournament.isNew && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                        ✨ 신규 등록
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-900/80 to-transparent p-4">
                      <div className="flex items-center text-white text-xs">
                        <span className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full mr-2 font-bold">
                          {tournament.participants}강
                        </span>
                        <span className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full font-bold">
                          {tournament.plays.toLocaleString()}회 플레이
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-purple-900 mb-2 line-clamp-1">{tournament.title}</h3>
                    <p className="text-purple-700 text-sm mb-4 line-clamp-2">{tournament.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img
                          src={tournament.creator.avatar}
                          alt={tournament.creator.name}
                          className="w-8 h-8 rounded-full border-2 border-purple-200 mr-2"
                        />
                        <span className="text-purple-800 text-sm font-medium">{tournament.creator.name}</span>
                      </div>
                      <div className="flex items-center text-xs text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{tournament.createdAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 새로운 토너먼트 */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-green-400 to-teal-500 w-12 h-12 rounded-full flex items-center justify-center shadow-lg mr-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-purple-900">새로운 토너먼트</h2>
            </div>
            <Link href="#" className="text-purple-600 hover:text-purple-800 text-base font-medium flex items-center group">
              더보기 <ChevronRight className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {newTournaments.map((tournament) => (
              <Link href={`/tournament/${tournament.id}`} key={tournament.id} className="group">
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow border-2 border-green-100 transform group-hover:scale-[1.02] duration-200">
                  <div className="relative h-52">
                    <Image
                      src={tournament.imageUrl}
                      alt={tournament.title}
                      fill
                      className="object-cover"
                    />
                    {tournament.isHot && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                        🔥 인기 폭발
                      </div>
                    )}
                    {tournament.isNew && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                        ✨ 신규 등록
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-900/80 to-transparent p-4">
                      <div className="flex items-center text-white text-xs">
                        <span className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full mr-2 font-bold">
                          {tournament.participants}강
                        </span>
                        <span className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full font-bold">
                          {tournament.plays.toLocaleString()}회 플레이
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center mb-2">
                      <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full mr-2">NEW</span>
                      <h3 className="text-xl font-bold text-purple-900 line-clamp-1">{tournament.title}</h3>
                    </div>
                    <p className="text-purple-700 text-sm mb-4 line-clamp-2">{tournament.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img
                          src={tournament.creator.avatar}
                          alt={tournament.creator.name}
                          className="w-8 h-8 rounded-full border-2 border-green-200 mr-2"
                        />
                        <span className="text-purple-800 text-sm font-medium">{tournament.creator.name}</span>
                      </div>
                      <div className="flex items-center text-xs text-green-600 bg-green-100 px-3 py-1 rounded-full">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{tournament.createdAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 카테고리별 토너먼트 */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-purple-400 to-indigo-500 w-12 h-12 rounded-full flex items-center justify-center shadow-lg mr-4">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-purple-900">
                {selectedCategory === 'all' ? '모든 토너먼트' : `${categories.find(c => c.id === selectedCategory)?.name} 토너먼트`}
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <select className="bg-white border-2 border-purple-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 text-purple-800">
                <option>최신순</option>
                <option>인기순</option>
                <option>참여자순</option>
              </select>
            </div>
          </div>
          
          {filteredTournaments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredTournaments.map((tournament) => (
                <Link href={`/tournament/${tournament.id}`} key={tournament.id} className="group">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow border-2 border-purple-100 transform group-hover:scale-[1.02] duration-200">
                    <div className="relative h-52">
                      <Image
                        src={tournament.imageUrl}
                        alt={tournament.title}
                        fill
                        className="object-cover"
                      />
                      {tournament.isHot && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                          🔥 인기 폭발
                        </div>
                      )}
                      {tournament.isNew && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                          ✨ 신규 등록
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-900/80 to-transparent p-4">
                        <div className="flex items-center text-white text-xs">
                          <span className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full mr-2 font-bold">
                            {tournament.participants}강
                          </span>
                          <span className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full font-bold">
                            {tournament.plays.toLocaleString()}회 플레이
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {tournament.tags.map((tag, idx) => (
                          <span key={idx} className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-xl font-bold text-purple-900 mb-2 line-clamp-1">{tournament.title}</h3>
                      <p className="text-purple-700 text-sm mb-4 line-clamp-2">{tournament.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <img
                            src={tournament.creator.avatar}
                            alt={tournament.creator.name}
                            className="w-8 h-8 rounded-full border-2 border-purple-200 mr-2"
                          />
                          <span className="text-purple-800 text-sm font-medium">{tournament.creator.name}</span>
                        </div>
                        <div className="flex items-center text-xs text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{tournament.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl shadow-md border-2 border-purple-100">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10 text-purple-400" />
              </div>
              <p className="text-purple-800 text-lg mb-4">검색 결과가 없습니다.</p>
              <button 
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="text-white bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-full font-bold hover:from-purple-600 hover:to-pink-600 transition-colors"
              >
                모든 토너먼트 보기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 토너먼트 만들기 CTA */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-400 py-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-8 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="md:w-2/3">
                <h2 className="text-3xl font-bold text-white mb-4">나만의 토너먼트를 만들어보세요! 🎉</h2>
                <p className="text-white text-lg mb-6">
                  친구들과 함께 즐길 수 있는 재미있는 월드컵 토너먼트를 직접 만들어보세요.
                  당신의 창의력으로 모두가 즐길 수 있는 게임을 만들 수 있어요!
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:bg-yellow-100 transition-colors transform hover:scale-105 duration-200 shadow-lg">
                    ✨ 토너먼트 만들기
                  </button>
                  <button className="bg-purple-800 text-white px-6 py-3 rounded-full font-bold hover:bg-purple-900 transition-colors transform hover:scale-105 duration-200 shadow-lg">
                    📝 가이드 보기
                  </button>
                </div>
              </div>
              <div className="hidden md:block md:w-1/3">
                <div className="relative">
                  <div className="absolute -top-6 -left-6 w-24 h-24 bg-yellow-300 opacity-50 rounded-full"></div>
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-pink-300 opacity-50 rounded-full"></div>
                  <div className="relative z-10 bg-white p-6 rounded-2xl shadow-xl transform rotate-3">
                    <div className="flex items-center mb-4">
                      <Gift className="h-8 w-8 text-purple-500 mr-2" />
                      <h3 className="text-xl font-bold text-purple-900">특별 혜택</h3>
                    </div>
                    <ul className="space-y-2 text-purple-800">
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span> 무제한 토너먼트 생성
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span> 커스텀 디자인 옵션
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span> 결과 통계 제공
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span> 소셜 미디어 공유
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="bg-purple-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <PlayfulLogo className="h-10 mb-4" />
              <p className="text-purple-200 text-sm">
                재미있는 월드컵 토너먼트를 만들고 즐기는 공간입니다.
                친구들과 함께 최애를 뽑아보세요!
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-yellow-300">서비스</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-purple-200 hover:text-white text-sm hover:underline">토너먼트 만들기</Link></li>
                <li><Link href="#" className="text-purple-200 hover:text-white text-sm hover:underline">인기 토너먼트</Link></li>
                <li><Link href="#" className="text-purple-200 hover:text-white text-sm hover:underline">새로운 토너먼트</Link></li>
                <li><Link href="#" className="text-purple-200 hover:text-white text-sm hover:underline">카테고리</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-yellow-300">정보</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-purple-200 hover:text-white text-sm hover:underline">이용약관</Link></li>
                <li><Link href="#" className="text-purple-200 hover:text-white text-sm hover:underline">개인정보처리방침</Link></li>
                <li><Link href="#" className="text-purple-200 hover:text-white text-sm hover:underline">FAQ</Link></li>
                <li><Link href="#" className="text-purple-200 hover:text-white text-sm hover:underline">문의하기</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-yellow-300">소셜 미디어</h3>
              <div className="flex space-x-4">
                <Link href="#" className="bg-purple-800 hover:bg-purple-700 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link href="#" className="bg-purple-800 hover:bg-purple-700 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link href="#" className="bg-purple-800 hover:bg-purple-700 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2 text-yellow-300">뉴스레터 구독</h4>
                <div className="flex mt-2">
                  <input 
                    type="email" 
                    placeholder="이메일 주소" 
                    className="bg-purple-800 text-white placeholder-purple-300 px-4 py-2 rounded-l-full focus:outline-none focus:ring-2 focus:ring-yellow-300 border-none"
                  />
                  <button className="bg-yellow-400 text-purple-900 px-4 py-2 rounded-r-full font-medium hover:bg-yellow-300 transition-colors">
                    구독
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-purple-800 text-center">
            <p className="text-purple-300 text-sm">© 2025 월드컵 토너먼트. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}