# Specimen 001 verification evidence

Fresh local verification after the final branch mutation:

- `npm test`: 13/13 new Specimen 001 tests pass.
- New runtime modules pass `node --check`.
- `npm run specimen:001` creates `out/specimen-001.mid` and `out/specimen-001.receipt.json`.
- `file out/specimen-001.mid`: Standard MIDI data, format 0, one track, division 1/480.
- Source fixture: 4,044 bytes, SHA-256 `8a7d0c4c3e5fe5a8eb9eb35217336d3c95fb0eb9555e72cf63c5a862e4de55ed`.
- Score identity: `sha256:2d18cb2aa0ff9ec0321cebf21f4be1199a5ac4eee7a0a6eb1b202cd1f462c4ff`.
- ResolvedPerformance identity: `sha256:767137acce24b3da8f959887951cd05964b00881832766441b4fa10a133d161e`.
- MIDI artifact: 69 bytes, SHA-256 `08d0a5fd80a535d93211f4bfd36e2377c423dcaa1a95db159e881e64f666fd38`.
- GitHub fixture blob `b3e19650e51f70aecd7751cfb47a4b9447788bfa` exactly matches local `git hash-object` for the final WAV.
- Load-bearing source/test Git blobs were compared with local `git hash-object` and matched exactly.

Runtime limitation: this environment cannot clone GitHub over DNS. The 13 fresh tests therefore ran in a local mirror using the landed provenance public API contract. The branch does not modify `src/provenance.mjs` or `test/provenance.test.mjs`; their GitHub blobs remain those merged in PR #4. This note does not represent the pre-existing 15 provenance tests as freshly rerun.
