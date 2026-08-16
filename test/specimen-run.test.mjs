import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import { identifySource } from '../src/source.mjs';
import { admitObservations } from '../src/observations.mjs';
import { buildScore } from '../src/score.mjs';
import { mutateScore } from '../src/mutation.mjs';
import { resolvePerformance } from '../src/performance.mjs';
import { encodeMidi } from '../src/midi.mjs';
import { canonicalStringify, hashCanonical } from '../src/provenance.mjs';
import { buildReceipt } from '../src/receipt.mjs';
import { runSpecimen } from '../src/run-specimen.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, 'fixtures', 'specimen-001.wav');
const observationsPath = join(here, 'fixtures', 'specimen-001.observations.json');

function hashBytes(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

async function purePipeline(seed = 'seed-001') {
  const source = await identifySource(sourcePath);
  const declaration = JSON.parse(await readFile(observationsPath, 'utf8'));
  const observations = admitObservations({ source, declaration });
  const score = buildScore({ source, observations });
  const mutationResult = mutateScore({ score, seed });
  const performance = resolvePerformance({ score, observations, mutationResult });
  const midiBytes = encodeMidi(performance);
  return { source, observations, score, mutationResult, performance, midiBytes };
}

test('receipt binds source, authorities, score, performance, mutation, and MIDI bytes', async () => {
  const pipeline = await purePipeline();
  const receipt = buildReceipt(pipeline);
  assert.equal(receipt.schema, 'haunted-phonograph/receipt/v1');
  assert.equal(receipt.status, 'completed');
  assert.equal(receipt.sourceHash, pipeline.source.sha256);
  assert.deepEqual(receipt.observationHashes, pipeline.observations.hashes);
  assert.deepEqual(receipt.observationAuthorities, {
    tempo: 'evidence',
    motifPitches: 'evidence',
    motifDurations: 'evidence',
    harmonyQuality: 'uncertainty',
  });
  assert.equal(receipt.scoreHash, hashCanonical(pipeline.score));
  assert.equal(receipt.resolvedPerformanceHash, hashCanonical(pipeline.performance));
  assert.equal(receipt.mutation.selectedOffset, pipeline.mutationResult.selectedOffset);
  assert.equal(receipt.midi.profile, 'smf0-ppq480/v1');
  assert.equal(receipt.midi.sha256, hashBytes(pipeline.midiBytes));
  assert.equal(receipt.midi.byteLength, pipeline.midiBytes.length);
  assert.deepEqual(receipt.retainedUncertaintyRefs, pipeline.performance.retainedUncertaintyRefs);
  assert.equal(Object.isFrozen(receipt), true);
});

test('runSpecimen writes canonical receipt and MIDI artifact', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'phonograph-run-'));
  const outputStem = join(dir, 'specimen');
  const result = await runSpecimen({ sourcePath, observationsPath, outputStem, seed: 'seed-001' });
  const midiBytes = await readFile(result.midiPath);
  const receiptText = await readFile(result.receiptPath, 'utf8');
  assert.equal(hashBytes(midiBytes), result.receipt.midi.sha256);
  assert.equal(receiptText, `${canonicalStringify(result.receipt)}\n`);
  assert.equal((await stat(result.midiPath)).isFile(), true);
  assert.equal((await stat(result.receiptPath)).isFile(), true);
});

test('failed MIDI crossing leaves no completed receipt', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'phonograph-fail-'));
  const outputStem = join(dir, 'specimen');
  const midiPath = `${outputStem}.mid`;
  const receiptPath = `${outputStem}.receipt.json`;
  await mkdir(midiPath);

  await assert.rejects(
    () => runSpecimen({ sourcePath, observationsPath, outputStem, seed: 'seed-001' }),
  );
  await assert.rejects(() => stat(receiptPath), error => error?.code === 'ENOENT');
});

test('receipt refuses an internally mismatched execution chain', async () => {
  const pipeline = await purePipeline('seed-001');
  const other = await purePipeline('seed-005');
  assert.throws(
    () => buildReceipt({ ...pipeline, mutationResult: other.mutationResult }),
    error => error?.code === 'RECEIPT_CHAIN_MISMATCH',
  );
});
