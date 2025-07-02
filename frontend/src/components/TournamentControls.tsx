'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Undo2, 
  Redo2, 
  RotateCcw, 
  Save, 
  History, 
  Clock, 
  ChevronDown,
  ChevronUp,
  Play,
  Pause
} from 'lucide-react';

interface TournamentControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  currentStateInfo?: {
    action: string;
    roundName: string;
    timestamp: number;
    position: number;
    total: number;
  } | null;
  historySummary?: Array<{
    index: number;
    action: string;
    roundName: string;
    timestamp: number;
    isCurrent: boolean;
    isAccessible: boolean;
  }>;
  onJumpToState?: (index: number) => void;
  isAutoSaveEnabled?: boolean;
  compact?: boolean;
}

export default function TournamentControls({
  onUndo,
  onRedo,
  onReset,
  onSave,
  canUndo,
  canRedo,
  currentStateInfo,
  historySummary = [],
  onJumpToState,
  isAutoSaveEnabled = true,
  compact = false
}: TournamentControlsProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatAction = (action: string) => {
    const actionMap: Record<string, string> = {
      'tournament_start': '게임 시작',
      'match_completed': '매치 완료',
      'round_completed': '라운드 완료',
      'tournament_completed': '토너먼트 완료',
      'tournament_reset': '초기화',
      'manual_save': '수동 저장',
      'undo': '되돌리기',
      'redo': '다시 실행'
    };
    return actionMap[action] || action;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded transition-colors ${
            canUndo 
              ? 'text-blue-600 hover:bg-blue-50' 
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title="되돌리기 (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded transition-colors ${
            canRedo 
              ? 'text-blue-600 hover:bg-blue-50' 
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title="다시 실행 (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-gray-300" />

        <button
          onClick={onSave}
          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
          title="저장"
        >
          <Save className="w-4 h-4" />
        </button>

        {currentStateInfo && (
          <div className="text-xs text-gray-600 ml-2">
            {currentStateInfo.position}/{currentStateInfo.total}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          게임 컨트롤
        </h3>
        
        {isAutoSaveEnabled && (
          <div className="flex items-center gap-1 text-xs text-emerald-600">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            자동저장 활성
          </div>
        )}
      </div>

      {/* Main Controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex items-center gap-2 p-3 rounded-lg transition-all ${
            canUndo 
              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-95' 
              : 'bg-gray-50 text-gray-300 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-5 h-5" />
          <span className="font-medium">되돌리기</span>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`flex items-center gap-2 p-3 rounded-lg transition-all ${
            canRedo 
              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-95' 
              : 'bg-gray-50 text-gray-300 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-5 h-5" />
          <span className="font-medium">다시 실행</span>
        </button>

        <button
          onClick={onSave}
          className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-all active:scale-95"
        >
          <Save className="w-5 h-5" />
          <span className="font-medium">저장</span>
        </button>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-2 p-3 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-all active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="font-medium">초기화</span>
        </button>
      </div>

      {/* Current State Info */}
      {currentStateInfo && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="font-medium text-gray-900">
                {formatAction(currentStateInfo.action)}
              </div>
              <div className="text-gray-600">
                {currentStateInfo.roundName}
              </div>
            </div>
            <div className="text-right text-gray-500 text-xs">
              <div>{formatTime(currentStateInfo.timestamp)}</div>
              <div>{currentStateInfo.position}/{currentStateInfo.total}</div>
            </div>
          </div>
        </div>
      )}

      {/* History Toggle */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="w-full flex items-center justify-between p-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <span>히스토리 보기</span>
        {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* History List */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto space-y-1 mt-3">
              {historySummary.map((state) => (
                <button
                  key={state.index}
                  onClick={() => onJumpToState?.(state.index)}
                  className={`w-full text-left p-2 rounded text-xs transition-colors ${
                    state.isCurrent
                      ? 'bg-blue-100 text-blue-900 border-l-2 border-blue-500'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {formatAction(state.action)}
                      </div>
                      <div className="text-gray-500">
                        {state.roundName}
                      </div>
                    </div>
                    <div className="text-gray-400">
                      {formatTime(state.timestamp)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2">토너먼트 초기화</h3>
              <p className="text-gray-600 mb-4">
                모든 진행사항이 삭제되고 처음부터 다시 시작됩니다. 
                이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onReset();
                    setShowResetConfirm(false);
                  }}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  초기화
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Help */}
      <div className="mt-4 pt-3 border-t text-xs text-gray-500">
        <div className="grid grid-cols-2 gap-2">
          <div>Ctrl+Z: 되돌리기</div>
          <div>Ctrl+Y: 다시 실행</div>
          <div>Ctrl+S: 저장</div>
          <div>Esc: 되돌리기</div>
        </div>
      </div>
    </div>
  );
}

// Floating controls for game screen
export function FloatingTournamentControls({
  onUndo,
  canUndo,
  currentStateInfo
}: Pick<TournamentControlsProps, 'onUndo' | 'canUndo' | 'currentStateInfo'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-40"
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 flex items-center gap-3">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2 rounded-lg transition-colors ${
            canUndo 
              ? 'text-blue-600 hover:bg-blue-50' 
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title="되돌리기 (Esc)"
        >
          <Undo2 className="w-5 h-5" />
        </button>

        {currentStateInfo && (
          <div className="text-sm text-gray-600">
            <div className="font-medium">{currentStateInfo.roundName}</div>
            <div className="text-xs text-gray-500">
              {currentStateInfo.position}/{currentStateInfo.total}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}