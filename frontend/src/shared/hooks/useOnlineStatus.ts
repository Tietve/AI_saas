import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline status
 * Returns true when online, false when offline
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    // Update network status
    const handleOnline = () => {
      console.log('🌐 Network status: ONLINE');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('🌐 Network status: OFFLINE');
      setIsOnline(false);
    };

    // Listen to browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Additional check: Try to fetch a small resource to verify connectivity
    const verifyConnection = async () => {
      try {
        await fetch('https://www.google.com/favicon.ico', {
          mode: 'no-cors',
          cache: 'no-store',
        });
        if (!isOnline) {
          setIsOnline(true);
        }
      } catch {
        if (isOnline) {
          setIsOnline(false);
        }
      }
    };

    // Verify connection every 30 seconds
    const intervalId = setInterval(verifyConnection, 30000);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline]);

  return isOnline;
}
