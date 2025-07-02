'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { WorldCupItem, GameState } from '@/types/game';
import { createTournament, getCurrentMatch, selectWinner, getRoundName, getTournamentProgress, undoLastMatch, shuffleArray, autoAdvanceByes, isByeMatch } from '@/utils/tournament';
import { getWorldCupById } from '@/utils/storage';
import { getWorldCupById as getSupabaseWorldCupById } from '@/utils/supabaseData';
import GameProgress from '@/components/GameProgress';
import GameResult from '@/components/GameResult';
import TournamentSelector from '@/components/TournamentSelector';

// Dynamic import for heavy GameScreen component
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

// Mock data for testing
const _mockWorldCupData = {
  id: '1',
  title: '남자 아이돌 / 보이그룹 이상형 월드컵',
  description: '인기 남자 아이돌들의 최강자를 가려보세요!',
  items: [
    { id: '1', title: 'BTS 진', description: '방탄소년단 비주얼 담당' },
    { id: '2', title: 'BTS 뷔', description: '방탄소년단 비주얼' },
    { id: '3', title: '차은우', description: '아스트로 메인보컬' },
    { id: '4', title: '황민현', description: '뉴이스트 비주얼' },
    { id: '5', title: '강다니엘', description: '솔로 아티스트' },
    { id: '6', title: '박지훈', description: '솔로 아티스트' },
    { id: '7', title: '옹성우', description: '배우/가수' },
    { id: '8', title: '윤지성', description: '워너원 출신' },
    { id: '9', title: '민호', description: '샤이니 메인래퍼' },
    { id: '10', title: '태민', description: '샤이니 메인댄서' },
    { id: '11', title: '수호', description: 'EXO 리더' },
    { id: '12', title: '백현', description: 'EXO 메인보컬' },
    { id: '13', title: '카이', description: 'EXO 메인댄서' },
    { id: '14', title: '세훈', description: 'EXO 비주얼' },
    { id: '15', title: '태용', description: 'NCT 리더' },
    { id: '16', title: '재현', description: 'NCT 비주얼' },
    { id: '17', title: '마크', description: 'NCT 메인래퍼' },
    { id: '18', title: '해찬', description: 'NCT 메인보컬' },
    { id: '19', title: '지성', description: 'NCT 메인댄서' },
    { id: '20', title: '재민', description: 'NCT 비주얼' },
    { id: '21', title: '런쥔', description: 'NCT 메인보컬' },
    { id: '22', title: '천러', description: 'NCT 메인댄서' },
    { id: '23', title: '승관', description: '세븐틴 메인보컬' },
    { id: '24', title: '정한', description: '세븐틴 비주얼' },
    { id: '25', title: '조슈아', description: '세븐틴 서브보컬' },
    { id: '26', title: '준', description: '세븐틴 리드보컬' },
    { id: '27', title: '호시', description: '세븐틴 메인댄서' },
    { id: '28', title: '원우', description: '세븐틴 서브보컬' },
    { id: '29', title: '우지', description: '세븐틴 메인보컬' },
    { id: '30', title: '디케이', description: '세븐틴 메인래퍼' },
    { id: '31', title: '민규', description: '세븐틴 서브보컬' },
    { id: '32', title: '버논', description: '세븐틴 메인래퍼' },
    { id: '33', title: '디노', description: '세븐틴 메인댄서' },
    { id: '34', title: '에스쿱스', description: '세븐틴 리더' },
    { id: '35', title: '여호시', description: '세븐틴 퍼포먼스 리더' },
    { id: '36', title: '준휘', description: '세븐틴 리드보컬' },
    { id: '37', title: '명호', description: '세븐틴 메인댄서' },
    { id: '38', title: '도겸', description: '세븐틴 메인보컬' },
    { id: '39', title: '엔', description: '엔하이픈 리더' },
    { id: '40', title: '희승', description: '엔하이픈 비주얼' },
    { id: '41', title: '제이', description: '엔하이픈 리드댄서' },
    { id: '42', title: '제이크', description: '엔하이픈 서브보컬' },
    { id: '43', title: '성훈', description: '엔하이픈 메인댄서' },
    { id: '44', title: '선우', description: '엔하이픈 서브보컬' },
    { id: '45', title: '니키', description: '엔하이픈 메인댄서' },
    { id: '46', title: '윤기', description: 'BTS 메인래퍼' },
    { id: '47', title: '호석', description: 'BTS 메인댄서' },
    { id: '48', title: '남준', description: 'BTS 리더' },
    { id: '49', title: '정국', description: 'BTS 메인보컬' },
    { id: '50', title: '지민', description: 'BTS 메인댄서' },
    { id: '51', title: '찬', description: '스트레이 키즈 리더' },
    { id: '52', title: '리노', description: '스트레이 키즈 메인댄서' },
    { id: '53', title: '창빈', description: '스트레이 키즈 메인래퍼' },
    { id: '54', title: '현진', description: '스트레이 키즈 댄서' },
    { id: '55', title: '한', description: '스트레이 키즈 서브보컬' },
    { id: '56', title: '필릭스', description: '스트레이 키즈 리드댄서' },
    { id: '57', title: '승민', description: '스트레이 키즈 메인보컬' },
    { id: '58', title: '아이엔', description: '스트레이 키즈 서브보컬' },
    { id: '59', title: '연준', description: '투모로우바이투게더 리더' },
    { id: '60', title: '수빈', description: '투모로우바이투게더 비주얼' },
    { id: '61', title: '범규', description: '투모로우바이투게더 메인보컬' },
    { id: '62', title: '태현', description: '투모로우바이투게더 서브보컬' },
    { id: '63', title: '휴닝카이', description: '투모로우바이투게더 메인보컬' },
    { id: '64', title: '윤호', description: '아테즈 메인댄서' },
    { id: '65', title: '민기', description: '아테즈 메인래퍼' },
  ] as WorldCupItem[]
};

interface PlayPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PlayPage({ params }: PlayPageProps) {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTournamentSelector, setShowTournamentSelector] = useState(false);
  const [worldcupData, setWorldcupData] = useState<typeof mockWorldCupData | null>(null);
  const [worldcupId, setWorldcupId] = useState<string>('');

  useEffect(() => {
    const loadWorldCup = async () => {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        setWorldcupId(id);
        
        // 1. Supabase에서 먼저 찾기 (메인 소스)
        console.log('🔍 Loading worldcup from Supabase:', id);
        
        try {
          const supabaseWorldCup = await getSupabaseWorldCupById(id);
          
          console.log('📊 Supabase worldcup result:', {
            found: !!supabaseWorldCup,
            hasItems: supabaseWorldCup?.items?.length || 0
          });
          
          if (supabaseWorldCup && supabaseWorldCup.items && supabaseWorldCup.items.length > 0) {
            // Supabase 월드컵 데이터를 게임용 형식으로 변환
            const gameData = {
              id: supabaseWorldCup.id,
              title: supabaseWorldCup.title,
              description: supabaseWorldCup.description,
              items: supabaseWorldCup.items.map((item, index) => {
                // 이미지 URL 검증 및 로깅
                console.log(`🖼️ Processing item ${index + 1}:`, {
                  title: item.title,
                  originalImage: item.image,
                  isSupabaseUrl: item.image?.includes('supabase'),
                  isHttpUrl: item.image?.startsWith('http')
                });
                
                return {
                  id: item.id,
                  title: item.title,
                  description: item.description || '',
                  image: item.image, // Supabase Storage URL
                };
              }) as WorldCupItem[]
            };
            
            console.log('✅ Loaded Supabase worldcup for play:', {
              id: gameData.id,
              title: gameData.title,
              itemsCount: gameData.items.length
            });
            setWorldcupData(gameData);
            setShowTournamentSelector(true);
            setIsLoading(false);
            return;
          }
        } catch (supabaseError) {
          console.error('❌ Supabase error:', supabaseError);
        }
        
        // 2. localStorage에서 찾기 (fallback)
        console.log('🔍 Fallback to localStorage:', id);
        try {
          const storedWorldCup = getWorldCupById(id);
          
          if (storedWorldCup && storedWorldCup.items && storedWorldCup.items.length > 0) {
            const gameData = {
              id: storedWorldCup.id,
              title: storedWorldCup.title,
              description: storedWorldCup.description,
              items: storedWorldCup.items.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description || '',
                image: item.image,
              })) as WorldCupItem[]
            };
            
            console.log('✅ Loaded localStorage worldcup for play');
            setWorldcupData(gameData);
            setShowTournamentSelector(true);
            setIsLoading(false);
            return;
          }
        } catch (localStorageError) {
          console.error('❌ localStorage error:', localStorageError);
        }
        
        // 3. 월드컵을 찾을 수 없는 경우
        console.warn('⚠️ No worldcup found, redirecting to home');
        setIsLoading(false);
        router.push('/');
        return;
      } catch (error) {
        console.error('❌ Failed to load world cup:', error);
        setIsLoading(false);
        router.push('/');
      } finally {
        console.log('🏁 Finally block reached - setting isLoading to false');
        setIsLoading(false);
      }
    };

    loadWorldCup();
  }, [params, router]);

  const handleChoice = (winner: WorldCupItem) => {
    if (!gameState) return;

    const currentMatch = getCurrentMatch(gameState.tournament);
    if (!currentMatch) return;

    let updatedTournament = selectWinner(gameState.tournament, winner);
    
    // 🚀 선택 후 자동으로 BYE 매치들을 처리
    updatedTournament = autoAdvanceByes(updatedTournament);
    
    setGameState({
      ...gameState,
      tournament: updatedTournament,
      history: [...gameState.history, { ...currentMatch, winner, isCompleted: true }],
      canUndo: true,
    });
  };

  const handleUndo = () => {
    if (!gameState || !gameState.canUndo) return;

    const undoTournament = undoLastMatch(gameState.tournament);
    if (!undoTournament) return;

    // 히스토리에서 마지막 항목 제거
    const newHistory = gameState.history.slice(0, -1);
    
    setGameState({
      ...gameState,
      tournament: undoTournament,
      history: newHistory,
      canUndo: newHistory.length > 0,
    });
  };

  const handleRestart = () => {
    setGameState(null);
    setShowTournamentSelector(true);
  };

  const handleSelectTournament = () => {
    setShowTournamentSelector(true);
  };

  const handleTournamentSelect = (tournamentSize: number) => {
    if (!worldcupData) return;
    
    // 🎲 완전 랜덤 셔플로 선택된 토너먼트 크기에 맞게 아이템 수 조정
    const shuffledItems = shuffleArray([...worldcupData.items]);
    const selectedItems = shuffledItems.slice(0, tournamentSize);
    
    let tournament = createTournament(
      worldcupData.title,
      selectedItems,
      worldcupData.description
    );
    
    // 🚀 자동으로 BYE 매치들을 처리
    tournament = autoAdvanceByes(tournament);
    
    setGameState({
      tournament,
      history: [],
      canUndo: false,
      startTime: Date.now(),
    });
    setShowTournamentSelector(false);
  };

  const handleTournamentCancel = () => {
    router.push('/');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  if (isLoading) {
    console.log('🔄 Rendering loading screen - isLoading:', isLoading);
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">월드컵을 준비하고 있습니다...</p>
        </div>
      </div>
    );
  }

  console.log('🎯 Render check:', {
    isLoading,
    showTournamentSelector,
    hasWorldcupData: !!worldcupData,
    worldcupDataId: worldcupData?.id,
    gameState: !!gameState
  });

  if (showTournamentSelector && worldcupData) {
    console.log('🎯 Rendering TournamentSelector');
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
    console.log('🎯 Rendering no game state screen');
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

  // 🏆 현재 매치가 BYE 매치인 경우 자동 처리 (gameState가 있을 때만)
  useEffect(() => {
    if (!gameState) return;
    
    const currentMatch = getCurrentMatch(gameState.tournament);
    if (currentMatch) {
      const byeResult = isByeMatch(currentMatch);
      if (byeResult.isBye && byeResult.winner) {
        console.log(`🚀 Auto-processing BYE match: ${byeResult.winner.title}`);
        // 짧은 지연 후 자동 진행 (사용자가 볼 수 있도록)
        setTimeout(() => {
          handleChoice(byeResult.winner!);
        }, 1000);
      }
    }
  }, [gameState?.tournament.id, gameState?.tournament.currentMatch]);

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