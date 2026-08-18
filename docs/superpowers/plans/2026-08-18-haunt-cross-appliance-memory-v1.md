# HAUNT v0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove that one Toaster-derived memory capsule can deterministically alter Haunted Phonograph proposal routing, survive into the completed receipt as influence-only evidence, and produce a Phonograph-derived return capsule without promoting sibling memory into source truth or execution authority.

**Architecture:** Add a small HAUNT capsule contract plus a Phonograph-only proposal-time influence adapter. The first portable relation, `restraint-before-expansion`, maps to one proposal-only performance route: `late-bloom`, a deterministic velocity contour that begins restrained and expands late while pitches, tempo, durations, source observation hashes, and harmony uncertainty remain unchanged. Raw capsules never cross the `ResolvedPerformance` boundary; only the resolved influence summary does.

**Tech Stack:** Node.js >=22, ESM `.mjs`, built-in `node:test`, built-in `node:crypto`, existing `hp-canonical-json-v1` canonicalization/hash utilities, dependency-free MIDI path.

**Spec:** `docs/superpowers/specs/2026-08-18-haunt-cross-appliance-memory-v1-design.md`

## Global Constraints

- Cross-appliance memory is `influence-only`; it must not become source `evidence`, ancestry, timing authority, score authority, performance authority, or renderer/exporter authority.
- Source observation hashes must remain unchanged by HAUNT influence.
- No hidden entropy: routing derives only from explicit score identity, ordered capsule identities, named policy/stream identity, and seed.
- No ambient memory lookup after proposal/mutation routing.
- Valid-but-irrelevant capsules produce deterministic ignore residue rather than forced influence.
- No shared package, database, service, model call, UI, cloud sync, or Toaster production behavior in this plan.
- Keep runtime dependency count at zero.
- Preserve Specimen 001 byte/semantic behavior when no HAUNT capsule is supplied.

---

## File Structure

- Create `src/haunt-capsule.mjs` — construct, validate, canonicalize, and hash influence-only capsules.
- Create `src/haunt-influence.mjs` — turn ordered valid capsules into one deterministic proposal-time influence plan.
- Modify `src/mutation.mjs` — attach one explicit proposal route and velocity contour; preserve legacy path when absent.
- Modify `src/performance.mjs` — realize the already-resolved velocity contour and carry only the influence summary.
- Modify `src/receipt.mjs` — bind influence identity and prove mutation/performance summaries match.
- Create `src/haunt-return.mjs` — derive one Phonograph-origin return capsule from completed receipt residue.
- Modify `src/run-specimen.mjs` — optionally load HAUNT capsule JSON and emit canonical return sidecar.
- Create `test/haunt-capsule.test.mjs`.
- Create `test/haunt-influence.test.mjs`.
- Create `test/haunt-return.test.mjs`.
- Modify `test/specimen-score-performance.test.mjs`.
- Modify `test/specimen-run.test.mjs`.
- Create `test/fixtures/haunt-toaster-restraint-before-expansion.json`.

---

### Task 1: Canonical HAUNT Capsule Contract

**Files:**
- Create: `src/haunt-capsule.mjs`
- Create: `test/haunt-capsule.test.mjs`
- Create: `test/fixtures/haunt-toaster-restraint-before-expansion.json`

**Interfaces:**
- Consumes: `hashCanonical(value)` from `src/provenance.mjs`.
- Produces: `HAUNT_CAPSULE_SCHEMA`, `createHauntCapsule(input)`, `validateHauntCapsule(capsule)`, `hashHauntCapsule(capsule)`.

- [ ] **Step 1: Write failing tests**

```js
const capsule = createHauntCapsule({
  sourceRef: 'sha256:source',
  encounterRef: 'sha256:receipt',
  origin: { appliance: 'haunted-toaster', receiptRef: 'sha256:receipt', policy: 'toaster-memory-export/v1' },
  relations: [{ relation: 'restraint-before-expansion', direction: 'positive', strength: 0.8, evidenceRefs: ['sha256:receipt'] }],
  invitations: [{ pressure: 'late-bloom', strength: 0.8, allowedSurfaces: ['mutation-path'] }],
  lineage: { parentRefs: [], influenceOnlyRefs: [], refusedRefs: [] },
  unresolved: [],
  derivedFrom: ['sha256:receipt'],
});
assert.equal(capsule.schema, 'static-collective/haunt-memory-capsule/v1');
assert.equal(capsule.provenance.authority, 'influence-only');
assert.equal(hashHauntCapsule(capsule), capsule.capsuleId);
```

Also test `HAUNT_IDENTITY_MISMATCH`, `HAUNT_AUTHORITY_VIOLATION`, `HAUNT_FORBIDDEN_SURFACE`, malformed origin/receipt data, non-finite/out-of-range strength, and deep freezing.

- [ ] **Step 2: Run RED**

```bash
node --test test/haunt-capsule.test.mjs
```

Expected: module-not-found failure.

- [ ] **Step 3: Implement the minimal contract**

`hashHauntCapsule()` removes only `capsuleId` before calling `hashCanonical()`. `createHauntCapsule()` always writes `provenance.authority: 'influence-only'`, derives identity, then validates. `validateHauntCapsule()` accepts only schema v1 and `allowedSurfaces: ['mutation-path']` for this first crossing.

- [ ] **Step 4: Create the fixed Toaster-derived fixture**

Use the module to generate one canonical fixture whose portable relation is `restraint-before-expansion` and invitation pressure is `late-bloom`. The receipt/source refs are explicit fixture identities, not claims that a live Toaster database was queried during this test.

- [ ] **Step 5: Run GREEN and commit**

```bash
node --test test/haunt-capsule.test.mjs
git add src/haunt-capsule.mjs test/haunt-capsule.test.mjs test/fixtures/haunt-toaster-restraint-before-expansion.json
git commit -m "feat: add canonical HAUNT capsule contract"
```

---

### Task 2: Proposal-Time Influence Plan

**Files:**
- Create: `src/haunt-influence.mjs`
- Create: `test/haunt-influence.test.mjs`

**Interfaces:**
- Consumes: score, explicit seed, `validateHauntCapsule()`.
- Produces: `buildHauntInfluencePlan({ score, seed, capsules })` -> frozen `haunted-phonograph/haunt-influence-plan/v1`.

- [ ] **Step 1: Write failing tests**

```js
const plan = buildHauntInfluencePlan({ score, seed: 'seed-001', capsules: [capsule] });
assert.equal(plan.policy, 'haunt-proposal-influence/v1');
assert.equal(plan.stream, 'haunt/mutation-path/v1');
assert.equal(plan.routePressure, 'late-bloom');
assert.deepEqual(plan.consumedCapsuleIds, [capsule.capsuleId]);
```

Prove same inputs replay identically; caller order normalizes by `capsuleId`; unsupported pressure becomes deterministic `ignored: [{ capsuleId, reason: 'UNSUPPORTED_PRESSURE' }]`; no applicable invitation becomes `NO_APPLICABLE_INVITATION`; and the score/capsules remain unchanged.

- [ ] **Step 2: Run RED**

```bash
node --test test/haunt-influence.test.mjs
```

- [ ] **Step 3: Implement plan construction**

Validate all capsules, sort by ID, reject contradictory duplicate IDs, select the strongest supported `late-bloom` invitation with `capsuleId` tie-break, and record all non-consumed valid capsules in `ignored`. Do not read observations or renderer state.

- [ ] **Step 4: Run GREEN and commit**

```bash
node --test test/haunt-influence.test.mjs
git add src/haunt-influence.mjs test/haunt-influence.test.mjs
git commit -m "feat: admit HAUNT memory as proposal influence"
```

---

### Task 3: Execute `late-bloom` as Proposal-Only Dynamics

**Files:**
- Modify: `src/mutation.mjs`
- Modify: `src/performance.mjs`
- Modify: `test/specimen-score-performance.test.mjs`

**Interfaces:**
- Consumes: optional `hauntInfluencePlan`.
- Produces: mutation result fields `velocityProfile` and `hauntInfluence`; resolved events use the profile.

- [ ] **Step 1: Write failing behavior tests**

For the four-note Specimen 001 motif, define the v0.1 `late-bloom` contour exactly:

```js
const haunted = mutateScore({ score, seed: 'seed-001', hauntInfluencePlan: plan });
assert.deepEqual(haunted.velocityProfile, [56, 64, 88, 108]);
assert.deepEqual(haunted.pitches, baseline.pitches);
assert.deepEqual(haunted.durationsQuarter, baseline.durationsQuarter);
```

Then resolve performance and assert:

```js
assert.deepEqual(performance.events.map(event => event.velocity), [56, 64, 88, 108]);
assert.deepEqual(observations.hashes, beforeObservationHashes);
assert.deepEqual(performance.retainedUncertaintyRefs, [observations.hashes.harmonyQuality]);
```

Legacy no-HAUNT calls must still resolve all event velocities to `88` and preserve current selected-offset behavior exactly.

- [ ] **Step 2: Run RED**

```bash
node --test test/specimen-score-performance.test.mjs
```

- [ ] **Step 3: Implement mutation route**

Change signature to:

```js
export function mutateScore({ score, seed, hauntInfluencePlan = null })
```

Keep the existing pitch displacement selection untouched. If a consumed influence plan has `routePressure === 'late-bloom'`, add `velocityProfile: [56, 64, 88, 108]` for the four-event v0.1 specimen and copy a compact frozen `hauntInfluence` summary. If no plan is consumed, use the legacy uniform velocity profile `[88, 88, 88, 88]` and `hauntInfluence: null`.

The profile is a **proposal choice**. It must never be added to observations or labeled source evidence.

- [ ] **Step 4: Realize the profile downstream**

`resolvePerformance()` uses `mutationResult.velocityProfile[index]` instead of hard-coded `88`, validates every velocity as integer `1..127`, and copies only the compact influence summary. No capsule body or memory lookup is allowed in performance state.

- [ ] **Step 5: Run GREEN and commit**

```bash
node --test test/specimen-score-performance.test.mjs test/specimen-midi.test.mjs
git add src/mutation.mjs src/performance.mjs test/specimen-score-performance.test.mjs
git commit -m "feat: let HAUNT memory shape phonograph dynamics"
```

---

### Task 4: Bind HAUNT Into Receipt and End-to-End Run

**Files:**
- Modify: `src/receipt.mjs`
- Modify: `src/run-specimen.mjs`
- Modify: `test/specimen-run.test.mjs`

**Interfaces:**
- Consumes: optional capsule JSON before mutation; mutation/performance HAUNT summary afterward.
- Produces: completed receipt `hauntInfluence` field and optional `capsulesPath` run input.

- [ ] **Step 1: Write failing receipt tests**

Assert the completed HAUNT receipt binds policy, stream, ordered capsule IDs, consumed IDs, ignored residues, and `routePressure`. A deliberately mismatched mutation/performance influence summary must throw `RECEIPT_CHAIN_MISMATCH`.

- [ ] **Step 2: Run RED**

```bash
node --test test/specimen-run.test.mjs
```

- [ ] **Step 3: Extend receipt chain validation**

Compare mutation/performance HAUNT summaries using `hashCanonical()` or exact canonical equality. Store only the resolved summary; never store raw capsule bodies in the receipt.

- [ ] **Step 4: Extend `runSpecimen()`**

```js
runSpecimen({ sourcePath, observationsPath, outputStem, seed, capsulesPath = null })
```

When present, load one object or array from `capsulesPath`, validate capsules, build the influence plan after `buildScore()`, and pass it into `mutateScore()`. When absent, follow the legacy path.

- [ ] **Step 5: Prove deterministic crossing**

Run the same source/observations/capsule/seed twice and assert identical score hash, resolved-performance hash, MIDI hash, and influence summary. Compare a no-memory run and assert identical admitted observation hashes while its velocities remain legacy `[88,88,88,88]`.

- [ ] **Step 6: Run GREEN and commit**

```bash
node --test test/specimen-run.test.mjs
git add src/receipt.mjs src/run-specimen.mjs test/specimen-run.test.mjs
git commit -m "feat: bind HAUNT influence into phonograph receipts"
```

---

### Task 5: Emit Phonograph Return Residue

**Files:**
- Create: `src/haunt-return.mjs`
- Create: `test/haunt-return.test.mjs`
- Modify: `src/run-specimen.mjs`
- Modify: `test/specimen-run.test.mjs`

**Interfaces:**
- Consumes: completed receipt plus explicit unresolved/refused residue.
- Produces: `derivePhonographHauntCapsule({ receipt, unresolved = [], refusedRefs = [] })` and `<outputStem>.haunt.json`.

- [ ] **Step 1: Write failing return tests**

```js
const returned = derivePhonographHauntCapsule({
  receipt,
  unresolved: [{
    subject: 'harmony-quality',
    alternatives: ['minor', 'modal'],
    evidenceRefs: [...receipt.retainedUncertaintyRefs],
  }],
  refusedRefs: ['proposal-world:forbidden-range'],
});
assert.equal(returned.origin.appliance, 'haunted-phonograph');
assert.equal(returned.provenance.authority, 'influence-only');
assert.deepEqual(returned.lineage.refusedRefs, ['proposal-world:forbidden-range']);
assert.equal(Object.hasOwn(returned, 'evidence'), false);
```

Prove `encounterRef` is the canonical completed-receipt hash, not the source hash, and that no caller can upgrade return authority.

- [ ] **Step 2: Run RED**

```bash
node --test test/haunt-return.test.mjs
```

- [ ] **Step 3: Implement derivation**

Build via `createHauntCapsule()`. When the receipt consumed `late-bloom`, emit portable relation `memory-influenced-late-bloom`. Preserve supplied unresolved/refused residue exactly by reference; do not infer KEEP/WEIRD/COMPOST without an actual Human Verdict.

- [ ] **Step 4: Emit canonical sidecar**

After successful receipt creation in a HAUNT run, derive and atomically write `<outputStem>.haunt.json`. Use the already-retained harmony uncertainty ref as unresolved evidence and do not invent chord alternatives unless the caller supplied them. If the optional return-sidecar write fails, do not delete or counterfeit the already-completed MIDI/receipt.

- [ ] **Step 5: Run GREEN and commit**

```bash
node --test test/haunt-return.test.mjs test/specimen-run.test.mjs
git add src/haunt-return.mjs src/run-specimen.mjs test/haunt-return.test.mjs test/specimen-run.test.mjs
git commit -m "feat: emit phonograph HAUNT return residue"
```

---

### Task 6: Full Verification and Documentation

**Files:**
- Modify: `README.md`
- Create: `docs/haunt-v0.1-verification.md`

**Interfaces:**
- Produces: exact-head verification evidence and usage notes; no new runtime behavior.

- [ ] **Step 1: Document the HAUNT specimen**

Show how to call `runSpecimen()` with `capsulesPath: 'test/fixtures/haunt-toaster-restraint-before-expansion.json'`. State that the fixture is a bounded Toaster-derived encounter residue and enters only as influence.

- [ ] **Step 2: Run syntax checks**

```bash
node --check src/haunt-capsule.mjs
node --check src/haunt-influence.mjs
node --check src/haunt-return.mjs
node --check src/mutation.mjs
node --check src/performance.mjs
node --check src/receipt.mjs
node --check src/run-specimen.mjs
```

- [ ] **Step 3: Run the full suite**

```bash
npm test
```

Expected: all pre-existing tests plus all HAUNT tests pass.

- [ ] **Step 4: Run the exact specimen twice**

Record exact head SHA, source hash, capsule ID, score hash, resolved-performance hash, MIDI hash, return capsule ID, and test count. Identical inputs must produce identical identities.

- [ ] **Step 5: Record verification and commit**

Create `docs/haunt-v0.1-verification.md`; explicitly state that actual Toaster return admission is not yet implemented and remains behind its current beta sequencing gates.

```bash
git add README.md docs/haunt-v0.1-verification.md
git commit -m "docs: record HAUNT v0.1 executable proof"
```

- [ ] **Step 6: Update PR #8**

Push all commits to `docs/haunt-cross-appliance-memory-v1`, update PR #8 from design-only to executable proof, and mark ready for review only after exact-head verification is green.

---

## Separate Later Plan: Toaster Return Adapter

After the current Toaster Creative Context Table/candidate-ecology sequencing gates settle, write a separate Toaster plan that admits a real Phonograph return capsule as `memory/haunt-capsule-v1`, maps it to Creative Context Table authority `influence-only`, proves ancestry remains `none` without independent explicit Re-toast ancestry, and proves no raw capsule state crosses `executionForRender()`. Contract admission comes before any ordinary candidate behavior change.
