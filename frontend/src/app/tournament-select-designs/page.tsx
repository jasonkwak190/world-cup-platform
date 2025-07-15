'use client';

import { useState } from 'react';
import { Flame, Zap, Skull, Crown, Sparkles, Rocket, Swords } from 'lucide-react';

// 토너먼트 옵션 데이터
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
    bgPattern: 'dots',
    accentColor: '#10b981'
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
    bgPattern: 'grid',
    accentColor: '#3b82f6'
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
    bgPattern: 'waves',
    accentColor: '#8b5cf6'
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
    bgPattern: 'diagonal',
    accentColor: '#f59e0b'
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
    bgPattern: 'circuit',
    accentColor: '#ef4444'
  },
  { 
    id: '128', 
    name: '128강', 
    choices: 128, 
    rounds: 7, 
    duration: '20분', 
    vibe: '끝없는 고뇌',
    intensity: 6,
    description: '매니아',
    bgPattern: 'hexagon',
    accentColor: '#ec4899'
  },
  { 
    id: '256', 
    name: '256강', 
    choices: 256, 
    rounds: 8, 
    duration: '35분', 
    vibe: '정신력 테스트',
    intensity: 7,
    description: '전설급',
    bgPattern: 'maze',
    accentColor: '#6366f1'
  }
];

export default function TournamentSelectDesignsPage() {
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const getIntensityIcon = (intensity: number) => {
    switch (intensity) {
      case 1: return <Zap className="w-5 h-5" />;
      case 2: return <Rocket className="w-5 h-5" />;
      case 3: return <Flame className="w-5 h-5" />;
      case 4: return <Swords className="w-5 h-5" />;
      case 5: return <Crown className="w-5 h-5" />;
      case 6: return <Sparkles className="w-5 h-5" />;
      case 7: return <Skull className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">토너먼트 선택 디자인</h1>
          <p className="text-gray-600 text-lg">완전히 새로운 스타일의 토너먼트 선택 UI</p>
        </div>

        {/* 디자인 1: 브루탈리즘 스타일 */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">1. 브루탈리즘 스타일</h2>
          <div className="bg-black p-8 border-8 border-black shadow-[8px_8px_0px_0px_#000]">
            <div className="bg-white p-8 border-4 border-black">
              <h3 className="text-3xl font-black text-center mb-8 tracking-wider">
                CHOOSE YOUR BATTLE
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {tournamentOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`relative cursor-pointer transition-all duration-200 ${
                      selectedTournament === option.id
                        ? 'transform -translate-y-2'
                        : 'hover:transform hover:-translate-y-1'
                    }`}
                    onClick={() => setSelectedTournament(option.id)}
                  >
                    <div className={`bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_#000] ${
                      selectedTournament === option.id ? 'bg-yellow-300' : ''
                    }`}>
                      <div className="text-center">
                        <div className="text-4xl font-black mb-2">{option.name}</div>
                        <div className="text-sm font-bold mb-3">{option.choices}개 선택지</div>
                        <div className="text-xs font-bold text-gray-600 mb-2">{option.vibe}</div>
                        <div className="text-xs font-bold">{option.duration}</div>
                      </div>
                      
                      {selectedTournament === option.id && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 flex items-center justify-center font-black text-sm border-2 border-black">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-8">
                <button 
                  disabled={!selectedTournament}
                  className={`px-8 py-4 font-black text-lg border-4 border-black shadow-[4px_4px_0px_0px_#000] transition-all duration-200 ${
                    selectedTournament
                      ? 'bg-red-500 text-white hover:bg-red-600 active:shadow-[2px_2px_0px_0px_#000] active:translate-x-1 active:translate-y-1'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  START BATTLE
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 디자인 2: 네오모피즘 스타일 */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">2. 네오모피즘 스타일</h2>
          <div className="bg-gray-200 p-12 rounded-3xl" style={{boxShadow: 'inset 20px 20px 40px #bebebe, inset -20px -20px 40px #ffffff'}}>
            <div className="text-center mb-12">
              <h3 className="text-3xl font-light text-gray-800 mb-4">토너먼트 선택</h3>
              <p className="text-gray-600">부드러운 선택의 경험</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
              {tournamentOptions.map((option) => (
                <div
                  key={option.id}
                  className={`cursor-pointer transition-all duration-300 ${
                    hoveredCard === option.id ? 'scale-105' : ''
                  }`}
                  onMouseEnter={() => setHoveredCard(option.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => setSelectedTournament(option.id)}
                >
                  <div 
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-gray-700 font-bold transition-all duration-300 ${
                      selectedTournament === option.id
                        ? 'bg-gray-200 text-blue-600'
                        : 'bg-gray-200'
                    }`}
                    style={{
                      boxShadow: selectedTournament === option.id
                        ? 'inset 8px 8px 16px #bebebe, inset -8px -8px 16px #ffffff'
                        : '8px 8px 16px #bebebe, -8px -8px 16px #ffffff'
                    }}
                  >
                    {option.name}
                  </div>
                  <div className="text-center mt-3">
                    <div className="text-sm text-gray-600">{option.choices}개</div>
                    <div className="text-xs text-gray-500">{option.duration}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <button 
                disabled={!selectedTournament}
                className={`px-10 py-4 rounded-full font-medium text-lg transition-all duration-300 ${
                  selectedTournament
                    ? 'text-blue-600 bg-gray-200'
                    : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                }`}
                style={{
                  boxShadow: selectedTournament 
                    ? '8px 8px 16px #bebebe, -8px -8px 16px #ffffff'
                    : 'inset 4px 4px 8px #bebebe, inset -4px -4px 8px #ffffff'
                }}
              >
                시작하기
              </button>
            </div>
          </div>
        </div>

        {/* 디자인 3: 글래스모피즘 + 그라데이션 */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">3. 글래스모피즘 스타일</h2>
          <div 
            className="relative p-12 rounded-3xl backdrop-blur-xl border border-white/20"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-pink-400/20 to-blue-400/20 rounded-3xl"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-12">
                <h3 className="text-4xl font-light text-white mb-4">Tournament Selection</h3>
                <p className="text-white/70">투명한 선택의 미학</p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-6">
                {tournamentOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedTournament === option.id ? 'scale-110' : 'hover:scale-105'
                    }`}
                    onClick={() => setSelectedTournament(option.id)}
                  >
                    <div 
                      className={`p-6 rounded-2xl backdrop-blur-md border transition-all duration-300 ${
                        selectedTournament === option.id
                          ? 'border-white/40 bg-white/20'
                          : 'border-white/20 bg-white/10 hover:bg-white/15'
                      }`}
                      style={{
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
                      }}
                    >
                      <div className="text-center text-white">
                        <div className="text-2xl font-bold mb-2">{option.name}</div>
                        <div className="text-sm opacity-80 mb-2">{option.choices}개 선택지</div>
                        <div className="text-xs opacity-60">{option.vibe}</div>
                        <div className="text-xs opacity-60 mt-1">{option.duration}</div>
                      </div>
                      
                      {selectedTournament === option.id && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-12">
                <button 
                  disabled={!selectedTournament}
                  className={`px-10 py-4 rounded-2xl font-medium text-lg backdrop-blur-md border transition-all duration-300 ${
                    selectedTournament
                      ? 'border-white/40 bg-white/20 text-white hover:bg-white/30'
                      : 'border-white/20 bg-white/10 text-white/50 cursor-not-allowed'
                  }`}
                  style={{
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
                  }}
                >
                  토너먼트 시작
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 디자인 4: 레트로 아케이드 */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">4. 레트로 아케이드 스타일</h2>
          <div className="bg-black p-8 rounded-lg border-4 border-yellow-400">
            <div className="text-center mb-8">
              <h3 className="text-4xl font-bold text-yellow-400 mb-2 font-mono tracking-wider">
                SELECT STAGE
              </h3>
              <p className="text-green-400 font-mono text-sm">PRESS START TO CONTINUE</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tournamentOptions.map((option, index) => (
                <div
                  key={option.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedTournament === option.id ? 'animate-pulse' : ''
                  }`}
                  onClick={() => setSelectedTournament(option.id)}
                >
                  <div className={`p-4 border-2 font-mono text-center ${
                    selectedTournament === option.id
                      ? 'border-yellow-400 bg-yellow-400 text-black'
                      : 'border-green-400 bg-black text-green-400 hover:bg-green-400 hover:text-black'
                  }`}>
                    <div className="text-2xl font-bold mb-2">STAGE {index + 1}</div>
                    <div className="text-lg font-bold mb-1">{option.name}</div>
                    <div className="text-sm mb-1">{option.choices} CHOICES</div>
                    <div className="text-xs">{option.duration.toUpperCase()}</div>
                    <div className="text-xs mt-1 opacity-80">{option.description.toUpperCase()}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <button 
                disabled={!selectedTournament}
                className={`px-8 py-4 font-mono font-bold text-lg border-2 transition-all duration-200 ${
                  selectedTournament
                    ? 'border-red-500 bg-red-500 text-white hover:bg-red-600 animate-pulse'
                    : 'border-gray-600 bg-black text-gray-600 cursor-not-allowed'
                }`}
              >
                &gt; START GAME &lt;
              </button>
            </div>
          </div>
        </div>

        {/* 디자인 5: 미니멀 타이포그래피 */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">5. 미니멀 타이포그래피</h2>
          <div className="bg-white p-16">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h3 className="text-6xl font-thin text-gray-900 mb-8 tracking-widest">
                  TOURNAMENT
                </h3>
                <div className="w-32 h-px bg-gray-900 mx-auto"></div>
              </div>
              
              <div className="space-y-8">
                {tournamentOptions.map((option, index) => (
                  <div
                    key={option.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedTournament === option.id ? 'transform translate-x-8' : 'hover:transform hover:translate-x-4'
                    }`}
                    onClick={() => setSelectedTournament(option.id)}
                  >
                    <div className="flex items-center justify-between py-6 border-b border-gray-200">
                      <div className="flex items-center gap-8">
                        <div className={`text-6xl font-thin ${
                          selectedTournament === option.id ? 'text-black' : 'text-gray-300'
                        }`}>
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div>
                          <div className={`text-3xl font-light mb-1 ${
                            selectedTournament === option.id ? 'text-black' : 'text-gray-600'
                          }`}>
                            {option.name}
                          </div>
                          <div className="text-sm text-gray-500 tracking-wide">
                            {option.choices}개 선택지 · {option.duration} · {option.vibe}
                          </div>
                        </div>
                      </div>
                      
                      <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        selectedTournament === option.id ? 'bg-black' : 'bg-gray-300'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-16">
                <button 
                  disabled={!selectedTournament}
                  className={`px-12 py-4 font-light text-lg tracking-widest transition-all duration-300 ${
                    selectedTournament
                      ? 'text-black border-b-2 border-black hover:tracking-wider'
                      : 'text-gray-400 border-b border-gray-300 cursor-not-allowed'
                  }`}
                >
                  BEGIN
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-6 text-lg">어떤 스타일이 가장 독창적이고 매력적인가요?</p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-black text-white rounded text-sm font-bold">1. 브루탈리즘</span>
            <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm">2. 네오모피즘</span>
            <span className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded text-sm">3. 글래스모피즘</span>
            <span className="px-4 py-2 bg-yellow-400 text-black rounded text-sm font-mono">4. 레트로 아케이드</span>
            <span className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm">5. 미니멀 타이포</span>
          </div>
        </div>
      </div>
    </div>
  );
}