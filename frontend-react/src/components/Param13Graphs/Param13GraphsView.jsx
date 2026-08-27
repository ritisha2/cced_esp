import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { PARAM_CONFIGS } from '../../constants/telemetryTags';
import { ParameterChartCard } from './ParameterChartCard';
import { RefreshCw, Clock } from 'lucide-react';

export const Param13GraphsView = () => {
  const { liveTelemetry, historyData, timeRange, setTimeRange, loadingHistory, refreshHistory } = useTelemetry();

  const ranges = ['1h', '6h', '24h', '7d'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Control Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-secondary)',
        padding: '0.65rem 1.25rem',
        borderRadius: '8px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            13 Standard Engineering Telemetry Streams
          </span>
          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
            {historyData.length} data points in buffer
          </span>
        </div>

        {/* Time Range & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex',
            background: 'var(--bg-primary)',
            padding: '0.2rem',
            borderRadius: '6px',
            border: '1px solid var(--border-color)'
          }}>
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                style={{
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  fontFamily: 'var(--font-mono)',
                  color: timeRange === r ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: timeRange === r ? 'var(--accent-blue)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={refreshHistory}
            disabled={loadingHistory}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={12} className={loadingHistory ? 'animate-spin' : ''} />
            Sync
          </button>
        </div>
      </div>

      {/* 13 Parameter Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '1rem'
      }}>
        {PARAM_CONFIGS.map((config) => (
          <ParameterChartCard
            key={config.tag}
            config={config}
            historyData={historyData}
            liveValue={liveTelemetry[config.tag]}
          />
        ))}
      </div>
    </div>
  );
};
