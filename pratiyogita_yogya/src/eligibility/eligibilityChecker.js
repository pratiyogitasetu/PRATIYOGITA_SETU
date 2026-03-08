/**
 * Eligibility Checker Utility Functions
 * For PRATIYOGITA YOGYA - Exam Eligibility Tracker
 * 
 * 14 CHECKS ACTIVE:
 * ✅ 1. Gender
 * ✅ 2. Marital Status  
 * ✅ 3. PWD Status
 * ✅ 4. Caste Category
 * ✅ 5. Nationality
 * ✅ 6. Domicile
 * ✅ 7. Date of Birth
 * ✅ 8. Highest Education Qualification
 * ✅ 9. Eligibility Education Course
 * ✅ 10. Eligibility Education Course Subject
 * ✅ 11. NCC Wing (simple string check)
 * ✅ 12. NCC Certificate (depends on NCC Wing)
 * ✅ 13. NCC Certificate Grade (depends on NCC Certificate)
 * ✅ 14. Active Backlogs Allowed (from highest_education_qualification level)
 * 
 * NOTE: Individual eligibility check functions are in ./checker/ folder
 * This file contains utility functions for display and data extraction.
 */

// Import only the active checkers from checker folder
import { 
    checkFullEligibility,
    // Gender helpers
    checkGender,
    getGenderOptions,
    shouldShowGenderField,
    detectDivisionStructure,
    // Marital Status helpers
    checkMaritalStatus,
    getMaritalStatusOptionsByGender,
    isValidMaritalStatusForGender,
    shouldShowMaritalStatusField,
    // PWD Status helpers
    checkPwdStatus,
    shouldShowPwdField,
    getPwdOptions,
    // Caste Category helpers
    checkCasteCategory,
    getCasteCategoryOptions,
    shouldShowCasteCategoryField,
    getStandardCategories,
    // Nationality helpers
    checkNationality,
    shouldEnableDomicile,
    shouldShowDomicileFieldFromNationality,
    getNationalityOptions,
    shouldShowNationalityField,
    getStandardNationalities,
    isValidNationality,
    getNormalizedNationality,
    STANDARD_NATIONALITIES,
    // Domicile helpers
    checkDomicile,
    getDomicileOptions,
    shouldShowDomicileField,
    isDomicileApplicable,
    getAllDomiciles,
    getIndianStates,
    getUnionTerritories,
    isValidDomicile,
    isState,
    isUnionTerritory,
    ALL_DOMICILES,
    INDIAN_STATES,
    UNION_TERRITORIES,
    // Date of Birth helpers
    checkDateOfBirth,
    parseDateDDMMYYYY,
    formatDateDDMMYYYY,
    calculateAge,
    formatAge,
    getExamReferenceDate,
    getExamSessions,
    extractYearFromSession,
    getValueForSession,
    parseAgeRange,
    parseDobRange,
    checkStartingAge,
    checkEndingAge,
    checkBetweenAge,
    checkMinimumDob,
    checkMaximumDob,
    checkBetweenDob,
    hasAgeRequirement,
    shouldShowDobField,
    AGE_CRITERIA_TYPES,
    // Highest Education Qualification helpers
    checkHighestEducationQualification,
    getEducationLevel,
    getEducationLevels as getEducationLevelsSync,
    shouldShowEducationField,
    getEducationOptions,
    getEducationHierarchy,
    // Eligibility Education Course helpers
    checkEligibilityEducationCourse,
    getCoursesForLevel as getCoursesForLevelSync,
    getAllCourses,
    findCourseLevel,
    isValidCourseForLevel,
    // Eligibility Education Course Subject helpers
    checkEligibilityEducationCourseSubject,
    getSubjectsForCourse as getSubjectsForCourseSync,
    getAllSubjectsForLevel,
    findSubjectCourses,
    isValidSubjectForCourse,
    // NCC Certificate helpers
    checkNccCertificate,
    getAllowedCertificates,
    // NCC Certificate Grade helpers
    checkNccCertificateGrade,
    getAllowedGrades,
    // Active Backlogs Allowed helpers
    checkActiveBacklogsAllowed,
    getActiveBacklogsFromExam,
    getEducationLevelKeyForBacklogs,
    shouldShowActiveBacklogsField,
    getBacklogRequirementDescription
} from './checker/index.js';

export { 
    checkFullEligibility,
    // Gender helpers
    checkGender,
    getGenderOptions,
    shouldShowGenderField,
    detectDivisionStructure,
    // Marital Status helpers
    checkMaritalStatus,
    getMaritalStatusOptionsByGender,
    isValidMaritalStatusForGender,
    shouldShowMaritalStatusField,
    // PWD Status helpers
    checkPwdStatus,
    shouldShowPwdField,
    getPwdOptions,
    // Caste Category helpers
    checkCasteCategory,
    getCasteCategoryOptions,
    shouldShowCasteCategoryField,
    getStandardCategories,
    // Nationality helpers
    checkNationality,
    shouldEnableDomicile,
    shouldShowDomicileFieldFromNationality,
    getNationalityOptions,
    shouldShowNationalityField,
    getStandardNationalities,
    isValidNationality,
    getNormalizedNationality,
    STANDARD_NATIONALITIES,
    // Domicile helpers
    checkDomicile,
    getDomicileOptions,
    shouldShowDomicileField,
    isDomicileApplicable,
    getAllDomiciles,
    getIndianStates,
    getUnionTerritories,
    isValidDomicile,
    isState,
    isUnionTerritory,
    ALL_DOMICILES,
    INDIAN_STATES,
    UNION_TERRITORIES,
    // Date of Birth helpers
    checkDateOfBirth,
    parseDateDDMMYYYY,
    formatDateDDMMYYYY,
    calculateAge,
    formatAge,
    getExamReferenceDate,
    getExamSessions,
    extractYearFromSession,
    getValueForSession,
    parseAgeRange,
    parseDobRange,
    checkStartingAge,
    checkEndingAge,
    checkBetweenAge,
    checkMinimumDob,
    checkMaximumDob,
    checkBetweenDob,
    hasAgeRequirement,
    shouldShowDobField,
    AGE_CRITERIA_TYPES,
    // Highest Education Qualification helpers
    checkHighestEducationQualification,
    getEducationLevel,
    getEducationLevelsSync,
    shouldShowEducationField,
    getEducationOptions,
    getEducationHierarchy,
    // Eligibility Education Course helpers
    checkEligibilityEducationCourse,
    getCoursesForLevelSync,
    getAllCourses,
    findCourseLevel,
    isValidCourseForLevel,
    // Eligibility Education Course Subject helpers
    checkEligibilityEducationCourseSubject,
    getSubjectsForCourseSync,
    getAllSubjectsForLevel,
    findSubjectCourses,
    isValidSubjectForCourse,
    // NCC Certificate helpers
    checkNccCertificate,
    getAllowedCertificates,
    // NCC Certificate Grade helpers
    checkNccCertificateGrade,
    getAllowedGrades,
    // Active Backlogs Allowed helpers
    checkActiveBacklogsAllowed,
    getActiveBacklogsFromExam,
    getEducationLevelKeyForBacklogs,
    shouldShowActiveBacklogsField,
    getBacklogRequirementDescription
};

// ============================================
// DATA EXTRACTION FOR DROPDOWNS
// ============================================

/**
 * Extract unique values from exam data for a specific field
 * Used to populate dropdowns with eligible values only
 * @param {Object} examData - Exam JSON data
 * @param {string} fieldName - Field name to extract
 * @returns {string[]} - Array of unique values
 */
export const extractFieldValues = (examData, fieldName) => {
    let value = examData[fieldName];
    
    if (!value || value === '' || value === 'NOT APPLICABLE') {
        return [];
    }

    if (typeof value === 'string') {
        return value.split(',').map(v => v.trim()).filter(v => v !== '');
    }

    if (typeof value === 'object') {
        // Handle objects like maximum_dob with year keys
        return Object.values(value);
    }

    return [];
};

/**
 * Get all eligible values for populating form dropdowns
 * @param {Object} examData - Exam JSON data (can be division-specific)
 * @returns {Object} - Object with field names as keys and arrays of values
 */
export const getEligibleValuesForForm = (examData) => {
    const eligibilityFields = [
        'gender',
        'marital_status',
        'pwd_status',
        'domicile',
        'nationality',
        'caste_category',
        'highest_education_qualification',
        'eligibility_marks',
        'eligibility_education_course',
        'eligibility_education_course_subject',
        'eligibility_course_year',
        'percentage_10th_requirement',
        'percentage_12th_requirement',
        'subjects_at_10th',
        'subjects_at_12th',
        'active_backlogs_allowed',
        'ncc_wing',
        'ncc_certificate',
        'ncc_certificate_grade'
    ];

    const eligibleValues = {};

    eligibilityFields.forEach(field => {
        const values = extractFieldValues(examData, field);
        if (values.length > 0) {
            eligibleValues[field] = values;
        }
    });

    return eligibleValues;
};

// ============================================
// DISPLAY DATA EXTRACTION
// ============================================

/**
 * Get exam details for display only (not for eligibility checking)
 * @param {Object} examData - Exam JSON data
 * @returns {Object} - Display-only fields
 */
export const getDisplayDetails = (examData) => {
    return {
        full_form: examData.full_form || '',
        exam_level: examData.exam_level || '',
        exam_sector: examData.exam_sector || '',
        exam_target: examData.exam_target || '',
        exam_frequency_year: examData.exam_frequency_year || '',
        conducting_body: examData.conducting_body || '',
        posts_classes_courses_departments_academies: examData.posts_classes_courses_departments_academies || '',
        exam_tiers: examData.exam_tiers || '',
        exam_subjects: examData.exam_subjects || '',
        exam_pattern: examData.exam_pattern || '',
        exam_sections: examData.exam_sections || '',
        mode_of_exam: examData.mode_of_exam || '',
        exam_duration: examData.exam_duration || '',
        total_marks: examData.total_marks || '',
        number_of_questions: examData.number_of_questions || '',
        marking_scheme: examData.marking_scheme || '',
        paper_medium: examData.paper_medium || '',
        exam_date: examData.exam_date || ''
    };
};

// ============================================
// EDUCATION CONFIGURATION HELPERS
// ============================================

// Import edu_final.json for education config
import eduFinalJson from './edu_final.json';

/**
 * Get education configuration
 * @returns {Object} - Education config object
 */
export const getEducationConfig = () => {
    return Promise.resolve(eduFinalJson || {});
};

/**
 * Get education levels for dropdown
 * @returns {Array} - Array of education level options
 */
export const getEducationLevels = async () => {
    const config = await getEducationConfig();
    const levels = [];
    
    for (const [key, value] of Object.entries(config)) {
        if (value && typeof value === 'object') {
            levels.push({
                value: key,
                label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            });
        }
    }
    
    return levels;
};

/**
 * Get courses for a specific education level
 * @param {string} level - Education level key
 * @returns {Array} - Array of course options
 */
export const getCoursesForLevel = async (level) => {
    const config = await getEducationConfig();
    
    if (!config[level]) {
        return [];
    }
    
    // edu_final.json has different structure - keys are course names directly
    return Object.keys(config[level]).map(course => ({
        value: course,
        label: course
    }));
};

/**
 * Get subjects for a specific course
 * @param {string} level - Education level key
 * @param {string} course - Course name
 * @returns {Array} - Array of subject options
 */
export const getSubjectsForCourse = async (level, course) => {
    const config = await getEducationConfig();
    
    if (!config[level] || !config[level][course]) {
        return [];
    }
    
    // In edu_final.json, subjects are directly under the course
    const subjects = config[level][course] || [];
    return subjects.map(subject => ({
        value: subject,
        label: subject
    }));
};

/**
 * Check if education level requires further details
 * @param {string} level - Education level key
 * @returns {boolean} - True if requires course/subject selection
 */
export const requiresEducationDetails = (level) => {
    return level !== 'below_secondary' && level !== 'no_education';
};

// Default export with active utility functions (7 checks only)
export default {
    // Main eligibility check
    checkFullEligibility,
    
    // Gender helpers
    checkGender,
    getGenderOptions,
    shouldShowGenderField,
    detectDivisionStructure,
    
    // Marital Status helpers
    checkMaritalStatus,
    getMaritalStatusOptionsByGender,
    isValidMaritalStatusForGender,
    shouldShowMaritalStatusField,
    
    // PWD Status helpers
    checkPwdStatus,
    shouldShowPwdField,
    getPwdOptions,
    
    // Caste Category helpers
    checkCasteCategory,
    getCasteCategoryOptions,
    shouldShowCasteCategoryField,
    getStandardCategories,
    
    // Nationality helpers
    checkNationality,
    shouldEnableDomicile,
    shouldShowDomicileFieldFromNationality,
    getNationalityOptions,
    shouldShowNationalityField,
    getStandardNationalities,
    isValidNationality,
    getNormalizedNationality,
    STANDARD_NATIONALITIES,
    
    // Domicile helpers
    checkDomicile,
    getDomicileOptions,
    shouldShowDomicileField,
    isDomicileApplicable,
    getAllDomiciles,
    getIndianStates,
    getUnionTerritories,
    isValidDomicile,
    isState,
    isUnionTerritory,
    ALL_DOMICILES,
    INDIAN_STATES,
    UNION_TERRITORIES,
    
    // Date of Birth helpers
    checkDateOfBirth,
    parseDateDDMMYYYY,
    formatDateDDMMYYYY,
    calculateAge,
    formatAge,
    getExamReferenceDate,
    getExamSessions,
    extractYearFromSession,
    getValueForSession,
    parseAgeRange,
    parseDobRange,
    checkStartingAge,
    checkEndingAge,
    checkBetweenAge,
    checkMinimumDob,
    checkMaximumDob,
    checkBetweenDob,
    hasAgeRequirement,
    shouldShowDobField,
    AGE_CRITERIA_TYPES,
    
    // Display & extraction utilities
    extractFieldValues,
    getEligibleValuesForForm,
    getDisplayDetails,
    getEducationConfig,
    getEducationLevels,
    getCoursesForLevel,
    getSubjectsForCourse,
    requiresEducationDetails
};
