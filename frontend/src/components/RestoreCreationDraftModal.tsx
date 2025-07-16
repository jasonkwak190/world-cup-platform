'use client';

import React from 'react';
import { X, Edit, Trash2, Clock, Image, FileText } from 'lucide-react';

interface RestoreCreationDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
  onStartNew: () => void;
  draftData?: {
    title?: string;
    description?: string;
    category?: string;
    items?: any[];
    updated_at: string;
    settings?: any;
  } | null;
  isLoading?: boolean;
}

export default function RestoreCreationDraftModal({
  isOpen,
  onClose,
  onRestore,
  onStartNew,
  draftData,
  isLoading = false
}: RestoreCreationDraftModalProps) {
  if (!isOpen) return null;

  const formatLastSaved = (dateString: string) => {
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

  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      entertainment: '연예인',
      sports: '스포츠',
      food: '음식',
      animal: '동물',
      character: '캐릭터',
      movie: '영화',
      music: '음악',
      game: '게임',
      other: '기타'
    };
    return categories[category] || category;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">임시저장된 월드컵</h3>
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
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Edit className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              제작 중인 월드컵이 있습니다
            </h4>
            <p className="text-gray-600 text-sm">
              이어서 만들거나 새로 시작할 수 있습니다
            </p>
          </div>

          {draftData && (
            <div className="bg-amber-50 rounded-lg p-4 mb-6 border border-amber-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <Clock className="w-4 h-4" />
                  <span>마지막 저장: {formatLastSaved(draftData.updated_at)}</span>
                </div>
                <span className="text-xs text-amber-600 font-medium px-2 py-1 bg-amber-100 rounded">
                  임시저장
                </span>
              </div>
              
              <div className="space-y-3">
                {/* Title */}
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {draftData.title || '제목 없음'}
                    </div>
                    {draftData.description && (
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {draftData.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Category and Items */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">카테고리:</span>
                    <span className="font-medium text-gray-900">
                      {getCategoryName(draftData.category || 'other')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      {draftData.items?.length || 0}개 항목
                    </span>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>진행 상태</span>
                    <span>
                      {draftData.items?.length ? 
                        `${draftData.items.length}개 항목 추가됨` : 
                        '아직 항목이 없습니다'
                      }
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(((draftData.items?.length || 0) / 16) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onRestore}
              disabled={isLoading}
              className={`w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
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
                  <Edit className="w-5 h-5" />
                  <span>이어서 만들기</span>
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
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            새로 시작하면 임시저장된 내용이 삭제됩니다
          </p>
        </div>
      </div>
    </div>
  );
}