'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { WorldCupItem, GameState } from '@/types/game';
import { createTournament, getCurrentMatch, selectWinner, getRoundName, getTournamentProgress, undoLastMatch, shuffleArray, autoAdvanceByes, isByeMatch } from '@/utils/tournament';
import { getWorldCupById } from '@/utils/storage';
import { getWorldCupById as getSupabaseWorldCupById } from '@/utils/supabaseData';

export function usePlayPageLogic(params: Promise<{ id: string; }> | { id: string; }) {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTournamentSelector, setShowTournamentSelector] = useState(false);
  const [worldcupData, setWorldcupData] = useState<any | null>(null);
  const [worldcupId, setWorldcupId] = useState<string>('');
  const [shouldRedirectToHome, setShouldRedirectToHome] = useState(false);

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
          const supabaseWorldCup = await getSupabaseWorldCupById(id);
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
        } catch (supabaseError) {
          console.error('❌ Supabase error:', supabaseError);
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
          setShowTournamentSelector(true);
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
  }, [params, router]);

  useEffect(() => {
    if (shouldRedirectToHome) {
      router.push('/');
    }
  }, [shouldRedirectToHome, router]);

  useEffect(() => {
    if (!gameState) return;
    
    const currentMatch = getCurrentMatch(gameState.tournament);
    if (currentMatch) {
      const byeResult = isByeMatch(currentMatch);
      if (byeResult.isBye && byeResult.winner) {
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
    handleChoice,
    handleUndo,
    handleRestart,
    handleSelectTournament,
    handleTournamentSelect,
    handleTournamentCancel,
    handleGoHome,
  };
}
