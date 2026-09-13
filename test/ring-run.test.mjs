import test from 'node:test';
import assert from 'node:assert/strict';

import { hashCanonical } from '../src/provenance.mjs';
import { runRing } from '../src/run-ring.mjs';
import { setupRingFixture } from './helpers/ring-fixture.mjs';

test('no-history RING preserves prior musical behavior shape', () => {
  const { score, observations, seed } = setupRingFixture();
  const before = structuredClone(observations.hashes);
  const run = runRing({ score, observations, seed });

  assert.equal(run.trace.terminalState, 'damped');
  assert.deepEqual(run.performance.events.map(event => event.velocity), [88, 88, 88, 88]);
  assert.deepEqual(run.performance.events.map(event => event.durationTicks), [480, 480, 480, 480]);
  assert.deepEqual(observations.hashes, before);
});

test('late-bloom RING changes susceptibility and resolves bounded musical consequences', () => {
  const { score, observations, seed, hauntInfluencePlan } = setupRingFixture();
  const before = structuredClone(observations.hashes);
  const run = runRing({ score, observations, seed, hauntInfluencePlan });

  assert.equal(run.trace.terminalState, 'completed');
  assert.deepEqual(run.performance.events.map(event => event.velocity), [56, 64, 88, 108]);
  assert.deepEqual(run.performance.events.map(event => event.durationTicks), [720, 720, 720, 720]);
  assert.deepEqual(observations.hashes, before);
  assert.deepEqual(run.performance.retainedUncertaintyRefs, ['sha256:harmony']);
});

test('identical RING inputs reproduce trace and resolved performance identities', () => {
  const { score, observations, seed, hauntInfluencePlan } = setupRingFixture();
  const a = runRing({ score, observations, seed, hauntInfluencePlan });
  const b = runRing({ score, observations, seed, hauntInfluencePlan });

  assert.equal(a.trace.traceHash, b.trace.traceHash);
  assert.equal(hashCanonical(a.performance), hashCanonical(b.performance));
});
