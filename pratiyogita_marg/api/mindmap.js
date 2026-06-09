/**
 * GET /api/mindmap?name=X[&category=Y]
 * Returns the full mindmap document for the given name.
 * If category is provided, fetches directly from that collection.
 * Otherwise, looks up the category from the master catalog.
 */

import { connectToDatabase } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const name = req.query.name;
  if (!name) {
    return res.status(400).json({ error: 'name query parameter is required' });
  }

  try {
    const { db } = await connectToDatabase();
    let category = req.query.category;

    // If category not provided, look it up from the catalog
    if (!category) {
      const catalog = await db
        .collection('mindmap_catalog')
        .findOne({ _id: 'master_catalog' });

      if (catalog?.categories) {
        for (const [cat, entries] of Object.entries(catalog.categories)) {
          if (Array.isArray(entries) && entries.some(e => e.mindmap_name === name)) {
            category = cat;
            break;
          }
        }
      }
    }

    if (!category) {
      return res.status(404).json({ error: 'Mindmap not found in catalog' });
    }

    const doc = await db
      .collection(category)
      .findOne({ _id: name });

    if (!doc) {
      return res.status(404).json({ error: 'Mindmap not found' });
    }

    // Remove internal _id before sending
    const { _id, ...data } = doc;
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error loading mindmap:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
