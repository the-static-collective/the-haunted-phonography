import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import { buildFieldAnswer } from '../src/field-answer.mjs';

const SAMPLE_RATE = 44_100;
const CHANNELS = 2;
const BYTES_PER_FRAME = 4;

function wavHeader(dataBytes) {
  const buffer = Buffer.alloc(44);
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * BYTES_PER_FRAME, 28);
  buffer.writeUInt16LE(BYTES_PER_FRAME, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataBytes, 40);
  return buffer;
}

function makeWav({ seconds = 1, rising = true } = {}) {
  const frames = Math.round(seconds * SAMPLE_RATE);
  const pcm = Buffer.alloc(frames * BYTES_PER_FRAME);
  for (let frame = 0; frame < frames; frame += 1) {
    const position = frame / Math.max(1, frames - 1);
    const amplitude = rising ? 0.05 + position * 0.65 : 0.70 - position * 0.60;
    const sample = Math.round(Math.sin(frame / 8) * amplitude * 32767);
    pcm.writeInt16LE(sample, frame * BYTES_PER_FRAME);
    pcm.writeInt16LE(-sample, frame * BYTES_PER_FRAME + 2);
  }
  return Buffer.concat([wavHeader(pcm.length), pcm]);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function requestFor(bytes, seed = 'field-answer-test') {
  return {
    schema: 'haunted-phonograph/field-answer-request/v0',
    window: {
      window_id: 'autodisco-audio-window-v0:' + '1'.repeat(64),
      audio_sha256: sha256(bytes),
      source_sha256: '2'.repeat(64),
      requested_bounds: { start_ms: 0, end_ms: 1000 },
      duration_ms: 1000,
      media_type: 'audio/wav',
      base64: bytes.toString('base64'),
    },
    seed,
  };
}

test('bounded PCM facts remain evidence while music remains proposal', () => {
  const result = buildFieldAnswer(requestFor(makeWav()));
  assert.equal(result.schema, 'haunted-phonograph/field-answer-result/v0');
  assert.equal(result.status, 'proposal-ready');
  assert.equal(result.evidence.signal_profile.authority, 'evidence');
  assert.equal(result.proposal.authority, 'proposal');
  assert.equal(result.proposal.subject, 'field-answer-musical-object');
  assert.ok(result.receipt.laws.includes('PROPOSAL != SOURCE EVIDENCE'));
  assert.ok(result.receipt.laws.includes('DIGEST-SEEDED CHOICE != HEARD PITCH'));
  assert.equal(result.source_window_ref.window_id.startsWith('autodisco-audio-window-v0:'), true);
  assert.equal(Object.hasOwn(result.source_window_ref, 'base64'), false);
});

test('same exact window and seed produce identical proposal and artifact identities', () => {
  const bytes = makeWav();
  const a = buildFieldAnswer(requestFor(bytes));
  const b = buildFieldAnswer(requestFor(bytes));
  assert.deepEqual(a.proposal, b.proposal);
  assert.equal(a.receipt.receipt_hash, b.receipt.receipt_hash);
  assert.equal(a.midi.sha256, b.midi.sha256);
  assert.equal(a.audition.sha256, b.audition.sha256);
  assert.equal(a.midi.base64, b.midi.base64);
  assert.equal(a.audition.base64, b.audition.base64);
});

test('different bounded signal contour changes the musical proposal', () => {
  const rising = buildFieldAnswer(requestFor(makeWav({ rising: true })));
  const falling = buildFieldAnswer(requestFor(makeWav({ rising: false })));
  assert.notDeepEqual(
    rising.evidence.signal_profile.value.rmsQuartilesQ15,
    falling.evidence.signal_profile.value.rmsQuartilesQ15,
  );
  assert.notDeepEqual(rising.proposal.value.pitches, falling.proposal.value.pitches);
});

test('audition is a real WAV projection and MIDI is a real SMF projection', () => {
  const result = buildFieldAnswer(requestFor(makeWav()));
  const wav = Buffer.from(result.audition.base64, 'base64');
  const midi = Buffer.from(result.midi.base64, 'base64');
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
  assert.equal(midi.toString('ascii', 0, 4), 'MThd');
  assert.equal('sha256:' + sha256(wav), result.audition.sha256);
  assert.equal('sha256:' + sha256(midi), result.midi.sha256);
});

test('tampered audio bytes are refused before musical proposal', () => {
  const bytes = makeWav();
  const request = requestFor(bytes);
  request.window.audio_sha256 = 'f'.repeat(64);
  assert.throws(
    () => buildFieldAnswer(request),
    /audio bytes do not match window digest/,
  );
});

test('declared duration must match canonical frame count', () => {
  const request = requestFor(makeWav());
  request.window.duration_ms = 999;
  assert.throws(
    () => buildFieldAnswer(request),
    /declared duration does not match canonical frames/,
  );
});
