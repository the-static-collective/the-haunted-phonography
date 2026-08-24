export const APPROVED_CONSTITUTION_INPUT = Object.freeze({
  owner_repository: 'the-static-collective/the-haunted-phonography',
  owner_head_sha: 'b318f3ab7e0192653864e632c1ae5689986503e6',
  ordered_constitutive_paths: Object.freeze([
    'docs/superpowers/specs/2026-08-24-storyship-001-the-door-design.md',
    'docs/superpowers/specs/2026-08-24-storyship-attributable-becoming-amendment.md',
    'docs/superpowers/specs/2026-08-24-storyship-relationship-passenger-law.md',
    'docs/superpowers/specs/2026-08-24-storyship-continuity-spine-v0-design.md',
  ]),
  blob_sha_for_each_path: Object.freeze({
    'docs/superpowers/specs/2026-08-24-storyship-001-the-door-design.md': '6cae9db5b179dfe6162f5be56c71dc9328a892cb',
    'docs/superpowers/specs/2026-08-24-storyship-attributable-becoming-amendment.md': 'a1baa1ea1e61cb6ddc552708f7e5f54deb7127c5',
    'docs/superpowers/specs/2026-08-24-storyship-relationship-passenger-law.md': '3c1fb229ae8e5f6dcf941b4ad1235533e5718fae',
    'docs/superpowers/specs/2026-08-24-storyship-continuity-spine-v0-design.md': '4ad3d13c39e47a0428f8f7a111f85a2969ac56ed',
  }),
});

export const APPROVED_SOURCE_CUT_INPUT = Object.freeze({
  owning_world: 'autodiscography-vault',
  stable_locator: 'fixture://vault/storyship/reference-000',
  revision_or_provider_identity: 'vault-revision-000',
  content_digest_when_available: `sha256:${'a'.repeat(64)}`,
  acquisition_time: '2026-08-24T12:00:00.000Z',
  availability_status: 'available',
  evidence_class: 'raw-owner-evidence',
});
