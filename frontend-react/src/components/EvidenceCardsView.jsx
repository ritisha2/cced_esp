import React, { useState } from 'react';
import { Database, Cpu, Activity, BookOpen, ShieldCheck, ExternalLink, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * EvidenceCardsView
 * Rich interactive grid of evidence cards displayed in Tab 2 of the AgentResponseDeck.
 */
export const EvidenceCardsView = ({ evidenceItems = [] }) => {
  const [filter, setFilter] = useState('ALL');

  if (!evidenceItems || evidenceItems.length === 0) {
    return (
      <div style={{
        padding: '30px 16px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.78rem'
      }}>
        <ShieldCheck size={24} color="var(--accent-emerald, #10b981)" style={{ marginBottom: '8px', opacity: 0.8 }} />
        <div>All telemetry and specialist model signals operating within validated limits.</div>
      </div>
    );
  }

  const getSourceCategory = (ev) => {
    const stype = (ev.source_type || '').toUpperCase();
    const sid = (ev.source_id || '').toUpperCase();
    if (stype.includes('TEL') || sid.includes('TEL') || sid.includes('FLOW') || sid.includes('PRESS')) return 'TELEMETRY';
    if (stype.includes('ENG') || sid.includes('ENG') || sid.includes('TDH') || sid.includes('BEP')) return 'ENGINEERING';
    if (stype.includes('ML') || sid.includes('ML') || sid.includes('FAULT')) return 'ML_MODEL';
    if (stype.includes('RULE') || stype.includes('KB') || sid.includes('SOP')) return 'RULES_KB';
    return 'OTHER';
  };

  const categories = [
    { key: 'ALL', label: 'All Evidence', count: evidenceItems.length },
    { key: 'TELEMETRY', label: 'Telemetry', count: evidenceItems.filter(e => getSourceCategory(e) === 'TELEMETRY').length },
    { key: 'ENGINEERING', label: 'Engineering', count: evidenceItems.filter(e => getSourceCategory(e) === 'ENGINEERING').length },
    { key: 'ML_MODEL', label: 'ML Models', count: evidenceItems.filter(e => getSourceCategory(e) === 'ML_MODEL').length },
    { key: 'RULES_KB', label: 'Rules & KB', count: evidenceItems.filter(e => getSourceCategory(e) === 'RULES_KB').length },
  ].filter(c => c.key === 'ALL' || c.count > 0);

  const filteredItems = evidenceItems.filter(ev => {
    if (filter === 'ALL') return true;
    return getSourceCategory(ev) === filter;
  });

  const getCategoryTheme = (cat) => {
    switch (cat) {
      case 'TELEMETRY':
        return { icon: <Database size={14} color="#0284c7" />, border: '#0284c730', bg: '#0284c708', tag: '#0284c7', label: 'Telemetry' };
      case 'ENGINEERING':
        return { icon: <Cpu size={14} color="#6366f1" />, border: '#6366f130', bg: '#6366f108', tag: '#6366f1', label: 'Engineering' };
      case 'ML_MODEL':
        return { icon: <Activity size={14} color="#a855f7" />, border: '#a855f730', bg: '#a855f708', tag: '#a855f7', label: 'ML Inference' };
      case 'RULES_KB':
        return { icon: <BookOpen size={14} color="#f59e0b" />, border: '#f59e0b30', bg: '#f59e0b08', tag: '#f59e0b', label: 'Rule & SOP' };
      default:
        return { icon: <ShieldCheck size={14} color="#10b981" />, border: '#10b98130', bg: '#10b98108', tag: '#10b981', label: 'Audit Pack' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Filter Chips Bar */}
      {categories.length > 2 && (
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
          borderBottom: '1px solid var(--border-color, #f1f5f9)'
        }}>
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: filter === cat.key ? '700' : '500',
                border: filter === cat.key ? '1px solid var(--accent-blue, #0284c7)' : '1px solid var(--border-color, #e2e8f0)',
                backgroundColor: filter === cat.key ? 'rgba(2, 132, 199, 0.12)' : 'var(--bg-secondary, #f8fafc)',
                color: filter === cat.key ? 'var(--accent-blue, #0284c7)' : 'var(--text-muted, #64748b)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{cat.label}</span>
              <span style={{
                fontSize: '0.62rem',
                padding: '0 4px',
                borderRadius: '3px',
                backgroundColor: filter === cat.key ? 'var(--accent-blue, #0284c7)' : 'var(--border-color, #e2e8f0)',
                color: filter === cat.key ? '#ffffff' : 'var(--text-muted, #64748b)'
              }}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
        <AnimatePresence>
          {filteredItems.map((ev, idx) => {
            const cat = getSourceCategory(ev);
            const theme = getCategoryTheme(cat);
            const sid = ev.source_id || ev.evidence_id || `EV-${idx + 1}`;
            const sidDisplay = sid.split(':').pop() || sid;
            const obs = ev.observation || ev.statement || 'Validated sensory or operational metric.';
            const link = ev.source_deep_link || ev.deep_link;

            return (
              <motion.div
                key={sid || idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, delay: idx * 0.03 }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: theme.bg,
                  border: `1px solid ${theme.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {theme.icon}
                    <span style={{
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: '700',
                      color: theme.tag
                    }}>
                      {theme.label}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      color: 'var(--text-muted, #64748b)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0,0,0,0.04)'
                    }}>
                      {sidDisplay}
                    </span>
                  </div>

                  {link && (
                    <a
                      href={link}
                      target={link.startsWith('http') && (link.includes('7474') || link.includes('6333')) ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      title={link}
                      onClick={(e) => {
                        if (link.includes('openDbViewer')) {
                          e.preventDefault();
                          window.dispatchEvent(new CustomEvent('open-sqlite-explorer', { detail: { asset: sidDisplay } }));
                        } else if (link.includes('openAssetDeepDive')) {
                          e.preventDefault();
                          window.dispatchEvent(new CustomEvent('open-asset-deepdive', { detail: { asset: sidDisplay } }));
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: '700',
                        color: link.includes('7474') ? '#0284c7' : link.includes('6333') ? '#a855f7' : '#10b981',
                        textDecoration: 'none',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: link.includes('7474') ? 'rgba(2, 132, 199, 0.12)' : link.includes('6333') ? 'rgba(168, 85, 247, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        border: `1px solid ${link.includes('7474') ? 'rgba(2, 132, 199, 0.3)' : link.includes('6333') ? 'rgba(168, 85, 247, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                    >
                      <span>
                        {link.includes('7474') ? '🕸️ Neo4j Graph' :
                         link.includes('6333') ? '🧠 Qdrant DB' :
                         link.includes('openDbViewer') ? '🗄️ SQL Grid' :
                         link.includes('openAssetDeepDive') ? '⚙️ Nameplate' : '🔗 DB Record'}
                      </span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>

                <div style={{
                  fontSize: '0.76rem',
                  color: 'var(--text-primary, #1e293b)',
                  lineHeight: '1.45'
                }}>
                  {obs}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
