import React from 'react';
import { AlertTriangle, RefreshCw, ServerOff, Info } from 'lucide-react';

/**
 * ErrorBlock (Plan.md Phase F2.1.T2)
 * Diagnostic error surface distinguishing transport/network disconnects from backend errors.
 * Provides a 1-click "Retry Query" action.
 */
export const ErrorBlock = ({ block, onRetry }) => {
  if (!block) return null;

  const { message, errorType = 'backend', canRetry = true } = block;
  const isTransport = errorType === 'transport' || /connect|network|fetch/i.test(message);

  return (
    <div
      style={{
        padding: '14px 16px',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
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
          color: '#dc2626',
          marginBottom: '6px'
        }}
      >
        {isTransport ? <ServerOff size={15} /> : <AlertTriangle size={15} />}
        <span>{isTransport ? 'Gateway Disconnected' : 'Advisory Run Error'}</span>
      </div>

      <div
        style={{
          color: 'var(--text-primary, #0f172a)',
          lineHeight: 1.45,
          marginBottom: canRetry && onRetry ? '12px' : '0'
        }}
      >
        {message}
      </div>

      {canRetry && onRetry && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onRetry}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(220, 38, 38, 0.25)',
              transition: 'background-color 0.15s'
            }}
          >
            <RefreshCw size={12} />
            <span>Retry Query</span>
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * SkeletonBlock (Plan.md Phase F2.1.T1)
 * Shimmer loader for pre-first-token state.
 */
export const SkeletonBlock = ({ statusMessage }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        backgroundColor: 'var(--bg-secondary, #f8fafc)',
        borderRadius: '8px',
        border: '1px solid var(--border-color, #e2e8f0)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.74rem',
          color: 'var(--accent-blue, #0284c7)',
          fontWeight: '600'
        }}
      >
        <RefreshCw size={13} className="animate-spin" />
        <span>{statusMessage || 'Thinking & querying telemetry...'}</span>
      </div>
      <div
        style={{
          height: '10px',
          width: '75%',
          backgroundColor: 'var(--border-color, #e2e8f0)',
          borderRadius: '4px',
          opacity: 0.6
        }}
      />
      <div
        style={{
          height: '10px',
          width: '45%',
          backgroundColor: 'var(--border-color, #e2e8f0)',
          borderRadius: '4px',
          opacity: 0.4
        }}
      />
    </div>
  );
};

/**
 * EmptyBlock (Plan.md Phase F2.1.T3)
 * Shown when no structured data or text arrived.
 */
export const EmptyBlock = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '12px',
        backgroundColor: 'var(--bg-secondary, #f8fafc)',
        borderRadius: '8px',
        border: '1px solid var(--border-color, #e2e8f0)',
        fontSize: '0.74rem',
        color: 'var(--text-muted, #64748b)'
      }}
    >
      <Info size={14} />
      <span>No structured advisory generated for this turn.</span>
    </div>
  );
};
