# STORYSHIP Continuity Spine v0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement one deterministic, fixture-only STORYSHIP continuity spine that can replay an append-only voyage, preserve branch history, seal Transfer Packet 000 at an exact cut, and reproduce it in a fresh process without any live Suno call or credit spend.

**Architecture:** Add a bounded file-backed subsystem beside the existing specimen pipeline. The canonical object is an ordered event ledger; Reality, Narrative, Manifest, MEMORY, Open Berth, branch state, checkpoints, packets, and receipts are frozen deterministic projections. Reuse `hashCanonical` and `canonicalStringify` from `src/provenance.mjs`. Keep Vault evidence, human declarations, provider observations, Storyship derivations, and Haunted Phonography customs decisions in separate typed fields and never allow a projection to write backward.

**Tech Stack:** Node.js 22+ ESM, built-in `node:test`, built-in `node:crypto` / `node:fs` / `node:child_process` only, existing `hp-canonical-json-v1` canonicalization and SHA-256 contract. No new package, database, service, browser automation, provider SDK, or network dependency.

**Spec:** `docs/superpowers/specs/2026-08-24-storyship-continuity-spine-v0-design.md`

## Global Constraints

- This implementation is fixture-only and no-spend. It must contain no Suno credential lookup, HTTP client, provider call, browser automation, or credit mutation.
- The approved design source cut is branch head `b318f3ab7e0192653864e632c1ae5689986503e6`. Test fixtures bind that head and the four exact constitutive blob SHAs listed below; later law requires an explicit descendant constitution.
- The event ledger is canonical. Every other Storyship object is rebuildable and must bind its projector version and exact event cut.
- Event order is `event_seq` only. `occurred_at_source_raw`, `observed_at`, and `recorded_at` remain distinct evidence fields and never sort the ledger.
- An accepted event is never modified in place. Correction, retraction, reinterpretation, dormancy, return, and refusal are new events.
- Branches form a DAG. Similar bytes, text, timestamps, or provider IDs never collapse sibling histories.
- The relationship is an attributable exchange worldline. Artifacts are carriers and cannot establish lineage by similarity alone.
- MEMORY is derived from active Manifest carriers plus only their explicitly referenced Narrative relations.
- OPEN BERTH cannot import missing evidence, inaccessible sources, protected silence, explicit refusal, known prohibition, forgotten metadata, or unresolved branch ownership.
- A machine result may target a continuity law but cannot constitute the owner-law verdict.
- A candidate without a Haunted Phonography customs receipt is arrived-but-unadmitted.
- Failure must preserve truthful residue and emit no successful packet or receipt.
- Existing `source -> observations -> score -> mutation -> performance -> MIDI -> receipt` behavior remains untouched.

## Approved constitution fixture

Use these exact values in `test/helpers/storyship-fixture.mjs`:

```js
export const APPROVED_CONSTITUTION_INPUT = {
  owner_repository: 'the-static-collective/the-haunted-phonography',
  owner_head_sha: 'b318f3ab7e0192653864e632c1ae5689986503e6',
  ordered_constitutive_paths: [
    'docs/superpowers/specs/2026-08-24-storyship-001-the-door-design.md',
    'docs/superpowers/specs/2026-08-24-storyship-attributable-becoming-amendment.md',
    'docs/superpowers/specs/2026-08-24-storyship-relationship-passenger-law.md',
    'docs/superpowers/specs/2026-08-24-storyship-continuity-spine-v0-design.md',
  ],
  blob_sha_for_each_path: {
    'docs/superpowers/specs/2026-08-24-storyship-001-the-door-design.md': '6cae9db5b179dfe6162f5be56c71dc9328a892cb',
    'docs/superpowers/specs/2026-08-24-storyship-attributable-becoming-amendment.md': 'a1baa1ea1e61cb6ddc552708f7e5f54deb7127c5',
    'docs/superpowers/specs/2026-08-24-storyship-relationship-passenger-law.md': '3c1fb229ae8e5f6dcf941b4ad1235533e5718fae',
    'docs/superpowers/specs/2026-08-24-storyship-continuity-spine-v0-design.md': '4ad3d13c39e47a0428f8f7a111f85a2969ac56ed',
  },
};
```

## File Structure

```text
src/
  storyship-contract.mjs          # enums, constitution/source-cut/result contracts
  storyship-ledger.mjs            # event admission, identity, append-only verification
  storyship-projector.mjs         # projections, branch DAG, checkpoints, derivations
  storyship-packet.mjs            # MEMORY binding, packet and no-spend receipt sealing
  storyship-claims.mjs            # bounded lineage/method/customs counterexamples
  run-storyship-preflight.mjs     # file-safe no-spend runner
scripts/
  run-storyship-preflight.mjs     # argument parsing only
test/
  helpers/storyship-fixture.mjs
  storyship-contract.test.mjs
  storyship-ledger.test.mjs
  storyship-projector.test.mjs
  storyship-packet.test.mjs
  storyship-claims.test.mjs
  storyship-crucible.test.mjs
  storyship-reentry-run.test.mjs
docs/
  storyship-continuity-spine-v0-verification.md
package.json
```

## Identity policy

Every identity uses existing `hashCanonical`; each row names the exact preimage and identities never substitute for one another.

| Identity | Preimage |
|---|---|
| `constitution_id` | ordered `[{ path, blob_sha }]` pairs only |
| `source_cut_id` | admitted source-cut record without `source_cut_id` |
| `artifact_id` | `{ provider_identity, content_digest }` |
| `event_id` | admitted event envelope without `event_id` |
| `projection_id` | kind + projector version + constitution + voyage + exact cut + projected records |
| `state_id` | constitution + voyage + exact cut + branch table/heads + all projection IDs |
| `packet_id` | sealed packet without `packet_id` |
| `receipt_id` | completed receipt without `receipt_id` |
| `relationship_thread_id` | voyage + ordered attributable exchange event IDs |
| `result_id` | typed machine result without `result_id` |

Identical visible content with a different road, source cut, provider identity, parent state, or projector version therefore remains a different object.

## Crucible coverage

| Specimen | Primary executable witness | Required result |
|---|---|---|
| 1. Replay and re-entry | `storyship-reentry-run.test.mjs` | byte-identical checkpoint, packet, and receipt in two fresh processes |
| 2. Stale cut | `storyship-projector.test.mjs` | cut K remains byte-identical after valid event K+1 |
| 3. Twin branch preservation | `storyship-projector.test.mjs` | selected twin live, sibling dormant, later dormant descendant reachable |
| 4. Ambiguous heads | `storyship-projector.test.mjs` | `unresolved` with both heads; timestamps do not select |
| 5. Historical reinterpretation | `storyship-projector.test.mjs` | old projection unchanged; new version gets a derivation receipt |
| 6. Protected-silence attack | `storyship-packet.test.mjs` | packet sealing refuses `packet_mapping` |
| 7. Narrative overwrite attack | `storyship-ledger.test.mjs` | invalid interpretation rejected; raw event remains valid |
| 8. Relationship-carrier confusion | `storyship-claims.test.mjs` | similarity-only road refuses `lineage_claim` |
| 9. Abstraction counterexample | `storyship-claims.test.mjs` | failed detector targets `observation_method`, not `continuity_law` |
| 10. Customs boundary | `storyship-claims.test.mjs` | arrived without receipt stays `destination_admission: unresolved` |
| 11. Tamper evidence | `storyship-reentry-run.test.mjs` | parent/receipt/constitution/source-cut tampering emits no successful outputs |

---

### Task 1: Seal the constitution, source-cut, and typed-result contracts

**Files:**

- Create: `src/storyship-contract.mjs`
- Create: `test/storyship-contract.test.mjs`
- Create: `test/helpers/storyship-fixture.mjs`

**Interfaces:**

- `createConstitutionReceipt(input)`
- `validateConstitutionReceipt(receipt)`
- `admitSourceCut(input)`
- `validateSourceCut(cut)`
- `createStoryshipResult(input)`
- `validateStoryshipResult(result)`
- Export frozen constants `STORYSHIP_EVENT_TYPES`, `STORYSHIP_RESULT_TARGETS`, `STORYSHIP_RESULT_VALUES`, `STORYSHIP_FORBIDDEN_BERTH_CLASSES`, `STORYSHIP_CANONICALIZATION_POLICY`.

- [ ] **Step 1: Write the failing contract tests**

Use the approved constitution input above. Construct a smuggled variant with an extra blob-map key and assert:

```js
const smuggled = structuredClone(APPROVED_CONSTITUTION_INPUT);
smuggled.blob_sha_for_each_path[
  'docs/superpowers/specs/2026-08-24-storyship-unused.md'
] = 'f'.repeat(40);
assert.throws(
  () => createConstitutionReceipt(smuggled),
  error => error?.code === 'INVALID_STORYSHIP_CONSTITUTION',
);
```

Then prove the approved input seals:

```js
const receipt = createConstitutionReceipt(APPROVED_CONSTITUTION_INPUT);
assert.equal(receipt.schema, 'haunted-phonograph/storyship-constitution-receipt/v0');
assert.equal(receipt.canonicalization_policy, 'hp-canonical-json-v1');
assert.match(receipt.constitution_id, /^sha256:[0-9a-f]{64}$/);
assert(Object.isFrozen(receipt));

const reversed = createConstitutionReceipt({
  ...APPROVED_CONSTITUTION_INPUT,
  ordered_constitutive_paths: [...APPROVED_CONSTITUTION_INPUT.ordered_constitutive_paths].reverse(),
});
assert.notEqual(reversed.constitution_id, receipt.constitution_id);
```

Also cover duplicate paths, a missing blob SHA, an extra blob-map key, an invalid 40-hex owner/blob SHA, a mutated self-identity, and unsupported keys.

For source cuts, use exactly:

```js
const cut = admitSourceCut({
  owning_world: 'autodiscography-vault',
  stable_locator: 'fixture://vault/storyship/reference-000',
  revision_or_provider_identity: 'vault-revision-000',
  content_digest_when_available: 'sha256:' + 'a'.repeat(64),
  acquisition_time: '2026-08-24T12:00:00.000Z',
  availability_status: 'available',
  evidence_class: 'raw-owner-evidence',
});
```

Assert that changing `observed_at` elsewhere cannot alter this cut, that missing digests require explicit `null`, and that `availability_status` is one of `available | inaccessible | unknown`.

`evidence_class` is exactly one of:

```text
repository-constitution
raw-owner-evidence
provider-observation
human-declaration
destination-receipt
```

For typed results, assert the exact result enum `supports | refuses | unresolved` and target enum:

```text
passenger_claim
lineage_claim
source_binding
packet_mapping
observation_method
selection_abstraction
continuity_law
destination_admission
```

Every result must include:

```js
{
  schema: 'haunted-phonograph/storyship-result/v0',
  result,
  target,
  basis_event_ids: [],
  reason_codes: [],
  authority: 'machine-test-only',
  owner_gate_status: 'not-constituted',
  result_id,
}
```

- [ ] **Step 2: Run RED**

```bash
node --test test/storyship-contract.test.mjs
```

Expected: FAIL because `src/storyship-contract.mjs` does not exist.

- [ ] **Step 3: Implement the minimal strict contract**

Use `hashCanonical` from `src/provenance.mjs`. Source cuts and typed results hash the admitted object with their own identity field omitted. The constitution is the deliberate exception required by the spec: compute `constitution_id` from exactly the ordered `[{ path, blob_sha }]` pairs, in `ordered_constitutive_paths` order. The owner repository/head remain bound in the receipt but do not alter the constitutional identity when the same four blobs are reachable from a later head. Require plain JSON records, exact key sets, non-empty strings, no duplicate list members, and deep-freeze all admitted output.

The exact schemas are:

```text
haunted-phonograph/storyship-constitution-receipt/v0
haunted-phonograph/storyship-source-cut/v0
haunted-phonograph/storyship-result/v0
```

`admitSourceCut` adds `source_cut_id` and accepts only these exact input keys:

```text
owning_world
stable_locator
revision_or_provider_identity
content_digest_when_available
acquisition_time
availability_status
evidence_class
```

- [ ] **Step 4: Run GREEN and the untouched suite**

```bash
node --test test/storyship-contract.test.mjs
npm test
```

Expected: both PASS; no existing test changes.

- [ ] **Step 5: Commit**

```bash
git add src/storyship-contract.mjs test/storyship-contract.test.mjs test/helpers/storyship-fixture.mjs
git commit -m "feat: define Storyship continuity contracts"
```

---

### Task 2: Admit and verify append-only voyage events

**Files:**

- Create: `src/storyship-ledger.mjs`
- Create: `test/storyship-ledger.test.mjs`
- Modify: `test/helpers/storyship-fixture.mjs`

**Interfaces:**

- `createStoryshipEvent(input)` computes `event_id`.
- `validateStoryshipEvent(event)` recomputes and compares `event_id`.
- `appendStoryshipEvent(events, input)` returns a new deeply frozen array and never mutates `events`.
- `verifyStoryshipLedger({ constitution, events })` returns frozen `{ voyage_id, constitution_id, event_count, tip_event_id }`.

- [ ] **Step 1: Write RED tests for identity, ordering, and separation**

Define the exact event input envelope:

```js
{
  schema: 'haunted-phonograph/storyship-event/v0',
  voyage_id,
  event_seq,
  event_type,
  branch_id,
  parent_state_ids,
  constitution_id,
  source_cut,
  actor: { owning_world, actor_id, role },
  occurred_at_source_raw,
  observed_at,
  recorded_at,
  payload,
  reality_effects,
  narrative_interpretations,
  manifest_effects,
  uncertainty,
  authority: { owning_world, scope },
  previous_receipt_ids,
}
```

Assert:

- `event_id` is stable for a structured clone and changes when any admitted field changes.
- `appendStoryshipEvent` leaves the prior array byte-identical and frozen.
- Sequence must start at 1 and increase by exactly 1.
- Every event in a ledger has one `voyage_id` and the bound constitution ID.
- Timestamp order is ignored: a later `event_seq` may truthfully carry an earlier raw provider time.
- Event type must be one of the sixteen design values; a free-form type fails.
- `source_cut` is normalized by ascending `source_cut_id` so dependency order cannot add entropy.
- Replacing a reality record with a narrative field fails strict validation.
- A `correction-recorded` event appends a new Reality record with `corrects_event_ids: [rawEvent.event_id]`; later replay retains both records in order.

Make the narrative overwrite attack explicit:

```js
const attack = {
  interpretation_id: 'narrative-cleanup-001',
  text: 'a cleaner account',
  basis_event_ids: [rawEvent.event_id],
  authority_scope: 'human-interpretation',
  replaces_reality_record_id: 'raw-provider-observation-001',
};
assert.throws(
  () => createStoryshipEvent({ ...nextInput, narrative_interpretations: [attack] }),
  error => error?.code === 'INVALID_STORYSHIP_EVENT',
);
assert.doesNotThrow(() => verifyStoryshipLedger({ constitution, events: [rawEvent] }));
```

- [ ] **Step 2: Run RED**

```bash
node --test test/storyship-ledger.test.mjs
```

Expected: missing module failure.

- [ ] **Step 3: Implement event and effect validation**

Use the exact v0 event vocabulary from the spec.

Reality effects accept only:

```js
{
  record_id,
  record_class, // enum below
  subject,
  value,        // canonical JSON
  source_cut_ids,
}
```

`record_class` is one of:

```text
raw-observation
provider-observation
human-observation
protected-silence
explicit-refusal
known-prohibition
missing-evidence
inaccessible-source
forgotten-metadata
unresolved-branch-ownership
```

Narrative interpretations accept only:

```js
{
  interpretation_id,
  text,
  basis_event_ids,
  authority_scope,
}
```

Manifest effects are a strict tagged union.

Carrier:

```js
{
  kind: 'carrier',
  effect_id,
  action, // carry | retire
  carrier_ref,
  narrative_relation_ids,
  basis_event_ids,
  target_effect_id, // null for carry, required for retire
}
```

Open Berth:

```js
{
  kind: 'open-berth',
  effect_id,
  action, // open | resolve | refuse
  question_or_possibility,
  basis_event_ids,
  allowed_scope,
  explicit_non_imports,
  opened_by,
  status, // open | resolved | refused
  target_effect_id, // null for open, required otherwise
}
```

If `payload.branch_effects` exists, every member is exactly:

```js
{
  branch_id,
  parent_branch_ids,
  status, // live | dormant | stopped
}
```

Only `voyage-created`, `generation-observed`, `continuation-recorded`, `branch-composed`, and `voyage-stopped` may carry branch effects. The ledger validator checks envelope identity and monotonic sequence; state-parent existence belongs to the sequential projector in Task 3.

`payload` must always be a plain canonical JSON record. These load-bearing event types have exact payload contracts:

```text
constitution-bound    { bound_constitution_id }
source-bound          { bound_source_cut_ids }
generation-requested  { request_ref, mode, provider_visible_fields, credit_debit }
generation-observed   { request_event_id, artifact, branch_effects }
encounter-recorded    { encounter_ref, artifact_refs, declaration }
selection-recorded    { mechanism, selected_branch_ids, unselected_branch_ids }
continuation-recorded { selection_event_id, branch_effects }
branch-composed       { composition_rule, branch_effects }
packet-sealed         { packet_id, event_cut }
customs-result-linked { customs_receipt_id }
correction-recorded   { corrects_event_ids, reason }
```

For v0, `mode` is only `fixture-only` and `credit_debit` is only zero. `customs-result-linked.customs_receipt_id` must be a valid receipt hash; narrative arrival without one uses `interpretation-recorded` and cannot masquerade as this event type. Other admitted event payloads remain canonical opaque records, and the projector grants them no branch, source-binding, packet, or customs transition authority.

A `generation-observed` artifact is exactly:

```js
{
  artifact_id,
  provider_identity,
  content_digest,
}
```

Require a provider identity and a `sha256:` content digest, then recompute `artifact_id = hashCanonical({ provider_identity, content_digest })`. Provider identity and bytes remain separate inputs even when one repeats; artifact equality never creates branch or relationship equality.

Each uncertainty entry is exactly:

```js
{
  uncertainty_id,
  subject,
  alternatives,
  evidence_refs,
  status, // open | resolved | refused
}
```

`occurred_at_source_raw` is a string or `null`; it is deliberately not normalized. `observed_at` is a valid RFC 3339 string or `null`; `recorded_at` is a required RFC 3339 string. Neither parsed time participates in event ordering.

Correction points backward through `corrects_event_ids` but never edits the earlier event.

- [ ] **Step 4: Run GREEN and full regression**

```bash
node --test test/storyship-ledger.test.mjs
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/storyship-ledger.mjs test/storyship-ledger.test.mjs test/helpers/storyship-fixture.mjs
git commit -m "feat: admit append-only Storyship events"
```

---

### Task 3: Replay deterministic projections and the branch DAG

**Files:**

- Create: `src/storyship-projector.mjs`
- Create: `test/storyship-projector.test.mjs`
- Modify: `test/helpers/storyship-fixture.mjs`

**Interfaces:**

- `replayStoryship({ constitution, events, eventCut, projectorVersion })`
- `createProjectionDerivationReceipt({ priorCheckpoint, nextCheckpoint })`
- Export `STORYSHIP_PROJECTOR_VERSIONS` with exactly `storyship-projector/v0` and `storyship-projector/v0-reinterpretation`.

The replay result is:

```js
{
  checkpoint,
  reality,
  narrative,
  manifest,
  memory,
  open_berth,
}
```

- [ ] **Step 1: Write RED replay and branch tests**

Build events sequentially in `test/helpers/storyship-fixture.mjs`. After each append, replay through that cut and use the returned `checkpoint.state_id` as the next event's parent. Never hand-invent a state ID.

Cover:

1. Identical constitution, events, cut, and projector version produce byte-identical canonical JSON.
2. Replaying cut K before and after appending valid K+1 produces the identical cut-K checkpoint and projections.
3. Two `generation-observed` sibling events may share an older parent state. Continue A, mark B dormant, then create B2 from dormant B. B's original selection history remains in the Narrative/Reality projections and the branch table records B2's parent.
4. Two live heads return:

```js
{
  status: 'unresolved',
  branch_ids: ['branch-a', 'branch-b'],
}
```

even when branch B has the newest `recorded_at`.
5. Replaying the same cut with `storyship-projector/v0-reinterpretation` produces new projection/checkpoint IDs without modifying the canonical bytes of the v0 checkpoint. A derivation receipt binds both.
6. Unknown `parent_state_ids`, a single-parent `branch-composed` event, duplicate branch birth, and transition through an unknown branch fail closed.
7. Genesis must be followed by a matching `constitution-bound` event and at least one `source-bound` event before request/observation/packet work. Cuts 1 and 2 may remain provisional so the fixture builder can derive their state IDs, but packet sealing requires the complete preamble. Later events may use only source-cut IDs already admitted by a prior `source-bound` event.
8. Two branches with identical visible artifact content remain distinct when their event roads or parent states differ.

- [ ] **Step 2: Run RED**

```bash
node --test test/storyship-projector.test.mjs
```

- [ ] **Step 3: Implement the sequential projector**

At each event cut:

1. verify the event against the constitution and ledger prefix;
2. require genesis to have no parent state and later events to reference already produced state IDs;
3. require `constitution-bound.bound_constitution_id` to equal the validated constitution and accumulate the exact source-cut IDs named by `source-bound`;
4. reject later use of an unbound or internally changed source cut;
5. append Reality and Narrative records without replacement, wrapping every projected record with its originating `event_id` and `event_seq`;
6. apply Manifest carrier and Open Berth lifecycle effects while preserving their full effect histories;
7. apply branch effects to a retained branch table;
8. compute sorted live heads and dormant branches;
9. build projections and then the composite checkpoint.

Every projection has:

```js
{
  schema: 'haunted-phonograph/storyship-projection/v0',
  kind, // reality | narrative | manifest | memory | open-berth
  projector_version,
  constitution_id,
  voyage_id,
  event_cut,
  records,
  projection_id,
}
```

Projection arrays preserve ledger order. Sets such as branch IDs, source IDs, and explicit references are deduplicated and sorted before hashing.

MEMORY contains:

```js
{
  active_carriers,
  referenced_narrative_relations,
}
```

Include only Narrative records named by active carrier `narrative_relation_ids`. A missing relation reference fails with `STORYSHIP_MEMORY_REFERENCE_MISSING`; never import the entire Narrative projection.

The checkpoint contains:

```js
{
  schema: 'haunted-phonograph/storyship-checkpoint/v0',
  projector_version,
  constitution_id,
  voyage_id,
  event_cut,
  tip_event_id,
  branch_table,
  branch_heads,
  dormant_branches,
  currentness,
  reality_projection_id,
  narrative_projection_id,
  manifest_projection_id,
  memory_projection_id,
  open_berth_projection_id,
  state_id,
}
```

`currentness` is exactly one of:

```js
{ status: 'resolved', branch_id }
{ status: 'unresolved', branch_ids }
{ status: 'stopped', branch_ids: [] }
```

Hash `state_id` with that field omitted. `createProjectionDerivationReceipt` validates both checkpoints, requires the same constitution/voyage/cut, requires different projector versions, and returns a self-hashed frozen receipt. It never overwrites either checkpoint.

Each branch-table entry retains `branch_id`, `parent_branch_ids`, the `parent_state_ids` from the event that created it, `born_at_event_id`, current `status`, and the ordered status history. Transfer Packet 000 later copies the resolved live branch's retained `parent_state_ids`; it does not infer parents from timestamps.

For `storyship-projector/v0-reinterpretation`, v0 deliberately preserves the same record-selection semantics and changes only the declared projector version and resulting identities. The derivation receipt is the proof that a second rendering was appended without mutating the first; any future semantic reinterpretation requires a new accepted projector version.

The derivation receipt is exactly `{ schema, constitution_id, voyage_id, event_cut, prior_state_id, next_state_id, prior_projector_version, next_projector_version, derivation_receipt_id }` with schema `haunted-phonograph/storyship-projection-derivation-receipt/v0`.

- [ ] **Step 4: Run GREEN, determinism loop, and regression**

```bash
node --test test/storyship-projector.test.mjs
for run in 1 2 3 4 5; do node --test test/storyship-projector.test.mjs >/dev/null || exit 1; done
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/storyship-projector.mjs test/storyship-projector.test.mjs test/helpers/storyship-fixture.mjs
git commit -m "feat: replay Storyship continuity state"
```

---

### Task 4: Seal MEMORY, OPEN BERTH, Transfer Packet 000, and receipts

**Files:**

- Create: `src/storyship-packet.mjs`
- Create: `test/storyship-packet.test.mjs`

**Interfaces:**

- `sealTransferPacket000({ constitution, replay, declaredEnvironment })`
- `createNoSpendCrossingReceipt({ constitution, events, replay, packet, result, previousReceipts })`
- `verifyStoryshipReceiptChain(receipts)`

- [ ] **Step 1: Write RED packet tests**

Use one resolved live branch and assert the packet contains exactly:

```js
{
  schema: 'haunted-phonograph/storyship-transfer-packet/v0',
  constitution_id,
  voyage_id,
  branch_id,
  parent_state_ids,
  event_cut,
  reality_projection_id,
  memory_projection_id,
  open_berth_projection_id,
  source_cut,
  projector_versions,
  canonicalization_policy: 'hp-canonical-json-v1',
  declared_environment,
  packet_id,
}
```

Assert a second seal is byte-identical and appending a later event does not change a packet sealed from the prior replay object.

Construct a `protected-silence` Reality event and an Open Berth effect whose `basis_event_ids` includes that event. Assert:

```js
assert.throws(
  () => sealTransferPacket000({ constitution, replay: attackedReplay, declaredEnvironment }),
  error =>
    error?.code === 'STORYSHIP_PACKET_MAPPING_REFUSED' &&
    error?.result?.target === 'packet_mapping' &&
    error?.result?.result === 'refuses',
);
```

Repeat for every forbidden class exported in Task 1. Also refuse ambiguous currentness, a missing source cut, a mismatched constitution, and any declared environment containing `network_access: true`, non-empty `provider_calls`, or `credit_debit` other than zero. An `inaccessible` or `unknown` source cut returns a typed `unresolved source_binding` result and emits no packet.

Receipt tests must prove:

- `actual_credit_debit === 0`;
- `external_calls` is exactly an empty frozen array;
- request/provider/customs fields are explicit `null` or empty lists;
- projection IDs, event IDs, branch heads, dormant residue, selection/encounter event IDs, packet ID, and previous receipt IDs are bound;
- a missing or changed previous receipt fails `verifyStoryshipReceiptChain`.

- [ ] **Step 2: Run RED**

```bash
node --test test/storyship-packet.test.mjs
```

- [ ] **Step 3: Implement conservative sealing**

Before hashing a packet:

1. validate the constitution and every projection/checkpoint identity;
2. require `currentness.status === 'resolved'`;
3. union and sort all source cuts used through `event_cut`;
4. require every packet source cut to be `available`; classify any other availability as `unresolved source_binding`;
5. inspect every open Open Berth entry's `basis_event_ids`;
6. refuse if any basis event contains a forbidden Reality class;
7. treat `explicit_non_imports` as stable record/event IDs and require every named ID to remain outside MEMORY and Open Berth content;
8. require a fixed declaration:

```js
{
  execution_mode: 'fixture-only/no-spend',
  node_major: 22,
  network_access: false,
  provider_calls: [],
  credit_debit: 0,
}
```

The no-spend receipt schema is `haunted-phonograph/storyship-crossing-receipt/v0`. Its exact shape is:

```js
{
  schema,
  constitution_id,
  voyage_id,
  branch_id,
  parent_state_ids,
  packet_id,
  event_cut,
  source_cut,
  request_event_ids,
  provider_visible_fields,
  observed_result_count,
  sibling_artifact_refs,
  actual_credit_debit: 0,
  external_calls: [],
  human_encounter_event_ids,
  selection_event_ids,
  appended_event_ids,
  resulting_branch_head_set,
  projection_ids: {
    reality,
    narrative,
    manifest,
    memory,
    open_berth,
  },
  projector_versions,
  canonicalization_policy,
  declared_environment,
  unresolved,
  refused,
  lost,
  dormant_branch_ids,
  previous_receipt_ids,
  customs_receipt_id,
  machine_result_id,
  owner_gate_status: 'not-constituted',
  receipt_id,
}
```

Derive event/artifact counts and IDs from the verified ledger prefix rather than caller summaries. In the complete fixture, `observed_result_count` is 2, both sibling artifact refs are retained, and `customs_receipt_id` is `null`. Hash with `receipt_id` omitted. A machine `supports` result remains `owner_gate_status: not-constituted`.

`request_event_ids`, provider-visible declarations, encounter IDs, selection IDs, and appended event IDs preserve ledger order. Source cuts, sibling artifact refs, branch-head/dormant IDs, previous receipt IDs, and the stable IDs placed in `unresolved | refused | lost` are deduplicated and sorted before hashing.

- [ ] **Step 4: Run GREEN and regression**

```bash
node --test test/storyship-packet.test.mjs
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/storyship-packet.mjs test/storyship-packet.test.mjs
git commit -m "feat: seal Storyship no-spend packets"
```

---

### Task 5: Keep carrier, observation method, and customs claims typed

**Files:**

- Create: `src/storyship-claims.mjs`
- Create: `test/storyship-claims.test.mjs`

**Interfaces:**

- `createRelationshipThread({ voyage_id, attributable_exchange_event_ids })`
- `validateRelationshipThread(thread)`
- `evaluateRelationshipRoad(input)`
- `evaluateObservationMethod(input)`
- `evaluateDestinationAdmission(input)`

- [ ] **Step 1: Write the three RED counterexamples**

Relationship-carrier confusion:

```js
const result = evaluateRelationshipRoad({
  candidate_artifact_ref: 'artifact:similar-001',
  similarity_observed: true,
  parent_state_ids: [],
  relationship_thread: null,
});
assert.equal(result.result, 'refuses');
assert.equal(result.target, 'lineage_claim');
assert.deepEqual(result.reason_codes, ['similarity-without-traveled-road']);
```

Abstraction counterexample:

```js
const result = evaluateObservationMethod({
  method_id: 'fixture-detector-v0',
  method_detected: false,
  known_descendant_parent_state_ids: ['sha256:' + 'b'.repeat(64)],
});
assert.equal(result.result, 'refuses');
assert.equal(result.target, 'observation_method');
assert.notEqual(result.target, 'continuity_law');
```

Customs boundary:

```js
const result = evaluateDestinationAdmission({
  arrival_event_id: 'sha256:' + 'c'.repeat(64),
  customs_receipt_id: null,
});
assert.equal(result.arrival_status, 'arrived-unadmitted');
assert.equal(result.result, 'unresolved');
assert.equal(result.target, 'destination_admission');
```

Also assert:

- a traveled parent road without attributable exchange history leaves `passenger_claim` unresolved rather than supported;
- both a traveled road and attributable exchange history may return machine `supports` for `passenger_claim`, still with `owner_gate_status: not-constituted`;
- a present customs receipt may support only `destination_admission` and cannot rewrite Storyship lineage.
- `createRelationshipThread` preserves the caller's attributable event order, rejects duplicates, and computes a stable `relationship_thread_id` without importing artifact similarity.

- [ ] **Step 2: Run RED**

```bash
node --test test/storyship-claims.test.mjs
```

- [ ] **Step 3: Implement only the sealed rules**

Each evaluator delegates identity creation to `createStoryshipResult` and contains no similarity score, embedding, audio inspection, provider inference, or destination-law inference.

`createRelationshipThread` returns:

```js
{
  schema: 'haunted-phonograph/storyship-relationship-thread/v0',
  voyage_id,
  attributable_exchange_event_ids,
  relationship_thread_id,
}
```

Hash the ordered exchange worldline with `relationship_thread_id` omitted. `evaluateRelationshipRoad` accepts either a validated thread or `null`; it does not accept a loose array that could silently reorder the exchange.

Exact rules:

```text
similarity && no parent road
  -> refuses lineage_claim

parent road && no validated relationship thread
  -> unresolved passenger_claim

parent road && validated relationship thread
  -> supports passenger_claim (machine-test-only)

known descendant road && method_detected == false
  -> refuses observation_method

no known descendant road
  -> unresolved observation_method

arrival event && no customs receipt
  -> arrived-unadmitted + unresolved destination_admission

arrival event && customs receipt
  -> arrived-admitted + supports destination_admission
```

- [ ] **Step 4: Run GREEN and regression**

```bash
node --test test/storyship-claims.test.mjs
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/storyship-claims.mjs test/storyship-claims.test.mjs
git commit -m "feat: type Storyship boundary claims"
```

---

### Task 6: Build the complete fixture-only continuity crucible

**Files:**

- Create: `test/storyship-crucible.test.mjs`
- Modify: `test/helpers/storyship-fixture.mjs`

**Interfaces:**

- Test helper `buildStoryshipFixture()` returns frozen `{ constitution, events, previousReceipts, declaredEnvironment }`.
- Test helper `createFixtureCrucibleResult(events)` creates the stable typed support record but performs no test and grants no authority.
- Test helper `appendFixtureEvent(state, overrides)` obtains parent state IDs by replay, never by literal fabrication.

- [ ] **Step 1: Assemble one honest fixture voyage**

The fixture must include, in ledger order:

```text
voyage-created
constitution-bound
source-bound
generation-requested
generation-observed twin A
generation-observed twin B
encounter-recorded
selection-recorded (A selected, B not deleted)
continuation-recorded (A live, B dormant)
interpretation-recorded
continuation-recorded (B2 descends from dormant B)
continuation-recorded (B2 dormant so A is the resolved live head)
interpretation-recorded (arrival declared; no customs result linked)
```

All timestamps are fixed literals. Admit two source cuts through Task 1's API: the approved raw Vault fixture and a separate `provider-observation` cut whose locator is explicitly fixture-only. Bind both with `source-bound` before use. The generation request payload says `mode: fixture-only` and `credit_debit: 0`. The two observed artifacts use distinct provider IDs and byte digests. Selection and continuation remain separate events, and the fixture selection mechanism is named `fixture-only-explicit-selection` so it cannot be mistaken for the unrecovered historical selector.

After A is the sole live head and before B2 returns, seal one valid no-spend predecessor receipt. Append the later continuation events with that receipt ID in `previous_receipt_ids`. The final fixture therefore exercises a real resolvable receipt link rather than an always-empty list.

- [ ] **Step 2: Write eleven named subtests**

Create one `test('STORYSHIP no-spend continuity crucible', async t => { ... })` with exactly eleven `await t.test` calls whose names match the design's tests. Each subtest must assert the target/result or byte/identity condition in the coverage table above.

Only after all eleven awaited subtests pass, create:

```js
const crucibleResult = createStoryshipResult({
  result: 'supports',
  target: 'continuity_law',
  basis_event_ids: fixture.events.map(event => event.event_id),
  reason_codes: ['eleven-fixture-witnesses-passed'],
});
assert.equal(crucibleResult.owner_gate_status, 'not-constituted');
```

This is a machine test result, not a launch authorization.

`storyship-reentry-run.test.mjs` may later serialize the same helper-produced result as a prior sealed input. The fresh runner validates that record's identity and binding; it does not claim that replay alone reran or proved the eleven crucible assertions.

- [ ] **Step 3: Run RED/GREEN and prove no network-capable import appeared**

```bash
node --test test/storyship-crucible.test.mjs
rg -n "fetch\\(|https?://|SUNO|suno|API_KEY|TOKEN|credit_debit: [1-9]" src/storyship-*.mjs test/storyship-*.test.mjs test/helpers/storyship-fixture.mjs
```

Expected after GREEN: the test passes. The `rg` output may contain only negative assertions, schema documentation, fixture labels, and `credit_debit: 0`; inspect every hit. It must reveal no network call, credential lookup, or positive debit.

- [ ] **Step 4: Run the full suite**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add test/storyship-crucible.test.mjs test/helpers/storyship-fixture.mjs
git commit -m "test: add Storyship continuity crucible"
```

---

### Task 7: Prove fresh-process re-entry and fail-closed output

**Files:**

- Create: `src/run-storyship-preflight.mjs`
- Create: `scripts/run-storyship-preflight.mjs`
- Create: `test/storyship-reentry-run.test.mjs`
- Modify: `package.json`

**Interfaces:**

- `runStoryshipPreflight({ constitutionPath, eventsPath, previousReceiptsPath, resultPath, outputDirectory, eventCut, declaredEnvironment })`
- CLI arguments: `--constitution`, `--events`, `--receipts`, `--result`, `--output`, optional `--cut`.
- Add package script: `"storyship:preflight": "node scripts/run-storyship-preflight.mjs"`.

- [ ] **Step 1: Write the RED fresh-process test**

In a temporary directory:

1. build the deterministic fixture;
2. create the prior sealed result with `createFixtureCrucibleResult(fixture.events)`;
3. write `constitution.json`, `events.json`, `previous-receipts.json`, and `crucible-result.json` with `canonicalStringify`;
4. spawn the CLI twice with `process.execPath` into two separate empty output directories;
5. compare raw bytes for `checkpoint.json`, `transfer-packet-000.json`, and `crossing-receipt.json`;
6. parse and revalidate every identity.

Use `spawnSync` or promisified `execFile` with an explicit argv array. Never invoke a shell.

Then clone the inputs four times and independently tamper:

```text
parent_state_ids
one referenced previous receipt or previous_receipt_ids
constitution_id
one source_cut field
```

For each tamper, assert a non-zero child exit and `ENOENT` for both `transfer-packet-000.json` and `crossing-receipt.json`.

Do not rely only on a stale self-hash. Where the public constructor permits it, recompute the tampered object's local ID before running the child process: use an unknown but syntactically valid parent state, a newly admitted but never `source-bound` source cut, and a rehashed previous receipt whose old ID remains referenced. The semantic chain must still fail. A coordinated reseal of the constitution, every event, every source binding, and every descendant is a new worldline, not “undetected tampering,” and is outside this attack fixture.

- [ ] **Step 2: Run RED**

```bash
node --test test/storyship-reentry-run.test.mjs
```

- [ ] **Step 3: Implement the file-safe runner**

Follow `src/run-specimen.mjs` conventions with stricter rollback:

- read UTF-8 JSON;
- validate before creating final outputs;
- verify that every event `previous_receipt_ids` member resolves in the loaded previous-receipt chain;
- validate the loaded machine result without promoting `owner_gate_status`;
- compute all three canonical byte strings in memory;
- require target final paths not to exist;
- write three process-specific temporary files with `flag: 'wx'`;
- rename checkpoint, packet, then receipt;
- on any error, remove every temp path and any final path created by this invocation;
- never delete pre-existing user files;
- return parsed objects and exact output paths.

Do not read the current clock, Git state, environment credentials, network state, or conversation. `eventCut` defaults to the ledger length. The declared environment is the fixed Task 4 object.

The CLI requires `--receipts` and `--result` even when the receipts array is empty. It catches errors, prints only the stable error code/message to stderr, sets `process.exitCode = 1`, and never prints fixture contents or source records.

- [ ] **Step 4: Run GREEN, a five-process witness, and regression**

```bash
node --test test/storyship-reentry-run.test.mjs
for run in 1 2 3 4 5; do node --test test/storyship-reentry-run.test.mjs >/dev/null || exit 1; done
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/run-storyship-preflight.mjs scripts/run-storyship-preflight.mjs test/storyship-reentry-run.test.mjs package.json
git commit -m "feat: add Storyship preflight re-entry runner"
```

---

### Task 8: Record the no-spend verification without promoting it to law

**Files:**

- Create: `docs/storyship-continuity-spine-v0-verification.md`

- [ ] **Step 1: Run the final verification from a clean checkout**

```bash
npm ci
npm test
node --test test/storyship-crucible.test.mjs
node --test test/storyship-reentry-run.test.mjs
git status --short
```

Expected:

- dependency install succeeds without adding packages;
- all tests pass;
- both focused witnesses pass;
- worktree is clean before the verification document commit.

- [ ] **Step 2: Write the verification record from observed output**

The document must include:

```text
implementation commit tested
Node and npm versions
exact commands
total/pass/fail counts
five-run re-entry witness result
constitution_id
event cut and tip event_id
checkpoint state_id
packet_id
receipt_id
actual_credit_debit = 0
external_calls = []
network/credential scan result
machine continuity_law result
owner_gate_status = not-constituted
live launch = blocked
```

Copy identities from the runner output produced by the tests; do not precompute or invent them. The record must say explicitly that fixture support does not recover the historical selector, bind a real Vault source, reserve credits, constitute Haunted Phonography admission, or authorize live Suno execution.

- [ ] **Step 3: Refuse placeholders**

```bash
rg -n "TODO|TBD|PLACEHOLDER|<fill|<sha|coming soon" docs/storyship-continuity-spine-v0-verification.md
```

Expected: no matches.

- [ ] **Step 4: Commit and re-run**

```bash
git add docs/storyship-continuity-spine-v0-verification.md
git commit -m "docs: record Storyship no-spend verification"
npm test
git status --short
```

Expected: PASS and clean worktree.

---

## Final implementation review gate

Before presenting the implementation PR as complete:

- [ ] Compare the diff against this plan and the approved spec; account for every changed file.
- [ ] Run `npm test` on the exact final head and retain the fresh GitHub Actions run URL.
- [ ] Confirm all eleven named crucible tests execute; a skipped test is not a pass.
- [ ] Confirm packet/re-entry tests use fresh child processes and raw-byte comparisons.
- [ ] Confirm `git diff` contains no provider client, credential access, network request, positive credit debit, database, or new dependency.
- [ ] Confirm no Storyship module imports or mutates the existing render pipeline.
- [ ] Confirm raw Reality records and Narrative interpretations occupy separate immutable histories.
- [ ] Confirm unresolved branch heads block packet sealing.
- [ ] Confirm all machine `continuity_law` results remain `owner_gate_status: not-constituted`.
- [ ] Confirm no GitBook/Free Graph/sheet projection is treated as owner evidence or destination authority.
- [ ] Keep the PR unmerged until an exact-head landing confirmation is separately obtained.

## Explicitly deferred work

The following remain blocked after this plan succeeds:

```text
historical self-selection recovery
real Vault source binding
live Suno request
credit reserve and debit
human encounter with live output
live selection/continuation
Haunted Phonography customs admission
GitBook publication as constituted law
```

Each requires its own source cut, accepted descendant plan, and exact launch or landing authorization.
