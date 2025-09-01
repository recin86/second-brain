import { useRef, useCallback, useState } from 'react';

interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

interface SwipeOptions {
  threshold?: number;
  preventScrollOnSwipe?: boolean;
}

export const useSwipeGesture = (
  callbacks: SwipeCallbacks,
  options: SwipeOptions = {}
) => {
  const { threshold = 100, preventScrollOnSwipe = false } = options;
  
  const [isPressed, setIsPressed] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const pos = { x: touch.clientX, y: touch.clientY };
    
    setIsPressed(true);
    setStartPos(pos);
    setCurrentPos(pos);
    setIsDragging(false);
    
    callbacks.onSwipeStart?.();
  }, [callbacks]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPressed || !startPos || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const currentPosition = { x: touch.clientX, y: touch.clientY };
    
    const deltaX = Math.abs(currentPosition.x - startPos.x);
    const deltaY = Math.abs(currentPosition.y - startPos.y);
    
    // Only start dragging if horizontal movement is greater than vertical
    if (deltaX > deltaY && deltaX > 10) {
      setIsDragging(true);
      
      if (preventScrollOnSwipe) {
        e.preventDefault();
      }
    }
    
    setCurrentPos(currentPosition);
  }, [isPressed, startPos, preventScrollOnSwipe]);

  const handleTouchEnd = useCallback(() => {
    if (!isPressed || !startPos || !currentPos) {
      setIsPressed(false);
      setStartPos(null);
      setCurrentPos(null);
      setIsDragging(false);
      return;
    }
    
    const deltaX = currentPos.x - startPos.x;
    const deltaY = Math.abs(currentPos.y - startPos.y);
    
    // Only trigger swipe if horizontal movement is significant and greater than vertical
    if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > deltaY) {
      if (deltaX > 0) {
        callbacks.onSwipeRight?.();
      } else {
        callbacks.onSwipeLeft?.();
      }
    }
    
    setIsPressed(false);
    setStartPos(null);
    setCurrentPos(null);
    setIsDragging(false);
    
    callbacks.onSwipeEnd?.();
  }, [isPressed, startPos, currentPos, threshold, callbacks]);

  const getSwipeDistance = useCallback(() => {
    if (!startPos || !currentPos) return 0;
    return currentPos.x - startPos.x;
  }, [startPos, currentPos]);
  
  const getSwipeProgress = useCallback(() => {
    const distance = Math.abs(getSwipeDistance());
    return Math.min(distance / threshold, 1);
  }, [getSwipeDistance, threshold]);

  const swipeHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd,
  };

  return {
    swipeHandlers,
    isDragging,
    isPressed,
    getSwipeDistance,
    getSwipeProgress,
    swipeDirection: startPos && currentPos ? 
      (currentPos.x > startPos.x ? 'right' : 'left') : null
  };
};