/**
 * POST /api/admin/save-exam
 * Save or update an exam's data in MongoDB
 * Protected by ADMIN_API_KEY
 * 
 * Body: { category, fileName, examData }
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
    const { category, fileName, examData } = req.body;

    if (!category || !fileName || !examData) {
      return res.status(400).json({ error: 'Missing category, fileName, or examData' });
    }

    // Collection = category, doc ID = filename without .json
    const safeCategory = category.replace(/[^a-zA-Z0-9_]/g, '');
    const safeName = fileName.replace(/\.json$/i, '').replace(/[^a-zA-Z0-9_-]/g, '');
    const docId = safeName;
    const compositeId = `${safeCategory}__${safeName}`;

    const { db } = await connectToDatabase();

    // Parse examData if it's a string
    const data = typeof examData === 'string' ? JSON.parse(examData) : examData;

    // Save into the category-specific collection
    await db.collection(safeCategory).updateOne(
      { _id: docId },
      {
        $set: {
          _id: docId,
          ...data,
          updated_at: new Date().toISOString()
        }
      },
      { upsert: true }
    );

    return res.status(200).json({
      ok: true,
      docId: compositeId,
      message: `Exam data saved: ${safeCategory} / ${docId}`
    });
  } catch (err) {
    console.error('Error saving exam data:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
