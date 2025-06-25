import { Heart, MessageCircle, Share2, Play, Bookmark } from 'lucide-react';

interface WorldCupCardProps {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  author: string;
  createdAt: string;
  participants: number;
  comments: number;
  likes: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  onPlay: () => void;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
}

export default function WorldCupCard({
  id: _id,
  title,
  description,
  thumbnail: _thumbnail,
  author,
  createdAt,
  participants,
  comments,
  likes,
  isLiked = false,
  isBookmarked = false,
  onPlay,
  onLike,
  onBookmark,
  onShare,
}: WorldCupCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-2xl mb-2">🏆</div>
          <div className="text-gray-600 text-sm font-medium line-clamp-2">
            {title}
          </div>
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <button
            onClick={onPlay}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-3"
          >
            <Play className="w-6 h-6 ml-1" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-snug">
          {title}
        </h3>
        
        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <span>{author}</span>
          <span className="mx-2">·</span>
          <span>{createdAt}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Play className="w-4 h-4 mr-1" />
              {participants.toLocaleString()}
            </span>
            <span className="flex items-center">
              <MessageCircle className="w-4 h-4 mr-1" />
              {comments}
            </span>
          </div>
          <div className="flex items-center">
            <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
            {likes}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPlay}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-lg transition-colors font-medium flex items-center justify-center min-h-[40px]"
          >
            시작하기
          </button>
          <button
            onClick={onLike}
            className={`p-2.5 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${
              isLiked
                ? 'text-red-500 bg-red-50 hover:bg-red-100'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onBookmark}
            className={`p-2.5 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${
              isBookmarked
                ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100'
                : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onShare}
            className="p-2.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}