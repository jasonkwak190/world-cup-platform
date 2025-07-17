'use client';

import { useState, useEffect } from 'react';
import { tournamentOptions } from '../data.tsx';

export default function TournamentSelectDesigns2MinimalPage() {
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
      console.log(`Starting ${selectedTournament} tournament with minimal style`);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">미니멀 엘레강스</h1>
          <p className="text-gray-600">세련되고 심플한 미니멀 디자인 토너먼트 선택 UI</p>
        </div>

        <div className="bg-white p-12 rounded-3xl shadow-2xl border border-gray-100">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-light text-gray-800 mb-3">Tournament Selection</h3>
            <div className="w-24 h-0.5 bg-gray-300 mx-auto mb-4"></div>
            <p className="text-gray-500 font-light">Choose your preferred tournament size</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {tournamentOptions.map((option) => (
              <div
                key={option.id}
                className={`cursor-pointer transition-all duration-500 ${
                  isClient && selectedTournament === option.id ? 'scale-105' : 'hover:scale-102'
                }`}
                onClick={() => setSelectedTournament(option.id)}
              >
                <div className={`relative p-8 rounded-2xl transition-all duration-300 ${
                  isClient && selectedTournament === option.id
                    ? 'bg-gray-50 shadow-xl border-2 border-gray-900'
                    : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                }`}>
                  
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isClient && selectedTournament === option.id 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {option.icon}
                    </div>
                    
                    <div className={`text-2xl font-light mb-3 ${
                      isClient && selectedTournament === option.id ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {option.name}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">{option.choices} participants</div>
                      <div className="text-xs text-gray-400 italic">{option.vibe}</div>
                      <div className="text-xs font-medium text-gray-600">{option.duration}</div>
                    </div>
                  </div>
                  
                  {isClient && selectedTournament === option.id && (
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm">
                      ✓
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <button 
              disabled={!selectedTournament || loading}
              onClick={handleStartTournament}
              className={`px-12 py-4 rounded-full font-light text-lg transition-all duration-300 ${
                loading
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : selectedTournament
                  ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : selectedTournament ? 'Begin Tournament' : 'Select First'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}