import { hashCanonical } from './provenance.mjs';
import { validateHauntCapsule } from './haunt-capsule.mjs';

const PLAN_SCHEMA = 'haunted-phonograph/haunt-influence-plan/v1';
const POLICY = 'haunt-proposal-influence/v1';
const STREAM = 'haunt/mutation-path/v1';

function fail(code, message) {
  const error = new TypeError(message);
  error.code = code;
  throw error;
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export function buildHauntInfluencePlan({ score, seed, capsules = [] }) {
  if (score?.schema !== 'haunted-phonograph/score/v1') {
    fail('HAUNT_INVALID_SCORE', 'HAUNT influence requires haunted-phonograph/score/v1');
  }
  if (typeof seed !== 'string' || seed.length === 0) {
    fail('HAUNT_INVALID_SEED', 'HAUNT influence requires a non-empty seed');
  }
  if (!Array.isArray(capsules)) {
    fail('HAUNT_INVALID_CAPSULE_SET', 'capsules must be an array');
  }

  const unique = new Map();
  for (const capsule of capsules) {
    validateHauntCapsule(capsule);
    if (!unique.has(capsule.capsuleId)) unique.set(capsule.capsuleId, capsule);
  }
  const ordered = [...unique.values()].sort((a, b) => a.capsuleId.localeCompare(b.capsuleId));

  const eligible = [];
  const ignored = [];
  for (const capsule of ordered) {
    if (capsule.invitations.length === 0) {
      ignored.push({ capsuleId: capsule.capsuleId, reason: 'NO_APPLICABLE_INVITATION' });
      continue;
    }
    const supported = capsule.invitations
      .filter(invitation => invitation.pressure === 'late-bloom')
      .sort((a, b) => b.strength - a.strength);
    if (supported.length === 0) {
      ignored.push({ capsuleId: capsule.capsuleId, reason: 'UNSUPPORTED_PRESSURE' });
      continue;
    }
    eligible.push({ capsule, invitation: supported[0] });
  }

  eligible.sort((a, b) => {
    const strengthOrder = b.invitation.strength - a.invitation.strength;
    if (strengthOrder !== 0) return strengthOrder;
    return a.capsule.capsuleId.localeCompare(b.capsule.capsuleId);
  });

  const winner = eligible[0] ?? null;
  for (const candidate of eligible.slice(1)) {
    ignored.push({ capsuleId: candidate.capsule.capsuleId, reason: 'LOWER_PRIORITY' });
  }
  ignored.sort((a, b) => a.capsuleId.localeCompare(b.capsuleId));

  return deepFreeze({
    schema: PLAN_SCHEMA,
    policy: POLICY,
    stream: STREAM,
    scoreHash: hashCanonical(score),
    seed,
    orderedCapsuleIds: ordered.map(capsule => capsule.capsuleId),
    consumedCapsuleIds: winner ? [winner.capsule.capsuleId] : [],
    ignored,
    routePressure: winner ? winner.invitation.pressure : null,
  });
}
