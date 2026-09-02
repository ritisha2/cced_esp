import React from 'react';
import { BLOCK_KINDS } from '../../services/agentResponseNormalizer';
import { AgentMarkdownRenderer } from '../AgentMarkdownRenderer';
import { MetricsStrip } from './MetricsStrip';
import { AdvisoryDetail } from './AdvisoryDetail';
import { ClarificationPrompt } from './ClarificationPrompt';
import { DataTable } from './DataTable';
import { ErrorBlock, EmptyBlock } from './StateBlocks';

/**
 * BlockRenderer (Plan.md Phase F1.3.T1)
 * Registry mapping canonical block kinds to their dedicated presentation components.
 * Guarantees zero crashes on unknown blocks.
 */
export const BlockRenderer = ({ block, onSelectSuggestion, onRetry }) => {
  if (!block) return null;

  switch (block.kind) {
    case BLOCK_KINDS.TEXT:
      return <AgentMarkdownRenderer content={block.content} />;

    case BLOCK_KINDS.METRICS:
      return <MetricsStrip block={block} />;

    case BLOCK_KINDS.ADVISORY_DETAILS:
      return <AdvisoryDetail block={block} />;

    case BLOCK_KINDS.CLARIFICATION:
      return (
        <ClarificationPrompt
          block={block}
          onSelectSuggestion={onSelectSuggestion}
        />
      );

    case BLOCK_KINDS.TABLE:
      return <DataTable block={block} />;

    case BLOCK_KINDS.ERROR:
      return <ErrorBlock block={block} onRetry={onRetry} />;

    case 'empty':
      return <EmptyBlock />;

    default:
      // Unknown block kind: safe fallback without crashing
      return (
        <div
          style={{
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono, monospace)',
            padding: '8px',
            backgroundColor: 'var(--bg-secondary, #f8fafc)',
            borderRadius: '6px',
            color: 'var(--text-muted, #64748b)'
          }}
        >
          <pre style={{ margin: 0, overflowX: 'auto' }}>
            {JSON.stringify(block, null, 2)}
          </pre>
        </div>
      );
  }
};
