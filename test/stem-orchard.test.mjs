import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { planStemOrchard, renderStemOrchard, REQUEST_SCHEMA, HANDOFF_SCHEMA } from '../src/stem-orchard.mjs';

function request(stems) {
  return { schema: REQUEST_SCHEMA, seed: 'song-family-1', title: 'Cross-song testimony',
    durationSeconds: 2.25, layers: stems };
}
function layer(songId, stemId, key, hash) {
  return { songId, stemId, role: songId === 'a' ? 'keys' : 'vocal',
    objectKey: key, sha256: hash, rightsRef: 'owner-HUMKIN-2026-11-17',
    bpm: 96, tonalCenter: 'C major', trimSeconds: 0, offsetSeconds: 0, gainDb: -12 };
}
function wavTone(frequency, seconds = 3) {
  const sr = 44100, samples = Math.floor(seconds * sr);
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WAVEfmt ', 8); buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sr, 24); buffer.writeUInt32LE(sr * 2, 28);
  buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) {
    const value = Math.round(Math.sin((2 * Math.PI * frequency * i) / sr) * 3500);
    buffer.writeInt16LE(value, 44 + i * 2);
  }
  return buffer;
}
const hash = b => 'sha256:' + createHash('sha256').update(b).digest('hex');

test('the candidate is a proposal and deterministic for identical declarations', () => {
  const a = layer('a', 'keys', 'stems/a/keys.wav', 'sha256:' + 'a'.repeat(64));
  const b = layer('b', 'vocal', 'stems/b/vocal.wav', 'sha256:' + 'b'.repeat(64));
  const one = planStemOrchard(request([a, b]));
  const two = planStemOrchard(request([a, b]));
  assert.equal(one.planId, two.planId);
  assert.equal(one.authority, 'proposal');
  assert.equal(one.metadataAuthority, 'owner-declared-not-machine-verified');
  assert.throws(() => planStemOrchard(request([a, { ...b, bpm: 92 }])), /BPM\/key/);
  assert.throws(() => planStemOrchard(request([a, { ...b, objectKey: 'stems/../secret.wav' }])), /safe relative/);
  assert.throws(() => planStemOrchard(request([a, { ...b, sha256: 'fabricated' }])), /sha256/);
  assert.throws(() => planStemOrchard(request([a, { ...b, songId: 'a' }])), /two different/);
});

test('synthetic real WAV sources render to private receipted HUMKIN HOLD candidate', async t => {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); execFileSync('ffprobe', ['-version'], { stdio: 'ignore' }); }
  catch { t.skip('requires ffmpeg and ffprobe'); return; }
  const root = await mkdtemp(join(tmpdir(), 'hp-orchard-'));
  t.after(async () => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'stems/a'), { recursive: true });
  await mkdir(join(root, 'stems/b'), { recursive: true });
  const waveA = wavTone(220), waveB = wavTone(330);
  await writeFile(join(root, 'stems/a/keys.wav'), waveA);
  await writeFile(join(root, 'stems/b/vocal.wav'), waveB);
  const manifest = request([
    layer('a', 'keys', 'stems/a/keys.wav', hash(waveA)),
    layer('b', 'vocal', 'stems/b/vocal.wav', hash(waveB)),
  ]);
  const result = await renderStemOrchard({ request: manifest, inputRoot: root, outputStem: join(root, 'out/mix') });
  assert.equal(result.handoff.schema, HANDOFF_SCHEMA);
  assert.equal(result.handoff.editorialStatus, 'HOLD');
  assert.equal(result.handoff.broadcastingAuthorized, false);
  assert.equal(result.handoff.publicUrl, null);
  assert.deepEqual(result.handoff.sourceSongIds, ['a', 'b']);
  assert.equal(result.receipt.authority, 'proposal');
  assert.equal(hash(await readFile(result.output)), result.handoff.outputSha256);
  assert.equal((await readFile(result.handoffPath, 'utf8')).includes('"privateR2Key":null'), true);
  await writeFile(join(root, 'stems/a/keys.wav'), wavTone(221));
  await assert.rejects(
    () => renderStemOrchard({ request: manifest, inputRoot: root, outputStem: join(root, 'out/changed') }),
    /Source bytes changed/,
  );
});
