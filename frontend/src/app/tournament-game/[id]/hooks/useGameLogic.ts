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
import { secureSubmitVote, secureSubmitBulkVotes, secureGetWorldcupStats, secureUpdateWorldcupStats } from '@/lib/api/secure-api';

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
  
  // Memory-based vote storage for batch processing (no localStorage)
  const [localVotes, setLocalVotes] = useState<Array<{ winnerId: string; loserId: string | null }>>([]);
  
  // Theme and tournament settings
  const [theme, setTheme] = useState<string>('minimal');
  const [tournamentSize, setTournamentSize] = useState<number>(16);

  // Function to fetch item statistics and calculate percentages
  const fetchItemPercentages = useCallback(async (items: WorldCupItem[]) => {
    try {
      console.log('📊 Fetching item percentages for', items.length, 'items');
      const statsData = await secureGetWorldcupStats(worldcupId);
      const itemStats = statsData.items || [];
      
      console.log('📊 Stats received:', itemStats.length, 'items');
      
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
      
      console.log('📊 Calculated percentages:', percentages.slice(0, 3)); // Log first 3
      return percentages;
    } catch (error) {
      console.error('❌ Error fetching item percentages:', error);
      // Fallback to random percentages
      const fallbackPercentages = items.map(item => ({
        itemId: item.id,
        percentage: Math.random() * 100
      }));
      console.log('🎲 Using fallback percentages for', fallbackPercentages.length, 'items');
      return fallbackPercentages;
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

        // Initialize win streaks and clear any existing votes
        setWinStreaks(new Map());
        setLocalVotes([]);
        
        console.log('📊 Game initialized with memory-based vote storage (no localStorage)');

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
      
      // Store vote locally for batch processing
      const voteData = {
        winnerId: winner.id,
        loserId: rawMatch ? (isLeftWinner ? rawMatch.item2.id : rawMatch.item1.id) : null
      };
      
      setLocalVotes(prevVotes => {
        const newVotes = [...prevVotes, voteData];
        console.log('📊 Vote stored in memory:', voteData, 'Total votes:', newVotes.length);
        return newVotes;
      });
      
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
    
    // Reset win streaks and votes
    setWinStreaks(new Map());
    setLocalVotes([]);
    
    console.log('🔄 Game restarted - memory-based votes cleared');
    
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

  // Function to handle bulk vote submission
  const submitBulkVotes = useCallback(async (votes: Array<{ winnerId: string; loserId: string | null }>) => {
    if (votes.length === 0) return { successfulVotes: 0, failedVotes: 0 };
    
    try {
      console.log('📊 Submitting bulk votes:', votes.length, 'votes');
      
      // Transform votes to match API format (loserId can be null, API expects undefined for optional)
      const apiVotes = votes.map(vote => ({
        winnerId: vote.winnerId,
        ...(vote.loserId && { loserId: vote.loserId })
      }));
      
      // Use the new bulk API endpoint
      const result = await secureSubmitBulkVotes(worldcupId, apiVotes);
      
      console.log('📊 Bulk vote submission completed:', {
        successfulVotes: result.successfulVotes,
        failedVotes: result.failedVotes,
        totalVotes: votes.length
      });
      
      return result;
    } catch (error) {
      console.error('❌ Bulk vote submission failed:', error);
      // Fallback to individual submission if bulk fails
      console.log('📊 Falling back to individual vote submissions...');
      
      try {
        const votePromises = votes.map(vote => 
          secureSubmitVote(worldcupId, vote).catch(error => {
            console.warn('❌ Individual vote failed:', vote, error);
            return { error, vote };
          })
        );
        
        const results = await Promise.allSettled(votePromises);
        const successfulVotes = results.filter(r => r.status === 'fulfilled').length;
        const failedVotes = votes.length - successfulVotes;
        
        console.log('📊 Fallback individual vote submission completed:', {
          successfulVotes,
          failedVotes,
          totalVotes: votes.length
        });
        
        return { successfulVotes, failedVotes };
      } catch (fallbackError) {
        console.error('❌ Both bulk and individual vote submissions failed:', fallbackError);
        return { successfulVotes: 0, failedVotes: votes.length };
      }
    }
  }, [worldcupId]);

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

  // Handle page unload - submit votes before leaving
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (localVotes.length > 0) {
        // Show confirmation dialog
        e.preventDefault();
        e.returnValue = '진행 중인 투표 데이터가 있습니다. 페이지를 나가시겠습니까?';
        
        // Try to submit votes synchronously (browser limitations apply)
        try {
          // Use navigator.sendBeacon for reliable data transmission during page unload
          const voteData = JSON.stringify({
            worldcupId,
            votes: localVotes,
            timestamp: Date.now()
          });
          
          // Attempt to send data using beacon API (more reliable during unload)
          if (navigator.sendBeacon) {
            const success = navigator.sendBeacon(`/api/worldcups/${worldcupId}/vote-bulk`, voteData);
            if (success) {
              console.log('📊 Votes sent via beacon API before page unload');
            } else {
              console.warn('❌ Beacon API failed, votes may be lost');
            }
          } else {
            // Fallback: attempt synchronous request (may not complete)
            submitBulkVotes(localVotes);
          }
        } catch (error) {
          console.error('❌ Failed to submit votes before unload:', error);
        }
      }
    };

    const handleVisibilityChange = () => {
      // When page becomes hidden, try to submit votes
      if (document.hidden && localVotes.length > 0) {
        console.log('📊 Page becoming hidden, attempting to submit votes...');
        submitBulkVotes(localVotes).then(() => {
          setLocalVotes([]);
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [localVotes, worldcupId, submitBulkVotes]);

  // Check for game completion and handle stats update
  useEffect(() => {
    if (gameState?.tournament.isCompleted && gameState.tournament.winner) {
      const handleGameCompletion = async () => {
        try {
          console.log('🏆 Game completed, processing results...');
          const playTime = Date.now() - gameState.startTime;
          
          console.log('📊 Game completion data:', {
            worldcupId,
            winner: gameState.tournament.winner,
            playTime,
            theme,
            totalVotes: localVotes.length
          });
          
          // Process API calls in parallel
          const apiPromises = [];
          
          // 1. Submit all votes using bulk submission
          let voteResults = { successfulVotes: 0, failedVotes: 0 };
          if (localVotes.length > 0) {
            console.log('📊 Submitting', localVotes.length, 'votes using bulk submission...');
            const votePromise = submitBulkVotes(localVotes);
            apiPromises.push(votePromise);
          }
          
          // 2. Update tournament statistics
          console.log('📊 Updating tournament statistics via secure API');
          const statsPromise = secureUpdateWorldcupStats(worldcupId, {
            matches: gameState.tournament.matches,
            winner: gameState.tournament.winner,
            sessionToken: `game_${Date.now()}`
          }).catch(error => {
            console.warn('❌ Statistics update failed:', error);
            return { error };
          });
          apiPromises.push(statsPromise);
          
          // 3. Process all API calls in parallel
          const results = await Promise.allSettled(apiPromises);
          
          // Extract results
          if (localVotes.length > 0 && results[0].status === 'fulfilled') {
            voteResults = results[0].value as { successfulVotes: number; failedVotes: number };
          } else if (localVotes.length > 0) {
            voteResults = { successfulVotes: 0, failedVotes: localVotes.length };
          }
          
          const statsSuccess = results[results.length - 1]?.status === 'fulfilled';
          
          console.log('📊 Game completion processing completed:', {
            successfulVotes: voteResults.successfulVotes,
            failedVotes: voteResults.failedVotes,
            statsSuccess,
            totalVotes: localVotes.length
          });
          
          // Clear memory-based votes
          setLocalVotes([]);
          console.log('✅ Memory-based votes cleared after successful batch processing');
          
          // Small delay to ensure all state updates are complete
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Validate winner ID before navigation
          const winnerId = gameState.tournament.winner.id;
          if (!winnerId) {
            console.error('❌ Winner ID is missing, cannot navigate to results');
            return;
          }
          
          // Navigate to results page
          const resultUrl = `/tournament-result/${worldcupId}?theme=${encodeURIComponent(theme)}&playTime=${playTime}&winner=${encodeURIComponent(winnerId)}`;
          console.log('🚀 Navigating to results:', resultUrl);
          router.push(resultUrl);
        } catch (error) {
          console.error('Error handling game completion:', error);
          // Still navigate to results even if batch processing fails
          const playTime = Date.now() - gameState.startTime;
          const resultUrl = `/tournament-result/${worldcupId}?theme=${theme}&playTime=${playTime}&winner=${gameState.tournament.winner?.id}`;
          router.push(resultUrl);
        }
      };
      
      handleGameCompletion();
    }
  }, [gameState, worldcupId, theme, router, localVotes]);

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
    localVotes,
    
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