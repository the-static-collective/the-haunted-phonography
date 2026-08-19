import { createHash } from 'node:crypto';
import { hashCanonical } from './provenance.mjs';

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

function summarizeHauntInfluence(plan) {
  return {
    policy: plan.policy,
    stream: plan.stream,
    orderedCapsuleIds: [...plan.orderedCapsuleIds],
    consumedCapsuleIds: [...plan.consumedCapsuleIds],
    ignored: plan.ignored.map(item => ({ ...item })),
    routePressure: plan.routePressure,
  };
}

export function mutateScore({ score, seed, hauntInfluencePlan = null }) {
  if (score?.schema !== 'haunted-phonograph/score/v1') fail('INVALID_SCORE', 'unsupported score schema');
  if (typeof seed !== 'string' || seed.length === 0) fail('INVALID_SEED', 'seed must be a non-empty string');
  const { law, stream, allowedOffsets } = score.mutation;
  if (law !== 'interval-preserving-motif-displacement/v1' || !Array.isArray(allowedOffsets) || allowedOffsets.length === 0) {
    fail('INVALID_MUTATION_CONTRACT', 'unsupported mutation contract');
  }
  const scoreHash = hashCanonical(score);
  if (hauntInfluencePlan) {
    if (hauntInfluencePlan.schema !== 'haunted-phonograph/haunt-influence-plan/v1'
      || hauntInfluencePlan.scoreHash !== scoreHash
      || hauntInfluencePlan.seed !== seed
      || hauntInfluencePlan.policy !== 'haunt-proposal-influence/v1'
      || hauntInfluencePlan.stream !== 'haunt/mutation-path/v1') {
      fail('HAUNT_PLAN_MISMATCH', 'HAUNT influence plan does not belong to this score and seed');
    }
  }

  const digest = createHash('sha256').update(`${stream}\0${seed}\0${scoreHash}`, 'utf8').digest();
  const selectedOffset = allowedOffsets[digest.readUInt32BE(0) % allowedOffsets.length];
  const pitches = score.material.motif.value.pitches.map((note) => {
    const transposed = note + selectedOffset;
    if (!Number.isInteger(transposed) || transposed < 0 || transposed > 127) {
      fail('MUTATION_OUT_OF_RANGE', `transposed MIDI note ${transposed} is outside 0..127`);
    }
    return transposed;
  });

  const result = {
    schema: 'haunted-phonograph/mutation-result/v1',
    law,
    stream,
    seed,
    scoreHash,
    selectedOffset,
    pitches,
    durationsQuarter: [...score.material.motif.value.durationsQuarter],
  };

  if (hauntInfluencePlan) {
    result.hauntInfluence = summarizeHauntInfluence(hauntInfluencePlan);
    if (hauntInfluencePlan.routePressure === 'late-bloom') {
      if (pitches.length !== 4) {
        fail('HAUNT_ROUTE_UNSUPPORTED', 'late-bloom/v1 currently requires the four-event Specimen 001 motif');
      }
      result.velocityProfile = [56, 64, 88, 108];
    }
  }

  return deepFreeze(result);
}
