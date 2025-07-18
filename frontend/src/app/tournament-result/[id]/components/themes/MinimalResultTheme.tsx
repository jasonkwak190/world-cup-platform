'use client';

import { 
  Heart, Bookmark, Share2, Home, RotateCcw, BarChart, Flag, Clock, Trophy, 
  User, Eye, ThumbsUp, MessageCircle, Star 
} from 'lucide-react';
import Image from 'next/image';
import { ResultThemeProps } from './types';

// Utility functions
const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatRelativeTime = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return `${Math.floor(diffInSeconds / 86400)}일 전`;
};

const getLevelBadge = (level: string) => {
  switch (level) {
    case 'vip':
      return <Star className="w-4 h-4 text-yellow-400 fill-current" />;
    case 'gold':
      return <Star className="w-4 h-4 text-yellow-600 fill-current" />;
    case 'silver':
      return <Star className="w-4 h-4 text-gray-400 fill-current" />;
    default:
      return <Star className="w-4 h-4 text-gray-600 fill-current" />;
  }
};

export default function MinimalResultTheme({
  worldcupData,
  winnerData,
  winnerStats,
  playTime,
  liked,
  bookmarked,
  likes,
  comments,
  commentText,
  guestName,
  commentFilter,
  showCommentForm,
  onLike,
  onBookmark,
  onShare,
  onRestart,
  onGoHome,
  onShowRanking,
  onShowImageModal,
  onCommentSubmit,
  onReport,
  setCommentText,
  setGuestName,
  setCommentFilter,
  setShowCommentForm,
  isAuthenticated
}: ResultThemeProps) {
  if (!worldcupData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Trophy className="w-8 h-8 text-gray-600 mr-3" />
            <h1 className="text-3xl font-light text-gray-900 tracking-tight">
              토너먼트 결과
            </h1>
          </div>
          
          <h2 className="text-2xl font-medium text-gray-900 mb-3 tracking-tight">
            {worldcupData.title}
          </h2>
          
          {worldcupData.description && (
            <p className="text-lg text-gray-600 font-light">
              {worldcupData.description}
            </p>
          )}
        </div>

        {/* 우승자 정보 */}
        {winnerData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <div className="text-center mb-6">
              <div className="text-2xl font-medium text-gray-900 mb-4">
                우승자
              </div>
            </div>
            
            <div 
              className="relative w-64 h-64 mx-auto mb-6 rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
              onClick={onShowImageModal}
            >
              {winnerData.image_url ? (
                <Image
                  src={winnerData.image_url}
                  alt={winnerData.title}
                  fill
                  className="object-cover"
                  sizes="256px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400 font-light">이미지 없음</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors flex items-center justify-center">
                <Eye className="w-8 h-8 text-gray-600 opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-xl font-medium text-gray-900 mb-6">
                {winnerData.title}
              </h3>
              
              {winnerStats && (
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-light text-gray-900">
                      {winnerStats.votes}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">받은 투표</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-gray-900">
                      {winnerStats.winRate}%
                    </div>
                    <div className="text-sm text-gray-600 font-medium">승률</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-gray-900">
                      {winnerStats.totalMatches}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">총 경기</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 게임 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <Clock className="w-6 h-6 text-gray-600 mx-auto mb-3" />
              <div className="text-lg font-medium text-gray-900">
                {formatTime(playTime)}
              </div>
              <div className="text-sm text-gray-600">소요 시간</div>
            </div>
            <div className="text-center">
              <User className="w-6 h-6 text-gray-600 mx-auto mb-3" />
              <div className="text-lg font-medium text-gray-900">
                {worldcupData.creator_name || 'Unknown'}
              </div>
              <div className="text-sm text-gray-600">제작자</div>
            </div>
          </div>
        </div>

        {/* 좋아요/북마크 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={onLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                liked 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span>{likes}</span>
            </button>
            
            <button
              onClick={onBookmark}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                bookmarked 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
              <span>북마크</span>
            </button>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={onRestart}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            <span>다시 하기</span>
          </button>
          
          <button
            onClick={onGoHome}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-300"
          >
            <Home className="w-5 h-5" />
            <span>홈으로</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={onShowRanking}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-300"
          >
            <BarChart className="w-5 h-5" />
            <span>랭킹 보기</span>
          </button>
          
          <button
            onClick={onShare}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-300"
          >
            <Share2 className="w-5 h-5" />
            <span>공유하기</span>
          </button>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium text-gray-900">
              댓글 ({comments.length})
            </h3>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setCommentFilter('likes')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  commentFilter === 'likes' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                좋아요순
              </button>
              <button
                onClick={() => setCommentFilter('recent')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  commentFilter === 'recent' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                최신순
              </button>
            </div>
          </div>

          {/* 댓글 작성 */}
          {!showCommentForm ? (
            <button
              onClick={() => setShowCommentForm(true)}
              className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-left transition-colors hover:bg-gray-100 font-light"
            >
              댓글을 작성해주세요...
            </button>
          ) : (
            <form onSubmit={onCommentSubmit} className="mb-6">
              {!isAuthenticated && (
                <input
                  type="text"
                  placeholder="닉네임"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 mb-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  required
                />
              )}
              <textarea
                placeholder="댓글을 입력하세요..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 mb-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                rows={3}
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg transition-colors hover:bg-gray-800 font-medium"
                >
                  댓글 작성
                </button>
                <button
                  type="button"
                  onClick={() => setShowCommentForm(false)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg transition-colors hover:bg-gray-200 font-medium border border-gray-300"
                >
                  취소
                </button>
              </div>
            </form>
          )}

          {/* 댓글 목록 */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div 
                key={comment.id} 
                className={`p-4 rounded-lg bg-gray-50 border ${
                  comment.isCreator ? 'ring-2 ring-yellow-400' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getLevelBadge(comment.level)}
                    <span className="font-medium text-gray-900">
                      {comment.author}
                    </span>
                    {comment.isCreator && (
                      <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs rounded-full font-medium">
                        제작자
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                    <button
                      onClick={() => onReport(comment.id)}
                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-800 mb-2">{comment.content}</p>
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-red-500 transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{comment.likes}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-500 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span>답글</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}