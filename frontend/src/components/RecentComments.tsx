import { MessageCircle, Clock, Star, AlertCircle } from 'lucide-react';
import { useRecentComments } from '@/hooks/useRecentComments';

export default function RecentComments() {
  const { data: recentComments, loading, error } = useRecentComments();

  if (loading) {
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
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg animate-pulse">
              <div className="flex justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-bold text-gray-900">최근 댓글</h2>
        </div>
        <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-800">댓글을 불러오는 중 오류가 발생했습니다.</span>
        </div>
      </div>
    );
  }

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
                  {comment.author_name}
                </span>
                {comment.isRecommended && (
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{comment.time_ago}</span>
              </div>
            </div>

            {/* Comment Content */}
            <p className="text-sm text-gray-700 mb-2 line-clamp-2">
              {comment.content}
            </p>

            {/* WorldCup Reference */}
            <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 inline-block max-w-full truncate">
              📋 {comment.worldcup_title}
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