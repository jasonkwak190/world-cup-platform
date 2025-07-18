'use client';

import React, { Suspense } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useGameLogic } from './hooks/useGameLogic';
import {
  NeonGameTheme,
  PaperGameTheme,
  ComicGameTheme,
  MinimalGameTheme,
  GamingGameTheme
} from './components/themes';

interface TournamentGameProps {
  params: Promise<{
    id: string;
  }>;
}

function TournamentGameContent({ worldcupId }: { worldcupId: string }) {
  const { currentTheme } = useTheme();
  
  const {
    // State
    gameState,
    worldcupData,
    loading,
    error,
    
    // UI State
    selectedItem,
    voteStats,
    isProcessing,
    showStats,
    
    // Game Data
    currentMatch,
    progress,
    roundName,
    canUndo,
    
    // Actions
    handleChoice,
    handleUndo,
    handleRestart,
    handleGoHome,
    handleSelectOtherTournament
  } = useGameLogic({ worldcupId });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">게임을 준비하는 중...</p>
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

  if (!gameState || !worldcupData || !currentMatch || !progress) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">게임 데이터를 불러올 수 없습니다</h1>
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

  // Common props for all theme components
  const themeProps = {
    worldcupData,
    gameState,
    currentMatch,
    selectedItem,
    voteStats,
    showStats,
    isProcessing,
    canUndo,
    onChoice: handleChoice,
    onUndo: handleUndo,
    onRestart: handleRestart,
    onHome: handleGoHome,
    onSelectOtherTournament: handleSelectOtherTournament,
    progress,
    roundName
  };

  // Render appropriate theme component
  switch (currentTheme) {
    case 'neon':
      return <NeonGameTheme {...themeProps} />;
    case 'paper':
      return <PaperGameTheme {...themeProps} />;
    case 'comic':
      return <ComicGameTheme {...themeProps} />;
    case 'minimal':
      return <MinimalGameTheme {...themeProps} />;
    case 'gaming':
      return <GamingGameTheme {...themeProps} />;
    default:
      return <MinimalGameTheme {...themeProps} />;
  }
}

function TournamentGameWrapper({ params }: TournamentGameProps) {
  const [worldcupId, setWorldcupId] = React.useState<string>('');

  React.useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setWorldcupId(resolvedParams.id);
    };
    loadParams();
  }, [params]);

  if (!worldcupId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">로딩 중...</p>
        </div>
      </div>
    );
  }

  return <TournamentGameContent worldcupId={worldcupId} />;
}

export default function TournamentGamePage({ params }: TournamentGameProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">로딩 중...</p>
        </div>
      </div>
    }>
      <TournamentGameWrapper params={params} />
    </Suspense>
  );
}