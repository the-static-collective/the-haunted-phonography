import { hashCanonical } from './provenance.mjs';

const SCHEMA = 'haunted-phonograph/reentry-observation-declaration/v1';
const BASE_KEYS = new Set([
  'schema',
  'locusHash',
  'condition',
  'recognition',
  'worldAssessment',
  'confidence',
]);
const CONDITIONS = new Set(['A', 'B', 'C', 'D']);
const RECOGNITIONS = new Set(['recognized', 'not-recognized', 'unresolved']);
const WORLD_ASSESSMENTS = new Set(['same', 'changed', 'unrelated', 'unresolved']);

function fail(message) {
  const error = new TypeError(message);
  error.code = 'INVALID_REENTRY_OBSERVATION';
  throw error;
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

function validateDeclarationKeys(declaration) {
  if (!isPlainObject(declaration) || Object.getOwnPropertySymbols(declaration).length > 0) {
    fail('observation declaration must be a plain JSON object');
  }
  const allowed = new Set(BASE_KEYS);
  allowed.add('latencyMs');
  const keys = Object.keys(declaration);
  const requiredCount = declaration.latencyMs === undefined ? BASE_KEYS.size : BASE_KEYS.size + 1;
  if (keys.length !== requiredCount || keys.some(key => !allowed.has(key))) {
    fail('observation declaration must contain only the exact v1 keys');
  }
  for (const key of BASE_KEYS) {
    if (!Object.hasOwn(declaration, key)) fail(`missing ${key}`);
  }
}

export function admitReentryObservation({ locus, declaration }) {
  validateDeclarationKeys(declaration);
  if (declaration.schema !== SCHEMA) fail('unsupported re-entry observation schema');
  if (!locus || typeof locus.declarationHash !== 'string') fail('admitted locus required');
  if (declaration.locusHash !== locus.declarationHash) fail('observation locusHash must match admitted locus');
  if (!CONDITIONS.has(declaration.condition)) fail('condition must be A, B, C, or D');
  if (!RECOGNITIONS.has(declaration.recognition)) fail('recognition is not admitted by Acoustic Loci 001');
  if (!WORLD_ASSESSMENTS.has(declaration.worldAssessment)) fail('worldAssessment is not admitted by Acoustic Loci 001');
  if (!Number.isFinite(declaration.confidence) || declaration.confidence < 0 || declaration.confidence > 1) {
    fail('confidence must be finite and between 0 and 1');
  }
  if (declaration.latencyMs !== undefined
    && (!Number.isFinite(declaration.latencyMs) || declaration.latencyMs < 0)) {
    fail('latencyMs must be a nonnegative finite number when present');
  }

  const canonical = {
    schema: declaration.schema,
    locusHash: declaration.locusHash,
    condition: declaration.condition,
    recognition: declaration.recognition,
    worldAssessment: declaration.worldAssessment,
    confidence: declaration.confidence,
  };
  if (declaration.latencyMs !== undefined) canonical.latencyMs = declaration.latencyMs;

  return freeze({
    ...canonical,
    observationHash: hashCanonical(canonical),
  });
}
