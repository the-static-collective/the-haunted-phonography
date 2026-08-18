# The Haunted Phonograph

**A source recording goes in. A new playable musical object comes out—with a receipt showing what was heard, what was proposed, and how the proposal became sound.**

The Haunted Phonograph is a sibling appliance to [The Haunted Toaster](https://github.com/the-static-collective/the-haunted-toaster).

- **Haunted Toaster:** song → witnessed image
- **Haunted Phonograph:** song → witnessed music

It is not intended to be a generic “AI remix generator.” Its job is to listen carefully, preserve the distinction between evidence and invention, and grow deterministic musical mutations that remain playable, inspectable, and attributable to their source.

## Founding law

> **The source recording is evidence, not a cage.**

Anything claimed as heard evidence must be justified by the source or explicitly marked uncertain. Anything newly composed, inferred beyond the evidence, mutated, reharmonized, orchestrated, or otherwise invented must remain a proposal rather than being laundered into source truth.

A beautiful mutation is allowed to be very far from the recording. It is not allowed to lie about how it got there.

## Core pipeline

```text
source recording
  ↓
canonical source evidence
  ↓
heard observations + uncertainty
  ↓
PhonographScore proposal
  ↓
deterministic mutation
  ↓
ResolvedPerformance
  ↓
playable outputs
  ↓
receipt
```

Possible playable outputs include MIDI, rendered audio, stems, accompaniment parts, synth/control data, alternate arrangements, and human-readable performance material.

No particular output format is the authority. The resolved musical object is.

## The first-class object: `PhonographScore`

A `PhonographScore` should eventually be able to describe musical material such as:

- motifs;
- harmonic fields;
- rhythmic cells;
- section relationships;
- instrumentation roles;
- register and density behavior;
- mutation constraints;
- source-evidence references;
- uncertainty;
- deterministic seed / mutation identity.

The score must distinguish at least three kinds of knowledge:

1. **evidence** — supported by the source recording;
2. **uncertainty** — heard or inferred incompletely and preserved as such;
3. **proposal** — newly generated musical possibility.

Those categories must not silently collapse into one another.

## Architectural invariants

### 1. Evidence and proposal are different authorities

Analysis may describe what the machine can justify hearing. Composition may propose what could happen next. Proposal never retroactively becomes evidence merely because it sounds plausible.

### 2. Mutation is replayable

Given the same canonical input evidence, score, mutation identity, and declared execution environment, deterministic portions of the system should reproduce the same resolved musical decisions.

No hidden entropy.

### 3. Resolve before rendering

Exporters and renderers consume a resolved performance. They do not independently reinterpret the source or invent musical structure downstream.

```text
source → observations → PhonographScore → mutation → ResolvedPerformance → render/export
```

### 4. Outputs are projections, not authority

MIDI, WAV, stems, notation, and control streams are projections of the resolved performance. Losing one projection must not change what the performance *was*.

### 5. Receipts bind the crossing

A completed mutation should be able to state, at minimum:

- source identity/hash;
- admitted evidence and uncertainty;
- score identity;
- mutation identity/seed;
- resolved performance identity/hash;
- exporter/render profile;
- output hashes;
- explicit provenance distinguishing source evidence from new proposal.

### 6. Failure leaves residue rather than counterfeit certainty

When analysis cannot justify a chord, note, onset, section, lyric, instrument, or other musical fact, the system should preserve uncertainty or omit the claim. It must not quietly convert uncertainty into a precise invented fact for convenience.

## Scope discipline

The first useful version does **not** need to solve general music understanding.

A legitimate first specimen can be much narrower:

```text
recording
→ bounded evidence extraction
→ small PhonographScore
→ one deterministic mutation law
→ Standard MIDI File
→ receipt
```

One end-to-end truthful musical mutation is worth more than twenty disconnected analysis features.

## Relationship to the wider substrate

The Phonograph should reuse compatible Static Collective laws rather than fork them casually:

- canonical source identity;
- immutable/provable evidence where practical;
- proposal ≠ authority;
- deterministic named mutation streams;
- resolved execution before projection;
- receipts and replay;
- refusal/uncertainty that preserves state rather than fabricating success.

The exact shared package boundaries can emerge from executable seams. Do not couple this repository to another appliance merely to make the family resemblance visible.

## Immediate target

Build the smallest end-to-end specimen that proves this claim:

> **A recording can become genuinely new music without confusing what was heard with what was invented.**

That specimen should be playable, deterministic where declared, and receipted.

## Executable provenance floor

Issue #2 establishes the first executable seam in `src/provenance.mjs`.

The module keeps three authority classes distinct:

- `evidence` for source-backed claims;
- `uncertainty` for incomplete source-facing claims, including explicit unknown;
- `proposal` for new musical possibility.

Authority class cannot be promoted in place. A concrete realization is recorded separately from its source claim: an unchanged exact evidence value may remain `direct-evidence`, while any changed value—or any choice made from uncertainty/proposal—is a `proposal-choice` that retains the source claim hash and original authority.

`canonicalStringify()` and `hashCanonical()` provide the appliance-local `hp-canonical-json-v1` deterministic serialization/hash used by this seam. That policy is local to Haunted Phonograph v1; it is not a replacement for wider Collective canonical identity law.

Specimen 001 consumes this provenance module rather than reimplementing evidence/uncertainty/proposal classification.

## Specimen 001 — first complete crossing

Run the first end-to-end musical specimen with:

```bash
npm run specimen:001
```

The default command uses the checked-in real PCM source fixture plus its explicitly admitted bounded observation declaration, applies one deterministic interval-preserving motif displacement, resolves renderer-neutral performance state, and writes:

```text
out/specimen-001.mid
out/specimen-001.receipt.json
```

The MIDI exporter receives only `ResolvedPerformance`; it does not inspect the source recording or make new musical decisions. The success receipt binds the source, observation authorities, score, mutation route, resolved performance, MIDI export profile, and final MIDI hash.

Specimen 001 intentionally does **not** claim automatic music understanding. Tempo, motif pitches, and motif durations are admitted fixture/manual evidence bound to the exact WAV hash. Harmonic quality remains explicit uncertainty and is carried through the performance by provenance reference rather than being silently converted into a chord or key.

The default source fixture is a compact 1 kHz mono 16-bit PCM WAV containing the four-note phrase `[60, 64, 67, 64]`. Its low sample rate is a repository-fixture choice, not an analysis assumption; its job is to provide real source bytes with stable identity while keeping this executable proof small.

## HAUNT v0.1 — cross-appliance memory

HAUNT adds one bounded way for a witnessed encounter from a sibling appliance to influence Phonograph proposal search without becoming musical evidence or execution authority.

Founding law:

> **The appliances share memory, not authority.**

A `static-collective/haunt-memory-capsule/v1` enters only as `influence-only` context before mutation. HAUNT v0.1 supports one portable invitation, `late-bloom`, on the `mutation-path` surface. The first musical realization is a proposal-only velocity contour `[56, 64, 88, 108]`; pitches, tempo, durations, admitted observation hashes, and retained harmony uncertainty remain unchanged.

The run path accepts an optional capsule file:

```js
import { runSpecimen } from './src/run-specimen.mjs';

await runSpecimen({
  sourcePath: 'test/fixtures/specimen-001.wav',
  observationsPath: 'test/fixtures/specimen-001.observations.json',
  capsulesPath: 'test/fixtures/haunt-toaster-restraint-before-expansion.json',
  outputStem: 'out/haunt-001',
  seed: 'haunt-v0.1-proof',
});
```

A HAUNT run writes:

```text
out/haunt-001.mid
out/haunt-001.receipt.json
out/haunt-001.haunt.json
```

The receipt binds which capsule was consumed or ignored and the resolved influence route. The `.haunt.json` sidecar is a new Phonograph-origin, influence-only return capsule derived from the completed encounter. It preserves unresolved/refused residue without promoting it into source truth.

The checked-in Toaster-origin fixture is a bounded test residue, not Toaster source truth and not a live Toaster database dependency. Actual Toaster return admission remains a separate gated slice after the current Toaster proposal-context lineage settles.

Verification evidence and exact hashes are recorded in `docs/haunt-v0.1-verification.md`.

Run all tests with:

```bash
npm test
```
