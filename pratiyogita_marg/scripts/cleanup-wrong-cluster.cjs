// One-time script to clean up the wrongly-created mindmaps collection from the Yogya cluster
const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://Vercel-Admin-pratiyogita_yogya:IQUNgWMhov4AU5kj@pratiyogita-yogya.3vgjdbk.mongodb.net/';

(async () => {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('pratiyogita_marg');
  const collections = await db.listCollections().toArray();
  console.log('Collections found:', collections.map(c => c.name));
  for (const col of collections) {
    await db.collection(col.name).drop();
    console.log('Dropped collection:', col.name);
  }
  console.log('Cleanup done');
  await client.close();
})().catch(e => { console.error(e); process.exit(1); });
