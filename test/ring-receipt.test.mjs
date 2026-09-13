import test from 'node:test';
import assert from 'node:assert/strict';

import { createRingReceipt } from '../src/ring-receipt.mjs';
import { runRing } from '../src/run-ring.mjs';
import { setupRingFixture } from './helpers/ring-fixture.mjs';

test('receipt binds exact history, trace, performance, and terminal state', () => {
  const { score, observations, seed, hauntInfluencePlan } = setupRingFixture();
  const run = runRing({ score, observations, seed, hauntInfluencePlan });
  const receipt = createRingReceipt({ score, observations, run, hauntInfluencePlan });

  assert.equal(receipt.schema, 'haunted-phonograph/ring-receipt/v1');
  assert.equal(receipt.traceHash, run.trace.traceHash);
  assert.equal(receipt.terminalState, 'completed');
  assert.deepEqual(receipt.visitedRelations, [
    'dynamic-bloom',
    'interval-displacement',
    'rhythmic-stretch',
  ]);
  assert.match(receipt.receiptHash, /^sha256:[0-9a-f]{64}$/);
  assert.equal(Object.hasOwn(receipt, 'authority'), false);
});

test('no-history receipt keeps an explicit null history identity', () => {
  const { score, observations, seed } = setupRingFixture();
  const run = runRing({ score, observations, seed });
  const receipt = createRingReceipt({ score, observations, run });

  assert.equal(receipt.historyPlanHash, null);
  assert.equal(receipt.terminalState, 'damped');
});

test('identical runs produce identical receipt identity', () => {
  const { score, observations, seed, hauntInfluencePlan } = setupRingFixture();
  const a = createRingReceipt({
    score,
    observations,
    run: runRing({ score, observations, seed, hauntInfluencePlan }),
    hauntInfluencePlan,
  });
  const b = createRingReceipt({
    score,
    observations,
    run: runRing({ score, observations, seed, hauntInfluencePlan }),
    hauntInfluencePlan,
  });

  assert.equal(a.receiptHash, b.receiptHash);
});
