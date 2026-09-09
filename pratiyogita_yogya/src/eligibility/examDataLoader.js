/**
 * Exam Data Loader Utility
 * For PRATIYOGITA YOGYA - Exam Eligibility Tracker
 * 
 * This module loads exam catalog and exam payloads from MongoDB Atlas via API.
 */

let allExamNamesCache = null;
let catalogLoadPromise = null;

// ============================================
// EXAM NAMES AND CATEGORIES
// ============================================

const normalizeCatalogPayload = (payload) => {
    if (!payload || typeof payload !== 'object') return {};
    if (payload.categories && typeof payload.categories === 'object') {
        return payload.categories;
    }
    return payload;
};

/**
 * Ensure exam catalog is loaded from local JSON.
 * @returns {Promise<Record<string, any>>}
 */
export const ensureExamCatalogLoaded = async () => {
    if (allExamNamesCache) return allExamNamesCache;
    if (catalogLoadPromise) return catalogLoadPromise;

    catalogLoadPromise = (async () => {
        const response = await fetch('/api/exams/catalog');
        if (!response.ok) {
            throw new Error(`Failed to load exam catalog (HTTP ${response.status})`);
        }
        const data = await response.json();
        allExamNamesCache = normalizeCatalogPayload(data);
        return allExamNamesCache;
    })();

    return await catalogLoadPromise.finally(() => {
        catalogLoadPromise = null;
    });
};

/**
 * Get all exam categories (folder names)
 * @returns {string[]} - Array of category names like "DEFENCE_EXAMS", "UG_EXAMS", etc.
 */
export const getAllCategories = () => {
    return Object.keys(allExamNamesCache || {});
};

/**
 * Get all exams in a specific category
 * @param {string} category - Category name like "DEFENCE_EXAMS"
 * @returns {Array} - Array of exam objects
 */
export const getExamsByCategory = (category) => {
    return (allExamNamesCache && allExamNamesCache[category]) || [];
};

/**
 * Get only exams that have linked JSON files (data available)
 * @returns {Array} - Array of {category, exam} objects
 */
export const getLinkedExams = () => {
    const linkedExams = [];
    const catalog = allExamNamesCache || {};

    Object.entries(catalog).forEach(([category, exams]) => {
        exams.forEach(exam => {
            if (exam.linked_json_file && exam.linked_json_file !== '') {
                linkedExams.push({
                    category,
                    exam_name: exam.exam_name,
                    exam_code: exam.exam_code,
                    linked_json_file: exam.linked_json_file,
                    has_divisions: exam.has_divisions || false
                });
            }
        });
    });

    return linkedExams;
};

/**
 * Get exam info by exam name
 * @param {string} examName - Exam name like "CDS"
 * @returns {Object|null} - Exam object with category info or null
 */
export const getExamByName = (examName) => {
    const catalog = allExamNamesCache || {};

    for (const [category, exams] of Object.entries(catalog)) {
        const exam = exams.find(e =>
            e.exam_name.toUpperCase() === examName.toUpperCase() ||
            e.exam_code.toUpperCase() === examName.toUpperCase()
        );
        if (exam) {
            return {
                category,
                ...exam
            };
        }
    }
    return null;
};

// ============================================
// EXAM DATA LOADING
// ============================================

/**
 * Cache for loaded exam data
 */
const examDataCache = {};

/**
 * Load exam JSON data from local files
 * @param {string} linkedJsonFile - Path like "DEFENCE_EXAMS/cds.json"
 * @returns {Promise<Object|null>} - Exam data object or null
 */
/**
 * Convert a linked_json_file path to a MongoDB document ID
 * e.g., "DEFENCE_EXAMS/cds.json" → "DEFENCE_EXAMS__cds"
 */
const pathToDocId = (linkedJsonFile) => {
    return linkedJsonFile
        .replace(/\.json$/i, '')
        .replace(/\//g, '__');
};

export const loadExamData = async (linkedJsonFile) => {
    if (!linkedJsonFile) return null;

    // Check cache first
    if (examDataCache[linkedJsonFile]) {
        return examDataCache[linkedJsonFile];
    }

    try {
        const docId = pathToDocId(linkedJsonFile);
        const response = await fetch(`/api/exams/${encodeURIComponent(docId)}`);
        if (!response.ok) {
            console.error(`Exam data not found for: ${linkedJsonFile}`);
            return null;
        }

        const payload = await response.json();
        examDataCache[linkedJsonFile] = payload;
        return payload;
    } catch (error) {
        console.error(`Error loading exam data (${linkedJsonFile}):`, error);
        return null;
    }
};

/**
 * Load exam data by exam name
 * @param {string} examName - Exam name like "CDS"
 * @returns {Promise<Object|null>} - Exam data object or null
 */
export const loadExamDataByName = async (examName) => {
    await ensureExamCatalogLoaded();

    const examInfo = getExamByName(examName);
    if (!examInfo || !examInfo.linked_json_file) {
        console.warn(`No linked JSON file found for exam: ${examName}`);
        return null;
    }

    return await loadExamData(examInfo.linked_json_file);
};

/**
 * Load multiple exam payloads from local JSON files.
 * @param {string[]} linkedJsonFiles
 * @returns {Promise<Record<string, any>>}
 */
export const loadExamDataBulk = async (linkedJsonFiles = []) => {
    const files = Array.from(new Set((linkedJsonFiles || []).filter(Boolean)));
    const loadedMap = {};

    if (files.length === 0) return loadedMap;

    const missingFiles = [];

    files.forEach((file) => {
        if (examDataCache[file]) {
            loadedMap[file] = examDataCache[file];
        } else {
            missingFiles.push(file);
        }
    });

    if (missingFiles.length === 0) {
        return loadedMap;
    }

    await Promise.all(
        missingFiles.map(async (file) => {
            const data = await loadExamData(file);
            if (data) {
                loadedMap[file] = data;
            }
        })
    );

    return loadedMap;
};

/**
 * Preload all available exam data into cache
 * @returns {Promise<Object>} - Object with exam names as keys and data as values
 */
export const preloadAllExamData = async () => {
    await ensureExamCatalogLoaded();

    const linkedExams = getLinkedExams();
    const linkedFiles = linkedExams.map((examInfo) => examInfo.linked_json_file);
    const bulk = await loadExamDataBulk(linkedFiles);
    const loadedData = {};

    linkedExams.forEach((examInfo) => {
        const data = bulk[examInfo.linked_json_file];
        if (data) {
            loadedData[examInfo.exam_name] = data;
        }
    });

    return loadedData;
};

// ============================================
// EXAM OPTIONS FOR DROPDOWNS
// ============================================

/**
 * Get exam options for dropdown (only exams with linked data)
 * @returns {Array} - Array of {value, label, category, hasDivisions} objects
 */
export const getExamDropdownOptions = () => {
    const linkedExams = getLinkedExams();

    return linkedExams.map(exam => ({
        value: exam.exam_code,
        label: exam.exam_name,
        category: exam.category,
        hasDivisions: exam.has_divisions,
        linkedFile: exam.linked_json_file
    }));
};

/**
 * Get exam options grouped by category
 * @returns {Object} - Object with categories as keys and arrays of exam options
 */
export const getExamOptionsGroupedByCategory = () => {
    const linkedExams = getLinkedExams();
    const grouped = {};

    linkedExams.forEach(exam => {
        const categoryLabel = formatCategoryName(exam.category);
        if (!grouped[categoryLabel]) {
            grouped[categoryLabel] = [];
        }
        grouped[categoryLabel].push({
            value: exam.exam_code,
            label: exam.exam_name,
            hasDivisions: exam.has_divisions,
            linkedFile: exam.linked_json_file
        });
    });

    return grouped;
};

/**
 * Format category name for display
 * @param {string} category - Category like "DEFENCE_EXAMS"
 * @returns {string} - Formatted name like "Defence"
 */
export const formatCategoryName = (category) => {
    if (!category) return '';

    const categoryMap = {
        'SSC_EXAMS': 'SSC Exams',
        'DEFENCE_EXAMS': 'Defence Exams',
        'PG_EXAMS': 'Postgraduate Exams',
        'BANKING_EXAMS': 'Banking Exams',
        'RAILWAY_EXAMS': 'Railway Exams',
        'TEACHING_EXAMS': 'Teaching Exams',
        'CIVIL_SERVICES_EXAMS': 'Civil Services',
        'POLICE_EXAMS': 'Police Exams',
        'ENGINEERING_RECRUITING_EXAMS': 'Engineering Recruitment',
        'CUET_AND_UG_ENTRANCE_EXAMS': 'CUET & UG Entrance Exams',
        'INSURANCES_EXAMS': 'Insurance Exams',
        'MBA_EXAMS': 'MBA Exams',
        'SCHOOL_EXAMS': 'School Level Exams',
        'NURSING_EXAMS': 'Nursing Exams',
        'JUDICIARY_EXAMS': 'Judiciary Exams'
    };



    return categoryMap[category] || category
        .replace(/_EXAMS$/i, '')
        .replace(/_ED$/i, '')
        .replace(/_/g, ' ')
        .trim();
};

// ============================================
// DIVISION HANDLING
// ============================================

/**
 * Get divisions for an exam
 * @param {Object} examData - Loaded exam data
 * @returns {Array} - Array of {value, label} objects for dropdown
 */
export const getDivisionOptions = (examData) => {
    if (!examData || !examData.posts_classes_courses_departments_academies) {
        return [];
    }

    const divisionsStr = examData.posts_classes_courses_departments_academies;
    const divisions = divisionsStr.split(',').map(d => d.trim()).filter(d => d !== '');

    return divisions.map(div => ({
        value: div,
        label: div
    }));
};

/**
 * Get division-specific data
 * @param {Object} examData - Loaded exam data
 * @param {string} divisionName - Division name like "IMA", "CLASS VI", etc.
 * @returns {Object|null} - Division data or null
 */
export const getDivisionData = (examData, divisionName) => {
    if (!examData || !divisionName) {
        return null;
    }

    // Check multiple possible container fields
    const containerFields = ['academies', 'posts', 'departments', 'courses', 'classes'];

    for (const field of containerFields) {
        if (examData[field]) {
            // Try exact match first
            if (examData[field][divisionName]) {
                return examData[field][divisionName];
            }
            // Try with underscore (e.g., "CLASS VI" -> "CLASS_VI")
            const underscoreKey = divisionName.replace(/ /g, '_');
            if (examData[field][underscoreKey]) {
                return examData[field][underscoreKey];
            }
            // Try with space (e.g., "CLASS_VI" -> "CLASS VI")
            const spaceKey = divisionName.replace(/_/g, ' ');
            if (examData[field][spaceKey]) {
                return examData[field][spaceKey];
            }
        }
    }

    return null;
};

/**
 * Check if exam has divisions
 * @param {Object} examData - Loaded exam data
 * @returns {boolean}
 */
export const examHasDivisions = (examData) => {
    return examData &&
        examData.posts_classes_courses_departments_academies &&
        examData.posts_classes_courses_departments_academies.trim() !== '' &&
        examData.academies !== undefined;
};

// ============================================
// EXAM SESSION HANDLING
// ============================================

/**
 * Caste category keys used to detect caste-wise DOB structure
 */
const CASTE_KEYS = ['GEN', 'OBC', 'EWS', 'SC', 'ST'];

/**
 * Get available exam sessions from exam data
 * Checks multiple session-based fields: between_dob, between_age, minimum_dob, maximum_dob, starting_age, ending_age
 * 
 * Handles TWO structures:
 * 1. Flat: { "2026-I": "...", "2026-II": "..." } → CDS type
 * 2. Caste-wise: { "GEN": { "2026": "..." }, "OBC": { "2026": "..." } } → SBI PO type
 * 
 * @param {Object} examData - Exam data (can be division-specific)
 * @returns {Array} - Array of {value, label} objects for dropdown
 */
export const getExamSessionOptions = (examData) => {
    if (!examData) {
        return [];
    }

    // List of fields that can have session-based data (including no_age_limit for exams without age restriction)
    const sessionFields = ['between_dob', 'between_age', 'minimum_dob', 'maximum_dob', 'starting_age', 'ending_age', 'no_age_limit'];

    for (const fieldName of sessionFields) {
        let fieldData = examData[fieldName];

        if (!fieldData) continue;

        // Handle nested structure with grouped candidate buckets
        if (fieldData.regular_candidates) {
            fieldData = fieldData.regular_candidates;
        }

        // Check if it's an object with session keys (not a simple string)
        if (typeof fieldData === 'object' && !Array.isArray(fieldData)) {
            let keys = Object.keys(fieldData);

            // Check if first key is a caste category (GEN, OBC, SC, ST, EWS)
            // This handles caste-wise DOB structures like SBI PO
            const firstKey = keys[0]?.toUpperCase();
            if (CASTE_KEYS.includes(firstKey)) {
                // Caste-wise structure - drill into first caste to get session keys
                const casteData = fieldData[keys[0]];
                if (casteData && typeof casteData === 'object') {
                    keys = Object.keys(casteData);
                }
            }

            // Verify at least one key looks like a session (contains year)
            if (keys.length > 0 && keys.some(k => /\d{4}/.test(k))) {
                return keys.map(session => ({
                    value: session,
                    label: session.replace(/-/g, ' ')
                }));
            }
        }
    }

    // ============================================
    // FALLBACK: Check completed_year in education_levels
    // For exams like JEE Main that have NO_AGE_LIMIT but have
    // session-based passing year criteria in education_levels
    // ============================================
    const educationLevels = examData.education_levels;
    if (educationLevels && typeof educationLevels === 'object') {
        // Check each education level for completed_year with session keys
        for (const levelKey of Object.keys(educationLevels)) {
            const levelData = educationLevels[levelKey];
            if (levelData && typeof levelData === 'object') {
                const completedYear = levelData.completed_year;
                if (completedYear && typeof completedYear === 'object' && !Array.isArray(completedYear)) {
                    const keys = Object.keys(completedYear);
                    // Verify keys look like sessions (contain year)
                    if (keys.length > 0 && keys.some(k => /\d{4}/.test(k))) {
                        return keys.map(session => ({
                            value: session,
                            label: session.replace(/-/g, ' ')
                        }));
                    }
                }
            }
        }
    }

    return [];
};

// ============================================
// ELIGIBILITY FIELDS (from MongoDB)
// ============================================

let eligibilityFieldsCache = null;
let eligibilityFieldsPromise = null;

/**
 * Load eligibility_fields document directly from MongoDB via API
 * @returns {Promise<Object>}
 */
export const loadEligibilityFieldsFromMongo = async () => {
    if (eligibilityFieldsCache) return eligibilityFieldsCache;
    if (eligibilityFieldsPromise) return eligibilityFieldsPromise;

    eligibilityFieldsPromise = (async () => {
        const apiUrl = typeof window !== 'undefined'
            ? '/api/exams/eligibility-fields'
            : (typeof process !== 'undefined' && process.env?.API_BASE_URL ? process.env.API_BASE_URL : 'http://localhost:3000') + '/api/exams/eligibility-fields';
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Failed to load eligibility fields from MongoDB (HTTP ${response.status})`);
        }
        const data = await response.json();
        eligibilityFieldsCache = data;
        return data;
    })();

    return await eligibilityFieldsPromise.finally(() => {
        eligibilityFieldsPromise = null;
    });
};

export const getCachedEligibilityFields = () => eligibilityFieldsCache || {};
export const getCachedNationalities = () => eligibilityFieldsCache?.nationality || [];
export const getCachedDomiciles = () => eligibilityFieldsCache?.domicile || [];
export const getCachedCasteCategories = () => eligibilityFieldsCache?.caste_category || [];
export const getCachedNccWings = () => eligibilityFieldsCache?.ncc_wing || [];
export const getCachedNccCertificates = () => eligibilityFieldsCache?.ncc_certificate || [];
export const getCachedNccCertificateGrades = () => eligibilityFieldsCache?.ncc_certificate_grade || [];
export const getCachedHighestEducationQualification = () => eligibilityFieldsCache?.highest_education_qualification || [];
export const getCachedEducationLevels = () => eligibilityFieldsCache?.education_levels || {};

export const getMongoNationalities = async () => {
    const data = await loadEligibilityFieldsFromMongo();
    return Array.isArray(data?.nationality) ? data.nationality : [];
};

export const getMongoDomiciles = async () => {
    const data = await loadEligibilityFieldsFromMongo();
    return Array.isArray(data?.domicile) ? data.domicile : [];
};

export const getMongoCasteCategories = async () => {
    const data = await loadEligibilityFieldsFromMongo();
    return Array.isArray(data?.caste_category) ? data.caste_category : [];
};

export const getMongoNccWings = async () => {
    const data = await loadEligibilityFieldsFromMongo();
    return Array.isArray(data?.ncc_wing) ? data.ncc_wing : [];
};

export const getMongoNccCertificates = async () => {
    const data = await loadEligibilityFieldsFromMongo();
    return Array.isArray(data?.ncc_certificate) ? data.ncc_certificate : [];
};

export const getMongoNccCertificateGrades = async () => {
    const data = await loadEligibilityFieldsFromMongo();
    return Array.isArray(data?.ncc_certificate_grade) ? data.ncc_certificate_grade : [];
};

export const formatEducationLabel = (val) => {
    if (!val || typeof val !== 'string') return '';
    if (val === 'PHD') return 'PhD';
    if (val === 'POST DOCTORATE') return 'Post Doctorate';
    if (val === 'POST GRADUATION') return 'Post Graduation';
    if (val === 'GRADUATION') return 'Graduation';
    if (val === 'DIPLOMA / ITI (POLYTECHNIC, ITI, DPHARM, PGDCA)') return 'Diploma / ITI';
    if (val === '(12TH)HIGHER SECONDARY' || val === '(12TH) HIGHER SECONDARY') return 'Higher Secondary (12th)';
    if (val === '(10TH)SECONDARY' || val === '(10TH) SECONDARY') return 'Secondary (10th)';
    if (val === '(8TH)MIDDLE SCHOOL' || val === '(8TH) MIDDLE SCHOOL' || val === '(8TH)CLASS') return 'Class 8th';
    if (val === '(5TH)PRIMARY SCHOOL' || val === '(5TH) PRIMARY SCHOOL' || val === '(5TH)CLASS') return 'Class 5th';
    if (val === 'BELOW 8TH') return 'Below 8th';
    if (val === 'BELOW 5TH') return 'Below 5th';
    if (val === 'BELOW 10TH') return 'Below 10th';
    if (val === 'NO EDUCATION') return 'No Education';

    return val.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
};

export const getHighestEducationQualificationOptionsFromMongo = async () => {
    const data = await loadEligibilityFieldsFromMongo();
    const list = Array.isArray(data?.highest_education_qualification) ? data.highest_education_qualification : [];
    return list.map(value => ({
        value,
        label: formatEducationLabel(value)
    }));
};

export const getEducationLevelsFromMongo = async () => {
    const data = await loadEligibilityFieldsFromMongo();
    return data?.education_levels || {};
};

/**
 * Format gender value to human-readable label
 */
const formatGenderLabel = (val) => {
    if (!val || typeof val !== 'string') return '';
    const upper = val.toUpperCase();
    if (upper === 'MALE') return 'Male';
    if (upper === 'FEMALE') return 'Female';
    if (upper === 'TRANSGENDER') return 'Transgender';
    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
};

/**
 * Fetch gender options directly from MongoDB eligibility_fields document
 * @returns {Promise<Array<{value: string, label: string}>>}
 */
export const getGenderOptionsFromMongo = async () => {
    const data = await loadEligibilityFieldsFromMongo();
    const genderList = Array.isArray(data?.gender) ? data.gender : [];
    return genderList.map(value => ({
        value,
        label: formatGenderLabel(value)
    }));
};

/**
 * Format nationality label (Title Cased, acronyms preserved)
 */
export const formatNationalityLabel = (value) => {
    if (!value || typeof value !== 'string') return '';
    const titleCased = value.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
    return titleCased
        .replace(/\bPio\b/g, 'PIO')
        .replace(/\bOci\b/g, 'OCI')
        .replace(/\bNri\b/g, 'NRI')
        .replace(/\bDr\b/g, 'DR')
        .replace(/\bUae\b/g, 'UAE')
        .replace(/\bOf\b/g, 'of')
        .replace(/\bFrom\b/g, 'from')
        .replace(/\bIn\b/g, 'in')
        .replace(/\bWith\b/g, 'with')
        .replace(/\bAnd\b/g, 'and');
};

/**
 * Format marital status label
 */
export const formatMaritalStatusLabel = (val) => {
    if (!val || typeof val !== 'string') return '';
    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
};

/**
 * Format caste category label
 */
export const formatCasteCategoryLabel = (val) => {
    if (!val || typeof val !== 'string') return '';
    return val
        .toLowerCase()
        .replace(/\b[a-z]/g, c => c.toUpperCase())
        .replace(/\bUr\b/g, 'UR')
        .replace(/\bSc\b/g, 'SC')
        .replace(/\bSt\b/g, 'ST')
        .replace(/\bObc\b/g, 'OBC')
        .replace(/\bEws\b/g, 'EWS');
};

/**
 * Format NCC Wing label
 */
export const formatNccWingLabel = (val) => {
    if (!val || typeof val !== 'string') return '';
    return val.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
};

/**
 * Fetch marital status options directly from MongoDB eligibility_fields document by gender
 */
export const getMaritalStatusOptionsFromMongo = async (gender) => {
    const data = await loadEligibilityFieldsFromMongo();
    const normalized = gender ? gender.trim().toUpperCase() : '';
    let list = [];
    if (normalized && Array.isArray(data?.[normalized])) {
        list = data[normalized];
    } else {
        const combined = new Set([
            ...(Array.isArray(data?.MALE) ? data.MALE : []),
            ...(Array.isArray(data?.FEMALE) ? data.FEMALE : []),
            ...(Array.isArray(data?.TRANSGENDER) ? data.TRANSGENDER : [])
        ]);
        list = Array.from(combined);
    }
    return list.map(value => ({
        value,
        label: formatMaritalStatusLabel(value)
    }));
};

/**
 * Fetch nationality options directly from MongoDB eligibility_fields document
 */
export const getNationalityOptionsFromMongo = async () => {
    const data = await loadEligibilityFieldsFromMongo();
    const list = Array.isArray(data?.nationality) ? data.nationality : [];
    return list.map(value => ({
        value,
        label: formatNationalityLabel(value)
    }));
};

/**
 * Fetch domicile options directly from MongoDB eligibility_fields document
 */
export const getDomicileOptionsFromMongo = async () => {
    const data = await loadEligibilityFieldsFromMongo();
    const list = Array.isArray(data?.domicile) ? data.domicile : [];
    return list.map(value => ({
        value,
        label: formatNationalityLabel(value)
    }));
};

/**
 * Fetch caste category options directly from MongoDB eligibility_fields document
 */
export const getCasteCategoryOptionsFromMongo = async () => {
    const data = await loadEligibilityFieldsFromMongo();
    const list = Array.isArray(data?.caste_category) ? data.caste_category : [];
    return list.map(value => ({
        value,
        label: formatCasteCategoryLabel(value)
    }));
};

/**
 * Fetch NCC Wing options directly from MongoDB eligibility_fields document
 */
export const getNccWingOptionsFromMongo = async () => {
    const data = await loadEligibilityFieldsFromMongo();
    const list = Array.isArray(data?.ncc_wing) ? data.ncc_wing : [];
    return list.map(value => ({
        value,
        label: formatNccWingLabel(value)
    }));
};

/**
 * Fetch NCC Certificate options directly from MongoDB eligibility_fields document
 */
export const getNccCertificateOptionsFromMongo = async () => {
    const data = await loadEligibilityFieldsFromMongo();
    const list = Array.isArray(data?.ncc_certificate) ? data.ncc_certificate : [];
    return list.map(value => ({
        value,
        label: value
    }));
};

/**
 * Fetch NCC Certificate Grade options directly from MongoDB eligibility_fields document
 */
export const getNccCertificateGradeOptionsFromMongo = async () => {
    const data = await loadEligibilityFieldsFromMongo();
    const list = Array.isArray(data?.ncc_certificate_grade) ? data.ncc_certificate_grade : [];
    return list.map(value => ({
        value,
        label: `Grade ${value}`
    }));
};

export default {
    ensureExamCatalogLoaded,
    getAllCategories,
    getExamsByCategory,
    getLinkedExams,
    getExamByName,
    loadExamData,
    loadExamDataBulk,
    loadExamDataByName,
    preloadAllExamData,
    getExamDropdownOptions,
    getExamOptionsGroupedByCategory,
    formatCategoryName,
    getDivisionOptions,
    getDivisionData,
    examHasDivisions,
    getExamSessionOptions,
    loadEligibilityFieldsFromMongo,
    getGenderOptionsFromMongo,
    getMaritalStatusOptionsFromMongo,
    getNationalityOptionsFromMongo,
    getDomicileOptionsFromMongo,
    getCasteCategoryOptionsFromMongo,
    getNccWingOptionsFromMongo,
    getNccCertificateOptionsFromMongo,
    getNccCertificateGradeOptionsFromMongo,
    formatNationalityLabel,
    formatMaritalStatusLabel,
    formatCasteCategoryLabel,
    formatNccWingLabel,
    getCachedEligibilityFields,
    getCachedNationalities,
    getCachedDomiciles,
    getCachedCasteCategories,
    getCachedNccWings,
    getCachedNccCertificates,
    getCachedNccCertificateGrades,
    getMongoNationalities,
    getMongoDomiciles,
    getMongoCasteCategories,
    getMongoNccWings,
    getMongoNccCertificates,
    getMongoNccCertificateGrades,
    formatEducationLabel,
    getHighestEducationQualificationOptionsFromMongo,
    getEducationLevelsFromMongo,
    getCachedHighestEducationQualification,
    getCachedEducationLevels
};

