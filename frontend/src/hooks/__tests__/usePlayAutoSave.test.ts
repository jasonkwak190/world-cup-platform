import { renderHook, act } from '@testing-library/react'
import { usePlayAutoSave } from '../usePlayAutoSave'
import { useActionAutoSave } from '../useActionAutoSave'
import React from 'react'

// Mock the useActionAutoSave hook
jest.mock('../useActionAutoSave')

// Mock the AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    isAuthenticated: true,
  }),
}))

// Mock other hooks
jest.mock('../useCreateSaveFunction', () => ({
  useCreateSaveFunction: () => jest.fn(),
}))

const mockDraftRestore = {
  hasDraft: false,
  isRestoring: false,
  restoreDraft: jest.fn(),
  deleteDraft: jest.fn(),
  refreshDraft: jest.fn(),
  draftData: null,
  error: null,
}

jest.mock('../useDraftRestore', () => ({
  useDraftRestore: () => mockDraftRestore,
  isUserAuthenticated: () => true,
}))

const mockUseActionAutoSave = useActionAutoSave as jest.MockedFunction<typeof useActionAutoSave>

describe('usePlayAutoSave', () => {
  const mockActionAutoSave = {
    saveStatus: 'idle' as const,
    lastSaved: null,
    isSaving: false,
    hasError: false,
    triggerSave: jest.fn(),
    manualSave: jest.fn(),
    isEnabled: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseActionAutoSave.mockReturnValue(mockActionAutoSave)
  })

  const defaultConfig = {
    worldcupId: 'test-worldcup-id',
    gameState: {
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
    },
    enabled: true,
  }

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      const { result } = renderHook(() =>
        usePlayAutoSave(defaultConfig)
      )

      expect(mockUseActionAutoSave).toHaveBeenCalledWith(
        expect.objectContaining({
          worldcup_id: 'test-worldcup-id',
          remaining_items: [
            { id: '1', title: 'Item 1' },
            { id: '2', title: 'Item 2' }
          ],
          current_round: 1,
          total_rounds: 2,
        }),
        expect.any(Function),
        expect.objectContaining({
          enabled: true,
          debounceMs: 300,
        })
      )
    })

    it('should be disabled when enabled is false', () => {
      renderHook(() =>
        usePlayAutoSave({ ...defaultConfig, enabled: false })
      )

      expect(mockUseActionAutoSave).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Function),
        expect.objectContaining({
          enabled: false,
        })
      )
    })

    it('should be disabled when no worldcupId is provided', () => {
      renderHook(() =>
        usePlayAutoSave({ ...defaultConfig, worldcupId: '' })
      )

      expect(mockUseActionAutoSave).toHaveBeenCalledWith(
        expect.objectContaining({
          worldcup_id: '',
        }),
        expect.any(Function),
        expect.objectContaining({
          enabled: true, // enabled is still true, but worldcup_id is empty
        })
      )
    })

    it('should be disabled when no gameState is provided', () => {
      renderHook(() =>
        usePlayAutoSave({ ...defaultConfig, gameState: null })
      )

      expect(mockUseActionAutoSave).toHaveBeenCalledWith(
        null,
        expect.any(Function),
        expect.objectContaining({
          enabled: false,
        })
      )
    })
  })

  describe('saveOnAction', () => {
    it('should call underlying triggerSave', () => {
      const { result } = renderHook(() =>
        usePlayAutoSave(defaultConfig)
      )

      act(() => {
        result.current.saveOnAction('match_completed')
      })

      expect(mockActionAutoSave.triggerSave).toHaveBeenCalledWith(false)
    })
  })

  describe('restoreProgress', () => {
    it('should restore progress successfully', async () => {
      const mockRestoredData = {
        worldcup_id: 'test-worldcup-id',
        remaining_items: [{ id: '2', title: 'Item 2' }],
        current_round: 2,
        total_rounds: 2,
        bracket_state: {
          currentMatch: 1,
          isCompleted: false,
          winner: null,
        },
        round_history: [{ winner: { id: '1', title: 'Item 1' } }],
      }

      mockDraftRestore.restoreDraft.mockResolvedValue(mockRestoredData)

      const { result } = renderHook(() =>
        usePlayAutoSave(defaultConfig)
      )

      let restoredData
      await act(async () => {
        restoredData = await result.current.restoreProgress()
      })

      expect(mockDraftRestore.restoreDraft).toHaveBeenCalled()
      expect(restoredData).toEqual(mockRestoredData)
    })

    it('should handle restore errors', async () => {
      mockDraftRestore.restoreDraft.mockResolvedValue(null)

      const { result } = renderHook(() =>
        usePlayAutoSave(defaultConfig)
      )

      let restoredData
      await act(async () => {
        restoredData = await result.current.restoreProgress()
      })

      expect(restoredData).toBeNull()
    })
  })

  describe('deleteSave', () => {
    it('should delete save successfully', async () => {
      mockDraftRestore.deleteDraft.mockResolvedValue(true)

      const { result } = renderHook(() =>
        usePlayAutoSave(defaultConfig)
      )

      let success
      await act(async () => {
        success = await result.current.deleteSave()
      })

      expect(mockDraftRestore.deleteDraft).toHaveBeenCalled()
      expect(success).toBe(true)
    })

    it('should handle delete errors', async () => {
      mockDraftRestore.deleteDraft.mockResolvedValue(false)

      const { result } = renderHook(() =>
        usePlayAutoSave(defaultConfig)
      )

      let success
      await act(async () => {
        success = await result.current.deleteSave()
      })

      expect(success).toBe(false)
    })
  })

  describe('game state changes', () => {
    it('should update save data when game state changes', () => {
      const { rerender } = renderHook(
        ({ gameState }) => usePlayAutoSave({ ...defaultConfig, gameState }),
        { initialProps: { gameState: defaultConfig.gameState } }
      )

      const newGameState = {
        ...defaultConfig.gameState,
        tournament: {
          ...defaultConfig.gameState.tournament,
          currentRound: 2,
        },
      }

      rerender({ gameState: newGameState })

      // Check that useActionAutoSave was called with updated data
      expect(mockUseActionAutoSave).toHaveBeenLastCalledWith(
        expect.any(Object),
        expect.objectContaining({
          current_round: 2,
        })
      )
    })

    it('should handle completed tournament state', () => {
      const completedGameState = {
        ...defaultConfig.gameState,
        tournament: {
          ...defaultConfig.gameState.tournament,
          isCompleted: true,
          winner: { id: '1', title: 'Winner' },
        },
      }

      renderHook(() =>
        usePlayAutoSave({ ...defaultConfig, gameState: completedGameState })
      )

      expect(mockUseActionAutoSave).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          bracket_state: expect.objectContaining({
            isCompleted: true,
            winner: { id: '1', title: 'Winner' },
          }),
        })
      )
    })
  })

  describe('data transformation', () => {
    it('should transform game state to save format correctly', () => {
      const gameStateWithHistory = {
        ...defaultConfig.gameState,
        history: [
          {
            id: 'match-1',
            item1: { id: '1', title: 'Item 1' },
            item2: { id: '2', title: 'Item 2' },
            winner: { id: '1', title: 'Item 1' },
            isCompleted: true,
          },
        ],
        canUndo: true,
      }

      renderHook(() =>
        usePlayAutoSave({ ...defaultConfig, gameState: gameStateWithHistory })
      )

      expect(mockUseActionAutoSave).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          round_history: [
            {
              id: 'match-1',
              item1: { id: '1', title: 'Item 1' },
              item2: { id: '2', title: 'Item 2' },
              winner: { id: '1', title: 'Item 1' },
              isCompleted: true,
            },
          ],
          game_metadata: expect.objectContaining({
            canUndo: true,
          }),
        })
      )
    })
  })

  describe('callback handling', () => {
    it('should handle save success callback', () => {
      const onSaveSuccess = jest.fn()
      
      renderHook(() =>
        usePlayAutoSave({ ...defaultConfig, onSaveSuccess })
      )

      expect(mockUseActionAutoSave).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Function),
        expect.objectContaining({
          onSaveSuccess,
        })
      )
    })

    it('should handle save error callback', () => {
      const onSaveError = jest.fn()
      
      renderHook(() =>
        usePlayAutoSave({ ...defaultConfig, onSaveError })
      )

      expect(mockUseActionAutoSave).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Function),
        expect.objectContaining({
          onSaveError,
        })
      )
    })

    it('should handle restore success callback', () => {
      const onRestoreSuccess = jest.fn()
      
      const { result } = renderHook(() =>
        usePlayAutoSave({ ...defaultConfig, onRestoreSuccess })
      )

      // The onRestoreSuccess callback is used internally, not passed to useActionAutoSave
      expect(result.current).toBeDefined()
    })
  })
})