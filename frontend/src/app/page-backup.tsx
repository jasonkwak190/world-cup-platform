'use client';

import { useState } from 'react';
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