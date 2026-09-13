import test from 'node:test';
import assert from 'node:assert/strict';
import { admitAcousticLocusDeclaration } from '../src/acoustic-locus.mjs';
import { admitReentryObservation } from '../src/reentry-observation.mjs';
import { evaluateAcousticReentry } from '../src/acoustic-reentry.mjs';

const locus = admitAcousticLocusDeclaration({
  schema: 'haunted-phonograph/acoustic-locus-declaration/v1',
  locusId: 'open-e-001',
  relation: { kind: 'declared-auditory-relation', description: 'landmark relation across renderer change' },
  originalWorldRef: 'world:porch:t0',
  laterWorldRef: 'world:road:t1',
});

function observation(condition, recognition, worldAssessment) {
  return admitReentryObservation({
    locus,
    declaration: {
      schema: 'haunted-phonograph/reentry-observation-declaration/v1',
      locusHash: locus.declarationHash,
      condition,
      recognition,
      worldAssessment,
      confidence: 0.9,
    },
  });
}

function baseSet() {
  return [
    observation('A', 'recognized', 'same'),
    observation('B', 'recognized', 'changed'),
    observation('C', 'not-recognized', 'changed'),
    observation('D', 'not-recognized', 'unrelated'),
  ];
}

test('returns support for the declared A B C D pattern', () => {
  const result = evaluateAcousticReentry({ locus, observations: baseSet() });
  assert.equal(result.verdict, 'supports-bounded-reentry');
  assert.deepEqual(Object.keys(result.conditionHashes), ['A', 'B', 'C', 'D']);
  assert.match(result.resultHash, /^sha256:[0-9a-f]{64}$/);
});

test('returns refusal when D is recognized', () => {
  const observations = baseSet().map(item => item.condition === 'D' ? observation('D', 'recognized', 'unrelated') : item);
  assert.equal(evaluateAcousticReentry({ locus, observations }).verdict, 'refuses');
});

test('returns refusal when B is assessed as same world', () => {
  const observations = baseSet().map(item => item.condition === 'B' ? observation('B', 'recognized', 'same') : item);
  assert.equal(evaluateAcousticReentry({ locus, observations }).verdict, 'refuses');
});

test('returns insufficient for other partial patterns', () => {
  const observations = baseSet().map(item => item.condition === 'C' ? observation('C', 'recognized', 'changed') : item);
  assert.equal(evaluateAcousticReentry({ locus, observations }).verdict, 'insufficient');
});

test('is invariant to observation input order', () => {
  const observations = baseSet();
  const a = evaluateAcousticReentry({ locus, observations });
  const b = evaluateAcousticReentry({ locus, observations: [...observations].reverse() });
  assert.equal(a.resultHash, b.resultHash);
  assert.deepEqual(a.conditionHashes, b.conditionHashes);
});

test('requires exactly one A B C and D observation', () => {
  const observations = baseSet();
  assert.throws(() => evaluateAcousticReentry({ locus, observations: observations.slice(0, 3) }));
  assert.throws(() => evaluateAcousticReentry({ locus, observations: [...observations, observations[0]] }));
});
