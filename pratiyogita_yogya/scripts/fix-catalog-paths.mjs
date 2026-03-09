/**
 * Fix catalog linked_json_file paths that reference old collection names.
 * 
 * INSURANCE_EXAMS/licaao.json → INSURANCES_ED/licaao.json
 * NURSUING_EXAMS/aiimsnursingofficer.json → NURSING_ED/aiimsnursingofficer.json
 *
 * Usage: node scripts/fix-catalog-paths.mjs
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';

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

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db('pratiyogita_yogya');

const catalog = await db.collection('exam_catalog').findOne({ _id: 'master_catalog' });
const categories = catalog.categories;

// Map old category prefixes in linked_json_file to actual category keys
const pathFixes = {
  'INSURANCE_EXAMS': 'INSURANCES_ED',
  'NURSUING_EXAMS': 'NURSING_ED',
};

let fixCount = 0;

for (const [catKey, exams] of Object.entries(categories)) {
  for (const exam of exams) {
    if (!exam.linked_json_file) continue;
    
    const parts = exam.linked_json_file.split('/');
    const prefix = parts[0];
    
    if (pathFixes[prefix]) {
      const oldPath = exam.linked_json_file;
      exam.linked_json_file = `${pathFixes[prefix]}/${parts.slice(1).join('/')}`;
      console.log(`  ${catKey} / ${exam.exam_code}:`);
      console.log(`    OLD: ${oldPath}`);
      console.log(`    NEW: ${exam.linked_json_file}`);
      fixCount++;
    }
  }
}

if (fixCount === 0) {
  console.log('No paths needed fixing.');
} else {
  await db.collection('exam_catalog').updateOne(
    { _id: 'master_catalog' },
    { $set: { categories, updated_at: new Date().toISOString() } }
  );
  console.log(`\n✅ Fixed ${fixCount} linked_json_file paths in catalog.`);
}

await client.close();
