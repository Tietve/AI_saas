import { memo, useState, useRef, useEffect } from 'react';
import { Box, IconButton, Collapse, Typography } from '@mui/material';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  /** Content to be collapsible */
  children: React.ReactNode;
  /** Maximum number of lines before auto-collapsing (default: 20) */
  maxLines?: number;
  /** Label to show when collapsed (e.g., "Python code - 45 lines") */
  collapsedLabel?: string;
  /** Always start collapsed (default: auto-detect based on content) */
  defaultCollapsed?: boolean;
  /** Additional className */
  className?: string;
  /** Type of content (affects styling) */
  contentType?: 'code' | 'text';
}

/**
 * Collapsible section component for long content
 * Auto-collapses content that exceeds maxLines threshold
 *
 * Example:
 * <CollapsibleSection maxLines={15} collapsedLabel="Long code block">
 *   <pre><code>...</code></pre>
 * </CollapsibleSection>
 */
export const CollapsibleSection = memo(function CollapsibleSection({
  children,
  maxLines = 20,
  collapsedLabel = 'Show content',
  defaultCollapsed,
  className,
  contentType = 'code',
}: CollapsibleSectionProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [shouldCollapse, setShouldCollapse] = useState(false);
  const [lineCount, setLineCount] = useState(0);

  // Measure content height and determine if it should be collapsible
  useEffect(() => {
    // Set initial collapse state immediately from defaultCollapsed if provided
    if (defaultCollapsed !== undefined) {
      setIsCollapsed(defaultCollapsed);
      setShouldCollapse(true); // If defaultCollapsed is set, assume it should be collapsible
    }

    if (!contentRef.current) return;

    const measureContent = () => {
      const element = contentRef.current;
      if (!element) return;

      // For code blocks, count lines by looking at line breaks
      if (contentType === 'code') {
        const codeElement = element.querySelector('code');
        if (codeElement) {
          const text = codeElement.textContent || '';
          const lines = text.split('\n').length;
          setLineCount(lines);

          const shouldCollapseNow = lines > maxLines;
          setShouldCollapse(shouldCollapseNow);

          // Only update collapse state if defaultCollapsed was not provided
          if (defaultCollapsed === undefined) {
            setIsCollapsed(shouldCollapseNow);
          }
        }
      } else {
        // For text, estimate lines based on height
        const lineHeight = parseInt(window.getComputedStyle(element).lineHeight) || 24;
        const height = element.scrollHeight;
        const estimatedLines = Math.ceil(height / lineHeight);
        setLineCount(estimatedLines);

        const shouldCollapseNow = estimatedLines > maxLines;
        setShouldCollapse(shouldCollapseNow);

        // Only update collapse state if defaultCollapsed was not provided
        if (defaultCollapsed === undefined) {
          setIsCollapsed(shouldCollapseNow);
        }
      }
    };

    // Measure after content is rendered
    const timer = setTimeout(measureContent, 100);

    // Re-measure on window resize
    window.addEventListener('resize', measureContent);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measureContent);
    };
  }, [children, maxLines, contentType, defaultCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // If content doesn't need collapsing, render as-is
  if (!shouldCollapse) {
    return <Box className={className}>{children}</Box>;
  }

  return (
    <Box className={className} sx={{ position: 'relative' }}>
      {/* Collapsed state - show preview and expand button */}
      {isCollapsed ? (
        <Box
          sx={{
            position: 'relative',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: contentType === 'code' ? '#1e1e1e' : 'rgba(0, 0, 0, 0.02)',
            '.dark &': {
              border: '1px solid rgba(255, 255, 255, 0.15)',
              bgcolor: contentType === 'code' ? '#0d1117' : 'rgba(255, 255, 255, 0.03)',
            },
          }}
        >
          {/* Collapsed label */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: contentType === 'code' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                '.dark &': {
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                },
              },
            }}
            onClick={toggleCollapse}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: contentType === 'code' ? 'Consolas, Monaco, monospace' : 'inherit',
                  color: contentType === 'code' ? 'rgba(255, 255, 255, 0.9)' : '#525252',
                  fontWeight: 500,
                  '.dark &': {
                    color: contentType === 'code' ? 'rgba(255, 255, 255, 0.9)' : '#d4d4d8',
                  },
                }}
              >
                {collapsedLabel}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: contentType === 'code' ? 'rgba(255, 255, 255, 0.6)' : '#737373',
                  '.dark &': {
                    color: contentType === 'code' ? 'rgba(255, 255, 255, 0.6)' : '#a1a1aa',
                  },
                }}
              >
                ({lineCount} lines)
              </Typography>
            </Box>

            <IconButton
              size="small"
              sx={{
                color: contentType === 'code' ? 'rgba(255, 255, 255, 0.8)' : '#525252',
                '.dark &': {
                  color: contentType === 'code' ? 'rgba(255, 255, 255, 0.8)' : '#d4d4d8',
                },
              }}
            >
              <ChevronDown size={20} />
            </IconButton>
          </Box>
        </Box>
      ) : (
        /* Expanded state - show full content with collapse button */
        <Box sx={{ position: 'relative' }}>
          {/* Collapse button positioned at top-right */}
          <IconButton
            onClick={toggleCollapse}
            size="small"
            sx={{
              position: 'absolute',
              top: contentType === 'code' ? 8 : 4,
              right: contentType === 'code' ? 48 : 4, // Offset for language label in code blocks
              zIndex: 2,
              bgcolor: contentType === 'code' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              color: contentType === 'code' ? 'rgba(255, 255, 255, 0.9)' : '#525252',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': {
                bgcolor: contentType === 'code' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
              },
              '.dark &': {
                bgcolor: contentType === 'code' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.08)',
                color: contentType === 'code' ? 'rgba(255, 255, 255, 0.9)' : '#d4d4d8',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                },
              },
            }}
            title="Collapse"
          >
            <ChevronUp size={16} />
          </IconButton>

          {/* Full content */}
          <Box ref={contentRef}>{children}</Box>
        </Box>
      )}
    </Box>
  );
});
