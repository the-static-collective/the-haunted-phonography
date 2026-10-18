# VAULT-PHONO-001 — Preserve the source, let music change

**Status:** local-only, synthetic interoperability witness. No personal Suno exports or real church assets are committed, accessed, or published.

This adapter takes a **verified exact-byte WAV** from the existing **Autodiscography Vault** handoff, independently reads and re-hashes the local audio, and uses it as the source for a **Haunted Phonograph** musical experiment.

The music may change; the source evidence may not.

```text
Vault handoff: state=verified, asset.role=audio_wav
       │
  exact bytes + sha256 + length checked again
       │
  Haunted Phonograph source
       │
  separately admitted MANUAL observations
       │
  PhonographScore → named mutation → ResolvedPerformance
       │
  MIDI + Phonograph completion receipt
       │
  Vault/Phonograph bridge residue (hashes only)
       │
  Static Live's existing PHONO-LIVE intake
       │
  human LiveIntent + live capability fallback
       │
  stage package → GHoT optional WAV checks
```

## Contract

`resolveVaultWav({ vaultRoot, handoffPath, providerTrackId })` accepts only:

- `schema: autodiscography-vault-handoff/v0`, the actual Vault release schema.
- exactly one record with `provider=suno`, matching `providerTrackId`, `state=verified` and `asset.role=audio_wav`;
- an existing, Vault-relative non-symlink WAV whose re-read exact `byteLength` and `sha256` match the handoff.

No guessed endpoints, session material, web requests, extension permissions, arbitrary reads, public uploading or replacement of Vault receipts. It cannot turn an `mp3` or incomplete WAV into a verified audio source. The bridge sidecar omits local file paths.

`runVaultSpecimen(...)` combines that exact source with an explicit manually written `haunted-phonograph/observation-declaration/v1` whose source hash matches. It invokes the existing `runSpecimen` machinery, rechecks source bytes, and emits:

- `*.mid`, `*.receipt.json`, and other ordinary Phonograph experiment artifacts;
- `*.performance.json`, the actual `haunted-phonograph/resolved-performance/v1` for the existing Static Live intake;
- `*.vault-bridge.json`, an evidence-only bridge binding source and performance hashes.

**No claim is made that a preserved Suno generation is legal to publish, stream or incorporate into a church song.** Rights, contributor consent, pastoral approval, and actual musician participation remain separate gates. Nor does a manual observation declaration mean the algorithm independently heard a note.

This is a one-source experiment, not a method for bulk Vault corpus ingestion.

## Verify

```sh
npm test
node --test test/vault-phono-001.test.mjs
```

Tests use the existing synthetic WAV source and manual observation fixture, copy them into a temporary fake Vault, and run a real Phonograph MIDI mutation. Tests also require failure on absent/partial/duplicate handoffs, digest tampering, path traversal, symlinked assets and mismatched manual observations.

## Future Living Hymnal crossing

The source Vault currently supports **Suno preservation**, not arbitrary church recordings. Do not upload a Sunday livestream or private prayer to the personal Vault as if it were an approved church archive.

For a real church-owned archive, develop a **separate church-governed vault adapter** with participant consent, retention, access controls, licensing and exact-byte receipts. Its material may later be consciously proposed to Phonography, but neither preservation nor a successful mutation implies publication.

The existing Static Live `src/phonograph-intake.js` already verifies the completed Phonograph receipt and exact `ResolvedPerformance` hash and combines them with an explicit `LiveIntent`. This experiment deliberately keeps that stage authority in Static Live.

**VAULT != AUTHORSHIP. PRESERVED != LICENSED. PHONOGRAPH PROPOSAL != WORSHIP APPROVAL.**
