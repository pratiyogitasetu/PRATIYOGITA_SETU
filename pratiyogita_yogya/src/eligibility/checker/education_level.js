/**
 * Unified Education Level Checker
 * 
 * This module handles all education-related eligibility checks including:
 * - Highest Education Qualification validation
 * - Course validation for each education level
 * - Subject validation for each course
 * - Marks/Percentage validation (category-wise and PWD-specific)
 * - Education hierarchy management
 * - Diploma/12th equivalency handling
 * - Dynamic form data generation from edu_final.json
 * 
 * edu_final.json is the SINGLE SOURCE OF TRUTH for all education data.
 * Exam JSONs only define eligibility rules, not dropdown values.
 */

// ============================================
// IMPORTS
// ============================================

// Import edu_final.json directly for Vite bundling
import eduFinalJson from '../edu_final.json';

// ============================================
// EDUCATION HIERARCHY CONSTANTS
// ============================================

/**
 * Education level hierarchy (higher number = higher qualification)
 * Used for determining required education levels
 * Includes multiple variations to handle different formats from the UI
 */
export const EDUCATION_HIERARCHY = {
    'POST DOCTORATE': 10,
    'PHD': 9,
    'POST GRADUATION': 8,
    'GRADUATION': 7,
    'DIPLOMA / ITI (POLYTECHNIC, ITI, DPHARM, PGDCA)': 6,
    'DIPLOMA': 6,
    // With space after parenthesis
    '(12TH) HIGHER SECONDARY': 5,
    '(10TH) SECONDARY': 4,
    // Without space after parenthesis (from staticEducationOptions)
    '(12TH)HIGHER SECONDARY': 5,
    '(10TH)SECONDARY': 4,
    // Short forms
    '12TH': 5,
    '10TH': 4,
    '12TH HIGHER SECONDARY': 5,
    '10TH SECONDARY': 4,
    // Class 8th and 5th
    '(8TH)CLASS': 3,
    '(5TH)CLASS': 2,
    '8TH CLASS': 3,
    '5TH CLASS': 2,
    'CLASS VIII': 3,
    'CLASS V': 2,
    'BELOW 10TH': 1,
    'NO EDUCATION': 0
};

/**
 * Maps education level names to their JSON keys in edu_final.json
 * Includes multiple variations to handle different formats from the UI
 */
export const EDUCATION_LEVEL_KEYS = {
    'POST DOCTORATE': 'post_doctorate',
    'PHD': 'phd',
    'POST GRADUATION': 'post_graduation',
    'GRADUATION': 'graduation',
    'DIPLOMA / ITI (POLYTECHNIC, ITI, DPHARM, PGDCA)': 'diploma',
    'DIPLOMA': 'diploma',
    // With space after parenthesis
    '(12TH) HIGHER SECONDARY': '12th_higher_secondary',
    '(10TH) SECONDARY': '10th_secondary',
    // Without space after parenthesis (from staticEducationOptions)
    '(12TH)HIGHER SECONDARY': '12th_higher_secondary',
    '(10TH)SECONDARY': '10th_secondary',
    // Short forms
    '12TH': '12th_higher_secondary',
    '10TH': '10th_secondary',
    '12TH HIGHER SECONDARY': '12th_higher_secondary',
    '10TH SECONDARY': '10th_secondary',
    'HIGHER SECONDARY': '12th_higher_secondary',
    'SECONDARY': '10th_secondary',
    // Class 8th and 5th
    '(8TH)CLASS': '8th_class',
    '(5TH)CLASS': '5th_class',
    '8TH CLASS': '8th_class',
    '5TH CLASS': '5th_class',
    'CLASS VIII': '8th_class',
    'CLASS V': '5th_class',
    'BELOW 10TH': 'below_10th',
    'NO EDUCATION': 'no_education'
};

/**
 * Reverse mapping from JSON keys to display names
 */
export const EDUCATION_KEY_TO_NAME = {
    'post_doctorate': 'POST DOCTORATE',
    'phd': 'PHD',
    'post_graduation': 'POST GRADUATION',
    'graduation': 'GRADUATION',
    'diploma': 'DIPLOMA / ITI (POLYTECHNIC, ITI, DPHARM, PGDCA)',
    '12th_higher_secondary': '(12TH) HIGHER SECONDARY',
    '10th_secondary': '(10TH) SECONDARY',
    '8th_class': '(8TH)CLASS',
    '5th_class': '(5TH)CLASS',
    'below_10th': 'BELOW 10TH',
    'no_education': 'NO EDUCATION'
};

/**
 * Education levels that require University (vs Board)
 */
export const UNIVERSITY_LEVELS = [
    'post_doctorate',
    'phd',
    'post_graduation',
    'graduation',
    'diploma'
];

/**
 * Education levels that require Board
 */
export const BOARD_LEVELS = [
    '12th_higher_secondary',
    '10th_secondary',
    '8th_class',
    '5th_class'
];

/**
 * Diploma and 12th are considered equivalent in most cases
 */
export const EQUIVALENT_LEVELS = {
    'diploma': '12th_higher_secondary',
    '12th_higher_secondary': 'diploma'
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Normalize education level string to uppercase for comparison
 * @param {string} level - Education level
 * @returns {string} Normalized level
 */
export const normalizeEducationLevel = (level) => {
    if (!level) return '';
    return level.toString().toUpperCase().trim();
};

/**
 * Get numeric hierarchy value for an education level
 * @param {string} level - Education level name
 * @returns {number} Hierarchy value (0-8)
 */
export const getEducationHierarchyValue = (level) => {
    const normalized = normalizeEducationLevel(level);
    return EDUCATION_HIERARCHY[normalized] || 0;
};

/**
 * Get JSON key for an education level
 * @param {string} level - Education level name
 * @returns {string|null} JSON key or null
 */
export const getEducationLevelKey = (level) => {
    const normalized = normalizeEducationLevel(level);
    return EDUCATION_LEVEL_KEYS[normalized] || null;
};

/**
 * Get display name for an education level key
 * @param {string} key - JSON key
 * @returns {string} Display name
 */
export const getEducationLevelName = (key) => {
    return EDUCATION_KEY_TO_NAME[key] || key?.toUpperCase() || '';
};

/**
 * Check if a level requires University (vs Board)
 * @param {string} levelKey - Education level JSON key
 * @returns {boolean}
 */
export const requiresUniversity = (levelKey) => {
    return UNIVERSITY_LEVELS.includes(levelKey);
};

/**
 * Check if a level requires Board
 * @param {string} levelKey - Education level JSON key
 * @returns {boolean}
 */
export const requiresBoard = (levelKey) => {
    return BOARD_LEVELS.includes(levelKey);
};

/**
 * Get all education levels below (and including) a given level
 * These are the levels user MUST provide details for
 * @param {string} highestLevel - The highest education level required
 * @returns {string[]} Array of education level keys from highest to lowest
 */
export const getRequiredEducationLevels = (highestLevel) => {
    const hierarchyValue = getEducationHierarchyValue(highestLevel);
    const levels = [];
    
    // Order from highest to lowest within the range
    // Values must match EDUCATION_HIERARCHY
    const orderedLevels = [
        { key: 'graduation', value: 7 },
        { key: 'diploma', value: 6 },
        { key: '12th_higher_secondary', value: 5 },
        { key: '10th_secondary', value: 4 },
        { key: '8th_class', value: 3 },
        { key: '5th_class', value: 2 }
    ];
    
    for (const level of orderedLevels) {
        if (level.value <= hierarchyValue && level.value >= 1) {
            levels.push(level.key);
        }
    }
    
    return levels;
};

/**
 * Get all education levels user should provide (from their highest to 10th)
 * @param {string} userHighestLevel - User's highest education level
 * @returns {string[]} Array of education level keys from highest to lowest
 */
export const getUserEducationLevels = (userHighestLevel) => {
    const hierarchyValue = getEducationHierarchyValue(userHighestLevel);
    const levels = [];
    
    // Values must match EDUCATION_HIERARCHY
    const orderedLevels = [
        { key: 'post_doctorate', value: 10 },
        { key: 'phd', value: 9 },
        { key: 'post_graduation', value: 8 },
        { key: 'graduation', value: 7 },
        { key: 'diploma', value: 6 },
        { key: '12th_higher_secondary', value: 5 },
        { key: '10th_secondary', value: 4 },
        { key: '8th_class', value: 3 },
        { key: '5th_class', value: 2 }
    ];
    
    for (const level of orderedLevels) {
        if (level.value <= hierarchyValue && level.value >= 1) {
            levels.push(level.key);
        }
    }
    
    return levels;
};

/**
 * Parse percentage string to number
 * @param {string|number} percentage - Percentage value (e.g., "50%", 50, "50")
 * @returns {number} Parsed percentage or NaN
 */
export const parsePercentage = (percentage) => {
    if (typeof percentage === 'number') return percentage;
    if (!percentage) return NaN;
    return parseFloat(String(percentage).replace('%', '').trim());
};

// ============================================
// MAIN EDUCATION DATA FUNCTIONS (from edu_final.json)
// ============================================

/**
 * Get course options for a specific education level from edu_final.json
 * @param {Object} eduFinalData - The edu_final.json data
 * @param {string} levelKey - Education level key (e.g., 'graduation')
 * @returns {string[]} Array of course options
 */
export const getCourseOptionsFromEduFinal = (eduFinalData, levelKey) => {
    if (!eduFinalData?.education_levels?.[levelKey]) return [];
    
    const levelData = eduFinalData.education_levels[levelKey];
    
    // Handle different structures
    if (levelData?.course?.options) {
        return levelData.course.options;
    }
    if (levelData?.course_stream?.options) {
        return levelData.course_stream.options;
    }
    
    return [];
};

/**
 * Get subjects for a specific course from edu_final.json
 * @param {Object} eduFinalData - The edu_final.json data
 * @param {string} levelKey - Education level key
 * @param {string} course - Selected course
 * @returns {string[]} Array of subject options
 */
export const getSubjectsFromEduFinal = (eduFinalData, levelKey, course) => {
    if (!eduFinalData?.education_levels?.[levelKey]) return [];
    
    const levelData = eduFinalData.education_levels[levelKey];
    
    if (levelData?.subject) {
        // Subject can be course-specific object or generic options
        if (levelData.subject[course]) {
            return levelData.subject[course];
        }
        if (levelData.subject.options) {
            return levelData.subject.options;
        }
    }
    
    return [];
};

/**
 * Get status options for a specific course from edu_final.json
 * @param {Object} eduFinalData - The edu_final.json data
 * @param {string} levelKey - Education level key
 * @param {string} course - Selected course
 * @returns {string[]} Array of status options
 */
export const getStatusOptionsFromEduFinal = (eduFinalData, levelKey, course) => {
    if (!eduFinalData?.education_levels?.[levelKey]) return [];
    
    const levelData = eduFinalData.education_levels[levelKey];
    
    if (levelData?.status) {
        // Status can be course-specific object or generic options
        if (levelData.status[course]) {
            return levelData.status[course];
        }
        if (levelData.status.options) {
            return levelData.status.options;
        }
    }
    
    return ['PASSED', 'APPEARING'];
};

/**
 * Get board/university options for a level from edu_final.json
 * @param {Object} eduFinalData - The edu_final.json data
 * @param {string} levelKey - Education level key
 * @returns {string[]} Array of board/university options
 */
export const getBoardUniversityOptionsFromEduFinal = (eduFinalData, levelKey) => {
    if (!eduFinalData?.education_levels?.[levelKey]) return [];
    
    const levelData = eduFinalData.education_levels[levelKey];
    
    if (levelData?.board_university?.options) {
        return levelData.board_university.options;
    }
    
    // For university levels, return empty (user types university name)
    if (requiresUniversity(levelKey)) {
        return [];
    }
    
    return [];
};

/**
 * Get default marks percentage requirements from edu_final.json
 * @param {Object} eduFinalData - The edu_final.json data
 * @param {string} levelKey - Education level key
 * @returns {Object} Category-wise percentage requirements
 */
export const getDefaultMarksPercentage = (eduFinalData, levelKey) => {
    if (!eduFinalData?.education_levels?.[levelKey]) {
        return { GEN: '33%', OBC: '33%', EWS: '33%', SC: '33%', ST: '33%' };
    }
    
    return eduFinalData.education_levels[levelKey].marks_percentage || {
        GEN: '33%', OBC: '33%', EWS: '33%', SC: '33%', ST: '33%'
    };
};

// ============================================
// ELIGIBILITY CHECK FUNCTIONS
// ============================================

/**
 * Check if user's highest education qualification meets exam requirement
 * @param {string} userEducation - User's highest education level
 * @param {string} examEducation - Exam's minimum required education level
 * @returns {Object} Check result with eligible, reason, etc.
 */
export const checkHighestEducationQualification = (userEducation, examEducation) => {
    const field = 'highest_education_qualification';
    
    // Handle special cases
    if (!examEducation || examEducation === '' || 
        examEducation === 'ALL APPLICABLE' || 
        examEducation === 'NOT APPLICABLE' ||
        examEducation === 'ANY') {
        return {
            field,
            userValue: userEducation || 'Not specified',
            examRequirement: examEducation || 'No minimum requirement',
            eligible: true,
            reason: 'No specific education requirement'
        };
    }
    
    if (!userEducation) {
        return {
            field,
            userValue: 'Not specified',
            examRequirement: examEducation,
            eligible: false,
            reason: 'Education qualification not provided'
        };
    }
    
    const userLevel = getEducationHierarchyValue(userEducation);
    const examLevel = getEducationHierarchyValue(examEducation);
    
    const eligible = userLevel >= examLevel;
    
    return {
        field,
        userValue: userEducation,
        examRequirement: examEducation,
        eligible,
        reason: eligible 
            ? `Your education level (${userEducation}) meets or exceeds the requirement (${examEducation})`
            : `Your education level (${userEducation}) is below the minimum requirement (${examEducation})`
    };
};

/**
 * Check if user's course is valid for the exam
 * Handles "ALL COURSES" case where any course is accepted
 * @param {string} userCourse - User's course
 * @param {Object} examEducationLevels - Exam's education_levels data
 * @param {string} levelKey - Education level key to check
 * @returns {Object} Check result
 */
export const checkEducationCourse = (userCourse, examEducationLevels, levelKey) => {
    const field = `education_course_${levelKey}`;
    const levelName = getEducationLevelName(levelKey);
    
    // No restriction - exam doesn't specify this level
    if (!examEducationLevels || !examEducationLevels[levelKey]) {
        return {
            field,
            userValue: userCourse || 'Not specified',
            examRequirement: 'All courses accepted',
            eligible: true,
            reason: `No specific course requirement for ${levelName}`
        };
    }
    
    const levelData = examEducationLevels[levelKey];
    
    // Empty level data means no restriction
    if (levelData === '' || levelData === 'ALL COURSES') {
        return {
            field,
            userValue: userCourse || 'Not specified',
            examRequirement: 'All courses accepted',
            eligible: true,
            reason: `All courses are accepted for ${levelName}`
        };
    }
    
    // Get course options from exam JSON
    const courseOptions = levelData?.course?.options || levelData?.course_stream?.options || [];
    
    // If course options is empty, contains ALL, or ALL COURSES - all courses accepted
    if (courseOptions.length === 0 || 
        courseOptions.includes('ALL') || 
        courseOptions.includes('ALL COURSES')) {
        return {
            field,
            userValue: userCourse || 'Not specified',
            examRequirement: 'All courses accepted',
            eligible: true,
            reason: `All courses are accepted for ${levelName}`
        };
    }
    
    if (!userCourse) {
        return {
            field,
            userValue: 'Not specified',
            examRequirement: courseOptions.join(', '),
            eligible: false,
            reason: `Course not specified for ${levelName}`
        };
    }
    
    // Check if user's course matches allowed courses
    const normalizedUserCourse = userCourse.toUpperCase().trim();
    const eligible = courseOptions.some(option => {
        const normalizedOption = option.toUpperCase().trim();
        return normalizedOption === normalizedUserCourse ||
               normalizedOption.includes(normalizedUserCourse) ||
               normalizedUserCourse.includes(normalizedOption) ||
               normalizedOption === 'OTHER';
    });
    
    return {
        field,
        userValue: userCourse,
        examRequirement: courseOptions.join(', '),
        eligible,
        reason: eligible
            ? `Course ${userCourse} is accepted for ${levelName}`
            : `Course ${userCourse} is not in the allowed list for ${levelName}`
    };
};

/**
 * Check if user's subject is valid for their course and exam requirements
 * Handles "ALL SUBJECTS" case
 * @param {string} userSubject - User's subject
 * @param {Object} examEducationLevels - Exam's education_levels data
 * @param {string} levelKey - Education level key
 * @param {string} userCourse - User's course (for course-specific subject validation)
 * @returns {Object} Check result
 */
export const checkEducationSubject = (userSubject, examEducationLevels, levelKey, userCourse) => {
    const field = `education_subject_${levelKey}`;
    const levelName = getEducationLevelName(levelKey);
    
    // No restriction
    if (!examEducationLevels || !examEducationLevels[levelKey]) {
        return {
            field,
            userValue: userSubject || 'Not specified',
            examRequirement: 'All subjects accepted',
            eligible: true,
            reason: `No specific subject requirement for ${levelName}`
        };
    }
    
    const levelData = examEducationLevels[levelKey];
    
    // Empty level data means no restriction
    if (levelData === '' || levelData === 'ALL SUBJECTS') {
        return {
            field,
            userValue: userSubject || 'Not specified',
            examRequirement: 'All subjects accepted',
            eligible: true,
            reason: `All subjects are accepted for ${levelName}`
        };
    }
    
    // Get subject options from exam JSON
    let subjectOptions = [];
    if (levelData?.subject) {
        if (userCourse && levelData.subject[userCourse]) {
            subjectOptions = levelData.subject[userCourse];
        } else if (levelData.subject.options) {
            subjectOptions = levelData.subject.options;
        } else if (typeof levelData.subject === 'object') {
            // Get all subjects from all courses
            subjectOptions = Object.values(levelData.subject).flat();
        }
    }
    
    // If subject options is empty or contains ALL, all subjects accepted
    if (subjectOptions.length === 0 || 
        subjectOptions.includes('ALL') || 
        subjectOptions.includes('ALL SUBJECTS')) {
        return {
            field,
            userValue: userSubject || 'Not specified',
            examRequirement: 'All subjects accepted',
            eligible: true,
            reason: `All subjects are accepted for ${levelName}`
        };
    }
    
    if (!userSubject) {
        return {
            field,
            userValue: 'Not specified',
            examRequirement: subjectOptions.join(', '),
            eligible: false,
            reason: `Subject not specified for ${levelName}`
        };
    }
    
    // Check if user's subject matches allowed subjects
    const normalizedUserSubject = userSubject.toUpperCase().trim();
    const eligible = subjectOptions.some(option => {
        const normalizedOption = option.toUpperCase().trim();
        return normalizedOption === normalizedUserSubject ||
               normalizedOption.includes(normalizedUserSubject) ||
               normalizedUserSubject.includes(normalizedOption) ||
               normalizedOption === 'OTHER';
    });
    
    return {
        field,
        userValue: userSubject,
        examRequirement: subjectOptions.join(', '),
        eligible,
        reason: eligible
            ? `Subject ${userSubject} is accepted for ${levelName}`
            : `Subject ${userSubject} is not in the allowed list for ${levelName}`
    };
};

/**
 * Check marks percentage eligibility based on caste category
 * @param {number|string} userPercentage - User's marks percentage
 * @param {Object} examEducationLevels - Exam's education_levels data  
 * @param {string} levelKey - Education level key
 * @param {string} casteCategory - User's caste category (GEN, OBC, SC, ST, EWS)
 * @returns {Object} Check result
 */
export const checkMarksPercentage = (userPercentage, examEducationLevels, levelKey, casteCategory) => {
    const field = `marks_percentage_${levelKey}`;
    const levelName = getEducationLevelName(levelKey);
    
    // Get marks requirement
    let marksRequirement = null;
    
    if (examEducationLevels?.[levelKey]?.marks_percentage) {
        marksRequirement = examEducationLevels[levelKey].marks_percentage;
    }
    
    // No restriction
    if (!marksRequirement) {
        return {
            field,
            userValue: userPercentage ? `${userPercentage}%` : 'Not specified',
            examRequirement: 'No minimum percentage',
            eligible: true,
            reason: `No specific marks requirement for ${levelName}`
        };
    }
    
    // Get category-specific requirement
    const normalizedCategory = (casteCategory || 'GEN').toUpperCase().trim();
    const requiredPercentage = marksRequirement[normalizedCategory] || marksRequirement['GEN'] || '33%';
    
    if (!userPercentage && userPercentage !== 0) {
        return {
            field,
            userValue: 'Not specified',
            examRequirement: `${requiredPercentage} (${normalizedCategory})`,
            eligible: false,
            reason: `Marks percentage not provided for ${levelName}`
        };
    }
    
    const userPercent = parsePercentage(userPercentage);
    const requiredPercent = parsePercentage(requiredPercentage);
    
    if (isNaN(userPercent) || isNaN(requiredPercent)) {
        return {
            field,
            userValue: `${userPercentage}%`,
            examRequirement: `${requiredPercentage} (${normalizedCategory})`,
            eligible: true,
            reason: 'Unable to parse percentage values'
        };
    }
    
    const eligible = userPercent >= requiredPercent;
    
    return {
        field,
        userValue: `${userPercent}%`,
        examRequirement: `${requiredPercent}% (${normalizedCategory})`,
        eligible,
        reason: eligible
            ? `Your marks (${userPercent}%) meet the requirement (${requiredPercent}%) for ${levelName}`
            : `Your marks (${userPercent}%) are below the requirement (${requiredPercent}%) for ${levelName}`
    };
};

/**
 * Check marks percentage with PWD-specific requirements
 * This is specifically for exams like NEET where PWD candidates have different percentage requirements
 * 
 * Supports two structures:
 * 1. New structure: pwd_status.marks_percentage_basis = { "GEN": "45%", ... }
 * 2. Old structure (backward compatible): pwd_status = { "GEN": "45%", ... }
 * 
 * @param {number|string} userPercentage - User's marks percentage
 * @param {Object} examData - Full exam JSON data
 * @param {string} levelKey - Education level key
 * @param {string} casteCategory - User's caste category
 * @param {boolean} isPwd - Whether user is PWD
 * @returns {Object} Check result
 */
export const checkMarksPercentageWithPwd = (userPercentage, examData, levelKey, casteCategory, isPwd) => {
    const field = `marks_percentage_${levelKey}`;
    const levelName = getEducationLevelName(levelKey);
    const normalizedCategory = (casteCategory || 'GEN').toUpperCase().trim();
    
    let marksRequirement = null;
    let requirementSource = '';
    
    // If PWD, check if exam has PWD-specific percentage requirements
    if (isPwd && examData?.pwd_status && typeof examData.pwd_status === 'object') {
        const pwdStatus = examData.pwd_status;
        
        // New structure: pwd_status.marks_percentage_basis
        if (pwdStatus.marks_percentage_basis && 
            typeof pwdStatus.marks_percentage_basis === 'object' &&
            Object.keys(pwdStatus.marks_percentage_basis).length > 0 &&
            Object.values(pwdStatus.marks_percentage_basis).some(v => v && v !== '')) {
            marksRequirement = pwdStatus.marks_percentage_basis;
            requirementSource = 'PWD';
        }
        // Old structure (backward compatible): pwd_status = { "GEN": "45%", ... }
        else if (pwdStatus['GEN'] || pwdStatus['OBC'] || pwdStatus['SC'] || pwdStatus['ST'] || pwdStatus['EWS']) {
            // Check if it's the old format with direct percentage values (not the new nested structure)
            if (!pwdStatus.marks_percentage_basis && !pwdStatus.age_relaxation_basis && !pwdStatus.applicability) {
                marksRequirement = pwdStatus;
                requirementSource = 'PWD';
            }
        }
    }
    
    // If no PWD-specific marks found or user is not PWD, use standard marks percentage
    if (!marksRequirement && examData?.education_levels?.[levelKey]?.marks_percentage) {
        marksRequirement = examData.education_levels[levelKey].marks_percentage;
        requirementSource = 'Standard';
    }
    
    // No restriction
    if (!marksRequirement) {
        return {
            field,
            userValue: userPercentage ? `${userPercentage}%` : 'Not specified',
            examRequirement: 'No minimum percentage',
            eligible: true,
            reason: `No specific marks requirement for ${levelName}`
        };
    }
    
    // Get category-specific requirement
    const requiredPercentage = marksRequirement[normalizedCategory] || marksRequirement['GEN'] || '33%';
    
    if (!userPercentage && userPercentage !== 0) {
        return {
            field,
            userValue: 'Not specified',
            examRequirement: `${requiredPercentage} (${normalizedCategory}, ${requirementSource})`,
            eligible: false,
            reason: `Marks percentage not provided for ${levelName}`
        };
    }
    
    const userPercent = parsePercentage(userPercentage);
    const requiredPercent = parsePercentage(requiredPercentage);
    
    if (isNaN(userPercent) || isNaN(requiredPercent)) {
        return {
            field,
            userValue: `${userPercentage}%`,
            examRequirement: `${requiredPercentage} (${normalizedCategory}, ${requirementSource})`,
            eligible: true,
            reason: 'Unable to parse percentage values'
        };
    }
    
    const eligible = userPercent >= requiredPercent;
    
    return {
        field,
        userValue: `${userPercent}%`,
        examRequirement: `${requiredPercent}% (${normalizedCategory}, ${requirementSource})`,
        eligible,
        reason: eligible
            ? `Your marks (${userPercent}%) meet the ${requirementSource} requirement (${requiredPercent}%) for ${levelName}`
            : `Your marks (${userPercent}%) are below the ${requirementSource} requirement (${requiredPercent}%) for ${levelName}`
    };
};

/**
 * Check diploma/12th equivalency
 * Diploma and 12th are mostly equivalent - user can have either or both
 * @param {Object} userEducationData - User's education data including diploma and 12th details
 * @param {Object} examEducationLevels - Exam's education_levels data
 * @returns {Object} Check result for equivalency
 */
export const checkDiploma12thEquivalency = (userEducationData, examEducationLevels) => {
    const field = 'diploma_12th_equivalency';
    
    const hasDiploma = userEducationData?.diploma?.course && userEducationData.diploma.course !== '';
    const has12th = userEducationData?.['12th_higher_secondary']?.course && 
                    userEducationData['12th_higher_secondary'].course !== '';
    
    // Check if exam requires diploma level
    const examRequiresDiploma = examEducationLevels?.diploma && examEducationLevels.diploma !== '';
    const examRequires12th = examEducationLevels?.['12th_higher_secondary'] && 
                            examEducationLevels['12th_higher_secondary'] !== '';
    
    // If exam requires both specifically, user must have both
    if (examRequiresDiploma && examRequires12th) {
        const eligible = hasDiploma && has12th;
        return {
            field,
            userValue: `Diploma: ${hasDiploma ? 'Yes' : 'No'}, 12th: ${has12th ? 'Yes' : 'No'}`,
            examRequirement: 'Both Diploma and 12th required',
            eligible,
            reason: eligible
                ? 'You have both Diploma and 12th qualifications'
                : 'Both Diploma and 12th qualifications are required'
        };
    }
    
    // If exam requires diploma OR 12th (equivalency), user needs at least one
    if (examRequiresDiploma || examRequires12th) {
        const eligible = hasDiploma || has12th;
        return {
            field,
            userValue: `Diploma: ${hasDiploma ? 'Yes' : 'No'}, 12th: ${has12th ? 'Yes' : 'No'}`,
            examRequirement: 'Diploma or 12th (equivalent)',
            eligible,
            reason: eligible
                ? 'You have the required qualification (Diploma/12th)'
                : 'Either Diploma or 12th qualification is required'
        };
    }
    
    // No specific requirement
    return {
        field,
        userValue: `Diploma: ${hasDiploma ? 'Yes' : 'No'}, 12th: ${has12th ? 'Yes' : 'No'}`,
        examRequirement: 'No specific requirement',
        eligible: true,
        reason: 'No specific Diploma/12th requirement'
    };
};

/**
 * Check subject-specific conditions (e.g., Physics & Math required in 12th for AFA)
 * @param {Object} userEducationData - User's education data
 * @param {Object} examEducationLevels - Exam's education_levels data
 * @param {string} levelKey - Education level key
 * @param {string[]} requiredSubjects - Array of required subjects (e.g., ['Physics', 'Mathematics'])
 * @returns {Object} Check result
 */
export const checkSubjectSpecificCondition = (userEducationData, examEducationLevels, levelKey, requiredSubjects) => {
    const field = `subject_condition_${levelKey}`;
    const levelName = getEducationLevelName(levelKey);
    
    if (!requiredSubjects || requiredSubjects.length === 0) {
        return {
            field,
            userValue: 'N/A',
            examRequirement: 'No specific subjects required',
            eligible: true,
            reason: 'No subject-specific conditions'
        };
    }
    
    const userSubject = userEducationData?.[levelKey]?.subject || '';
    
    if (!userSubject) {
        return {
            field,
            userValue: 'Not specified',
            examRequirement: `Required: ${requiredSubjects.join(', ')}`,
            eligible: false,
            reason: `Subject not specified for ${levelName}`
        };
    }
    
    // Check if user's subject combination contains all required subjects
    const normalizedUserSubject = userSubject.toUpperCase();
    const allSubjectsPresent = requiredSubjects.every(reqSubject => {
        const normalizedReqSubject = reqSubject.toUpperCase();
        return normalizedUserSubject.includes(normalizedReqSubject);
    });
    
    return {
        field,
        userValue: userSubject,
        examRequirement: `Required: ${requiredSubjects.join(', ')}`,
        eligible: allSubjectsPresent,
        reason: allSubjectsPresent
            ? `Your subjects include all required subjects for ${levelName}`
            : `Missing required subjects (${requiredSubjects.join(', ')}) for ${levelName}`
    };
};

// ============================================
// COMPLETED YEAR ELIGIBILITY CHECK
// ============================================

/**
 * Check if user's education passing year is eligible for exam session
 * 
 * This handles exams like JEE Main where:
 * - For JEE 2026: Only 12th passed in 2024, 2025 OR appearing in 2026 are eligible
 * - For JEE 2027: Only 12th passed in 2025, 2026 OR appearing in 2027 are eligible
 * 
 * @param {string} userStatus - User's status ("PASSED" or "APPEARING")
 * @param {string} userCompletedYear - User's passing/appearing year (e.g., "2024")
 * @param {Object} examCompletedYearCriteria - Exam's completed_year criteria from JSON
 * @param {string} examSession - Exam session (e.g., "2026")
 * @param {string} levelKey - Education level key (e.g., "12th_higher_secondary")
 * @returns {Object} - {field, eligible, reason, userValue, examRequirement}
 * 
 * @example
 * // JEE Main completed_year structure:
 * // "completed_year": {
 * //     "2026": { "passed": ["2024", "2025"], "appearing": "2026" },
 * //     "2027": { "passed": ["2025", "2026"], "appearing": "2027" }
 * // }
 */
export const checkCompletedYearEligibility = (userStatus, userCompletedYear, examCompletedYearCriteria, examSession, levelKey = '12th_higher_secondary') => {
    const field = 'Passing Year Eligibility';
    const levelName = getEducationLevelName(levelKey);
    
    // If exam doesn't have completed_year criteria with session structure, skip this check
    if (!examCompletedYearCriteria || typeof examCompletedYearCriteria !== 'object') {
        return {
            field,
            userValue: userCompletedYear || 'Not specified',
            examRequirement: 'No passing year restriction',
            eligible: true,
            reason: 'No passing year eligibility criteria for this exam',
            skipped: true
        };
    }
    
    // Check if criteria is empty string (most exams have this)
    if (examCompletedYearCriteria === '') {
        return {
            field,
            userValue: userCompletedYear || 'Not specified',
            examRequirement: 'No passing year restriction',
            eligible: true,
            reason: 'No passing year eligibility criteria for this exam',
            skipped: true
        };
    }
    
    // Get criteria for this exam session
    const sessionCriteria = examCompletedYearCriteria[examSession];
    
    // If no criteria for this session, skip check
    if (!sessionCriteria || !sessionCriteria.passed) {
        return {
            field,
            userValue: userCompletedYear || 'Not specified',
            examRequirement: 'No restriction for this session',
            eligible: true,
            reason: `No passing year restriction for ${examSession} session`,
            skipped: true
        };
    }
    
    // User must provide status and year
    if (!userStatus) {
        return {
            field,
            userValue: 'Status not specified',
            examRequirement: formatPassingYearRequirement(sessionCriteria, examSession),
            eligible: false,
            reason: `Please specify your ${levelName} status (Passed/Appearing)`
        };
    }
    
    if (!userCompletedYear) {
        return {
            field,
            userValue: 'Year not specified',
            examRequirement: formatPassingYearRequirement(sessionCriteria, examSession),
            eligible: false,
            reason: `Please specify your ${levelName} passing/appearing year`
        };
    }
    
    const normalizedStatus = userStatus.toUpperCase().trim();
    const userYear = String(userCompletedYear).trim();
    
    // If user is APPEARING
    if (normalizedStatus === 'APPEARING' || normalizedStatus.includes('APPEARING')) {
        const appearingYear = String(sessionCriteria.appearing).trim();
        
        if (userYear === appearingYear) {
            return {
                field,
                userValue: `Appearing in ${userYear}`,
                examRequirement: formatPassingYearRequirement(sessionCriteria, examSession),
                eligible: true,
                reason: `✓ Appearing in ${userYear} is eligible for ${examSession} session`
            };
        } else {
            return {
                field,
                userValue: `Appearing in ${userYear}`,
                examRequirement: formatPassingYearRequirement(sessionCriteria, examSession),
                eligible: false,
                reason: `✗ For ${examSession} session, you must be appearing in ${appearingYear}. You are appearing in ${userYear}`
            };
        }
    }
    
    // If user is PASSED
    if (normalizedStatus === 'PASSED' || normalizedStatus.includes('PASSED')) {
        const eligiblePassedYears = sessionCriteria.passed.map(y => String(y).trim());
        
        if (eligiblePassedYears.includes(userYear)) {
            return {
                field,
                userValue: `Passed in ${userYear}`,
                examRequirement: formatPassingYearRequirement(sessionCriteria, examSession),
                eligible: true,
                reason: `✓ ${levelName} passed in ${userYear} is eligible for ${examSession} session`
            };
        } else {
            return {
                field,
                userValue: `Passed in ${userYear}`,
                examRequirement: formatPassingYearRequirement(sessionCriteria, examSession),
                eligible: false,
                reason: `✗ ${levelName} passed in ${userYear} is NOT eligible for ${examSession}. Must have passed in ${eligiblePassedYears.join(' or ')}`
            };
        }
    }
    
    // Unknown status
    return {
        field,
        userValue: `${userStatus} (${userYear})`,
        examRequirement: formatPassingYearRequirement(sessionCriteria, examSession),
        eligible: false,
        reason: `Invalid status: ${userStatus}. Must be PASSED or APPEARING`
    };
};

/**
 * Helper function to format the passing year requirement for display
 */
const formatPassingYearRequirement = (sessionCriteria, examSession) => {
    if (!sessionCriteria) return 'No restriction';
    
    const passedYears = sessionCriteria.passed || [];
    const appearingYear = sessionCriteria.appearing || '';
    
    let requirement = `For ${examSession}: `;
    
    if (passedYears.length > 0) {
        requirement += `Passed in ${passedYears.join('/')}`;
    }
    
    if (appearingYear) {
        if (passedYears.length > 0) {
            requirement += ` OR `;
        }
        requirement += `Appearing in ${appearingYear}`;
    }
    
    return requirement;
};

// ============================================
// COMPREHENSIVE EDUCATION CHECK
// ============================================

/**
 * Perform comprehensive education eligibility check
 * This is the main function that checks all education-related eligibility
 * 
 * @param {Object} userInput - User's input data with education details
 * @param {Object} examData - Exam JSON data
 * @param {Object} eduFinalData - edu_final.json data (for form population)
 * @returns {Object} Complete education eligibility result
 */
export const checkEducationEligibility = (userInput, examData, eduFinalData = null) => {
    const results = [];
    let allEligible = true;
    
    const addResult = (result) => {
        if (result) {
            results.push(result);
            if (!result.eligible) {
                allEligible = false;
            }
        }
    };
    
    // Get exam's minimum required education level
    const examRequiredLevel = examData?.highest_education_qualification;
    
    // 1. Check highest education qualification
    const highestEduResult = checkHighestEducationQualification(
        userInput.highest_education_qualification,
        examRequiredLevel
    );
    addResult(highestEduResult);
    
    // If highest education check fails, return early
    if (!highestEduResult.eligible) {
        return {
            eligible: false,
            results,
            summary: 'Education qualification not met'
        };
    }
    
    // 2. Get required education levels (from exam's requirement to 10th)
    const examRequiredLevelKey = getEducationLevelKey(examRequiredLevel);
    const requiredLevels = getRequiredEducationLevels(examRequiredLevel);
    
    // 3. Check each required education level
    const userEducationData = userInput.education_levels || {};
    const examEducationLevels = examData?.education_levels || {};
    const userCategory = userInput.caste_category || 'GEN';
    const isPwd = userInput.pwd_status === 'YES' || userInput.pwd_status === true;
    
    for (const levelKey of requiredLevels) {
        const levelUserData = userEducationData[levelKey] || {};
        
        // Skip if this level is empty in exam (no specific requirements)
        if (!examEducationLevels[levelKey] || examEducationLevels[levelKey] === '') {
            continue;
        }
        
        // Check course
        const courseResult = checkEducationCourse(
            levelUserData.course,
            examEducationLevels,
            levelKey
        );
        addResult(courseResult);
        
        // Check subject
        const subjectResult = checkEducationSubject(
            levelUserData.subject,
            examEducationLevels,
            levelKey,
            levelUserData.course
        );
        addResult(subjectResult);
        
        // Check marks percentage (with PWD consideration for certain exams)
        const marksResult = checkMarksPercentageWithPwd(
            levelUserData.marks_percentage,
            examData,
            levelKey,
            userCategory,
            isPwd
        );
        addResult(marksResult);
    }
    
    // 4. Check diploma/12th equivalency if applicable
    const equivalencyResult = checkDiploma12thEquivalency(
        userEducationData,
        examEducationLevels
    );
    addResult(equivalencyResult);
    
    return {
        eligible: allEligible,
        results,
        summary: allEligible ? 'Education eligibility met' : 'Education eligibility not met'
    };
};

// ============================================
// FORM DATA GENERATION FUNCTIONS
// ============================================

/**
 * Get complete form structure for an education level
 * Used to dynamically generate form fields
 * 
 * @param {Object} eduFinalData - edu_final.json data
 * @param {string} levelKey - Education level key
 * @returns {Object} Form structure with options
 */
export const getEducationLevelFormData = (eduFinalData, levelKey) => {
    if (!eduFinalData?.education_levels?.[levelKey]) {
        return null;
    }
    
    const levelData = eduFinalData.education_levels[levelKey];
    const levelName = getEducationLevelName(levelKey);
    
    return {
        levelKey,
        levelName,
        requiresUniversity: requiresUniversity(levelKey),
        requiresBoard: requiresBoard(levelKey),
        courseOptions: getCourseOptionsFromEduFinal(eduFinalData, levelKey),
        getSubjectsForCourse: (course) => getSubjectsFromEduFinal(eduFinalData, levelKey, course),
        getStatusForCourse: (course) => getStatusOptionsFromEduFinal(eduFinalData, levelKey, course),
        boardUniversityOptions: getBoardUniversityOptionsFromEduFinal(eduFinalData, levelKey),
        defaultMarksPercentage: getDefaultMarksPercentage(eduFinalData, levelKey)
    };
};

/**
 * Get all education levels hierarchy for user selection
 * @returns {Object[]} Array of education level options with keys and names
 */
export const getAllEducationLevels = () => {
    return [
        { key: 'post_doctorate', name: 'POST DOCTORATE', value: 8 },
        { key: 'phd', name: 'PHD', value: 7 },
        { key: 'post_graduation', name: 'POST GRADUATION', value: 6 },
        { key: 'graduation', name: 'GRADUATION', value: 5 },
        { key: 'diploma', name: 'DIPLOMA / ITI (POLYTECHNIC, ITI, DPHARM, PGDCA)', value: 4 },
        { key: '12th_higher_secondary', name: '(12TH) HIGHER SECONDARY', value: 3 },
        { key: '10th_secondary', name: '(10TH) SECONDARY', value: 2 }
    ];
};

/**
 * Determine which education levels form should show based on user's highest qualification
 * Levels higher than exam requirement are for future use (ignored for eligibility)
 * @param {string} userHighestLevel - User's highest education level
 * @param {string} examRequiredLevel - Exam's minimum required level
 * @returns {Object} Object with levels to show and which are for eligibility
 */
export const getFormEducationLevels = (userHighestLevel, examRequiredLevel) => {
    const userLevels = getUserEducationLevels(userHighestLevel);
    const examRequiredKey = getEducationLevelKey(examRequiredLevel);
    const examHierarchyValue = getEducationHierarchyValue(examRequiredLevel);
    
    return userLevels.map(levelKey => {
        const hierarchyValue = EDUCATION_HIERARCHY[EDUCATION_KEY_TO_NAME[levelKey]] || 0;
        return {
            key: levelKey,
            name: getEducationLevelName(levelKey),
            isForEligibility: hierarchyValue <= examHierarchyValue,
            isHigherThanRequired: hierarchyValue > examHierarchyValue,
            isMandatory: hierarchyValue <= examHierarchyValue && hierarchyValue >= 2
        };
    });
};

/**
 * Check if education level field should be shown
 * @param {string} examRequiredLevel - Exam's minimum required level
 * @returns {boolean}
 */
export const shouldShowEducationField = (examRequiredLevel) => {
    return examRequiredLevel && 
           examRequiredLevel !== '' && 
           examRequiredLevel !== 'NO EDUCATION' &&
           examRequiredLevel !== 'NOT APPLICABLE';
};

// ============================================
// LEGACY COMPATIBILITY EXPORTS
// (For backward compatibility with existing code)
// ============================================

export const getEducationLevel = getEducationHierarchyValue;
export const getEducationLevels = getAllEducationLevels;
export const getEducationOptions = getAllEducationLevels;
export const getEducationHierarchy = () => EDUCATION_HIERARCHY;

// ============================================
// EDU_FINAL DATA - Cached from top-level import
// ============================================

// Initialize cached data directly from import (eduFinalJson imported at top of file)
let cachedEduFinalData = eduFinalJson || null;

/**
 * Load and cache edu_final.json data
 * Uses direct import for reliable Vite bundling
 * @returns {Promise<Object>} edu_final.json data
 */
export const loadEduFinalData = async () => {
    if (cachedEduFinalData) {
        return cachedEduFinalData;
    }
    
    // Use directly imported data
    if (eduFinalJson) {
        cachedEduFinalData = eduFinalJson;
        return cachedEduFinalData;
    }
    
    // Fallback to fetch if import failed
    try {
        const response = await fetch('/other files/edu_final.json');
        if (!response.ok) {
            console.error('Failed to load edu_final.json');
            return null;
        }
        cachedEduFinalData = await response.json();
        return cachedEduFinalData;
    } catch (error) {
        console.error('Error loading edu_final.json:', error);
        return null;
    }
};

/**
 * Synchronous getter for cached edu_final data (call loadEduFinalData first)
 * @returns {Object|null} edu_final.json data or null if not loaded
 */
export const getEduFinalData = () => cachedEduFinalData;

/**
 * Set edu_final data directly (useful when loaded from elsewhere)
 * @param {Object} data - edu_final.json data
 */
export const setEduFinalData = (data) => {
    cachedEduFinalData = data;
};

// ============================================
// BACKWARD-COMPATIBLE FUNCTIONS (with embedded data)
// These functions work without needing to pass edu_final data
// ============================================

/**
 * Get courses for a specific education level (backward compatible)
 * Uses embedded course data or cached edu_final.json
 * @param {string} levelKey - Education level key or name
 * @returns {Array<{value: string, label: string}>} Array of course options with value and label
 */
export const getCoursesForLevel = (levelKey) => {
    // Normalize level key
    const normalizedKey = getEducationLevelKey(levelKey) || levelKey?.toLowerCase()?.replace(/ /g, '_');
    
    let courses = [];
    
    // If we have cached edu_final data, use it
    if (cachedEduFinalData) {
        courses = getCourseOptionsFromEduFinal(cachedEduFinalData, normalizedKey);
    } else {
        // Fallback to embedded course data
        courses = EMBEDDED_COURSE_DATA[normalizedKey] || [];
    }
    
    // Convert string array to array of objects with value and label
    return courses.map(course => ({
        value: course,
        label: course
    }));
};

/**
 * Get subjects for a specific course (backward compatible)
 * Uses embedded subject data or cached edu_final.json
 * @param {string} course - Course name
 * @param {string} levelKey - Optional education level key
 * @returns {Array<{value: string, label: string}>} Array of subject options with value and label
 */
export const getSubjectsForCourse = (course, levelKey = null) => {
    let subjects = [];
    
    // If we have cached edu_final data, use it
    if (cachedEduFinalData && levelKey) {
        const normalizedKey = getEducationLevelKey(levelKey) || levelKey?.toLowerCase()?.replace(/ /g, '_');
        subjects = getSubjectsFromEduFinal(cachedEduFinalData, normalizedKey, course);
    } else {
        // Fallback to embedded subject data
        subjects = EMBEDDED_SUBJECT_DATA[course] || [];
    }
    
    // Convert string array to array of objects with value and label
    return subjects.map(subject => ({
        value: subject,
        label: subject
    }));
};

/**
 * Get all courses (backward compatible)
 * @returns {string[]} Array of all course options
 */
export const getAllCourses = () => {
    return Object.values(EMBEDDED_COURSE_DATA).flat();
};

/**
 * Find which level a course belongs to (backward compatible)
 * @param {string} course - Course name
 * @returns {string|null} Level key or null
 */
export const findCourseLevel = (course) => {
    for (const [levelKey, courses] of Object.entries(EMBEDDED_COURSE_DATA)) {
        if (courses.includes(course)) {
            return levelKey;
        }
    }
    return null;
};

/**
 * Check if a course is valid for a level (backward compatible)
 * @param {string} course - Course name
 * @param {string} levelKey - Education level key
 * @returns {boolean}
 */
export const isValidCourseForLevel = (course, levelKey) => {
    const courses = getCoursesForLevel(levelKey);
    return courses.includes(course);
};

/**
 * Get all subjects for a level (backward compatible)
 * @param {string} levelKey - Education level key
 * @returns {string[]} Array of all subject options
 */
export const getAllSubjectsForLevel = (levelKey) => {
    const courses = getCoursesForLevel(levelKey);
    const subjects = [];
    courses.forEach(course => {
        const courseSubjects = getSubjectsForCourse(course, levelKey);
        subjects.push(...courseSubjects);
    });
    return [...new Set(subjects)]; // Remove duplicates
};

/**
 * Find which courses have a specific subject (backward compatible)
 * @param {string} subject - Subject name
 * @returns {string[]} Array of course names
 */
export const findSubjectCourses = (subject) => {
    const courses = [];
    for (const [course, subjects] of Object.entries(EMBEDDED_SUBJECT_DATA)) {
        if (subjects.includes(subject)) {
            courses.push(course);
        }
    }
    return courses;
};

/**
 * Check if a subject is valid for a course (backward compatible)
 * @param {string} subject - Subject name
 * @param {string} course - Course name
 * @returns {boolean}
 */
export const isValidSubjectForCourse = (subject, course) => {
    const subjects = getSubjectsForCourse(course);
    return subjects.includes(subject);
};

// ============================================
// BACKWARD-COMPATIBLE CHECK FUNCTIONS
// (For eligibilityChecker.js compatibility)
// ============================================

/**
 * Check eligibility education course (backward compatible)
 * This wraps the new checkEducationCourse function
 * @param {string} userCourse - User's course
 * @param {string|Object} examCourses - Exam's required courses (can be string or education_levels object)
 * @param {string} userEducationLevel - User's education level
 * @returns {Object} Check result
 */
export const checkEligibilityEducationCourse = (userCourse, examCourses, userEducationLevel) => {
    const field = 'eligibility_education_course';
    
    // Handle special cases
    if (!examCourses || examCourses === '' || 
        examCourses === 'ALL APPLICABLE' || 
        examCourses === 'NOT APPLICABLE' ||
        examCourses === 'ALL COURSES' ||
        examCourses === 'ANY') {
        return {
            field,
            userValue: userCourse || 'Not specified',
            examRequirement: examCourses || 'All courses accepted',
            eligible: true,
            reason: 'All courses are accepted'
        };
    }
    
    if (!userCourse) {
        return {
            field,
            userValue: 'Not specified',
            examRequirement: String(examCourses),
            eligible: false,
            reason: 'Course not specified'
        };
    }
    
    // If examCourses is a string (comma-separated list)
    if (typeof examCourses === 'string') {
        const allowedCourses = examCourses.split(',').map(c => c.trim().toUpperCase());
        const normalizedUserCourse = userCourse.toUpperCase().trim();
        
        const eligible = allowedCourses.some(allowed => 
            allowed === normalizedUserCourse ||
            allowed.includes(normalizedUserCourse) ||
            normalizedUserCourse.includes(allowed) ||
            allowed === 'OTHER' ||
            allowed === 'ALL'
        );
        
        return {
            field,
            userValue: userCourse,
            examRequirement: examCourses,
            eligible,
            reason: eligible
                ? `Course ${userCourse} is accepted`
                : `Course ${userCourse} is not in the allowed list: ${examCourses}`
        };
    }
    
    // If examCourses is an object (education_levels structure)
    if (typeof examCourses === 'object') {
        const levelKey = getEducationLevelKey(userEducationLevel) || 'graduation';
        return checkEducationCourse(userCourse, examCourses, levelKey);
    }
    
    return {
        field,
        userValue: userCourse,
        examRequirement: String(examCourses),
        eligible: true,
        reason: 'Unable to validate course'
    };
};

/**
 * Check eligibility education course subject (backward compatible)
 * This wraps the new checkEducationSubject function
 * @param {string} userSubject - User's subject
 * @param {string|Object} examSubjects - Exam's required subjects (can be string or education_levels object)
 * @param {string} userCourse - User's course
 * @returns {Object} Check result
 */
export const checkEligibilityEducationCourseSubject = (userSubject, examSubjects, userCourse) => {
    const field = 'eligibility_education_course_subject';
    
    // Handle special cases
    if (!examSubjects || examSubjects === '' || 
        examSubjects === 'ALL APPLICABLE' || 
        examSubjects === 'NOT APPLICABLE' ||
        examSubjects === 'ALL SUBJECTS' ||
        examSubjects === 'ANY') {
        return {
            field,
            userValue: userSubject || 'Not specified',
            examRequirement: examSubjects || 'All subjects accepted',
            eligible: true,
            reason: 'All subjects are accepted'
        };
    }
    
    if (!userSubject) {
        return {
            field,
            userValue: 'Not specified',
            examRequirement: String(examSubjects),
            eligible: false,
            reason: 'Subject not specified'
        };
    }
    
    // If examSubjects is a string (comma-separated list)
    if (typeof examSubjects === 'string') {
        const allowedSubjects = examSubjects.split(',').map(s => s.trim().toUpperCase());
        const normalizedUserSubject = userSubject.toUpperCase().trim();
        
        const eligible = allowedSubjects.some(allowed => 
            allowed === normalizedUserSubject ||
            allowed.includes(normalizedUserSubject) ||
            normalizedUserSubject.includes(allowed) ||
            allowed === 'OTHER' ||
            allowed === 'ALL'
        );
        
        return {
            field,
            userValue: userSubject,
            examRequirement: examSubjects,
            eligible,
            reason: eligible
                ? `Subject ${userSubject} is accepted`
                : `Subject ${userSubject} is not in the allowed list: ${examSubjects}`
        };
    }
    
    // If examSubjects is an object (education_levels structure)
    if (typeof examSubjects === 'object') {
        // Try to find the level from course
        const levelKey = findCourseLevel(userCourse) || 'graduation';
        return checkEducationSubject(userSubject, examSubjects, levelKey, userCourse);
    }
    
    return {
        field,
        userValue: userSubject,
        examRequirement: String(examSubjects),
        eligible: true,
        reason: 'Unable to validate subject'
    };
};

// ============================================
// EMBEDDED DATA (Fallback when edu_final.json not loaded)
// ============================================

const EMBEDDED_COURSE_DATA = {
    'post_doctorate': ['Post Doctoral Fellowship', 'OTHER'],
    'phd': ['PhD', 'OTHER'],
    'post_graduation': ['MTech', 'MBA', 'MSc', 'MA', 'MCom', 'MD', 'MS (Medical)', 'LLM', 'MCA', 'MPharm', 'MArch', 'OTHER'],
    'graduation': ['BTech', 'BE', 'BSc', 'BA', 'BCom', 'MBBS', 'BDS', 'LLB', 'BCA', 'BBA', 'BPharm', 'BEd', 'BArch', 'BHM', 'OTHER'],
    'diploma': ['Polytechnic Diploma', 'ITI', 'DPharm', 'PGDCA', 'OTHER'],
    '12th_higher_secondary': ['Science', 'Commerce', 'Arts', 'Vocational', 'OTHER'],
    '10th_secondary': ['(10TH) SECONDARY'],
    '8th_class': ['CLASS VIII'],
    '5th_class': ['CLASS V']
};

const EMBEDDED_SUBJECT_DATA = {
    // Graduation courses
    'BTech': ['Computer Science & Engineering', 'Information Technology', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics & Communication', 'OTHER'],
    'BE': ['Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Computer Engineering', 'OTHER'],
    'BSc': ['Physics', 'Chemistry', 'Mathematics', 'Computer Science', 'Biotechnology', 'OTHER'],
    'BA': ['Economics', 'English', 'History', 'Political Science', 'Psychology', 'OTHER'],
    'BCom': ['Accounting', 'Finance', 'Taxation', 'Banking & Insurance', 'OTHER'],
    'MBBS': ['General Medicine', 'OTHER'],
    'BDS': ['Dental Surgery', 'OTHER'],
    'LLB': ['Corporate Law', 'Criminal Law', 'Civil Law', 'OTHER'],
    'BCA': ['Computer Applications', 'Software Development', 'OTHER'],
    'BBA': ['Finance', 'Marketing', 'Human Resource Management', 'OTHER'],
    'BPharm': ['Pharmaceutical Chemistry', 'Pharmacology', 'OTHER'],
    'BEd': ['Education', 'OTHER'],
    'BArch': ['Architecture', 'OTHER'],
    'BHM': ['Food Production', 'Housekeeping', 'OTHER'],
    
    // 12th courses
    'Science': ['Physics, Chemistry, Mathematics (PCM)', 'Physics, Chemistry, Biology (PCB)', 'Physics, Chemistry, Mathematics, Biology (PCMB)', 'OTHER'],
    'Commerce': ['Accountancy, Business Studies, Economics', 'Accountancy, Mathematics, Economics', 'OTHER'],
    'Arts': ['History, Political Science, Geography', 'Economics, Sociology, Psychology', 'OTHER'],
    'Vocational': ['IT & ITeS', 'Retail Management', 'Healthcare', 'OTHER'],
    
    // Diploma courses
    'Polytechnic Diploma': ['Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Computer Engineering', 'OTHER'],
    'ITI': ['Fitter', 'Electrician', 'Welder', 'COPA', 'OTHER'],
    'DPharm': ['Pharmacy', 'OTHER'],
    'PGDCA': ['Computer Applications', 'OTHER'],
    
    // Default
    'OTHER': ['OTHER'],
    '(10TH) SECONDARY': ['Science, Mathematics, Social Science, Languages', 'OTHER'],
    'CLASS VIII': ['Science, Mathematics, Social Science, Languages', 'OTHER'],
    'CLASS V': ['English, Hindi, Mathematics, Environmental Studies', 'OTHER']
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
    // Constants
    EDUCATION_HIERARCHY,
    EDUCATION_LEVEL_KEYS,
    EDUCATION_KEY_TO_NAME,
    UNIVERSITY_LEVELS,
    BOARD_LEVELS,
    EQUIVALENT_LEVELS,
    
    // Helper functions
    normalizeEducationLevel,
    getEducationHierarchyValue,
    getEducationLevelKey,
    getEducationLevelName,
    requiresUniversity,
    requiresBoard,
    getRequiredEducationLevels,
    getUserEducationLevels,
    parsePercentage,
    
    // Data functions (from edu_final.json)
    getCourseOptionsFromEduFinal,
    getSubjectsFromEduFinal,
    getStatusOptionsFromEduFinal,
    getBoardUniversityOptionsFromEduFinal,
    getDefaultMarksPercentage,
    loadEduFinalData,
    getEduFinalData,
    setEduFinalData,
    
    // Backward-compatible functions
    getCoursesForLevel,
    getSubjectsForCourse,
    getAllCourses,
    findCourseLevel,
    isValidCourseForLevel,
    getAllSubjectsForLevel,
    findSubjectCourses,
    isValidSubjectForCourse,
    
    // Eligibility check functions
    checkHighestEducationQualification,
    checkEducationCourse,
    checkEducationSubject,
    checkMarksPercentage,
    checkMarksPercentageWithPwd,
    checkDiploma12thEquivalency,
    checkSubjectSpecificCondition,
    checkCompletedYearEligibility,
    checkEducationEligibility,
    
    // Form data functions
    getEducationLevelFormData,
    getAllEducationLevels,
    getFormEducationLevels,
    shouldShowEducationField,
    
    // Legacy compatibility
    getEducationLevel,
    getEducationLevels,
    getEducationOptions,
    getEducationHierarchy
};
