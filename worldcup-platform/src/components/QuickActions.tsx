import { Moon, Sun, Zap, RotateCcw, Bookmark } from 'lucide-react';
import { useState } from 'react';

interface QuickActionsProps {
  onDarkModeToggle?: () => void;
  onQuickPlay?: () => void;
  onClearFilters?: () => void;
  onShowBookmarks?: () => void;
}

export default function QuickActions({ 
  onDarkModeToggle, 
  onQuickPlay, 
  onClearFilters, 
  onShowBookmarks 
}: QuickActionsProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode);
    onDarkModeToggle?.();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col space-y-3">
        {/* Quick Play Button */}
        <button
          onClick={onQuickPlay}
          className="group relative bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          title="랜덤 월드컵 플레이"
        >
          <Zap className="w-5 h-5" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            랜덤 플레이
          </span>
        </button>

        {/* Bookmarks */}
        <button
          onClick={onShowBookmarks}
          className="group relative bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          title="북마크 보기"
        >
          <Bookmark className="w-5 h-5" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            북마크
          </span>
        </button>

        {/* Clear Filters */}
        <button
          onClick={onClearFilters}
          className="group relative bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          title="필터 초기화"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            필터 초기화
          </span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={handleDarkModeToggle}
          className="group relative bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          title="다크모드 전환"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {isDarkMode ? '라이트모드' : '다크모드'}
          </span>
        </button>
      </div>
    </div>
  );
}