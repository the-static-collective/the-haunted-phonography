import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

function fail(code, message) {
  const error = new TypeError(message);
  error.code = code;
  throw error;
}

export async function identifySource(path) {
  const bytes = await readFile(path);
  if (bytes.length === 0) fail('INVALID_SOURCE', 'source recording must not be empty');
  return Object.freeze({
    schema: 'haunted-phonograph/source/v1',
    byteLength: bytes.length,
    sha256: `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
  });
}
