import { renderHook, act } from '@testing-library/react'
import { useActionAutoSave } from '../useActionAutoSave'

// Mock fetch globally
global.fetch = jest.fn()

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('useActionAutoSave', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const defaultConfig = {
    saveUrl: '/api/test/save',
    restoreUrl: '/api/test/restore',
    deleteUrl: '/api/test/delete',
    dataKey: 'test-data',
    enabled: true,
    debounceMs: 1000,
    maxDataSize: 1024 * 1024,
  }

  const mockData = { test: 'data', value: 123 }

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() =>
        useActionAutoSave(defaultConfig, mockData)
      )

      expect(result.current.saveStatus).toBe('idle')
      expect(result.current.isEnabled).toBe(true)
      expect(result.current.lastSaved).toBeNull()
    })

    it('should be disabled when enabled is false', () => {
      const { result } = renderHook(() =>
        useActionAutoSave({ ...defaultConfig, enabled: false }, mockData)
      )

      expect(result.current.isEnabled).toBe(false)
    })
  })

  describe('saveOnAction', () => {
    it('should save data when action is triggered', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      const onSaveSuccess = jest.fn()
      const { result } = renderHook(() =>
        useActionAutoSave(
          { ...defaultConfig, onSaveSuccess },
          mockData
        )
      )

      act(() => {
        result.current.saveOnAction('test_action')
      })

      // Fast-forward debounce timer
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Wait for async operation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/test/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: mockData,
          action: 'test_action',
          timestamp: expect.any(Number)
        })
      })

      expect(result.current.saveStatus).toBe('saved')
      expect(onSaveSuccess).toHaveBeenCalled()
    })

    it('should debounce multiple rapid saves', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      const { result } = renderHook(() =>
        useActionAutoSave(defaultConfig, mockData)
      )

      // Trigger multiple saves rapidly
      act(() => {
        result.current.saveOnAction('action1')
        result.current.saveOnAction('action2')
        result.current.saveOnAction('action3')
      })

      // Only advance timer once
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Should only save once with the last action
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith('/api/test/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: mockData,
          action: 'action3',
          timestamp: expect.any(Number)
        })
      })
    })

    it('should handle save errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response)

      const onSaveError = jest.fn()
      const { result } = renderHook(() =>
        useActionAutoSave(
          { ...defaultConfig, onSaveError },
          mockData
        )
      )

      act(() => {
        result.current.saveOnAction('test_action')
      })

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.saveStatus).toBe('error')
      expect(onSaveError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to save')
        })
      )
    })

    it('should not save when disabled', () => {
      const { result } = renderHook(() =>
        useActionAutoSave({ ...defaultConfig, enabled: false }, mockData)
      )

      act(() => {
        result.current.saveOnAction('test_action')
      })

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should validate data size', () => {
      const largeData = { data: 'x'.repeat(2 * 1024 * 1024) } // 2MB
      const onSaveError = jest.fn()
      
      const { result } = renderHook(() =>
        useActionAutoSave(
          { ...defaultConfig, onSaveError },
          largeData
        )
      )

      act(() => {
        result.current.saveOnAction('test_action')
      })

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(onSaveError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Data size exceeds maximum')
        })
      )
    })
  })

  describe('restoreData', () => {
    it('should restore data successfully', async () => {
      const savedData = { restored: 'data' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: savedData })
      } as Response)

      const onRestoreSuccess = jest.fn()
      const { result } = renderHook(() =>
        useActionAutoSave(
          { ...defaultConfig, onRestoreSuccess },
          mockData
        )
      )

      let restoredData
      await act(async () => {
        restoredData = await result.current.restoreData()
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/test/restore', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      expect(restoredData).toEqual(savedData)
      expect(onRestoreSuccess).toHaveBeenCalledWith(savedData)
    })

    it('should handle restore errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response)

      const onRestoreError = jest.fn()
      const { result } = renderHook(() =>
        useActionAutoSave(
          { ...defaultConfig, onRestoreError },
          mockData
        )
      )

      let restoredData
      await act(async () => {
        restoredData = await result.current.restoreData()
      })

      expect(restoredData).toBeNull()
      expect(onRestoreError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to restore')
        })
      )
    })
  })

  describe('deleteData', () => {
    it('should delete data successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      const onDeleteSuccess = jest.fn()
      const { result } = renderHook(() =>
        useActionAutoSave(
          { ...defaultConfig, onDeleteSuccess },
          mockData
        )
      )

      let success
      await act(async () => {
        success = await result.current.deleteData()
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/test/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      expect(success).toBe(true)
      expect(onDeleteSuccess).toHaveBeenCalled()
    })

    it('should handle delete errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response)

      const onDeleteError = jest.fn()
      const { result } = renderHook(() =>
        useActionAutoSave(
          { ...defaultConfig, onDeleteError },
          mockData
        )
      )

      let success
      await act(async () => {
        success = await result.current.deleteData()
      })

      expect(success).toBe(false)
      expect(onDeleteError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to delete')
        })
      )
    })
  })

  describe('data changes', () => {
    it('should trigger auto-save when data changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      const initialData = { value: 1 }
      const { result, rerender } = renderHook(
        ({ data }) => useActionAutoSave(defaultConfig, data),
        { initialProps: { data: initialData } }
      )

      // Change data
      const newData = { value: 2 }
      rerender({ data: newData })

      act(() => {
        result.current.saveOnAction('data_changed')
      })

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/test/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: newData,
          action: 'data_changed',
          timestamp: expect.any(Number)
        })
      })
    })
  })

  describe('save status updates', () => {
    it('should update save status correctly during save lifecycle', async () => {
      let resolvePromise: (value: any) => void
      const savePromise = new Promise(resolve => {
        resolvePromise = resolve
      })

      mockFetch.mockReturnValueOnce(savePromise as any)

      const { result } = renderHook(() =>
        useActionAutoSave(defaultConfig, mockData)
      )

      // Initial state
      expect(result.current.saveStatus).toBe('idle')

      // Trigger save
      act(() => {
        result.current.saveOnAction('test_action')
      })

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Should be saving
      expect(result.current.saveStatus).toBe('saving')

      // Resolve the promise
      act(() => {
        resolvePromise({
          ok: true,
          json: async () => ({ success: true })
        })
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Should be saved
      expect(result.current.saveStatus).toBe('saved')
      expect(result.current.lastSaved).toBeInstanceOf(Date)
    })
  })
})