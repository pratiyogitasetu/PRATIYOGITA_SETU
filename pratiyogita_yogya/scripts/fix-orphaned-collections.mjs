/**
 * Fix orphaned collections from migration.
 * Move documents from old category names to catalog-matching names.
 *
 * INSURANCE_EXAMS → INSURANCES_ED
 * NURSUING_EXAMS → NURSING_ED  (also fix the typo)
 *
 * Usage: node scripts/fix-orphaned-collections.mjs
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';

// Load env
for (const envFile of ['.env', '.env.local']) {
  const envPath = `g:/chatbot/pratiyogita_yogya/${envFile}`;
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      if (!process.env[t.slice(0, i).trim()]) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
  }
}

const renames = [
  { from: 'INSURANCE_EXAMS', to: 'INSURANCES_ED' },
  { from: 'NURSUING_EXAMS', to: 'NURSING_ED' },
];

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db('pratiyogita_yogya');

for (const { from, to } of renames) {
  const docs = await db.collection(from).find({}).toArray();
  if (docs.length === 0) {
    console.log(`⚠️  ${from}: no documents, skipping`);
    continue;
  }

  console.log(`📦 ${from} → ${to}: ${docs.length} document(s)`);
  docs.forEach(d => console.log(`   • ${d._id} — ${d.exam_name || '(no name)'}`));

  try {
    await db.collection(to).insertMany(docs, { ordered: false });
    console.log(`   ✅ Inserted into ${to}`);
  } catch (err) {
    if (err.code === 11000) {
      console.log(`   ⚠️  Some already existed in ${to} (duplicates skipped)`);
    } else {
      throw err;
    }
  }

  // Drop the old collection
  await db.collection(from).drop();
  console.log(`   🗑️  Dropped ${from}\n`);
}

console.log('✅ Done! Orphaned collections fixed.');
await client.close();
