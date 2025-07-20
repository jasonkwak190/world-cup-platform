'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { ThemeWrapperProps } from './types';

export default function NeonTheme({
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
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-black rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-blue-900/30"></div>
          
          <div className="relative z-10">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={onGoHome}
                className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>BACK_TO_HOME</span>
              </button>
              <h1 className="text-2xl font-bold text-white font-mono">TOURNAMENT_CONFIG</h1>
              <div className="w-20"></div>
            </div>

            {/* 월드컵 정보 */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-4 bg-gray-800/30 backdrop-blur-sm rounded-2xl px-8 py-4 border border-gray-700 mb-6">
                <div className="text-cyan-400 font-mono text-sm">TARGET</div>
                <div className="text-3xl font-bold text-white font-mono">{worldcupData.title}</div>
                <div className="text-pink-400 font-mono text-sm">LOADED</div>
              </div>
              
              {worldcupData.description && (
                <p className="text-cyan-300 text-lg mb-4 font-mono">
                  {worldcupData.description}
                </p>
              )}
              
              <div className="text-sm text-gray-400 font-mono">
                [{worldcupData.items?.length || 0}_ITEMS] •
              </div>
            </div>

            {/* 토너먼트 선택 */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-6 font-mono text-center">
                &gt;&gt; 원하는 토너먼트 규모를 선택하세요 &lt;&lt;
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {tournamentOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`cursor-pointer transition-all duration-500 ${
                      isClient && selectedTournament === option.id ? 'scale-105' : 'hover:scale-102'
                    }`}
                    onClick={() => setSelectedTournament(option.id)}
                  >
                    <div className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                      isClient && selectedTournament === option.id
                        ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/25'
                        : 'border-cyan-400/30 bg-cyan-400/5 hover:border-cyan-400 hover:bg-cyan-400/10'
                    }`}>
                      
                      {/* 아이콘 */}
                      <div className={`flex justify-center mb-4 ${
                        isClient && selectedTournament === option.id ? 'text-yellow-400' : 'text-cyan-400'
                      }`}>
                        {option.icon}
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-xl font-bold mb-2 font-mono ${
                          isClient && selectedTournament === option.id ? 'text-yellow-400' : 'text-white'
                        }`}>
                          {option.name}
                        </div>
                        <div className="text-sm text-cyan-300 mb-1 font-mono">{option.choices} CHOICES</div>
                        <div className="text-xs text-gray-500 mb-2 font-mono">{option.description}</div>
                        <div className="text-xs font-medium text-pink-300 font-mono">{option.duration}</div>
                      </div>
                      
                      {isClient && selectedTournament === option.id && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center text-xs font-bold font-mono">
                          ⚡
                        </div>
                      )}
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
                className={`px-12 py-4 rounded-full font-semibold text-lg font-mono transition-all duration-300 transform ${
                  isStarting
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : selectedTournament
                    ? 'bg-gradient-to-r from-cyan-400 to-pink-400 text-black hover:scale-105 shadow-lg shadow-cyan-400/25'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isStarting ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>INITIALIZING_BATTLE...</span>
                  </div>
                ) : selectedTournament ? (
                  <div className="flex items-center gap-3">
                    <Play className="w-5 h-5" />
                    <span>LAUNCH_TOURNAMENT</span>
                  </div>
                ) : (
                  <span>SELECT_MODE_FIRST</span>
                )}
              </button>
            </div>
          </div>
          
          {/* 배경 효과 */}
          <div className="absolute top-10 left-10 text-6xl text-cyan-400/10 font-mono animate-pulse">
            &lt;/&gt;
          </div>
          <div className="absolute bottom-10 right-10 text-4xl text-pink-400/10 font-mono animate-pulse">
            [RUN]
          </div>
        </div>
      </div>
    </div>
  );
}