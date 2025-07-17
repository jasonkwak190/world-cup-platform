'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Play, Home, ArrowLeft } from 'lucide-react';

// 테마 정의
const themes = [
  {
    id: 'neon',
    name: '네온 사이버',
    description: '미래적인 네온 사이버 스타일',
    bgClass: 'bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900',
    textClass: 'text-cyan-400',
    accentClass: 'text-pink-400'
  },
  {
    id: 'paper',
    name: '종이 찢기',
    description: '아날로그 감성의 종이 스타일',
    bgClass: 'bg-gradient-to-br from-amber-50 to-orange-100',
    textClass: 'text-amber-800',
    accentClass: 'text-orange-600'
  },
  {
    id: 'comic',
    name: '만화책',
    description: '팝아트 감성의 만화책 스타일',
    bgClass: 'bg-gradient-to-br from-blue-100 to-purple-100',
    textClass: 'text-purple-800',
    accentClass: 'text-blue-600'
  },
  {
    id: 'minimal',
    name: '미니멀',
    description: '세련되고 심플한 미니멀 스타일',
    bgClass: 'bg-gradient-to-br from-gray-50 to-white',
    textClass: 'text-gray-800',
    accentClass: 'text-gray-600'
  },
  {
    id: 'gaming',
    name: '게이밍 RGB',
    description: '화려한 게이밍 RGB 스타일',
    bgClass: 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900',
    textClass: 'text-white',
    accentClass: 'text-purple-400'
  }
];

// 토너먼트 옵션 정의
const tournamentOptions = [
  { id: '4', name: '4강', choices: 4, rounds: 2, duration: '2분', description: '빠른 게임' },
  { id: '8', name: '8강', choices: 8, rounds: 3, duration: '3분', description: '적당한 게임' },
  { id: '16', name: '16강', choices: 16, rounds: 4, duration: '5분', description: '클래식 게임' },
  { id: '32', name: '32강', choices: 32, rounds: 5, duration: '8분', description: '본격적인 게임' },
  { id: '64', name: '64강', choices: 64, rounds: 6, duration: '12분', description: '하드코어 게임' }
];

interface TournamentSelectProps {
  params: Promise<{
    id: string;
  }>;
}

interface WorldCupData {
  id: string;
  title: string;
  description: string;
  items: Array<{
    id: string;
    title: string;
    image_url?: string;
  }>;
  creator_name: string;
  created_at: string;
}

export default function TournamentSelectPage({ params }: TournamentSelectProps) {
  const router = useRouter();
  const [worldcupId, setWorldcupId] = useState<string>('');
  const [worldcupData, setWorldcupData] = useState<WorldCupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('minimal');
  const [selectedTournament, setSelectedTournament] = useState<string>('16');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        setWorldcupId(id);

        // 월드컵 데이터 가져오기
        const response = await fetch(`/api/worldcups/${id}`);
        if (!response.ok) {
          throw new Error('월드컵 데이터를 불러올 수 없습니다.');
        }
        
        const data = await response.json();
        setWorldcupData(data.worldcup);
        
        // 아이템 수에 따라 기본 토너먼트 타입 설정
        const itemCount = data.worldcup.items?.length || 0;
        if (itemCount >= 64) setSelectedTournament('64');
        else if (itemCount >= 32) setSelectedTournament('32');
        else if (itemCount >= 16) setSelectedTournament('16');
        else if (itemCount >= 8) setSelectedTournament('8');
        else setSelectedTournament('4');
        
      } catch (err) {
        console.error('Failed to load worldcup data:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params]);

  const handleStartTournament = async () => {
    if (!selectedTournament || !worldcupData) return;
    
    setIsStarting(true);
    
    try {
      // 선택된 테마와 토너먼트 정보를 URL에 포함하여 게임 시작
      const gameUrl = `/tournament-game/${worldcupId}?theme=${selectedTheme}&tournament=${selectedTournament}`;
      
      // 로딩 효과를 위해 약간의 지연
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      router.push(gameUrl);
    } catch (err) {
      console.error('Failed to start tournament:', err);
      setIsStarting(false);
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const getAvailableOptions = () => {
    if (!worldcupData) return tournamentOptions;
    
    const itemCount = worldcupData.items?.length || 0;
    return tournamentOptions.filter(option => {
      const choices = parseInt(option.id);
      return choices <= itemCount;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">월드컵 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto p-6">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">오류가 발생했습니다</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-lg transition-colors"
            >
              다시 시도
            </button>
            <button
              onClick={handleGoHome}
              className="w-full bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!worldcupData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">월드컵을 찾을 수 없습니다</h1>
          <button
            onClick={handleGoHome}
            className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-lg transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const currentTheme = themes.find(t => t.id === selectedTheme) || themes[0];
  const availableOptions = getAvailableOptions();

  return (
    <div className={`min-h-screen ${currentTheme.bgClass} py-8`}>
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleGoHome}
            className={`flex items-center space-x-2 ${currentTheme.textClass} hover:opacity-80 transition-opacity`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>홈으로</span>
          </button>
          <h1 className={`text-2xl font-bold ${currentTheme.textClass}`}>토너먼트 설정</h1>
          <div className="w-20"></div> {/* 균형을 위한 빈 공간 */}
        </div>

        {/* 월드컵 정보 */}
        <div className="text-center mb-8">
          <h2 className={`text-3xl font-bold ${currentTheme.textClass} mb-2`}>
            {worldcupData.title}
          </h2>
          {worldcupData.description && (
            <p className={`${currentTheme.accentClass} text-lg mb-4`}>
              {worldcupData.description}
            </p>
          )}
          <div className={`text-sm ${currentTheme.accentClass}`}>
            {worldcupData.items?.length || 0}개의 선택지 • {worldcupData.creator_name}
          </div>
        </div>

        {/* 테마 선택 */}
        <div className="mb-8">
          <h3 className={`text-xl font-semibold ${currentTheme.textClass} mb-4`}>
            테마 선택
          </h3>
          <div className="relative">
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className={`w-full p-4 rounded-lg border-2 ${
                currentTheme.id === 'paper' || currentTheme.id === 'minimal'
                  ? 'bg-white border-gray-300 text-gray-800'
                  : 'bg-gray-800 border-gray-600 text-white'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none`}
            >
              {themes.map(theme => (
                <option key={theme.id} value={theme.id}>
                  {theme.name} - {theme.description}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* 토너먼트 선택 */}
        <div className="mb-8">
          <h3 className={`text-xl font-semibold ${currentTheme.textClass} mb-4`}>
            토너먼트 강수 선택
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableOptions.map(option => (
              <div
                key={option.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTournament === option.id
                    ? currentTheme.id === 'paper' || currentTheme.id === 'minimal'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-blue-400 bg-blue-900/30'
                    : currentTheme.id === 'paper' || currentTheme.id === 'minimal'
                      ? 'border-gray-300 bg-white hover:bg-gray-50'
                      : 'border-gray-600 bg-gray-800/30 hover:bg-gray-700/30'
                }`}
                onClick={() => setSelectedTournament(option.id)}
              >
                <div className={`text-2xl font-bold ${currentTheme.textClass} mb-2`}>
                  {option.name}
                </div>
                <div className={`text-sm ${currentTheme.accentClass} mb-2`}>
                  {option.choices}개 선택지 • {option.rounds}라운드
                </div>
                <div className={`text-xs ${currentTheme.accentClass}`}>
                  예상 시간: {option.duration} • {option.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 시작 버튼 */}
        <div className="text-center">
          <button
            onClick={handleStartTournament}
            disabled={isStarting || !selectedTournament}
            className={`px-12 py-4 rounded-lg font-bold text-xl transition-all ${
              isStarting || !selectedTournament
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105'
            } shadow-lg`}
          >
            {isStarting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>게임 시작 중...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Play className="w-6 h-6" />
                <span>토너먼트 시작하기</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}