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
  if (!isPlainObject(relation)) fail('HAUNT_INVALID_CAPSULE', `relations[${index}] must be an object`);
  requireString(relation.relation, `relations[${index}].relation`);
  requireString(relation.direction, `relations[${index}].direction`);
  requireStrength(relation.strength, `relations[${index}].strength`);
  requireStringArray(relation.evidenceRefs, `relations[${index}].evidenceRefs`);
}

function validateInvitation(invitation, index) {
  if (!isPlainObject(invitation)) fail('HAUNT_INVALID_CAPSULE', `invitations[${index}] must be an object`);
  requireString(invitation.pressure, `invitations[${index}].pressure`);
  requireStrength(invitation.strength, `invitations[${index}].strength`);
  if (!Array.isArray(invitation.allowedSurfaces)
    || invitation.allowedSurfaces.length !== 1
    || invitation.allowedSurfaces[0] !== 'mutation-path') {
    fail('HAUNT_FORBIDDEN_SURFACE', 'HAUNT v0.1 permits only the mutation-path influence surface');
  }
}

function validateLineage(lineage) {
  if (!isPlainObject(lineage)) fail('HAUNT_INVALID_CAPSULE', 'lineage must be an object');
  requireStringArray(lineage.parentRefs, 'lineage.parentRefs');
  requireStringArray(lineage.influenceOnlyRefs, 'lineage.influenceOnlyRefs');
  requireStringArray(lineage.refusedRefs, 'lineage.refusedRefs');
}

function validateUnresolved(unresolved, index) {
  if (!isPlainObject(unresolved)) fail('HAUNT_INVALID_CAPSULE', `unresolved[${index}] must be an object`);
  requireString(unresolved.subject, `unresolved[${index}].subject`);
  if (!Array.isArray(unresolved.alternatives)) {
    fail('HAUNT_INVALID_CAPSULE', `unresolved[${index}].alternatives must be an array`);
  }
  unresolved.alternatives.forEach((value, altIndex) => {
    requireString(value, `unresolved[${index}].alternatives[${altIndex}]`);
  });
  requireStringArray(unresolved.evidenceRefs, `unresolved[${index}].evidenceRefs`);
}

export function hashHauntCapsule(capsule) {
  if (!isPlainObject(capsule)) fail('HAUNT_INVALID_CAPSULE', 'capsule must be an object');
  const { capsuleId: _capsuleId, ...identityBody } = capsule;
  return hashCanonical(identityBody);
}

export function validateHauntCapsule(capsule) {
  if (!isPlainObject(capsule) || capsule.schema !== HAUNT_CAPSULE_SCHEMA) {
    fail('HAUNT_INVALID_CAPSULE', `capsule must use schema ${HAUNT_CAPSULE_SCHEMA}`);
  }
  requireString(capsule.capsuleId, 'capsuleId');
  requireString(capsule.sourceRef, 'sourceRef');
  requireString(capsule.encounterRef, 'encounterRef');

  if (!isPlainObject(capsule.origin)) fail('HAUNT_INVALID_CAPSULE', 'origin must be an object');
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

  if (!isPlainObject(capsule.provenance)) fail('HAUNT_INVALID_CAPSULE', 'provenance must be an object');
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
