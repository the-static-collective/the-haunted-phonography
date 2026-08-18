import { hashCanonical } from './provenance.mjs';

export const HAUNT_CAPSULE_SCHEMA = 'static-collective/haunt-memory-capsule/v1';
const CANONICAL_POLICY = 'haunt-memory-capsule/v1';

function fail(code, message) {
  const error = new TypeError(message);
  error.code = code;
  throw error;
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function assertExactKeys(value, allowedKeys, label) {
  if (!isPlainObject(value)) fail('HAUNT_INVALID_CAPSULE', `${label} must be an object`);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      fail('HAUNT_INVALID_CAPSULE', `${label} field ${key} is not declared by HAUNT v0.1`);
    }
  }
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail('HAUNT_INVALID_CAPSULE', `${label} must be a non-empty string`);
  }
}

function requireStringArray(value, label) {
  if (!Array.isArray(value)) fail('HAUNT_INVALID_CAPSULE', `${label} must be an array`);
  value.forEach((item, index) => requireString(item, `${label}[${index}]`));
}

function requireStrength(value, label) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    fail('HAUNT_INVALID_STRENGTH', `${label} must be a finite number in 0..1`);
  }
}

function validateRelation(relation, index) {
  const label = `relations[${index}]`;
  assertExactKeys(relation, new Set(['relation', 'direction', 'strength', 'evidenceRefs']), label);
  requireString(relation.relation, `${label}.relation`);
  requireString(relation.direction, `${label}.direction`);
  requireStrength(relation.strength, `${label}.strength`);
  requireStringArray(relation.evidenceRefs, `${label}.evidenceRefs`);
}

function validateInvitation(invitation, index) {
  const label = `invitations[${index}]`;
  assertExactKeys(invitation, new Set(['pressure', 'strength', 'allowedSurfaces']), label);
  requireString(invitation.pressure, `${label}.pressure`);
  requireStrength(invitation.strength, `${label}.strength`);
  if (!Array.isArray(invitation.allowedSurfaces)
    || invitation.allowedSurfaces.length !== 1
    || invitation.allowedSurfaces[0] !== 'mutation-path') {
    fail('HAUNT_FORBIDDEN_SURFACE', 'HAUNT v0.1 permits only the mutation-path influence surface');
  }
}

function validateLineage(lineage) {
  assertExactKeys(lineage, new Set(['parentRefs', 'influenceOnlyRefs', 'refusedRefs']), 'lineage');
  requireStringArray(lineage.parentRefs, 'lineage.parentRefs');
  requireStringArray(lineage.influenceOnlyRefs, 'lineage.influenceOnlyRefs');
  requireStringArray(lineage.refusedRefs, 'lineage.refusedRefs');
}

function validateUnresolved(unresolved, index) {
  const label = `unresolved[${index}]`;
  assertExactKeys(unresolved, new Set(['subject', 'alternatives', 'evidenceRefs']), label);
  requireString(unresolved.subject, `${label}.subject`);
  if (!Array.isArray(unresolved.alternatives)) {
    fail('HAUNT_INVALID_CAPSULE', `${label}.alternatives must be an array`);
  }
  unresolved.alternatives.forEach((value, altIndex) => {
    requireString(value, `${label}.alternatives[${altIndex}]`);
  });
  requireStringArray(unresolved.evidenceRefs, `${label}.evidenceRefs`);
}

export function hashHauntCapsule(capsule) {
  if (!isPlainObject(capsule)) fail('HAUNT_INVALID_CAPSULE', 'capsule must be an object');
  const { capsuleId: _capsuleId, ...identityBody } = capsule;
  return hashCanonical(identityBody);
}

export function validateHauntCapsule(capsule) {
  assertExactKeys(
    capsule,
    new Set([
      'schema',
      'capsuleId',
      'sourceRef',
      'encounterRef',
      'origin',
      'relations',
      'lineage',
      'unresolved',
      'invitations',
      'provenance',
    ]),
    'capsule',
  );
  if (capsule.schema !== HAUNT_CAPSULE_SCHEMA) {
    fail('HAUNT_INVALID_CAPSULE', `capsule must use schema ${HAUNT_CAPSULE_SCHEMA}`);
  }
  requireString(capsule.capsuleId, 'capsuleId');
  requireString(capsule.sourceRef, 'sourceRef');
  requireString(capsule.encounterRef, 'encounterRef');

  assertExactKeys(capsule.origin, new Set(['appliance', 'receiptRef', 'policy']), 'origin');
  requireString(capsule.origin.appliance, 'origin.appliance');
  requireString(capsule.origin.receiptRef, 'origin.receiptRef');
  requireString(capsule.origin.policy, 'origin.policy');

  if (!Array.isArray(capsule.relations)) fail('HAUNT_INVALID_CAPSULE', 'relations must be an array');
  capsule.relations.forEach(validateRelation);
  if (!Array.isArray(capsule.invitations)) fail('HAUNT_INVALID_CAPSULE', 'invitations must be an array');
  capsule.invitations.forEach(validateInvitation);
  validateLineage(capsule.lineage);
  if (!Array.isArray(capsule.unresolved)) fail('HAUNT_INVALID_CAPSULE', 'unresolved must be an array');
  capsule.unresolved.forEach(validateUnresolved);

  assertExactKeys(capsule.provenance, new Set(['authority', 'derivedFrom', 'canonicalPolicy']), 'provenance');
  if (capsule.provenance.authority !== 'influence-only') {
    fail('HAUNT_AUTHORITY_VIOLATION', 'sibling HAUNT memory must remain influence-only');
  }
  requireStringArray(capsule.provenance.derivedFrom, 'provenance.derivedFrom');
  if (capsule.provenance.canonicalPolicy !== CANONICAL_POLICY) {
    fail('HAUNT_INVALID_CAPSULE', `canonicalPolicy must be ${CANONICAL_POLICY}`);
  }

  const expectedIdentity = hashHauntCapsule(capsule);
  if (capsule.capsuleId !== expectedIdentity) {
    fail('HAUNT_IDENTITY_MISMATCH', 'capsuleId does not match canonical capsule content');
  }
  return true;
}

export function createHauntCapsule({
  sourceRef,
  encounterRef,
  origin,
  relations = [],
  invitations = [],
  lineage = { parentRefs: [], influenceOnlyRefs: [], refusedRefs: [] },
  unresolved = [],
  derivedFrom = [],
}) {
  const body = {
    schema: HAUNT_CAPSULE_SCHEMA,
    sourceRef,
    encounterRef,
    origin: structuredClone(origin),
    relations: structuredClone(relations),
    lineage: structuredClone(lineage),
    unresolved: structuredClone(unresolved),
    invitations: structuredClone(invitations),
    provenance: {
      authority: 'influence-only',
      derivedFrom: structuredClone(derivedFrom),
      canonicalPolicy: CANONICAL_POLICY,
    },
  };
  const capsule = { ...body, capsuleId: hashCanonical(body) };
  validateHauntCapsule(capsule);
  return deepFreeze(capsule);
}
