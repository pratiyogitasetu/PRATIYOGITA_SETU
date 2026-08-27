/**
 * GET /api/exams/stats
 * Returns live aggregated counts directly from MongoDB Atlas
 */
import { connectToDatabase } from '../db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set CORS headers so Setu main portal can fetch live counts
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { db } = await connectToDatabase();
    const catalog = await db
      .collection('exam_catalog')
      .findOne({ _id: 'master_catalog' });

    const categories = catalog?.categories || {};
    const categoryCount = Object.keys(categories).length;

    let totalExams = 0;
    let totalLinkedExams = 0;

    Object.values(categories).forEach((exams) => {
      if (Array.isArray(exams)) {
        totalExams += exams.length;
        totalLinkedExams += exams.filter((e) => e && e.linked_json_file).length;
      }
    });

    return res.status(200).json({
      total_categories: categoryCount,
      total_exams: totalExams,
      total_linked_exams: totalLinkedExams,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error fetching exam stats:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
