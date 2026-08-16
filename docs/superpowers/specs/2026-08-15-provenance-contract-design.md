# Provenance Contract v1 Design

## Purpose

Make Haunted Phonograph issue #2 executable before Specimen 001 adds musical analysis or mutation. The contract must preserve the difference between source-backed evidence, incomplete source-facing uncertainty, and newly proposed material through serialization, deterministic hashing, and downstream realization.

This spec is a direct implementation of issue #2 and the repository constitution. It does not introduce a cross-repository package or a new global identity law.

## Scope

Implement one dependency-free Node module with a small public API and Node built-in tests.

The first version supports three immutable authority classes:

- `evidence` — a source-backed claim with explicit source references and method identity;
- `uncertainty` — a source-facing claim that remains incomplete, ranged, probabilistic, or explicitly unknown;
- `proposal` — newly generated or interpretive material with explicit proposer/policy provenance.

Authority class is immutable. A claim can be cited by later artifacts, but it cannot be reclassified in place or serialized as another class merely because a downstream consumer needs a concrete value.

## Data shape

Every claim uses `schema: "haunted-phonograph/provenance-claim/v1"` and contains:

- `authority`: `evidence | uncertainty | proposal`;
- `subject`: a non-empty stable local subject string;
- `value`: JSON-safe content, with `{ "state": "unknown" }` accepted for uncertainty;
- authority-specific provenance fields.

Evidence and uncertainty require:

```js
sourceRefs: ["..."]
method: { id: "...", version: "..." }
```

Uncertainty may additionally carry a JSON-safe `uncertainty` descriptor such as range, confidence, alternatives, or note. The core does not interpret those values.

Proposal carries:

```js
parentRefs: ["..."]
proposer: { id: "..." }
policy: { id: "...", version: "..." }
```

`parentRefs` may be empty for a deliberately de-novo proposal. A proposal citing evidence does not inherit evidence authority.

## Realization boundary

A downstream concrete choice is recorded as a separate `haunted-phonograph/realization-provenance/v1` object rather than rewriting the source claim.

The realization records:

- hash of the source claim;
- original `sourceAuthority`;
- concrete JSON-safe realized value;
- resolver identity/version;
- `selectionAuthority`.

`selectionAuthority` is `direct-evidence` only when the source claim is evidence **and the realized value is canonically identical to the evidence value**. Any changed value derived from evidence is a `proposal-choice`. A realization sourced from uncertainty or proposal is also always a `proposal-choice`.

Therefore a deterministic, playable choice selected from uncertainty remains visibly rooted in uncertainty and is not valid as an exact evidence claim. Likewise, evidence cannot be laundered through the realization boundary: changing `4/4` evidence to `3/4` creates a proposal choice even though the parent claim is evidence.

A realization must be concrete. The explicit `{ "state": "unknown" }` marker is valid for uncertainty claims but is refused as a resolved performance value.

## Canonical bytes and hash

Add a repository-local `hp-canonical-json-v1` serializer:

- object keys sorted lexicographically;
- array order preserved;
- JSON primitive/string semantics preserved;
- no Unicode normalization;
- reject `undefined`, functions, symbols, bigint, non-finite numbers, sparse arrays, cycles, and non-plain objects;
- preserve literal data keys such as `__proto__` without treating them as prototype mutation;
- SHA-256 over the resulting UTF-8 bytes, returned as `sha256:<hex>`.

This is an appliance-local deterministic provenance hash for v1, not a claim to replace Project0/TranchNode canonical identity. A later shared boundary may replace or map it only through an explicit versioned migration.

## Errors

Failures expose stable `code` values. First-version codes:

- `INVALID_CLAIM`
- `INVALID_AUTHORITY`
- `INVALID_PROVENANCE`
- `INVALID_JSON_VALUE`
- `AUTHORITY_CLASS_IMMUTABLE`
- `REALIZATION_SOURCE_INVALID`

Error messages may add detail, but callers/tests should rely on `code` for machine behavior.

## Public API

`src/provenance.mjs` exports:

```js
UNKNOWN
createEvidence(input)
createUncertainty(input)
createProposal(input)
validateClaim(claim)
reclassifyClaim(claim, authority)
recordRealization({ sourceClaim, value, resolver })
canonicalStringify(value)
hashCanonical(value)
```

Creators and realization records return deeply frozen normalized objects so downstream code cannot silently mutate provenance after admission.

## Acceptance

The executable proof must show:

1. legal evidence, uncertainty, and proposal records validate;
2. unknown is a valid uncertainty value;
3. proposal may cite evidence/uncertainty refs without becoming evidence;
4. proposal → evidence and uncertainty → evidence reclassification fail with `AUTHORITY_CLASS_IMMUTABLE`;
5. a concrete realization from uncertainty is playable/serializable but remains `sourceAuthority: uncertainty` with `selectionAuthority: proposal-choice`;
6. exact evidence realized unchanged may be `direct-evidence`, while any changed realization from evidence becomes `proposal-choice`;
7. realization refuses the unknown marker as a concrete performance value and does not mutate its source claim;
8. canonical hashes are independent of object insertion order while array order remains significant;
9. authority/provenance changes alter the hash;
10. invalid JSON/provenance, including cycles and sparse arrays, fails closed;
11. literal `__proto__` data is preserved safely;
12. `npm test` passes with zero production dependencies.

## Non-goals

- no audio analysis;
- no PhonographScore schema beyond provenance attachment;
- no MIDI generation;
- no mutation engine;
- no cross-repository dependency;
- no global ontology or universal canonicalizer;
- no confidence-to-authority rule;
- no mechanism that promotes uncertainty into evidence.