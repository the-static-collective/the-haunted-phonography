import test from 'node:test';
import assert from 'node:assert/strict';

import { hashCanonical } from '../src/provenance.mjs';
import { buildReceipt } from '../src/receipt.mjs';

function pipeline() {
  const source = { sha256: 'sha256:source' };
  const observations = {
    claims: {
      tempo: { authority: 'evidence' },
      motifPitches: { authority: 'evidence' },
      motifDurations: { authority: 'evidence' },
      harmonyQuality: { authority: 'uncertainty' },
    },
    hashes: {
      tempo: 'sha256:tempo',
      motifPitches: 'sha256:pitches',
      motifDurations: 'sha256:durations',
      harmonyQuality: 'sha256:harmony',
    },
  };
  const score = {
    schema: 'haunted-phonograph/score/v1',
    sourceHash: source.sha256,
    observationRefs: { ...observations.hashes },
  };
  const scoreHash = hashCanonical(score);
  const hauntInfluence = {
    policy: 'haunt-proposal-influence/v1',
    stream: 'haunt/mutation-path/v1',
    orderedCapsuleIds: ['sha256:capsule'],
    consumedCapsuleIds: ['sha256:capsule'],
    ignored: [],
    routePressure: 'late-bloom',
  };
  const mutationResult = {
    law: 'interval-preserving-motif-displacement/v1',
    stream: 'specimen-001/motif-displacement/v1',
    seed: 'seed-001',
    scoreHash,
    selectedOffset: 2,
    hauntInfluence,
  };
  const performance = {
    sourceHash: source.sha256,
    scoreHash,
    mutation: {
      law: mutationResult.law,
      stream: mutationResult.stream,
      seed: mutationResult.seed,
      selectedOffset: mutationResult.selectedOffset,
    },
    retainedUncertaintyRefs: [observations.hashes.harmonyQuality],
    hauntInfluence: structuredClone(hauntInfluence),
  };
  return { source, observations, score, mutationResult, performance, midiBytes: Buffer.from([1, 2, 3]) };
}

test('receipt binds the exact resolved HAUNT influence summary', () => {
  const p = pipeline();
  const receipt = buildReceipt(p);
  assert.deepEqual(receipt.hauntInfluence, p.mutationResult.hauntInfluence);
});

test('receipt refuses mutation/performance HAUNT influence mismatch', () => {
  const p = pipeline();
  p.performance.hauntInfluence.routePressure = 'different-route';
  assert.throws(
    () => buildReceipt(p),
    error => error?.code === 'RECEIPT_CHAIN_MISMATCH',
  );
});
