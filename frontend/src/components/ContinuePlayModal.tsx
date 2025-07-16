'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Clock, Trophy } from 'lucide-react';

interface ContinuePlayModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onStartNew: () => void;
  onClose: () => void;
  worldcupTitle: string;
  progress?: {
    currentRound: number;
    totalRounds: number;
    lastSaved: string;
  };
}

export default function ContinuePlayModal({
  isOpen,
  onContinue,
  onStartNew,
  onClose,
  worldcupTitle,
  progress
}: ContinuePlayModalProps) {
  const formatLastSaved = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) {
      return '방금 전';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else {
      return `${diffDays}일 전`;
    }
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    return Math.round((progress.currentRound / progress.totalRounds) * 100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">진행 중인 게임 발견</h2>
                  <p className="text-sm text-gray-600">이어서 플레이하시겠습니까?</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                  {worldcupTitle}
                </h3>
                
                {progress && (
                  <div className="space-y-3">
                    {/* Progress bar */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Play className="w-4 h-4" />
                      <span>{progress.currentRound}라운드 진행 중</span>
                      <span className="text-purple-600 font-medium">
                        {getProgressPercentage()}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${getProgressPercentage()}%` }}
                      />
                    </div>
                    
                    {/* Last saved */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatLastSaved(progress.lastSaved)} 저장됨</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={onContinue}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  이어서 하기
                </button>
                
                <button
                  onClick={onStartNew}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  새로 시작하기
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}