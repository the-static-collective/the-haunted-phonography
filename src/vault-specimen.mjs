import { readFile, writeFile } from 'node:fs/promises';
import { runSpecimen } from './run-specimen.mjs';
import { resolveVaultWav, proveVaultPhonographChain } from './vault-intake.mjs';
import { identifySource } from './source.mjs';

/**
 * Explicit, human-selected source → Phonograph mutation, without extending
 * Vault browser acquisition or obtaining a license from verified file bytes.
 *
 * observation declaration remains human-authored and bound to exact SHA.
 * performance and sidecar are local files under operator-selected outputStem.
 */
export async function runVaultSpecimen({
  vaultRoot, handoffPath, providerTrackId, observationsPath, outputStem, seed,
}) {
  const selected = await resolveVaultWav({ vaultRoot, handoffPath, providerTrackId });
  const declared = JSON.parse(await readFile(observationsPath, 'utf8'));
  if (declared.sourceHash !== selected.source.sha256) {
    throw new Error('MANUAL_OBSERVATION_SOURCE_MISMATCH');
  }
  const result = await runSpecimen({
    sourcePath: selected.sourcePath,
    observationsPath, outputStem, seed,
  });
  const latest = await identifySource(selected.sourcePath);
  if (latest.sha256 !== selected.source.sha256 ||
      latest.byteLength !== selected.source.byteLength ||
      result.receipt.sourceHash !== selected.source.sha256 ||
      result.performance.sourceHash !== selected.source.sha256) {
    throw new Error('VAULT_SOURCE_CHANGED_DURING_MUTATION');
  }
  const bridge = proveVaultPhonographChain({
    vaultEvidence: selected.evidence, phonographReceipt: result.receipt,
  });
  await writeFile(outputStem + '.performance.json',
    JSON.stringify(result.performance, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  await writeFile(outputStem + '.vault-bridge.json',
    JSON.stringify(bridge, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  return {
    receipt: result.receipt,
    performance: result.performance,
    bridge,
    midiPath: result.midiPath,
    performancePath: outputStem + '.performance.json',
    bridgePath: outputStem + '.vault-bridge.json',
  };
}
