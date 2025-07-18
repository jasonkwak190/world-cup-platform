'use client';

import { useState, useEffect } from 'react';
import { tournamentOptions } from './data';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeSelector from './components/ThemeSelector';
import TournamentTitle from './components/TournamentTitle';
import StartButton from './components/StartButton';

export default function TournamentSelectDesigns2Page() {
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currentTheme, getThemeClass } = useTheme();

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
      console.log(`Starting ${selectedTournament} tournament with ${currentTheme} theme`);
    }, 3000);
  };

  const getContainerStyle = () => {
    return `min-h-screen py-8 ${getThemeClass('background')}`;
  };

  const getMainContainerStyle = () => {
    const baseStyle = 'p-8 relative overflow-hidden';
    return `${baseStyle} ${getThemeClass('container')}`;
  };

  const getInstructionStyle = () => {
    switch (currentTheme) {
      case 'neon':
        return 'text-gray-400 font-mono text-sm mt-4';
      case 'paper':
        return 'text-amber-700 text-lg mt-4';
      case 'comic':
        return 'text-purple-800 font-bold text-lg mt-4';
      case 'gaming':
        return 'text-gray-300 font-medium text-lg mt-4';
      case 'minimal':
      default:
        return 'text-gray-500 text-lg mt-4';
    }
  };

  return (
    <div className={getContainerStyle()}>
      <div className="max-w-7xl mx-auto px-4">
        <div className={getMainContainerStyle()}>
          <div className="relative z-10">
            {/* 테마 선택 영역 */}
            <div className="flex justify-end mb-6">
              <ThemeSelector className="w-64" />
            </div>

            {/* 토너먼트 제목 */}
            <TournamentTitle 
              title="토너먼트 선택"
              subtitle="원하는 토너먼트 규모를 선택하세요"
            />

            {/* 토너먼트 옵션 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {tournamentOptions.map((option) => (
                <div
                  key={option.id}
                  className={`cursor-pointer ${getThemeClass('transition')} ${
                    isClient && selectedTournament === option.id ? 'scale-105' : 'hover:scale-102'
                  }`}
                  onClick={() => setSelectedTournament(option.id)}
                >
                  <div className={`relative p-6 ${getThemeClass('card')} ${
                    isClient && selectedTournament === option.id
                      ? currentTheme === 'neon'
                        ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/25'
                        : currentTheme === 'paper'
                        ? 'border-orange-500 bg-orange-100 shadow-lg shadow-orange-200'
                        : currentTheme === 'comic'
                        ? 'bg-yellow-100 shadow-[12px_12px_0px_0px_#000]'
                        : currentTheme === 'gaming'
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/25'
                        : 'border-gray-400 bg-gray-100 shadow-2xl'
                      : ''
                  }`}>
                    
                    {/* 아이콘 */}
                    <div className={`flex justify-center mb-4 ${
                      isClient && selectedTournament === option.id 
                        ? currentTheme === 'neon' ? 'text-yellow-400'
                          : currentTheme === 'paper' ? 'text-orange-600'
                          : currentTheme === 'comic' ? 'text-red-500'
                          : currentTheme === 'gaming' ? 'text-blue-400'
                          : 'text-gray-700'
                        : currentTheme === 'neon' ? 'text-cyan-400'
                          : currentTheme === 'paper' ? 'text-amber-700'
                          : currentTheme === 'comic' ? 'text-black'
                          : currentTheme === 'gaming' ? 'text-white'
                          : 'text-gray-600'
                    }`}>
                      {option.icon}
                    </div>
                    
                    {/* 제목 */}
                    <div className="text-center">
                      <div className={`text-xl font-bold mb-2 ${
                        currentTheme === 'neon' ? 'font-mono' : 
                        currentTheme === 'comic' ? 'font-black' : 
                        currentTheme === 'minimal' ? 'font-light' : 'font-bold'
                      } ${
                        isClient && selectedTournament === option.id 
                          ? currentTheme === 'neon' ? 'text-yellow-400'
                            : currentTheme === 'paper' ? 'text-orange-800'
                            : currentTheme === 'comic' ? 'text-black'
                            : currentTheme === 'gaming' ? 'text-white'
                            : 'text-gray-900'
                          : getThemeClass('text')
                      }`}>
                        {option.name}
                      </div>
                      
                      {/* 선택지 수 */}
                      <div className={`text-sm mb-1 ${getThemeClass('textSecondary')}`}>
                        {option.choices} CHOICES
                      </div>
                      
                      {/* 분위기 */}
                      <div className={`text-xs mb-2 ${
                        currentTheme === 'neon' ? 'text-gray-400' :
                        currentTheme === 'paper' ? 'text-amber-600' :
                        currentTheme === 'comic' ? 'text-gray-600' :
                        currentTheme === 'gaming' ? 'text-gray-400' :
                        'text-gray-500'
                      }`}>
                        {option.vibe}
                      </div>
                      
                      {/* 소요 시간 */}
                      <div className={`text-xs font-medium ${
                        currentTheme === 'neon' ? 'text-pink-300' :
                        currentTheme === 'paper' ? 'text-amber-800' :
                        currentTheme === 'comic' ? 'text-purple-800' :
                        currentTheme === 'gaming' ? 'text-green-400' :
                        'text-gray-700'
                      }`}>
                        {option.duration}
                      </div>
                    </div>
                    
                    {/* 선택된 표시 */}
                    {isClient && selectedTournament === option.id && (
                      <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        currentTheme === 'neon' ? 'bg-yellow-400 text-black' :
                        currentTheme === 'paper' ? 'bg-orange-500 text-white' :
                        currentTheme === 'comic' ? 'bg-red-500 text-white' :
                        currentTheme === 'gaming' ? 'bg-blue-500 text-white' :
                        'bg-gray-700 text-white'
                      }`}>
                        {currentTheme === 'neon' ? '⚡' :
                         currentTheme === 'paper' ? '✓' :
                         currentTheme === 'comic' ? '!' :
                         currentTheme === 'gaming' ? '◆' :
                         '✓'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* 시작 버튼 */}
            <StartButton 
              selectedTournament={selectedTournament}
              isLoading={loading}
              onClick={handleStartTournament}
            />
          </div>
        </div>
      </div>
    </div>
  );
}