'use client';

import React from 'react';
import { X, Play, Trash2, Clock, User } from 'lucide-react';

interface ContinuePlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onStartNew: () => void;
  onLogin?: () => void;
  draftData?: {
    current_round: number;
    total_rounds: number;
    updated_at: string;
    bracket_state?: any;
  } | null;
  worldcupTitle?: string;
  isLoading?: boolean;
  isAuthenticated?: boolean;
}

export default function ContinuePlayingModal({
  isOpen,
  onClose,
  onContinue,
  onStartNew,
  onLogin,
  draftData,
  worldcupTitle = '월드컵',
  isLoading = false,
  isAuthenticated = true
}: ContinuePlayingModalProps) {
  if (!isOpen) return null;

  const formatLastPlayed = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return '방금 전';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  const getProgressPercentage = () => {
    if (!draftData) return 0;
    return Math.round((draftData.current_round / draftData.total_rounds) * 100);
  };

  const getRoundName = (round: number, totalRounds: number) => {
    const participants = Math.pow(2, totalRounds);
    const currentParticipants = Math.pow(2, totalRounds - round + 1);
    
    if (currentParticipants === 2) return '결승';
    if (currentParticipants === 4) return '준결승';
    if (currentParticipants === 8) return '8강';
    if (currentParticipants === 16) return '16강';
    if (currentParticipants === 32) return '32강';
    if (currentParticipants === 64) return '64강';
    
    return `${currentParticipants}강`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">이어서 플레이하기</h3>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={isLoading}
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isAuthenticated ? (
            /* Not authenticated - show login prompt */
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                진행 상황을 저장하고 싶나요?
              </h4>
              <p className="text-gray-600 text-sm">
                로그인하면 게임 진행 상황이 자동으로 저장됩니다
              </p>
            </div>
          ) : (
            /* Authenticated - show continue game */
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {worldcupTitle}
              </h4>
              <p className="text-gray-600 text-sm">
                진행 중인 게임을 발견했습니다
              </p>
            </div>
          )}

          {draftData && isAuthenticated && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>마지막 플레이: {formatLastPlayed(draftData.updated_at)}</span>
                </div>
                <span className="text-xs text-purple-600 font-medium">
                  {getProgressPercentage()}% 완료
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">현재 라운드</span>
                  <span className="font-medium text-gray-900">
                    {getRoundName(draftData.current_round, draftData.total_rounds)}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="space-y-2">
                <div className="text-sm text-blue-800 font-medium">로그인하면 이런 것들이 가능해요:</div>
                <div className="space-y-1 text-xs text-blue-700">
                  <div>• 🎮 게임 진행 상황 자동 저장</div>
                  <div>• 📱 다른 기기에서도 이어서 플레이</div>
                  <div>• 🔄 실수로 페이지를 닫아도 안전</div>
                  <div>• ⏰ 7일간 저장된 진행 상황 유지</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isAuthenticated ? (
              /* Login buttons for non-authenticated users */
              <>
                <button
                  onClick={onLogin}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <User className="w-5 h-5" />
                  <span>로그인하고 저장하기</span>
                </button>
                
                <button
                  onClick={onStartNew}
                  disabled={isLoading}
                  className="w-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  <span>저장 없이 플레이하기</span>
                </button>
              </>
            ) : (
              /* Continue/new game buttons for authenticated users */
              <>
                <button
                  onClick={onContinue}
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : 'shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>불러오는 중...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>이어서 플레이하기</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={onStartNew}
                  disabled={isLoading}
                  className="w-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>새로 시작하기</span>
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            {!isAuthenticated 
              ? '로그인 없이도 게임을 즐길 수 있지만, 진행 상황은 저장되지 않습니다'
              : '새로 시작하면 현재 진행 상황이 삭제됩니다'
            }
          </p>
        </div>
      </div>
    </div>
  );
}