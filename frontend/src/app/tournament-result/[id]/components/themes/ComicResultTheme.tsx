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


export default function ComicResultTheme({
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

            <button
              onClick={() => setShowReportModal(true)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-black shadow-lg transition-all duration-300 transform hover:scale-105 ${
                reported 
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-xl'
              }`}
              disabled={reported}
            >
              <Flag className="w-5 h-5" />
              <span>{reported ? '신고됨!' : '신고'}</span>
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
        <div className="bg-white rounded-2xl border-4 border-purple-400 shadow-xl transform -rotate-1 overflow-hidden">
          <CommentSystem
            initialComments={comments}
            isAuthenticated={isAuthenticated}
            currentUser={currentUser}
            worldcupCreatorId={worldcupCreatorId}
            theme="comic"
            className="p-6"
          />
        </div>
      </div>

      {/* 배경 장식 */}
      <div className="absolute top-10 left-10 text-6xl text-purple-300 transform rotate-12 opacity-30 pointer-events-none animate-bounce">
        💫
      </div>
      <div className="absolute bottom-10 right-10 text-4xl text-pink-400 transform -rotate-12 opacity-40 pointer-events-none animate-pulse">
        🎯
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