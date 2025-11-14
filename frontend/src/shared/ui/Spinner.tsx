import { CircularProgress, Box } from '@mui/material';
import type { CircularProgressProps } from '@mui/material';

interface SpinnerProps extends CircularProgressProps {
  fullScreen?: boolean;
  message?: string;
}

export function Spinner({ fullScreen, message, ...props }: SpinnerProps) {
  const spinner = (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <CircularProgress {...props} />
      {message && (
        <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          {message}
        </Box>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100%',
        }}
      >
        {spinner}
      </Box>
    );
  }

  return spinner;
}
