import test from 'node:test';
import assert from 'node:assert/strict';
import { hashCanonical } from '../src/provenance.mjs';
import { buildDogramDeltaSpecimen } from '../src/dogram-trace.mjs';

function receipt(overrides = {}) {
  return {
    schema: 'haunted-phonograph/receipt/v1',
    status: 'completed',
    sourceHash: 'sha256:source',
    observationHashes: {
      tempo: 'sha256:tempo',
      harmonyQuality: 'sha256:harmony',
    },
    observationAuthorities: {
      tempo: 'evidence',
      harmonyQuality: 'uncertainty',
    },
    scoreHash: 'sha256:score-a',
    mutation: {
      law: 'rotate',
      stream: 'notes',
      seed: 'seed-a',
      selectedOffset: 1,
    },
    resolvedPerformanceHash: 'sha256:performance-a',
    midi: {
      profile: 'smf0-ppq480/v1',
      sha256: 'sha256:midi-a',
      byteLength: 128,
    },
    retainedUncertaintyRefs: ['sha256:harmony'],
    ...overrides,
  };
}

test('lowers two Phonograph receipts to a Dogram delta specimen in causal boundary order', () => {
  const left = receipt();
  const right = receipt({
    scoreHash: 'sha256:score-b',
    mutation: {
      law: 'rotate',
      stream: 'notes',
      seed: 'seed-b',
      selectedOffset: 2,
    },
    resolvedPerformanceHash: 'sha256:performance-b',
    midi: {
      profile: 'smf0-ppq480/v1',
      sha256: 'sha256:midi-b',
      byteLength: 132,
    },
  });

  const specimen = buildDogramDeltaSpecimen({
    specimenId: 'phonograph-a-vs-b',
    leftReceipt: left,
    rightReceipt: right,
  });

  assert.equal(specimen.schema, 'dogram.specimen/v0');
  assert.equal(specimen.operator, 'delta');
  assert.equal(specimen.operator_version, 1);
  assert.deepEqual(specimen.inputs.boundary_order, [
    'SOURCE',
    'OBSERVATIONS',
    'SCORE',
    'MUTATION',
    'RESOLVED_PERFORMANCE',
    'MIDI_PROJECTION',
  ]);
  assert.deepEqual(specimen.inputs.left.SOURCE, {
    kind: 'opaque',
    value: 'sha256:source',
  });
  assert.equal(
    specimen.inputs.left.OBSERVATIONS.value,
    hashCanonical({ hashes: left.observationHashes, authorities: left.observationAuthorities }),
  );
  assert.equal(specimen.inputs.left.SCORE.value, 'sha256:score-a');
  assert.equal(specimen.inputs.right.SCORE.value, 'sha256:score-b');
  assert.equal(specimen.inputs.left.MUTATION.value, hashCanonical(left.mutation));
  assert.equal(specimen.inputs.right.MIDI_PROJECTION.value, 'sha256:midi-b');
  assert.equal(specimen.metadata.authority_boundary, 'comparison-only');
});

test('refuses receipts outside the completed Phonograph receipt contract', () => {
  assert.throws(
    () => buildDogramDeltaSpecimen({
      specimenId: 'bad-receipt',
      leftReceipt: receipt({ status: 'partial' }),
      rightReceipt: receipt(),
    }),
    (error) => error?.code === 'INVALID_DOGRAM_TRACE_RECEIPT',
  );
});
