import test from 'node:test';
import assert from 'node:assert/strict';

import { hashCanonical } from '../src/provenance.mjs';
import { validateHauntCapsule } from '../src/haunt-capsule.mjs';
import { derivePhonographHauntCapsule } from '../src/haunt-return.mjs';

function completedReceipt() {
  return Object.freeze({
    schema: 'haunted-phonograph/receipt/v1',
    status: 'completed',
    sourceHash: 'sha256:source',
    retainedUncertaintyRefs: ['sha256:harmony-uncertainty'],
    hauntInfluence: {
      policy: 'haunt-proposal-influence/v1',
      stream: 'haunt/mutation-path/v1',
      orderedCapsuleIds: ['sha256:toaster-memory'],
      consumedCapsuleIds: ['sha256:toaster-memory'],
      ignored: [],
      routePressure: 'late-bloom',
    },
  });
}

test('derives an influence-only Phonograph capsule from completed encounter residue', () => {
  const receipt = completedReceipt();
  const returned = derivePhonographHauntCapsule({
    receipt,
    unresolved: [{
      subject: 'harmony-quality',
      alternatives: ['major', 'sus'],
      evidenceRefs: [...receipt.retainedUncertaintyRefs],
    }],
    refusedRefs: ['proposal-world:forbidden-range'],
  });

  assert.equal(validateHauntCapsule(returned), true);
  assert.equal(returned.origin.appliance, 'haunted-phonograph');
  assert.equal(returned.origin.policy, 'phonograph-haunt-return/v1');
  assert.equal(returned.provenance.authority, 'influence-only');
  assert.equal(returned.sourceRef, receipt.sourceHash);
  assert.equal(returned.encounterRef, hashCanonical(receipt));
  assert.equal(returned.origin.receiptRef, hashCanonical(receipt));
  assert.deepEqual(returned.lineage.influenceOnlyRefs, ['sha256:toaster-memory']);
  assert.deepEqual(returned.lineage.refusedRefs, ['proposal-world:forbidden-range']);
  assert.deepEqual(returned.unresolved[0].evidenceRefs, receipt.retainedUncertaintyRefs);
  assert.deepEqual(returned.relations, [{
    relation: 'memory-influenced-late-bloom',
    direction: 'positive',
    strength: 1,
    evidenceRefs: [hashCanonical(receipt)],
  }]);
  assert.deepEqual(returned.invitations, []);
  assert.equal(Object.hasOwn(returned, 'evidence'), false);
});

test('refuses to derive return memory from a non-completed receipt', () => {
  const receipt = { ...completedReceipt(), status: 'failed' };
  assert.throws(
    () => derivePhonographHauntCapsule({ receipt }),
    error => error?.code === 'HAUNT_RETURN_INVALID_RECEIPT',
  );
});

test('preserves unresolved alternatives as residue without promoting them to source truth', () => {
  const receipt = completedReceipt();
  const unresolved = [{
    subject: 'harmony-quality',
    alternatives: ['major', 'sus'],
    evidenceRefs: ['sha256:harmony-uncertainty'],
  }];
  const returned = derivePhonographHauntCapsule({ receipt, unresolved });
  assert.deepEqual(returned.unresolved, unresolved);
  assert.equal(returned.provenance.authority, 'influence-only');
  assert.equal(Object.hasOwn(returned, 'observationAuthorities'), false);
});
