'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { ThemeWrapperProps } from './types';

export default function MinimalTheme({
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
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-white rounded-3xl relative overflow-hidden border border-gray-100">
          
          <div className="relative z-10">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-12 px-8 pt-8">
              <button
                onClick={onGoHome}
                className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 transition-colors font-light"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>돌아가기</span>
              </button>
              <h1 className="text-2xl font-light text-gray-900 tracking-wide">토너먼트 설정</h1>
              <div className="w-20"></div>
            </div>

            {/* 월드컵 정보 */}
            <div className="text-center mb-16 px-8">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-4xl font-light text-gray-900 mb-6 tracking-tight">
                  {worldcupData.title}
                </h2>
                {worldcupData.description && (
                  <p className="text-gray-500 text-lg mb-8 leading-relaxed font-light">
                    {worldcupData.description}
                  </p>
                )}
                <div className="flex items-center justify-center space-x-8 text-sm text-gray-400 font-light">
                  <span>{worldcupData.items?.length || 0}개 항목 •</span>
                </div>
              </div>
            </div>

            {/* 토너먼트 선택 */}
            <div className="mb-16 px-8">
              <h3 className="text-xl font-light text-gray-900 mb-12 text-center tracking-wide">
                원하는 토너먼트 규모를 선택하세요
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {tournamentOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      isClient && selectedTournament === option.id ? 'scale-105' : 'hover:scale-102'
                    }`}
                    onClick={() => setSelectedTournament(option.id)}
                  >
                    <div className={`relative p-8 rounded-lg border transition-all duration-300 ${
                      isClient && selectedTournament === option.id
                        ? 'border-gray-400 bg-gray-100 shadow-2xl'
                        : 'border-gray-200 bg-white shadow-xl hover:shadow-2xl hover:border-gray-300'
                    }`}>
                      
                      {/* 아이콘 */}
                      <div className={`flex justify-center mb-4 ${
                        isClient && selectedTournament === option.id ? 'text-gray-700' : 'text-gray-600'
                      }`}>
                        {option.icon}
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-2xl font-light mb-4 ${
                          isClient && selectedTournament === option.id ? 'text-gray-900' : 'text-gray-900'
                        }`}>
                          {option.name}
                        </div>
                        <div className="space-y-2 text-sm text-gray-500 font-light">
                          <div>{option.choices} CHOICES</div>
                          <div className="text-xs text-gray-400 mt-3">{option.description}</div>
                          <div className="text-gray-700">{option.duration}</div>
                        </div>
                      </div>
                      
                      {isClient && selectedTournament === option.id && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 시작 버튼 */}
            <div className="text-center pb-12 px-8">
              <button 
                disabled={!selectedTournament || isStarting}
                onClick={onStartTournament}
                className={`px-16 py-4 rounded-lg font-light text-lg transition-all duration-300 hover:scale-105 shadow-xl ${
                  isStarting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : selectedTournament
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isStarting ? (
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>준비 중</span>
                  </div>
                ) : selectedTournament ? (
                  <div className="flex items-center gap-4">
                    <Play className="w-4 h-4" />
                    <span>게임 시작</span>
                  </div>
                ) : (
                  <span>토너먼트를 선택해주세요</span>
                )}
              </button>
            </div>
          </div>
          
          {/* 미니멀한 배경 요소 */}
          <div className="absolute top-1/4 left-8 w-1 h-32 bg-gray-100"></div>
          <div className="absolute bottom-1/4 right-8 w-1 h-24 bg-gray-100"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-200 rounded-full opacity-30"></div>
        </div>
      </div>
    </div>
  );
}