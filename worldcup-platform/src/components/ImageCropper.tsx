'use client';

import { useState } from 'react';
import { Edit3, RotateCw, Square, Scissors, Check, X, Eye } from 'lucide-react';

interface WorldCupItem {
  id: string;
  title: string;
  image: string | File;
  description?: string;
}

interface ImageCropperProps {
  items: WorldCupItem[];
  onItemUpdate: (itemId: string, updates: Partial<WorldCupItem>) => void;
}

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
}

export default function ImageCropper({ items, onItemUpdate }: ImageCropperProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<string | null>(null);
  const [cropData, setCropData] = useState<CropData>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotate: 0,
  });
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');

  const getImageUrl = (image: string | File): string => {
    try {
      if (typeof image === 'string') {
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

  const handleEditTitle = (item: WorldCupItem) => {
    setEditingTitle(item.id);
    setTitleInput(item.title);
  };

  const handleSaveTitle = () => {
    if (editingTitle && titleInput.trim()) {
      onItemUpdate(editingTitle, { title: titleInput.trim() });
    }
    setEditingTitle(null);
    setTitleInput('');
  };

  const handleCancelTitle = () => {
    setEditingTitle(null);
    setTitleInput('');
  };

  const handleRotate = (itemId: string) => {
    // In a real app, this would apply rotation to the image
    console.log('Rotating image:', itemId);
    // For now, just update the rotate value
    setCropData(prev => ({
      ...prev,
      rotate: (prev.rotate + 90) % 360
    }));
  };

  const handleCrop = (itemId: string) => {
    // In a real app, this would open a crop modal
    console.log('Cropping image:', itemId, cropData);
    setSelectedItem(itemId);
  };

  const presetCropRatios = [
    { name: '1:1 (정사각형)', ratio: 1 },
    { name: '4:3 (가로)', ratio: 4/3 },
    { name: '16:9 (와이드)', ratio: 16/9 },
    { name: '3:4 (세로)', ratio: 3/4 },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <Edit3 className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          이미지 편집
        </h2>
        <p className="text-gray-600">
          이미지를 크롭하고 제목을 수정하여 월드컵에 최적화하세요.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Square className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-gray-500">
            편집할 이미지가 없습니다.
            <br />
            이전 단계에서 이미지를 업로드해주세요.
          </p>
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-3">
              빠른 편집 도구
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {presetCropRatios.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    // Apply preset to all images
                    console.log('Applying preset:', preset.name);
                  }}
                  className="px-3 py-2 text-sm bg-white border border-blue-300 rounded hover:bg-blue-50 transition-colors text-gray-700"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-white border rounded-lg overflow-hidden shadow-sm">
                {/* Image Preview */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden rounded-lg">
                  {item.image ? (
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onClick={() => setPreviewItem(item.id)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center p-4">
                        <div className="text-4xl mb-3 text-gray-400">🖼️</div>
                        <div className="text-sm font-medium text-gray-500">이미지 없음</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={() => setPreviewItem(item.id)}
                      className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors shadow-sm"
                      title="미리보기"
                    >
                      <Eye className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleRotate(item.id)}
                      className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors shadow-sm"
                      title="회전"
                    >
                      <RotateCw className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleCrop(item.id)}
                      className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors shadow-sm"
                      title="크롭"
                    >
                      <Scissors className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                </div>

                {/* Title Editor */}
                <div className="p-4">
                  {editingTitle === item.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                        placeholder="제목 입력"
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveTitle}
                          className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          저장
                        </button>
                        <button
                          onClick={handleCancelTitle}
                          className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors flex items-center justify-center"
                        >
                          <X className="w-4 h-4 mr-1" />
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      <button
                        onClick={() => handleEditTitle(item)}
                        className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center"
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        제목 수정
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Preview Modal */}
          {previewItem && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setPreviewItem(null)}>
              <div className="max-w-4xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setPreviewItem(null)}
                  className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-700" />
                </button>
                {items.find(item => item.id === previewItem) && (
                  <img
                    src={getImageUrl(items.find(item => item.id === previewItem)!.image)}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                )}
              </div>
            </div>
          )}

          {/* Crop Modal */}
          {selectedItem && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold">이미지 크롭</h3>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Image Preview */}
                    <div className="lg:col-span-2">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        {items.find(item => item.id === selectedItem) && (
                          <img
                            src={getImageUrl(items.find(item => item.id === selectedItem)!.image)}
                            alt="Crop preview"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </div>

                    {/* Crop Controls */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          크롭 비율
                        </label>
                        <div className="space-y-2">
                          {presetCropRatios.map((preset) => (
                            <button
                              key={preset.name}
                              className="w-full px-3 py-2 text-left text-sm border rounded hover:bg-gray-50 text-gray-700"
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          회전
                        </label>
                        <div className="flex space-x-2">
                          <button className="flex-1 px-3 py-2 text-sm border rounded hover:bg-gray-50 text-gray-700">
                            90°
                          </button>
                          <button className="flex-1 px-3 py-2 text-sm border rounded hover:bg-gray-50 text-gray-700">
                            180°
                          </button>
                          <button className="flex-1 px-3 py-2 text-sm border rounded hover:bg-gray-50 text-gray-700">
                            270°
                          </button>
                        </div>
                      </div>

                      <div className="pt-4 space-y-3">
                        <button className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
                          적용
                        </button>
                        <button
                          onClick={() => setSelectedItem(null)}
                          className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-emerald-800 mb-2">
              💡 편집 팁
            </h4>
            <ul className="text-sm text-emerald-700 space-y-1">
              <li>• 정사각형 비율(1:1)로 크롭하면 월드컵에서 일관된 레이아웃을 유지할 수 있습니다</li>
              <li>• 제목은 간단하고 명확하게 작성하여 사용자가 쉽게 구분할 수 있도록 해주세요</li>
              <li>• 이미지의 핵심 부분이 잘 보이도록 크롭해주세요</li>
              <li>• 모든 이미지를 동일한 비율로 맞추면 더 깔끔한 월드컵을 만들 수 있습니다</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}