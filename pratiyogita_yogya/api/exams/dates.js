/**
 * GET /api/exams/dates
 * Returns all exam dates across all exams for calendar display.
 * 
 * Response format:
 * [
 *   {
 *     exam_name: "Combined Defence Services Examination (I), 2026",
 *     exam_code: "CDS",
 *     category: "DEFENCE_EXAMS",
 *     starting_date_to_apply: "13-05-2026",
 *     last_date_to_apply: "09-06-2026",
 *     exam_date: "02-10-2026"
 *   },
 *   ...
 * ]
 */

import { connectToDatabase } from '../db.js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();

    // First, get the catalog to know all categories and exams
    const catalog = await db
      .collection('exam_catalog')
      .findOne({ _id: 'master_catalog' });

    if (!catalog || !catalog.categories) {
      return res.status(200).json([]);
    }

    const allDates = [];
    const categories = catalog.categories;

    // For each category, query the collection for exams that have date fields
    for (const [categoryName, exams] of Object.entries(categories)) {
      if (!Array.isArray(exams)) continue;

      // Get exams that have linked JSON files
      const linkedExams = exams.filter(e => e.linked_json_file && e.linked_json_file !== '');

      for (const exam of linkedExams) {
        try {
          // Convert linked_json_file path to doc ID
          const docId = exam.linked_json_file
            .replace(/\.json$/i, '')
            .replace(/\//g, '__');

          const sepIndex = docId.indexOf('__');
          if (sepIndex === -1) continue;

          const collectionName = docId.slice(0, sepIndex);
          const docName = docId.slice(sepIndex + 2);

          const examDoc = await db
            .collection(collectionName)
            .findOne({ _id: docName });

          if (!examDoc) continue;

          // Only include if at least one date field exists
          const hasAnyDate = examDoc.starting_date_to_apply || 
                             examDoc.last_date_to_apply || 
                             examDoc.exam_date;

          if (hasAnyDate) {
            allDates.push({
              exam_name: examDoc.exam_name || exam.exam_name || '',
              exam_code: examDoc.exam_code || exam.exam_code || '',
              category: categoryName,
              starting_date_to_apply: examDoc.starting_date_to_apply || '',
              last_date_to_apply: examDoc.last_date_to_apply || '',
              exam_date: examDoc.exam_date || ''
            });
          }
        } catch (innerErr) {
          console.error(`Error loading dates for ${exam.exam_name}:`, innerErr);
        }
      }
    }

    return res.status(200).json(allDates);
  } catch (err) {
    console.error('Error fetching exam dates:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
