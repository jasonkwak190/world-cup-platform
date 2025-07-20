'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorldCupItem, GameState, TournamentSize } from '@/types/game';
import { 
  createTournament, 
  getCurrentMatch, 
  selectWinner, 
  getRoundName, 
  getTournamentProgress, 
  undoLastMatch 
} from '@/utils/tournament';
import { VoteStats, WorldCupData, ItemPercentage } from '../components/themes/types';

interface UseGameLogicProps {
  worldcupId: string;
}

export function useGameLogic({ worldcupId }: UseGameLogicProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [worldcupData, setWorldcupData] = useState<WorldCupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // UI state
  const [selectedItem, setSelectedItem] = useState<WorldCupItem | null>(null);
  const [voteStats, setVoteStats] = useState<VoteStats | null>(null);
  const [itemPercentages, setItemPercentages] = useState<ItemPercentage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [winStreaks, setWinStreaks] = useState<Map<string, number>>(new Map());
  
  // Theme and tournament settings
  const [theme, setTheme] = useState<string>('minimal');
  const [tournamentSize, setTournamentSize] = useState<number>(16);

  // Function to fetch item statistics and calculate percentages
  const fetchItemPercentages = useCallback(async (items: WorldCupItem[]) => {
    try {
      const response = await fetch(`/api/worldcup/${worldcupId}/stats`);
      if (!response.ok) {
        console.warn('Failed to fetch item stats, using fallback percentages');
        // Fallback to random percentages if API fails
        return items.map(item => ({
          itemId: item.id,
          percentage: Math.random() * 100
        }));
      }
      
      const statsData = await response.json();
      const itemStats = statsData.items || [];
      
      // Calculate percentages based on win rate from database
      const percentages: ItemPercentage[] = items.map(item => {
        const stats = itemStats.find((stat: any) => stat.id === item.id);
        if (stats && (stats.win_count > 0 || stats.loss_count > 0)) {
          // Use database win rate
          return {
            itemId: item.id,
            percentage: stats.win_rate || 0
          };
        } else {
          // Fallback percentage for items with no stats
          return {
            itemId: item.id,
            percentage: 50 // Default 50% for items with no history
          };
        }
      });
      
      return percentages;
    } catch (error) {
      console.error('Error fetching item percentages:', error);
      // Fallback to random percentages
      return items.map(item => ({
        itemId: item.id,
        percentage: Math.random() * 100
      }));
    }
  }, [worldcupId]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get theme and tournament size from URL params
        const themeParam = searchParams.get('theme') || 'minimal';
        const tournamentParam = searchParams.get('tournament') || '16';
        
        setTheme(themeParam);
        setTournamentSize(parseInt(tournamentParam));

        // Load worldcup data
        const response = await fetch(`/api/worldcups/${worldcupId}`);
        if (!response.ok) {
          throw new Error('월드컵 데이터를 불러올 수 없습니다.');
        }
        
        const data = await response.json();
        const worldcup = data.worldcup;
        
        setWorldcupData({
          id: worldcup.id,
          title: worldcup.title,
          description: worldcup.description,
          items: worldcup.items,
          creator_name: worldcup.creator_name,
          created_at: worldcup.created_at
        });

        // Convert API items to game items
        const gameItems: WorldCupItem[] = (worldcup.items || []).map((item: any) => ({
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

        // Initialize tournament
        const tournament = createTournament(
          worldcup.title,
          gameItems,
          worldcup.description,
          parseInt(tournamentParam) as TournamentSize
        );

        setGameState({
          tournament,
          history: [],
          canUndo: false,
          startTime: Date.now()
        });

        // Initialize win streaks
        setWinStreaks(new Map());

      } catch (err) {
        console.error('Failed to load game data:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (worldcupId) {
      loadData();
    }
  }, [worldcupId, searchParams]);

  // Handle choice selection
  const handleChoice = useCallback(async (winner: WorldCupItem) => {
    if (!gameState || isProcessing) return;
    
    setIsProcessing(true);
    setSelectedItem(winner);
    
    try {
      const rawMatch = getCurrentMatch(gameState.tournament);
      
      // Fetch item percentages for both items in the current match
      if (rawMatch) {
        const matchItems = [rawMatch.item1, rawMatch.item2];
        const percentages = await fetchItemPercentages(matchItems);
        setItemPercentages(percentages);
      }
      
      // Simulate vote stats (in real app, this would come from API)
      const leftVotes = Math.floor(Math.random() * 100) + 20;
      const rightVotes = Math.floor(Math.random() * 100) + 20;
      const totalVotes = leftVotes + rightVotes;
      
      const isLeftWinner = rawMatch?.item1.id === winner.id;
      
      const stats: VoteStats = {
        leftPercentage: (leftVotes / totalVotes) * 100,
        rightPercentage: (rightVotes / totalVotes) * 100,
        totalVotes
      };
      
      setVoteStats(stats);
      setShowStats(true);
      
      // API call for voting
      try {
        await fetch(`/api/worldcups/${worldcupId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            winnerId: winner.id,
            loserId: rawMatch ? (isLeftWinner ? rawMatch.item2.id : rawMatch.item1.id) : null
          })
        });
      } catch (apiError) {
        console.warn('Vote API call failed:', apiError);
        // Continue with local game logic even if API fails
      }
      
      // Wait before proceeding
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update win streaks
      const loser = rawMatch ? (isLeftWinner ? rawMatch.item2 : rawMatch.item1) : null;
      setWinStreaks(prevStreaks => {
        const newStreaks = new Map(prevStreaks);
        
        // Increment winner's streak
        const currentWinnerStreak = newStreaks.get(winner.id) || 0;
        newStreaks.set(winner.id, currentWinnerStreak + 1);
        
        // Reset loser's streak to 0
        if (loser) {
          newStreaks.set(loser.id, 0);
        }
        
        return newStreaks;
      });

      // Update game state
      const newTournament = selectWinner(gameState.tournament, winner);
      setGameState({
        ...gameState,
        tournament: newTournament,
        canUndo: true
      });
      
      // Reset UI state
      setSelectedItem(null);
      setVoteStats(null);
      setItemPercentages([]);
      setShowStats(false);
      
    } catch (error) {
      console.error('Choice processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [gameState, isProcessing, worldcupId, fetchItemPercentages]);

  // Handle undo
  const handleUndo = useCallback(() => {
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
    setItemPercentages([]);
    setShowStats(false);
  }, [gameState]);

  // Handle restart
  const handleRestart = useCallback(() => {
    if (!worldcupData) return;
    
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
    
    // Reset win streaks
    setWinStreaks(new Map());
    
    setSelectedItem(null);
    setVoteStats(null);
    setItemPercentages([]);
    setShowStats(false);
  }, [worldcupData, tournamentSize]);

  // Handle navigation
  const handleGoHome = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleSelectOtherTournament = useCallback(() => {
    router.push(`/tournament-select/${worldcupId}`);
  }, [router, worldcupId]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isProcessing || !gameState) return;
      
      const rawMatch = getCurrentMatch(gameState.tournament);
      if (!rawMatch) return;

      switch (e.key.toLowerCase()) {
        case 'arrowleft':
        case '1':
          e.preventDefault();
          handleChoice(rawMatch.item1);
          break;
        case 'arrowright':
        case '2':
          e.preventDefault();
          handleChoice(rawMatch.item2);
          break;
        case 'z':
          e.preventDefault();
          handleUndo();
          break;
        case 'r':
          e.preventDefault();
          handleRestart();
          break;
        case 'escape':
          e.preventDefault();
          handleGoHome();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, isProcessing, handleChoice, handleUndo, handleRestart, handleGoHome]);

  // Check for game completion
  useEffect(() => {
    if (gameState?.tournament.isCompleted) {
      const playTime = Date.now() - gameState.startTime;
      const resultUrl = `/tournament-result/${worldcupId}?theme=${theme}&playTime=${playTime}&winner=${gameState.tournament.winner?.id}`;
      router.push(resultUrl);
    }
  }, [gameState, worldcupId, theme, router]);

  // Get current game data with transformation
  const rawCurrentMatch = gameState ? getCurrentMatch(gameState.tournament) : null;
  
  // Transform match structure from item1/item2 to left/right for theme components
  const currentMatch = rawCurrentMatch ? {
    left: rawCurrentMatch.item1,
    right: rawCurrentMatch.item2,
    id: rawCurrentMatch.id,
    round: rawCurrentMatch.round,
    matchNumber: rawCurrentMatch.matchNumber,
    winner: rawCurrentMatch.winner,
    isCompleted: rawCurrentMatch.isCompleted
  } : null;
  
  const progress = gameState ? getTournamentProgress(gameState.tournament) : null;
  const roundName = gameState ? getRoundName(gameState.tournament.currentRound, gameState.tournament.totalRounds) : '';

  return {
    // State
    gameState,
    worldcupData,
    loading,
    error,
    theme,
    tournamentSize,
    
    // UI State
    selectedItem,
    voteStats,
    itemPercentages,
    isProcessing,
    showStats,
    winStreaks,
    
    // Game Data
    currentMatch,
    progress,
    roundName,
    canUndo: gameState?.canUndo || false,
    
    // Actions
    handleChoice,
    handleUndo,
    handleRestart,
    handleGoHome,
    handleSelectOtherTournament
  };
}