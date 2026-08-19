# HAUNT v0.1 — Verification Evidence

Date: 2026-08-18
Runtime head verified: `ee347d808f255b0a73167dfa3843be8e6dc773d7`
Design: `docs/superpowers/specs/2026-08-18-haunt-cross-appliance-memory-v1-design.md`
Plan: `docs/superpowers/plans/2026-08-18-haunt-cross-appliance-memory-v1.md`

## Exact GitHub CI proof

GitHub Actions run `32121227447` checked out PR #8 merge ref `6bd6d7e79aae8431977c67230e60085566b68a5b`, which merged runtime head `ee347d808f255b0a73167dfa3843be8e6dc773d7` into current `main` base `d0cab7a3fcf7ec0a3963068497b124aa8e8eeb4a`.

Environment:

- Ubuntu 24.04 hosted runner;
- Node `v22.23.2` via `actions/setup-node@v4`;
- command: `npm test` -> `node --test`.

Result:

```text
50 tests
50 pass
0 fail
0 skipped
0 todo
```

The run includes all 15 pre-existing provenance tests, all 13 pre-existing Specimen 001 source/score/MIDI/receipt tests, and 22 HAUNT tests.

The final review hardening test proves that a capsule cannot smuggle undeclared top-level or nested fields across the sibling boundary even if the attacker recomputes the capsule hash. HAUNT v0.1 now fails closed on exact declared keys for the capsule, origin, relations, invitations, lineage, unresolved residue, and provenance.

## HAUNT executable crossing

A bounded Toaster-origin fixture capsule carries:

```text
relation: restraint-before-expansion
invitation pressure: late-bloom
allowed surface: mutation-path
authority: influence-only
```

Canonical fixture capsule ID:

```text
sha256:0610cfb8f8a0e4e3fc6f31cfbc4d682738c68073cc3d1f28b743040089d91cb8
```

Phonograph admits the capsule only during proposal/mutation routing. The first executable musical response is a proposal-only four-event velocity contour:

```text
[56, 64, 88, 108]
```

Pitch displacement, motif intervals, durations, tempo evidence, observation hashes, and retained harmony uncertainty are unchanged by HAUNT influence.

The raw capsule does not enter `ResolvedPerformance`, MIDI export, or renderer/export authority. Only the already-resolved influence summary crosses into performance state and receipt evidence.

## Reproducibility witness

A separate Node 22.16.0 witness reconstructed the implementation source from the exact GitHub branch blobs and the historical source fixture from its exact Git blob.

Verified unchanged blob identities:

```text
src/provenance.mjs
  Git blob: 77bf6d82ced7bafa2881540e8af90bc619fc7365

test/fixtures/specimen-001.wav
  Git blob: b3e19650e51f70aecd7751cfb47a4b9447788bfa
  bytes: 4044
  SHA-256: 8a7d0c4c3e5fe5a8eb9eb35217336d3c95fb0eb9555e72cf63c5a862e4de55ed
```

Two independent HAUNT runs with the same source, observation declaration, capsule, policy, and seed produced identical identities:

```text
score:
  sha256:2d18cb2aa0ff9ec0321cebf21f4be1199a5ac4eee7a0a6eb1b202cd1f462c4ff

resolved performance:
  sha256:d8e4594d78269161461fcab309157e5da8ff17ebaa3381bdfef4ef782977e98e

MIDI:
  sha256:03b971b66b7f11178ec3b072ec2348c5ae3dab1a7853651179150ae7652a3b01
  bytes: 69

Phonograph return capsule:
  sha256:2c8e7526b3cb60d50d5c59a8c2b1ff64b5e1fa50e695f068be1acacc289c0fc8
```

The return capsule records `haunted-phonograph` as origin, remains `influence-only`, retains the harmony uncertainty alternatives by reference, and carries the consumed Toaster capsule only as `influenceOnlyRefs`.

## Legacy compatibility witness

A HAUNT-free Specimen 001 run still reproduces the previously landed identities exactly:

```text
score:
  sha256:2d18cb2aa0ff9ec0321cebf21f4be1199a5ac4eee7a0a6eb1b202cd1f462c4ff

resolved performance:
  sha256:767137acce24b3da8f959887951cd05964b00881832766441b4fa10a133d161e

MIDI:
  sha256:08d0a5fd80a535d93211f4bfd36e2377c423dcaa1a95db159e881e64f666fd38
  bytes: 69
```

The legacy mutation result, resolved performance, receipt, and `runSpecimen()` return value do not acquire HAUNT fields when no capsule input is supplied.

A legacy rerun over an output stem previously used by HAUNT also removes the stale `.haunt.json` sidecar so residue from an earlier encounter cannot impersonate the current run.

## Refusal and authority proofs

The executable tests prove at least these boundaries:

- stale capsule identity is refused;
- sibling memory claiming `evidence` authority is refused;
- undeclared top-level and nested fields are refused even after re-hashing;
- renderer-facing influence surfaces are refused;
- unsupported pressures become deterministic ignore residue;
- absent applicable invitations become deterministic ignore residue;
- mutation/performance HAUNT summary mismatch is refused by receipt construction;
- return memory cannot be derived from a non-completed Phonograph receipt;
- unresolved harmonic alternatives survive as unresolved residue rather than being promoted into source truth.

## Remaining boundary

HAUNT v0.1 proves the Phonograph half of the reciprocal language and emits a return capsule that a sibling appliance can validate.

It does **not** yet modify Haunted Toaster production candidate behavior. The Toaster-side adapter remains a separate gated slice after the current Creative Context Table / candidate-ecology lineage settles. Its first proof should be contract admission only:

```text
memory/haunt-capsule-v1
  -> authority: influence-only
  -> ancestry: none unless independently granted by explicit human ancestry
  -> no raw capsule state past executionForRender()
```

No shared memory database, network service, shared renderer, shared score schema, or universal MADD CLOWN behavior is claimed by this proof.
