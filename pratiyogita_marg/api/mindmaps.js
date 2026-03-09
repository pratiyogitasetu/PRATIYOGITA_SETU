/**
 * GET /api/mindmaps
 * Returns a list of all saved mindmaps (name, examCategory, savedAt)
 * by reading from the master catalog + fetching savedAt from each category collection.
 */

import { connectToDatabase } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();

    const catalog = await db
      .collection('mindmap_catalog')
      .findOne({ _id: 'master_catalog' });

    if (!catalog || !catalog.categories) {
      return res.status(200).json([]);
    }

    const list = [];

    for (const [category, entries] of Object.entries(catalog.categories)) {
      if (!Array.isArray(entries) || entries.length === 0) continue;

      // Fetch savedAt for all mindmaps in this category
      const names = entries.map(e => e.mindmap_name);
      const docs = await db
        .collection(category)
        .find(
          { _id: { $in: names } },
          { projection: { _id: 1, savedAt: 1 } }
        )
        .toArray();

      const savedAtMap = {};
      for (const d of docs) savedAtMap[d._id] = d.savedAt;

      for (const entry of entries) {
        list.push({
          name: entry.mindmap_name,
          examCategory: category,
          savedAt: savedAtMap[entry.mindmap_name] || null,
        });
      }
    }

    // Sort by savedAt descending
    list.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));

    return res.status(200).json(list);
  } catch (err) {
    console.error('Error listing mindmaps:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
