import React, { useMemo } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const ParameterChartCard = ({ config, historyData, liveValue }) => {
  const { userSetpoints } = useTelemetry();
  const { tag, name, shortName, unit, color, normalMin, normalMax, decimals, category } = config;

  // Resolve custom operator setpoint for this tag if defined
  let customSetpoint = null;
  let setpointLabel = null;
  if (userSetpoints) {
    if (tag === 'R_INTAKE_PRESS') {
      customSetpoint = userSetpoints.pip_low_limit;
      setpointLabel = `Low PIP Alarm: ${customSetpoint} psi`;
    } else if (tag === 'R_DISCH_PRESS') {
      customSetpoint = userSetpoints.pdp_high_limit;
      setpointLabel = `High PDP Alarm: ${customSetpoint} psi`;
    } else if (tag === 'R_MOTOR_TEMP') {
      customSetpoint = userSetpoints.temp_high_limit;
      setpointLabel = `High Temp Alarm: ${customSetpoint} °C`;
    } else if (tag === 'R_VIBRATION_X') {
      customSetpoint = userSetpoints.vib_high_limit;
      setpointLabel = `High Vib Alarm: ${customSetpoint} g`;
    } else if (tag === 'R_DRV_CURR_AVG') {
      customSetpoint = userSetpoints.curr_high_limit;
      setpointLabel = `Overload Alarm: ${customSetpoint} A`;
    }
  }

  // Extract chart data points
  const chartData = useMemo(() => {
    const labels = [];
    const values = [];

    const dataSlice = historyData.slice(-60);
    dataSlice.forEach((pt) => {
      let ts;
      if (!pt.timestamp) {
        ts = new Date();
      } else if (typeof pt.timestamp === 'number') {
        // Unix epoch: seconds < 1e11, milliseconds >= 1e11
        ts = new Date(pt.timestamp < 1e11 ? pt.timestamp * 1000 : pt.timestamp);
      } else {
        // ISO string or any date string
        ts = new Date(pt.timestamp);
      }
      if (isNaN(ts.getTime())) ts = new Date();
      const timeStr = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      labels.push(timeStr);

      const val = pt[tag] !== undefined ? pt[tag] : (pt.measurements ? pt.measurements[tag] : null);
      values.push(val !== null && val !== undefined ? Number(val) : null);
    });

    const datasets = [
      {
        label: `${shortName} (${unit})`,
        data: values,
        borderColor: color,
        backgroundColor: `${color}15`,
        borderWidth: 2,
        pointRadius: values.length > 30 ? 0 : 2,
        pointHoverRadius: 5,
        tension: 0.25,
        fill: true,
      }
    ];

    // Add dashed Setpoint line if configured
    if (customSetpoint !== null && values.length > 0) {
      datasets.push({
        label: setpointLabel,
        data: new Array(values.length).fill(customSetpoint),
        borderColor: 'rgba(239, 68, 68, 0.85)',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        tension: 0
      });
    }

    return {
      labels,
      datasets
    };
  }, [historyData, tag, shortName, unit, color, customSetpoint, setpointLabel]);

  const currentValue = liveValue !== undefined && liveValue !== null 
    ? Number(liveValue).toFixed(decimals)
    : '--';

  const isWarning = liveValue !== undefined && liveValue !== null && (liveValue < normalMin || liveValue > normalMax);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(10, 15, 25, 0.95)',
        titleColor: '#94a3b8',
        bodyColor: '#f0f4fc',
        borderColor: color,
        borderWidth: 1,
        bodyFont: {
          family: 'JetBrains Mono, monospace',
          weight: '600'
        },
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y !== null ? context.parsed.y.toFixed(decimals) : '--'} ${unit}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(45, 60, 90, 0.25)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          maxTicksLimit: 6,
          font: { family: 'JetBrains Mono, monospace', size: 9 }
        }
      },
      y: {
        grid: {
          color: 'rgba(45, 60, 90, 0.25)',
          drawBorder: false
        },
        ticks: {
          color: '#94a3b8',
          font: { family: 'JetBrains Mono, monospace', size: 10 }
        }
      }
    }
  };

  return (
    <div className="scada-card" style={{ padding: '0.85rem 1rem' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {name}
            </span>
            <span className="badge badge-neutral" style={{ fontSize: '0.62rem', padding: '0.05rem 0.35rem' }}>
              {category}
            </span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Tag: {tag}
          </div>
        </div>

        {/* Live Value Badge */}
        <div style={{ textAlign: 'right' }}>
          <div className="metric-value" style={{ fontSize: '1.25rem', color: isWarning ? 'var(--state-fault-text)' : color }}>
            {currentValue} <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>{unit}</span>
          </div>
          <div style={{ fontSize: '0.65rem', color: isWarning ? 'var(--state-fault-text)' : 'var(--state-healthy-text)', fontWeight: '600' }}>
            {isWarning ? 'OUT OF SPEC' : 'NORMAL'}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ height: '140px', width: '100%', position: 'relative' }}>
        <Line data={chartData} options={options} />
      </div>

      {/* Normal Range Footer + Setpoint Indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '0.4rem',
        paddingTop: '0.35rem',
        borderTop: '1px solid rgba(45, 60, 90, 0.25)',
        fontSize: '0.68rem',
        color: 'var(--text-muted)'
      }}>
        <span>Norm: {normalMin} – {normalMax} {unit}</span>
        {customSetpoint !== null && (
          <span style={{ color: 'var(--accent-red)', fontWeight: '600' }}>
            Set: {customSetpoint} {unit}
          </span>
        )}
      </div>
    </div>
  );
};
