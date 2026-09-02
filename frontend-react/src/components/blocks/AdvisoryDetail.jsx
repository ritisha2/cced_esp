import React, { useState } from 'react';
import { AlertOctagon, CheckSquare, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * AdvisoryDetail (Plan.md Phase F1.3)
 * Collapsible engineering detail sections rendering expected_impact, constraints[], and verification[].
 */
export const AdvisoryDetail = ({ block }) => {
  const [isConstraintsOpen, setIsConstraintsOpen] = useState(true);
  const [isVerificationOpen, setIsVerificationOpen] = useState(true);

  if (!block) return null;

  const { expectedImpact, constraints = [], verification = [] } = block;
  const hasConstraints = constraints.length > 0;
  const hasVerification = verification.length > 0;

  if (!expectedImpact && !hasConstraints && !hasVerification) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginTop: '12px'
      }}
    >
      {/* Expected Impact */}
      {expectedImpact && (
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '8px',
            fontSize: '0.76rem',
            color: 'var(--text-primary, #0f172a)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '700',
              color: '#059669',
              marginBottom: '2px'
            }}
          >
            <TrendingUp size={13} />
            <span>Expected Operational Impact</span>
          </div>
          <div style={{ paddingLeft: '19px', lineHeight: 1.4 }}>{expectedImpact}</div>
        </div>
      )}

      {/* Safety Constraints & Forbidden Actions */}
      {hasConstraints && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '8px',
            overflow: 'hidden',
            fontSize: '0.76rem'
          }}
        >
          <button
            type="button"
            onClick={() => setIsConstraintsOpen(!isConstraintsOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#dc2626',
              fontWeight: '700'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertOctagon size={13} />
              <span>Mandatory Safety Constraints ({constraints.length})</span>
            </span>
            {isConstraintsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {isConstraintsOpen && (
            <ul
              style={{
                margin: '0',
                padding: '0 12px 10px 28px',
                color: 'var(--text-primary, #0f172a)',
                lineHeight: 1.45
              }}
            >
              {constraints.map((c, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Operator Step-by-Step Verification */}
      {hasVerification && (
        <div
          style={{
            backgroundColor: 'var(--bg-secondary, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '8px',
            overflow: 'hidden',
            fontSize: '0.76rem'
          }}
        >
          <button
            type="button"
            onClick={() => setIsVerificationOpen(!isVerificationOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-primary, #0f172a)',
              fontWeight: '700'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckSquare size={13} color="var(--accent-blue, #0284c7)" />
              <span>Human Operator Verification Checks ({verification.length})</span>
            </span>
            {isVerificationOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {isVerificationOpen && (
            <ul
              style={{
                margin: '0',
                padding: '0 12px 10px 28px',
                color: 'var(--text-muted, #475569)',
                lineHeight: 1.45
              }}
            >
              {verification.map((v, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>
                  {v}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
