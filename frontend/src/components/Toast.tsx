'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, X, Share } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // 애니메이션 완료 후 제거
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <X className="w-5 h-5" />;
      case 'info':
        return <Share className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-600 text-white';
      case 'error':
        return 'bg-red-600 text-white';
      case 'info':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-emerald-600 text-white';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[10000] transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
    >
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg ${getColors()}`}>
        {getIcon()}
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={handleClose}
          className="ml-2 hover:bg-black hover:bg-opacity-10 rounded-full p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Toast 관리자
class ToastManager {
  private toasts: { id: string; component: React.ReactElement }[] = [];
  private container: HTMLElement | null = null;

  private getContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  show(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3000) {
    const id = Math.random().toString(36).substring(7);
    
    const onClose = () => {
      this.remove(id);
    };

    const toastElement = (
      <Toast
        key={id}
        message={message}
        type={type}
        duration={duration}
        onClose={onClose}
      />
    );

    this.toasts.push({ id, component: toastElement });
    this.render();
  }

  private remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.render();
  }

  private render() {
    if (typeof window !== 'undefined') {
      const container = this.getContainer();
      // React 컴포넌트를 DOM에 렌더링하는 방법이 필요하지만
      // 여기서는 간단한 DOM 조작으로 대체
    }
  }
}

export const toast = new ToastManager();

// 간단한 toast 함수들 (DOM 기반)
export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  // 기존 토스트 제거
  const existingToasts = document.querySelectorAll('.toast-notification');
  existingToasts.forEach(toast => toast.remove());

  // 새 토스트 생성
  const toast = document.createElement('div');
  toast.className = 'toast-notification fixed top-4 right-4 z-[10000] transform transition-all duration-300';
  
  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-600 text-white';
      case 'error':
        return 'bg-red-600 text-white';
      case 'info':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-emerald-600 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
        return 'ℹ';
      default:
        return '✓';
    }
  };

  // 안전한 DOM 요소 생성 (XSS 방지)
  const toastInner = document.createElement('div');
  toastInner.className = `flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg ${getColors()}`;
  
  const iconSpan = document.createElement('span');
  iconSpan.className = 'text-lg';
  iconSpan.textContent = getIcon();
  
  const messageSpan = document.createElement('span');
  messageSpan.className = 'text-sm font-medium';
  messageSpan.textContent = message; // textContent로 안전하게 처리
  
  const closeButton = document.createElement('button');
  closeButton.className = 'ml-2 hover:bg-black hover:bg-opacity-10 rounded-full p-1 transition-colors toast-close';
  const closeSpan = document.createElement('span');
  closeSpan.className = 'text-sm';
  closeSpan.textContent = '✕';
  closeButton.appendChild(closeSpan);
  
  toastInner.appendChild(iconSpan);
  toastInner.appendChild(messageSpan);
  toastInner.appendChild(closeButton);
  toast.appendChild(toastInner);

  document.body.appendChild(toast);

  // 닫기 버튼 이벤트
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn?.addEventListener('click', () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    setTimeout(() => toast.remove(), 300);
  });

  // 자동 제거 (3초)
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-8px)';
      setTimeout(() => toast.remove(), 300);
    }
  }, 3000);

  // 초기 애니메이션
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });
};