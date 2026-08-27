import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { PARAM_CONFIGS } from '../../constants/telemetryTags';
import { ParameterChartCard } from './ParameterChartCard';
import { DeltaStabilityCards } from '../DeltaStabilityCards';
import { VsdAdvisorCard } from '../VsdAdvisorCard';
import { LineChart, RefreshCw } from 'lucide-react';

export const Param13GraphsSection = () => {
  const { liveTelemetry, historyData, timeRange, setTimeRange, loadingHistory, refreshHistory, selectedAsset } = useTelemetry();
  const ranges = ['1h', '6h', '24h', '7d'];

  return (
    <section id="section-graphs">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Real-Time Delta & Stability Metric Cards (matching uploaded screenshot) */}
        <DeltaStabilityCards />

        {/* Header Bar for 13 Parameter Streams */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-secondary)',
          padding: '0.65rem 1.25rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="section-title" style={{ fontSize: '0.85rem' }}>
              <LineChart size={16} color="var(--accent-cyan)" /> 13 Standard Engineering Telemetry Streams
            </div>
            <span className="badge badge-purple">
              Well: {selectedAsset}
            </span>
          </div>

          {/* Time Range Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
                    fontSize: '0.72rem',
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
              className="scada-btn"
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.72rem' }}
            >
              <RefreshCw size={11} className={loadingHistory ? 'animate-spin' : ''} /> Sync
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

        {/* AI VSD Frequency Advisor Card */}
        <VsdAdvisorCard />
      </div>
    </section>
  );
};
