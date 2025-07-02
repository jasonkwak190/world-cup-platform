'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { usePlayPageLogic } from '@/hooks/usePlayPageLogic';
import GameProgress from '@/components/GameProgress';
import GameResult from '@/components/GameResult';
import { getTournamentProgress, getRoundName, getCurrentMatch } from '@/utils/tournament';
import TournamentSelector from '@/components/TournamentSelector';

const GameScreen = dynamic(() => import('@/components/GameScreen'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">게임 화면 로딩 중...</p>
      </div>
    </div>
  ),
});

interface PlayPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PlayPage({ params: paramsPromise }: PlayPageProps) {
  const params = React.use(paramsPromise);

  const {
    gameState,
    isLoading,
    showTournamentSelector,
    worldcupData,
    worldcupId,
    handleChoice,
    handleUndo,
    handleRestart,
    handleSelectTournament,
    handleTournamentSelect,
    handleTournamentCancel,
    handleGoHome,
  } = usePlayPageLogic(params);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">월드컵 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">월드컵을 준비하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (showTournamentSelector && worldcupData) {
    return (
      <TournamentSelector
        worldcupTitle={worldcupData.title}
        totalItems={worldcupData.items.length}
        onSelect={handleTournamentSelect}
        onCancel={handleTournamentCancel}
      />
    );
  }

  if (!gameState) {
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

  const { tournament } = gameState;
  const currentMatch = getCurrentMatch(tournament);
  const progress = getTournamentProgress(tournament);

  if (tournament.isCompleted) {
    return (
      <GameResult
        tournament={tournament}
        onRestart={handleRestart}
        onGoHome={handleGoHome}
        playTime={gameState.endTime ? gameState.endTime - gameState.startTime : Date.now() - gameState.startTime}
        worldcupId={worldcupId}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <GameProgress
        tournament={tournament}
        progress={progress}
        onUndo={handleUndo}
        canUndo={gameState.canUndo}
        onGoHome={handleGoHome}
        onSelectTournament={handleSelectTournament}
      />
      
      {currentMatch && (
        <GameScreen
          match={currentMatch}
          roundName={getRoundName(tournament.currentRound, tournament.totalRounds)}
          round={tournament.currentRound}
          totalRounds={tournament.totalRounds}
          onChoice={handleChoice}
        />
      )}
    </div>
  );
}