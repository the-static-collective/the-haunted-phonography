# HAUNT v0.1 — Cross-Appliance Memory Language

Date: 2026-08-18
Status: proposed design
Primary appliance: Haunted Phonograph
Sibling consumer: Haunted Toaster

## Purpose

HAUNT v0.1 defines the smallest lawful memory crossing between Haunted Toaster and Haunted Phonograph.

The target is not a shared brain, shared renderer, shared score, or universal creative ontology. The target is a portable encounter residue that lets one appliance's witnessed history influence another appliance's future proposals without transferring execution authority or rewriting source truth.

The founding heartbeat is:

```text
Toaster encounter
  -> bounded memory capsule
  -> Phonograph admits capsule as influence-only
  -> one deterministic musical mutation pressure responds
  -> Phonograph receipt + capsule
  -> Toaster may admit that capsule as influence-only
```

The two appliances share memory, not authority.

## Constitutional laws

1. **Source truth stays local to the appliance currently interpreting the source.** A Toaster observation cannot become Phonograph musical evidence merely because both concern the same song.
2. **Cross-appliance memory is influence-only by default.** Importing a capsule grants permission to consider a prior encounter, not permission to treat it as ancestry, source truth, timing authority, score authority, timeline authority, renderer authority, or an instruction that must be obeyed.
3. **Receipts remain immutable history.** HAUNT capsules derive from witnessed records; they do not edit the records they summarize.
4. **Uncertainty may reproduce without becoming certainty.** A Phonograph branch grown from unresolved harmony remains a proposal-world. Fruitfulness of that branch is evidence about an encounter, not proof that the source 'really was' that harmony.
5. **Each appliance translates pressure through its own vocabulary.** Shared memory may carry a relationship such as restraint -> late expansion. Toaster may express it visually; Phonograph may express it musically. Neither copies the other's implementation vocabulary.
6. **No ambient memory lookup inside execution.** Memory is admitted during proposal/search context construction. ResolvedPerformance and ResolvedTimeline remain sufficient execution authorities for their appliances.
7. **No hidden entropy.** Any HAUNT-influenced choice is deterministic from explicit source/score context, capsule identities, named policy/stream identity, and seed.
8. **Absence is honest.** If no capsule exists, generation proceeds without synthetic memory.
9. **Refusal is valid output.** A capsule may be valid but not applicable to a particular appliance or mutation surface. That produces an explicit ignore/refusal, not forced influence.

## Why portable capsules instead of one shared database

Three approaches were considered.

### A. One shared memory store

Both appliances read and write one canonical database/schema.

Rejected for v0.1 because appliance-specific concepts would quickly leak across boundaries, storage availability would become a runtime dependency, and one store could accidentally become sovereign over both appliances.

### B. Portable HAUNT Memory Capsules — selected

Each appliance owns its own receipts and memory projection. It may publish a bounded, immutable capsule derived from one or more witnessed encounters. Sibling appliances admit capsules as typed influence-only context.

This matches current Toaster Receipt Memory and Creative Context Table direction while preserving Phonograph's evidence/uncertainty/proposal boundary.

### C. Independent Haunt Field service

A third local organism owns cross-appliance memory and both appliances become clients.

Deferred. It may become justified after multiple real capsule crossings prove a stable shared contract. v0.1 must not create a service before the portable language is proven.

## Core object: `HauntMemoryCapsule/v1`

A capsule is a portable residue of a witnessed creative encounter.

Normative logical shape:

```js
{
  schema: 'static-collective/haunt-memory-capsule/v1',

  capsuleId,          // canonical hash-derived identity
  sourceRef,          // stable source identity when available
  encounterRef,       // receipt or witnessed encounter identity

  origin: {
    appliance,        // 'haunted-toaster' | 'haunted-phonograph'
    receiptRef,
    policy
  },

  witness: {
    disposition,      // optional KEEP | WEIRD | COMPOST or appliance-local equivalent
    rating,           // optional bounded human rating when witnessed
    artifactRefs      // hashes/ids only; no requirement to carry artifact bytes
  },

  relations: [
    {
      relation,       // portable relationship name
      direction,
      strength,
      evidenceRefs
    }
  ],

  lineage: {
    parentRefs,
    influenceOnlyRefs,
    refusedRefs
  },

  unresolved: [
    {
      subject,
      alternatives,
      evidenceRefs
    }
  ],

  invitations: [
    {
      pressure,
      strength,
      allowedSurfaces
    }
  ],

  provenance: {
    authority: 'influence-only',
    derivedFrom,
    canonicalPolicy
  }
}
```

The exact implementation schema may be narrower than this logical shape for the first executable proof. Fields not required by the founding specimen should be omitted rather than populated with null theater.

## Portable semantics

HAUNT v0.1 deliberately avoids a universal set of creative sliders.

Portable memory should primarily carry **relationships**, not appliance implementation parameters.

Good examples:

- `restraint-before-expansion`
- `late-bloom`
- `repetition-with-escalation`
- `negative-space-retained`
- `ambiguity-preserved`
- `rupture-after-stasis`
- `symmetry-broken-on-return`

Bad cross-appliance fields:

- Toaster topology names such as `cathedral-fan`;
- MIDI note numbers as visual instructions;
- renderer opacity or FFmpeg parameters;
- VisualScore categorical axes treated as Phonograph score facts;
- inferred chords treated as Toaster source truth.

A capsule may preserve appliance-specific references for provenance, but sibling interpretation must route through declared portable relations/invitations.

## Authority mapping

### Toaster -> HAUNT

Current Toaster receipt memory remains authoritative only for what its receipts actually witness. A capsule builder may derive a bounded summary from:

- immutable render receipt identity;
- Human Verdict receipt;
- Memory Projection evidence;
- Influence Trace evidence;
- explicit ancestry/influence/refusal relationships.

The exported capsule is **not** a new render receipt and is not Toaster execution authority.

### HAUNT -> Phonograph

Phonograph admits a capsule as a proposal-facing influence claim.

It must not be admitted through `createEvidence()` or reclassify source uncertainty. The adapter records the capsule's hash, origin, portable relation(s), and authority `influence-only`.

The founding specimen allows exactly one mutation surface to consume HAUNT pressure.

Recommended first surface: **mutation-path selection**, not note-level source interpretation.

Example:

```text
capsule relation: restraint-before-expansion
                  |
                  v
Phonograph mutation policy increases probability/eligibility of
an initially sparse role that blooms late
                  |
                  v
ResolvedPerformance
```

The memory does not supply notes, chords, timing evidence, or section truth. It only changes the lawful proposal search path.

### Phonograph -> HAUNT

A completed Phonograph mutation may emit a capsule derived from:

- source identity;
- admitted observation identities;
- score/mutation/performance receipt identities;
- unresolved musical worlds that were explored or refused;
- human verdict when one exists;
- portable relationships demonstrated by the resolved proposal.

A successful unresolved branch remains proposal lineage. Its success may strengthen a memory relation such as `ambiguity-preserved`; it does not promote the branch's harmonic interpretation to evidence.

### HAUNT -> Toaster

Toaster consumes the Phonograph capsule through the same proposal-time context boundary being established by Creative Context Table / Influence Diet.

Expected adapter classification:

```text
provider identity: memory/haunt-capsule-v1
authority class: influence-only
ancestry class: none unless explicit human Re-toast ancestry exists independently
```

The capsule may affect candidate search/diversity pressure. It must not cross `executionForRender()` as ambient decision state.

## Founding executable specimen

The first implementation must prove one complete reciprocal crossing without attempting general musical understanding or production UI.

### Specimen A — Toaster memory influences Phonograph

1. Use one real existing Toaster receipt-memory encounter.
2. Export one minimal HAUNT capsule containing stable origin/receipt identity and one portable relation/invitation.
3. Phonograph validates and hashes the capsule.
4. Phonograph admits it as influence-only proposal context.
5. Exactly one named deterministic mutation policy changes its route because of that capsule.
6. Resolve through the existing `ResolvedPerformance` boundary.
7. Produce MIDI and receipt.
8. Receipt records capsule identity, influence policy, whether it was consumed or ignored, and resulting mutation route.

### Specimen B — Phonograph residue can return to Toaster

1. Derive one minimal Phonograph capsule from Specimen A's completed receipt.
2. Validate that the capsule contains no upgraded source claims.
3. Feed it through a Toaster-side adapter compatible with Creative Context Table semantics.
4. Prove it is classified influence-only and cannot claim ancestry or renderer authority.
5. No production candidate behavior change is required for Specimen B; contract admission is enough for v0.1.

## Memory and unresolved worlds

HAUNT is specifically allowed to preserve branches that did not become source truth or constituted execution.

Example:

```text
source harmony evidence: unresolved
  |- proposal-world A -> completed descendant -> KEEP
  |- proposal-world B -> completed descendant -> COMPOST
  `- proposal-world C -> refused by mutation constraints
```

A later capsule may preserve:

- that ambiguity existed;
- which proposal-worlds were explored;
- which descendants were witnessed as fruitful;
- which routes were refused and why.

It may not state that world A became source evidence because its descendant received KEEP.

This is the musical application of Refusal Topology: failed/refused/indeterminate neighboring worlds can remain navigable boundary witnesses without becoming successful state transitions.

## Relationship to MADD CLOWN

MADD CLOWN is not made a schema field or universal preset in v0.1.

The architectural direction is broader: MADD CLOWN may later become a cross-appliance creative disposition meaning roughly:

> search lawful degrees of freedom for a materially distinct possibility that remembered history does not already make obvious.

For now, HAUNT merely provides the memory and novelty evidence such a disposition would need. No cross-appliance MADD CLOWN behavior is implemented in v0.1.

## Failure and refusal behavior

The adapter must fail closed when:

- schema/version is unsupported;
- canonical identity does not match capsule content;
- provenance claims authority stronger than `influence-only` for a sibling crossing;
- origin/receipt identity is malformed;
- portable relation or invitation requests a forbidden surface;
- contradictory duplicate capsule identities are supplied.

Valid but irrelevant capsules are not errors. They are recorded as ignored/refused influence with a deterministic reason.

A failed HAUNT import must not corrupt the source observations, score, resolved performance, Toaster memory archive, or historical receipts.

## Determinism and replay

For every HAUNT-influenced Phonograph specimen, the receipt must bind:

- ordered capsule identities;
- capsule canonical policy/version;
- influence adapter policy/version;
- consumed vs ignored capsule refs;
- named mutation stream/seed;
- selected mutation route;
- score hash;
- ResolvedPerformance hash;
- output hash.

Same source/observations/score/capsules/seed/policies must reproduce the same deterministic route and resolved performance.

Changing capsule influence may change proposal routing but must not mutate admitted source evidence.

## Isolation boundaries

v0.1 must preserve these module boundaries:

- capsule canonicalization/validation;
- Phonograph HAUNT adapter;
- mutation policy consumption;
- Phonograph capsule derivation;
- Toaster adapter contract.

No module should need to know the sibling appliance's internal renderer or score implementation.

Cross-repository copy/paste should be limited to a tiny schema/fixture during the proof. A shared package is explicitly deferred until executable evidence shows both implementations need the same code rather than merely the same law.

## Testing requirements

Minimum executable proof:

1. identical capsule content canonicalizes to identical identity;
2. mutated content cannot reuse an old capsule identity;
3. sibling capsule authority stronger than influence-only is refused;
4. capsule cannot promote Phonograph uncertainty/proposal into evidence;
5. same score + seed + capsules produces the same mutation route;
6. removing/changing the capsule changes only the declared proposal surface, not source observation hashes;
7. valid irrelevant capsule produces deterministic ignore/refusal residue;
8. completed Phonograph receipt binds consumed/ignored capsule identities;
9. Phonograph-derived capsule preserves unresolved/refused lineage without promoting it;
10. Toaster adapter classifies returned capsule as influence-only;
11. returned capsule cannot claim Toaster ancestry merely because the same source song is involved;
12. no HAUNT state enters renderer/exporter authority downstream of the resolved execution boundary.

## Non-goals for v0.1

- no universal memory database;
- no network service;
- no cloud sync;
- no automatic sharing between installations;
- no shared renderer or shared score schema;
- no universal emotion/style embedding;
- no broad automatic song analysis;
- no model-selection architecture;
- no UI requirement;
- no two-parent breeding;
- no automatic promotion of frequently repeated relations into canon;
- no new Toaster production candidate behavior until its current sequencing gates permit it;
- no cross-appliance MADD CLOWN implementation yet.

## Compatibility with current Toaster state

Toaster Receipt Memory already establishes immutable archived encounters, Human Verdict receipts, rebuildable Memory Projection, bounded MemoryCapsules, and Influence Traces while keeping memory derived and proposal-facing.

Creative Context Table v1 is separately establishing typed proposal-time providers and Influence Diet evidence, including an influence-only memory provider seam.

HAUNT v0.1 should therefore arrive as a new provider dialect/adapter rather than replacing those systems.

If the Toaster's current Creative Context Table branch changes before implementation begins, HAUNT must adapt to the landed contract rather than freezing a dependency on an unmerged draft head.

## Implementation sequence after spec approval

1. Write the RED->GREEN implementation plan in Haunted Phonograph.
2. Implement capsule canonicalization/validation in Phonograph first.
3. Add one fixed Toaster-derived fixture capsule for the founding proof rather than coupling repositories immediately.
4. Add Phonograph influence adapter and one bounded mutation-path consumer.
5. Extend receipt binding.
6. Add Phonograph capsule derivation.
7. Add a narrow Toaster-side contract branch only after the current Toaster beta lineage/gates allow it.
8. Replace fixtures with a real receipt-derived crossing and preserve the resulting evidence in GitBook.
9. Reassess whether a shared package or independent Haunt Field has been earned.

## Acceptance criterion

HAUNT v0.1 is real when this statement is executable and receipted:

> A witnessed creative encounter in one appliance can alter the lawful proposal search of its sibling, and the sibling can return a new witnessed residue, while neither appliance gains authority over the other's source truth or execution state.
