import React from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';

/**
 * ClarificationPrompt (Plan.md Phase F2.2)
 * Renders an interactive card when Agent Jane interrupts for ambiguous requests.
 * Offers quick-reply suggestion chips for fleet assets to resume the paused run in 1 click.
 */
export const ClarificationPrompt = ({ block, onSelectSuggestion }) => {
  if (!block) return null;

  const { question, suggestions = ['FSWS-001-A', 'FS-031', 'FS-010'] } = block;

  return (
    <div
      style={{
        padding: '14px 16px',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '10px',
        fontSize: '0.8rem'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: '700',
          color: '#d97706',
          marginBottom: '6px'
        }}
      >
        <HelpCircle size={15} />
        <span>Clarification Needed</span>
      </div>

      <div
        style={{
          color: 'var(--text-primary, #0f172a)',
          lineHeight: 1.5,
          marginBottom: '12px'
        }}
      >
        {question}
      </div>

      {suggestions && suggestions.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted, #64748b)',
              fontWeight: '600',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            Quick Select Target Well:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {suggestions.map((assetId) => (
              <button
                key={assetId}
                type="button"
                onClick={() => onSelectSuggestion && onSelectSuggestion(assetId)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  backgroundColor: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: '600',
                  color: 'var(--accent-blue, #0284c7)',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{assetId}</span>
                <ArrowRight size={11} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
