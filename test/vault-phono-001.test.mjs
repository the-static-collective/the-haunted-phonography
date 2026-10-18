import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, copyFile, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveVaultWav, proveVaultPhonographChain } from '../src/vault-intake.mjs';
import { runVaultSpecimen } from '../src/vault-specimen.mjs';

const fixtureRoot = resolve(fileURLToPath(new URL('fixtures', import.meta.url)));
const source = join(fixtureRoot, 'specimen-001.wav');
const obs = join(fixtureRoot, 'specimen-001.observations.json');

async function fixture(fn) {
  const home = await mkdtemp(join(tmpdir(), 'vault-phono-'));
  const vault = join(home, 'vault');
  const wavDir = join(vault, 'assets', 'test-track');
  await mkdir(wavDir, { recursive: true });
  await mkdir(join(vault, 'receipts'));
  const wavFile = join(wavDir, 'audio_wav.wav');
  await copyFile(source, wavFile);
  const bytes = await readFile(wavFile);
  const sha = createHash('sha256').update(bytes).digest('hex');
  const record = {
    provider: 'suno', providerTrackId: 'test-track', observedAt: '2026-10-18T17:00:00.000Z',
    state: 'verified', reasonCode: null,
    asset: { role: 'audio_wav', path: 'assets/test-track/audio_wav.wav',
      byteLength: bytes.length, sha256: sha },
    rawMetadata: null,
  };
  const manifest = { schema: 'autodiscography-vault-handoff/v0', runId: 'synthetic-one',
    records: [record] };
  const handoffPath = join(vault, 'receipts', 'handoff.json');
  const persist = async () => writeFile(handoffPath, JSON.stringify(manifest));
  await persist();
  try { return await fn({ home, vault, wavFile, handoffPath, manifest, record, persist }); }
  finally { await rm(home, { recursive: true, force: true }); }
}

test('exact-byte Vault admission resolves to Phonograph; no private path crosses', () =>
  fixture(async ctx => {
    const selected = await resolveVaultWav({
      vaultRoot: ctx.vault, handoffPath: ctx.handoffPath, providerTrackId: 'test-track',
    });
    assert.equal(selected.evidence.sourceHash, 'sha256:' + ctx.record.asset.sha256);
    assert.equal(selected.evidence.byteLength, ctx.record.asset.byteLength);
    assert.ok(!JSON.stringify(selected.evidence).includes(ctx.vault));
    assert.equal(selected.evidence.authority, 'source-bytes-only');
  }));

test('verified Vault WAV becomes real MIDI, ResolvedPerformance and Phonograph receipt', () =>
  fixture(async ctx => {
    const stem = join(ctx.home, 'out', 'vault-phono-001');
    const run = await runVaultSpecimen({
      vaultRoot: ctx.vault, handoffPath: ctx.handoffPath,
      providerTrackId: 'test-track', observationsPath: obs,
      outputStem: stem, seed: 'seed-001',
    });
    assert.equal(run.receipt.status, 'completed');
    assert.equal(run.performance.schema, 'haunted-phonograph/resolved-performance/v1');
    assert.equal(run.bridge.sourceHash, run.receipt.sourceHash);
    assert.equal(run.bridge.resolvedPerformanceHash, run.receipt.resolvedPerformanceHash);
    assert.equal(run.bridge.authority, undefined);
    assert.equal((await readFile(run.midiPath)).toString('hex', 0, 4), '4d546864');
    assert.equal(JSON.parse(await readFile(run.performancePath, 'utf8')).sourceHash, run.receipt.sourceHash);
    assert.ok(!JSON.stringify(run.bridge).includes(ctx.vault));
  }));

test('missing or wrong-state handoff, duplicate, tampered bytes and symlinks refuse', () =>
  fixture(async ctx => {
    const args = { vaultRoot: ctx.vault, handoffPath: ctx.handoffPath, providerTrackId: 'test-track' };
    ctx.record.state = 'partial';
    await ctx.persist();
    await assert.rejects(resolveVaultWav(args), /VAULT_ASSET_NOT_VERIFIED/);
    ctx.record.state = 'verified';
    ctx.manifest.records.push(structuredClone(ctx.record));
    await ctx.persist();
    await assert.rejects(resolveVaultWav(args), /MISSING_OR_AMBIGUOUS/);
    ctx.manifest.records.pop();
    ctx.record.asset.sha256 = '0'.repeat(64);
    await ctx.persist();
    await assert.rejects(resolveVaultWav(args), /VAULT_EXACT_BYTES_MISMATCH/);
    ctx.record.asset.sha256 = createHash('sha256').update(await readFile(ctx.wavFile)).digest('hex');
    ctx.record.asset.path = '../private.wav';
    await ctx.persist();
    await assert.rejects(resolveVaultWav(args), /INVALID_VAULT_ASSET/);
    ctx.record.asset.path = 'assets/test-track/source.wav';
    await symlink(ctx.wavFile, join(ctx.vault, ctx.record.asset.path));
    await ctx.persist();
    await assert.rejects(resolveVaultWav(args), /SYMLINK_ASSET_REFUSED/);
  }));

test('a modified/manual observation source hash is not upgraded into evidence', () =>
  fixture(async ctx => {
    const note = JSON.parse(await readFile(obs, 'utf8'));
    note.sourceHash = 'sha256:' + 'f'.repeat(64);
    const obsPath = join(ctx.home, 'wrong-observation.json');
    await writeFile(obsPath, JSON.stringify(note));
    await assert.rejects(runVaultSpecimen({
      vaultRoot: ctx.vault, handoffPath: ctx.handoffPath,
      providerTrackId: 'test-track', observationsPath: obsPath,
      outputStem: join(ctx.home, 'out', 'refuse'), seed: 'seed-001'
    }), /MANUAL_OBSERVATION_SOURCE_MISMATCH/);
  }));

test('Vault receipt is not Phonograph completion or permission to distribute', () => {
  assert.throws(() => proveVaultPhonographChain({
    vaultEvidence: {
      schema: 'haunted-phonograph.vault-source/v0.1', vaultState: 'verified',
      sourceHash: 'sha256:abc', authority: 'source-bytes-only',
    },
    phonographReceipt: { schema: 'haunted-phonograph/receipt/v1',
      status: 'completed', sourceHash: 'sha256:def' },
  }), /SOURCE_CHAIN_MISMATCH/);
});
