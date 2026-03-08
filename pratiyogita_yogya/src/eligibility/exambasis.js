/**
 * Exam Basis Eligibility Checker
 * 
 * This module handles the "Exam Basis" search mode:
 * User selects a specific exam first, then fills their details 
 * to check if they're eligible for that specific exam.
 */

import {
    checkFullEligibility,
    getDisplayDetails
} from "./eligibilityChecker";

import {
    getExamDropdownOptions,
    loadExamData,
    getDivisionOptions,
    getDivisionData,
    examHasDivisions,
    getExamSessionOptions
} from "./examDataLoader";

// ============================================
// EXTRACT OPTIONS FROM EXAM DATA
// ============================================

/**
 * Extract unique values for a field from exam data (including all divisions)
 */
export const extractOptionsFromExamData = (examData, fieldName) => {
    if (!examData) return [];
    
    const uniqueValues = new Set();
    
    // Check if exam has divisions (academies, posts, etc.)
    const divisionFields = ['academies', 'posts', 'departments', 'courses', 'classes'];
    let hasDivisions = false;
    let divisionsData = null;
    
    for (const field of divisionFields) {
        if (examData[field] && typeof examData[field] === 'object') {
            hasDivisions = true;
            divisionsData = examData[field];
            break;
        }
    }
    
    if (hasDivisions && divisionsData) {
        // Extract from all divisions
        Object.values(divisionsData).forEach(divisionData => {
            if (divisionData && divisionData[fieldName]) {
                const values = divisionData[fieldName].toString().split(',').map(v => v.trim().toUpperCase());
                values.forEach(v => {
                    if (v && v !== '' && v !== 'NOT APPLICABLE' && v !== 'ALL APPLICABLE') {
                        uniqueValues.add(v);
                    }
                });
            }
        });
    } else {
        // Non-division exam - extract directly
        if (examData[fieldName]) {
            const values = examData[fieldName].toString().split(',').map(v => v.trim().toUpperCase());
            values.forEach(v => {
                if (v && v !== '' && v !== 'NOT APPLICABLE' && v !== 'ALL APPLICABLE') {
                    uniqueValues.add(v);
                }
            });
        }
    }
    
    return Array.from(uniqueValues);
};

/**
 * Extract unique mandatory subjects from exam data (from education_levels in all divisions)
 * Returns array like ["MATHEMATICS", "STATISTICS", etc.]
 */
export const extractMandatorySubjectsFromExamData = (examData) => {
    if (!examData) return [];
    
    const uniqueSubjects = new Set();
    
    // Check if exam has divisions (academies, posts, etc.)
    const divisionFields = ['academies', 'posts', 'departments', 'courses', 'classes'];
    let hasDivisions = false;
    let divisionsData = null;
    
    for (const field of divisionFields) {
        if (examData[field] && typeof examData[field] === 'object') {
            hasDivisions = true;
            divisionsData = examData[field];
            break;
        }
    }
    
    // Helper to extract mandatory subjects from education_levels
    const extractFromEducationLevels = (educationLevels) => {
        if (!educationLevels || typeof educationLevels !== 'object') return;
        
        const levelKeys = ['graduation', 'post_graduation', '12th_higher_secondary', '10th_secondary', 'diploma', 'phd', 'post_doctorate'];
        
        levelKeys.forEach(levelKey => {
            const levelData = educationLevels[levelKey];
            if (levelData && typeof levelData === 'object') {
                // Extract from mandatory_subject (string)
                const mandatorySubject = levelData.mandatory_subject;
                if (mandatorySubject && mandatorySubject.trim() !== '' && mandatorySubject.toUpperCase() !== 'NOT APPLICABLE') {
                    // Handle comma-separated subjects
                    const subjects = mandatorySubject.split(',').map(s => s.trim().toUpperCase());
                    subjects.forEach(s => {
                        if (s && s !== '') {
                            uniqueSubjects.add(s);
                        }
                    });
                }
                
                // Extract from mandatory_subjects (array)
                const mandatorySubjects = levelData.mandatory_subjects;
                if (mandatorySubjects && Array.isArray(mandatorySubjects) && mandatorySubjects.length > 0) {
                    mandatorySubjects.forEach(subject => {
                        if (subject && subject.trim() !== '') {
                            uniqueSubjects.add(subject.trim().toUpperCase());
                        }
                    });
                }
            }
        });
    };
    
    if (hasDivisions && divisionsData) {
        // Extract from all divisions
        Object.values(divisionsData).forEach(divisionData => {
            if (divisionData && divisionData.education_levels) {
                extractFromEducationLevels(divisionData.education_levels);
            }
        });
    } else {
        // Non-division exam
        if (examData.education_levels) {
            extractFromEducationLevels(examData.education_levels);
        }
    }
    
    return Array.from(uniqueSubjects);
};

/**
 * Check if exam requires marks percentage for mandatory subjects
 * Returns true if any division/post has mandatory_subject_marks_percentage or mandatory_subjects_marks_percentage
 */
export const checkIfExamRequiresSubjectMarks = (examData) => {
    if (!examData) return false;
    
    // Check if exam has divisions
    const divisionFields = ['academies', 'posts', 'departments', 'courses', 'classes'];
    let hasDivisions = false;
    let divisionsData = null;
    
    for (const field of divisionFields) {
        if (examData[field] && typeof examData[field] === 'object') {
            hasDivisions = true;
            divisionsData = examData[field];
            break;
        }
    }
    
    // Helper to check if education_levels has marks requirement
    const checkEducationLevels = (educationLevels) => {
        if (!educationLevels || typeof educationLevels !== 'object') return false;
        
        const levelKeys = ['graduation', 'post_graduation', '12th_higher_secondary', '10th_secondary', 'diploma', 'phd', 'post_doctorate'];
        
        for (const levelKey of levelKeys) {
            const levelData = educationLevels[levelKey];
            if (levelData && typeof levelData === 'object') {
                // Check for single subject marks requirement
                if (levelData.mandatory_subject_marks_percentage && 
                    typeof levelData.mandatory_subject_marks_percentage === 'object') {
                    return true;
                }
                // Check for multiple subjects marks requirement
                if (levelData.mandatory_subjects_marks_percentage && 
                    typeof levelData.mandatory_subjects_marks_percentage === 'object') {
                    return true;
                }
            }
        }
        return false;
    };
    
    if (hasDivisions && divisionsData) {
        // Check in any division
        for (const divisionData of Object.values(divisionsData)) {
            if (divisionData && divisionData.education_levels) {
                if (checkEducationLevels(divisionData.education_levels)) {
                    return true;
                }
            }
        }
    } else {
        // Check in root exam data
        if (examData.education_levels) {
            return checkEducationLevels(examData.education_levels);
        }
    }
    
    return false;
};

/**
 * Extract nationality values from exam data (handles both array and comma-separated string formats)
 */
export const extractNationalityFromExamData = (examData) => {
    if (!examData) return [];
    
    const uniqueValues = new Set();
    
    // Check if exam has divisions
    const divisionFields = ['academies', 'posts', 'departments', 'courses', 'classes'];
    let hasDivisions = false;
    let divisionsData = null;
    
    for (const field of divisionFields) {
        if (examData[field] && typeof examData[field] === 'object') {
            hasDivisions = true;
            divisionsData = examData[field];
            break;
        }
    }
    
    /**
     * Parse nationality data - handles array, string, or comma-separated string
     * @param {string|string[]} data - Nationality data
     */
    const parseNationalityData = (data) => {
        if (!data) return;
        
        // Handle "ALL ELIGIBLE" or "ALL APPLICABLE" - return empty (means all)
        if (typeof data === 'string') {
            const upperData = data.toUpperCase().trim();
            if (upperData === 'ALL ELIGIBLE' || upperData === 'ALL APPLICABLE' || upperData === 'NOT APPLICABLE') {
                return; // No specific restrictions
            }
            
            // Handle comma-separated string (legacy format)
            const values = data.split(',').map(v => v.trim());
            values.forEach(v => {
                if (v && v !== '' && v.toUpperCase() !== 'NOT APPLICABLE' && v.toUpperCase() !== 'ALL APPLICABLE' && v.toUpperCase() !== 'ALL ELIGIBLE') {
                    uniqueValues.add(v);
                }
            });
        } else if (Array.isArray(data)) {
            // Handle array format (new format)
            data.forEach(v => {
                if (v && typeof v === 'string' && v.trim() !== '' && 
                    v.toUpperCase() !== 'NOT APPLICABLE' && 
                    v.toUpperCase() !== 'ALL APPLICABLE' && 
                    v.toUpperCase() !== 'ALL ELIGIBLE') {
                    uniqueValues.add(v.trim());
                }
            });
        }
    };
    
    if (hasDivisions && divisionsData) {
        // Extract from all divisions
        Object.values(divisionsData).forEach(divisionData => {
            if (divisionData && divisionData.nationality) {
                parseNationalityData(divisionData.nationality);
            }
        });
    } else {
        // Non-division exam
        if (examData.nationality) {
            parseNationalityData(examData.nationality);
        }
    }
    
    return Array.from(uniqueValues);
};

/**
 * Convert extracted values to dropdown options format
 */
export const valuesToOptions = (values, labelMap = {}) => {
    return values.map(value => ({
        value: value,
        label: labelMap[value] || value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ')
    }));
};

// ============================================
// EXAM DATA LOADING
// ============================================

/**
 * Load exam data and extract all necessary information
 * @param {string} examCode - The exam code to load
 * @param {Array} examOptions - List of available exam options
 * @returns {Object} - { examData, displayDetails, hasDivisions, divisions, error }
 */
export const loadExamDataForBasis = async (examCode, examOptions) => {
    if (!examCode) {
        return {
            examData: null,
            displayDetails: null,
            hasDivisions: false,
            divisions: [],
            error: null
        };
    }

    // Find the exam info
    const examInfo = examOptions.find(e => e.value === examCode);
    if (!examInfo || !examInfo.linkedFile) {
        return {
            examData: null,
            displayDetails: null,
            hasDivisions: false,
            divisions: [],
            error: "Exam data not available"
        };
    }

    try {
        const data = await loadExamData(examInfo.linkedFile);
        if (!data) {
            return {
                examData: null,
                displayDetails: null,
                hasDivisions: false,
                divisions: [],
                error: "Failed to load exam data"
            };
        }

        const displayDetails = getDisplayDetails(data);
        const hasDiv = examHasDivisions(data);
        
        let divisionsList = [];
        if (hasDiv) {
            const divOpts = getDivisionOptions(data);
            divisionsList = divOpts.map(d => d.value);
        }

        return {
            examData: data,
            displayDetails,
            hasDivisions: hasDiv,
            divisions: divisionsList,
            error: null
        };
    } catch (err) {
        return {
            examData: null,
            displayDetails: null,
            hasDivisions: false,
            divisions: [],
            error: "Error loading exam data: " + err.message
        };
    }
};

// ============================================
// ELIGIBILITY CHECKING
// ============================================

/**
 * Education key mapping from UI format to checker format
 */
const EDUCATION_KEY_MAPPING = {
    'POST DOCTORATE': 'post_doctorate',
    'PHD': 'phd',
    'POST GRADUATION': 'post_graduation',
    'GRADUATION': 'graduation',
    'DIPLOMA / ITI (POLYTECHNIC, ITI, DPHARM, PGDCA)': 'diploma',
    '(12TH)HIGHER SECONDARY': '12th_higher_secondary',
    '(12TH) HIGHER SECONDARY': '12th_higher_secondary',
    '(10TH)SECONDARY': '10th_secondary',
    '(10TH) SECONDARY': '10th_secondary',
    '(8TH)CLASS': '8th_class',
    '(8TH) CLASS': '8th_class',
    '(5TH)CLASS': '5th_class',
    '(5TH) CLASS': '5th_class'
};

/**
 * Prepare user input for eligibility checking
 * @param {Object} formData - The form data from UI
 * @param {Object} educationTableData - Education table data from UI
 * @param {Object} examData - The exam data (optional, for exam basis mode)
 * @returns {Object} - Prepared user input for eligibility checker
 */
export const prepareUserInput = (formData, educationTableData, examData = null) => {
    // Convert DOB to DD-MM-YYYY format for checking
    let dobFormatted = '';
    if (formData.date_of_birth) {
        const dobParts = formData.date_of_birth.split('-');
        dobFormatted = `${dobParts[2]}-${dobParts[1]}-${dobParts[0]}`;
    }

    // Convert educationTableData keys to JSON format expected by checker
    const educationLevelsForChecker = {};

    // Get active backlogs from the EXAM's required education level (not user's highest)
    let activeBacklogsValue = '';
    
    // Get exam's highest_education_qualification from academies/divisions or root level
    let examRequiredEdu = '';
    if (examData) {
        // First check root level
        if (examData.highest_education_qualification) {
            examRequiredEdu = examData.highest_education_qualification;
        } else {
            // Check inside academies/posts/departments/courses/classes
            const divisionFields = ['academies', 'posts', 'departments', 'courses', 'classes'];
            for (const field of divisionFields) {
                if (examData[field] && typeof examData[field] === 'object') {
                    const firstDivision = Object.values(examData[field])[0];
                    if (firstDivision?.highest_education_qualification) {
                        examRequiredEdu = firstDivision.highest_education_qualification;
                        break;
                    }
                }
            }
        }
    }
    examRequiredEdu = examRequiredEdu.toUpperCase();

    Object.entries(educationTableData).forEach(([uiKey, levelData]) => {
        const jsonKey = EDUCATION_KEY_MAPPING[uiKey] || uiKey.toLowerCase().replace(/ /g, '_');
        if (levelData && (levelData.course || levelData.marks || levelData.subject)) {
            educationLevelsForChecker[jsonKey] = {
                course: levelData.course || '',
                subject: levelData.subject || '',
                marks_percentage: levelData.marks || '',
                status: levelData.completionStatus || '',
                completed_year: levelData.completedYear || ''
            };
        }
        
        // Get activeBacklogs from the exam's required education level
        const uiKeyUpper = uiKey.toUpperCase();
        const isExamRequiredLevel = 
            (examRequiredEdu.includes('GRADUATION') && !examRequiredEdu.includes('POST') && uiKeyUpper === 'GRADUATION') ||
            (examRequiredEdu.includes('POST GRADUATION') && uiKeyUpper === 'POST GRADUATION') ||
            ((examRequiredEdu.includes('12TH') || examRequiredEdu.includes('HIGHER SECONDARY')) && uiKeyUpper.includes('12TH')) ||
            ((examRequiredEdu.includes('10TH') || examRequiredEdu === 'SECONDARY') && uiKeyUpper.includes('10TH')) ||
            (examRequiredEdu.includes('DIPLOMA') && uiKeyUpper.includes('DIPLOMA')) ||
            (examRequiredEdu.includes('PHD') && uiKeyUpper === 'PHD') ||
            (examRequiredEdu.includes('POST DOCTORATE') && uiKeyUpper === 'POST DOCTORATE') ||
            ((examRequiredEdu.includes('8TH') || examRequiredEdu.includes('CLASS VIII')) && uiKeyUpper.includes('8TH')) ||
            ((examRequiredEdu.includes('5TH') || examRequiredEdu.includes('CLASS V')) && uiKeyUpper.includes('5TH'));
        
        if (isExamRequiredLevel && levelData && levelData.activeBacklogs) {
            activeBacklogsValue = levelData.activeBacklogs;
        }
    });

    return {
        ...formData,
        date_of_birth: dobFormatted,
        education_levels: educationLevelsForChecker,
        active_backlogs: activeBacklogsValue,
        studiedMandatorySubjects: formData.studiedMandatorySubjects || [],
        subjectWiseMarks: formData.subjectWiseMarks || {}
    };
};

/**
 * Check eligibility for a specific exam (Exam Basis mode)
 * @param {Object} userInput - Prepared user input
 * @param {Object} examData - The loaded exam data
 * @param {boolean} hasDivisions - Whether exam has divisions
 * @param {Array} divisions - List of divisions (if any)
 * @param {string} selectedExam - The selected exam code
 * @returns {Array} - Array of eligibility results for all divisions/sessions
 */
export const checkExamBasisEligibility = (userInput, examData, hasDivisions, divisions, selectedExam) => {
    const allResults = [];

    if (hasDivisions && divisions.length > 0) {
        // Check eligibility for EACH division
        divisions.forEach(divisionName => {
            const divData = getDivisionData(examData, divisionName);
            if (divData) {
                // Get all sessions for this division
                const sessionOptions = getExamSessionOptions(divData);
                
                if (sessionOptions.length > 0) {
                    // Check eligibility for EACH session
                    sessionOptions.forEach(sessionOpt => {
                        const eligibilityResult = checkFullEligibility(
                            userInput,
                            divData,
                            sessionOpt.value
                        );

                        allResults.push({
                            ...eligibilityResult,
                            examName: examData.exam_name || selectedExam,
                            division: divisionName,
                            session: sessionOpt.label,
                            divisionData: divData
                        });
                    });
                } else {
                    // No sessions - single check for division
                    const eligibilityResult = checkFullEligibility(
                        userInput,
                        divData,
                        null
                    );

                    allResults.push({
                        ...eligibilityResult,
                        examName: examData.exam_name || selectedExam,
                        division: divisionName,
                        session: "N/A",
                        divisionData: divData
                    });
                }
            }
        });
    } else {
        // No divisions - check sessions directly from examData
        const sessionOptions = getExamSessionOptions(examData);
        
        if (sessionOptions.length > 0) {
            // Check eligibility for EACH session
            sessionOptions.forEach(sessionOpt => {
                const eligibilityResult = checkFullEligibility(
                    userInput,
                    examData,
                    sessionOpt.value
                );

                allResults.push({
                    ...eligibilityResult,
                    examName: examData.exam_name || selectedExam,
                    division: "N/A",
                    session: sessionOpt.label,
                    divisionData: null
                });
            });
        } else {
            // No sessions - single check
            const eligibilityResult = checkFullEligibility(
                userInput,
                examData,
                null
            );

            allResults.push({
                ...eligibilityResult,
                examName: examData.exam_name || selectedExam,
                division: "N/A",
                session: "N/A",
                divisionData: null
            });
        }
    }

    return allResults;
};

// Re-export functions from examDataLoader for convenience
export { getExamDropdownOptions, loadExamData, getDivisionOptions, getDivisionData, examHasDivisions, getExamSessionOptions };
export { getDisplayDetails };
