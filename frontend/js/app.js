/**
 * OPG & ESP Wells Telemetry & Asset Ledger - Frontend Application Logic
 * Supports Multi-Type Categorized Ingestion & Advanced Filtering
 */

// Application State
const state = {
    ws: null,
    wsConnected: false,
    mqttConnected: false,
    isRunning: true,
    filterMode: 'ALL',
    storageCategoryMode: 'BOTH',
    allowedAssets: new Set(),
    blockedAssets: new Set(),
    discoveredAssets: new Set(),
    discoveredWells: new Set(),
    allRecords: [],
    maxTableRows: 150,
    autoScroll: true,
    currentTab: 'tab-ledger',
    chartsInitialized: false,
    pressureChart: null,
    flowChart: null,
    // Ledger Multi-Type View Filters
    viewFilterCategory: 'ALL',
    viewFilterScenario: 'ALL',
    viewFilterTrip: 'ALL',
    viewFilterAlarm: 'ALL',
    viewFilterPumpFamily: 'ALL',
    viewFilterAsset: 'ALL',
    searchQuery: '',
    selectedPayload: null
};

// Modal Explorer State (Floating Storage Window)
const modalState = {
    activeSubtab: 'subtab-summary',
    offset: 0,
    limit: 100,
    categoryFilter: 'ALL',
    scenarioFilter: 'ALL',
    tripFilter: 'ALL',
    alarmFilter: 'ALL',
    wellFilter: 'ALL',
    search: '',
    total: 0
};

// DOM Elements
const elements = {
    // Theme Toggle
    btnThemeToggle: document.getElementById('btnThemeToggle'),

    // Status Badges
    mqttStatusBadge: document.getElementById('mqttStatusBadge'),
    pipelineStatusBadge: document.getElementById('pipelineStatusBadge'),
    wsStatusBadge: document.getElementById('wsStatusBadge'),

    // Inline Broker Form
    brokerStatusIndicator: document.getElementById('brokerStatusIndicator'),
    brokerStatusBannerText: document.getElementById('brokerStatusBannerText'),
    inlineBrokerHost: document.getElementById('inlineBrokerHost'),
    inlineBrokerPort: document.getElementById('inlineBrokerPort'),
    inlineUsername: document.getElementById('inlineUsername'),
    inlinePassword: document.getElementById('inlinePassword'),
    inlineTopics: document.getElementById('inlineTopics'),
    btnConnectBroker: document.getElementById('btnConnectBroker'),
    btnDisconnectBroker: document.getElementById('btnDisconnectBroker'),

    // KPIs
    kpiDbCard: document.getElementById('kpiDbCard'),
    kpiTotalRecords: document.getElementById('kpiTotalRecords'),
    kpiIngestRate: document.getElementById('kpiIngestRate'),
    kpiTotalAssets: document.getElementById('kpiTotalAssets'),
    kpiCategoriesSummary: document.getElementById('kpiCategoriesSummary'),
    kpiBufferCount: document.getElementById('kpiBufferCount'),
    kpiBufferCard: document.getElementById('kpiBufferCard'),

    // Floating Storage & Collection Modal
    dbStatsModal: document.getElementById('dbStatsModal'),
    btnCloseDbStatsModal: document.getElementById('btnCloseDbStatsModal'),
    btnDoneDbStatsModal: document.getElementById('btnDoneDbStatsModal'),
    btnRefreshDbModal: document.getElementById('btnRefreshDbModal'),
    btnModalExportLabelledCSV: document.getElementById('btnModalExportLabelledCSV'),
    btnModalExportUnlabelledCSV: document.getElementById('btnModalExportUnlabelledCSV'),
    btnModalExportJSON: document.getElementById('btnModalExportJSON'),
    dbModalTotalRecords: document.getElementById('dbModalTotalRecords'),
    dbModalLabelledCount: document.getElementById('dbModalLabelledCount'),
    dbModalUnlabelledCount: document.getElementById('dbModalUnlabelledCount'),
    dbModalFileSize: document.getElementById('dbModalFileSize'),
    dbModalNormalCount: document.getElementById('dbModalNormalCount'),
    dbModalWarningCount: document.getElementById('dbModalWarningCount'),
    dbModalCriticalCount: document.getElementById('dbModalCriticalCount'),
    dbModalAssetTableBody: document.getElementById('dbModalAssetTableBody'),
    modalTabAssetCount: document.getElementById('modalTabAssetCount'),
    modalTabTotalCount: document.getElementById('modalTabTotalCount'),
    btnSubtabSummary: document.getElementById('btnSubtabSummary'),
    btnSubtabAllRecords: document.getElementById('btnSubtabAllRecords'),
    txtModalRecordSearch: document.getElementById('txtModalRecordSearch'),
    selModalCategoryFilter: document.getElementById('selModalCategoryFilter'),
    selModalScenarioFilter: document.getElementById('selModalScenarioFilter'),
    selModalTripFilter: document.getElementById('selModalTripFilter'),
    selModalAlarmFilter: document.getElementById('selModalAlarmFilter'),
    selModalWellFilter: document.getElementById('selModalWellFilter'),
    modalRecordsCounter: document.getElementById('modalRecordsCounter'),
    modalAllRecordsTableBody: document.getElementById('modalAllRecordsTableBody'),
    modalPaginationInfo: document.getElementById('modalPaginationInfo'),
    btnModalLoadMoreRows: document.getElementById('btnModalLoadMoreRows'),

    // Pipeline Controls
    btnPlay: document.getElementById('btnPlay'),
    btnPause: document.getElementById('btnPause'),
    chkBufferOnPause: document.getElementById('chkBufferOnPause'),
    selStorageCategoryMode: document.getElementById('selStorageCategoryMode'),
    selIngestScenario: document.getElementById('selIngestScenario'),
    selIngestState: document.getElementById('selIngestState'),
    selIngestPumpFamily: document.getElementById('selIngestPumpFamily'),
    selFilterMode: document.getElementById('selFilterMode'),
    filterModeBadge: document.getElementById('filterModeBadge'),
    assetFilterChips: document.getElementById('assetFilterChips'),
    btnApplyFilters: document.getElementById('btnApplyFilters'),

    // Ledger View Toolbar (Multi-Filter Types)
    txtLedgerSearch: document.getElementById('txtLedgerSearch'),
    selViewCategory: document.getElementById('selViewCategory'),
    selViewScenario: document.getElementById('selViewScenario'),
    selViewTrip: document.getElementById('selViewTrip'),
    selViewAlarm: document.getElementById('selViewAlarm'),
    selViewPumpFamily: document.getElementById('selViewPumpFamily'),
    selViewAsset: document.getElementById('selViewAsset'),
    chkAutoScroll: document.getElementById('chkAutoScroll'),

    // Ledger Table
    telemetryTable: document.getElementById('telemetryTable'),
    ledgerTableBody: document.getElementById('ledgerTableBody'),
    tableStatsInfo: document.getElementById('tableStatsInfo'),
    btnLoadMore: document.getElementById('btnLoadMore'),

    // Tabs
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),

    // Side Actions
    btnExportLabelledCSV: document.getElementById('btnExportLabelledCSV'),
    btnExportUnlabelledCSV: document.getElementById('btnExportUnlabelledCSV'),
    btnClearDB: document.getElementById('btnClearDB'),

    // Analytics
    selChartAsset: document.getElementById('selChartAsset'),
    selChartPoints: document.getElementById('selChartPoints'),
    btnRefreshCharts: document.getElementById('btnRefreshCharts'),

    // Fleet Summary
    fleetGridContainer: document.getElementById('fleetGridContainer'),
    btnRefreshFleet: document.getElementById('btnRefreshFleet'),

    // JSON Modal
    jsonModal: document.getElementById('jsonModal'),
    btnCloseJsonModal: document.getElementById('btnCloseJsonModal'),
    btnDoneJsonModal: document.getElementById('btnDoneJsonModal'),
    btnCopyJson: document.getElementById('btnCopyJson'),
    modalJsonContent: document.getElementById('modalJsonContent'),
    modalMetaTags: document.getElementById('modalMetaTags'),

    // Toasts
    toastContainer: document.getElementById('toastContainer')
};

// ==========================================================================
// THEME SWITCHER (DARK / LIGHT MODE)
// ==========================================================================
function initTheme() {
    const savedTheme = localStorage.getItem('esp_theme') || 'dark';
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    const isLight = theme === 'light';
    if (isLight) {
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.setAttribute('data-theme', 'light');
        document.body.classList.remove('theme-dark');
        document.body.classList.add('theme-light');
        if (elements.btnThemeToggle) {
            elements.btnThemeToggle.innerHTML = '<i class="fa-solid fa-moon theme-icon"></i> <span class="theme-label">Dark Mode</span>';
            elements.btnThemeToggle.title = 'Switch to Dark Theme';
        }
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.setAttribute('data-theme', 'dark');
        document.body.classList.remove('theme-light');
        document.body.classList.add('theme-dark');
        if (elements.btnThemeToggle) {
            elements.btnThemeToggle.innerHTML = '<i class="fa-solid fa-sun theme-icon"></i> <span class="theme-label">Light Mode</span>';
            elements.btnThemeToggle.title = 'Switch to Light Theme';
        }
    }
    localStorage.setItem('esp_theme', isLight ? 'light' : 'dark');
}

function toggleTheme() {
    const isLight = document.body.classList.contains('theme-light');
    applyTheme(isLight ? 'dark' : 'light');
}

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle';
    if (type === 'error') iconClass = 'fa-circle-xmark';

    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(30px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ==========================================================================
// WEBSOCKET CLIENT & LIVE STREAMING
// ==========================================================================
function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live`;

    elements.wsStatusBadge.className = 'status-pill status-disconnected';
    elements.wsStatusBadge.querySelector('.status-text').textContent = 'Stream: Connecting...';

    state.ws = new WebSocket(wsUrl);

    state.ws.onopen = () => {
        state.wsConnected = true;
        elements.wsStatusBadge.className = 'status-pill status-connected';
        elements.wsStatusBadge.querySelector('.status-text').textContent = 'Stream: Live';
    };

    state.ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            handleIncomingMessage(message);
        } catch (e) {
            console.error('[WebSocket] Message parse error:', e);
        }
    };

    state.ws.onclose = () => {
        state.wsConnected = false;
        elements.wsStatusBadge.className = 'status-pill status-disconnected';
        elements.wsStatusBadge.querySelector('.status-text').textContent = 'Stream: Offline';
        setTimeout(initWebSocket, 3000);
    };

    state.ws.onerror = (err) => {
        console.error('[WebSocket] Error:', err);
    };
}

function handleIncomingMessage(msg) {
    if (msg.type === 'INITIAL_STATE') {
        updateSystemStatus(msg.status);
        if (msg.counts) updateKPICounters(msg.counts);
        if (msg.recent_records && msg.recent_records.length > 0) {
            state.allRecords = msg.recent_records;
            renderLedgerTable();
            msg.recent_records.forEach(r => {
                state.discoveredAssets.add(r.asset_id);
                state.discoveredWells.add(r.well_id);
            });
            refreshAssetFilterChips();
            populateAssetSelectDropdowns();
        }
    } else if (msg.type === 'LIVE_TELEMETRY') {
        if (msg.data) onNewTelemetryRecord(msg.data);
        if (msg.unlabelled_data && state.storageCategoryMode === 'BOTH') {
            onNewTelemetryRecord(msg.unlabelled_data);
        }
    } else if (msg.type === 'STATUS_UPDATE') {
        updateSystemStatus(msg.data);
    } else if (msg.type === 'FILTER_UPDATE') {
        updateSystemStatus(msg.data);
        showToast('Dynamic Ingestion settings updated.', 'info');
    } else if (msg.type === 'DATABASE_CLEARED') {
        state.allRecords = [];
        renderLedgerTable();
        updateKPICounters({ total_records: 0, total_labelled: 0, total_unlabelled: 0, total_assets: 0, total_wells: 0 });
        showToast('Database records cleared.', 'warning');
    }
}

function onNewTelemetryRecord(record) {
    state.allRecords.unshift(record);
    if (state.allRecords.length > 500) {
        state.allRecords.pop();
    }

    const hadAsset = state.discoveredAssets.has(record.asset_id) && state.discoveredWells.has(record.well_id);
    state.discoveredAssets.add(record.asset_id);
    state.discoveredWells.add(record.well_id);
    if (!hadAsset) {
        refreshAssetFilterChips();
        populateAssetSelectDropdowns();
    }

    const currentVal = parseInt(elements.kpiTotalRecords.textContent.replace(/,/g, '')) || 0;
    elements.kpiTotalRecords.textContent = (currentVal + 1).toLocaleString();
    elements.kpiTotalAssets.textContent = `${state.discoveredWells.size} Wells`;

    if (recordMatchesViewFilters(record)) {
        insertLedgerRow(record, true);
    }

    if (state.currentTab === 'tab-analytics' && state.chartsInitialized && record.data_category !== 'UNLABELLED') {
        appendRecordToCharts(record);
    }

    if (window.espIntelligence && (record.asset_id === window.espIntelligence.currentAsset || record.well_id === window.espIntelligence.currentAsset)) {
        window.espIntelligence.fetchAssetBundle();
    }

    if (window.param13Graphs) {
        window.param13Graphs.ingestLiveTelemetry(record);
    }
}

function updateSystemStatus(status) {
    if (!status) return;

    state.mqttConnected = status.is_connected;
    if (status.is_connected) {
        elements.mqttStatusBadge.className = 'status-pill status-connected';
        elements.mqttStatusBadge.querySelector('.status-text').textContent = `MQTT: Connected (${status.broker_host}:${status.broker_port})`;
        
        elements.brokerStatusIndicator.className = 'broker-status-indicator connected';
        elements.brokerStatusBannerText.textContent = `Connected to ${status.broker_host}:${status.broker_port}`;
    } else {
        elements.mqttStatusBadge.className = 'status-pill status-disconnected';
        elements.mqttStatusBadge.querySelector('.status-text').textContent = status.last_error ? `MQTT: Error` : `MQTT: Disconnected`;

        elements.brokerStatusIndicator.className = 'broker-status-indicator disconnected';
        elements.brokerStatusBannerText.textContent = status.last_error ? `Error: ${status.last_error}` : `Disconnected`;
    }

    if (!elements.inlineBrokerHost.value && status.broker_host) {
        elements.inlineBrokerHost.value = status.broker_host;
    }
    if (!elements.inlineBrokerPort.value && status.broker_port) {
        elements.inlineBrokerPort.value = status.broker_port;
    }
    if (status.topics && Array.isArray(status.topics)) {
        elements.inlineTopics.value = status.topics.join(', ');
    }

    state.isRunning = status.is_running;
    if (status.is_running) {
        elements.pipelineStatusBadge.className = 'status-pill status-active';
        elements.pipelineStatusBadge.querySelector('.status-text').textContent = 'Ingestion: Running';
        elements.btnPlay.disabled = true;
        elements.btnPause.disabled = false;
    } else {
        elements.pipelineStatusBadge.className = 'status-pill status-paused';
        elements.pipelineStatusBadge.querySelector('.status-text').textContent = 'Ingestion: Paused';
        elements.btnPlay.disabled = false;
        elements.btnPause.disabled = true;
    }

    state.storageCategoryMode = status.storage_category_mode || 'BOTH';
    if (elements.selStorageCategoryMode) {
        elements.selStorageCategoryMode.value = state.storageCategoryMode;
    }

    elements.kpiBufferCount.textContent = status.total_buffered || 0;
    if (status.total_buffered > 0) {
        elements.kpiBufferCard.style.borderColor = 'var(--color-warning)';
    } else {
        elements.kpiBufferCard.style.borderColor = 'var(--border-color)';
    }

    if (status.msg_rate_per_sec !== undefined) {
        elements.kpiIngestRate.innerHTML = `${status.msg_rate_per_sec.toFixed(1)} <span class="kpi-unit">msg/s</span>`;
    }
    if (status.total_saved !== undefined && elements.kpiTotalRecords.textContent === '0') {
        elements.kpiTotalRecords.textContent = status.total_saved.toLocaleString();
    }

    state.filterMode = status.filter_mode || 'ALL';
    elements.selFilterMode.value = state.filterMode;
    elements.filterModeBadge.textContent = `MODE: ${state.filterMode}`;

    if (status.allowed_asset_ids) {
        state.allowedAssets = new Set(status.allowed_asset_ids);
        updateAssetChipsSelection();
    }
    if (status.buffer_on_pause !== undefined) {
        elements.chkBufferOnPause.checked = status.buffer_on_pause;
    }
}

function updateKPICounters(counts) {
    if (counts.total_records !== undefined) {
        elements.kpiTotalRecords.textContent = counts.total_records.toLocaleString();
    }
    if (counts.total_labelled !== undefined && counts.total_unlabelled !== undefined) {
        elements.kpiCategoriesSummary.textContent = `${counts.total_labelled.toLocaleString()} 🏷️ / ${counts.total_unlabelled.toLocaleString()} 📊`;
    }
    if (counts.total_wells !== undefined) {
        elements.kpiTotalAssets.textContent = `${counts.total_wells} Wells (${counts.total_assets || 0} Fleets)`;
    }
}

// ==========================================================================
// MQTT BROKER CONNECT & DISCONNECT ACTIONS
// ==========================================================================
async function handleBrokerConnect() {
    const host = elements.inlineBrokerHost.value.trim();
    const port = parseInt(elements.inlineBrokerPort.value) || 1883;
    const user = elements.inlineUsername.value.trim() || null;
    const pass = elements.inlinePassword.value.trim() || null;
    const rawTopics = elements.inlineTopics.value.split(',').map(t => t.trim()).filter(Boolean);

    if (!host) {
        showToast('Please provide an MQTT Broker host / IP address.', 'warning');
        return;
    }

    elements.brokerStatusBannerText.textContent = `Connecting to ${host}:${port}...`;
    elements.brokerStatusIndicator.className = 'broker-status-indicator';

    const payload = {
        broker_host: host,
        broker_port: port,
        username: user,
        password: pass,
        topics: rawTopics.length > 0 ? rawTopics : ['esp/#', 'opg/#', 'wells/#']
    };

    try {
        const res = await fetch('/api/mqtt/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        showToast(`Connecting to MQTT broker ${host}:${port}...`, 'info');
    } catch (err) {
        showToast(`Broker connection error: ${err.message}`, 'error');
    }
}

async function handleBrokerDisconnect() {
    try {
        await fetch('/api/mqtt/disconnect', { method: 'POST' });
        showToast('Disconnected from MQTT broker.', 'warning');
    } catch (err) {
        showToast(`Error disconnecting: ${err.message}`, 'error');
    }
}

// Fault Name Display Formatting Map
const FAULT_DISPLAY_MAP = {
    'normal': 'Normal',
    'dry_well_pump_off': 'Dry-Well Pump Off',
    'dry-well pump off': 'Dry-Well Pump Off',
    'blocked_intake': 'Blocked Intake',
    'blocked intake': 'Blocked Intake',
    'scale_or_pump_wear': 'Scale or Pump Wear',
    'scale or pump wear': 'Scale or Pump Wear',
    'sand_ingestion': 'Sand Ingestion',
    'sand ingestion': 'Sand Ingestion',
    'bearing_degradation': 'Bearing Degradation',
    'bearing degradation': 'Bearing Degradation',
    'high_viscosity_cold_start': 'High Viscosity Cold Start',
    'high viscosity cold start': 'High Viscosity Cold Start',
    'high_backpressure': 'High Backpressure',
    'high backpressure': 'High Backpressure',
    'open_choke': 'Open Choke',
    'open choke': 'Open Choke',
    'undervoltage': 'Undervoltage',
    'phase_imbalance': 'Phase Imbalance',
    'phase imbalance': 'Phase Imbalance',
    'motor_overload': 'Motor Overload',
    'motor overload': 'Motor Overload',
    'power_loss': 'Power Loss',
    'power loss': 'Power Loss',
    'sensor_drift': 'Sensor Drift',
    'sensor drift': 'Sensor Drift',
    'gas_interference_to_lock': 'Gas Interference / Lock',
    'gas interference to lock': 'Gas Interference / Lock'
};

function formatFaultName(raw) {
    if (!raw) return '--';
    const key = String(raw).toLowerCase().trim();
    if (FAULT_DISPLAY_MAP[key]) return FAULT_DISPLAY_MAP[key];
    return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ==========================================================================
// MULTI-TYPE LEDGER TABLE FILTERING & RENDERING
// ==========================================================================
function recordMatchesViewFilters(record) {
    // 1. Category Filter
    if (state.viewFilterCategory !== 'ALL' && record.data_category !== state.viewFilterCategory) {
        return false;
    }

    // 2. Fault / Scenario Filter
    if (state.viewFilterScenario !== 'ALL') {
        const raw = (record.scenario || '').toLowerCase().replace(/[\s-]/g, '_');
        const filterKey = state.viewFilterScenario.toLowerCase().replace(/[\s-]/g, '_');
        if (filterKey === 'anomalies_only') {
            if (raw === 'normal' || !raw) return false;
        } else if (raw !== filterKey && !(record.scenario || '').toLowerCase().includes(filterKey)) {
            return false;
        }
    }

    // 3. State & Trip Filter
    if (state.viewFilterTrip !== 'ALL') {
        const op = (record.operating_state || '').toLowerCase();
        const trip = (record.trip_cause || '').toUpperCase();
        if (state.viewFilterTrip === 'RUNNING_ONLY' && op !== 'running') return false;
        if (state.viewFilterTrip === 'TRIPPED_ANY' && op !== 'tripped' && !trip) return false;
        if (!['RUNNING_ONLY', 'TRIPPED_ANY'].includes(state.viewFilterTrip) && trip !== state.viewFilterTrip) {
            return false;
        }
    }

    // 4. Alarm Filter
    if (state.viewFilterAlarm !== 'ALL') {
        const alarms = record.alarms || [];
        const hasAlarms = Array.isArray(alarms) ? alarms.length > 0 : Boolean(alarms && alarms !== '[]');
        if (state.viewFilterAlarm === 'WITH_ALARMS' && !hasAlarms) return false;
        if (state.viewFilterAlarm === 'NO_ALARMS' && hasAlarms) return false;
        if (!['WITH_ALARMS', 'NO_ALARMS'].includes(state.viewFilterAlarm)) {
            const alarmsStr = JSON.stringify(alarms);
            if (!alarmsStr.includes(state.viewFilterAlarm)) return false;
        }
    }

    // 5. Pump Family Filter
    if (state.viewFilterPumpFamily !== 'ALL') {
        const asset = record.asset_id || '';
        if (!asset.includes(state.viewFilterPumpFamily)) return false;
    }

    // 6. Well ID Filter
    if (state.viewFilterAsset !== 'ALL' && record.asset_id !== state.viewFilterAsset && record.well_id !== state.viewFilterAsset) {
        return false;
    }

    // 7. Text Search Query
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        const fullString = `${record.id} ${record.data_category} ${record.asset_id} ${record.well_id} ${record.scenario} ${record.operating_state} ${record.trip_cause} ${record.topic} ${JSON.stringify(record.raw_payload)}`.toLowerCase();
        if (!fullString.includes(query)) {
            return false;
        }
    }

    return true;
}

function insertLedgerRow(record, isLive = false) {
    const emptyRow = elements.ledgerTableBody.querySelector('.empty-state-row');
    if (emptyRow) emptyRow.remove();

    const row = document.createElement('tr');
    if (isLive) row.className = 'row-new';

    const tsStr = formatTimestamp(record.timestamp);
    const isLabelled = (record.data_category || 'LABELLED') === 'LABELLED';
    
    // Category Badge (For LABELLED, show its Fault/State category tag; for UNLABELLED show pure UNLABELLED tag)
    let categoryBadge = '';
    if (isLabelled) {
        const isNormal = !record.scenario || record.scenario.toLowerCase() === 'normal';
        const faultLabel = formatFaultName(record.scenario || 'Normal');
        const icon = isNormal ? 'fa-circle-check' : 'fa-triangle-exclamation';
        const badgeClass = isNormal ? 'badge-category-normal' : 'badge-category-fault';
        categoryBadge = `<span class="badge-cat-pill ${badgeClass}" title="Labelled Ground Truth: ${faultLabel}"><i class="fa-solid ${icon}"></i> ${faultLabel}</span>`;
    } else {
        categoryBadge = '<span class="badge-unlabelled"><i class="fa-solid fa-chart-simple"></i> UNLABELLED</span>';
    }

    // Fault / Scenario & Alarms
    let scenarioHtml = '<span class="scenario-tag scenario-unlabelled">--</span>';
    if (isLabelled && record.scenario) {
        const isNormal = record.scenario.toLowerCase() === 'normal';
        const faultLabel = formatFaultName(record.scenario);
        scenarioHtml = `<span class="scenario-tag ${isNormal ? 'scenario-normal' : ''}" title="Fault: ${faultLabel}">${faultLabel}</span>`;
    }

    // State & Trip Cause pill
    let stateLabel = record.operating_state ? record.operating_state.toUpperCase() : (record.status || 'NORMAL');
    if (record.trip_cause) {
        stateLabel = `${stateLabel}: ${record.trip_cause}`;
    }
    const statusClass = `status-badge-${record.status || 'NORMAL'}`;

    row.innerHTML = `
        <td class="cell-id">#${record.id || 'LIVE'}</td>
        <td class="cell-timestamp">${tsStr}</td>
        <td>${categoryBadge}</td>
        <td><span class="well-badge">${record.well_id || 'UNKNOWN'}</span></td>
        <td><span class="asset-badge" title="${record.asset_id}">${record.asset_id || 'ESP'}</span></td>
        <td>${scenarioHtml}</td>
        <td><span class="metric-val">${(record.pressure_psi || 0).toFixed(1)}</span></td>
        <td><span class="metric-val">${(record.intake_pressure_psi || 0).toFixed(1)}</span></td>
        <td><span class="metric-val" style="color: #34D399;">${(record.flow_rate_bpd || 0).toFixed(1)}</span></td>
        <td><span class="metric-val">${(record.frequency_hz || 0).toFixed(1)}</span></td>
        <td><span class="metric-val">${(record.motor_current_a || 0).toFixed(1)}</span></td>
        <td><span class="metric-val">${(record.temperature_c || 0).toFixed(1)}</span></td>
        <td><span class="status-badge ${statusClass}">${stateLabel}</span></td>
        <td style="text-align: center;">
            <button class="btn btn-small btn-secondary btn-inspect" title="Inspect Raw JSON">
                <i class="fa-solid fa-code"></i>
            </button>
        </td>
    `;

    const inspectBtn = row.querySelector('.btn-inspect');
    inspectBtn.addEventListener('click', () => openJsonModal(record));

    elements.ledgerTableBody.insertBefore(row, elements.ledgerTableBody.firstChild);

    while (elements.ledgerTableBody.children.length > state.maxTableRows) {
        elements.ledgerTableBody.removeChild(elements.ledgerTableBody.lastChild);
    }

    elements.tableStatsInfo.textContent = `Showing latest ${elements.ledgerTableBody.children.length} records in view`;

    if (state.autoScroll && elements.telemetryTable.parentElement) {
        elements.telemetryTable.parentElement.scrollTop = 0;
    }
}

async function fetchAndRenderLedger() {
    let url = `/api/telemetry?limit=${state.maxTableRows}&offset=0`;
    
    if (state.viewFilterCategory && state.viewFilterCategory !== 'ALL') {
        url += `&data_category=${encodeURIComponent(state.viewFilterCategory)}`;
    }
    if (state.viewFilterScenario && state.viewFilterScenario !== 'ALL') {
        url += `&scenario=${encodeURIComponent(state.viewFilterScenario)}`;
    }
    if (state.viewFilterTrip && state.viewFilterTrip !== 'ALL') {
        if (state.viewFilterTrip === 'RUNNING_ONLY') url += `&operating_state=running`;
        else if (state.viewFilterTrip === 'TRIPPED_ANY') url += `&operating_state=tripped`;
        else url += `&trip_cause=${encodeURIComponent(state.viewFilterTrip)}`;
    }
    if (state.viewFilterAlarm && state.viewFilterAlarm !== 'ALL') {
        url += `&alarm_filter=${encodeURIComponent(state.viewFilterAlarm)}`;
    }
    if (state.viewFilterPumpFamily && state.viewFilterPumpFamily !== 'ALL') {
        url += `&pump_family=${encodeURIComponent(state.viewFilterPumpFamily)}`;
    }
    if (state.viewFilterAsset && state.viewFilterAsset !== 'ALL') {
        url += `&well_id=${encodeURIComponent(state.viewFilterAsset)}`;
    }
    if (state.searchQuery && state.searchQuery.trim() !== '') {
        url += `&search=${encodeURIComponent(state.searchQuery.trim())}`;
    }

    try {
        const res = await fetch(url);
        const data = await res.json();
        const records = data.records || [];
        
        elements.ledgerTableBody.innerHTML = '';
        if (records.length === 0) {
            elements.ledgerTableBody.innerHTML = `
                <tr class="empty-state-row">
                    <td colspan="14">
                        <div class="empty-state">
                            <i class="fa-solid fa-inbox fa-2x"></i>
                            <p>No telemetry records match the current filter selection in SQLite.</p>
                        </div>
                    </td>
                </tr>
            `;
            elements.tableStatsInfo.textContent = `Showing 0 records`;
            return;
        }

        state.allRecords = records;
        records.forEach(record => {
            insertLedgerRow(record, false);
        });
        elements.tableStatsInfo.textContent = `Showing ${records.length} of ${(data.total || 0).toLocaleString()} matched records from SQLite`;
    } catch (err) {
        console.error('Error fetching filtered telemetry:', err);
    }
}

function renderLedgerTable() {
    fetchAndRenderLedger();
}

function formatTimestamp(isoStr) {
    if (!isoStr) return '--';
    try {
        const d = new Date(isoStr);
        const timePart = d.toTimeString().split(' ')[0];
        const ms = String(d.getMilliseconds()).padStart(3, '0');
        return `${d.toISOString().slice(0, 10)} ${timePart}.${ms}`;
    } catch {
        return isoStr;
    }
}

// ==========================================================================
// DYNAMIC INGESTION FILTERS & ASSET CHIPS
// ==========================================================================
function refreshAssetFilterChips() {
    if (!elements.assetFilterChips) return;
    elements.assetFilterChips.innerHTML = '';
    const allItems = new Set([...state.discoveredWells, ...state.discoveredAssets]);
    if (allItems.size === 0) {
        elements.assetFilterChips.innerHTML = '<span class="placeholder-text">Listening for incoming well telemetry...</span>';
        return;
    }

    allItems.forEach(id => {
        const chip = document.createElement('div');
        const isSelected = state.allowedAssets.has(id);
        chip.className = `asset-chip ${isSelected ? 'selected' : ''}`;
        chip.textContent = id;
        chip.dataset.asset = id;

        chip.addEventListener('click', () => {
            if (state.allowedAssets.has(id)) {
                state.allowedAssets.delete(id);
                chip.classList.remove('selected');
            } else {
                state.allowedAssets.add(id);
                chip.classList.add('selected');
            }
        });

        elements.assetFilterChips.appendChild(chip);
    });
}

function updateAssetChipsSelection() {
    if (!elements.assetFilterChips) return;
    const chips = elements.assetFilterChips.querySelectorAll('.asset-chip');
    chips.forEach(chip => {
        const assetId = chip.dataset.asset;
        if (state.allowedAssets.has(assetId)) {
            chip.classList.add('selected');
        } else {
            chip.classList.remove('selected');
        }
    });
}

function populateAssetSelectDropdowns() {
    const currentVal = elements.selViewAsset.value;
    elements.selViewAsset.innerHTML = '<option value="ALL">All Wells</option>';
    elements.selChartAsset.innerHTML = '<option value="ALL">All Active Wells Combined</option>';

    const uniqueWells = Array.from(state.discoveredWells).sort();
    uniqueWells.forEach(wellId => {
        const opt1 = document.createElement('option');
        opt1.value = wellId;
        opt1.textContent = wellId;
        elements.selViewAsset.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = wellId;
        opt2.textContent = wellId;
        elements.selChartAsset.appendChild(opt2);
    });

    if (state.discoveredWells.has(currentVal)) {
        elements.selViewAsset.value = currentVal;
    }
}

async function applyIngestionFilters() {
    const mode = elements.selFilterMode.value;
    const categoryMode = elements.selStorageCategoryMode.value;
    const ingestScenario = elements.selIngestScenario.value;
    const ingestState = elements.selIngestState.value;
    const ingestPump = elements.selIngestPumpFamily.value;
    const bufferOnPause = elements.chkBufferOnPause.checked;

    let allowedScenarios = [];
    if (ingestScenario === 'ANOMALIES_ONLY') {
        allowedScenarios = [
            'dry_well_pump_off', 'blocked_intake', 'scale_or_pump_wear', 
            'sand_ingestion', 'bearing_degradation', 'high_viscosity_cold_start', 
            'high_backpressure', 'open_choke', 'undervoltage', 
            'phase_imbalance', 'motor_overload', 'power_loss', 
            'sensor_drift', 'gas_interference_to_lock'
        ];
    } else if (ingestScenario !== 'ALL') {
        allowedScenarios = [ingestScenario];
    }

    let allowedStates = [];
    if (ingestState !== 'ALL') {
        allowedStates = [ingestState];
    }

    let allowedPumps = [];
    if (ingestPump !== 'ALL') {
        allowedPumps = [ingestPump];
    }

    const payload = {
        filter_mode: mode,
        storage_category_mode: categoryMode,
        allowed_asset_ids: Array.from(state.allowedAssets),
        blocked_asset_ids: Array.from(state.blockedAssets),
        allowed_scenarios: allowedScenarios,
        allowed_operating_states: allowedStates,
        allowed_pump_families: allowedPumps,
        buffer_on_pause: bufferOnPause
    };

    try {
        const res = await fetch('/api/filters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success') {
            state.filterMode = mode;
            state.storageCategoryMode = categoryMode;
            elements.filterModeBadge.textContent = `MODE: ${mode}`;
            showToast(`Ingestion filters applied: Scenario [${ingestScenario}], State [${ingestState}], Pump [${ingestPump}]`, 'success');
        }
    } catch (err) {
        showToast(`Failed to update filters: ${err.message}`, 'error');
    }
}

async function sendControlAction(action) {
    try {
        const res = await fetch('/api/control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action })
        });
        const data = await res.json();
        if (data.status === 'success') {
            showToast(`Pipeline action: ${action.toUpperCase()}`, 'success');
        }
    } catch (err) {
        showToast(`Control action error: ${err.message}`, 'error');
    }
}

// ==========================================================================
// TIME-SERIES CHARTS (CHART.JS) FOR ESP WELLS
// ==========================================================================
function initCharts() {
    if (state.chartsInitialized) return;

    const ctxPressure = document.getElementById('pressureTempChart').getContext('2d');
    const ctxFlow = document.getElementById('productionFlowChart').getContext('2d');

    state.pressureChart = new Chart(ctxPressure, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Discharge P (PSI)',
                    data: [],
                    borderColor: '#06B6D4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    yAxisID: 'yDischarge',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 2
                },
                {
                    label: 'Intake P (PSI)',
                    data: [],
                    borderColor: '#F59E0B',
                    backgroundColor: 'transparent',
                    yAxisID: 'yIntake',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: {
                    grid: { color: '#1E293B' },
                    ticks: { color: '#94A3B8', font: { family: 'JetBrains Mono', size: 10 } }
                },
                yDischarge: {
                    type: 'linear',
                    position: 'left',
                    grid: { color: '#1E293B' },
                    ticks: { color: '#06B6D4', font: { family: 'JetBrains Mono' } },
                    title: { display: true, text: 'Discharge PSI', color: '#06B6D4' }
                },
                yIntake: {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#F59E0B', font: { family: 'JetBrains Mono' } },
                    title: { display: true, text: 'Intake PSI', color: '#F59E0B' }
                }
            },
            plugins: {
                legend: { labels: { color: '#F1F5F9', font: { family: 'Inter' } } }
            }
        }
    });

    state.flowChart = new Chart(ctxFlow, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Flow Rate (BPD)',
                    data: [],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    yAxisID: 'yFlow',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 2
                },
                {
                    label: 'Frequency (Hz)',
                    data: [],
                    borderColor: '#8B5CF6',
                    backgroundColor: 'transparent',
                    yAxisID: 'yFreq',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: {
                    grid: { color: '#1E293B' },
                    ticks: { color: '#94A3B8', font: { family: 'JetBrains Mono', size: 10 } }
                },
                yFlow: {
                    type: 'linear',
                    position: 'left',
                    grid: { color: '#1E293B' },
                    ticks: { color: '#10B981', font: { family: 'JetBrains Mono' } },
                    title: { display: true, text: 'BPD', color: '#10B981' }
                },
                yFreq: {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#8B5CF6', font: { family: 'JetBrains Mono' } },
                    title: { display: true, text: 'Hz', color: '#8B5CF6' }
                }
            },
            plugins: {
                legend: { labels: { color: '#F1F5F9', font: { family: 'Inter' } } }
            }
        }
    });

    state.chartsInitialized = true;
    loadHistoricalChartData();
}

async function loadHistoricalChartData() {
    const assetId = elements.selChartAsset.value;
    const limit = parseInt(elements.selChartPoints.value) || 60;

    let url = `/api/analytics/timeseries?limit=${limit}`;
    if (assetId !== 'ALL') {
        url += `&well_id=${encodeURIComponent(assetId)}`;
    }

    try {
        const res = await fetch(url);
        const data = await res.json();
        const points = data.points || [];

        const labels = points.map(p => {
            const d = new Date(p.timestamp);
            return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
        });

        state.pressureChart.data.labels = labels;
        state.pressureChart.data.datasets[0].data = points.map(p => p.pressure_psi || 0);
        state.pressureChart.data.datasets[1].data = points.map(p => p.intake_pressure_psi || 0);
        state.pressureChart.update();

        state.flowChart.data.labels = labels;
        state.flowChart.data.datasets[0].data = points.map(p => p.flow_rate_bpd || 0);
        state.flowChart.data.datasets[1].data = points.map(p => p.frequency_hz || 0);
        state.flowChart.update();
    } catch (err) {
        console.error('Error loading chart data:', err);
    }
}

function appendRecordToCharts(record) {
    if (!state.chartsInitialized) return;
    const selectedAsset = elements.selChartAsset.value;
    if (selectedAsset !== 'ALL' && record.well_id !== selectedAsset && record.asset_id !== selectedAsset) return;

    const maxPoints = parseInt(elements.selChartPoints.value) || 60;
    const d = new Date(record.timestamp);
    const label = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

    const pushTrim = (chart, dsIndex, val) => {
        chart.data.datasets[dsIndex].data.push(val);
        if (chart.data.datasets[dsIndex].data.length > maxPoints) {
            chart.data.datasets[dsIndex].data.shift();
        }
    };

    state.pressureChart.data.labels.push(label);
    if (state.pressureChart.data.labels.length > maxPoints) state.pressureChart.data.labels.shift();
    pushTrim(state.pressureChart, 0, record.pressure_psi || 0);
    pushTrim(state.pressureChart, 1, record.intake_pressure_psi || 0);
    state.pressureChart.update();

    state.flowChart.data.labels.push(label);
    if (state.flowChart.data.labels.length > maxPoints) state.flowChart.data.labels.shift();
    pushTrim(state.flowChart, 0, record.flow_rate_bpd || 0);
    pushTrim(state.flowChart, 1, record.frequency_hz || 0);
    state.flowChart.update();
}

// ==========================================================================
// ASSET & WELL FLEET SUMMARY
// ==========================================================================
async function loadAssetFleetSummary() {
    elements.fleetGridContainer.innerHTML = `
        <div class="empty-state">
            <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
            <p>Aggregating Well Fleet records from SQLite...</p>
        </div>
    `;

    try {
        const res = await fetch('/api/assets');
        const data = await res.json();
        const summaries = data.summary || [];

        if (summaries.length === 0) {
            elements.fleetGridContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-layer-group fa-2x"></i>
                    <p>No Well Fleet records found yet. Connect your broker to start collecting telemetry.</p>
                </div>
            `;
            return;
        }

        elements.fleetGridContainer.innerHTML = '';
        summaries.forEach(item => {
            const card = document.createElement('div');
            card.className = 'fleet-card';
            card.innerHTML = `
                <div class="fleet-card-header">
                    <div>
                        <div class="fleet-asset-title">${item.well_id}</div>
                        <div class="fleet-well-id">${item.asset_id}</div>
                    </div>
                    <span class="status-badge status-badge-${item.latest_status || 'NORMAL'}">${item.latest_operating_state ? item.latest_operating_state.toUpperCase() : item.latest_status}</span>
                </div>
                <div class="fleet-metrics-list">
                    <div class="fleet-metric-box">
                        <div class="fleet-metric-label">Discharge P</div>
                        <div class="fleet-metric-val">${(item.avg_pressure || 0).toFixed(1)} <span class="kpi-unit">PSI</span></div>
                    </div>
                    <div class="fleet-metric-box">
                        <div class="fleet-metric-label">Intake P</div>
                        <div class="fleet-metric-val">${(item.avg_intake_pressure || 0).toFixed(1)} <span class="kpi-unit">PSI</span></div>
                    </div>
                    <div class="fleet-metric-box">
                        <div class="fleet-metric-label">Flow Rate</div>
                        <div class="fleet-metric-val">${(item.avg_flow_rate || 0).toFixed(1)} <span class="kpi-unit">BPD</span></div>
                    </div>
                    <div class="fleet-metric-box">
                        <div class="fleet-metric-label">Motor Temp</div>
                        <div class="fleet-metric-val">${(item.avg_temperature || 0).toFixed(1)} <span class="kpi-unit">°C</span></div>
                    </div>
                </div>
                <div style="font-size: 11px; color: var(--text-muted); display: flex; justify-content: space-between;">
                    <span>Labelled: <strong>${(item.labelled_records || 0).toLocaleString()}</strong> | Unlabelled: <strong>${(item.unlabelled_records || 0).toLocaleString()}</strong></span>
                    <span>Last: ${formatTimestamp(item.last_seen)}</span>
                </div>
            `;
            elements.fleetGridContainer.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading asset fleet summary:', err);
    }
}

// ==========================================================================
// MODALS LOGIC & FLOATING STORAGE WINDOW
// ==========================================================================
function openJsonModal(record) {
    state.selectedPayload = record;
    elements.modalMetaTags.innerHTML = `
        <span class="well-badge">${record.well_id || 'WELL'}</span>
        <span class="asset-badge">${record.asset_id}</span>
        <span class="badge-subtle">Category: ${record.data_category || 'LABELLED'}</span>
        <span class="badge-subtle">${record.timestamp}</span>
    `;

    const raw = typeof record.raw_payload === 'string' ? JSON.parse(record.raw_payload || '{}') : record.raw_payload;
    elements.modalJsonContent.textContent = JSON.stringify(raw, null, 2);
    elements.jsonModal.classList.add('open');
}

function closeJsonModal() {
    elements.jsonModal.classList.remove('open');
}

function openDbStatsModal() {
    elements.dbStatsModal.classList.add('open');
    loadDatabaseStorageStats();
    populateModalWellFilterDropdown();
    if (modalState.activeSubtab === 'subtab-all-records') {
        loadModalAllRecords(true);
    }
}

function closeDbStatsModal() {
    elements.dbStatsModal.classList.remove('open');
}

function switchModalSubtab(subtabId) {
    modalState.activeSubtab = subtabId;
    document.querySelectorAll('.modal-subtab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.modal-subtab-content').forEach(c => c.classList.remove('active'));

    const btn = document.querySelector(`.modal-subtab-btn[data-subtab="${subtabId}"]`);
    const content = document.getElementById(subtabId);
    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');

    if (subtabId === 'subtab-all-records') {
        loadModalAllRecords(true);
    } else {
        loadDatabaseStorageStats();
    }
}

function drilldownToWell(wellId) {
    modalState.wellFilter = wellId;
    elements.selModalWellFilter.value = wellId;
    switchModalSubtab('subtab-all-records');
}

function populateModalWellFilterDropdown() {
    const current = elements.selModalWellFilter.value || 'ALL';
    elements.selModalWellFilter.innerHTML = '<option value="ALL">All Wells</option>';
    const sorted = Array.from(state.discoveredWells).sort();
    sorted.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w;
        opt.textContent = w;
        elements.selModalWellFilter.appendChild(opt);
    });
    if (state.discoveredWells.has(current)) {
        elements.selModalWellFilter.value = current;
    }
}

async function loadDatabaseStorageStats() {
    elements.dbModalAssetTableBody.innerHTML = `
        <tr><td colspan="12" style="text-align: center; color: var(--text-muted); padding: 18px;">
            <i class="fa-solid fa-spinner fa-spin"></i> Calculating SQLite storage metrics...
        </td></tr>
    `;

    try {
        const res = await fetch('/api/database/stats');
        const data = await res.json();

        const totalRecs = data.total_records || 0;
        elements.dbModalTotalRecords.textContent = totalRecs.toLocaleString();
        elements.dbModalLabelledCount.textContent = (data.total_labelled || 0).toLocaleString();
        elements.dbModalUnlabelledCount.textContent = (data.total_unlabelled || 0).toLocaleString();
        elements.dbModalFileSize.textContent = data.db_file_size_formatted || '0 KB';

        elements.modalTabAssetCount.textContent = data.total_wells || 0;
        elements.modalTabTotalCount.textContent = totalRecs.toLocaleString();

        const st = data.status_counts || {};
        elements.dbModalNormalCount.textContent = `Normal: ${(st.NORMAL || 0).toLocaleString()}`;
        elements.dbModalWarningCount.textContent = `Warning: ${(st.WARNING || 0).toLocaleString()}`;
        elements.dbModalCriticalCount.textContent = `Critical: ${(st.CRITICAL || 0).toLocaleString()}`;

        const list = data.asset_breakdown || [];
        if (list.length === 0) {
            elements.dbModalAssetTableBody.innerHTML = `
                <tr><td colspan="12" style="text-align: center; color: var(--text-muted); padding: 18px;">
                    No records found in SQLite database yet. Connect your broker to collect data.
                </td></tr>
            `;
            return;
        }

        elements.dbModalAssetTableBody.innerHTML = '';
        list.forEach(item => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.title = `Click to drill down and view all ${item.record_count.toLocaleString()} individual records for this well`;
            
            const wellMatch = item.asset_id.match(/FS-\d+/i);
            const cleanWellId = wellMatch ? wellMatch[0] : item.asset_id;

            tr.innerHTML = `
                <td><span class="asset-badge" style="font-weight: 600;">${item.asset_id}</span></td>
                <td><span class="well-badge">${item.well_count}</span></td>
                <td style="font-weight: 700; color: #FFFFFF;">${item.record_count.toLocaleString()}</td>
                <td style="color: #34D399; font-weight: 600;">${(item.labelled_count || 0).toLocaleString()}</td>
                <td style="color: #94A3B8; font-weight: 600;">${(item.unlabelled_count || 0).toLocaleString()}</td>
                <td>
                    <div class="share-progress-container">
                        <div class="share-progress-bar">
                            <div class="share-progress-fill" style="width: ${item.percent_of_total}%;"></div>
                        </div>
                        <span style="font-size: 11px; font-weight: 600; min-width: 38px;">${item.percent_of_total}%</span>
                    </div>
                </td>
                <td>${(item.avg_discharge_p || 0).toFixed(1)} PSI</td>
                <td>${(item.avg_intake_p || 0).toFixed(1)} PSI</td>
                <td>${(item.avg_flow || 0).toFixed(1)} BPD</td>
                <td style="font-size: 11px; color: var(--text-secondary);">${formatTimestamp(item.first_seen)}</td>
                <td style="font-size: 11px; color: var(--text-secondary);">${formatTimestamp(item.last_seen)}</td>
                <td style="text-align: center;">
                    <button class="btn btn-small btn-outline btn-drilldown" title="View all records for ${cleanWellId}">
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </td>
            `;

            tr.addEventListener('click', () => drilldownToWell(cleanWellId));
            elements.dbModalAssetTableBody.appendChild(tr);
        });

    } catch (err) {
        elements.dbModalAssetTableBody.innerHTML = `
            <tr><td colspan="12" style="text-align: center; color: var(--color-danger); padding: 18px;">
                Failed to load storage statistics: ${err.message}
            </td></tr>
        `;
    }
}

async function loadModalAllRecords(reset = false) {
    if (reset) {
        modalState.offset = 0;
        elements.modalAllRecordsTableBody.innerHTML = `
            <tr><td colspan="12" style="text-align: center; color: var(--text-muted); padding: 18px;">
                <i class="fa-solid fa-spinner fa-spin"></i> Loading records from SQLite...
            </td></tr>
        `;
    }

    let url = `/api/telemetry?limit=${modalState.limit}&offset=${modalState.offset}`;
    if (modalState.categoryFilter && modalState.categoryFilter !== 'ALL') {
        url += `&data_category=${encodeURIComponent(modalState.categoryFilter)}`;
    }
    if (modalState.scenarioFilter && modalState.scenarioFilter !== 'ALL') {
        url += `&scenario=${encodeURIComponent(modalState.scenarioFilter)}`;
    }
    if (modalState.tripFilter && modalState.tripFilter !== 'ALL') {
        if (modalState.tripFilter === 'RUNNING_ONLY') url += `&operating_state=running`;
        else if (modalState.tripFilter === 'TRIPPED_ANY') url += `&operating_state=tripped`;
        else url += `&trip_cause=${encodeURIComponent(modalState.tripFilter)}`;
    }
    if (modalState.alarmFilter && modalState.alarmFilter !== 'ALL') {
        url += `&alarm_filter=${encodeURIComponent(modalState.alarmFilter)}`;
    }
    if (modalState.wellFilter && modalState.wellFilter !== 'ALL' && modalState.wellFilter.trim() !== '') {
        url += `&well_id=${encodeURIComponent(modalState.wellFilter.trim())}`;
    }
    if (modalState.search && modalState.search.trim() !== '') {
        url += `&search=${encodeURIComponent(modalState.search.trim())}`;
    }

    try {
        const res = await fetch(url);
        const data = await res.json();
        modalState.total = data.total || 0;

        const records = data.records || [];
        if (reset) {
            elements.modalAllRecordsTableBody.innerHTML = '';
        }

        if (records.length === 0 && modalState.offset === 0) {
            elements.modalAllRecordsTableBody.innerHTML = `
                <tr><td colspan="12" style="text-align: center; color: var(--text-muted); padding: 18px;">
                    No records found matching current multi-filter selection.
                </td></tr>
            `;
            elements.modalRecordsCounter.textContent = `Showing 0 of 0`;
            elements.modalPaginationInfo.textContent = `Page 1 of 1`;
            elements.btnModalLoadMoreRows.disabled = true;
            return;
        }

        records.forEach(r => {
            const tr = document.createElement('tr');
            const tsStr = formatTimestamp(r.timestamp);
            let catBadge = '';
            if (isLabelled) {
                const isNormal = !r.scenario || r.scenario.toLowerCase() === 'normal';
                const faultLabel = formatFaultName(r.scenario || 'Normal');
                const icon = isNormal ? 'fa-circle-check' : 'fa-triangle-exclamation';
                const badgeClass = isNormal ? 'badge-category-normal' : 'badge-category-fault';
                catBadge = `<span class="badge-cat-pill ${badgeClass}" title="Labelled: ${faultLabel}"><i class="fa-solid ${icon}"></i> ${faultLabel}</span>`;
            } else {
                catBadge = '<span class="badge-unlabelled"><i class="fa-solid fa-chart-simple"></i> UNLABELLED</span>';
            }

            let scenText = '--';
            if (isLabelled && r.scenario) {
                scenText = formatFaultName(r.scenario);
            }

            let stateLabel = r.operating_state ? r.operating_state.toUpperCase() : (r.status || 'NORMAL');
            if (r.trip_cause) stateLabel = `${stateLabel}: ${r.trip_cause}`;
            const statusClass = `status-badge-${r.status || 'NORMAL'}`;

            tr.innerHTML = `
                <td class="cell-id">#${r.id}</td>
                <td class="cell-timestamp">${tsStr}</td>
                <td>${catBadge}</td>
                <td><span class="well-badge">${r.well_id}</span></td>
                <td><span class="scenario-tag" style="font-size: 10px;">${scenText}</span></td>
                <td><span class="metric-val">${(r.pressure_psi || 0).toFixed(1)} PSI</span></td>
                <td><span class="metric-val">${(r.intake_pressure_psi || 0).toFixed(1)} PSI</span></td>
                <td><span class="metric-val" style="color: #34D399;">${(r.flow_rate_bpd || 0).toFixed(1)}</span></td>
                <td><span class="metric-val">${(r.frequency_hz || 0).toFixed(1)}</span></td>
                <td><span class="metric-val">${(r.motor_current_a || 0).toFixed(1)}</span></td>
                <td><span class="metric-val">${(r.temperature_c || 0).toFixed(1)}</span></td>
                <td><span class="status-badge ${statusClass}">${stateLabel}</span></td>
            `;
            elements.modalAllRecordsTableBody.appendChild(tr);
        });

        const currentShown = elements.modalAllRecordsTableBody.children.length;
        elements.modalRecordsCounter.textContent = `Showing ${currentShown} of ${modalState.total.toLocaleString()} total`;
        elements.modalPaginationInfo.textContent = `Loaded ${currentShown} records (${modalState.total.toLocaleString()} in database)`;

        if (currentShown >= modalState.total) {
            elements.btnModalLoadMoreRows.disabled = true;
            elements.btnModalLoadMoreRows.innerHTML = `<i class="fa-solid fa-check"></i> All ${modalState.total.toLocaleString()} Records Loaded`;
        } else {
            elements.btnModalLoadMoreRows.disabled = false;
            elements.btnModalLoadMoreRows.innerHTML = `<i class="fa-solid fa-arrow-down"></i> Load Next 100 Records (${modalState.total - currentShown} remaining)`;
        }

    } catch (err) {
        console.error('Error loading all records:', err);
    }
}

// ==========================================================================
// EXPORT & CLEAR DATABASE
// ==========================================================================
function exportCSV(category = 'ALL') {
    const well = elements.selViewAsset.value;
    const scenario = elements.selViewScenario.value;
    const trip = elements.selViewTrip.value;
    const alarm = elements.selViewAlarm.value;
    const pump = elements.selViewPumpFamily.value;

    let url = `/api/export/csv?data_category=${encodeURIComponent(category)}&`;
    if (well !== 'ALL') url += `well_id=${encodeURIComponent(well)}&`;
    if (scenario !== 'ALL') url += `scenario=${encodeURIComponent(scenario)}&`;
    if (trip !== 'ALL') {
        if (trip === 'RUNNING_ONLY') url += `operating_state=running&`;
        else if (trip === 'TRIPPED_ANY') url += `operating_state=tripped&`;
        else url += `trip_cause=${encodeURIComponent(trip)}&`;
    }
    if (alarm !== 'ALL') url += `alarm_filter=${encodeURIComponent(alarm)}&`;
    if (pump !== 'ALL') url += `pump_family=${encodeURIComponent(pump)}&`;

    window.open(url, '_blank');
}

function exportJSON(category = 'ALL') {
    const well = elements.selViewAsset.value;
    let url = `/api/export/json?data_category=${encodeURIComponent(category)}&`;
    if (well !== 'ALL') url += `well_id=${encodeURIComponent(well)}&`;
    window.open(url, '_blank');
}

async function clearDatabase() {
    if (!confirm('Are you sure you want to clear all stored time-series telemetry from SQLite?')) {
        return;
    }
    try {
        await fetch('/api/database/clear', { method: 'POST' });
    } catch (err) {
        showToast(`Error clearing DB: ${err.message}`, 'error');
    }
}

// ==========================================================================
// EVENT LISTENERS & INITIALIZATION
// ==========================================================================
function setupEventListeners() {
    elements.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            state.currentTab = targetTab;

            elements.tabButtons.forEach(b => b.classList.remove('active'));
            elements.tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');

            if (targetTab === 'tab-analytics') {
                initCharts();
                loadHistoricalChartData();
            } else if (targetTab === 'tab-fleet') {
                loadAssetFleetSummary();
            } else if (targetTab === 'tab-13-params') {
                if (window.param13Graphs) {
                    window.param13Graphs.init();
                }
            }
        });
    });

    elements.btnConnectBroker.addEventListener('click', handleBrokerConnect);
    elements.btnDisconnectBroker.addEventListener('click', handleBrokerDisconnect);

    if (elements.kpiDbCard) {
        elements.kpiDbCard.addEventListener('click', openDbStatsModal);
    }
    elements.btnCloseDbStatsModal.addEventListener('click', closeDbStatsModal);
    elements.btnDoneDbStatsModal.addEventListener('click', closeDbStatsModal);
    elements.btnRefreshDbModal.addEventListener('click', loadDatabaseStorageStats);
    
    elements.btnModalExportLabelledCSV.addEventListener('click', () => exportCSV('LABELLED'));
    elements.btnModalExportUnlabelledCSV.addEventListener('click', () => exportCSV('UNLABELLED'));
    elements.btnModalExportJSON.addEventListener('click', () => exportJSON('ALL'));

    // Floating Window Sub-Tabs
    if (elements.btnSubtabSummary) {
        elements.btnSubtabSummary.addEventListener('click', () => switchModalSubtab('subtab-summary'));
    }
    if (elements.btnSubtabAllRecords) {
        elements.btnSubtabAllRecords.addEventListener('click', () => switchModalSubtab('subtab-all-records'));
    }

    // Modal Multi-Type Filter Handlers
    if (elements.txtModalRecordSearch) {
        elements.txtModalRecordSearch.addEventListener('input', (e) => {
            modalState.search = e.target.value.trim();
            loadModalAllRecords(true);
        });
    }
    if (elements.selModalCategoryFilter) {
        elements.selModalCategoryFilter.addEventListener('change', (e) => {
            modalState.categoryFilter = e.target.value;
            loadModalAllRecords(true);
        });
    }
    if (elements.selModalScenarioFilter) {
        elements.selModalScenarioFilter.addEventListener('change', (e) => {
            modalState.scenarioFilter = e.target.value;
            loadModalAllRecords(true);
        });
    }
    if (elements.selModalTripFilter) {
        elements.selModalTripFilter.addEventListener('change', (e) => {
            modalState.tripFilter = e.target.value;
            loadModalAllRecords(true);
        });
    }
    if (elements.selModalAlarmFilter) {
        elements.selModalAlarmFilter.addEventListener('change', (e) => {
            modalState.alarmFilter = e.target.value;
            loadModalAllRecords(true);
        });
    }
    if (elements.selModalWellFilter) {
        elements.selModalWellFilter.addEventListener('change', (e) => {
            modalState.wellFilter = e.target.value;
            loadModalAllRecords(true);
        });
    }
    if (elements.btnModalLoadMoreRows) {
        elements.btnModalLoadMoreRows.addEventListener('click', () => {
            modalState.offset += modalState.limit;
            loadModalAllRecords(false);
        });
    }

    // Pipeline Controls
    elements.btnPlay.addEventListener('click', () => sendControlAction('play'));
    elements.btnPause.addEventListener('click', () => sendControlAction('pause'));
    elements.btnApplyFilters.addEventListener('click', applyIngestionFilters);

    // Sync Storage Mode dropdown to automatically filter the live ledger view
    elements.selStorageCategoryMode.addEventListener('change', (e) => {
        const mode = e.target.value;
        if (mode === 'LABELLED_ONLY') {
            state.viewFilterCategory = 'LABELLED';
            elements.selViewCategory.value = 'LABELLED';
        } else if (mode === 'UNLABELLED_ONLY') {
            state.viewFilterCategory = 'UNLABELLED';
            elements.selViewCategory.value = 'UNLABELLED';
        } else {
            state.viewFilterCategory = 'ALL';
            elements.selViewCategory.value = 'ALL';
        }
        fetchAndRenderLedger();
    });

    // Ledger View Multi-Filter Handlers
    elements.txtLedgerSearch.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        fetchAndRenderLedger();
    });

    elements.selViewCategory.addEventListener('change', (e) => {
        state.viewFilterCategory = e.target.value;
        fetchAndRenderLedger();
    });

    elements.selViewScenario.addEventListener('change', (e) => {
        state.viewFilterScenario = e.target.value;
        fetchAndRenderLedger();
    });

    elements.selViewTrip.addEventListener('change', (e) => {
        state.viewFilterTrip = e.target.value;
        fetchAndRenderLedger();
    });

    elements.selViewAlarm.addEventListener('change', (e) => {
        state.viewFilterAlarm = e.target.value;
        fetchAndRenderLedger();
    });

    elements.selViewPumpFamily.addEventListener('change', (e) => {
        state.viewFilterPumpFamily = e.target.value;
        fetchAndRenderLedger();
    });

    elements.selViewAsset.addEventListener('change', (e) => {
        state.viewFilterAsset = e.target.value;
        fetchAndRenderLedger();
    });

    elements.chkAutoScroll.addEventListener('change', (e) => {
        state.autoScroll = e.target.checked;
    });

    elements.btnLoadMore.addEventListener('click', async () => {
        try {
            let url = `/api/telemetry?limit=100&offset=${state.allRecords.length}`;
            if (state.viewFilterCategory && state.viewFilterCategory !== 'ALL') {
                url += `&data_category=${encodeURIComponent(state.viewFilterCategory)}`;
            }
            if (state.viewFilterScenario && state.viewFilterScenario !== 'ALL') {
                url += `&scenario=${encodeURIComponent(state.viewFilterScenario)}`;
            }
            if (state.viewFilterTrip && state.viewFilterTrip !== 'ALL') {
                if (state.viewFilterTrip === 'RUNNING_ONLY') url += `&operating_state=running`;
                else if (state.viewFilterTrip === 'TRIPPED_ANY') url += `&operating_state=tripped`;
                else url += `&trip_cause=${encodeURIComponent(state.viewFilterTrip)}`;
            }
            if (state.viewFilterAlarm && state.viewFilterAlarm !== 'ALL') {
                url += `&alarm_filter=${encodeURIComponent(state.viewFilterAlarm)}`;
            }
            if (state.viewFilterPumpFamily && state.viewFilterPumpFamily !== 'ALL') {
                url += `&pump_family=${encodeURIComponent(state.viewFilterPumpFamily)}`;
            }
            if (state.viewFilterAsset && state.viewFilterAsset !== 'ALL') {
                url += `&well_id=${encodeURIComponent(state.viewFilterAsset)}`;
            }
            if (state.searchQuery && state.searchQuery.trim() !== '') {
                url += `&search=${encodeURIComponent(state.searchQuery.trim())}`;
            }

            const res = await fetch(url);
            const data = await res.json();
            if (data.records && data.records.length > 0) {
                state.allRecords.push(...data.records);
                data.records.forEach(r => insertLedgerRow(r, false));
                elements.tableStatsInfo.textContent = `Showing ${state.allRecords.length} of ${(data.total || 0).toLocaleString()} records from SQLite`;
                showToast(`Loaded ${data.records.length} more records`, 'info');
            } else {
                showToast('No more records matching current filter in SQLite', 'info');
            }
        } catch (err) {
            showToast(`Failed to load history: ${err.message}`, 'error');
        }
    });

    elements.btnExportLabelledCSV.addEventListener('click', () => exportCSV('LABELLED'));
    elements.btnExportUnlabelledCSV.addEventListener('click', () => exportCSV('UNLABELLED'));
    elements.btnClearDB.addEventListener('click', clearDatabase);

    elements.selChartAsset.addEventListener('change', loadHistoricalChartData);
    elements.selChartPoints.addEventListener('change', loadHistoricalChartData);
    elements.btnRefreshCharts.addEventListener('click', loadHistoricalChartData);
    elements.btnRefreshFleet.addEventListener('click', loadAssetFleetSummary);

    elements.btnCloseJsonModal.addEventListener('click', closeJsonModal);
    elements.btnDoneJsonModal.addEventListener('click', closeJsonModal);
    elements.btnCopyJson.addEventListener('click', () => {
        if (state.selectedPayload) {
            const raw = state.selectedPayload.raw_payload;
            const text = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2);
            navigator.clipboard.writeText(text);
            showToast('JSON copied to clipboard!', 'success');
        }
    });

    // Theme Switcher Toggle
    if (elements.btnThemeToggle) {
        elements.btnThemeToggle.addEventListener('click', toggleTheme);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeJsonModal();
            closeDbStatsModal();
        }
    });
}

// Start application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    initWebSocket();
    fetch('/api/mqtt/config').then(r => r.json()).then(cfg => {
        if (cfg.broker_host) elements.inlineBrokerHost.value = cfg.broker_host;
        if (cfg.broker_port) elements.inlineBrokerPort.value = cfg.broker_port;
        if (cfg.username) elements.inlineUsername.value = cfg.username;
        if (cfg.password) elements.inlinePassword.value = cfg.password;
        if (cfg.topics && Array.isArray(cfg.topics)) elements.inlineTopics.value = cfg.topics.join(', ');
    }).catch(console.error);

    fetch('/api/filters').then(r => r.json()).then(data => {
        if (data.discovered_wells) {
            data.discovered_wells.forEach(w => state.discoveredWells.add(w));
        }
        if (data.discovered_assets) {
            data.discovered_assets.forEach(a => state.discoveredAssets.add(a));
        }
        if (data.storage_category_mode) {
            state.storageCategoryMode = data.storage_category_mode;
            elements.selStorageCategoryMode.value = data.storage_category_mode;
        }
        refreshAssetFilterChips();
        populateAssetSelectDropdowns();
    }).catch(console.error);

    // Initial historical telemetry fetch so ledger table is populated immediately
    fetch('/api/telemetry?limit=50').then(r => r.json()).then(data => {
        if (data.records && data.records.length > 0 && state.allRecords.length === 0) {
            state.allRecords = data.records;
            renderLedgerTable();
            data.records.forEach(r => {
                state.discoveredAssets.add(r.asset_id);
                state.discoveredWells.add(r.well_id);
            });
            populateAssetSelectDropdowns();
        }
    }).catch(console.error);
});
