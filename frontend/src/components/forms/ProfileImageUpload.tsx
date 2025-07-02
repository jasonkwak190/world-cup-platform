'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface ProfileImageUploadProps {
  currentImage?: string;
  onImageChange: (image: string) => void;
  username: string;
}

export default function ProfileImageUpload({ 
  currentImage, 
  onImageChange, 
  username 
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 타입 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewImage(result);
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert('이미지를 읽는 중 오류가 발생했습니다.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (previewImage) {
      onImageChange(previewImage);
      setPreviewImage(null);
    }
  };

  const handleCancel = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onImageChange('');
    setPreviewImage(null);
  };

  const displayImage = previewImage || currentImage;
  const showDefaultAvatar = !displayImage;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* 프로필 이미지 */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
          {showDefaultAvatar ? (
            <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
          ) : (
            <img 
              src={displayImage} 
              alt="프로필 이미지"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        {/* 카메라 버튼 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute bottom-2 right-2 w-10 h-10 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
          title="프로필 사진 변경"
        >
          {isUploading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 미리보기 상태일 때 버튼들 */}
      {previewImage && (
        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
          >
            저장
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors font-medium"
          >
            취소
          </button>
        </div>
      )}

      {/* 현재 이미지가 있을 때 제거 버튼 */}
      {currentImage && !previewImage && (
        <button
          onClick={handleRemove}
          className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          <span>사진 제거</span>
        </button>
      )}

      {/* 업로드 가이드 */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          JPG, PNG 파일 (최대 5MB)
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center space-x-1"
        >
          <Upload className="w-4 h-4" />
          <span>새 사진 업로드</span>
        </button>
      </div>
    </div>
  );
}