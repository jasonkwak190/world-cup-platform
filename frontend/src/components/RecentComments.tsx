import { MessageCircle, Clock, Star, AlertCircle } from 'lucide-react';
import { useRecentComments } from '@/hooks/useRecentComments';

export default function RecentComments() {
  const { data: recentComments, loading, error } = useRecentComments();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-4 h-4 text-purple-600" />
          <h2 className="text-base font-bold text-gray-900">최근 댓글</h2>
        </div>
        
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-2 rounded-lg animate-pulse">
              <div className="flex justify-between mb-1">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-2 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded mb-1 w-full"></div>
              <div className="h-2 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-4 h-4 text-purple-600" />
          <h2 className="text-base font-bold text-gray-900">최근 댓글</h2>
        </div>
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-800">오류가 발생했습니다.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-purple-600" />
        <h2 className="text-base font-bold text-gray-900">최근 댓글</h2>
      </div>
      
      <div className="space-y-2">
        {recentComments.slice(0, 3).map((comment) => (
          <div
            key={comment.id}
            className="p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group border-l-2 border-transparent hover:border-purple-200"
          >
            {/* Author & Time */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-purple-600 truncate max-w-24">
                  {comment.author_name}
                </span>
                {comment.isRecommended && (
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                )}
              </div>
              <span className="text-xs text-gray-400">{comment.time_ago}</span>
            </div>

            {/* Comment Content */}
            <p className="text-xs text-gray-700 mb-1 line-clamp-1">
              {comment.content}
            </p>

            {/* WorldCup Reference */}
            <div className="text-xs text-gray-500 truncate">
              📋 {comment.worldcup_title}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-2 border-t">
        <button className="w-full text-xs text-purple-600 hover:text-purple-700 font-medium">
          더보기 →
        </button>
      </div>
    </div>
  );
}