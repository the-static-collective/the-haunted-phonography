import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { identifySource } from '../src/source.mjs';
import { admitObservations } from '../src/observations.mjs';
import { buildScore } from '../src/score.mjs';
import { mutateScore } from '../src/mutation.mjs';
import { resolvePerformance } from '../src/performance.mjs';
import { encodeMidi } from '../src/midi.mjs';

const here = dirname(fileURLToPath(import.meta.url));

async function performanceFor(seed = 'seed-001') {
  const source = await identifySource(join(here, 'fixtures', 'specimen-001.wav'));
  const declaration = JSON.parse(await readFile(join(here, 'fixtures', 'specimen-001.observations.json'), 'utf8'));
  const observations = admitObservations({ source, declaration });
  const score = buildScore({ source, observations });
  const mutationResult = mutateScore({ score, seed });
  return resolvePerformance({ score, observations, mutationResult });
}

function readVlq(buffer, start) {
  let value = 0;
  let offset = start;
  while (true) {
    const byte = buffer[offset++];
    value = (value << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) return { value, offset };
  }
}

function decodeSubset(buffer) {
  assert.equal(buffer.subarray(0, 4).toString('ascii'), 'MThd');
  assert.equal(buffer.readUInt32BE(4), 6);
  const format = buffer.readUInt16BE(8);
  const tracks = buffer.readUInt16BE(10);
  const ppq = buffer.readUInt16BE(12);
  assert.equal(tracks, 1);
  assert.equal(buffer.subarray(14, 18).toString('ascii'), 'MTrk');
  const trackLength = buffer.readUInt32BE(18);
  const end = 22 + trackLength;
  let offset = 22;
  let tick = 0;
  let tempoBpm = null;
  const active = new Map();
  const notes = [];
  while (offset < end) {
    const delta = readVlq(buffer, offset);
    tick += delta.value;
    offset = delta.offset;
    const status = buffer[offset++];
    if (status === 0xff) {
      const type = buffer[offset++];
      const length = readVlq(buffer, offset);
      offset = length.offset;
      if (type === 0x51) {
        assert.equal(length.value, 3);
        const mpqn = buffer.readUIntBE(offset, 3);
        tempoBpm = 60_000_000 / mpqn;
      }
      offset += length.value;
      if (type === 0x2f) break;
      continue;
    }
    const command = status & 0xf0;
    const channel = status & 0x0f;
    const note = buffer[offset++];
    const velocity = buffer[offset++];
    const key = `${channel}:${note}`;
    if (command === 0x90 && velocity > 0) {
      active.set(key, { tick, note, velocity, channel });
    } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      const on = active.get(key);
      assert.ok(on, `note-off without note-on for ${key}`);
      active.delete(key);
      notes.push({ tick: on.tick, durationTicks: tick - on.tick, note, velocity: on.velocity, channel });
    } else {
      assert.fail(`unsupported MIDI status ${status.toString(16)}`);
    }
  }
  notes.sort((a, b) => a.tick - b.tick || a.note - b.note);
  return { format, ppq, tempoBpm, notes };
}

test('SMF0 projection corresponds exactly to resolved performance events', async () => {
  const performance = await performanceFor();
  const bytes = encodeMidi(performance);
  const decoded = decodeSubset(bytes);
  assert.equal(decoded.format, 0);
  assert.equal(decoded.ppq, 480);
  assert.ok(Math.abs(decoded.tempoBpm - performance.tempoBpm) < 0.001);
  assert.deepEqual(
    decoded.notes,
    performance.events.map(({ tick, durationTicks, note, velocity, channel }) => ({ tick, durationTicks, note, velocity, channel })),
  );
});

test('identical resolved performance produces byte-identical MIDI', async () => {
  const performance = await performanceFor();
  assert.deepEqual(encodeMidi(performance), encodeMidi(performance));
});
