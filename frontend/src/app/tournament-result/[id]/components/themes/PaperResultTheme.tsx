'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
      return <Star className="w-4 h-4 text-amber-600 fill-current" />;
  }
};

export default function PaperResultTheme({
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
    <div className="min-h-screen bg-amber-50 relative">
      {/* 종이 텍스처 배경 */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-amber-600 mr-2" />
            <h1 className="text-3xl font-bold text-amber-800 transform -rotate-1">
              토너먼트 결과
            </h1>
          </div>
          
          <div className="inline-block bg-white rounded-lg p-6 border-2 border-dashed border-amber-600 transform rotate-1 shadow-lg shadow-amber-200 mb-4">
            <h2 className="text-2xl font-bold text-amber-900 mb-2">
              {worldcupData.title}
            </h2>
            
            {worldcupData.description && (
              <p className="text-lg text-amber-700 font-medium">
                {worldcupData.description}
              </p>
            )}
          </div>
          
          {/* 종이 테이프 효과 */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-amber-300 opacity-60 transform rotate-12"></div>
        </div>

        {/* 우승자 정보 */}
        {winnerData && (
          <div className="bg-white rounded-lg p-6 border-2 border-dashed border-amber-600 transform -rotate-1 shadow-lg shadow-amber-200 mb-8 relative">
            {/* 스테이플 효과 */}
            <div className="absolute -top-1 left-4 w-1 h-4 bg-gray-400 transform rotate-45"></div>
            <div className="absolute -top-1 right-4 w-1 h-4 bg-gray-400 transform -rotate-45"></div>
            
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-amber-800 mb-2 transform skew-x-3">
                🏆 우승자
              </div>
            </div>
            
            <div 
              className="relative w-64 h-64 mx-auto mb-4 rounded-lg overflow-hidden bg-amber-50 cursor-pointer border-2 border-dashed border-amber-300"
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
                  <span className="text-xl text-amber-500/50 font-medium">이미지 없음</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                <Eye className="w-8 h-8 text-amber-600 opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-amber-900 mb-4 transform -skew-x-2">
                {winnerData.title}
              </h3>
              
              {winnerStats && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center bg-amber-100 rounded-lg p-3 border border-dashed border-amber-300 transform rotate-1">
                    <div className="text-2xl font-bold text-amber-800">
                      {winnerStats.votes}
                    </div>
                    <div className="text-sm text-amber-600">받은 투표</div>
                  </div>
                  <div className="text-center bg-orange-100 rounded-lg p-3 border border-dashed border-orange-300 transform -rotate-1">
                    <div className="text-2xl font-bold text-orange-700">
                      {winnerStats.winRate}%
                    </div>
                    <div className="text-sm text-orange-600">승률</div>
                  </div>
                  <div className="text-center bg-amber-100 rounded-lg p-3 border border-dashed border-amber-300 transform rotate-1">
                    <div className="text-2xl font-bold text-amber-800">
                      {winnerStats.totalMatches}
                    </div>
                    <div className="text-sm text-amber-600">총 경기</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 게임 정보 */}
        <div className="bg-white rounded-lg p-6 border-2 border-dashed border-amber-600 transform rotate-1 shadow-lg shadow-amber-200 mb-8 relative">
          <div className="absolute -top-1 left-6 w-1 h-4 bg-gray-400 transform rotate-45"></div>
          <div className="absolute -top-1 right-6 w-1 h-4 bg-gray-400 transform -rotate-45"></div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <Clock className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-amber-800">
                {formatTime(playTime)}
              </div>
              <div className="text-sm text-amber-600">소요 시간</div>
            </div>
            <div className="text-center">
              <User className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-amber-800">
                {worldcupData.creator_name || 'Unknown'}
              </div>
              <div className="text-sm text-amber-600">제작자</div>
            </div>
          </div>
        </div>

        {/* 좋아요/북마크 */}
        <div className="bg-white rounded-lg p-6 border-2 border-dashed border-amber-600 transform -rotate-1 shadow-lg shadow-amber-200 mb-8 relative">
          <div className="absolute -top-1 left-8 w-1 h-4 bg-gray-400 transform rotate-45"></div>
          <div className="absolute -top-1 right-8 w-1 h-4 bg-gray-400 transform -rotate-45"></div>
          
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={onLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 font-semibold transform hover:-rotate-1 ${
                liked 
                  ? 'bg-red-500 text-white shadow-lg' 
                  : 'bg-white border-2 border-dashed border-amber-600 text-amber-800 hover:bg-amber-50'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span>{likes}</span>
            </button>
            
            <button
              onClick={onBookmark}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 font-semibold transform hover:rotate-1 ${
                bookmarked 
                  ? 'bg-yellow-500 text-white shadow-lg' 
                  : 'bg-white border-2 border-dashed border-amber-600 text-amber-800 hover:bg-amber-50'
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
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border-2 border-dashed border-amber-600 rounded-lg text-amber-800 hover:bg-amber-50 transition-all duration-300 font-semibold transform hover:-rotate-1 shadow-lg"
          >
            <RotateCcw className="w-5 h-5" />
            <span>다시 하기</span>
          </button>
          
          <button
            onClick={onGoHome}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border-2 border-dashed border-amber-600 rounded-lg text-amber-800 hover:bg-amber-50 transition-all duration-300 font-semibold transform hover:rotate-1 shadow-lg"
          >
            <Home className="w-5 h-5" />
            <span>홈으로</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={onShowRanking}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border-2 border-dashed border-orange-500 rounded-lg text-orange-700 hover:bg-orange-50 transition-all duration-300 font-semibold transform hover:-rotate-1 shadow-lg"
          >
            <BarChart className="w-5 h-5" />
            <span>랭킹 보기</span>
          </button>
          
          <button
            onClick={onShare}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border-2 border-dashed border-amber-600 rounded-lg text-amber-800 hover:bg-amber-50 transition-all duration-300 font-semibold transform hover:rotate-1 shadow-lg"
          >
            <Share2 className="w-5 h-5" />
            <span>공유하기</span>
          </button>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-lg p-6 border-2 border-dashed border-amber-600 transform rotate-1 shadow-lg shadow-amber-200 relative">
          <div className="absolute -top-1 left-10 w-1 h-4 bg-gray-400 transform rotate-45"></div>
          <div className="absolute -top-1 right-10 w-1 h-4 bg-gray-400 transform -rotate-45"></div>
          
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-amber-800 transform -skew-x-6">
              댓글 ({Array.isArray(comments) ? comments.length : 0})
            </h3>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setCommentFilter('likes')}
                className={`px-3 py-1 rounded text-sm font-semibold transform hover:-rotate-1 transition-all ${
                  commentFilter === 'likes' 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-amber-100 text-amber-800 border border-dashed border-amber-600'
                }`}
              >
                좋아요순
              </button>
              <button
                onClick={() => setCommentFilter('recent')}
                className={`px-3 py-1 rounded text-sm font-semibold transform hover:rotate-1 transition-all ${
                  commentFilter === 'recent' 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-amber-100 text-amber-800 border border-dashed border-amber-600'
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
              className="w-full p-3 rounded-lg bg-amber-50 border-2 border-dashed border-amber-300 text-amber-800 text-left transition-colors hover:bg-amber-100 font-medium"
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
                  className="w-full p-3 rounded-lg border-2 border-dashed border-amber-300 mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50"
                  required
                />
              )}
              <textarea
                placeholder="댓글을 입력하세요..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-dashed border-amber-300 mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50"
                rows={3}
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors hover:bg-amber-700 font-semibold"
                >
                  댓글 작성
                </button>
                <button
                  type="button"
                  onClick={() => setShowCommentForm(false)}
                  className="bg-amber-100 border border-dashed border-amber-600 text-amber-800 px-4 py-2 rounded-lg transition-colors hover:bg-amber-200 font-semibold"
                >
                  취소
                </button>
              </div>
            </form>
          )}

          {/* 댓글 목록 */}
          <div className="space-y-4">
            {Array.isArray(comments) && comments.map((comment, index) => (
              <div 
                key={comment.id} 
                className={`p-4 rounded-lg bg-amber-50 border border-dashed border-amber-300 transform ${
                  index % 2 === 0 ? 'rotate-1' : '-rotate-1'
                } ${comment.isCreator ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getLevelBadge(comment.level)}
                    <span className="font-semibold text-amber-800">
                      {comment.author}
                    </span>
                    {comment.isCreator && (
                      <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs rounded-full">
                        제작자
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-amber-600">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                    <button
                      onClick={() => onReport(comment.id)}
                      className="p-1 rounded bg-amber-100 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-amber-800 mb-2">{comment.content}</p>
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-1 text-amber-600 hover:text-red-500 transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{comment.likes}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-amber-600 hover:text-blue-500 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span>답글</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 배경 장식 */}
      <div className="absolute top-10 left-10 text-6xl text-amber-200 transform rotate-12 opacity-30 pointer-events-none">
        📝
      </div>
      <div className="absolute bottom-10 right-10 text-4xl text-amber-300 transform -rotate-12 opacity-40 pointer-events-none">
        ✂️
      </div>
      
      {/* 종이 찢어진 효과 */}
      <div className="absolute bottom-0 left-0 w-full h-8 bg-amber-100 opacity-50" style={{
        clipPath: 'polygon(0% 50%, 5% 0%, 10% 100%, 15% 30%, 20% 80%, 25% 20%, 30% 90%, 35% 40%, 40% 70%, 45% 10%, 50% 60%, 55% 30%, 60% 90%, 65% 20%, 70% 80%, 75% 40%, 80% 70%, 85% 10%, 90% 90%, 95% 30%, 100% 80%, 100% 100%, 0% 100%)'
      }}></div>
    </div>
  );
}