import { useRef, useEffect, useCallback } from 'react';

interface TouchGestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
}

interface TouchGestureOptions {
  threshold?: number; // Minimum distance for swipe
  timeout?: number; // Long press timeout
  preventScrollOnSwipe?: boolean;
}

export const useTouchGestures = (
  handlers: TouchGestureHandlers,
  options: TouchGestureOptions = {}
) => {
  const {
    threshold = 50,
    timeout = 500,
    preventScrollOnSwipe = true,
  } = options;

  const startTouch = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    startTouch.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // Start long press timer
    if (handlers.onLongPress) {
      longPressTimer.current = setTimeout(() => {
        handlers.onLongPress?.();
        clearLongPressTimer();
      }, timeout);
    }
  }, [handlers.onLongPress, timeout, clearLongPressTimer]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!startTouch.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startTouch.current.x;
    const deltaY = touch.clientY - startTouch.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Cancel long press if finger moves too much
    if (distance > 10) {
      clearLongPressTimer();
    }

    // Only prevent scroll if explicitly needed and we're actually swiping
    if (preventScrollOnSwipe && distance > threshold) {
      e.preventDefault();
    }
  }, [threshold, preventScrollOnSwipe, clearLongPressTimer]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    clearLongPressTimer();

    if (!startTouch.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startTouch.current.x;
    const deltaY = touch.clientY - startTouch.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const timeDelta = Date.now() - startTouch.current.time;

    // Determine if it's a tap (short distance and time)
    if (distance < 10 && timeDelta < 300) {
      handlers.onTap?.();
    }
    // Determine swipe direction
    else if (distance > threshold) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }
    }

    startTouch.current = null;
  }, [threshold, handlers]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Use passive listeners when we don't need to prevent scroll
    const passiveOptions = { passive: !preventScrollOnSwipe };
    const nonPassiveOptions = { passive: false };

    element.addEventListener('touchstart', handleTouchStart, passiveOptions);
    element.addEventListener('touchmove', handleTouchMove, preventScrollOnSwipe ? nonPassiveOptions : passiveOptions);
    element.addEventListener('touchend', handleTouchEnd, passiveOptions);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      clearLongPressTimer();
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, clearLongPressTimer, preventScrollOnSwipe]);

  return elementRef;
};

// Additional hook for keyboard shortcuts
export const useKeyboardShortcuts = (handlers: {
  onLeftArrow?: () => void;
  onRightArrow?: () => void;
  onUpArrow?: () => void;
  onDownArrow?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onEnter?: () => void;
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for arrow keys and space
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'ArrowLeft':
          handlers.onLeftArrow?.();
          break;
        case 'ArrowRight':
          handlers.onRightArrow?.();
          break;
        case 'ArrowUp':
          handlers.onUpArrow?.();
          break;
        case 'ArrowDown':
          handlers.onDownArrow?.();
          break;
        case 'Space':
          handlers.onSpace?.();
          break;
        case 'Escape':
          handlers.onEscape?.();
          break;
        case 'Enter':
          handlers.onEnter?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
};