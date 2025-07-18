'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { ThemeWrapperProps } from './types';

export default function ComicTheme({
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
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-b from-blue-100 to-purple-100 rounded-3xl p-8 relative overflow-hidden border-4 border-black">
          
          <div className="relative z-10">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={onGoHome}
                className="flex items-center space-x-2 text-black hover:text-gray-800 transition-colors font-black border-4 border-black bg-yellow-400 px-4 py-2 rounded-lg shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] transform hover:-translate-x-1 hover:-translate-y-1"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>HOME!</span>
              </button>
              <h1 className="text-3xl font-black text-black bg-yellow-400 px-6 py-3 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_#000]">
                TOURNAMENT!
              </h1>
              <div className="w-20"></div>
            </div>

            {/* 월드컵 정보 */}
            <div className="text-center mb-8">
              <div className="inline-block bg-white rounded-lg p-6 border-4 border-black shadow-[12px_12px_0px_0px_#000] mb-6 transform hover:-translate-x-1 hover:-translate-y-1 transition-transform">
                <h2 className="text-4xl font-black text-black mb-2">
                  {worldcupData.title}
                </h2>
                {worldcupData.description && (
                  <p className="text-purple-800 font-bold text-lg mb-4">
                    {worldcupData.description}
                  </p>
                )}
                <div className="text-sm font-bold text-black bg-yellow-400 inline-block px-4 py-2 rounded-full border-2 border-black">
                  {worldcupData.items?.length || 0} ITEMS • BY {worldcupData.creator_name}
                </div>
              </div>
            </div>

            {/* 토너먼트 선택 */}
            <div className="mb-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-black bg-red-500 inline-block px-6 py-3 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_#000] transform -rotate-2">
                  PICK YOUR BATTLE!
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {tournamentOptions.map((option, index) => (
                  <div
                    key={option.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      isClient && selectedTournament === option.id ? 'scale-105' : 'hover:scale-105'
                    }`}
                    onClick={() => setSelectedTournament(option.id)}
                  >
                    <div className={`relative p-6 rounded-lg border-4 border-black bg-white transition-all duration-200 transform hover:-translate-x-1 hover:-translate-y-1 ${
                      isClient && selectedTournament === option.id
                        ? 'bg-yellow-100 shadow-[12px_12px_0px_0px_#000]'
                        : 'shadow-[8px_8px_0px_0px_#000] hover:shadow-[12px_12px_0px_0px_#000]'
                    }`}>
                      
                      <div className="text-center">
                        <div className={`text-2xl font-black mb-2 ${
                          isClient && selectedTournament === option.id ? 'text-red-600' : 'text-black'
                        }`}>
                          {option.name}
                        </div>
                        <div className="text-sm font-bold text-black mb-1 bg-blue-300 inline-block px-2 py-1 rounded border-2 border-black">
                          {option.choices} FIGHTERS!
                        </div>
                        <div className="text-xs font-bold text-black mb-2 bg-green-300 inline-block px-2 py-1 rounded border-2 border-black mt-1">
                          {option.rounds} ROUNDS
                        </div>
                        <div className="text-xs font-black text-white bg-purple-600 inline-block px-2 py-1 rounded border-2 border-black">
                          {option.duration}
                        </div>
                        <div className="text-xs font-bold text-gray-800 mt-2">{option.description}</div>
                      </div>
                      
                      {isClient && selectedTournament === option.id && (
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-lg font-black border-4 border-black">
                          !
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
                className={`px-12 py-4 rounded-lg border-4 border-black font-black text-xl transition-all duration-200 transform hover:scale-105 ${
                  isStarting
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed shadow-[4px_4px_0px_0px_#666]'
                    : selectedTournament
                    ? 'bg-green-400 text-black hover:-translate-x-2 hover:-translate-y-2 shadow-[8px_8px_0px_0px_#000] hover:shadow-[12px_12px_0px_0px_#000]'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-[4px_4px_0px_0px_#999]'
                }`}
              >
                {isStarting ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>LOADING!</span>
                  </div>
                ) : selectedTournament ? (
                  <div className="flex items-center gap-3">
                    <Play className="w-6 h-6" />
                    <span>LET'S GO!</span>
                  </div>
                ) : (
                  <span>PICK ONE!</span>
                )}
              </button>
            </div>
          </div>
          
          {/* 배경 효과 */}
          <div className="absolute top-16 left-16 text-8xl font-black text-yellow-400 opacity-20 transform -rotate-12">
            POW!
          </div>
          <div className="absolute top-32 right-20 text-6xl font-black text-red-400 opacity-20 transform rotate-12">
            BAM!
          </div>
          <div className="absolute bottom-20 left-20 text-5xl font-black text-blue-400 opacity-20 transform rotate-45">
            ZAP!
          </div>
          <div className="absolute bottom-32 right-16 text-4xl font-black text-purple-400 opacity-20 transform -rotate-45">
            BOOM!
          </div>
          
          {/* 만화 말풍선 효과 */}
          <div className="absolute top-10 right-10 w-16 h-12 bg-white border-4 border-black rounded-full flex items-center justify-center">
            <span className="text-xs font-black">WOW!</span>
          </div>
        </div>
      </div>
    </div>
  );
}