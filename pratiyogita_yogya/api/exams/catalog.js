/**
 * GET /api/exams/catalog
 * Returns the master exam catalog (all exam names, categories, codes)
 */

import { connectToDatabase } from '../db.js';
import fs from 'fs';
import path from 'path';

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

    const categories = catalog.categories || {};
    const filteredCategories = {};

    for (const [categoryName, exams] of Object.entries(categories)) {
      if (Array.isArray(exams)) {
        filteredCategories[categoryName] = exams.map(exam => {
          if (exam.linked_json_file) {
            const filePath = path.join(process.cwd(), 'EXAMSDATA', exam.linked_json_file);
            if (!fs.existsSync(filePath)) {
              return {
                ...exam,
                linked_json_file: ""
              };
            }
          }
          return exam;
        });
      } else {
        filteredCategories[categoryName] = exams;
      }
    }

    // Return just the filtered categories object
    return res.status(200).json(filteredCategories);
  } catch (err) {
    console.error('Error fetching exam catalog:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
