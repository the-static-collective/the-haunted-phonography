import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { UNKNOWN } from '../src/provenance.mjs';
import { identifySource } from '../src/source.mjs';
import { admitObservations } from '../src/observations.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(here, 'fixtures', 'specimen-001.wav');
const declarationPath = join(here, 'fixtures', 'specimen-001.observations.json');

async function loadDeclaration() {
  return JSON.parse(await readFile(declarationPath, 'utf8'));
}

function assertCode(code) {
  return (error) => error?.code === code;
}

test('source identity binds the exact WAV bytes', async () => {
  const source = await identifySource(fixturePath);
  const declaration = await loadDeclaration();
  assert.equal(source.schema, 'haunted-phonograph/source/v1');
  assert.equal(source.sha256, declaration.sourceHash);
  assert.equal(source.byteLength, 8044);
  assert.equal(Object.isFrozen(source), true);
});

test('bounded observations enter through provenance authority classes', async () => {
  const source = await identifySource(fixturePath);
  const declaration = await loadDeclaration();
  const admitted = admitObservations({ source, declaration });

  assert.equal(admitted.claims.tempo.authority, 'evidence');
  assert.equal(admitted.claims.motifPitches.authority, 'evidence');
  assert.equal(admitted.claims.motifDurations.authority, 'evidence');
  assert.equal(admitted.claims.harmonyQuality.authority, 'uncertainty');
  assert.deepEqual(admitted.claims.harmonyQuality.value, UNKNOWN);
  assert.deepEqual(admitted.claims.harmonyQuality.uncertainty, { alternatives: ['major', 'sus'] });

  for (const hash of Object.values(admitted.hashes)) {
    assert.match(hash, /^sha256:[0-9a-f]{64}$/);
  }
});

test('observation admission refuses a declaration bound to another source', async () => {
  const source = await identifySource(fixturePath);
  const declaration = await loadDeclaration();
  declaration.sourceHash = `sha256:${'0'.repeat(64)}`;
  assert.throws(
    () => admitObservations({ source, declaration }),
    assertCode('SOURCE_IDENTITY_MISMATCH'),
  );
});

test('observation admission rejects malformed bounded musical evidence', async () => {
  const source = await identifySource(fixturePath);
  const base = await loadDeclaration();

  for (const patch of [
    { tempoBpm: 0 },
    { motifPitches: [60, 128, 67, 64] },
    { motifDurationsQuarter: [1, 1, 1] },
    { harmonyQuality: { state: 'known', value: 'major' } },
  ]) {
    assert.throws(
      () => admitObservations({ source, declaration: { ...base, ...patch } }),
      assertCode('INVALID_OBSERVATION_DECLARATION'),
    );
  }
});
