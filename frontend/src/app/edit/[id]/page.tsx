'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Image, Settings, Play } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import DragDropUpload from '@/components/DragDropUpload';
import WorldCupPreview from '@/components/WorldCupPreview';
import TournamentSettings from '@/components/TournamentSettings';
import TournamentCreationCelebration from '@/components/TournamentCreationCelebration';
import ProtectedRoute from '@/components/ProtectedRoute';

// Dynamic import for heavy components
const ImageCropper = dynamic(() => import('@/components/ImageCropper'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      <span className="ml-3">이미지 편집기 로딩 중...</span>
    </div>
  ),
});
import { getWorldCupById } from '@/utils/storage';
import { getWorldCupById as getSupabaseWorldCupById } from '@/utils/supabaseData';
import { generateAutoThumbnail } from '@/utils/thumbnailGenerator';
import { saveWorldCupToSupabase, updateWorldCupInSupabase } from '@/utils/supabaseWorldCup';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/utils/auth';

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

function EditPageContent() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPreviewGameActive, setIsPreviewGameActive] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [worldCupData, setWorldCupData] = useState<WorldCupData>({
    title: '',
    description: '',
    category: 'entertainment',
    items: [],
    isPublic: true,
    thumbnail: undefined,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const worldcupId = params?.id as string;

  // 월드컵 데이터 로드 (Supabase 우선, localStorage 대체)
  useEffect(() => {
    const loadWorldCupData = async () => {
      if (!worldcupId || !user) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 Loading worldcup for editing:', worldcupId);
        
        // 1. Supabase에서 월드컵 데이터 가져오기 시도
        let existingWorldCup = await getSupabaseWorldCupById(worldcupId);
        let isFromSupabase = true;
        
        // 2. Supabase에서 못 찾으면 localStorage에서 시도
        if (!existingWorldCup) {
          console.log('📱 Trying localStorage...');
          existingWorldCup = getWorldCupById(worldcupId);
          isFromSupabase = false;
        }
        
        if (!existingWorldCup) {
          setError('월드컵을 찾을 수 없습니다.');
          return;
        }

        console.log('✅ Found worldcup:', {
          title: existingWorldCup.title,
          author: existingWorldCup.author,
          source: isFromSupabase ? 'Supabase' : 'localStorage'
        });

        // 3. 권한 확인 (본인이 만든 것이거나 관리자인지)
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        // Supabase 데이터인 경우 author_id로 확인, localStorage인 경우 username으로 확인
        let hasPermission = false;
        if (isFromSupabase && authUser) {
          // Supabase 월드컵의 경우 현재 로그인된 사용자 ID와 비교
          const { data: worldcupDetail } = await supabase
            .from('worldcups')
            .select('author_id')
            .eq('id', worldcupId)
            .single();
          
          hasPermission = worldcupDetail?.author_id === authUser.id || isAdmin(user);
        } else {
          // localStorage 월드컵의 경우 username으로 비교
          hasPermission = existingWorldCup.author === user.username || isAdmin(user);
        }

        if (!hasPermission) {
          setError('이 월드컵을 수정할 권한이 없습니다.');
          return;
        }

        // 4. 기존 데이터를 편집 가능한 형태로 변환
        setWorldCupData({
          title: existingWorldCup.title,
          description: existingWorldCup.description || '',
          category: existingWorldCup.category || 'entertainment',
          items: existingWorldCup.items.map(item => ({
            id: item.id,
            title: item.title,
            image: item.image || '', // 이미지 URL 또는 base64
            description: item.description || '',
          })),
          isPublic: existingWorldCup.isPublic !== false,
          thumbnail: existingWorldCup.thumbnail,
        });

        setIsLoading(false);
        
      } catch (error) {
        console.error('❌ Failed to load worldcup:', error);
        setError('월드컵 데이터를 불러오는 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    loadWorldCupData();
  }, [worldcupId, user]);

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
      router.push('/my'); // 마이 페이지로 돌아가기
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleItemsUpload = (items: WorldCupItem[]) => {
    setWorldCupData(prev => ({
      ...prev,
      items: [...prev.items, ...items]
    }));
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
    setWorldCupData(prev => ({
      ...prev,
      thumbnail: thumbnail
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return worldCupData.title.trim() !== '';
      case 2:
        return worldCupData.items.length >= 4;
      case 3:
        return true;
      case 4:
        return worldCupData.items.length >= 4;
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
          <DragDropUpload
            items={worldCupData.items}
            onItemsUpload={handleItemsUpload}
            onItemDelete={handleItemDelete}
            thumbnail={worldCupData.thumbnail}
            onThumbnailUpload={handleThumbnailUpload}
          />
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

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">월드컵 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/my')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            마이 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                  월드컵 수정
                </h1>
                <p className="text-gray-600">
                  {worldCupData.title || '월드컵을 수정해보세요'}
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
              className="flex items-center space-x-2 px-6 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{currentStep === 1 ? '마이페이지로' : isPreviewGameActive ? '미리보기 종료' : '이전'}</span>
            </button>
            <div className="flex space-x-3">
              {currentStep < steps.length ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`flex items-center space-x-2 px-8 py-2 rounded-lg font-medium transition-all duration-200 border ${
                    canProceed()
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200'
                  }`}
                >
                  <span>다음</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      console.log('💾 Starting worldcup update...');
                      
                      // 월드컵 수정 완료 로직
                      const finalWorldCupData = { ...worldCupData };
                      
                      // 썸네일이 설정되지 않았거나 삭제되었을 때 자동 생성
                      if ((!worldCupData.thumbnail || worldCupData.thumbnail === null || worldCupData.thumbnail === '') && worldCupData.items.length >= 2) {
                        try {
                          console.log('🎨 Generating auto thumbnail (thumbnail was deleted or empty)...');
                          const autoThumbnail = await generateAutoThumbnail(worldCupData.items);
                          if (autoThumbnail) {
                            finalWorldCupData.thumbnail = autoThumbnail;
                            console.log('✅ Auto thumbnail generated successfully');
                          }
                        } catch (error) {
                          console.warn('⚠️ 자동 썸네일 생성 실패:', error);
                        }
                      }
                      
                      // 1. Supabase에서 업데이트 시도
                      const { data: { user: authUser } } = await supabase.auth.getUser();
                      let supabaseUpdateSuccess = false;
                      
                      if (authUser) {
                        try {
                          console.log('📡 Checking if worldcup exists in Supabase...');
                          
                          // Supabase에 해당 월드컵이 있는지 확인
                          const { data: existingSupabaseWorldCup } = await supabase
                            .from('worldcups')
                            .select('id, author_id')
                            .eq('id', worldcupId)
                            .single();

                          if (existingSupabaseWorldCup && existingSupabaseWorldCup.author_id === authUser.id) {
                            console.log('🔄 Updating existing Supabase worldcup with full update...');
                            
                            // 완전한 업데이트 (이미지 포함)
                            const updateResult = await updateWorldCupInSupabase(worldcupId, finalWorldCupData);
                            
                            if (updateResult.success) {
                              console.log('✅ Supabase worldcup fully updated');
                              supabaseUpdateSuccess = true;
                            } else {
                              console.error('❌ Supabase full update failed:', updateResult.error);
                            }
                          } else {
                            console.log('📱 Worldcup not in Supabase or no permission, trying to create new...');
                            
                            // Supabase에 새로 저장 (localStorage에서 마이그레이션)
                            const saveResult = await saveWorldCupToSupabase({
                              ...finalWorldCupData,
                              id: worldcupId // 기존 ID 유지
                            });
                            
                            if (saveResult.success) {
                              console.log('✅ Successfully migrated to Supabase');
                              supabaseUpdateSuccess = true;
                            }
                          }
                          
                        } catch (error) {
                          console.error('❌ Supabase update/create failed:', error);
                        }
                      }

                      // 2. localStorage 업데이트 (Supabase 실패시 또는 백업용)
                      try {
                        const existingWorldCup = getWorldCupById(worldcupId);
                        if (existingWorldCup) {
                          const updatedWorldCup = {
                            ...existingWorldCup,
                            title: finalWorldCupData.title,
                            description: finalWorldCupData.description,
                            category: finalWorldCupData.category,
                            items: finalWorldCupData.items.map(item => ({
                              id: item.id,
                              title: item.title,
                              image: typeof item.image === 'string' ? item.image : '',
                              description: item.description,
                            })),
                            isPublic: finalWorldCupData.isPublic,
                            thumbnail: typeof finalWorldCupData.thumbnail === 'string' ? finalWorldCupData.thumbnail : '',
                            updatedAt: new Date().toISOString()
                          };

                          // localStorage에서 기존 데이터 삭제 후 새로 저장
                          const allWorldCups = JSON.parse(localStorage.getItem('worldcups') || '[]');
                          const filteredWorldCups = allWorldCups.filter((wc: { id: string }) => wc.id !== worldcupId);
                          filteredWorldCups.push(updatedWorldCup);
                          localStorage.setItem('worldcups', JSON.stringify(filteredWorldCups));
                          
                          console.log('✅ localStorage updated');
                        }
                      } catch (error) {
                        console.warn('⚠️ localStorage update failed:', error);
                      }
                      
                      if (supabaseUpdateSuccess) {
                        console.log('🎉 Worldcup update completed successfully!');
                      } else {
                        console.log('📱 Worldcup updated in localStorage only');
                      }
                      
                      // 축하 모달 표시
                      setShowCelebration(true);
                    } catch (error) {
                      console.error('❌ Failed to update worldcup:', error);
                      alert('월드컵 수정 중 오류가 발생했습니다. 다시 시도해주세요.');
                    }
                  }}
                  disabled={!canProceed()}
                  className={`flex items-center space-x-2 px-8 py-2 rounded-lg font-medium transition-all duration-200 border ${
                    canProceed()
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-emerald-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200'
                  }`}
                >
                  <span>수정 완료</span>
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 축하 모달 */}
      <TournamentCreationCelebration
        isVisible={showCelebration}
        worldCupData={worldCupData}
        onComplete={() => {
          setShowCelebration(false);
          router.push('/my');
        }}
      />
    </div>
  );
}

export default function EditPage() {
  return (
    <ProtectedRoute>
      <EditPageContent />
    </ProtectedRoute>
  );
}