# RING v0.1 — Verification Receipt

**Date:** 2026-09-12  
**Issue:** #10  
**Implementation PR:** #22  
**Authority:** bounded executable musical specimen only

## Claim under test

> **History can alter susceptibility without altering authority.**

RING v0.1 asks whether one attributable history residue can change which already-lawful musical transformation becomes eligible next while source evidence, uncertainty, proposal authority, and renderer/export authority remain outside the cavity.

## Frozen cavity

Exactly three musical relations are admitted:

```text
interval-displacement
rhythmic-stretch
dynamic-bloom
```

The branch is hard-bounded at four propagation steps and uses deterministic integer susceptibility. No wall-clock decay or hidden entropy is present.

### No-history control

```text
initial susceptibility
  interval-displacement = 10
  rhythmic-stretch      = 4
  dynamic-bloom         = 3

interval-displacement fires
  -> prior Specimen 001 displacement law is reused
  -> rhythmic-stretch rises only to 8
  -> no relation remains eligible
  -> terminal = damped
```

The resulting pitch displacement, durations, and uniform velocity preserve the prior behavior shape.

### Late-bloom history witness

An already-admitted HAUNT influence plan carrying `late-bloom` pressure changes only the initial susceptibility field:

```text
initial = { displacement: 10, stretch: 4, bloom: 13 }

1. dynamic-bloom
2. interval-displacement
3. rhythmic-stretch

terminal = completed
```

The realized bounded consequences are:

```text
dynamic-bloom     -> [56, 64, 88, 108] velocity profile
interval-displace -> existing deterministic displacement result
rhythmic-stretch  -> durations × 3/2
```

Raw HAUNT capsules never enter the RING trace or receipt.

## RED → GREEN receipts

### Task 1 — bounded propagation cavity

- RED commit: `9806af73ca6b9a70e1264ad006d8ed4680454e75`
- RED witness: Actions run #134 — failed with `src/ring.mjs` intentionally absent
- GREEN commit: `bc057c8825cf58e8b946a85bdf35a107fd4a0a17`
- GREEN witness: Actions run #136 — passed

### Task 2 — existing ResolvedPerformance membrane

- RED commit: `2fb998f4d8d592520d2f025d9d3043d94b24f45c`
- RED witness: Actions run #141 — failed with `src/run-ring.mjs` intentionally absent
- GREEN commit: `9f6fdfb97b198ba6a787f7cbaa95f13803aaabf9`
- GREEN witness: Actions run #144 — passed

### Task 3 — deterministic RING receipt

- RED commit: `d5987a2ab940272a6e3e61dd05a18514e346f2d6`
- RED witness: Actions run #146 — failed with `src/ring-receipt.mjs` intentionally absent
- GREEN commit: `7c075f01a78ae20c93724dfd2116067a2755df9d`
- GREEN witness: Actions run #148 — passed

## Fresh full-suite verification

Actions run #148 executed:

```text
npm test
> node --test
```

Result:

```text
tests     62
pass      62
fail       0
cancelled  0
skipped    0
todo       0
```

The same run includes the RING-specific witnesses:

```text
receipt binds exact history, trace, performance, and terminal state
no-history receipt keeps an explicit null history identity
identical runs produce identical receipt identity
no-history RING preserves prior musical behavior shape
late-bloom RING changes susceptibility and resolves bounded musical consequences
identical RING inputs reproduce trace and resolved performance identities
declares exactly three native musical relations
no-history path preserves prior displacement shape and damps
late-bloom history changes eligibility without changing authority
replay is deterministic and branch length is bounded
rejects a HAUNT plan bound to another score or seed
```

## PROVED

Within this explicit three-relation musical cavity:

- attributable `late-bloom` history can change deterministic transform eligibility;
- the no-history control preserves the existing interval-displacement behavior shape and then damps;
- the history-bearing sibling follows a different deterministic path: `dynamic-bloom -> interval-displacement -> rhythmic-stretch`;
- propagation remains bounded and replayable;
- resolved performance remains downstream of the existing `ResolvedPerformance` membrane;
- source observation hashes remain unchanged by the RING run;
- retained harmony uncertainty remains retained uncertainty;
- trace and receipt identities are deterministic;
- history identity can be bound without importing raw capsule payloads or authority.

## NOT PROVED

RING v0.1 does **not** prove:

- general musical cognition;
- universal resonance mathematics;
- catalog-scale musical memory;
- recurrence as ancestry;
- history as evidence or authority;
- renderer or export authority;
- a universal transform graph;
- a harmonic engine;
- a self-witness loop;
- a general generative-composer architecture.

## Non-promotion receipt

```text
history != authority
susceptibility != evidence
resonance != canon
HAUNT influence != source truth
RING trace != renderer authority
frequency != warrant
```

Existing `mutation.mjs`, `performance.mjs`, HAUNT modules, receipt machinery, and the normal Specimen 001 runner are not modified by RING v0.1.

> **History may change what readily rings next. It does not decide what is true or who has authority.**
