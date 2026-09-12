import { hashCanonical } from './provenance.mjs';
import { mutateScore } from './mutation.mjs';

const TRACE_SCHEMA = 'haunted-phonograph/ring-trace/v1';
const HISTORY_SCHEMA = 'haunted-phonograph/haunt-influence-plan/v1';
const HISTORY_POLICY = 'haunt-proposal-influence/v1';
const HISTORY_STREAM = 'haunt/mutation-path/v1';
const THRESHOLD = 10;
const MAX_STEPS = 4;

export const RING_RELATIONS = Object.freeze([
  'interval-displacement',
  'rhythmic-stretch',
  'dynamic-bloom',
]);

const INITIAL_SUSCEPTIBILITY = Object.freeze({
  'interval-displacement': 10,
  'rhythmic-stretch': 4,
  'dynamic-bloom': 3,
});

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

function cloneSusceptibility(value) {
  return Object.fromEntries(RING_RELATIONS.map(relation => [relation, value[relation]]));
}

function validateScore(score) {
  if (score?.schema !== 'haunted-phonograph/score/v1') {
    fail('RING_INVALID_SCORE', 'RING requires haunted-phonograph/score/v1');
  }
  const pitches = score.material?.motif?.value?.pitches;
  const durations = score.material?.motif?.value?.durationsQuarter;
  if (!Array.isArray(pitches) || pitches.length !== 4
    || pitches.some(note => !Number.isInteger(note) || note < 0 || note > 127)) {
    fail('RING_INVALID_MOTIF', 'RING v0.1 requires exactly four valid MIDI pitches');
  }
  if (!Array.isArray(durations) || durations.length !== 4
    || durations.some(duration => !Number.isFinite(duration) || duration <= 0)) {
    fail('RING_INVALID_MOTIF', 'RING v0.1 requires exactly four positive durations');
  }
}

function validateHistoryPlan(plan, scoreHash, seed) {
  if (!plan) {
    return {
      routePressure: null,
      consumedCapsuleIds: [],
    };
  }
  if (plan.schema !== HISTORY_SCHEMA
    || plan.policy !== HISTORY_POLICY
    || plan.stream !== HISTORY_STREAM
    || plan.scoreHash !== scoreHash
    || plan.seed !== seed) {
    fail('RING_HISTORY_MISMATCH', 'HAUNT influence plan does not belong to this RING score and seed');
  }
  if (plan.routePressure !== null && plan.routePressure !== 'late-bloom') {
    fail('RING_HISTORY_MISMATCH', 'RING v0.1 only admits null or late-bloom history pressure');
  }
  return {
    routePressure: plan.routePressure,
    consumedCapsuleIds: [...plan.consumedCapsuleIds],
  };
}

function chooseEligible(susceptibility, visited) {
  return RING_RELATIONS
    .filter(relation => !visited.has(relation) && susceptibility[relation] >= THRESHOLD)
    .sort((a, b) => {
      const pressure = susceptibility[b] - susceptibility[a];
      if (pressure !== 0) return pressure;
      return RING_RELATIONS.indexOf(a) - RING_RELATIONS.indexOf(b);
    })[0] ?? null;
}

function applyRelation({ relation, state, score, seed }) {
  if (relation === 'dynamic-bloom') {
    const velocityProfile = [56, 64, 88, 108];
    state.velocityProfile = velocityProfile;
    return { velocityProfile: [...velocityProfile] };
  }

  if (relation === 'interval-displacement') {
    const baseline = mutateScore({ score, seed });
    state.pitches = [...baseline.pitches];
    state.selectedOffset = baseline.selectedOffset;
    return {
      selectedOffset: baseline.selectedOffset,
      pitches: [...baseline.pitches],
    };
  }

  if (relation === 'rhythmic-stretch') {
    state.durationsQuarter = state.durationsQuarter.map(duration => duration * 1.5);
    return {
      durationRatio: '3/2',
      durationsQuarter: [...state.durationsQuarter],
    };
  }

  fail('RING_UNKNOWN_RELATION', `unsupported RING relation ${relation}`);
}

function updateSusceptibility(susceptibility, relation) {
  susceptibility[relation] = 0;
  if (relation === 'dynamic-bloom') {
    susceptibility['interval-displacement'] += 5;
    susceptibility['rhythmic-stretch'] += 3;
  } else if (relation === 'interval-displacement') {
    susceptibility['rhythmic-stretch'] += 4;
  }
}

export function propagateRing({ score, seed, hauntInfluencePlan = null }) {
  validateScore(score);
  if (typeof seed !== 'string' || seed.length === 0) {
    fail('RING_INVALID_SEED', 'RING seed must be a non-empty string');
  }

  const scoreHash = hashCanonical(score);
  const historyInfluence = validateHistoryPlan(hauntInfluencePlan, scoreHash, seed);
  const susceptibility = cloneSusceptibility(INITIAL_SUSCEPTIBILITY);
  if (historyInfluence.routePressure === 'late-bloom') {
    susceptibility['dynamic-bloom'] += 10;
  }

  const state = {
    pitches: [...score.material.motif.value.pitches],
    durationsQuarter: [...score.material.motif.value.durationsQuarter],
    velocityProfile: null,
    selectedOffset: null,
  };
  const steps = [];
  const visited = new Set();
  let terminalState = null;

  while (steps.length < MAX_STEPS) {
    const relation = chooseEligible(susceptibility, visited);
    if (!relation) {
      terminalState = 'damped';
      break;
    }

    const susceptibilityBefore = cloneSusceptibility(susceptibility);
    const effect = applyRelation({ relation, state, score, seed });
    visited.add(relation);
    updateSusceptibility(susceptibility, relation);
    const susceptibilityAfter = cloneSusceptibility(susceptibility);

    steps.push({
      index: steps.length,
      relation,
      susceptibilityBefore,
      susceptibilityAfter,
      effectHash: hashCanonical({ relation, effect }),
    });

    if (visited.size === RING_RELATIONS.length) {
      terminalState = 'completed';
      break;
    }
  }

  if (!terminalState) terminalState = 'exhausted';

  const canonical = {
    schema: TRACE_SCHEMA,
    scoreHash,
    seed,
    relations: [...RING_RELATIONS],
    historyInfluence,
    steps,
    terminalState,
    finalState: state,
  };

  return deepFreeze({
    ...canonical,
    traceHash: hashCanonical(canonical),
  });
}
