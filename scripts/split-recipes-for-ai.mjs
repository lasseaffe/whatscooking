/**
 * Split recipes-export.txt into small chunks for AI processing.
 *
 * Produces two output sets:
 *   chunks/descriptions/chunk-001.txt  — title + description + cuisine + ingredients (for description generation)
 *   chunks/instructions/chunk-001.txt  — title + instructions (for instruction enhancement)
 *
 * Usage:
 *   node scripts/split-recipes-for-ai.mjs                   # default 300 recipes/chunk
 *   node scripts/split-recipes-for-ai.mjs --chunk-size=500
 *   node scripts/split-recipes-for-ai.mjs --mode=descriptions
 *   node scripts/split-recipes-for-ai.mjs --mode=instructions
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');

const CHUNK_SIZE_ARG = process.argv.find(a => a.startsWith('--chunk-size='));
const CHUNK_SIZE = CHUNK_SIZE_ARG ? parseInt(CHUNK_SIZE_ARG.split('=')[1]) : 300;
const MODE_ARG = process.argv.find(a => a.startsWith('--mode='));
const MODE = MODE_ARG ? MODE_ARG.split('=')[1] : 'both'; // 'both' | 'descriptions' | 'instructions'

const INPUT = join(__dir, 'recipes-export.txt');
const raw = readFileSync(INPUT, 'utf8');

// ── Parse into recipe objects ─────────────────────────────────────────────────
const recipes = [];
let current = {};
let currentKey = null;
let buffer = [];

function flush() {
  if (currentKey && buffer.length) {
    current[currentKey] = buffer.join('\n').trim();
  }
  buffer = [];
}

for (const line of raw.split('\n')) {
  if (line.startsWith('---')) {
    flush();
    if (current.title) recipes.push({ ...current });
    current = {};
    currentKey = null;
    continue;
  }

  const titleMatch = line.match(/^TITLE:\s*(.+)/);
  const descMatch  = line.match(/^DESCRIPTION:\s*(.*)/);
  const ingMatch   = line.match(/^INGREDIENTS:/);
  const instMatch  = line.match(/^INSTRUCTIONS:/);
  const cuisMatch  = line.match(/^CUISINE:\s*(.*)/);
  const occMatch   = line.match(/^OCCASION:\s*(.*)/);
  const methMatch  = line.match(/^METHOD:\s*(.*)/);

  if (titleMatch)  { flush(); currentKey = 'title';        buffer = [titleMatch[1].trim()]; continue; }
  if (descMatch)   { flush(); currentKey = 'description';  buffer = [descMatch[1].trim()];  continue; }
  if (ingMatch)    { flush(); currentKey = 'ingredients';  buffer = [];                     continue; }
  if (instMatch)   { flush(); currentKey = 'instructions'; buffer = [];                     continue; }
  if (cuisMatch)   { flush(); currentKey = 'cuisine';      buffer = [cuisMatch[1].trim()];  continue; }
  if (occMatch)    { flush(); currentKey = 'occasion';     buffer = [occMatch[1].trim()];   continue; }
  if (methMatch)   { flush(); currentKey = 'method';       buffer = [methMatch[1].trim()];  continue; }

  if (currentKey) buffer.push(line);
}
flush();
if (current.title) recipes.push(current);

console.log(`Parsed ${recipes.length} recipes from ${INPUT}`);

// ── Chunk + write ─────────────────────────────────────────────────────────────
function writeChunks(mode, formatter) {
  const dir = join(ROOT, 'scripts', 'chunks', mode);
  mkdirSync(dir, { recursive: true });

  let chunkNum = 1;
  for (let i = 0; i < recipes.length; i += CHUNK_SIZE) {
    const slice = recipes.slice(i, i + CHUNK_SIZE);
    const content = slice.map(formatter).join('\n---\n');
    const filename = `chunk-${String(chunkNum).padStart(3, '0')}.txt`;
    writeFileSync(join(dir, filename), content, 'utf8');
    chunkNum++;
  }
  const total = chunkNum - 1;
  console.log(`  ${mode}: ${total} chunks of ≤${CHUNK_SIZE} recipes → scripts/chunks/${mode}/`);
  return total;
}

// Description chunks: title + current description + cuisine + top ingredients (for context)
function descFormatter(r) {
  const ing = (r.ingredients || '')
    .split('\n')
    .map(l => l.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 6) // first 6 ingredients as context
    .join(', ');

  return [
    `TITLE: ${r.title}`,
    `CURRENT_DESCRIPTION: ${r.description || 'missing'}`,
    `CUISINE: ${r.cuisine || 'unknown'}`,
    `OCCASION: ${r.occasion || 'unknown'}`,
    `METHOD: ${r.method || 'unknown'}`,
    `KEY_INGREDIENTS: ${ing || 'unknown'}`,
  ].join('\n');
}

// Instruction chunks: title + raw instructions only
function instFormatter(r) {
  return [
    `TITLE: ${r.title}`,
    `INSTRUCTIONS:\n${r.instructions || '(none)'}`,
  ].join('\n');
}

if (MODE === 'both' || MODE === 'descriptions')  writeChunks('descriptions',  descFormatter);
if (MODE === 'both' || MODE === 'instructions') writeChunks('instructions', instFormatter);

console.log('\nDone. Feed each chunk file to a separate Claude Code session.');
