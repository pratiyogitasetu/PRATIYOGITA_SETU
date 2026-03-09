/**
 * POST /api/save-mindmap
 * Save or update a mindmap document in its category collection + update catalog.
 * 
 * Body: { name, examCategory, headerData?, nodes, edges }
 */

import { connectToDatabase } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    if (!data.name || !data.examCategory) {
      return res.status(400).json({ error: 'name and examCategory are required' });
    }

    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      return res.status(400).json({ error: 'nodes and edges arrays are required' });
    }

    const safeCategory = data.examCategory.replace(/[^a-zA-Z0-9_]/g, '');
    const safeName = data.name.replace(/[^a-zA-Z0-9_\-]/g, '');
    const { db } = await connectToDatabase();
    const savedAt = new Date().toISOString();

    // 1. Save mindmap data into the category-specific collection
    const doc = {
      _id: safeName,
      name: data.name,
      examCategory: safeCategory,
      headerData: data.headerData || null,
      nodes: data.nodes,
      edges: data.edges,
      savedAt,
    };

    await db.collection(safeCategory).updateOne(
      { _id: safeName },
      { $set: doc },
      { upsert: true }
    );

    // 2. Update the catalog — add entry if it doesn't already exist
    const catalog = await db.collection('mindmap_catalog').findOne({ _id: 'master_catalog' });
    const categories = catalog?.categories || {};
    if (!categories[safeCategory]) categories[safeCategory] = [];

    const existingEntry = categories[safeCategory].find(e => e.mindmap_name === data.name);
    if (!existingEntry) {
      categories[safeCategory].push({
        mindmap_name: data.name,
        linked_json_file: `${safeCategory}/${safeName}.json`,
      });
    }

    await db.collection('mindmap_catalog').updateOne(
      { _id: 'master_catalog' },
      {
        $set: {
          categories,
          updated_at: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    return res.status(200).json({ success: true, name: data.name });
  } catch (err) {
    console.error('Error saving mindmap:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
