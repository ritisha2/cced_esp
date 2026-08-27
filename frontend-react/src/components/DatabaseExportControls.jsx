import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { Database, Download, FileText, FileCode, Check } from 'lucide-react';

export const DatabaseExportControls = () => {
  const { ingestionState } = useTelemetry();
  const [downloading, setDownloading] = useState(null);

  const handleExport = (type, endpoint) => {
    setDownloading(type);
    window.open(endpoint, '_blank');
    setTimeout(() => setDownloading(null), 2000);
  };

  return (
    <section id="section-export">
      <div className="scada-card">
        <div className="scada-card-header">
          <div className="section-title" style={{ fontSize: '0.85rem' }}>
            <Database size={16} color="var(--accent-cyan)" /> Telemetry Database Storage & Analytical Export
          </div>
          <span className="badge badge-neutral">
            SQLite: data/opg_wells.db
          </span>
        </div>

        <div className="scada-card-body" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Total Stored Telemetry Records: {ingestionState.totalRecords.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Deterministic local SQLite historian. Fully compatible with analytical workflows and training pipelines.
            </div>
          </div>

          {/* Export Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleExport('labelled', '/api/export/labelled')}
              className="scada-btn"
            >
              {downloading === 'labelled' ? <Check size={14} color="var(--state-healthy-text)" /> : <FileText size={14} />}
              Export Labelled (CSV)
            </button>

            <button
              onClick={() => handleExport('unlabelled', '/api/export/unlabelled')}
              className="scada-btn"
            >
              {downloading === 'unlabelled' ? <Check size={14} color="var(--state-healthy-text)" /> : <Download size={14} />}
              Export Unlabelled (CSV)
            </button>

            <button
              onClick={() => handleExport('json', '/api/export/json')}
              className="scada-btn"
            >
              {downloading === 'json' ? <Check size={14} color="var(--state-healthy-text)" /> : <FileCode size={14} />}
              Export JSON
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
