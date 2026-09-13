import { hashCanonical } from './provenance.mjs';

const RECEIPT_SCHEMA = 'haunted-phonograph/receipt/v1';
const BOUNDARY_ORDER = Object.freeze([
  'SOURCE',
  'OBSERVATIONS',
  'SCORE',
  'MUTATION',
  'RESOLVED_PERFORMANCE',
  'MIDI_PROJECTION',
]);

function fail(message) {
  const error = new TypeError(message);
  error.code = 'INVALID_DOGRAM_TRACE_RECEIPT';
  throw error;
}

function requireCompletedReceipt(receipt, label) {
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) {
    fail(`${label} must be a receipt object`);
  }
  if (receipt.schema !== RECEIPT_SCHEMA || receipt.status !== 'completed') {
    fail(`${label} must be a completed ${RECEIPT_SCHEMA} receipt`);
  }
  for (const [field, value] of [
    ['sourceHash', receipt.sourceHash],
    ['scoreHash', receipt.scoreHash],
    ['resolvedPerformanceHash', receipt.resolvedPerformanceHash],
    ['midi.sha256', receipt.midi?.sha256],
  ]) {
    if (typeof value !== 'string' || value.length === 0) {
      fail(`${label}.${field} must be a non-empty string`);
    }
  }
  if (!receipt.observationHashes || !receipt.observationAuthorities || !receipt.mutation) {
    fail(`${label} is missing traceable observation or mutation identity`);
  }
  return receipt;
}

function opaque(value) {
  return Object.freeze({ kind: 'opaque', value });
}

function trace(receipt) {
  return Object.freeze({
    SOURCE: opaque(receipt.sourceHash),
    OBSERVATIONS: opaque(hashCanonical({
      hashes: receipt.observationHashes,
      authorities: receipt.observationAuthorities,
    })),
    SCORE: opaque(receipt.scoreHash),
    MUTATION: opaque(hashCanonical(receipt.mutation)),
    RESOLVED_PERFORMANCE: opaque(receipt.resolvedPerformanceHash),
    MIDI_PROJECTION: opaque(receipt.midi.sha256),
  });
}

export function buildDogramTraceSource(receipt) {
  const admitted = requireCompletedReceipt(receipt, 'receipt');
  return Object.freeze({
    schema: 'dogram.trace-source/v0',
    source_schema: RECEIPT_SCHEMA,
    receipt_hash: hashCanonical(admitted),
    boundary_order: [...BOUNDARY_ORDER],
    trace: trace(admitted),
    authority_boundary: 'comparison-only',
    note: 'This sidecar preserves declared execution identity for later comparison; it does not assert causality, evidence authority, historical meaning, or artistic meaning.',
  });
}

export function buildDogramDeltaSpecimen({ specimenId, leftReceipt, rightReceipt }) {
  if (typeof specimenId !== 'string' || specimenId.trim().length === 0) {
    fail('specimenId must be a non-empty string');
  }
  const left = requireCompletedReceipt(leftReceipt, 'leftReceipt');
  const right = requireCompletedReceipt(rightReceipt, 'rightReceipt');

  return Object.freeze({
    schema: 'dogram.specimen/v0',
    specimen_id: specimenId,
    operator: 'delta',
    operator_version: 1,
    inputs: Object.freeze({
      boundary_order: [...BOUNDARY_ORDER],
      left: trace(left),
      right: trace(right),
    }),
    assumptions: [],
    metadata: Object.freeze({
      mathal: 'PHONOGRAPH-RECEIPT-TRACE-DELTA-001',
      source_schema: RECEIPT_SCHEMA,
      authority_boundary: 'comparison-only',
      note: 'Dogram may locate a declared trace difference; causal, evidentiary, historical, and artistic meaning remain external.',
    }),
  });
}
