import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { AgentMarkdownRenderer } from './AgentMarkdownRenderer';
import { EvidenceCardsView } from './EvidenceCardsView';
import { TelemetryVisualizerTab } from './TelemetryVisualizerTab';
import { BlockRenderer } from './blocks/BlockRenderer';
import { BLOCK_KINDS } from '../services/agentResponseNormalizer';
import { MessageSquare, ShieldCheck, Activity, Zap } from 'lucide-react';

/**
 * AgentResponseDeck (Plan.md Phase F1.3 & F2.2)
 * Data-driven multi-tab response deck powered by Radix Tabs.
 * Iterates through message.blocks via BlockRenderer.
 * Shows Evidence and Visualizations tabs conditionally ONLY when matching blocks exist.
 */
export const AgentResponseDeck = ({ message, onSelectSuggestion, onRetry }) => {
  const [activeTab, setActiveTab] = useState('advisory');

  if (!message) return null;

  const blocks = Array.isArray(message.blocks) ? message.blocks : [];

  // Categorize blocks for conditional tab visibility
  const clarificationBlock = blocks.find((b) => b.kind === BLOCK_KINDS.CLARIFICATION);
  const errorBlock = blocks.find((b) => b.kind === BLOCK_KINDS.ERROR);
  const metricsBlock = blocks.find((b) => b.kind === BLOCK_KINDS.METRICS);
  const textBlock = blocks.find((b) => b.kind === BLOCK_KINDS.TEXT);
  const recBlock = blocks.find((b) => b.kind === BLOCK_KINDS.RECOMMENDATION);
  const detailsBlock = blocks.find((b) => b.kind === BLOCK_KINDS.ADVISORY_DETAILS);
  const tableBlock = blocks.find((b) => b.kind === BLOCK_KINDS.TABLE);
  const evidenceBlock = blocks.find((b) => b.kind === BLOCK_KINDS.EVIDENCE);
  const vizBlock = blocks.find((b) => b.kind === BLOCK_KINDS.VISUALIZATION);

  // If this turn is a clarification question, render directly without empty tabs
  if (clarificationBlock) {
    return (
      <div style={{ width: '100%', marginTop: '4px' }}>
        <BlockRenderer
          block={clarificationBlock}
          onSelectSuggestion={onSelectSuggestion}
        />
      </div>
    );
  }

  // If this turn failed with an error, render ErrorBlock
  if (errorBlock) {
    return (
      <div style={{ width: '100%', marginTop: '4px' }}>
        <BlockRenderer block={errorBlock} onRetry={onRetry} />
      </div>
    );
  }

  const evidenceItems = evidenceBlock?.items || message.evidence || [];
  const evidenceCount = evidenceItems.length;
  const hasEvidence = evidenceCount > 0;
  const chartPayload = vizBlock || message.chart;
  const hasChart = !!chartPayload;

  // Text content fallback for legacy messages
  const narrativeContent = textBlock?.content || message.text || '';

  // Action card fallback
  const actionCard = recBlock || message.actionCard;

  // If text-only (e.g. greetings or general ESP info with no evidence or chart)
  const isTextOnly = !hasEvidence && !hasChart && !metricsBlock && !actionCard;

  if (isTextOnly) {
    return (
      <div style={{ width: '100%', padding: '2px 0' }}>
        <AgentMarkdownRenderer content={narrativeContent} />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        backgroundColor: 'var(--bg-card, #ffffff)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    >
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} style={{ width: '100%' }}>
        {/* Tab Navigation List */}
        <Tabs.List
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 6px',
            backgroundColor: 'var(--bg-secondary, #f8fafc)',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '10px 10px 0 0'
          }}
        >
          {/* Tab 1: Advisory */}
          <Tabs.Trigger
            value="advisory"
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontFamily: 'var(--font-sans, inherit)',
              fontWeight: activeTab === 'advisory' ? '700' : '500',
              color: activeTab === 'advisory' ? 'var(--text-primary, #0f172a)' : 'var(--text-muted, #64748b)',
              backgroundColor: activeTab === 'advisory' ? 'var(--bg-card, #ffffff)' : 'transparent',
              boxShadow: activeTab === 'advisory' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <MessageSquare
              size={13}
              color={activeTab === 'advisory' ? 'var(--accent-blue, #0284c7)' : 'currentColor'}
            />
            <span>Advisory</span>
          </Tabs.Trigger>

          {/* Tab 2: Evidence (Conditional on evidence block) */}
          {hasEvidence && (
            <Tabs.Trigger
              value="evidence"
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-sans, inherit)',
                fontWeight: activeTab === 'evidence' ? '700' : '500',
                color: activeTab === 'evidence' ? 'var(--text-primary, #0f172a)' : 'var(--text-muted, #64748b)',
                backgroundColor: activeTab === 'evidence' ? 'var(--bg-card, #ffffff)' : 'transparent',
                boxShadow: activeTab === 'evidence' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <ShieldCheck
                size={13}
                color={activeTab === 'evidence' ? 'var(--accent-emerald, #10b981)' : 'currentColor'}
              />
              <span>Evidence</span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: '700',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  backgroundColor:
                    activeTab === 'evidence' ? 'rgba(16, 185, 129, 0.15)' : 'var(--border-color, #e2e8f0)',
                  color: activeTab === 'evidence' ? '#10b981' : 'var(--text-muted, #64748b)'
                }}
              >
                {evidenceCount}
              </span>
            </Tabs.Trigger>
          )}

          {/* Tab 3: Visualizations (Conditional on visualization block) */}
          {hasChart && (
            <Tabs.Trigger
              value="visualizations"
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-sans, inherit)',
                fontWeight: activeTab === 'visualizations' ? '700' : '500',
                color: activeTab === 'visualizations' ? 'var(--text-primary, #0f172a)' : 'var(--text-muted, #64748b)',
                backgroundColor: activeTab === 'visualizations' ? 'var(--bg-card, #ffffff)' : 'transparent',
                boxShadow: activeTab === 'visualizations' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Activity
                size={13}
                color={activeTab === 'visualizations' ? 'var(--accent-blue, #0284c7)' : 'currentColor'}
              />
              <span>Trends & Chart</span>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-blue, #0284c7)'
                }}
              />
            </Tabs.Trigger>
          )}
        </Tabs.List>

        {/* Tab 1 Body: Advisory & Recommendations */}
        <Tabs.Content value="advisory" style={{ outline: 'none', padding: '12px 2px 2px 2px' }}>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* Top: Metrics Strip */}
            {metricsBlock && <BlockRenderer block={metricsBlock} />}

            {/* Narrative Markdown */}
            {narrativeContent && <AgentMarkdownRenderer content={narrativeContent} />}

            {/* Action Card */}
            {actionCard && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px 14px',
                  background: 'var(--state-warning-bg, rgba(245, 158, 11, 0.08))',
                  border: '1px solid var(--state-warning-border, rgba(245, 158, 11, 0.3))',
                  borderRadius: '8px',
                  fontSize: '0.78rem'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '700',
                    color: 'var(--state-warning-text, #d97706)',
                    marginBottom: '4px'
                  }}
                >
                  <Zap size={14} />
                  <span>⚡ Recommended Operator Action</span>
                </div>
                <div style={{ color: 'var(--text-primary, #0f172a)', fontWeight: '500', marginBottom: '8px' }}>
                  {actionCard.title || actionCard.action_title}
                </div>
                {actionCard.detail && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #475569)', marginBottom: '8px' }}>
                    {actionCard.detail}
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted, #64748b)',
                    fontFamily: 'var(--font-mono, monospace)'
                  }}
                >
                  <span>
                    Priority: <strong>{actionCard.urgency || 'HIGH'}</strong>
                  </span>
                  <span>
                    Confidence: <strong>{Math.round((actionCard.confidence ?? 0.85) * 100)}%</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Table Block if emitted */}
            {tableBlock && <BlockRenderer block={tableBlock} />}

            {/* Collapsible Details: Impact, Constraints, Verification */}
            {detailsBlock && <BlockRenderer block={detailsBlock} />}
          </motion.div>
        </Tabs.Content>

        {/* Tab 2 Body: Evidence & Sources */}
        {hasEvidence && (
          <Tabs.Content value="evidence" style={{ outline: 'none', padding: '12px 2px 2px 2px' }}>
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <EvidenceCardsView evidenceItems={evidenceItems} />
            </motion.div>
          </Tabs.Content>
        )}

        {/* Tab 3 Body: Visualizations */}
        {hasChart && (
          <Tabs.Content value="visualizations" style={{ outline: 'none', padding: '12px 2px 2px 2px' }}>
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <TelemetryVisualizerTab chartPayload={chartPayload} />
            </motion.div>
          </Tabs.Content>
        )}
      </Tabs.Root>
    </div>
  );
};
