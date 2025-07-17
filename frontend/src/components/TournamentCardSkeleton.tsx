'use client';

import { useTheme } from '@/contexts/ThemeContext';

const TournamentCardSkeleton: React.FC = () => {
  const { getThemeClass } = useTheme();

  return (
    <div className={`${getThemeClass('surface')} ${getThemeClass('card')} animate-pulse`}>
      <div className="h-48 bg-gray-300"></div>
      <div className="p-4">
        <div className="h-4 bg-gray-300 rounded mb-2"></div>
        <div className="h-3 bg-gray-300 rounded mb-3"></div>
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 bg-gray-300 rounded w-20"></div>
          <div className="h-3 bg-gray-300 rounded w-16"></div>
        </div>
        <div className="flex gap-2 mt-3">
          <div className="flex-1 h-8 bg-gray-300 rounded-lg"></div>
          <div className="flex-1 h-8 bg-gray-300 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default TournamentCardSkeleton;