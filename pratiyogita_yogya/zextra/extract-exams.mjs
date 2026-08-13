/**
 * Extract all MongoDB exam data into local EXAMSDATA folder.
 * 
 * Structure:
 *   EXAMSDATA/
 *     exam_catalog.json          (master catalog)
 *     DEFENCE_EXAMS/
 *       cds.json
 *       nda.json
 *       ...
 *     BANKING_EXAMS/
 *       sbi_po.json
 *       ...
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
const OUTPUT_DIR = path.resolve(__dirname, 'EXAMSDATA');
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

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. Fetch & save the master catalog
  console.log('📦 Fetching master catalog…');
  const catalog = await db.collection('exam_catalog').findOne({ _id: 'master_catalog' });
  if (!catalog) {
    console.error('❌ Master catalog not found!');
    await client.close();
    process.exit(1);
  }
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'exam_catalog.json'),
    JSON.stringify(catalog, null, 2),
    'utf-8'
  );
  console.log('  → Saved exam_catalog.json\n');

  const categories = catalog.categories || {};
  let totalExams = 0;
  let totalSaved = 0;

  // 2. Iterate over every category
  for (const [categoryName, categoryData] of Object.entries(categories)) {
    console.log(`\n📂 Category: ${categoryName}`);

    // Create folder for this category
    const categoryDir = path.join(OUTPUT_DIR, categoryName);
    fs.mkdirSync(categoryDir, { recursive: true });

    // Get all exam entries from the catalog for this category
    const exams = categoryData.exams || categoryData;

    // Determine the list of exam identifiers
    let examEntries = [];
    if (Array.isArray(exams)) {
      examEntries = exams;
    } else if (typeof exams === 'object') {
      examEntries = Object.entries(exams).map(([key, val]) => {
        if (typeof val === 'string') return { id: key, name: val };
        return { id: key, ...val };
      });
    }

    if (examEntries.length === 0) {
      // Fallback: just dump all documents from the collection
      console.log(`  ℹ️  No exam list in catalog, dumping entire collection "${categoryName}"…`);
      try {
        const allDocs = await db.collection(categoryName).find({}).toArray();
        for (const doc of allDocs) {
          const docId = doc._id || 'unknown';
          const fileName = `${docId}.json`;
          fs.writeFileSync(
            path.join(categoryDir, fileName),
            JSON.stringify(doc, null, 2),
            'utf-8'
          );
          totalSaved++;
          console.log(`  ✅ ${fileName}`);
        }
        totalExams += allDocs.length;
      } catch (e) {
        console.error(`  ⚠️  Could not read collection "${categoryName}": ${e.message}`);
      }
      continue;
    }

    totalExams += examEntries.length;

    for (const entry of examEntries) {
      // entry could be a string (just the filename/id) or an object with .id / .file
      let docId;
      if (typeof entry === 'string') {
        // Could be "cds.json" or just "cds"
        docId = entry.replace(/\.json$/, '');
      } else {
        docId = (entry.file || entry.id || entry.name || '').replace(/\.json$/, '');
      }

      if (!docId) {
        console.log(`  ⚠️  Skipped entry with no id:`, entry);
        continue;
      }

      try {
        const examDoc = await db.collection(categoryName).findOne({ _id: docId });
        if (!examDoc) {
          console.log(`  ⚠️  Not found: ${categoryName}/${docId}`);
          continue;
        }
        const fileName = `${docId}.json`;
        fs.writeFileSync(
          path.join(categoryDir, fileName),
          JSON.stringify(examDoc, null, 2),
          'utf-8'
        );
        totalSaved++;
        console.log(`  ✅ ${fileName}`);
      } catch (e) {
        console.error(`  ❌ Error fetching ${categoryName}/${docId}: ${e.message}`);
      }
    }
  }

  // 3. Also discover any collections we might have missed
  console.log('\n\n🔍 Checking for additional collections not in catalog…');
  const allCollections = await db.listCollections().toArray();
  const catalogCategories = new Set(Object.keys(categories));
  catalogCategories.add('exam_catalog');

  for (const colInfo of allCollections) {
    const colName = colInfo.name;
    if (catalogCategories.has(colName)) continue;
    if (colName.startsWith('system.')) continue;

    console.log(`\n📂 Extra collection: ${colName}`);
    const extraDir = path.join(OUTPUT_DIR, colName);
    fs.mkdirSync(extraDir, { recursive: true });

    try {
      const allDocs = await db.collection(colName).find({}).toArray();
      for (const doc of allDocs) {
        const docId = doc._id || 'unknown';
        const fileName = `${String(docId).replace(/[/\\]/g, '_')}.json`;
        fs.writeFileSync(
          path.join(extraDir, fileName),
          JSON.stringify(doc, null, 2),
          'utf-8'
        );
        totalSaved++;
        console.log(`  ✅ ${fileName}`);
      }
      totalExams += allDocs.length;
    } catch (e) {
      console.error(`  ⚠️  Could not read collection "${colName}": ${e.message}`);
    }
  }

  console.log(`\n\n🎉 Done! Total exams found: ${totalExams}, Saved: ${totalSaved}`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);

  await client.close();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
