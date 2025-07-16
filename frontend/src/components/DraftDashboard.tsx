'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Clock, HardDrive, Trash2, Download, AlertTriangle, Info } from 'lucide-react';
import { useDraftManagement } from '@/hooks/useDraftManagement';
import DraftManagementModal from './DraftManagementModal';

export default function DraftDashboard() {
  const {
    stats,
    loading,
    error,
    loadDraftStats,
    cleanupOldDrafts,
    restoreCreationDraft,
    continuePlayDraft,
    deleteCreationDraft,
    deletePlayDraft,
  } = useDraftManagement();

  const [showDraftModal, setShowDraftModal] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<any>(null);

  useEffect(() => {
    loadDraftStats();
  }, [loadDraftStats]);

  const handleCleanupOldDrafts = async () => {
    try {
      setCleanupLoading(true);
      setCleanupResult(null);
      
      const result = await cleanupOldDrafts('all', false);
      setCleanupResult(result);
    } catch (err) {
      console.error('Cleanup failed:', err);
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleRestoreDraft = async (draftId: string, type: 'creation' | 'play') => {
    try {
      if (type === 'creation') {
        await restoreCreationDraft(draftId);
      } else {
        // For play drafts, we need the worldcup_id
        // This should be handled by the modal
        console.warn('Play draft restore should be handled by continue play');
      }
    } catch (err) {
      console.error('Failed to restore draft:', err);
    }
  };

  const handleDeleteDraft = async (draftId: string, type: 'creation' | 'play') => {
    try {
      if (type === 'creation') {
        await deleteCreationDraft(draftId);
      } else {
        await deletePlayDraft(draftId, draftId); // Assuming draftId is worldcup_id
      }
    } catch (err) {
      console.error('Failed to delete draft:', err);
    }
  };

  const handleContinuePlay = async (draftId: string, worldcupId: string) => {
    try {
      await continuePlayDraft(draftId, worldcupId);
    } catch (err) {
      console.error('Failed to continue play:', err);
    }
  };

  const formatDataSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3 text-red-600 mb-4">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-semibold">오류 발생</h3>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadDraftStats}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">저장된 초안</h2>
            <p className="text-sm text-gray-600">
              월드컵 생성 초안과 게임 진행 상황을 관리하세요
            </p>
          </div>
          <button
            onClick={() => setShowDraftModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            초안 관리
          </button>
        </div>

        {stats && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 opacity-80" />
                  <div>
                    <p className="text-sm opacity-90">총 초안</p>
                    <p className="text-2xl font-bold">{stats.totalDrafts}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 opacity-80" />
                  <div>
                    <p className="text-sm opacity-90">생성 초안</p>
                    <p className="text-2xl font-bold">{stats.creationDrafts}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="w-8 h-8 opacity-80" />
                  <div>
                    <p className="text-sm opacity-90">게임 진행</p>
                    <p className="text-2xl font-bold">{stats.playDrafts}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <HardDrive className="w-8 h-8 opacity-80" />
                  <div>
                    <p className="text-sm opacity-90">사용 용량</p>
                    <p className="text-2xl font-bold">{formatDataSize(stats.totalSize)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Draft Information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Info className="w-5 h-5 mr-2 text-blue-500" />
                초안 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">가장 오래된 초안</p>
                  <p className="font-medium">{formatDate(stats.oldestDraft)}</p>
                </div>
                <div>
                  <p className="text-gray-600">가장 최근 초안</p>
                  <p className="font-medium">{formatDate(stats.newestDraft)}</p>
                </div>
              </div>
            </div>

            {/* Cleanup Section */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Trash2 className="w-5 h-5 mr-2 text-red-500" />
                정리 도구
              </h3>
              <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div>
                  <p className="font-medium text-yellow-800">오래된 초안 정리</p>
                  <p className="text-sm text-yellow-700">
                    30일 이상 된 생성 초안과 7일 이상 된 게임 진행 상황을 삭제합니다.
                  </p>
                </div>
                <button
                  onClick={handleCleanupOldDrafts}
                  disabled={cleanupLoading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {cleanupLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>정리 중...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>정리하기</span>
                    </>
                  )}
                </button>
              </div>

              {cleanupResult && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="font-medium text-green-800">정리 완료</p>
                  </div>
                  <p className="text-sm text-green-700">
                    {cleanupResult.deletedCount}개의 오래된 초안이 삭제되었습니다.
                  </p>
                  {cleanupResult.results.length > 0 && (
                    <div className="mt-2 text-xs text-green-600">
                      {cleanupResult.results.map((result: any, index: number) => (
                        <div key={index}>
                          {result.type}: {result.count}개
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Draft Management Modal */}
      <DraftManagementModal
        isOpen={showDraftModal}
        onClose={() => setShowDraftModal(false)}
        onRestoreDraft={handleRestoreDraft}
        onDeleteDraft={handleDeleteDraft}
        onContinuePlay={handleContinuePlay}
      />
    </>
  );
}