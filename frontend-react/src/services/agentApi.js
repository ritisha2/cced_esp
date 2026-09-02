/**
 * ESP Agent API Service Layer
 * Bridge between React Frontend (Agent Floating Dock) and esp_agent Backend (LangGraph Supervisor / BFF)
 * Routes through Vite Proxy (/api/agent -> http://127.0.0.1:8090)
 */

const AGENT_BASE_URL = '/api/agent';

// ── A4.T1: Session identity ───────────────────────────────────────────────
// One UUID per browser tab, persisted in localStorage so it survives a page
// refresh but starts fresh in a new tab (sessionStorage would only survive
// within the same tab without reload). Per Plan.md A4.T1.
function _getOrCreateSessionId() {
  try {
    let sid = localStorage.getItem('esp_apm_session_id');
    if (!sid) {
      sid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('esp_apm_session_id', sid);
    }
    return sid;
  } catch (_) {
    // localStorage unavailable (e.g. private mode with storage blocked)
    return `anon-${Date.now()}`;
  }
}

const SESSION_ID = _getOrCreateSessionId();

export const agentApi = {
  /**
   * Pre-warm LLM Gateway & Supervisor graph on frontend initialization to eliminate cold start.
   */
  async warmup() {
    try {
      fetch(`${AGENT_BASE_URL}/warmup`, { method: 'POST' }).catch(() => {});
    } catch (e) {
      // background fire and forget
    }
  },

  /**
   * Check connection status of esp_agent backend gateway.
   * Returns boolean (true if backend is healthy, false otherwise).
   */
  async checkHealth() {
    try {
      const res = await fetch(`${AGENT_BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return false;
      const data = await res.json();
      return data.status === 'ok' || data.status === 'healthy';
    } catch (e) {
      console.warn('[agentApi] Health check failed:', e.message);
      return false;
    }
  },

  /**
   * Stream real-time agent run results over NDJSON SSE.
   * @param {Object} params - { user_query: string, asset_id: string }
   * @param {Function} onEvent - Callback function receiving typed stream events:
   *   - { type: "status", stage, message }
   *   - { type: "text_delta", delta }
   *   - { type: "advisory", advisory }
   *   - { type: "generative_ui", kind, chart_id, title, data, layout }
   *   - { type: "done", run_id }
   */
  async streamAgentRun({ user_query, asset_id }, onEvent) {
    try {
      // A4.T2: X-Session-ID sent on the stream path
      const response = await fetch(`${AGENT_BASE_URL}/agent/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/x-ndjson',
          'X-Session-ID': SESSION_ID,
        },
        body: JSON.stringify({
          user_query: user_query || 'Diagnose asset operational status',
          asset_id: asset_id || 'FS-010'
        })
      });

      if (!response.ok) {
        throw new Error(`Agent gateway returned status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by browser/gateway');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete trailing fragment in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const event = JSON.parse(trimmed);
            onEvent(event);
          } catch (err) {
            console.warn('[agentApi] Error parsing NDJSON chunk:', trimmed, err);
          }
        }
      }

      // Process any remaining fragment
      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer.trim());
          onEvent(event);
        } catch (e) {
          // ignore trailing partial fragment
        }
      }
    } catch (error) {
      console.error('[agentApi] Stream agent run failed:', error);
      throw error;
    }
  },

  /**
   * Fallback synchronous run request.
   */
  async runAgent({ user_query, asset_id }) {
    // A4.T2: X-Session-ID sent on the run path too
    const response = await fetch(`${AGENT_BASE_URL}/agent/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': SESSION_ID,
      },
      body: JSON.stringify({
        user_query,
        asset_id: asset_id || 'FS-010'
      })
    });
    if (!response.ok) {
      throw new Error(`Agent API request failed with status ${response.status}`);
    }
    return await response.json();
  },

  /**
   * Fetch aggregated asset workspace snapshot.
   */
  async getAssetWorkspace(assetId) {
    const response = await fetch(`${AGENT_BASE_URL}/assets/${assetId}/workspace`);
    if (!response.ok) throw new Error(`Workspace request failed: ${response.status}`);
    return await response.json();
  },

  /**
   * Fetch frozen evidence pack & XAI explanation by run ID.
   */
  async getRunEvidence(runId) {
    const response = await fetch(`${AGENT_BASE_URL}/runs/${runId}/evidence`);
    if (!response.ok) throw new Error(`Evidence request failed: ${response.status}`);
    return await response.json();
  }
};
