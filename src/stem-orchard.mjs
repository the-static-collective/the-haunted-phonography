/* STEM ORCHARD 001: deterministic decisions over owner-supplied stems.
 * This is a proposal renderer, NOT an automatic musical-understanding model.
 * No secrets, publication, R2, or Modal assumptions in this source-owned core.
 */
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, realpath, rename, rm, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { canonicalStringify, hashCanonical } from './provenance.mjs';

export const REQUEST_SCHEMA = 'haunted-phonograph/stem-orchard-request/v1';
export const HANDOFF_SCHEMA = 'humkin.phonograph-candidate/v1';
const ROLES = new Set(['vocal', 'backing_vocal', 'drums', 'bass', 'guitar', 'keys', 'synth', 'strings', 'instrumental', 'other']);

function check(condition, message) {
  if (!condition) throw new Error(message);
}
function text(value, label, max = 180) {
  check(typeof value === 'string' && value.trim().length > 0 && value.length <= max, label + ' must be non-empty text');
  return value.trim();
}
function num(value, label, low, high) {
  check(typeof value === 'number' && Number.isFinite(value) && value >= low && value <= high, label + ' out of bounds');
  return value;
}
function objectKey(key) {
  text(key, 'objectKey', 500);
  check(key.startsWith('stems/') && !key.includes('\\') && !key.includes('%') && !key.includes('//')
    && key.split('/').every(p => p !== '.' && p !== '..' && p.length > 0)
    && /^[a-zA-Z0-9_./ -]+$/.test(key), 'objectKey must be a safe relative stems/ path');
  check(['.wav', '.flac', '.mp3', '.m4a'].includes(extname(key).toLowerCase()), 'Unsupported stem extension');
  return key;
}
function hexHash(value) {
  check(/^sha256:[a-f0-9]{64}$/.test(value || ''), 'Expected a sha256: digest for every stem');
  return value;
}
export function planStemOrchard(request) {
  check(request && !Array.isArray(request) && request.schema === REQUEST_SCHEMA, 'Unknown stem orchard request schema');
  const seed = text(request.seed, 'seed');
  const title = text(request.title, 'title');
  const durationSeconds = num(request.durationSeconds, 'durationSeconds', 2, 180);
  check(Array.isArray(request.layers) && request.layers.length >= 2 && request.layers.length <= 8, 'Supply 2–8 stem layers');
  const seen = new Set();
  const layers = request.layers.map((item, index) => {
    check(item && typeof item === 'object' && !Array.isArray(item), 'Invalid stem layer');
    const songId = text(item.songId, 'songId', 120);
    const stemId = text(item.stemId, 'stemId', 120);
    const role = text(item.role, 'role');
    check(ROLES.has(role), 'Unknown stem role: ' + role);
    const objectKeyValue = objectKey(item.objectKey);
    const identity = songId + '/' + stemId;
    check(!seen.has(identity), 'Duplicate source stem identity');
    seen.add(identity);
    const offsetSeconds = num(item.offsetSeconds, 'offsetSeconds', 0, durationSeconds - 0.01);
    const trimSeconds = num(item.trimSeconds, 'trimSeconds', 0, 3600);
    return {
      index, songId, stemId, role, objectKey: objectKeyValue, sha256: hexHash(item.sha256),
      rightsRef: text(item.rightsRef, 'rightsRef', 240),
      bpm: num(item.bpm, 'bpm', 30, 250),
      tonalCenter: text(item.tonalCenter, 'tonalCenter', 40),
      offsetSeconds, trimSeconds,
      gainDb: num(item.gainDb, 'gainDb', -36, 0),
    };
  });
  check(new Set(layers.map(l => l.songId)).size >= 2, 'Cross-song candidate requires stems from two different songs');
  const bpm = layers[0].bpm, tonalCenter = layers[0].tonalCenter.toLowerCase();
  check(layers.every(l => l.bpm === bpm && l.tonalCenter.toLowerCase() === tonalCenter),
    'HOLD: declarations disagree on BPM/key; no automatic time-stretch or pitch-shift is assumed');
  const plan = {
    schema: 'haunted-phonograph/stem-orchard-plan/v1', seed, title, durationSeconds,
    technicalPolicy: 'verified-by-hash/owner-declared-alignment/no-transposition/v1',
    authority: 'proposal', metadataAuthority: 'owner-declared-not-machine-verified',
    layers,
  };
  return { ...plan, planId: hashCanonical(plan) };
}
async function sha256File(filePath) {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) digest.update(chunk);
  return 'sha256:' + digest.digest('hex');
}
function execute(bin, args) {
  return new Promise((done, fail) => {
    const proc = spawn(bin, args, { shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    proc.stdout.on('data', b => { stdout += b.toString(); if (stdout.length > 40000) proc.kill(); });
    proc.stderr.on('data', b => { stderr += b.toString(); if (stderr.length > 40000) proc.kill(); });
    proc.on('error', fail);
    proc.on('close', code => code === 0 ? done(stdout.trim()) : fail(new Error(bin + ' exited ' + code + ': ' + stderr.slice(-2000))));
  });
}
async function safeStem(root, key) {
  const realRoot = await realpath(root);
  const candidate = await realpath(join(realRoot, key));
  const rel = relative(realRoot, candidate);
  check(rel.length > 0 && rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel), 'Stem escapes input root');
  const metadata = await stat(candidate);
  check(metadata.isFile() && metadata.size > 0 && metadata.size <= 500 * 1024 * 1024, 'Stem missing, empty or too large');
  return candidate;
}
export async function renderStemOrchard({ request, inputRoot, outputStem }) {
  const plan = planStemOrchard(request);
  check(typeof inputRoot === 'string' && inputRoot.trim(), 'inputRoot required');
  check(typeof outputStem === 'string' && outputStem.trim(), 'outputStem required');
  const files = [];
  for (const layer of plan.layers) {
    const path = await safeStem(inputRoot, layer.objectKey);
    const digest = await sha256File(path);
    check(digest === layer.sha256, 'Source bytes changed: ' + layer.songId + '/' + layer.stemId);
    const probe = JSON.parse(await execute('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', path,
    ]));
    const actual = Number(probe?.format?.duration);
    check(Number.isFinite(actual) && actual + 0.015 >= layer.trimSeconds + plan.durationSeconds - layer.offsetSeconds,
      'Stem too short for proposed placement: ' + layer.stemId);
    files.push(path);
  }
  const output = resolve(outputStem + '.wav');
  const temp = output + '.partial.wav';
  const receiptPath = resolve(outputStem + '.receipt.json');
  const handoffPath = resolve(outputStem + '.humkin.json');
  await mkdir(dirname(output), { recursive: true });
  // Explicit layout decisions are made here before invoking FFmpeg; renderers do not choose layers.
  const filters = plan.layers.map((layer, i) => {
    const visible = plan.durationSeconds - layer.offsetSeconds;
    const delay = Math.round(layer.offsetSeconds * 1000);
    return '[' + i + ':a]atrim=start=' + layer.trimSeconds + ':duration=' + visible +
      ',asetpts=PTS-STARTPTS,aresample=44100,volume=' + layer.gainDb + 'dB' +
      (delay ? ',adelay=' + delay + ':all=1' : '') +
      ',apad,atrim=duration=' + plan.durationSeconds + '[a' + i + ']';
  });
  const labels = plan.layers.map((_, i) => '[a' + i + ']').join('');
  const fadeStart = Math.max(0, plan.durationSeconds - 0.25);
  filters.push(labels + 'amix=inputs=' + files.length +
    ':duration=longest:dropout_transition=0:normalize=0,alimiter=limit=0.9' +
    ',afade=t=out:st=' + fadeStart + ':d=0.25[mix]');
  const filterGraph = filters.join(';');
  const ffmpegArgs = ['-nostdin', '-hide_banner', '-loglevel', 'error', '-y'];
  for (const f of files) ffmpegArgs.push('-i', f);
  ffmpegArgs.push('-filter_complex', filterGraph, '-map', '[mix]', '-map_metadata', '-1',
    '-ar', '44100', '-ac', '2', '-c:a', 'pcm_s16le', '-f', 'wav', temp);
  const version = (await execute('ffmpeg', ['-version'])).split('\n')[0];
  try {
    await rm(temp, { force: true });
    await execute('ffmpeg', ffmpegArgs);
    const outputHash = await sha256File(temp);
    const info = await stat(temp);
    check(info.size > 44, 'Rendered audio is empty');
    const receipt = {
      schema: 'haunted-phonograph/stem-orchard-receipt/v1',
      sourcePlanId: plan.planId, authority: 'proposal', sourceFacts: plan.layers.map(layer => ({
        songId: layer.songId, stemId: layer.stemId, role: layer.role, objectKey: layer.objectKey,
        sha256: layer.sha256, rightsRef: layer.rightsRef,
      })),
      ownerDeclaredAlignment: { bpm: plan.layers[0].bpm, tonalCenter: plan.layers[0].tonalCenter },
      render: { exporter: 'ffmpeg/pcm_s16le/44100/stereo/v1', ffmpegVersion: version,
        filterGraph, sha256: outputHash, bytes: info.size },
      editorialStatus: 'HOLD', aired: false,
    };
    const handoff = {
      schema: HANDOFF_SCHEMA, candidateId: 'hp-' + plan.planId.slice(7, 23),
      title: plan.title, artist: 'HUMKIN', sourceSongIds: [...new Set(plan.layers.map(l => l.songId))],
      sourcePlanId: plan.planId, receiptSha256: hashCanonical(receipt), outputSha256: outputHash,
      rightsRefs: [...new Set(plan.layers.map(l => l.rightsRef))],
      privateR2Key: null, publicUrl: null, editorialStatus: 'HOLD', broadcastingAuthorized: false,
    };
    // No receipt or station handoff is written until real bytes have been rendered and hashed.
    await writeFile(receiptPath + '.partial', canonicalStringify(receipt) + '\n', { flag: 'w' });
    await writeFile(handoffPath + '.partial', canonicalStringify(handoff) + '\n', { flag: 'w' });
    await rename(temp, output);
    await rename(receiptPath + '.partial', receiptPath);
    await rename(handoffPath + '.partial', handoffPath);
    return { output, receiptPath, handoffPath, receipt, handoff };
  } finally {
    for (const p of [temp, receiptPath + '.partial', handoffPath + '.partial']) await rm(p, { force: true }).catch(() => {});
  }
}
