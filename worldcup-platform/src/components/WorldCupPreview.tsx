'use client';

import { useState, useRef } from 'react';
import { Play, Eye, Share2, Settings, Users, MessageCircle, Heart, Trophy, Upload, Image as ImageIcon, Link, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  thumbnail?: string | File;
}

interface WorldCupPreviewProps {
  data: WorldCupData;
}

export default function WorldCupPreview({ data }: WorldCupPreviewProps) {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMatchItems, setCurrentMatchItems] = useState<[WorldCupItem, WorldCupItem] | null>(null);
  const [thumbnail, setThumbnail] = useState<string | File | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    }
  };

  const generateAutoThumbnail = async () => {
    if (data.items.length < 2) return;
    
    setIsGeneratingThumbnail(true);
    
    try {
      // Create canvas for combining two random images
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Canvas context not available');
        return;
      }
      
      canvas.width = 400;
      canvas.height = 400;
      
      // Fill black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 400, 400);
      
      // Get two random items
      const shuffled = [...data.items].sort(() => Math.random() - 0.5);
      const [item1, item2] = shuffled.slice(0, 2);
      
      console.log('Generating thumbnail with items:', item1.title, item2.title);
      
      // Helper function to load image
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = (e) => {
            console.error('Image load error for:', src, e);
            reject(e);
          };
          img.src = src;
        });
      };
      
      try {
        // Load both images
        const [img1, img2] = await Promise.all([
          loadImage(getImageUrl(item1.image)),
          loadImage(getImageUrl(item2.image))
        ]);
        
        // Draw first image (left half)
        ctx.drawImage(img1, 0, 0, 200, 400);
        
        // Draw second image (right half)
        ctx.drawImage(img2, 200, 0, 200, 400);
        
        // Add subtle dividing line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(200, 0);
        ctx.lineTo(200, 400);
        ctx.stroke();
        
        // Convert to blob and set as thumbnail
        canvas.toBlob((blob) => {
          if (blob) {
            console.log('Thumbnail generated successfully');
            setThumbnail(blob);
          } else {
            console.error('Failed to create blob from canvas');
          }
        }, 'image/jpeg', 0.8);
        
      } catch (imageError) {
        console.error('Error loading images:', imageError);
        // Create a simple fallback thumbnail with text
        ctx.fillStyle = '#1F2937';
        ctx.fillRect(0, 0, 400, 400);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item1.title, 100, 180);
        ctx.fillText('VS', 200, 220);
        ctx.fillText(item2.title, 300, 260);
        
        canvas.toBlob((blob) => {
          if (blob) {
            setThumbnail(blob);
          }
        }, 'image/jpeg', 0.8);
      }
      
    } catch (error) {
      console.error('Error generating thumbnail:', error);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };
  
  const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File selected:', file);
    if (file && file.type.startsWith('image/')) {
      console.log('Setting thumbnail to file:', file.name);
      setThumbnail(file);
    } else {
      console.log('Invalid file type or no file selected');
    }
  };
  
  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      console.log('Setting thumbnail to URL:', urlInput.trim());
      setThumbnail(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };
  
  const handleCreateWorldCup = () => {
    // TODO: Actually create the worldcup with thumbnail
    const finalData = { ...data, thumbnail };
    console.log('Creating worldcup:', finalData);
    // For now, just navigate to a mock play page
    router.push('/play/new-worldcup');
  };

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
              {/* Card Header */}
              <div className="relative aspect-video overflow-hidden">
                {thumbnail ? (
                  <>
                    <img
                      src={getImageUrl(thumbnail)}
                      alt="썸네일"
                      className="w-full h-full object-cover"
                      onError={() => {
                        console.error('Thumbnail image failed to load:', getImageUrl(thumbnail));
                      }}
                      onLoad={() => {
                        console.log('Thumbnail image loaded successfully:', getImageUrl(thumbnail));
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center p-6">
                        <div className="text-white text-2xl font-bold mb-2 drop-shadow-lg">
                          {data.title}
                        </div>
                        {data.description && (
                          <div className="text-white text-base drop-shadow-lg">
                            {data.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-black flex items-center justify-center h-full min-h-[300px] relative">
                    <div className="text-center p-6">
                      {/* URL Input Mode */}
                      {showUrlInput ? (
                        <div className="space-y-4">
                          <div className="text-white text-lg font-medium mb-4">
                            썸네일 URL 입력
                          </div>
                          <div className="flex gap-2 max-w-md mx-auto">
                            <input
                              type="url"
                              value={urlInput}
                              onChange={(e) => setUrlInput(e.target.value)}
                              placeholder="https://example.com/image.jpg"
                              className="flex-1 px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                              autoFocus
                            />
                            <button
                              onClick={handleUrlSubmit}
                              disabled={!urlInput.trim()}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                              추가
                            </button>
                            <button
                              onClick={() => {
                                setShowUrlInput(false);
                                setUrlInput('');
                              }}
                              className="p-2 text-gray-400 hover:text-white transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="text-white text-lg font-medium">
                            썸네일 이미지 업로드
                          </div>
                          <div className="flex flex-col space-y-3">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
                            >
                              <Upload className="w-5 h-5" />
                              파일에서 업로드
                            </button>
                            <button
                              onClick={() => setShowUrlInput(true)}
                              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                            >
                              <Link className="w-5 h-5" />
                              URL로 추가
                            </button>
                            <button
                              onClick={generateAutoThumbnail}
                              disabled={isGeneratingThumbnail || data.items.length < 2}
                              className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
                            >
                              <ImageIcon className="w-5 h-5" />
                              {isGeneratingThumbnail ? '생성중...' : '자동 생성'}
                            </button>
                          </div>
                          {data.items.length < 2 && (
                            <p className="text-amber-400 text-sm mt-4">
                              ⚠️ 자동 생성을 위해서는 최소 2개의 이미지가 필요합니다
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {thumbnail && (
                  <>
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <button
                        onClick={startPreview}
                        className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-4 transform hover:scale-105"
                      >
                        <Play className="w-8 h-8 ml-1" />
                      </button>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button
                        onClick={() => {
                          console.log('Edit: File upload clicked');
                          fileInputRef.current?.click();
                        }}
                        className="p-2 bg-white shadow-lg rounded-full hover:bg-gray-50 transition-all transform hover:scale-105 active:scale-95"
                        title="새 이미지 업로드"
                      >
                        <Upload className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => {
                          console.log('Edit: Remove thumbnail clicked');
                          setThumbnail(null);
                        }}
                        className="p-2 bg-red-500 shadow-lg rounded-full hover:bg-red-600 transition-all transform hover:scale-105 active:scale-95"
                        title="썸네일 제거"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </>
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
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 rounded-lg p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">미리보기 모드</h3>
              <p className="text-gray-300">실제 게임과 동일한 방식으로 작동합니다</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {currentMatchItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleChoice(item)}
                  className="group relative aspect-square bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-bold text-center">{item.title}</h3>
                  </div>
                  <div className="absolute inset-0 border-4 border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                </button>
              ))}
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => setIsPlaying(false)}
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleThumbnailUpload}
        className="hidden"
      />
      
      {/* Final Action */}
      {!isPlaying && (
        <div className="text-center">
          <button
            onClick={handleCreateWorldCup}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-lg transition-colors"
          >
            🎉 월드컵 만들기 완료
          </button>
          <p className="text-sm text-gray-500 mt-2">
            월드컵이 생성되고 다른 사용자들과 공유할 수 있습니다
          </p>
          {!thumbnail && (
            <p className="text-xs text-amber-600 mt-1">
              💡 썸네일을 설정하면 더 매력적인 월드컵을 만들 수 있습니다
            </p>
          )}
        </div>
      )}
    </div>
  );
}