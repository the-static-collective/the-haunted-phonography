import test from 'node:test';
import assert from 'node:assert/strict';

import { createProposal } from '../src/provenance.mjs';
import { createHauntCapsule } from '../src/haunt-capsule.mjs';
import { buildHauntInfluencePlan } from '../src/haunt-influence.mjs';
import { mutateScore } from '../src/mutation.mjs';
import { resolvePerformance } from '../src/performance.mjs';

function setup() {
  const motif = createProposal({
    subject: 'motif-material',
    value: { pitches: [60, 64, 67, 64], durationsQuarter: [1, 1, 1, 1] },
    parentRefs: ['sha256:pitches', 'sha256:durations'],
    proposer: { id: 'haunt-test' },
    policy: { id: 'source-motif-as-compositional-seed', version: '1' },
  });
  const score = Object.freeze({
    schema: 'haunted-phonograph/score/v1',
    sourceHash: 'sha256:source',
    observationRefs: {
      tempo: 'sha256:tempo',
      motifPitches: 'sha256:pitches',
      motifDurations: 'sha256:durations',
      harmonyQuality: 'sha256:harmony',
    },
    material: { motif },
    role: 'lead',
    mutation: {
      law: 'interval-preserving-motif-displacement/v1',
      stream: 'specimen-001/motif-displacement/v1',
      allowedOffsets: [-5, -2, 2, 5, 7],
    },
  });
  const observations = Object.freeze({
    claims: { tempo: { value: 120 } },
    hashes: { harmonyQuality: 'sha256:harmony' },
  });
  const capsule = createHauntCapsule({
    sourceRef: 'sha256:source',
    encounterRef: 'sha256:toaster-receipt',
    origin: { appliance: 'haunted-toaster', receiptRef: 'sha256:toaster-receipt', policy: 'toaster-memory-export/v1' },
    relations: [{ relation: 'restraint-before-expansion', direction: 'positive', strength: 0.8, evidenceRefs: ['sha256:toaster-receipt'] }],
    invitations: [{ pressure: 'late-bloom', strength: 0.8, allowedSurfaces: ['mutation-path'] }],
    lineage: { parentRefs: [], influenceOnlyRefs: [], refusedRefs: [] },
    unresolved: [],
    derivedFrom: ['sha256:toaster-receipt'],
  });
  return { score, observations, capsule };
}

test('late-bloom memory changes only proposal dynamics, not source-derived musical material', () => {
  const { score, observations, capsule } = setup();
  const beforeHashes = structuredClone(observations.hashes);
  const baseline = mutateScore({ score, seed: 'seed-001' });
  const plan = buildHauntInfluencePlan({ score, seed: 'seed-001', capsules: [capsule] });
  const haunted = mutateScore({ score, seed: 'seed-001', hauntInfluencePlan: plan });

  assert.deepEqual(haunted.pitches, baseline.pitches);
  assert.deepEqual(haunted.durationsQuarter, baseline.durationsQuarter);
  assert.equal(haunted.selectedOffset, baseline.selectedOffset);
  assert.deepEqual(haunted.velocityProfile, [56, 64, 88, 108]);
  assert.equal(haunted.hauntInfluence.routePressure, 'late-bloom');
  assert.deepEqual(observations.hashes, beforeHashes);
});

test('resolved performance realizes late-bloom dynamics without raw capsule authority', () => {
  const { score, observations, capsule } = setup();
  const plan = buildHauntInfluencePlan({ score, seed: 'seed-001', capsules: [capsule] });
  const mutationResult = mutateScore({ score, seed: 'seed-001', hauntInfluencePlan: plan });
  const performance = resolvePerformance({ score, observations, mutationResult });

  assert.deepEqual(performance.events.map(event => event.velocity), [56, 64, 88, 108]);
  assert.equal(performance.hauntInfluence.routePressure, 'late-bloom');
  assert.deepEqual(performance.hauntInfluence.consumedCapsuleIds, [capsule.capsuleId]);
  assert.equal(Object.hasOwn(performance, 'capsules'), false);
  assert.deepEqual(performance.retainedUncertaintyRefs, ['sha256:harmony']);
});

test('legacy mutation keeps exact old shape and uniform velocity', () => {
  const { score, observations } = setup();
  const mutationResult = mutateScore({ score, seed: 'seed-001' });
  const performance = resolvePerformance({ score, observations, mutationResult });
  assert.equal(Object.hasOwn(mutationResult, 'velocityProfile'), false);
  assert.equal(Object.hasOwn(mutationResult, 'hauntInfluence'), false);
  assert.deepEqual(performance.events.map(event => event.velocity), [88, 88, 88, 88]);
  assert.equal(Object.hasOwn(performance, 'hauntInfluence'), false);
});
