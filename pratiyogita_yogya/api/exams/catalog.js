/**
 * GET /api/exams/catalog
 * Returns the master exam catalog (all exam names, categories, codes)
 */

import { connectToDatabase } from '../db.js';

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const catalog = await db
      .collection('exam_catalog')
      .findOne({ _id: 'master_catalog' });

    if (!catalog) {
      return res.status(404).json({ error: 'Exam catalog not found' });
    }

    // Return just the categories object (same shape as allexamnames.json)
    return res.status(200).json(catalog.categories || {});
  } catch (err) {
    console.error('Error fetching exam catalog:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
