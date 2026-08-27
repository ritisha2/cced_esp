import React from 'react';
import { LineChart, Cpu, Gauge, PlayCircle } from 'lucide-react';

export const TabNav = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'param13', label: '13-Parameter Graphs', icon: LineChart },
    { id: 'intelligence', label: 'ESP Intelligence & ML', icon: Cpu },
    { id: 'scada', label: 'SCADA Overview', icon: Gauge },
    { id: 'replay', label: 'Replay & History', icon: PlayCircle },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem 0',
      background: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-color)'
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              background: isActive ? 'var(--bg-card)' : 'transparent',
              color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: isActive ? 'var(--border-color)' : 'transparent',
              borderBottom: isActive ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              borderRadius: '8px 8px 0 0',
              fontSize: '0.85rem',
              fontWeight: isActive ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
              marginBottom: '-1px'
            }}
          >
            <Icon size={16} color={isActive ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
