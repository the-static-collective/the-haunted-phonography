/* Deterministic metadata-based invitations, not audio analysis or harmonic proof.
 * Uses source-owned stem manifests; nothing is streamed or published.
 */
import { createHash } from 'node:crypto';
import { planStemOrchard, REQUEST_SCHEMA } from './stem-orchard.mjs';

const ACCOMPANIMENT = new Set(['instrumental', 'keys', 'guitar', 'synth', 'strings', 'bass', 'drums', 'other']);
const VOICE = new Set(['vocal', 'backing_vocal']);
function order(seed, left, right) {
  return createHash('sha256').update(seed + '\0' + left.objectKey + '\0' + right.objectKey).digest('hex');
}
export function proposeStemOrchard(collection, { seed, count = 10, durationSeconds = 20 } = {}) {
  if (collection?.schema !== 'haunted-phonograph/stem-catalog/v1' || !Array.isArray(collection.stems)) {
    throw Error('Expected source-owned stem-catalog/v1');
  }
  if (typeof seed !== 'string' || !seed.trim() || seed.length > 180) throw Error('Seed required');
  if (!Number.isInteger(count) || count < 1 || count > 30) throw Error('count 1–30 required');
  if (!Number.isFinite(durationSeconds) || durationSeconds < 2 || durationSeconds > 180) throw Error('durationSeconds 2–180 required');
  const stems = collection.stems.filter(s =>
    Number(s.sourceDurationSeconds) >= durationSeconds &&
    (VOICE.has(s.role) || ACCOMPANIMENT.has(s.role)));
  const possible = [];
  for (const a of stems) for (const b of stems) {
    if (a.songId === b.songId || a.objectKey === b.objectKey || !VOICE.has(a.role) || !ACCOMPANIMENT.has(b.role)) continue;
    if (a.bpm !== b.bpm || String(a.tonalCenter).trim().toLowerCase() !== String(b.tonalCenter).trim().toLowerCase()) continue;
    possible.push({ a, b, sort: order(seed, a, b) });
  }
  possible.sort((x, y) => x.sort.localeCompare(y.sort));
  const output = [];
  for (const pair of possible) {
    if (output.length >= count) break;
    const layers = [pair.a, pair.b].map((s, i) => ({
      songId: s.songId, stemId: s.stemId, role: s.role, objectKey: s.objectKey,
      sha256: s.sha256, rightsRef: s.rightsRef, bpm: s.bpm, tonalCenter: s.tonalCenter,
      trimSeconds: 0, offsetSeconds: 0, gainDb: i === 0 ? -6 : -9,
    }));
    const request = {
      schema: REQUEST_SCHEMA, seed: seed + '-' + String(output.length + 1).padStart(2, '0'),
      title: 'Orchard echo · ' + pair.a.songId + ' × ' + pair.b.songId,
      durationSeconds, layers,
    };
    const plan = planStemOrchard(request);
    output.push({ request, planId: plan.planId, status: 'proposal_not_rendered' });
  }
  return {
    schema: 'haunted-phonograph/stem-orchard-proposals/v1',
    seed, compatibilityAuthority: 'owner-declared-bpm-and-key-only',
    candidates: output,
    exhaustion: output.length < count,
  };
}
