import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Brush
} from 'recharts';
import { Activity, Eye, EyeOff, Maximize2 } from 'lucide-react';

/**
 * TelemetryVisualizerTab
 * Rich interactive telemetry and pump curve visualization powered by Recharts for Tab 3.
 */
export const TelemetryVisualizerTab = ({ chartPayload }) => {
  if (!chartPayload) {
    return (
      <div style={{
        padding: '30px 16px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.78rem'
      }}>
        <Activity size={24} color="var(--accent-blue, #0284c7)" style={{ marginBottom: '8px', opacity: 0.7 }} />
        <div>No active time-series chart payload received for this session.</div>
      </div>
    );
  }

  const rawData = chartPayload.data || [];
  const title = chartPayload.title || 'Telemetry & Trend Curve';

  // Transform Plotly/NDJSON traces into tabular data for Recharts
  const { chartData, seriesConfigs } = useMemo(() => {
    if (!rawData.length) return { chartData: [], seriesConfigs: [] };

    // Collect all timestamps
    const timeSet = new Set();
    rawData.forEach(trace => {
      (trace.x || []).forEach(t => timeSet.add(t));
    });

    const timestamps = Array.from(timeSet);
    if (!timestamps.length && rawData[0]?.y?.length) {
      for (let i = 0; i < rawData[0].y.length; i++) {
        timestamps.push(`T-${rawData[0].y.length - i}`);
      }
    }

    const defaultColors = ['#ef4444', '#0284c7', '#f59e0b', '#8b5cf6', '#10b981'];

    const configs = rawData.map((trace, idx) => {
      const name = trace.name || `Series ${idx + 1}`;
      const color = trace.line?.color || defaultColors[idx % defaultColors.length];
      const isY2 = trace.yaxis === 'y2';
      return {
        key: `s_${idx}`,
        name,
        color,
        isY2,
        unit: name.includes('(') ? name.split('(')[1].replace(')', '') : ''
      };
    });

    const rows = timestamps.map((ts, tIdx) => {
      const row = { time: ts };
      rawData.forEach((trace, sIdx) => {
        row[`s_${sIdx}`] = trace.y?.[tIdx] !== undefined ? Number(trace.y[tIdx]) : null;
      });
      return row;
    });

    return { chartData: rows, seriesConfigs: configs };
  }, [rawData]);

  // Series visibility toggle state
  const [visibleSeries, setVisibleSeries] = useState(() => {
    const initial = {};
    seriesConfigs.forEach(s => { initial[s.key] = true; });
    return initial;
  });

  const toggleSeries = (key) => {
    setVisibleSeries(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasY2 = seriesConfigs.some(s => s.isY2 && visibleSeries[s.key]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Title & Interactive Series Toggles */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        paddingBottom: '6px',
        borderBottom: '1px solid var(--border-color, #f1f5f9)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={14} color="var(--accent-blue, #0284c7)" />
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '700',
            color: 'var(--text-primary, #0f172a)',
            textTransform: 'uppercase',
            letterSpacing: '0.03em'
          }}>
            {title}
          </span>
        </div>

        {/* Series Filter Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {seriesConfigs.map(s => {
            const isVisible = visibleSeries[s.key];
            return (
              <button
                key={s.key}
                onClick={() => toggleSeries(s.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontSize: '0.66rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: '600',
                  border: `1px solid ${isVisible ? s.color : 'var(--border-color, #e2e8f0)'}`,
                  backgroundColor: isVisible ? `${s.color}15` : 'var(--bg-secondary, #f8fafc)',
                  color: isVisible ? s.color : 'var(--text-muted, #94a3b8)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isVisible ? s.color : '#cbd5e1' }} />
                <span>{s.name}</span>
                {isVisible ? <Eye size={10} /> : <EyeOff size={10} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-Width Recharts Chart Canvas */}
      <div style={{ width: '100%', height: '280px', marginTop: '4px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fill: 'var(--text-muted, #64748b)', fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-color, #e2e8f0)' }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 9, fill: 'var(--text-muted, #64748b)', fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-color, #e2e8f0)' }}
            />
            {hasY2 && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 9, fill: 'var(--text-muted, #64748b)', fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-color, #e2e8f0)' }}
              />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '8px',
                fontSize: '0.72rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                fontFamily: 'var(--font-mono)'
              }}
            />
            {seriesConfigs.map(s => {
              if (!visibleSeries[s.key]) return null;
              return (
                <Line
                  key={s.key}
                  yAxisId={s.isY2 ? 'right' : 'left'}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ r: chartData.length > 25 ? 0 : 2, fill: s.color }}
                  activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
                />
              );
            })}
            {chartData.length > 30 && (
              <Brush dataKey="time" height={18} stroke="#0284c7" fill="rgba(2, 132, 199, 0.05)" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
