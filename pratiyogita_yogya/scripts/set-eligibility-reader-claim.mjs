import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function initAdmin() {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (serviceAccountPath) {
    const absolutePath = path.isAbsolute(serviceAccountPath)
      ? serviceAccountPath
      : path.resolve(projectRoot, serviceAccountPath);
    const serviceAccount = await readJson(absolutePath);
    initializeApp({ credential: cert(serviceAccount) });
    return;
  }

  initializeApp({ credential: applicationDefault() });
}

async function main() {
  const uid = process.argv[2];
  if (!uid) {
    console.error('Usage: node scripts/set-eligibility-reader-claim.mjs <firebase-uid> [true|false]');
    process.exit(1);
  }

  const enabledArg = (process.argv[3] || 'true').toLowerCase();
  const enabled = enabledArg !== 'false';

  await initAdmin();

  const auth = getAuth();
  const user = await auth.getUser(uid);
  const currentClaims = user.customClaims || {};

  await auth.setCustomUserClaims(uid, {
    ...currentClaims,
    eligibility_reader: enabled,
  });

  console.log(`Set custom claim eligibility_reader=${enabled} for uid=${uid}`);
}

main().catch((error) => {
  console.error('Failed to set custom claim:', error);
  process.exit(1);
});
