'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import Header from '@/components/Header';
import CategoryFilter from '@/components/CategoryFilter';
import WorldCupGrid from '@/components/WorldCupGrid';
import TrendingRanking from '@/components/TrendingRanking';
import RecentComments from '@/components/RecentComments';
import Pagination from '@/components/Pagination';
import { getStoredWorldCups } from '@/utils/storage';
import { getWorldCups as getSupabaseWorldCups, getUserWorldCups } from '@/utils/supabaseData';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryCounts, setCategoryCounts] = useState<{ [key: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [userWorldCupCount, setUserWorldCupCount] = useState(0);
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
          console.log('💾 Loading fresh data from sources...');
          
          // 타임아웃으로 각 소스를 제한
          const timeoutPromise = (ms: number) => new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Data loading timeout')), ms)
          );
          
          const [supabaseWorldCups, localWorldCups] = await Promise.allSettled([
            Promise.race([getSupabaseWorldCups(), timeoutPromise(10000)]),
            Promise.race([Promise.resolve(getStoredWorldCups()), timeoutPromise(5000)])
          ]);
          
          // 결과 처리
          const supabaseData = supabaseWorldCups.status === 'fulfilled' ? supabaseWorldCups.value : [];
          const localData = localWorldCups.status === 'fulfilled' ? localWorldCups.value : [];
          
          if (supabaseWorldCups.status === 'rejected') {
            console.warn('⚠️ Supabase data loading failed:', supabaseWorldCups.reason);
            
            // 타임아웃으로 실패한 경우 자동 새로고침
            if (supabaseWorldCups.reason?.message === 'Data loading timeout') {
              console.log('🔄 10초 타임아웃 발생, 3초 후 자동 새로고침...');
              setTimeout(() => {
                window.location.reload();
              }, 3000);
              return;
            }
          }
          if (localWorldCups.status === 'rejected') {
            console.warn('⚠️ Local data loading failed:', localWorldCups.reason);
          }
          
          console.log(`📊 Data loaded - Supabase: ${supabaseData.length}, Local: ${localData.length}`);
          
          // 중복 제거
          const worldCupMap = new Map();
          supabaseData.forEach(wc => worldCupMap.set(wc.id, wc));
          localData.forEach(wc => {
            if (!worldCupMap.has(wc.id)) {
              worldCupMap.set(wc.id, wc);
            }
          });
          
          allWorldCups = Array.from(worldCupMap.values());
          
          // 캐시에 저장
          try {
            sessionStorage.setItem('worldcups_cache', JSON.stringify({
              data: allWorldCups,
              timestamp: Date.now()
            }));
          } catch (error) {
            console.warn('⚠️ Failed to cache data:', error);
          }
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

  // 사용자 월드컵 개수 가져오기
  useEffect(() => {
    const loadUserWorldCupCount = async () => {
      if (user && user.id) {
        try {
          const userWorldCups = await getUserWorldCups(user.id);
          setUserWorldCupCount(userWorldCups.length);
        } catch (error) {
          console.error('Failed to load user worldcup count:', error);
        }
      } else {
        setUserWorldCupCount(0);
      }
    };

    loadUserWorldCupCount();
  }, [user]);

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

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // 첫 페이지로 리셋
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        searchQuery={searchQuery} 
        onSearchChange={handleSearchChange} 
        userWorldCupCount={userWorldCupCount}
      />
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
            <WorldCupGrid category={selectedCategory} sortBy={selectedSort} searchQuery={searchQuery} />
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
    </div>
  );
}