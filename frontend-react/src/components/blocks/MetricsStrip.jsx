import React from 'react';
import { Activity, ShieldCheck, Gauge } from 'lucide-react';

/**
 * MetricsStrip (Plan.md Phase F1.3)
 * Displays top-line confidence score, risk horizon, and objective badge.
 */
export const MetricsStrip = ({ block }) => {
  if (!block) return null;

  const confidencePct = Math.round((block.confidence ?? 0.85) * 100);
  const risk = block.riskHorizon || 'Operational';
  const objective = block.objectiveId || 'OP03_FAULT_DIAGNOSIS';
  const asset = block.assetId || '';

  // Determine badge color based on risk severity
  const isHighRisk = /high|critical|trip/i.test(risk);
  const isMedRisk = /medium|warning|degrad/i.test(risk);

  const riskColor = isHighRisk ? '#ef4444' : isMedRisk ? '#f59e0b' : '#10b981';
  const riskBg = isHighRisk
    ? 'rgba(239, 68, 68, 0.12)'
    : isMedRisk
    ? 'rgba(245, 158, 11, 0.12)'
    : 'rgba(16, 185, 129, 0.12)';

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        marginBottom: '10px',
        backgroundColor: 'var(--bg-secondary, #f8fafc)',
        borderRadius: '8px',
        border: '1px solid var(--border-color, #e2e8f0)',
        fontSize: '0.74rem'
      }}
    >
      {/* Asset Badge if present */}
      {asset && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #cbd5e1)',
            fontWeight: '700',
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--text-primary, #0f172a)'
          }}
        >
          <Gauge size={12} color="var(--accent-blue, #0284c7)" />
          {asset}
        </span>
      )}

      {/* Confidence */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '6px',
          backgroundColor: 'rgba(2, 132, 199, 0.1)',
          color: 'var(--accent-blue, #0284c7)',
          fontWeight: '600'
        }}
      >
        <ShieldCheck size={12} />
        Confidence: <strong>{confidencePct}%</strong>
      </span>

      {/* Risk Horizon */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '6px',
          backgroundColor: riskBg,
          color: riskColor,
          fontWeight: '600'
        }}
      >
        <Activity size={12} />
        Risk: <strong>{risk}</strong>
      </span>

      {/* Objective Identifier */}
      <span
        style={{
          marginLeft: 'auto',
          fontSize: '0.66rem',
          fontFamily: 'var(--font-mono, monospace)',
          color: 'var(--text-muted, #64748b)',
          textTransform: 'uppercase'
        }}
      >
        {objective}
      </span>
    </div>
  );
};
