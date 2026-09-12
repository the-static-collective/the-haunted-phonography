import { hashCanonical } from './provenance.mjs';

const SCHEMA = 'haunted-phonograph/acoustic-locus-declaration/v1';
const ALLOWED_KEYS = new Set([
  'schema',
  'locusId',
  'relation',
  'originalWorldRef',
  'laterWorldRef',
]);
const RELATION_KEYS = new Set(['kind', 'description']);

function fail(message) {
  const error = new TypeError(message);
  error.code = 'INVALID_ACOUSTIC_LOCUS_DECLARATION';
  throw error;
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function requireExactKeys(value, expected, label) {
  if (!isPlainObject(value) || Object.getOwnPropertySymbols(value).length > 0) {
    fail(`${label} must be a plain JSON object`);
  }
  const keys = Object.keys(value);
  if (keys.length !== expected.size || keys.some(key => !expected.has(key))) {
    fail(`${label} must contain only the exact v1 keys`);
  }
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) fail(`${label} required`);
  return value;
}

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

export function admitAcousticLocusDeclaration(declaration) {
  requireExactKeys(declaration, ALLOWED_KEYS, 'acoustic locus declaration');
  if (declaration.schema !== SCHEMA) fail('unsupported acoustic locus schema');
  requireString(declaration.locusId, 'locusId');
  requireExactKeys(declaration.relation, RELATION_KEYS, 'relation');
  requireString(declaration.relation.kind, 'relation.kind');
  requireString(declaration.relation.description, 'relation.description');
  requireString(declaration.originalWorldRef, 'originalWorldRef');
  requireString(declaration.laterWorldRef, 'laterWorldRef');
  if (declaration.originalWorldRef === declaration.laterWorldRef) fail('world refs must remain distinct');

  const canonical = {
    schema: declaration.schema,
    locusId: declaration.locusId,
    relation: {
      kind: declaration.relation.kind,
      description: declaration.relation.description,
    },
    originalWorldRef: declaration.originalWorldRef,
    laterWorldRef: declaration.laterWorldRef,
  };

  return freeze({
    ...canonical,
    declarationHash: hashCanonical(canonical),
  });
}
