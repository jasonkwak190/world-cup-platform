'use client';

import { useEffect, useCallback } from 'react';
import { useActionAutoSave, useCreateSaveFunction } from './useActionAutoSave';
import { useDraftRestore, isUserAuthenticated } from './useDraftRestore';
import { GameState } from '@/types/game';
import { useAuth } from '@/contexts/AuthContext';

interface PlayProgressData {
  worldcup_id: string;
  current_round: number;
  total_rounds: number;
  bracket_state: any;
  remaining_items: any[];
  selected_items: any[];
  round_history: any[];
}

interface UsePlayAutoSaveOptions {
  worldcupId: string;
  gameState: GameState | null;
  enabled?: boolean;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  onRestoreSuccess?: (data: any) => void;
}

export function usePlayAutoSave(options: UsePlayAutoSaveOptions) {
  const { 
    worldcupId, 
    gameState, 
    enabled = true, 
    onSaveSuccess, 
    onSaveError, 
    onRestoreSuccess 
  } = options;
  
  const { user } = useAuth();
  const isAuthenticated = isUserAuthenticated(user);

  // Create save function
  const saveFunction = useCreateSaveFunction('worldcup_play');

  // Convert game state to save data
  const createSaveData = useCallback((state: GameState): PlayProgressData => {
    // Null safety checks
    if (!state?.tournament) {
      throw new Error('Invalid game state: tournament is missing');
    }

    const tournament = state.tournament;
    const matches = tournament.matches || [];
    
    // Get current round matches to determine remaining items (with safety checks)
    const currentRoundMatches = matches.filter(match => 
      match && 
      typeof match.round === 'number' && 
      typeof match.isCompleted === 'boolean' &&
      match.round === tournament.currentRound && 
      !match.isCompleted
    );
    
    // Get completed matches to determine selected items (winners)
    const completedMatches = matches.filter(match => 
      match && 
      typeof match.isCompleted === 'boolean' &&
      match.isCompleted
    );
    
    const selectedItems = completedMatches
      .filter(match => match && match.winner)
      .map(match => match.winner)
      .filter(winner => winner); // Additional safety filter

    // Get remaining items from current round matches
    const remainingItems = currentRoundMatches.flatMap(match => {
      if (!match) return [];
      const items = [];
      if (match.item1) items.push(match.item1);
      if (match.item2) items.push(match.item2);
      return items;
    });

    return {
      worldcup_id: worldcupId,
      current_round: tournament.currentRound || 0,
      total_rounds: tournament.totalRounds || 0,
      bracket_state: {
        currentRound: tournament.currentRound || 0,
        totalRounds: tournament.totalRounds || 0,
        currentMatch: tournament.currentMatch || 0,
        items: tournament.items || [],
        matches: matches,
        isCompleted: tournament.isCompleted || false,
        winner: tournament.winner || null
      },
      remaining_items: remainingItems,
      selected_items: selectedItems,
      round_history: state.history || []
    };
  }, [worldcupId]);

  // Prepare data for saving
  const saveData = gameState ? createSaveData(gameState) : null;

  // Auto-save hook (only for authenticated users)
  const autoSave = useActionAutoSave(
    saveData,
    saveFunction,
    {
      enabled: enabled && isAuthenticated && !!gameState && !gameState.tournament.isCompleted,
      debounceMs: 300, // Quick save for game actions
      onSaveSuccess,
      onSaveError
    }
  );

  // Draft restore hook (only for authenticated users)
  const draftRestore = useDraftRestore({
    type: 'worldcup_play',
    worldcupId,
    autoCheck: enabled && isAuthenticated
  });

  // Trigger save on specific game actions (only for authenticated users)
  const saveOnAction = useCallback((action: 'match_completed' | 'round_completed' | 'game_paused') => {
    if (!isAuthenticated) {
      console.log('🎮 Autosave skipped - user not authenticated');
      return;
    }
    console.log(`🎮 Triggering autosave on action: ${action}`);
    autoSave.triggerSave(action === 'game_paused'); // Immediate save when pausing
  }, [autoSave, isAuthenticated]);

  // Manual save function (only for authenticated users)
  const saveProgress = useCallback(() => {
    if (!isAuthenticated) {
      console.log('🎮 Manual save skipped - user not authenticated');
      return;
    }
    console.log('🎮 Manual save triggered');
    autoSave.manualSave();
  }, [autoSave, isAuthenticated]);

  // Restore progress function
  const restoreProgress = useCallback(async () => {
    console.log('🎮 Attempting to restore play progress');
    const restored = await draftRestore.restoreDraft();
    if (restored && onRestoreSuccess) {
      onRestoreSuccess(restored);
    }
    return restored;
  }, [draftRestore, onRestoreSuccess]);

  // Delete save when game is completed
  const deleteSaveOnCompletion = useCallback(async () => {
    if (gameState?.tournament.isCompleted) {
      console.log('🎮 Game completed, deleting autosave');
      await draftRestore.deleteDraft();
    }
  }, [gameState?.tournament.isCompleted, draftRestore]);

  // Auto-delete save when game completes
  useEffect(() => {
    if (gameState?.tournament.isCompleted) {
      // Small delay to ensure any final saves are completed
      const timer = setTimeout(deleteSaveOnCompletion, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState?.tournament.isCompleted, deleteSaveOnCompletion]);

  // Save on page unload (only for authenticated users)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isAuthenticated && gameState && !gameState.tournament.isCompleted) {
        console.log('🎮 Page unload detected, triggering final save');
        saveProgress();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [gameState, saveProgress, isAuthenticated]);

  return {
    // Auto-save status
    saveStatus: autoSave.saveStatus,
    lastSaved: autoSave.lastSaved,
    isSaving: autoSave.isSaving,
    hasError: autoSave.hasError,
    
    // Manual controls
    saveProgress,
    saveOnAction,
    
    // Restore functionality
    hasDraft: draftRestore.hasDraft,
    isRestoring: draftRestore.isRestoring,
    restoreProgress,
    draftData: draftRestore.draftData,
    
    // Cleanup
    deleteSave: draftRestore.deleteDraft,
    refreshDraft: draftRestore.refreshDraft,
    
    // Combined status
    isEnabled: autoSave.isEnabled && isAuthenticated,
    isAuthenticated,
    error: draftRestore.error || (autoSave.hasError ? 'Save failed' : null)
  };
}