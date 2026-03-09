/**
 * End-to-end test: Verify both Exam Basis and Eligibility Basis data retrieval
 * works with the new category-based MongoDB collections.
 *
 * Tests:
 * 1. Catalog loads successfully
 * 2. Every linked exam can be fetched by its pathToDocId
 * 3. Bulk loading works (eligibility basis mode)
 *
 * Usage: node scripts/test-data-retrieval.mjs
 */

const BASE = 'http://localhost:3000';

function pathToDocId(linkedJsonFile) {
  return linkedJsonFile.replace(/\.json$/i, '').replace(/\//g, '__');
}

async function main() {
  console.log('=== Testing Data Retrieval (Exam Basis + Eligibility Basis) ===\n');

  // 1. Fetch catalog
  console.log('1. Fetching catalog...');
  const catRes = await fetch(`${BASE}/api/exams/catalog`);
  if (!catRes.ok) {
    console.error(`   ❌ Catalog fetch failed: HTTP ${catRes.status}`);
    process.exit(1);
  }
  const catalog = await catRes.json();
  const categories = Object.keys(catalog);
  console.log(`   ✅ Catalog loaded: ${categories.length} categories\n`);

  // 2. Collect all linked exams (same as getLinkedExams())
  const linkedExams = [];
  for (const [category, exams] of Object.entries(catalog)) {
    for (const exam of exams) {
      if (exam.linked_json_file && exam.linked_json_file !== '') {
        linkedExams.push({
          category,
          exam_name: exam.exam_name,
          exam_code: exam.exam_code,
          linked_json_file: exam.linked_json_file,
          has_divisions: exam.has_divisions || false,
        });
      }
    }
  }
  console.log(`2. Found ${linkedExams.length} exams with linked data\n`);

  // 3. EXAM BASIS TEST: Fetch each exam individually (simulates selecting an exam)
  console.log('3. EXAM BASIS — Fetching each exam individually:');
  let examBasisPass = 0;
  let examBasisFail = 0;

  for (const exam of linkedExams) {
    const docId = pathToDocId(exam.linked_json_file);
    const url = `${BASE}/api/exams/${encodeURIComponent(docId)}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const hasName = !!data.exam_name || !!data.exam_code;
        if (hasName) {
          console.log(`   ✅ ${exam.exam_code.padEnd(25)} → ${docId} → ${data.exam_name || data.exam_code}`);
          examBasisPass++;
        } else {
          console.log(`   ⚠️  ${exam.exam_code.padEnd(25)} → ${docId} → Data loaded but no exam_name/exam_code`);
          examBasisPass++;
        }
      } else {
        console.log(`   ❌ ${exam.exam_code.padEnd(25)} → ${docId} → HTTP ${res.status}`);
        examBasisFail++;
      }
    } catch (err) {
      console.log(`   ❌ ${exam.exam_code.padEnd(25)} → ${docId} → ${err.message}`);
      examBasisFail++;
    }
  }
  console.log(`\n   Exam Basis: ${examBasisPass} pass, ${examBasisFail} fail\n`);

  // 4. ELIGIBILITY BASIS TEST: Bulk load all exams (simulates "check all exams")
  console.log('4. ELIGIBILITY BASIS — Bulk loading all exams:');
  const bulkStart = Date.now();
  const bulkResults = {};
  let bulkPass = 0;
  let bulkFail = 0;

  const promises = linkedExams.map(async (exam) => {
    const docId = pathToDocId(exam.linked_json_file);
    try {
      const res = await fetch(`${BASE}/api/exams/${encodeURIComponent(docId)}`);
      if (res.ok) {
        bulkResults[exam.linked_json_file] = await res.json();
        bulkPass++;
      } else {
        bulkFail++;
      }
    } catch {
      bulkFail++;
    }
  });

  await Promise.all(promises);
  const bulkTime = Date.now() - bulkStart;

  console.log(`   ✅ Loaded ${bulkPass}/${linkedExams.length} exams in ${bulkTime}ms`);
  if (bulkFail > 0) {
    console.log(`   ❌ ${bulkFail} failed`);
  }

  // 5. Verify exam data has required fields for eligibility checking
  console.log('\n5. Verifying exam data structure for eligibility checks:');
  const requiredFields = ['gender', 'nationality', 'highest_education_qualification'];
  const sessionFields = ['between_dob', 'between_age', 'minimum_dob', 'maximum_dob', 'starting_age', 'ending_age', 'no_age_limit'];

  let structureOk = 0;
  let structureWarn = 0;

  for (const exam of linkedExams) {
    const data = bulkResults[exam.linked_json_file];
    if (!data) continue;

    const examLabel = (data.exam_code || exam.exam_code).padEnd(25);

    // For division-based exams, check the division data
    if (exam.has_divisions && data.academies) {
      const divKeys = Object.keys(data.academies);
      let allDivsOk = true;
      for (const div of divKeys) {
        const divData = data.academies[div];
        const missingFields = requiredFields.filter(f => !divData[f] && divData[f] !== '');
        const hasSession = sessionFields.some(f => divData[f] && typeof divData[f] === 'object');
        if (missingFields.length > 0 || !hasSession) {
          allDivsOk = false;
        }
      }
      if (allDivsOk) {
        console.log(`   ✅ ${examLabel} (${divKeys.length} divisions)`);
        structureOk++;
      } else {
        console.log(`   ⚠️  ${examLabel} (division data may be incomplete)`);
        structureWarn++;
      }
    } else {
      // Non-division exam
      const missingFields = requiredFields.filter(f => !data[f] && data[f] !== '');
      const hasSession = sessionFields.some(f => data[f] && typeof data[f] === 'object');

      if (missingFields.length === 0 && hasSession) {
        console.log(`   ✅ ${examLabel}`);
        structureOk++;
      } else {
        const issues = [];
        if (missingFields.length > 0) issues.push(`missing: ${missingFields.join(', ')}`);
        if (!hasSession) issues.push('no session/DOB data');
        console.log(`   ⚠️  ${examLabel} (${issues.join('; ')})`);
        structureWarn++;
      }
    }
  }

  // 6. Count endpoint
  console.log('\n6. Count endpoint:');
  const countRes = await fetch(`${BASE}/api/exams/count`);
  const countData = await countRes.json();
  console.log(`   Total exams in DB: ${countData.count}`);
  console.log(`   Linked exams in catalog: ${linkedExams.length}`);

  // Summary
  console.log('\n═══════════════════════════════════════');
  console.log('SUMMARY:');
  console.log(`  Exam Basis (single fetch):     ${examBasisPass}/${linkedExams.length} ✅`);
  console.log(`  Eligibility Basis (bulk fetch): ${bulkPass}/${linkedExams.length} ✅ (${bulkTime}ms)`);
  console.log(`  Data structure checks:          ${structureOk} ok, ${structureWarn} warnings`);

  if (examBasisFail === 0 && bulkFail === 0) {
    console.log('\n✅ ALL TESTS PASSED — Both modes are working correctly!');
  } else {
    console.log('\n❌ Some tests failed — see details above.');
  }
  console.log('═══════════════════════════════════════\n');
}

main().catch(console.error);
