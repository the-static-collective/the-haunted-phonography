import { resolve } from 'node:path';
import { runSpecimen } from '../src/run-specimen.mjs';

const [
  sourceArg = 'test/fixtures/specimen-001.wav',
  observationsArg = 'test/fixtures/specimen-001.observations.json',
  outputArg = 'out/specimen-001',
  seed = 'seed-001',
] = process.argv.slice(2);

const result = await runSpecimen({
  sourcePath: resolve(sourceArg),
  observationsPath: resolve(observationsArg),
  outputStem: resolve(outputArg),
  seed,
});

console.log(`MIDI: ${result.midiPath}`);
console.log(`Receipt: ${result.receiptPath}`);
console.log(`Score: ${result.scoreHash}`);
console.log(`ResolvedPerformance: ${result.resolvedPerformanceHash}`);
console.log(`MIDI SHA-256: ${result.receipt.midi.sha256}`);
