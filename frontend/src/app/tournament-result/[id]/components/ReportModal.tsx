'use client';

import React, { useState } from 'react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description?: string) => void;
  title?: string;
}

const REPORT_REASONS = [
  { value: 'inappropriate_content', label: '부적절한 콘텐츠' },
  { value: 'spam', label: '스팸/도배' },
  { value: 'copyright', label: '저작권 침해' },
  { value: 'harassment', label: '괴롭힘/혐오' },
  { value: 'other', label: '기타' }
];

export default function ReportModal({ isOpen, onClose, onSubmit, title = "월드컵 신고하기" }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason) {
      alert('신고 사유를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(selectedReason, description.trim() || undefined);
      setSelectedReason('');
      setDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                신고 사유 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => (
                  <label key={reason.value} className="flex items-center">
                    <input
                      type="radio"
                      name="reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="mr-3 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                      disabled={isSubmitting}
                    />
                    <span className="text-gray-700">{reason.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상세 설명 (선택사항)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="신고 사유에 대해 자세히 설명해주세요..."
                rows={4}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                disabled={isSubmitting}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {description.length}/500
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex">
                <div className="text-yellow-600 text-sm">
                  <strong>신고 안내:</strong>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>허위 신고는 제재를 받을 수 있습니다</li>
                    <li>신고 처리에는 1-3일이 소요됩니다</li>
                    <li>결과는 별도로 안내드리지 않습니다</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !selectedReason}
              >
                {isSubmitting ? '신고 접수 중...' : '신고하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}