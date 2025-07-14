'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileImage, Plus } from 'lucide-react';
import ImageUploadGuide from './ImageUploadGuide';

interface WorldCupItem {
  id: string;
  title: string;
  image: string | File;
  description?: string;
}

interface DragDropUploadProps {
  items: WorldCupItem[];
  onItemsUpload: (items: WorldCupItem[]) => void;
  onItemDelete: (itemId: string) => void;
  thumbnail?: string | File;
  onThumbnailUpload?: (thumbnail: string | File) => void;
}

export default function DragDropUpload({ items, onItemsUpload, onItemDelete, thumbnail, onThumbnailUpload }: DragDropUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 11);

  const createItemFromFile = async (file: File): Promise<WorldCupItem> => {
    // Enhanced file validation
    if (!file || !(file instanceof File)) {
      console.error('Invalid file object:', file);
      throw new Error('유효하지 않은 파일입니다');
    }
    
    if (file.size === 0) {
      console.error('Empty file:', file.name);
      throw new Error('빈 파일은 업로드할 수 없습니다');
    }
    
    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('File too large:', file.name, file.size);
      throw new Error('파일 크기가 10MB를 초과합니다');
    }
    
    // 지원되는 이미지 타입 확인
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!supportedTypes.includes(file.type.toLowerCase())) {
      console.error('Unsupported file type:', file.type);
      throw new Error('지원되지 않는 파일 형식입니다 (JPG, PNG, GIF, WebP만 허용)');
    }
    
    // 🎯 원본 화질 보존 Base64 변환 (무손실)
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      
      // 타임아웃 설정 (대용량 파일 고려)
      const timeoutId = setTimeout(() => {
        reader.abort();
        reject(new Error(`파일 읽기 시간 초과: ${file.name}`));
      }, 45000); // 45초로 증가 (대용량 고화질 이미지 고려)
      
      reader.onload = () => {
        clearTimeout(timeoutId);
        const result = reader.result as string;
        
        // 🔍 원본 데이터 무결성 검증
        if (!result || !result.startsWith('data:image/')) {
          reject(new Error(`유효하지 않은 이미지 데이터: ${file.name}`));
          return;
        }
        
        // 📊 원본 vs Base64 크기 검증 (화질 손실 없음 확인)
        const base64DataLength = result.split(',')[1].length;
        const estimatedOriginalSize = base64DataLength * 0.75; // Base64는 원본보다 약 33% 큼
        const sizeDifference = Math.abs(estimatedOriginalSize - file.size) / file.size;
        
        // 5% 이상 차이나면 경고 (하지만 진행은 계속)
        if (sizeDifference > 0.05) {
          console.warn('⚠️ Base64 변환 크기 차이 감지:', {
            fileName: file.name,
            originalSize: file.size,
            estimatedSize: Math.round(estimatedOriginalSize),
            difference: `${(sizeDifference * 100).toFixed(1)}%`
          });
        }
        
        console.log('🎯 원본 화질 보존 변환 완료:', {
          fileName: file.name,
          originalSize: `${(file.size / 1024).toFixed(1)}KB`,
          base64DataSize: `${(base64DataLength / 1024).toFixed(1)}KB`,
          totalBase64Size: `${(result.length / 1024).toFixed(1)}KB`,
          mimeType: file.type,
          qualityPreserved: '✅ 무손실 보존'
        });
        
        resolve(result);
      };
      
      reader.onerror = () => {
        clearTimeout(timeoutId);
        console.error('❌ Base64 변환 실패:', file.name, reader.error);
        reject(new Error(`파일을 읽는 중 오류가 발생했습니다: ${file.name}`));
      };
      
      reader.onabort = () => {
        clearTimeout(timeoutId);
        reject(new Error(`파일 읽기가 중단되었습니다: ${file.name}`));
      };
      
      // 🎯 CRITICAL: readAsDataURL은 원본 파일을 그대로 base64로 변환 (무손실)
      // Canvas나 기타 압축 방식 사용하지 않음으로써 100% 원본 화질 보장
      reader.readAsDataURL(file);
    });
    
    const item = {
      id: generateId(),
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
      image: base64Image, // Base64 문자열로 저장하여 페이지 새로고침에도 안정적
    };
    
    return item;
  };



  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (fileArray.length === 0) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // 🚀 배치 처리 설정 (5개씩 처리하여 메모리 효율성 증대)
    const BATCH_SIZE = 5;
    const totalFiles = fileArray.length;
    let processedCount = 0;
    let successCount = 0;
    const allNewItems: WorldCupItem[] = [];
    const allErrors: string[] = [];

    console.log(`📦 시작: ${totalFiles}개 파일을 ${BATCH_SIZE}개씩 배치 처리`);

    try {
      // 🔒 SECURITY: HTML 엔티티 이스케이프 함수
      const escapeHtml = (text: string) => {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };

      // 진행률 모달 표시 (XSS 방지 적용)
      const showProgressModal = (current: number, total: number, currentFile: string) => {
        const existingModal = document.getElementById('bulk-upload-progress');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'bulk-upload-progress';
        modal.style.cssText = `
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.7); z-index: 10000;
          display: flex; align-items: center; justify-content: center;
        `;
        
        const percentage = Math.round((current / total) * 100);
        // 🔒 SECURITY: 파일명을 HTML 엔티티로 이스케이프하여 XSS 방지
        const safeCurrentFile = escapeHtml(currentFile);
        
        modal.innerHTML = `
          <div style="background: white; padding: 30px; border-radius: 12px; text-align: center; max-width: 400px; width: 90%;">
            <div style="font-size: 24px; margin-bottom: 10px;">📦</div>
            <h3 style="margin: 0 0 15px 0; color: #1f2937;">대용량 업로드 진행 중</h3>
            <div style="background: #f3f4f6; border-radius: 8px; height: 8px; margin: 15px 0; overflow: hidden;">
              <div style="background: #10b981; height: 100%; width: ${percentage}%; transition: width 0.3s;"></div>
            </div>
            <p style="margin: 10px 0; color: #6b7280; font-size: 14px;">
              ${current} / ${total} (${percentage}%) 완료
            </p>
            <p style="margin: 5px 0; color: #9ca3af; font-size: 12px; word-break: break-all;">
              처리 중: ${safeCurrentFile}
            </p>
            <p style="margin: 15px 0 0 0; color: #ef4444; font-size: 12px;">
              ⚠️ 창을 닫지 마세요. 처리가 중단될 수 있습니다.
            </p>
          </div>
        `;
        document.body.appendChild(modal);
      };

      // 진행률 모달 제거
      const hideProgressModal = () => {
        const modal = document.getElementById('bulk-upload-progress');
        if (modal) modal.remove();
      };

      // 배치별로 파일 처리
      for (let i = 0; i < fileArray.length; i += BATCH_SIZE) {
        const batch = fileArray.slice(i, i + BATCH_SIZE);
        console.log(`🔄 배치 ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(totalFiles/BATCH_SIZE)} 처리 중 (${batch.length}개 파일)`);

        // 배치 내에서 병렬 처리 (메모리 제한적)
        const batchPromises = batch.map(async (file, batchIndex) => {
          const currentIndex = i + batchIndex;
          showProgressModal(currentIndex, totalFiles, file.name);
          
          try {
            console.log(`📄 파일 처리 시작: ${file.name} (${currentIndex + 1}/${totalFiles})`);
            const item = await createItemFromFile(file);
            console.log(`✅ 파일 처리 완료: ${file.name}`);
            return { success: true, item, error: null };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            console.error(`❌ 파일 처리 실패: ${file.name}`, error);
            return { success: false, item: null, error: `${file.name}: ${errorMessage}` };
          }
        });

        // 배치 완료 대기
        const batchResults = await Promise.all(batchPromises);
        
        // 결과 처리
        batchResults.forEach(result => {
          processedCount++;
          if (result.success && result.item) {
            allNewItems.push(result.item);
            successCount++;
          } else if (result.error) {
            allErrors.push(result.error);
          }
        });

        console.log(`✅ 배치 완료: ${successCount}/${processedCount} 성공`);

        // 🔥 중간 결과 즉시 업데이트 (사용자에게 진행 상황 보여주기)
        if (allNewItems.length > 0) {
          const batchItems = allNewItems.splice(0); // 현재까지 처리된 모든 아이템을 가져오고 배열 비우기
          onItemsUpload(batchItems);
          console.log(`🔄 중간 업데이트: ${batchItems.length}개 아이템 추가됨`);
        }

        // 배치 간 짧은 대기 (브라우저 응답성 확보)
        if (i + BATCH_SIZE < fileArray.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      hideProgressModal();

      // 최종 결과 보고
      console.log(`🎉 벌크 업로드 완료: ${successCount}/${totalFiles} 성공, ${allErrors.length}개 실패`);

      // 에러 보고
      if (allErrors.length > 0) {
        const errorSummary = allErrors.length > 10 
          ? `${allErrors.slice(0, 10).join('\n')}\n... 그리고 ${allErrors.length - 10}개 더`
          : allErrors.join('\n');
        
        alert(`⚠️ 업로드 결과:\n✅ 성공: ${successCount}개\n❌ 실패: ${allErrors.length}개\n\n실패한 파일들:\n${errorSummary}`);
      } else {
        // 모든 파일이 성공한 경우
        alert(`🎉 업로드 완료!\n총 ${successCount}개 이미지가 성공적으로 업로드되었습니다.`);
      }

    } catch (error) {
      // 전체 프로세스 실패
      const modal = document.getElementById('bulk-upload-progress');
      if (modal) modal.remove();
      
      console.error('❌ 벌크 업로드 전체 실패:', error);
      alert(`업로드 중 심각한 오류가 발생했습니다.\n${successCount}개는 성공적으로 처리되었습니다.\n\n오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }, [onItemsUpload]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    await handleFiles(files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      await handleFiles(files);
    }
  };



  // 썸네일 파일 업로드 핸들러
  const handleThumbnailFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      // 썸네일도 동일한 유효성 검사 적용
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

  // 자동 썸네일 생성 (이미지 썸네일 2개 조합)
  const generateAutoThumbnail = async () => {
    if (items.length < 2) {
      alert('자동 썸네일 생성을 위해서는 최소 2개의 이미지가 필요합니다.');
      return;
    }

    setIsGeneratingThumbnail(true);

    try {
      // 무작위로 2개 선택
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      const selectedItems = shuffled.slice(0, 2);

      console.log('🖼️ Selected items for auto thumbnail:', selectedItems.map(item => item.title));

      // Canvas를 사용해서 2개 이미지를 좌우로 합성
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

      const img1 = new Image();
      const img2 = new Image();
      
      // CORS 설정
      img1.crossOrigin = 'anonymous';
      img2.crossOrigin = 'anonymous';
      
      const img1Promise = new Promise<void>((resolve, reject) => {
        img1.onload = () => {
          console.log('✅ 첫 번째 이미지 로드 성공');
          resolve();
        };
        img1.onerror = () => {
          console.error('❌ 첫 번째 이미지 로드 실패');
          reject(new Error('첫 번째 이미지 로드 실패'));
        };
        
        // 이미지 URL 생성
        const imageUrl1 = getImageUrl(selectedItems[0].image);
        if (!imageUrl1) {
          reject(new Error('첫 번째 이미지 URL을 생성할 수 없습니다'));
          return;
        }
        img1.src = imageUrl1;
      });

      const img2Promise = new Promise<void>((resolve, reject) => {
        img2.onload = () => {
          console.log('✅ 두 번째 이미지 로드 성공');
          resolve();
        };
        img2.onerror = () => {
          console.error('❌ 두 번째 이미지 로드 실패');
          reject(new Error('두 번째 이미지 로드 실패'));
        };
        
        // 이미지 URL 생성
        const imageUrl2 = getImageUrl(selectedItems[1].image);
        if (!imageUrl2) {
          reject(new Error('두 번째 이미지 URL을 생성할 수 없습니다'));
          return;
        }
        img2.src = imageUrl2;
      });

      // 두 이미지 모두 로드 완료 대기
      await Promise.all([img1Promise, img2Promise]);

      // 배경색 설정
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);

      try {
        // 첫 번째 이미지 (왼쪽) - 정확히 반반 분할, 비율 무시하고 꽉 채우기
        ctx.drawImage(img1, 0, 0, halfWidth, thumbnailHeight);

        // 두 번째 이미지 (오른쪽) - 정확히 반반 분할, 비율 무시하고 꽉 채우기
        ctx.drawImage(img2, halfWidth, 0, halfWidth, thumbnailHeight);
        
      } catch (drawError) {
        console.error('❌ Canvas drawing error:', drawError);
        throw new Error(`이미지 그리기 실패: ${drawError.message}`);
      }

      console.log('🎨 Canvas drawing completed');

      // Canvas를 File 객체로 변환
      try {
        const dataUrl = canvas.toDataURL('image/png');
        
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
        
        console.log('✅ Auto thumbnail generated:', {
          fileName: file.name,
          fileSize: file.size,
          sizeKB: Math.round(file.size / 1024)
        });
        
        if (onThumbnailUpload) {
          onThumbnailUpload(file);
        }
        
      } catch (dataUrlError) {
        console.error('❌ DataURL conversion failed:', dataUrlError);
        throw new Error('썸네일 생성에 실패했습니다.');
      }

    } catch (error) {
      console.error('❌ Auto thumbnail generation failed:', error);
      alert('자동 썸네일 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };


  const getImageUrl = (image: string | File): string | null => {
    try {
      if (typeof image === 'string') {
        // Accept all string URLs including blob: URLs and base64
        if (image.trim() === '') {
          console.warn('Empty URL string');
          return null;
        }
        console.log('✅ DragDrop returning string URL (base64 or blob):', image.substring(0, 50) + '...');
        return image.trim();
      }
      
      if (image instanceof File) {
        console.log('📁 DragDrop creating URL for File:', image.name);
        return URL.createObjectURL(image);
      }
      
      console.error('Invalid image type:', typeof image);
      return null;
    } catch (error) {
      console.error('Error creating image URL:', error);
      return null;
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.style.display = 'none';
    
    // Create a fallback div if it doesn't exist
    const parent = img.parentElement;
    if (parent && !parent.querySelector('.fallback-placeholder')) {
      const fallback = document.createElement('div');
      fallback.className = 'fallback-placeholder w-full h-full flex items-center justify-center bg-gray-200 text-gray-500';
      
      // 🔒 SECURITY: DOM API 사용으로 XSS 방지 (innerHTML 대신 textContent 사용)
      const container = document.createElement('div');
      container.className = 'text-center p-4';
      
      const icon = document.createElement('div');
      icon.className = 'text-2xl mb-2';
      icon.textContent = '🖼️';
      
      const title = document.createElement('div');
      title.className = 'text-xs';
      title.textContent = '이미지 로딩 실패';
      
      const subtitle = document.createElement('div');
      subtitle.className = 'text-xs text-gray-400 mt-1';
      subtitle.textContent = 'URL을 확인해주세요';
      
      container.appendChild(icon);
      container.appendChild(title);
      container.appendChild(subtitle);
      fallback.appendChild(container);
      
      parent.appendChild(fallback);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          콘텐츠 업로드
        </h2>
        <p className="text-gray-600">
          이미지를 업로드하거나 URL을 입력하여 월드컵 항목을 추가하세요.
          <br />
          최소 4개 이상의 항목이 필요합니다.
        </p>
      </div>




      {/* Main Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <Upload className={`w-12 h-12 ${isDragOver ? 'text-emerald-500' : 'text-gray-400'}`} />
          </div>
          
          <div>
            <p className={`text-lg font-medium ${isDragOver ? 'text-emerald-700' : 'text-gray-700'}`}>
              {isDragOver ? '파일을 놓아주세요' : '이미지를 드래그하거나 클릭하여 업로드'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              JPG, PNG, GIF 등 이미지 파일을 지원합니다
            </p>
          </div>

          <div className="flex justify-center space-x-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <FileImage className="w-4 h-4" />
              <span>파일 선택</span>
            </button>
          </div>
        </div>
      </div>



      {/* Items Grid */}
      {items.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            업로드된 항목 ({items.length}개)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((item) => (
              <div key={item.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {(() => {
                    const imageUrl = getImageUrl(item.image);
                    console.log(`🖼️ DragDrop item ${item.id}:`, {
                      title: item.title,
                      imageType: typeof item.image,
                      isString: typeof item.image === 'string',
                      isFile: item.image instanceof File,
                      imageUrl: imageUrl ? imageUrl.substring(0, 50) + '...' : 'null',
                      hasImageUrl: !!imageUrl
                    });
                    
                    return imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.title}
                        className="w-full h-full object-contain bg-gray-50"
                        onError={(e) => {
                          console.error('❌ DragDrop image failed to load:', {
                            itemId: item.id,
                            src: imageUrl,
                            imageType: typeof item.image
                          });
                          handleImageError(e);
                        }}
                        onLoad={() => {
                          console.log('✅ DragDrop image loaded:', item.id);
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                        <div className="text-center p-2">
                          <div className="text-2xl mb-1">🖼️</div>
                          <div className="text-xs">이미지 없음</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <button
                  onClick={() => onItemDelete(item.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.title}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Add More Button */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-100 transition-colors"
            >
              <div className="text-center">
                <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">추가</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 아래쪽 썸네일 설정 - 다시 활성화 */}
      {items.length > 0 && (
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🎬 월드컵 썸네일 설정</h3>
            <p className="text-gray-600 text-sm">
              월드컵의 대표 이미지를 설정하세요. 직접 업로드하거나 이미지 썸네일로 자동 생성할 수 있습니다.
            </p>
          </div>

          {/* 현재 썸네일 표시 */}
          {thumbnail && (
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
                  src={getImageUrl(thumbnail)}
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
            </div>

            {/* 자동 생성 */}
            <div className="space-y-3">
              <button
                onClick={generateAutoThumbnail}
                disabled={items.length < 2 || isGeneratingThumbnail}
                className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${
                  items.length >= 2 && !isGeneratingThumbnail
                    ? 'border-blue-300 hover:border-blue-400 hover:bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isGeneratingThumbnail ? (
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                ) : (
                  <FileImage className="w-8 h-8 mb-2" />
                )}
                <span className="font-medium">자동 생성</span>
                <span className="text-sm">
                  {items.length >= 2 ? '이미지 썸네일 2개 조합' : `${2 - items.length}개 이미지 더 필요`}
                </span>
              </button>
            </div>
          </div>

          {/* 도움말 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 썸네일 가이드</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>직접 업로드</strong>: JPG, PNG, GIF, WebP 형식 지원 (최대 10MB)</li>
              <li>• <strong>자동 생성</strong>: 이미지 썸네일 2개를 좌우로 합성하여 VS 형태로 생성</li>
              <li>• 권장 비율: 16:9 (1280x720, 640x360 등)</li>
              <li>• 썸네일을 설정하지 않으면 첫 번째 아이템의 이미지가 사용됩니다</li>
            </ul>
          </div>
        </div>
      )}

      {/* Requirements */}
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs text-blue-600 font-medium">!</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">📦 대용량 업로드 안내</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>한꺼번에 최대 100개</strong>까지 이미지를 업로드할 수 있습니다</li>
                <li>• <strong>🎯 원본 화질 100% 보존</strong> - 압축이나 화질 손실 없음</li>
                <li>• <strong>5개씩 배치 처리</strong>로 안정적인 대용량 업로드 지원</li>
                <li>• 최소 4개 이상의 이미지가 필요합니다</li>
                <li>• 권장: 8, 16, 32, 64개 (토너먼트 형식에 맞춤)</li>
                <li>• 가로가 더 긴 이미지(4:3 비율)가 가장 적합합니다</li>
                <li>• 중요한 내용은 이미지 중앙에 배치하세요</li>
                <li>• 지원 형식: JPG, PNG, GIF, WebP (각 최대 10MB)</li>
                <li>• <strong>진행률 표시</strong> 및 <strong>부분 업로드 복구</strong> 지원</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}