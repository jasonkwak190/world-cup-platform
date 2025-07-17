'use client';

import { Trophy, Heart, User, BookmarkCheck } from 'lucide-react';

interface StatsDashboardProps {
  createdCount: number;
  totalLikes: number;
  totalParticipants: number;
  bookmarkedCount: number;
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({
  createdCount,
  totalLikes,
  totalParticipants,
  bookmarkedCount
}) => {
  const stats = [
    {
      icon: Trophy,
      label: '제작한 월드컵',
      value: createdCount,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      icon: Heart,
      label: '총 좋아요',
      value: totalLikes,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      icon: User,
      label: '총 참여자',
      value: totalParticipants,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      icon: BookmarkCheck,
      label: '북마크',
      value: bookmarkedCount,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {stats.map(({ icon: Icon, label, value, bgColor, iconColor }, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className={`p-2 ${bgColor} rounded-lg`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsDashboard;