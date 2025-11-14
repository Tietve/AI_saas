import { Box, LinearProgress, Typography, Tooltip, Chip } from '@mui/material';
import { AlertCircle, TrendingUp } from 'lucide-react';

interface TokenUsageBarProps {
  used: number;
  limit: number;
  planTier: 'free' | 'plus' | 'pro';
}

// Plan limits (for reference)
// const planLimits = {
//   free: 100000,
//   plus: 500000,
//   pro: 2000000,
// };

const planNames = {
  free: 'Free',
  plus: 'Plus',
  pro: 'Pro',
};

export function TokenUsageBar({ used, limit, planTier }: TokenUsageBarProps) {
  const percentage = (used / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isOverLimit = percentage >= 100;

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp size={16} />
          <Typography variant="body2" fontWeight={600}>
            Monthly Token Usage
          </Typography>
          <Chip
            label={planNames[planTier]}
            size="small"
            color={
              planTier === 'pro'
                ? 'secondary'
                : planTier === 'plus'
                ? 'primary'
                : 'default'
            }
            sx={{ height: 20, fontSize: '0.625rem' }}
          />
        </Box>

        {isNearLimit && (
          <Tooltip title="You're approaching your monthly limit">
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'warning.main' }}>
              <AlertCircle size={16} />
            </Box>
          </Tooltip>
        )}
      </Box>

      {/* Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={Math.min(percentage, 100)}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            bgcolor: isOverLimit
              ? 'error.main'
              : isNearLimit
              ? 'warning.main'
              : 'success.main',
          },
        }}
      />

      {/* Usage Stats */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mt: 0.5,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {formatTokens(used)} / {formatTokens(limit)} tokens
        </Typography>
        <Typography
          variant="caption"
          fontWeight={600}
          color={
            isOverLimit ? 'error.main' : isNearLimit ? 'warning.main' : 'success.main'
          }
        >
          {percentage.toFixed(1)}%
        </Typography>
      </Box>

      {/* Warning Message */}
      {isOverLimit && (
        <Box
          sx={{
            mt: 1,
            p: 1,
            bgcolor: 'error.light',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <AlertCircle size={14} />
          <Typography variant="caption" color="error.main" fontWeight={500}>
            Monthly limit reached. Upgrade to continue.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
