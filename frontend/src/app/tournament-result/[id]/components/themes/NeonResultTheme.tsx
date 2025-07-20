'use client';

import { motion, AnimatePresence } from 'framer-motion';
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


export default function NeonResultTheme({
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
  isAuthenticated,
  currentUser,
  worldcupCreatorId
}: ResultThemeProps) {
  if (!worldcupData) return null;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* 네온 배경 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-blue-900/30"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.1),transparent_70%)]"></div>
      
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-cyan-400 mr-2" />
            <h1 className="text-3xl font-bold font-mono bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
              TOURNAMENT_COMPLETE
            </h1>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2 font-mono">
            {worldcupData.title}
          </h2>
          
          {worldcupData.description && (
            <p className="text-lg text-cyan-300 mb-4 font-mono">
              &gt;&gt; {worldcupData.description} &lt;&lt;
            </p>
          )}
        </div>

        {/* 우승자 정보 */}
        {winnerData && (
          <div className="bg-gray-900/80 backdrop-blur-sm border border-cyan-400/30 rounded-2xl p-6 mb-8 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-cyan-400 mb-2 font-mono">
                🏆 WINNER_DETECTED
              </div>
            </div>
            
            <div 
              className="relative w-64 h-64 mx-auto mb-4 rounded-xl overflow-hidden cursor-pointer border border-cyan-400/50"
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
                <div className="w-full h-full flex items-center justify-center bg-gray-800/50">
                  <span className="text-xl text-cyan-400 font-mono">NO_IMAGE</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                <Eye className="w-8 h-8 text-cyan-400 opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4 font-mono">
                {winnerData.title}
              </h3>
              
              {winnerStats && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center bg-cyan-400/10 rounded-lg p-3">
                    <div className="text-2xl font-bold text-cyan-400 font-mono">
                      {winnerStats.votes}
                    </div>
                    <div className="text-sm text-gray-300 font-mono">VOTES</div>
                  </div>
                  <div className="text-center bg-pink-400/10 rounded-lg p-3">
                    <div className="text-2xl font-bold text-pink-400 font-mono">
                      {winnerStats.winRate}%
                    </div>
                    <div className="text-sm text-gray-300 font-mono">WIN_RATE</div>
                  </div>
                  <div className="text-center bg-purple-400/10 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-400 font-mono">
                      {winnerStats.totalMatches}
                    </div>
                    <div className="text-sm text-gray-300 font-mono">MATCHES</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 게임 정보 */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-400/30 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <Clock className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-lg font-semibold text-white font-mono">
                {formatTime(playTime)}
              </div>
              <div className="text-sm text-cyan-400 font-mono">PLAY_TIME</div>
            </div>
            <div className="text-center">
              <User className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-lg font-semibold text-white font-mono">
                {worldcupData.creator_name || 'UNKNOWN'}
              </div>
              <div className="text-sm text-cyan-400 font-mono">CREATOR</div>
            </div>
          </div>
        </div>

        {/* 좋아요/북마크 */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-400/30 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={onLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-mono ${
                liked 
                  ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
                  : 'bg-gray-800/50 border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span>{likes}</span>
            </button>
            
            <button
              onClick={onBookmark}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-mono ${
                bookmarked 
                  ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)]' 
                  : 'bg-gray-800/50 border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
              <span>BOOKMARK</span>
            </button>

            <button
              onClick={() => setShowReportModal(true)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-mono ${
                reported 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-800/50 border border-red-400/50 text-red-400 hover:bg-red-400/10 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
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
            className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors font-mono hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]"
          >
            <RotateCcw className="w-5 h-5" />
            <span>RESTART</span>
          </button>
          
          <button
            onClick={onGoHome}
            className="bg-gray-800/50 border border-cyan-400/50 text-cyan-400 px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors font-mono hover:bg-cyan-400/10"
          >
            <Home className="w-5 h-5" />
            <span>HOME</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={onShowRanking}
            className="bg-gray-800/50 border border-purple-400/50 text-purple-400 px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors font-mono hover:bg-purple-400/10"
          >
            <BarChart className="w-5 h-5" />
            <span>RANKING</span>
          </button>
          
          <button
            onClick={onShare}
            className="bg-gray-800/50 border border-pink-400/50 text-pink-400 px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors font-mono hover:bg-pink-400/10"
          >
            <Share2 className="w-5 h-5" />
            <span>SHARE</span>
          </button>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-cyan-400/30 rounded-xl overflow-hidden">
          <CommentSystem
            initialComments={comments}
            isAuthenticated={isAuthenticated}
            currentUser={currentUser}
            worldcupCreatorId={worldcupCreatorId}
            theme="neon"
            className="p-6"
          />
        </div>
      </div>

      {/* 배경 장식 효과 */}
      <div className="fixed top-20 left-20 text-8xl text-cyan-400/5 animate-pulse pointer-events-none font-mono">
        &lt;/&gt;
      </div>
      <div className="fixed bottom-20 right-20 text-6xl text-pink-400/5 animate-pulse pointer-events-none font-mono">
        [WIN]
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