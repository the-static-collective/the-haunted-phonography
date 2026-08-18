import test from 'node:test';
import assert from 'node:assert/strict';

import {
  HAUNT_CAPSULE_SCHEMA,
  createHauntCapsule,
  hashHauntCapsule,
  validateHauntCapsule,
} from '../src/haunt-capsule.mjs';

function input() {
  return {
    sourceRef: 'sha256:source-fixture',
    encounterRef: 'sha256:toaster-receipt-fixture',
    origin: {
      appliance: 'haunted-toaster',
      receiptRef: 'sha256:toaster-receipt-fixture',
      policy: 'toaster-memory-export/v1',
    },
    relations: [{
      relation: 'restraint-before-expansion',
      direction: 'positive',
      strength: 0.8,
      evidenceRefs: ['sha256:toaster-receipt-fixture'],
    }],
    invitations: [{
      pressure: 'late-bloom',
      strength: 0.8,
      allowedSurfaces: ['mutation-path'],
    }],
    lineage: { parentRefs: [], influenceOnlyRefs: [], refusedRefs: [] },
    unresolved: [],
    derivedFrom: ['sha256:toaster-receipt-fixture'],
  };
}

test('creates an immutable influence-only HAUNT capsule with canonical identity', () => {
  const capsule = createHauntCapsule(input());
  assert.equal(capsule.schema, HAUNT_CAPSULE_SCHEMA);
  assert.equal(capsule.provenance.authority, 'influence-only');
  assert.equal(hashHauntCapsule(capsule), capsule.capsuleId);
  assert.equal(validateHauntCapsule(capsule), true);
  assert.equal(Object.isFrozen(capsule), true);
  assert.equal(Object.isFrozen(capsule.origin), true);
});

test('rejects stale identity after capsule content changes', () => {
  const capsule = createHauntCapsule(input());
  const changed = structuredClone(capsule);
  changed.invitations[0].strength = 0.2;
  assert.throws(
    () => validateHauntCapsule(changed),
    error => error?.code === 'HAUNT_IDENTITY_MISMATCH',
  );
});

test('rejects sibling memory that claims stronger authority', () => {
  const capsule = createHauntCapsule(input());
  const changed = structuredClone(capsule);
  changed.provenance.authority = 'evidence';
  changed.capsuleId = hashHauntCapsule(changed);
  assert.throws(
    () => validateHauntCapsule(changed),
    error => error?.code === 'HAUNT_AUTHORITY_VIOLATION',
  );
});

test('rejects undeclared fields instead of accepting semantic smuggling', () => {
  const capsule = structuredClone(createHauntCapsule(input()));
  capsule.evidence = { promoted: true };
  capsule.capsuleId = hashHauntCapsule(capsule);
  assert.throws(
    () => validateHauntCapsule(capsule),
    error => error?.code === 'HAUNT_INVALID_CAPSULE',
  );

  const nested = structuredClone(createHauntCapsule(input()));
  nested.invitations[0].rendererHint = 'secret-side-channel';
  nested.capsuleId = hashHauntCapsule(nested);
  assert.throws(
    () => validateHauntCapsule(nested),
    error => error?.code === 'HAUNT_INVALID_CAPSULE',
  );
});

test('rejects forbidden influence surfaces and invalid strength', () => {
  assert.throws(
    () => createHauntCapsule({
      ...input(),
      invitations: [{ pressure: 'late-bloom', strength: 0.8, allowedSurfaces: ['renderer'] }],
    }),
    error => error?.code === 'HAUNT_FORBIDDEN_SURFACE',
  );
  assert.throws(
    () => createHauntCapsule({
      ...input(),
      relations: [{
        relation: 'restraint-before-expansion',
        direction: 'positive',
        strength: 2,
        evidenceRefs: ['sha256:toaster-receipt-fixture'],
      }],
    }),
    error => error?.code === 'HAUNT_INVALID_STRENGTH',
  );
});

test('rejects malformed origin and receipt references', () => {
  assert.throws(
    () => createHauntCapsule({ ...input(), encounterRef: '' }),
    error => error?.code === 'HAUNT_INVALID_CAPSULE',
  );
  assert.throws(
    () => createHauntCapsule({
      ...input(),
      origin: { appliance: '', receiptRef: 'sha256:x', policy: 'x/v1' },
    }),
    error => error?.code === 'HAUNT_INVALID_CAPSULE',
  );
});
