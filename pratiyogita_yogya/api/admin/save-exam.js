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

    // Build document ID: "DEFENCE_EXAMS__cds" from "DEFENCE_EXAMS" + "cds.json"
    const safeCategory = category.replace(/[^a-zA-Z0-9_]/g, '');
    const safeName = fileName.replace(/\.json$/i, '').replace(/[^a-zA-Z0-9_-]/g, '');
    const docId = `${safeCategory}__${safeName}`;
    const sourceFile = `${safeCategory}/${fileName.endsWith('.json') ? fileName : fileName + '.json'}`;

    const { db } = await connectToDatabase();

    // Parse examData if it's a string
    const data = typeof examData === 'string' ? JSON.parse(examData) : examData;

    await db.collection('exam_data').updateOne(
      { _id: docId },
      {
        $set: {
          _id: docId,
          category: safeCategory,
          source_file: sourceFile,
          ...data,
          updated_at: new Date().toISOString()
        }
      },
      { upsert: true }
    );

    return res.status(200).json({
      ok: true,
      docId,
      path: sourceFile,
      message: `Exam data saved: ${docId}`
    });
  } catch (err) {
    console.error('Error saving exam data:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
