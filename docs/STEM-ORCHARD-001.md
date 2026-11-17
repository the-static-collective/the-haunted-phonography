# STEM ORCHARD 001 — Haunted Phonograph × HUMKIN

**Status:** first deterministic cross-song audio renderer and private cloud transport; no real HUMKIN stem files have been supplied or auditioned. This is a proposal pipeline, not a listening model, broadcast service or automated publication.

## The actual crossing

Two or more creator-controlled stems from **different HUMKIN songs** become a NEW private 44.1 kHz stereo WAV with a concrete SHA-256 identity, an accountable render receipt and a HUMKIN HOLD handoff. The original bytes never change.

1. Start with a *real* owner's stem exports (WAV/FLAC/MP3/M4A). Do not confuse published stereo MP3s with instrument stems.
2. Record each source song's exact HUMKIN catalog ID, stem role and original SHA-256. **Owner-declare** a BPM and tonal center; these are not machine-measured.
3. Either propose candidate pairs from a catalog using a deterministic seed or write a two-to-eight layer request directly.
4. Refuse mismatched owner-declared BPM/tonal center; **no time-stretch or transposition is claimed** in v1. A human can prepare properly adapted stems before input.
5. Validate actual source bytes and duration with SHA-256 and ffprobe; use FFmpeg to align, gain, layer, limit and render.
6. Write audio, receipt and HUMKIN import manifest; all are HOLD, not on-air.
7. Optionally run the *same* renderer on Modal, privately fetching source stems from R2 and returning private candidates to R2.
8. The HUMKIN Living Discography's receiving desk imports the manifest into *local-only* editorial review. The station's playlist, Supabase library and public audio remain untouched.

This deliberately does **not** claim musical compatibility from BPM/key alone or represent owner-declared tags as audio evidence. The new mix is a **proposal**; source hashes are real evidence and any musical interpretation requires listening.

## Schema

Request:

```json
{
  "schema": "haunted-phonograph/stem-orchard-request/v1",
  "seed": "orchard-001",
  "title": "The first two trees",
  "durationSeconds": 20,
  "layers": [
    {
      "songId": "mutant-pop-01",
      "stemId": "voice",
      "role": "vocal",
      "objectKey": "stems/mutant-pop-01/voice.wav",
      "sha256": "sha256:REPLACE_WITH_THE_REAL_64_HEX_DIGEST",
      "rightsRef": "creator-attestation-2026-11-17",
      "bpm": 96,
      "tonalCenter": "C major",
      "trimSeconds": 0,
      "offsetSeconds": 0,
      "gainDb": -6
    },
    {
      "songId": "mutant-pop-02",
      "stemId": "keys",
      "role": "keys",
      "objectKey": "stems/mutant-pop-02/keys.wav",
      "sha256": "sha256:REPLACE_WITH_THE_REAL_64_HEX_DIGEST",
      "rightsRef": "creator-attestation-2026-11-17",
      "bpm": 96,
      "tonalCenter": "C major",
      "trimSeconds": 0,
      "offsetSeconds": 0,
      "gainDb": -9
    }
  ]
}
```

All identifiers and music attributes above are **examples**, not verified HUMKIN stem metadata. Replace both hashes with the actual hashes and BPM/key with actual owner declarations before running; a placeholder is intentionally invalid. The two assets must cover the requested 20 seconds. Song IDs must match the existing HUMKIN station catalog for later import.

Optional source-owned collection for reproducible pairing:

```json
{
  "schema": "haunted-phonograph/stem-catalog/v1",
  "stems": [
    {
      "songId": "mutant-pop-01",
      "stemId": "voice",
      "role": "vocal",
      "objectKey": "stems/mutant-pop-01/voice.wav",
      "sha256": "sha256:REPLACE_WITH_REAL_HASH",
      "rightsRef": "creator-attestation-2026-11-17",
      "bpm": 96,
      "tonalCenter": "C major",
      "sourceDurationSeconds": 120
    }
  ]
}
```

The actual catalog needs stems from **at least two different songs**, including vocal and accompaniment layers, with a compatible declared key/BPM. Proposal generation does not itself inspect audio.

## Local setup (Node 22+, FFmpeg + ffprobe)

```sh
# stem files are stored under ./stems/ matching the objectKey paths
shasum -a 256 stems/mutant-pop-01/voice.wav
node scripts/propose-stem-orchard.mjs private-catalog.json orchard-001 10 > private-proposals.json
node scripts/run-stem-orchard.mjs private-request.json . out/orchard-first
```

Results: `out/orchard-first.wav`, `.receipt.json`, `.humkin.json`. The renderer never publishes or mutates a station. The tool will REFUSE if a file is missing, changed, too short, escapes the local input root, or if BPM/key declarations conflict.

**Older computer note:** Node 22 may not install natively on macOS Mojave; the private GitHub Actions → Modal route below allows the radio house computer to remain unchanged.

## Modal + Cloudflare R2 setup, intentionally two storage zones

**Private zone:**
- Create a **private R2 bucket** called `humkin-radio-private`. Leave **Public Development URL and Custom Domain disabled**. Upload original stems under `stems/` and private request JSON under `requests/`. Avoid any private names that include sensitive personal information.
- Under R2 API Tokens, create S3 API credentials restricted to this private bucket (read/write object scope). Save the Account ID, Access Key ID, and Secret Access Key privately. Never commit, paste into chat or publish them.

**Public zone, only when genuinely ready to broadcast:**
- Separately reserve/create `humkin-radio-media`, intended for approved listening copies and eventually `media.abundent.org` if the domain is configured. **Never put stems, requests or HOLD candidates into a bucket with a public/custom domain.** No public-domain changes are part of this PR.

**Modal:**
1. Create or open a Modal account, review billing and configure a workspace budget/usage alert before experiments. No account or billing action was performed by this code.
2. On a suitable machine or hosted shell: install Modal CLI (Python 3.11+) and run `modal setup` to authorize the account.
3. Create a private file outside Git with the four entries below (no quotes needed; guard file permissions): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=humkin-radio-private`.
4. Run `modal secret create humkin-r2-private --from-dotenv /path/outside/git/r2.env`. Do not enter credentials in GitHub public files or Actions inputs.
5. For a direct local request: `modal run modal/stem_orchard.py --request-path /path/to/request.json`.
6. For a **phone-only** launch, upload `requests/orchard-001.json` through the private R2 dashboard. Set `MODAL_TOKEN_ID` and `MODAL_TOKEN_SECRET` in **Haunted Phonograph GitHub repository Actions secrets**, then manually run the *Prepare a PRIVATE HUMKIN stem candidate (Modal + R2)* workflow, passing `requests/orchard-001.json`. The R2 S3 token stays only in Modal's secret.
7. The Modal job downloads the exact private stem objects, validates declared hashes, renders, and uploads only to private `candidates/hp-.../{mix.wav,receipt.json,humkin.json}`. It prints keys and hashes, never a public link. It refuses to overwrite an existing candidate.

**Publishing is separate.** Retrieve `candidates/.../humkin.json` privately and import it at the HUMKIN `/fm/living/phonograph.html` receiving desk after the HUMKIN PR is merged. The consumer only checks manifest structure/source song IDs. A named operator must actually hear the audio, inspect receipt/provenance, explicitly approve a public encoded copy and register it using existing Station Manager facilities. No current catalog or 24/7 broadcast is changed.

## Security, licensing and compute limits

- Creator reports controlling the music rights; `rightsRef` is a retained owner assertion, **not** an independent rights audit or permission for unrelated archives.
- R2 `stems/`, `requests/`, and `candidates/` are **private**. A public R2 custom domain would expose the content; keep the buckets separate.
- SHA-256 enforces byte identity. It does not prove musical origin, consent or aesthetic quality.
- The Modal example uses **CPU/FFmpeg**, not a costly idle GPU. It is an operator-triggered job, not an always-on streaming service.
- Existing Haunted Phonograph source/provenance and other HAUNT functions remain unchanged; this is a new adapter. The rendering receipt distinguishes owner-declared metadata from byte-verified source identities, and proposal from on-air event.
- Future additions: measured BPM/key with uncertainty; transient/phrase grid alignment, time stretch/pitch shifts under declared transform profiles, section-aware grafting, motif genealogy, and producer audition ranking. None is falsely marked as shipped here.
