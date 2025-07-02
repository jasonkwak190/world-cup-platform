import { renderHook, act } from '@testing-library/react'
import { useTouchGestures, useKeyboardShortcuts } from '../useTouchGestures'

// Mock DOM element
const mockElement = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
} as any

// Mock ref
const mockRef = {
  current: mockElement,
}

describe('useTouchGestures', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should set up touch event listeners on mount', () => {
    const handlers = {
      onSwipeLeft: jest.fn(),
      onSwipeRight: jest.fn(),
      onTap: jest.fn(),
    }

    const { result } = renderHook(() => useTouchGestures(handlers))
    
    // Simulate ref assignment
    act(() => {
      Object.defineProperty(result.current, 'current', {
        value: mockElement,
        writable: true,
      })
    })

    expect(mockElement.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false })
    expect(mockElement.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false })
    expect(mockElement.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: false })
  })

  it('should clean up event listeners on unmount', () => {
    const handlers = {
      onSwipeLeft: jest.fn(),
    }

    const { result, unmount } = renderHook(() => useTouchGestures(handlers))
    
    // Simulate ref assignment
    act(() => {
      Object.defineProperty(result.current, 'current', {
        value: mockElement,
        writable: true,
      })
    })

    unmount()

    expect(mockElement.removeEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function))
    expect(mockElement.removeEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function))
    expect(mockElement.removeEventListener).toHaveBeenCalledWith('touchend', expect.any(Function))
  })
})

describe('useKeyboardShortcuts', () => {
  let addEventListenerSpy: jest.SpyInstance
  let removeEventListenerSpy: jest.SpyInstance

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(document, 'addEventListener')
    removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
  })

  afterEach(() => {
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })

  it('should set up keyboard event listeners', () => {
    const handlers = {
      onLeftArrow: jest.fn(),
      onRightArrow: jest.fn(),
      onSpace: jest.fn(),
      onEscape: jest.fn(),
    }

    renderHook(() => useKeyboardShortcuts(handlers))

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('should call correct handler for arrow keys', () => {
    const handlers = {
      onLeftArrow: jest.fn(),
      onRightArrow: jest.fn(),
    }

    renderHook(() => useKeyboardShortcuts(handlers))

    // Get the event handler
    const keydownHandler = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'keydown'
    )?.[1]

    // Simulate left arrow key
    act(() => {
      keydownHandler?.({ code: 'ArrowLeft', preventDefault: jest.fn() })
    })

    expect(handlers.onLeftArrow).toHaveBeenCalledTimes(1)

    // Simulate right arrow key
    act(() => {
      keydownHandler?.({ code: 'ArrowRight', preventDefault: jest.fn() })
    })

    expect(handlers.onRightArrow).toHaveBeenCalledTimes(1)
  })

  it('should prevent default for arrow keys and space', () => {
    const preventDefault = jest.fn()
    const handlers = {
      onSpace: jest.fn(),
    }

    renderHook(() => useKeyboardShortcuts(handlers))

    const keydownHandler = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'keydown'
    )?.[1]

    act(() => {
      keydownHandler?.({ code: 'Space', preventDefault })
    })

    expect(preventDefault).toHaveBeenCalledTimes(1)
  })

  it('should clean up event listeners on unmount', () => {
    const handlers = {
      onEscape: jest.fn(),
    }

    const { unmount } = renderHook(() => useKeyboardShortcuts(handlers))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })
})