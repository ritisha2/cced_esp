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
  GripVertical,
  ArrowLeftRight
} from 'lucide-react';

export const AgentFloatingDock = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [panelWidth, setPanelWidth] = useState(520); // Default expanded width in px
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
        // Clamp width between 320px and 75% of window width
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
      {/* ─── Floating Launcher Notch Button ─── */}
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
          title="Open ESP Agent Copilot"
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
            <span style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: '600' }}>
              APM Copilot
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
          {/* Header */}
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
                    APM Copilot
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '1px' }}>
                  Asset: <strong>{selectedAsset}</strong> // Autonomous Agent
                </div>
              </div>
            </div>

            {/* Expand & Close Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setIsExpanded(true)}
                title="Expand to Side-by-Side Resizable Workspace"
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
                  gap: '5px'
                }}
              >
                <Maximize2 size={14} />
                <span>Expand</span>
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
                  background: '#e0f2fe',
                  borderRadius: '16px',
                  border: '1px solid #bae6fd'
                }}>
                  <Sparkles size={28} color="#0284c7" />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' }}>
                    Autonomous APM Advisory Ready
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '320px', lineHeight: '1.5', marginTop: '4px' }}>
                    Ask Agent Jane about intake drawdown, gas interference, or motor temperature spikes. Click <strong>Expand</strong> for a resizable split dashboard view!
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
                      justifyContent: 'space-between'
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
                    background: '#0284c7',
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
                      whiteSpace: 'pre-wrap'
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
              placeholder="Ask Agent Jane..."
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
                fontSize: '0.78rem'
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* ─── EXPANDED SIDE-BY-SIDE RESIZABLE SLIDER WORKSPACE ─── */}
      {isOpen && isExpanded && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: `${panelWidth}px`,
            backgroundColor: '#ffffff',
            borderLeft: '1.5px solid #cbd5e1',
            boxShadow: '-16px 0 50px rgba(15, 23, 42, 0.18), -4px 0 16px rgba(2, 132, 199, 0.1)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: isResizing ? 'none' : 'width 0.15s ease-out'
          }}
        >
          {/* ─── HORIZONTAL DRAG-TO-RESIZE BOUNDARY HANDLE (<->) ─── */}
          <div
            onMouseDown={startResizing}
            title="Drag left/right to resize Agent panel"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '8px',
              cursor: 'col-resize',
              backgroundColor: isResizing ? '#0284c7' : 'transparent',
              zIndex: 100000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isResizing) e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.3)';
            }}
            onMouseLeave={(e) => {
              if (!isResizing) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* Visual Drag Handle Icon */}
            <div style={{
              width: '20px',
              height: '36px',
              borderRadius: '10px',
              background: '#ffffff',
              border: '1px solid #0284c7',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7'
            }}>
              <ArrowLeftRight size={12} />
            </div>
          </div>

          {/* Panel Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none',
            shrink: 0,
            paddingLeft: '20px'
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
                    Agent Jane Side Panel
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
                    Resizable Split View
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '1px' }}>
                  Drag left handle to adjust panel width ({panelWidth}px)
                </div>
              </div>
            </div>

            {/* Minimize / Close Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setIsExpanded(false)}
                title="Collapse to Floating Window"
                style={{
                  padding: '6px 10px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#64748b',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Minimize2 size={14} />
                <span>Collapse</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Agent"
                style={{
                  padding: '6px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Conversation Stream */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px',
            paddingLeft: '22px',
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
                padding: '24px',
                gap: '12px'
              }}>
                <div style={{ padding: '16px', background: '#e0f2fe', borderRadius: '18px' }}>
                  <Sparkles size={32} color="#0284c7" />
                </div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a' }}>
                  Side-by-Side Agent Advisory Ready
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '340px', lineHeight: '1.5' }}>
                  Your ESP-APM Dashboard remains fully active on the left. Drag the divider handle to expand or shrink the Agent side panel!
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '340px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleSendMessage('Analyze motor temperature spikes and intake drawdown.')}
                    style={{
                      padding: '10px 14px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      color: '#0f172a',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
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
                    maxWidth: '88%',
                    padding: '10px 14px',
                    background: '#0284c7',
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
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      background: '#0284c7',
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
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
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
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

          {/* ─── Bottom Input Composer ("Agent box query") ─── */}
          <div style={{
            padding: '14px 18px',
            paddingLeft: '22px',
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
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputQuery.trim()}
              style={{
                padding: '11px 18px',
                background: inputQuery.trim() ? '#0284c7' : '#cbd5e1',
                border: 'none',
                borderRadius: '10px',
                color: '#ffffff',
                fontWeight: '700',
                cursor: inputQuery.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem'
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
