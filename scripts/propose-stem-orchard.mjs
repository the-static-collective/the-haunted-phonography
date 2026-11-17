#!/usr/bin/env node
// node scripts/propose-stem-orchard.mjs CATALOG.json SEED [COUNT]
import { readFile } from 'node:fs/promises';
import { proposeStemOrchard } from '../src/stem-orchard-proposals.mjs';

if (process.argv.length < 4 || process.argv.length > 5) {
  console.error('Usage: node scripts/propose-stem-orchard.mjs stem-catalog.json seed [count]');
  process.exitCode = 2;
} else {
  const count = process.argv[4] === undefined ? 10 : Number(process.argv[4]);
  try {
    const collection = JSON.parse(await readFile(process.argv[2], 'utf8'));
    const proposed = proposeStemOrchard(collection, { seed: process.argv[3], count });
    process.stdout.write(JSON.stringify(proposed, null, 2) + '\n');
  } catch (error) {
    console.error('HOLD: ' + error.message);
    process.exitCode = 1;
  }
}
