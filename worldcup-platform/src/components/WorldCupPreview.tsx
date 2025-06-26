'use client';

import React, { useEffect, useState } from 'react';
import { Play, Eye, Share2, Settings, Users, MessageCircle, Heart, Trophy } from 'lucide-react';

interface WorldCupItem {
  id: string;
  title: string;
  image: string | File;
  description?: string;
}

interface WorldCupData {
  title: string;
  description: string;
  category: string;
  items: WorldCupItem[];
  isPublic: boolean;
  thumbnail?: string | File | Blob | null; 
}

interface WorldCupPreviewProps {
  data: WorldCupData;
  onGameStateChange?: (isPlaying: boolean) => void;
}



export default function WorldCupPreview({ data, onGameStateChange }: WorldCupPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMatchItems, setCurrentMatchItems] = useState<[WorldCupItem, WorldCupItem] | null>(null);
  
  // getImageUrl 함수를 먼저 정의
  const getImageUrl = (image: string | File | Blob | undefined | null): string => {
    try {
      if (!image) {
        return '';
      }
      
      if (typeof image === 'string') {
        // Accept all string URLs including blob: URLs
        if (image.trim() === '') {
          return '';
        }
        
        // Base64 이미지 유효성 검증
        if (image.startsWith('data:image/')) {
          const base64Data = image.split(',')[1];
          if (base64Data && base64Data.length > 100) {
            console.log('✅ Preview valid base64 image detected, length:', base64Data.length);
            return image;
          } else {
            console.error('❌ Preview invalid base64 image data');
            return '';
          }
        }
        
        return image;
      }
      
      if (image instanceof File) {
        return URL.createObjectURL(image);
      }
      
      if (image instanceof Blob) {
        return URL.createObjectURL(image);
      }
      
      console.error('Invalid image type:', typeof image, image);
      return '';
    } catch (error) {
      console.error('Error creating image URL:', error);
      return '';
    }
  };
  
  // 수정: 썸네일은 getImageUrl 함수를 사용하여 처리
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  useEffect(() => {
    console.log('🔄 Preview useEffect triggered with thumbnail:', data.thumbnail);
    const url = getImageUrl(data.thumbnail);
    console.log('🔄 Preview processed thumbnailUrl:', url?.substring(0, 100) + '...');
    setThumbnailUrl(url);
  }, [data.thumbnail]);
  
  // 더 직접적인 방법으로도 시도
  const directThumbnailUrl = React.useMemo(() => {
    const url = getImageUrl(data.thumbnail);
    console.log('📋 Preview memoized thumbnailUrl:', url?.substring(0, 100) + '...');
    return url;
  }, [data.thumbnail]);
  
  // 디버그: 썸네일 데이터 확인
  React.useEffect(() => {
    console.log('=== WorldCupPreview Debug ===');
    console.log('Complete data object:', data);
    console.log('data.thumbnail:', data.thumbnail);
    console.log('data.thumbnail type:', typeof data.thumbnail);
    console.log('data.items length:', data.items.length);
    if (data.thumbnail) {
      const imageUrl = getImageUrl(data.thumbnail);
      console.log('getImageUrl result:', imageUrl);
      console.log('imageUrl length:', imageUrl.length);
    } else {
      console.log('No thumbnail found in data');
    }
    console.log('=== End Debug ===');
  }, [data]);

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
        </div>
      `;
      parent.appendChild(fallback);
    }
  };

  const getTournamentSize = () => {
    const itemCount = data.items.length;
    // Find next power of 2
    return Math.pow(2, Math.ceil(Math.log2(itemCount)));
  };

  const getRoundName = (roundNum: number, totalRounds: number) => {
    const remaining = Math.pow(2, totalRounds - roundNum + 1);
    if (remaining === 2) return '결승';
    if (remaining === 4) return '준결승';
    if (remaining === 8) return '8강';
    if (remaining === 16) return '16강';
    if (remaining === 32) return '32강';
    if (remaining === 64) return '64강';
    return `${remaining}강`;
  };

  const startPreview = () => {
    if (data.items.length >= 2) {
      const shuffled = [...data.items].sort(() => Math.random() - 0.5);
      setCurrentMatchItems([shuffled[0], shuffled[1]]);
      setIsPlaying(true);
      onGameStateChange?.(true);
    }
  };

  const handleChoice = (chosen: WorldCupItem) => {
    // Simulate next match
    const remaining = data.items.filter(item => item.id !== currentMatchItems![0].id && item.id !== currentMatchItems![1].id);
    if (remaining.length >= 2) {
      setCurrentMatchItems([chosen, remaining[0]]);
    } else {
      setIsPlaying(false);
      setCurrentMatchItems(null);
      onGameStateChange?.(false);
    }
  };

  // 수정: 썸네일 관련 함수들 제거 (이전 단계에서 처리됨)
  
  // 수정: handleCreateWorldCup 제거 - 이제 create 페이지에서 처리

  const tournamentSize = getTournamentSize();
  const totalRounds = Math.log2(tournamentSize);


  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Eye className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          미리보기
        </h2>
        <p className="text-gray-600">
          만든 월드컵을 미리 체험해보고 최종 확인하세요.
        </p>
      </div>

      {/* Preview or Game */}
      {!isPlaying ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white border rounded-lg overflow-hidden">
              {/* Card Header - 썸네일 표시 */}
              <div className="relative aspect-video overflow-hidden">
                {directThumbnailUrl || thumbnailUrl ? (
                  <>
                    <img
                      key={directThumbnailUrl || thumbnailUrl}
                      src={directThumbnailUrl || thumbnailUrl}
                      alt="썸네일"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('❌ Preview thumbnail failed:', {
                          directUrl: directThumbnailUrl?.substring(0, 100) + '...',
                          stateUrl: thumbnailUrl?.substring(0, 100) + '...',
                          error: e
                        });
                        handleImageError(e);
                      }}
                      onLoad={() => {
                        console.log('✅ Preview thumbnail loaded successfully!');
                      }}
                    />
                  </>
                ) : (
                  <div className="bg-gray-800 flex items-center justify-center h-full min-h-[300px] relative">
                    <div className="text-center p-6">
                      <div className="text-white text-lg font-medium mb-4">
                        썸네일이 설정되지 않았습니다
                      </div>
                      <p className="text-gray-400 text-sm">
                        이전 단계에서 썸네일을 설정하거나 월드컵 생성 시 자동으로 생성됩니다.
                      </p>
                      <p className="text-yellow-400 text-xs mt-2">
                        디버그: data.thumbnail = {String(data.thumbnail)}
                      </p>
                    </div>
                  </div>
                )}
              </div>


              {/* Card Content */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                  {data.title}
                </h3>
                {data.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {data.description}
                  </p>
                )}

                {/* Meta Info */}
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <span>내가 만든 월드컵</span>
                  <span className="mx-2">·</span>
                  <span>방금 전</span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <Play className="w-4 h-4 mr-1" />
                      0
                    </span>
                    <span className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      0
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 mr-1" />
                    0
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={startPreview}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-lg transition-colors font-medium flex items-center justify-center min-h-[40px]"
                  >
                    미리보기
                  </button>
                  <button className="p-2.5 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50">
                    <Heart className="w-4 h-4" />
                  </button>
                  <button className="p-2.5 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Tournament Info */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                토너먼트 정보
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">참가 항목</span>
                  <span className="font-medium">{data.items.length}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">토너먼트 크기</span>
                  <span className="font-medium">{tournamentSize}강</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">총 라운드</span>
                  <span className="font-medium">{totalRounds}라운드</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">예상 소요시간</span>
                  <span className="font-medium">{Math.ceil(tournamentSize / 4)}분</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">공개 설정</span>
                  <span className="font-medium">{data.isPublic ? '공개' : '비공개'}</span>
                </div>
              </div>
            </div>

            {/* Tournament Bracket */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                토너먼트 진행
              </h3>
              <div className="space-y-2">
                {Array.from({ length: totalRounds }, (_, i) => {
                  const roundNum = i + 1;
                  const roundName = getRoundName(roundNum, totalRounds);
                  const matches = Math.pow(2, totalRounds - roundNum);
                  
                  return (
                    <div key={roundNum} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{roundName}</span>
                      <span className="text-xs text-gray-500">{matches}경기</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Game Preview */
        currentMatchItems && (
          <div className="flex flex-col items-center justify-start min-h-screen p-4 pt-8 pb-2">
            {/* Header */}
            <div className="text-center mb-8">
            </div>

            {/* VS Section */}
            <div className="flex items-center justify-center w-full max-w-6xl mt-8">
              {/* Item 1 */}
              <div className="flex-1 max-w-xl mx-4 cursor-pointer transition-all duration-500"
                   onClick={() => handleChoice(currentMatchItems[0])}>
                <div className="bg-white rounded-3xl p-8 shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300">
                  {/* Item Image */}
                  <div className="aspect-square bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl mb-4 overflow-hidden">
                    {currentMatchItems[0].image ? (
                      <img 
                        src={getImageUrl(currentMatchItems[0].image)} 
                        alt={currentMatchItems[0].title}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${currentMatchItems[0].image ? 'hidden' : ''}`}>
                      <div className="text-center">
                        <div className="text-9xl mb-2">🎭</div>
                        <div className="text-gray-600 font-medium text-xl">
                          {currentMatchItems[0].title}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Item Info */}
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentMatchItems[0].title}
                    </h3>
                    {currentMatchItems[0].description && (
                      <p className="text-base text-gray-600">
                        {currentMatchItems[0].description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* VS Divider */}
              <div className="flex-shrink-0 mx-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl">
                  <span className="text-2xl font-bold text-gray-900">VS</span>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex-1 max-w-xl mx-4 cursor-pointer transition-all duration-500"
                   onClick={() => handleChoice(currentMatchItems[1])}>
                <div className="bg-white rounded-3xl p-8 shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300">
                  {/* Item Image */}
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mb-4 overflow-hidden">
                    {currentMatchItems[1].image ? (
                      <img 
                        src={getImageUrl(currentMatchItems[1].image)} 
                        alt={currentMatchItems[1].title}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${currentMatchItems[1].image ? 'hidden' : ''}`}>
                      <div className="text-center">
                        <div className="text-9xl mb-2">🎨</div>
                        <div className="text-gray-600 font-medium text-xl">
                          {currentMatchItems[1].title}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Item Info */}
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentMatchItems[1].title}
                    </h3>
                    {currentMatchItems[1].description && (
                      <p className="text-base text-gray-600">
                        {currentMatchItems[1].description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="text-center mt-8">
              <button
                onClick={() => {
                  setIsPlaying(false);
                  onGameStateChange?.(false);
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                미리보기 종료
              </button>
            </div>
          </div>
        )
      )}

      {/* Items Preview */}
      {!isPlaying && data.items.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            등록된 항목 ({data.items.length}개)
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {data.items.slice(0, 20).map((item) => (
              <div key={item.id} className="aspect-square group">
                <img
                  src={getImageUrl(item.image)}
                  alt={item.title}
                  className="w-full h-full object-cover rounded-lg"
                  onError={handleImageError}
                  loading="lazy"
                />
              </div>
            ))}
            {data.items.length > 20 && (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-500 text-center">
                  +{data.items.length - 20}개
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 수정: 파일 업로드 입력 제거 */}
    </div>
  );
}