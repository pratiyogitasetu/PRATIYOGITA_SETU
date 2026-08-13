/**
 * Marital Status Eligibility Checker - Format 2 ONLY
 * 
 * Handles ONLY the gender-specific object format with arrays:
 * {
 *   "MALE": ["UNMARRIED", "MARRIED", ...],
 *   "FEMALE": ["UNMARRIED", "MARRIED", ...],
 *   "TRANSGENDER": ["UNMARRIED", "MARRIED", ...]
 * }
 * 
 * Standard Values:
 * - {} (empty object) or missing: No restriction → everyone passes
 * - Object with gender keys containing arrays of allowed statuses
 * 
 * Gender-based marital status options:
 * - MALE: UNMARRIED, MARRIED, SEPARATED, DIVORCED, WIDOWER
 * - FEMALE: UNMARRIED, MARRIED, SEPARATED, DIVORCEE, WIDOW
 * - TRANSGENDER: UNMARRIED, MARRIED, SEPARATED, DIVORCED, DIVORCEE, WIDOW, WIDOWER
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
        return { isDivisionBased: false, divisionKey: null, divisions: null };
    }
    
    const divisionKeys = ['academies', 'posts', 'divisions', 'departments', 'branches', 'courses'];
    
    for (const key of divisionKeys) {
        if (examData[key] && typeof examData[key] === 'object' && !Array.isArray(examData[key])) {
            return { isDivisionBased: true, divisionKey: key, divisions: examData[key] };
        }
    }
    
    return { isDivisionBased: false, divisionKey: null, divisions: null };
};

/**
 * Check if marital_status is in the correct Format 2 (object with gender keys)
 * @param {*} value - The marital_status value
 * @returns {boolean}
 */
const isValidFormat = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    const keys = Object.keys(value).map(k => k.toUpperCase());
    return keys.includes('MALE') || keys.includes('FEMALE') || keys.includes('TRANSGENDER');
};

/**
 * Get allowed marital statuses array for a specific gender
 * @param {Object} maritalStatusObj - { "MALE": [...], "FEMALE": [...], "TRANSGENDER": [...] }
 * @param {string} userGender - User's gender
 * @returns {string[]} - Array of allowed marital statuses for that gender
 */
const getAllowedStatusesForGender = (maritalStatusObj, userGender) => {
    const normalizedGender = normalizeValue(userGender);
    
    for (const [key, value] of Object.entries(maritalStatusObj)) {
        if (normalizeValue(key) === normalizedGender) {
            // Value should be an array
            if (Array.isArray(value)) {
                return value.map(v => normalizeValue(v));
            }
            // Backward compatibility: if string, split by comma
            if (typeof value === 'string') {
                return value.split(',').map(v => normalizeValue(v)).filter(v => v !== '');
            }
            return [];
        }
    }
    
    // No rule for this gender = not eligible
    return [];
};

/**
 * Check marital status eligibility for a single division/exam
 * @param {string} userMaritalStatus - User's marital status
 * @param {Object} maritalStatusObj - The marital_status object with gender keys
 * @param {string} userGender - User's gender
 * @returns {{eligible: boolean, reason: string, allowedStatuses: string[]}}
 */
const checkSingleEligibility = (userMaritalStatus, maritalStatusObj, userGender) => {
    const normalizedUserStatus = normalizeValue(userMaritalStatus);
    const normalizedUserGender = normalizeValue(userGender);
    
    // If marital_status is empty/null/undefined, no restriction - everyone passes
    if (!maritalStatusObj || Object.keys(maritalStatusObj).length === 0) {
        return {
            eligible: true,
            reason: 'No marital status restriction defined',
            allowedStatuses: []
        };
    }
    
    // Gender must be specified
    if (!normalizedUserGender) {
        return {
            eligible: false,
            reason: 'User gender is required for marital status check',
            allowedStatuses: []
        };
    }
    
    // Get allowed statuses for this gender
    const allowedStatuses = getAllowedStatusesForGender(maritalStatusObj, userGender);
    
    // If no statuses defined for this gender, not eligible
    if (allowedStatuses.length === 0) {
        return {
            eligible: false,
            reason: `No marital status rules defined for gender: ${userGender}`,
            allowedStatuses: []
        };
    }
    
    // User must have specified a marital status
    if (!normalizedUserStatus) {
        return {
            eligible: false,
            reason: 'User marital status not specified',
            allowedStatuses
        };
    }
    
    // Check if user's status is in allowed list
    const isEligible = allowedStatuses.includes(normalizedUserStatus);
    
    return {
        eligible: isEligible,
        reason: isEligible 
            ? `Marital status ${userMaritalStatus} is eligible for ${userGender}`
            : `Marital status ${userMaritalStatus} is not allowed for ${userGender}. Allowed: ${allowedStatuses.join(', ')}`,
        allowedStatuses
    };
};

/**
 * Get marital status options based on gender (for frontend dropdown)
 * @param {string} gender - User's gender (MALE, FEMALE, TRANSGENDER)
 * @returns {string[]} - Array of applicable marital status options
 */
export const getMaritalStatusOptionsByGender = (gender) => {
    const normalizedGender = normalizeValue(gender);
    
    switch (normalizedGender) {
        case 'MALE':
            return ['UNMARRIED', 'MARRIED', 'SEPARATED', 'DIVORCED', 'WIDOWER'];
        case 'FEMALE':
            return ['UNMARRIED', 'MARRIED', 'SEPARATED', 'DIVORCEE', 'WIDOW'];
        case 'TRANSGENDER':
            return ['UNMARRIED', 'MARRIED', 'SEPARATED', 'DIVORCED', 'DIVORCEE', 'WIDOW', 'WIDOWER'];
        default:
            return ['UNMARRIED', 'MARRIED', 'SEPARATED', 'DIVORCED', 'DIVORCEE', 'WIDOW', 'WIDOWER'];
    }
};

/**
 * Validate if marital status is valid for given gender
 * @param {string} maritalStatus - User's marital status
 * @param {string} gender - User's gender
 * @returns {boolean} - true if valid combination
 */
export const isValidMaritalStatusForGender = (maritalStatus, gender) => {
    const validOptions = getMaritalStatusOptionsByGender(gender);
    return validOptions.includes(normalizeValue(maritalStatus));
};

/**
 * Main marital status eligibility checker
 * 
 * ONLY handles Format 2 (gender-specific object with arrays):
 * {
 *   "MALE": ["UNMARRIED"],
 *   "FEMALE": ["UNMARRIED", "SEPARATED", "DIVORCEE", "WIDOW"],
 *   "TRANSGENDER": ["UNMARRIED"]
 * }
 * 
 * @param {string} userMaritalStatus - User's marital status
 * @param {Object} examMaritalStatusOrData - Either marital_status object or full exam data object
 * @param {string} userGender - User's gender (REQUIRED)
 * @returns {{eligible: boolean, eligibleDivisions: string[], field: string, userValue: string, examRequirement: string, reason: string}}
 */
export const checkMaritalStatus = (userMaritalStatus, examMaritalStatusOrData, userGender) => {
    const field = 'marital_status';
    
    // Case 1: Direct marital_status object passed (Format 2)
    if (isValidFormat(examMaritalStatusOrData)) {
        const result = checkSingleEligibility(userMaritalStatus, examMaritalStatusOrData, userGender);
        return {
            field,
            userValue: userMaritalStatus || 'Not specified',
            examRequirement: `For ${userGender}: ${result.allowedStatuses.join(', ') || 'No restriction'}`,
            eligible: result.eligible,
            reason: result.reason,
            eligibleDivisions: result.eligible ? ['ALL'] : [],
            ineligibleDivisions: result.eligible ? [] : [{ division: 'ALL', reason: result.reason }]
        };
    }
    
    // Case 2: Full exam data object passed - check for divisions
    const examData = examMaritalStatusOrData;
    
    if (!examData || typeof examData !== 'object') {
        return {
            field,
            userValue: userMaritalStatus || 'Not specified',
            examRequirement: 'No restriction',
            eligible: true,
            reason: 'No marital status data found - everyone eligible',
            eligibleDivisions: ['ALL'],
            ineligibleDivisions: []
        };
    }
    
    const { isDivisionBased, divisions } = detectDivisionStructure(examData);
    
    if (isDivisionBased && divisions) {
        // Division-based exam: check each division
        const eligibleDivisions = [];
        const ineligibleDivisions = [];
        
        for (const [divisionName, divisionData] of Object.entries(divisions)) {
            const divisionMaritalStatus = divisionData?.marital_status;
            
            // Skip if no marital_status defined for this division
            if (!divisionMaritalStatus || Object.keys(divisionMaritalStatus).length === 0) {
                eligibleDivisions.push(divisionName);
                continue;
            }
            
            const result = checkSingleEligibility(userMaritalStatus, divisionMaritalStatus, userGender);
            
            if (result.eligible) {
                eligibleDivisions.push(divisionName);
            } else {
                ineligibleDivisions.push({
                    division: divisionName,
                    reason: result.reason,
                    requirement: `For ${userGender}: ${result.allowedStatuses.join(', ')}`
                });
            }
        }
        
        const overallEligible = eligibleDivisions.length > 0;
        
        return {
            field,
            userValue: userMaritalStatus || 'Not specified',
            examRequirement: 'Division-based (varies by gender)',
            eligible: overallEligible,
            eligibleDivisions,
            ineligibleDivisions,
            reason: overallEligible 
                ? `Eligible for ${eligibleDivisions.length} division(s): ${eligibleDivisions.join(', ')}`
                : `Not eligible for any division based on marital status`
        };
    } else {
        // Non-division-based exam
        const examMaritalStatus = examData?.marital_status;
        
        if (!examMaritalStatus || Object.keys(examMaritalStatus).length === 0) {
            return {
                field,
                userValue: userMaritalStatus || 'Not specified',
                examRequirement: 'No restriction',
                eligible: true,
                reason: 'No marital status restriction defined',
                eligibleDivisions: ['ALL'],
                ineligibleDivisions: []
            };
        }
        
        const result = checkSingleEligibility(userMaritalStatus, examMaritalStatus, userGender);
        
        return {
            field,
            userValue: userMaritalStatus || 'Not specified',
            examRequirement: `For ${userGender}: ${result.allowedStatuses.join(', ') || 'No restriction'}`,
            eligible: result.eligible,
            reason: result.reason,
            eligibleDivisions: result.eligible ? ['ALL'] : [],
            ineligibleDivisions: result.eligible ? [] : [{ division: 'ALL', reason: result.reason }]
        };
    }
};

/**
 * Check if marital status field should be shown in form
 * @param {Object} examData - Exam data object
 * @returns {boolean} - true if field should be shown
 */
export const shouldShowMaritalStatusField = (examData) => {
    const { isDivisionBased, divisions } = detectDivisionStructure(examData);
    
    if (isDivisionBased && divisions) {
        return Object.values(divisions).some(div => {
            const status = div?.marital_status;
            return status && typeof status === 'object' && Object.keys(status).length > 0;
        });
    }
    
    const status = examData?.marital_status;
    return status && typeof status === 'object' && Object.keys(status).length > 0;
};

export default {
    checkMaritalStatus,
    getMaritalStatusOptionsByGender,
    isValidMaritalStatusForGender,
    shouldShowMaritalStatusField
};
