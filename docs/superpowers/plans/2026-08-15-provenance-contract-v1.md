# Provenance Contract v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the issue #2 evidence/uncertainty/proposal provenance contract as a dependency-free, deterministic Node module with test-first proof.

**Architecture:** One focused `src/provenance.mjs` module owns JSON-safe normalization, validation, immutable claim construction, immutable authority classification, realization provenance, and repository-local deterministic hashes. `test/provenance.test.mjs` exercises the public API with Node's built-in test runner. Realizations remain separate from claims so downstream concrete choices cannot rewrite source-facing authority.

**Tech Stack:** Node.js 22+, ES modules, `node:test`, `node:assert/strict`, built-in `node:crypto`; zero production dependencies.

## Global Constraints

- Preserve `evidence`, `uncertainty`, and `proposal` as distinct immutable authority classes.
- Unknown is a valid uncertainty state.
- Proposal may cite evidence but never acquires evidence authority from citation.
- A concrete realization selected from uncertainty/proposal remains provenance-bound to that original class.
- No hidden entropy, wall clock, network, model, audio, MIDI, or external package dependency.
- Canonical hashing is explicitly appliance-local `hp-canonical-json-v1`, not a new Project0/TranchNode global identity law.
- All returned admitted records are deeply frozen.
- Stable machine error codes are part of the v1 contract.

---

### Task 1: Bootstrap the test surface and prove the authority classes RED

**Files:**
- Create: `package.json`
- Create: `test/provenance.test.mjs`
- Create later in Task 2: `src/provenance.mjs`

**Interfaces:**
- Consumes: no existing runtime code.
- Produces: test expectations for `UNKNOWN`, `createEvidence`, `createUncertainty`, `createProposal`, and `validateClaim`.

- [ ] **Step 1: Create the zero-dependency test package**

```json
{
  "name": "@the-static-collective/haunted-phonograph",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  },
  "engines": {
    "node": ">=22"
  }
}
```

- [ ] **Step 2: Write failing authority-class tests**

`test/provenance.test.mjs` should import the wished-for API from `../src/provenance.mjs` and assert:

```js
const evidence = createEvidence({
  subject: 'pulse-bpm',
  value: 92,
  sourceRefs: ['sha256:source'],
  method: { id: 'manual-observation', version: '1' }
});
assert.equal(evidence.authority, 'evidence');
assert.equal(validateClaim(evidence), true);
assert.equal(Object.isFrozen(evidence), true);

const uncertainty = createUncertainty({
  subject: 'chord-quality',
  value: UNKNOWN,
  sourceRefs: ['sha256:source'],
  method: { id: 'bounded-listening', version: '1' },
  uncertainty: { alternatives: ['minor', 'sus2'] }
});
assert.equal(uncertainty.authority, 'uncertainty');
assert.deepEqual(uncertainty.value, { state: 'unknown' });

const proposal = createProposal({
  subject: 'bass-note',
  value: 'D2',
  parentRefs: ['sha256:evidence-claim'],
  proposer: { id: 'mutation-law' },
  policy: { id: 'interval-displacement', version: '1' }
});
assert.equal(proposal.authority, 'proposal');
assert.equal(validateClaim(proposal), true);
```

Also assert malformed evidence without `sourceRefs` and proposal without policy fail with stable provenance error codes.

- [ ] **Step 3: Run the focused test and verify RED**

Run: `npm test`

Expected: FAIL because `src/provenance.mjs` does not exist / the public API is not implemented.

- [ ] **Step 4: Commit the RED test surface**

```bash
git add package.json test/provenance.test.mjs
git commit -m "test: define provenance authority contract"
```

### Task 2: Implement minimal immutable claims and validation

**Files:**
- Create: `src/provenance.mjs`
- Test: `test/provenance.test.mjs`

**Interfaces:**
- Consumes: Task 1 tests.
- Produces: `UNKNOWN`, `createEvidence`, `createUncertainty`, `createProposal`, `validateClaim` plus stable coded errors.

- [ ] **Step 1: Implement JSON-safe normalization and coded errors only as needed by the current tests**

Use an internal helper:

```js
function fail(code, message) {
  const error = new TypeError(message);
  error.code = code;
  throw error;
}
```

Normalize inputs by accepting only JSON-compatible primitives, arrays, and plain objects; reject non-finite numbers, sparse arrays, undefined/function/symbol/bigint values, and non-plain objects with `INVALID_JSON_VALUE`.

- [ ] **Step 2: Implement the three creators and validator**

Each creator constructs a complete claim with:

```js
schema: 'haunted-phonograph/provenance-claim/v1'
authority: '<class>'
subject
value
```

Evidence/uncertainty add `sourceRefs` and `method`; proposal adds `parentRefs`, `proposer`, and `policy`. Validate required non-empty identifiers and exact known authority names. Return deeply frozen normalized records.

`validateClaim(claim)` returns `true` for valid records and throws coded errors for invalid records.

- [ ] **Step 3: Run the focused test and verify GREEN**

Run: `npm test`

Expected: all Task 1 assertions PASS.

- [ ] **Step 4: Commit the minimal authority implementation**

```bash
git add src/provenance.mjs test/provenance.test.mjs
git commit -m "feat: add immutable provenance claims"
```

### Task 3: Prove reclassification refusal and realization provenance RED → GREEN

**Files:**
- Modify: `test/provenance.test.mjs`
- Modify: `src/provenance.mjs`

**Interfaces:**
- Consumes: validated claims from Task 2.
- Produces: `reclassifyClaim(claim, authority)` and `recordRealization({ sourceClaim, value, resolver })`.

- [ ] **Step 1: Write failing transition and realization tests**

Add tests that prove:

```js
assert.throws(
  () => reclassifyClaim(proposal, 'evidence'),
  error => error.code === 'AUTHORITY_CLASS_IMMUTABLE'
);

assert.throws(
  () => reclassifyClaim(uncertainty, 'evidence'),
  error => error.code === 'AUTHORITY_CLASS_IMMUTABLE'
);

const realized = recordRealization({
  sourceClaim: uncertainty,
  value: 'C#4',
  resolver: { id: 'performance-resolver', version: '1' }
});
assert.equal(realized.schema, 'haunted-phonograph/realization-provenance/v1');
assert.equal(realized.sourceAuthority, 'uncertainty');
assert.equal(realized.selectionAuthority, 'proposal-choice');
assert.equal(realized.value, 'C#4');
assert.equal(Object.isFrozen(realized), true);
assert.equal(uncertainty.authority, 'uncertainty');
assert.throws(() => validateClaim(realized), error => error.code === 'INVALID_CLAIM');
```

Also prove evidence realization uses `selectionAuthority: 'direct-evidence'` and invalid source/resolver inputs fail closed.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test`

Expected: FAIL because transition/realization APIs are missing.

- [ ] **Step 3: Implement immutable class refusal and separate realization records**

`reclassifyClaim` validates the claim and requested class, returns the same claim when the requested class equals the existing class, and otherwise throws `AUTHORITY_CLASS_IMMUTABLE`.

`recordRealization` validates the source claim, normalizes the concrete value, validates `{ id, version }` resolver identity, records the source claim hash, source authority, and correct selection authority, then deeply freezes the realization record. It never edits or clones the source into a different authority class.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test`

Expected: all transition and realization assertions PASS.

- [ ] **Step 5: Commit the authority-boundary implementation**

```bash
git add src/provenance.mjs test/provenance.test.mjs
git commit -m "feat: preserve authority through realization"
```

### Task 4: Prove deterministic canonical bytes/hash and finish the executable seam

**Files:**
- Modify: `test/provenance.test.mjs`
- Modify: `src/provenance.mjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: normalized claim and realization records.
- Produces: `canonicalStringify(value)` and `hashCanonical(value)` under `hp-canonical-json-v1` behavior.

- [ ] **Step 1: Write failing canonicalization tests**

Add assertions that objects with the same semantic JSON but different insertion order produce identical canonical strings and `sha256:` hashes:

```js
assert.equal(
  canonicalStringify({ z: 1, a: { y: 2, x: 3 } }),
  canonicalStringify({ a: { x: 3, y: 2 }, z: 1 })
);
assert.equal(
  hashCanonical({ z: 1, a: 2 }),
  hashCanonical({ a: 2, z: 1 })
);
assert.notEqual(hashCanonical(evidence), hashCanonical(proposal));
```

Also prove array order changes the hash and unsupported JSON values fail with `INVALID_JSON_VALUE`.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test`

Expected: FAIL because canonicalization/hash exports are missing.

- [ ] **Step 3: Implement canonical serialization and SHA-256**

Use `node:crypto` for SHA-256. Recursively serialize JSON-safe values; sort plain-object keys lexicographically and preserve array order. Do not normalize strings/Unicode. Prefix digest output with `sha256:`.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test`

Expected: all tests PASS with no warnings.

- [ ] **Step 5: Update README with the executable seam**

Add a short section that names issue #2 as the current executable provenance floor, documents the three authority classes, and shows `npm test`. State explicitly that `hp-canonical-json-v1` is local to the appliance and that Specimen 001 should consume this module rather than reimplementing authority classification.

- [ ] **Step 6: Run the full repository gate after the final mutation**

Run:

```bash
npm test
node --check src/provenance.mjs
```

Expected: PASS, zero production dependencies, clean output.

- [ ] **Step 7: Commit final proof/docs**

```bash
git add src/provenance.mjs test/provenance.test.mjs README.md
git commit -m "feat: bind provenance to canonical hashes"
```

## Self-review result

- Spec coverage: all five issue laws map to Tasks 2–4; the downstream-realization negative case is explicit in Task 3.
- Placeholder scan: no deferred implementation placeholders in the plan.
- Type/API consistency: all later tasks use the exact exports declared by the design (`UNKNOWN`, three creators, validator, reclassifier, realization recorder, canonical serializer, hash function).
- Scope remains local to issue #2; Specimen #1, MIDI, analysis, cross-repo abstraction, and product UI remain out of scope.