const { MongoClient } = require('mongodb');
(async () => {
  const c = new MongoClient('mongodb+srv://Vercel-Admin-pratiyogita_yogya:IQUNgWMhov4AU5kj@pratiyogita-yogya.3vgjdbk.mongodb.net/');
  await c.connect();
  const db = c.db('pratiyogita_yogya');
  const cat = await db.collection('exam_catalog').findOne({ _id: 'master_catalog' });
  const keys = Object.keys(cat.categories);
  console.log('Categories:', keys);
  console.log('\nSample entry:', JSON.stringify(cat.categories[keys[0]][0], null, 2));
  await c.close();
})();
