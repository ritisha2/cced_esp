import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  Sparkles,
  Maximize2,
  Minimize2,
  X,
  Zap,
  Activity,
  ShieldAlert,
  Send,
  Trash2,
  LineChart,
  BarChart3,
  ArrowLeftRight,
  ChevronRight,
  TrendingUp,
  Cpu
} from 'lucide-react';

export const AgentFloatingDock = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [panelWidth, setPanelWidth] = useState(480); // Default expanded width in px
  const [isResizing, setIsResizing] = useState(false);
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

  // ─── Horizontal Drag-to-Resize Handler ───
  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e) => {
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX;
        const minW = 320;
        const maxW = Math.floor(window.innerWidth * 0.75);
        if (newWidth >= minW && newWidth <= maxW) {
          setPanelWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // Agent streaming response handler
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
            ? { ...msg, status: 'Executing Engineering Calc Engine (Port 8083)...' }
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

      setCanvasArtifacts((prev) => [artifact1, ...prev]);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMsgId
            ? {
                ...msg,
                status: null,
                text: `### ⚡ Diagnostic Summary for **${selectedAsset}**\n\n- **Intake Pressure (PIP)**: \`1,420.5 PSI\` (▼ 14% past 2h)\n- **Motor Temperature**: \`98.4 °C\` (▲ High Thermal Load)\n- **BEP Operating Point**: \`78.2%\` (Gas Interference Zone)\n\n#### 🔬 Engineering Analysis\nDeterministic calculations indicate a **Total Dynamic Head (TDH)** of **4,850 ft** with an estimated intake gas fraction of **18.4%**. The motor load is operating at **112% of nameplate rating**.`,
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

  return (
    <div style={{ zIndex: 9999, position: 'relative' }}>
      {/* ─── Floating Launcher Notch Button (Using /Agent_launcer.png) ─── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            outline: 'none',
            zIndex: 9999,
            transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.25s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
            e.currentTarget.style.filter = 'drop-shadow(0 12px 24px rgba(2, 132, 199, 0.4))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1.0)';
            e.currentTarget.style.filter = 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.25))';
          }}
          title="Open Agent Jane APM Copilot"
        >
          <img
            src="/Agent_launcer.png"
            alt="Agent Jane APM Copilot"
            style={{
              height: '52px',
              width: 'auto',
              display: 'block',
              borderRadius: '26px'
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextSibling) {
                e.currentTarget.nextSibling.style.display = 'flex';
              }
            }}
          />
          <div
            style={{
              display: 'none',
              height: '52px',
              padding: '0 18px',
              borderRadius: '26px',
              background: '#ffffff',
              border: '1.5px solid #0284c7',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div style={{
              position: 'relative',
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={20} color="#ffffff" />
              <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid #ffffff' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>Agent Jane</span>
              <span style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: '700' }}>APM Copilot</span>
            </div>
          </div>
        </button>
      )}

      {/* ─── Compact Floating Window (Default Mode) ─── */}
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
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
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
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)'
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
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.01em' }}>
                    Agent Jane
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: '#f0f9ff',
                    color: '#0284c7',
                    fontWeight: '700',
                    border: '1px solid #bae6fd'
                  }}>
                    APM Copilot
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '1px' }}>
                  Asset: <strong style={{ color: '#0f172a' }}>{selectedAsset}</strong> // Autonomous Agent
                </div>
              </div>
            </div>

            {/* Expand & Close Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setIsExpanded(true)}
                title="Expand to Side-by-Side Resizable Workspace"
                style={{
                  padding: '6px 12px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  color: '#0284c7',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Maximize2 size={13} />
                <span>Expand</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Agent Dialog"
                style={{
                  padding: '6px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Stream */}
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
                  background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                  borderRadius: '16px',
                  border: '1px solid #93c5fd'
                }}>
                  <Sparkles size={28} color="#0284c7" />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    Autonomous APM Advisory Ready
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '320px', lineHeight: '1.5', marginTop: '4px' }}>
                    Ask Agent Jane about intake drawdown, gas interference, or motor temperature. Click <strong>Expand</strong> for resizable split view!
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '340px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleSendMessage('Analyze motor temperature spikes and intake drawdown.')}
                    style={{
                      padding: '11px 14px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      color: '#0f172a',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>Diagnose drawdown & motor temp</span>
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
                    fontWeight: '500'
                  }}>
                    {msg.text}
                  </div>
                ) : (
                  <div style={{ width: '100%', display: 'flex', gap: '10px' }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      background: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '0.78rem',
                      color: '#ffffff',
                      shrink: 0
                    }}>
                      J
                    </div>
                    <div style={{
                      flex: 1,
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '2px 12px 12px 12px',
                      padding: '12px',
                      fontSize: '0.8rem',
                      color: '#0f172a',
                      whiteSpace: 'pre-wrap',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}>
                      {msg.status && (
                        <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Activity size={12} className="live-pulse" />
                          <span>{msg.status}</span>
                        </div>
                      )}
                      {msg.text}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Composer */}
          <div style={{
            padding: '12px 14px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              placeholder="Agent box query (e.g. Diagnose drawdown for FS-031)..."
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
                padding: '10px 16px',
                background: inputQuery.trim() ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' : '#e2e8f0',
                border: 'none',
                borderRadius: '10px',
                color: inputQuery.trim() ? '#ffffff' : '#94a3b8',
                fontWeight: '700',
                cursor: inputQuery.trim() ? 'pointer' : 'not-allowed',
                fontSize: '0.78rem',
                boxShadow: inputQuery.trim() ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none'
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* ─── EXPANDED SIDE-BY-SIDE RESIZABLE SLIDER WORKSPACE (Ultra-Sleek Modern Light Theme) ─── */}
      {isOpen && isExpanded && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: `${panelWidth}px`,
            backgroundColor: '#ffffff',
            borderLeft: '1px solid #e2e8f0',
            boxShadow: '-12px 0 40px rgba(15, 23, 42, 0.12), -2px 0 10px rgba(2, 132, 199, 0.05)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: isResizing ? 'none' : 'width 0.15s ease-out'
          }}
        >
          {/* ─── SLEEK HORIZONTAL RESIZE BOUNDARY HANDLE (<->) ─── */}
          <div
            onMouseDown={startResizing}
            title="Drag left/right to resize Agent side panel"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '6px',
              cursor: 'col-resize',
              backgroundColor: isResizing ? '#0284c7' : 'transparent',
              zIndex: 100000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isResizing) e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.4)';
            }}
            onMouseLeave={(e) => {
              if (!isResizing) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* Visual Drag Pill Grip */}
            <div style={{
              width: '20px',
              height: '44px',
              borderRadius: '10px',
              background: '#ffffff',
              border: '1.5px solid #0284c7',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
              transition: 'transform 0.15s ease'
            }}>
              <ArrowLeftRight size={12} strokeWidth={2.5} />
            </div>
          </div>

          {/* Sleek Modern Light Header */}
          <div style={{
            padding: '14px 20px',
            paddingLeft: '22px',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none',
            shrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                position: 'relative',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(2, 132, 199, 0.3)'
              }}>
                <Bot size={22} color="#ffffff" strokeWidth={2.2} />
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
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.01em' }}>
                    Agent Jane
                  </h3>
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: '#f0f9ff',
                    color: '#0284c7',
                    fontWeight: '700',
                    border: '1px solid #bae6fd'
                  }}>
                    APM Copilot
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '1px' }}>
                  Resizable Split View <span style={{ color: '#0284c7', fontWeight: '600' }}>({panelWidth}px)</span> · Target: <strong style={{ color: '#0f172a' }}>{selectedAsset}</strong>
                </div>
              </div>
            </div>

            {/* Collapse & Close Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setIsExpanded(false)}
                title="Collapse to Floating Window"
                style={{
                  padding: '6px 12px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#475569',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0284c7'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                <Minimize2 size={13} />
                <span>Collapse</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Agent"
                style={{
                  padding: '6px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Conversation Stream */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            paddingLeft: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            backgroundColor: '#f8fafc',
            backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(2, 132, 199, 0.03), transparent 70%)'
          }}>
            {messages.length === 0 && (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '24px',
                gap: '14px'
              }}>
                <div style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 20px rgba(2, 132, 199, 0.15)'
                }}>
                  <Sparkles size={32} color="#0284c7" />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em' }}>
                    Agent Jane Advisory Ready
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '340px', lineHeight: '1.5', marginTop: '4px' }}>
                    Your ESP-APM Dashboard remains active on the left. Drag the divider handle to resize the Agent side panel!
                  </p>
                </div>

                {/* Modern Prompt Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '360px', marginTop: '8px' }}>
                  <button
                    onClick={() => handleSendMessage('Analyze motor temperature spikes and intake drawdown.')}
                    style={{
                      padding: '12px 16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      color: '#0f172a',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0284c7';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={14} color="#0284c7" />
                      </div>
                      <span>Diagnose drawdown & motor temp</span>
                    </div>
                    <ChevronRight size={14} color="#94a3b8" />
                  </button>

                  <button
                    onClick={() => handleSendMessage('Check intake gas interference & BEP pump curve deviation.')}
                    style={{
                      padding: '12px 16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      color: '#0f172a',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0284c7';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={14} color="#0284c7" />
                      </div>
                      <span>Check gas interference & BEP curve</span>
                    </div>
                    <ChevronRight size={14} color="#94a3b8" />
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
                    maxWidth: '88%',
                    padding: '11px 16px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    borderRadius: '16px 16px 2px 16px',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    boxShadow: '0 3px 10px rgba(2, 132, 199, 0.2)'
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
                      background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '0.8rem',
                      color: '#ffffff',
                      shrink: 0,
                      boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
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
                          padding: '14px',
                          background: '#fffbe6',
                          border: '1px solid #ffe58f',
                          borderRadius: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <ShieldAlert size={16} color="#d46b08" />
                              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#d46b08', letterSpacing: '0.02em' }}>
                                RECOMMENDED OPERATOR ACTION
                              </span>
                            </div>
                            <span style={{ fontSize: '0.65rem', background: '#ffe58f', color: '#873800', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                              HIGH PRIORITY (94%)
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#262626', fontWeight: '600', marginTop: '2px' }}>
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

          {/* ─── SLEEK BOTTOM INPUT COMPOSER ("Agent box query") ─── */}
          <div style={{
            padding: '16px 20px',
            paddingLeft: '24px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            shrink: 0
          }}>
            <input
              type="text"
              placeholder="Agent box query (e.g. Diagnose drawdown for FS-031)..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              style={{
                flex: 1,
                padding: '11px 16px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                color: '#0f172a',
                fontSize: '0.8rem',
                outline: 'none',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                transition: 'all 0.15s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#0284c7';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputQuery.trim()}
              style={{
                padding: '11px 20px',
                background: inputQuery.trim() ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' : '#e2e8f0',
                border: 'none',
                borderRadius: '10px',
                color: inputQuery.trim() ? '#ffffff' : '#94a3b8',
                fontWeight: '700',
                cursor: inputQuery.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                boxShadow: inputQuery.trim() ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Send</span>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
