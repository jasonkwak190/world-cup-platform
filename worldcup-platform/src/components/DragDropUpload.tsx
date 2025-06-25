'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileImage, Plus, Link } from 'lucide-react';

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
}

export default function DragDropUpload({ items, onItemsUpload, onItemDelete }: DragDropUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputs, setUrlInputs] = useState<string[]>(['']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substring(2, 11);

  const createItemFromFile = (file: File): WorldCupItem => {
    // Validate file
    if (!file || !(file instanceof File)) {
      console.error('Invalid file object:', file);
      throw new Error('Invalid file object');
    }
    
    if (file.size === 0) {
      console.error('Empty file:', file.name);
      throw new Error('Empty file not allowed');
    }
    
    if (!file.type.startsWith('image/')) {
      console.error('Not an image file:', file.type);
      throw new Error('Only image files are allowed');
    }
    
    const item = {
      id: generateId(),
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
      image: file, // Keep original File object
    };
    console.log('Created item from file:', {
      id: item.id,
      title: item.title,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });
    return item;
  };

  const createItemFromUrl = (url: string, title: string): WorldCupItem => {
    const item = {
      id: generateId(),
      title: title || '새 항목',
      image: url,
    };
    console.log('Created item from URL:', {
      id: item.id,
      title: item.title,
      originalUrl: url,
      finalUrl: item.image
    });
    return item;
  };

  const isGoogleImageUrl = (url: string): boolean => {
    return url.includes('googleusercontent.com') || 
           url.includes('images.google.com') || 
           url.includes('encrypted-tbn') ||
           url.includes('gstatic.com');
  };

  const extractImageUrl = (url: string): string => {
    // Try to extract direct image URL from Google image search URLs
    if (url.includes('imgres?imgurl=')) {
      const match = url.match(/imgurl=([^&]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
    return url;
  };

  const handleFiles = useCallback((files: FileList) => {
    const newItems: WorldCupItem[] = [];
    
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        newItems.push(createItemFromFile(file));
      }
    });

    if (newItems.length > 0) {
      onItemsUpload(newItems);
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

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validUrls = urlInputs.filter(url => url.trim() !== '');
    if (validUrls.length > 0) {
      const newItems = validUrls.map(url => {
        const cleanUrl = url.trim();
        const processedUrl = extractImageUrl(cleanUrl);
        const filename = processedUrl.split('/').pop()?.split('.')[0] || 'New Item';
        
        // Show warning for Google image URLs
        if (isGoogleImageUrl(cleanUrl)) {
          console.warn('Google image URL detected. This may not work due to CORS policies.');
        }
        
        return createItemFromUrl(processedUrl, filename);
      });
      onItemsUpload(newItems);
      setUrlInputs(['']);
      setShowUrlInput(false);
    }
  };

  const addUrlInput = () => {
    setUrlInputs([...urlInputs, '']);
  };

  const removeUrlInput = (index: number) => {
    if (urlInputs.length > 1) {
      setUrlInputs(urlInputs.filter((_, i) => i !== index));
    }
  };

  const updateUrlInput = (index: number, value: string) => {
    const newInputs = [...urlInputs];
    newInputs[index] = value;
    setUrlInputs(newInputs);
  };

  const getImageUrl = (image: string | File): string => {
    try {
      if (typeof image === 'string') {
        // Accept all string URLs including blob: URLs
        if (image.trim() === '') {
          console.warn('Empty URL string');
          return '';
        }
        return image;
      }
      
      if (image instanceof File) {
        return URL.createObjectURL(image);
      }
      
      console.error('Invalid image type:', typeof image);
      return '';
    } catch (error) {
      console.error('Error creating image URL:', error);
      return '';
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

      {/* Upload Area */}
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
            
            <button
              onClick={() => setShowUrlInput(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Link className="w-4 h-4" />
              <span>URL 추가</span>
            </button>
          </div>
        </div>
      </div>

      {/* URL Input Modal */}
      {showUrlInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
            <h3 className="text-lg font-semibold mb-4">이미지 URL 추가</h3>
            <p className="text-sm text-gray-600 mb-4">
              여러 개의 이미지 URL을 한 번에 추가할 수 있습니다. 각 줄에 하나씩 입력하세요.
            </p>
            <form onSubmit={handleUrlSubmit}>
              <div className="space-y-3 mb-4">
                {urlInputs.map((url, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateUrlInput(index, e.target.value)}
                      placeholder={`https://example.com/image${index + 1}.jpg`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                      autoFocus={index === 0}
                    />
                    {urlInputs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUrlInput(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={addUrlInput}
                className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 mb-4"
              >
                <Plus className="w-4 h-4" />
                <span>URL 추가</span>
              </button>

              <div className="space-y-3 mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-700 font-medium mb-2">💡 이미지 URL 사용 팁:</p>
                  <ul className="text-sm text-blue-600 space-y-1">
                    <li>• 직접 이미지 파일 URL을 사용하세요 (.jpg, .png, .gif 등)</li>
                    <li>• 이미지에 마우스 우클릭 → "이미지 주소 복사"를 사용하세요</li>
                  </ul>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded p-3">
                  <p className="text-sm text-amber-700 font-medium mb-2">⚠️ 주의사항:</p>
                  <ul className="text-sm text-amber-600 space-y-1">
                    <li>• 구글 이미지 검색 결과 URL은 작동하지 않을 수 있습니다</li>
                    <li>• 일부 사이트는 외부 참조를 차단할 수 있습니다</li>
                    <li>• 가능하면 파일 업로드를 권장합니다</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm text-green-700 font-medium mb-2">✅ 권장 이미지 사이트:</p>
                  <ul className="text-sm text-green-600 space-y-1">
                    <li>• Imgur, Dropbox, Google Drive (공개 링크)</li>
                    <li>• GitHub, 개인 웹사이트</li>
                    <li>• 직접 업로드한 클라우드 스토리지</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUrlInput(false);
                    setUrlInputs(['']);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!urlInputs.some(url => url.trim())}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {urlInputs.filter(url => url.trim()).length}개 추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    loading="lazy"
                  />
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
                <li>• 이미지 크기는 자동으로 조정됩니다</li>
                <li>• 지원 형식: JPG, PNG, GIF, WebP</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-xs text-amber-600 font-medium">⚠</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-amber-800 mb-1">구글 이미지 사용 시 주의</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• 구글 이미지 검색에서 복사한 URL은 작동하지 않을 수 있습니다</li>
                <li>• 이미지에 직접 우클릭 → "이미지 주소 복사"를 사용하세요</li>
                <li>• 가능하면 컴퓨터에서 파일을 직접 업로드하는 것을 권장합니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}