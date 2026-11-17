import test from 'node:test';
import assert from 'node:assert/strict';
import { proposeStemOrchard } from '../src/stem-orchard-proposals.mjs';

const base = {
  sha256: 'sha256:' + 'a'.repeat(64),
  rightsRef: 'owner-HUMKIN-2026-11-17',
  bpm: 100, tonalCenter: 'D minor', sourceDurationSeconds: 75,
};
const catalog = { schema: 'haunted-phonograph/stem-catalog/v1', stems: [
  { ...base, songId: 'mutant-pop-01', stemId: 'voice', role: 'vocal', objectKey: 'stems/mutant-pop-01/voice.wav' },
  { ...base, songId: 'mutant-pop-02', stemId: 'keys', role: 'keys', objectKey: 'stems/mutant-pop-02/keys.wav' },
  { ...base, songId: 'mutant-pop-03', stemId: 'bass', role: 'bass', objectKey: 'stems/mutant-pop-03/bass.wav' },
  { ...base, songId: 'mutant-pop-04', stemId: 'voice', role: 'vocal', objectKey: 'stems/mutant-pop-04/voice.wav' },
]};
test('the orchard proposes reproducible cross-song stem invitations', () => {
  const a = proposeStemOrchard(catalog, { seed: 'orchard-1', count: 10, durationSeconds: 30 });
  const b = proposeStemOrchard(catalog, { seed: 'orchard-1', count: 10, durationSeconds: 30 });
  assert.deepEqual(a, b);
  assert.equal(a.candidates.length, 4);
  assert.equal(a.exhaustion, true);
  assert.equal(a.compatibilityAuthority, 'owner-declared-bpm-and-key-only');
  for (const candidate of a.candidates) {
    assert.equal(candidate.status, 'proposal_not_rendered');
    assert.notEqual(candidate.request.layers[0].songId, candidate.request.layers[1].songId);
    assert(candidate.planId.startsWith('sha256:'));
  }
});
test('no invented compatibility when declared musical metadata differs', () => {
  const mismatched = structuredClone(catalog);
  mismatched.stems[1].tonalCenter = 'E major';
  const out = proposeStemOrchard(mismatched, { seed: 'orchard-1', count: 10 });
  assert.equal(out.candidates.length, 2);
  assert.throws(() => proposeStemOrchard({ ...catalog, schema: 'wrong' }, { seed: 'x' }), /Expected/);
});
