import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORYSHIP_CANONICALIZATION_POLICY,
  STORYSHIP_EVENT_TYPES,
  STORYSHIP_FORBIDDEN_BERTH_CLASSES,
  STORYSHIP_RESULT_TARGETS,
  STORYSHIP_RESULT_VALUES,
  admitSourceCut,
  createConstitutionReceipt,
  createStoryshipResult,
  validateConstitutionReceipt,
  validateSourceCut,
  validateStoryshipResult,
} from '../src/storyship-contract.mjs';
import {
  APPROVED_CONSTITUTION_INPUT,
  APPROVED_SOURCE_CUT_INPUT,
} from './helpers/storyship-fixture.mjs';

const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;

function clone(value) {
  return structuredClone(value);
}

function expectCode(code) {
  return error => error?.code === code;
}

test('exports the exact bounded v0 vocabularies', () => {
  assert.equal(STORYSHIP_CANONICALIZATION_POLICY, 'hp-canonical-json-v1');
  assert.deepEqual([...STORYSHIP_EVENT_TYPES], [
    'voyage-created',
    'constitution-bound',
    'source-bound',
    'packet-sealed',
    'generation-requested',
    'generation-observed',
    'encounter-recorded',
    'selection-recorded',
    'continuation-recorded',
    'branch-composed',
    'interpretation-recorded',
    'residue-recorded',
    'correction-recorded',
    'customs-result-linked',
    'checkpoint-sealed',
    'voyage-stopped',
  ]);
  assert.deepEqual([...STORYSHIP_RESULT_VALUES], ['supports', 'refuses', 'unresolved']);
  assert.deepEqual([...STORYSHIP_RESULT_TARGETS], [
    'passenger_claim',
    'lineage_claim',
    'source_binding',
    'packet_mapping',
    'observation_method',
    'selection_abstraction',
    'continuity_law',
    'destination_admission',
  ]);
  assert.deepEqual([...STORYSHIP_FORBIDDEN_BERTH_CLASSES], [
    'missing raw evidence',
    'inaccessible source',
    'protected silence',
    'explicit refusal',
    'known prohibition',
    'forgotten metadata',
    'unresolved branch ownership',
  ]);
  assert(Object.isFrozen(STORYSHIP_EVENT_TYPES));
  assert(Object.isFrozen(STORYSHIP_RESULT_VALUES));
  assert(Object.isFrozen(STORYSHIP_RESULT_TARGETS));
  assert(Object.isFrozen(STORYSHIP_FORBIDDEN_BERTH_CLASSES));
});

test('seals the approved constitution from ordered path/blob pairs only', () => {
  const receipt = createConstitutionReceipt(APPROVED_CONSTITUTION_INPUT);
  assert.equal(receipt.schema, 'haunted-phonograph/storyship-constitution-receipt/v0');
  assert.equal(receipt.canonicalization_policy, 'hp-canonical-json-v1');
  assert.equal(receipt.owner_repository, APPROVED_CONSTITUTION_INPUT.owner_repository);
  assert.equal(receipt.owner_head_sha, APPROVED_CONSTITUTION_INPUT.owner_head_sha);
  assert.match(receipt.constitution_id, SHA256_PATTERN);
  assert(Object.isFrozen(receipt));
  assert(Object.isFrozen(receipt.ordered_constitutive_paths));
  assert(Object.isFrozen(receipt.blob_sha_for_each_path));
  assert.equal(validateConstitutionReceipt(receipt), true);

  const laterHead = createConstitutionReceipt({
    ...clone(APPROVED_CONSTITUTION_INPUT),
    owner_head_sha: 'c'.repeat(40),
  });
  assert.equal(laterHead.constitution_id, receipt.constitution_id);

  const reversed = createConstitutionReceipt({
    ...clone(APPROVED_CONSTITUTION_INPUT),
    ordered_constitutive_paths: [...APPROVED_CONSTITUTION_INPUT.ordered_constitutive_paths].reverse(),
  });
  assert.notEqual(reversed.constitution_id, receipt.constitution_id);
});

test('rejects constitution smuggling, malformed hashes, duplicates, and unsupported keys', () => {
  const smuggled = clone(APPROVED_CONSTITUTION_INPUT);
  smuggled.blob_sha_for_each_path['docs/superpowers/specs/2026-08-24-storyship-unused.md'] = 'f'.repeat(40);
  assert.throws(() => createConstitutionReceipt(smuggled), expectCode('INVALID_STORYSHIP_CONSTITUTION'));

  const duplicate = clone(APPROVED_CONSTITUTION_INPUT);
  duplicate.ordered_constitutive_paths[1] = duplicate.ordered_constitutive_paths[0];
  assert.throws(() => createConstitutionReceipt(duplicate), expectCode('INVALID_STORYSHIP_CONSTITUTION'));

  const missing = clone(APPROVED_CONSTITUTION_INPUT);
  delete missing.blob_sha_for_each_path[missing.ordered_constitutive_paths[0]];
  assert.throws(() => createConstitutionReceipt(missing), expectCode('INVALID_STORYSHIP_CONSTITUTION'));

  const badOwnerHead = clone(APPROVED_CONSTITUTION_INPUT);
  badOwnerHead.owner_head_sha = 'z'.repeat(40);
  assert.throws(() => createConstitutionReceipt(badOwnerHead), expectCode('INVALID_STORYSHIP_CONSTITUTION'));

  const badBlob = clone(APPROVED_CONSTITUTION_INPUT);
  badBlob.blob_sha_for_each_path[badBlob.ordered_constitutive_paths[0]] = 'g'.repeat(40);
  assert.throws(() => createConstitutionReceipt(badBlob), expectCode('INVALID_STORYSHIP_CONSTITUTION'));

  assert.throws(
    () => createConstitutionReceipt({ ...clone(APPROVED_CONSTITUTION_INPUT), surprise: true }),
    expectCode('INVALID_STORYSHIP_CONSTITUTION'),
  );

  const receipt = createConstitutionReceipt(APPROVED_CONSTITUTION_INPUT);
  const mutatedIdentity = { ...clone(receipt), constitution_id: `sha256:${'0'.repeat(64)}` };
  assert.throws(() => validateConstitutionReceipt(mutatedIdentity), expectCode('INVALID_STORYSHIP_CONSTITUTION'));
});

test('admits exact source cuts and keeps unrelated observation time out of identity', () => {
  const cut = admitSourceCut(APPROVED_SOURCE_CUT_INPUT);
  assert.equal(cut.schema, 'haunted-phonograph/storyship-source-cut/v0');
  assert.match(cut.source_cut_id, SHA256_PATTERN);
  assert(Object.isFrozen(cut));
  assert.equal(validateSourceCut(cut), true);

  const surroundingA = { source_cut: cut, observed_at: '2026-08-24T12:01:00.000Z' };
  const surroundingB = { source_cut: cut, observed_at: '2099-01-01T00:00:00.000Z' };
  assert.equal(surroundingA.source_cut.source_cut_id, surroundingB.source_cut.source_cut_id);

  for (const availability_status of ['available', 'inaccessible', 'unknown']) {
    const admitted = admitSourceCut({ ...clone(APPROVED_SOURCE_CUT_INPUT), availability_status });
    assert.equal(admitted.availability_status, availability_status);
  }

  for (const evidence_class of [
    'repository-constitution',
    'raw-owner-evidence',
    'provider-observation',
    'human-declaration',
    'destination-receipt',
  ]) {
    const admitted = admitSourceCut({ ...clone(APPROVED_SOURCE_CUT_INPUT), evidence_class });
    assert.equal(admitted.evidence_class, evidence_class);
  }
});

test('source cuts require explicit digest null and reject unsupported or mutated records', () => {
  const missingDigest = clone(APPROVED_SOURCE_CUT_INPUT);
  delete missingDigest.content_digest_when_available;
  assert.throws(() => admitSourceCut(missingDigest), expectCode('INVALID_STORYSHIP_SOURCE_CUT'));

  const nullDigest = admitSourceCut({ ...clone(APPROVED_SOURCE_CUT_INPUT), content_digest_when_available: null });
  assert.equal(nullDigest.content_digest_when_available, null);

  assert.throws(
    () => admitSourceCut({ ...clone(APPROVED_SOURCE_CUT_INPUT), availability_status: 'maybe' }),
    expectCode('INVALID_STORYSHIP_SOURCE_CUT'),
  );
  assert.throws(
    () => admitSourceCut({ ...clone(APPROVED_SOURCE_CUT_INPUT), evidence_class: 'story' }),
    expectCode('INVALID_STORYSHIP_SOURCE_CUT'),
  );
  assert.throws(
    () => admitSourceCut({ ...clone(APPROVED_SOURCE_CUT_INPUT), observed_at: '2026-08-24T12:02:00.000Z' }),
    expectCode('INVALID_STORYSHIP_SOURCE_CUT'),
  );

  const cut = admitSourceCut(APPROVED_SOURCE_CUT_INPUT);
  assert.throws(
    () => validateSourceCut({ ...clone(cut), source_cut_id: `sha256:${'0'.repeat(64)}` }),
    expectCode('INVALID_STORYSHIP_SOURCE_CUT'),
  );
});

test('creates strict machine-only typed results without constituting owner law', () => {
  for (const result of STORYSHIP_RESULT_VALUES) {
    for (const target of STORYSHIP_RESULT_TARGETS) {
      const admitted = createStoryshipResult({
        result,
        target,
        basis_event_ids: [],
        reason_codes: [],
      });
      assert.equal(admitted.schema, 'haunted-phonograph/storyship-result/v0');
      assert.equal(admitted.result, result);
      assert.equal(admitted.target, target);
      assert.deepEqual(admitted.basis_event_ids, []);
      assert.deepEqual(admitted.reason_codes, []);
      assert.equal(admitted.authority, 'machine-test-only');
      assert.equal(admitted.owner_gate_status, 'not-constituted');
      assert.match(admitted.result_id, SHA256_PATTERN);
      assert(Object.isFrozen(admitted));
      assert(Object.isFrozen(admitted.basis_event_ids));
      assert(Object.isFrozen(admitted.reason_codes));
      assert.equal(validateStoryshipResult(admitted), true);
    }
  }
});

test('typed results reject free-form enums, unsupported keys, duplicate refs, and self-identity mutation', () => {
  assert.throws(
    () => createStoryshipResult({ result: 'passes', target: 'continuity_law', basis_event_ids: [], reason_codes: [] }),
    expectCode('INVALID_STORYSHIP_RESULT'),
  );
  assert.throws(
    () => createStoryshipResult({ result: 'supports', target: 'whole-law', basis_event_ids: [], reason_codes: [] }),
    expectCode('INVALID_STORYSHIP_RESULT'),
  );
  assert.throws(
    () => createStoryshipResult({
      result: 'supports',
      target: 'continuity_law',
      basis_event_ids: ['sha256:' + '1'.repeat(64), 'sha256:' + '1'.repeat(64)],
      reason_codes: [],
    }),
    expectCode('INVALID_STORYSHIP_RESULT'),
  );
  assert.throws(
    () => createStoryshipResult({
      result: 'supports',
      target: 'continuity_law',
      basis_event_ids: [],
      reason_codes: ['fixture-pass'],
      authority: 'owner-law',
    }),
    expectCode('INVALID_STORYSHIP_RESULT'),
  );

  const admitted = createStoryshipResult({
    result: 'supports',
    target: 'continuity_law',
    basis_event_ids: [],
    reason_codes: ['fixture-pass'],
  });
  assert.throws(
    () => validateStoryshipResult({ ...clone(admitted), result_id: `sha256:${'0'.repeat(64)}` }),
    expectCode('INVALID_STORYSHIP_RESULT'),
  );
});
