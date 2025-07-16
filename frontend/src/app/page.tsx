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
import { getUserWorldCups } from '@/lib/api/worldcups';
import { useAuth } from '@/contexts/AuthContext';
import { useStats } from '@/hooks/useStats';

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
  const totalPages = stats?.totalPages || 1; // Dynamic total pages from stats

  // 카테고리별 월드컵 개수 계산
  useEffect(() => {
    const calculateCategoryCounts = async () => {
      try {
        // 캐시에서 먼저 확인 (클라이언트에서만)
        let allWorldCups = [];
        
        // useEffect 안에서도 안전하게 처리
        try {
          const cached = sessionStorage.getItem('worldcups_cache');
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const now = Date.now();
            if (now - timestamp < 300000) { // 5분 캐시로 연장
              allWorldCups = data;
            }
          }
        } catch (storageError) {
          console.warn('Cache access failed:', storageError);
        }
        
        // 캐시가 없거나 만료된 경우 새로 로드
        if (allWorldCups.length === 0) {
          console.log('💾 Loading fresh data from sources...');
          
          // 타임아웃으로 각 소스를 제한
          const timeoutPromise = (ms: number) => new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Data loading timeout')), ms)
          );
          
          // Map frontend sortBy to API format
          const { sortBy: apiSortBy, sortOrder: apiSortOrder } = mapSortByToAPI('popular'); // Default to popular for category counts
          const pageApiUrl = `/api/worldcups?offset=0&limit=12&sortBy=${apiSortBy}&sortOrder=${apiSortOrder}`;
          console.log('🔗 [PAGE.TSX] API URL:', pageApiUrl);
          console.log('🔗 [PAGE.TSX] mapSortByToAPI result:', { apiSortBy, apiSortOrder });
          
          const [apiWorldCups, localWorldCups] = await Promise.allSettled([
            Promise.race([
              fetch(pageApiUrl)
                .then(async res => {
                  if (!res.ok) {
                    console.error('❌ Page.tsx API request failed:', {
                      url: pageApiUrl,
                      status: res.status,
                      statusText: res.statusText
                    });
                    const errorText = await res.text();
                    console.error('❌ Page.tsx Error response body:', errorText);
                    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
                  }
                  return res.json();
                })
                .then(result => result.worldcups || []),
              timeoutPromise(10000)
            ]),
            Promise.race([Promise.resolve(getStoredWorldCups()), timeoutPromise(3000)])
          ]);
          
          // 결과 처리
          const apiData = apiWorldCups.status === 'fulfilled' ? apiWorldCups.value as any[] : [];
          const localData = localWorldCups.status === 'fulfilled' ? localWorldCups.value as any[] : [];
          
          if (apiWorldCups.status === 'rejected') {
            console.warn('⚠️ API data loading failed:', apiWorldCups.reason);
            
            // 타임아웃 발생 시 로컬 데이터만 사용하고 계속 진행
            if ((apiWorldCups.reason as Error)?.message === 'Data loading timeout') {
              console.log('⚠️ API 타임아웃 발생, 로컬 데이터만 사용합니다.');
            }
          }
          if (localWorldCups.status === 'rejected') {
            console.warn('⚠️ Local data loading failed:', localWorldCups.reason);
          }
          
          console.log(`📊 Data loaded - API: ${apiData.length}, Local: ${localData.length}`);
          
          // 중복 제거
          const worldCupMap = new Map();
          apiData.forEach((wc: any) => worldCupMap.set(wc.id, wc));
          localData.forEach((wc: any) => {
            if (!worldCupMap.has(wc.id)) {
              worldCupMap.set(wc.id, wc);
            }
          });
          
          allWorldCups = Array.from(worldCupMap.values());
          
          // 캐시에 저장 (이미 useEffect 안이므로 클라이언트에서만 실행됨)
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
        
        allWorldCups.forEach((worldcup: any) => {
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