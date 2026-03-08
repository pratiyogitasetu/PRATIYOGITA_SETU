/**
 * GET /api/exams/[examId]
 * Returns a single exam's data by document ID
 * 
 * examId format: "DEFENCE_EXAMS__cds" (category + "__" + filename without .json)
 * This maps from the original path "DEFENCE_EXAMS/cds.json"
 */

import { connectToDatabase } from '../db.js';

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { examId } = req.query;

  if (!examId) {
    return res.status(400).json({ error: 'Missing examId parameter' });
  }

  try {
    const { db } = await connectToDatabase();
    const examDoc = await db
      .collection('exam_data')
      .findOne({ _id: examId });

    if (!examDoc) {
      return res.status(404).json({ error: `Exam not found: ${examId}` });
    }

    // Remove internal fields before sending to client
    const { _id, category, source_file, updated_at, ...examData } = examDoc;
    return res.status(200).json(examData);
  } catch (err) {
    console.error('Error fetching exam data:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
