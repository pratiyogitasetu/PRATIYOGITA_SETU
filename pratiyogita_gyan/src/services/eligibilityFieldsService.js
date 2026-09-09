/**
 * Service to dynamically fetch eligibility fields and dropdowns directly from MongoDB Atlas
 * (served via dev-api-server /api/exams/eligibility-fields)
 */

const API_BASE = 'http://localhost:3000/api/exams/eligibility-fields';
let cachedFields = null;
let fetchPromise = null;

export async function fetchEligibilityFields() {
  if (cachedFields) return cachedFields;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const response = await fetch(API_BASE);
      if (!response.ok) {
        throw new Error(`Failed to fetch eligibility fields: HTTP ${response.status}`);
      }
      const data = await response.json();
      cachedFields = data;
      return data;
    } catch (err) {
      console.error('Error fetching eligibility fields from MongoDB:', err);
      throw err;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export async function getGenderOptionsFromMongo() {
  const fields = await fetchEligibilityFields();
  const list = Array.isArray(fields.gender) ? fields.gender : [];
  return list.map((val) => ({
    value: val,
    label: val === 'MALE' ? 'Male' : val === 'FEMALE' ? 'Female' : val === 'TRANSGENDER' ? 'Transgender' : val
  }));
}

export async function getMaritalStatusOptionsFromMongo(gender = null) {
  const fields = await fetchEligibilityFields();
  const normalized = gender ? gender.trim().toUpperCase() : '';
  let list = [];

  if (normalized && Array.isArray(fields?.[normalized])) {
    list = fields[normalized];
  } else if (fields?.marital_status && typeof fields.marital_status === 'object') {
    if (normalized && Array.isArray(fields.marital_status[normalized])) {
      list = fields.marital_status[normalized];
    } else {
      const all = new Set();
      Object.values(fields.marital_status).forEach((arr) => {
        if (Array.isArray(arr)) arr.forEach((item) => all.add(item));
      });
      list = Array.from(all);
    }
  }

  if (list.length === 0) {
    const combined = new Set([
      ...(Array.isArray(fields?.MALE) ? fields.MALE : []),
      ...(Array.isArray(fields?.FEMALE) ? fields.FEMALE : []),
      ...(Array.isArray(fields?.TRANSGENDER) ? fields.TRANSGENDER : [])
    ]);
    list = Array.from(combined);
  }

  return list.map((val) => ({
    value: val,
    label: val
  }));
}

export async function getNationalityOptionsFromMongo() {
  const fields = await fetchEligibilityFields();
  const list = Array.isArray(fields.nationality) ? fields.nationality : [];
  return list.map((val) => ({
    value: val,
    label: val
  }));
}

export async function getDomicileOptionsFromMongo() {
  const fields = await fetchEligibilityFields();
  const list = Array.isArray(fields.domicile) ? fields.domicile : [];
  return list.map((val) => ({
    value: val,
    label: val
  }));
}

export async function getCasteCategoryOptionsFromMongo() {
  const fields = await fetchEligibilityFields();
  const list = Array.isArray(fields.caste_category) ? fields.caste_category : [];
  return list.map((val) => ({
    value: val,
    label: val
  }));
}

export async function getHighestEducationOptionsFromMongo() {
  const fields = await fetchEligibilityFields();
  const list = Array.isArray(fields.highest_education_qualification) ? fields.highest_education_qualification : [];
  return list.map((val) => ({
    value: val,
    label: val
  }));
}

export async function getNccWingOptionsFromMongo() {
  const fields = await fetchEligibilityFields();
  const list = Array.isArray(fields.ncc_wing) ? fields.ncc_wing : [];
  return list.map((val) => ({
    value: val,
    label: val
  }));
}

export async function getNccCertificateOptionsFromMongo() {
  const fields = await fetchEligibilityFields();
  const list = Array.isArray(fields.ncc_certificate) ? fields.ncc_certificate : [];
  return list.map((val) => ({
    value: val,
    label: val
  }));
}

export async function getNccCertificateGradeOptionsFromMongo() {
  const fields = await fetchEligibilityFields();
  const list = Array.isArray(fields.ncc_certificate_grade) ? fields.ncc_certificate_grade : [];
  return list.map((val) => ({
    value: val,
    label: val
  }));
}

const LEVEL_KEY_MAP = {
  'POST DOCTORATE': 'post_doctorate',
  'PHD': 'phd',
  'POST GRADUATION': 'post_graduation',
  'GRADUATION': 'graduation',
  'DIPLOMA / ITI (POLYTECHNIC, ITI, DPHARM, PGDCA)': 'diploma',
  '(12TH)HIGHER SECONDARY': '12th_higher_secondary',
  '(10TH)SECONDARY': '10th_secondary',
  '(8TH)MIDDLE SCHOOL': '8TH',
  '(5TH)PRIMARY SCHOOL': '5TH',
};

export async function getCoursesForTierFromMongo(tierKey) {
  const fields = await fetchEligibilityFields();
  const mappedKey = LEVEL_KEY_MAP[tierKey] || tierKey;
  const levelData = fields.education_levels?.[mappedKey] || fields.education_levels?.[tierKey];
  if (!levelData) return [];
  if (Array.isArray(levelData.course?.options)) {
    return levelData.course.options;
  }
  if (Array.isArray(levelData.course_stream?.options)) {
    return levelData.course_stream.options;
  }
  return [];
}

export async function getSubjectsForCourseFromMongo(tierKey, courseName) {
  const fields = await fetchEligibilityFields();
  const mappedKey = LEVEL_KEY_MAP[tierKey] || tierKey;
  const levelData = fields.education_levels?.[mappedKey] || fields.education_levels?.[tierKey];
  if (!levelData?.subject) return [];
  if (courseName && Array.isArray(levelData.subject[courseName])) {
    return levelData.subject[courseName];
  }
  if (Array.isArray(levelData.subject.options)) {
    return levelData.subject.options;
  }
  return [];
}
