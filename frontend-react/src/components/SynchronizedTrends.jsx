import React, { useMemo } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, Clock, RefreshCw } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const SynchronizedTrends = () => {
  const { historyData, selectedAsset, timeRange, setTimeRange, loadingHistory, refreshHistory } = useTelemetry();

  const chartData = useMemo(() => {
    const labels = [];
    const pdpValues = [];
    const pipValues = [];
    const currentValues = [];
    const tempValues = [];

    const slice = historyData.slice(-60);
    slice.forEach((pt) => {
      let ts;
      if (!pt.timestamp) {
        ts = new Date();
      } else if (typeof pt.timestamp === 'number') {
        ts = new Date(pt.timestamp < 1e11 ? pt.timestamp * 1000 : pt.timestamp);
      } else {
        ts = new Date(pt.timestamp);
      }
      if (isNaN(ts.getTime())) ts = new Date();
      labels.push(ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      pdpValues.push(pt.R_DISCH_PRESS !== undefined ? Number(pt.R_DISCH_PRESS) : (pt.r_disch_press ? Number(pt.r_disch_press) : null));
      pipValues.push(pt.R_INTAKE_PRESS !== undefined ? Number(pt.R_INTAKE_PRESS) : (pt.r_intake_press ? Number(pt.r_intake_press) : null));
      currentValues.push(pt.R_DRV_CURR_AVG !== undefined ? Number(pt.R_DRV_CURR_AVG) : (pt.r_drv_curr_avg ? Number(pt.r_drv_curr_avg) : null));
      tempValues.push(pt.R_MOTOR_TEMP !== undefined ? Number(pt.R_MOTOR_TEMP) : (pt.r_motor_temp ? Number(pt.r_motor_temp) : null));
    });

    return {
      labels,
      datasets: [
        {
          label: 'Discharge Pressure PDP (psi)',
          data: pdpValues,
          borderColor: '#14b8a6', // Teal
          backgroundColor: 'transparent',
          borderWidth: 2,
          yAxisID: 'y_pressure',
          tension: 0.2
        },
        {
          label: 'Intake Pressure PIP (psi)',
          data: pipValues,
          borderColor: '#10b981', // Emerald
          backgroundColor: 'transparent',
          borderWidth: 2,
          yAxisID: 'y_pressure',
          tension: 0.2
        },
        {
          label: 'Drive Current (A)',
          data: currentValues,
          borderColor: '#f97316', // Orange
          backgroundColor: 'transparent',
          borderWidth: 2,
          yAxisID: 'y_current',
          tension: 0.2
        },
        {
          label: 'Motor Temperature (°C)',
          data: tempValues,
          borderColor: '#f59e0b', // Amber
          backgroundColor: 'transparent',
          borderWidth: 2,
          yAxisID: 'y_temp',
          tension: 0.2
        }
      ]
    };
  }, [historyData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter, sans-serif', size: 11, weight: '600' },
          boxWidth: 12,
          boxHeight: 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 15, 25, 0.95)',
        titleColor: '#94a3b8',
        bodyColor: '#f0f4fc',
        borderColor: 'rgba(45, 60, 90, 0.6)',
        borderWidth: 1,
        bodyFont: { family: 'JetBrains Mono, monospace', weight: '600' }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(45, 60, 90, 0.2)' },
        ticks: { color: '#64748b', maxTicksLimit: 8, font: { family: 'JetBrains Mono', size: 10 } }
      },
      y_pressure: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: 'rgba(45, 60, 90, 0.25)' },
        ticks: { color: '#14b8a6', font: { family: 'JetBrains Mono', size: 10 } },
        title: { display: true, text: 'Pressure (psi)', color: '#14b8a6', font: { size: 10 } }
      },
      y_current: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: '#f97316', font: { family: 'JetBrains Mono', size: 10 } },
        title: { display: true, text: 'Current (A)', color: '#f97316', font: { size: 10 } }
      },
      y_temp: {
        type: 'linear',
        display: false,
        position: 'right',
        grid: { drawOnChartArea: false }
      }
    }
  };

  return (
    <section id="section-trends">
      <div className="scada-card">
        <div className="scada-card-header">
          <div className="section-title" style={{ fontSize: '0.85rem' }}>
            <TrendingUp size={16} color="var(--accent-cyan)" /> Synchronized Multi-Parameter Time-Series Trends
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-purple">Well: {selectedAsset}</span>
            <button
              onClick={refreshHistory}
              disabled={loadingHistory}
              className="scada-btn"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
            >
              <RefreshCw size={11} className={loadingHistory ? 'animate-spin' : ''} /> Sync
            </button>
          </div>
        </div>

        <div className="scada-card-body" style={{ height: '340px' }}>
          <Line data={chartData} options={options} />
        </div>
      </div>
    </section>
  );
};
