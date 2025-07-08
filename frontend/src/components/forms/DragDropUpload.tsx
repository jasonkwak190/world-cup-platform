'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileImage, Plus, Shield } from 'lucide-react';
import ImageUploadGuide from './ImageUploadGuide';
import { secureFileValidation, validateMultipleFiles } from '@/lib/fileValidation';

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
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 11);

  const createItemFromFile = (file: File): WorldCupItem => {
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
    
    const item = {
      id: generateId(),
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
      image: file, // 🚨 CRITICAL: Keep original File object - NEVER convert to blob URL
    };
    console.log('✅ Created item from file (preserving File object):', {
      id: item.id,
      title: item.title,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      imageIsFile: item.image instanceof File
    });
    return item;
  };



  const handleFiles = useCallback(async (files: FileList) => {
    setIsValidating(true);
    
    try {
      const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
      
      if (fileArray.length === 0) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
      }

      // 🔒 보안 검증 수행
      const { validFiles, invalidFiles } = await validateMultipleFiles(fileArray);
      
      // 검증된 파일로 아이템 생성
      const newItems: WorldCupItem[] = [];
      const errors: string[] = [];
      
      validFiles.forEach(file => {
        try {
          newItems.push(createItemFromFile(file));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
          errors.push(`${file.name}: ${errorMessage}`);
        }
      });
      
      // 무효한 파일 에러 추가
      invalidFiles.forEach(({ file, error }) => {
        errors.push(`${file.name}: ${error}`);
      });

      // 에러가 있으면 사용자에게 알림
      if (errors.length > 0) {
        alert(`다음 파일들을 업로드할 수 없습니다:\n\n${errors.join('\n')}\n\n보안 검증을 통과한 ${validFiles.length}개 파일이 업로드됩니다.`);
      }

      if (newItems.length > 0) {
        onItemsUpload(newItems);
      }
      
    } catch (error) {
      console.error('File validation error:', error);
      alert('파일 검증 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsValidating(false);
    }
  }, [onItemsUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
    }
  };



  // 썸네일 파일 업로드 핸들러 (보안 강화)
  const handleThumbnailFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsValidating(true);
    
    try {
      // 🔒 보안 검증 수행
      const validation = await secureFileValidation(file);
      
      if (!validation.isValid) {
        alert(`썸네일 업로드 실패: ${validation.error}`);
        return;
      }
      
      if (onThumbnailUpload && validation.secureFile) {
        onThumbnailUpload(validation.secureFile);
      }
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      alert('썸네일 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsValidating(false);
    }
  };


  const getImageUrl = (image: string | File): string | null => {
    try {
      if (typeof image === 'string') {
        // Accept all string URLs including blob: URLs
        if (image.trim() === '') {
          console.warn('Empty URL string');
          return null;
        }
        return image.trim();
      }
      
      if (image instanceof File) {
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
      fallback.innerHTML = `
        <div class="text-center p-4">
          <div class="text-2xl mb-2">🖼️</div>
          <div class="text-xs">이미지 로딩 실패</div>
          <div class="text-xs text-gray-400 mt-1">URL을 확인해주세요</div>
        </div>
      `;
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

      {/* Thumbnail Upload Section - Moved to top */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <FileImage className="w-5 h-5 mr-2" />
          썸네일 설정
        </h3>
        <p className="text-sm text-blue-700 mb-4">
          월드컵의 대표 이미지를 설정하세요. 설정하지 않으면 나중에 자동으로 생성됩니다.
        </p>
        
        {thumbnail ? (
          <div className="flex items-start space-x-4">
            <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden">
              {(() => {
                const thumbnailUrl = getImageUrl(thumbnail);
                return thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="썸네일"
                    className="w-full h-full object-contain bg-gray-50"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                    <div className="text-center p-2">
                      <div className="text-lg mb-1">🖼️</div>
                      <div className="text-xs">썸네일 없음</div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="flex-1">
              <p className="text-sm text-green-700 font-medium mb-2">✅ 썸네일이 설정되었습니다</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  변경
                </button>
                <button
                  onClick={() => onThumbnailUpload && onThumbnailUpload('')}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  제거
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => thumbnailInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>파일 업로드</span>
              </button>
            </div>
          </div>
        )}
        
        <input
          ref={thumbnailInputRef}
          type="file"
          accept="image/*"
          onChange={handleThumbnailFileUpload}
          className="hidden"
        />
      </div>


      {/* Image Upload Guide */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">🎯</span>
          게임에서 이미지가 어떻게 보일지 미리 확인해보세요
        </h3>
        <p className="text-sm text-purple-700 mb-4">
          이미지 업로드 전에 미리보기로 게임 화면에서 어떻게 표시될지 확인하고, 잘리지 않는 최적의 이미지를 선택하세요.
        </p>
        <ImageUploadGuide
          onImageSelect={(file) => {
            const dt = new DataTransfer();
            dt.items.add(file);
            handleFiles(dt.files);
          }}
          recommendedRatio="4:3"
          showPreview={true}
        />
      </div>

      {/* Main Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50'
            : isValidating
            ? 'border-blue-500 bg-blue-50'
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
            {isValidating ? (
              <Shield className="w-12 h-12 text-blue-500 animate-pulse" />
            ) : (
              <Upload className={`w-12 h-12 ${isDragOver ? 'text-emerald-500' : 'text-gray-400'}`} />
            )}
          </div>
          
          <div>
            <p className={`text-lg font-medium ${
              isValidating 
                ? 'text-blue-700' 
                : isDragOver 
                ? 'text-emerald-700' 
                : 'text-gray-700'
            }`}>
              {isValidating 
                ? '🔒 보안 검증 중...' 
                : isDragOver 
                ? '파일을 놓아주세요' 
                : '이미지를 드래그하거나 클릭하여 업로드'
              }
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isValidating 
                ? '파일 헤더 검증 및 메타데이터 제거 중입니다'
                : 'JPG, PNG, GIF, WebP 파일을 지원합니다 (보안 검증 포함)'
              }
            </p>
          </div>

          <div className="flex justify-center space-x-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isValidating}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                isValidating 
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isValidating ? (
                <>
                  <Shield className="w-4 h-4 animate-pulse" />
                  <span>검증 중...</span>
                </>
              ) : (
                <>
                  <FileImage className="w-4 h-4" />
                  <span>파일 선택</span>
                </>
              )}
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
                    return imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.title}
                        className="w-full h-full object-contain bg-gray-50"
                        onError={handleImageError}
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
              <h4 className="text-sm font-medium text-blue-900 mb-1">업로드 안내</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 최소 4개 이상의 이미지가 필요합니다</li>
                <li>• 권장: 8, 16, 32, 64개 (토너먼트 형식에 맞춤)</li>
                <li>• 가로가 더 긴 이미지(4:3 비율)가 가장 적합합니다</li>
                <li>• 중요한 내용은 이미지 중앙에 배치하세요</li>
                <li>• 지원 형식: JPG, PNG, GIF, WebP</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}