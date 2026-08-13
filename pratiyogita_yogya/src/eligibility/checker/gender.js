/**
 * Gender Eligibility Checker
 * 
 * Handles both division-based and non-division-based exams
 * 
 * Standard Values (from eligibilityfields.json):
 * - "" (empty): No restriction defined → skip this check (don't show field in form)
 * - "ALL APPLICABLE": Everyone passes this criterion
 * - "NOT APPLICABLE": Criterion not considered → everyone passes
 * - "MALE", "FEMALE", "TRANSGENDER": Specific values - user must match at least one
 * - Multiple values: Comma-separated (e.g., "MALE, FEMALE")
 */

/**
 * Normalize gender value for comparison
 * @param {string} value - Gender value to normalize
 * @returns {string} - Normalized uppercase trimmed value
 */
const normalizeValue = (value) => {
    if (!value || typeof value !== 'string') return '';
    return value.trim().toUpperCase();
};

/**
 * Parse comma-separated values into array
 * @param {string} value - Comma-separated string
 * @returns {string[]} - Array of normalized values
 */
const parseMultipleValues = (value) => {
    if (!value || typeof value !== 'string') return [];
    return value.split(',').map(v => normalizeValue(v)).filter(v => v !== '');
};

/**
 * Check if exam data is division-based
 * Division-based exams have nested objects like 'academies', 'posts', 'divisions', 'departments'
 * @param {Object} examData - Complete exam data object
 * @returns {{isDivisionBased: boolean, divisionKey: string|null, divisions: Object|null}}
 */
export const detectDivisionStructure = (examData) => {
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
 * Check gender eligibility for a single gender requirement value
 * @param {string} userGender - User's gender (MALE, FEMALE, TRANSGENDER)
 * @param {string} examGenderValue - Exam's allowed genders string (can be single, multiple, or standard values)
 * @returns {{eligible: boolean, reason: string}}
 */
const checkSingleGenderEligibility = (userGender, examGenderValue) => {
    const normalizedUserGender = normalizeValue(userGender);
    const normalizedExamGender = normalizeValue(examGenderValue);
    
    // Rule 2: Handle standard values
    // "" (empty) - No restriction defined → skip this check, everyone passes
    if (normalizedExamGender === '') {
        return {
            eligible: true,
            reason: 'No gender restriction defined'
        };
    }
    
    // "ALL APPLICABLE" - Everyone passes this criterion
    if (normalizedExamGender === 'ALL APPLICABLE') {
        return {
            eligible: true,
            reason: 'All genders are eligible'
        };
    }
    
    // "NOT APPLICABLE" - Criterion not considered → everyone passes
    if (normalizedExamGender === 'NOT APPLICABLE') {
        return {
            eligible: true,
            reason: 'Gender criterion not applicable'
        };
    }
    
    // User must have specified a gender for specific value matching
    if (!normalizedUserGender) {
        return {
            eligible: false,
            reason: 'User gender not specified'
        };
    }
    
    // Rule 3: Specific values - User must match at least one (exact match, case-insensitive)
    const allowedGenders = parseMultipleValues(examGenderValue);
    
    // Exact match only (Rule 3 & 11: case-insensitive, normalized)
    const isEligible = allowedGenders.includes(normalizedUserGender);
    
    return {
        eligible: isEligible,
        reason: isEligible 
            ? `Gender ${userGender} is eligible` 
            : `Gender ${userGender} is not eligible. Allowed: ${allowedGenders.join(', ')}`
    };
};

/**
 * Main gender eligibility checker
 * Works with both:
 * - Simple field value: checkGender(userGender, "MALE, FEMALE")
 * - Full exam data: checkGender(userGender, examDataObject)
 * 
 * @param {string} userGender - User's gender (MALE, FEMALE, TRANSGENDER)
 * @param {string|Object} examGenderOrData - Either gender field value (string) or full exam data object
 * @returns {{eligible: boolean, eligibleDivisions: string[], field: string, userValue: string, examRequirement: string, reason: string}}
 */
export const checkGender = (userGender, examGenderOrData) => {
    const field = 'gender';
    
    // Case 1: Simple string value passed (backward compatible)
    if (typeof examGenderOrData === 'string') {
        const result = checkSingleGenderEligibility(userGender, examGenderOrData);
        return {
            field,
            userValue: userGender || 'Not specified',
            examRequirement: examGenderOrData || 'No restriction',
            eligible: result.eligible,
            reason: result.reason,
            eligibleDivisions: result.eligible ? ['ALL'] : [],
            ineligibleDivisions: result.eligible ? [] : [{ division: 'ALL', reason: result.reason }]
        };
    }
    
    // Case 2: Full exam data object passed
    const examData = examGenderOrData;
    const { isDivisionBased, divisions } = detectDivisionStructure(examData);
    
    if (isDivisionBased && divisions) {
        // Division-based exam: check each division
        const eligibleDivisions = [];
        const ineligibleDivisions = [];
        
        for (const [divisionName, divisionData] of Object.entries(divisions)) {
            const divisionGender = divisionData?.gender || '';
            const result = checkSingleGenderEligibility(userGender, divisionGender);
            
            if (result.eligible) {
                eligibleDivisions.push(divisionName);
            } else {
                ineligibleDivisions.push({
                    division: divisionName,
                    reason: result.reason,
                    requirement: divisionGender
                });
            }
        }
        
        const overallEligible = eligibleDivisions.length > 0;
        
        return {
            field,
            userValue: userGender || 'Not specified',
            examRequirement: 'Division-based (varies)',
            eligible: overallEligible,
            eligibleDivisions,
            ineligibleDivisions,
            reason: overallEligible 
                ? `Eligible for ${eligibleDivisions.length} division(s): ${eligibleDivisions.join(', ')}`
                : `Not eligible for any division based on gender`
        };
    } else {
        // Non-division-based exam
        const examGender = examData?.gender || '';
        const result = checkSingleGenderEligibility(userGender, examGender);
        
        return {
            field,
            userValue: userGender || 'Not specified',
            examRequirement: examGender || 'No restriction',
            eligible: result.eligible,
            reason: result.reason,
            eligibleDivisions: result.eligible ? ['ALL'] : [],
            ineligibleDivisions: result.eligible ? [] : [{ division: 'ALL', reason: result.reason }]
        };
    }
};

/**
 * Check gender eligibility for non-division-based exam (explicit function)
 * @param {string} userGender - User's gender
 * @param {Object} examData - Exam data object with gender field
 * @returns {{eligible: boolean, userValue: string, examRequirement: string, field: string, reason: string}}
 */
export const checkGenderNonDivision = (userGender, examData) => {
    return checkGender(userGender, examData);
};

/**
 * Check gender eligibility for division-based exam (explicit function)
 * @param {string} userGender - User's gender
 * @param {Object} examData - Complete exam data object
 * @returns {{eligible: boolean, eligibleDivisions: string[], ineligibleDivisions: Object[], field: string, userValue: string, reason: string}}
 */
export const checkGenderDivisionBased = (userGender, examData) => {
    return checkGender(userGender, examData);
};

/**
 * Check if gender field should be shown in form
 * Based on Rule 2: "" (empty) means don't add field in form
 * @param {Object} examData - Exam data object
 * @returns {boolean} - true if field should be shown
 */
export const shouldShowGenderField = (examData) => {
    const { isDivisionBased, divisions } = detectDivisionStructure(examData);
    
    if (isDivisionBased && divisions) {
        // Show if any division has gender requirement
        return Object.values(divisions).some(div => {
            const gender = normalizeValue(div?.gender || '');
            return gender !== '';
        });
    }
    
    // Non-division based
    const gender = normalizeValue(examData?.gender || '');
    return gender !== '';
};

/**
 * Get gender options to show in dropdown
 * Always returns all options since user can be any gender
 * @returns {string[]} - Array of gender options
 */
export const getGenderOptions = () => {
    return ['MALE', 'FEMALE', 'TRANSGENDER'];
};

export default {
    checkGender,
    checkGenderNonDivision,
    checkGenderDivisionBased,
    detectDivisionStructure,
    shouldShowGenderField,
    getGenderOptions
};
