'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { ThemeWrapperProps } from './types';

export default function GamingTheme({
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-3xl p-8 relative overflow-hidden">
          
          <div className="relative z-10">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={onGoHome}
                className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors font-bold bg-gradient-to-r from-red-500 to-purple-500 px-4 py-2 rounded-xl border-2 border-purple-500 shadow-lg shadow-purple-500/25"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>BACK</span>
              </button>
              <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                TOURNAMENT CONFIG
              </h1>
              <div className="w-20"></div>
            </div>

            {/* 월드컵 정보 */}
            <div className="text-center mb-8">
              <div className="inline-block bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border-2 border-purple-500 shadow-lg shadow-purple-500/25 mb-6 animate-pulse">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {worldcupData.title}
                </h2>
                {worldcupData.description && (
                  <p className="text-gray-300 text-lg mb-4">
                    {worldcupData.description}
                  </p>
                )}
                <div className="text-sm text-gray-400 bg-purple-900/50 inline-block px-4 py-2 rounded-full border border-purple-400">
                  {worldcupData.items?.length || 0} PLAYERS •
                </div>
              </div>
            </div>

            {/* 토너먼트 선택 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-center mb-6">
                <span className="bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  원하는 토너먼트 규모를 선택하세요
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {tournamentOptions.map((option, index) => (
                  <div
                    key={option.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      isClient && selectedTournament === option.id ? 'scale-105' : 'hover:scale-102'
                    }`}
                    onClick={() => setSelectedTournament(option.id)}
                  >
                    <div className={`relative p-6 rounded-xl border-2 bg-gray-800/50 backdrop-blur-sm transition-all duration-300 min-h-[200px] flex flex-col ${
                      isClient && selectedTournament === option.id
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/25 animate-pulse'
                        : 'border-purple-500 hover:border-blue-500 animate-pulse'
                    }`}>
                      
                      {/* 아이콘 */}
                      <div className={`flex justify-center mb-4 ${
                        isClient && selectedTournament === option.id ? 'text-blue-400' : 'text-white'
                      }`}>
                        {option.icon}
                      </div>
                      
                      <div className="text-center flex-1 flex flex-col justify-center">
                        <div className={`text-xl font-bold mb-2 ${
                          isClient && selectedTournament === option.id 
                            ? 'text-blue-400' 
                            : 'text-white'
                        }`}>
                          {option.name}
                        </div>
                        <div className="text-sm text-gray-300 mb-1 bg-red-900/50 inline-block px-2 py-1 rounded border border-red-400">
                          {option.choices} CHOICES
                        </div>
                        <div className="text-xs text-gray-500 mb-2">{option.description}</div>
                        <div className="text-xs font-medium text-green-400 bg-green-900/50 inline-block px-2 py-1 rounded border border-green-400">
                          {option.duration}
                        </div>
                      </div>
                      
                      {isClient && selectedTournament === option.id && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                          ◆
                        </div>
                      )}
                      
                      {/* RGB 테두리 효과 */}
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-blue-500/20 to-purple-500/20 animate-pulse rounded-xl -z-10"></div>
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
                className={`px-12 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 relative overflow-hidden ${
                  isStarting
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : selectedTournament
                    ? 'bg-gradient-to-r from-red-500 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {selectedTournament && !isStarting && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-blue-500/20 to-purple-500/20 animate-pulse"></div>
                )}
                
                <div className="relative z-10">
                  {isStarting ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>LOADING GAME...</span>
                    </div>
                  ) : selectedTournament ? (
                    <div className="flex items-center gap-3">
                      <Play className="w-5 h-5" />
                      <span>START GAME</span>
                    </div>
                  ) : (
                    <span>SELECT TOURNAMENT</span>
                  )}
                </div>
              </button>
            </div>
          </div>
          
          {/* 배경 효과 */}
          <div className="absolute top-10 left-10 text-6xl text-red-500/20 animate-pulse">
            ⚡
          </div>
          <div className="absolute top-20 right-20 text-5xl text-blue-500/20 animate-pulse">
            🎮
          </div>
          <div className="absolute bottom-20 left-20 text-4xl text-green-500/20 animate-pulse">
            🔥
          </div>
          <div className="absolute bottom-10 right-10 text-6xl text-purple-500/20 animate-pulse">
            ⭐
          </div>
          
          {/* RGB 글로우 효과 */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-blue-500/5 to-purple-500/5 animate-pulse rounded-3xl -z-10"></div>
        </div>
      </div>
    </div>
  );
}