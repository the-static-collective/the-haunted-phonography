import test from 'node:test';
import assert from 'node:assert/strict';

import { createHauntCapsule } from '../src/haunt-capsule.mjs';
import { buildHauntInfluencePlan } from '../src/haunt-influence.mjs';

const score = Object.freeze({ schema: 'haunted-phonograph/score/v1', sourceHash: 'sha256:source', material: {}, mutation: {} });

function capsule({ encounter = 'one', pressure = 'late-bloom', strength = 0.8, invitations = null } = {}) {
  return createHauntCapsule({
    sourceRef: 'sha256:source',
    encounterRef: `sha256:${encounter}`,
    origin: { appliance: 'haunted-toaster', receiptRef: `sha256:${encounter}`, policy: 'toaster-memory-export/v1' },
    relations: [],
    invitations: invitations ?? [{ pressure, strength, allowedSurfaces: ['mutation-path'] }],
    lineage: { parentRefs: [], influenceOnlyRefs: [], refusedRefs: [] },
    unresolved: [],
    derivedFrom: [`sha256:${encounter}`],
  });
}

test('builds deterministic late-bloom influence plan from sibling memory', () => {
  const memory = capsule();
  const a = buildHauntInfluencePlan({ score, seed: 'seed-001', capsules: [memory] });
  const b = buildHauntInfluencePlan({ score, seed: 'seed-001', capsules: [memory] });
  assert.deepEqual(a, b);
  assert.equal(a.schema, 'haunted-phonograph/haunt-influence-plan/v1');
  assert.equal(a.policy, 'haunt-proposal-influence/v1');
  assert.equal(a.stream, 'haunt/mutation-path/v1');
  assert.equal(a.routePressure, 'late-bloom');
  assert.deepEqual(a.orderedCapsuleIds, [memory.capsuleId]);
  assert.deepEqual(a.consumedCapsuleIds, [memory.capsuleId]);
  assert.deepEqual(a.ignored, []);
  assert.equal(Object.isFrozen(a), true);
});

test('normalizes caller order and selects strongest supported invitation', () => {
  const weak = capsule({ encounter: 'weak', strength: 0.4 });
  const strong = capsule({ encounter: 'strong', strength: 0.9 });
  const a = buildHauntInfluencePlan({ score, seed: 'seed-001', capsules: [weak, strong] });
  const b = buildHauntInfluencePlan({ score, seed: 'seed-001', capsules: [strong, weak] });
  assert.deepEqual(a, b);
  assert.deepEqual(a.orderedCapsuleIds, [weak.capsuleId, strong.capsuleId].sort());
  assert.deepEqual(a.consumedCapsuleIds, [strong.capsuleId]);
  assert.deepEqual(a.ignored, [{ capsuleId: weak.capsuleId, reason: 'LOWER_PRIORITY' }]);
});

test('records unsupported and absent invitations as deterministic ignore residue', () => {
  const unsupported = capsule({ encounter: 'unsupported', pressure: 'something-else' });
  const absent = capsule({ encounter: 'absent', invitations: [] });
  const plan = buildHauntInfluencePlan({ score, seed: 'seed-001', capsules: [unsupported, absent] });
  assert.equal(plan.routePressure, null);
  assert.deepEqual(plan.consumedCapsuleIds, []);
  assert.deepEqual(plan.ignored, [
    { capsuleId: absent.capsuleId, reason: 'NO_APPLICABLE_INVITATION' },
    { capsuleId: unsupported.capsuleId, reason: 'UNSUPPORTED_PRESSURE' },
  ].sort((a, b) => a.capsuleId.localeCompare(b.capsuleId)));
});

test('does not mutate score or capsules', () => {
  const memory = capsule();
  const scoreBefore = structuredClone(score);
  const memoryBefore = structuredClone(memory);
  buildHauntInfluencePlan({ score, seed: 'seed-001', capsules: [memory] });
  assert.deepEqual(score, scoreBefore);
  assert.deepEqual(memory, memoryBefore);
});
