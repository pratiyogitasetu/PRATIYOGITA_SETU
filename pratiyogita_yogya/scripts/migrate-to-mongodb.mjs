/**
 * Migration Script: Upload existing exam JSON files to MongoDB Atlas
 * 
 * Usage:
 *   1. Make sure .env has MONGODB_URI set with your actual password
 *   2. Run: node scripts/migrate-to-mongodb.mjs
 * 
 * This reads all JSON files from public/examsdata/ and uploads them to MongoDB.
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Load .env manually (no dotenv dependency needed) ──
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

const DB_NAME = 'pratiyogita_yogya';
const EXAM_CATALOG_COLLECTION = 'exam_catalog';
const EXAM_DATA_COLLECTION = 'exam_data';

const examsDataDir = path.resolve(__dirname, '..', 'public', 'examsdata');

/**
 * Convert a linked_json_file path to a MongoDB document _id
 * e.g., "DEFENCE_EXAMS/cds.json" → "DEFENCE_EXAMS__cds"
 */
function pathToDocId(linkedJsonFile) {
  return linkedJsonFile
    .replace(/\.json$/i, '')
    .replace(/\//g, '__');
}

/**
 * Recursively find all .json files in a directory
 */
function findJsonFiles(dir, baseDir = dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findJsonFiles(fullPath, baseDir));
    } else if (entry.name.endsWith('.json') && entry.name !== 'allexamnames.json' && entry.name !== 'possiblefields.json' && entry.name !== 'HH.json') {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push({ fullPath, relativePath });
    }
  }
  return results;
}

async function migrate() {
  console.log('🚀 Starting migration to MongoDB Atlas...\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = client.db(DB_NAME);

    // ── Step 1: Upload exam catalog ──
    console.log('📋 Step 1: Uploading exam catalog...');
    const catalogPath = path.join(examsDataDir, 'allexamnames.json');
    if (!fs.existsSync(catalogPath)) {
      console.error('❌ allexamnames.json not found at:', catalogPath);
      process.exit(1);
    }

    const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
    const catalogCollection = db.collection(EXAM_CATALOG_COLLECTION);

    await catalogCollection.updateOne(
      { _id: 'master_catalog' },
      {
        $set: {
          _id: 'master_catalog',
          categories: catalogData,
          updated_at: new Date().toISOString()
        }
      },
      { upsert: true }
    );
    console.log('   ✅ Exam catalog uploaded successfully\n');

    // ── Step 2: Upload individual exam data files ──
    console.log('📄 Step 2: Uploading individual exam data files...');
    const examFiles = findJsonFiles(examsDataDir);
    console.log(`   Found ${examFiles.length} exam JSON files\n`);

    const examCollection = db.collection(EXAM_DATA_COLLECTION);
    let successCount = 0;
    let errorCount = 0;

    for (const { fullPath, relativePath } of examFiles) {
      try {
        const examData = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        const docId = pathToDocId(relativePath);
        const category = relativePath.split('/')[0];

        await examCollection.updateOne(
          { _id: docId },
          {
            $set: {
              _id: docId,
              category: category,
              source_file: relativePath,
              ...examData,
              updated_at: new Date().toISOString()
            }
          },
          { upsert: true }
        );

        successCount++;
        console.log(`   ✅ [${successCount}/${examFiles.length}] ${relativePath} → ${docId}`);
      } catch (err) {
        errorCount++;
        console.error(`   ❌ Failed: ${relativePath} — ${err.message}`);
      }
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📋 Catalog: uploaded`);
    console.log(`   📄 Exams: ${successCount} documents in "${EXAM_DATA_COLLECTION}" collection`);

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

migrate();
