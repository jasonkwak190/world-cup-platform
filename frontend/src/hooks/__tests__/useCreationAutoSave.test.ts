import { renderHook, act } from '@testing-library/react'
import { useCreationAutoSave, convertFormDataToSaveFormat, convertSaveDataToFormFormat } from '../useCreationAutoSave'
import { useActionAutoSave } from '../useActionAutoSave'

// Mock the useActionAutoSave hook
jest.mock('../useActionAutoSave')

const mockUseActionAutoSave = useActionAutoSave as jest.MockedFunction<typeof useActionAutoSave>

describe('useCreationAutoSave', () => {
  const mockActionAutoSave = {
    saveOnAction: jest.fn(),
    restoreData: jest.fn(),
    deleteData: jest.fn(),
    saveStatus: 'idle' as const,
    isEnabled: true,
    lastSaved: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseActionAutoSave.mockReturnValue(mockActionAutoSave)
  })

  const defaultCreationData = {
    title: 'Test Tournament',
    description: 'Test Description',
    category: 'entertainment',
    items: [
      { id: '1', title: 'Item 1', image: 'image1.jpg' },
      { id: '2', title: 'Item 2', image: 'image2.jpg' },
    ],
    videoItems: [
      { id: 'v1', title: 'Video 1', videoId: 'video1' },
    ],
    isPublic: true,
    thumbnail: 'thumbnail.jpg',
  }

  const defaultConfig = {
    creationData: defaultCreationData,
    enabled: true,
  }

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      const { result } = renderHook(() =>
        useCreationAutoSave(defaultConfig)
      )

      expect(mockUseActionAutoSave).toHaveBeenCalledWith(
        expect.objectContaining({
          saveUrl: '/api/autosave/draft',
          restoreUrl: '/api/autosave/draft',
          deleteUrl: '/api/autosave/draft',
          dataKey: 'creation-draft',
          enabled: true,
          debounceMs: 3000,
          maxDataSize: 2 * 1024 * 1024,
        }),
        expect.objectContaining({
          title: 'Test Tournament',
          description: 'Test Description',
          category: 'entertainment',
          items: [
            { id: '1', title: 'Item 1', image: 'image1.jpg' },
            { id: '2', title: 'Item 2', image: 'image2.jpg' },
          ],
          videoItems: [
            { id: 'v1', title: 'Video 1', videoId: 'video1' },
          ],
          isPublic: true,
          thumbnail: 'thumbnail.jpg',
        })
      )
    })

    it('should be disabled when enabled is false', () => {
      renderHook(() =>
        useCreationAutoSave({ ...defaultConfig, enabled: false })
      )

      expect(mockUseActionAutoSave).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        }),
        expect.any(Object)
      )
    })

    it('should be disabled when no creation data is provided', () => {
      renderHook(() =>
        useCreationAutoSave({ ...defaultConfig, creationData: null })
      )

      expect(mockUseActionAutoSave).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        }),
        expect.any(Object)
      )
    })
  })

  describe('saveOnAction', () => {
    it('should call underlying saveOnAction', () => {
      const { result } = renderHook(() =>
        useCreationAutoSave(defaultConfig)
      )

      act(() => {
        result.current.saveOnAction('item_added')
      })

      expect(mockActionAutoSave.saveOnAction).toHaveBeenCalledWith('item_added')
    })
  })

  describe('restoreDraft', () => {
    it('should restore draft successfully', async () => {
      const mockRestoredData = {
        title: 'Restored Tournament',
        description: 'Restored Description',
        category: 'sports',
        items: [
          { id: '3', title: 'Item 3', image: 'image3.jpg' },
        ],
        videoItems: [],
        isPublic: false,
        thumbnail: 'restored-thumbnail.jpg',
      }

      mockActionAutoSave.restoreData.mockResolvedValue(mockRestoredData)

      const { result } = renderHook(() =>
        useCreationAutoSave(defaultConfig)
      )

      let restoredData
      await act(async () => {
        restoredData = await result.current.restoreDraft()
      })

      expect(mockActionAutoSave.restoreData).toHaveBeenCalled()
      expect(restoredData).toEqual(mockRestoredData)
    })

    it('should handle restore errors', async () => {
      mockActionAutoSave.restoreData.mockResolvedValue(null)

      const { result } = renderHook(() =>
        useCreationAutoSave(defaultConfig)
      )

      let restoredData
      await act(async () => {
        restoredData = await result.current.restoreDraft()
      })

      expect(restoredData).toBeNull()
    })
  })

  describe('deleteDraft', () => {
    it('should delete draft successfully', async () => {
      mockActionAutoSave.deleteData.mockResolvedValue(true)

      const { result } = renderHook(() =>
        useCreationAutoSave(defaultConfig)
      )

      let success
      await act(async () => {
        success = await result.current.deleteDraft()
      })

      expect(mockActionAutoSave.deleteData).toHaveBeenCalled()
      expect(success).toBe(true)
    })

    it('should handle delete errors', async () => {
      mockActionAutoSave.deleteData.mockResolvedValue(false)

      const { result } = renderHook(() =>
        useCreationAutoSave(defaultConfig)
      )

      let success
      await act(async () => {
        success = await result.current.deleteDraft()
      })

      expect(success).toBe(false)
    })
  })

  describe('creation data changes', () => {
    it('should update save data when creation data changes', () => {
      const { rerender } = renderHook(
        ({ creationData }) => useCreationAutoSave({ ...defaultConfig, creationData }),
        { initialProps: { creationData: defaultCreationData } }
      )

      const newCreationData = {
        ...defaultCreationData,
        title: 'Updated Tournament',
        items: [
          ...defaultCreationData.items,
          { id: '3', title: 'Item 3', image: 'image3.jpg' },
        ],
      }

      rerender({ creationData: newCreationData })

      // Check that useActionAutoSave was called with updated data
      expect(mockUseActionAutoSave).toHaveBeenLastCalledWith(
        expect.any(Object),
        expect.objectContaining({
          title: 'Updated Tournament',
          items: expect.arrayContaining([
            expect.objectContaining({ id: '3', title: 'Item 3' }),
          ]),
        })
      )
    })
  })

  describe('callback handling', () => {
    it('should handle save success callback', () => {
      const onSaveSuccess = jest.fn()
      
      renderHook(() =>
        useCreationAutoSave({ ...defaultConfig, onSaveSuccess })
      )

      expect(mockUseActionAutoSave).toHaveBeenCalledWith(
        expect.objectContaining({
          onSaveSuccess,
        }),
        expect.any(Object)
      )
    })

    it('should handle save error callback', () => {
      const onSaveError = jest.fn()
      
      renderHook(() =>
        useCreationAutoSave({ ...defaultConfig, onSaveError })
      )

      expect(mockUseActionAutoSave).toHaveBeenCalledWith(
        expect.objectContaining({
          onSaveError,
        }),
        expect.any(Object)
      )
    })

    it('should handle restore success callback', () => {
      const onRestoreSuccess = jest.fn()
      
      renderHook(() =>
        useCreationAutoSave({ ...defaultConfig, onRestoreSuccess })
      )

      expect(mockUseActionAutoSave).toHaveBeenCalledWith(
        expect.objectContaining({
          onRestoreSuccess,
        }),
        expect.any(Object)
      )
    })
  })
})

describe('convertFormDataToSaveFormat', () => {
  it('should convert form data to save format correctly', () => {
    const formData = {
      title: 'Test Tournament',
      description: 'Test Description',
      category: 'entertainment',
      items: [
        { id: '1', title: 'Item 1', image: 'image1.jpg', description: 'desc1' },
        { id: '2', title: 'Item 2', image: 'image2.jpg' },
      ],
      videoItems: [
        { id: 'v1', title: 'Video 1', videoId: 'video1' },
      ],
      isPublic: true,
      thumbnail: 'thumbnail.jpg',
    }

    const result = convertFormDataToSaveFormat(formData)

    expect(result).toEqual({
      title: 'Test Tournament',
      description: 'Test Description',
      category: 'entertainment',
      items: [
        { id: '1', title: 'Item 1', image: 'image1.jpg', description: 'desc1' },
        { id: '2', title: 'Item 2', image: 'image2.jpg' },
      ],
      videoItems: [
        { id: 'v1', title: 'Video 1', videoId: 'video1' },
      ],
      isPublic: true,
      thumbnail: 'thumbnail.jpg',
    })
  })

  it('should handle empty form data', () => {
    const formData = {
      title: '',
      description: '',
      category: 'entertainment',
      items: [],
      videoItems: [],
      isPublic: true,
    }

    const result = convertFormDataToSaveFormat(formData)

    expect(result).toEqual({
      title: '',
      description: '',
      category: 'entertainment',
      items: [],
      videoItems: [],
      isPublic: true,
      thumbnail: undefined,
    })
  })
})

describe('convertSaveDataToFormFormat', () => {
  it('should convert save data to form format correctly', () => {
    const saveData = {
      title: 'Test Tournament',
      description: 'Test Description',
      category: 'entertainment',
      items: [
        { id: '1', title: 'Item 1', image: 'image1.jpg', description: 'desc1' },
        { id: '2', title: 'Item 2', image: 'image2.jpg' },
      ],
      videoItems: [
        { id: 'v1', title: 'Video 1', videoId: 'video1' },
      ],
      isPublic: true,
      thumbnail: 'thumbnail.jpg',
    }

    const result = convertSaveDataToFormFormat(saveData)

    expect(result).toEqual({
      title: 'Test Tournament',
      description: 'Test Description',
      category: 'entertainment',
      items: [
        { id: '1', title: 'Item 1', image: 'image1.jpg', description: 'desc1' },
        { id: '2', title: 'Item 2', image: 'image2.jpg' },
      ],
      videoItems: [
        { id: 'v1', title: 'Video 1', videoId: 'video1' },
      ],
      isPublic: true,
      thumbnail: 'thumbnail.jpg',
    })
  })

  it('should handle missing optional fields', () => {
    const saveData = {
      title: 'Test Tournament',
      description: 'Test Description',
      category: 'entertainment',
      items: [],
      videoItems: [],
      isPublic: true,
    }

    const result = convertSaveDataToFormFormat(saveData)

    expect(result).toEqual({
      title: 'Test Tournament',
      description: 'Test Description',
      category: 'entertainment',
      items: [],
      videoItems: [],
      isPublic: true,
      thumbnail: undefined,
    })
  })
})