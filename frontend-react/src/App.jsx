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
import { SetpointConfigSection } from './components/SetpointConfigSection';
import { ProfitabilityTable } from './components/ProfitabilityTable';
import { ReplaySection } from './components/ReplaySection';
import { MultiAssetVersusSection } from './components/MultiAssetVersusSection';
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
      {/* 1. Header & Navigation */}
      <Header onOpenSqliteModal={() => setIsSqliteModalOpen(true)} />

      {/* Main Single Continuous Scrollable Operations Center */}
      <main className="content-section">
        {/* 2. System Summary KPI Strip */}
        <SystemSummary />

        <div className="section-divider" />

        {/* 3. MQTT Live Ingestion & Pipeline Controls */}
        <IngestionControls />

        <div className="section-divider" />

        {/* 4. Live Telemetry Data Stream Matrix (with Flow [BPD] & Controls) */}
        <LiveTelemetryTable />

        <div className="section-divider" />

        {/* 5. Active Diagnosis & Health Assessment (with Health Index in Big Font) */}
        <DiagnosisBanner />

        <div className="section-divider" />

        {/* 6. ESP Downhole Wellbore & Equipment Digital Twin */}
        <WellSchematicView />

        <div className="section-divider" />

        {/* 7. ESP Operating Envelope & Boundary Monitoring */}
        <OperatingEnvelope />

        <div className="section-divider" />

        {/* 8. Synchronized Multi-Parameter Time-Series Trends */}
        <SynchronizedTrends />

        <div className="section-divider" />

        {/* 9. 13 Standard Engineering Telemetry Streams (with Delta Cards & VSD Advisor) */}
        <Param13GraphsSection />

        {/* 10. Pump Performance Curve (H-Q & Power BEP Envelope) */}
        <PumpPerformanceCurve />

        <div className="section-divider" />

        {/* 11. Operator Setpoint Tuning & Dynamic Alarm Thresholds */}
        <SetpointConfigSection />

        <div className="section-divider" />

        {/* 12. ESP Fleet Production Economics & Daily Profitability Table */}
        <ProfitabilityTable />

        <div className="section-divider" />

        {/* 13. Historical Event & Failure Scenario Replay Engine */}
        <ReplaySection />

        <div className="section-divider" />

        {/* 14. Multi-Asset Orchestration & Live Versus Comparative Trends */}
        <MultiAssetVersusSection />

        <div className="section-divider" />

        {/* 15. ESP Fleet Well Health Overview & 26 Asset Registry */}
        <FleetHealthGrid />

        <div className="section-divider" />

        {/* 16. Telemetry Database Storage & Analytical Export */}
        <DatabaseExportControls />
      </main>

      {/* 17. Global Status Bar & Diagnostics Footer */}
      <GlobalStatusBar />

      {/* 18. Floating AI Agent Dock */}
      <AgentFloatingDock />

      {/* 19. Floating SQLite Dual Database Modal */}
      <SqliteBrowserModal
        isOpen={isSqliteModalOpen}
        onClose={() => setIsSqliteModalOpen(false)}
      />

      {/* 20. Floating Glassmorphic Asset Deep-Dive Window */}
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
