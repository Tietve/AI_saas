import { Box, Typography, Collapse, Alert } from '@mui/material';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { useState, useEffect } from 'react';

/**
 * Offline Banner Component
 * Displays a banner when the user loses internet connection
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      // User went offline
      setWasOffline(true);
      setShowReconnected(false);
    } else if (wasOffline && isOnline) {
      // User reconnected after being offline
      setShowReconnected(true);
      setWasOffline(false);

      // Hide "reconnected" message after 3 seconds
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  return (
    <>
      {/* Offline Banner */}
      <Collapse in={!isOnline}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            py: 1.5,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <WifiOff size={20} />
          <Typography variant="body2" fontWeight={600}>
            No internet connection
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Please check your network
          </Typography>
        </Box>
      </Collapse>

      {/* Reconnected Banner */}
      <Collapse in={showReconnected}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            py: 1.5,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <Wifi size={20} />
          <Typography variant="body2" fontWeight={600}>
            Back online!
          </Typography>
        </Box>
      </Collapse>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes slideDown {
            from {
              transform: translateY(-100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </>
  );
}

/**
 * Inline Offline Alert
 * Can be used within components to show offline status
 */
export function OfflineAlert() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <Alert
      severity="warning"
      icon={<WifiOff size={20} />}
      sx={{
        mb: 2,
        borderRadius: 2,
        '& .MuiAlert-icon': {
          alignItems: 'center',
        },
      }}
    >
      <Typography variant="body2" fontWeight={600}>
        You are currently offline
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Some features may not be available until you reconnect
      </Typography>
    </Alert>
  );
}
