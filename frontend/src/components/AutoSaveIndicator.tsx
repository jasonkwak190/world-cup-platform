'use client';

import React from 'react';
import { SaveStatus } from '@/hooks/useActionAutoSave';
import { Save, Check, X, Loader2, RefreshCw } from 'lucide-react';

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSaved?: Date | null;
  retryAttempt?: number;
  className?: string;
  showText?: boolean;
}

export default function AutoSaveIndicator({ 
  status, 
  lastSaved, 
  retryAttempt = 0,
  className = '', 
  showText = true 
}: AutoSaveIndicatorProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'saving':
        return { 
          icon: <Loader2 className="w-4 h-4 animate-spin" />, 
          text: '저장 중...', 
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          textColor: 'text-blue-600'
        };
      case 'retrying':
        return { 
          icon: <RefreshCw className="w-4 h-4 animate-spin" />, 
          text: `재시도 중... (${retryAttempt})`, 
          color: 'text-orange-600 bg-orange-50 border-orange-200',
          textColor: 'text-orange-600'
        };
      case 'saved':
        return { 
          icon: <Check className="w-4 h-4" />, 
          text: '저장됨', 
          color: 'text-green-600 bg-green-50 border-green-200',
          textColor: 'text-green-600'
        };
      case 'error':
        return { 
          icon: <X className="w-4 h-4" />, 
          text: '저장 실패', 
          color: 'text-red-600 bg-red-50 border-red-200',
          textColor: 'text-red-600'
        };
      default:
        return null;
    }
  };

  const display = getStatusDisplay();
  if (!display) return null;

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 30) {
      return '방금 전';
    } else if (diffSeconds < 60) {
      return `${diffSeconds}초 전`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}분 전`;
    } else {
      return date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-200 ${display.color} ${className}`}>
      {display.icon}
      {showText && (
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${display.textColor}`}>
            {display.text}
          </span>
          {lastSaved && status === 'saved' && (
            <span className="text-xs text-gray-500">
              {formatLastSaved(lastSaved)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for tight spaces
export function CompactAutoSaveIndicator({ 
  status, 
  retryAttempt = 0, 
  className = '' 
}: { 
  status: SaveStatus; 
  retryAttempt?: number;
  className?: string; 
}) {
  return (
    <AutoSaveIndicator 
      status={status} 
      retryAttempt={retryAttempt}
      showText={false} 
      className={`p-1.5 ${className}`}
    />
  );
}