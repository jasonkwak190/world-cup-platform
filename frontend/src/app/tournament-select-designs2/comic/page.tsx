'use client';

import { useState, useEffect } from 'react';
import { tournamentOptions } from '../data.tsx';

export default function TournamentSelectDesigns2ComicPage() {
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
      console.log(`Starting ${selectedTournament} tournament with comic style`);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">만화책 스타일</h1>
          <p className="text-gray-600">팝아트 감성의 만화책 디자인 토너먼트 선택 UI</p>
        </div>

        <div className="bg-gradient-to-b from-blue-100 to-purple-100 p-8 rounded-3xl border-4 border-black relative overflow-hidden">
          <div className="absolute top-4 left-4 text-6xl font-black text-yellow-400 opacity-20 transform -rotate-12">POW!</div>
          <div className="absolute bottom-4 right-4 text-4xl font-black text-red-400 opacity-20 transform rotate-12">BAM!</div>

          <div className="text-center mb-8 relative z-10">
            <div className="inline-block bg-yellow-300 p-4 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000] transform -rotate-1">
              <h3 className="text-2xl font-black text-black mb-1">TOURNAMENT SELECT!</h3>
              <p className="text-black font-bold text-sm">어떤 배틀을 선택할 것인가?!</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 relative z-10">
            {tournamentOptions.map((option, index) => (
              <div
                key={option.id}
                className={`cursor-pointer transition-all duration-300 ${
                  isClient && selectedTournament === option.id ? 'scale-110' : 'hover:scale-105'
                }`}
                onClick={() => setSelectedTournament(option.id)}
              >
                <div className={`bg-white p-4 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000] relative ${
                  isClient && selectedTournament === option.id ? 'bg-yellow-200' : ''
                }`}>
                  
                  <div className={`absolute -top-6 ${index % 2 === 0 ? 'left-4' : 'right-4'} bg-white border-2 border-black rounded-lg px-2 py-1`}>
                    <div className="text-xs font-bold text-black">PICK ME!</div>
                    <div className={`absolute top-full ${index % 2 === 0 ? 'left-4' : 'right-4'} w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black`}></div>
                  </div>

                  <div className="relative">
                    <div className={`flex justify-center mb-4 ${
                      isClient && selectedTournament === option.id ? 'text-red-600' : 'text-purple-600'
                    }`}>
                      {option.icon}
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg font-black mb-2 ${
                        isClient && selectedTournament === option.id ? 'text-red-800' : 'text-black'
                      }`}>
                        {option.name}
                      </div>
                      <div className="text-sm text-purple-600 font-bold mb-1">{option.choices} FIGHTERS</div>
                      <div className="text-xs text-gray-600 font-bold mb-2">{option.vibe}</div>
                      <div className="text-xs font-black text-gray-700">{option.duration}</div>
                    </div>
                    
                    {isClient && selectedTournament === option.id && (
                      <div className="absolute inset-0 bg-yellow-400/30 rounded-xl flex items-center justify-center">
                        <div className="bg-red-500 text-white px-3 py-2 rounded-full font-black text-sm transform rotate-12 animate-bounce border-2 border-black">
                          💥 CHOSEN!
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8 relative z-10">
            <button 
              disabled={!selectedTournament || loading}
              onClick={handleStartTournament}
              className={`px-8 py-4 rounded-2xl font-black text-lg border-4 border-black shadow-[8px_8px_0px_0px_#000] transition-all duration-300 transform ${
                loading
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : selectedTournament
                  ? 'bg-green-400 text-black hover:bg-green-500 hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>LOADING...</span>
                </div>
              ) : selectedTournament ? 'START BATTLE!' : 'CHOOSE FIRST!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}