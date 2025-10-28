import { useCallback, useRef, useEffect, MouseEvent, TouchEvent } from 'react';

export const useLongPress = (
  callback: () => void,
  { ms = 3000 } = {}
) => {
  // Fix: Initialize useRef with null. Calling useRef() without arguments is valid
  // in TypeScript, but can be flagged by stricter linters. Providing an initial 
  // value satisfies these rules and resolves the "Expected 1 arguments, but got 0" error.
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const target = useRef<EventTarget | null>(null);

  const start = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (target.current && target.current !== event.target) {
        return;
      }
      target.current = event.target;
      // Clear any existing timeout to prevent multiple timers running.
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      timeout.current = setTimeout(() => callback(), ms);
    },
    [callback, ms]
  );

  const clear = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
    target.current = null;
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
        clear();
    };
  }, [clear]);

  return {
    onMouseDown: (e: MouseEvent) => start(e),
    onTouchStart: (e: TouchEvent) => start(e),
    onMouseUp: () => clear(),
    onMouseLeave: () => clear(),
    onTouchEnd: () => clear(),
  };
};

