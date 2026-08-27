import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { Database, Zap, Layers, AlertCircle, ShieldCheck, Activity } from 'lucide-react';

export const SystemSummary = () => {
  const { systemStatus, assetsList, isConnected, assessment } = useTelemetry();

  const totalRecords = systemStatus?.database?.total_records || systemStatus?.collector?.total_saved || 0;
  const ingestionRate = systemStatus?.collector?.msg_rate_per_sec !== undefined ? systemStatus.collector.msg_rate_per_sec : 0.0;
  const isRunning = systemStatus?.collector?.is_running !== undefined ? systemStatus.collector.is_running : true;
  const totalWells = assetsList?.length || 0;

  const isHealthy = !assessment || assessment.state === 'HEALTHY';

  const cards = [
    {
      title: 'SQLite / Ingested Records',
      value: totalRecords.toLocaleString(),
      subtitle: `${systemStatus?.database?.labelled_records || 0} Labelled | ${systemStatus?.database?.unlabelled_records || 0} Live`,
      icon: Database,
      color: 'var(--accent-cyan)'
    },
    {
      title: 'Live Ingestion Throughput',
      value: `${ingestionRate.toFixed(1)} /s`,
      subtitle: isConnected ? 'MQTT Telemetry Stream Active' : 'Awaiting Ingestion Stream',
      icon: Zap,
      color: isConnected ? 'var(--accent-emerald)' : 'var(--text-muted)'
    },
    {
      title: 'Active Monitored Wells',
      value: `${totalWells} Wells`,
      subtitle: 'Field Deployment Registry',
      icon: Layers,
      color: 'var(--accent-purple)'
    },
    {
      title: 'Ingestion Engine State',
      value: isRunning ? 'RUNNING' : 'PAUSED',
      subtitle: `Buffer: ${systemStatus?.collector?.total_buffered || 0} pkts | Filtered: ${systemStatus?.collector?.total_filtered || 0}`,
      icon: Activity,
      color: isRunning ? 'var(--accent-green)' : 'var(--accent-amber)'
    },
    {
      title: 'Fleet Health Assessment',
      value: isHealthy ? 'HEALTHY' : 'FAULTY/ANOMALY',
      subtitle: assessment?.fault_classification || 'Normal Operational Baseline',
      icon: isHealthy ? ShieldCheck : AlertCircle,
      color: isHealthy ? 'var(--state-healthy-text)' : 'var(--state-fault-text)'
    }
  ];

  return (
    <section id="section-summary">
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem'
      }}>
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="scada-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {card.title}
                </span>
                <Icon size={16} color={card.color} />
              </div>
              <div className="metric-value" style={{ fontSize: '1.5rem', color: card.color, margin: '0.2rem 0' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {card.subtitle}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
