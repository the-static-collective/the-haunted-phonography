import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { canonicalStringify } from '../src/provenance.mjs';
import { createHauntCapsule } from '../src/haunt-capsule.mjs';
import { runSpecimen } from '../src/run-specimen.mjs';

function hashBytes(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

async function setup() {
  const dir = await mkdtemp(join(tmpdir(), 'haunt-run-'));
  const sourcePath = join(dir, 'source.bin');
  const observationsPath = join(dir, 'observations.json');
  const capsulesPath = join(dir, 'capsule.json');
  const sourceBytes = Buffer.from('haunt-source-v1', 'utf8');
  const sourceHash = hashBytes(sourceBytes);
  await writeFile(sourcePath, sourceBytes);
  await writeFile(observationsPath, JSON.stringify({
    schema: 'haunted-phonograph/observation-declaration/v1',
    sourceHash,
    method: { id: 'haunt-test-observation', version: '1' },
    tempoBpm: 120,
    motifPitches: [60, 64, 67, 64],
    motifDurationsQuarter: [1, 1, 1, 1],
    harmonyQuality: { state: 'unknown', uncertainty: { alternatives: ['major', 'sus'] } },
  }));
  const capsule = createHauntCapsule({
    sourceRef: sourceHash,
    encounterRef: 'sha256:toaster-receipt',
    origin: { appliance: 'haunted-toaster', receiptRef: 'sha256:toaster-receipt', policy: 'toaster-memory-export/v1' },
    relations: [{ relation: 'restraint-before-expansion', direction: 'positive', strength: 0.8, evidenceRefs: ['sha256:toaster-receipt'] }],
    invitations: [{ pressure: 'late-bloom', strength: 0.8, allowedSurfaces: ['mutation-path'] }],
    lineage: { parentRefs: [], influenceOnlyRefs: [], refusedRefs: [] },
    unresolved: [],
    derivedFrom: ['sha256:toaster-receipt'],
  });
  await writeFile(capsulesPath, `${canonicalStringify(capsule)}\n`);
  return { dir, sourcePath, observationsPath, capsulesPath, capsule };
}

test('runSpecimen binds consumed HAUNT influence into a deterministic completed receipt', async () => {
  const setupA = await setup();
  const a = await runSpecimen({
    sourcePath: setupA.sourcePath,
    observationsPath: setupA.observationsPath,
    capsulesPath: setupA.capsulesPath,
    outputStem: join(setupA.dir, 'a'),
    seed: 'seed-001',
  });
  const b = await runSpecimen({
    sourcePath: setupA.sourcePath,
    observationsPath: setupA.observationsPath,
    capsulesPath: setupA.capsulesPath,
    outputStem: join(setupA.dir, 'b'),
    seed: 'seed-001',
  });

  assert.equal(a.receipt.hauntInfluence.routePressure, 'late-bloom');
  assert.deepEqual(a.receipt.hauntInfluence.consumedCapsuleIds, [setupA.capsule.capsuleId]);
  assert.equal(a.receipt.resolvedPerformanceHash, b.receipt.resolvedPerformanceHash);
  assert.equal(a.receipt.midi.sha256, b.receipt.midi.sha256);
  assert.deepEqual(a.receipt.hauntInfluence, b.receipt.hauntInfluence);
});

test('HAUNT changes proposal output while leaving admitted source observations unchanged', async () => {
  const s = await setup();
  const haunted = await runSpecimen({
    sourcePath: s.sourcePath,
    observationsPath: s.observationsPath,
    capsulesPath: s.capsulesPath,
    outputStem: join(s.dir, 'haunted'),
    seed: 'seed-001',
  });
  const legacy = await runSpecimen({
    sourcePath: s.sourcePath,
    observationsPath: s.observationsPath,
    outputStem: join(s.dir, 'legacy'),
    seed: 'seed-001',
  });

  assert.deepEqual(haunted.receipt.observationHashes, legacy.receipt.observationHashes);
  assert.equal(Object.hasOwn(legacy.receipt, 'hauntInfluence'), false);
  assert.notEqual(haunted.receipt.midi.sha256, legacy.receipt.midi.sha256);
  assert.equal((await readFile(haunted.receiptPath, 'utf8')), `${canonicalStringify(haunted.receipt)}\n`);
});
