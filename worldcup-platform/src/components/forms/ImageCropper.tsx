'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Edit3, RotateCw, Square, Scissors, Check, X, Eye, Move } from 'lucide-react';

interface WorldCupItem {
  id: string;
  title: string;
  image: string | File;
  description?: string;
}

interface ImageCropperProps {
  items: WorldCupItem[];
  onItemUpdate: (itemId: string, updates: Partial<WorldCupItem>) => void;
  thumbnail?: string | File;
  onThumbnailUpdate?: (thumbnail: string | File) => void;
}

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  ratio?: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageCropper({ items, onItemUpdate, thumbnail, onThumbnailUpdate }: ImageCropperProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<string | null>(null);
  const [cropData, setCropData] = useState<CropData>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotate: 0,
    ratio: 1,
  });
  const [cropArea, setCropArea] = useState<CropArea>({ x: 10, y: 10, width: 80, height: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [editingDescription, setEditingDescription] = useState<string | null>(null);
  const [descriptionInput, setDescriptionInput] = useState('');
  const [thumbnailCropData, setThumbnailCropData] = useState<CropData>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotate: 0,
    ratio: 1,
  });
  const [thumbnailCropArea, setThumbnailCropArea] = useState<CropArea>({ x: 10, y: 10, width: 80, height: 80 });
  const [isEditingThumbnail, setIsEditingThumbnail] = useState(false);
  const [thumbnailDragging, setThumbnailDragging] = useState(false);
  const [thumbnailDragStart, setThumbnailDragStart] = useState({ x: 0, y: 0 });
  const [thumbnailResizing, setThumbnailResizing] = useState(false);
  const [thumbnailResizeHandle, setThumbnailResizeHandle] = useState<string | null>(null);
  const [thumbnailResizeStart, setThumbnailResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailCropContainerRef = useRef<HTMLDivElement>(null);

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

  const handleEditDescription = (item: WorldCupItem) => {
    setEditingDescription(item.id);
    setDescriptionInput(item.description || '');
  };

  const handleSaveDescription = () => {
    if (editingDescription) {
      onItemUpdate(editingDescription, { description: descriptionInput.trim() });
    }
    setEditingDescription(null);
    setDescriptionInput('');
  };

  const handleCancelDescription = () => {
    setEditingDescription(null);
    setDescriptionInput('');
  };

  // 이미지 회전 함수
  const rotateImage = useCallback(async (imageUrl: string, degrees: number): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // CORS 처리를 위해 crossOrigin 설정
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        if (degrees === 90 || degrees === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        
        ctx!.save();
        ctx!.translate(canvas.width / 2, canvas.height / 2);
        ctx!.rotate((degrees * Math.PI) / 180);
        ctx!.drawImage(img, -img.width / 2, -img.height / 2);
        ctx!.restore();
        
        try {
          // 더 안전한 toBlob 방식 사용
          canvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => {
                console.log('✅ Rotate canvas toBlob success, size:', blob.size);
                resolve(reader.result as string);
              };
              reader.onerror = () => {
                console.error('❌ Rotate FileReader error, using fallback');
                resolve(imageUrl);
              };
              reader.readAsDataURL(blob);
            } else {
              console.error('❌ Rotate toBlob failed, using fallback');
              resolve(imageUrl);
            }
          }, 'image/jpeg', 0.9);
        } catch (error) {
          console.error('❌ Rotate canvas error, using fallback:', error);
          resolve(imageUrl);
        }
      };
      
      img.onerror = () => {
        console.error('Image failed to load for rotation');
        resolve(imageUrl);
      };
      
      img.src = imageUrl;
    });
  }, []);

  // 이미지 크롭 함수
  const cropImage = useCallback(async (imageUrl: string, crop: CropArea, containerSize: { width: number, height: number }): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // CORS 처리를 위해 crossOrigin 설정
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // 실제 이미지 크기와 표시된 크기의 비율 계산
        const scaleX = img.width / containerSize.width;
        const scaleY = img.height / containerSize.height;
        
        // 크롭 영역을 실제 이미지 좌표로 변환
        const actualCrop = {
          x: crop.x * scaleX,
          y: crop.y * scaleY,
          width: crop.width * scaleX,
          height: crop.height * scaleY
        };
        
        canvas.width = actualCrop.width;
        canvas.height = actualCrop.height;
        
        ctx!.drawImage(
          img,
          actualCrop.x,
          actualCrop.y,
          actualCrop.width,
          actualCrop.height,
          0,
          0,
          actualCrop.width,
          actualCrop.height
        );
        
        try {
          // 더 안전한 toBlob 방식 사용
          canvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => {
                console.log('✅ Crop canvas toBlob success, size:', blob.size);
                resolve(reader.result as string);
              };
              reader.onerror = () => {
                console.error('❌ FileReader error, using fallback');
                resolve(imageUrl);
              };
              reader.readAsDataURL(blob);
            } else {
              console.error('❌ toBlob failed, using fallback');
              resolve(imageUrl);
            }
          }, 'image/jpeg', 0.9);
        } catch (error) {
          console.error('❌ Canvas error, using fallback:', error);
          resolve(imageUrl);
        }
      };
      
      img.onerror = () => {
        console.error('Image failed to load for cropping');
        resolve(imageUrl);
      };
      
      img.src = imageUrl;
    });
  }, []);

  const handleRotate = async (itemId: string) => {
    const item = items.find(item => item.id === itemId);
    if (!item) return;
    
    const newRotation = (cropData.rotate + 90) % 360;
    setCropData(prev => ({ ...prev, rotate: newRotation }));
    
    try {
      const imageUrl = getImageUrl(item.image);
      const rotatedImageUrl = await rotateImage(imageUrl, 90);
      
      // 회전된 이미지를 Blob으로 변환
      const response = await fetch(rotatedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], `rotated_${item.title}.jpg`, { type: 'image/jpeg' });
      
      onItemUpdate(itemId, { image: file });
    } catch (error) {
      console.error('Error rotating image:', error);
    }
  };

  const handleCrop = (itemId: string) => {
    setSelectedItem(itemId);
    // 크롭 영역을 중앙에 더 큰 크기로 초기화
    setCropArea({ x: 15, y: 15, width: 70, height: 70 });
    // 기본 비율을 1:1로 설정
    setCropData(prev => ({ ...prev, ratio: 1 }));
  };

  // 크롭 비율 적용
  const applyCropRatio = (ratio: number) => {
    setCropData(prev => ({ ...prev, ratio }));
    
    // 현재 크롭 영역을 비율에 맞게 조정
    let newWidth, newHeight;
    const centerX = cropArea.x + cropArea.width / 2;
    const centerY = cropArea.y + cropArea.height / 2;
    
    if (ratio >= 1) {
      // 가로가 더 긴 경우 (16:9, 4:3, 1:1)
      newHeight = 60; // 더 큰 고정 높이
      newWidth = newHeight * ratio;
    } else {
      // 세로가 더 긴 경우 (3:4)
      newWidth = 60; // 더 큰 고정 너비
      newHeight = newWidth / ratio;
    }
    
    // 영역이 컨테이너를 벗어나지 않도록 조정 (최대 85%)
    if (newWidth > 85) {
      newWidth = 85;
      newHeight = newWidth / ratio;
    }
    if (newHeight > 85) {
      newHeight = 85;
      newWidth = newHeight * ratio;
    }
    
    // 중앙을 기준으로 새 위치 계산
    const newX = Math.max(5, Math.min(100 - newWidth - 5, centerX - newWidth / 2));
    const newY = Math.max(5, Math.min(100 - newHeight - 5, centerY - newHeight / 2));
    
    setCropArea({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    });
  };

  // 크롭 적용
  const applyCrop = async () => {
    if (!selectedItem) return;
    
    const item = items.find(item => item.id === selectedItem);
    if (!item) return;
    
    const container = cropContainerRef.current;
    if (!container) return;
    
    try {
      const containerRect = container.getBoundingClientRect();
      const imageUrl = getImageUrl(item.image);
      
      // 퍼센트를 픽셀로 변환
      const cropInPixels = {
        x: (cropArea.x / 100) * containerRect.width,
        y: (cropArea.y / 100) * containerRect.height,
        width: (cropArea.width / 100) * containerRect.width,
        height: (cropArea.height / 100) * containerRect.height
      };
      
      const croppedImageUrl = await cropImage(imageUrl, cropInPixels, {
        width: containerRect.width,
        height: containerRect.height
      });
      
      // 크롭된 이미지를 Blob으로 변환
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], `cropped_${item.title}.jpg`, { type: 'image/jpeg' });
      
      onItemUpdate(selectedItem, { image: file });
      setSelectedItem(null);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  // 모서리 드래그 시작 핸들러
  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    
    const rect = cropContainerRef.current?.getBoundingClientRect();
    if (rect) {
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: cropArea.width,
        height: cropArea.height
      });
    }
  };

  // 마우스 이벤트 핸들러
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!cropContainerRef.current) return;
    
    const rect = cropContainerRef.current.getBoundingClientRect();
    
    if (isDragging) {
      // 크롭 영역 이동
      const x = ((e.clientX - rect.left - dragStart.x) / rect.width) * 100;
      const y = ((e.clientY - rect.top - dragStart.y) / rect.height) * 100;
      
      // 경계 체크
      const maxX = 100 - cropArea.width;
      const maxY = 100 - cropArea.height;
      
      setCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(maxX, x)),
        y: Math.max(0, Math.min(maxY, y))
      }));
    } else if (isResizing && resizeHandle) {
      // 크롭 영역 리사이징
      const deltaX = ((e.clientX - resizeStart.x) / rect.width) * 100;
      const deltaY = ((e.clientY - resizeStart.y) / rect.height) * 100;
      
      const newCropArea = { ...cropArea };
      
      switch (resizeHandle) {
        case 'nw': // 왼쪽 위
          newCropArea.x = Math.max(0, cropArea.x + deltaX);
          newCropArea.y = Math.max(0, cropArea.y + deltaY);
          newCropArea.width = Math.max(10, resizeStart.width - deltaX);
          newCropArea.height = Math.max(10, resizeStart.height - deltaY);
          break;
        case 'ne': // 오른쪽 위
          newCropArea.y = Math.max(0, cropArea.y + deltaY);
          newCropArea.width = Math.max(10, resizeStart.width + deltaX);
          newCropArea.height = Math.max(10, resizeStart.height - deltaY);
          break;
        case 'sw': // 왼쪽 아래
          newCropArea.x = Math.max(0, cropArea.x + deltaX);
          newCropArea.width = Math.max(10, resizeStart.width - deltaX);
          newCropArea.height = Math.max(10, resizeStart.height + deltaY);
          break;
        case 'se': // 오른쪽 아래
          newCropArea.width = Math.max(10, resizeStart.width + deltaX);
          newCropArea.height = Math.max(10, resizeStart.height + deltaY);
          break;
        case 'n': // 위쪽
          newCropArea.y = Math.max(0, cropArea.y + deltaY);
          newCropArea.height = Math.max(10, resizeStart.height - deltaY);
          break;
        case 's': // 아래쪽
          newCropArea.height = Math.max(10, resizeStart.height + deltaY);
          break;
        case 'w': // 왼쪽
          newCropArea.x = Math.max(0, cropArea.x + deltaX);
          newCropArea.width = Math.max(10, resizeStart.width - deltaX);
          break;
        case 'e': // 오른쪽
          newCropArea.width = Math.max(10, resizeStart.width + deltaX);
          break;
      }
      
      // 비율 유지 (선택된 비율이 있을 때)
      if (cropData.ratio && cropData.ratio > 0) {
        switch (resizeHandle) {
          case 'se': // 오른쪽 아래 - 너비 기준으로 높이 조정
            newCropArea.height = newCropArea.width / cropData.ratio;
            break;
          case 'nw': // 왼쪽 위 - 너비 기준으로 높이 조정
            const adjustedHeight = newCropArea.width / cropData.ratio;
            newCropArea.y = cropArea.y + cropArea.height - adjustedHeight;
            newCropArea.height = adjustedHeight;
            break;
          case 'ne': // 오른쪽 위 - 너비 기준으로 높이 조정
            const neAdjustedHeight = newCropArea.width / cropData.ratio;
            newCropArea.y = cropArea.y + cropArea.height - neAdjustedHeight;
            newCropArea.height = neAdjustedHeight;
            break;
          case 'sw': // 왼쪽 아래 - 너비 기준으로 높이 조정
            newCropArea.height = newCropArea.width / cropData.ratio;
            break;
          case 'e': // 오른쪽 - 너비 기준으로 높이 조정
          case 'w': // 왼쪽 - 너비 기준으로 높이 조정
            newCropArea.height = newCropArea.width / cropData.ratio;
            break;
          case 'n': // 위쪽 - 높이 기준으로 너비 조정
          case 's': // 아래쪽 - 높이 기준으로 너비 조정
            newCropArea.width = newCropArea.height * cropData.ratio;
            break;
        }
      }
      
      // 경계 체크
      if (newCropArea.x + newCropArea.width > 100) {
        newCropArea.width = 100 - newCropArea.x;
      }
      if (newCropArea.y + newCropArea.height > 100) {
        newCropArea.height = 100 - newCropArea.y;
      }
      
      setCropArea(newCropArea);
    }
  }, [isDragging, isResizing, resizeHandle, dragStart, resizeStart, cropArea, cropData.ratio]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // 이벤트 리스너 등록
  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // 썸네일 회전 핸들러
  const handleThumbnailRotate = async () => {
    console.log('handleThumbnailRotate called with:', { thumbnail, onThumbnailUpdate });
    if (!thumbnail || !onThumbnailUpdate) return;
    
    const newRotation = (thumbnailCropData.rotate + 90) % 360;
    setThumbnailCropData(prev => ({ ...prev, rotate: newRotation }));
    
    try {
      const imageUrl = getImageUrl(thumbnail);
      const rotatedImageUrl = await rotateImage(imageUrl, 90);
      
      // 회전된 이미지를 Blob으로 변환
      const response = await fetch(rotatedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'rotated_thumbnail.jpg', { type: 'image/jpeg' });
      
      console.log('Calling onThumbnailUpdate with rotated file:', file);
      onThumbnailUpdate(file);
    } catch (error) {
      console.error('Error rotating thumbnail:', error);
    }
  };

  // 썸네일 크롭 비율 적용
  const applyThumbnailCropRatio = (ratio: number) => {
    setThumbnailCropData(prev => ({ ...prev, ratio }));
    
    // 현재 크롭 영역을 비율에 맞게 조정
    let newWidth, newHeight;
    const centerX = thumbnailCropArea.x + thumbnailCropArea.width / 2;
    const centerY = thumbnailCropArea.y + thumbnailCropArea.height / 2;
    
    if (ratio >= 1) {
      // 가로가 더 긴 경우 (16:9, 4:3, 1:1)
      newHeight = 60; // 더 큰 고정 높이
      newWidth = newHeight * ratio;
    } else {
      // 세로가 더 긴 경우 (3:4)
      newWidth = 60; // 더 큰 고정 너비
      newHeight = newWidth / ratio;
    }
    
    // 영역이 컨테이너를 벗어나지 않도록 조정 (최대 85%)
    if (newWidth > 85) {
      newWidth = 85;
      newHeight = newWidth / ratio;
    }
    if (newHeight > 85) {
      newHeight = 85;
      newWidth = newHeight * ratio;
    }
    
    // 중앙을 기준으로 새 위치 계산
    const newX = Math.max(5, Math.min(100 - newWidth - 5, centerX - newWidth / 2));
    const newY = Math.max(5, Math.min(100 - newHeight - 5, centerY - newHeight / 2));
    
    setThumbnailCropArea({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    });
  };

  // 썸네일 크롭 적용
  const applyThumbnailCrop = async () => {
    console.log('applyThumbnailCrop called with:', { thumbnail, onThumbnailUpdate });
    if (!thumbnail || !onThumbnailUpdate) return;
    
    const container = thumbnailCropContainerRef.current;
    if (!container) return;
    
    try {
      const containerRect = container.getBoundingClientRect();
      const imageUrl = getImageUrl(thumbnail);
      
      console.log('Thumbnail crop - imageUrl:', imageUrl);
      console.log('Thumbnail crop - thumbnail type:', typeof thumbnail);
      console.log('Thumbnail crop - thumbnail instanceof File:', thumbnail instanceof File);
      
      if (!imageUrl || imageUrl.includes('placeholder')) {
        console.error('Invalid thumbnail URL for cropping:', imageUrl);
        return;
      }
      
      // 퍼센트를 픽셀로 변환
      const cropInPixels = {
        x: (thumbnailCropArea.x / 100) * containerRect.width,
        y: (thumbnailCropArea.y / 100) * containerRect.height,
        width: (thumbnailCropArea.width / 100) * containerRect.width,
        height: (thumbnailCropArea.height / 100) * containerRect.height
      };
      
      const croppedImageUrl = await cropImage(imageUrl, cropInPixels, {
        width: containerRect.width,
        height: containerRect.height
      });
      
      // 크롭된 이미지를 Blob으로 변환
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'cropped_thumbnail.jpg', { type: 'image/jpeg' });
      
      console.log('Calling onThumbnailUpdate with cropped file:', file);
      onThumbnailUpdate(file);
      setIsEditingThumbnail(false);
    } catch (error) {
      console.error('Error cropping thumbnail:', error);
    }
  };

  // 썸네일 드래그 시작 핸들러
  const handleThumbnailDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setThumbnailDragging(true);
    const rect = thumbnailCropContainerRef.current?.getBoundingClientRect();
    if (rect) {
      setThumbnailDragStart({
        x: e.clientX - rect.left - (thumbnailCropArea.x / 100 * rect.width),
        y: e.clientY - rect.top - (thumbnailCropArea.y / 100 * rect.height)
      });
    }
  };

  // 썸네일 리사이즈 시작 핸들러
  const handleThumbnailResizeStart = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setThumbnailResizing(true);
    setThumbnailResizeHandle(handle);
    const rect = thumbnailCropContainerRef.current?.getBoundingClientRect();
    if (rect) {
      setThumbnailResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: thumbnailCropArea.width,
        height: thumbnailCropArea.height
      });
    }
  };

  // 썸네일 마우스 이동 핸들러
  const handleThumbnailMouseMove = useCallback((e: MouseEvent) => {
    if (thumbnailDragging && thumbnailCropContainerRef.current) {
      const rect = thumbnailCropContainerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left - thumbnailDragStart.x) / rect.width) * 100;
      const y = ((e.clientY - rect.top - thumbnailDragStart.y) / rect.height) * 100;
      
      // 경계 체크
      const maxX = 100 - thumbnailCropArea.width;
      const maxY = 100 - thumbnailCropArea.height;
      
      setThumbnailCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(maxX, x)),
        y: Math.max(0, Math.min(maxY, y))
      }));
    }
    
    if (thumbnailResizing && thumbnailResizeHandle && thumbnailCropContainerRef.current) {
      const rect = thumbnailCropContainerRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - thumbnailResizeStart.x) / rect.width) * 100;
      const deltaY = ((e.clientY - thumbnailResizeStart.y) / rect.height) * 100;
      
      const newCropArea = { ...thumbnailCropArea };
      
      // 비율 유지 여부 확인
      const maintainRatio = thumbnailCropData.ratio != null && thumbnailCropData.ratio > 0;
      
      switch (thumbnailResizeHandle) {
        case 'se': // 우하단
          newCropArea.width = Math.max(10, thumbnailResizeStart.width + deltaX);
          if (maintainRatio && thumbnailCropData.ratio) {
            newCropArea.height = newCropArea.width / thumbnailCropData.ratio;
          } else {
            newCropArea.height = Math.max(10, thumbnailResizeStart.height + deltaY);
          }
          break;
        case 'sw': // 좌하단
          const newWidth = Math.max(10, thumbnailResizeStart.width - deltaX);
          newCropArea.x = thumbnailCropArea.x + (thumbnailCropArea.width - newWidth);
          newCropArea.width = newWidth;
          if (maintainRatio && thumbnailCropData.ratio) {
            newCropArea.height = newCropArea.width / thumbnailCropData.ratio;
          } else {
            newCropArea.height = Math.max(10, thumbnailResizeStart.height + deltaY);
          }
          break;
        case 'ne': // 우상단
          newCropArea.width = Math.max(10, thumbnailResizeStart.width + deltaX);
          if (maintainRatio) {
            const newHeight = newCropArea.width / (thumbnailCropData.ratio || 1);
            newCropArea.y = thumbnailCropArea.y + (thumbnailCropArea.height - newHeight);
            newCropArea.height = newHeight;
          } else {
            const newHeight = Math.max(10, thumbnailResizeStart.height - deltaY);
            newCropArea.y = thumbnailCropArea.y + (thumbnailCropArea.height - newHeight);
            newCropArea.height = newHeight;
          }
          break;
        case 'nw': // 좌상단
          const newWidthNW = Math.max(10, thumbnailResizeStart.width - deltaX);
          newCropArea.x = thumbnailCropArea.x + (thumbnailCropArea.width - newWidthNW);
          newCropArea.width = newWidthNW;
          if (maintainRatio) {
            const newHeight = newCropArea.width / (thumbnailCropData.ratio || 1);
            newCropArea.y = thumbnailCropArea.y + (thumbnailCropArea.height - newHeight);
            newCropArea.height = newHeight;
          } else {
            const newHeight = Math.max(10, thumbnailResizeStart.height - deltaY);
            newCropArea.y = thumbnailCropArea.y + (thumbnailCropArea.height - newHeight);
            newCropArea.height = newHeight;
          }
          break;
        case 'e': // 오른쪽 - 너비 기준으로 높이 조정
        case 'w': // 왼쪽 - 너비 기준으로 높이 조정
          if (thumbnailResizeHandle === 'e') {
            newCropArea.width = Math.max(10, thumbnailResizeStart.width + deltaX);
          } else {
            const newWidthW = Math.max(10, thumbnailResizeStart.width - deltaX);
            newCropArea.x = thumbnailCropArea.x + (thumbnailCropArea.width - newWidthW);
            newCropArea.width = newWidthW;
          }
          if (maintainRatio && thumbnailCropData.ratio) {
            newCropArea.height = newCropArea.width / thumbnailCropData.ratio;
          }
          break;
        case 'n': // 위쪽 - 높이 기준으로 너비 조정
        case 's': // 아래쪽 - 높이 기준으로 너비 조정
          if (thumbnailResizeHandle === 's') {
            newCropArea.height = Math.max(10, thumbnailResizeStart.height + deltaY);
          } else {
            const newHeightN = Math.max(10, thumbnailResizeStart.height - deltaY);
            newCropArea.y = thumbnailCropArea.y + (thumbnailCropArea.height - newHeightN);
            newCropArea.height = newHeightN;
          }
          if (maintainRatio) {
            newCropArea.width = newCropArea.height * (thumbnailCropData.ratio || 1);
          }
          break;
      }
      
      // 경계 체크
      if (newCropArea.x + newCropArea.width > 100) {
        newCropArea.width = 100 - newCropArea.x;
      }
      if (newCropArea.y + newCropArea.height > 100) {
        newCropArea.height = 100 - newCropArea.y;
      }
      
      setThumbnailCropArea(newCropArea);
    }
  }, [thumbnailDragging, thumbnailResizing, thumbnailResizeHandle, thumbnailDragStart, thumbnailResizeStart, thumbnailCropArea, thumbnailCropData.ratio]);

  // 썸네일 마우스 떼기 핸들러
  const handleThumbnailMouseUp = useCallback(() => {
    setThumbnailDragging(false);
    setThumbnailResizing(false);
    setThumbnailResizeHandle(null);
  }, []);

  // 썸네일 이벤트 리스너 등록
  React.useEffect(() => {
    if (thumbnailDragging || thumbnailResizing) {
      document.addEventListener('mousemove', handleThumbnailMouseMove);
      document.addEventListener('mouseup', handleThumbnailMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleThumbnailMouseMove);
        document.removeEventListener('mouseup', handleThumbnailMouseUp);
      };
    }
  }, [thumbnailDragging, thumbnailResizing, handleThumbnailMouseMove, handleThumbnailMouseUp]);

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
          {/* Thumbnail Edit Section */}
          {thumbnail && onThumbnailUpdate && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                <Edit3 className="w-5 h-5 mr-2" />
                썸네일 편집
              </h3>
              <div className="flex items-start space-x-4">
                <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden cursor-pointer">
                  <img
                    src={getImageUrl(thumbnail)}
                    alt="썸네일"
                    className="w-full h-full object-cover"
                    onClick={() => setIsEditingThumbnail(true)}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-purple-700 mb-3">
                    월드컵의 대표 이미지입니다. 클릭하여 편집하거나 회전할 수 있습니다.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsEditingThumbnail(true)}
                      className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center space-x-1"
                    >
                      <Scissors className="w-3 h-3" />
                      <span>크롭</span>
                    </button>
                    <button
                      onClick={handleThumbnailRotate}
                      className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center space-x-1"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>회전</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}


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
                        className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center mb-3"
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        제목 수정
                      </button>
                    </div>
                  )}

                  {/* Description Editor */}
                  {editingDescription === item.id ? (
                    <div className="space-y-3 border-t pt-3">
                      <textarea
                        value={descriptionInput}
                        onChange={(e) => setDescriptionInput(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 resize-none"
                        placeholder="게임에서 표시될 설명을 입력하세요 (선택사항)"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveDescription}
                          className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          저장
                        </button>
                        <button
                          onClick={handleCancelDescription}
                          className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors flex items-center justify-center"
                        >
                          <X className="w-4 h-4 mr-1" />
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t pt-3">
                      {item.description ? (
                        <div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                            {item.description}
                          </p>
                          <button
                            onClick={() => handleEditDescription(item)}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            설명 수정
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditDescription(item)}
                          className="text-sm text-gray-500 hover:text-blue-600 flex items-center"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          설명 추가
                        </button>
                      )}
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
                    {/* Image Preview with Crop Area */}
                    <div className="lg:col-span-2">
                      <div 
                        ref={cropContainerRef}
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative"
                        style={{ minHeight: '400px' }}
                      >
                        {items.find(item => item.id === selectedItem) && (
                          <>
                            <img
                              src={getImageUrl(items.find(item => item.id === selectedItem)!.image)}
                              alt="Crop preview"
                              className="w-full h-full object-cover"
                              draggable={false}
                              onError={(e) => {
                                console.error('Image failed to load in crop modal');
                                // 이미지 로딩 실패시 재시도
                                const img = e.currentTarget;
                                setTimeout(() => {
                                  img.src = getImageUrl(items.find(item => item.id === selectedItem)!.image);
                                }, 1000);
                              }}
                              onLoad={() => {
                                console.log('Image loaded successfully in crop modal');
                              }}
                            />
                            
                            {/* Crop Overlay - Only show dark areas outside crop */}
                            <div className="absolute inset-0 pointer-events-none">
                              {/* Top overlay */}
                              <div 
                                className="absolute bg-black bg-opacity-50"
                                style={{
                                  left: 0,
                                  top: 0,
                                  width: '100%',
                                  height: `${cropArea.y}%`
                                }}
                              />
                              {/* Bottom overlay */}
                              <div 
                                className="absolute bg-black bg-opacity-50"
                                style={{
                                  left: 0,
                                  top: `${cropArea.y + cropArea.height}%`,
                                  width: '100%',
                                  height: `${100 - cropArea.y - cropArea.height}%`
                                }}
                              />
                              {/* Left overlay */}
                              <div 
                                className="absolute bg-black bg-opacity-50"
                                style={{
                                  left: 0,
                                  top: `${cropArea.y}%`,
                                  width: `${cropArea.x}%`,
                                  height: `${cropArea.height}%`
                                }}
                              />
                              {/* Right overlay */}
                              <div 
                                className="absolute bg-black bg-opacity-50"
                                style={{
                                  left: `${cropArea.x + cropArea.width}%`,
                                  top: `${cropArea.y}%`,
                                  width: `${100 - cropArea.x - cropArea.width}%`,
                                  height: `${cropArea.height}%`
                                }}
                              />
                            </div>
                            
                            {/* Crop Selection Area */}
                            <div
                              className="absolute border-2 border-white cursor-move pointer-events-auto"
                              style={{
                                left: `${cropArea.x}%`,
                                top: `${cropArea.y}%`,
                                width: `${cropArea.width}%`,
                                height: `${cropArea.height}%`,
                                backgroundColor: 'transparent'
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                                const rect = cropContainerRef.current?.getBoundingClientRect();
                                if (rect) {
                                  setDragStart({
                                    x: e.clientX - rect.left - (cropArea.x / 100 * rect.width),
                                    y: e.clientY - rect.top - (cropArea.y / 100 * rect.height)
                                  });
                                }
                              }}
                            >
                              {/* Corner Handles */}
                              <div 
                                className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-gray-400 cursor-nw-resize hover:bg-blue-100"
                                onMouseDown={(e) => handleResizeStart(e, 'nw')}
                              ></div>
                              <div 
                                className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-gray-400 cursor-ne-resize hover:bg-blue-100"
                                onMouseDown={(e) => handleResizeStart(e, 'ne')}
                              ></div>
                              <div 
                                className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-gray-400 cursor-sw-resize hover:bg-blue-100"
                                onMouseDown={(e) => handleResizeStart(e, 'sw')}
                              ></div>
                              <div 
                                className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-gray-400 cursor-se-resize hover:bg-blue-100"
                                onMouseDown={(e) => handleResizeStart(e, 'se')}
                              ></div>
                              
                              {/* Edge Handles */}
                              <div 
                                className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border border-gray-400 cursor-n-resize hover:bg-blue-100"
                                onMouseDown={(e) => handleResizeStart(e, 'n')}
                              ></div>
                              <div 
                                className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border border-gray-400 cursor-s-resize hover:bg-blue-100"
                                onMouseDown={(e) => handleResizeStart(e, 's')}
                              ></div>
                              <div 
                                className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white border border-gray-400 cursor-w-resize hover:bg-blue-100"
                                onMouseDown={(e) => handleResizeStart(e, 'w')}
                              ></div>
                              <div 
                                className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white border border-gray-400 cursor-e-resize hover:bg-blue-100"
                                onMouseDown={(e) => handleResizeStart(e, 'e')}
                              ></div>
                              
                              {/* Center Move Icon */}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <Move className="w-6 h-6 text-white opacity-60" />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Crop Instructions */}
                      <div className="mt-4 text-sm text-gray-600">
                        <p>• 드래그하여 크롭 영역을 이동하세요</p>
                        <p>• 모서리를 드래그하여 크기를 조절하세요</p>
                        <p>• 비율 버튼을 클릭하여 원하는 비율을 적용하세요</p>
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
                              onClick={() => applyCropRatio(preset.ratio)}
                              className={`w-full px-3 py-2 text-left text-sm border rounded transition-colors ${
                                cropData.ratio === preset.ratio 
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                              }`}
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
                          <button 
                            onClick={() => selectedItem && handleRotate(selectedItem)}
                            className="flex-1 px-3 py-2 text-sm border rounded hover:bg-gray-50 text-gray-700"
                          >
                            90°
                          </button>
                          <button 
                            onClick={async () => {
                              if (selectedItem) {
                                await handleRotate(selectedItem);
                                await handleRotate(selectedItem);
                              }
                            }}
                            className="flex-1 px-3 py-2 text-sm border rounded hover:bg-gray-50 text-gray-700"
                          >
                            180°
                          </button>
                          <button 
                            onClick={async () => {
                              if (selectedItem) {
                                await handleRotate(selectedItem);
                                await handleRotate(selectedItem);
                                await handleRotate(selectedItem);
                              }
                            }}
                            className="flex-1 px-3 py-2 text-sm border rounded hover:bg-gray-50 text-gray-700"
                          >
                            270°
                          </button>
                        </div>
                      </div>

                      <div className="pt-4 space-y-3">
                        <button 
                          onClick={applyCrop}
                          className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                        >
                          적용
                        </button>
                        <button
                          onClick={() => setSelectedItem(null)}
                          className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition-colors"
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

          {/* Thumbnail Crop Modal */}
          {isEditingThumbnail && thumbnail && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold">썸네일 크롭</h3>
                    <button
                      onClick={() => setIsEditingThumbnail(false)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Image Preview with Crop Area */}
                    <div className="lg:col-span-2">
                      <div 
                        ref={thumbnailCropContainerRef}
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative"
                        style={{ minHeight: '400px' }}
                      >
                        <img
                          src={getImageUrl(thumbnail)}
                          alt="Thumbnail crop preview"
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                        
                        {/* Crop Overlay - Only show dark areas outside crop */}
                        <div className="absolute inset-0 pointer-events-none">
                          {/* Top overlay */}
                          <div 
                            className="absolute bg-black bg-opacity-50"
                            style={{
                              left: 0,
                              top: 0,
                              width: '100%',
                              height: `${thumbnailCropArea.y}%`
                            }}
                          />
                          {/* Bottom overlay */}
                          <div 
                            className="absolute bg-black bg-opacity-50"
                            style={{
                              left: 0,
                              top: `${thumbnailCropArea.y + thumbnailCropArea.height}%`,
                              width: '100%',
                              height: `${100 - thumbnailCropArea.y - thumbnailCropArea.height}%`
                            }}
                          />
                          {/* Left overlay */}
                          <div 
                            className="absolute bg-black bg-opacity-50"
                            style={{
                              left: 0,
                              top: `${thumbnailCropArea.y}%`,
                              width: `${thumbnailCropArea.x}%`,
                              height: `${thumbnailCropArea.height}%`
                            }}
                          />
                          {/* Right overlay */}
                          <div 
                            className="absolute bg-black bg-opacity-50"
                            style={{
                              left: `${thumbnailCropArea.x + thumbnailCropArea.width}%`,
                              top: `${thumbnailCropArea.y}%`,
                              width: `${100 - thumbnailCropArea.x - thumbnailCropArea.width}%`,
                              height: `${thumbnailCropArea.height}%`
                            }}
                          />
                        </div>
                        
                        {/* Crop Selection Area */}
                        <div
                          className="absolute border-2 border-white cursor-move pointer-events-auto"
                          style={{
                            left: `${thumbnailCropArea.x}%`,
                            top: `${thumbnailCropArea.y}%`,
                            width: `${thumbnailCropArea.width}%`,
                            height: `${thumbnailCropArea.height}%`,
                            backgroundColor: 'transparent'
                          }}
                          onMouseDown={handleThumbnailDragStart}
                        >
                          {/* Corner Handles */}
                          <div 
                            className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-gray-400 cursor-nw-resize hover:bg-blue-100"
                            onMouseDown={(e) => handleThumbnailResizeStart(e, 'nw')}
                          ></div>
                          <div 
                            className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-gray-400 cursor-ne-resize hover:bg-blue-100"
                            onMouseDown={(e) => handleThumbnailResizeStart(e, 'ne')}
                          ></div>
                          <div 
                            className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-gray-400 cursor-sw-resize hover:bg-blue-100"
                            onMouseDown={(e) => handleThumbnailResizeStart(e, 'sw')}
                          ></div>
                          <div 
                            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-gray-400 cursor-se-resize hover:bg-blue-100"
                            onMouseDown={(e) => handleThumbnailResizeStart(e, 'se')}
                          ></div>
                          
                          {/* Edge Handles */}
                          <div 
                            className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border border-gray-400 cursor-n-resize hover:bg-blue-100"
                            onMouseDown={(e) => handleThumbnailResizeStart(e, 'n')}
                          ></div>
                          <div 
                            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border border-gray-400 cursor-s-resize hover:bg-blue-100"
                            onMouseDown={(e) => handleThumbnailResizeStart(e, 's')}
                          ></div>
                          <div 
                            className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white border border-gray-400 cursor-w-resize hover:bg-blue-100"
                            onMouseDown={(e) => handleThumbnailResizeStart(e, 'w')}
                          ></div>
                          <div 
                            className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white border border-gray-400 cursor-e-resize hover:bg-blue-100"
                            onMouseDown={(e) => handleThumbnailResizeStart(e, 'e')}
                          ></div>
                          
                          {/* Center Move Icon */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <Move className="w-6 h-6 text-white opacity-60" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Crop Instructions */}
                      <div className="mt-4 text-sm text-gray-600">
                        <p>• 썸네일은 대표 이미지로 사용됩니다</p>
                        <p>• 16:9 비율로 크롭하는 것을 권장합니다</p>
                        <p>• 주요 내용이 잘 보이도록 조정해주세요</p>
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
                              onClick={() => applyThumbnailCropRatio(preset.ratio)}
                              className={`w-full px-3 py-2 text-left text-sm border rounded transition-colors ${
                                thumbnailCropData.ratio === preset.ratio 
                                  ? 'bg-purple-50 border-purple-300 text-purple-700' 
                                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                              }`}
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
                          <button 
                            onClick={handleThumbnailRotate}
                            className="flex-1 px-3 py-2 text-sm border rounded hover:bg-gray-50 text-gray-700"
                          >
                            90°
                          </button>
                        </div>
                      </div>

                      <div className="pt-4 space-y-3">
                        <button 
                          onClick={applyThumbnailCrop}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        >
                          적용
                        </button>
                        <button
                          onClick={() => setIsEditingThumbnail(false)}
                          className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition-colors"
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