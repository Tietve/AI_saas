/**
 * DocumentQuotaBar Component
 *
 * Visual quota indicator (5 documents max)
 */

import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

interface DocumentQuotaBarProps {
  current: number;
  max: number;
}

export const DocumentQuotaBar: React.FC<DocumentQuotaBarProps> = ({ current, max }) => {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= max;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography variant="body2" fontWeight="medium">
          Document Quota
        </Typography>
        <Typography
          variant="body2"
          color={isAtLimit ? 'error.main' : isNearLimit ? 'warning.main' : 'text.secondary'}
        >
          {current} / {max} documents
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(percentage, 100)}
        color={isAtLimit ? 'error' : isNearLimit ? 'warning' : 'primary'}
      />
    </Box>
  );
};
