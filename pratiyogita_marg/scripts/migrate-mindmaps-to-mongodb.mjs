/**
 * Migration script: Upload existing mindmap JSON files from
 * src/Examdata/<CATEGORY>/<name>.json into MongoDB Atlas.
 *
 * Structure (matching Pratiyogita Yogya):
 *   - mindmap_catalog collection → master_catalog doc → .categories object
 *   - Per-category collections (e.g. NURSUING_EXAMS) → each mindmap is a document
 *
 * Usage: node scripts/migrate-mindmaps-to-mongodb.mjs
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
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
    if (!process.env[key]) process.env[key] = value;
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set. Create a .env file with MONGODB_URI=...');
  process.exit(1);
}

const DB_NAME = 'pratiyogita_marg';
const examdataDir = path.resolve(__dirname, '..', 'src', 'Examdata');

async function migrate() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  console.log(`Connected to MongoDB: ${DB_NAME}`);
  console.log(`Scanning: ${examdataDir}\n`);

  if (!fs.existsSync(examdataDir)) {
    console.log('No Examdata directory found. Nothing to migrate.');
    await client.close();
    return;
  }

  // Build catalog and upload mindmaps to per-category collections
  const categories = {};
  let count = 0;

  for (const cat of fs.readdirSync(examdataDir)) {
    const catDir = path.join(examdataDir, cat);
    if (!fs.statSync(catDir).isDirectory()) continue;

    // Initialize category even if empty (so all folders are represented)
    if (!categories[cat]) categories[cat] = [];

    for (const file of fs.readdirSync(catDir)) {
      if (!file.endsWith('.json')) continue;

      try {
        const content = JSON.parse(fs.readFileSync(path.join(catDir, file), 'utf-8'));
        const mindmapName = content.name || file.replace(/\.json$/, '');
        const docId = mindmapName;

        // Save mindmap data into the category collection (doc _id = mindmap name)
        const doc = {
          _id: docId,
          name: mindmapName,
          examCategory: cat,
          headerData: content.headerData || null,
          nodes: content.nodes || [],
          edges: content.edges || [],
          savedAt: content.savedAt || new Date().toISOString(),
        };

        await db.collection(cat).updateOne(
          { _id: docId },
          { $set: doc },
          { upsert: true }
        );

        // Add entry to catalog
        categories[cat].push({
          mindmap_name: mindmapName,
          linked_json_file: `${cat}/${file}`,
        });

        console.log(`  ✓ ${cat}/${file} → ${cat}.${docId}`);
        count++;
      } catch (err) {
        console.error(`  ✗ ${cat}/${file}: ${err.message}`);
      }
    }
  }

  // Upsert the master catalog
  await db.collection('mindmap_catalog').updateOne(
    { _id: 'master_catalog' },
    {
      $set: {
        _id: 'master_catalog',
        categories,
        updated_at: new Date().toISOString(),
      },
    },
    { upsert: true }
  );
  console.log('\n  ✓ Created/updated mindmap_catalog → master_catalog');
  console.log(`    Categories: ${Object.keys(categories).join(', ')}`);

  // Drop old flat 'mindmaps' collection if it exists
  const collections = await db.listCollections({ name: 'mindmaps' }).toArray();
  if (collections.length > 0) {
    await db.collection('mindmaps').drop();
    console.log('  ✓ Dropped old "mindmaps" collection');
  }

  console.log(`\nMigration complete: ${count} mindmap(s) uploaded to per-category collections.`);
  await client.close();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
