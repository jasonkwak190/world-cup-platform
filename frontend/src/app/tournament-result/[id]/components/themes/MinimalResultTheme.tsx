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


export default function MinimalResultTheme({
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

            <button
              onClick={() => setShowReportModal(true)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                reported 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
              }`}
              disabled={reported}
            >
              <Flag className="w-5 h-5" />
              <span>{reported ? '신고됨' : '신고'}</span>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CommentSystem
            initialComments={comments}
            isAuthenticated={isAuthenticated}
            currentUser={currentUser}
            worldcupCreatorId={worldcupCreatorId}
            worldcupId={worldcupData.id}
            theme="minimal"
            className="comment-system-minimal"
          />
        </div>
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