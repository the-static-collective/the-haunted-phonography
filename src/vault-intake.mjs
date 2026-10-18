import { createHash } from 'node:crypto';
import { lstat, readFile, realpath, stat } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { identifySource } from './source.mjs';

/**
 * Resolve one exact, locally held Suno full-song WAV from a verified
 * autodiscography-vault-handoff/v0.
 *
 * This edge reads Vault's evidence; it never grants Phonograph acquisition,
 * browser/session access, permission to remix, or copyright ownership.
 */
function refused(code) { const e = new Error(code); e.code = code; throw e; }
function under(root, child) { return child.startsWith(root + sep); }
function safePath(value) {
  return typeof value === 'string' && value.length > 0 &&
    !value.startsWith('/') && !value.includes('\\') &&
    !value.split('/').some(part => !part || part === '.' || part === '..') &&
    value.split('/').every(part => /^[A-Za-z0-9_.-]+$/.test(part));
}
export async function resolveVaultWav({ vaultRoot, handoffPath, providerTrackId }) {
  if (typeof providerTrackId !== 'string' || !providerTrackId ||
      !/^[a-zA-Z0-9_-]{1,160}$/.test(providerTrackId)) refused('INVALID_TRACK_ID');
  if (typeof vaultRoot !== 'string' || typeof handoffPath !== 'string') refused('INVALID_LOCAL_SOURCE');
  const root = await realpath(resolve(vaultRoot));
  const handoff = await realpath(resolve(handoffPath));
  if (!under(root, handoff)) refused('HANDOFF_OUTSIDE_VAULT');
  const handoffInfo = await stat(handoff);
  if (!handoffInfo.isFile() || handoffInfo.size > 1024 * 1024) refused('INVALID_VAULT_HANDOFF');
  let parsed;
  try { parsed = JSON.parse(await readFile(handoff, 'utf8')); }
  catch { refused('INVALID_VAULT_HANDOFF'); }
  if (parsed?.schema !== 'autodiscography-vault-handoff/v0' || !Array.isArray(parsed.records))
    refused('INVALID_VAULT_HANDOFF');
  const candidates = parsed.records.filter(row =>
    row?.provider === 'suno' && row?.providerTrackId === providerTrackId &&
    row?.asset?.role === 'audio_wav');
  if (candidates.length !== 1) refused('MISSING_OR_AMBIGUOUS_VAULT_WAV');
  const entry = candidates[0];
  if (entry.state !== 'verified') refused('VAULT_ASSET_NOT_VERIFIED');
  const asset = entry.asset;
  if (!safePath(asset.path) || !asset.path.endsWith('.wav') ||
      !Number.isSafeInteger(asset.byteLength) || asset.byteLength <= 44 ||
      typeof asset.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(asset.sha256))
    refused('INVALID_VAULT_ASSET');
  const expected = resolve(root, asset.path);
  if (!under(root, expected)) refused('ASSET_OUTSIDE_VAULT');
  let component = root;
  for (const segment of asset.path.split('/')) {
    component = join(component, segment);
    if ((await lstat(component)).isSymbolicLink()) refused('SYMLINK_ASSET_REFUSED');
  }
  const actual = await realpath(expected);
  if (!under(root, actual)) refused('ASSET_OUTSIDE_VAULT');
  const size = await stat(actual);
  if (!size.isFile() || size.size !== asset.byteLength) refused('ASSET_BYTE_LENGTH_MISMATCH');
  const source = await identifySource(actual);
  if (source.byteLength !== asset.byteLength ||
      source.sha256 !== 'sha256:' + asset.sha256) refused('VAULT_EXACT_BYTES_MISMATCH');
  const evidence = {
    schema: 'haunted-phonograph.vault-source/v0.1',
    provider: 'suno',
    providerTrackId, sourceHash: source.sha256,
    byteLength: source.byteLength, vaultState: 'verified',
    // No local path, browser authorization, session material, or provider URL
    // travels in this evidence projection.
    evidenceClass: 'transport-exact-byte-verification',
    authority: 'source-bytes-only',
  };
  return Object.freeze({ sourcePath: actual, source, evidence: Object.freeze(evidence) });
}

export function proveVaultPhonographChain({ vaultEvidence, phonographReceipt }) {
  if (vaultEvidence?.schema !== 'haunted-phonograph.vault-source/v0.1' ||
      vaultEvidence?.vaultState !== 'verified' ||
      vaultEvidence?.authority !== 'source-bytes-only' ||
      phonographReceipt?.schema !== 'haunted-phonograph/receipt/v1' ||
      phonographReceipt?.status !== 'completed' ||
      phonographReceipt?.sourceHash !== vaultEvidence.sourceHash) {
    refused('VAULT_PHONOGRAPH_SOURCE_CHAIN_MISMATCH');
  }
  const body = {
    schema: 'haunted-phonograph.vault-provenance-bridge/v0.1',
    sourceHash: vaultEvidence.sourceHash,
    byteLength: vaultEvidence.byteLength,
    provider: 'suno',
    providerTrackId: vaultEvidence.providerTrackId,
    resolvedPerformanceHash: phonographReceipt.resolvedPerformanceHash,
    receiptHash: 'sha256:' + createHash('sha256')
      .update(JSON.stringify(phonographReceipt)).digest('hex'),
    laws: ['VAULT_BYTES != MUSICAL EVIDENCE', 'MUTATION != SOURCE',
      'VERIFIED_BYTES != REUSE_LICENSE', 'BRIDGE != CHURCH_APPROVAL'],
  };
  return Object.freeze(body);
}
