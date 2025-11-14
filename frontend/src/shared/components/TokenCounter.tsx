import { memo, useMemo } from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import { AlertCircle, Zap } from 'lucide-react';
import { countTokens, formatTokenCount, estimateCost, exceedsLimit } from '@/shared/utils/tokenCounter';

interface TokenCounterProps {
  /** Text content to count tokens for */
  content: string;
  /** Display mode: 'compact' (chip only) or 'detailed' (with cost estimate) */
  mode?: 'compact' | 'detailed';
  /** Token limit to warn about (default: 4096) */
  limit?: number;
  /** Show warning if exceeds limit */
  showWarning?: boolean;
  /** AI model for cost estimation */
  model?: string;
  /** Additional className */
  className?: string;
}

export const TokenCounter = memo(function TokenCounter({
  content,
  mode = 'compact',
  limit = 4096,
  showWarning = true,
  model = 'gpt-4',
  className,
}: TokenCounterProps) {
  const tokenCount = useMemo(() => countTokens(content), [content]);
  const isOverLimit = useMemo(() => exceedsLimit(tokenCount, limit), [tokenCount, limit]);
  const cost = useMemo(() => estimateCost(tokenCount, model), [tokenCount, model]);

  if (tokenCount === 0) {
    return null;
  }

  const formattedCount = formatTokenCount(tokenCount);
  const formattedCost = cost < 0.01 ? '<$0.01' : `$${cost.toFixed(4)}`;

  if (mode === 'compact') {
    return (
      <Tooltip
        title={
          <Box>
            <Typography variant="caption" display="block">
              {tokenCount.toLocaleString()} tokens
            </Typography>
            <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
              Estimated cost: {formattedCost}
            </Typography>
            {isOverLimit && showWarning && (
              <Typography variant="caption" display="block" color="warning.main" sx={{ mt: 0.5 }}>
                Exceeds {limit.toLocaleString()} token limit
              </Typography>
            )}
          </Box>
        }
        arrow
      >
        <Chip
          icon={<Zap size={14} />}
          label={formattedCount}
          size="small"
          className={className}
          color={isOverLimit && showWarning ? 'warning' : 'default'}
          sx={{
            height: 20,
            fontSize: '0.7rem',
            '& .MuiChip-icon': {
              fontSize: 14,
              ml: 0.5,
            },
            '& .MuiChip-label': {
              px: 1,
            },
            opacity: 0.8,
            '&:hover': {
              opacity: 1,
            },
          }}
        />
      </Tooltip>
    );
  }

  // Detailed mode
  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        bgcolor: 'rgba(0, 0, 0, 0.03)',
        borderRadius: 1,
        border: isOverLimit && showWarning ? '1px solid' : 'none',
        borderColor: 'warning.main',
      }}
    >
      <Zap size={16} style={{ opacity: 0.7 }} />
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {tokenCount.toLocaleString()} tokens
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.7, ml: 1 }}>
          ≈ {formattedCost}
        </Typography>
      </Box>
      {isOverLimit && showWarning && (
        <Tooltip title={`Exceeds ${limit.toLocaleString()} token limit`}>
          <AlertCircle size={16} color="#ff9800" />
        </Tooltip>
      )}
    </Box>
  );
});
