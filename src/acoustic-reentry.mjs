import { hashCanonical } from './provenance.mjs';

const SCHEMA = 'haunted-phonograph/acoustic-reentry-result/v1';
const CONDITIONS = ['A', 'B', 'C', 'D'];

function fail(message) {
  const error = new TypeError(message);
  error.code = 'INVALID_ACOUSTIC_REENTRY';
  throw error;
}

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

function normalizeObservations(locus, observations) {
  if (!locus || typeof locus.declarationHash !== 'string') fail('admitted locus required');
  if (!Array.isArray(observations) || observations.length !== 4) fail('exactly four observations required');

  const byCondition = new Map();
  for (const observation of observations) {
    if (!observation || typeof observation !== 'object') fail('observation must be admitted object');
    if (!CONDITIONS.includes(observation.condition)) fail('observation condition must be A B C or D');
    if (observation.locusHash !== locus.declarationHash) fail('observation must bind the admitted locus');
    if (typeof observation.observationHash !== 'string') fail('observationHash required');
    if (byCondition.has(observation.condition)) fail('duplicate observation condition');
    byCondition.set(observation.condition, observation);
  }
  if (CONDITIONS.some(condition => !byCondition.has(condition))) fail('A B C and D are all required');
  return CONDITIONS.map(condition => byCondition.get(condition));
}

export function evaluateAcousticReentry({ locus, observations }) {
  const [A, B, C, D] = normalizeObservations(locus, observations);

  let verdict;
  let reasons;

  if (D.recognition === 'recognized') {
    verdict = 'refuses';
    reasons = ['unrelated-control-recognized'];
  } else if (B.worldAssessment === 'same') {
    verdict = 'refuses';
    reasons = ['transformed-cue-assessed-same-world'];
  } else if (
    A.recognition === 'recognized'
    && B.recognition === 'recognized'
    && B.worldAssessment === 'changed'
    && C.recognition !== 'recognized'
    && D.recognition !== 'recognized'
  ) {
    verdict = 'supports-bounded-reentry';
    reasons = ['declared-pattern-satisfied'];
  } else {
    verdict = 'insufficient';
    reasons = ['declared-pattern-not-satisfied'];
  }

  const conditionHashes = {
    A: A.observationHash,
    B: B.observationHash,
    C: C.observationHash,
    D: D.observationHash,
  };
  const canonical = {
    schema: SCHEMA,
    locusHash: locus.declarationHash,
    conditionHashes,
    verdict,
    reasons,
  };

  return freeze({
    ...canonical,
    resultHash: hashCanonical(canonical),
  });
}
