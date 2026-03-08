/**
 * POST /api/admin/save-catalog
 * Update the master exam catalog in MongoDB
 * Protected by ADMIN_API_KEY
 * 
 * Body: { categories } — the full catalog object
 */

import { connectToDatabase } from '../db.js';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin API key
  const apiKey = req.headers['x-admin-key'];
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { categories } = req.body;

    if (!categories || typeof categories !== 'object') {
      return res.status(400).json({ error: 'Missing or invalid categories object' });
    }

    const { db } = await connectToDatabase();

    await db.collection('exam_catalog').updateOne(
      { _id: 'master_catalog' },
      {
        $set: {
          _id: 'master_catalog',
          categories,
          updated_at: new Date().toISOString()
        }
      },
      { upsert: true }
    );

    return res.status(200).json({
      ok: true,
      message: 'Exam catalog updated successfully'
    });
  } catch (err) {
    console.error('Error saving exam catalog:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
