/**
 * Eligibility Checker - Main Index File
 * 
 * 14 CHECKS ACTIVE:
 * ✅ 1. Gender
 * ✅ 2. Marital Status  
 * ✅ 3. PWD Status
 * ✅ 4. Caste Category
 * ✅ 5. Nationality
 * ✅ 6. Domicile
 * ✅ 7. Date of Birth
 * ✅ 8-10. Unified Education Level Checker (includes):
 *      - Highest Education Qualification
 *      - Education Course per level
 *      - Education Subject per course
 *      - Marks Percentage (category-wise & PWD-specific)
 *      - Diploma/12th Equivalency
 * ✅ 11. NCC Wing (simple string check)
 * ✅ 12. NCC Certificate (depends on NCC Wing)
 * ✅ 13. NCC Certificate Grade (depends on NCC Certificate)
 * ✅ 14. Active Backlogs Allowed (from highest_education_qualification level)
 * 
 * EDUCATION LEVEL CHECKER:
 * - Uses edu_final.json as the SINGLE SOURCE OF TRUTH for dropdown values
 * - Exam JSONs define eligibility rules only, not dropdown options
 * - Supports education hierarchy: PhD > PG > Graduation > Diploma/12th > 10th
 * - Handles "ALL COURSES" and "ALL SUBJECTS" wildcards
 * - Supports category-wise percentage requirements
 * - Supports PWD-specific percentage requirements (like NEET)
 * - Handles Diploma/12th equivalency (OR condition)
 * 
 * Other checks will be enabled one by one after testing.
 */

// ============================================
// ACTIVE IMPORTS (10 out of 31)
// ============================================

// 1. Gender
import { 
    checkGender, 
    checkGenderNonDivision, 
    checkGenderDivisionBased, 
    detectDivisionStructure, 
    shouldShowGenderField,
    getGenderOptions
} from './gender.js';

// 2. Marital Status
import { 
    checkMaritalStatus,
    getMaritalStatusOptionsByGender,
    isValidMaritalStatusForGender,
    shouldShowMaritalStatusField
} from './marital_status.js';

// 3. PWD Status
import { 
    checkPwdStatus, 
    shouldShowPwdField, 
    getPwdOptions 
} from './pwd_status.js';

// 4. Caste Category
import { 
    checkCasteCategory, 
    getCasteCategoryOptions, 
    shouldShowCasteCategoryField,
    getStandardCategories
} from './caste_category.js';

// 5. Nationality
import { 
    checkNationality, 
    shouldEnableDomicile,
    shouldShowDomicileField as shouldShowDomicileFieldFromNationality,
    getNationalityOptions, 
    shouldShowNationalityField,
    getStandardNationalities,
    isValidNationality,
    getNormalizedNationality,
    STANDARD_NATIONALITIES
} from './nationality.js';

// 6. Domicile
import { 
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
    UNION_TERRITORIES
} from './domicile.js';

// 7. Date of Birth
import { 
    checkDateOfBirth,
    parseDateDDMMYYYY,
    formatDateDDMMYYYY,
    calculateAge,
    formatAge,
    getExamReferenceDate,
    getExamSessions,
    extractYearFromSession,
    getValueForSession,
    resolveCasteWiseDob,
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
    AGE_CRITERIA_TYPES
} from './date_of_birth.js';

// 8-10. Unified Education Level Checker (replaces highest_education_qualification, eligibility_education_course, eligibility_education_course_subject)
import {
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
    checkEligibilityEducationCourse,
    checkEligibilityEducationCourseSubject,
    
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
} from './education_level.js';

// 11. NCC Wing
import {
    checkNccWing
} from './ncc_wing.js';

// 12. NCC Certificate
import {
    checkNccCertificate,
    getAllowedCertificates
} from './ncc_certificate.js';

// 13. NCC Certificate Grade
import {
    checkNccCertificateGrade,
    getAllowedGrades
} from './ncc_certificate_grade.js';

// 14. Active Backlogs Allowed
import {
    checkActiveBacklogsAllowed,
    getActiveBacklogsFromExam,
    getEducationLevelKeyForBacklogs,
    shouldShowActiveBacklogsField,
    getBacklogRequirementDescription
} from './active_backlogs_allowed.js';

// 15. Age Relaxation (for reserved categories)
import {
    parseRelaxationYears,
    getRelaxationForCategory,
    applyRelaxationToDobRange,
    applyRelaxationToAgeRange,
    checkDobWithRelaxation,
    checkAgeWithRelaxation,
    formatRelaxationInfo
} from './age_relaxation.js';

// 16. Mandatory Subject (for posts requiring specific subjects)
import {
    checkMandatorySubjectEligibility
} from './mandatory_subject.js';

// 17. Completion Status (PASSED, APPEARING, year/semester)
import {
    checkCompletionStatus,
    checkCompletionStatusWithDivisions,
    parseStatusData,
    isAllStatusesEligible,
    COMPLETION_STATUS_VALUES
} from './completion_status.js';

// ============================================
// EXPORTS - 14 active checkers
// ============================================

export {
    // 11. NCC Wing
    checkNccWing,
    // 1. Gender
    checkGender,
    checkGenderNonDivision,
    checkGenderDivisionBased,
    detectDivisionStructure,
    shouldShowGenderField,
    getGenderOptions,
    
    // 2. Marital Status
    checkMaritalStatus,
    getMaritalStatusOptionsByGender,
    isValidMaritalStatusForGender,
    shouldShowMaritalStatusField,
    
    // 3. PWD Status
    checkPwdStatus,
    shouldShowPwdField,
    getPwdOptions,
    
    // 4. Caste Category
    checkCasteCategory,
    getCasteCategoryOptions,
    shouldShowCasteCategoryField,
    getStandardCategories,
    
    // 5. Nationality
    checkNationality,
    shouldEnableDomicile,
    shouldShowDomicileFieldFromNationality,
    getNationalityOptions,
    shouldShowNationalityField,
    getStandardNationalities,
    isValidNationality,
    getNormalizedNationality,
    STANDARD_NATIONALITIES,
    
    // 6. Domicile
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
    
    // 7. Date of Birth
    checkDateOfBirth,
    parseDateDDMMYYYY,
    formatDateDDMMYYYY,
    calculateAge,
    formatAge,
    getExamReferenceDate,
    getExamSessions,
    extractYearFromSession,
    getValueForSession,
    resolveCasteWiseDob,
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
    
    // 8-10. Unified Education Level Checker
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
    checkEligibilityEducationCourse,
    checkEligibilityEducationCourseSubject,
    
    // Eligibility check functions
    checkHighestEducationQualification,
    checkEducationCourse,
    checkEducationSubject,
    checkMarksPercentage,
    checkMarksPercentageWithPwd,
    checkDiploma12thEquivalency,
    checkSubjectSpecificCondition,
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
    getEducationHierarchy,
    
    // 12. NCC Certificate
    checkNccCertificate,
    getAllowedCertificates,
    
    // 13. NCC Certificate Grade
    checkNccCertificateGrade,
    getAllowedGrades,
    
    // 14. Active Backlogs Allowed
    checkActiveBacklogsAllowed,
    getActiveBacklogsFromExam,
    getEducationLevelKeyForBacklogs,
    shouldShowActiveBacklogsField,
    getBacklogRequirementDescription,
    
    // 15. Age Relaxation
    parseRelaxationYears,
    getRelaxationForCategory,
    applyRelaxationToDobRange,
    applyRelaxationToAgeRange,
    checkDobWithRelaxation,
    checkAgeWithRelaxation,
    formatRelaxationInfo,
    
    // 16. Mandatory Subject
    checkMandatorySubjectEligibility,
    
    // 17. Completion Status
    checkCompletionStatus,
    checkCompletionStatusWithDivisions,
    parseStatusData,
    isAllStatusesEligible,
    COMPLETION_STATUS_VALUES
};

// ============================================
// MAIN ELIGIBILITY CHECK FUNCTION
// Only 7 checks active: Gender, Marital Status, PWD Status, Caste Category, Nationality, Domicile, Date of Birth
// ============================================

/**
 * Check full eligibility for all active fields
 * 
 * @param {Object} userInput - User's input data
 * @param {Object} examData - Exam JSON data (division-specific data passed by frontend)
 * @param {string} examSession - Exam session (not used yet)
 * @returns {{eligible: boolean, results: Object[], summary: string}}
 */
export const checkFullEligibility = (userInput, examData, examSession = null) => {
    const results = [];
    let allEligible = true;

    // Helper to add result and track eligibility
    const addResult = (result) => {
        if (result && result.field) {
            results.push(result);
            if (!result.eligible) {
                allEligible = false;
            }
        }
    };

    // ============================================
    // CHECK 1: GENDER (ACTIVE)
    // ============================================
    const examGender = examData?.gender;
    if (examGender && examGender !== '' && examGender !== 'ALL APPLICABLE' && examGender !== 'NOT APPLICABLE') {
        const genderResult = checkGender(userInput.gender, examGender);
        addResult(genderResult);
        console.log('[Gender Check]', {
            userGender: userInput.gender,
            examGender: examGender,
            eligible: genderResult.eligible,
            reason: genderResult.reason
        });
    }

    // ============================================
    // CHECK 2: MARITAL STATUS (ACTIVE)
    // Now passes userGender for gender-specific marital status checks
    // Supports both string format and gender-specific object format
    // ============================================
    const examMaritalStatus = examData?.marital_status;
    // Check if marital_status exists and is not empty/standard skip values
    // For string: check standard values
    // For object: always run the check
    const shouldCheckMaritalStatus = examMaritalStatus && (
        typeof examMaritalStatus === 'object' || 
        (examMaritalStatus !== '' && examMaritalStatus !== 'ALL APPLICABLE' && examMaritalStatus !== 'NOT APPLICABLE')
    );
    
    if (shouldCheckMaritalStatus) {
        // Pass userGender for gender-specific marital status checking
        const maritalResult = checkMaritalStatus(userInput.marital_status, examMaritalStatus, userInput.gender);
        addResult(maritalResult);
        console.log('[Marital Status Check]', {
            userStatus: userInput.marital_status,
            userGender: userInput.gender,
            examStatus: examMaritalStatus,
            eligible: maritalResult.eligible,
            reason: maritalResult.reason
        });
    }

    // ============================================
    // CHECK 3: PWD STATUS (ACTIVE)
    // Note: For PWD, "NOT APPLICABLE" means PWD candidates are NOT allowed
    // So we need to run the check for "NOT APPLICABLE" and "APPLICABLE"
    // Only skip for "" (empty) and "ALL APPLICABLE"
    // ============================================
    const examPwdStatus = examData?.pwd_status;
    if (examPwdStatus && examPwdStatus !== '' && examPwdStatus !== 'ALL APPLICABLE') {
        const pwdResult = checkPwdStatus(userInput.pwd_status, examPwdStatus);
        addResult(pwdResult);
        console.log('[PWD Status Check]', {
            userPwd: userInput.pwd_status,
            examPwd: examPwdStatus,
            eligible: pwdResult.eligible,
            reason: pwdResult.reason
        });
    }

    // ============================================
    // CHECK 4: CASTE CATEGORY (ACTIVE)
    // ============================================
    const examCasteCategory = examData?.caste_category;
    if (examCasteCategory && examCasteCategory !== '' && examCasteCategory !== 'ALL APPLICABLE' && examCasteCategory !== 'NOT APPLICABLE') {
        const casteResult = checkCasteCategory(userInput.caste_category, examCasteCategory);
        addResult(casteResult);
        console.log('[Caste Category Check]', {
            userCaste: userInput.caste_category,
            examCaste: examCasteCategory,
            eligible: casteResult.eligible,
            reason: casteResult.reason
        });
    }

    // ============================================
    // CHECK 5: NATIONALITY (ACTIVE)
    // ============================================
    const examNationality = examData?.nationality;
    if (examNationality && examNationality !== '' && examNationality !== 'ALL APPLICABLE' && examNationality !== 'NOT APPLICABLE') {
        const nationalityResult = checkNationality(userInput.nationality, examNationality);
        addResult(nationalityResult);
        console.log('[Nationality Check]', {
            userNationality: userInput.nationality,
            examNationality: examNationality,
            eligible: nationalityResult.eligible,
            reason: nationalityResult.reason
        });
    }

    // ============================================
    // CHECK 6: DOMICILE (ACTIVE)
    // Note: Domicile is only checked for Indian nationals
    // If user is non-Indian, this check is automatically skipped
    // ============================================
    const examDomicile = examData?.domicile;
    const userNationality = userInput.nationality?.toUpperCase();
    
    // Only check domicile for Indian nationals AND if exam has domicile requirement
    if (userNationality === 'INDIAN' && examDomicile && examDomicile !== '') {
        const domicileResult = checkDomicile(userInput.domicile, examDomicile, userInput.nationality);
        addResult(domicileResult);
        console.log('[Domicile Check]', {
            userDomicile: userInput.domicile,
            examDomicile: examDomicile,
            userNationality: userInput.nationality,
            eligible: domicileResult.eligible,
            reason: domicileResult.reason
        });
    }

    // ============================================
    // CHECK 7: DATE OF BIRTH (ACTIVE)
    // Handles 6 age/DOB criteria types:
    // - STARTING_AGE, ENDING_AGE, BETWEEN_AGE (age calculation)
    // - MINIMUM_DOB, MAXIMUM_DOB, BETWEEN_DOB (date comparison)
    // NOW INCLUDES AGE RELAXATION for reserved categories (SC, ST, OBC)
    // ============================================
    const ageCriteriaType = examData?.age_criteria_type?.toUpperCase() || '';
    const hasAgeCriteria = ageCriteriaType !== '' && 
                          ageCriteriaType !== 'NO_AGE_LIMIT' && 
                          ageCriteriaType !== 'NOT_APPLICABLE';
    
    // Also check if any age/DOB fields have data (fallback detection)
    const hasAgeFields = examData?.starting_age || examData?.ending_age || 
                        examData?.between_age || examData?.minimum_dob || 
                        examData?.maximum_dob || examData?.between_dob;
    
    if (hasAgeCriteria || hasAgeFields) {
        // Get exam code from examData for session key matching
        const examCode = examData?.exam_code || null;
        
        // First do the standard DOB check (without relaxation)
        // Pass user's caste category for caste-wise DOB range detection
        let dobResult = checkDateOfBirth(userInput.date_of_birth, examData, examSession, examCode, userInput.caste_category);
        
        // ============================================
        // AGE RELAXATION CHECK
        // If not eligible AND age_relaxation exists, check with relaxation
        // Also checks PWD-specific age relaxation from pwd_status.age_relaxation_basis
        // ============================================
        const ageRelaxationData = examData?.age_relaxation;
        const userCategory = userInput.caste_category;
        const isPwd = userInput.pwd_status === 'YES' || userInput.pwd_status === true;
        
        if (!dobResult.eligible && userCategory) {
            // Pass isPwd and examData for PWD-specific relaxation check
            const relaxationYears = getRelaxationForCategory(ageRelaxationData, userCategory, isPwd, examData);
            
            if (relaxationYears > 0) {
                console.log('[Age Relaxation Check]', {
                    userCategory: userCategory,
                    isPwd: isPwd,
                    relaxationYears: relaxationYears,
                    ageRelaxationData: ageRelaxationData,
                    pwdAgeRelaxation: examData?.pwd_status?.age_relaxation_basis
                });
                
                // Get the DOB range for the session (resolve caste-wise if needed)
                const resolvedDobData = resolveCasteWiseDob(examData.between_dob, userCategory);
                const betweenDobValue = getValueForSession(resolvedDobData, examSession, examCode);
                
                if (betweenDobValue) {
                    const parsed = parseDobRange(betweenDobValue);
                    
                    if (parsed) {
                        const userDob = parseDateDDMMYYYY(userInput.date_of_birth);
                        const startDob = parseDateDDMMYYYY(parsed.startDob); // Minimum DOB (oldest allowed)
                        const endDob = parseDateDDMMYYYY(parsed.endDob);     // Maximum DOB (youngest allowed)
                        
                        if (userDob && startDob && endDob) {
                            // Apply relaxation - extends minimum DOB (allows older candidates)
                            const relaxationResult = checkDobWithRelaxation(userDob, startDob, endDob, relaxationYears);
                            
                            if (relaxationResult.eligible && relaxationResult.eligibleWithRelaxation) {
                                // User is eligible ONLY because of age relaxation
                                const userAge = calculateAge(userDob, getExamReferenceDate(examSession));
                                const userAgeStr = formatAge(userAge);
                                const userDobFormatted = formatDateDDMMYYYY(userDob);
                                
                                dobResult = {
                                    ...dobResult,
                                    eligible: true,
                                    eligibleWithRelaxation: true,  // Flag for UI indicator
                                    relaxationYears: relaxationYears,
                                    userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                                    reason: `Eligible with ${relaxationYears} years age relaxation for ${userCategory} category. Without relaxation, you must be born on or after ${parsed.startDob}`,
                                    examRequirement: `DOB: ${parsed.startDob} to ${parsed.endDob} (Relaxed for ${userCategory}: +${relaxationYears} years)`,
                                    details: {
                                        ...dobResult.details,
                                        relaxation: {
                                            applied: true,
                                            years: relaxationYears,
                                            category: userCategory,
                                            originalMinDob: parsed.startDob,
                                            relaxedMinDob: formatDateDDMMYYYY(relaxationResult.minDob || startDob)
                                        }
                                    }
                                };
                                
                                console.log('[Age Relaxation Applied]', {
                                    eligible: true,
                                    relaxationYears: relaxationYears,
                                    category: userCategory,
                                    originalRange: betweenDobValue
                                });
                            }
                        }
                    }
                }
            }
        }
        
        addResult(dobResult);
        console.log('[Date of Birth Check]', {
            userDob: userInput.date_of_birth,
            examSession: examSession,
            ageCriteriaType: ageCriteriaType,
            eligible: dobResult.eligible,
            eligibleWithRelaxation: dobResult.eligibleWithRelaxation || false,
            reason: dobResult.reason,
            userAge: dobResult.userAge
        });
    }

    // ============================================
    // CHECK 8: HIGHEST EDUCATION QUALIFICATION (ACTIVE)
    // Compares user's education level against exam's minimum requirement
    // Uses education hierarchy: Post Doctorate > PhD > PG > Graduation > etc.
    // ============================================
    const examEducationLevel = examData?.highest_education_qualification;
    if (examEducationLevel && examEducationLevel !== '' && examEducationLevel !== 'ALL APPLICABLE' && examEducationLevel !== 'NOT APPLICABLE') {
        const educationResult = checkHighestEducationQualification(
            userInput.highest_education_qualification, 
            examEducationLevel
        );
        addResult(educationResult);
        console.log('[Highest Education Qualification Check]', {
            userEducation: userInput.highest_education_qualification,
            examEducation: examEducationLevel,
            eligible: educationResult.eligible,
            reason: educationResult.reason
        });
    }

    // ============================================
    // CHECK 9-10: COMPREHENSIVE EDUCATION CHECK (ACTIVE)
    // Uses unified education_level.js for all education-related checks
    // - Validates courses for each required education level
    // - Validates subjects for each course
    // - Validates marks percentage (with PWD-specific rules)
    // - Handles diploma/12th equivalency
    // ============================================
    const examEducationLevels = examData?.education_levels;
    if (examEducationLevels && typeof examEducationLevels === 'object') {
        // Get required education levels from exam's minimum requirement
        const examRequiredLevelKey = getEducationLevelKey(examEducationLevel);
        const requiredLevels = getRequiredEducationLevels(examEducationLevel);
        
        const userEducationData = userInput.education_levels || {};
        const userCategory = userInput.caste_category || 'GEN';
        const isPwd = userInput.pwd_status === 'YES' || userInput.pwd_status === true;
        
        // Check each required education level
        for (const levelKey of requiredLevels) {
            const levelUserData = userEducationData[levelKey] || {};
            const examLevelData = examEducationLevels[levelKey];
            
            // Skip if this level is empty in exam (no specific requirements)
            if (!examLevelData || examLevelData === '') {
                continue;
            }
            
            // Check course for this level
            const courseResult = checkEducationCourse(
                levelUserData.course,
                examEducationLevels,
                levelKey
            );
            addResult(courseResult);
            console.log(`[Education Course Check - ${levelKey}]`, {
                userCourse: levelUserData.course,
                eligible: courseResult.eligible,
                reason: courseResult.reason
            });
            
            // Check subject for this level
            const subjectResult = checkEducationSubject(
                levelUserData.subject,
                examEducationLevels,
                levelKey,
                levelUserData.course
            );
            addResult(subjectResult);
            console.log(`[Education Subject Check - ${levelKey}]`, {
                userSubject: levelUserData.subject,
                eligible: subjectResult.eligible,
                reason: subjectResult.reason
            });
            
            // Check marks percentage (with PWD consideration)
            const marksResult = checkMarksPercentageWithPwd(
                levelUserData.marks_percentage,
                examData,
                levelKey,
                userCategory,
                isPwd
            );
            addResult(marksResult);
            console.log(`[Education Marks Check - ${levelKey}]`, {
                userMarks: levelUserData.marks_percentage,
                category: userCategory,
                isPwd: isPwd,
                eligible: marksResult.eligible,
                reason: marksResult.reason
            });
            
            // ============================================
            // CHECK: COMPLETED YEAR ELIGIBILITY (For JEE, NEET type exams)
            // Only runs if exam has completed_year criteria with session structure
            // Example: JEE Main requires 12th passed in last 2 years OR appearing
            // ============================================
            const examCompletedYearCriteria = examLevelData?.completed_year;
            if (examCompletedYearCriteria && typeof examCompletedYearCriteria === 'object' && Object.keys(examCompletedYearCriteria).length > 0) {
                const completedYearResult = checkCompletedYearEligibility(
                    levelUserData.status,
                    levelUserData.completed_year,
                    examCompletedYearCriteria,
                    examSession,
                    levelKey
                );
                
                // Only add result if not skipped (has actual criteria)
                if (!completedYearResult.skipped) {
                    addResult(completedYearResult);
                    console.log(`[Completed Year Eligibility Check - ${levelKey}]`, {
                        userStatus: levelUserData.status,
                        userCompletedYear: levelUserData.completed_year,
                        examSession: examSession,
                        criteria: examCompletedYearCriteria[examSession],
                        eligible: completedYearResult.eligible,
                        reason: completedYearResult.reason
                    });
                }
            }
        }
        
        // Check diploma/12th equivalency
        const equivalencyResult = checkDiploma12thEquivalency(
            userEducationData,
            examEducationLevels
        );
        if (equivalencyResult.examRequirement !== 'No specific requirement') {
            addResult(equivalencyResult);
            console.log('[Diploma/12th Equivalency Check]', {
                eligible: equivalencyResult.eligible,
                reason: equivalencyResult.reason
            });
        }
    }

    // ============================================
    // CHECK 11: NCC WING (ACTIVE)
    // Uses ncc_wing.js checker
    // ============================================
    const examNccWing = examData?.ncc_wing;
    if (examNccWing && examNccWing !== '' && examNccWing !== 'ALL APPLICABLE' && examNccWing !== 'NOT APPLICABLE') {
        const nccWingResult = checkNccWing(userInput.ncc_wing, examNccWing);
        addResult({
            field: 'ncc_wing',
            userValue: nccWingResult.userValue,
            examRequirement: nccWingResult.examRequirement,
            eligible: nccWingResult.eligible,
            reason: nccWingResult.eligible 
                ? `NCC Wing ${nccWingResult.userValue} is accepted`
                : `NCC Wing ${nccWingResult.userValue} not in allowed list: ${examNccWing}`
        });
        
        console.log('[NCC Wing Check]', nccWingResult);
    }

    // ============================================
    // CHECK 12: NCC CERTIFICATE (ACTIVE)
    // Depends on NCC Wing - uses wing-based object format
    // ============================================
    const examNccCertificate = examData?.ncc_certificate;
    const shouldCheckNccCert = examNccCertificate && (
        typeof examNccCertificate === 'object' ||
        (examNccCertificate !== '' && examNccCertificate !== 'ALL APPLICABLE' && examNccCertificate !== 'NOT APPLICABLE')
    );
    
    if (shouldCheckNccCert) {
        const nccCertResult = checkNccCertificate(
            userInput.ncc_certificate,
            examNccCertificate,
            userInput.ncc_wing  // Pass user's NCC wing for wing-based filtering
        );
        addResult(nccCertResult);
        console.log('[NCC Certificate Check]', {
            userNccCertificate: userInput.ncc_certificate,
            userNccWing: userInput.ncc_wing,
            examNccCertificate: examNccCertificate,
            eligible: nccCertResult.eligible,
            reason: nccCertResult.reason
        });
    }

    // ============================================
    // CHECK 13: NCC CERTIFICATE GRADE (ACTIVE)
    // Depends on NCC Certificate - uses certificate-based object format
    // ============================================
    const examNccGrade = examData?.ncc_certificate_grade;
    const shouldCheckNccGrade = examNccGrade && (
        typeof examNccGrade === 'object' ||
        (examNccGrade !== '' && examNccGrade !== 'ALL APPLICABLE' && examNccGrade !== 'NOT APPLICABLE')
    );
    
    if (shouldCheckNccGrade) {
        const nccGradeResult = checkNccCertificateGrade(
            userInput.ncc_certificate_grade,
            examNccGrade,
            userInput.ncc_certificate  // Pass user's NCC certificate for certificate-based filtering
        );
        addResult(nccGradeResult);
        console.log('[NCC Certificate Grade Check]', {
            userNccGrade: userInput.ncc_certificate_grade,
            userNccCertificate: userInput.ncc_certificate,
            examNccGrade: examNccGrade,
            eligible: nccGradeResult.eligible,
            reason: nccGradeResult.reason
        });
    }

    // ============================================
    // CHECK 14: ACTIVE BACKLOGS ALLOWED (ACTIVE)
    // Checks backlog requirement from inside the education level
    // that matches highest_education_qualification
    // e.g., if highest_education_qualification = "GRADUATION",
    // check education_levels.graduation.active_backlogs_allowed
    // ============================================
    const shouldCheckBacklogs = shouldShowActiveBacklogsField(examData);
    
    if (shouldCheckBacklogs) {
        const backlogsResult = checkActiveBacklogsAllowed(
            userInput.active_backlogs,
            examData  // Pass full examData so it can extract from correct education level
        );
        addResult(backlogsResult);
        console.log('[Active Backlogs Check]', {
            userBacklogs: userInput.active_backlogs,
            highestEducation: examData?.highest_education_qualification,
            backlogRequirement: getBacklogRequirementDescription(examData),
            eligible: backlogsResult.eligible,
            reason: backlogsResult.reason
        });
    }

    // ============================================
    // CHECK 15: MANDATORY SUBJECT (ACTIVE)
    // Checks if user has studied the required mandatory subject
    // for posts that require specific subjects (e.g., Mathematics, Statistics)
    // ============================================
    const userStudiedSubjects = userInput.studiedMandatorySubjects;
    const hasStudiedSubjectsInput = userStudiedSubjects && userStudiedSubjects.length > 0;
    
    if (hasStudiedSubjectsInput) {
        const mandatorySubjectResult = checkMandatorySubjectEligibility(
            userInput,
            examData,
            userInput.highest_education_qualification
        );
        
        // Only add result if check was not skipped
        if (!mandatorySubjectResult.skipped) {
            addResult({
                field: 'Mandatory Subject',
                eligible: mandatorySubjectResult.eligible,
                userValue: userStudiedSubjects.join(', '),
                examValue: mandatorySubjectResult.requiredSubject || 'None',
                reason: mandatorySubjectResult.message
            });
            
            console.log('[Mandatory Subject Check]', {
                userStudiedSubjects: userStudiedSubjects,
                requiredSubject: mandatorySubjectResult.requiredSubject,
                eligible: mandatorySubjectResult.eligible,
                reason: mandatorySubjectResult.message
            });
        }
    }

    // ============================================
    // CHECKS 16-31: TEMPORARILY DISABLED
    // Will be enabled one by one after testing
    // ============================================

    const summary = allEligible ? 'Eligible' : 'Not Eligible';
    
    // Check if any result has eligibleWithRelaxation flag
    const hasAgeRelaxation = results.some(r => r.eligibleWithRelaxation === true);

    console.log('[checkFullEligibility Result]', {
        eligible: allEligible,
        eligibleWithRelaxation: hasAgeRelaxation,
        resultsCount: results.length,
        summary
    });

    return {
        eligible: allEligible,
        eligibleWithRelaxation: hasAgeRelaxation, // Expose at top level for UI badge
        results,
        summary
    };
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
    checkFullEligibility,
    
    // Gender helpers
    checkGender,
    checkGenderNonDivision,
    checkGenderDivisionBased,
    detectDivisionStructure,
    shouldShowGenderField,
    getGenderOptions,
    
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
    
    // Education Level helpers (unified)
    EDUCATION_HIERARCHY,
    EDUCATION_LEVEL_KEYS,
    EDUCATION_KEY_TO_NAME,
    UNIVERSITY_LEVELS,
    BOARD_LEVELS,
    EQUIVALENT_LEVELS,
    normalizeEducationLevel,
    getEducationHierarchyValue,
    getEducationLevelKey,
    getEducationLevelName,
    requiresUniversity,
    requiresBoard,
    getRequiredEducationLevels,
    getUserEducationLevels,
    parsePercentage,
    getCourseOptionsFromEduFinal,
    getSubjectsFromEduFinal,
    getStatusOptionsFromEduFinal,
    getBoardUniversityOptionsFromEduFinal,
    getDefaultMarksPercentage,
    loadEduFinalData,
    getEduFinalData,
    setEduFinalData,
    getCoursesForLevel,
    getSubjectsForCourse,
    getAllCourses,
    findCourseLevel,
    isValidCourseForLevel,
    getAllSubjectsForLevel,
    findSubjectCourses,
    isValidSubjectForCourse,
    checkEligibilityEducationCourse,
    checkEligibilityEducationCourseSubject,
    checkHighestEducationQualification,
    checkEducationCourse,
    checkEducationSubject,
    checkMarksPercentage,
    checkMarksPercentageWithPwd,
    checkDiploma12thEquivalency,
    checkSubjectSpecificCondition,
    checkCompletedYearEligibility,
    checkEducationEligibility,
    getEducationLevelFormData,
    getAllEducationLevels,
    getFormEducationLevels,
    shouldShowEducationField,
    getEducationLevel,
    getEducationLevels,
    getEducationOptions,
    getEducationHierarchy,
    
    // NCC Certificate helpers
    checkNccCertificate,
    getAllowedCertificates,
    
    // NCC Certificate Grade helpers
    checkNccCertificateGrade,
    getAllowedGrades
};