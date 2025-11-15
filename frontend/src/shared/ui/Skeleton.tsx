import { Box, SxProps, Theme } from '@mui/material';

/**
 * Props for Skeleton component
 *
 * Fix: Added 'sx' prop to support Material-UI's sx styling system
 * This allows for additional styling customization (margins, padding, etc.)
 * while maintaining TypeScript type safety
 */
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | false;
  sx?: SxProps<Theme>; // Material-UI sx prop for additional styling
}

/**
 * Skeleton Loading Component
 * Displays placeholder content while data is loading
 *
 * Fix: Now accepts and merges 'sx' prop for additional styling
 */
export function Skeleton({
  width = '100%',
  height = '1rem',
  variant = 'text',
  animation = 'pulse',
  sx,
}: SkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'text':
        return {
          borderRadius: '4px',
          height: height,
        };
      case 'circular':
        return {
          borderRadius: '50%',
          width: height,
          height: height,
        };
      case 'rectangular':
        return {
          borderRadius: 0,
        };
      case 'rounded':
        return {
          borderRadius: '12px',
        };
      default:
        return {};
    }
  };

  return (
    <Box
      sx={{
        width: variant === 'circular' ? height : width,
        height: height,
        bgcolor: 'action.hover',
        ...getVariantStyles(),
        animation: animation ? `${animation} 1.5s ease-in-out infinite` : 'none',
        '@keyframes pulse': {
          '0%': {
            opacity: 1,
          },
          '50%': {
            opacity: 0.4,
          },
          '100%': {
            opacity: 1,
          },
        },
        '@keyframes wave': {
          '0%': {
            transform: 'translateX(-100%)',
          },
          '50%, 100%': {
            transform: 'translateX(100%)',
          },
        },
        // Merge incoming sx prop for additional styling (e.g., margins, padding)
        ...sx,
      }}
    >
      {animation === 'wave' && (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            animation: 'wave 1.5s ease-in-out infinite',
          }}
        />
      )}
    </Box>
  );
}

/**
 * Message Skeleton - Loading state for chat messages
 */
export function MessageSkeleton() {
  return (
    <Box sx={{ p: 2, maxWidth: '800px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Skeleton variant="circular" height="40px" />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="30%" height="16px" sx={{ mb: 1 }} />
          <Skeleton width="100%" height="14px" sx={{ mb: 0.5 }} />
          <Skeleton width="90%" height="14px" sx={{ mb: 0.5 }} />
          <Skeleton width="70%" height="14px" />
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Conversation List Skeleton - Loading state for conversation list
 */
export function ConversationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Box sx={{ p: 2 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          sx={{
            p: 2,
            mb: 1,
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <Skeleton width="70%" height="18px" sx={{ mb: 1 }} />
          <Skeleton width="50%" height="14px" />
        </Box>
      ))}
    </Box>
  );
}

/**
 * Card Skeleton - Loading state for cards
 */
export function CardSkeleton() {
  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Skeleton width="60%" height="24px" sx={{ mb: 2 }} />
      <Skeleton width="100%" height="16px" sx={{ mb: 1 }} />
      <Skeleton width="90%" height="16px" sx={{ mb: 1 }} />
      <Skeleton width="80%" height="16px" />
    </Box>
  );
}

/**
 * List Item Skeleton - Loading state for list items
 */
export function ListItemSkeleton() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: 'action.hover',
        mb: 1,
      }}
    >
      <Skeleton variant="circular" height="48px" />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="40%" height="18px" sx={{ mb: 0.5 }} />
        <Skeleton width="60%" height="14px" />
      </Box>
    </Box>
  );
}

/**
 * Table Skeleton - Loading state for tables
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', gap: 2, p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Skeleton width="25%" height="20px" />
        <Skeleton width="25%" height="20px" />
        <Skeleton width="25%" height="20px" />
        <Skeleton width="25%" height="20px" />
      </Box>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            gap: 2,
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Skeleton width="25%" height="16px" />
          <Skeleton width="25%" height="16px" />
          <Skeleton width="25%" height="16px" />
          <Skeleton width="25%" height="16px" />
        </Box>
      ))}
    </Box>
  );
}
