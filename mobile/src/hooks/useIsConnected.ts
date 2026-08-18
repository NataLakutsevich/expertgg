import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Tracks live connectivity. `null` until the first NetInfo report arrives
 * (avoids a false "offline" flash on cold start), then true/false.
 */
export function useIsConnected(): boolean | null {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // isInternetReachable can be `null` while it's still being probed;
      // only treat it as offline once NetInfo is sure (`=== false`).
      setIsConnected(Boolean(state.isConnected) && state.isInternetReachable !== false);
    });
    return unsubscribe;
  }, []);

  return isConnected;
}
