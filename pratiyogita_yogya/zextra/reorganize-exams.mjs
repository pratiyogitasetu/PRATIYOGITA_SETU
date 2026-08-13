/**
 * Reorganize exam_data files into category folders.
 * 
 * Takes files like: EXAMSDATA/exam_data/DEFENCE_EXAMS__cds.json
 * And copies them to: EXAMSDATA/DEFENCE_EXAMS/cds.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXAMS_DIR = path.join(__dirname, 'EXAMSDATA');
const EXAM_DATA_DIR = path.join(EXAMS_DIR, 'exam_data');

const files = fs.readdirSync(EXAM_DATA_DIR).filter(f => f.endsWith('.json'));

let copied = 0;

for (const file of files) {
  // file = "DEFENCE_EXAMS__cds.json"
  const baseName = file.replace(/\.json$/, ''); // "DEFENCE_EXAMS__cds"
  const sepIndex = baseName.indexOf('__');
  
  if (sepIndex === -1) {
    console.log(`⚠️  Skipping (no __ separator): ${file}`);
    continue;
  }

  const category = baseName.slice(0, sepIndex);   // "DEFENCE_EXAMS"
  const examName = baseName.slice(sepIndex + 2);   // "cds"

  const categoryDir = path.join(EXAMS_DIR, category);
  fs.mkdirSync(categoryDir, { recursive: true });

  const srcPath = path.join(EXAM_DATA_DIR, file);
  const destPath = path.join(categoryDir, `${examName}.json`);

  fs.copyFileSync(srcPath, destPath);
  copied++;
  console.log(`✅ ${category}/${examName}.json`);
}

// Clean up empty category folders
const allDirs = fs.readdirSync(EXAMS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'exam_data' && d.name !== 'checker');

for (const dir of allDirs) {
  const dirPath = path.join(EXAMS_DIR, dir.name);
  const contents = fs.readdirSync(dirPath);
  if (contents.length === 0) {
    fs.rmdirSync(dirPath);
    console.log(`🗑️  Removed empty folder: ${dir.name}/`);
  }
}

console.log(`\n🎉 Done! Copied ${copied} exam files into category folders.`);
