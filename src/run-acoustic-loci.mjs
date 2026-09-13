import { dirname } from 'node:path';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { canonicalStringify, hashCanonical } from './provenance.mjs';
import { admitAcousticLocusDeclaration } from './acoustic-locus.mjs';
import { admitReentryObservation } from './reentry-observation.mjs';
import { evaluateAcousticReentry } from './acoustic-reentry.mjs';

const RECEIPT_SCHEMA = 'haunted-phonograph/acoustic-loci-receipt/v1';

export async function runAcousticLoci({ locusPath, observationPaths, outputPath }) {
  if (!Array.isArray(observationPaths) || observationPaths.length !== 4) {
    const error = new TypeError('Acoustic Loci 001 requires exactly four observation paths');
    error.code = 'INVALID_ACOUSTIC_LOCI_RUN';
    throw error;
  }

  const tempPath = `${outputPath}.tmp-${process.pid}`;
  await mkdir(dirname(outputPath), { recursive: true });
  await rm(tempPath, { force: true });
  await rm(outputPath, { force: true });

  try {
    const locusDeclaration = JSON.parse(await readFile(locusPath, 'utf8'));
    const locus = admitAcousticLocusDeclaration(locusDeclaration);

    const observations = [];
    for (const observationPath of observationPaths) {
      const declaration = JSON.parse(await readFile(observationPath, 'utf8'));
      observations.push(admitReentryObservation({ locus, declaration }));
    }

    const evaluation = evaluateAcousticReentry({ locus, observations });
    const canonicalReceipt = {
      schema: RECEIPT_SCHEMA,
      locusHash: locus.declarationHash,
      conditionHashes: evaluation.conditionHashes,
      verdict: evaluation.verdict,
      reasons: evaluation.reasons,
      resultHash: evaluation.resultHash,
    };
    const receipt = Object.freeze({
      ...canonicalReceipt,
      receiptHash: hashCanonical(canonicalReceipt),
    });

    await writeFile(tempPath, `${canonicalStringify(receipt)}\n`, { encoding: 'utf8', flag: 'wx' });
    await rename(tempPath, outputPath);

    return { outputPath, receipt };
  } finally {
    await rm(tempPath, { force: true }).catch(() => {});
  }
}
