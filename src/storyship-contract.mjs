import { canonicalStringify, hashCanonical } from './provenance.mjs';

const CONSTITUTION_SCHEMA = 'haunted-phonograph/storyship-constitution-receipt/v0';
const SOURCE_CUT_SCHEMA = 'haunted-phonograph/storyship-source-cut/v0';
const RESULT_SCHEMA = 'haunted-phonograph/storyship-result/v0';

export const STORYSHIP_CANONICALIZATION_POLICY = 'hp-canonical-json-v1';

export const STORYSHIP_EVENT_TYPES = Object.freeze([
  'voyage-created',
  'constitution-bound',
  'source-bound',
  'packet-sealed',
  'generation-requested',
  'generation-observed',
  'encounter-recorded',
  'selection-recorded',
  'continuation-recorded',
  'branch-composed',
  'interpretation-recorded',
  'residue-recorded',
  'correction-recorded',
  'customs-result-linked',
  'checkpoint-sealed',
  'voyage-stopped',
]);

export const STORYSHIP_RESULT_VALUES = Object.freeze([
  'supports',
  'refuses',
  'unresolved',
]);

export const STORYSHIP_RESULT_TARGETS = Object.freeze([
  'passenger_claim',
  'lineage_claim',
  'source_binding',
  'packet_mapping',
  'observation_method',
  'selection_abstraction',
  'continuity_law',
  'destination_admission',
]);

export const STORYSHIP_FORBIDDEN_BERTH_CLASSES = Object.freeze([
  'missing raw evidence',
  'inaccessible source',
  'protected silence',
  'explicit refusal',
  'known prohibition',
  'forgotten metadata',
  'unresolved branch ownership',
]);

const RESULT_VALUE_SET = new Set(STORYSHIP_RESULT_VALUES);
const RESULT_TARGET_SET = new Set(STORYSHIP_RESULT_TARGETS);
const SOURCE_AVAILABILITY = new Set(['available', 'inaccessible', 'unknown']);
const EVIDENCE_CLASSES = new Set([
  'repository-constitution',
  'raw-owner-evidence',
  'provider-observation',
  'human-declaration',
  'destination-receipt',
]);

const CONSTITUTION_INPUT_KEYS = new Set([
  'owner_repository',
  'owner_head_sha',
  'ordered_constitutive_paths',
  'blob_sha_for_each_path',
]);
const CONSTITUTION_RECEIPT_KEYS = new Set([
  'schema',
  'canonicalization_policy',
  ...CONSTITUTION_INPUT_KEYS,
  'constitution_id',
]);
const SOURCE_CUT_INPUT_KEYS = new Set([
  'owning_world',
  'stable_locator',
  'revision_or_provider_identity',
  'content_digest_when_available',
  'acquisition_time',
  'availability_status',
  'evidence_class',
]);
const SOURCE_CUT_KEYS = new Set(['schema', ...SOURCE_CUT_INPUT_KEYS, 'source_cut_id']);
const RESULT_INPUT_KEYS = new Set(['result', 'target', 'basis_event_ids', 'reason_codes']);
const RESULT_KEYS = new Set([
  'schema',
  ...RESULT_INPUT_KEYS,
  'authority',
  'owner_gate_status',
  'result_id',
]);

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

function requirePlainObject(value, code, label) {
  if (!isPlainObject(value) || Object.getOwnPropertySymbols(value).length > 0) {
    fail(code, `${label} must be a plain JSON object`);
  }
  return value;
}

function requireExactKeys(record, expected, code, label) {
  const keys = Object.keys(record);
  if (keys.length !== expected.size || keys.some(key => !expected.has(key))) {
    fail(code, `${label} must contain only the exact v0 keys`);
  }
}

function requireString(value, code, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(code, `${label} must be a non-empty string`);
  }
  return value;
}

function requireSha1(value, code, label) {
  requireString(value, code, label);
  if (!/^[0-9a-f]{40}$/.test(value)) {
    fail(code, `${label} must be a lowercase 40-hex Git object id`);
  }
  return value;
}

function requireSha256(value, code, label) {
  requireString(value, code, label);
  if (!/^sha256:[0-9a-f]{64}$/.test(value)) {
    fail(code, `${label} must be a sha256 identity`);
  }
  return value;
}

function requireUniqueStrings(value, code, label, { identity = false } = {}) {
  if (!Array.isArray(value)) {
    fail(code, `${label} must be an array`);
  }
  const result = value.map((item, index) => {
    if (identity) return requireSha256(item, code, `${label}[${index}]`);
    return requireString(item, code, `${label}[${index}]`);
  });
  if (new Set(result).size !== result.length) {
    fail(code, `${label} must not contain duplicates`);
  }
  return result;
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function cloneJsonRecord(record) {
  return JSON.parse(canonicalStringify(record));
}

function constitutionInputFromReceipt(receipt) {
  return {
    owner_repository: receipt.owner_repository,
    owner_head_sha: receipt.owner_head_sha,
    ordered_constitutive_paths: [...receipt.ordered_constitutive_paths],
    blob_sha_for_each_path: { ...receipt.blob_sha_for_each_path },
  };
}

function validateConstitutionInput(input) {
  const code = 'INVALID_STORYSHIP_CONSTITUTION';
  requirePlainObject(input, code, 'constitution input');
  requireExactKeys(input, CONSTITUTION_INPUT_KEYS, code, 'constitution input');
  requireString(input.owner_repository, code, 'owner_repository');
  requireSha1(input.owner_head_sha, code, 'owner_head_sha');

  const paths = requireUniqueStrings(input.ordered_constitutive_paths, code, 'ordered_constitutive_paths');
  if (paths.length === 0) fail(code, 'ordered_constitutive_paths must not be empty');

  requirePlainObject(input.blob_sha_for_each_path, code, 'blob_sha_for_each_path');
  const mapKeys = Object.keys(input.blob_sha_for_each_path);
  if (mapKeys.length !== paths.length || mapKeys.some(path => !paths.includes(path))) {
    fail(code, 'blob_sha_for_each_path must exactly match ordered_constitutive_paths');
  }
  for (const path of paths) {
    if (!Object.hasOwn(input.blob_sha_for_each_path, path)) {
      fail(code, `missing blob sha for ${path}`);
    }
    requireSha1(input.blob_sha_for_each_path[path], code, `blob_sha_for_each_path.${path}`);
  }

  return {
    owner_repository: input.owner_repository,
    owner_head_sha: input.owner_head_sha,
    ordered_constitutive_paths: paths,
    blob_sha_for_each_path: Object.fromEntries(paths.map(path => [path, input.blob_sha_for_each_path[path]])),
  };
}

export function createConstitutionReceipt(input) {
  const admitted = validateConstitutionInput(input);
  const constitutionPairs = admitted.ordered_constitutive_paths.map(path => ({
    path,
    blob_sha: admitted.blob_sha_for_each_path[path],
  }));
  const receipt = {
    schema: CONSTITUTION_SCHEMA,
    canonicalization_policy: STORYSHIP_CANONICALIZATION_POLICY,
    ...admitted,
    constitution_id: hashCanonical(constitutionPairs),
  };
  return deepFreeze(cloneJsonRecord(receipt));
}

export function validateConstitutionReceipt(receipt) {
  const code = 'INVALID_STORYSHIP_CONSTITUTION';
  requirePlainObject(receipt, code, 'constitution receipt');
  requireExactKeys(receipt, CONSTITUTION_RECEIPT_KEYS, code, 'constitution receipt');
  if (receipt.schema !== CONSTITUTION_SCHEMA) fail(code, `schema must be ${CONSTITUTION_SCHEMA}`);
  if (receipt.canonicalization_policy !== STORYSHIP_CANONICALIZATION_POLICY) {
    fail(code, `canonicalization_policy must be ${STORYSHIP_CANONICALIZATION_POLICY}`);
  }
  requireSha256(receipt.constitution_id, code, 'constitution_id');
  const expected = createConstitutionReceipt(constitutionInputFromReceipt(receipt));
  if (receipt.constitution_id !== expected.constitution_id) {
    fail(code, 'constitution_id does not match the ordered constitutive path/blob pairs');
  }
  return true;
}

function validateSourceCutInput(input) {
  const code = 'INVALID_STORYSHIP_SOURCE_CUT';
  requirePlainObject(input, code, 'source cut');
  requireExactKeys(input, SOURCE_CUT_INPUT_KEYS, code, 'source cut');
  requireString(input.owning_world, code, 'owning_world');
  requireString(input.stable_locator, code, 'stable_locator');
  requireString(input.revision_or_provider_identity, code, 'revision_or_provider_identity');
  if (input.content_digest_when_available !== null) {
    requireSha256(input.content_digest_when_available, code, 'content_digest_when_available');
  }
  requireString(input.acquisition_time, code, 'acquisition_time');
  if (!SOURCE_AVAILABILITY.has(input.availability_status)) {
    fail(code, 'availability_status must be available, inaccessible, or unknown');
  }
  if (!EVIDENCE_CLASSES.has(input.evidence_class)) {
    fail(code, 'evidence_class is not admitted by Storyship v0');
  }
  return {
    owning_world: input.owning_world,
    stable_locator: input.stable_locator,
    revision_or_provider_identity: input.revision_or_provider_identity,
    content_digest_when_available: input.content_digest_when_available,
    acquisition_time: input.acquisition_time,
    availability_status: input.availability_status,
    evidence_class: input.evidence_class,
  };
}

export function admitSourceCut(input) {
  const admitted = validateSourceCutInput(input);
  const withoutIdentity = {
    schema: SOURCE_CUT_SCHEMA,
    ...admitted,
  };
  return deepFreeze(cloneJsonRecord({
    ...withoutIdentity,
    source_cut_id: hashCanonical(withoutIdentity),
  }));
}

export function validateSourceCut(cut) {
  const code = 'INVALID_STORYSHIP_SOURCE_CUT';
  requirePlainObject(cut, code, 'source cut');
  requireExactKeys(cut, SOURCE_CUT_KEYS, code, 'source cut');
  if (cut.schema !== SOURCE_CUT_SCHEMA) fail(code, `schema must be ${SOURCE_CUT_SCHEMA}`);
  requireSha256(cut.source_cut_id, code, 'source_cut_id');
  const expected = admitSourceCut({
    owning_world: cut.owning_world,
    stable_locator: cut.stable_locator,
    revision_or_provider_identity: cut.revision_or_provider_identity,
    content_digest_when_available: cut.content_digest_when_available,
    acquisition_time: cut.acquisition_time,
    availability_status: cut.availability_status,
    evidence_class: cut.evidence_class,
  });
  if (cut.source_cut_id !== expected.source_cut_id) {
    fail(code, 'source_cut_id does not match the admitted source cut');
  }
  return true;
}

function validateResultInput(input) {
  const code = 'INVALID_STORYSHIP_RESULT';
  requirePlainObject(input, code, 'Storyship result');
  requireExactKeys(input, RESULT_INPUT_KEYS, code, 'Storyship result');
  if (!RESULT_VALUE_SET.has(input.result)) fail(code, 'result is not a Storyship v0 result value');
  if (!RESULT_TARGET_SET.has(input.target)) fail(code, 'target is not a Storyship v0 result target');
  const basisEventIds = requireUniqueStrings(input.basis_event_ids, code, 'basis_event_ids', { identity: true });
  const reasonCodes = requireUniqueStrings(input.reason_codes, code, 'reason_codes');
  return {
    result: input.result,
    target: input.target,
    basis_event_ids: basisEventIds,
    reason_codes: reasonCodes,
  };
}

export function createStoryshipResult(input) {
  const admitted = validateResultInput(input);
  const withoutIdentity = {
    schema: RESULT_SCHEMA,
    ...admitted,
    authority: 'machine-test-only',
    owner_gate_status: 'not-constituted',
  };
  return deepFreeze(cloneJsonRecord({
    ...withoutIdentity,
    result_id: hashCanonical(withoutIdentity),
  }));
}

export function validateStoryshipResult(result) {
  const code = 'INVALID_STORYSHIP_RESULT';
  requirePlainObject(result, code, 'Storyship result');
  requireExactKeys(result, RESULT_KEYS, code, 'Storyship result');
  if (result.schema !== RESULT_SCHEMA) fail(code, `schema must be ${RESULT_SCHEMA}`);
  if (result.authority !== 'machine-test-only') fail(code, 'authority must remain machine-test-only');
  if (result.owner_gate_status !== 'not-constituted') fail(code, 'owner_gate_status must remain not-constituted');
  requireSha256(result.result_id, code, 'result_id');
  const expected = createStoryshipResult({
    result: result.result,
    target: result.target,
    basis_event_ids: [...result.basis_event_ids],
    reason_codes: [...result.reason_codes],
  });
  if (result.result_id !== expected.result_id) {
    fail(code, 'result_id does not match the admitted typed result');
  }
  return true;
}
