import { Box, Button, Typography, Paper, Collapse, IconButton } from '@mui/material';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ROUTES } from '@/shared/constants/routes';

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

/**
 * Error Fallback UI
 * Displayed when ErrorBoundary catches an error
 */
export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const isDev = import.meta.env.DEV;
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          maxWidth: 600,
          width: '100%',
          p: 4,
          textAlign: 'center',
        }}
      >
        {/* Error Icon with animation */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 3,
            animation: 'shake 0.5s ease-in-out',
          }}
        >
          <Box
            sx={{
              p: 3,
              borderRadius: '50%',
              bgcolor: 'error.light',
              opacity: 0.15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertCircle size={64} color="#f44336" />
          </Box>
        </Box>

        {/* Error Title */}
        <Typography variant="h4" component="h1" gutterBottom>
          Oops! Something went wrong
        </Typography>

        {/* Error Description */}
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          We're sorry for the inconvenience. An unexpected error has occurred.
          Please try refreshing the page or contact support if the problem persists.
        </Typography>

        {/* Error Details Toggle (Development Only) */}
        {isDev && error && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="text"
              size="small"
              onClick={() => setShowDetails(!showDetails)}
              endIcon={showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              sx={{ mb: 1, textTransform: 'none' }}
            >
              {showDetails ? 'Hide' : 'Show'} Technical Details
            </Button>
            <Collapse in={showDetails}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  textAlign: 'left',
                  bgcolor: 'grey.100',
                  maxHeight: 300,
                  overflow: 'auto',
                }}
              >
                <Typography
                  variant="caption"
                  component="div"
                  sx={{ fontWeight: 600, mb: 1, color: 'error.main' }}
                >
                  Error Message:
                </Typography>
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    mb: 2,
                  }}
                >
                  {error.message}
                </Typography>
                <Typography
                  variant="caption"
                  component="div"
                  sx={{ fontWeight: 600, mb: 1, color: 'error.main' }}
                >
                  Stack Trace:
                </Typography>
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {error.stack}
                </Typography>
              </Paper>
            </Collapse>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<RefreshCw size={20} />}
            onClick={onReset}
            size="large"
            sx={{
              textTransform: 'none',
              px: 3,
            }}
          >
            Try Again
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshCw size={20} />}
            onClick={() => window.location.reload()}
            size="large"
            sx={{
              textTransform: 'none',
              px: 3,
            }}
          >
            Reload Page
          </Button>

          <Button
            variant="text"
            startIcon={<Home size={20} />}
            onClick={() => navigate(ROUTES.CHAT)}
            size="large"
            sx={{
              textTransform: 'none',
              px: 3,
            }}
          >
            Go Home
          </Button>
        </Box>

        {/* Support Info */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 3, display: 'block' }}
        >
          Error ID: {Date.now().toString(36)}
          {isDev && ' (Development Mode)'}
        </Typography>
      </Paper>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
        `}
      </style>
    </Box>
  );
}
