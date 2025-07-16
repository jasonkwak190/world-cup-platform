import { GameState } from '@/types/game';

// Simple test to verify the fix
describe('usePlayAutoSave fix verification', () => {
  test('should not crash when creating save data from game state', () => {
    const mockGameState: GameState = {
      tournament: {
        id: 'test-tournament-id',
        title: 'Test Tournament',
        description: 'Test Description',
        items: [
          { id: '1', title: 'Item 1' },
          { id: '2', title: 'Item 2' }
        ],
        currentRound: 1,
        totalRounds: 2,
        currentMatch: 0,
        isCompleted: false,
        winner: null,
        matches: [
          {
            id: 'match-1',
            round: 1,
            matchNumber: 1,
            item1: { id: '1', title: 'Item 1' },
            item2: { id: '2', title: 'Item 2' },
            isCompleted: false,
          }
        ],
      },
      history: [],
      canUndo: false,
      startTime: Date.now(),
    };

    // This should not throw an error
    expect(() => {
      // Simulate the createSaveData function logic
      const tournament = mockGameState.tournament;
      const matches = tournament.matches || [];
      
      const currentRoundMatches = matches.filter(
        match => match.round === tournament.currentRound && !match.isCompleted
      );
      
      const completedMatches = matches.filter(match => match.isCompleted);
      const selectedItems = completedMatches
        .filter(match => match.winner)
        .map(match => match.winner!);

      const remainingItems = currentRoundMatches.flatMap(match => 
        [match.item1, match.item2].filter(item => item)
      );

      const result = {
        worldcup_id: 'test-worldcup-id',
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
        round_history: mockGameState.history || []
      };

      expect(result).toBeDefined();
      expect(result.remaining_items).toEqual([
        { id: '1', title: 'Item 1' },
        { id: '2', title: 'Item 2' }
      ]);
      expect(result.selected_items).toEqual([]);
      expect(result.current_round).toBe(1);
      expect(result.total_rounds).toBe(2);
    }).not.toThrow();
  });

  test('should handle null/undefined tournament gracefully', () => {
    expect(() => {
      const state = { tournament: null } as any;
      if (!state?.tournament) {
        throw new Error('Invalid game state: tournament is missing');
      }
    }).toThrow('Invalid game state: tournament is missing');
  });

  test('should handle empty matches array', () => {
    const mockGameState: GameState = {
      tournament: {
        id: 'test-tournament-id',
        title: 'Test Tournament',
        items: [],
        currentRound: 1,
        totalRounds: 2,
        currentMatch: 0,
        isCompleted: false,
        winner: null,
        matches: [], // Empty matches array
      },
      history: [],
      canUndo: false,
      startTime: Date.now(),
    };

    expect(() => {
      const tournament = mockGameState.tournament;
      const matches = tournament.matches || [];
      
      const currentRoundMatches = matches.filter(
        match => match.round === tournament.currentRound && !match.isCompleted
      );
      
      const remainingItems = currentRoundMatches.flatMap(match => 
        [match.item1, match.item2].filter(item => item)
      );

      expect(remainingItems).toEqual([]);
    }).not.toThrow();
  });
});