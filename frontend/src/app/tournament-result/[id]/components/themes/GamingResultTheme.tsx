'use client';

import { 
  Heart, Bookmark, Share2, Home, RotateCcw, BarChart, Flag, Clock, Trophy, 
  User, Eye
} from 'lucide-react';
import Image from 'next/image';
import { ResultThemeProps } from './types';
import ReportModal from '../ReportModal';
import CommentSystem from '../comments/CommentSystem';

// Utility functions
const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};


export default function GamingResultTheme({
  worldcupData,
  winnerData,
  winnerStats,
  playTime,
  liked,
  bookmarked,
  reported,
  showReportModal,
  likes,
  comments,
  onLike,
  onBookmark,
  onWorldcupReport,
  onShare,
  onRestart,
  onGoHome,
  onShowRanking,
  onShowImageModal,
  setShowReportModal,
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

            <button
              onClick={() => setShowReportModal(true)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-semibold tracking-wide ${
                reported 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-800/50 border border-red-500/50 text-red-400 hover:bg-red-500/10 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
              }`}
              disabled={reported}
            >
              <Flag className="w-5 h-5" />
              <span>{reported ? 'REPORTED' : 'REPORT'}</span>
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
        <CommentSystem
          initialComments={comments}
          isAuthenticated={isAuthenticated}
          theme="gaming"
          className="comment-system-gaming"
        />
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

      {/* 신고 모달 */}
      <ReportModal
        isOpen={showReportModal || false}
        onClose={() => setShowReportModal(false)}
        onSubmit={onWorldcupReport}
        title="월드컵 신고하기"
      />
    </div>
  );
}