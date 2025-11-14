import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Box } from '@mui/material';
import { memo } from 'react';
import { remarkIcons } from '@/shared/utils/remarkIcons';
import { getIcon } from '@/shared/utils/iconParser';
import { CollapsibleSection } from './CollapsibleSection';

// Import KaTeX CSS
import 'katex/dist/katex.min.css';
// Import highlight.js themes - using github-dark for both modes (better contrast)
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <Box
      className={className}
      sx={{
        '& p': {
          mb: 2,
          lineHeight: 1.7,
          '&:last-child': { mb: 0 },
        },
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          mt: 3,
          mb: 2,
          fontWeight: 600,
          lineHeight: 1.4,
          '&:first-of-type': { mt: 0 },
        },
        '& h1': { fontSize: '2em' },
        '& h2': { fontSize: '1.5em' },
        '& h3': { fontSize: '1.25em' },
        '& h4': { fontSize: '1.1em' },
        '& ul, & ol': {
          pl: 4,
          mb: 2,
          '& li': {
            mb: 1,
            lineHeight: 1.6,
          },
        },
        '& ul': {
          listStyleType: 'disc',
        },
        '& ol': {
          listStyleType: 'decimal',
        },
        '& blockquote': {
          borderLeft: '4px solid var(--primary-500)',
          pl: 2,
          py: 1,
          my: 2,
          bgcolor: 'var(--bg-secondary, rgba(0, 0, 0, 0.05))',
          fontStyle: 'italic',
          borderRadius: '4px',
          '.dark &': {
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            borderLeftColor: 'var(--primary-400)',
          },
        },
        '& pre': {
          bgcolor: '#1e1e1e',
          p: 2,
          borderRadius: 2,
          overflow: 'auto',
          my: 2,
          fontSize: '0.9em',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          '.dark &': {
            bgcolor: '#0d1117',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          },
          '& code': {
            bgcolor: 'transparent',
            p: 0,
            color: 'inherit',
            fontSize: 'inherit',
          },
        },
        '& code': {
          bgcolor: 'rgba(0, 0, 0, 0.08)',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          fontSize: '0.9em',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          color: '#e11d48',
          '.dark &': {
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            color: '#fb7185',
          },
        },
        '& table': {
          width: '100%',
          borderCollapse: 'collapse',
          my: 2,
          '& th, & td': {
            border: '1px solid var(--border-color, rgba(0, 0, 0, 0.1))',
            px: 2,
            py: 1.5,
            textAlign: 'left',
          },
          '& th': {
            bgcolor: 'rgba(0, 0, 0, 0.05)',
            fontWeight: 600,
            '.dark &': {
              bgcolor: 'rgba(255, 255, 255, 0.05)',
            },
          },
          '.dark &': {
            '& th, & td': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
          },
        },
        '& hr': {
          border: 'none',
          borderTop: '1px solid var(--border-color, rgba(0, 0, 0, 0.1))',
          my: 3,
          '.dark &': {
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
          },
        },
        '& a': {
          color: 'var(--primary-600)',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
            color: 'var(--primary-700)',
          },
          '.dark &': {
            color: 'var(--primary-400)',
            '&:hover': {
              color: 'var(--primary-300)',
            },
          },
        },
        '& img': {
          maxWidth: '100%',
          height: 'auto',
          borderRadius: 2,
          my: 2,
        },
        // KaTeX styling - Improved dark mode support
        '& .katex': {
          fontSize: '1.1em',
          color: '#1a1a1a !important',
          '.dark &': {
            color: '#e5e5e5 !important',
          },
        },
        '& .katex-display': {
          my: 2,
          overflow: 'auto',
          color: '#1a1a1a !important',
          '.dark &': {
            color: '#e5e5e5 !important',
          },
        },
        '& .katex-html': {
          color: '#1a1a1a !important',
          '.dark &': {
            color: '#e5e5e5 !important',
          },
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkIcons]}
        rehypePlugins={[
          rehypeKatex,
          rehypeHighlight,
          rehypeRaw, // Allow HTML in markdown (sanitized by DOMPurify if needed)
        ]}
        components={{
          // Custom icon renderer
          icon({ node }: any) {
            const iconName = node.iconName || node.properties?.iconName;
            if (!iconName) return null;

            const Icon = getIcon(iconName);
            if (!Icon) return <>{`:${iconName}:`}</>;

            return (
              <Box
                component="span"
                aria-label={`${iconName} icon`}
                title={`:${iconName}:`}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  verticalAlign: 'middle',
                  mx: 0.25,
                }}
              >
                <Icon size={16} />
              </Box>
            );
          },
          // Custom code block with language label and collapsible support
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const inline = !match;

            if (!inline && language) {
              // Count lines in code
              const codeText = String(children).replace(/\n$/, '');
              const lineCount = codeText.split('\n').length;
              const shouldCollapse = lineCount > 20;

              const codeBlock = (
                <Box sx={{ position: 'relative' }}>
                  {/* Language label */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 12,
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      zIndex: 1,
                    }}
                  >
                    {language}
                  </Box>
                  <pre className={className}>
                    <code {...props} className={className}>
                      {children}
                    </code>
                  </pre>
                </Box>
              );

              // Only wrap in CollapsibleSection if code is actually long
              if (shouldCollapse) {
                return (
                  <CollapsibleSection
                    maxLines={20}
                    collapsedLabel={`${language.toUpperCase()} code - ${lineCount} lines`}
                    defaultCollapsed={true}
                    contentType="code"
                  >
                    {codeBlock}
                  </CollapsibleSection>
                );
              }

              // Short code blocks render directly
              return codeBlock;
            }

            return (
              <code {...props} className={className}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
});
