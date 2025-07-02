import { TrendingUp, Crown, Users } from 'lucide-react';

const trendingData = [
  {
    rank: 1,
    title: 'o s) 여자 사람 월드컵',
    participants: 1687,
    isHot: true,
  },
  {
    rank: 2,
    title: '이상형 월드컵 이브라히 브라힌체 최강자 레전드',
    participants: 2791,
    isHot: true,
  },
  {
    rank: 3,
    title: '여자배우 응원 월드컵',
    participants: 4268,
    isRising: true,
  },
  {
    rank: 4,
    title: '최강 어신 컬기 인방 여질 월드컵',
    participants: 6852,
    isRising: true,
  },
  {
    rank: 5,
    title: '대한민국 최고의 과자 월드컵',
    participants: 400,
    isNew: true,
  },
  {
    rank: 6,
    title: '당신의 최애국은? 2024 게이밍 월드컵',
    participants: 4404,
    isNew: true,
  },
];

export default function TrendingRanking() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-bold text-gray-900">지금 인기 있는 월드컵</h2>
      </div>
      <div className="text-sm text-gray-500 mb-4">
        최근 24시간 동안 가장 많이 플레이한 월드컵입니다
      </div>
      
      <div className="space-y-3">
        {trendingData.map((item) => (
          <div
            key={item.rank}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
          >
            {/* Rank */}
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
              {item.rank <= 3 ? (
                <Crown className={`w-5 h-5 ${
                  item.rank === 1 ? 'text-yellow-500' :
                  item.rank === 2 ? 'text-gray-400' :
                  'text-amber-600'
                }`} />
              ) : (
                <span className="text-lg font-bold text-blue-600">{item.rank}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {item.isHot && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                    HOT
                  </span>
                )}
                {item.isRising && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                    상승
                  </span>
                )}
                {item.isNew && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    NEW
                  </span>
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {item.title}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <Users className="w-3 h-3" />
                <span>총 {item.participants.toLocaleString()}회 진행</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t">
        <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
          더 많은 인기 월드컵 보기 →
        </button>
      </div>
    </div>
  );
}