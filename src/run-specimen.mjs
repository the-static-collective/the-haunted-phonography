import { dirname } from 'node:path';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { canonicalStringify } from './provenance.mjs';
import { identifySource } from './source.mjs';
import { admitObservations } from './observations.mjs';
import { buildScore } from './score.mjs';
import { validateHauntCapsule } from './haunt-capsule.mjs';
import { buildHauntInfluencePlan } from './haunt-influence.mjs';
import { mutateScore } from './mutation.mjs';
import { resolvePerformance } from './performance.mjs';
import { encodeMidi } from './midi.mjs';
import { buildReceipt } from './receipt.mjs';

export async function runSpecimen({ sourcePath, observationsPath, outputStem, seed, capsulesPath = null }) {
  const midiPath = `${outputStem}.mid`;
  const receiptPath = `${outputStem}.receipt.json`;
  const midiTempPath = `${midiPath}.tmp-${process.pid}`;
  const receiptTempPath = `${receiptPath}.tmp-${process.pid}`;

  await mkdir(dirname(outputStem), { recursive: true });
  await rm(midiTempPath, { force: true });
  await rm(receiptTempPath, { force: true });
  await rm(receiptPath, { force: true });

  try {
    const source = await identifySource(sourcePath);
    const declaration = JSON.parse(await readFile(observationsPath, 'utf8'));
    const observations = admitObservations({ source, declaration });
    const score = buildScore({ source, observations });

    let hauntInfluencePlan = null;
    if (capsulesPath) {
      const rawCapsules = JSON.parse(await readFile(capsulesPath, 'utf8'));
      const capsules = Array.isArray(rawCapsules) ? rawCapsules : [rawCapsules];
      for (const capsule of capsules) validateHauntCapsule(capsule);
      hauntInfluencePlan = buildHauntInfluencePlan({ score, seed, capsules });
    }

    const mutationResult = hauntInfluencePlan
      ? mutateScore({ score, seed, hauntInfluencePlan })
      : mutateScore({ score, seed });
    const performance = resolvePerformance({ score, observations, mutationResult });
    const midiBytes = encodeMidi(performance);

    await writeFile(midiTempPath, midiBytes, { flag: 'wx' });
    await rename(midiTempPath, midiPath);
    const finalMidiBytes = await readFile(midiPath);

    const receipt = buildReceipt({
      source,
      observations,
      score,
      mutationResult,
      performance,
      midiBytes: finalMidiBytes,
    });
    await writeFile(receiptTempPath, `${canonicalStringify(receipt)}\n`, { encoding: 'utf8', flag: 'wx' });
    await rename(receiptTempPath, receiptPath);

    return {
      midiPath,
      receiptPath,
      receipt,
      scoreHash: receipt.scoreHash,
      resolvedPerformanceHash: receipt.resolvedPerformanceHash,
    };
  } finally {
    await rm(midiTempPath, { force: true }).catch(() => {});
    await rm(receiptTempPath, { force: true }).catch(() => {});
  }
}
