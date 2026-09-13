import { propagateRing } from './ring.mjs';
import { resolvePerformance } from './performance.mjs';

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export function runRing({ score, observations, seed, hauntInfluencePlan = null }) {
  const trace = propagateRing({ score, seed, hauntInfluencePlan });

  const mutationResult = {
    schema: 'haunted-phonograph/mutation-result/v1',
    law: 'ring-v0.1',
    stream: 'ring/propagation/v1',
    seed,
    scoreHash: trace.scoreHash,
    selectedOffset: trace.finalState.selectedOffset,
    pitches: [...trace.finalState.pitches],
    durationsQuarter: [...trace.finalState.durationsQuarter],
  };

  if (trace.finalState.velocityProfile) {
    mutationResult.velocityProfile = [...trace.finalState.velocityProfile];
  }

  const performance = resolvePerformance({ score, observations, mutationResult });
  return deepFreeze({ trace, mutationResult, performance });
}
