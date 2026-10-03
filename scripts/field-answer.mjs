#!/usr/bin/env node
import process from 'node:process';

import { buildFieldAnswer } from '../src/field-answer.mjs';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

try {
  const raw = await readStdin();
  if (!raw.trim()) throw new TypeError('JSON request required');
  const result = buildFieldAnswer(JSON.parse(raw));
  process.stdout.write(JSON.stringify(result));
} catch (error) {
  process.stderr.write(JSON.stringify({
    error: error instanceof Error ? error.message : 'field answer failed',
    code: error?.code || null,
  }) + '\n');
  process.exitCode = 1;
}
