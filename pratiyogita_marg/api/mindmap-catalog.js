/**
 * GET /api/mindmap-catalog
 * Returns the master mindmap catalog (all categories and mindmap entries).
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

    if (!catalog) {
      return res.status(404).json({ error: 'Mindmap catalog not found' });
    }

    return res.status(200).json(catalog.categories || {});
  } catch (err) {
    console.error('Error fetching mindmap catalog:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
