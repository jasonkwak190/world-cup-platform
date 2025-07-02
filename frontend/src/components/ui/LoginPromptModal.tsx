'use client';

import { X } from 'lucide-react';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  message: string;
}

export default function LoginPromptModal({
  isOpen,
  onClose,
  onLogin,
  message
}: LoginPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* 모달 내용 */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            로그인이 필요합니다
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            {message}
          </p>

          {/* 버튼들 */}
          <div className="flex space-x-3">
            <button
              onClick={onLogin}
              className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              로그인하기
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}