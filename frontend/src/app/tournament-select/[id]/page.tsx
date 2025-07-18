'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useTheme, ThemeType } from '@/contexts/ThemeContext';
import { NeonTheme, PaperTheme, ComicTheme, MinimalTheme, GamingTheme } from '@/app/tournament-select-designs2/components/themes';
import { useThemeSelection } from '@/app/tournament-select-designs2/hooks/useThemeSelection';

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

export default function TournamentSelectPage({ params }: TournamentSelectProps) {
  const [worldcupId, setWorldcupId] = useState<string>('');
  const { currentTheme, setTheme, themeOptions } = useTheme();
  
  // params에서 worldcupId 추출
  useEffect(() => {
    const loadId = async () => {
      const resolvedParams = await params;
      setWorldcupId(resolvedParams.id);
    };
    loadId();
  }, [params]);

  // useThemeSelection 훅 사용
  const {
    worldcupData,
    loading,
    error,
    selectedTournament,
    setSelectedTournament,
    isStarting,
    handleStartTournament,
    handleGoHome,
    getAvailableTournamentOptions
  } = useThemeSelection(worldcupId);

  // 로딩 상태
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

  // 에러 상태
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

  // 데이터 없음 상태
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

  const availableOptions = getAvailableTournamentOptions(tournamentOptions) || [];

  // 테마별 렌더링
  const renderThemeComponent = () => {
    if (!worldcupData || !availableOptions.length) {
      return null;
    }

    const commonProps = {
      worldcupData,
      tournamentOptions: availableOptions,
      selectedTournament,
      setSelectedTournament,
      onStartTournament: handleStartTournament,
      isStarting,
      onGoHome: handleGoHome
    };

    switch (currentTheme) {
      case 'neon':
        return <NeonTheme {...commonProps} />;
      case 'paper':
        return <PaperTheme {...commonProps} />;
      case 'comic':
        return <ComicTheme {...commonProps} />;
      case 'gaming':
        return <GamingTheme {...commonProps} />;
      case 'minimal':
      default:
        return <MinimalTheme {...commonProps} />;
    }
  };

  return (
    <div className="relative">
      {/* 테마 선택 드롭다운 */}
      <div className="fixed top-4 right-4 z-50">
        <div className="relative">
          <select
            value={currentTheme}
            onChange={(e) => setTheme(e.target.value as ThemeType)}
            className="bg-white/90 backdrop-blur-sm border-2 border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[200px]"
          >
            {themeOptions?.map(theme => (
              <option key={theme.id} value={theme.id}>
                {theme.name} - {theme.description}
              </option>
            )) || []}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* 테마별 컴포넌트 렌더링 */}
      {renderThemeComponent()}
    </div>
  );
}