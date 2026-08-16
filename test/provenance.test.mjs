import test from 'node:test';
import assert from 'node:assert/strict';

import {
  UNKNOWN,
  createEvidence,
  createUncertainty,
  createProposal,
  validateClaim,
} from '../src/provenance.mjs';

function assertCode(expectedCode) {
  return (error) => {
    assert.equal(error?.code, expectedCode);
    return true;
  };
}

test('creates immutable source-backed evidence', () => {
  const evidence = createEvidence({
    subject: 'pulse-bpm',
    value: 92,
    sourceRefs: ['sha256:source'],
    method: { id: 'manual-observation', version: '1' },
  });

  assert.equal(evidence.authority, 'evidence');
  assert.equal(validateClaim(evidence), true);
  assert.equal(Object.isFrozen(evidence), true);
  assert.equal(Object.isFrozen(evidence.method), true);
});

test('preserves explicit unknown as valid uncertainty', () => {
  const uncertainty = createUncertainty({
    subject: 'chord-quality',
    value: UNKNOWN,
    sourceRefs: ['sha256:source'],
    method: { id: 'bounded-listening', version: '1' },
    uncertainty: { alternatives: ['minor', 'sus2'] },
  });

  assert.equal(uncertainty.authority, 'uncertainty');
  assert.deepEqual(uncertainty.value, { state: 'unknown' });
  assert.equal(validateClaim(uncertainty), true);
  assert.equal(Object.isFrozen(uncertainty.uncertainty.alternatives), true);
});

test('proposal may cite parent evidence without inheriting evidence authority', () => {
  const proposal = createProposal({
    subject: 'bass-note',
    value: 'D2',
    parentRefs: ['sha256:evidence-claim'],
    proposer: { id: 'mutation-law' },
    policy: { id: 'interval-displacement', version: '1' },
  });

  assert.equal(proposal.authority, 'proposal');
  assert.deepEqual(proposal.parentRefs, ['sha256:evidence-claim']);
  assert.equal(validateClaim(proposal), true);
});

test('evidence without source references fails closed', () => {
  assert.throws(
    () => createEvidence({
      subject: 'pulse-bpm',
      value: 92,
      sourceRefs: [],
      method: { id: 'manual-observation', version: '1' },
    }),
    assertCode('INVALID_PROVENANCE'),
  );
});

test('proposal without a versioned policy fails closed', () => {
  assert.throws(
    () => createProposal({
      subject: 'bass-note',
      value: 'D2',
      parentRefs: [],
      proposer: { id: 'mutation-law' },
      policy: { id: 'interval-displacement' },
    }),
    assertCode('INVALID_PROVENANCE'),
  );
});
