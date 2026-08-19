import { hashCanonical } from './provenance.mjs';
import { createHauntCapsule } from './haunt-capsule.mjs';

function fail(code, message) {
  const error = new TypeError(message);
  error.code = code;
  throw error;
}

export function derivePhonographHauntCapsule({ receipt, unresolved = [], refusedRefs = [] }) {
  if (receipt?.schema !== 'haunted-phonograph/receipt/v1' || receipt.status !== 'completed') {
    fail('HAUNT_RETURN_INVALID_RECEIPT', 'HAUNT return residue requires a completed Phonograph receipt');
  }
  if (typeof receipt.sourceHash !== 'string' || receipt.sourceHash.length === 0) {
    fail('HAUNT_RETURN_INVALID_RECEIPT', 'completed receipt must contain sourceHash');
  }
  if (!Array.isArray(unresolved) || !Array.isArray(refusedRefs)) {
    fail('HAUNT_RETURN_INVALID_RESIDUE', 'unresolved and refusedRefs must be arrays');
  }

  const encounterRef = hashCanonical(receipt);
  const consumedCapsuleIds = Array.isArray(receipt.hauntInfluence?.consumedCapsuleIds)
    ? [...receipt.hauntInfluence.consumedCapsuleIds]
    : [];
  const relations = receipt.hauntInfluence?.routePressure === 'late-bloom'
    ? [{
        relation: 'memory-influenced-late-bloom',
        direction: 'positive',
        strength: 1,
        evidenceRefs: [encounterRef],
      }]
    : [];

  return createHauntCapsule({
    sourceRef: receipt.sourceHash,
    encounterRef,
    origin: {
      appliance: 'haunted-phonograph',
      receiptRef: encounterRef,
      policy: 'phonograph-haunt-return/v1',
    },
    relations,
    invitations: [],
    lineage: {
      parentRefs: [],
      influenceOnlyRefs: consumedCapsuleIds,
      refusedRefs: [...refusedRefs],
    },
    unresolved: structuredClone(unresolved),
    derivedFrom: [encounterRef],
  });
}
