'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Clock, Image, FileText, Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDraftRestore } from '@/hooks/useDraftRestore';
import { useRouter } from 'next/navigation';

interface DraftManagerProps {
  className?: string;
}

export default function DraftManager({ className = '' }: DraftManagerProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Draft restore hooks for both types
  const creationDrafts = useDraftRestore({
    type: 'worldcup_creation',
    autoCheck: true
  });

  const playDrafts = useDraftRestore({
    type: 'worldcup_play',
    autoCheck: true
  });

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

  const handleContinueCreation = (draftData: any) => {
    // Store draft data in sessionStorage for the create page to pick up
    sessionStorage.setItem('worldcup_creation_draft', JSON.stringify(draftData));
    router.push('/create?restore=true');
  };

  const handleDeleteDraft = async (type: 'creation' | 'play', draftId: string) => {
    if (type === 'creation') {
      await creationDrafts.deleteDraft();
      creationDrafts.refreshDraft();
    } else {
      await playDrafts.deleteDraft();
      playDrafts.refreshDraft();
    }
    setShowDeleteConfirm(null);
  };

  if (!user) {
    return null;
  }

  const hasAnyDrafts = creationDrafts.hasDraft || playDrafts.hasDraft;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Creation Drafts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">임시저장된 월드컵</h3>
          {creationDrafts.hasDraft && (
            <span className="text-sm text-amber-600 bg-amber-100 px-2 py-1 rounded">
              {1}개
            </span>
          )}
        </div>

        {creationDrafts.hasDraft && creationDrafts.draftData ? (
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <Clock className="w-4 h-4" />
                <span>마지막 저장: {formatLastSaved(creationDrafts.draftData.updated_at)}</span>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(`creation-${creationDrafts.draftData.id}`)}
                className="text-red-500 hover:text-red-700 p-1"
                title="삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Title */}
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {creationDrafts.draftData.title || '제목 없음'}
                  </div>
                  {creationDrafts.draftData.description && (
                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {creationDrafts.draftData.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Category and Items */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">카테고리:</span>
                  <span className="font-medium text-gray-900">
                    {getCategoryName(creationDrafts.draftData.category || 'other')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    {creationDrafts.draftData.items?.length || 0}개 항목
                  </span>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>진행 상태</span>
                  <span>
                    {creationDrafts.draftData.items?.length ? 
                      `${creationDrafts.draftData.items.length}개 항목 추가됨` : 
                      '아직 항목이 없습니다'
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(((creationDrafts.draftData.items?.length || 0) / 16) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>

              {/* Continue button */}
              <div className="pt-2">
                <button
                  onClick={() => handleContinueCreation(creationDrafts.draftData)}
                  disabled={creationDrafts.isRestoring}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  {creationDrafts.isRestoring ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>불러오는 중...</span>
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" />
                      <span>이어서 만들기</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Edit className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">임시저장된 월드컵이 없습니다</p>
            <button
              onClick={() => router.push('/create')}
              className="mt-3 text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1 mx-auto"
            >
              <Plus className="w-4 h-4" />
              새 월드컵 만들기
            </button>
          </div>
        )}
      </div>

      {/* Play Progress */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">진행 중인 게임</h3>
          {playDrafts.hasDraft && (
            <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
              {1}개
            </span>
          )}
        </div>

        {playDrafts.hasDraft && playDrafts.draftData ? (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Clock className="w-4 h-4" />
                <span>마지막 플레이: {formatLastSaved(playDrafts.draftData.updated_at)}</span>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(`play-${playDrafts.draftData.id}`)}
                className="text-red-500 hover:text-red-700 p-1"
                title="삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">현재 라운드</span>
                <span className="font-medium text-gray-900">
                  {playDrafts.draftData.current_round}라운드
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.round((playDrafts.draftData.current_round / playDrafts.draftData.total_rounds) * 100)}%` 
                  }}
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => router.push(`/play/${playDrafts.draftData.worldcup_id}`)}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  <span>이어서 플레이하기</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">진행 중인 게임이 없습니다</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">삭제 확인</h4>
            <p className="text-gray-600 text-sm mb-4">
              임시저장된 내용을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  const [type, id] = showDeleteConfirm.split('-');
                  handleDeleteDraft(type as 'creation' | 'play', id);
                }}
                className="flex-1 px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}