#!/usr/bin/env node
/**
 * Migration drift check — two gates, both read-only, using SUPABASE_URL +
 * SUPABASE_SERVICE_KEY (no DB password, no extra secrets):
 *
 *  1. LEDGER gate — every committed migration's filename version is recorded in
 *     supabase_migrations.schema_migrations. Catches "committed but never applied".
 *
 *  2. OBJECT gate (phantom-proof) — every table / column / type / function /
 *     enum-value a migration *creates* actually exists in the DB. Catches a
 *     "phantom" ledger row whose DDL never ran (independent of the ledger).
 *
 * The object gate parses common DDL (create table, alter table add column,
 * create type, alter type add value, create function). Statements it can't parse
 * (policies, indexes, triggers, data) are simply not asserted — it never produces
 * false negatives, only verifies what it understands.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Legacy migrations applied out-of-band before the ledger was reconciled (their
// filename version differs from the recorded one). Only used by the LEDGER gate.
const LEDGER_ALLOW = new Set([]);

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('drift-check: set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'migrations');
const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

// ── Parse each migration for the objects it creates ─────────────────────────
const stripComments = (sql) => sql.replace(/--[^\n]*/g, '');
const norm = (s) => s.replace(/"/g, '').replace(/^public\./i, '').toLowerCase();

const expect = { tables: new Map(), columns: new Map(), types: new Map(), functions: new Map(), enumValues: new Map() };
const add = (map, name, file) => { if (!map.has(name)) map.set(name, file); };

for (const file of files) {
  const sql = stripComments(readFileSync(join(migrationsDir, file), 'utf8'));
  for (const stmt of sql.split(';')) {
    const s = stmt.trim();
    if (!s) continue;
    const low = s.toLowerCase();

    let m;
    if ((m = low.match(/^create\s+table\s+(?:if\s+not\s+exists\s+)?([\w".]+)/))) {
      add(expect.tables, norm(m[1]), file);
    }
    if ((m = low.match(/^create\s+type\s+([\w".]+)/))) {
      add(expect.types, norm(m[1]), file);
    }
    if ((m = low.match(/^create\s+(?:or\s+replace\s+)?function\s+([\w".]+)/))) {
      add(expect.functions, norm(m[1]).replace(/\(.*$/, ''), file);
    }
    // alter table <t> add column [if not exists] <c> (possibly several per stmt)
    if (/^alter\s+table\s/.test(low) && /add\s+column/.test(low)) {
      const t = norm(low.match(/^alter\s+table\s+(?:only\s+)?([\w".]+)/)[1]);
      for (const c of low.matchAll(/add\s+column\s+(?:if\s+not\s+exists\s+)?([\w"]+)/g)) {
        add(expect.columns, `${t}.${norm(c[1])}`, file);
      }
    }
    // alter type <t> add value '<v>'
    if ((m = low.match(/^alter\s+type\s+([\w".]+)\s+add\s+value\s+(?:if\s+not\s+exists\s+)?'([^']+)'/))) {
      add(expect.enumValues, `${norm(m[1])}.${m[2].toLowerCase()}`, file);
    }
  }
}

// ── Fetch DB state ──────────────────────────────────────────────────────────
const supabase = createClient(url, key, { auth: { persistSession: false } });

const [{ data: applied, error: e1 }, { data: inv, error: e2 }] = await Promise.all([
  supabase.rpc('applied_migration_versions'),
  supabase.rpc('schema_inventory'),
]);
if (e1) { console.error('drift-check: applied_migration_versions() failed:', e1.message); process.exit(1); }
if (e2) { console.error('drift-check: schema_inventory() failed:', e2.message); process.exit(1); }

const appliedSet = new Set(applied ?? []);
const have = {
  tables: new Set(inv.tables), columns: new Set(inv.columns), types: new Set(inv.types),
  functions: new Set(inv.functions), enumValues: new Set(inv.enum_values),
};

// ── Gate 1: ledger ──────────────────────────────────────────────────────────
const localVersions = [...new Set(files.map((f) => f.match(/^(\d+)/)?.[1]).filter(Boolean))];
const ledgerMissing = localVersions.filter((v) => !appliedSet.has(v) && !LEDGER_ALLOW.has(v));

// ── Gate 2: objects ─────────────────────────────────────────────────────────
const objMissing = [];
const checkMap = (map, haveSet, kind) => {
  for (const [name, file] of map) if (!haveSet.has(name)) objMissing.push({ kind, name, file });
};
checkMap(expect.tables, have.tables, 'table');
checkMap(expect.columns, have.columns, 'column');
checkMap(expect.types, have.types, 'type');
checkMap(expect.functions, have.functions, 'function');
checkMap(expect.enumValues, have.enumValues, 'enum value');

// ── Report ──────────────────────────────────────────────────────────────────
let failed = false;
if (ledgerMissing.length) {
  failed = true;
  console.error('\n❌ Ledger drift — committed migration version not recorded as applied:');
  for (const v of ledgerMissing.sort()) console.error(`   • version ${v}`);
}
if (objMissing.length) {
  failed = true;
  console.error('\n❌ Object drift — a migration creates these, but they do NOT exist in the DB:');
  for (const o of objMissing) console.error(`   • ${o.kind} "${o.name}"  (${o.file})`);
}
if (failed) {
  console.error('\nApply the migration(s) before merging (Supabase SQL editor / `supabase db push`).\n');
  process.exit(1);
}

const objCount = expect.tables.size + expect.columns.size + expect.types.size + expect.functions.size + expect.enumValues.size;
console.log(`✅ No drift — ${localVersions.length} migration versions applied, ${objCount} schema objects verified present.`);
