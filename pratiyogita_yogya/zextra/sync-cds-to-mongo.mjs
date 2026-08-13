/**
 * Sync CDS exam data to MongoDB.
 * 
 * This script:
 * 1. Connects to MongoDB Atlas
 * 2. Clears all documents in the DEFENCE_EXAMS collection
 * 3. Uploads the local EXAMSDATA/DEFENCE_EXAMS/cds.json as document _id: "cds"
 * 4. Updates the exam_catalog to reflect only DEFENCE_EXAMS/CDS
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
const DOH_ENDPOINT = 'https://cloudflare-dns.com/dns-query';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set');
  process.exit(1);
}

// ── DNS-over-HTTPS helpers (same as api/db.js) ──────────────────────
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

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log('🔌 Connecting to MongoDB…');

  let connectionUri = MONGODB_URI;
  if (connectionUri.startsWith('mongodb+srv://')) {
    console.log('  ℹ️  Resolving SRV via DNS-over-HTTPS…');
    connectionUri = await expandMongoSrvUri(connectionUri);
  }

  const client = new MongoClient(connectionUri);
  await client.connect();
  const db = client.db(DB_NAME);
  console.log('✅ Connected\n');

  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: Clear DEFENCE_EXAMS collection
  // ═══════════════════════════════════════════════════════════════════
  console.log('━'.repeat(60));
  console.log('STEP 1: Clearing DEFENCE_EXAMS collection');
  console.log('━'.repeat(60));

  const defenceCollection = db.collection('DEFENCE_EXAMS');
  const deleteResult = await defenceCollection.deleteMany({});
  console.log(`  🗑️  Deleted ${deleteResult.deletedCount} document(s) from DEFENCE_EXAMS`);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: Upload CDS JSON
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(60));
  console.log('STEP 2: Uploading CDS exam data');
  console.log('━'.repeat(60));

  const cdsPath = path.resolve(__dirname, 'EXAMSDATA', 'DEFENCE_EXAMS', 'cds.json');
  if (!fs.existsSync(cdsPath)) {
    console.error(`  ❌ CDS JSON not found at: ${cdsPath}`);
    await client.close();
    process.exit(1);
  }

  const cdsData = JSON.parse(fs.readFileSync(cdsPath, 'utf-8'));
  
  // Remove the _id field from data (we'll set it explicitly)
  const { _id, ...cdsPayload } = cdsData;
  
  // Insert with _id = "cds"
  await defenceCollection.insertOne({
    _id: 'cds',
    ...cdsPayload,
    updated_at: new Date().toISOString()
  });
  console.log('  ✅ Uploaded cds.json as document _id: "cds"');

  // ═══════════════════════════════════════════════════════════════════
  // STEP 3: Update exam_catalog
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(60));
  console.log('STEP 3: Updating exam_catalog');
  console.log('━'.repeat(60));

  const catalogCollection = db.collection('exam_catalog');
  
  // Build the catalog entry for CDS
  const catalogUpdate = {
    $set: {
      'categories.DEFENCE_EXAMS': [
        {
          exam_name: cdsPayload.exam_name || 'Combined Defence Services Examination (I), 2026',
          exam_code: cdsPayload.exam_code || 'CDS',
          linked_json_file: 'DEFENCE_EXAMS/cds.json',
          has_divisions: true
        }
      ]
    }
  };

  // Remove all non-DEFENCE categories from catalog
  const existingCatalog = await catalogCollection.findOne({ _id: 'master_catalog' });
  if (existingCatalog?.categories) {
    const categoriesToRemove = Object.keys(existingCatalog.categories)
      .filter(cat => cat !== 'DEFENCE_EXAMS');
    
    if (categoriesToRemove.length > 0) {
      const unsetObj = {};
      categoriesToRemove.forEach(cat => {
        unsetObj[`categories.${cat}`] = '';
      });
      await catalogCollection.updateOne(
        { _id: 'master_catalog' },
        { $unset: unsetObj }
      );
      console.log(`  🗑️  Removed ${categoriesToRemove.length} non-Defence categories: ${categoriesToRemove.join(', ')}`);
    }
  }

  await catalogCollection.updateOne(
    { _id: 'master_catalog' },
    catalogUpdate,
    { upsert: true }
  );
  console.log('  ✅ Updated master_catalog with DEFENCE_EXAMS/CDS');

  // ═══════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(60));
  console.log('🎉 SYNC COMPLETE!');
  console.log('━'.repeat(60));
  console.log('  🗄️  DEFENCE_EXAMS collection: 1 document (cds)');
  console.log('  📄 exam_catalog: Updated with CDS entry');

  await client.close();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
