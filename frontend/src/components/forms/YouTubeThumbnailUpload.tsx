'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileImage, Shuffle } from 'lucide-react';
import type { WorldCupMediaItem } from '@/types/media';

interface YouTubeThumbnailUploadProps {
  videoItems: WorldCupMediaItem[];
  thumbnail?: string | File;
  onThumbnailUpload?: (thumbnail: string | File) => void;
}

export default function YouTubeThumbnailUpload({ 
  videoItems, 
  thumbnail, 
  onThumbnailUpload 
}: YouTubeThumbnailUploadProps) {
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // 썸네일 파일 업로드 핸들러
  const handleThumbnailFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      // 썸네일 유효성 검사
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      
      // 파일 크기 제한 (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('파일 크기가 10MB를 초과합니다.');
        return;
      }
      
      // 지원되는 이미지 타입 확인
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!supportedTypes.includes(file.type.toLowerCase())) {
        alert('지원되지 않는 파일 형식입니다. (JPG, PNG, GIF, WebP만 허용)');
        return;
      }
      
      if (onThumbnailUpload) {
        onThumbnailUpload(file);
      }
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      alert('썸네일 업로드 중 오류가 발생했습니다.');
    }
  };

  // 자동 썸네일 생성 (유튜브 썸네일 2개 무작위 선택)
  const generateAutoThumbnail = async () => {
    if (videoItems.length < 2) {
      alert('자동 썸네일 생성을 위해서는 최소 2개의 동영상이 필요합니다.');
      return;
    }

    setIsGenerating(true);

    try {
      // 유튜브 썸네일이 있는 비디오들만 필터링
      const videosWithThumbnails = videoItems.filter(video => video.videoThumbnail);
      
      if (videosWithThumbnails.length < 2) {
        alert('썸네일이 있는 동영상이 2개 미만입니다.');
        setIsGenerating(false);
        return;
      }

      // 무작위로 2개 선택
      const shuffled = [...videosWithThumbnails].sort(() => Math.random() - 0.5);
      const selectedVideos = shuffled.slice(0, 2);

      console.log('🎬 Selected videos for auto thumbnail:', selectedVideos.map(v => v.title));

      // Canvas를 사용해서 2개 썸네일을 좌우로 합성
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context를 생성할 수 없습니다.');
      }

      // 썸네일 크기 설정 (16:9 비율)
      const thumbnailWidth = 640;
      const thumbnailHeight = 360;
      canvas.width = thumbnailWidth;
      canvas.height = thumbnailHeight;

      // 각 이미지의 크기 (좌우 분할)
      const halfWidth = thumbnailWidth / 2;

      // 첫 번째 이미지 로드
      const img1 = new Image();
      img1.crossOrigin = 'anonymous';
      
      const img1Promise = new Promise<void>((resolve, reject) => {
        img1.onload = () => resolve();
        img1.onerror = () => reject(new Error('첫 번째 이미지 로드 실패'));
        img1.src = selectedVideos[0].videoThumbnail!;
      });

      // 두 번째 이미지 로드
      const img2 = new Image();
      img2.crossOrigin = 'anonymous';
      
      const img2Promise = new Promise<void>((resolve, reject) => {
        img2.onload = () => resolve();
        img2.onerror = () => reject(new Error('두 번째 이미지 로드 실패'));
        img2.src = selectedVideos[1].videoThumbnail!;
      });

      // 두 이미지 모두 로드 완료 대기
      await Promise.all([img1Promise, img2Promise]);

      // 배경색 설정
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);

      // 첫 번째 이미지 (왼쪽)
      ctx.drawImage(img1, 0, 0, halfWidth, thumbnailHeight);

      // 두 번째 이미지 (오른쪽)
      ctx.drawImage(img2, halfWidth, 0, halfWidth, thumbnailHeight);

      // 중앙에 VS 텍스트 추가
      const centerX = thumbnailWidth / 2;
      const centerY = thumbnailHeight / 2;
      
      // VS 배경 원
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
      ctx.fill();

      // VS 텍스트
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VS', centerX, centerY);

      // Canvas를 Blob으로 변환
      canvas.toBlob((blob) => {
        if (blob && onThumbnailUpload) {
          // Blob을 File 객체로 변환
          const file = new File([blob], 'auto-thumbnail.png', { type: 'image/png' });
          onThumbnailUpload(file);
          console.log('✅ Auto thumbnail generated successfully');
        } else {
          throw new Error('썸네일 생성에 실패했습니다.');
        }
        setIsGenerating(false);
      }, 'image/png', 0.9);

    } catch (error) {
      console.error('❌ Auto thumbnail generation failed:', error);
      alert('자동 썸네일 생성에 실패했습니다. 다시 시도해주세요.');
      setIsGenerating(false);
    }
  };

  // 썸네일 이미지 URL 생성
  const getThumbnailUrl = (thumbnail: string | File): string | null => {
    try {
      if (typeof thumbnail === 'string') {
        return thumbnail.trim() || null;
      }
      
      if (thumbnail instanceof File) {
        return URL.createObjectURL(thumbnail);
      }
      
      return null;
    } catch (error) {
      console.error('Error creating thumbnail URL:', error);
      return null;
    }
  };

  const thumbnailUrl = thumbnail ? getThumbnailUrl(thumbnail) : null;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">🎬 월드컵 썸네일 설정</h3>
        <p className="text-gray-600 text-sm">
          월드컵의 대표 이미지를 설정하세요. 직접 업로드하거나 동영상 썸네일로 자동 생성할 수 있습니다.
        </p>
      </div>

      {/* 현재 썸네일 표시 */}
      {thumbnailUrl && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">현재 썸네일</h4>
            <button
              onClick={() => onThumbnailUpload && onThumbnailUpload('')}
              className="text-red-500 hover:text-red-700 transition-colors"
              title="썸네일 삭제"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden max-w-md mx-auto">
            <img
              src={thumbnailUrl}
              alt="Current thumbnail"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* 썸네일 업로드 버튼들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 직접 업로드 */}
        <div className="space-y-3">
          <button
            onClick={() => thumbnailInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="font-medium text-gray-700">직접 업로드</span>
            <span className="text-sm text-gray-500">이미지 파일 선택</span>
          </button>
          
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={handleThumbnailFileUpload}
            className="hidden"
          />
        </div>

        {/* 자동 생성 */}
        <div className="space-y-3">
          <button
            onClick={generateAutoThumbnail}
            disabled={videoItems.length < 2 || isGenerating}
            className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${
              videoItems.length >= 2 && !isGenerating
                ? 'border-blue-300 hover:border-blue-400 hover:bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            ) : (
              <Shuffle className="w-8 h-8 mb-2" />
            )}
            <span className="font-medium">자동 생성</span>
            <span className="text-sm">
              {videoItems.length >= 2 ? '동영상 썸네일 2개 조합' : `${2 - videoItems.length}개 동영상 더 필요`}
            </span>
          </button>
        </div>
      </div>

      {/* 도움말 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 썸네일 가이드</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>직접 업로드</strong>: JPG, PNG, GIF, WebP 형식 지원 (최대 10MB)</li>
          <li>• <strong>자동 생성</strong>: 동영상 썸네일 2개를 좌우로 합성하여 VS 형태로 생성</li>
          <li>• 권장 비율: 16:9 (1280x720, 640x360 등)</li>
          <li>• 썸네일을 설정하지 않으면 첫 번째 아이템의 이미지가 사용됩니다</li>
        </ul>
      </div>
    </div>
  );
}