import { canonicalStringify, hashCanonical } from './provenance.mjs';
import {
  STORYSHIP_EVENT_TYPES,
  validateConstitutionReceipt,
  validateSourceCut,
} from './storyship-contract.mjs';

const EVENT_SCHEMA = 'haunted-phonograph/storyship-event/v0';
const EVENT_TYPE_SET = new Set(STORYSHIP_EVENT_TYPES);
const REALITY_RECORD_CLASSES = new Set([
  'raw-observation',
  'provider-observation',
  'human-observation',
  'protected-silence',
  'explicit-refusal',
  'known-prohibition',
  'missing-evidence',
  'inaccessible-source',
  'forgotten-metadata',
  'unresolved-branch-ownership',
]);
const BRANCH_STATUSES = new Set(['live', 'dormant', 'stopped']);
const UNCERTAINTY_STATUSES = new Set(['open', 'resolved', 'refused']);
const BRANCH_EFFECT_EVENT_TYPES = new Set([
  'voyage-created',
  'generation-observed',
  'continuation-recorded',
  'branch-composed',
  'voyage-stopped',
]);

const EVENT_INPUT_KEYS = new Set([
  'schema',
  'voyage_id',
  'event_seq',
  'event_type',
  'branch_id',
  'parent_state_ids',
  'constitution_id',
  'source_cut',
  'actor',
  'occurred_at_source_raw',
  'observed_at',
  'recorded_at',
  'payload',
  'reality_effects',
  'narrative_interpretations',
  'manifest_effects',
  'uncertainty',
  'authority',
  'previous_receipt_ids',
]);
const EVENT_KEYS = new Set([...EVENT_INPUT_KEYS, 'event_id']);
const ACTOR_KEYS = new Set(['owning_world', 'actor_id', 'role']);
const AUTHORITY_KEYS = new Set(['owning_world', 'scope']);
const REALITY_KEYS = new Set(['record_id', 'record_class', 'subject', 'value', 'source_cut_ids']);
const NARRATIVE_KEYS = new Set(['interpretation_id', 'text', 'basis_event_ids', 'authority_scope']);
const CARRIER_KEYS = new Set([
  'kind', 'effect_id', 'action', 'carrier_ref', 'narrative_relation_ids',
  'basis_event_ids', 'target_effect_id',
]);
const OPEN_BERTH_KEYS = new Set([
  'kind', 'effect_id', 'action', 'question_or_possibility', 'basis_event_ids',
  'allowed_scope', 'explicit_non_imports', 'opened_by', 'status', 'target_effect_id',
]);
const UNCERTAINTY_KEYS = new Set([
  'uncertainty_id', 'subject', 'alternatives', 'evidence_refs', 'status',
]);
const BRANCH_EFFECT_KEYS = new Set(['branch_id', 'parent_branch_ids', 'status']);
const ARTIFACT_KEYS = new Set(['artifact_id', 'provider_identity', 'content_digest']);

const LOAD_BEARING_PAYLOAD_KEYS = Object.freeze({
  'constitution-bound': new Set(['bound_constitution_id']),
  'source-bound': new Set(['bound_source_cut_ids']),
  'generation-requested': new Set(['request_ref', 'mode', 'provider_visible_fields', 'credit_debit']),
  'generation-observed': new Set(['request_event_id', 'artifact', 'branch_effects']),
  'encounter-recorded': new Set(['encounter_ref', 'artifact_refs', 'declaration']),
  'selection-recorded': new Set(['mechanism', 'selected_branch_ids', 'unselected_branch_ids']),
  'continuation-recorded': new Set(['selection_event_id', 'branch_effects']),
  'branch-composed': new Set(['composition_rule', 'branch_effects']),
  'packet-sealed': new Set(['packet_id', 'event_cut']),
  'customs-result-linked': new Set(['customs_receipt_id']),
  'correction-recorded': new Set(['corrects_event_ids', 'reason']),
});

function fail(code, message) {
  const error = new TypeError(message);
  error.code = code;
  throw error;
}

function eventFail(message) {
  fail('INVALID_STORYSHIP_EVENT', message);
}

function ledgerFail(message) {
  fail('INVALID_STORYSHIP_LEDGER', message);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(record, keys, label) {
  if (!isPlainObject(record) || Object.getOwnPropertySymbols(record).length > 0) {
    eventFail(`${label} must be a plain object`);
  }
  const actual = Object.keys(record);
  if (actual.length !== keys.size || actual.some(key => !keys.has(key))) {
    eventFail(`${label} must contain only the exact v0 keys`);
  }
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) eventFail(`${label} must be a non-empty string`);
  return value;
}

function requireNullableString(value, label) {
  if (value === null) return null;
  return requireString(value, label);
}

function requireSha256(value, label) {
  requireString(value, label);
  if (!/^sha256:[0-9a-f]{64}$/.test(value)) eventFail(`${label} must be a sha256 identity`);
  return value;
}

function requireInteger(value, label, { min = 0 } = {}) {
  if (!Number.isInteger(value) || value < min) eventFail(`${label} must be an integer >= ${min}`);
  return value;
}

function requireUniqueStrings(value, label, { identity = false } = {}) {
  if (!Array.isArray(value)) eventFail(`${label} must be an array`);
  const admitted = value.map((item, index) => identity
    ? requireSha256(item, `${label}[${index}]`)
    : requireString(item, `${label}[${index}]`));
  if (new Set(admitted).size !== admitted.length) eventFail(`${label} must not contain duplicates`);
  return admitted;
}

function requireRfc3339(value, label, { nullable = false } = {}) {
  if (nullable && value === null) return null;
  requireString(value, label);
  const pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
  if (!pattern.test(value) || Number.isNaN(Date.parse(value))) eventFail(`${label} must be a valid RFC 3339 string`);
  return value;
}

function canonicalClone(value, label) {
  try {
    return JSON.parse(canonicalStringify(value));
  } catch (error) {
    eventFail(`${label} must contain only canonical JSON: ${error.message}`);
  }
}

function requirePlainCanonicalRecord(value, label) {
  if (!isPlainObject(value) || Object.getOwnPropertySymbols(value).length > 0) {
    eventFail(`${label} must be a plain canonical JSON record`);
  }
  return canonicalClone(value, label);
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function validateActor(actor) {
  exactKeys(actor, ACTOR_KEYS, 'actor');
  return {
    owning_world: requireString(actor.owning_world, 'actor.owning_world'),
    actor_id: requireString(actor.actor_id, 'actor.actor_id'),
    role: requireString(actor.role, 'actor.role'),
  };
}

function validateAuthority(authority) {
  exactKeys(authority, AUTHORITY_KEYS, 'authority');
  return {
    owning_world: requireString(authority.owning_world, 'authority.owning_world'),
    scope: requireString(authority.scope, 'authority.scope'),
  };
}

function validateRealityEffect(effect, index) {
  exactKeys(effect, REALITY_KEYS, `reality_effects[${index}]`);
  requireString(effect.record_id, `reality_effects[${index}].record_id`);
  if (!REALITY_RECORD_CLASSES.has(effect.record_class)) {
    eventFail(`reality_effects[${index}].record_class is not admitted by Storyship v0`);
  }
  requireString(effect.subject, `reality_effects[${index}].subject`);
  const value = canonicalClone(effect.value, `reality_effects[${index}].value`);
  const sourceCutIds = requireUniqueStrings(effect.source_cut_ids, `reality_effects[${index}].source_cut_ids`, { identity: true });
  return {
    record_id: effect.record_id,
    record_class: effect.record_class,
    subject: effect.subject,
    value,
    source_cut_ids: sourceCutIds,
  };
}

function validateNarrativeInterpretation(record, index) {
  exactKeys(record, NARRATIVE_KEYS, `narrative_interpretations[${index}]`);
  return {
    interpretation_id: requireString(record.interpretation_id, `narrative_interpretations[${index}].interpretation_id`),
    text: requireString(record.text, `narrative_interpretations[${index}].text`),
    basis_event_ids: requireUniqueStrings(record.basis_event_ids, `narrative_interpretations[${index}].basis_event_ids`, { identity: true }),
    authority_scope: requireString(record.authority_scope, `narrative_interpretations[${index}].authority_scope`),
  };
}

function validateCarrierEffect(effect, index) {
  exactKeys(effect, CARRIER_KEYS, `manifest_effects[${index}]`);
  if (effect.kind !== 'carrier') eventFail(`manifest_effects[${index}].kind must be carrier`);
  if (!new Set(['carry', 'retire']).has(effect.action)) eventFail(`manifest_effects[${index}].action must be carry or retire`);
  requireString(effect.effect_id, `manifest_effects[${index}].effect_id`);
  requireString(effect.carrier_ref, `manifest_effects[${index}].carrier_ref`);
  const relationIds = requireUniqueStrings(effect.narrative_relation_ids, `manifest_effects[${index}].narrative_relation_ids`);
  const basisIds = requireUniqueStrings(effect.basis_event_ids, `manifest_effects[${index}].basis_event_ids`, { identity: true });
  if (effect.action === 'carry' && effect.target_effect_id !== null) {
    eventFail(`manifest_effects[${index}].target_effect_id must be null for carry`);
  }
  if (effect.action === 'retire') requireString(effect.target_effect_id, `manifest_effects[${index}].target_effect_id`);
  return {
    kind: 'carrier',
    effect_id: effect.effect_id,
    action: effect.action,
    carrier_ref: effect.carrier_ref,
    narrative_relation_ids: relationIds,
    basis_event_ids: basisIds,
    target_effect_id: effect.target_effect_id,
  };
}

function validateOpenBerthEffect(effect, index) {
  exactKeys(effect, OPEN_BERTH_KEYS, `manifest_effects[${index}]`);
  if (effect.kind !== 'open-berth') eventFail(`manifest_effects[${index}].kind must be open-berth`);
  const actionToStatus = { open: 'open', resolve: 'resolved', refuse: 'refused' };
  if (!Object.hasOwn(actionToStatus, effect.action)) eventFail(`manifest_effects[${index}].action is invalid`);
  if (effect.status !== actionToStatus[effect.action]) eventFail(`manifest_effects[${index}] action/status pair is invalid`);
  requireString(effect.effect_id, `manifest_effects[${index}].effect_id`);
  requireString(effect.question_or_possibility, `manifest_effects[${index}].question_or_possibility`);
  const basisIds = requireUniqueStrings(effect.basis_event_ids, `manifest_effects[${index}].basis_event_ids`, { identity: true });
  requireString(effect.allowed_scope, `manifest_effects[${index}].allowed_scope`);
  const nonImports = requireUniqueStrings(effect.explicit_non_imports, `manifest_effects[${index}].explicit_non_imports`);
  requireString(effect.opened_by, `manifest_effects[${index}].opened_by`);
  if (effect.action === 'open' && effect.target_effect_id !== null) {
    eventFail(`manifest_effects[${index}].target_effect_id must be null for open`);
  }
  if (effect.action !== 'open') requireString(effect.target_effect_id, `manifest_effects[${index}].target_effect_id`);
  return {
    kind: 'open-berth',
    effect_id: effect.effect_id,
    action: effect.action,
    question_or_possibility: effect.question_or_possibility,
    basis_event_ids: basisIds,
    allowed_scope: effect.allowed_scope,
    explicit_non_imports: nonImports,
    opened_by: effect.opened_by,
    status: effect.status,
    target_effect_id: effect.target_effect_id,
  };
}

function validateManifestEffect(effect, index) {
  if (!isPlainObject(effect)) eventFail(`manifest_effects[${index}] must be a plain object`);
  if (effect.kind === 'carrier') return validateCarrierEffect(effect, index);
  if (effect.kind === 'open-berth') return validateOpenBerthEffect(effect, index);
  eventFail(`manifest_effects[${index}].kind is not admitted by Storyship v0`);
}

function validateUncertainty(entry, index) {
  exactKeys(entry, UNCERTAINTY_KEYS, `uncertainty[${index}]`);
  if (!UNCERTAINTY_STATUSES.has(entry.status)) eventFail(`uncertainty[${index}].status is invalid`);
  return {
    uncertainty_id: requireString(entry.uncertainty_id, `uncertainty[${index}].uncertainty_id`),
    subject: requireString(entry.subject, `uncertainty[${index}].subject`),
    alternatives: requireUniqueStrings(entry.alternatives, `uncertainty[${index}].alternatives`),
    evidence_refs: requireUniqueStrings(entry.evidence_refs, `uncertainty[${index}].evidence_refs`),
    status: entry.status,
  };
}

function validateBranchEffects(value, eventType) {
  if (!Array.isArray(value)) eventFail('payload.branch_effects must be an array');
  if (!BRANCH_EFFECT_EVENT_TYPES.has(eventType)) eventFail(`${eventType} may not carry branch_effects`);
  return value.map((effect, index) => {
    exactKeys(effect, BRANCH_EFFECT_KEYS, `payload.branch_effects[${index}]`);
    if (!BRANCH_STATUSES.has(effect.status)) eventFail(`payload.branch_effects[${index}].status is invalid`);
    return {
      branch_id: requireString(effect.branch_id, `payload.branch_effects[${index}].branch_id`),
      parent_branch_ids: requireUniqueStrings(effect.parent_branch_ids, `payload.branch_effects[${index}].parent_branch_ids`),
      status: effect.status,
    };
  });
}

function validateArtifact(artifact) {
  exactKeys(artifact, ARTIFACT_KEYS, 'payload.artifact');
  requireSha256(artifact.artifact_id, 'payload.artifact.artifact_id');
  const providerIdentity = requireString(artifact.provider_identity, 'payload.artifact.provider_identity');
  const contentDigest = requireSha256(artifact.content_digest, 'payload.artifact.content_digest');
  const expected = hashCanonical({ provider_identity: providerIdentity, content_digest: contentDigest });
  if (artifact.artifact_id !== expected) eventFail('payload.artifact.artifact_id does not match provider identity plus bytes');
  return {
    artifact_id: artifact.artifact_id,
    provider_identity: providerIdentity,
    content_digest: contentDigest,
  };
}

function validateLoadBearingPayload(payload, eventType) {
  const exact = LOAD_BEARING_PAYLOAD_KEYS[eventType];
  if (exact) exactKeys(payload, exact, `payload for ${eventType}`);

  switch (eventType) {
    case 'constitution-bound':
      return { bound_constitution_id: requireSha256(payload.bound_constitution_id, 'payload.bound_constitution_id') };
    case 'source-bound':
      return { bound_source_cut_ids: requireUniqueStrings(payload.bound_source_cut_ids, 'payload.bound_source_cut_ids', { identity: true }) };
    case 'generation-requested': {
      requireString(payload.request_ref, 'payload.request_ref');
      if (payload.mode !== 'fixture-only') eventFail('payload.mode must be fixture-only in v0');
      if (payload.credit_debit !== 0) eventFail('payload.credit_debit must be zero in no-spend v0');
      return {
        request_ref: payload.request_ref,
        mode: 'fixture-only',
        provider_visible_fields: requirePlainCanonicalRecord(payload.provider_visible_fields, 'payload.provider_visible_fields'),
        credit_debit: 0,
      };
    }
    case 'generation-observed':
      return {
        request_event_id: requireSha256(payload.request_event_id, 'payload.request_event_id'),
        artifact: validateArtifact(payload.artifact),
        branch_effects: validateBranchEffects(payload.branch_effects, eventType),
      };
    case 'encounter-recorded':
      return {
        encounter_ref: requireString(payload.encounter_ref, 'payload.encounter_ref'),
        artifact_refs: requireUniqueStrings(payload.artifact_refs, 'payload.artifact_refs', { identity: true }),
        declaration: canonicalClone(payload.declaration, 'payload.declaration'),
      };
    case 'selection-recorded': {
      const selected = requireUniqueStrings(payload.selected_branch_ids, 'payload.selected_branch_ids');
      const unselected = requireUniqueStrings(payload.unselected_branch_ids, 'payload.unselected_branch_ids');
      if (selected.some(id => unselected.includes(id))) eventFail('selected and unselected branches must not overlap');
      return {
        mechanism: canonicalClone(payload.mechanism, 'payload.mechanism'),
        selected_branch_ids: selected,
        unselected_branch_ids: unselected,
      };
    }
    case 'continuation-recorded':
      return {
        selection_event_id: requireSha256(payload.selection_event_id, 'payload.selection_event_id'),
        branch_effects: validateBranchEffects(payload.branch_effects, eventType),
      };
    case 'branch-composed':
      return {
        composition_rule: canonicalClone(payload.composition_rule, 'payload.composition_rule'),
        branch_effects: validateBranchEffects(payload.branch_effects, eventType),
      };
    case 'packet-sealed':
      return {
        packet_id: requireSha256(payload.packet_id, 'payload.packet_id'),
        event_cut: requireInteger(payload.event_cut, 'payload.event_cut', { min: 1 }),
      };
    case 'customs-result-linked':
      return { customs_receipt_id: requireSha256(payload.customs_receipt_id, 'payload.customs_receipt_id') };
    case 'correction-recorded': {
      const ids = requireUniqueStrings(payload.corrects_event_ids, 'payload.corrects_event_ids', { identity: true });
      if (ids.length === 0) eventFail('payload.corrects_event_ids must not be empty');
      return { corrects_event_ids: ids, reason: requireString(payload.reason, 'payload.reason') };
    }
    default: {
      const admitted = requirePlainCanonicalRecord(payload, 'payload');
      if (Object.hasOwn(admitted, 'branch_effects')) {
        admitted.branch_effects = validateBranchEffects(admitted.branch_effects, eventType);
      }
      return admitted;
    }
  }
}

function validateSourceCuts(value) {
  if (!Array.isArray(value)) eventFail('source_cut must be an array');
  const cuts = value.map((cut, index) => {
    try {
      validateSourceCut(cut);
    } catch (error) {
      eventFail(`source_cut[${index}] is invalid: ${error.message}`);
    }
    return canonicalClone(cut, `source_cut[${index}]`);
  });
  cuts.sort((a, b) => a.source_cut_id.localeCompare(b.source_cut_id));
  if (new Set(cuts.map(cut => cut.source_cut_id)).size !== cuts.length) eventFail('source_cut must not contain duplicate identities');
  return cuts;
}

function validateEventInput(input) {
  exactKeys(input, EVENT_INPUT_KEYS, 'Storyship event input');
  if (input.schema !== EVENT_SCHEMA) eventFail(`schema must be ${EVENT_SCHEMA}`);
  const voyageId = requireString(input.voyage_id, 'voyage_id');
  const eventSeq = requireInteger(input.event_seq, 'event_seq', { min: 1 });
  if (!EVENT_TYPE_SET.has(input.event_type)) eventFail('event_type is not admitted by Storyship v0');
  const branchId = requireString(input.branch_id, 'branch_id');
  const parentStateIds = requireUniqueStrings(input.parent_state_ids, 'parent_state_ids', { identity: true });
  const constitutionId = requireSha256(input.constitution_id, 'constitution_id');
  const sourceCut = validateSourceCuts(input.source_cut);
  const actor = validateActor(input.actor);
  const occurredAtSourceRaw = requireNullableString(input.occurred_at_source_raw, 'occurred_at_source_raw');
  const observedAt = requireRfc3339(input.observed_at, 'observed_at', { nullable: true });
  const recordedAt = requireRfc3339(input.recorded_at, 'recorded_at');
  const payload = validateLoadBearingPayload(input.payload, input.event_type);
  if (Object.hasOwn(payload, 'branch_effects') && !BRANCH_EFFECT_EVENT_TYPES.has(input.event_type)) {
    eventFail(`${input.event_type} may not carry branch effects`);
  }
  const realityEffects = Array.isArray(input.reality_effects)
    ? input.reality_effects.map(validateRealityEffect)
    : eventFail('reality_effects must be an array');
  const narrativeInterpretations = Array.isArray(input.narrative_interpretations)
    ? input.narrative_interpretations.map(validateNarrativeInterpretation)
    : eventFail('narrative_interpretations must be an array');
  const manifestEffects = Array.isArray(input.manifest_effects)
    ? input.manifest_effects.map(validateManifestEffect)
    : eventFail('manifest_effects must be an array');
  const uncertainty = Array.isArray(input.uncertainty)
    ? input.uncertainty.map(validateUncertainty)
    : eventFail('uncertainty must be an array');
  const authority = validateAuthority(input.authority);
  const previousReceiptIds = requireUniqueStrings(input.previous_receipt_ids, 'previous_receipt_ids', { identity: true });

  return {
    schema: EVENT_SCHEMA,
    voyage_id: voyageId,
    event_seq: eventSeq,
    event_type: input.event_type,
    branch_id: branchId,
    parent_state_ids: parentStateIds,
    constitution_id: constitutionId,
    source_cut: sourceCut,
    actor,
    occurred_at_source_raw: occurredAtSourceRaw,
    observed_at: observedAt,
    recorded_at: recordedAt,
    payload,
    reality_effects: realityEffects,
    narrative_interpretations: narrativeInterpretations,
    manifest_effects: manifestEffects,
    uncertainty,
    authority,
    previous_receipt_ids: previousReceiptIds,
  };
}

export function createStoryshipEvent(input) {
  const admitted = validateEventInput(input);
  return deepFreeze(canonicalClone({
    ...admitted,
    event_id: hashCanonical(admitted),
  }, 'Storyship event'));
}

export function validateStoryshipEvent(event) {
  exactKeys(event, EVENT_KEYS, 'Storyship event');
  requireSha256(event.event_id, 'event_id');
  const input = Object.fromEntries([...EVENT_INPUT_KEYS].map(key => [key, event[key]]));
  const expected = createStoryshipEvent(input);
  if (event.event_id !== expected.event_id) eventFail('event_id does not match the admitted event envelope');
  const suppliedWithoutIdentity = Object.fromEntries([...EVENT_INPUT_KEYS].map(key => [key, event[key]]));
  const expectedWithoutIdentity = Object.fromEntries([...EVENT_INPUT_KEYS].map(key => [key, expected[key]]));
  if (canonicalStringify(suppliedWithoutIdentity) !== canonicalStringify(expectedWithoutIdentity)) {
    eventFail('event envelope is not in normalized admitted form');
  }
  return true;
}

function verifyLedgerEvents(events, constitutionId) {
  if (!Array.isArray(events) || events.length === 0) ledgerFail('events must be a non-empty array');
  let voyageId = null;
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    try {
      validateStoryshipEvent(event);
    } catch (error) {
      ledgerFail(`events[${index}] is invalid: ${error.message}`);
    }
    if (event.event_seq !== index + 1) ledgerFail('event_seq must start at 1 and increase by exactly 1');
    if (event.constitution_id !== constitutionId) ledgerFail('every event must bind the verified constitution');
    if (voyageId === null) voyageId = event.voyage_id;
    if (event.voyage_id !== voyageId) ledgerFail('every event must belong to one voyage_id');
  }
  return voyageId;
}

export function appendStoryshipEvent(events, input) {
  if (!Array.isArray(events)) ledgerFail('events must be an array');
  if (events.length > 0) {
    const constitutionId = events[0]?.constitution_id;
    if (typeof constitutionId !== 'string') ledgerFail('existing ledger has no constitution identity');
    verifyLedgerEvents(events, constitutionId);
  }
  let next;
  try {
    next = createStoryshipEvent(input);
  } catch (error) {
    if (error?.code === 'INVALID_STORYSHIP_EVENT') throw error;
    ledgerFail(`cannot create next event: ${error.message}`);
  }
  const expectedSeq = events.length + 1;
  if (next.event_seq !== expectedSeq) ledgerFail(`next event_seq must be ${expectedSeq}`);
  if (events.length > 0) {
    if (next.voyage_id !== events[0].voyage_id) ledgerFail('next event must preserve voyage_id');
    if (next.constitution_id !== events[0].constitution_id) ledgerFail('next event must preserve constitution_id');
  }
  const copied = events.map((event, index) => {
    try {
      return canonicalClone(event, `events[${index}]`);
    } catch (error) {
      ledgerFail(error.message);
    }
  });
  copied.push(canonicalClone(next, 'next event'));
  return deepFreeze(copied);
}

export function verifyStoryshipLedger({ constitution, events } = {}) {
  try {
    validateConstitutionReceipt(constitution);
  } catch (error) {
    ledgerFail(`constitution is invalid: ${error.message}`);
  }
  const voyageId = verifyLedgerEvents(events, constitution.constitution_id);
  const summary = {
    voyage_id: voyageId,
    constitution_id: constitution.constitution_id,
    event_count: events.length,
    tip_event_id: events.at(-1).event_id,
  };
  return deepFreeze(summary);
}
