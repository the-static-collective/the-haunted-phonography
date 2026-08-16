# Haunted Phonograph Specimen 001 Design

## Goal

Prove one complete Haunted Phonograph crossing:

```text
real source recording bytes
→ admitted bounded observations
→ PhonographScore proposal
→ one deterministic mutation law
→ ResolvedPerformance
→ Standard MIDI File
→ success receipt
```

The specimen must create genuinely new playable music without confusing source evidence, unresolved uncertainty, and generated proposal.

This design implements GitHub issue #1 on top of the provenance contract landed by PR #4. It deliberately does not attempt automatic music understanding.

## Approaches considered

### A. Automatic audio analysis first

Parse the WAV and infer tempo/pitch/sections automatically before composing.

**Rejected for Specimen 001.** It adds a large signal-processing surface before the authority chain has been proven and risks making heuristic inference look more authoritative than it is.

### B. Real checked-in WAV + explicitly admitted fixture observations

Use a tiny deterministic PCM WAV as the source artifact. Supply a small observation fixture whose claims explicitly identify manual/fixture observation methods, including one unresolved uncertainty. Build all later musical decisions from those admitted records.

**Chosen.** The source is a real byte artifact with a real SHA-256 identity, while every semantic claim remains honest about where it came from. This makes the provenance seam executable without pretending the appliance already has general hearing.

### C. Metadata-only synthetic source

Skip audio bytes and start from JSON observations.

**Rejected.** It would prove a score/mutation pipeline but not the claimed recording → evidence crossing.

## Source fixture

Check in `test/fixtures/specimen-001.wav`, a small mono PCM WAV containing a simple audible four-note phrase. The fixture is evidence only by byte identity; the system does not claim to derive semantic facts directly from PCM in this milestone.

Check in `test/fixtures/specimen-001.observations.json` containing bounded admitted observations:

- tempo evidence: `120 BPM`;
- motif pitch evidence: MIDI notes `[60, 64, 67, 64]`;
- motif duration evidence: four quarter-note units;
- one harmonic-quality uncertainty preserved as explicit unknown with bounded alternatives.

Every source-facing claim is instantiated through `src/provenance.mjs`. The observation fixture names its method and source hash expectation; loading fails if the actual WAV hash does not match the expected source identity.

## Source identity

`src/source.mjs` reads source bytes and returns:

```js
{
  schema: 'haunted-phonograph/source/v1',
  byteLength,
  sha256: 'sha256:...'
}
```

The source hash is raw SHA-256 over the recording bytes, distinct from `hashCanonical()` used for structured objects.

## Observation admission

`src/observations.mjs` loads the fixture declaration, verifies the declared source hash, and creates immutable provenance claims:

- `tempo`: evidence;
- `motifPitches`: evidence;
- `motifDurations`: evidence;
- `harmonyQuality`: uncertainty with `UNKNOWN`.

It returns both the claims and their canonical hashes. No downstream function receives the raw observation JSON as authority.

## Minimal PhonographScore

`src/score.mjs` constructs a canonical structured score:

```js
{
  schema: 'haunted-phonograph/score/v1',
  sourceHash,
  observationRefs: {
    tempo,
    motifPitches,
    motifDurations,
    harmonyQuality
  },
  material: {
    motif: <proposal claim>
  },
  role: 'lead',
  mutation: {
    law: 'interval-preserving-motif-displacement/v1',
    stream: 'specimen-001/motif-displacement/v1',
    allowedOffsets: [-5, -2, 2, 5, 7]
  }
}
```

The score's motif proposal cites the heard motif evidence but remains `proposal`. The proposal initially carries the source motif as a compositional starting object; that does not promote proposal into evidence.

The score identity is `hashCanonical(score)`.

## One deterministic mutation law

Implement exactly one law: **interval-preserving motif displacement**.

Inputs:

- score;
- explicit seed string.

Algorithm:

1. Hash `stream + "\0" + seed + "\0" + scoreHash` with SHA-256.
2. Use the first 32-bit unsigned digest word modulo the length of `allowedOffsets` to select exactly one transposition offset.
3. Transpose every motif pitch by that semitone offset.
4. Preserve note-to-note intervals and durations exactly.
5. Refuse any transposed MIDI pitch outside `0..127` rather than clamping silently.

No wall clock, random API, machine identity, or hidden entropy participates.

A changed seed may select the same offset by modulo collision. Integration tests therefore use two fixture seeds proven to select different declared mutation paths; the contract promises deterministic routing, not universal injectivity of arbitrary seed strings.

## ResolvedPerformance

`src/performance.mjs` resolves the mutated score into renderer-neutral state:

```js
{
  schema: 'haunted-phonograph/resolved-performance/v1',
  sourceHash,
  scoreHash,
  tempoBpm: 120,
  ppq: 480,
  mutation: {
    law,
    stream,
    seed,
    selectedOffset
  },
  events: [
    { tick, durationTicks, note, velocity, channel, provenance }
  ],
  retainedUncertaintyRefs: [<harmony uncertainty hash>]
}
```

Tempo enters resolution as direct evidence. Generated note values are proposal choices. The unresolved harmony claim is retained by reference but is not converted into a chord, key, or note choice.

The performance identity is `hashCanonical(performance)`.

## MIDI projection

`src/midi.mjs` implements a dependency-free Standard MIDI File Type 0 exporter.

Profile:

- format 0;
- one track;
- PPQ `480`;
- tempo meta event derived only from resolved `tempoBpm`;
- channel 0 note-on/note-off events from resolved performance events;
- fixed velocity from resolved state;
- end-of-track meta event.

The exporter consumes only `ResolvedPerformance`. It must not inspect the source WAV, observation fixture, score proposal, seed selection rules, or uncertainty.

A small parser used only by tests may decode the emitted Type 0 fixture subset to prove MIDI events correspond exactly to resolved events.

## Receipt

`src/receipt.mjs` builds a success receipt only after MIDI bytes have been successfully written and hashed:

```js
{
  schema: 'haunted-phonograph/receipt/v1',
  status: 'completed',
  sourceHash,
  observationHashes,
  observationAuthorities,
  scoreHash,
  mutation: { law, stream, seed, selectedOffset },
  resolvedPerformanceHash,
  midi: {
    profile: 'smf0-ppq480/v1',
    sha256,
    byteLength
  },
  retainedUncertaintyRefs
}
```

Receipt serialization is canonical JSON plus a final newline for the `.json` projection. The receipt does not hash itself in v1.

## Atomic output boundary

`src/run-specimen.mjs` owns the crossing from pure resolved state to filesystem artifacts.

For an output stem such as `out/specimen-001`:

1. compute source/observations/score/performance in memory;
2. encode MIDI in memory;
3. write MIDI to a temporary sibling path;
4. rename MIDI temp → final `.mid`;
5. hash the final MIDI bytes;
6. construct completed receipt;
7. write receipt to a temporary sibling path;
8. rename receipt temp → final `.receipt.json`.

On failure, temporary files are removed best-effort. A failure before a valid final MIDI exists must never create a success receipt. If receipt writing fails after MIDI finalization, the MIDI may remain as an orphan artifact, but there is still no counterfeit success receipt.

## CLI

`scripts/run-specimen-001.mjs` accepts optional positional arguments:

```text
node scripts/run-specimen-001.mjs [source.wav] [observations.json] [output-stem] [seed]
```

Defaults:

```text
test/fixtures/specimen-001.wav
test/fixtures/specimen-001.observations.json
out/specimen-001
seed-001
```

`package.json` exposes:

```text
npm run specimen:001
```

One default command therefore creates:

```text
out/specimen-001.mid
out/specimen-001.receipt.json
```

## Verification

Tests must prove:

1. source hash binds the exact WAV bytes and observation admission refuses a mismatched source;
2. all source-facing claims use the landed provenance contract;
3. score motif remains proposal authority even though it cites source motif evidence;
4. same source + observations + score + seed produce canonical-identical performance and byte-identical MIDI;
5. selected fixture seeds take different deterministic offsets while observation hashes remain identical;
6. unresolved harmony uncertainty survives by reference and never becomes a fabricated harmonic event;
7. resolved note events preserve source motif intervals and durations while applying only the declared transposition;
8. MIDI decoding yields the same tempo and note events as `ResolvedPerformance`;
9. receipt hashes match the source, structured artifacts, and emitted MIDI bytes;
10. forcing MIDI output failure creates no success receipt;
11. `npm run specimen:001` produces a playable `.mid` and inspectable receipt from the checked-in fixture;
12. the existing provenance test suite remains green.

## Non-goals

- automatic BPM detection;
- pitch tracking;
- chord/key inference;
- audio rendering;
- MIDI input;
- multiple mutation laws;
- multiple tracks/instruments;
- DAW/plugin architecture;
- generalized schema registry;
- shared-package extraction;
- Project0/TranchNode identity integration in this milestone.

## Acceptance boundary

Specimen 001 is complete when the default command produces a standards-valid MIDI file and receipt whose full chain can be reconstructed from repository fixture bytes and canonical structured state, with every source-backed, uncertain, and invented fact still wearing the correct authority class.