/**
 * Migration Script: Move exam data from single `exam_data` collection
 * to individual category-based collections.
 *
 * Before: exam_data collection → documents like { _id: "DEFENCE_EXAMS__cds", category: "DEFENCE_EXAMS", ... }
 * After:  DEFENCE_EXAMS collection → { _id: "cds", ... }
 *         SSC_EXAMS collection → { _id: "ssc-cgl-01", ... }
 *         etc.
 *
 * The exam_catalog collection (master_catalog) remains unchanged.
 *
 * Usage: node scripts/migrate-to-category-collections.mjs
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
for (const envFile of ['.env', '.env.local']) {
  const envPath = path.resolve(__dirname, '..', envFile);
  if (fs.existsSync(envPath)) {
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
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'pratiyogita_yogya';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set. Create a .env file with it.');
  process.exit(1);
}

async function migrate() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);

    // 1. Read all documents from exam_data
    const allDocs = await db.collection('exam_data').find({}).toArray();
    console.log(`📦 Found ${allDocs.length} documents in exam_data collection\n`);

    if (allDocs.length === 0) {
      console.log('⚠️  No documents to migrate.');
      return;
    }

    // 2. Group by category
    const grouped = {};
    const unmatched = [];

    for (const doc of allDocs) {
      // Category is stored in the document, or can be derived from _id
      let category = doc.category;

      if (!category && typeof doc._id === 'string' && doc._id.includes('__')) {
        category = doc._id.split('__')[0];
      }

      if (!category) {
        unmatched.push(doc._id);
        continue;
      }

      if (!grouped[category]) grouped[category] = [];

      // Build the new document: remove old meta fields, set new _id
      const { _id, category: _cat, source_file, ...examFields } = doc;

      // New _id is just the part after "__" (e.g., "cds" from "DEFENCE_EXAMS__cds")
      const newId = typeof _id === 'string' && _id.includes('__')
        ? _id.split('__').slice(1).join('__')
        : _id;

      grouped[category].push({
        _id: newId,
        ...examFields,
      });
    }

    if (unmatched.length > 0) {
      console.log(`⚠️  ${unmatched.length} documents had no category and were skipped:`);
      unmatched.forEach((id) => console.log(`   - ${id}`));
      console.log('');
    }

    // 3. Insert into category-specific collections
    console.log('📂 Migrating to category collections:\n');

    for (const [category, docs] of Object.entries(grouped)) {
      console.log(`  ${category}: ${docs.length} exam(s)`);
      docs.forEach((d) => console.log(`    • ${d._id} — ${d.exam_name || '(no name)'}`));

      // Use insertMany with ordered: false to skip duplicates
      try {
        const result = await db.collection(category).insertMany(docs, { ordered: false });
        console.log(`    ✅ Inserted ${result.insertedCount} documents\n`);
      } catch (err) {
        if (err.code === 11000) {
          // Some duplicates (already migrated partially)
          const inserted = err.result?.insertedCount || err.insertedCount || 0;
          console.log(`    ⚠️  ${inserted} new, some already existed (duplicates skipped)\n`);
        } else {
          throw err;
        }
      }
    }

    // 4. Summary
    const categories = Object.keys(grouped);
    const totalMigrated = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);

    console.log('═══════════════════════════════════════');
    console.log(`✅ Migration complete!`);
    console.log(`   ${totalMigrated} documents → ${categories.length} collections`);
    console.log(`   Collections: ${categories.join(', ')}`);
    console.log('');
    console.log('⚠️  The old exam_data collection is still intact.');
    console.log('   After verifying everything works, you can drop it manually:');
    console.log('   db.exam_data.drop()');
    console.log('═══════════════════════════════════════');

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrate();
