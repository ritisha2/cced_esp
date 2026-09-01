import React from 'react';
import * as HoverCard from '@radix-ui/react-hover-card';
import { ExternalLink, Database, Cpu, Activity, BookOpen, ShieldCheck } from 'lucide-react';

/**
 * CitationHoverCard
 * Renders an inline interactive citation pill with a rich floating HoverCard preview.
 */
export const CitationHoverCard = ({ id, label, href, observation, sourceType }) => {
  // Infer category icon & theme
  const type = sourceType || (
    String(id).includes('TEL') || String(id).includes('flow') || String(id).includes('press') ? 'Telemetry' :
    String(id).includes('ENG') || String(id).includes('tdh') || String(id).includes('bep') ? 'Engineering' :
    String(id).includes('ML') || String(id).includes('fault') ? 'ML Model' :
    String(id).includes('rule') || String(id).includes('SOP') || String(id).includes('KB') ? 'Rules & KB' : 'Evidence'
  );

  const getIcon = () => {
    switch (type) {
      case 'Telemetry': return <Database size={13} className="text-sky-500" />;
      case 'Engineering': return <Cpu size={13} className="text-indigo-500" />;
      case 'ML Model': return <Activity size={13} className="text-purple-500" />;
      case 'Rules & KB': return <BookOpen size={13} className="text-amber-500" />;
      default: return <ShieldCheck size={13} className="text-emerald-500" />;
    }
  };

  const getPillColor = () => {
    switch (type) {
      case 'Telemetry': return { bg: 'rgba(2, 132, 199, 0.12)', border: 'rgba(2, 132, 199, 0.3)', text: '#0284c7' };
      case 'Engineering': return { bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.3)', text: '#6366f1' };
      case 'ML Model': return { bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)', text: '#a855f7' };
      case 'Rules & KB': return { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b' };
      default: return { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981' };
    }
  };

  const pill = getPillColor();

  return (
    <HoverCard.Root openDelay={150} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <a
          href={href || '#'}
          target={href ? '_blank' : undefined}
          rel="noopener noreferrer"
          onClick={(e) => { if (!href) e.preventDefault(); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 7px',
            margin: '0 3px',
            borderRadius: '6px',
            backgroundColor: pill.bg,
            border: `1px solid ${pill.border}`,
            color: pill.text,
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: '600',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {getIcon()}
          <span>{label || id}</span>
        </a>
      </HoverCard.Trigger>

      <HoverCard.Portal>
        <HoverCard.Content
          side="top"
          align="center"
          sideOffset={6}
          style={{
            zIndex: 100005,
            width: '320px',
            padding: '12px 14px',
            backgroundColor: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
            backdropFilter: 'blur(12px)',
            animationDuration: '180ms',
            animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            paddingBottom: '6px',
            borderBottom: '1px solid var(--border-color, #f1f5f9)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {getIcon()}
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                color: 'var(--text-primary, #0f172a)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {type} Citation
              </span>
            </div>
            <span style={{
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono, monospace)',
              padding: '1px 5px',
              borderRadius: '4px',
              backgroundColor: pill.bg,
              color: pill.text,
              fontWeight: '600'
            }}>
              VERIFIED
            </span>
          </div>

          {/* Reference ID */}
          <div style={{
            fontSize: '0.74rem',
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--accent-blue, #0284c7)',
            fontWeight: '600',
            marginBottom: '6px',
            wordBreak: 'break-all'
          }}>
            ID: {id}
          </div>

          {/* Observation text */}
          <div style={{
            fontSize: '0.76rem',
            color: 'var(--text-primary, #334155)',
            lineHeight: '1.45',
            marginBottom: '10px'
          }}>
            {observation || 'Historical sensory telemetry and operational rules audited by LangGraph specialists.'}
          </div>

          {/* Deep link action button */}
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-secondary, #f8fafc)',
                border: '1px solid var(--border-color, #e2e8f0)',
                color: 'var(--accent-blue, #0284c7)',
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-header, #f1f5f9)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary, #f8fafc)'}
            >
              <span>Inspect Source Record</span>
              <ExternalLink size={11} />
            </a>
          )}

          <HoverCard.Arrow style={{ fill: 'var(--bg-card, #ffffff)' }} />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
};
