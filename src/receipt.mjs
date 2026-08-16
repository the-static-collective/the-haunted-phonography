import { createHash } from 'node:crypto';
import { hashCanonical } from './provenance.mjs';

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

function hashBytes(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function assertChain({ source, observations, score, mutationResult, performance }) {
  const scoreHash = hashCanonical(score);
  if (score.sourceHash !== source.sha256
    || mutationResult.scoreHash !== scoreHash
    || performance.sourceHash !== source.sha256
    || performance.scoreHash !== scoreHash) {
    fail('RECEIPT_CHAIN_MISMATCH', 'source, score, mutation, and performance identities do not form one chain');
  }
  for (const [key, hash] of Object.entries(observations.hashes)) {
    if (score.observationRefs?.[key] !== hash) {
      fail('RECEIPT_CHAIN_MISMATCH', `score observation reference ${key} does not match admitted observation`);
    }
  }
  const mutation = performance.mutation;
  if (mutation?.law !== mutationResult.law
    || mutation?.stream !== mutationResult.stream
    || mutation?.seed !== mutationResult.seed
    || mutation?.selectedOffset !== mutationResult.selectedOffset) {
    fail('RECEIPT_CHAIN_MISMATCH', 'performance mutation identity does not match mutation result');
  }
  if (performance.retainedUncertaintyRefs?.length !== 1
    || performance.retainedUncertaintyRefs[0] !== observations.hashes.harmonyQuality) {
    fail('RECEIPT_CHAIN_MISMATCH', 'performance uncertainty reference does not match admitted uncertainty');
  }
  return scoreHash;
}

export function buildReceipt({ source, observations, score, mutationResult, performance, midiBytes }) {
  if (!Buffer.isBuffer(midiBytes)) fail('INVALID_MIDI_ARTIFACT', 'receipt requires final MIDI bytes as Buffer');
  const scoreHash = assertChain({ source, observations, score, mutationResult, performance });
  const observationAuthorities = Object.fromEntries(
    Object.entries(observations.claims).map(([key, claim]) => [key, claim.authority]),
  );
  return deepFreeze({
    schema: 'haunted-phonograph/receipt/v1',
    status: 'completed',
    sourceHash: source.sha256,
    observationHashes: { ...observations.hashes },
    observationAuthorities,
    scoreHash,
    mutation: {
      law: mutationResult.law,
      stream: mutationResult.stream,
      seed: mutationResult.seed,
      selectedOffset: mutationResult.selectedOffset,
    },
    resolvedPerformanceHash: hashCanonical(performance),
    midi: {
      profile: 'smf0-ppq480/v1',
      sha256: hashBytes(midiBytes),
      byteLength: midiBytes.length,
    },
    retainedUncertaintyRefs: [...performance.retainedUncertaintyRefs],
  });
}
