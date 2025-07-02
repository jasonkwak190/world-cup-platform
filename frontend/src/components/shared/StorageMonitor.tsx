'use client';

import { useState, useEffect } from 'react';
import { HardDrive, AlertTriangle, CheckCircle, Database } from 'lucide-react';

interface StorageInfo {
  used: number;
  quota: number;
  usagePercentage: number;
  localStorageUsed: number;
  indexedDBUsed: number;
}

export default function StorageMonitor() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    checkStorageUsage();
  }, []);

  const checkStorageUsage = async () => {
    try {
      // 전체 저장소 사용량 확인
      let quota = 0;
      let used = 0;
      
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        quota = estimate.quota || 0;
        used = estimate.usage || 0;
      }

      // localStorage 사용량 확인
      let localStorageUsed = 0;
      try {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          localStorageUsed += localStorage.getItem(key)?.length || 0;
        }
        localStorageUsed *= 2; // UTF-16 encoding
      } catch (error) {
        console.warn('Failed to calculate localStorage usage:', error);
      }

      // IndexedDB 사용량 (추정)
      const indexedDBUsed = Math.max(0, used - localStorageUsed);

      const usagePercentage = quota > 0 ? (used / quota) * 100 : 0;

      setStorageInfo({
        used,
        quota,
        usagePercentage,
        localStorageUsed,
        indexedDBUsed
      });
    } catch (error) {
      console.error('Failed to check storage usage:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getStatusColor = (percentage: number): string => {
    if (percentage < 50) return 'text-green-500';
    if (percentage < 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage < 80) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  if (!storageInfo) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 border">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">저장소 정보 로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 border shadow-sm">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <HardDrive className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-gray-900">저장소 상태</span>
          {getStatusIcon(storageInfo.usagePercentage)}
        </div>
        <div className="text-right">
          <div className={`text-sm font-medium ${getStatusColor(storageInfo.usagePercentage)}`}>
            {storageInfo.usagePercentage.toFixed(1)}% 사용
          </div>
          <div className="text-xs text-gray-500">
            {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            storageInfo.usagePercentage < 50 
              ? 'bg-green-500' 
              : storageInfo.usagePercentage < 80 
                ? 'bg-yellow-500' 
                : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(storageInfo.usagePercentage, 100)}%` }}
        />
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3 border-t pt-3">
          {/* localStorage 정보 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded"></div>
              <span className="text-sm text-gray-600">localStorage</span>
            </div>
            <span className="text-sm font-medium">
              {formatBytes(storageInfo.localStorageUsed)}
            </span>
          </div>

          {/* IndexedDB 정보 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-3 h-3 text-purple-500" />
              <span className="text-sm text-gray-600">IndexedDB</span>
            </div>
            <span className="text-sm font-medium">
              {formatBytes(storageInfo.indexedDBUsed)}
            </span>
          </div>

          {/* 권장사항 */}
          {storageInfo.usagePercentage > 80 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-xs text-yellow-800">
                  <p className="font-medium mb-1">저장 공간 부족</p>
                  <p>브라우저 설정에서 저장 공간을 늘리거나 오래된 데이터를 정리하세요.</p>
                </div>
              </div>
            </div>
          )}

          {/* 새로고침 버튼 */}
          <button
            onClick={checkStorageUsage}
            className="w-full text-xs text-blue-600 hover:text-blue-800 transition-colors py-1"
          >
            새로고침
          </button>
        </div>
      )}
    </div>
  );
}