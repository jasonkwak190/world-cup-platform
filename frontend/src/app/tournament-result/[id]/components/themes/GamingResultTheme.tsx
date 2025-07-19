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
  
  if (diffInSeconds < 60) return 'JUST_NOW';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}M_AGO`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}H_AGO`;
  return `${Math.floor(diffInSeconds / 86400)}D_AGO`;
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

export default function GamingResultTheme({
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* 게이밍 배경 효과 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.1),transparent_70%)]"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23a855f7' fill-opacity='0.05'%3E%3Cpath d='M20 20l10-10v20l-10-10z'/%3E%3Cpath d='M20 20l-10-10v20l10-10z'/%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-purple-400 mr-2" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent tracking-wider">
              VICTORY_ACHIEVED
            </h1>
          </div>
          
          <div className="relative">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
              {worldcupData.title}
            </h2>
            {/* 글리치 효과 */}
            <div className="absolute inset-0 text-2xl font-bold text-purple-400/20 transform translate-x-1 -translate-y-1 -z-10">
              {worldcupData.title}
            </div>
          </div>
          
          {worldcupData.description && (
            <p className="text-lg text-purple-300 font-semibold tracking-wide">
              &gt;&gt; {worldcupData.description} &lt;&lt;
            </p>
          )}
        </div>

        {/* 우승자 정보 */}
        {winnerData && (
          <div className="bg-gray-900/90 backdrop-blur-md border border-purple-500/30 rounded-2xl p-6 mb-8 shadow-[0_0_30px_rgba(147,51,234,0.4)]">
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-purple-400 mb-2 tracking-widest">
                🏆 CHAMPION_DETECTED
              </div>
            </div>
            
            <div 
              className="relative w-64 h-64 mx-auto mb-4 rounded-xl overflow-hidden bg-gray-800/50 cursor-pointer border border-purple-500/30"
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
                  <span className="text-xl text-purple-400 font-semibold">NO_IMAGE</span>
                </div>
              )}
              
              {/* 게이밍 스타일 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              <div className="absolute top-2 left-2 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
              
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                <Eye className="w-8 h-8 text-purple-400 opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4 tracking-wide">
                {winnerData.title}
              </h3>
              
              {winnerStats && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center bg-purple-600/20 rounded-lg p-3 border border-purple-500/30">
                    <div className="text-2xl font-bold text-purple-400">
                      {winnerStats.votes}
                    </div>
                    <div className="text-sm text-gray-300 font-semibold">VOTES</div>
                  </div>
                  <div className="text-center bg-pink-600/20 rounded-lg p-3 border border-pink-500/30">
                    <div className="text-2xl font-bold text-pink-400">
                      {winnerStats.winRate}%
                    </div>
                    <div className="text-sm text-gray-300 font-semibold">WIN_RATE</div>
                  </div>
                  <div className="text-center bg-blue-600/20 rounded-lg p-3 border border-blue-500/30">
                    <div className="text-2xl font-bold text-blue-400">
                      {winnerStats.totalMatches}
                    </div>
                    <div className="text-sm text-gray-300 font-semibold">BATTLES</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 게임 정보 */}
        <div className="bg-gray-900/60 backdrop-blur-md border border-purple-500/30 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-lg font-semibold text-white tracking-wider">
                {formatTime(playTime)}
              </div>
              <div className="text-sm text-purple-400 font-semibold">PLAY_TIME</div>
            </div>
            <div className="text-center">
              <User className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-lg font-semibold text-white tracking-wider">
                {worldcupData.creator_name || 'UNKNOWN'}
              </div>
              <div className="text-sm text-purple-400 font-semibold">CREATOR</div>
            </div>
          </div>
        </div>

        {/* 좋아요/북마크 */}
        <div className="bg-gray-900/60 backdrop-blur-md border border-purple-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={onLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-semibold tracking-wide ${
                liked 
                  ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
                  : 'bg-gray-800/50 border border-purple-500/50 text-purple-400 hover:bg-purple-500/10'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span>{likes}</span>
            </button>
            
            <button
              onClick={onBookmark}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-semibold tracking-wide ${
                bookmarked 
                  ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)]' 
                  : 'bg-gray-800/50 border border-purple-500/50 text-purple-400 hover:bg-purple-500/10'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
              <span>BOOKMARK</span>
            </button>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={onRestart}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all duration-300 tracking-wide"
          >
            <RotateCcw className="w-5 h-5" />
            <span>RESTART</span>
          </button>
          
          <button
            onClick={onGoHome}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-800/50 border border-purple-500/50 text-purple-400 rounded-lg font-semibold hover:bg-purple-500/10 transition-colors tracking-wide"
          >
            <Home className="w-5 h-5" />
            <span>HOME</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={onShowRanking}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-800/50 border border-green-500/50 text-green-400 rounded-lg font-semibold hover:bg-green-500/10 transition-colors tracking-wide"
          >
            <BarChart className="w-5 h-5" />
            <span>RANKING</span>
          </button>
          
          <button
            onClick={onShare}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-800/50 border border-blue-500/50 text-blue-400 rounded-lg font-semibold hover:bg-blue-500/10 transition-colors tracking-wide"
          >
            <Share2 className="w-5 h-5" />
            <span>SHARE</span>
          </button>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-gray-900/90 backdrop-blur-md border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-purple-400 tracking-wider">
              COMMENTS_({Array.isArray(comments) ? comments.length : 0})
            </h3>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setCommentFilter('likes')}
                className={`px-3 py-1 rounded text-sm font-semibold tracking-wide ${
                  commentFilter === 'likes' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-800/50 border border-purple-500/50 text-purple-400'
                }`}
              >
                LIKES
              </button>
              <button
                onClick={() => setCommentFilter('recent')}
                className={`px-3 py-1 rounded text-sm font-semibold tracking-wide ${
                  commentFilter === 'recent' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-800/50 border border-purple-500/50 text-purple-400'
                }`}
              >
                RECENT
              </button>
            </div>
          </div>

          {/* 댓글 작성 */}
          {!showCommentForm ? (
            <button
              onClick={() => setShowCommentForm(true)}
              className="w-full p-3 rounded-lg bg-gray-800/50 border border-purple-500/30 text-purple-400 text-left transition-colors hover:bg-purple-500/10 font-semibold tracking-wide"
            >
              &gt;&gt; WRITE_COMMENT...
            </button>
          ) : (
            <form onSubmit={onCommentSubmit} className="mb-6">
              {!isAuthenticated && (
                <input
                  type="text"
                  placeholder="USERNAME"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-800/50 border border-purple-500/30 text-white mb-3 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-500"
                  required
                />
              )}
              <textarea
                placeholder="ENTER_COMMENT..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-800/50 border border-purple-500/30 text-white mb-3 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-500"
                rows={3}
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors hover:bg-purple-700 font-semibold tracking-wide"
                >
                  SUBMIT
                </button>
                <button
                  type="button"
                  onClick={() => setShowCommentForm(false)}
                  className="bg-gray-800/50 border border-purple-500/50 text-purple-400 px-4 py-2 rounded-lg transition-colors hover:bg-purple-500/10 font-semibold tracking-wide"
                >
                  CANCEL
                </button>
              </div>
            </form>
          )}

          {/* 댓글 목록 */}
          <div className="space-y-4">
            {Array.isArray(comments) && comments.map((comment) => (
              <div 
                key={comment.id} 
                className={`p-4 rounded-lg bg-gray-800/50 border border-gray-600/50 ${
                  comment.isCreator ? 'ring-2 ring-purple-400 animate-pulse' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getLevelBadge(comment.level)}
                    <span className="font-semibold text-white tracking-wide">
                      {comment.author}
                    </span>
                    {comment.isCreator && (
                      <span className="px-2 py-1 bg-purple-400 text-black text-xs rounded-full font-semibold">
                        CREATOR
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-purple-400 tracking-wide">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                    <button
                      onClick={() => onReport(comment.id)}
                      className="p-1 rounded bg-gray-700/50 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-white mb-2">{comment.content}</p>
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-1 text-purple-400 hover:text-red-500 transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="tracking-wide">{comment.likes}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-purple-400 hover:text-blue-500 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span className="tracking-wide">REPLY</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 배경 장식 효과 */}
      <div className="fixed top-20 left-20 text-8xl text-purple-400/5 animate-pulse pointer-events-none">
        ⚔️
      </div>
      <div className="fixed bottom-20 right-20 text-6xl text-pink-400/5 animate-bounce pointer-events-none">
        🎮
      </div>
      <div className="fixed top-1/3 right-10 text-4xl text-purple-500/10 animate-pulse pointer-events-none">
        ⭐
      </div>
    </div>
  );
}