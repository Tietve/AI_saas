import { Box, Card, CardContent, Typography } from '@mui/material';
import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
}

export function FeatureCard({ icon: Icon, title, description, onClick }: FeatureCardProps) {
  return (
    <Card
      className="hover-lift animate-fade-in"
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 'var(--radius-large)',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-small)',
        border: 1,
        borderColor: 'var(--border-color)',
        transition: 'var(--transition-fast)',
        '&:hover': onClick
          ? {
              boxShadow: 'var(--shadow-medium)',
              transform: 'translateY(-4px)',
              borderColor: 'var(--primary-500)',
            }
          : {},
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-medium)',
            background: 'var(--gradient-button)',
            color: 'var(--text-inverse)',
            mb: 2,
            boxShadow: 'var(--shadow-small)',
          }}
        >
          <Icon size={24} />
        </Box>

        <Typography
          variant="h6"
          sx={{
            mb: 1,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}
