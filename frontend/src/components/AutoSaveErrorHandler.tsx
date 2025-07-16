'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, RefreshCw, Wifi, WifiOff, Info } from 'lucide-react';

export interface AutoSaveError {
  id: string;
  message: string;
  type: 'network' | 'server' | 'quota' | 'validation' | 'unknown';
  timestamp: number;
  retryCount: number;
  canRetry: boolean;
  details?: string;
}

interface AutoSaveErrorHandlerProps {
  error: AutoSaveError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export default function AutoSaveErrorHandler({
  error,
  onRetry,
  onDismiss,
  className = ''
}: AutoSaveErrorHandlerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      
      // Auto-hide non-critical errors after 5 seconds
      if (error.type !== 'server' && error.type !== 'quota') {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 5000);
        setAutoHideTimer(timer);
      }
    } else {
      setIsVisible(false);
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
        setAutoHideTimer(null);
      }
    }

    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, [error, autoHideTimer]);

  const getErrorIcon = (type: AutoSaveError['type']) => {
    switch (type) {
      case 'network':
        return <WifiOff className="w-5 h-5" />;
      case 'server':
        return <AlertTriangle className="w-5 h-5" />;
      case 'quota':
        return <Info className="w-5 h-5" />;
      case 'validation':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getErrorColor = (type: AutoSaveError['type']) => {
    switch (type) {
      case 'network':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'server':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'quota':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'validation':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getErrorTitle = (type: AutoSaveError['type']) => {
    switch (type) {
      case 'network':
        return '네트워크 오류';
      case 'server':
        return '서버 오류';
      case 'quota':
        return '저장 공간 부족';
      case 'validation':
        return '데이터 검증 오류';
      default:
        return '자동 저장 오류';
    }
  };

  const getErrorDescription = (error: AutoSaveError) => {
    switch (error.type) {
      case 'network':
        return !isOnline 
          ? '인터넷 연결을 확인하고 다시 시도해주세요.'
          : '네트워크 연결이 불안정합니다. 잠시 후 다시 시도됩니다.';
      case 'server':
        return '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      case 'quota':
        return '저장 공간이 부족합니다. 오래된 초안을 정리하거나 관리자에게 문의하세요.';
      case 'validation':
        return '저장하려는 데이터에 문제가 있습니다.';
      default:
        return error.message || '자동 저장 중 오류가 발생했습니다.';
    }
  };

  const getActionButton = (error: AutoSaveError) => {
    if (!error.canRetry) {
      return null;
    }

    switch (error.type) {
      case 'network':
        return (
          <button
            onClick={onRetry}
            className="flex items-center space-x-2 px-3 py-1.5 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>다시 시도</span>
          </button>
        );
      case 'server':
        return (
          <button
            onClick={onRetry}
            className="flex items-center space-x-2 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>재시도</span>
          </button>
        );
      case 'quota':
        return (
          <button
            onClick={() => {
              // Navigate to draft management
              const event = new CustomEvent('open-draft-management');
              window.dispatchEvent(event);
            }}
            className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <Info className="w-4 h-4" />
            <span>초안 관리</span>
          </button>
        );
      default:
        return (
          <button
            onClick={onRetry}
            className="flex items-center space-x-2 px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>다시 시도</span>
          </button>
        );
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!error) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 right-4 z-50 max-w-md w-full ${className}`}
        >
          <div className={`rounded-lg border p-4 shadow-lg ${getErrorColor(error.type)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getErrorIcon(error.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">
                    {getErrorTitle(error.type)}
                  </h3>
                  <p className="text-sm mb-3">
                    {getErrorDescription(error)}
                  </p>
                  
                  {error.details && (
                    <details className="mb-3">
                      <summary className="text-xs cursor-pointer hover:underline">
                        자세한 정보
                      </summary>
                      <p className="text-xs mt-1 font-mono bg-black/10 p-2 rounded">
                        {error.details}
                      </p>
                    </details>
                  )}

                  {error.retryCount > 0 && (
                    <p className="text-xs mb-3">
                      재시도 횟수: {error.retryCount}
                    </p>
                  )}

                  {!isOnline && (
                    <div className="flex items-center space-x-2 text-xs mb-3">
                      <WifiOff className="w-3 h-3" />
                      <span>오프라인 상태</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    {getActionButton(error)}
                  </div>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Error factory functions
export const createNetworkError = (message: string, retryCount: number = 0): AutoSaveError => ({
  id: `network-${Date.now()}`,
  message,
  type: 'network',
  timestamp: Date.now(),
  retryCount,
  canRetry: true,
});

export const createServerError = (message: string, details?: string, retryCount: number = 0): AutoSaveError => ({
  id: `server-${Date.now()}`,
  message,
  type: 'server',
  timestamp: Date.now(),
  retryCount,
  canRetry: true,
  details,
});

export const createQuotaError = (message: string): AutoSaveError => ({
  id: `quota-${Date.now()}`,
  message,
  type: 'quota',
  timestamp: Date.now(),
  retryCount: 0,
  canRetry: false,
});

export const createValidationError = (message: string, details?: string): AutoSaveError => ({
  id: `validation-${Date.now()}`,
  message,
  type: 'validation',
  timestamp: Date.now(),
  retryCount: 0,
  canRetry: false,
  details,
});

export const createUnknownError = (message: string, retryCount: number = 0): AutoSaveError => ({
  id: `unknown-${Date.now()}`,
  message,
  type: 'unknown',
  timestamp: Date.now(),
  retryCount,
  canRetry: true,
});

// Error classification utility
export const classifyError = (error: Error, retryCount: number = 0): AutoSaveError => {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return createNetworkError(error.message, retryCount);
  }
  
  if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
    return createServerError(error.message, error.stack, retryCount);
  }
  
  if (message.includes('quota') || message.includes('storage') || message.includes('limit')) {
    return createQuotaError(error.message);
  }
  
  if (message.includes('validation') || message.includes('invalid') || message.includes('malformed')) {
    return createValidationError(error.message, error.stack);
  }
  
  return createUnknownError(error.message, retryCount);
};