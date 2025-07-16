'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { WorldCupItem, GameState, TournamentSize } from '@/types/game';
import { createTournament, getCurrentMatch, selectWinner, getRoundName, getTournamentProgress, undoLastMatch, shuffleArray, autoAdvanceByes, isByeMatch } from '@/utils/tournament';
import { getWorldCupById } from '@/utils/storage';
import { YouTubeService } from '@/lib/youtube';

export function usePlayPageLogic(params: Promise<{ id: string; }> | { id: string; }) {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTournamentSelector, setShowTournamentSelector] = useState(false);
  const [worldcupData, setWorldcupData] = useState<any | null>(null);
  const [worldcupId, setWorldcupId] = useState<string>('');
  const [shouldRedirectToHome, setShouldRedirectToHome] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handleChoice = useCallback((winner: WorldCupItem) => {
    if (!gameState) return;

    const currentMatch = getCurrentMatch(gameState.tournament);
    if (!currentMatch) return;

    let updatedTournament = selectWinner(gameState.tournament, winner);
    updatedTournament = autoAdvanceByes(updatedTournament);
    
    setGameState({
      ...gameState,
      tournament: updatedTournament,
      history: [...gameState.history, { ...currentMatch, winner, isCompleted: true }],
      canUndo: true,
    });
  }, [gameState]);

  useEffect(() => {
    const loadWorldCup = async () => {
      try {
        // Handle params as Promise or direct object
        const resolvedParams = await Promise.resolve(params);
        const id = resolvedParams?.id;
        if (!id) {
          console.error('❌ No worldcup ID provided');
          setShouldRedirectToHome(true);
          return;
        }
        
        setWorldcupId(id);
        
        let loadedData = null;
        try {
          console.log('🔍 Loading worldcup from Supabase with ID:', id);
          setConnectionError(null); // 에러 초기화
          
          // API 데이터 로딩 로직 (재시도 최소화)
          let supabaseWorldCup = null;
          let attempts = 0;
          const maxAttempts = 3; // 무한 루프 방지를 위해 줄임
          const baseDelay = 500;
          
          while (attempts < maxAttempts && !supabaseWorldCup) {
            attempts++;
            try {
              console.log(`🔍 Attempt ${attempts}/${maxAttempts} to load worldcup...`);
              // API 방식으로 월드컵 데이터 로드
              const response = await fetch(`/api/worldcups/${id}`);
              if (response.ok) {
                const responseData = await response.json();
                supabaseWorldCup = responseData.worldcup; // API returns { worldcup: data }
              } else {
                throw new Error(`Failed to fetch worldcup: ${response.status}`);
              }
              
              if (supabaseWorldCup) {
                if (supabaseWorldCup.items && supabaseWorldCup.items.length > 0) {
                  console.log('✅ Successfully loaded worldcup with items:', supabaseWorldCup.items.length);
                  break;
                } else {
                  console.log('⚠️ Worldcup loaded but no items found');
                  // 아이템이 없는 경우에도 데이터를 받아들이고 종료 (무한 루프 방지)
                  if (attempts >= 2) {
                    console.log('⚠️ Accepting worldcup without items after retries');
                    break;
                  }
                  supabaseWorldCup = null; // 첫 번째 시도에서만 재시도
                }
              }
            } catch (error) {
              console.warn(`❌ Attempt ${attempts} failed:`, error);
              supabaseWorldCup = null;
            }
            
            if (attempts < maxAttempts) {
              const delay = baseDelay * Math.pow(1.5, attempts - 1); // 지수 백오프
              console.log(`⏱️ Waiting ${delay}ms before next attempt...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          
          console.log('📊 Final Supabase worldcup result:', supabaseWorldCup);
          
          if (supabaseWorldCup) {
            console.log('✅ Processing worldcup data:', {
              id: supabaseWorldCup.id,
              title: supabaseWorldCup.title,
              itemsCount: supabaseWorldCup.items?.length || 0
            });
            
            // 🔧 중요: supabaseData.ts에서 이미 변환된 데이터를 받으므로, 
            // 추가 변환 없이 그대로 사용하되 tournament 로직에 맞게 id만 조정
            loadedData = {
              id: supabaseWorldCup.id,
              title: supabaseWorldCup.title,
              description: supabaseWorldCup.description,
              items: (supabaseWorldCup.items || []).map(item => {
                console.log('✅ Already processed item from supabaseData:', {
                  title: item.title,
                  mediaType: item.mediaType,
                  hasVideoId: !!item.videoId,
                  hasVideoUrl: !!item.videoUrl,
                  data: {
                    videoId: item.videoId,
                    videoUrl: item.videoUrl,
                    videoStartTime: item.videoStartTime,
                    videoEndTime: item.videoEndTime
                  }
                });
                
                // 이미 처리된 데이터를 그대로 사용하되, tournament ID만 title로 설정
                return {
                  ...item,
                  id: item.title, // tournament 로직을 위해 title을 id로 사용
                  uuid: item.id, // 원본 UUID는 별도 보관
                } as WorldCupItem;
              })
            };
          }
        } catch (supabaseError: any) {
          console.error('❌ Supabase error after retries:', supabaseError);
          
          // 사용자 친화적인 에러 메시지 설정
          if (supabaseError.message?.includes('Failed to fetch') || 
              supabaseError.message?.includes('ERR_CONNECTION_CLOSED') ||
              supabaseError.message?.includes('ERR_NETWORK')) {
            setConnectionError('네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
          } else {
            setConnectionError('데이터를 불러오는 중 오류가 발생했습니다.');
          }
        }
        
        console.log('🔍 LoadedData after Supabase:', loadedData);
        
        if (!loadedData) {
          try {
            const storedWorldCup = getWorldCupById(id);
            if (storedWorldCup && storedWorldCup.items && storedWorldCup.items.length > 0) {
              loadedData = {
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
            }
          } catch (localStorageError) {
            console.error('❌ localStorage error:', localStorageError);
          }
        }
        
        if (loadedData) {
          // 아이템이 없는 경우 사용자에게 알림
          if (!loadedData.items || loadedData.items.length === 0) {
            console.warn('⚠️ Worldcup has no items, cannot start tournament');
            setConnectionError('이 월드컵에는 아이템이 없어서 게임을 시작할 수 없습니다.');
            setIsLoading(false);
            return;
          }
          
          setWorldcupData(loadedData);
          // Only show tournament selector if there's no existing game state
          if (!gameState) {
            console.log('🔄 Setting tournament selector to true (initial load)');
            setShowTournamentSelector(true);
          } else {
            console.log('⚠️ GameState exists, NOT showing tournament selector');
          }
        } else {
          setShouldRedirectToHome(true);
        }
      } catch (error) {
        console.error('❌ Failed to load world cup:', error);
        setShouldRedirectToHome(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorldCup();
  }, [params, router, gameState]);

  useEffect(() => {
    if (shouldRedirectToHome) {
      router.push('/');
    }
  }, [shouldRedirectToHome, router]);

  useEffect(() => {
    if (!gameState || gameState.tournament.isCompleted) return;
    
    const currentMatch = getCurrentMatch(gameState.tournament);
    if (currentMatch) {
      const byeResult = isByeMatch(currentMatch);
      if (byeResult.isBye && byeResult.winner) {
        console.log('🔄 Processing BYE match:', byeResult.winner.title);
        setTimeout(() => {
          handleChoice(byeResult.winner!);
        }, 1000);
      }
    }
  }, [gameState, handleChoice]);

  const handleUndo = () => {
    if (!gameState || !gameState.canUndo) return;

    const undoTournament = undoLastMatch(gameState.tournament);
    if (!undoTournament) return;

    const newHistory = gameState.history.slice(0, -1);
    
    setGameState({
      ...gameState,
      tournament: undoTournament,
      history: newHistory,
      canUndo: newHistory.length > 0,
    });
  };

  const handleRestart = () => {
    console.log('🚨 handleRestart called - this should NOT happen automatically after game completion!');
    console.trace('handleRestart call stack:');
    setGameState(null);
    setShowTournamentSelector(true);
  };

  const handleSelectTournament = () => {
    setShowTournamentSelector(true);
  };

  const handleTournamentSelect = (tournamentSize: number) => {
    if (!worldcupData) return;
    
    console.log('Tournament selected, size:', tournamentSize);
    
    // 기존 게임 상태 강제 초기화 (캐시된 상태 방지)
    setGameState(null);
    
    // localStorage에서 관련 데이터 정리
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('game') || key.includes('tournament'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('Cleaned localStorage keys count:', keysToRemove.length);
    } catch (error) {
      console.warn('Failed to clean localStorage:', error);
    }
    
    // 모든 아이템 (이미지 + 비디오) 합치기
    const allItems = [
      ...(worldcupData.items || []),
      ...(worldcupData.videoItems || [])
    ];
    
    const shuffledItems = shuffleArray([...allItems]);
    
    // 사용자가 선택한 토너먼트 크기 사용
    const targetTournamentSize: TournamentSize = tournamentSize as TournamentSize;
    console.log('Using tournament size:', targetTournamentSize);
    
    let tournament = createTournament(
      worldcupData.title,
      shuffledItems,
      worldcupData.description,
      targetTournamentSize
    );
    
    console.log('Created tournament - rounds:', tournament.totalRounds, 'items:', tournament.items.length);
    
    tournament = autoAdvanceByes(tournament);
    
    console.log('Final tournament after autoAdvanceByes - current round:', tournament.currentRound);
    
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

  return {
    router,
    gameState,
    isLoading,
    showTournamentSelector,
    worldcupData,
    worldcupId,
    connectionError,
    handleChoice,
    handleUndo,
    handleRestart,
    handleSelectTournament,
    handleTournamentSelect,
    handleTournamentCancel,
    handleGoHome,
  };
}
