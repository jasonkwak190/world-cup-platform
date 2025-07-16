'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ChevronRight, TrendingUp, Clock, Plus } from 'lucide-react';
import { categories, tournaments, popularTournaments, newTournaments } from '../tournament-main-page/data';
import { MinimalistLogo } from '../tournament-logo/components';

export default function TournamentMainPageMinimal() {
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
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MinimalistLogo className="h-6" />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                홈
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                인기 토너먼트
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                새로운 토너먼트
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                내 토너먼트
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-900 px-4 py-2 text-sm font-medium hover:text-gray-600 transition-colors">
                로그인
              </button>
              <button className="bg-gray-900 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-gray-700 transition-colors">
                회원가입
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-normal text-gray-900 mb-4">월드컵 토너먼트</h1>
            <p className="text-lg text-gray-600 mb-8">
              다양한 주제의 월드컵 토너먼트를 즐기고, 나만의 토너먼트를 만들어보세요.
            </p>
            <div className="flex space-x-4">
              <button className="bg-gray-900 text-white px-5 py-2 rounded-sm font-medium hover:bg-gray-800 transition-colors">
                토너먼트 만들기
              </button>
              <button className="bg-white text-gray-900 border border-gray-300 px-5 py-2 rounded-sm font-medium hover:bg-gray-50 transition-colors">
                인기 토너먼트 보기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="py-8 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              />
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 rounded-sm text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 인기 토너먼트 */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-gray-900 mr-2" />
              <h2 className="text-xl font-medium text-gray-900">인기 토너먼트</h2>
            </div>
            <Link href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center">
              더보기 <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularTournaments.map((tournament) => (
              <Link href={`/tournament/${tournament.id}`} key={tournament.id} className="group">
                <div className="bg-white overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="relative h-40">
                    <Image
                      src={tournament.imageUrl}
                      alt={tournament.title}
                      fill
                      className="object-cover"
                    />
                    {tournament.isHot && (
                      <div className="absolute top-2 right-2 bg-gray-900 text-white text-xs font-medium px-2 py-1">
                        인기
                      </div>
                    )}
                    {tournament.isNew && (
                      <div className="absolute top-2 right-2 bg-gray-900 text-white text-xs font-medium px-2 py-1">
                        신규
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-medium text-gray-900 mb-1 line-clamp-1">{tournament.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{tournament.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img
                          src={tournament.creator.avatar}
                          alt={tournament.creator.name}
                          className="w-5 h-5 rounded-full mr-2"
                        />
                        <span className="text-gray-700 text-xs">{tournament.creator.name}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
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
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-900 mr-2" />
              <h2 className="text-xl font-medium text-gray-900">새로운 토너먼트</h2>
            </div>
            <Link href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center">
              더보기 <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newTournaments.map((tournament) => (
              <Link href={`/tournament/${tournament.id}`} key={tournament.id} className="group">
                <div className="bg-white overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="relative h-40">
                    <Image
                      src={tournament.imageUrl}
                      alt={tournament.title}
                      fill
                      className="object-cover"
                    />
                    {tournament.isHot && (
                      <div className="absolute top-2 right-2 bg-gray-900 text-white text-xs font-medium px-2 py-1">
                        인기
                      </div>
                    )}
                    {tournament.isNew && (
                      <div className="absolute top-2 right-2 bg-gray-900 text-white text-xs font-medium px-2 py-1">
                        신규
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-medium text-gray-900 mb-1 line-clamp-1">{tournament.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{tournament.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img
                          src={tournament.creator.avatar}
                          alt={tournament.creator.name}
                          className="w-5 h-5 rounded-full mr-2"
                        />
                        <span className="text-gray-700 text-xs">{tournament.creator.name}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-gray-900">
              {selectedCategory === 'all' ? '모든 토너먼트' : `${categories.find(c => c.id === selectedCategory)?.name} 토너먼트`}
            </h2>
            <div className="flex items-center space-x-2">
              <select className="bg-white border border-gray-300 rounded-sm px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900">
                <option>최신순</option>
                <option>인기순</option>
                <option>참여자순</option>
              </select>
            </div>
          </div>
          
          {filteredTournaments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredTournaments.map((tournament) => (
                <Link href={`/tournament/${tournament.id}`} key={tournament.id} className="group">
                  <div className="bg-white overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="relative h-40">
                      <Image
                        src={tournament.imageUrl}
                        alt={tournament.title}
                        fill
                        className="object-cover"
                      />
                      {tournament.isHot && (
                        <div className="absolute top-2 right-2 bg-gray-900 text-white text-xs font-medium px-2 py-1">
                          인기
                        </div>
                      )}
                      {tournament.isNew && (
                        <div className="absolute top-2 right-2 bg-gray-900 text-white text-xs font-medium px-2 py-1">
                          신규
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {tournament.tags.map((tag, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-base font-medium text-gray-900 mb-1 line-clamp-1">{tournament.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{tournament.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <img
                            src={tournament.creator.avatar}
                            alt={tournament.creator.name}
                            className="w-5 h-5 rounded-full mr-2"
                          />
                          <span className="text-gray-700 text-xs">{tournament.creator.name}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
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
            <div className="text-center py-12 bg-gray-50 border border-gray-200">
              <p className="text-gray-500 mb-4">검색 결과가 없습니다.</p>
              <button 
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="text-gray-900 hover:text-gray-700 font-medium"
              >
                모든 토너먼트 보기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 토너먼트 만들기 CTA */}
      <div className="bg-gray-50 py-12 border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-xl font-medium text-gray-900 mb-2">나만의 토너먼트를 만들어보세요</h2>
              <p className="text-gray-600">
                원하는 주제로 직접 월드컵 토너먼트를 만들고 친구들과 공유해보세요.
              </p>
            </div>
            <div>
              <button className="bg-gray-900 text-white px-5 py-2 rounded-sm font-medium hover:bg-gray-800 transition-colors flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                토너먼트 만들기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="bg-white text-gray-600 py-12 border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <MinimalistLogo className="h-6 mb-4" />
              <p className="text-gray-500 text-sm">
                재미있는 월드컵 토너먼트를 만들고 즐기는 공간입니다.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">서비스</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-500 hover:text-gray-900 text-sm">토너먼트 만들기</Link></li>
                <li><Link href="#" className="text-gray-500 hover:text-gray-900 text-sm">인기 토너먼트</Link></li>
                <li><Link href="#" className="text-gray-500 hover:text-gray-900 text-sm">새로운 토너먼트</Link></li>
                <li><Link href="#" className="text-gray-500 hover:text-gray-900 text-sm">카테고리</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">정보</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-500 hover:text-gray-900 text-sm">이용약관</Link></li>
                <li><Link href="#" className="text-gray-500 hover:text-gray-900 text-sm">개인정보처리방침</Link></li>
                <li><Link href="#" className="text-gray-500 hover:text-gray-900 text-sm">FAQ</Link></li>
                <li><Link href="#" className="text-gray-500 hover:text-gray-900 text-sm">문의하기</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">소셜 미디어</h3>
              <div className="flex space-x-4">
                <Link href="#" className="text-gray-400 hover:text-gray-900">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link href="#" className="text-gray-400 hover:text-gray-900">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link href="#" className="text-gray-400 hover:text-gray-900">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-400 text-sm">© 2023 월드컵 토너먼트. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}