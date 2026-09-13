import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runAcousticLoci } from '../src/run-acoustic-loci.mjs';

const fixtureRoot = new URL('./fixtures/acoustic-loci-001/', import.meta.url);
const locusPath = new URL('locus.json', fixtureRoot);
const observationPaths = ['A', 'B', 'C', 'D'].map(name => new URL(`${name}.json`, fixtureRoot));

test('runs Acoustic Loci 001 from declarations and writes a stable canonical receipt', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'hp-acoustic-loci-'));
  try {
    const firstPath = join(dir, 'first.receipt.json');
    const secondPath = join(dir, 'second.receipt.json');

    const first = await runAcousticLoci({ locusPath, observationPaths, outputPath: firstPath });
    const second = await runAcousticLoci({ locusPath, observationPaths: [...observationPaths].reverse(), outputPath: secondPath });

    assert.equal(first.receipt.schema, 'haunted-phonograph/acoustic-loci-receipt/v1');
    assert.equal(first.receipt.verdict, 'supports-bounded-reentry');
    assert.equal(Object.keys(first.receipt.conditionHashes).length, 4);
    assert.equal(first.receipt.receiptHash, second.receipt.receiptHash);
    assert.equal(await readFile(firstPath, 'utf8'), await readFile(secondPath, 'utf8'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('receipt verdict is derived and is never accepted from fixture input', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'hp-acoustic-loci-derived-'));
  try {
    const outputPath = join(dir, 'receipt.json');
    const result = await runAcousticLoci({ locusPath, observationPaths, outputPath });
    assert.equal(result.receipt.verdict, 'supports-bounded-reentry');
    assert.equal(result.receipt.suppliedVerdict, undefined);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
