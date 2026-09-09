/**
 * GET /api/exams/eligibility-fields
 * Returns the eligibility fields schema and options from MongoDB
 */

import { connectToDatabase } from '../db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const fields = await db
      .collection('eligibility_fields')
      .findOne({ _id: 'eligibility_fields' });

    if (!fields) {
      return res.status(404).json({ error: 'Eligibility fields not found' });
    }

    return res.status(200).json(fields);
  } catch (err) {
    console.error('Error fetching eligibility fields:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
