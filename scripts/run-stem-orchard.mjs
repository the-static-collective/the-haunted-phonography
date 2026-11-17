#!/usr/bin/env node
// Local prototype: node scripts/run-stem-orchard.mjs REQUEST.json STEM_ROOT OUTPUT_STEM
import { readFile } from 'node:fs/promises';
import { renderStemOrchard } from '../src/stem-orchard.mjs';

if (process.argv.length !== 5) {
  console.error('Usage: node scripts/run-stem-orchard.mjs request.json local-stem-root out/candidate');
  process.exitCode = 2;
} else {
  const [, , requestPath, inputRoot, outputStem] = process.argv;
  try {
    const request = JSON.parse(await readFile(requestPath, 'utf8'));
    const result = await renderStemOrchard({ request, inputRoot, outputStem });
    console.log(JSON.stringify({
      status: 'PRIVATE_HOLD_NOT_AIRED', audio: result.output,
      receipt: result.receiptPath, humkinHandoff: result.handoffPath,
      outputSha256: result.handoff.outputSha256,
    }, null, 2));
  } catch (error) {
    console.error('HOLD:', error.message);
    process.exitCode = 1;
  }
}
