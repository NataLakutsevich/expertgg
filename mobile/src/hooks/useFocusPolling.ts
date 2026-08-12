import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Runs `callback` immediately whenever the screen gains focus, then again
 * every `intervalMs` while it stays focused. Polling stops on blur/unmount
 * so background tabs don't keep hitting the API.
 */
export function useFocusPolling(callback: () => void, intervalMs: number): void {
  useFocusEffect(
    useCallback(() => {
      callback();
      const id = setInterval(callback, intervalMs);
      return () => clearInterval(id);
    }, [callback, intervalMs]),
  );
}
