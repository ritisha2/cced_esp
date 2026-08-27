/**
 * ESP Intelligence - Live 13-Parameter Real-Time Multi-Graph Dashboard
 * High-performance Chart.js live time-series streaming across 13 distinct physical parameters.
 * Zero fabrication - binds directly to genuine live MQTT & SQLite historian telemetry.
 */

(function () {
    'use strict';

    // 13 Canonical Parameters Configuration with Curated Unique Colors & Physics Units
    const PARAMETERS_CONFIG = [
        {
            key: 'discharge_pressure_psi',
            title: 'Discharge Pressure (PDP)',
            shortName: 'PDP',
            unit: 'PSI',
            icon: 'fa-gauge-high',
            color: '#10b981', // Emerald Green
            bgColor: 'rgba(16, 185, 129, 0.12)',
            minDefault: 0,
            maxDefault: 3000,
            decimals: 1,
            extract: (d) => {
                const meas = d.measurements || {};
                return d.discharge_pressure_psi ?? d.pressure_psi ?? meas.discharge_pressure_psi ?? meas.pressure_psi;
            }
        },
        {
            key: 'intake_pressure_psi',
            title: 'Intake Pressure (PIP)',
            shortName: 'PIP',
            unit: 'PSI',
            icon: 'fa-arrow-down-to-bracket',
            color: '#06b6d4', // Electric Cyan
            bgColor: 'rgba(6, 182, 212, 0.12)',
            minDefault: 0,
            maxDefault: 1500,
            decimals: 1,
            extract: (d) => {
                const meas = d.measurements || {};
                return d.intake_pressure_psi ?? meas.intake_pressure_psi ?? meas.intake_p;
            }
        },
        {
            key: 'differential_pressure_psi',
            title: 'Differential Pressure (ΔP)',
            shortName: 'ΔP',
            unit: 'PSI',
            icon: 'fa-shuffle',
            color: '#14b8a6', // Deep Teal
            bgColor: 'rgba(20, 184, 166, 0.12)',
            minDefault: 0,
            maxDefault: 2500,
            decimals: 1,
            extract: (d) => {
                const meas = d.measurements || {};
                const pdp = Number(d.discharge_pressure_psi ?? d.pressure_psi ?? meas.discharge_pressure_psi ?? meas.pressure_psi);
                const pip = Number(d.intake_pressure_psi ?? meas.intake_pressure_psi ?? meas.intake_p);
                if (pdp > 0 && pip > 0) return pdp - pip;
                return d.differential_pressure_psi ?? meas.differential_pressure_psi;
            }
        },
        {
            key: 'motor_current_a',
            title: 'Motor Current',
            shortName: 'Current',
            unit: 'A',
            icon: 'fa-bolt',
            color: '#3b82f6', // Neon Electric Blue
            bgColor: 'rgba(59, 130, 246, 0.12)',
            minDefault: 0,
            maxDefault: 60,
            decimals: 2,
            extract: (d) => {
                const meas = d.measurements || {};
                return d.motor_current_a ?? meas.motor_current_a ?? meas.current;
            }
        },
        {
            key: 'motor_voltage_v',
            title: 'Motor Terminal Voltage',
            shortName: 'Voltage',
            unit: 'V',
            icon: 'fa-plug-circle-bolt',
            color: '#8b5cf6', // Royal Purple
            bgColor: 'rgba(139, 92, 246, 0.12)',
            minDefault: 0,
            maxDefault: 2400,
            decimals: 1,
            extract: (d) => {
                const meas = d.measurements || {};
                return d.motor_voltage_v ?? meas.motor_voltage_v ?? meas.voltage;
            }
        },
        {
            key: 'motor_temperature_c',
            title: 'Motor Winding Temperature',
            shortName: 'Motor Temp',
            unit: '°C',
            icon: 'fa-temperature-arrow-up',
            color: '#ef4444', // Bright Crimson Red
            bgColor: 'rgba(239, 68, 68, 0.12)',
            minDefault: 0,
            maxDefault: 150,
            decimals: 1,
            extract: (d) => {
                const meas = d.measurements || {};
                return d.motor_temperature_c ?? d.temperature_c ?? meas.motor_temperature_c ?? meas.temperature_c;
            }
        },
        {
            key: 'intake_temperature_c',
            title: 'Intake Fluid Temperature',
            shortName: 'Intake Temp',
            unit: '°C',
            icon: 'fa-temperature-half',
            color: '#f97316', // Vivid Orange
            bgColor: 'rgba(249, 115, 22, 0.12)',
            minDefault: 0,
            maxDefault: 120,
            decimals: 1,
            extract: (d) => {
                const meas = d.measurements || {};
                return d.intake_temperature_c ?? meas.intake_temperature_c;
            }
        },
        {
            key: 'vibration_g_rms',
            title: 'Vibration RMS',
            shortName: 'Vibration',
            unit: 'g',
            icon: 'fa-water',
            color: '#eab308', // Golden Yellow
            bgColor: 'rgba(234, 179, 8, 0.12)',
            minDefault: 0,
            maxDefault: 1.0,
            decimals: 4,
            extract: (d) => {
                const meas = d.measurements || {};
                return d.vibration_g_rms ?? d.vibration_g ?? meas.vibration_g_rms ?? meas.vibration_g;
            }
        },
        {
            key: 'frequency_hz',
            title: 'VSD Operating Frequency',
            shortName: 'Frequency',
            unit: 'Hz',
            icon: 'fa-wave-square',
            color: '#84cc16', // Neon Lime
            bgColor: 'rgba(132, 204, 22, 0.12)',
            minDefault: 0,
            maxDefault: 70,
            decimals: 2,
            extract: (d) => {
                const meas = d.measurements || {};
                return d.frequency_hz ?? meas.frequency_hz ?? meas.frequency;
            }
        },
        {
            key: 'flow_bpd',
            title: 'Liquid Flow Rate',
            shortName: 'Liquid Rate',
            unit: 'BPD',
            icon: 'fa-faucet-drip',
            color: '#0284c7', // Deep Sky Blue
            bgColor: 'rgba(2, 132, 199, 0.12)',
            minDefault: 0,
            maxDefault: 3500,
            decimals: 1,
            extract: (d) => {
                const meas = d.measurements || {};
                return d.flow_bpd ?? d.flow_rate_bpd ?? meas.flow_bpd ?? meas.flow_rate_bpd;
            }
        },
        {
            key: 'gas_volume_fraction_pct',
            title: 'Gas Volume Fraction (GVF)',
            shortName: 'GVF',
            unit: '%',
            icon: 'fa-fire-flame-simple',
            color: '#ec4899', // Vivid Magenta Pink
            bgColor: 'rgba(236, 72, 153, 0.12)',
            minDefault: 0,
            maxDefault: 50,
            decimals: 1,
            extract: (d) => {
                const meas = d.measurements || {};
                return d.pump_intake_gas_volume_fraction_pct ?? d.gas_volume_fraction_pct ?? meas.pump_intake_gas_volume_fraction_pct;
            }
        },
        {
            key: 'voltage_imbalance_pct',
            title: 'Voltage Imbalance',
            shortName: 'V-Imb',
            unit: '%',
            icon: 'fa-scale-unbalanced',
            color: '#6366f1', // Indigo
            bgColor: 'rgba(99, 102, 241, 0.12)',
            minDefault: 0,
            maxDefault: 5,
            decimals: 2,
            extract: (d) => {
                const meas = d.measurements || {};
                return d.voltage_imbalance_pct ?? meas.voltage_imbalance_pct;
            }
        },
        {
            key: 'current_imbalance_pct',
            title: 'Current Imbalance',
            shortName: 'I-Imb',
            unit: '%',
            icon: 'fa-scale-unbalanced-flip',
            color: '#f43f5e', // Coral Rose
            bgColor: 'rgba(244, 63, 94, 0.12)',
            minDefault: 0,
            maxDefault: 10,
            decimals: 2,
            extract: (d) => {
                const meas = d.measurements || {};
                return d.current_imbalance_pct ?? meas.current_imbalance_pct;
            }
        }
    ];

    class Param13GraphsController {
        constructor() {
            this.currentAsset = 'FS-010';
            this.activeWindow = '6h';
            this.isPaused = false;
            this.charts = {};
            this.dataBuffers = {};
            this.maxBufferSize = 100;
            this.availableAssets = [];
            this.totalPacketsReceived = 0;
            this.lastUpdateTimestamp = null;
            this.initialized = false;
        }

        async init() {
            if (this.initialized) {
                this.resizeCharts();
                return;
            }
            this.buildDashboardSkeleton();
            this.initDataBuffers();
            this.initCharts();
            this.bindControls();
            await this.loadAssetList();
            await this.loadHistoricalData(this.currentAsset, this.activeWindow);
            this.initialized = true;
            this.resizeCharts();
        }

        resizeCharts() {
            setTimeout(() => {
                Object.values(this.charts).forEach(c => {
                    if (c && typeof c.resize === 'function') {
                        c.resize();
                    }
                });
            }, 50);
        }

        initDataBuffers() {
            PARAMETERS_CONFIG.forEach(cfg => {
                this.dataBuffers[cfg.key] = {
                    timestamps: [],
                    values: [],
                    min: Infinity,
                    max: -Infinity,
                    avg: 0,
                    lastVal: null
                };
            });
        }

        buildDashboardSkeleton() {
            const container = document.getElementById('param13GridContainer');
            if (!container) return;

            container.innerHTML = '';
            PARAMETERS_CONFIG.forEach((cfg, idx) => {
                const card = document.createElement('div');
                card.className = 'param13-chart-card';
                card.id = `card-param-${cfg.key}`;
                card.style.setProperty('--param-color', cfg.color);
                card.style.setProperty('--param-bg', cfg.bgColor);

                card.innerHTML = `
                    <div class="param13-card-header">
                        <div class="param13-card-title-group">
                            <span class="param13-indicator-dot" style="background: ${cfg.color}; box-shadow: 0 0 10px ${cfg.color}"></span>
                            <i class="fa-solid ${cfg.icon} param13-icon" style="color: ${cfg.color}"></i>
                            <span class="param13-title">${cfg.title}</span>
                        </div>
                        <span class="param13-unit-badge">${cfg.unit}</span>
                    </div>

                    <div class="param13-card-metrics">
                        <div class="param13-current-val-box">
                            <span class="param13-label">LIVE VALUE</span>
                            <span class="param13-val" id="val-live-${cfg.key}" style="color: ${cfg.color}">--</span>
                            <span class="param13-unit">${cfg.unit}</span>
                        </div>
                        <div class="param13-stats-row">
                            <div class="param13-stat-item">
                                <span class="stat-lbl">MIN</span>
                                <span class="stat-num" id="val-min-${cfg.key}">--</span>
                            </div>
                            <div class="param13-stat-item">
                                <span class="stat-lbl">AVG</span>
                                <span class="stat-num" id="val-avg-${cfg.key}">--</span>
                            </div>
                            <div class="param13-stat-item">
                                <span class="stat-lbl">MAX</span>
                                <span class="stat-num" id="val-max-${cfg.key}">--</span>
                            </div>
                        </div>
                    </div>

                    <div class="param13-canvas-wrap">
                        <canvas id="canvas-param-${cfg.key}"></canvas>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        initCharts() {
            if (typeof Chart === 'undefined') {
                console.error('[Param13] Chart.js not available!');
                return;
            }

            PARAMETERS_CONFIG.forEach(cfg => {
                const canvas = document.getElementById(`canvas-param-${cfg.key}`);
                if (!canvas) return;

                const ctx = canvas.getContext('2d');
                if (this.charts[cfg.key]) {
                    this.charts[cfg.key].destroy();
                }

                this.charts[cfg.key] = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [{
                            label: cfg.title,
                            data: [],
                            borderColor: cfg.color,
                            backgroundColor: cfg.bgColor,
                            borderWidth: 2,
                            pointRadius: 0,
                            pointHoverRadius: 4,
                            pointHoverBackgroundColor: cfg.color,
                            pointHoverBorderColor: '#ffffff',
                            tension: 0.25,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                enabled: true,
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                titleColor: '#94a3b8',
                                bodyColor: '#ffffff',
                                borderColor: cfg.color,
                                borderWidth: 1,
                                padding: 8,
                                displayColors: false,
                                callbacks: {
                                    title: (items) => items[0] ? `Time: ${items[0].label}` : '',
                                    label: (item) => `${cfg.shortName}: ${Number(item.raw).toFixed(cfg.decimals)} ${cfg.unit}`
                                }
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.04)',
                                    drawBorder: false
                                },
                                ticks: {
                                    color: '#64748b',
                                    font: { size: 10, family: 'JetBrains Mono' },
                                    maxRotation: 0,
                                    maxTicksLimit: 6
                                }
                            },
                            y: {
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.06)',
                                    drawBorder: false
                                },
                                ticks: {
                                    color: '#94a3b8',
                                    font: { size: 10, family: 'JetBrains Mono' },
                                    callback: (val) => `${val}`
                                }
                            }
                        }
                    }
                });
            });
        }

        bindControls() {
            // Pump Dropdown
            const selWell = document.getElementById('sel13ParamWellFilter');
            if (selWell) {
                selWell.addEventListener('change', (e) => {
                    this.switchAsset(e.target.value);
                });
            }

            // Time Window Buttons
            const winBtns = document.querySelectorAll('.btn-param13-window');
            winBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    winBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.activeWindow = btn.getAttribute('data-window') || '6h';
                    this.loadHistoricalData(this.currentAsset, this.activeWindow);
                });
            });

            // Pause / Resume Stream
            const btnPause = document.getElementById('btn13ParamTogglePause');
            if (btnPause) {
                btnPause.addEventListener('click', () => {
                    this.isPaused = !this.isPaused;
                    btnPause.innerHTML = this.isPaused
                        ? '<i class="fa-solid fa-play"></i> Resume Stream'
                        : '<i class="fa-solid fa-pause"></i> Pause Stream';
                    btnPause.className = this.isPaused
                        ? 'btn btn-small btn-success'
                        : 'btn btn-small btn-warning';
                });
            }

            // Grid Column Switchers
            const gridBtns = document.querySelectorAll('.btn-param13-grid-cols');
            const gridContainer = document.getElementById('param13GridContainer');
            gridBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    gridBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const cols = btn.getAttribute('data-cols') || '3';
                    if (gridContainer) {
                        gridContainer.setAttribute('data-cols', cols);
                    }
                });
            });
        }

        async loadAssetList() {
            try {
                const resp = await fetch('/api/esp/assets');
                const data = await resp.json();
                if (data.assets && data.assets.length > 0) {
                    this.availableAssets = data.assets.map(a => a.asset_id);
                } else {
                    this.availableAssets = ['FS-010', 'FS-011', 'FS-013', 'FSWS-001-A', 'FS-021', 'FS-022', 'FS-023'];
                }
            } catch (e) {
                console.warn('[Param13] Could not load assets list, using defaults:', e);
                this.availableAssets = ['FS-010', 'FS-011', 'FS-013', 'FSWS-001-A', 'FS-021', 'FS-022', 'FS-023'];
            }

            const sel = document.getElementById('sel13ParamWellFilter');
            if (sel) {
                sel.innerHTML = '';
                this.availableAssets.forEach(id => {
                    const opt = document.createElement('option');
                    opt.value = id;
                    opt.textContent = `Pump / Well: ${id}`;
                    if (id === this.currentAsset) opt.selected = true;
                    sel.appendChild(opt);
                });
            }
        }

        async switchAsset(assetId) {
            if (!assetId) return;
            this.currentAsset = assetId;
            const badge = document.getElementById('lbl13ParamActiveAsset');
            if (badge) badge.textContent = assetId;

            // Sync with other tabs if present
            const globalSel = document.getElementById('selESPWellFilter');
            if (globalSel && globalSel.value !== assetId) {
                globalSel.value = assetId;
                if (window.espIntelligence && typeof window.espIntelligence.switchAsset === 'function') {
                    window.espIntelligence.switchAsset(assetId);
                }
            }

            await this.loadHistoricalData(assetId, this.activeWindow);
        }

        async loadHistoricalData(assetId, range = '6h') {
            try {
                this.initDataBuffers();
                const resp = await fetch(`/api/esp/assets/${encodeURIComponent(assetId)}/history?range=${range}`);
                const data = await resp.json();
                const points = data.points || [];

                points.forEach(pt => {
                    const ts = pt.timestamp ? new Date(pt.timestamp).toLocaleTimeString() : '';
                    PARAMETERS_CONFIG.forEach(cfg => {
                        const val = cfg.extract(pt);
                        if (val !== undefined && val !== null && !isNaN(Number(val))) {
                            const num = Number(val);
                            const buf = this.dataBuffers[cfg.key];
                            buf.timestamps.push(ts);
                            buf.values.push(num);
                        }
                    });
                });

                this.recalculateStatsAndRender();
            } catch (e) {
                console.error(`[Param13] Failed to load history for ${assetId}:`, e);
            }
        }

        ingestLiveTelemetry(record) {
            if (this.isPaused || !record) return;

            const recAsset = String(record.asset_id || record.well_id || '').split('[')[0].trim();
            if (recAsset && recAsset.toUpperCase() !== this.currentAsset.toUpperCase()) {
                return; // Record belongs to a different pump
            }

            this.totalPacketsReceived++;
            const tsRaw = record.timestamp || new Date().toISOString();
            const timeLabel = new Date(tsRaw).toLocaleTimeString();
            this.lastUpdateTimestamp = timeLabel;

            const pktBadge = document.getElementById('lbl13ParamPacketCount');
            if (pktBadge) pktBadge.textContent = `${this.totalPacketsReceived} pkts`;

            const tsBadge = document.getElementById('lbl13ParamLastTime');
            if (tsBadge) tsBadge.textContent = timeLabel;

            PARAMETERS_CONFIG.forEach(cfg => {
                const val = cfg.extract(record);
                if (val !== undefined && val !== null && !isNaN(Number(val))) {
                    const num = Number(val);
                    const buf = this.dataBuffers[cfg.key];
                    buf.timestamps.push(timeLabel);
                    buf.values.push(num);

                    if (buf.timestamps.length > this.maxBufferSize) {
                        buf.timestamps.shift();
                        buf.values.shift();
                    }

                    // Update live chart
                    const chart = this.charts[cfg.key];
                    if (chart) {
                        chart.data.labels = buf.timestamps;
                        chart.data.datasets[0].data = buf.values;
                        chart.update('none'); // High-speed 60fps rendering without animations
                    }

                    // Update text readouts
                    buf.lastVal = num;
                    const elVal = document.getElementById(`val-live-${cfg.key}`);
                    if (elVal) elVal.textContent = num.toFixed(cfg.decimals);

                    // Recalculate Min/Max/Avg
                    const min = Math.min(...buf.values);
                    const max = Math.max(...buf.values);
                    const avg = buf.values.reduce((a, b) => a + b, 0) / buf.values.length;

                    const elMin = document.getElementById(`val-min-${cfg.key}`);
                    const elAvg = document.getElementById(`val-avg-${cfg.key}`);
                    const elMax = document.getElementById(`val-max-${cfg.key}`);

                    if (elMin) elMin.textContent = min.toFixed(cfg.decimals);
                    if (elAvg) elAvg.textContent = avg.toFixed(cfg.decimals);
                    if (elMax) elMax.textContent = max.toFixed(cfg.decimals);
                }
            });
        }

        recalculateStatsAndRender() {
            PARAMETERS_CONFIG.forEach(cfg => {
                const buf = this.dataBuffers[cfg.key];
                const chart = this.charts[cfg.key];

                if (chart && buf) {
                    chart.data.labels = buf.timestamps;
                    chart.data.datasets[0].data = buf.values;
                    chart.update('none');

                    if (buf.values.length > 0) {
                        const last = buf.values[buf.values.length - 1];
                        const min = Math.min(...buf.values);
                        const max = Math.max(...buf.values);
                        const avg = buf.values.reduce((a, b) => a + b, 0) / buf.values.length;

                        const elVal = document.getElementById(`val-live-${cfg.key}`);
                        const elMin = document.getElementById(`val-min-${cfg.key}`);
                        const elAvg = document.getElementById(`val-avg-${cfg.key}`);
                        const elMax = document.getElementById(`val-max-${cfg.key}`);

                        if (elVal) elVal.textContent = last.toFixed(cfg.decimals);
                        if (elMin) elMin.textContent = min.toFixed(cfg.decimals);
                        if (elAvg) elAvg.textContent = avg.toFixed(cfg.decimals);
                        if (elMax) elMax.textContent = max.toFixed(cfg.decimals);
                    }
                }
            });
        }
    }

    // Expose Global Instance
    window.param13Graphs = new Param13GraphsController();

    // Auto-init on DOMContentLoaded or Tab Switch
    document.addEventListener('DOMContentLoaded', () => {
        const tabBtn = document.querySelector('[data-tab="tab-13-params"]');
        if (tabBtn) {
            tabBtn.addEventListener('click', () => {
                window.param13Graphs.init();
            });
        }
    });
})();
