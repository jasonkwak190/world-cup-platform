import { MessageCircle, Clock, Star } from 'lucide-react';

const recentComments = [
  {
    id: 1,
    author: '혹백 오리사이에 나온 먹고 싶은 음식',
    content: '와우 웹사이트',
    time: '방금 전',
    worldcup: '포켓몬 4세대 bgm 이상형 월드컵',
    isRecommended: false,
  },
  {
    id: 2,
    author: '따봉',
    content: '나름 월드컵',
    time: '1분 전',
    worldcup: '포켓몬 4세대 bgm 이상형 월드컵',
    isRecommended: false,
  },
  {
    id: 3,
    author: '세븐틴의 안나에서 살짝 아서 찾아서 ㅋㅋㅋㅋ',
    content: '⭐ 브로스타즈 브롤러 대결 월드컵 2025 ⭐',
    time: '2분 전',
    worldcup: '스파이크 스파이크 스파이크 스파이크 스파이크 스파이크 스파이크 스파이크 스파이크 하는 사람 나',
    isRecommended: true,
  },
  {
    id: 4,
    author: '⭐ 브로스타즈 브롤러 대결 월드컵 2025 ⭐',
    content: '스파이크 스파이크 스파이크 스파이크 스파이크 스파이크 스파이크 스파이크 스파이크 하는 사람 나',
    time: '3분 전',
    worldcup: '브로스타즈 브롤러 대결 월드컵 2025',
    isRecommended: true,
  },
];

export default function RecentComments() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-purple-600" />
        <h2 className="text-lg font-bold text-gray-900">최근 댓글</h2>
      </div>
      <div className="text-sm text-gray-500 mb-4">
        다른 사용자들의 생각을 확인해보세요
      </div>
      
      <div className="space-y-4">
        {recentComments.map((comment) => (
          <div
            key={comment.id}
            className="p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group border-l-2 border-transparent hover:border-purple-200"
          >
            {/* Author & Time */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-purple-600 truncate max-w-32">
                  {comment.author}
                </span>
                {comment.isRecommended && (
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{comment.time}</span>
              </div>
            </div>

            {/* Comment Content */}
            <p className="text-sm text-gray-700 mb-2 line-clamp-2">
              {comment.content}
            </p>

            {/* WorldCup Reference */}
            <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 inline-block max-w-full truncate">
              📋 {comment.worldcup}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t">
        <button className="w-full text-sm text-purple-600 hover:text-purple-700 font-medium">
          모든 댓글 보기 →
        </button>
      </div>
    </div>
  );
}