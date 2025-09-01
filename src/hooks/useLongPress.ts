import { useCallback, useRef, useState } from 'react';

interface LongPressOptions {
  threshold?: number;
  onStart?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
}

export const useLongPress = (
  callback: () => void,
  options: LongPressOptions = {}
) => {
  const { threshold = 500, onStart, onFinish, onCancel } = options;
  
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback((clientX: number, clientY: number) => {
    setIsPressed(true);
    startPosRef.current = { x: clientX, y: clientY };
    onStart?.();

    timeoutRef.current = setTimeout(() => {
      callback();
      onFinish?.();
      setIsPressed(false);
    }, threshold);
  }, [callback, threshold, onStart, onFinish]);

  const clear = useCallback((shouldCancel = true) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    
    if (isPressed && shouldCancel) {
      onCancel?.();
    }
    
    setIsPressed(false);
    startPosRef.current = null;
  }, [isPressed, onCancel]);

  const checkMove = useCallback((clientX: number, clientY: number) => {
    if (!startPosRef.current) return;
    
    const moveThreshold = 10;
    const deltaX = Math.abs(clientX - startPosRef.current.x);
    const deltaY = Math.abs(clientY - startPosRef.current.y);
    
    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      clear(true);
    }
  }, [clear]);

  // Mouse events
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    start(e.clientX, e.clientY);
  }, [start]);

  const onMouseUp = useCallback(() => {
    clear(true);
  }, [clear]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPressed) {
      checkMove(e.clientX, e.clientY);
    }
  }, [isPressed, checkMove]);

  const onMouseLeave = useCallback(() => {
    clear(true);
  }, [clear]);

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      start(touch.clientX, touch.clientY);
    }
  }, [start]);

  const onTouchEnd = useCallback(() => {
    clear(true);
  }, [clear]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (isPressed && e.touches.length === 1) {
      const touch = e.touches[0];
      checkMove(touch.clientX, touch.clientY);
    }
  }, [isPressed, checkMove]);

  return {
    isPressed,
    handlers: {
      onMouseDown,
      onMouseUp,
      onMouseMove,
      onMouseLeave,
      onTouchStart,
      onTouchEnd,
      onTouchMove,
    }
  };
};