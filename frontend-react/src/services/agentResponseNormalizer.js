/**
 * Agent Response Normalizer (Plan.md Phase F1.2)
 * Pure, framework-agnostic normalization layer mapping NDJSON events to canonical UiBlock[] arrays.
 * Keyed strictly on event type and field presence — NEVER inspects raw query text to decide UI layout.
 */

export const BLOCK_KINDS = {
  TEXT: 'text',
  METRICS: 'metrics',
  RECOMMENDATION: 'recommendation',
  ADVISORY_DETAILS: 'advisory_details',
  EVIDENCE: 'evidence',
  VISUALIZATION: 'visualization',
  CLARIFICATION: 'clarification',
  ERROR: 'error',
  TABLE: 'table'
};

const DEFAULT_FLEET_WELLS = ['FSWS-001-A', 'FS-031', 'FS-010'];

/**
 * Normalizes an incoming NDJSON event into an updated list of UiBlocks for the active agent message.
 * @param {Object} evt - Stream event from agentApi.streamAgentRun ({ type, delta, advisory, etc. })
 * @param {Array} currentBlocks - Existing array of UiBlock objects for this turn
 * @returns {Array} Next array of UiBlock objects
 */
export function normalizeAgentEvent(evt, currentBlocks = []) {
  if (!evt || !evt.type) return currentBlocks;

  const blocks = [...currentBlocks];

  const findBlock = (kind) => blocks.find((b) => b.kind === kind);
  const upsertBlock = (kind, data) => {
    const idx = blocks.findIndex((b) => b.kind === kind);
    if (idx >= 0) {
      blocks[idx] = { ...blocks[idx], ...data };
    } else {
      blocks.push({ kind, ...data });
    }
  };

  switch (evt.type) {
    case 'status': {
      // Level B clarification arrives over the stream as a status(stage=CLARIFYING)
      // followed by text_delta chunks of the question — NOT as an advisory event.
      // Seed an (empty) clarification block here so the following deltas are routed
      // into it and rendered as a distinct ClarificationPrompt rather than plain text.
      if (evt.stage === 'CLARIFYING') {
        if (!findBlock(BLOCK_KINDS.CLARIFICATION)) {
          upsertBlock(BLOCK_KINDS.CLARIFICATION, {
            question: '',
            suggestions: DEFAULT_FLEET_WELLS,
            objective_id: 'CLARIFICATION'
          });
        }
      }
      break;
    }

    case 'text_delta': {
      // If we're in clarification mode (a clarification block was seeded by a
      // CLARIFYING status), stream the question into it instead of a text block.
      const clar = findBlock(BLOCK_KINDS.CLARIFICATION);
      if (clar) {
        const nextQuestion = (clar.question || '') + (evt.delta || '');
        upsertBlock(BLOCK_KINDS.CLARIFICATION, { question: nextQuestion });
        break;
      }
      const existing = findBlock(BLOCK_KINDS.TEXT);
      const nextContent = (existing?.content || '') + (evt.delta || '');
      upsertBlock(BLOCK_KINDS.TEXT, { content: nextContent });
      break;
    }

    case 'advisory': {
      const adv = evt.advisory;
      if (!adv) break;

      // Detect Level B Clarification Sentinel
      if (adv.objective_id === 'CLARIFICATION' || adv.status === 'CLARIFYING') {
        const questionText =
          adv.assessment ||
          adv.recommendation ||
          adv.user_query ||
          'Which well or pump would you like to inspect?';

        upsertBlock(BLOCK_KINDS.CLARIFICATION, {
          question: questionText,
          suggestions: DEFAULT_FLEET_WELLS,
          objective_id: 'CLARIFICATION'
        });
        break;
      }

      // 1. Metrics Block (Confidence, Risk Horizon, Objective)
      const confidence = adv.confidence_score ?? adv.confidence ?? 0.85;
      const riskHorizon = adv.risk || adv.risk_horizon || 'Operational';
      upsertBlock(BLOCK_KINDS.METRICS, {
        confidence: typeof confidence === 'number' ? confidence : 0.85,
        riskHorizon: String(riskHorizon),
        objectiveId: adv.objective_id || 'OP03_FAULT_DIAGNOSIS',
        assetId: adv.asset_id || ''
      });

      // 2. Recommendation Action Card
      if (adv.recommended_action || adv.recommendation) {
        const recObj = adv.recommended_action || {};
        upsertBlock(BLOCK_KINDS.RECOMMENDATION, {
          title: recObj.action_title || adv.recommendation || 'Standard Operating Action',
          detail: recObj.action_detail || adv.diagnosis || '',
          urgency: recObj.urgency || (adv.risk?.toLowerCase().includes('high') ? 'HIGH' : 'MEDIUM'),
          confidence: recObj.confidence_score ?? confidence
        });
      }

      // 3. Advisory Details (Expected Impact, Safety Constraints, Verification)
      const constraints = Array.isArray(adv.constraints) ? adv.constraints : [];
      const verification = Array.isArray(adv.verification) ? adv.verification : [];
      const expectedImpact = adv.expected_impact || '';
      const riskSummary = adv.risk || '';

      if (constraints.length > 0 || verification.length > 0 || expectedImpact || riskSummary) {
        upsertBlock(BLOCK_KINDS.ADVISORY_DETAILS, {
          riskSummary,
          expectedImpact,
          constraints,
          verification
        });
      }

      // 4. Evidence Items
      if (Array.isArray(adv.evidence) && adv.evidence.length > 0) {
        upsertBlock(BLOCK_KINDS.EVIDENCE, {
          items: adv.evidence
        });
      }

      // 5. Table (if backend emits tabular payload)
      if (adv.table && Array.isArray(adv.table.rows)) {
        upsertBlock(BLOCK_KINDS.TABLE, {
          columns: adv.table.columns || [],
          rows: adv.table.rows
        });
      }

      break;
    }

    case 'generative_ui': {
      // Plotly chart artifact
      upsertBlock(BLOCK_KINDS.VISUALIZATION, {
        chartId: evt.chart_id || `chart-${Date.now()}`,
        title: evt.title || 'ESP Telemetry Trends',
        data: evt.data || [],
        layout: evt.layout || {},
        status: evt.status || 'READY'
      });
      break;
    }

    case 'error': {
      upsertBlock(BLOCK_KINDS.ERROR, {
        message: evt.message || 'An error occurred while executing the advisory run.',
        errorType: evt.errorType || 'backend',
        canRetry: true
      });
      break;
    }

    default:
      break;
  }

  return blocks;
}
