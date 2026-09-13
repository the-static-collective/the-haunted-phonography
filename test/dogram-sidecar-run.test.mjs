import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runSpecimen } from '../src/run-specimen.mjs';
import { hashCanonical } from '../src/provenance.mjs';

const root = path.resolve(import.meta.dirname, '..');

test('completed specimen writes a Dogram trace-source sidecar beside the receipt', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'phonograph-dogram-'));
  try {
    const outputStem = path.join(temp, 'specimen');
    const result = await runSpecimen({
      sourcePath: path.join(root, 'test/fixtures/specimen-001.wav'),
      observationsPath: path.join(root, 'test/fixtures/specimen-001.observations.json'),
      outputStem,
      seed: 'dogram-sidecar-proof',
    });

    assert.equal(result.dogramPath, `${outputStem}.dogram.json`);
    const sidecar = JSON.parse(await readFile(result.dogramPath, 'utf8'));
    assert.equal(sidecar.schema, 'dogram.trace-source/v0');
    assert.equal(sidecar.source_schema, 'haunted-phonograph/receipt/v1');
    assert.equal(sidecar.receipt_hash, hashCanonical(result.receipt));
    assert.deepEqual(sidecar.boundary_order, [
      'SOURCE',
      'OBSERVATIONS',
      'SCORE',
      'MUTATION',
      'RESOLVED_PERFORMANCE',
      'MIDI_PROJECTION',
    ]);
    assert.equal(sidecar.trace.SOURCE.value, result.receipt.sourceHash);
    assert.equal(sidecar.trace.MIDI_PROJECTION.value, result.receipt.midi.sha256);
    assert.equal(sidecar.authority_boundary, 'comparison-only');
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
