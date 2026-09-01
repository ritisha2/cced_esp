import React from 'react';
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
import { Activity } from 'lucide-react';

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

/**
 * GenerativeChartBlock
 * Renders interactive engineering charts dynamically inside the chat bubble from the backend visualization_spec.
 */
export const GenerativeChartBlock = ({ chartPayload }) => {
  if (!chartPayload) return null;

  const title = chartPayload.title || 'Telemetry & Trend Analysis';
  const rawData = chartPayload.data || [];

  // Extract labels and datasets from Plotly trace format or standard series
  let labels = [];
  let datasets = [];

  const defaultColors = ['#ef4444', '#0284c7', '#f59e0b', '#8b5cf6', '#10b981'];

  rawData.forEach((trace, idx) => {
    if (trace.x && trace.x.length > labels.length) {
      labels = trace.x;
    }
    const color = (trace.line && trace.line.color) || defaultColors[idx % defaultColors.length];
    const isY2 = trace.yaxis === 'y2';

    datasets.push({
      label: trace.name || `Series ${idx + 1}`,
      data: trace.y || [],
      borderColor: color,
      backgroundColor: `${color}15`,
      borderWidth: 2,
      pointRadius: (trace.y || []).length > 20 ? 1 : 3,
      pointHoverRadius: 5,
      tension: 0.3,
      yAxisID: isY2 ? 'y1' : 'y',
      fill: false,
    });
  });

  // Fallback if no labels
  if (!labels.length && datasets.length && datasets[0].data) {
    labels = datasets[0].data.map((_, i) => `T-${datasets[0].data.length - i}`);
  }

  const chartData = {
    labels,
    datasets
  };

  const hasDualAxis = datasets.some(d => d.yAxisID === 'y1');

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 10,
          font: { size: 10, family: 'var(--font-mono, monospace)' },
          color: 'var(--text-primary, #191c1d)',
        }
      },
      tooltip: {
        titleFont: { size: 11, family: 'var(--font-mono, monospace)' },
        bodyFont: { size: 11, family: 'var(--font-mono, monospace)' },
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { size: 9, family: 'var(--font-mono, monospace)' }, color: 'var(--text-muted, #64748b)' }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { size: 9, family: 'var(--font-mono, monospace)' }, color: 'var(--text-muted, #64748b)' }
      },
      ...(hasDualAxis ? {
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { font: { size: 9, family: 'var(--font-mono, monospace)' }, color: 'var(--text-muted, #64748b)' }
        }
      } : {})
    }
  };

  return (
    <div style={{
      margin: '12px 0 8px 0',
      padding: '10px',
      backgroundColor: 'var(--bg-secondary, #f8fafc)',
      border: '1px solid var(--border-color, #e2e8f0)',
      borderRadius: '10px',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
        paddingBottom: '6px',
        borderBottom: '1px solid var(--border-color, #e2e8f0)'
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
        <span style={{
          fontSize: '0.65rem',
          backgroundColor: 'rgba(2, 132, 199, 0.1)',
          color: 'var(--accent-blue, #0284c7)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontFamily: 'var(--font-mono, monospace)',
          fontWeight: '600'
        }}>
          Interactive Chart
        </span>
      </div>
      <div style={{ height: '220px', width: '100%', position: 'relative' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};
