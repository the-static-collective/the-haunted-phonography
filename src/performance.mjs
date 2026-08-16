import { hashCanonical, recordRealization } from './provenance.mjs';

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

export function resolvePerformance({ score, observations, mutationResult }) {
  const scoreHash = hashCanonical(score);
  if (mutationResult?.scoreHash !== scoreHash) fail('MUTATION_SCORE_MISMATCH', 'mutation result does not belong to score');
  const tempoBpm = observations.claims.tempo.value;
  if (!Number.isFinite(tempoBpm) || tempoBpm <= 0) fail('INVALID_TEMPO', 'tempo must be positive');
  const ppq = 480;
  let tick = 0;
  const events = mutationResult.pitches.map((note, index) => {
    const durationQuarter = mutationResult.durationsQuarter[index];
    const durationTicks = Math.round(durationQuarter * ppq);
    if (!Number.isInteger(durationTicks) || durationTicks <= 0) fail('INVALID_DURATION', 'duration must resolve to positive ticks');
    const event = {
      tick,
      durationTicks,
      note,
      velocity: 88,
      channel: 0,
      provenance: recordRealization({
        sourceClaim: score.material.motif,
        value: note,
        resolver: { id: 'specimen-001-performance-resolver', version: '1' },
      }),
    };
    tick += durationTicks;
    return event;
  });
  return deepFreeze({
    schema: 'haunted-phonograph/resolved-performance/v1',
    sourceHash: score.sourceHash,
    scoreHash,
    tempoBpm,
    ppq,
    mutation: {
      law: mutationResult.law,
      stream: mutationResult.stream,
      seed: mutationResult.seed,
      selectedOffset: mutationResult.selectedOffset,
    },
    events,
    retainedUncertaintyRefs: [observations.hashes.harmonyQuality],
  });
}
