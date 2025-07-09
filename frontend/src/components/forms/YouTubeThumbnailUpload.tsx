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

      // CORS 문제를 해결하기 위해 프록시를 통해 이미지 로드
      const img1 = new Image();
      const img2 = new Image();
      
      // CORS 설정
      img1.crossOrigin = 'anonymous';
      img2.crossOrigin = 'anonymous';
      
      const img1Promise = new Promise<void>((resolve, reject) => {
        img1.onload = () => {
          console.log('✅ 첫 번째 이미지 로드 성공:', {
            width: img1.width,
            height: img1.height,
            naturalWidth: img1.naturalWidth,
            naturalHeight: img1.naturalHeight
          });
          resolve();
        };
        img1.onerror = () => {
          console.error('❌ 첫 번째 이미지 로드 실패:', selectedVideos[0].videoThumbnail);
          reject(new Error(`프록시 이미지 로드 실패: ${selectedVideos[0].videoThumbnail!}`));
        };
        // 프록시를 통해 이미지 로드 (CORS 회피)
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(selectedVideos[0].videoThumbnail!)}`;
        console.log('🔗 프록시 URL 1:', proxyUrl);
        img1.src = proxyUrl;
      });

      const img2Promise = new Promise<void>((resolve, reject) => {
        img2.onload = () => {
          console.log('✅ 두 번째 이미지 로드 성공:', {
            width: img2.width,
            height: img2.height,
            naturalWidth: img2.naturalWidth,
            naturalHeight: img2.naturalHeight
          });
          resolve();
        };
        img2.onerror = () => {
          console.error('❌ 두 번째 이미지 로드 실패:', selectedVideos[1].videoThumbnail);
          reject(new Error(`프록시 이미지 로드 실패: ${selectedVideos[1].videoThumbnail!}`));
        };
        // 프록시를 통해 이미지 로드 (CORS 회피)
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(selectedVideos[1].videoThumbnail!)}`;
        console.log('🔗 프록시 URL 2:', proxyUrl);
        img2.src = proxyUrl;
      });

      // 두 이미지 모두 로드 완료 대기
      await Promise.all([img1Promise, img2Promise]);

      // 이미지 로드 상태 검증
      if (!img1.complete || !img2.complete || img1.naturalWidth === 0 || img2.naturalWidth === 0) {
        throw new Error('이미지 로드가 완료되지 않았습니다.');
      }

      console.log('🖼️ Image dimensions:', {
        img1: { width: img1.width, height: img1.height, naturalWidth: img1.naturalWidth, naturalHeight: img1.naturalHeight },
        img2: { width: img2.width, height: img2.height, naturalWidth: img2.naturalWidth, naturalHeight: img2.naturalHeight },
        canvas: { width: thumbnailWidth, height: thumbnailHeight }
      });

      // 배경색 설정
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);

      try {
        // 첫 번째 이미지 (왼쪽) - 정확히 반반 분할, 비율 무시하고 꽉 채우기
        const img1Width = img1.naturalWidth || img1.width;
        const img1Height = img1.naturalHeight || img1.height;
        
        if (img1Width <= 0 || img1Height <= 0) {
          throw new Error(`첫 번째 이미지 크기가 유효하지 않습니다: ${img1Width}x${img1Height}`);
        }
        
        // 왼쪽 절반 영역 (0, 0, halfWidth, thumbnailHeight)에 꽉 채우기
        console.log('🎨 Drawing img1 (left half):', {
          original: { width: img1Width, height: img1Height },
          drawArea: { x: 0, y: 0, width: halfWidth, height: thumbnailHeight }
        });
        
        ctx.drawImage(img1, 0, 0, halfWidth, thumbnailHeight);

        // 두 번째 이미지 (오른쪽) - 정확히 반반 분할, 비율 무시하고 꽉 채우기
        const img2Width = img2.naturalWidth || img2.width;
        const img2Height = img2.naturalHeight || img2.height;
        
        if (img2Width <= 0 || img2Height <= 0) {
          throw new Error(`두 번째 이미지 크기가 유효하지 않습니다: ${img2Width}x${img2Height}`);
        }
        
        // 오른쪽 절반 영역 (halfWidth, 0, halfWidth, thumbnailHeight)에 꽉 채우기
        console.log('🎨 Drawing img2 (right half):', {
          original: { width: img2Width, height: img2Height },
          drawArea: { x: halfWidth, y: 0, width: halfWidth, height: thumbnailHeight }
        });
        
        ctx.drawImage(img2, halfWidth, 0, halfWidth, thumbnailHeight);
        
      } catch (drawError) {
        console.error('❌ Canvas drawing error:', drawError);
        throw new Error(`이미지 그리기 실패: ${drawError.message}`);
      }

      console.log('🎨 Canvas drawing completed - no VS text needed');

      // Canvas 데이터를 검증하고 Blob으로 변환
      console.log('🔍 Canvas validation:', {
        width: canvas.width,
        height: canvas.height,
        data: ctx.getImageData(0, 0, 10, 10).data.slice(0, 16) // 첫 4픽셀 데이터 확인
      });
      
      // Canvas를 Data URL로도 테스트
      const dataUrl = canvas.toDataURL('image/png');
      console.log('🔍 Canvas toDataURL test:', {
        dataUrlLength: dataUrl.length,
        dataUrlStart: dataUrl.substring(0, 50),
        isValidDataUrl: dataUrl.startsWith('data:image/png;base64,')
      });
      
      // Canvas toBlob 대신 toDataURL을 사용해서 JSON 문제 우회
      try {
        const dataUrl = canvas.toDataURL('image/png');
        console.log('🔄 Using toDataURL instead of toBlob to avoid JSON issue');
        
        // DataURL을 File 객체로 변환
        const base64Data = dataUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        const file = new File([blob], 'auto-thumbnail.png', { 
          type: 'image/png',
          lastModified: Date.now()
        });
        
        console.log('✅ DataURL to File conversion successful:', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          sizeKB: Math.round(file.size / 1024)
        });
        
        if (onThumbnailUpload) {
          onThumbnailUpload(file);
        }
        setIsGenerating(false);
        
      } catch (dataUrlError) {
        console.error('❌ DataURL conversion failed, fallback to toBlob:', dataUrlError);
        
        // 폴백: 원래 toBlob 방식
        canvas.toBlob((blob) => {
        if (blob && blob.size > 0 && onThumbnailUpload) {
          // Blob 유효성 재검증
          console.log('🔍 Blob validation:', {
            type: blob.type,
            size: blob.size,
            constructor: blob.constructor.name
          });
          
          // Blob 내용을 직접 확인
          const blobReader = new FileReader();
          blobReader.onload = (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            if (arrayBuffer) {
              const bytes = new Uint8Array(arrayBuffer);
              const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
              
              // 첫 100바이트를 문자열로 변환해서 JSON 여부 확인
              const firstBytesAsString = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 100));
              const looksLikeJSON = firstBytesAsString.includes('{') || firstBytesAsString.includes('[');
              
              console.log('🔍 RAW Blob content validation:', {
                isPNG,
                firstBytes: Array.from(bytes.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')),
                size: arrayBuffer.byteLength,
                looksLikeJSON,
                firstBytesAsString: firstBytesAsString.substring(0, 50)
              });
              
              if (!isPNG) {
                console.error('❌ Canvas toBlob produced invalid PNG data!');
                if (looksLikeJSON) {
                  console.error('❌ Canvas toBlob produced JSON data instead of PNG!');
                }
              }
            }
          };
          blobReader.readAsArrayBuffer(blob);
          
          // Blob 타입이 올바르지 않으면 새로 생성
          let correctBlob = blob;
          if (blob.type !== 'image/png') {
            console.log('🔧 Fixing blob type from', blob.type, 'to image/png');
            correctBlob = new Blob([blob], { type: 'image/png' });
          }
          
          // Blob을 File 객체로 변환 (PNG 확장자 사용)
          // Content-Type 강제 설정으로 application/json 문제 해결
          const file = new File([correctBlob], 'auto-thumbnail.png', { 
            type: 'image/png',
            lastModified: Date.now()
          });
          
          // File 객체의 타입이 제대로 설정되었는지 확인
          console.log('🔍 File object type verification:', {
            fileName: file.name,
            fileType: file.type,
            blobType: blob.type,
            typeMatch: file.type === 'image/png',
            isCorrectType: file.type === 'image/png' && blob.type === 'image/png'
          });
          
          // File 객체 검증
          console.log('✅ Auto thumbnail generated:', {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            sizeKB: Math.round(file.size / 1024),
            canvasSize: { width: canvas.width, height: canvas.height },
            blobValid: blob.size > 0,
            fileConstructor: file.constructor.name,
            lastModified: file.lastModified
          });
          
          // File을 다시 Blob으로 변환해서 검증
          const reader = new FileReader();
          reader.onload = (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            if (arrayBuffer) {
              const bytes = new Uint8Array(arrayBuffer);
              const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
              
              // 첫 100바이트를 문자열로 변환해서 JSON 여부 확인
              const firstBytesAsString = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 100));
              const looksLikeJSON = firstBytesAsString.includes('{') || firstBytesAsString.includes('[');
              
              console.log('🔍 File format validation:', {
                isPNG,
                firstBytes: Array.from(bytes.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')),
                size: arrayBuffer.byteLength,
                looksLikeJSON,
                firstBytesAsString: firstBytesAsString.substring(0, 50)
              });
              
              if (!isPNG) {
                console.error('❌ Generated file is not a valid PNG!');
                if (looksLikeJSON) {
                  console.error('❌ File appears to be JSON data instead of PNG!');
                }
                alert('생성된 파일이 올바른 PNG 형식이 아닙니다.');
                setIsGenerating(false);
                return;
              }
            }
          };
          reader.readAsArrayBuffer(file);
          
          onThumbnailUpload(file);
        } else {
          console.error('❌ Canvas toBlob failed - blob is null, undefined, or empty:', {
            blob: !!blob,
            size: blob?.size || 0
          });
          throw new Error('썸네일 생성에 실패했습니다.');
        }
        setIsGenerating(false);
        }, 'image/png'); // PNG 무손실 포맷 사용
        
        // Canvas toBlob 호출 후 추가 검증
        console.log('🔍 Canvas toBlob call completed with PNG type');
      } // dataUrlError catch 블록 끝

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