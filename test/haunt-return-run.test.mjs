import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { canonicalStringify } from '../src/provenance.mjs';
import { createHauntCapsule, validateHauntCapsule } from '../src/haunt-capsule.mjs';
import { runSpecimen } from '../src/run-specimen.mjs';

function hashBytes(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

async function setup() {
  const dir = await mkdtemp(join(tmpdir(), 'haunt-return-run-'));
  const sourcePath = join(dir, 'source.bin');
  const observationsPath = join(dir, 'observations.json');
  const capsulesPath = join(dir, 'capsule.json');
  const sourceBytes = Buffer.from('haunt-return-source-v1', 'utf8');
  const sourceHash = hashBytes(sourceBytes);
  await writeFile(sourcePath, sourceBytes);
  await writeFile(observationsPath, JSON.stringify({
    schema: 'haunted-phonograph/observation-declaration/v1',
    sourceHash,
    method: { id: 'haunt-return-test', version: '1' },
    tempoBpm: 120,
    motifPitches: [60, 64, 67, 64],
    motifDurationsQuarter: [1, 1, 1, 1],
    harmonyQuality: { state: 'unknown', uncertainty: { alternatives: ['major', 'sus'] } },
  }));
  const capsule = createHauntCapsule({
    sourceRef: sourceHash,
    encounterRef: 'sha256:toaster-return-source',
    origin: { appliance: 'haunted-toaster', receiptRef: 'sha256:toaster-return-source', policy: 'toaster-memory-export/v1' },
    relations: [{ relation: 'restraint-before-expansion', direction: 'positive', strength: 0.8, evidenceRefs: ['sha256:toaster-return-source'] }],
    invitations: [{ pressure: 'late-bloom', strength: 0.8, allowedSurfaces: ['mutation-path'] }],
    lineage: { parentRefs: [], influenceOnlyRefs: [], refusedRefs: [] },
    unresolved: [],
    derivedFrom: ['sha256:toaster-return-source'],
  });
  await writeFile(capsulesPath, `${canonicalStringify(capsule)}\n`);
  return { dir, sourcePath, observationsPath, capsulesPath, capsule };
}

test('HAUNT run emits canonical Phonograph return capsule sidecar', async () => {
  const s = await setup();
  const result = await runSpecimen({
    sourcePath: s.sourcePath,
    observationsPath: s.observationsPath,
    capsulesPath: s.capsulesPath,
    outputStem: join(s.dir, 'specimen'),
    seed: 'seed-001',
  });

  assert.equal(validateHauntCapsule(result.hauntCapsule), true);
  assert.equal(result.hauntCapsule.origin.appliance, 'haunted-phonograph');
  assert.equal(result.hauntCapsule.provenance.authority, 'influence-only');
  assert.deepEqual(result.hauntCapsule.lineage.influenceOnlyRefs, [s.capsule.capsuleId]);
  assert.deepEqual(result.hauntCapsule.unresolved, [{
    subject: 'harmony-quality',
    alternatives: ['major', 'sus'],
    evidenceRefs: result.receipt.retainedUncertaintyRefs,
  }]);
  const text = await readFile(result.hauntPath, 'utf8');
  assert.equal(text, `${canonicalStringify(result.hauntCapsule)}\n`);
});

test('legacy rerun clears stale HAUNT return sidecar and keeps legacy result shape', async () => {
  const s = await setup();
  const outputStem = join(s.dir, 'specimen');
  const haunted = await runSpecimen({
    sourcePath: s.sourcePath,
    observationsPath: s.observationsPath,
    capsulesPath: s.capsulesPath,
    outputStem,
    seed: 'seed-001',
  });
  assert.equal((await stat(haunted.hauntPath)).isFile(), true);

  const legacy = await runSpecimen({
    sourcePath: s.sourcePath,
    observationsPath: s.observationsPath,
    outputStem,
    seed: 'seed-001',
  });
  assert.equal(Object.hasOwn(legacy, 'hauntPath'), false);
  assert.equal(Object.hasOwn(legacy, 'hauntCapsule'), false);
  await assert.rejects(() => stat(`${outputStem}.haunt.json`), error => error?.code === 'ENOENT');
});
