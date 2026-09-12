# Acoustic Loci 001 — Verification Receipt

**Date:** 2026-09-12  
**Issue:** #11  
**Implementation PR:** #21  
**Authority:** bounded executable specimen only

## Claim under test

> A transformed cue may support re-entry only if recognition survives while earlier and later world-states remain distinguishable.

Acoustic Loci 001 keeps human recognition as a declared observation. It does not infer cognition, source truth, ancestry, or authority from recognition.

## Executable surface

The specimen adds four bounded seams:

1. canonical Acoustic Locus declaration with distinct attributable world references;
2. canonical human re-entry observations for conditions `A / B / C / D`;
3. deterministic conservative evaluator with only `supports-bounded-reentry`, `insufficient`, and `refuses` verdicts;
4. file-backed runner that writes one canonical receipt atomically.

The runner does not call the normal score, mutation, rendering, HAUNT, RING, or Storyship runtime paths.

## Four-condition witness

```text
A = original landmark in original neighborhood
B = transformed rendering preserving the declared relation
C = transformation with the declared relation broken
D = unrelated control
```

The v0.1 evaluator supports bounded re-entry only when:

```text
A.recognition == recognized
B.recognition == recognized
B.worldAssessment == changed
C.recognition != recognized
D.recognition != recognized
```

It refuses when the unrelated control is recognized or when `B` is assessed as the same world. Other incomplete patterns remain `insufficient`.

Input order is normalized before result identity is computed.

## RED → GREEN receipts

### Task 1 — locus declaration

- RED commit: `4e0ba8b0dcf2912e5be36f9daa17772cc68ff95e`
- RED witness: Actions run #100 — failed with the production module intentionally absent
- GREEN commit: `91257ad888a8d6ffba73a226443c1d9a6c28cbdc`
- GREEN witness: Actions run #102 — passed

### Task 2 — human re-entry observations

- RED commit: `b049486ccbbc6b87158bb8ce23afb5036d36529f`
- RED witness: Actions run #104 — failed with the production module intentionally absent
- GREEN commit: `46271ebe3d2ebc01303d85dc9ffc813c147af4de`
- GREEN witness: Actions run #106 — passed

### Task 3 — A/B/C/D evaluator

- RED commit: `9259950904d777c6766c074455124f339ab6afc2`
- RED witness: Actions run #109 — failed with the evaluator intentionally absent
- GREEN commit: `6c9f78f83fed55cdfd6f31c718fe3356123af429`
- GREEN witness: Actions run #111 — passed

### Task 4 — file-backed specimen runner

- RED commit: `5ec664e2e8f44b4d4fa58304a8063edd334a7fa6`
- RED witness: Actions run #113 — failed with the runner/fixtures intentionally absent
- GREEN implementation head: `05e7cbe9842b39fda023d6802bc3dd0b78f9fb80`
- GREEN witness: Actions PR run #125 — passed

## Fresh full-suite verification

GitHub Actions PR run #125 executed:

```text
npm test
> node --test
```

Result:

```text
tests     66
pass      66
fail       0
cancelled  0
skipped    0
todo       0
```

The same run includes the two file-backed integration checks:

```text
runs Acoustic Loci 001 from declarations and writes a stable canonical receipt
receipt verdict is derived and is never accepted from fixture input
```

The integration test runs the same declaration set twice with reversed observation-path order and requires identical canonical receipt bytes and receipt identity.

## PROVED

One bounded declaration/evaluation protocol can distinguish this declared transformed-and-recognized changed-world pattern from relation-broken and unrelated controls while preserving deterministic receipts.

The implementation proves that, for this explicit four-condition fixture protocol:

- recognition can remain observation rather than source evidence;
- original and later world references can remain distinct;
- unrelated-control recognition can refuse rather than be averaged away;
- input order can be removed as an accidental source of result identity;
- identical declarations can produce byte-stable canonical receipts;
- no ancestry or authority field is required to record the witness.

## NOT PROVED

Acoustic Loci 001 does **not** prove:

- general human memory behavior;
- universal auditory semantics;
- that recognition establishes ancestry;
- model cognition or machine consciousness;
- that Bandcamp listeners navigate the catalog this way;
- that rendering identity and place identity are equivalent;
- HAUNT or RING behavior;
- Storyship continuity or admission;
- any new evidence, renderer/export, constitutional, or destination authority.

## Non-promotion receipt

```text
recognition != source evidence
resemblance != ancestry
re-entry result != authority
Acoustic Loci != HAUNT
Acoustic Loci != RING
Acoustic Loci != Storyship
```

**Working seal:** the landmark may survive the changed sound without pretending the world stayed the same.
