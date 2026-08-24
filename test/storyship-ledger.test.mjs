import test from 'node:test';
import assert from 'node:assert/strict';

import { hashCanonical } from '../src/provenance.mjs';
import {
  admitSourceCut,
  createConstitutionReceipt,
} from '../src/storyship-contract.mjs';
import {
  appendStoryshipEvent,
  createStoryshipEvent,
  validateStoryshipEvent,
  verifyStoryshipLedger,
} from '../src/storyship-ledger.mjs';
import {
  APPROVED_CONSTITUTION_INPUT,
  APPROVED_SOURCE_CUT_INPUT,
  makeStoryshipEventInput,
} from './helpers/storyship-fixture.mjs';

const SHA = value => `sha256:${value.repeat(64).slice(0, 64)}`;
const expectCode = code => error => error?.code === code;
const clone = value => structuredClone(value);

function fixture() {
  const constitution = createConstitutionReceipt(APPROVED_CONSTITUTION_INPUT);
  const sourceCut = admitSourceCut(APPROVED_SOURCE_CUT_INPUT);
  return { constitution, sourceCut };
}

test('event identity is deterministic, strict, and source cuts normalize by identity', () => {
  const { constitution, sourceCut } = fixture();
  const secondCut = admitSourceCut({
    ...clone(APPROVED_SOURCE_CUT_INPUT),
    stable_locator: 'fixture://vault/storyship/reference-001',
    revision_or_provider_identity: 'vault-revision-001',
    content_digest_when_available: SHA('b'),
  });

  const input = makeStoryshipEventInput({
    constitutionId: constitution.constitution_id,
    sourceCut: [secondCut, sourceCut],
    payload: { note: 'genesis' },
  });
  const first = createStoryshipEvent(input);
  const second = createStoryshipEvent(clone(input));
  assert.equal(first.event_id, second.event_id);
  assert.deepEqual(first.source_cut.map(cut => cut.source_cut_id),
    [...first.source_cut.map(cut => cut.source_cut_id)].sort());
  assert(Object.isFrozen(first));
  assert(Object.isFrozen(first.source_cut));
  assert.equal(validateStoryshipEvent(first), true);

  const reversedCutInput = { ...clone(input), source_cut: [sourceCut, secondCut] };
  assert.equal(createStoryshipEvent(reversedCutInput).event_id, first.event_id);

  const changed = createStoryshipEvent({ ...clone(input), branch_id: 'branch-other' });
  assert.notEqual(changed.event_id, first.event_id);

  assert.throws(
    () => createStoryshipEvent({ ...clone(input), event_type: 'vibes-happened' }),
    expectCode('INVALID_STORYSHIP_EVENT'),
  );
  assert.throws(
    () => validateStoryshipEvent({ ...clone(first), event_id: SHA('0') }),
    expectCode('INVALID_STORYSHIP_EVENT'),
  );
});

test('append is immutable and sequence is the only ledger order', () => {
  const { constitution, sourceCut } = fixture();
  const firstInput = makeStoryshipEventInput({
    constitutionId: constitution.constitution_id,
    sourceCut: [sourceCut],
    eventSeq: 1,
    recordedAt: '2026-08-24T12:10:00.000Z',
  });
  const one = appendStoryshipEvent([], firstInput);
  const snapshot = JSON.stringify(one);
  assert.equal(one.length, 1);
  assert(Object.isFrozen(one));

  const two = appendStoryshipEvent(one, makeStoryshipEventInput({
    constitutionId: constitution.constitution_id,
    sourceCut: [sourceCut],
    eventSeq: 2,
    eventType: 'interpretation-recorded',
    occurredAtSourceRaw: '1999-ish/provider-local',
    observedAt: '2026-08-24T11:00:00.000Z',
    recordedAt: '2026-08-24T11:00:01.000Z',
    payload: { text: 'late-discovered earlier occurrence' },
  }));
  assert.equal(JSON.stringify(one), snapshot);
  assert.equal(two.length, 2);
  assert.equal(two[1].event_seq, 2);
  assert.equal(two[1].occurred_at_source_raw, '1999-ish/provider-local');
  assert.doesNotThrow(() => verifyStoryshipLedger({ constitution, events: two }));

  assert.throws(
    () => appendStoryshipEvent([], { ...clone(firstInput), event_seq: 2 }),
    expectCode('INVALID_STORYSHIP_LEDGER'),
  );
  assert.throws(
    () => appendStoryshipEvent(one, { ...clone(firstInput), event_seq: 3 }),
    expectCode('INVALID_STORYSHIP_LEDGER'),
  );
});

test('ledger binds one voyage and one constitution without timestamp sorting', () => {
  const { constitution, sourceCut } = fixture();
  const first = createStoryshipEvent(makeStoryshipEventInput({
    constitutionId: constitution.constitution_id,
    sourceCut: [sourceCut],
  }));
  const second = createStoryshipEvent(makeStoryshipEventInput({
    constitutionId: constitution.constitution_id,
    sourceCut: [sourceCut],
    eventSeq: 2,
    eventType: 'interpretation-recorded',
    recordedAt: '2020-01-01T00:00:00Z',
  }));
  const summary = verifyStoryshipLedger({ constitution, events: [first, second] });
  assert.deepEqual(summary, {
    voyage_id: 'storyship-voyage-000',
    constitution_id: constitution.constitution_id,
    event_count: 2,
    tip_event_id: second.event_id,
  });
  assert(Object.isFrozen(summary));

  assert.throws(
    () => verifyStoryshipLedger({
      constitution,
      events: [first, createStoryshipEvent(makeStoryshipEventInput({
        constitutionId: constitution.constitution_id,
        sourceCut: [sourceCut],
        eventSeq: 2,
        voyageId: 'other-voyage',
        eventType: 'interpretation-recorded',
      }))],
    }),
    expectCode('INVALID_STORYSHIP_LEDGER'),
  );

  const otherConstitution = createConstitutionReceipt({
    ...clone(APPROVED_CONSTITUTION_INPUT),
    ordered_constitutive_paths: [...APPROVED_CONSTITUTION_INPUT.ordered_constitutive_paths].reverse(),
  });
  assert.throws(
    () => verifyStoryshipLedger({
      constitution,
      events: [createStoryshipEvent(makeStoryshipEventInput({
        constitutionId: otherConstitution.constitution_id,
        sourceCut: [sourceCut],
      }))],
    }),
    expectCode('INVALID_STORYSHIP_LEDGER'),
  );
});

test('reality and narrative stay structurally separate and corrections append', () => {
  const { constitution, sourceCut } = fixture();
  const rawEvent = createStoryshipEvent(makeStoryshipEventInput({
    constitutionId: constitution.constitution_id,
    sourceCut: [sourceCut],
    realityEffects: [{
      record_id: 'raw-provider-observation-001',
      record_class: 'provider-observation',
      subject: 'provider.created_at',
      value: '2026-08-01T00:00:00Z',
      source_cut_ids: [sourceCut.source_cut_id],
    }],
  }));

  const attack = {
    interpretation_id: 'narrative-cleanup-001',
    text: 'a cleaner account',
    basis_event_ids: [rawEvent.event_id],
    authority_scope: 'human-interpretation',
    replaces_reality_record_id: 'raw-provider-observation-001',
  };
  assert.throws(
    () => createStoryshipEvent(makeStoryshipEventInput({
      constitutionId: constitution.constitution_id,
      sourceCut: [sourceCut],
      eventSeq: 2,
      eventType: 'interpretation-recorded',
      narrativeInterpretations: [attack],
    })),
    expectCode('INVALID_STORYSHIP_EVENT'),
  );
  assert.doesNotThrow(() => verifyStoryshipLedger({ constitution, events: [rawEvent] }));

  const correction = createStoryshipEvent(makeStoryshipEventInput({
    constitutionId: constitution.constitution_id,
    sourceCut: [sourceCut],
    eventSeq: 2,
    eventType: 'correction-recorded',
    payload: { corrects_event_ids: [rawEvent.event_id], reason: 'provider later clarified' },
    realityEffects: [{
      record_id: 'raw-provider-observation-002',
      record_class: 'provider-observation',
      subject: 'provider.created_at.corrected',
      value: '2026-08-01T00:00:01Z',
      source_cut_ids: [sourceCut.source_cut_id],
    }],
  }));
  const events = [rawEvent, correction];
  assert.equal(events[0].reality_effects[0].record_id, 'raw-provider-observation-001');
  assert.deepEqual(events[1].payload.corrects_event_ids, [rawEvent.event_id]);
  assert.doesNotThrow(() => verifyStoryshipLedger({ constitution, events }));
});

test('strict nested effect contracts reject authority leakage', () => {
  const { constitution, sourceCut } = fixture();
  const base = makeStoryshipEventInput({
    constitutionId: constitution.constitution_id,
    sourceCut: [sourceCut],
  });

  assert.throws(
    () => createStoryshipEvent({
      ...clone(base),
      reality_effects: [{
        record_id: 'r1', record_class: 'story', subject: 'x', value: true, source_cut_ids: [],
      }],
    }),
    expectCode('INVALID_STORYSHIP_EVENT'),
  );

  const carrier = createStoryshipEvent({
    ...clone(base),
    manifest_effects: [{
      kind: 'carrier', effect_id: 'carry-1', action: 'carry', carrier_ref: 'artifact:1',
      narrative_relation_ids: [], basis_event_ids: [], target_effect_id: null,
    }],
    uncertainty: [{
      uncertainty_id: 'u1', subject: 'prompt provenance', alternatives: ['unknown', 'not-recovered'],
      evidence_refs: ['source-cut:fixture'], status: 'open',
    }],
  });
  assert.equal(carrier.manifest_effects[0].action, 'carry');

  assert.throws(
    () => createStoryshipEvent({
      ...clone(base),
      manifest_effects: [{
        kind: 'carrier', effect_id: 'retire-1', action: 'retire', carrier_ref: 'artifact:1',
        narrative_relation_ids: [], basis_event_ids: [], target_effect_id: null,
      }],
    }),
    expectCode('INVALID_STORYSHIP_EVENT'),
  );

  const berth = createStoryshipEvent({
    ...clone(base),
    manifest_effects: [{
      kind: 'open-berth', effect_id: 'berth-1', action: 'open',
      question_or_possibility: 'what may legitimately develop?', basis_event_ids: [],
      allowed_scope: 'fixture-only', explicit_non_imports: ['protected silence'],
      opened_by: 'operator-000', status: 'open', target_effect_id: null,
    }],
  });
  assert.equal(berth.manifest_effects[0].status, 'open');
});

test('load-bearing payloads remain exact and generation artifacts bind provider identity plus bytes', () => {
  const { constitution, sourceCut } = fixture();
  const providerIdentity = 'suno-fixture-artifact-000';
  const contentDigest = SHA('c');
  const artifactId = hashCanonical({ provider_identity: providerIdentity, content_digest: contentDigest });
  const branchEffects = [{ branch_id: 'branch-a', parent_branch_ids: ['branch-root'], status: 'live' }];

  const observed = createStoryshipEvent(makeStoryshipEventInput({
    constitutionId: constitution.constitution_id,
    sourceCut: [sourceCut],
    eventType: 'generation-observed',
    payload: {
      request_event_id: SHA('d'),
      artifact: { artifact_id: artifactId, provider_identity: providerIdentity, content_digest: contentDigest },
      branch_effects: branchEffects,
    },
  }));
  assert.equal(observed.payload.artifact.artifact_id, artifactId);

  assert.throws(
    () => createStoryshipEvent(makeStoryshipEventInput({
      constitutionId: constitution.constitution_id,
      sourceCut: [sourceCut],
      eventType: 'generation-observed',
      payload: {
        request_event_id: SHA('d'),
        artifact: { artifact_id: SHA('0'), provider_identity: providerIdentity, content_digest: contentDigest },
        branch_effects: branchEffects,
      },
    })),
    expectCode('INVALID_STORYSHIP_EVENT'),
  );

  assert.throws(
    () => createStoryshipEvent(makeStoryshipEventInput({
      constitutionId: constitution.constitution_id,
      sourceCut: [sourceCut],
      eventType: 'interpretation-recorded',
      payload: { branch_effects: branchEffects },
    })),
    expectCode('INVALID_STORYSHIP_EVENT'),
  );

  const requested = createStoryshipEvent(makeStoryshipEventInput({
    constitutionId: constitution.constitution_id,
    sourceCut: [sourceCut],
    eventType: 'generation-requested',
    payload: {
      request_ref: 'fixture-request-000',
      mode: 'fixture-only',
      provider_visible_fields: { prompt: 'fixture only' },
      credit_debit: 0,
    },
  }));
  assert.equal(requested.payload.credit_debit, 0);
  assert.throws(
    () => createStoryshipEvent({ ...clone(requested), event_id: undefined }),
    expectCode('INVALID_STORYSHIP_EVENT'),
  );
});
