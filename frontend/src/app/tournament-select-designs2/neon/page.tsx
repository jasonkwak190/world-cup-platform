'use client';

import { useState, useEffect } from 'react';
import { tournamentOptions } from '../data.tsx';

export default function TournamentSelectDesigns2NeonPage() {
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
      console.log(`Starting ${selectedTournament} tournament with neon style`);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">네온 사이버 스타일</h1>
          <p className="text-gray-400">미래적인 네온 디자인의 토너먼트 선택 UI</p>
        </div>

        <div className="bg-black rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-blue-900/30"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-4 bg-gray-800/30 backdrop-blur-sm rounded-2xl px-8 py-4 border border-gray-700">
                <div className="text-cyan-400 font-mono text-sm">SELECT</div>
                <div className="text-4xl font-bold text-white">TOURNAMENT</div>
                <div className="text-pink-400 font-mono text-sm">MODE</div>
              </div>
              <p className="text-gray-400 font-mono text-sm mt-4">CHOOSE YOUR BATTLE INTENSITY</p>
            </div>

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
                      <div className="text-sm text-cyan-300 mb-1">{option.choices} CHOICES</div>
                      <div className="text-xs text-gray-400 mb-2">{option.vibe}</div>
                      <div className="text-xs font-medium text-pink-300">{option.duration}</div>
                    </div>
                    
                    {isClient && selectedTournament === option.id && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center text-xs font-bold">
                        ⚡
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-10">
              <button 
                disabled={!selectedTournament || loading}
                onClick={handleStartTournament}
                className={`px-10 py-4 rounded-full font-semibold text-lg font-mono transition-all duration-300 transform ${
                  loading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : selectedTournament
                    ? 'bg-gradient-to-r from-cyan-400 to-pink-400 text-black hover:scale-105 shadow-lg shadow-cyan-400/25'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>INITIALIZING...</span>
                  </div>
                ) : selectedTournament ? 'INITIALIZE BATTLE' : 'SELECT MODE FIRST'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}