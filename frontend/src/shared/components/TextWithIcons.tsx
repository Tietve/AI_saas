import { memo } from 'react';
import { Box } from '@mui/material';
import { parseIconsInText } from '@/shared/utils/iconParser';

interface TextWithIconsProps {
  /** Text containing :icon_name: syntax */
  text: string;
  /** Icon size in pixels (default: 16) */
  iconSize?: number;
  /** Additional className */
  className?: string;
  /** Icon color (default: inherit) */
  iconColor?: string;
}

/**
 * Renders text with inline icons
 * Supports :icon_name: syntax (like Discord/Slack)
 *
 * Example:
 * "Great work :fire: :rocket: Keep it up :thumbsup:"
 * -> "Great work 🔥 🚀 Keep it up 👍" (with actual icon components)
 */
export const TextWithIcons = memo(function TextWithIcons({
  text,
  iconSize = 16,
  className,
  iconColor = 'inherit',
}: TextWithIconsProps) {
  const parts = parseIconsInText(text);

  return (
    <Box
      component="span"
      className={className}
      sx={{
        display: 'inline',
        '& .inline-icon': {
          display: 'inline-block',
          verticalAlign: 'text-bottom',
          mx: 0.25,
        },
      }}
    >
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return <span key={index}>{part}</span>;
        }

        // Render icon
        const { Icon, name } = part;
        return (
          <Box
            key={index}
            component="span"
            className="inline-icon"
            aria-label={`${name} icon`}
            title={`:${name}:`}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              verticalAlign: 'middle',
              color: iconColor,
            }}
          >
            <Icon size={iconSize} />
          </Box>
        );
      })}
    </Box>
  );
});
