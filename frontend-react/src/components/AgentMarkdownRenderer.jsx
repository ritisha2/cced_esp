import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CitationHoverCard } from './CitationHoverCard';

/**
 * AgentMarkdownRenderer
 * High-performance SCADA-themed Markdown renderer powered by react-markdown and remark-gfm.
 * Customizes typography, headers, metric badges, code chips, tables, and blockquote alert boxes.
 */
export const AgentMarkdownRenderer = ({ content }) => {
  if (!content) return null;

  return (
    <div className="agent-markdown-container" style={{ fontSize: '0.82rem', lineHeight: '1.55', color: 'var(--text-primary)' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // H3: Main Section Header
          h3: ({ node, ...props }) => (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              margin: '12px 0 8px 0',
              padding: '6px 10px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: '700',
              color: 'var(--text-primary)'
            }}>
              <span {...props} />
            </div>
          ),

          // H4: Category / Subsection Header
          h4: ({ node, ...props }) => (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              margin: '12px 0 6px 0',
              paddingBottom: '4px',
              borderBottom: '1px solid var(--border-color)',
              fontSize: '0.78rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              <span {...props} />
            </div>
          ),

          // Paragraphs
          p: ({ node, ...props }) => (
            <p style={{ margin: '0 0 8px 0', lineHeight: '1.5' }} {...props} />
          ),

          // Bold Text
          strong: ({ node, ...props }) => (
            <strong style={{ fontWeight: '700', color: 'var(--text-primary)' }} {...props} />
          ),

          // Inline Code & Code Blocks
          code: ({ node, inline, className, children, ...props }) => {
            const isMultiLine = String(children).includes('\n');
            if (isMultiLine) {
              return (
                <div style={{
                  margin: '8px 0',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-card-header)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  overflowX: 'auto'
                }}>
                  <code {...props}>{children}</code>
                </div>
              );
            }
            return (
              <span style={{
                display: 'inline-block',
                padding: '1px 6px',
                margin: '0 2px',
                backgroundColor: 'var(--bg-card-header)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.76rem',
                color: 'var(--accent-blue)',
                fontWeight: '600'
              }} {...props}>
                {children}
              </span>
            );
          },

          // Clickable Citation Links with Rich Hover Card
          a: ({ node, href, children, ...props }) => {
            const rawText = Array.isArray(children) ? children.join('') : String(children || '');
            return (
              <CitationHoverCard
                id={rawText}
                label={rawText}
                href={href}
                observation={`Verified audit record: ${rawText}`}
              />
            );
          },

          // Blockquote: Highlighted Recommendation Card
          blockquote: ({ node, ...props }) => (
            <div style={{
              margin: '10px 0',
              padding: '10px 14px',
              backgroundColor: 'var(--state-warning-bg, rgba(245, 158, 11, 0.08))',
              borderLeft: '4px solid var(--accent-amber, #f59e0b)',
              borderRadius: '0 8px 8px 0',
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
              fontWeight: '500'
            }}>
              <div {...props} />
            </div>
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul style={{ margin: '4px 0 10px 0', paddingLeft: '18px', listStyleType: 'disc' }} {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol style={{ margin: '4px 0 10px 0', paddingLeft: '18px' }} {...props} />
          ),
          li: ({ node, ...props }) => (
            <li style={{ margin: '4px 0', lineHeight: '1.45' }} {...props} />
          ),

          // Tables
          table: ({ node, ...props }) => (
            <div style={{ overflowX: 'auto', margin: '10px 0' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.76rem',
                textAlign: 'left',
                border: '1px solid var(--border-color)'
              }} {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th style={{
              padding: '6px 10px',
              backgroundColor: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-color)',
              fontWeight: '700',
              color: 'var(--text-primary)'
            }} {...props} />
          ),
          td: ({ node, ...props }) => (
            <td style={{
              padding: '6px 10px',
              borderBottom: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }} {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
