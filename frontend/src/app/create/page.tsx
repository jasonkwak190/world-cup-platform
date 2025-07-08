'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Image, Settings, Play, Youtube, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import DragDropUpload from '@/components/DragDropUpload';
import BulkYouTubeUpload from '@/components/forms/BulkYouTubeUpload';
import WorldCupPreview from '@/components/WorldCupPreview';
import TournamentSettings from '@/components/TournamentSettings';
import AuthModal from '@/components/AuthModal';

// Dynamic imports for heavy components
const ImageCropper = dynamic(() => import('@/components/ImageCropper'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      <span className="ml-3">이미지 편집기 로딩 중...</span>
    </div>
  ),
});
// saveWorldCup imported but not used - using Supabase primarily
import { saveWorldCupToSupabase } from '@/utils/supabaseWorldCup';
import { getUserWorldCups } from '@/utils/supabaseData';
import { supabase } from '@/lib/supabase';
import type { WorldCupMediaItem } from '@/types/media';

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
  videoItems: WorldCupMediaItem[];
  isPublic: boolean;
  thumbnail?: string | File;
}

export default function CreatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPreviewGameActive, setIsPreviewGameActive] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  const [creationStatus, setCreationStatus] = useState('');
  const [activeMediaTab, setActiveMediaTab] = useState<'images' | 'videos'>('images');
  const [worldCupData, setWorldCupData] = useState<WorldCupData>({
    title: '',
    description: '',
    category: 'entertainment',
    items: [],
    videoItems: [],
    isPublic: true,
    thumbnail: undefined,
  });

  // 인증 상태 및 월드컵 개수 제한 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Auth check error:', error);
          setIsAuthenticated(false);
          setShowAuthModal(true);
          return;
        }
        
        setIsAuthenticated(!!user);
        if (!user) {
          setShowAuthModal(true);
          return;
        }

        // 사용자 월드컵 개수 확인
        try {
          const userWorldCups = await getUserWorldCups(user.id);
          if (userWorldCups.length >= 10) {
            alert('최대 10개까지만 월드컵을 만들 수 있습니다.\n마이페이지에서 기존 월드컵을 삭제한 후 새로 만들어주세요.');
            router.push('/my');
            return;
          }
        } catch (error) {
          console.error('Failed to check user worldcup count:', error);
        }
        
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setShowAuthModal(true);
      }
    };

    checkAuth();

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, !!session?.user);
        setIsAuthenticated(!!session?.user);
        
        if (event === 'SIGNED_IN') {
          setShowAuthModal(false);
        } else if (event === 'SIGNED_OUT') {
          setShowAuthModal(true);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const steps = [
    { id: 1, title: '기본 정보', icon: Settings },
    { id: 2, title: '콘텐츠 업로드', icon: Upload },
    { id: 3, title: '이미지 편집', icon: Image },
    { id: 4, title: '미리보기', icon: Play },
  ];

  const handleBack = () => {
    // 미리보기 게임이 활성화된 상태면 게임만 종료
    if (isPreviewGameActive) {
      setIsPreviewGameActive(false);
      return;
    }
    
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push('/');
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleItemsUpload = (items: WorldCupItem[]) => {
    console.log('handleItemsUpload called with items:', items);
    items.forEach((item, index) => {
      console.log(`Uploading item ${index}:`, {
        id: item.id,
        title: item.title,
        imageType: typeof item.image,
        image: item.image instanceof File ? `File: ${item.image.name}` : item.image
      });
    });
    
    setWorldCupData(prev => {
      // 중복 ID 방지: 기존 항목과 ID가 겹치지 않는지 확인
      const existingIds = new Set(prev.items.map(item => item.id));
      const filteredItems = items.filter(item => {
        if (existingIds.has(item.id)) {
          console.warn(`Duplicate item ID detected: ${item.id}, skipping...`);
          return false;
        }
        return true;
      });
      
      if (filteredItems.length !== items.length) {
        alert(`${items.length - filteredItems.length}개의 중복된 항목이 제외되었습니다.`);
      }
      
      const newData = {
        ...prev,
        items: [...prev.items, ...filteredItems]
      };
      console.log('Updated worldCupData items:', newData.items);
      return newData;
    });
  };

  const handleItemUpdate = (itemId: string, updates: Partial<WorldCupItem>) => {
    setWorldCupData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
  };

  const handleItemDelete = (itemId: string) => {
    setWorldCupData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const handleThumbnailUpload = (thumbnail: string | File) => {
    console.log('=== handleThumbnailUpload Debug ===');
    console.log('Called with:', thumbnail);
    console.log('Type:', typeof thumbnail);
    if (thumbnail instanceof File) {
      console.log('File details:', {
        name: thumbnail.name,
        size: thumbnail.size,
        type: thumbnail.type
      });
    } else if (typeof thumbnail === 'string') {
      console.log('String details:', {
        length: thumbnail.length,
        startsWithData: thumbnail.startsWith('data:'),
        preview: thumbnail.substring(0, 100) + '...'
      });
    }
    
    setWorldCupData(prev => {
      const newData = {
        ...prev,
        thumbnail: thumbnail
      };
      console.log('WorldCupData updated successfully');
      console.log('Previous thumbnail:', prev.thumbnail);
      console.log('New thumbnail set:', thumbnail === newData.thumbnail);
      console.log('=== End handleThumbnailUpload Debug ===');
      return newData;
    });
  };

  // 동영상 아이템 처리 함수
  const handleVideosProcessed = (videos: WorldCupMediaItem[]) => {
    console.log('handleVideosProcessed called with videos:', videos);
    setWorldCupData(prev => {
      const newData = {
        ...prev,
        videoItems: [...prev.videoItems, ...videos]
      };
      console.log('Updated worldCupData videoItems:', newData.videoItems);
      return newData;
    });
  };

  const handleVideoItemDelete = (itemId: string) => {
    setWorldCupData(prev => ({
      ...prev,
      videoItems: prev.videoItems.filter(item => item.id !== itemId)
    }));
  };

  const canProceed = () => {
    const totalItems = worldCupData.items.length + worldCupData.videoItems.length;
    
    switch (currentStep) {
      case 1:
        return worldCupData.title.trim() !== '';
      case 2:
        return totalItems >= 4;
      case 3:
        return true;
      case 4:
        return totalItems >= 4;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <TournamentSettings
            data={worldCupData}
            onChange={setWorldCupData}
          />
        );
      case 2:
        return (
          <div className="space-y-6">
            {/* 미디어 타입 탭 */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveMediaTab('images')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeMediaTab === 'images'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Image className="w-5 h-5" />
                    <span>이미지 ({worldCupData.items.length}개)</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveMediaTab('videos')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeMediaTab === 'videos'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Youtube className="w-5 h-5" />
                    <span>YouTube 동영상 ({worldCupData.videoItems.length}개)</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* 전체 아이템 수 표시 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-800 font-medium">
                    총 {worldCupData.items.length + worldCupData.videoItems.length}개 아이템
                  </span>
                </div>
                <div className="text-sm text-blue-700">
                  {worldCupData.items.length + worldCupData.videoItems.length >= 4 
                    ? '✅ 최소 조건 충족' 
                    : `⚠️ ${4 - (worldCupData.items.length + worldCupData.videoItems.length)}개 더 필요`
                  }
                </div>
              </div>
              <div className="mt-2 text-xs text-blue-600">
                이미지 {worldCupData.items.length}개 + 동영상 {worldCupData.videoItems.length}개 = 
                총 {worldCupData.items.length + worldCupData.videoItems.length}개 (최소 4개 필요)
              </div>
            </div>

            {/* 탭 내용 */}
            {activeMediaTab === 'images' ? (
              <DragDropUpload
                items={worldCupData.items}
                onItemsUpload={handleItemsUpload}
                onItemDelete={handleItemDelete}
                thumbnail={worldCupData.thumbnail}
                onThumbnailUpload={handleThumbnailUpload}
              />
            ) : (
              <div className="space-y-6">
                <BulkYouTubeUpload
                  onVideosProcessed={handleVideosProcessed}
                  maxVideos={64}
                />
                
                {/* 추가된 동영상 목록 */}
                {worldCupData.videoItems.length > 0 && (
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      🎥 추가된 동영상 ({worldCupData.videoItems.length}개)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {worldCupData.videoItems.map((video) => (
                        <div key={video.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <img
                            src={video.videoThumbnail}
                            alt={video.title}
                            className="w-20 h-15 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{video.title}</h4>
                            <p className="text-sm text-gray-500">
                              {video.videoMetadata?.channelTitle}
                            </p>
                            {video.videoStartTime !== undefined && (
                              <p className="text-xs text-blue-600">
                                {video.videoStartTime}초 ~ {video.videoEndTime || '끝'}초
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleVideoItemDelete(video.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <ImageCropper
            items={worldCupData.items}
            onItemUpdate={handleItemUpdate}
            thumbnail={worldCupData.thumbnail}
            onThumbnailUpdate={handleThumbnailUpload}
          />
        );
      case 4:
        console.log('=== Step 4: WorldCupPreview Debug ===');
        console.log('Full worldCupData:', worldCupData);
        console.log('Thumbnail data:', {
          thumbnail: worldCupData.thumbnail,
          thumbnailType: typeof worldCupData.thumbnail,
          thumbnailSize: worldCupData.thumbnail instanceof File ? worldCupData.thumbnail.size : 'N/A',
          thumbnailName: worldCupData.thumbnail instanceof File ? worldCupData.thumbnail.name : 'N/A',
          isString: typeof worldCupData.thumbnail === 'string',
          stringLength: typeof worldCupData.thumbnail === 'string' ? worldCupData.thumbnail.length : 0,
          startsWithData: typeof worldCupData.thumbnail === 'string' ? worldCupData.thumbnail.startsWith('data:') : false
        });
        console.log('=== End Step 4 Debug ===');
        return (
          <WorldCupPreview
            data={worldCupData}
            onGameStateChange={setIsPreviewGameActive}
          />
        );
      default:
        return null;
    }
  };

  // 인증 확인 중이면 로딩 화면 표시
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">인증 상태를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            router.push('/');
          }}
          title="로그인이 필요합니다"
          subtitle="월드컵을 만들려면 로그인해야 합니다."
        />
      )}

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  월드컵 만들기
                </h1>
                <p className="text-gray-600">
                  나만의 이상형 월드컵을 만들어보세요
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {currentStep} / {steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const isAccessible = currentStep >= step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isActive
                          ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-600'
                          : isAccessible
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`mt-2 text-sm font-medium ${
                        isActive
                          ? 'text-emerald-600'
                          : isAccessible
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-0.5 mx-4 ${
                        isCompleted ? 'bg-emerald-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {renderStepContent()}
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {currentStep === 1 ? '취소' : isPreviewGameActive ? '미리보기 종료' : '이전'}
            </button>
            <div className="flex space-x-3">
              {currentStep < steps.length ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`px-8 py-2 rounded-lg font-medium transition-colors ${
                    canProceed()
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  다음
                </button>
              ) : (
                <button
                  onClick={async () => {
                    // 인증 확인
                    if (!isAuthenticated) {
                      setShowAuthModal(true);
                      return;
                    }

                    try {
                      setIsCreating(true);
                      setCreationProgress(0);
                      setCreationStatus('월드컵 생성을 시작합니다...');
                      
                      // 🚨 DEBUG: Log image types before saving to catch blob URL issues
                      console.log('🔍 DEBUG - Analyzing worldCupData before save:');
                      console.log('Total items:', worldCupData.items.length);
                      worldCupData.items.forEach((item, index) => {
                        console.log(`Item ${index + 1}:`, {
                          id: item.id,
                          title: item.title,
                          imageType: typeof item.image,
                          isFile: item.image instanceof File,
                          isString: typeof item.image === 'string',
                          imageValue: typeof item.image === 'string' ? item.image.substring(0, 100) + '...' : 'File object',
                          startsWithBlob: typeof item.image === 'string' && item.image.startsWith('blob:'),
                          includesLocalhost: typeof item.image === 'string' && item.image.includes('localhost')
                        });
                      });

                      // 월드컵 생성 완료 로직
                      console.log('Creating worldcup:', worldCupData);
                      
                      // Supabase에 저장 (진행률 콜백 포함)
                      const result = await saveWorldCupToSupabase(worldCupData, (progress, status) => {
                        setCreationProgress(progress);
                        setCreationStatus(status);
                      });
                      
                      if (!result.success) {
                        throw new Error(result.error);
                      }
                      
                      setCreationProgress(100);
                      setCreationStatus('월드컵 생성이 완료되었습니다!');
                      
                      // 잠시 완료 메시지 표시 후 자동으로 메인화면 이동
                      setTimeout(() => {
                        setIsCreating(false);
                        router.push('/');
                      }, 1500);
                      
                    } catch (error) {
                      console.error('Failed to create worldcup:', error);
                      setIsCreating(false);
                      setCreationProgress(0);
                      setCreationStatus('');
                      
                      // 인증 오류인 경우 로그인 모달 표시
                      if (error instanceof Error && error.message === '로그인이 필요합니다.') {
                        setShowAuthModal(true);
                        return;
                      }
                      
                      alert('월드컵 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
                    }
                  }}
                  disabled={!canProceed() || isCreating}
                  className={`px-8 py-2 rounded-lg font-medium transition-colors ${
                    canProceed() && !isCreating
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isCreating ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      <span>생성 중...</span>
                    </div>
                  ) : (
                    '월드컵 만들기'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 생성 진행률 모달 */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">월드컵 생성 중</h3>
              <p className="text-gray-600 mb-4">{creationStatus}</p>
              
              {/* 진행률 바 */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${creationProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">{creationProgress}% 완료</p>
              
              <div className="mt-4 text-xs text-gray-400">
                잠시만 기다려주세요. 이미지를 처리하고 있습니다...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}