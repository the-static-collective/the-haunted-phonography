import { createProposal } from '../../src/provenance.mjs';
import { createHauntCapsule } from '../../src/haunt-capsule.mjs';
import { buildHauntInfluencePlan } from '../../src/haunt-influence.mjs';

export function setupRingFixture() {
  const motif = createProposal({
    subject: 'motif-material',
    value: { pitches: [60, 64, 67, 64], durationsQuarter: [1, 1, 1, 1] },
    parentRefs: ['sha256:pitches', 'sha256:durations'],
    proposer: { id: 'ring-test' },
    policy: { id: 'source-motif-as-compositional-seed', version: '1' },
  });

  const score = Object.freeze({
    schema: 'haunted-phonograph/score/v1',
    sourceHash: 'sha256:source',
    observationRefs: {
      tempo: 'sha256:tempo',
      motifPitches: 'sha256:pitches',
      motifDurations: 'sha256:durations',
      harmonyQuality: 'sha256:harmony',
    },
    material: { motif },
    role: 'lead',
    mutation: {
      law: 'interval-preserving-motif-displacement/v1',
      stream: 'specimen-001/motif-displacement/v1',
      allowedOffsets: [-5, -2, 2, 5, 7],
    },
  });

  const observations = Object.freeze({
    claims: { tempo: { value: 120 } },
    hashes: {
      tempo: 'sha256:tempo',
      motifPitches: 'sha256:pitches',
      motifDurations: 'sha256:durations',
      harmonyQuality: 'sha256:harmony',
    },
  });

  const capsule = createHauntCapsule({
    sourceRef: 'sha256:source',
    encounterRef: 'sha256:toaster-receipt',
    origin: {
      appliance: 'haunted-toaster',
      receiptRef: 'sha256:toaster-receipt',
      policy: 'toaster-memory-export/v1',
    },
    relations: [{
      relation: 'restraint-before-expansion',
      direction: 'positive',
      strength: 0.8,
      evidenceRefs: ['sha256:toaster-receipt'],
    }],
    invitations: [{
      pressure: 'late-bloom',
      strength: 0.8,
      allowedSurfaces: ['mutation-path'],
    }],
    lineage: { parentRefs: [], influenceOnlyRefs: [], refusedRefs: [] },
    unresolved: [],
    derivedFrom: ['sha256:toaster-receipt'],
  });

  const seed = 'ring-seed-001';
  const hauntInfluencePlan = buildHauntInfluencePlan({ score, seed, capsules: [capsule] });
  return { score, observations, capsule, seed, hauntInfluencePlan };
}
