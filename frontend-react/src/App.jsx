import React, { useState, useEffect } from 'react';
import { TelemetryProvider } from './context/TelemetryContext';
import { Header } from './components/Header';
import { SystemSummary } from './components/SystemSummary';
import { IngestionControls } from './components/IngestionControls';
import { LiveTelemetryTable } from './components/LiveTelemetryTable';
import { DiagnosisBanner } from './components/DiagnosisBanner';
import { WellSchematicView } from './components/WellSchematic/WellSchematicView';
import { OperatingEnvelope } from './components/OperatingEnvelope';
import { SynchronizedTrends } from './components/SynchronizedTrends';
import { Param13GraphsSection } from './components/Param13Graphs/Param13GraphsSection';
import { PumpPerformanceCurve } from './components/PumpPerformanceCurve';
import { FleetHealthGrid } from './components/FleetHealthGrid';
import { DatabaseExportControls } from './components/DatabaseExportControls';
import { GlobalStatusBar } from './components/GlobalStatusBar';
import { AgentFloatingDock } from './components/AgentFloatingDock';
import { SqliteBrowserModal } from './components/SqliteBrowserModal';
import { AssetDeepDiveModal } from './components/AssetDeepDiveModal';
import { useTelemetry } from './context/TelemetryContext';
import './styles/theme.css';

function ESPDashboard() {
  const [isSqliteModalOpen, setIsSqliteModalOpen] = useState(false);
  const { setActiveModalAsset } = useTelemetry();

  useEffect(() => {
    const handleOpenSqlite = () => setIsSqliteModalOpen(true);
    const handleOpenAsset = (e) => {
      if (e.detail?.asset) {
        setActiveModalAsset(e.detail.asset);
      }
    };
    window.addEventListener('open-sqlite-explorer', handleOpenSqlite);
    window.addEventListener('open-asset-deepdive', handleOpenAsset);
    return () => {
      window.removeEventListener('open-sqlite-explorer', handleOpenSqlite);
      window.removeEventListener('open-asset-deepdive', handleOpenAsset);
    };
  }, [setActiveModalAsset]);

  return (
    <div className="page-container">
      {/* 1. Header & Quick Navigation */}
      <Header onOpenSqliteModal={() => setIsSqliteModalOpen(true)} />

      {/* Main Continuous Operations Center */}
      <main className="content-section">
        {/* 2. System Summary KPI Strip */}
        <SystemSummary />

        <div className="section-divider" />

        {/* 3. MQTT Live Ingestion & Telemetry Simulator Controls */}
        <IngestionControls />

        <div className="section-divider" />

        {/* 4. Live Telemetry Data Stream Matrix (14 VFD Signal Channels) */}
        <LiveTelemetryTable />

        <div className="section-divider" />

        {/* 5. Active Diagnosis & 13-Mode Fault Assessment (ESP_APM_models Engine) */}
        <DiagnosisBanner />

        <div className="section-divider" />

        {/* 6. ESP Downhole Wellbore & Equipment Digital Twin */}
        <WellSchematicView />

        <div className="section-divider" />

        {/* 7. ESP Operating Envelope & Statistical Boundary Monitoring (P10–P90) */}
        <OperatingEnvelope />

        <div className="section-divider" />

        {/* 8. Synchronized Multi-Parameter Time-Series Trends */}
        <SynchronizedTrends />

        <div className="section-divider" />

        {/* 9. 13 Standard Engineering Telemetry Streams & AI VSD Frequency Advisor */}
        <Param13GraphsSection />

        <div className="section-divider" />

        {/* 10. Pump Performance Curve (H-Q & Power Envelope) */}
        <PumpPerformanceCurve />

        <div className="section-divider" />

        {/* 11. ESP Fleet Well Health Overview & 73 Asset Registry */}
        <FleetHealthGrid />

        <div className="section-divider" />

        {/* 12. Telemetry Database Storage & Analytical Export */}
        <DatabaseExportControls />
      </main>

      {/* 13. Global Status Bar & Diagnostics Footer */}
      <GlobalStatusBar />

      {/* 14. Floating AI Agent Workspace (Agent Jane — 3-Tab Deck & Level A-F Evidence) */}
      <AgentFloatingDock />

      {/* 15. Floating SQLite Dual Database Modal */}
      <SqliteBrowserModal
        isOpen={isSqliteModalOpen}
        onClose={() => setIsSqliteModalOpen(false)}
      />

      {/* 16. Floating Glassmorphic Asset Deep-Dive Window */}
      <AssetDeepDiveModal />
    </div>
  );
}

export default function App() {
  return (
    <TelemetryProvider>
      <ESPDashboard />
    </TelemetryProvider>
  );
}

