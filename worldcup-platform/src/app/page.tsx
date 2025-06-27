'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import Header from '@/components/Header';
import CategoryFilter from '@/components/CategoryFilter';
import WorldCupGrid from '@/components/WorldCupGrid';
import TrendingRanking from '@/components/TrendingRanking';
import RecentComments from '@/components/RecentComments';
import Pagination from '@/components/Pagination';
import QuickActions from '@/components/QuickActions';
import { getStoredWorldCups } from '@/utils/storage';
import { getWorldCups as getSupabaseWorldCups } from '@/utils/supabaseData';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryCounts, setCategoryCounts] = useState<{ [key: string]: number }>({});
  const totalPages = 16; // Mock total pages

  // 카테고리별 월드컵 개수 계산
  useEffect(() => {
    const calculateCategoryCounts = async () => {
      try {
        // 캐시에서 먼저 확인
        const cached = sessionStorage.getItem('worldcups_cache');
        let allWorldCups = [];
        
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 60000) { // 1분 캐시
            allWorldCups = data;
          }
        }
        
        // 캐시가 없거나 만료된 경우 새로 로드
        if (allWorldCups.length === 0) {
          const [supabaseWorldCups, localWorldCups] = await Promise.all([
            getSupabaseWorldCups(),
            Promise.resolve(getStoredWorldCups())
          ]);
          
          // 중복 제거
          const worldCupMap = new Map();
          supabaseWorldCups.forEach(wc => worldCupMap.set(wc.id, wc));
          localWorldCups.forEach(wc => {
            if (!worldCupMap.has(wc.id)) {
              worldCupMap.set(wc.id, wc);
            }
          });
          
          allWorldCups = Array.from(worldCupMap.values());
        }
        
        // 카테고리별 개수 계산
        const counts: { [key: string]: number } = {
          all: allWorldCups.length,
        };
        
        allWorldCups.forEach(worldcup => {
          const category = worldcup.category || 'entertainment';
          counts[category] = (counts[category] || 0) + 1;
        });
        
        console.log('📊 Category counts calculated:', counts);
        setCategoryCounts(counts);
        
      } catch (error) {
        console.error('Failed to calculate category counts:', error);
        // 에러 발생시 기본값 설정
        setCategoryCounts({ all: 0 });
      }
    };

    calculateCategoryCounts();
  }, []);

  // 데이터 초기화 시에만 localStorage 정리 (주석 처리)
  // React.useEffect(() => {
  //   const cleanupLocalStorage = () => {
  //     try {
  //       console.log('🧹 Cleaning up localStorage worldcup data...');
  //       localStorage.removeItem('worldcups');
  //       localStorage.removeItem('currentUser');
  //       console.log('✅ localStorage cleaned up - now using Supabase only');
  //     } catch (error) {
  //       console.error('Error cleaning localStorage:', error);
  //     }
  //   };
    
  //   cleanupLocalStorage();
  // }, []);

  const handleQuickPlay = () => {
    // TODO: Implement random worldcup selection
    console.log('Random play initiated');
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedSort('popular');
    setCurrentPage(1);
  };

  const handleShowBookmarks = () => {
    // TODO: Show bookmarked worldcups
    console.log('Show bookmarks');
  };

  const handleDarkModeToggle = () => {
    // TODO: Implement dark mode
    console.log('Dark mode toggled');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <CategoryFilter
        selectedCategory={selectedCategory}
        selectedSort={selectedSort}
        onCategoryChange={setSelectedCategory}
        onSortChange={setSelectedSort}
        categoryCounts={categoryCounts}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <WorldCupGrid category={selectedCategory} sortBy={selectedSort} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
          
          {/* Sidebar */}
          <div className="w-80 space-y-6">
            <TrendingRanking />
            <RecentComments />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions
        onQuickPlay={handleQuickPlay}
        onClearFilters={handleClearFilters}
        onShowBookmarks={handleShowBookmarks}
        onDarkModeToggle={handleDarkModeToggle}
      />
    </div>
  );
}