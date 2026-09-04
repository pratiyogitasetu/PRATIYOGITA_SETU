/**
 * Upload all exam JSON data and catalog to MongoDB Atlas.
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const DOH_ENDPOINT = 'https://cloudflare-dns.com/dns-query';
const stripTrailingDot = (value) => value.replace(/\.$/, '');

async function resolveDnsJson(name, type) {
  const url = new URL(DOH_ENDPOINT);
  url.searchParams.set('name', name);
  url.searchParams.set('type', type);

  const response = await fetch(url, {
    headers: { Accept: 'application/dns-json' },
  });

  if (!response.ok) {
    throw new Error(`DNS-over-HTTPS request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload.Answer) ? payload.Answer : [];
}

async function expandMongoSrvUri(uri) {
  const parsedUrl = new URL(uri);
  const srvName = `_mongodb._tcp.${parsedUrl.hostname}`;

  const srvRecords = await resolveDnsJson(srvName, 'SRV');
  if (!srvRecords.length) {
    throw new Error(`No SRV records found for ${parsedUrl.hostname}`);
  }

  const hosts = srvRecords
    .map((record) => {
      const parts = String(record.data || '').trim().split(/\s+/);
      if (parts.length < 4) return null;
      const port = parts[2];
      const host = stripTrailingDot(parts[3]);
      return `${host}:${port}`;
    })
    .filter(Boolean);

  if (!hosts.length) {
    throw new Error(`Unable to expand SRV records for ${parsedUrl.hostname}`);
  }

  const params = new URLSearchParams(parsedUrl.search);
  if (!params.has('tls')) {
    params.set('tls', 'true');
  }

  const txtRecords = await resolveDnsJson(parsedUrl.hostname, 'TXT').catch(() => []);
  for (const record of txtRecords) {
    const rawText = String(record.data || '').trim().replace(/^"|"$/g, '');
    if (!rawText) continue;
    const recordParams = new URLSearchParams(rawText);
    for (const [key, value] of recordParams.entries()) {
      if (!params.has(key)) {
        params.set(key, value);
      }
    }
  }

  const pathname = parsedUrl.pathname && parsedUrl.pathname !== '/' ? parsedUrl.pathname : '/';
  const username = parsedUrl.username ? encodeURIComponent(parsedUrl.username) : '';
  const password = parsedUrl.password ? `:${encodeURIComponent(parsedUrl.password)}` : '';
  const auth = username ? `${username}${password}@` : '';

  return `mongodb://${auth}${hosts.join(',')}${pathname}?${params.toString()}`;
}

const EXAMSDATA_DIR = path.resolve(__dirname, 'EXAMSDATA');
const DB_NAME = 'pratiyogita_yogya';

const EXAM_FOLDERS = [
  'BANKING_EXAMS',
  'CIVIL_SERVICES_EXAMS',
  'CUET_AND_UG_ENTRANCE_EXAMS',
  'DEFENCE_EXAMS',
  'ENGINEERING_RECRUITING_EXAMS',
  'MBA_EXAMS',
  'PG_EXAMS',
  'POLICE_EXAMS',
  'RAILWAY_EXAMS',
  'SSC_EXAMS',
  'TEACHING_EXAMS',
  'JUDICIARY_EXAMS',
];



async function uploadAll() {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is not set.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  if (uri.startsWith('mongodb+srv://')) {
    uri = await expandMongoSrvUri(uri);
  }

  const client = new MongoClient(uri);
  await client.connect();
  console.log('✅ Connected to MongoDB successfully!\n');

  const db = client.db(DB_NAME);

  let totalUploadedExams = 0;
  const categoryCounts = {};

  // 1. Upload exam files by category
  for (const folder of EXAM_FOLDERS) {
    const folderPath = path.join(EXAMSDATA_DIR, folder);
    if (!fs.existsSync(folderPath)) continue;

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));
    if (files.length === 0) continue;

    console.log(`📁 Processing ${folder} (${files.length} exams)...`);
    categoryCounts[folder] = 0;

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const doc = JSON.parse(fileContent);

      const docId = file.replace(/\.json$/i, '');
      const fullDocId = `${folder}__${docId}`;

      // Upsert into category collection with _id = docId (e.g. "cds", "sbipo")
      const catDoc = { ...doc, _id: docId, updated_at: new Date() };
      await db.collection(folder).replaceOne(
        { _id: docId },
        catDoc,
        { upsert: true }
      );

      // Upsert into aggregate exam_data collection with _id = fullDocId (e.g. "DEFENCE_EXAMS__cds")
      const aggDoc = { ...doc, _id: fullDocId, updated_at: new Date() };
      await db.collection('exam_data').replaceOne(
        { _id: fullDocId },
        aggDoc,
        { upsert: true }
      );

      categoryCounts[folder]++;
      totalUploadedExams++;
      console.log(`  ✓ Uploaded ${file} → [${folder}] (${docId}) & [exam_data] (${fullDocId})`);
    }
  }

  // 2. Upload exam_catalog.json
  const catalogPath = path.join(EXAMSDATA_DIR, 'exam_catalog.json');
  if (fs.existsSync(catalogPath)) {
    console.log(`\n📁 Processing exam_catalog.json...`);
    const catalogContent = fs.readFileSync(catalogPath, 'utf-8');
    const catalogDoc = JSON.parse(catalogContent);
    const catalogUploadDoc = {
      ...catalogDoc,
      _id: 'master_catalog',
      updated_at: new Date(),
    };

    await db.collection('exam_catalog').replaceOne(
      { _id: 'master_catalog' },
      catalogUploadDoc,
      { upsert: true }
    );
    console.log(`  ✓ Uploaded exam_catalog.json → [exam_catalog] (master_catalog)`);
  }

  // 3. Print Summary of Database State
  console.log('\n========================================');
  console.log('✅ UPLOAD COMPLETE - DATABASE SUMMARY');
  console.log('========================================');
  console.log(`Total exam files uploaded: ${totalUploadedExams}\n`);

  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`  • ${col.name.padEnd(32)} : ${count} document(s)`);
  }

  await client.close();
  console.log('\nMongoDB connection closed.');
}

uploadAll().catch((err) => {
  console.error('❌ Upload failed:', err);
  process.exit(1);
});
