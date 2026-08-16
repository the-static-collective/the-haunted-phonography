import { createProposal } from './provenance.mjs';

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export function buildScore({ source, observations }) {
  const motif = createProposal({
    subject: 'motif-material',
    value: {
      pitches: observations.claims.motifPitches.value,
      durationsQuarter: observations.claims.motifDurations.value,
    },
    parentRefs: [observations.hashes.motifPitches, observations.hashes.motifDurations],
    proposer: { id: 'specimen-001-score-builder' },
    policy: { id: 'source-motif-as-compositional-seed', version: '1' },
  });

  return deepFreeze({
    schema: 'haunted-phonograph/score/v1',
    sourceHash: source.sha256,
    observationRefs: { ...observations.hashes },
    material: { motif },
    role: 'lead',
    mutation: {
      law: 'interval-preserving-motif-displacement/v1',
      stream: 'specimen-001/motif-displacement/v1',
      allowedOffsets: [-5, -2, 2, 5, 7],
    },
  });
}
