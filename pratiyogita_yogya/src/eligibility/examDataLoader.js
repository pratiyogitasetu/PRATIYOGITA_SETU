/**
 * Exam Data Loader Utility
 * For PRATIYOGITA YOGYA - Exam Eligibility Tracker
 * 
 * This module loads exam catalog and exam payloads from local JSON files.
 * (Firebase/Firestore has been removed — re-add when ready.)
 */

import { buildExamDataDocId } from './examDataDocId';

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
        try {
            const response = await fetch('/examsdata/allexamnames.json');
            if (!response.ok) {
                throw new Error(`Failed to load exam catalog (HTTP ${response.status})`);
            }
            const data = await response.json();
            allExamNamesCache = normalizeCatalogPayload(data);
            return allExamNamesCache;
        } catch (error) {
            throw error;
        }
    })();

    try {
        return await catalogLoadPromise;
    } finally {
        catalogLoadPromise = null;
    }
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

const chunkArray = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
};

/**
 * Load exam JSON data from local files
 * @param {string} linkedJsonFile - Path like "DEFENCE_EXAMS/cds.json"
 * @returns {Promise<Object|null>} - Exam data object or null
 */
export const loadExamData = async (linkedJsonFile) => {
    if (!linkedJsonFile) return null;
    
    // Check cache first
    if (examDataCache[linkedJsonFile]) {
        return examDataCache[linkedJsonFile];
    }
    
    try {
        const response = await fetch(`/examsdata/${linkedJsonFile}`);
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
        'UG_EXAMS': 'Undergraduate Exams',
        'PG_EXAMS': 'Postgraduate Exams',
        'BANKING_EXAMS': 'Banking Exams',
        'RAILWAY_EXAMS': 'Railway Exams',
        'TEACHING_EXAMS': 'Teaching Exams',
        'CIVIL_SERVICES_EXAMS': 'Civil Services',
        'POLICE_EXAMS': 'Police Exams',
        'ENGINEERING_RECRUITING_EXAMS': 'Engineering Recruitment',
        'INSURANCE_EXAMS': 'Insurance Exams',
        'JUDICIARY_EXAMS': 'Judiciary Exams',
        'MBA_EXAMS': 'MBA Exams',
        'SCHOOL_EXAMS': 'School Level Exams',
        'NURSING_EXAMS': 'Nursing Exams',
        'REGULATORY_BODY_EXAMS': 'Regulatory Body Exams',
        'OTHER_GOV_EXAMS': 'Other Government Exams',
        'OTHERS_EXAMS': 'Other Exams',
        'CAMPUS_PLACEMENT_EXAMS': 'Campus Placement',
        'ACCOUNTING_COMMERCE_EXAMS': 'Accounting & Commerce'
    };
    
    return categoryMap[category] || category.replace('_EXAMS', '').replace('_EXAMS', '').replace(/_/g, ' ');
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
        
        // Handle nested structure (regular_candidates, CPL_holders)
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
    getExamSessionOptions
};
