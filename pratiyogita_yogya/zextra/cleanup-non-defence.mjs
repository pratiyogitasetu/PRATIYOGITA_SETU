/**
 * Cleanup script: Remove all non-Defence exam data from:
 *   1. Local EXAMSDATA folders (keep DEFENCE_EXAMS, exam_catalog.json, exam_data folder)
 *   2. MongoDB collections (drop all non-Defence exam collections)
 *   3. Non-Defence files inside exam_data folder
 *   4. checker folder
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Load .env ────────────────────────────────────────────────────────
const loadEnvFile = (filename) => {
  const envPath = path.resolve(__dirname, filename);
  if (!fs.existsSync(envPath)) return;
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
};

loadEnvFile('.env');
loadEnvFile('.env.local');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'pratiyogita_yogya';
const EXAMSDATA_DIR = path.resolve(__dirname, 'EXAMSDATA');
const DOH_ENDPOINT = 'https://cloudflare-dns.com/dns-query';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set');
  process.exit(1);
}

// ── DNS-over-HTTPS helpers ───────────────────────────────────────────
const stripTrailingDot = (value) => value.replace(/\.$/, '');

async function resolveDnsJson(name, type) {
  const url = new URL(DOH_ENDPOINT);
  url.searchParams.set('name', name);
  url.searchParams.set('type', type);
  const response = await fetch(url, { headers: { Accept: 'application/dns-json' } });
  if (!response.ok) throw new Error(`DoH request failed: ${response.status}`);
  const payload = await response.json();
  return Array.isArray(payload.Answer) ? payload.Answer : [];
}

async function expandMongoSrvUri(uri) {
  const parsedUrl = new URL(uri);
  const srvName = `_mongodb._tcp.${parsedUrl.hostname}`;
  const srvRecords = await resolveDnsJson(srvName, 'SRV');
  if (!srvRecords.length) throw new Error(`No SRV records for ${parsedUrl.hostname}`);

  const hosts = srvRecords
    .map((record) => {
      const parts = String(record.data || '').trim().split(/\s+/);
      if (parts.length < 4) return null;
      return `${stripTrailingDot(parts[3])}:${parts[2]}`;
    })
    .filter(Boolean);
  if (!hosts.length) throw new Error(`Unable to expand SRV records`);

  const params = new URLSearchParams(parsedUrl.search);
  if (!params.has('tls')) params.set('tls', 'true');

  const txtRecords = await resolveDnsJson(parsedUrl.hostname, 'TXT').catch(() => []);
  for (const record of txtRecords) {
    const rawText = String(record.data || '').trim().replace(/^"|"$/g, '');
    if (!rawText) continue;
    const recordParams = new URLSearchParams(rawText);
    for (const [key, value] of recordParams.entries()) {
      if (!params.has(key)) params.set(key, value);
    }
  }

  const pathname = parsedUrl.pathname && parsedUrl.pathname !== '/' ? parsedUrl.pathname : '/';
  const username = parsedUrl.username ? encodeURIComponent(parsedUrl.username) : '';
  const password = parsedUrl.password ? `:${encodeURIComponent(parsedUrl.password)}` : '';
  const auth = username ? `${username}${password}@` : '';

  return `mongodb://${auth}${hosts.join(',')}${pathname}?${params.toString()}`;
}

// ── Folders/collections to KEEP ──────────────────────────────────────
const KEEP_ITEMS = new Set([
  'DEFENCE_EXAMS',    // Keep this exam folder & collection
  'exam_catalog',     // Keep the catalog collection
  'exam_data',        // Keep the folder (but clean non-defence files inside)
]);

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log('🧹 CLEANUP: Removing all non-Defence exam data\n');

  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: Delete local exam folders (except DEFENCE_EXAMS, exam_data, exam_catalog.json)
  // ═══════════════════════════════════════════════════════════════════
  console.log('━'.repeat(60));
  console.log('STEP 1: Cleaning local EXAMSDATA folders');
  console.log('━'.repeat(60));

  const entries = fs.readdirSync(EXAMSDATA_DIR, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(EXAMSDATA_DIR, entry.name);

    // Keep exam_catalog.json
    if (entry.name === 'exam_catalog.json') {
      console.log(`  ✅ KEEP: ${entry.name}`);
      continue;
    }

    // Keep DEFENCE_EXAMS folder
    if (entry.name === 'DEFENCE_EXAMS') {
      console.log(`  ✅ KEEP: ${entry.name}/`);
      continue;
    }

    // Keep exam_data folder (but will clean inside it in step 3)
    if (entry.name === 'exam_data') {
      console.log(`  ✅ KEEP: ${entry.name}/ (will clean non-defence files inside)`);
      continue;
    }

    // Delete everything else (including checker folder)
    if (entry.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`  🗑️  DELETED folder: ${entry.name}/`);
    } else {
      fs.unlinkSync(fullPath);
      console.log(`  🗑️  DELETED file: ${entry.name}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: Clean non-Defence files inside exam_data folder
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(60));
  console.log('STEP 2: Cleaning non-Defence files inside exam_data/');
  console.log('━'.repeat(60));

  const examDataDir = path.join(EXAMSDATA_DIR, 'exam_data');
  if (fs.existsSync(examDataDir)) {
    const examDataFiles = fs.readdirSync(examDataDir);
    for (const file of examDataFiles) {
      if (file.startsWith('DEFENCE_EXAMS__')) {
        console.log(`  ✅ KEEP: ${file}`);
      } else {
        const filePath = path.join(examDataDir, file);
        fs.unlinkSync(filePath);
        console.log(`  🗑️  DELETED: ${file}`);
      }
    }
  } else {
    console.log('  ℹ️  exam_data folder does not exist, skipping.');
  }

  // ═══════════════════════════════════════════════════════════════════
  // STEP 3: Drop non-Defence collections from MongoDB
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(60));
  console.log('STEP 3: Dropping non-Defence MongoDB collections');
  console.log('━'.repeat(60));

  let connectionUri = MONGODB_URI;
  if (connectionUri.startsWith('mongodb+srv://')) {
    console.log('  ℹ️  Resolving SRV via DNS-over-HTTPS…');
    connectionUri = await expandMongoSrvUri(connectionUri);
  }

  const client = new MongoClient(connectionUri);
  await client.connect();
  const db = client.db(DB_NAME);
  console.log('  ✅ Connected to MongoDB\n');

  const allCollections = await db.listCollections().toArray();
  let droppedCount = 0;

  for (const colInfo of allCollections) {
    const colName = colInfo.name;

    // Skip system collections
    if (colName.startsWith('system.')) {
      continue;
    }

    // Keep Defence, exam_catalog
    if (KEEP_ITEMS.has(colName)) {
      console.log(`  ✅ KEEP collection: ${colName}`);
      continue;
    }

    // Drop everything else
    try {
      await db.collection(colName).drop();
      droppedCount++;
      console.log(`  🗑️  DROPPED collection: ${colName}`);
    } catch (e) {
      console.error(`  ❌ Error dropping ${colName}: ${e.message}`);
    }
  }

  console.log(`\n  Total collections dropped: ${droppedCount}`);

  await client.close();

  // ═══════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(60));
  console.log('🎉 CLEANUP COMPLETE!');
  console.log('━'.repeat(60));
  console.log('Kept:');
  console.log('  📁 EXAMSDATA/DEFENCE_EXAMS/  (5 JSON files)');
  console.log('  📄 EXAMSDATA/exam_catalog.json');
  console.log('  📁 EXAMSDATA/exam_data/  (Defence files only)');
  console.log('  🗄️  MongoDB: DEFENCE_EXAMS + exam_catalog collections');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
