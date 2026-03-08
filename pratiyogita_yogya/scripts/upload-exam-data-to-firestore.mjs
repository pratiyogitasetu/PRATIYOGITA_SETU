import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { buildExamDataDocId } from '../src/eligibility/examDataDocId.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const examDataRoot = path.join(projectRoot, 'public', 'examsdata');

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function getCredentialOptions() {
  return { credential: applicationDefault() };
}

async function main() {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    const absolutePath = path.isAbsolute(serviceAccountPath)
      ? serviceAccountPath
      : path.resolve(projectRoot, serviceAccountPath);
    const serviceAccount = await readJson(absolutePath);
    initializeApp({ credential: cert(serviceAccount) });
  } else {
    initializeApp(getCredentialOptions());
  }

  const db = getFirestore();

  const catalog = await readJson(path.join(examDataRoot, 'allexamnames.json'));
  const examDataCollection = process.env.EXAM_DATA_COLLECTION || 'examData';
  const examCatalogCollection = process.env.EXAM_CATALOG_COLLECTION || 'examCatalog';
  const examCatalogDocId = process.env.EXAM_CATALOG_DOC_ID || 'allExamNames';

  const linkedExams = [];
  for (const [category, exams] of Object.entries(catalog)) {
    if (!Array.isArray(exams)) continue;

    for (const exam of exams) {
      if (!exam?.linked_json_file) continue;
      linkedExams.push({ category, ...exam });
    }
  }

  let batch = db.batch();
  let ops = 0;
  let saved = 0;

  const commitBatch = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (const exam of linkedExams) {
    const sourcePath = path.join(examDataRoot, exam.linked_json_file);
    const payload = await readJson(sourcePath);

    const docId = buildExamDataDocId(exam.linked_json_file);
    const ref = db.collection(examDataCollection).doc(docId);

    batch.set(ref, {
      linked_json_file: exam.linked_json_file,
      exam_code: exam.exam_code,
      exam_name: exam.exam_name,
      category: exam.category,
      payload,
      updatedAt: FieldValue.serverTimestamp(),
    });

    ops += 1;
    saved += 1;

    if (ops >= 450) {
      await commitBatch();
    }
  }

  const catalogRef = db.collection(examCatalogCollection).doc(examCatalogDocId);
  batch.set(catalogRef, {
    categories: catalog,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  ops += 1;

  await commitBatch();

  console.log(`Uploaded ${saved} exam payloads + catalog to Firestore.`);
  console.log(`Catalog: ${examCatalogCollection}/${examCatalogDocId}`);
  console.log(`Payload collection: ${examDataCollection}`);
}

main().catch((error) => {
  console.error('Upload failed:', error);
  process.exit(1);
});
