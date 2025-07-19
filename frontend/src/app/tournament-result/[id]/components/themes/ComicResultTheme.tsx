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
      return <Star className="w-4 h-4 text-purple-400 fill-current" />;
  }
};

export default function ComicResultTheme({
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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 relative">
      {/* 만화 도트 패턴 배경 */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%235b21b6' fill-opacity='0.4'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-purple-600 mr-2" />
            <h1 className="text-3xl font-black text-purple-800 transform -skew-x-12">
              토너먼트 결과!
            </h1>
          </div>
          
          <div className="relative inline-block">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-2xl transform -rotate-2 shadow-xl">
              <h2 className="text-2xl font-black mb-2 transform skew-x-6">
                {worldcupData.title}
              </h2>
              {worldcupData.description && (
                <p className="text-purple-100 text-lg font-bold transform -skew-x-3">
                  {worldcupData.description}
                </p>
              )}
            </div>
            {/* 말풍선 꼬리 */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-purple-600"></div>
          </div>
          
          {/* 만화 효과 장식 */}
          <div className="absolute -top-4 -left-4 text-3xl animate-bounce">🎊</div>
          <div className="absolute -top-2 -right-4 text-2xl animate-pulse">🏆</div>
        </div>

        {/* 우승자 정보 */}
        {winnerData && (
          <div className="bg-white rounded-2xl p-6 border-4 border-purple-400 shadow-xl transform rotate-1 mb-8 relative">
            <div className="text-center mb-4">
              <div className="text-4xl font-black text-purple-800 mb-2 transform skew-x-6">
                🏆 우승자!
              </div>
            </div>
            
            <div 
              className="relative w-64 h-64 mx-auto mb-4 rounded-xl overflow-hidden bg-purple-50 cursor-pointer border-4 border-purple-300 shadow-lg transform hover:scale-105 transition-transform"
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
                  <span className="text-xl text-purple-500 font-bold">이미지 없음</span>
                </div>
              )}
              
              {/* 만화 스타일 하이라이트 */}
              <div className="absolute top-2 left-2 w-8 h-8 bg-white/60 rounded-full blur-sm"></div>
              
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                <Eye className="w-8 h-8 text-purple-600 opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-black text-purple-800 mb-4 transform -skew-x-3">
                {winnerData.title}
              </h3>
              
              {winnerStats && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-3 shadow-lg transform rotate-1">
                    <div className="text-2xl font-black">
                      {winnerStats.votes}
                    </div>
                    <div className="text-sm font-bold">받은 투표</div>
                  </div>
                  <div className="text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-3 shadow-lg transform -rotate-1">
                    <div className="text-2xl font-black">
                      {winnerStats.winRate}%
                    </div>
                    <div className="text-sm font-bold">승률</div>
                  </div>
                  <div className="text-center bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl p-3 shadow-lg transform rotate-1">
                    <div className="text-2xl font-black">
                      {winnerStats.totalMatches}
                    </div>
                    <div className="text-sm font-bold">총 경기</div>
                  </div>
                </div>
              )}
            </div>

            {/* 충격 효과 */}
            <div className="absolute -top-8 -right-8 text-6xl animate-bounce">💥</div>
          </div>
        )}

        {/* 게임 정보 */}
        <div className="bg-white rounded-2xl p-6 border-4 border-blue-400 shadow-xl transform -rotate-1 mb-8 relative">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-black text-purple-800">
                {formatTime(playTime)}
              </div>
              <div className="text-sm text-blue-600 font-bold">소요 시간</div>
            </div>
            <div className="text-center">
              <User className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-black text-purple-800">
                {worldcupData.creator_name || 'Unknown'}
              </div>
              <div className="text-sm text-blue-600 font-bold">제작자</div>
            </div>
          </div>
        </div>

        {/* 좋아요/북마크 */}
        <div className="bg-white rounded-2xl p-6 border-4 border-green-400 shadow-xl transform rotate-1 mb-8">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={onLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-black shadow-lg transition-all duration-300 transform hover:scale-105 ${
                liked 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-xl'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span>{likes}</span>
            </button>
            
            <button
              onClick={onBookmark}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-black shadow-lg transition-all duration-300 transform hover:scale-105 ${
                bookmarked 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gradient-to-r from-green-400 to-blue-500 text-white hover:shadow-xl'
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
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-black shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <RotateCcw className="w-5 h-5" />
            <span>다시 하기</span>
          </button>
          
          <button
            onClick={onGoHome}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl font-black shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Home className="w-5 h-5" />
            <span>홈으로</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={onShowRanking}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-xl font-black shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <BarChart className="w-5 h-5" />
            <span>랭킹 보기</span>
          </button>
          
          <button
            onClick={onShare}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-black shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Share2 className="w-5 h-5" />
            <span>공유하기</span>
          </button>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-2xl p-6 border-4 border-purple-400 shadow-xl transform -rotate-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-purple-800 transform skew-x-6">
              댓글 ({Array.isArray(comments) ? comments.length : 0})
            </h3>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setCommentFilter('likes')}
                className={`px-3 py-1 rounded text-sm font-black transform hover:scale-105 transition-all ${
                  commentFilter === 'likes' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-purple-100 text-purple-800 border-2 border-purple-400'
                }`}
              >
                좋아요순
              </button>
              <button
                onClick={() => setCommentFilter('recent')}
                className={`px-3 py-1 rounded text-sm font-black transform hover:scale-105 transition-all ${
                  commentFilter === 'recent' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-purple-100 text-purple-800 border-2 border-purple-400'
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
              className="w-full p-3 rounded-lg bg-purple-100 border-2 border-purple-400 text-purple-800 text-left transition-colors hover:bg-purple-200 font-bold"
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
                  className="w-full p-3 rounded-lg border-2 border-purple-400 mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50"
                  required
                />
              )}
              <textarea
                placeholder="댓글을 입력하세요..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-purple-400 mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50"
                rows={3}
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg transition-colors hover:shadow-lg font-black"
                >
                  댓글 작성
                </button>
                <button
                  type="button"
                  onClick={() => setShowCommentForm(false)}
                  className="bg-purple-100 border-2 border-purple-400 text-purple-800 px-4 py-2 rounded-lg transition-colors hover:bg-purple-200 font-black"
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
                className={`p-4 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 transform ${
                  index % 2 === 0 ? 'rotate-1' : '-rotate-1'
                } ${comment.isCreator ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getLevelBadge(comment.level)}
                    <span className="font-black text-purple-800">
                      {comment.author}
                    </span>
                    {comment.isCreator && (
                      <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs rounded-full font-black">
                        제작자
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-purple-600 font-bold">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                    <button
                      onClick={() => onReport(comment.id)}
                      className="p-1 rounded bg-purple-200 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-purple-800 mb-2 font-bold">{comment.content}</p>
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-1 text-purple-600 hover:text-red-500 transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="font-bold">{comment.likes}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-purple-600 hover:text-blue-500 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-bold">답글</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 배경 장식 */}
      <div className="absolute top-10 left-10 text-6xl text-purple-300 transform rotate-12 opacity-30 pointer-events-none animate-bounce">
        💫
      </div>
      <div className="absolute bottom-10 right-10 text-4xl text-pink-400 transform -rotate-12 opacity-40 pointer-events-none animate-pulse">
        🎯
      </div>
    </div>
  );
}