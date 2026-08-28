import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { PARAM_CONFIGS } from '../constants/telemetryTags';

const TelemetryContext = createContext(null);

export const TelemetryProvider = ({ children }) => {
  const [assetsList, setAssetsList] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState('FS-010');
  const [assetDetails, setAssetDetails] = useState(null);
  const [faultRegistry, setFaultRegistry] = useState([]);
  const [activeModalAsset, setActiveModalAsset] = useState(null);

  const [isConnected, setIsConnected] = useState(false);
  const [mqttStatus, setMqttStatus] = useState('DISCONNECTED');
  const [systemStatus, setSystemStatus] = useState({
    collector: {
      is_running: true,
      total_received: 0,
      total_saved: 0,
      total_filtered: 0,
      total_buffered: 0,
      msg_rate_per_sec: 0.0,
      is_connected: false,
      storage_category_mode: 'BOTH'
    },
    database: {
      total_records: 0,
      labelled_records: 0,
      unlabelled_records: 0,
      wells_count: 0,
      assets_count: 0
    }
  });

  const [mqttConfig, setMqttConfig] = useState({
    broker_host: '',
    broker_port: 1883,
    username: '',
    password: '',
    topics: ['esp/#', 'opg/#', 'wells/#'],
    fault_filter: 'ALL'
  });

  const [liveTelemetry, setLiveTelemetryRaw] = useState({});
  const setLiveTelemetry = (val) => {
    setLiveTelemetryRaw(prev => {
      const next = typeof val === 'function' ? val(prev || {}) : val;
      return (next && typeof next === 'object') ? next : (prev || {});
    });
  };
  const [recentRecords, setRecentRecords] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [envelopeEvaluations, setEnvelopeEvaluations] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [timeRange, setTimeRange] = useState('6h');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [lastPacketTime, setLastPacketTime] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const [userSetpoints, setUserSetpoints] = useState({
    pip_low_limit: 450,
    pdp_high_limit: 2800,
    temp_high_limit: 95,
    vib_high_limit: 0.28,
    curr_high_limit: 60
  });

  // Sync isConnected from backend collector object (field: is_connected)
  const syncConnectionState = useCallback((collector) => {
    if (!collector) return;
    const connected = Boolean(collector.is_connected);
    setIsConnected(connected);
    setMqttStatus(connected ? 'CONNECTED' : 'DISCONNECTED');
  }, []);

  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch('/api/esp/assets');
      if (res.ok) {
        const data = await res.json();
        const list = data.assets || (Array.isArray(data) ? data : []);
        if (list.length > 0) {
          setAssetsList(list);
          if (!selectedAsset) setSelectedAsset(list[0].asset_id || list[0]);
        }
      }
    } catch (err) {
      console.warn('[TelemetryContext] Assets fetch fallback:', err);
    }
  }, [selectedAsset]);

  const fetchFaultRegistry = useCallback(async () => {
    try {
      const res = await fetch('/api/esp/faults/registry');
      if (res.ok) {
        const data = await res.json();
        setFaultRegistry(data.fault_classes || data.faults || []);
      }
    } catch (err) {
      console.warn('[TelemetryContext] Faults registry fetch error:', err);
    }
  }, []);

  const fetchSystemStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        const collector = data.collector || {};
        setSystemStatus({ collector, database: data.database || {} });
        syncConnectionState(collector);
      }
    } catch (_) {}
  }, [syncConnectionState]);

  const fetchMqttConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/mqtt/config');
      if (res.ok) {
        const data = await res.json();
        setMqttConfig(prev => {
          const newHost = data.broker_host !== undefined ? data.broker_host : prev.broker_host;
          const newPort = data.broker_port || prev.broker_port;
          const newUsername = data.username !== undefined ? (data.username || '') : prev.username;
          const newPassword = data.password !== undefined ? (data.password || '') : prev.password;
          const newTopics = data.topics || prev.topics;
          if (prev.broker_host === newHost && prev.broker_port === newPort &&
              prev.username === newUsername && prev.password === newPassword &&
              JSON.stringify(prev.topics) === JSON.stringify(newTopics)) return prev;
          return { ...prev, broker_host: newHost, broker_port: newPort, username: newUsername, password: newPassword, topics: newTopics };
        });
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchAssets();
    fetchFaultRegistry();
    fetchSystemStatus();
    fetchMqttConfig();
    const interval = setInterval(fetchSystemStatus, 3000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedAsset) return;
    const fetchAssetData = async () => {
      try {
        const visRes = await fetch(`/api/esp/assets/${selectedAsset}/visualization`);
        if (visRes.ok) setAssetDetails(await visRes.json());
        const envRes = await fetch(`/api/esp/assets/${selectedAsset}/envelope`);
        if (envRes.ok) { const d = await envRes.json(); setEnvelopeEvaluations(d.evaluations || []); }
      } catch (err) { console.warn('[TelemetryContext] Asset details fetch error:', err); }
    };
    fetchAssetData();
  }, [selectedAsset]);

  const fetchHistory = useCallback(async (assetId, range) => {
    if (!assetId) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/esp/assets/${assetId}/history?range=${range}&limit=150`);
      if (res.ok) {
        const data = await res.json();
        const records = Array.isArray(data) ? data : (data.points || data.records || []);
        const mapped = records.map(r => ({
          timestamp: r.timestamp,
          R_PIT_001: r.wellhead_pressure_psi ? r.wellhead_pressure_psi * 0.0689476 : r.R_PIT_001,
          R_PIT_002: r.casing_pressure_psi ? r.casing_pressure_psi * 0.0689476 : r.R_PIT_002,
          R_PIT_003: r.flowline_pressure_psi ? r.flowline_pressure_psi * 0.0689476 : r.R_PIT_003,
          R_INTAKE_PRESS: r.intake_pressure_psi !== undefined ? r.intake_pressure_psi : r.R_INTAKE_PRESS,
          R_DISCH_PRESS: r.pressure_psi !== undefined ? r.pressure_psi : r.R_DISCH_PRESS,
          R_INTAKE_TEMP: r.intake_temperature_c !== undefined ? r.intake_temperature_c : r.R_INTAKE_TEMP,
          R_MOTOR_TEMP: r.temperature_c !== undefined ? r.temperature_c : r.R_MOTOR_TEMP,
          R_FREQUENCY: r.frequency_hz !== undefined ? r.frequency_hz : r.R_FREQUENCY,
          R_VIBRATION_X: r.vibration_g !== undefined ? r.vibration_g : (r.vibration_rms !== undefined ? r.vibration_rms : r.R_VIBRATION_X),
          R_DRV_CURR_AVG: r.motor_current_a !== undefined ? r.motor_current_a : r.R_DRV_CURR_AVG,
          R_DHG_CURR_AVG: r.motor_current_a !== undefined ? r.motor_current_a : r.R_DHG_CURR_AVG,
          R_BUS_IN_VTG_AVG: r.motor_voltage_v !== undefined ? r.motor_voltage_v : r.R_BUS_IN_VTG_AVG,
          R_TOOL_CURRENT: r.R_TOOL_CURRENT !== undefined ? r.R_TOOL_CURRENT : 4.5,
          pressure_psi: r.pressure_psi,
          intake_pressure_psi: r.intake_pressure_psi,
          flow_rate_bpd: r.flow_rate_bpd,
          frequency_hz: r.frequency_hz,
          motor_current_a: r.motor_current_a,
          motor_voltage_v: r.motor_voltage_v,
          temperature_c: r.temperature_c,
          vibration_g: r.vibration_g,
          well_id: r.well_id || assetId,
          asset_id: r.asset_id,
          scenario: r.scenario || r.fault_classification || 'normal',
          id: r.id
        }));
        setHistoryData(mapped);
        if (mapped.length > 0) {
          setLiveTelemetry(prev => ({ ...prev, ...mapped[mapped.length - 1] }));
          setRecentRecords(mapped.slice(-40).reverse());
        }
      }
    } catch (err) { console.warn('[TelemetryContext] History fetch error:', err); }
    finally { setLoadingHistory(false); }
  }, []);

  useEffect(() => {
    if (selectedAsset) fetchHistory(selectedAsset, timeRange);
  }, [selectedAsset, timeRange, fetchHistory]);

  // WebSocket live connection
  useEffect(() => {
    let unmounted = false;
    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/live`;
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => { if (!unmounted) console.log('[WS] Connected to backend'); };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === 'INITIAL_STATE') {
              const collector = msg.status || {};
              setSystemStatus(prev => ({ ...prev, collector, database: msg.counts || prev.database }));
              syncConnectionState(collector);
              if (msg.recent_records && Array.isArray(msg.recent_records) && msg.recent_records.length > 0)
                setRecentRecords(msg.recent_records);
              return;
            }

            if (msg.type === 'STATUS_UPDATE') {
              const collector = msg.data || {};
              setSystemStatus(prev => ({ ...prev, collector }));
              syncConnectionState(collector);
              return;
            }

            if (msg.type === 'FILTER_UPDATE') {
              setSystemStatus(prev => ({ ...prev, collector: msg.data || prev.collector }));
              return;
            }

            if (msg.type === 'DATABASE_CLEARED') {
              setRecentRecords([]);
              setHistoryData([]);
              return;
            }

            if (msg.type === 'ESP_ASSESSMENT' && msg.data) {
              const rawAss = msg.data;
              const rawFault = (rawAss.fault_classification || rawAss.fault_name || rawAss.fault || 'Normal').trim();
              const isNormalFault = ['normal','healthy'].includes(rawFault.toLowerCase());
              const hasLimits = rawAss.triggered_limits && rawAss.triggered_limits.length > 0;
              const isAnom = Boolean(rawAss.is_anomaly || rawAss.is_anomalous);
              const normalizedState = (!isNormalFault || hasLimits || isAnom) ? 'FAULTY/ANOMALY' : 'HEALTHY';
              setAssessment({
                ...rawAss, state: normalizedState, fault_classification: rawFault,
                confidence_score: rawAss.confidence_score !== undefined ? Number(rawAss.confidence_score) : 1.0,
                anomaly_score: rawAss.anomaly_score !== undefined ? Number(rawAss.anomaly_score) : (normalizedState === 'HEALTHY' ? 0.065 : 0.85),
                is_anomaly: normalizedState === 'FAULTY/ANOMALY',
                triggered_limits: rawAss.triggered_limits || []
              });
              return;
            }

            if (msg.type === 'LIVE_TELEMETRY' && msg.data) {
              const rawData = msg.data;
              const msgWell = rawData.well_id || rawData.asset_id;
              if (!msgWell || !selectedAsset || msgWell === selectedAsset || rawData.well_id === selectedAsset) {
                const ts = rawData.timestamp || new Date().toISOString();
                const tagData = {
                  timestamp: ts,
                  well_id: rawData.well_id || msgWell || selectedAsset,
                  asset_id: rawData.asset_id,
                  R_DISCH_PRESS: rawData.pressure_psi || rawData.R_DISCH_PRESS,
                  R_INTAKE_PRESS: rawData.intake_pressure_psi || rawData.R_INTAKE_PRESS,
                  R_MOTOR_TEMP: rawData.temperature_c || rawData.R_MOTOR_TEMP,
                  R_INTAKE_TEMP: rawData.intake_temperature_c || rawData.R_INTAKE_TEMP,
                  R_FREQUENCY: rawData.frequency_hz || rawData.R_FREQUENCY,
                  R_VIBRATION_X: rawData.vibration_g || rawData.R_VIBRATION_X,
                  R_DRV_CURR_AVG: rawData.motor_current_a || rawData.R_DRV_CURR_AVG,
                  R_DHG_CURR_AVG: rawData.motor_current_a || rawData.R_DHG_CURR_AVG,
                  R_BUS_IN_VTG_AVG: rawData.motor_voltage_v || rawData.R_BUS_IN_VTG_AVG,
                  R_TOOL_CURRENT: rawData.R_TOOL_CURRENT || 4.5,
                  R_PIT_001: rawData.R_PIT_001 || (rawData.pressure_psi ? rawData.pressure_psi * 0.0689476 : undefined),
                  R_PIT_002: rawData.R_PIT_002,
                  R_PIT_003: rawData.R_PIT_003,
                  pressure_psi: rawData.pressure_psi,
                  intake_pressure_psi: rawData.intake_pressure_psi,
                  flow_rate_bpd: rawData.flow_rate_bpd,
                  frequency_hz: rawData.frequency_hz,
                  motor_current_a: rawData.motor_current_a,
                  motor_voltage_v: rawData.motor_voltage_v,
                  temperature_c: rawData.temperature_c,
                  vibration_g: rawData.vibration_g,
                  water_cut_pct: rawData.water_cut_pct,
                  scenario: rawData.scenario || rawData.operating_state || 'normal',
                  operating_state: rawData.operating_state,
                  status: rawData.status,
                };
                setLiveTelemetry(prev => ({ ...prev, ...tagData }));
                setLastPacketTime(new Date());
                setHistoryData(prev => [...prev, { ...tagData }].slice(-500));
                setRecentRecords(prev => {
                  const row = {
                    id: rawData.id || Date.now(), timestamp: ts,
                    well_id: rawData.well_id || msgWell || selectedAsset,
                    asset_id: rawData.asset_id,
                    category: rawData.data_category || 'LIVE',
                    scenario: rawData.scenario || rawData.operating_state || 'normal',
                    pressure_psi: rawData.pressure_psi,
                    intake_pressure_psi: rawData.intake_pressure_psi,
                    flow_rate_bpd: rawData.flow_rate_bpd,
                    frequency_hz: rawData.frequency_hz,
                    motor_current_a: rawData.motor_current_a,
                    motor_voltage_v: rawData.motor_voltage_v,
                    temperature_c: rawData.temperature_c,
                    vibration_g: rawData.vibration_g,
                    R_DRV_CURR_AVG: rawData.motor_current_a || rawData.R_DRV_CURR_AVG,
                    R_DISCH_PRESS: rawData.pressure_psi || rawData.R_DISCH_PRESS,
                    R_INTAKE_PRESS: rawData.intake_pressure_psi || rawData.R_INTAKE_PRESS,
                    R_FREQUENCY: rawData.frequency_hz || rawData.R_FREQUENCY,
                    R_MOTOR_TEMP: rawData.temperature_c || rawData.R_MOTOR_TEMP,
                    R_VIBRATION_X: rawData.vibration_g || rawData.R_VIBRATION_X,
                    R_LIQ_RATE: rawData.flow_rate_bpd,
                  };
                  return [row, ...prev.slice(0, 49)];
                });
              }
              return;
            }
          } catch (e) { console.warn('[TelemetryContext] WS parse error:', e); }
        };

        ws.onclose = (evt) => {
          if (!unmounted) {
            console.log('[WS] WebSocket disconnected, reconnecting in 3s...', evt.reason || '');
            reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
          }
        };
        ws.onerror = (err) => {
          console.debug('[WS] Connection error');
        };
      } catch (err) {
        if (!unmounted) reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();
    return () => {
      unmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        const socket = wsRef.current;
        wsRef.current = null;
        socket.onopen = null;
        socket.onclose = null;
        socket.onerror = null;
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        } else if (socket.readyState === WebSocket.CONNECTING) {
          socket.onopen = () => {
            try { socket.close(); } catch (e) {}
          };
        }
      }
    };
  }, [syncConnectionState]);

  const controlIngestion = async (action) => {
    try {
      const res = await fetch('/api/control', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      if (res.ok) fetchSystemStatus();
    } catch (err) { console.warn('[TelemetryContext] Ingestion control error:', err); }
  };

  const toggleIngestion = async () => {
    const action = systemStatus.collector.is_running ? 'pause' : 'resume';
    await controlIngestion(action);
  };

  const applyMqttConfig = async (newConfig) => {
    try {
      const res = await fetch('/api/mqtt/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newConfig) });
      if (res.ok) {
        setMqttConfig(prev => ({ ...prev, ...newConfig }));
        setTimeout(fetchSystemStatus, 1500);
        setTimeout(fetchSystemStatus, 3500);
      }
    } catch (err) { console.warn('[TelemetryContext] MQTT config apply error:', err); }
  };

  const disconnectMqtt = async () => {
    try {
      const res = await fetch('/api/mqtt/disconnect', { method: 'POST' });
      if (res.ok) { setIsConnected(false); setMqttStatus('DISCONNECTED'); fetchSystemStatus(); }
    } catch (err) { console.warn('[TelemetryContext] MQTT disconnect error:', err); }
  };

  const ingestionState = {
    isRunning: systemStatus?.collector?.is_running ?? true,
    ingestionRate: systemStatus?.collector?.msg_rate_per_sec ?? 0.0,
    totalRecords: systemStatus?.database?.total_records || systemStatus?.collector?.total_saved || 0,
    totalSaved: systemStatus?.collector?.total_saved || 0,
    totalReceived: systemStatus?.collector?.total_received || 0,
    totalFiltered: systemStatus?.collector?.total_filtered || 0,
    totalBuffered: systemStatus?.collector?.total_buffered || 0,
    storageCategoryMode: systemStatus?.collector?.storage_category_mode || 'BOTH'
  };

  return (
    <TelemetryContext.Provider value={{
      assetsList, selectedAsset, setSelectedAsset, activeModalAsset, setActiveModalAsset,
      assetDetails, faultRegistry, envelopeEvaluations,
      isConnected, mqttStatus, systemStatus, ingestionState,
      mqttConfig, applyMqttConfig, disconnectMqtt, toggleIngestion, controlIngestion,
      liveTelemetry, setLiveTelemetry, recentRecords, assessment,
      timeRange, setTimeRange, historyData, setHistoryData,
      loadingHistory, lastPacketTime, userSetpoints, setUserSetpoints,
      refreshHistory: () => fetchHistory(selectedAsset, timeRange)
    }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) throw new Error('useTelemetry must be used within a TelemetryProvider');
  return context;
};
