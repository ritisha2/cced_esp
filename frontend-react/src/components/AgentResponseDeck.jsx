import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentMarkdownRenderer } from './AgentMarkdownRenderer';
import { EvidenceCardsView } from './EvidenceCardsView';
import { TelemetryVisualizerTab } from './TelemetryVisualizerTab';
import { MessageSquare, ShieldCheck, Activity, Zap } from 'lucide-react';

/**
 * AgentResponseDeck
 * Multi-tab response deck powered by Radix Tabs & Framer Motion.
 * Replaces monolithic vertical walls of text with an interactive 3-tab layout:
 * [ 💬 Advisory ] [ 🔍 Evidence (N) ] [ 📈 Visualizations ]
 */
export const AgentResponseDeck = ({ message }) => {
  const [activeTab, setActiveTab] = useState('advisory');

  if (!message) return null;

  const evidenceCount = (message.evidence || []).length;
  const hasChart = !!message.chart;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      backgroundColor: 'var(--bg-card, #ffffff)',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} style={{ width: '100%' }}>
        {/* Tab Navigation List */}
        <Tabs.List style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 6px',
          backgroundColor: 'var(--bg-secondary, #f8fafc)',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '10px 10px 0 0'
        }}>
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
            <MessageSquare size={13} color={activeTab === 'advisory' ? 'var(--accent-blue, #0284c7)' : 'currentColor'} />
            <span>Advisory</span>
          </Tabs.Trigger>

          {/* Tab 2: Evidence */}
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
            <ShieldCheck size={13} color={activeTab === 'evidence' ? 'var(--accent-emerald, #10b981)' : 'currentColor'} />
            <span>Evidence</span>
            {evidenceCount > 0 && (
              <span style={{
                fontSize: '0.62rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: '700',
                padding: '1px 5px',
                borderRadius: '10px',
                backgroundColor: activeTab === 'evidence' ? 'rgba(16, 185, 129, 0.15)' : 'var(--border-color, #e2e8f0)',
                color: activeTab === 'evidence' ? '#10b981' : 'var(--text-muted, #64748b)'
              }}>
                {evidenceCount}
              </span>
            )}
          </Tabs.Trigger>

          {/* Tab 3: Visualizations */}
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
              <Activity size={13} color={activeTab === 'visualizations' ? 'var(--accent-blue, #0284c7)' : 'currentColor'} />
              <span>Trends & Chart</span>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-blue, #0284c7)'
              }} />
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
            <AgentMarkdownRenderer content={message.text} />

            {/* Action Card */}
            {message.actionCard && (
              <div style={{
                marginTop: '12px',
                padding: '12px 14px',
                background: 'var(--state-warning-bg, rgba(245, 158, 11, 0.08))',
                border: '1px solid var(--state-warning-border, rgba(245, 158, 11, 0.3))',
                borderRadius: '8px',
                fontSize: '0.78rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '700',
                  color: 'var(--state-warning-text, #d97706)',
                  marginBottom: '4px'
                }}>
                  <Zap size={14} />
                  <span>⚡ Recommended Operator Action</span>
                </div>
                <div style={{ color: 'var(--text-primary, #0f172a)', fontWeight: '500', marginBottom: '8px' }}>
                  {message.actionCard.title}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted, #64748b)',
                  fontFamily: 'var(--font-mono, monospace)'
                }}>
                  <span>Priority: <strong>{message.actionCard.urgency}</strong></span>
                  <span>Confidence: <strong>{Math.round(message.actionCard.confidence * 100)}%</strong></span>
                </div>
              </div>
            )}
          </motion.div>
        </Tabs.Content>

        {/* Tab 2 Body: Evidence & Sources */}
        <Tabs.Content value="evidence" style={{ outline: 'none', padding: '12px 2px 2px 2px' }}>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <EvidenceCardsView evidenceItems={message.evidence || []} />
          </motion.div>
        </Tabs.Content>

        {/* Tab 3 Body: Visualizations */}
        {hasChart && (
          <Tabs.Content value="visualizations" style={{ outline: 'none', padding: '12px 2px 2px 2px' }}>
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <TelemetryVisualizerTab chartPayload={message.chart} />
            </motion.div>
          </Tabs.Content>
        )}
      </Tabs.Root>
    </div>
  );
};
