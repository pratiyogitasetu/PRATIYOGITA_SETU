/**
 * POST /api/admin/delete-exam
 * Delete an exam's data from MongoDB and optionally remove it from the catalog
 * Protected by ADMIN_API_KEY
 * 
 * Body: { category, examCode, linkedJsonFile }
 */

import { connectToDatabase } from '../db.js';

export default async function handler(req, res) {
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
    const { category, examCode, linkedJsonFile } = req.body;

    if (!category || !examCode) {
      return res.status(400).json({ error: 'Missing category or examCode' });
    }

    const { db } = await connectToDatabase();

    // 1. Delete the exam data document if it has a linked JSON file
    let examDeleted = false;
    if (linkedJsonFile) {
      const docId = linkedJsonFile.replace(/\.json$/i, '').replace(/\//g, '__');
      const result = await db.collection('exam_data').deleteOne({ _id: docId });
      examDeleted = result.deletedCount > 0;
    }

    // 2. Remove the exam entry from the catalog
    const catalog = await db.collection('exam_catalog').findOne({ _id: 'master_catalog' });
    if (catalog && catalog.categories && catalog.categories[category]) {
      const updatedExams = catalog.categories[category].filter(
        (exam) => exam.exam_code !== examCode
      );
      catalog.categories[category] = updatedExams;

      await db.collection('exam_catalog').updateOne(
        { _id: 'master_catalog' },
        {
          $set: {
            [`categories.${category}`]: updatedExams,
            updated_at: new Date().toISOString()
          }
        }
      );
    }

    return res.status(200).json({
      ok: true,
      examDeleted,
      message: `Exam "${examCode}" deleted from ${category}`
    });
  } catch (err) {
    console.error('Error deleting exam:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
