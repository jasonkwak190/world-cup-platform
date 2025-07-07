'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { WorldCupItem, GameState } from '@/types/game';
import { createTournament, getCurrentMatch, selectWinner, getRoundName, getTournamentProgress, undoLastMatch, shuffleArray, autoAdvanceByes, isByeMatch } from '@/utils/tournament';
import { getWorldCupById } from '@/utils/storage';
import { getWorldCupById as getSupabaseWorldCupById } from '@/utils/supabaseData';
import { withRetry } from '@/utils/supabaseConnection';

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
          
          const supabaseWorldCup = await withRetry(
            () => getSupabaseWorldCupById(id),
            `Loading worldcup ${id}`
          );
          
          console.log('📊 Supabase worldcup result:', supabaseWorldCup);
          
          if (supabaseWorldCup && supabaseWorldCup.items && supabaseWorldCup.items.length > 0) {
            console.log('✅ Supabase worldcup has items:', supabaseWorldCup.items.length);
            loadedData = {
              id: supabaseWorldCup.id,
              title: supabaseWorldCup.title,
              description: supabaseWorldCup.description,
              items: supabaseWorldCup.items.map(item => ({
                id: item.title, // Use title as id for consistency with tournament logic
                title: item.title,
                description: item.description || '',
                image: item.image,
                uuid: item.id, // Store actual UUID for database operations
              })) as WorldCupItem[]
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
    
    const shuffledItems = shuffleArray([...worldcupData.items]);
    const selectedItems = shuffledItems.slice(0, tournamentSize);
    
    let tournament = createTournament(
      worldcupData.title,
      selectedItems,
      worldcupData.description
    );
    
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
