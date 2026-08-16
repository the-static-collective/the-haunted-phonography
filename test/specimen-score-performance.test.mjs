import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { identifySource } from '../src/source.mjs';
import { admitObservations } from '../src/observations.mjs';
import { hashCanonical } from '../src/provenance.mjs';
import { buildScore } from '../src/score.mjs';
import { mutateScore } from '../src/mutation.mjs';
import { resolvePerformance } from '../src/performance.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(here, 'fixtures', 'specimen-001.wav');
const declarationPath = join(here, 'fixtures', 'specimen-001.observations.json');

async function setup() {
  const source = await identifySource(fixturePath);
  const declaration = JSON.parse(await readFile(declarationPath, 'utf8'));
  const observations = admitObservations({ source, declaration });
  const score = buildScore({ source, observations });
  return { source, observations, score };
}

test('score keeps source-derived motif material under proposal authority', async () => {
  const { source, observations, score } = await setup();
  assert.equal(score.schema, 'haunted-phonograph/score/v1');
  assert.equal(score.sourceHash, source.sha256);
  assert.equal(score.material.motif.authority, 'proposal');
  assert.deepEqual(score.material.motif.parentRefs, [observations.hashes.motifPitches, observations.hashes.motifDurations]);
  assert.equal(score.mutation.law, 'interval-preserving-motif-displacement/v1');
  assert.match(hashCanonical(score), /^sha256:[0-9a-f]{64}$/);
});

test('mutation is deterministic and explicit seed routing leaves evidence untouched', async () => {
  const { observations, score } = await setup();
  const before = structuredClone(observations.hashes);
  const a1 = mutateScore({ score, seed: 'seed-001' });
  const a2 = mutateScore({ score, seed: 'seed-001' });
  const b = mutateScore({ score, seed: 'seed-002' });
  assert.deepEqual(a1, a2);
  assert.notEqual(a1.selectedOffset, b.selectedOffset);
  assert.deepEqual(observations.hashes, before);
  assert.deepEqual(
    a1.pitches.slice(1).map((note, index) => note - a1.pitches[index]),
    [4, 3, -3],
  );
});

test('resolved performance contains only declared displacement and retains uncertainty by reference', async () => {
  const { source, observations, score } = await setup();
  const mutationResult = mutateScore({ score, seed: 'seed-001' });
  const performance = resolvePerformance({ score, observations, mutationResult });
  const sourcePitches = observations.claims.motifPitches.value;

  assert.equal(performance.schema, 'haunted-phonograph/resolved-performance/v1');
  assert.equal(performance.sourceHash, source.sha256);
  assert.equal(performance.scoreHash, hashCanonical(score));
  assert.equal(performance.tempoBpm, 120);
  assert.equal(performance.ppq, 480);
  assert.deepEqual(performance.events.map(event => event.tick), [0, 480, 960, 1440]);
  assert.deepEqual(performance.events.map(event => event.durationTicks), [480, 480, 480, 480]);
  assert.deepEqual(
    performance.events.map(event => event.note),
    sourcePitches.map(note => note + mutationResult.selectedOffset),
  );
  assert.deepEqual(performance.retainedUncertaintyRefs, [observations.hashes.harmonyQuality]);
  for (const event of performance.events) {
    assert.equal(event.provenance.sourceAuthority, 'proposal');
    assert.equal(event.provenance.selectionAuthority, 'proposal-choice');
  }
  assert.equal(Object.hasOwn(performance, 'harmonyQuality'), false);
});
