'use client';

import { useState, useEffect } from 'react';
import { tournamentOptions } from '../data.tsx';

export default function TournamentSelectDesigns2GamingPage() {
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStartTournament = () => {
    if (!selectedTournament) return;
    
    setLoading(true);
    
    // 3초 후 로딩 해제 (실제로는 페이지 이동이나 다른 액션)
    setTimeout(() => {
      setLoading(false);
      // 여기서 실제 토너먼트 시작 로직 실행
      console.log(`Starting ${selectedTournament} tournament with gaming style`);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">게이밍 RGB 스타일</h1>
          <p className="text-gray-300">화려한 게이밍 RGB 디자인의 토너먼트 선택 UI</p>
        </div>

        <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 via-green-500 via-yellow-500 to-red-500 animate-pulse"></div>
            <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-pulse"></div>
            <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-purple-500 via-blue-500 via-green-500 via-yellow-500 to-red-500 animate-pulse"></div>
          </div>

          <div className="relative z-10">
            <div className="text-center mb-8">
              <h3 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                GAMING TOURNAMENT
              </h3>
              <p className="text-gray-300 font-semibold">SELECT YOUR BATTLE MODE</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {tournamentOptions.map((option, index) => {
                const colors = ['red', 'yellow', 'green', 'blue', 'purple'];
                const color = colors[index];
                
                return (
                  <div
                    key={option.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      isClient && selectedTournament === option.id ? 'scale-110' : 'hover:scale-105'
                    }`}
                    onClick={() => setSelectedTournament(option.id)}
                  >
                    <div className={`relative p-6 rounded-2xl border-2 transition-all duration-300 bg-gray-800/50 backdrop-blur-sm ${
                      isClient && selectedTournament === option.id
                        ? `border-${color}-400 shadow-lg shadow-${color}-400/25 bg-${color}-400/10`
                        : `border-${color}-400/30 hover:border-${color}-400 hover:bg-${color}-400/5`
                    }`}>
                      
                      <div className={`flex justify-center mb-4 text-${color}-400 ${
                        isClient && selectedTournament === option.id ? 'animate-pulse' : ''
                      }`}>
                        {option.icon}
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-xl font-bold mb-2 text-white ${
                          isClient && selectedTournament === option.id ? 'animate-pulse' : ''
                        }`}>
                          {option.name}
                        </div>
                        <div className={`text-sm text-${color}-300 mb-1`}>{option.choices} PLAYERS</div>
                        <div className="text-xs text-gray-400 mb-2">{option.vibe}</div>
                        <div className="text-xs font-medium text-gray-300">{option.duration}</div>
                      </div>
                      
                      {isClient && selectedTournament === option.id && (
                        <div className={`absolute -top-2 -right-2 w-6 h-6 bg-${color}-400 text-black rounded-full flex items-center justify-center text-xs font-bold animate-bounce`}>
                          ⚡
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="text-center mt-10">
              <button 
                disabled={!selectedTournament || loading}
                onClick={handleStartTournament}
                className={`px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 transform ${
                  loading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : selectedTournament
                    ? 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white hover:scale-105 shadow-lg animate-pulse'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>🎮 LOADING GAME...</span>
                  </div>
                ) : selectedTournament ? '🎮 START GAMING!' : 'SELECT MODE FIRST'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}