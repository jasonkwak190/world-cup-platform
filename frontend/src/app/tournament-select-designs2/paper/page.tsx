'use client';

import { useState, useEffect } from 'react';
import { tournamentOptions } from '../data.tsx';

export default function TournamentSelectDesigns2PaperPage() {
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
      console.log(`Starting ${selectedTournament} tournament with paper style`);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-800 mb-2">종이 찢기 스타일</h1>
          <p className="text-amber-600">아날로그 감성의 종이 디자인 토너먼트 선택 UI</p>
        </div>

        <div className="bg-amber-50 p-8 relative">
          <div className="text-center mb-8">
            <div className="inline-block bg-white p-4 rounded-lg shadow-lg border-2 border-dashed border-amber-400 transform -rotate-1">
              <h3 className="text-2xl font-bold text-amber-800 mb-1">토너먼트 선택</h3>
              <p className="text-amber-600 text-sm">원하는 규모를 찢어서 선택하세요!</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {tournamentOptions.map((option, index) => (
              <div
                key={option.id}
                className={`cursor-pointer transition-all duration-300 ${
                  isClient && selectedTournament === option.id ? 'scale-110 z-10' : 'hover:scale-105'
                }`}
                onClick={() => setSelectedTournament(option.id)}
                style={{
                  transform: `rotate(${[-2, 1, -1, 2, -3][index]}deg) ${
                    isClient && selectedTournament === option.id ? 'scale(1.1)' : ''
                  }`
                }}
              >
                <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-dashed border-gray-300 relative">
                  <div className="absolute -top-2 left-4 w-8 h-4 bg-white transform rotate-12"></div>
                  <div className="absolute -top-1 right-8 w-6 h-3 bg-white transform -rotate-12"></div>
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-yellow-200 opacity-70 rounded-sm border border-yellow-300"></div>

                  <div className="relative">
                    <div className={`flex justify-center mb-4 ${
                      isClient && selectedTournament === option.id ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      {option.icon}
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg font-bold mb-2 ${
                        isClient && selectedTournament === option.id ? 'text-red-800' : 'text-gray-800'
                      }`}>
                        {option.name}
                      </div>
                      <div className="text-sm text-amber-600 mb-1">{option.choices}개 선택지</div>
                      <div className="text-xs text-gray-500 mb-2">{option.vibe}</div>
                      <div className="text-xs font-medium text-gray-700">{option.duration}</div>
                    </div>
                    
                    {isClient && selectedTournament === option.id && (
                      <div className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center">
                        <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm transform rotate-12 animate-bounce">
                          🏆 선택됨!
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <div className="inline-block bg-white p-3 rounded-lg shadow-md border border-amber-200 transform -rotate-1">
              <button 
                disabled={!selectedTournament || loading}
                onClick={handleStartTournament}
                className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  loading
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : selectedTournament
                    ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>준비 중...</span>
                  </div>
                ) : selectedTournament ? '토너먼트 시작!' : '먼저 선택해주세요'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}