import test from 'node:test';
import assert from 'node:assert/strict';

import {
  UNKNOWN,
  createEvidence,
  createUncertainty,
  createProposal,
  validateClaim,
  reclassifyClaim,
  recordRealization,
  canonicalStringify,
  hashCanonical,
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

test('authority class cannot be promoted from proposal or uncertainty to evidence', () => {
  const proposal = createProposal({
    subject: 'counter-melody',
    value: ['E4', 'G4'],
    parentRefs: ['sha256:heard-motif'],
    proposer: { id: 'motif-mutator' },
    policy: { id: 'bounded-counterline', version: '1' },
  });
  const uncertainty = createUncertainty({
    subject: 'heard-note',
    value: UNKNOWN,
    sourceRefs: ['sha256:source'],
    method: { id: 'pitch-observer', version: '1' },
  });

  assert.throws(
    () => reclassifyClaim(proposal, 'evidence'),
    assertCode('AUTHORITY_CLASS_IMMUTABLE'),
  );
  assert.throws(
    () => reclassifyClaim(uncertainty, 'evidence'),
    assertCode('AUTHORITY_CLASS_IMMUTABLE'),
  );
  assert.strictEqual(reclassifyClaim(proposal, 'proposal'), proposal);
});

test('concrete realization from uncertainty remains a proposal choice rooted in uncertainty', () => {
  const uncertainty = createUncertainty({
    subject: 'heard-note',
    value: UNKNOWN,
    sourceRefs: ['sha256:source'],
    method: { id: 'pitch-observer', version: '1' },
    uncertainty: { alternatives: ['C#4', 'D4'] },
  });

  const realized = recordRealization({
    sourceClaim: uncertainty,
    value: 'C#4',
    resolver: { id: 'performance-resolver', version: '1' },
  });

  assert.equal(realized.schema, 'haunted-phonograph/realization-provenance/v1');
  assert.match(realized.sourceClaimHash, /^sha256:[0-9a-f]{64}$/);
  assert.equal(realized.sourceAuthority, 'uncertainty');
  assert.equal(realized.selectionAuthority, 'proposal-choice');
  assert.equal(realized.value, 'C#4');
  assert.equal(Object.isFrozen(realized), true);
  assert.equal(Object.isFrozen(realized.resolver), true);
  assert.equal(uncertainty.authority, 'uncertainty');
  assert.throws(() => validateClaim(realized), assertCode('INVALID_CLAIM'));
});

test('direct realization of exact evidence stays distinguished from a proposal choice', () => {
  const evidence = createEvidence({
    subject: 'meter',
    value: '4/4',
    sourceRefs: ['sha256:source'],
    method: { id: 'manual-observation', version: '1' },
  });

  const realized = recordRealization({
    sourceClaim: evidence,
    value: '4/4',
    resolver: { id: 'performance-resolver', version: '1' },
  });

  assert.equal(realized.sourceAuthority, 'evidence');
  assert.equal(realized.selectionAuthority, 'direct-evidence');
});

test('realization refuses invalid source claims and invalid resolver identity', () => {
  assert.throws(
    () => recordRealization({
      sourceClaim: { schema: 'wrong', authority: 'evidence' },
      value: 'C4',
      resolver: { id: 'performance-resolver', version: '1' },
    }),
    assertCode('REALIZATION_SOURCE_INVALID'),
  );

  const uncertainty = createUncertainty({
    subject: 'heard-note',
    value: UNKNOWN,
    sourceRefs: ['sha256:source'],
    method: { id: 'pitch-observer', version: '1' },
  });
  assert.throws(
    () => recordRealization({
      sourceClaim: uncertainty,
      value: 'C4',
      resolver: { id: 'performance-resolver' },
    }),
    assertCode('INVALID_PROVENANCE'),
  );
});

test('canonical serialization ignores object insertion order and preserves array order', () => {
  const left = { z: 1, a: { y: 2, x: 3 }, notes: ['C4', 'D4'] };
  const right = { notes: ['C4', 'D4'], a: { x: 3, y: 2 }, z: 1 };

  assert.equal(canonicalStringify(left), '{"a":{"x":3,"y":2},"notes":["C4","D4"],"z":1}');
  assert.equal(canonicalStringify(left), canonicalStringify(right));
  assert.equal(hashCanonical(left), hashCanonical(right));
  assert.notEqual(hashCanonical(['C4', 'D4']), hashCanonical(['D4', 'C4']));
});

test('authority and provenance changes alter canonical hashes', () => {
  const evidence = createEvidence({
    subject: 'bass-note',
    value: 'D2',
    sourceRefs: ['sha256:source'],
    method: { id: 'manual-observation', version: '1' },
  });
  const proposal = createProposal({
    subject: 'bass-note',
    value: 'D2',
    parentRefs: ['sha256:source'],
    proposer: { id: 'mutation-law' },
    policy: { id: 'interval-displacement', version: '1' },
  });

  assert.notEqual(hashCanonical(evidence), hashCanonical(proposal));
  assert.match(hashCanonical(evidence), /^sha256:[0-9a-f]{64}$/);
});

test('canonical serialization fails closed on non-JSON values and cycles', () => {
  assert.throws(() => canonicalStringify({ tempo: Number.NaN }), assertCode('INVALID_JSON_VALUE'));
  assert.throws(() => canonicalStringify({ tempo: Infinity }), assertCode('INVALID_JSON_VALUE'));
  assert.throws(() => canonicalStringify({ value: undefined }), assertCode('INVALID_JSON_VALUE'));
  assert.throws(() => canonicalStringify({ value: 1n }), assertCode('INVALID_JSON_VALUE'));
  assert.throws(() => canonicalStringify(new Date()), assertCode('INVALID_JSON_VALUE'));

  const sparse = [];
  sparse[1] = 'C4';
  assert.throws(() => canonicalStringify(sparse), assertCode('INVALID_JSON_VALUE'));

  const cycle = {};
  cycle.self = cycle;
  assert.throws(() => canonicalStringify(cycle), assertCode('INVALID_JSON_VALUE'));
});

test('canonical serialization preserves a literal __proto__ data key', () => {
  const value = { safe: true, ['__proto__']: 'literal-data' };
  assert.equal(canonicalStringify(value), '{"__proto__":"literal-data","safe":true}');
});

test('changed realization from evidence is a proposal choice rather than laundered evidence', () => {
  const evidence = createEvidence({
    subject: 'meter',
    value: '4/4',
    sourceRefs: ['sha256:source'],
    method: { id: 'manual-observation', version: '1' },
  });

  const realized = recordRealization({
    sourceClaim: evidence,
    value: '3/4',
    resolver: { id: 'performance-resolver', version: '1' },
  });

  assert.equal(realized.sourceAuthority, 'evidence');
  assert.equal(realized.selectionAuthority, 'proposal-choice');
});

test('realization must choose a concrete value rather than preserve unknown as performance state', () => {
  const uncertainty = createUncertainty({
    subject: 'heard-note',
    value: UNKNOWN,
    sourceRefs: ['sha256:source'],
    method: { id: 'pitch-observer', version: '1' },
  });

  assert.throws(
    () => recordRealization({
      sourceClaim: uncertainty,
      value: UNKNOWN,
      resolver: { id: 'performance-resolver', version: '1' },
    }),
    assertCode('INVALID_PROVENANCE'),
  );
});
