import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { agentApi } from '../services/agentApi';
import { normalizeAgentEvent } from '../services/agentResponseNormalizer';
import { AgentMarkdownRenderer } from './AgentMarkdownRenderer';
import { GenerativeChartBlock } from './GenerativeChartBlock';
import { AgentResponseDeck } from './AgentResponseDeck';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Maximize2,
  Minimize2,
  X,
  Activity,
  Send,
  Trash2,
  ArrowLeftRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Pin
} from 'lucide-react';

export const AgentFloatingDock = () => {
  const { selectedAsset } = useTelemetry();
  const [pinnedAsset, setPinnedAsset] = useState(null);
  const [lastUserQuery, setLastUserQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [panelWidth, setPanelWidth] = useState(480);
  const [isResizing, setIsResizing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [canvasArtifacts, setCanvasArtifacts] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(true);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Pre-warm LLM models immediately when Frontend renders to eliminate cold-start latency
  useEffect(() => {
    agentApi.warmup();
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Check backend status on opening
      agentApi.checkHealth().then(online => setIsBackendOnline(online));
    }
  }, [messages, isOpen]);

  // Horizontal Drag-to-Resize Handler
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

  // Real Streaming Agent Message Handler (Plan.md Phase F1.1 & F1.2)
  const handleSendMessage = (queryText) => {
    const text = queryText || inputQuery;
    if (!text.trim() || isLoading) return;

    setLastUserQuery(text);

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
        blocks: [],
        status: 'Initiating Supervisor Agent...',
        timestamp
      }
    ];

    setMessages(newMessages);
    setInputQuery('');
    setIsLoading(true);

    let accumulatedText = '';
    let currentBlocks = [];

    // F1.1: Only send pinned asset if explicitly pinned by operator; otherwise null
    const targetAsset = pinnedAsset || null;

    agentApi.streamAgentRun(
      { user_query: text, asset_id: targetAsset },
      (evt) => {
        if (evt.type === 'text_delta') {
          accumulatedText += evt.delta || '';
        }

        currentBlocks = normalizeAgentEvent(evt, currentBlocks);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === agentMsgId
              ? {
                  ...msg,
                  blocks: currentBlocks,
                  text: accumulatedText || (currentBlocks.find((b) => b.kind === 'text')?.content || ''),
                  status:
                    evt.type === 'status'
                      ? evt.message
                      : evt.type === 'done' || evt.type === 'advisory'
                      ? null
                      : msg.status
                }
              : msg
          )
        );

        if (evt.type === 'generative_ui') {
          setCanvasArtifacts((prev) => [
            {
              id: evt.chart_id || `art-${Date.now()}`,
              type: 'plotly_chart',
              title: evt.title,
              data: evt.data,
              layout: evt.layout
            },
            ...prev
          ]);
        } else if (evt.type === 'done') {
          setIsLoading(false);
        }
      }
    ).catch((err) => {
      console.warn('[AgentFloatingDock] Error streaming agent run:', err);
      const errorEvent = {
        type: 'error',
        message: err.message || 'Unable to connect to Agent Jane gateway on port :8090.',
        errorType: 'transport',
        canRetry: true
      };
      currentBlocks = normalizeAgentEvent(errorEvent, currentBlocks);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMsgId
            ? {
                ...msg,
                status: null,
                blocks: currentBlocks,
                text: '⚠️ Communication Error'
              }
            : msg
        )
      );
      setIsLoading(false);
    });
  };

  const handleSelectSuggestion = (assetId) => {
    handleSendMessage(assetId);
  };

  const handleExportLog = () => {
    if (messages.length === 0) return;
    const exportData = {
      exportTime: new Date().toISOString(),
      assetId: selectedAsset || 'FS-010',
      messages,
      canvasArtifacts
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent_jane_session_${selectedAsset || 'log'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearChat = () => {
    setMessages([]);
    setCanvasArtifacts([]);
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
            e.currentTarget.style.filter = 'drop-shadow(0 12px 24px rgba(0, 229, 255, 0.3))';
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
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-card)',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div style={{
              position: 'relative',
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={20} color="#ffffff" />
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-emerald)',
                border: '2px solid var(--bg-card)'
              }} />
            </div>
            <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Agent Jane
            </span>
          </div>
        </button>
      )}

      {/* ─── Compact Floating Window (Default Mode) ─── */}
      <AnimatePresence>
        {isOpen && !isExpanded && (
          <motion.div
            key="compact-dock"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: '460px',
              height: '620px',
              maxHeight: '88vh',
              maxWidth: '94vw',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 9999
            }}
          >
          {/* Minimal Header */}
          <div style={{
            padding: '12px 16px',
            background: 'var(--bg-card-header)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                position: 'relative',
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={18} color="var(--accent-cyan)" />
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isBackendOnline ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                  border: '2px solid var(--bg-card)'
                }} />
              </div>
              <span style={{
                fontSize: '0.92rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)'
              }}>
                Agent Jane
              </span>

              {/* F3.T2: Context Chip */}
              {selectedAsset && (
                <button
                  type="button"
                  onClick={() => setPinnedAsset(pinnedAsset ? null : selectedAsset)}
                  title={pinnedAsset ? "Context pinned: Click to clear" : `Click to pin ${selectedAsset} context to chat`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.66rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: '600',
                    backgroundColor: pinnedAsset ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-secondary)',
                    border: pinnedAsset ? '1px solid var(--accent-blue, #0284c7)' : '1px dashed var(--border-color)',
                    color: pinnedAsset ? 'var(--accent-blue, #0284c7)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Pin size={10} style={{ transform: pinnedAsset ? 'rotate(45deg)' : 'none' }} />
                  <span>{pinnedAsset ? `Pinned: ${pinnedAsset}` : `Context: ${selectedAsset}`}</span>
                  {pinnedAsset && <X size={9} />}
                </button>
              )}
            </div>

            {/* Minimal Header Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {messages.length > 0 && (
                <>
                  <button
                    onClick={handleExportLog}
                    title="Export Session Log (JSON)"
                    className="scada-btn"
                    style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                  >
                    <Download size={13} />
                  </button>
                  <button
                    onClick={handleClearChat}
                    title="Clear Chat"
                    className="scada-btn"
                    style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsExpanded(true)}
                title="Expand Workspace"
                className="scada-btn"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                <Maximize2 size={13} />
                <span>Expand</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Agent"
                className="scada-btn"
                style={{ padding: '4px 8px' }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Minimal Chat Stream */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: 'var(--bg-primary)'
          }}>
            {messages.length === 0 && (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '20px 16px'
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px'
                }}>
                  <Sparkles size={22} color="var(--accent-cyan)" />
                </div>
                <h4 style={{
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  marginBottom: '6px'
                }}>
                  Autonomous APM Advisory
                </h4>
                <p style={{
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)',
                  maxWidth: '320px',
                  lineHeight: '1.4',
                  marginBottom: '16px'
                }}>
                  Ask Agent Jane about live telemetry, intake drawdown, gas interference, or pump performance.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '340px' }}>
                  <button
                    onClick={() => handleSendMessage(`Diagnose current operational telemetry for ${selectedAsset || 'active well'}`)}
                    className="scada-btn"
                    style={{
                      width: '100%',
                      justifyContent: 'space-between',
                      fontSize: '0.76rem',
                      padding: '8px 12px'
                    }}
                  >
                    <span>Diagnose active well telemetry</span>
                    <Sparkles size={13} color="var(--accent-cyan)" />
                  </button>
                  <button
                    onClick={() => handleSendMessage('Check gas interference & drawdown risk')}
                    className="scada-btn"
                    style={{
                      width: '100%',
                      justifyContent: 'space-between',
                      fontSize: '0.76rem',
                      padding: '8px 12px'
                    }}
                  >
                    <span>Check gas interference & drawdown</span>
                    <Activity size={13} color="var(--accent-blue)" />
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {msg.sender === 'user' ? (
                  <div style={{
                    alignSelf: 'flex-end',
                    maxWidth: '85%',
                    background: 'var(--accent-blue)',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '12px 12px 2px 12px',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-sans)',
                    lineHeight: '1.4'
                  }}>
                    {msg.text}
                  </div>
                ) : (
                  <div style={{
                    alignSelf: 'flex-start',
                    width: '100%',
                    maxWidth: '98%',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    padding: '8px 10px',
                    borderRadius: '2px 12px 12px 12px',
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                    lineHeight: '1.5'
                  }}>
                    {msg.status && (
                      <div style={{
                        fontSize: '0.72rem',
                        color: 'var(--accent-cyan)',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '6px',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        <Activity size={12} className="live-pulse" />
                        <span>{msg.status}</span>
                      </div>
                    )}
                    {(!msg.text && (!msg.blocks || msg.blocks.length === 0)) ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 4px'
                      }}>
                        <RefreshCw size={14} className="live-pulse" color="var(--primary)" />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {msg.status || 'Processing...'}
                        </span>
                      </div>
                    ) : (
                      <AgentResponseDeck
                        message={msg}
                        onSelectSuggestion={handleSelectSuggestion}
                        onRetry={() => handleSendMessage(lastUserQuery)}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Minimal Input Bar */}
          <div style={{
            padding: '10px 12px',
            background: 'var(--bg-card-header)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              placeholder={`Ask Agent Jane about ${selectedAsset || 'well telemetry'}...`}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="scada-input"
              style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputQuery.trim()}
              className="scada-btn scada-btn-primary"
              style={{
                opacity: inputQuery.trim() ? 1 : 0.5,
                cursor: inputQuery.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ─── EXPANDED RESIZABLE SLIDER VIEW ─── */}
      <AnimatePresence>
        {isOpen && isExpanded && (
          <motion.div
            key="expanded-dock"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: `${panelWidth}px`,
              backgroundColor: 'var(--bg-card)',
              borderLeft: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-card)',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
          {/* Drag Resize Handle */}
          <div
            onMouseDown={startResizing}
            title="Drag to resize panel"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '6px',
              cursor: 'col-resize',
              backgroundColor: isResizing ? 'var(--accent-cyan)' : 'transparent',
              zIndex: 100000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{
              width: '18px',
              height: '36px',
              borderRadius: '6px',
              background: 'var(--bg-card-header)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}>
              <ArrowLeftRight size={11} />
            </div>
          </div>

          {/* Expanded Minimal Header */}
          <div style={{
            padding: '12px 16px',
            background: 'var(--bg-card-header)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bot size={18} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Agent Jane Workspace
              </span>

              {/* F3.T2: Context Chip */}
              {selectedAsset && (
                <button
                  type="button"
                  onClick={() => setPinnedAsset(pinnedAsset ? null : selectedAsset)}
                  title={pinnedAsset ? "Context pinned: Click to clear" : `Click to pin ${selectedAsset} context to chat`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.66rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: '600',
                    backgroundColor: pinnedAsset ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-secondary)',
                    border: pinnedAsset ? '1px solid var(--accent-blue, #0284c7)' : '1px dashed var(--border-color)',
                    color: pinnedAsset ? 'var(--accent-blue, #0284c7)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Pin size={10} style={{ transform: pinnedAsset ? 'rotate(45deg)' : 'none' }} />
                  <span>{pinnedAsset ? `Pinned: ${pinnedAsset}` : `Context: ${selectedAsset}`}</span>
                  {pinnedAsset && <X size={9} />}
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {messages.length > 0 && (
                <>
                  <button
                    onClick={handleExportLog}
                    title="Export Session Log (JSON)"
                    className="scada-btn"
                    style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                  >
                    <Download size={13} />
                  </button>
                  <button
                    onClick={handleClearChat}
                    title="Clear Chat"
                    className="scada-btn"
                    style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsExpanded(false)}
                title="Collapse to Window"
                className="scada-btn"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                <Minimize2 size={13} />
                <span>Collapse</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="scada-btn"
                style={{ padding: '4px 8px' }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Expanded Content Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: 'var(--bg-primary)'
          }}>
            {messages.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '30px 16px',
                color: 'var(--text-muted)',
                fontSize: '0.8rem'
              }}>
                <Sparkles size={24} color="var(--accent-cyan)" style={{ marginBottom: '8px' }} />
                <div>Agent Jane Expanded Engineering Workspace</div>
                <div style={{ fontSize: '0.74rem', marginTop: '4px' }}>
                  Ask questions to render interactive charts and diagnostic telemetry.
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {msg.sender === 'user' ? (
                  <div style={{
                    alignSelf: 'flex-end',
                    maxWidth: '85%',
                    background: 'var(--accent-blue)',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '12px 12px 2px 12px',
                    fontSize: '0.8rem'
                  }}>
                    {msg.text}
                  </div>
                ) : (
                  <div style={{
                    alignSelf: 'flex-start',
                    maxWidth: '94%',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    padding: '14px 16px',
                    borderRadius: '2px 12px 12px 12px',
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)',
                    lineHeight: '1.5'
                  }}>
                    {/* Status indicator */}
                    {msg.status && (
                      <div style={{
                        fontSize: '0.72rem',
                        color: 'var(--accent-cyan)',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '8px',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        <Activity size={12} className="live-pulse" />
                        <span>{msg.status}</span>
                      </div>
                    )}

                    {(!msg.text && (!msg.blocks || msg.blocks.length === 0)) ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0' }}>
                        <RefreshCw size={14} className="live-pulse" color="var(--primary)" />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {msg.status || 'Processing...'}
                        </span>
                      </div>
                    ) : (
                      <AgentResponseDeck
                        message={msg}
                        onSelectSuggestion={handleSelectSuggestion}
                        onRetry={() => handleSendMessage(lastUserQuery)}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div style={{
            padding: '10px 12px',
            background: 'var(--bg-card-header)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              placeholder="Ask Agent Jane..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="scada-input"
              style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputQuery.trim()}
              className="scada-btn scada-btn-primary"
            >
              <Send size={14} />
            </button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};
