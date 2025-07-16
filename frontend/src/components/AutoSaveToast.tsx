'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, RefreshCw, Clock, Wifi } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'retry';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

interface AutoSaveToastProps {
  toast: Toast | null;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export default function AutoSaveToast({ 
  toast, 
  onClose, 
  position = 'top-right' 
}: AutoSaveToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (toast) {
      setIsVisible(true);
      
      if (!toast.persistent && toast.duration) {
        setTimeLeft(toast.duration);
        
        const timer = setTimeout(() => {
          handleClose();
        }, toast.duration);

        // Update countdown every second
        const countdownTimer = setInterval(() => {
          setTimeLeft(prev => Math.max(0, prev - 1000));
        }, 1000);

        return () => {
          clearTimeout(timer);
          clearInterval(countdownTimer);
        };
      }
    } else {
      setIsVisible(false);
    }
  }, [toast]);

  const handleClose = () => {
    setIsVisible(false);
    if (toast) {
      onClose(toast.id);
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'error':
        return <X className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'retry':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getColorClasses = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'retry':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getAnimationProps = (position: string) => {
    const isTop = position.includes('top');
    const isRight = position.includes('right');
    
    return {
      initial: { 
        opacity: 0, 
        x: isRight ? 20 : -20, 
        y: isTop ? -20 : 20 
      },
      animate: { 
        opacity: 1, 
        x: 0, 
        y: 0 
      },
      exit: { 
        opacity: 0, 
        x: isRight ? 20 : -20, 
        y: isTop ? -20 : 20 
      }
    };
  };

  if (!toast) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          {...getAnimationProps(position)}
          className={`fixed ${getPositionClasses(position)} z-50 max-w-md w-full`}
        >
          <div className={`rounded-lg border p-4 shadow-lg ${getColorClasses(toast.type)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getIcon(toast.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">
                    {toast.title}
                  </h3>
                  <p className="text-sm mb-3">
                    {toast.message}
                  </p>
                  
                  {toast.action && (
                    <button
                      onClick={toast.action.handler}
                      className="text-sm font-medium underline hover:no-underline transition-all"
                    >
                      {toast.action.label}
                    </button>
                  )}

                  {/* Countdown timer for non-persistent toasts */}
                  {!toast.persistent && toast.duration && timeLeft > 0 && (
                    <div className="flex items-center space-x-2 mt-2 text-xs opacity-60">
                      <Clock className="w-3 h-3" />
                      <span>{Math.ceil(timeLeft / 1000)}초 후 자동 닫힘</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleClose}
                className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar for countdown */}
            {!toast.persistent && toast.duration && timeLeft > 0 && (
              <div className="mt-3 w-full bg-black/10 rounded-full h-1">
                <div
                  className="bg-current h-1 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(timeLeft / toast.duration) * 100}%` }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toast manager hook
export function useAutoSaveToast() {
  const [currentToast, setCurrentToast] = useState<Toast | null>(null);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    setCurrentToast({
      ...toast,
      id: `toast-${Date.now()}`,
    });
  };

  const hideToast = () => {
    setCurrentToast(null);
  };

  const showSuccess = (title: string, message: string, duration: number = 3000) => {
    showToast({
      type: 'success',
      title,
      message,
      duration,
    });
  };

  const showError = (title: string, message: string, action?: Toast['action']) => {
    showToast({
      type: 'error',
      title,
      message,
      persistent: true,
      action,
    });
  };

  const showWarning = (title: string, message: string, duration: number = 5000) => {
    showToast({
      type: 'warning',
      title,
      message,
      duration,
    });
  };

  const showRetry = (title: string, message: string, retryHandler: () => void) => {
    showToast({
      type: 'retry',
      title,
      message,
      persistent: true,
      action: {
        label: '다시 시도',
        handler: retryHandler,
      },
    });
  };

  const showNetworkError = (retryHandler: () => void) => {
    showError(
      '네트워크 오류',
      '인터넷 연결을 확인하고 다시 시도해주세요.',
      {
        label: '다시 시도',
        handler: retryHandler,
      }
    );
  };

  const showQuotaError = (manageHandler: () => void) => {
    showError(
      '저장 공간 부족',
      '저장 공간이 부족합니다. 오래된 초안을 정리해주세요.',
      {
        label: '초안 관리',
        handler: manageHandler,
      }
    );
  };

  const showOfflineWarning = () => {
    showWarning(
      '오프라인 상태',
      '인터넷 연결이 끊어졌습니다. 연결이 복구되면 자동으로 저장됩니다.',
      0 // Persistent until online
    );
  };

  return {
    currentToast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showRetry,
    showNetworkError,
    showQuotaError,
    showOfflineWarning,
  };
}

// Component for rendering toast notifications
export function AutoSaveToastContainer() {
  const { currentToast, hideToast } = useAutoSaveToast();

  return (
    <AutoSaveToast
      toast={currentToast}
      onClose={hideToast}
      position="top-right"
    />
  );
}