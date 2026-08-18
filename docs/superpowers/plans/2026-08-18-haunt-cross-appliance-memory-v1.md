# HAUNT v0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove that one Toaster-derived memory capsule can deterministically alter Haunted Phonograph proposal routing, survive into the completed receipt as influence-only evidence, and produce a Phonograph-derived return capsule without promoting sibling memory into source truth or execution authority.

**Architecture:** Add a small HAUNT capsule contract module and a Phonograph-only influence adapter at proposal time. The adapter chooses one bounded mutation-route pressure before `ResolvedPerformance`; downstream performance/MIDI remain renderer-neutral and receive no ambient memory lookup. The first proof uses a checked-in Toaster-derived fixture capsule; the actual Toaster adapter is a separate later plan after Toaster beta gates permit it.

**Tech Stack:** Node.js >=22, ESM `.mjs`, built-in `node:test`, built-in `node:crypto`, existing `hp-canonical-json-v1` canonicalization/hash utilities, dependency-free MIDI path.

**Spec:** `docs/superpowers/specs/2026-08-18-haunt-cross-appliance-memory-v1-design.md`

## Global Constraints

- Cross-appliance memory is `influence-only`; it must not become `evidence`, ancestry, timing authority, score authority, performance authority, or renderer/exporter authority.
- Source observation hashes must remain unchanged by HAUNT influence.
- No hidden entropy: route choice derives only from explicit score identity, ordered capsule identities, named policy/stream, and seed.
- No ambient memory lookup after proposal/mutation routing.
- Valid-but-irrelevant capsules produce deterministic ignore/refusal residue rather than forced influence.
- No shared package, database, service, model call, UI, cloud sync, or Toaster production behavior in this plan.
- Keep runtime dependency count at zero.
- Preserve existing Specimen 001 behavior when no HAUNT capsules are supplied.

---

## File Structure

- Create `src/haunt-capsule.mjs` — canonical HAUNT capsule construction, validation, hashing, and fail-closed sibling authority rules.
- Create `src/haunt-influence.mjs` — Phonograph proposal-time admission and deterministic influence-plan construction.
- Modify `src/mutation.mjs` — consume one explicit influence plan when supplied; preserve legacy behavior when absent.
- Modify `src/performance.mjs` — carry only already-resolved HAUNT influence evidence, never raw capsules or lookup capability.
- Modify `src/receipt.mjs` — bind consumed/ignored capsule identities and influence policy into the completed receipt and chain validation.
- Create `src/haunt-return.mjs` — derive a new influence-only Phonograph capsule from a completed receipt plus bounded unresolved/refusal lineage.
- Modify `src/run-specimen.mjs` — optionally load a capsule fixture before score mutation and write an optional return capsule sidecar.
- Create `test/haunt-capsule.test.mjs` — capsule identity, validation, authority, canonicalization, and malformed input tests.
- Create `test/haunt-influence.test.mjs` — deterministic consume/ignore behavior and source-hash immutability tests.
- Modify `test/specimen-score-performance.test.mjs` — HAUNT-aware mutation/performance boundary tests plus legacy regression.
- Modify `test/specimen-run.test.mjs` — receipt and end-to-end sidecar binding tests.
- Create `test/haunt-return.test.mjs` — return-capsule authority and unresolved/refused lineage tests.
- Create `test/fixtures/haunt-toaster-restraint-before-expansion.json` — one fixed Toaster-derived capsule fixture with stable receipt/source references and one portable invitation.

---

### Task 1: Canonical HAUNT Capsule Contract

**Files:**
- Create: `src/haunt-capsule.mjs`
- Create: `test/haunt-capsule.test.mjs`
- Create: `test/fixtures/haunt-toaster-restraint-before-expansion.json`

**Interfaces:**
- Consumes: `hashCanonical(value)` and canonical JSON safety from `src/provenance.mjs`.
- Produces: `HAUNT_CAPSULE_SCHEMA`, `validateHauntCapsule(capsule)`, `hashHauntCapsule(capsule)`, `createHauntCapsule(input)`.

- [ ] **Step 1: Write failing contract tests**

Add tests proving:

```js
const capsule = createHauntCapsule({
  sourceRef: 'sha256:source',
  encounterRef: 'sha256:receipt',
  origin: {
    appliance: 'haunted-toaster',
    receiptRef: 'sha256:receipt',
    policy: 'toaster-memory-export/v1',
  },
  relations: [{
    relation: 'restraint-before-expansion',
    direction: 'positive',
    strength: 0.8,
    evidenceRefs: ['sha256:receipt'],
  }],
  invitations: [{
    pressure: 'late-bloom',
    strength: 0.8,
    allowedSurfaces: ['mutation-path'],
  }],
  unresolved: [],
  lineage: { parentRefs: [], influenceOnlyRefs: [], refusedRefs: [] },
  derivedFrom: ['sha256:receipt'],
});

assert.equal(capsule.schema, 'static-collective/haunt-memory-capsule/v1');
assert.equal(capsule.provenance.authority, 'influence-only');
assert.equal(hashHauntCapsule(capsule), capsule.capsuleId);
```

Also assert that changing capsule content while reusing the old `capsuleId` throws `HAUNT_IDENTITY_MISMATCH`, authority other than `influence-only` throws `HAUNT_AUTHORITY_VIOLATION`, unsupported surfaces throw `HAUNT_FORBIDDEN_SURFACE`, and malformed origin/receipt refs fail closed.

- [ ] **Step 2: Run the focused test to prove RED**

Run:

```bash
node --test test/haunt-capsule.test.mjs
```

Expected: FAIL because `src/haunt-capsule.mjs` does not exist.

- [ ] **Step 3: Implement minimal capsule contract**

Implement a dependency-free module that:

```js
export const HAUNT_CAPSULE_SCHEMA = 'static-collective/haunt-memory-capsule/v1';

export function hashHauntCapsule(capsule) {
  const { capsuleId: _ignored, ...identityBody } = capsule;
  return hashCanonical(identityBody);
}

export function validateHauntCapsule(capsule) {
  // exact schema
  // exact influence-only provenance authority
  // non-empty origin appliance/receiptRef/policy
  // arrays for relations/invitations/unresolved and lineage refs
  // strength finite in 0..1
  // only allowedSurfaces === ['mutation-path'] for v0.1
  // recompute capsule identity and reject mismatch
  return deepFreeze(structuredClone(capsule));
}
```

`createHauntCapsule()` must construct the body, derive `capsuleId` from the body without `capsuleId`, then validate the result. Do not accept callers supplying stronger authority.

- [ ] **Step 4: Add the fixed Toaster-derived fixture**

Create `test/fixtures/haunt-toaster-restraint-before-expansion.json` using the exact schema, `origin.appliance: "haunted-toaster"`, one `restraint-before-expansion` relation, one `late-bloom` invitation, `allowedSurfaces: ["mutation-path"]`, and a correctly computed capsule identity generated by the module in a one-off Node command.

- [ ] **Step 5: Run focused tests GREEN**

Run:

```bash
node --test test/haunt-capsule.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/haunt-capsule.mjs test/haunt-capsule.test.mjs test/fixtures/haunt-toaster-restraint-before-expansion.json
git commit -m "feat: add canonical HAUNT capsule contract"
```

---

### Task 2: Proposal-Time HAUNT Influence Plan

**Files:**
- Create: `src/haunt-influence.mjs`
- Create: `test/haunt-influence.test.mjs`

**Interfaces:**
- Consumes: `validateHauntCapsule()`, `hashHauntCapsule()`, score hash, explicit seed.
- Produces: `buildHauntInfluencePlan({ score, seed, capsules })` returning frozen `haunted-phonograph/haunt-influence-plan/v1`.

- [ ] **Step 1: Write failing influence tests**

Test four cases:

```js
const plan = buildHauntInfluencePlan({ score, seed: 'seed-001', capsules: [capsule] });
assert.equal(plan.schema, 'haunted-phonograph/haunt-influence-plan/v1');
assert.deepEqual(plan.orderedCapsuleIds, [capsule.capsuleId]);
assert.deepEqual(plan.consumedCapsuleIds, [capsule.capsuleId]);
assert.equal(plan.routePressure, 'late-bloom');
assert.equal(plan.policy, 'haunt-proposal-influence/v1');
assert.equal(plan.stream, 'haunt/mutation-path/v1');
```

Also prove: same score/seed/capsules gives deep-equal plan; reversed unordered caller input is normalized by `capsuleId`; a valid capsule with no `mutation-path` invitation becomes `ignored` with deterministic reason `NO_APPLICABLE_INVITATION`; and observation hash objects passed to the surrounding test fixture are byte-for-byte unchanged.

- [ ] **Step 2: Run focused test RED**

```bash
node --test test/haunt-influence.test.mjs
```

Expected: FAIL because `src/haunt-influence.mjs` is absent.

- [ ] **Step 3: Implement minimal influence plan**

Implement:

```js
export function buildHauntInfluencePlan({ score, seed, capsules = [] }) {
  // validate non-empty seed and supported score schema
  // validate every capsule
  // sort by capsuleId
  // reject duplicate capsuleIds with contradictory canonical bodies
  // inspect only invitation.allowedSurfaces === ['mutation-path']
  // select the strongest invitation deterministically; tie-break by capsuleId
  // record consumedCapsuleIds, ignored[{ capsuleId, reason }]
  // never mutate score/capsules
  // no random/global state
}
```

For v0.1 the only supported route pressure is `late-bloom`; unsupported pressure values remain valid capsule data but are deterministically ignored as `UNSUPPORTED_PRESSURE`.

- [ ] **Step 4: Run focused test GREEN**

```bash
node --test test/haunt-influence.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/haunt-influence.mjs test/haunt-influence.test.mjs
git commit -m "feat: admit HAUNT memory as proposal influence"
```

---

### Task 3: Deterministic Mutation-Path Consumption Without Evidence Promotion

**Files:**
- Modify: `src/mutation.mjs`
- Modify: `src/performance.mjs`
- Modify: `test/specimen-score-performance.test.mjs`

**Interfaces:**
- Consumes: optional `hauntInfluencePlan` from Task 2.
- Produces: mutation result with explicit `hauntInfluence` summary; performance retains only that resolved summary and capsule IDs.

- [ ] **Step 1: Write failing mutation/performance tests**

Extend setup to load the fixture capsule and build an influence plan, then assert:

```js
const baseline = mutateScore({ score, seed: 'seed-001' });
const haunted = mutateScore({ score, seed: 'seed-001', hauntInfluencePlan: plan });

assert.equal(haunted.hauntInfluence.policy, 'haunt-proposal-influence/v1');
assert.equal(haunted.hauntInfluence.routePressure, 'late-bloom');
assert.deepEqual(haunted.hauntInfluence.consumedCapsuleIds, plan.consumedCapsuleIds);
assert.deepEqual(observations.hashes, beforeObservationHashes);
```

Define the bounded v0.1 musical effect precisely: `late-bloom` does **not** invent harmony or notes. It changes only the allowed transposition route by deterministically preferring the largest absolute legal offset from the existing `allowedOffsets`; ties are resolved through the existing seed digest. Durations, source evidence, motif intervals, and performer event count remain unchanged.

Also assert calling `mutateScore({ score, seed })` with no HAUNT plan remains deep-compatible with existing Specimen 001 expectations.

- [ ] **Step 2: Run focused tests RED**

```bash
node --test test/specimen-score-performance.test.mjs
```

Expected: new HAUNT assertions fail because `mutateScore` ignores the plan.

- [ ] **Step 3: Implement mutation-path consumption**

Change signature to:

```js
export function mutateScore({ score, seed, hauntInfluencePlan = null })
```

When `routePressure === 'late-bloom'`, derive an eligible subset containing offsets with maximal absolute magnitude; use the already domain-separated digest to select among ties. When no consumed HAUNT pressure exists, preserve the current modulo selection across all `allowedOffsets` exactly.

Return:

```js
hauntInfluence: plan ? {
  policy: plan.policy,
  stream: plan.stream,
  orderedCapsuleIds: [...plan.orderedCapsuleIds],
  consumedCapsuleIds: [...plan.consumedCapsuleIds],
  ignored: plan.ignored.map(x => ({ ...x })),
  routePressure: plan.routePressure,
} : null
```

- [ ] **Step 4: Thread only resolved influence summary through performance**

`resolvePerformance()` must copy `mutationResult.hauntInfluence` into `performance.hauntInfluence` without raw capsule bodies and without looking up memory. Add chain checks that its value is structurally identical to the mutation result summary.

- [ ] **Step 5: Run focused and legacy tests GREEN**

```bash
node --test test/specimen-score-performance.test.mjs test/specimen-midi.test.mjs
```

Expected: PASS, including unchanged MIDI projection law.

- [ ] **Step 6: Commit**

```bash
git add src/mutation.mjs src/performance.mjs test/specimen-score-performance.test.mjs
git commit -m "feat: route one musical mutation through HAUNT memory"
```

---

### Task 4: Receipt Binding and End-to-End HAUNT Specimen

**Files:**
- Modify: `src/receipt.mjs`
- Modify: `src/run-specimen.mjs`
- Modify: `test/specimen-run.test.mjs`

**Interfaces:**
- Consumes: optional ordered capsules and influence plan before mutation; resolved mutation/performance state after Task 3.
- Produces: receipt field `hauntInfluence` and optional `capsulesPath` input for `runSpecimen()`.

- [ ] **Step 1: Write failing receipt tests**

Add assertions that a HAUNT run receipt contains:

```js
assert.deepEqual(receipt.hauntInfluence, {
  policy: 'haunt-proposal-influence/v1',
  stream: 'haunt/mutation-path/v1',
  orderedCapsuleIds: [capsule.capsuleId],
  consumedCapsuleIds: [capsule.capsuleId],
  ignored: [],
  routePressure: 'late-bloom',
});
```

Also assert a mismatched performance/mutation HAUNT summary throws `RECEIPT_CHAIN_MISMATCH` and a legacy no-memory receipt either omits `hauntInfluence` or stores exactly `null` consistently with the implementation choice.

- [ ] **Step 2: Run receipt test RED**

```bash
node --test test/specimen-run.test.mjs
```

Expected: new HAUNT receipt assertions fail.

- [ ] **Step 3: Extend receipt chain validation**

`buildReceipt()` must compare mutation and performance HAUNT summaries canonically. The completed receipt records only the resolved summary, never raw sibling capsule bodies.

- [ ] **Step 4: Extend `runSpecimen()` proposal-time loading**

Change signature to:

```js
runSpecimen({ sourcePath, observationsPath, outputStem, seed, capsulesPath = null })
```

When `capsulesPath` is supplied:

```js
const rawCapsules = JSON.parse(await readFile(capsulesPath, 'utf8'));
const capsules = (Array.isArray(rawCapsules) ? rawCapsules : [rawCapsules]).map(validateHauntCapsule);
const hauntInfluencePlan = buildHauntInfluencePlan({ score, seed, capsules });
const mutationResult = mutateScore({ score, seed, hauntInfluencePlan });
```

When absent, call the legacy mutation path with no plan.

- [ ] **Step 5: Add end-to-end deterministic crossing test**

Run two specimens with identical source, observations, fixture capsule, and seed into separate temp directories. Assert identical `resolvedPerformanceHash`, identical MIDI SHA-256, identical `hauntInfluence`, and unchanged observation hashes. Run a third without capsule and assert the receipt has no consumed capsule IDs and the admitted source hashes are identical to the haunted run.

- [ ] **Step 6: Run focused tests GREEN**

```bash
node --test test/specimen-run.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/receipt.mjs src/run-specimen.mjs test/specimen-run.test.mjs
git commit -m "feat: bind HAUNT influence into phonograph receipts"
```

---

### Task 5: Phonograph Return Capsule With Unresolved/Refused Residue

**Files:**
- Create: `src/haunt-return.mjs`
- Create: `test/haunt-return.test.mjs`
- Modify: `src/run-specimen.mjs`
- Modify: `test/specimen-run.test.mjs`

**Interfaces:**
- Consumes: completed Phonograph receipt, explicit bounded unresolved/refused lineage inputs.
- Produces: `derivePhonographHauntCapsule({ receipt, unresolved = [], refusedRefs = [] })` and optional `<outputStem>.haunt.json` sidecar.

- [ ] **Step 1: Write failing return-capsule tests**

Assert:

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
assert.deepEqual(returned.unresolved[0].evidenceRefs, receipt.retainedUncertaintyRefs);
assert.deepEqual(returned.lineage.refusedRefs, ['proposal-world:forbidden-range']);
assert.equal(Object.hasOwn(returned, 'evidence'), false);
```

Also assert a caller cannot request `authority: 'evidence'`, and the return capsule derives `encounterRef` from a canonical hash of the completed receipt rather than claiming the source hash is the encounter.

- [ ] **Step 2: Run focused test RED**

```bash
node --test test/haunt-return.test.mjs
```

Expected: FAIL because `src/haunt-return.mjs` is absent.

- [ ] **Step 3: Implement return derivation**

Use `createHauntCapsule()` and derive a small portable relation set from receipt facts only. For v0.1, if the completed receipt consumed a `late-bloom` pressure, emit relation `memory-influenced-late-bloom`; preserve unresolved/refused arrays exactly as supplied and referenced. Do not infer human KEEP/WEIRD/COMPOST without an actual human verdict record.

- [ ] **Step 4: Add optional return sidecar to `runSpecimen()`**

When a HAUNT plan was present, after the completed receipt exists derive one return capsule and atomically write:

```text
<outputStem>.haunt.json
```

Use canonical JSON plus newline. A failure writing this optional sidecar must not rewrite the already-completed MIDI/receipt as failed; it should reject the function call and leave the completed historical artifacts intact because the execution crossing already succeeded.

- [ ] **Step 5: Extend end-to-end test**

Assert the sidecar is canonical, validates under `validateHauntCapsule()`, names `haunted-phonograph` as origin, is influence-only, retains the harmony uncertainty reference, and does not contain source-facing chord certainty.

- [ ] **Step 6: Run focused tests GREEN**

```bash
node --test test/haunt-return.test.mjs test/specimen-run.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/haunt-return.mjs src/run-specimen.mjs test/haunt-return.test.mjs test/specimen-run.test.mjs
git commit -m "feat: emit phonograph HAUNT return residue"
```

---

### Task 6: Full Verification, Documentation, and PR Upgrade

**Files:**
- Modify: `README.md`
- Create: `docs/haunt-v0.1-verification.md`

**Interfaces:**
- Consumes: all landed task interfaces.
- Produces: documented executable command/fixture path and durable exact-head verification evidence.

- [ ] **Step 1: Add README usage**

Document an explicit programmatic or small script example that runs the existing specimen with `capsulesPath: test/fixtures/haunt-toaster-restraint-before-expansion.json`. State that the fixture represents a bounded Toaster-derived encounter residue, not Toaster source truth.

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

Expected: all exit 0.

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: all tests pass, including the pre-existing provenance and Specimen 001 suite plus all HAUNT tests.

- [ ] **Step 4: Run exact specimen proof twice**

Use a Node one-liner or dedicated temporary runner to execute the HAUNT fixture twice with the same seed into two different output stems. Record score hash, resolved performance hash, MIDI SHA-256, consumed capsule ID, and return capsule ID. They must match pairwise.

- [ ] **Step 5: Record verification evidence**

Create `docs/haunt-v0.1-verification.md` with exact commit SHA, commands, pass counts, relevant hashes, and any environment limitation. Do not claim Toaster production integration; explicitly state that the return crossing is contract-ready but the Toaster adapter remains a later gated plan.

- [ ] **Step 6: Commit docs**

```bash
git add README.md docs/haunt-v0.1-verification.md
git commit -m "docs: record HAUNT v0.1 executable proof"
```

- [ ] **Step 7: Push and update PR #8**

Push the implementation commits to `docs/haunt-cross-appliance-memory-v1`, update PR #8 title/body from design-only to executable HAUNT v0.1 proof, and mark ready for review only after exact-head checks are green.

---

## Separate Later Plan: Toaster Return Adapter

Do not implement this in the Phonograph plan. After the current Toaster Creative Context Table/candidate-ecology sequencing gates settle, create a separate Toaster plan that:

1. admits a real Phonograph return capsule as `memory/haunt-capsule-v1`;
2. maps it to Creative Context Table authority `influence-only`;
3. proves ancestry class remains `none` unless independently selected by explicit human Re-toast ancestry;
4. proves no raw capsule state crosses `executionForRender()`;
5. begins with contract admission only, not ordinary candidate behavior change.
