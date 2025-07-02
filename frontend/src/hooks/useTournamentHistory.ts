import { useState, useCallback, useEffect } from 'react';
import { Tournament } from '@/types/game';

interface TournamentHistoryState {
  tournament: Tournament;
  timestamp: number;
  roundName: string;
  action: string;
}

interface UseTournamentHistoryOptions {
  maxHistorySize?: number;
  autoSaveInterval?: number;
  storageKey?: string;
}

export const useTournamentHistory = (
  initialTournament: Tournament,
  options: UseTournamentHistoryOptions = {}
) => {
  const {
    maxHistorySize = 50,
    autoSaveInterval = 5000, // 5 seconds
    storageKey = `tournament_history_${initialTournament.id}`
  } = options;

  const [history, setHistory] = useState<TournamentHistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentTournament, setCurrentTournament] = useState<Tournament>(initialTournament);

  // Initialize with the initial tournament state
  useEffect(() => {
    const initialState: TournamentHistoryState = {
      tournament: initialTournament,
      timestamp: Date.now(),
      roundName: '시작',
      action: 'tournament_start'
    };

    // Try to load from localStorage
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const { history: savedHistory, currentIndex: savedIndex } = JSON.parse(saved);
        if (savedHistory && savedHistory.length > 0) {
          setHistory(savedHistory);
          setCurrentIndex(savedIndex);
          setCurrentTournament(savedHistory[savedIndex]?.tournament || initialTournament);
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to load tournament history:', error);
    }

    // If no saved state, start fresh
    setHistory([initialState]);
    setCurrentIndex(0);
  }, [initialTournament, storageKey]);

  // Auto-save to localStorage
  useEffect(() => {
    if (history.length === 0) return;

    const saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          history,
          currentIndex
        }));
        console.log('✅ Tournament auto-saved');
      } catch (error) {
        console.error('❌ Failed to auto-save tournament:', error);
      }
    }, autoSaveInterval);

    return () => clearTimeout(saveTimer);
  }, [history, currentIndex, storageKey, autoSaveInterval]);

  // Add a new state to history
  const pushState = useCallback((
    tournament: Tournament, 
    action: string, 
    roundName: string
  ) => {
    const newState: TournamentHistoryState = {
      tournament: { ...tournament },
      timestamp: Date.now(),
      roundName,
      action
    };

    setHistory(prev => {
      // Remove any future states if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push(newState);
      
      // Trim history if it exceeds max size
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(-maxHistorySize);
      }
      
      return newHistory;
    });

    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, maxHistorySize - 1);
      return newIndex;
    });

    setCurrentTournament(tournament);
    
    console.log(`📝 Tournament state saved: ${action} (${roundName})`);
  }, [currentIndex, maxHistorySize]);

  // Undo to previous state
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const previousState = history[newIndex];
      
      setCurrentIndex(newIndex);
      setCurrentTournament(previousState.tournament);
      
      console.log(`⏪ Undo to: ${previousState.action} (${previousState.roundName})`);
      return previousState.tournament;
    }
    return null;
  }, [currentIndex, history]);

  // Redo to next state
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      const nextState = history[newIndex];
      
      setCurrentIndex(newIndex);
      setCurrentTournament(nextState.tournament);
      
      console.log(`⏩ Redo to: ${nextState.action} (${nextState.roundName})`);
      return nextState.tournament;
    }
    return null;
  }, [currentIndex, history]);

  // Jump to specific state
  const jumpToState = useCallback((index: number) => {
    if (index >= 0 && index < history.length) {
      const targetState = history[index];
      
      setCurrentIndex(index);
      setCurrentTournament(targetState.tournament);
      
      console.log(`🎯 Jump to: ${targetState.action} (${targetState.roundName})`);
      return targetState.tournament;
    }
    return null;
  }, [history]);

  // Clear history and reset
  const reset = useCallback(() => {
    const initialState: TournamentHistoryState = {
      tournament: initialTournament,
      timestamp: Date.now(),
      roundName: '시작',
      action: 'tournament_reset'
    };

    setHistory([initialState]);
    setCurrentIndex(0);
    setCurrentTournament(initialTournament);
    
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear tournament history from storage:', error);
    }
    
    console.log('🔄 Tournament history reset');
  }, [initialTournament, storageKey]);

  // Get current state info
  const getCurrentStateInfo = useCallback(() => {
    const currentState = history[currentIndex];
    return currentState ? {
      action: currentState.action,
      roundName: currentState.roundName,
      timestamp: currentState.timestamp,
      position: currentIndex + 1,
      total: history.length
    } : null;
  }, [history, currentIndex]);

  // Get history summary for UI
  const getHistorySummary = useCallback(() => {
    return history.map((state, index) => ({
      index,
      action: state.action,
      roundName: state.roundName,
      timestamp: state.timestamp,
      isCurrent: index === currentIndex,
      isAccessible: true // All states are accessible
    }));
  }, [history, currentIndex]);

  // Manual save
  const save = useCallback(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        history,
        currentIndex
      }));
      console.log('💾 Tournament manually saved');
      return true;
    } catch (error) {
      console.error('❌ Failed to save tournament:', error);
      return false;
    }
  }, [history, currentIndex, storageKey]);

  return {
    // Current state
    currentTournament,
    currentIndex,
    
    // Actions
    pushState,
    undo,
    redo,
    jumpToState,
    reset,
    save,
    
    // Queries
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    historyLength: history.length,
    getCurrentStateInfo,
    getHistorySummary,
    
    // Metadata
    isAutoSaveEnabled: autoSaveInterval > 0,
    maxHistorySize,
  };
};