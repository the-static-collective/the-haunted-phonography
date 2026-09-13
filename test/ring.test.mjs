import test from 'node:test';
import assert from 'node:assert/strict';

import { mutateScore } from '../src/mutation.mjs';
import { propagateRing, RING_RELATIONS } from '../src/ring.mjs';
import { setupRingFixture } from './helpers/ring-fixture.mjs';

test('declares exactly three native musical relations', () => {
  assert.deepEqual(RING_RELATIONS, [
    'interval-displacement',
    'rhythmic-stretch',
    'dynamic-bloom',
  ]);
});

test('no-history path preserves prior displacement shape and damps', () => {
  const { score, seed } = setupRingFixture();
  const baseline = mutateScore({ score, seed });
  const ring = propagateRing({ score, seed });

  assert.deepEqual(ring.steps.map(step => step.relation), ['interval-displacement']);
  assert.equal(ring.terminalState, 'damped');
  assert.deepEqual(ring.finalState.pitches, baseline.pitches);
  assert.deepEqual(ring.finalState.durationsQuarter, baseline.durationsQuarter);
  assert.equal(ring.finalState.velocityProfile, null);
  assert.equal(ring.finalState.selectedOffset, baseline.selectedOffset);
});

test('late-bloom history changes eligibility without changing authority', () => {
  const { score, seed, hauntInfluencePlan } = setupRingFixture();
  const ring = propagateRing({ score, seed, hauntInfluencePlan });

  assert.deepEqual(ring.steps.map(step => step.relation), [
    'dynamic-bloom',
    'interval-displacement',
    'rhythmic-stretch',
  ]);
  assert.equal(ring.terminalState, 'completed');
  assert.deepEqual(ring.finalState.durationsQuarter, [1.5, 1.5, 1.5, 1.5]);
  assert.deepEqual(ring.finalState.velocityProfile, [56, 64, 88, 108]);
  assert.equal(ring.historyInfluence.routePressure, 'late-bloom');
  assert.equal(Object.hasOwn(ring.historyInfluence, 'authority'), false);
});

test('replay is deterministic and branch length is bounded', () => {
  const { score, seed, hauntInfluencePlan } = setupRingFixture();
  const a = propagateRing({ score, seed, hauntInfluencePlan });
  const b = propagateRing({ score, seed, hauntInfluencePlan });

  assert.equal(a.traceHash, b.traceHash);
  assert.deepEqual(a, b);
  assert(a.steps.length <= 4);
});

test('rejects a HAUNT plan bound to another score or seed', () => {
  const { score, hauntInfluencePlan } = setupRingFixture();
  assert.throws(
    () => propagateRing({ score, seed: 'different-seed', hauntInfluencePlan }),
    error => error.code === 'RING_HISTORY_MISMATCH',
  );
});
