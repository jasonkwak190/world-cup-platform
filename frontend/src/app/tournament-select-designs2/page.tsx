'use client';

import { useState, useEffect } from 'react';
import { Flame, Zap, Skull, Crown, Sparkles, Rocket, Swords, Trophy, Target, Home, Volume2, VolumeX, RotateCcw, Undo2, ChevronDown, Star, Heart } from 'lucide-react';

const tournamentOptions = [
  { 
    id: '4', 
    name: '4강', 
    choices: 4, 
    rounds: 2, 
    duration: '2분', 
    vibe: '빠른 결정',
    intensity: 1,
    description: '간단명료',
    accentColor: '#10b981',
    icon: <Zap className="w-6 h-6" />
  },
  { 
    id: '8', 
    name: '8강', 
    choices: 8, 
    rounds: 3, 
    duration: '3분', 
    vibe: '적당한 고민',
    intensity: 2,
    description: '밸런스',
    accentColor: '#3b82f6',
    icon: <Target className="w-6 h-6" />
  },
  { 
    id: '16', 
    name: '16강', 
    choices: 16, 
    rounds: 4, 
    duration: '5분', 
    vibe: '진지한 선택',
    intensity: 3,
    description: '클래식',
    accentColor: '#8b5cf6',
    icon: <Trophy className="w-6 h-6" />
  },
  { 
    id: '32', 
    name: '32강', 
    choices: 32, 
    rounds: 5, 
    duration: '8분', 
    vibe: '치열한 경쟁',
    intensity: 4,
    description: '본격파',
    accentColor: '#f59e0b',
    icon: <Flame className="w-6 h-6" />
  },
  { 
    id: '64', 
    name: '64강', 
    choices: 64, 
    rounds: 6, 
    duration: '12분', 
    vibe: '극한의 선택',
    intensity: 5,
    description: '하드코어',
    accentColor: '#ef4444',
    icon: <Swords className="w-6 h-6" />
  }
];

export default function TournamentSelectDesigns2Page() {
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({
    neon: false,
    paper: false,
    comic: false,
    minimal: false,
    gaming: false
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStartTournament = (style: string) => {
    if (!selectedTournament) return;
    
    setLoadingStates(prev => ({ ...prev, [style]: true }));
    
    // 3초 후 로딩 해제 (실제로는 페이지 이동이나 다른 액션)
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [style]: false }));
      // 여기서 실제 토너먼트 시작 로직 실행
      console.log(`Starting ${selectedTournament} tournament with ${style} style`);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">토너먼트 선택 디자인</h1>
          <p className="text-gray-600">5가지 독창적인 토너먼트 선택 UI 디자인</p>
        </div>

        {/* 디자인 1: 네온 사이버 스타일 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">1. 네온 사이버 스타일</h2>
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
                {tournamentOptions.map((option, index) => (
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
                  disabled={!selectedTournament || loadingStates.neon}
                  onClick={() => handleStartTournament('neon')}
                  className={`px-10 py-4 rounded-full font-semibold text-lg font-mono transition-all duration-300 transform ${
                    loadingStates.neon
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : selectedTournament
                      ? 'bg-gradient-to-r from-cyan-400 to-pink-400 text-black hover:scale-105 shadow-lg shadow-cyan-400/25'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loadingStates.neon ? (
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

        {/* 디자인 2: 종이 찢기 스타일 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">2. 종이 찢기 스타일</h2>
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
                  disabled={!selectedTournament || loadingStates.paper}
                  onClick={() => handleStartTournament('paper')}
                  className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    loadingStates.paper
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : selectedTournament
                      ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loadingStates.paper ? (
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

        {/* 디자인 3: 만화책 스타일 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">3. 만화책 스타일</h2>
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
                disabled={!selectedTournament || loadingStates.comic}
                onClick={() => handleStartTournament('comic')}
                className={`px-8 py-4 rounded-2xl font-black text-lg border-4 border-black shadow-[8px_8px_0px_0px_#000] transition-all duration-300 transform ${
                  loadingStates.comic
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : selectedTournament
                    ? 'bg-green-400 text-black hover:bg-green-500 hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loadingStates.comic ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>LOADING...</span>
                  </div>
                ) : selectedTournament ? 'START BATTLE!' : 'CHOOSE FIRST!'}
              </button>
            </div>
          </div>
        </div>

        {/* 디자인 4: 미니멀 엘레강스 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">4. 미니멀 엘레강스</h2>
          <div className="bg-white p-12 rounded-3xl shadow-2xl border border-gray-100">
            
            <div className="text-center mb-12">
              <h3 className="text-3xl font-light text-gray-800 mb-3">Tournament Selection</h3>
              <div className="w-24 h-0.5 bg-gray-300 mx-auto mb-4"></div>
              <p className="text-gray-500 font-light">Choose your preferred tournament size</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {tournamentOptions.map((option, index) => (
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
                disabled={!selectedTournament || loadingStates.minimal}
                onClick={() => handleStartTournament('minimal')}
                className={`px-12 py-4 rounded-full font-light text-lg transition-all duration-300 ${
                  loadingStates.minimal
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : selectedTournament
                    ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loadingStates.minimal ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : selectedTournament ? 'Begin Tournament' : 'Select First'}
              </button>
            </div>
          </div>
        </div>

        {/* 디자인 5: 게이밍 RGB 스타일 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">5. 게이밍 RGB 스타일</h2>
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
                  disabled={!selectedTournament || loadingStates.gaming}
                  onClick={() => handleStartTournament('gaming')}
                  className={`px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 transform ${
                    loadingStates.gaming
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : selectedTournament
                      ? 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white hover:scale-105 shadow-lg animate-pulse'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loadingStates.gaming ? (
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

        <div className="text-center">
          <p className="text-gray-600 mb-6 text-lg">5가지 독창적인 디자인으로 다양한 사용자 경험을 제공합니다</p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">네온 사이버</span>
            <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium">종이 찢기</span>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">만화책</span>
            <span className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium">미니멀</span>
            <span className="px-4 py-2 bg-gradient-to-r from-red-100 to-purple-100 text-gray-800 rounded-lg text-sm font-medium">게이밍 RGB</span>
          </div>
        </div>
      </div>
    </div>
  );
}