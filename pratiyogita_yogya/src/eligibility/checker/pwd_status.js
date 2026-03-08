/**
 * PWD (Person With Disability) Status Eligibility Checker
 * 
 * Handles both division-based and non-division-based exams
 * 
 * User Input Values:
 * - "YES": User is a Person with Disability
 * - "NO": User is not a Person with Disability
 * 
 * Exam JSON Values (from eligibilityfields.json):
 * - "" (empty): No restriction defined → skip this check (everyone passes)
 * - "ALL APPLICABLE": Both PWD and non-PWD candidates are eligible
 * - "APPLICABLE": PWD provisions available - BOTH PWD and non-PWD can apply
 *                 (PWD candidates get benefits like age relaxation, reserved seats)
 * - "NOT APPLICABLE": PWD candidates CANNOT apply (e.g., defence exams)
 *                     Only non-PWD candidates are eligible
 */

/**
 * Normalize value for comparison
 * @param {string} value - Value to normalize
 * @returns {string} - Normalized uppercase trimmed value
 */
const normalizeValue = (value) => {
    if (!value || typeof value !== 'string') return '';
    return value.trim().toUpperCase();
};

/**
 * Check if exam data is division-based
 * @param {Object} examData - Complete exam data object
 * @returns {{isDivisionBased: boolean, divisionKey: string|null, divisions: Object|null}}
 */
const detectDivisionStructure = (examData) => {
    if (!examData || typeof examData !== 'object') {
        return {
            isDivisionBased: false,
            divisionKey: null,
            divisions: null
        };
    }
    
    const divisionKeys = ['academies', 'posts', 'divisions', 'departments', 'branches', 'courses'];
    
    for (const key of divisionKeys) {
        if (examData[key] && typeof examData[key] === 'object' && !Array.isArray(examData[key])) {
            return {
                isDivisionBased: true,
                divisionKey: key,
                divisions: examData[key]
            };
        }
    }
    
    return {
        isDivisionBased: false,
        divisionKey: null,
        divisions: null
    };
};

/**
 * Check PWD eligibility for a single PWD requirement value
 * 
 * Supports two structures:
 * 1. New structure: pwd_status = { applicability: "APPLICABLE", marks_percentage_basis: {...}, age_relaxation_basis: {...} }
 * 2. Old structure: pwd_status = "APPLICABLE" or pwd_status = { "GEN": "45%", ... }
 * 
 * @param {string} userPwdStatus - User's PWD status (YES, NO)
 * @param {string|Object} examPwdValue - Exam's PWD eligibility value
 * @returns {{eligible: boolean, reason: string}}
 */
const checkSinglePwdEligibility = (userPwdStatus, examPwdValue) => {
    const normalizedUserPwd = normalizeValue(userPwdStatus);
    
    // Handle new structure: pwd_status = { applicability: "...", ... }
    if (typeof examPwdValue === 'object' && examPwdValue !== null) {
        // Check for new structure with applicability field
        if (examPwdValue.applicability) {
            const applicability = normalizeValue(examPwdValue.applicability);
            
            if (applicability === 'NOT APPLICABLE') {
                const isEligible = normalizedUserPwd === 'NO';
                return {
                    eligible: isEligible,
                    reason: isEligible 
                        ? 'Non-PWD candidate is eligible'
                        : 'PWD candidates are not eligible for this exam (physical fitness required)'
                };
            }
            
            if (applicability === 'APPLICABLE' || applicability === 'ALL APPLICABLE') {
                return {
                    eligible: true,
                    reason: normalizedUserPwd === 'YES' 
                        ? 'PWD candidate is eligible (PWD provisions available)'
                        : 'Non-PWD candidate is eligible'
                };
            }
        }
        
        // Old structure with direct percentage values: { "GEN": "45%", ... }
        // If it has category keys, treat as applicable (old format)
        if (examPwdValue['GEN'] || examPwdValue['OBC'] || examPwdValue['SC'] || examPwdValue['ST'] || examPwdValue['EWS']) {
            return {
                eligible: true,
                reason: normalizedUserPwd === 'YES' 
                    ? 'PWD candidate is eligible (PWD provisions available)'
                    : 'Non-PWD candidate is eligible'
            };
        }
        
        // Empty object or no recognizable structure
        return {
            eligible: true,
            reason: 'No PWD restriction defined'
        };
    }
    
    // Handle string values
    const normalizedExamPwd = normalizeValue(examPwdValue);
    
    // Rule 2: Handle standard values
    // "" (empty) - No restriction defined → skip this check, everyone passes
    if (normalizedExamPwd === '') {
        return {
            eligible: true,
            reason: 'No PWD restriction defined'
        };
    }
    
    // "ALL APPLICABLE" - Both PWD and non-PWD candidates are eligible
    if (normalizedExamPwd === 'ALL APPLICABLE') {
        return {
            eligible: true,
            reason: 'All candidates (PWD and non-PWD) are eligible'
        };
    }
    
    // "APPLICABLE" - PWD provisions available, both PWD and non-PWD can apply
    // PWD candidates get additional benefits (age relaxation, reserved seats, etc.)
    if (normalizedExamPwd === 'APPLICABLE') {
        return {
            eligible: true,
            reason: normalizedUserPwd === 'YES' 
                ? 'PWD candidate is eligible (PWD provisions available)'
                : 'Non-PWD candidate is eligible'
        };
    }
    
    // "NOT APPLICABLE" - PWD candidates are NOT eligible (e.g., defence exams)
    // Only non-PWD candidates can apply
    if (normalizedExamPwd === 'NOT APPLICABLE') {
        // User must have specified PWD status
        if (!normalizedUserPwd) {
            return {
                eligible: false,
                reason: 'PWD status not specified'
            };
        }
        
        const isEligible = normalizedUserPwd === 'NO';
        return {
            eligible: isEligible,
            reason: isEligible 
                ? 'Non-PWD candidate is eligible'
                : 'PWD candidates are not eligible for this exam (physical fitness required)'
        };
    }
    
    // Fallback: Unknown value, treat as no restriction
    return {
        eligible: true,
        reason: `Unknown PWD requirement: ${examPwdValue}`
    };
};

/**
 * Main PWD status eligibility checker
 * Works with both:
 * - Simple field value: checkPwdStatus(userPwd, "APPLICABLE")
 * - Full exam data: checkPwdStatus(userPwd, examDataObject)
 * 
 * @param {string} userPwdStatus - User's PWD status (YES, NO)
 * @param {string|Object} examPwdOrData - Either PWD field value (string) or full exam data object
 * @returns {{eligible: boolean, eligibleDivisions: string[], ineligibleDivisions: Object[], field: string, userValue: string, examRequirement: string, reason: string}}
 */
export const checkPwdStatus = (userPwdStatus, examPwdOrData) => {
    const field = 'pwd_status';
    
    // Case 1: Simple string value passed (backward compatible)
    if (typeof examPwdOrData === 'string') {
        const result = checkSinglePwdEligibility(userPwdStatus, examPwdOrData);
        return {
            field,
            userValue: userPwdStatus || 'Not specified',
            examRequirement: examPwdOrData || 'No restriction',
            eligible: result.eligible,
            reason: result.reason,
            eligibleDivisions: result.eligible ? ['ALL'] : [],
            ineligibleDivisions: result.eligible ? [] : [{ division: 'ALL', reason: result.reason }]
        };
    }
    
    // Case 2: Full exam data object passed
    const examData = examPwdOrData;
    const { isDivisionBased, divisions } = detectDivisionStructure(examData);
    
    if (isDivisionBased && divisions) {
        // Division-based exam: check each division
        const eligibleDivisions = [];
        const ineligibleDivisions = [];
        
        for (const [divisionName, divisionData] of Object.entries(divisions)) {
            const divisionPwd = divisionData?.pwd_status || '';
            const result = checkSinglePwdEligibility(userPwdStatus, divisionPwd);
            
            if (result.eligible) {
                eligibleDivisions.push(divisionName);
            } else {
                ineligibleDivisions.push({
                    division: divisionName,
                    reason: result.reason,
                    requirement: divisionPwd
                });
            }
        }
        
        const overallEligible = eligibleDivisions.length > 0;
        
        return {
            field,
            userValue: userPwdStatus || 'Not specified',
            examRequirement: 'Division-based (varies)',
            eligible: overallEligible,
            eligibleDivisions,
            ineligibleDivisions,
            reason: overallEligible 
                ? `Eligible for ${eligibleDivisions.length} division(s): ${eligibleDivisions.join(', ')}`
                : `Not eligible for any division based on PWD status`
        };
    } else {
        // Non-division-based exam
        const examPwd = examData?.pwd_status || '';
        const result = checkSinglePwdEligibility(userPwdStatus, examPwd);
        
        return {
            field,
            userValue: userPwdStatus || 'Not specified',
            examRequirement: examPwd || 'No restriction',
            eligible: result.eligible,
            reason: result.reason,
            eligibleDivisions: result.eligible ? ['ALL'] : [],
            ineligibleDivisions: result.eligible ? [] : [{ division: 'ALL', reason: result.reason }]
        };
    }
};

/**
 * Check if PWD field should be shown in form
 * Based on Rule 2: "" (empty) means don't add field in form
 * @param {Object} examData - Exam data object
 * @returns {boolean} - true if field should be shown
 */
export const shouldShowPwdField = (examData) => {
    const { isDivisionBased, divisions } = detectDivisionStructure(examData);
    
    if (isDivisionBased && divisions) {
        // Show if any division has PWD requirement
        return Object.values(divisions).some(div => {
            const pwd = normalizeValue(div?.pwd_status || '');
            return pwd !== '';
        });
    }
    
    // Non-division based
    const pwd = normalizeValue(examData?.pwd_status || '');
    return pwd !== '';
};

/**
 * Get PWD options to show in dropdown
 * Always returns YES and NO since user can be either
 * @returns {string[]} - Array of PWD options
 */
export const getPwdOptions = () => {
    return ['YES', 'NO'];
};

export default {
    checkPwdStatus,
    shouldShowPwdField,
    getPwdOptions
};
