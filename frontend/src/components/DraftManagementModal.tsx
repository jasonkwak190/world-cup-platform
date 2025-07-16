'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Trash2, Edit, Play, FileText, AlertCircle } from 'lucide-react';

interface DraftItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  itemCount: number;
  videoCount: number;
  lastSaved: string;
  dataSize: number;
  type: 'creation' | 'play';
  worldcupId?: string;
  progress?: {
    currentRound: number;
    totalRounds: number;
    percentage: number;
  };
}

interface DraftManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreDraft: (draftId: string, type: 'creation' | 'play') => void;
  onDeleteDraft: (draftId: string, type: 'creation' | 'play') => void;
  onContinuePlay: (draftId: string, worldcupId: string) => void;
}

export default function DraftManagementModal({
  isOpen,
  onClose,
  onRestoreDraft,
  onDeleteDraft,
  onContinuePlay
}: DraftManagementModalProps) {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'creation' | 'play'>('all');

  useEffect(() => {
    if (isOpen) {
      loadDrafts();
    }
  }, [isOpen]);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both creation and play drafts
      const [creationResponse, playResponse] = await Promise.all([
        fetch('/api/autosave/draft'),
        fetch('/api/autosave/play?list=true')
      ]);

      const creationDrafts = creationResponse.ok ? await creationResponse.json() : { drafts: [] };
      const playDrafts = playResponse.ok ? await playResponse.json() : { drafts: [] };

      // Transform and combine drafts
      const allDrafts: DraftItem[] = [
        ...creationDrafts.drafts?.map((draft: any) => ({
          id: draft.id,
          title: draft.title || 'Untitled Draft',
          description: draft.description,
          category: draft.category || 'entertainment',
          itemCount: draft.items?.length || 0,
          videoCount: draft.videoItems?.length || 0,
          lastSaved: draft.updated_at,
          dataSize: draft.data_size || 0,
          type: 'creation' as const,
        })) || [],
        ...playDrafts.drafts?.map((draft: any) => ({
          id: draft.id,
          title: draft.worldcup_title || 'Unknown Tournament',
          description: `${draft.current_round}/${draft.total_rounds} rounds completed`,
          category: 'play',
          itemCount: draft.remaining_items?.length || 0,
          videoCount: 0,
          lastSaved: draft.updated_at,
          dataSize: draft.data_size || 0,
          type: 'play' as const,
          worldcupId: draft.worldcup_id,
          progress: {
            currentRound: draft.current_round,
            totalRounds: draft.total_rounds,
            percentage: Math.round((draft.current_round / draft.total_rounds) * 100),
          },
        })) || []
      ];

      // Sort by last saved (newest first)
      allDrafts.sort((a, b) => new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime());

      setDrafts(allDrafts);
    } catch (err) {
      console.error('Failed to load drafts:', err);
      setError('Failed to load drafts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string, type: 'creation' | 'play') => {
    try {
      setDeletingId(draftId);
      
      const url = type === 'creation' ? '/api/autosave/draft' : '/api/autosave/play';
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId })
      });

      if (!response.ok) {
        throw new Error('Failed to delete draft');
      }

      // Remove from local state
      setDrafts(prev => prev.filter(draft => draft.id !== draftId));
      
      // Notify parent
      onDeleteDraft(draftId, type);
    } catch (err) {
      console.error('Failed to delete draft:', err);
      setError('Failed to delete draft. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestoreDraft = (draftId: string, type: 'creation' | 'play') => {
    onRestoreDraft(draftId, type);
    onClose();
  };

  const handleContinuePlay = (draftId: string, worldcupId: string) => {
    onContinuePlay(draftId, worldcupId);
    onClose();
  };

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

  const formatDataSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredDrafts = drafts.filter(draft => {
    if (activeTab === 'all') return true;
    return draft.type === activeTab;
  });

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
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl relative overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">저장된 초안</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    저장된 월드컵 초안과 게임 진행 상황을 관리하세요
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex mt-4 space-x-1 bg-gray-100 p-1 rounded-lg">
                {[
                  { id: 'all', label: '전체', count: drafts.length },
                  { id: 'creation', label: '생성 초안', count: drafts.filter(d => d.type === 'creation').length },
                  { id: 'play', label: '게임 진행', count: drafts.filter(d => d.type === 'play').length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  <span className="ml-3 text-gray-600">불러오는 중...</span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 font-medium">{error}</p>
                    <button
                      onClick={loadDrafts}
                      className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      다시 시도
                    </button>
                  </div>
                </div>
              ) : filteredDrafts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">저장된 초안이 없습니다</p>
                  <p className="text-gray-400 mt-2">
                    월드컵을 만들거나 게임을 진행하면 자동으로 저장됩니다
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDrafts.map(draft => (
                    <motion.div
                      key={draft.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              draft.type === 'creation' ? 'bg-blue-500' : 'bg-green-500'
                            }`} />
                            <h3 className="font-semibold text-gray-900 line-clamp-1">
                              {draft.title}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              draft.type === 'creation' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {draft.type === 'creation' ? '생성' : '게임'}
                            </span>
                          </div>
                          
                          {draft.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {draft.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatLastSaved(draft.lastSaved)}</span>
                            </div>
                            <div>
                              {draft.type === 'creation' ? (
                                <span>
                                  아이템 {draft.itemCount}개
                                  {draft.videoCount > 0 && ` + 동영상 ${draft.videoCount}개`}
                                </span>
                              ) : (
                                <span>
                                  {draft.progress?.currentRound}/{draft.progress?.totalRounds} 라운드 ({draft.progress?.percentage}%)
                                </span>
                              )}
                            </div>
                            <div>
                              {formatDataSize(draft.dataSize)}
                            </div>
                          </div>

                          {draft.type === 'play' && draft.progress && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                <span>진행률</span>
                                <span>{draft.progress.percentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${draft.progress.percentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {draft.type === 'creation' ? (
                            <button
                              onClick={() => handleRestoreDraft(draft.id, draft.type)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              <Edit className="w-4 h-4" />
                              <span>편집</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleContinuePlay(draft.id, draft.worldcupId!)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              <Play className="w-4 h-4" />
                              <span>계속하기</span>
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteDraft(draft.id, draft.type)}
                            disabled={deletingId === draft.id}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                          >
                            {deletingId === draft.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            <span>삭제</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}