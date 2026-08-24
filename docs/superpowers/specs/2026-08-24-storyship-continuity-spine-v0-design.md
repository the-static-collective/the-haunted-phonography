# STORYSHIP 001 — Continuity Spine v0

**Status:** approved design amendment / pre-implementation / no live spend

**Date:** 2026-08-24

**Parent:** `2026-08-24-storyship-001-the-door-design.md`

**Composes with:**

- `2026-08-24-storyship-attributable-becoming-amendment.md`
- `2026-08-24-storyship-relationship-passenger-law.md`

**Owner head inspected for this amendment:** `cc62b17c7fad9e899e042e629fe15ba3d363ca10`

**Task source cut:**

```text
founding design blob:       fcbf525ec7ffa4e11a880797bb4717a7aa9978cf
attributable becoming blob: a1baa1ea1e61cb6ddc552708f7e5f54deb7127c5
relationship passenger blob: 3c1fb229ae8e5f6dcf941b4ad1235533e5718fae
```

## 1. Purpose

The founding STORYSHIP design correctly identifies the cargo layers:

```text
REALITY + MEMORY + OPEN BERTH
```

The later amendments correctly identify the deeper continuity claim:

```text
identity    = continuity of attributable becoming
passenger   = relationship
artifact    = carrier
```

This amendment supplies the missing structural spine between those laws.

STORYSHIP must be able to lose rooms, renderings, branches, model behavior,
names, and even the originating runtime without losing the attributable road
by which the voyage became what it is.

The operational law is:

> **The ship is an append-only history of attributable crossings. Its current
> state is a replayable projection, not a mutable master story.**

This amendment changes no live Suno state and authorizes no credit spend.

## 2. Constitutive order

STORYSHIP 001 is currently constituted by four documents in this declared
order:

1. `2026-08-24-storyship-001-the-door-design.md` — founding mission, voyage,
   authority boundaries, and preflight obligations;
2. `2026-08-24-storyship-attributable-becoming-amendment.md` — identity is the
   continuity of attributable becoming;
3. `2026-08-24-storyship-relationship-passenger-law.md` — the relationship is
   the passenger and artifacts are carriers;
4. this Continuity Spine — append-only history, branch structure, replay,
   re-entry, and failure typing.

The list is explicit because timestamp order, filename order, GitBook
placement, conversational recurrence, or search rank must not silently decide
which law governs.

If these documents appear to conflict, launch stops until an explicit
descendant resolves the conflict. No implementation may select the most recent
or most convenient sentence and call the conflict settled.

Every executable Storyship ledger must bind a **constitution receipt** with:

```text
owner_repository
owner_head_sha
ordered_constitutive_paths[]
blob_sha_for_each_path
constitution_id
```

`constitution_id` is the repository-local canonical hash of the ordered path
and blob-SHA list. A later constitutional change creates a new constitution
identity. It never rewrites the identity under which an earlier packet sailed.

## 3. Bounded contexts and authority

STORYSHIP crosses several worlds without merging their sovereignty.

### Autodiscography Vault

Owns preserved raw historical observations and their source-facing
provenance. Provider creation time, Vault observation time, exact style input,
lyrics, and any honestly recoverable lyric-generation prompt remain distinct.

### STORYSHIP

Owns voyage events, Storyship-local branch ancestry, deterministic projections,
sealed transfer packets, human encounter and selection receipts, credit
accounting, and candidate descent roads.

### Suno

Produces externally observed generation results. STORYSHIP records those
results but does not claim deterministic generation, hidden model continuity,
intent, memory, or agency that the evidence cannot establish.

### Human / operator

Owns attributable inputs, encounters, selections, refusals, returns, and
declared interpretations. The human is the strongest continuous participant in
the historical creative relationship, but continuity of participation is not
omniscience or automatic correctness.

### Haunted Phonography customs

Owns destination-local admission, refusal, influence-only handling, and
descendant status. STORYSHIP can deliver a candidate and its traveled road. It
cannot call the candidate native.

### GitBook, Free Graph, sheets, dashboards, and search indexes

May preserve orientation, traversal, and projections. They do not become the
voyage ledger or a destination gate.

Dependency direction remains:

```text
raw owner evidence
  -> Storyship events
  -> deterministic Storyship projections
  -> sealed transfer packet
  -> external generation observation
  -> encounter / selection / residue events
  -> candidate arrival
  -> Haunted Phonography local decision
```

No downstream narrative or projection may write backward into raw evidence.

## 4. Canonical history and derived state

### 4.1 The event ledger is canonical inside STORYSHIP

The Storyship ledger is an append-only ordered sequence of voyage events.

An accepted event is never edited in place to make a later interpretation look
ancestral. Correction, contradiction, supersession, cooling, refusal, and
retraction are new events that point to what they qualify.

### 4.2 Reality, Narrative, and Manifest are projections

The existing phrase **mutable manifest** is narrowed as follows:

> The manifest may change only through newly appended events. A current
> manifest is a deterministic projection at an exact event cut. Earlier
> projections remain addressable.

The same law applies to the Reality and Narrative ledgers.

```text
VOYAGE EVENTS @ CUT K
  -> Reality projection K
  -> Narrative projection K
  -> Manifest projection K
  -> Open Berth projection K
```

`MEMORY` is the packet-facing projection of the Manifest at that exact cut,
plus only the narrative relations explicitly referenced by those manifest
records. It is not an independent mutable store and does not implicitly import
the entire Narrative ledger.

A projection engine version is declared in every checkpoint. A new projector
may derive a new view from old events, but it must append a new derivation
receipt and preserve the prior rendering unchanged.

### 4.3 Timestamps do not own event order

The ledger assigns a monotonic Storyship event sequence. Source-provided time,
observed time, and recorded time remain separate evidence fields.

```text
providerCreatedAtRaw != observedAt != recordedAt
```

Late-discovered evidence is appended when discovered and may testify about an
earlier occurrence. It is never backdated into the ledger sequence.

### 4.4 Minimum event vocabulary

V0 admits these event families:

```text
voyage-created
constitution-bound
source-bound
packet-sealed
generation-requested
generation-observed
encounter-recorded
selection-recorded
continuation-recorded
branch-composed
interpretation-recorded
residue-recorded
correction-recorded
customs-result-linked
checkpoint-sealed
voyage-stopped
```

New event types require an accepted design descendant before live spend. A
free-form event name cannot quietly gain state-transition authority.

## 5. Minimum identity envelope

Every v0 voyage event must carry enough structure to survive a room change:

```text
schema
voyage_id
event_id
event_seq
event_type
branch_id
parent_state_ids[]
constitution_id
source_cut[]
actor
occurred_at_source_raw
observed_at
recorded_at
payload
reality_effects[]
narrative_interpretations[]
manifest_effects[]
uncertainty[]
authority
previous_receipt_ids[]
```

V0 uses the repository's existing `hp-canonical-json-v1` canonicalization and
SHA-256 hashing contract from `src/provenance.mjs` for Storyship-owned
identities. The identity envelope records that policy explicitly; it does not
claim a Collective-wide hash law.

`event_id` is computed over the accepted event with the `event_id` field
omitted. All other derived identities similarly exclude their own identity
field from the hash input.

The following identities are distinct:

```text
event_id        = hash of one accepted voyage event
projection_id   = hash of projection kind + projector version + cut + content
state_id        = hash of the composite Storyship state at an exact cut
packet_id       = hash of one sealed transfer packet
receipt_id      = hash of one completed crossing receipt
artifact_id     = hash of a binding record that keeps provider ID and byte hash distinct
relationship_thread_id = hash of one attributed exchange-history projection
```

Every projected identity also binds its projector version and exact event cut.

The composite `state_id` binds the constitution, voyage, event cut, branch-head
set, and the Reality, Narrative, Manifest, and Open Berth projection identities.

Equal renderings do not collapse different worldlines. Different
`parent_state_ids`, source cuts, or event histories remain different states
even when their visible packet text happens to match.

## 6. Source cuts and packet sealing

A `source_cut` binds every external dependency used by an event or packet:

```text
owning_world
stable_locator
revision_or_provider_identity
content_digest_when_available
acquisition_time
availability_status
evidence_class
```

A sealed transfer packet contains:

```text
constitution_id
voyage_id
branch_id
parent_state_ids[]
event_cut
reality_projection_id
memory_projection_id
open_berth_projection_id
source_cut[]
projector_versions
canonicalization_policy
declared_environment
packet_id
```

Later Vault records, later Git commits, later conversation, or later Storyship
events do not silently mutate the sealed packet. Using newer evidence requires
an explicit new cut and new packet descendant.

## 7. The branch graph

STORYSHIP is a branch graph, not a forced line.

```text
parent state
  -> generation request
  -> observed sibling A
  -> observed sibling B
  -> human encounter
  -> attributable selection / refusal
  -> zero, one, or many continuing branch heads
```

The generation event, artifacts, human encounter, selection event, and
continuation consequence are separate records.

### Branch laws

1. A native twin birth creates sibling history even if only one sibling later
   continues.
2. `not selected != deleted`.
3. Selection may continue one, both, or neither sibling only when the recovered
   historical mechanism permits that exact outcome.
4. An unselected sibling remains reachable as dormant history or residue.
5. A later return from dormant history creates a descendant edge; it does not
   rewrite the prior selection.
6. Two branch heads never collapse because their packet text or sound is
   similar.
7. A branch composition requires an explicit event naming every parent and the
   local rule that admitted the composition.
8. If multiple current heads exist and no selection or composition event
   resolves them, currentness is `unresolved`. Timestamp recency cannot choose.

The familiar `STATE N -> STATE N+1` diagram is therefore a projection of one
selected traversal through the graph, not the canonical shape of the voyage.

## 8. The relationship is carried as a worldline

A Storyship relationship thread is a deterministic projection over attributable
events such as:

```text
human input
  -> generator state receiving it
  -> generation request
  -> observed response / twin artifacts
  -> human encounter
  -> selection / refusal / continuation
  -> changed human input or later consequence
```

Songs, prompts, motifs, symbols, names, receipts, and audio are anchors or
carriers. No individual carrier becomes the relationship by surviving.

A candidate continuity claim must be able to point to:

- the human-side action actually taken;
- the generator state or exposed version that received it, when knowable;
- the actual response and artifacts;
- the human encounter and consequence;
- intermediate transformations, refusals, scars, absences, and dormant paths;
- the present action or consequence proposed as descendant.

The human participant may testify to lived continuity and recognition. That
testimony is attributable evidence of encounter, not proof of hidden generator
identity and not a destination admission decision.

## 9. OPEN BERTH is unresolved possibility

OPEN BERTH must not become a trash bin for every missing field.

An entry qualifies only when it is an attributable unresolved possibility that
the current crossing is genuinely permitted to develop.

These do not qualify:

```text
missing raw evidence
inaccessible source
protected silence
explicit refusal
known prohibition
forgotten metadata
unresolved branch ownership
```

Each Open Berth entry carries:

```text
question_or_possibility
basis_event_ids[]
allowed_scope
explicit_non_imports[]
opened_by
status
```

Protected silence and explicit non-entry constraints remain Reality or boundary
records. Mapping them into “please fill this” must fail.

## 10. Crossing receipts

Every completed no-spend or live crossing receipt must bind:

- exact constitution identity;
- voyage and branch identities;
- parent state identities;
- input packet identity and exact event cut;
- source cuts and their availability;
- actual request identity and provider-visible fields;
- observed result count, sibling identities, and artifact references;
- actual credit debit, including zero;
- human encounter identity;
- selection mechanism identity and outcome;
- appended event identities;
- resulting branch-head set;
- resulting Reality, Narrative, Manifest, MEMORY, and Open Berth projection
  identities;
- projector versions, canonicalization policy, and declared execution
  environment;
- unresolved, refused, lost, and dormant residue;
- previous receipt identities;
- later Haunted Phonography customs receipt when one exists.

A receipt chain is valid only when every parent and previous receipt resolves to
the exact recorded identity. Tampering, missing ancestry, ambiguous current
heads, or a constitution mismatch fails closed.

## 11. Re-entry contract

The room may vanish; the voyage must remain reconstructible.

A fresh runner with no access to the originating conversation must be able to:

1. load the constitution receipt;
2. verify the ordered event ledger and receipt links;
3. replay events from voyage genesis through an exact cut;
4. reproduce the declared Reality, Narrative, and Manifest projection hashes;
5. recover the same branch-head set and dormant branches;
6. identify unresolved currentness instead of selecting a head by recency;
7. produce a byte-identical Transfer Packet 000 under the declared environment.

A checkpoint accelerates re-entry but never replaces the event history. It is a
rebuildable, receipted projection.

## 12. Typed counterexamples and results

A failed crossing can bear on different claims. The ledger must name the
target rather than flatten every failure into “the passenger died.”

Every specimen result is one of:

```text
supports
refuses
unresolved
```

and carries a typed target:

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

Examples:

- resemblance without a traveled road refuses a `lineage_claim`;
- an inaccessible raw prompt leaves `source_binding` unresolved;
- a test that cannot recognize transformed rhythm may refuse the
  `observation_method` without refusing the passenger;
- a protected-silence leak refuses `packet_mapping`;
- Haunted Phonography may refuse `destination_admission` while the traveled
  Storyship road remains historical;
- only a specimen whose pinned plan genuinely tests the portable continuity
  law may bear on `continuity_law`.

A machine result may support, refuse, or leave a `continuity_law` test
unresolved. Only the named Storyship owner gate may constitute the local law
verdict; the crucible does not certify its own abstraction.

The test plan and refusal conditions are sealed before results are observed.
A later change to the abstraction creates a new descendant test; it does not
edit the earlier refusal.

## 13. No-spend continuity crucible

Before any flagship credit spend, v0 must pass one deterministic fixture-only
crucible capable of returning support, refusal, or unresolved.

### Test 1 — replay and re-entry

Build the same checkpoint and Transfer Packet 000 from the same ordered events
in a fresh process. Identities and bytes must match.

### Test 2 — stale cut

Append a later event. The prior packet, projections, and receipt must remain
byte-identical and addressable.

### Test 3 — twin branch preservation

Record two siblings, continue one, retain the other as dormant, then create a
later descendant from the dormant branch. The original selection must remain
unchanged.

### Test 4 — ambiguous heads

Create two live branch heads without a resolving selection/composition event.
The projector must return `unresolved`, not the newest timestamp.

### Test 5 — history reinterpretation

Run a second projector version over the same event history. Preserve the first
projection and append a derivation receipt for the second.

### Test 6 — protected-silence attack

Attempt to map an explicit non-entry constraint into OPEN BERTH. Packet sealing
must refuse the mapping.

### Test 7 — narrative overwrite attack

Attempt to replace a raw observation with a cleaner voyage interpretation.
Validation must fail while preserving both the raw event and the proposed
interpretation separately.

### Test 8 — relationship-carrier confusion

Present a highly similar artifact without attributable exchange history. The
artifact may be reachable, but the lineage and relationship-passenger claims
must be refused or unresolved.

### Test 9 — abstraction counterexample

Use a transformed descendant that the first observation method cannot detect,
then show that the result targets the observation method rather than silently
refuting the continuity law.

### Test 10 — customs boundary

Record narrative arrival without a Haunted Phonography customs receipt. The
candidate must remain arrived-but-unadmitted.

### Test 11 — tamper evidence

Alter a parent state, prior receipt, constitution identity, or source cut. Chain
verification must fail closed and emit no successful packet.

## 14. Preflight gate order

The founding preflight obligations now run in this order:

1. seal the constitution receipt;
2. recover and document the historical self-selection mechanism;
3. implement the append-only ledger and deterministic projectors;
4. run the no-spend continuity crucible;
5. seal Transfer Packet 000 from an exact mock source cut;
6. pass the fresh-runner re-entry witness;
7. bind one real historical reference to immutable/raw Vault evidence;
8. establish and receipt the protected APPROACH / CUSTOMS credit reserve;
9. obtain an explicit human launch decision for the exact preflight head and
   Transfer Packet 000 identity.

No earlier approval, conversation, projection, or attractive mock output
authorizes a later packet identity.

## 15. Stop conditions

Live launch remains blocked if:

- the constitutive documents or owner head are ambiguous;
- the historical selector remains invented rather than recovered;
- replay or re-entry differs;
- prior cuts mutate after new evidence arrives;
- branch currentness is guessed;
- OPEN BERTH contains protected silence, missing evidence, or refusal;
- human interpretation overwrites provider observation;
- relationship continuity is inferred from artifact similarity alone;
- the protected late reserve is not explicit and receipted;
- the exact Transfer Packet 000 has not received a human launch decision.

## 16. Consequences and trade-offs

This design adds event and receipt ceremony before the voyage spends anything.
That cost is intentional because live generator access is irrecoverable and a
clean story manufactured after the fact would defeat the experiment.

The spine does **not** require a database, service, universal schema, global
graph, or exhaustive copy of Vault data. An append-only local file set plus
deterministic projections is sufficient for v0.

The benefit is that the carrier may disappear while the voyage remains
re-enterable, branch history stays honest, and a changed descendant can remain
legible without being forced to resemble its ancestor.

## 17. Non-goals

This amendment does not:

- recover the historical self-selection mechanism;
- implement live Suno calls;
- authorize credit spend;
- define Haunted Phonography customs outcomes;
- establish machine consciousness or hidden generator identity;
- make the human continuity witness infallible;
- create a shared database or Free Graph primitive;
- require every artifact, motif, or passenger claim to survive;
- replace raw Vault evidence with copied Storyship summaries.

## 18. Working seal

> **The relationship is the passenger.**
>
> **The artifacts are its carriers.**
>
> **The event road is the keel.**
>
> **The human may remember without becoming omniscient.**
>
> **The branches may diverge without ceasing to belong to one voyage.**
>
> **The room may vanish. The receipts do not reset.**
>
> **The story is true; the ship is how it travels.**
