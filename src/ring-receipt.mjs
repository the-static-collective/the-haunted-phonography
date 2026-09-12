import { hashCanonical } from './provenance.mjs';

const RECEIPT_SCHEMA = 'haunted-phonograph/ring-receipt/v1';

function fail(code, message) {
  const error = new TypeError(message);
  error.code = code;
  throw error;
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export function createRingReceipt({ score, observations, run, hauntInfluencePlan = null }) {
  const scoreHash = hashCanonical(score);
  if (run?.trace?.scoreHash !== scoreHash) {
    fail('RING_RECEIPT_SCORE_MISMATCH', 'RING trace does not belong to the supplied score');
  }
  if (run?.mutationResult?.scoreHash !== scoreHash || run?.performance?.scoreHash !== scoreHash) {
    fail('RING_RECEIPT_CHAIN_MISMATCH', 'RING mutation/performance chain does not belong to the supplied score');
  }
  if (typeof run.trace.traceHash !== 'string') {
    fail('RING_RECEIPT_INVALID_TRACE', 'RING traceHash is required');
  }

  const canonical = {
    schema: RECEIPT_SCHEMA,
    scoreHash,
    observationsHash: hashCanonical(observations),
    historyPlanHash: hauntInfluencePlan ? hashCanonical(hauntInfluencePlan) : null,
    traceHash: run.trace.traceHash,
    performanceHash: hashCanonical(run.performance),
    terminalState: run.trace.terminalState,
    visitedRelations: run.trace.steps.map(step => step.relation),
  };

  return deepFreeze({
    ...canonical,
    receiptHash: hashCanonical(canonical),
  });
}
