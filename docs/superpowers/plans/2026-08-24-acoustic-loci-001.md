# Acoustic Loci 001 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one bounded executable specimen that records whether a transformed auditory landmark still supports re-entry into a changed relational memory-world without confusing recognition with source evidence, ancestry, or authority.

**Architecture:** Keep human recognition as declared observation, never as machine-inferred truth. Add a small Acoustic Locus declaration/normalization seam beside the existing observation pipeline, then a deterministic re-entry evaluator that compares four declared conditions (`A original`, `B relation-preserved transform`, `C relation-broken transform`, `D unrelated control`) and emits a receiptable result. Do not modify HAUNT or RING authority surfaces; compose only through existing source identity, provenance hashing, and receipt conventions.

**Tech Stack:** Node.js ESM, built-in `node:test`, existing `provenance.mjs` canonical hashing/evidence primitives, existing source identity and receipt conventions.

**Spec:** `docs/2026-08-24-acoustic-loci-navigable-continuity.md`

## Global Constraints

- Rendering identity must remain distinct from place identity.
- Recurrence must never be treated as reset or uninterrupted presence.
- Human recognition declarations are observations, not source evidence.
- No machine-generated claim may promote resemblance into ancestry.
- No Acoustic Loci object may acquire renderer/export, source-evidence, HAUNT, RING, or constitutional authority.
- Earlier and later world-state labels must remain separately attributable.
- Deterministic replay must reproduce all hashes and verdicts from identical inputs.
- No 20k-corpus clustering or embedding work belongs in Acoustic Loci 001.

---

### Task 1: Acoustic Locus declaration and canonical identity

**Files:**
- Create: `src/acoustic-locus.mjs`
- Test: `test/acoustic-locus.test.mjs`

**Interfaces:**
- Consumes: `hashCanonical` from `src/provenance.mjs`.
- Produces: `admitAcousticLocusDeclaration(declaration)` returning a deeply frozen object `{ schema, locusId, relation, originalWorldRef, laterWorldRef, declarationHash }`.

- [ ] **Step 1: Write the failing tests**

Create `test/acoustic-locus.test.mjs` with tests proving:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { admitAcousticLocusDeclaration } from '../src/acoustic-locus.mjs';

const BASE = {
  schema: 'haunted-phonograph/acoustic-locus-declaration/v1',
  locusId: 'open-e-001',
  relation: {
    kind: 'declared-auditory-relation',
    description: 'open-E landmark relation survives renderer change',
  },
  originalWorldRef: 'world:porch:t0',
  laterWorldRef: 'world:road:t1',
};

test('admits a bounded acoustic locus declaration deterministically', () => {
  const a = admitAcousticLocusDeclaration(BASE);
  const b = admitAcousticLocusDeclaration(structuredClone(BASE));
  assert.equal(a.declarationHash, b.declarationHash);
  assert.equal(a.locusId, 'open-e-001');
  assert(Object.isFrozen(a));
});

test('requires distinct attributable world refs', () => {
  assert.throws(
    () => admitAcousticLocusDeclaration({ ...BASE, laterWorldRef: BASE.originalWorldRef }),
    error => error.code === 'INVALID_ACOUSTIC_LOCUS_DECLARATION',
  );
});

test('does not accept ancestry or authority verdicts in the declaration', () => {
  assert.throws(
    () => admitAcousticLocusDeclaration({ ...BASE, descendsFrom: 'ancestor-x' }),
    error => error.code === 'INVALID_ACOUSTIC_LOCUS_DECLARATION',
  );
});
```

- [ ] **Step 2: Run RED**

Run:

```bash
node --test test/acoustic-locus.test.mjs
```

Expected: FAIL because `src/acoustic-locus.mjs` does not exist.

- [ ] **Step 3: Implement minimal validator**

Create `src/acoustic-locus.mjs` with:

```js
import { hashCanonical } from './provenance.mjs';

function fail(message) {
  const error = new TypeError(message);
  error.code = 'INVALID_ACOUSTIC_LOCUS_DECLARATION';
  throw error;
}

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

export function admitAcousticLocusDeclaration(declaration) {
  if (declaration?.schema !== 'haunted-phonograph/acoustic-locus-declaration/v1') fail('unsupported acoustic locus schema');
  if (typeof declaration.locusId !== 'string' || declaration.locusId.length === 0) fail('locusId required');
  if (typeof declaration.relation?.kind !== 'string' || typeof declaration.relation?.description !== 'string') fail('declared relation required');
  if (typeof declaration.originalWorldRef !== 'string' || typeof declaration.laterWorldRef !== 'string') fail('world refs required');
  if (declaration.originalWorldRef === declaration.laterWorldRef) fail('world refs must remain distinct');
  for (const forbidden of ['descendsFrom', 'ancestry', 'authority', 'verdict']) {
    if (Object.hasOwn(declaration, forbidden)) fail(`${forbidden} is not declaration input`);
  }
  const canonical = {
    schema: declaration.schema,
    locusId: declaration.locusId,
    relation: {
      kind: declaration.relation.kind,
      description: declaration.relation.description,
    },
    originalWorldRef: declaration.originalWorldRef,
    laterWorldRef: declaration.laterWorldRef,
  };
  return freeze({ ...canonical, declarationHash: hashCanonical(canonical) });
}
```

- [ ] **Step 4: Run GREEN**

Run:

```bash
node --test test/acoustic-locus.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/acoustic-locus.mjs test/acoustic-locus.test.mjs
git commit -m "feat: admit acoustic locus declarations"
```

---

### Task 2: Human re-entry observations remain declared observations

**Files:**
- Create: `src/reentry-observation.mjs`
- Test: `test/reentry-observation.test.mjs`

**Interfaces:**
- Consumes: `hashCanonical` from `src/provenance.mjs` and admitted locus identity from Task 1.
- Produces: `admitReentryObservation({ locus, declaration })` returning frozen `{ condition, recognition, worldAssessment, confidence, latencyMs, observationHash }`.

- [ ] **Step 1: Write failing tests**

Cover exactly four condition labels: `A`, `B`, `C`, `D`; recognition in `recognized | not-recognized | unresolved`; world assessment in `same | changed | unrelated | unresolved`; confidence finite `0..1`; optional nonnegative finite `latencyMs`.

Include this load-bearing assertion:

```js
assert.equal(observation.sourceEvidence, undefined);
assert.equal(observation.ancestry, undefined);
assert.equal(observation.authority, undefined);
```

- [ ] **Step 2: Run RED**

```bash
node --test test/reentry-observation.test.mjs
```

Expected: missing module failure.

- [ ] **Step 3: Implement minimal admission**

The accepted declaration schema must be exactly:

```text
haunted-phonograph/reentry-observation-declaration/v1
```

Require `declaration.locusHash === locus.declarationHash` and hash only the canonical observation fields. Do not import `createEvidence`; these are participant reports, not claims about the source artifact.

- [ ] **Step 4: Run GREEN**

```bash
node --test test/reentry-observation.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/reentry-observation.mjs test/reentry-observation.test.mjs
git commit -m "feat: admit re-entry observations"
```

---

### Task 3: Deterministic A/B/C/D re-entry evaluator

**Files:**
- Create: `src/acoustic-reentry.mjs`
- Test: `test/acoustic-reentry.test.mjs`

**Interfaces:**
- Consumes: one admitted locus and exactly four admitted re-entry observations.
- Produces: `evaluateAcousticReentry({ locus, observations })` returning `{ schema, locusHash, conditionHashes, verdict, reasons, resultHash }`.

- [ ] **Step 1: Write failing behavior tests**

The first evaluator is intentionally conservative.

It may return only:

```text
supports-bounded-reentry
insufficient
refuses
```

Use these exact behavioral rules for v0.1:

```text
supports-bounded-reentry iff:
  A.recognition == recognized
  B.recognition == recognized
  B.worldAssessment == changed
  C.recognition != recognized
  D.recognition != recognized

refuses iff:
  D.recognition == recognized
  OR B.worldAssessment == same
  OR originalWorldRef == laterWorldRef (should already be impossible)

otherwise insufficient
```

Do not encode a neuroscience claim or generalize beyond the four-condition specimen.

- [ ] **Step 2: Run RED**

```bash
node --test test/acoustic-reentry.test.mjs
```

Expected: missing module failure.

- [ ] **Step 3: Implement evaluator**

Sort observations by condition before hashing so input array order cannot change the result. Reject duplicate or missing condition labels.

- [ ] **Step 4: Run GREEN and replay check**

```bash
node --test test/acoustic-reentry.test.mjs
```

Add a test that reverses the input observation array and asserts identical `resultHash` and `verdict`.

- [ ] **Step 5: Commit**

```bash
git add src/acoustic-reentry.mjs test/acoustic-reentry.test.mjs
git commit -m "feat: evaluate bounded acoustic re-entry"
```

---

### Task 4: File-backed specimen runner and receipt

**Files:**
- Create: `src/run-acoustic-loci.mjs`
- Create: `test/fixtures/acoustic-loci-001/locus.json`
- Create: `test/fixtures/acoustic-loci-001/A.json`
- Create: `test/fixtures/acoustic-loci-001/B.json`
- Create: `test/fixtures/acoustic-loci-001/C.json`
- Create: `test/fixtures/acoustic-loci-001/D.json`
- Test: `test/acoustic-loci-run.test.mjs`

**Interfaces:**
- Consumes: JSON declaration files only; no audio parser is added in this task.
- Produces: `runAcousticLoci({ locusPath, observationPaths, outputPath })` and one canonical receipt file.

- [ ] **Step 1: Write RED integration test**

Model the existing `runSpecimen` discipline: create output directories, write through a temp path, rename atomically, remove temp files in `finally`, and serialize with existing `canonicalStringify`.

Assert:

```text
schema == haunted-phonograph/acoustic-loci-receipt/v1
exactly four condition hashes exist
verdict is derived, never supplied by fixture
receipt bytes are stable across identical runs
```

- [ ] **Step 2: Run RED**

```bash
node --test test/acoustic-loci-run.test.mjs
```

- [ ] **Step 3: Implement runner**

Use the same file-safety shape already present in `src/run-specimen.mjs`. The runner must never call `identifySource`, `admitObservations`, `buildScore`, `mutateScore`, `resolvePerformance`, `encodeMidi`, HAUNT, or RING. This specimen is about declared recognition/re-entry relations, not rendering.

- [ ] **Step 4: Run GREEN plus full suite**

```bash
node --test test/acoustic-loci-run.test.mjs
npm test
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/run-acoustic-loci.mjs test/fixtures/acoustic-loci-001 test/acoustic-loci-run.test.mjs
git commit -m "feat: add Acoustic Loci 001 runner"
```

---

### Task 5: Verification document and non-promotion checks

**Files:**
- Create: `docs/acoustic-loci-001-verification.md`
- Modify only if needed: `README.md`

**Interfaces:**
- Consumes: committed test output and one canonical specimen receipt.
- Produces: reviewer-facing proof record.

- [ ] **Step 1: Run complete verification**

```bash
npm test
node --test test/acoustic-locus.test.mjs test/reentry-observation.test.mjs test/acoustic-reentry.test.mjs test/acoustic-loci-run.test.mjs
git diff --check
```

Record exact pass counts and command outputs.

- [ ] **Step 2: Write verification document**

The document must state explicitly:

```text
PROVED: one bounded declaration/evaluation protocol can distinguish a transformed recognized cue in a changed world from relation-broken and unrelated controls.

NOT PROVED: general human memory behavior, universal auditory semantics, ancestry, model cognition, or that Bandcamp listeners navigate the catalog this way.
```

- [ ] **Step 3: Add README pointer only if discoverability requires it**

Do not rewrite the project overview. Add one narrow link to the design/specimen docs if no existing frontier/docs index exposes them.

- [ ] **Step 4: Commit**

```bash
git add docs/acoustic-loci-001-verification.md README.md
git commit -m "docs: verify Acoustic Loci 001"
```

---

## Self-review

- Spec coverage: Acoustic Locus, changed-world re-entry, A/B/C/D controls, recognition-vs-evidence, deterministic replay, and authority non-promotion all have explicit tasks.
- Placeholder scan: no TBD/TODO implementation gaps remain.
- Type consistency: Task 1 `declarationHash` is consumed as `locusHash` by Tasks 2–4; condition labels and verdict strings are fixed once and reused consistently.
- Scope boundary: corpus archaeology, embeddings, Suno extraction, RING, and HAUNT are deliberately outside this implementation plan.
