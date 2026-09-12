import test from 'node:test';
import assert from 'node:assert/strict';
import { admitAcousticLocusDeclaration } from '../src/acoustic-locus.mjs';

const BASE = {
  schema: 'haunted-phonograph/acoustic-locus-declaration/v1',
  locusId: 'open-e-001',
  relation: {
    kind: 'declared-auditory-relation',
    description: 'open-E landmark relation survives renderer change',
  },
  originalWorldRef: 'world:porch:t0',
  laterWorldRef: 'world:road:t1',
};

test('admits a bounded acoustic locus declaration deterministically', () => {
  const a = admitAcousticLocusDeclaration(BASE);
  const b = admitAcousticLocusDeclaration(structuredClone(BASE));
  assert.equal(a.declarationHash, b.declarationHash);
  assert.equal(a.locusId, 'open-e-001');
  assert(Object.isFrozen(a));
  assert(Object.isFrozen(a.relation));
});

test('requires distinct attributable world refs', () => {
  assert.throws(
    () => admitAcousticLocusDeclaration({ ...BASE, laterWorldRef: BASE.originalWorldRef }),
    error => error.code === 'INVALID_ACOUSTIC_LOCUS_DECLARATION',
  );
});

test('does not accept ancestry or authority verdicts in the declaration', () => {
  for (const field of ['descendsFrom', 'ancestry', 'authority', 'verdict']) {
    assert.throws(
      () => admitAcousticLocusDeclaration({ ...BASE, [field]: 'not-allowed' }),
      error => error.code === 'INVALID_ACOUSTIC_LOCUS_DECLARATION',
    );
  }
});
