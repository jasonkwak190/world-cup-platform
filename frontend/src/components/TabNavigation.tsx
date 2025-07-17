'use client';

import { Trophy, BookmarkCheck } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  createdCount: number;
  bookmarkedCount: number;
  tabTypes: Record<string, string>;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  createdCount,
  bookmarkedCount,
  tabTypes
}) => {
  const tabs = [
    {
      id: tabTypes.CREATED,
      label: '내가 만든 월드컵',
      icon: Trophy,
      count: createdCount
    },
    {
      id: tabTypes.BOOKMARKED,
      label: '북마크한 월드컵',
      icon: BookmarkCheck,
      count: bookmarkedCount
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {count}
                </span>
              </div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation;