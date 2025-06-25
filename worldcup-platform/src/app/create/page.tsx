'use client';

import { useState } from 'react';
import { ArrowLeft, Upload, Image, Settings, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DragDropUpload from '@/components/DragDropUpload';
import ImageCropper from '@/components/ImageCropper';
import WorldCupPreview from '@/components/WorldCupPreview';
import TournamentSettings from '@/components/TournamentSettings';

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
}

export default function CreatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [worldCupData, setWorldCupData] = useState<WorldCupData>({
    title: '',
    description: '',
    category: 'entertainment',
    items: [],
    isPublic: true,
  });

  const steps = [
    { id: 1, title: '기본 정보', icon: Settings },
    { id: 2, title: '콘텐츠 업로드', icon: Upload },
    { id: 3, title: '이미지 편집', icon: Image },
    { id: 4, title: '미리보기', icon: Play },
  ];

  const handleBack = () => {
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
      const newData = {
        ...prev,
        items: [...prev.items, ...items]
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
          />
        );
      case 3:
        return (
          <ImageCropper
            items={worldCupData.items}
            onItemUpdate={handleItemUpdate}
          />
        );
      case 4:
        return (
          <WorldCupPreview
            data={worldCupData}
          />
        );
      default:
        return null;
    }
  };

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
              {currentStep === 1 ? '취소' : '이전'}
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
                  onClick={() => {
                    // TODO: Submit form
                    console.log('Creating worldcup:', worldCupData);
                  }}
                  disabled={!canProceed()}
                  className={`px-8 py-2 rounded-lg font-medium transition-colors ${
                    canProceed()
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  월드컵 만들기
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}