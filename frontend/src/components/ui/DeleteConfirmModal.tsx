'use client';

import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  title,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
      />
      
      {/* 모달 내용 */}
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 transform transition-all z-[10000]">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            월드컵 삭제 확인
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            다음 월드컵을 삭제하시겠습니까?
          </p>
          <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded border-l-4 border-red-500">
            &ldquo;{title}&rdquo;
          </p>
          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start">
              <Trash2 className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium mb-1">⚠️ 주의사항</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>삭제된 월드컵은 복구할 수 없습니다</li>
                  <li>업로드된 모든 이미지가 함께 삭제됩니다</li>
                  <li>참여 기록과 통계도 모두 사라집니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}