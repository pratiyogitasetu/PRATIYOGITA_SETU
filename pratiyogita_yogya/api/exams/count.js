/**
 * GET /api/exams/count
 * Returns the total number of exam documents in MongoDB
 */

import { connectToDatabase } from '../db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const count = await db.collection('exam_data').countDocuments();
    return res.status(200).json({ count });
  } catch (err) {
    console.error('Error counting exams:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
