import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Maximize2,
  Minimize2,
  X,
  Zap,
  Activity,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  Send,
  RotateCcw,
  Layers,
  Grid,
  Trash2,
  Pin,
  LineChart,
  BarChart3,
  TrendingDown,
  Info,
  Maximize,
  Sliders
} from 'lucide-react';

export const AgentFloatingDock = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [canvasArtifacts, setCanvasArtifacts] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('FS-031');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Handle agent streaming request and canvas artifact dispatch
  const handleSendMessage = (queryText) => {
    const text = queryText || inputQuery;
    if (!text.trim() || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const agentMsgId = `agent-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMessages = [
      ...messages,
      { id: userMsgId, sender: 'user', text, timestamp },
      {
        id: agentMsgId,
        sender: 'agent',
        text: '',
        status: 'Connecting to Autonomous Agent Runtime...',
        timestamp
      }
    ];

    setMessages(newMessages);
    setInputQuery('');
    setIsLoading(true);

    // Multi-stage agent execution simulation
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMsgId
            ? { ...msg, status: 'Fetching Real-Time Telemetry & History (Port 8081)...' }
            : msg
        )
      );
    }, 600);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMsgId
            ? { ...msg, status: 'Executing Engineering Calculation Engine (Port 8083)...' }
            : msg
        )
      );
    }, 1200);

    setTimeout(() => {
      const artifact1 = {
        id: `art-${Date.now()}-1`,
        type: 'telemetry_trend',
        title: 'Intake Pressure (PIP) vs Motor Temp 24h Trend',
        assetId: selectedAsset,
        metrics: [
          { label: 'PIP (PSI)', value: '1,420.5', change: '-14%', status: 'warning' },
          { label: 'Motor Temp (°C)', value: '98.4', change: '+8%', status: 'fault' },
          { label: 'TDH (ft)', value: '4,850', change: 'Optimal', status: 'healthy' }
        ],
        bars: [1680, 1650, 1600, 1540, 1490, 1450, 1420]
      };

      const artifact2 = {
        id: `art-${Date.now()}-2`,
        type: 'pump_curve',
        title: 'Baker Hughes D1450 OEM Pump Curve & BEP Operating Envelope',
        assetId: selectedAsset,
        bepStatus: '78.2% BEP (Gas Interference Zone)',
        operatingPoint: 'Flow: 1,250 BPD | Head: 4,850 ft | Frequency: 58.5 Hz'
      };

      setCanvasArtifacts((prev) => [artifact1, artifact2, ...prev]);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMsgId
            ? {
                ...msg,
                status: null,
                text: `### ⚡ Diagnostic Summary for **${selectedAsset}**\n\n- **Intake Pressure (PIP)**: \`1,420.5 PSI\` (▼ 14% past 2h)\n- **Motor Temperature**: \`98.4 °C\` (▲ High Thermal Load)\n- **BEP Operating Point**: \`78.2%\` (Gas Interference Zone)\n\nI have generated and pinned **2 Visual Artifacts** to your Engineering Canvas on the left:\n1. 📊 *24h Telemetry Trend Plot*\n2. 📈 *OEM Pump Curve & BEP Envelope*`,
                actionCard: {
                  title: 'Increase VSD frequency by 2.5 Hz to clear fluid drawdown and stabilize intake pressure.',
                  urgency: 'HIGH',
                  confidence: 0.94
                }
              }
            : msg
        )
      );
      setIsLoading(false);
    }, 2200);
  };

  const removeArtifact = (id) => {
    setCanvasArtifacts((prev) => prev.filter((art) => art.id !== id));
  };

  const clearCanvas = () => {
    setCanvasArtifacts([]);
  };

  return (
    <div style={{ zIndex: 9999, position: 'relative' }}>
      {/* ─── Floating Launcher Button (Light SCADA Theme) ─── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            height: '54px',
            padding: '0 20px',
            borderRadius: '27px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
            border: '1.5px solid #0284c7',
            boxShadow: '0 10px 30px rgba(2, 132, 199, 0.25), 0 4px 12px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 14px 36px rgba(2, 132, 199, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1.0)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(2, 132, 199, 0.25)';
          }}
          title="Open ESP Agentic Canvas Workspace"
        >
          <div style={{
            position: 'relative',
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={20} color="#ffffff" strokeWidth={2.2} />
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              border: '2px solid #ffffff'
            }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', letterSpacing: '0.02em', lineHeight: '1.2' }}>
              Agent Jane
            </span>
            <span style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: '600', fontFamily: 'Inter, sans-serif' }}>
              APM Co-Pilot Active
            </span>
          </div>
        </button>
      )}

      {/* ─── Compact Floating Box (Default Mode) ─── */}
      {isOpen && !isExpanded && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '460px',
            height: '620px',
            maxHeight: '88vh',
            maxWidth: '94vw',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.18), 0 4px 16px rgba(2, 132, 199, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 9999
          }}
        >
          {/* Light Theme Header */}
          <div style={{
            padding: '12px 18px',
            background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none',
            shrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                position: 'relative',
                padding: '6px',
                background: '#e0f2fe',
                borderRadius: '10px',
                border: '1px solid #bae6fd'
              }}>
                <Bot size={20} color="#0284c7" />
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981'
                }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a' }}>
                    Agent Jane
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: '#e0f2fe',
                    color: '#0369a1',
                    fontWeight: '700',
                    border: '1px solid #bae6fd'
                  }}>
                    APM Co-Pilot
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '1px' }}>
                  Asset: <strong>{selectedAsset}</strong> // Autonomous Agent
                </div>
              </div>
            </div>

            {/* Header Actions (Expand to Full Desktop Workspace) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setIsExpanded(true)}
                title="Expand to Full Infinite Canvas Workspace"
                style={{
                  padding: '6px 10px',
                  background: '#e0f2fe',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  color: '#0284c7',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Maximize2 size={14} />
                <span>Expand Canvas</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Agent Dialog"
                style={{
                  padding: '6px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            backgroundColor: '#f8fafc'
          }}>
            {messages.length === 0 && (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '24px 16px',
                gap: '12px'
              }}>
                <div style={{
                  padding: '14px',
                  background: '#e0f2fe',
                  borderRadius: '16px',
                  border: '1px solid #bae6fd'
                }}>
                  <Sparkles size={28} color="#0284c7" />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Agentic Engineering Advisory
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '320px', lineHeight: '1.5', marginTop: '4px' }}>
                    Ask about intake drawdown, gas interference, or BEP pump curve deviation. Click <strong>Expand Canvas</strong> for full visual storytelling!
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '320px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleSendMessage('Analyze motor temperature spikes and intake drawdown.')}
                    style={{
                      padding: '10px 14px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      color: '#0f172a',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                  >
                    <span>Diagnose drawdown & motor temp</span>
                    <Zap size={14} color="#0284c7" />
                  </button>
                  <button
                    onClick={() => handleSendMessage('Check intake gas interference & BEP pump curve deviation.')}
                    style={{
                      padding: '10px 14px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      color: '#0f172a',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                  >
                    <span>Check gas interference & BEP curve</span>
                    <Zap size={14} color="#0284c7" />
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                {msg.sender === 'user' ? (
                  <div style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    borderRadius: '14px 14px 2px 14px',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    lineHeight: '1.4',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.2)'
                  }}>
                    {msg.text}
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.7)', textAlign: 'right', marginTop: '4px' }}>
                      {msg.timestamp}
                    </div>
                  </div>
                ) : (
                  <div style={{ width: '100%', display: 'flex', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '0.8rem',
                      color: '#ffffff',
                      shrink: 0
                    }}>
                      J
                    </div>
                    <div style={{
                      flex: 1,
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '2px 14px 14px 14px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}>
                      {msg.status && (
                        <div style={{
                          padding: '8px 12px',
                          background: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.75rem',
                          color: '#0369a1'
                        }}>
                          <Activity size={14} className="live-pulse" />
                          <span>{msg.status}</span>
                        </div>
                      )}

                      {msg.text && (
                        <div style={{ fontSize: '0.8rem', color: '#0f172a', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                          {msg.text}
                        </div>
                      )}

                      {msg.actionCard && (
                        <div style={{
                          padding: '12px',
                          background: '#fffbe6',
                          border: '1px solid #ffe58f',
                          borderRadius: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#d46b08' }}>
                              RECOMMENDED OPERATOR ACTION
                            </span>
                            <span style={{ fontSize: '0.65rem', background: '#ffe58f', color: '#873800', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                              HIGH PRIORITY (94%)
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#262626', fontWeight: '600' }}>
                            {msg.actionCard.title}
                          </div>
                        </div>
                      )}

                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'right' }}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Light Theme Input Composer */}
          <div style={{
            padding: '12px 14px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder="Ask Agent Jane (e.g. Diagnose drawdown for FS-031)..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                color: '#0f172a',
                fontSize: '0.78rem',
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputQuery.trim()}
              style={{
                padding: '10px 14px',
                background: inputQuery.trim() ? '#0284c7' : '#cbd5e1',
                border: 'none',
                borderRadius: '10px',
                color: '#ffffff',
                fontWeight: '700',
                cursor: inputQuery.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem'
              }}
            >
              <span>Send</span>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ─── FULL DESKTOP EXPANDED WORKSPACE (Canvas Left + Narrow Agent Panel Right) ─── */}
      {isOpen && isExpanded && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#f1f5f9',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Top Global Bar of Desktop Workspace */}
          <div style={{
            height: '54px',
            padding: '0 20px',
            background: '#ffffff',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            shrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: '#e0f2fe',
                borderRadius: '8px',
                border: '1px solid #bae6fd'
              }}>
                <Bot size={20} color="#0284c7" />
                <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', letterSpacing: '0.02em' }}>
                  ESP AGENTIC WORKSPACE // CANVAS MODE
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                Asset Target: <strong style={{ color: '#0f172a' }}>{selectedAsset}</strong>
              </span>
            </div>

            {/* Workspace Control Tools */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={clearCanvas}
                style={{
                  padding: '6px 12px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={14} />
                <span>Clear Canvas</span>
              </button>

              <button
                onClick={() => setIsExpanded(false)}
                style={{
                  padding: '6px 14px',
                  background: '#0284c7',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Minimize2 size={14} />
                <span>Collapse to Dock</span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '6px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Main Desktop Split Surface */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* ─── LEFT SIDE (75% Width): Large Infinite Engineering Canvas ─── */}
            <div style={{
              flex: 1,
              backgroundColor: '#f8fafc',
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="#0284c7" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Visual Engineering Canvas ({canvasArtifacts.length} Dynamic Artifacts)
                  </h3>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '500' }}>
                  Agent dynamically places charts, telemetry trends & pump curves here alongside narrative explanations
                </span>
              </div>

              {canvasArtifacts.length === 0 && (
                <div style={{
                  flex: 1,
                  minHeight: '450px',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '40px',
                  backgroundColor: 'rgba(255, 255, 255, 0.6)'
                }}>
                  <div style={{ padding: '16px', background: '#e0f2fe', borderRadius: '20px', marginBottom: '14px' }}>
                    <Sparkles size={36} color="#0284c7" />
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                    Infinite Engineering Canvas is Blank
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '420px', lineHeight: '1.6' }}>
                    Type a diagnostic query in the right Agent panel. Agent Jane will dynamically place interactive telemetry plots, BEP curves, and diagnostic cards onto this canvas surface!
                  </p>
                </div>
              )}

              {/* Grid of Dynamic Visual Artifacts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
                {canvasArtifacts.map((art) => (
                  <div
                    key={art.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '14px',
                      padding: '18px',
                      boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {art.type === 'telemetry_trend' ? <LineChart size={18} color="#0284c7" /> : <BarChart3 size={18} color="#0284c7" />}
                        <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>
                          {art.title}
                        </h4>
                      </div>
                      <button
                        onClick={() => removeArtifact(art.id)}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                        title="Remove Artifact"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {art.type === 'telemetry_trend' && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                          {art.metrics.map((m, i) => (
                            <div key={i} style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600' }}>{m.label}</div>
                              <div style={{ fontSize: '1rem', fontWeight: '800', color: m.status === 'fault' ? '#ef4444' : m.status === 'warning' ? '#f59e0b' : '#0f172a', marginTop: '2px' }}>
                                {m.value}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: m.status === 'fault' ? '#ef4444' : '#0284c7', fontWeight: '700' }}>
                                {m.change}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', gap: '12px', paddingT: '10px', background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                          {art.bars.map((val, idx) => (
                            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                              <div style={{
                                width: '100%',
                                height: `${(val / 1800) * 100}%`,
                                background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                                borderRadius: '4px 4px 0 0'
                              }} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {art.type === 'pump_curve' && (
                      <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: '800', background: '#e0f2fe', padding: '6px 10px', borderRadius: '6px', alignSelf: 'flex-start' }}>
                          STATUS: {art.bepStatus}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: '600' }}>
                          {art.operatingPoint}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: '1.4' }}>
                          Operating point lies left of Recommended Operating Range (ROR). Gas lock probability elevated by 24%.
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ─── RIGHT SIDE (25% Width / 400px): Narrow Vertical Agent Panel ─── */}
            <div style={{
              width: '400px',
              backgroundColor: '#ffffff',
              borderLeft: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Right Panel Header */}
              <div style={{
                padding: '14px 16px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Bot size={20} color="#0284c7" />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>
                    Agent Jane Chat Stream
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    LangGraph Autonomous Advisory Thread
                  </div>
                </div>
              </div>

              {/* Chat Thread */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: '#ffffff'
              }}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    {msg.sender === 'user' ? (
                      <div style={{
                        maxWidth: '90%',
                        padding: '10px 14px',
                        background: '#0284c7',
                        borderRadius: '14px 14px 2px 14px',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        lineHeight: '1.4'
                      }}>
                        {msg.text}
                      </div>
                    ) : (
                      <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '0.75rem',
                          color: '#ffffff',
                          shrink: 0
                        }}>
                          J
                        </div>
                        <div style={{
                          flex: 1,
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '2px 12px 12px 12px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          {msg.status && (
                            <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Activity size={12} className="live-pulse" />
                              <span>{msg.status}</span>
                            </div>
                          )}

                          {msg.text && (
                            <div style={{ fontSize: '0.78rem', color: '#0f172a', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                              {msg.text}
                            </div>
                          )}

                          {msg.actionCard && (
                            <div style={{ padding: '10px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '8px', fontSize: '0.75rem', color: '#873800', fontWeight: '600' }}>
                              ⚡ {msg.actionCard.title}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Composer */}
              <div style={{
                padding: '12px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '8px'
              }}>
                <input
                  type="text"
                  placeholder="Ask Agent Jane..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '0.75rem',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputQuery.trim()}
                  style={{
                    padding: '8px 12px',
                    background: inputQuery.trim() ? '#0284c7' : '#cbd5e1',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: inputQuery.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '0.75rem'
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
