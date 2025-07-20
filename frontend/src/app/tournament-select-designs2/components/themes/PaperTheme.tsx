'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { ThemeWrapperProps } from './types';

export default function PaperTheme({
  worldcupData,
  tournamentOptions,
  selectedTournament,
  setSelectedTournament,
  onStartTournament,
  isStarting,
  onGoHome
}: ThemeWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="min-h-screen bg-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-amber-50 rounded-3xl p-8 relative overflow-hidden border-2 border-dashed border-amber-200">
          
          <div className="relative z-10">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={onGoHome}
                className="flex items-center space-x-2 text-amber-800 hover:text-amber-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>홈으로 돌아가기</span>
              </button>
              <h1 className="text-2xl font-bold text-amber-900 transform -rotate-1">토너먼트 설정</h1>
              <div className="w-20"></div>
            </div>

            {/* 월드컵 정보 */}
            <div className="text-center mb-8">
              <div className="inline-block bg-white rounded-lg p-6 border-2 border-dashed border-amber-600 transform rotate-1 shadow-lg shadow-amber-200 mb-6">
                <h2 className="text-3xl font-bold text-amber-900 mb-2 transform -rotate-1">
                  {worldcupData.title}
                </h2>
                {worldcupData.description && (
                  <p className="text-amber-700 text-lg mb-4">
                    {worldcupData.description}
                  </p>
                )}
                <div className="text-sm text-amber-600">
                  {worldcupData.items?.length || 0}개의 선택지 •
                </div>
              </div>
              
              {/* 종이 테이프 효과 */}
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-amber-300 opacity-60 transform rotate-12"></div>
            </div>

            {/* 토너먼트 선택 */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-amber-900 mb-6 text-center transform -rotate-1">
                원하는 토너먼트 규모를 선택하세요
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {tournamentOptions.map((option, index) => (
                  <div
                    key={option.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      isClient && selectedTournament === option.id ? 'scale-105 -rotate-2' : 'hover:scale-102 hover:-rotate-1'
                    }`}
                    onClick={() => setSelectedTournament(option.id)}
                  >
                    <div className={`relative p-6 rounded-lg border-2 border-dashed transition-all duration-300 transform ${
                      index % 2 === 0 ? 'rotate-1' : '-rotate-1'
                    } ${
                      isClient && selectedTournament === option.id
                        ? 'border-orange-500 bg-orange-100 shadow-lg shadow-orange-200'
                        : 'border-amber-600 bg-white shadow-md hover:shadow-lg'
                    }`}>
                      
                      {/* 아이콘 */}
                      <div className={`flex justify-center mb-4 ${
                        isClient && selectedTournament === option.id ? 'text-orange-600' : 'text-amber-700'
                      }`}>
                        {option.icon}
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-xl font-bold mb-2 ${
                          isClient && selectedTournament === option.id ? 'text-orange-800' : 'text-amber-900'
                        }`}>
                          {option.name}
                        </div>
                        <div className="text-sm text-amber-700 mb-1">{option.choices} CHOICES</div>
                        <div className="text-xs text-amber-600 mb-2">{option.description}</div>
                        <div className="text-xs font-medium text-amber-800">{option.duration}</div>
                      </div>
                      
                      {isClient && selectedTournament === option.id && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                      )}
                      
                      {/* 스테이플 효과 */}
                      <div className="absolute -top-1 left-4 w-1 h-4 bg-gray-400 transform rotate-45"></div>
                      <div className="absolute -top-1 right-4 w-1 h-4 bg-gray-400 transform -rotate-45"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 시작 버튼 */}
            <div className="text-center mt-10">
              <button 
                disabled={!selectedTournament || isStarting}
                onClick={onStartTournament}
                className={`px-12 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:rotate-1 shadow-lg shadow-amber-200 ${
                  isStarting
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : selectedTournament
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isStarting ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>토너먼트 준비 중...</span>
                  </div>
                ) : selectedTournament ? (
                  <div className="flex items-center gap-3">
                    <Play className="w-5 h-5" />
                    <span>토너먼트 시작하기!</span>
                  </div>
                ) : (
                  <span>토너먼트를 먼저 선택해주세요</span>
                )}
              </button>
            </div>
          </div>
          
          {/* 배경 장식 */}
          <div className="absolute top-10 left-10 text-6xl text-amber-200 transform rotate-12 opacity-30">
            📝
          </div>
          <div className="absolute bottom-10 right-10 text-4xl text-amber-300 transform -rotate-12 opacity-40">
            ✂️
          </div>
          
          {/* 종이 찢어진 효과 */}
          <div className="absolute bottom-0 left-0 w-full h-8 bg-amber-100 opacity-50" style={{
            clipPath: 'polygon(0% 50%, 5% 0%, 10% 100%, 15% 30%, 20% 80%, 25% 20%, 30% 90%, 35% 40%, 40% 70%, 45% 10%, 50% 60%, 55% 30%, 60% 90%, 65% 20%, 70% 80%, 75% 40%, 80% 70%, 85% 10%, 90% 90%, 95% 30%, 100% 80%, 100% 100%, 0% 100%)'
          }}></div>
        </div>
      </div>
    </div>
  );
}