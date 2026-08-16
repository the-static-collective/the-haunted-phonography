const CLAIM_SCHEMA = 'haunted-phonograph/provenance-claim/v1';
const AUTHORITY_CLASSES = new Set(['evidence', 'uncertainty', 'proposal']);

export const UNKNOWN = Object.freeze({ state: 'unknown' });

function fail(code, message) {
  const error = new TypeError(message);
  error.code = code;
  throw error;
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeJson(value, path = '$') {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      fail('INVALID_JSON_VALUE', `${path} must contain only finite numbers`);
    }
    return Object.is(value, -0) ? 0 : value;
  }

  if (Array.isArray(value)) {
    const normalized = [];
    for (let index = 0; index < value.length; index += 1) {
      if (!(index in value)) {
        fail('INVALID_JSON_VALUE', `${path} must not contain sparse arrays`);
      }
      normalized.push(normalizeJson(value[index], `${path}[${index}]`));
    }
    return normalized;
  }

  if (!isPlainObject(value) || Object.getOwnPropertySymbols(value).length > 0) {
    fail('INVALID_JSON_VALUE', `${path} must contain only JSON-safe plain objects`);
  }

  const normalized = {};
  for (const key of Object.keys(value)) {
    normalized[key] = normalizeJson(value[key], `${path}.${key}`);
  }
  return normalized;
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail('INVALID_PROVENANCE', `${label} must be a non-empty string`);
  }
  return value;
}

function requireRefs(value, label, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    fail('INVALID_PROVENANCE', `${label} must be ${allowEmpty ? 'an' : 'a non-empty'} array`);
  }
  return value.map((ref, index) => requireString(ref, `${label}[${index}]`));
}

function requireVersionedIdentity(value, label) {
  if (!isPlainObject(value)) {
    fail('INVALID_PROVENANCE', `${label} must be an object`);
  }
  requireString(value.id, `${label}.id`);
  requireString(value.version, `${label}.version`);
  return value;
}

function requireIdentity(value, label) {
  if (!isPlainObject(value)) {
    fail('INVALID_PROVENANCE', `${label} must be an object`);
  }
  requireString(value.id, `${label}.id`);
  return value;
}

function isUnknown(value) {
  return isPlainObject(value)
    && Object.keys(value).length === 1
    && value.state === 'unknown';
}

function assertExactKeys(record, allowedKeys) {
  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) {
      fail('INVALID_CLAIM', `claim field ${key} is not valid for ${record.authority}`);
    }
  }
}

function validateNormalizedClaim(record) {
  if (!isPlainObject(record) || record.schema !== CLAIM_SCHEMA) {
    fail('INVALID_CLAIM', `claim must use schema ${CLAIM_SCHEMA}`);
  }

  if (!AUTHORITY_CLASSES.has(record.authority)) {
    fail('INVALID_AUTHORITY', 'claim authority must be evidence, uncertainty, or proposal');
  }

  requireString(record.subject, 'subject');

  if (!Object.hasOwn(record, 'value')) {
    fail('INVALID_CLAIM', 'claim must contain value');
  }

  if (record.authority === 'evidence') {
    assertExactKeys(record, new Set(['schema', 'authority', 'subject', 'value', 'sourceRefs', 'method']));
    requireRefs(record.sourceRefs, 'sourceRefs');
    requireVersionedIdentity(record.method, 'method');
    if (isUnknown(record.value)) {
      fail('INVALID_PROVENANCE', 'exact evidence cannot use the unknown marker');
    }
    return true;
  }

  if (record.authority === 'uncertainty') {
    assertExactKeys(record, new Set(['schema', 'authority', 'subject', 'value', 'sourceRefs', 'method', 'uncertainty']));
    requireRefs(record.sourceRefs, 'sourceRefs');
    requireVersionedIdentity(record.method, 'method');
    return true;
  }

  assertExactKeys(record, new Set(['schema', 'authority', 'subject', 'value', 'parentRefs', 'proposer', 'policy']));
  requireRefs(record.parentRefs, 'parentRefs', { allowEmpty: true });
  requireIdentity(record.proposer, 'proposer');
  requireVersionedIdentity(record.policy, 'policy');
  return true;
}

function admitClaim(record) {
  const normalized = normalizeJson(record);
  validateNormalizedClaim(normalized);
  return deepFreeze(normalized);
}

export function createEvidence({ subject, value, sourceRefs, method }) {
  return admitClaim({
    schema: CLAIM_SCHEMA,
    authority: 'evidence',
    subject,
    value,
    sourceRefs,
    method,
  });
}

export function createUncertainty({ subject, value = UNKNOWN, sourceRefs, method, uncertainty }) {
  const record = {
    schema: CLAIM_SCHEMA,
    authority: 'uncertainty',
    subject,
    value,
    sourceRefs,
    method,
  };
  if (uncertainty !== undefined) {
    record.uncertainty = uncertainty;
  }
  return admitClaim(record);
}

export function createProposal({ subject, value, parentRefs = [], proposer, policy }) {
  return admitClaim({
    schema: CLAIM_SCHEMA,
    authority: 'proposal',
    subject,
    value,
    parentRefs,
    proposer,
    policy,
  });
}

export function validateClaim(claim) {
  const normalized = normalizeJson(claim);
  return validateNormalizedClaim(normalized);
}
