import fs from 'fs';
import path from 'path';

const targetDir = 'zextra';

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const itemsToMove = [
  'find_changes.js',
  'possiblefields.json',
  'tmp-cds-exam-raw.json',
  'tmp-find-missing-linked-entries.out.txt',
  'temp_git_repair',
  'other files',
  'clean_showcase_fields.mjs',
  'cleanup-non-defence.mjs',
  'extract-exams.mjs',
  'reorganize-exams.mjs',
  'sync-cds-to-mongo.mjs'
];

for (const item of itemsToMove) {
  if (fs.existsSync(item)) {
    const dest = path.join(targetDir, item);
    try {
      fs.renameSync(item, dest);
      console.log(`Successfully moved ${item} to ${targetDir}`);
    } catch (err) {
      console.error(`Failed to move ${item}:`, err.message);
    }
  }
}
