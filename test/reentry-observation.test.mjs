import test from 'node:test';
import assert from 'node:assert/strict';
import { admitAcousticLocusDeclaration } from '../src/acoustic-locus.mjs';
import { admitReentryObservation } from '../src/reentry-observation.mjs';

const locus = admitAcousticLocusDeclaration({
  schema: 'haunted-phonograph/acoustic-locus-declaration/v1',
  locusId: 'open-e-001',
  relation: {
    kind: 'declared-auditory-relation',
    description: 'open-E landmark relation survives renderer change',
  },
  originalWorldRef: 'world:porch:t0',
  laterWorldRef: 'world:road:t1',
});

const BASE = {
  schema: 'haunted-phonograph/reentry-observation-declaration/v1',
  locusHash: locus.declarationHash,
  condition: 'B',
  recognition: 'recognized',
  worldAssessment: 'changed',
  confidence: 0.9,
  latencyMs: 820,
};

test('admits deterministic human re-entry observations without authority promotion', () => {
  const a = admitReentryObservation({ locus, declaration: BASE });
  const b = admitReentryObservation({ locus, declaration: structuredClone(BASE) });
  assert.equal(a.observationHash, b.observationHash);
  assert.equal(a.condition, 'B');
  assert.equal(a.recognition, 'recognized');
  assert.equal(a.worldAssessment, 'changed');
  assert.equal(a.sourceEvidence, undefined);
  assert.equal(a.ancestry, undefined);
  assert.equal(a.authority, undefined);
  assert(Object.isFrozen(a));
});

test('requires the observation to bind the admitted locus hash', () => {
  assert.throws(
    () => admitReentryObservation({ locus, declaration: { ...BASE, locusHash: `sha256:${'0'.repeat(64)}` } }),
    error => error.code === 'INVALID_REENTRY_OBSERVATION',
  );
});

test('admits only the four declared conditions and bounded vocabularies', () => {
  for (const condition of ['A', 'B', 'C', 'D']) {
    assert.equal(admitReentryObservation({ locus, declaration: { ...BASE, condition } }).condition, condition);
  }
  assert.throws(
    () => admitReentryObservation({ locus, declaration: { ...BASE, condition: 'E' } }),
    error => error.code === 'INVALID_REENTRY_OBSERVATION',
  );
  assert.throws(
    () => admitReentryObservation({ locus, declaration: { ...BASE, recognition: 'probably' } }),
    error => error.code === 'INVALID_REENTRY_OBSERVATION',
  );
  assert.throws(
    () => admitReentryObservation({ locus, declaration: { ...BASE, worldAssessment: 'better' } }),
    error => error.code === 'INVALID_REENTRY_OBSERVATION',
  );
});

test('requires finite confidence 0..1 and optional nonnegative finite latency', () => {
  for (const confidence of [-0.01, 1.01, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(
      () => admitReentryObservation({ locus, declaration: { ...BASE, confidence } }),
      error => error.code === 'INVALID_REENTRY_OBSERVATION',
    );
  }
  assert.throws(
    () => admitReentryObservation({ locus, declaration: { ...BASE, latencyMs: -1 } }),
    error => error.code === 'INVALID_REENTRY_OBSERVATION',
  );
  const withoutLatency = { ...BASE };
  delete withoutLatency.latencyMs;
  assert.equal(admitReentryObservation({ locus, declaration: withoutLatency }).latencyMs, undefined);
});

test('rejects undeclared evidence, ancestry, or authority fields', () => {
  for (const field of ['sourceEvidence', 'ancestry', 'authority', 'verdict']) {
    assert.throws(
      () => admitReentryObservation({ locus, declaration: { ...BASE, [field]: 'not-allowed' } }),
      error => error.code === 'INVALID_REENTRY_OBSERVATION',
    );
  }
});
