'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorldCupItem, GameState, TournamentSize } from '@/types/game';
import { createTournament, getCurrentMatch, selectWinner, getRoundName, getTournamentProgress, undoLastMatch, shuffleArray } from '@/utils/tournament';
import { getWorldCupById } from '@/utils/storage';
import { Home, ArrowLeft, RotateCcw, ChevronRight, Trophy, Play, Eye } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// 테마별 스타일 정의
const themeStyles = {
  neon: {
    bg: 'bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900',
    text: 'text-cyan-400',
    accent: 'text-pink-400',
    card: 'bg-gray-900/50 border-cyan-400/50',
    button: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    winner: 'border-4 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]',
    winnerText: 'text-cyan-400',
    glow: 'shadow-[0_0_30px_rgba(34,211,238,0.3)]'
  },
  paper: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-100',
    text: 'text-amber-800',
    accent: 'text-orange-600',
    card: 'bg-white border-amber-300',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
    winner: 'border-4 border-amber-500 shadow-lg',
    winnerText: 'text-amber-700',
    glow: 'shadow-md'
  },
  comic: {
    bg: 'bg-gradient-to-br from-blue-100 to-purple-100',
    text: 'text-purple-800',
    accent: 'text-blue-600',
    card: 'bg-white border-purple-300',
    button: 'bg-purple-600 hover:bg-purple-700 text-white',
    winner: 'border-4 border-purple-500 shadow-lg',
    winnerText: 'text-purple-700',
    glow: 'shadow-md'
  },
  minimal: {
    bg: 'bg-gradient-to-br from-gray-50 to-white',
    text: 'text-gray-800',
    accent: 'text-gray-600',
    card: 'bg-white border-gray-300',
    button: 'bg-gray-800 hover:bg-gray-900 text-white',
    winner: 'border-4 border-gray-800 shadow-lg',
    winnerText: 'text-gray-800',
    glow: 'shadow-md'
  },
  gaming: {
    bg: 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900',
    text: 'text-white',
    accent: 'text-purple-400',
    card: 'bg-gray-800/50 border-purple-400/50',
    button: 'bg-purple-600 hover:bg-purple-700 text-white',
    winner: 'border-4 border-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.5)]',
    winnerText: 'text-purple-400',
    glow: 'shadow-[0_0_30px_rgba(147,51,234,0.3)]'
  }
};

interface TournamentGameProps {
  params: Promise<{
    id: string;
  }>;
}

interface VoteStats {
  option1: number;
  option2: number;
  total: number;
}

export default function TournamentGamePage({ params }: TournamentGameProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [worldcupId, setWorldcupId] = useState<string>('');
  const [theme, setTheme] = useState<string>('minimal');
  const [tournamentSize, setTournamentSize] = useState<number>(16);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [worldcupData, setWorldcupData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<WorldCupItem | null>(null);
  const [voteStats, setVoteStats] = useState<VoteStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // 키보드 이벤트 핸들러
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isProcessing || !gameState) return;
      
      const currentMatch = getCurrentMatch(gameState.tournament);
      if (!currentMatch) return;

      switch (e.key) {
        case 'ArrowLeft':
        case '1':
          e.preventDefault();
          handleChoice(currentMatch.item1);
          break;
        case 'ArrowRight':
        case '2':
          e.preventDefault();
          handleChoice(currentMatch.item2);
          break;
        case 'u':
        case 'U':
          e.preventDefault();
          handleUndo();
          break;
        case 'Escape':
          e.preventDefault();
          handleGoHome();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, isProcessing]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        setWorldcupId(id);

        // URL 파라미터에서 테마와 토너먼트 크기 가져오기
        const themeParam = searchParams.get('theme') || 'minimal';
        const tournamentParam = searchParams.get('tournament') || '16';
        
        setTheme(themeParam);
        setTournamentSize(parseInt(tournamentParam));

        // 월드컵 데이터 로드
        const response = await fetch(`/api/worldcups/${id}`);
        if (!response.ok) {
          throw new Error('월드컵 데이터를 불러올 수 없습니다.');
        }
        
        const data = await response.json();
        setWorldcupData(data.worldcup);

        // API 응답의 items 구조를 게임에 맞게 변환
        const gameItems: WorldCupItem[] = (data.worldcup.items || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          image_url: item.image || item.image_url, // API에서 image로 오는 것을 image_url로 변환
          is_bye: false,
          uuid: item.id,
          mediaType: item.mediaType || 'image',
          ...(item.mediaType === 'video' && {
            videoUrl: item.videoUrl,
            videoId: item.videoId,
            videoStartTime: item.videoStartTime,
            videoEndTime: item.videoEndTime,
            videoThumbnail: item.videoThumbnail,
            videoDuration: item.videoDuration,
            videoMetadata: item.videoMetadata
          })
        }));

        // 게임 상태 초기화 - 올바른 파라미터 순서
        const tournament = createTournament(
          data.worldcup.title,
          gameItems,
          data.worldcup.description,
          parseInt(tournamentParam) as TournamentSize
        );

        setGameState({
          tournament,
          history: [],
          canUndo: false,
          startTime: Date.now()
        });

      } catch (err) {
        console.error('Failed to load game data:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params, searchParams]);

  const handleChoice = async (winner: WorldCupItem) => {
    if (!gameState || isProcessing) return;
    
    setIsProcessing(true);
    setSelectedItem(winner);
    
    try {
      // 투표 통계 시뮬레이션 (실제로는 API 호출)
      const stats = {
        option1: Math.floor(Math.random() * 100) + 20,
        option2: Math.floor(Math.random() * 100) + 20,
        total: 0
      };
      stats.total = stats.option1 + stats.option2;
      setVoteStats(stats);
      setShowStats(true);
      
      // 실제 투표 API 호출
      const currentMatch = getCurrentMatch(gameState.tournament);
      await fetch(`/api/worldcups/${worldcupId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          winnerId: winner.id,
          loserId: currentMatch ? (currentMatch.item1.id === winner.id ? currentMatch.item2.id : currentMatch.item1.id) : null
        })
      });
      
      // 잠시 대기 후 다음 라운드로
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 게임 상태 업데이트
      const newTournament = selectWinner(gameState.tournament, winner);
      setGameState({
        ...gameState,
        tournament: newTournament,
        canUndo: true
      });
      
      // 상태 초기화
      setSelectedItem(null);
      setVoteStats(null);
      setShowStats(false);
      
    } catch (error) {
      console.error('Choice processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndo = () => {
    if (!gameState || !gameState.canUndo) return;
    
    const newTournament = undoLastMatch(gameState.tournament);
    if (newTournament) {
      setGameState({
        ...gameState,
        tournament: newTournament,
        canUndo: newTournament.matches.some(m => m.isCompleted)
      });
    }
    setSelectedItem(null);
    setVoteStats(null);
    setShowStats(false);
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleRestart = () => {
    if (!worldcupData) return;
    
    // worldcupData.items 구조를 게임에 맞게 변환
    const gameItems: WorldCupItem[] = (worldcupData.items || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      image_url: item.image || item.image_url,
      is_bye: false,
      uuid: item.id,
      mediaType: item.mediaType || 'image',
      ...(item.mediaType === 'video' && {
        videoUrl: item.videoUrl,
        videoId: item.videoId,
        videoStartTime: item.videoStartTime,
        videoEndTime: item.videoEndTime,
        videoThumbnail: item.videoThumbnail,
        videoDuration: item.videoDuration,
        videoMetadata: item.videoMetadata
      })
    }));
    
    const tournament = createTournament(
      worldcupData.title,
      gameItems,
      worldcupData.description,
      tournamentSize as TournamentSize
    );

    setGameState({
      tournament,
      history: [],
      canUndo: false,
      startTime: Date.now()
    });
    
    setSelectedItem(null);
    setVoteStats(null);
    setShowStats(false);
  };

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

  if (!gameState || !worldcupData) {
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

  const currentTheme = themeStyles[theme as keyof typeof themeStyles] || themeStyles.minimal;
  const currentMatch = getCurrentMatch(gameState.tournament);
  const progress = getTournamentProgress(gameState.tournament);
  const roundName = getRoundName(gameState.tournament.currentRound, gameState.tournament.totalRounds);

  // 게임 완료 시 결과 화면으로 이동
  if (gameState.tournament.isCompleted) {
    const playTime = Date.now() - gameState.startTime;
    const resultUrl = `/tournament-result/${worldcupId}?theme=${theme}&playTime=${playTime}&winner=${gameState.tournament.winner?.id}`;
    router.push(resultUrl);
    return null;
  }

  if (!currentMatch) {
    return (
      <div className={`min-h-screen ${currentTheme.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-6xl mb-6">🏆</div>
          <h1 className={`text-2xl font-bold ${currentTheme.text} mb-4`}>잠시 후 결과를 확인해주세요</h1>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.bg}`}>
      {/* 헤더 */}
      <header className="p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* 왼쪽 */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGoHome}
              className={`p-2 rounded-lg ${currentTheme.button} transition-colors`}
            >
              <Home className="w-5 h-5" />
            </button>
            <div className={`text-lg font-semibold ${currentTheme.text}`}>
              {roundName}
            </div>
          </div>

          {/* 중앙 - 프로그레스 바 */}
          <div className="flex-1 max-w-md mx-8">
            <div className="flex items-center space-x-2 mb-1">
              <span className={`text-sm ${currentTheme.accent}`}>진행률</span>
              <span className={`text-sm font-semibold ${currentTheme.text}`}>
                {Math.round(progress.percentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          {/* 오른쪽 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleUndo}
              disabled={!gameState.canUndo}
              className={`p-2 rounded-lg ${
                gameState.canUndo
                  ? currentTheme.button
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              } transition-colors`}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handleRestart}
              className={`p-2 rounded-lg ${currentTheme.button} transition-colors`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 라운드 정보 */}
        <div className="max-w-6xl mx-auto text-center mt-2">
          <div className={`text-sm ${currentTheme.accent}`}>
            {gameState.tournament.currentRound}라운드 {gameState.tournament.currentMatch + 1}번째 매치
          </div>
        </div>
      </header>

      {/* 메인 게임 영역 */}
      <main className="p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold ${currentTheme.text} mb-2`}>
              {worldcupData.title}
            </h1>
            <p className={`text-lg ${currentTheme.accent}`}>
              어느 쪽이 더 마음에 드시나요?
            </p>
          </div>

          {/* VS 매치 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            {/* 선택지 1 */}
            <motion.div
              className={`relative cursor-pointer transition-all duration-300 ${
                selectedItem?.id === currentMatch.item1.id
                  ? `${currentTheme.winner} ${currentTheme.glow}`
                  : `${currentTheme.card} border-2 hover:scale-105`
              } rounded-xl overflow-hidden`}
              onClick={() => !isProcessing && handleChoice(currentMatch.item1)}
              whileHover={{ scale: isProcessing ? 1 : 1.02 }}
              whileTap={{ scale: isProcessing ? 1 : 0.98 }}
            >
              <div className="aspect-square relative">
                {currentMatch.item1.image_url ? (
                  <Image
                    src={currentMatch.item1.image_url}
                    alt={currentMatch.item1.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${currentTheme.bg}`}>
                    <span className={`text-xl ${currentTheme.text}`}>이미지 없음</span>
                  </div>
                )}
                
                {/* WINNER 표시 */}
                {selectedItem?.id === currentMatch.item1.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className={`text-4xl font-bold ${currentTheme.winnerText}`}>
                      WINNER
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className={`text-xl font-semibold ${currentTheme.text} text-center`}>
                  {currentMatch.item1.title}
                </h3>
                <div className={`text-center mt-2 ${currentTheme.accent}`}>
                  <kbd className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm">←</kbd>
                  <span className="ml-2">또는</span>
                  <kbd className="ml-2 px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm">1</kbd>
                </div>
              </div>
            </motion.div>

            {/* VS 표시 */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
              <div className={`w-16 h-16 rounded-full ${currentTheme.card} border-4 ${currentTheme.text} flex items-center justify-center text-2xl font-bold`}>
                VS
              </div>
            </div>

            {/* 선택지 2 */}
            <motion.div
              className={`relative cursor-pointer transition-all duration-300 ${
                selectedItem?.id === currentMatch.item2.id
                  ? `${currentTheme.winner} ${currentTheme.glow}`
                  : `${currentTheme.card} border-2 hover:scale-105`
              } rounded-xl overflow-hidden`}
              onClick={() => !isProcessing && handleChoice(currentMatch.item2)}
              whileHover={{ scale: isProcessing ? 1 : 1.02 }}
              whileTap={{ scale: isProcessing ? 1 : 0.98 }}
            >
              <div className="aspect-square relative">
                {currentMatch.item2.image_url ? (
                  <Image
                    src={currentMatch.item2.image_url}
                    alt={currentMatch.item2.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${currentTheme.bg}`}>
                    <span className={`text-xl ${currentTheme.text}`}>이미지 없음</span>
                  </div>
                )}
                
                {/* WINNER 표시 */}
                {selectedItem?.id === currentMatch.item2.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className={`text-4xl font-bold ${currentTheme.winnerText}`}>
                      WINNER
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className={`text-xl font-semibold ${currentTheme.text} text-center`}>
                  {currentMatch.item2.title}
                </h3>
                <div className={`text-center mt-2 ${currentTheme.accent}`}>
                  <kbd className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm">→</kbd>
                  <span className="ml-2">또는</span>
                  <kbd className="ml-2 px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm">2</kbd>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 투표 통계 (선택 후 표시) */}
          <AnimatePresence>
            {showStats && voteStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 text-center"
              >
                <div className={`inline-block p-4 rounded-lg ${currentTheme.card} border-2`}>
                  <h4 className={`text-lg font-semibold ${currentTheme.text} mb-2`}>
                    다른 사람들의 선택
                  </h4>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${currentTheme.accent}`}>
                        {Math.round((voteStats.option1 / voteStats.total) * 100)}%
                      </div>
                      <div className={`text-sm ${currentTheme.text}`}>
                        {currentMatch.item1.title}
                      </div>
                    </div>
                    <div className={`text-xl ${currentTheme.text}`}>vs</div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${currentTheme.accent}`}>
                        {Math.round((voteStats.option2 / voteStats.total) * 100)}%
                      </div>
                      <div className={`text-sm ${currentTheme.text}`}>
                        {currentMatch.item2.title}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 로딩 상태 */}
          {isProcessing && (
            <div className="text-center mt-8">
              <div className={`inline-flex items-center space-x-2 ${currentTheme.text}`}>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                <span>다음 매치를 준비하는 중...</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 키보드 단축키 안내 */}
      <div className="fixed bottom-4 right-4 p-3 bg-black/50 text-white rounded-lg text-sm">
        <div>키보드 단축키:</div>
        <div>← / 1: 왼쪽 선택 | → / 2: 오른쪽 선택</div>
        <div>U: 되돌리기 | ESC: 홈으로</div>
      </div>
    </div>
  );
}