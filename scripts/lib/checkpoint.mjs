// scripts/lib/checkpoint.mjs
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const CHUNKS_DIR = join(__dir, '../chunks');

function ensureDir() { mkdirSync(CHUNKS_DIR, { recursive: true }); }

export function checkpointPath(mode) {
  return join(CHUNKS_DIR, `.checkpoint-${mode}.json`);
}

export function failedPath(mode) {
  return join(CHUNKS_DIR, `${mode}-failed.txt`);
}

export function loadCheckpoint(mode) {
  const p = checkpointPath(mode);
  if (!existsSync(p)) return new Set();
  try {
    const ids = JSON.parse(readFileSync(p, 'utf8'));
    return new Set(ids);
  } catch { return new Set(); }
}

export function saveCheckpoint(mode, doneIds) {
  ensureDir();
  writeFileSync(checkpointPath(mode), JSON.stringify([...doneIds]), 'utf8');
}

export function logFailed(mode, id, title, reason) {
  ensureDir();
  appendFileSync(failedPath(mode), `${id}\t${title}\t${reason}\n`, 'utf8');
}

export function clearCheckpoint(mode) {
  ensureDir();
  writeFileSync(checkpointPath(mode), '[]', 'utf8');
}
