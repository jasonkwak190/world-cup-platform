'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Clock } from 'lucide-react';
import { useDraftManagement } from '@/hooks/useDraftManagement';
import DraftManagementModal from './DraftManagementModal';

interface DraftManagementButtonProps {
  variant?: 'default' | 'compact' | 'icon';
  className?: string;
  showBadge?: boolean;
}

export default function DraftManagementButton({
  variant = 'default',
  className = '',
  showBadge = true
}: DraftManagementButtonProps) {
  const {
    stats,
    loadDraftStats,
    restoreCreationDraft,
    continuePlayDraft,
    deleteCreationDraft,
    deletePlayDraft,
  } = useDraftManagement();

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadDraftStats();
  }, [loadDraftStats]);

  const handleRestoreDraft = async (draftId: string, type: 'creation' | 'play') => {
    try {
      if (type === 'creation') {
        await restoreCreationDraft(draftId);
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
        await deletePlayDraft(draftId, draftId);
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

  const totalDrafts = stats?.totalDrafts || 0;
  const hasDrafts = totalDrafts > 0;

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className={`relative p-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
          title="저장된 초안 관리"
        >
          <FileText className="w-5 h-5" />
          {showBadge && hasDrafts && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {totalDrafts > 9 ? '9+' : totalDrafts}
            </span>
          )}
        </button>

        <DraftManagementModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onRestoreDraft={handleRestoreDraft}
          onDeleteDraft={handleDeleteDraft}
          onContinuePlay={handleContinuePlay}
        />
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className={`relative flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors ${className}`}
        >
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">초안</span>
          {showBadge && hasDrafts && (
            <span className="w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
              {totalDrafts > 9 ? '9+' : totalDrafts}
            </span>
          )}
        </button>

        <DraftManagementModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onRestoreDraft={handleRestoreDraft}
          onDeleteDraft={handleDeleteDraft}
          onContinuePlay={handleContinuePlay}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`relative flex items-center space-x-3 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-colors ${className}`}
      >
        <FileText className="w-5 h-5 text-gray-600" />
        <div className="flex-1 text-left">
          <p className="font-medium text-gray-900">저장된 초안</p>
          <p className="text-sm text-gray-500">
            {hasDrafts ? `${totalDrafts}개의 초안` : '초안이 없습니다'}
          </p>
        </div>
        {showBadge && hasDrafts && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              <span>{stats?.creationDrafts || 0}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{stats?.playDrafts || 0}</span>
            </div>
          </div>
        )}
      </button>

      <DraftManagementModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onRestoreDraft={handleRestoreDraft}
        onDeleteDraft={handleDeleteDraft}
        onContinuePlay={handleContinuePlay}
      />
    </>
  );
}