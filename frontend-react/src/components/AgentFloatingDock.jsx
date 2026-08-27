import React, { useState } from 'react';
import { Bot, Sparkles, MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';

export const AgentFloatingDock = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '0.5rem'
    }}>
      {/* Expanded Agent Window Placeholder */}
      {isOpen && (
        <div style={{
          width: '320px',
          height: '400px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--accent-cyan)',
          borderRadius: '12px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.75), 0 0 20px rgba(0, 229, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(14, 19, 31, 0.95)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={18} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                ESP AGENTIC ASSISTANT
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <ChevronDown size={18} />
            </button>
          </div>

          <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Sparkles size={28} color="var(--accent-cyan)" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Autonomous Agent Dock
            </div>
            <div style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
              Agentic ML Team Integration Hook Ready. Multi-agent diagnostic reasoners connect here.
            </div>
          </div>

          <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-color)', background: 'rgba(10, 15, 25, 0.9)' }}>
            <input
              type="text"
              placeholder="Ask ESP Agentic Copilot..."
              className="scada-input"
              style={{ width: '100%', fontSize: '0.75rem' }}
              disabled
            />
          </div>
        </div>
      )}

      {/* Floating Hover Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #00e5ff 0%, #3b82f6 100%)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 8px 24px rgba(0, 229, 255, 0.4), 0 0 12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 229, 255, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1.0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 229, 255, 0.4)';
        }}
        title="Open ESP Agentic Dock"
      >
        <Bot size={26} color="#080b11" strokeWidth={2.5} />
      </button>
    </div>
  );
};
