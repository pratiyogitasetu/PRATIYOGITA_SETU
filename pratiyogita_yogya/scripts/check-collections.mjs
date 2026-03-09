import { MongoClient } from 'mongodb';
import fs from 'fs';

// Load env
const envPath = 'g:/chatbot/pratiyogita_yogya/.env';
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db('pratiyogita_yogya');

const cat = await db.collection('exam_catalog').findOne({ _id: 'master_catalog' });
const catKeys = Object.keys(cat.categories);

const allColls = (await db.listCollections().toArray()).map(c => c.name);
const examColls = allColls.filter(n => n !== 'exam_catalog' && n !== 'exam_data');

console.log(`\nCatalog categories (${catKeys.length}):`, catKeys);
console.log(`\nExam collections (${examColls.length}):`, examColls);

const collectionsNotInCatalog = examColls.filter(c => !catKeys.includes(c));
const catalogWithoutCollection = catKeys.filter(k => !examColls.includes(k));

console.log('\nCollections NOT in catalog:', collectionsNotInCatalog);
console.log('Catalog categories WITHOUT collection:', catalogWithoutCollection);

console.log('\nDocument counts per collection:');
let total = 0;
for (const col of examColls) {
  const cnt = await db.collection(col).countDocuments();
  total += cnt;
  console.log(`  ${col}: ${cnt}`);
}
console.log(`  TOTAL: ${total}`);

await client.close();
