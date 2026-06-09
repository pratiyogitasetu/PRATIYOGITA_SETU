/**
 * DELETE /api/delete-mindmap?name=X[&category=Y]
 * Deletes a mindmap from its category collection and removes it from the catalog.
 * If category is not provided, it is looked up from the catalog.
 */

import { connectToDatabase } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const name = req.query.name;
  if (!name) {
    return res.status(400).json({ error: 'name query parameter is required' });
  }

  try {
    const { db } = await connectToDatabase();
    let category = req.query.category;

    // Look up the catalog
    const catalog = await db
      .collection('mindmap_catalog')
      .findOne({ _id: 'master_catalog' });

    // Find category if not provided
    if (!category && catalog?.categories) {
      for (const [cat, entries] of Object.entries(catalog.categories)) {
        if (Array.isArray(entries) && entries.some(e => e.mindmap_name === name)) {
          category = cat;
          break;
        }
      }
    }

    if (!category) {
      return res.status(404).json({ error: 'Mindmap not found in catalog' });
    }

    // 1. Delete from category collection
    const result = await db.collection(category).deleteOne({ _id: name });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Mindmap not found' });
    }

    // 2. Remove from catalog
    if (catalog?.categories?.[category]) {
      const updatedEntries = catalog.categories[category].filter(
        e => e.mindmap_name !== name
      );

      await db.collection('mindmap_catalog').updateOne(
        { _id: 'master_catalog' },
        {
          $set: {
            [`categories.${category}`]: updatedEntries,
            updated_at: new Date().toISOString(),
          },
        }
      );
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error deleting mindmap:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
