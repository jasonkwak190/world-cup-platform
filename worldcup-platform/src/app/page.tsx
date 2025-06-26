'use client';

import { useState } from 'react';
import React from 'react';
import Header from '@/components/Header';
import CategoryFilter from '@/components/CategoryFilter';
import WorldCupGrid from '@/components/WorldCupGrid';
import TrendingRanking from '@/components/TrendingRanking';
import RecentComments from '@/components/RecentComments';
import Pagination from '@/components/Pagination';
import QuickActions from '@/components/QuickActions';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 16; // Mock total pages

  // 디버그: localStorage 데이터 확인
  React.useEffect(() => {
    const checkStoredData = () => {
      try {
        const stored = localStorage.getItem('worldcups');
        console.log('=== HomePage localStorage Debug ===');
        console.log('Raw stored data exists:', !!stored);
        console.log('Raw data preview:', stored?.substring(0, 200) + '...');
        
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('Parsed worldcups count:', parsed.length);
          console.log('Full parsed data:', parsed);
          
          parsed.forEach((wc: any, index: number) => {
            console.log(`🔍 Worldcup ${index} COMPLETE ANALYSIS:`, {
              id: wc.id,
              title: wc.title,
              description: wc.description,
              hasThumbnail: !!wc.thumbnail,
              thumbnailType: typeof wc.thumbnail,
              thumbnailLength: wc.thumbnail?.length || 0,
              thumbnailStartsWithData: wc.thumbnail?.startsWith('data:'),
              thumbnailPreview: wc.thumbnail?.substring(0, 100) + '...',
              isValidBase64: wc.thumbnail?.startsWith('data:image/') && wc.thumbnail?.split(',')[1]?.length > 100,
              itemsCount: wc.items?.length || 0
            });
            
            // 썸네일 상태별 진단
            if (!wc.thumbnail) {
              console.log(`❌ Worldcup ${index} "${wc.title}": NO THUMBNAIL DATA`);
            } else if (wc.thumbnail.length < 100) {
              console.log(`⚠️ Worldcup ${index} "${wc.title}": THUMBNAIL TOO SHORT (${wc.thumbnail.length} chars)`);
            } else if (!wc.thumbnail.startsWith('data:image/')) {
              console.log(`⚠️ Worldcup ${index} "${wc.title}": THUMBNAIL NOT BASE64 FORMAT`);
            } else {
              console.log(`✅ Worldcup ${index} "${wc.title}": THUMBNAIL LOOKS VALID (${wc.thumbnail.length} chars)`);
            }
          });
        } else {
          console.log('No stored worldcups found');
        }
        console.log('=== End HomePage Debug ===');
      } catch (error) {
        console.error('Error checking stored data:', error);
        console.log('Raw localStorage content:', localStorage.getItem('worldcups'));
      }
    };
    
    checkStoredData();
    
    // 페이지 포커스 시에도 다시 확인
    window.addEventListener('focus', checkStoredData);
    return () => window.removeEventListener('focus', checkStoredData);
  }, []);

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