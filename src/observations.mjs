import {
  UNKNOWN,
  createEvidence,
  createUncertainty,
  hashCanonical,
} from './provenance.mjs';

function fail(code, message) {
  const error = new TypeError(message);
  error.code = code;
  throw error;
}

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

function validateDeclaration(declaration) {
  if (declaration?.schema !== 'haunted-phonograph/observation-declaration/v1') {
    fail('INVALID_OBSERVATION_DECLARATION', 'unsupported observation declaration schema');
  }
  if (!Number.isFinite(declaration.tempoBpm) || declaration.tempoBpm <= 0) {
    fail('INVALID_OBSERVATION_DECLARATION', 'tempoBpm must be a positive finite number');
  }
  if (!Array.isArray(declaration.motifPitches) || declaration.motifPitches.length === 0
    || declaration.motifPitches.some(note => !Number.isInteger(note) || note < 0 || note > 127)) {
    fail('INVALID_OBSERVATION_DECLARATION', 'motifPitches must be non-empty MIDI note integers in 0..127');
  }
  if (!Array.isArray(declaration.motifDurationsQuarter)
    || declaration.motifDurationsQuarter.length !== declaration.motifPitches.length
    || declaration.motifDurationsQuarter.some(duration => !Number.isFinite(duration) || duration <= 0)) {
    fail('INVALID_OBSERVATION_DECLARATION', 'motifDurationsQuarter must align with pitches and stay positive');
  }
  if (declaration.harmonyQuality?.state !== 'unknown'
    || !declaration.harmonyQuality.uncertainty
    || typeof declaration.harmonyQuality.uncertainty !== 'object'
    || Array.isArray(declaration.harmonyQuality.uncertainty)) {
    fail('INVALID_OBSERVATION_DECLARATION', 'harmonyQuality must remain explicit unknown with uncertainty metadata');
  }
}

export function admitObservations({ source, declaration }) {
  validateDeclaration(declaration);
  if (source?.sha256 !== declaration.sourceHash) {
    fail('SOURCE_IDENTITY_MISMATCH', 'observation declaration does not match source identity');
  }

  const method = declaration.method;
  const sourceRefs = [source.sha256];
  const claims = {
    tempo: createEvidence({ subject: 'tempo-bpm', value: declaration.tempoBpm, sourceRefs, method }),
    motifPitches: createEvidence({ subject: 'motif-pitches-midi', value: declaration.motifPitches, sourceRefs, method }),
    motifDurations: createEvidence({ subject: 'motif-durations-quarter', value: declaration.motifDurationsQuarter, sourceRefs, method }),
    harmonyQuality: createUncertainty({
      subject: 'harmony-quality',
      value: UNKNOWN,
      sourceRefs,
      method,
      uncertainty: declaration.harmonyQuality.uncertainty,
    }),
  };
  const hashes = Object.fromEntries(Object.entries(claims).map(([key, claim]) => [key, hashCanonical(claim)]));
  return freeze({ claims, hashes });
}
