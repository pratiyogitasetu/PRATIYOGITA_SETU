/**
 * Caste Category Eligibility Checker
 * 
 * Handles both division-based and non-division-based exams
 * 
 * Exam JSON Format: SHORT CODES
 * - "GEN, SC, ST, OBC, EWS, MINORITY"
 * 
 * Frontend Form Options: FULL NAMES (for user understanding)
 * - "GENERAL (UR/UNRESERVED)"
 * - "SC (SCHEDULED CASTE)"
 * - "ST (SCHEDULED TRIBE)"
 * - "OBC (OTHER BACKWARD CLASS)"
 * - "EWS (ECONOMICALLY WEAKER SECTION)"
 * - "MINORITY"
 * 
 * Standard Values:
 * - "" (empty): No restriction defined → skip this check (everyone passes)
 * - "ALL APPLICABLE": Everyone passes this criterion
 * - "NOT APPLICABLE": Criterion not considered → everyone passes
 */

// ============================================
// CASTE CATEGORY MAPPINGS
// Maps SHORT CODES (JSON) to FULL NAMES (Form)
// ============================================

const SHORT_TO_FULL = {
    'GEN': 'GENERAL (UR/UNRESERVED)',
    'GENERAL': 'GENERAL (UR/UNRESERVED)',
    'UR': 'GENERAL (UR/UNRESERVED)',
    'UNRESERVED': 'GENERAL (UR/UNRESERVED)',
    
    'SC': 'SC (SCHEDULED CASTE)',
    'SCHEDULED CASTE': 'SC (SCHEDULED CASTE)',
    
    'ST': 'ST (SCHEDULED TRIBE)',
    'SCHEDULED TRIBE': 'ST (SCHEDULED TRIBE)',
    
    'OBC': 'OBC (OTHER BACKWARD CLASS)',
    'OBC-NCL': 'OBC (OTHER BACKWARD CLASS)',
    
    'EWS': 'EWS (ECONOMICALLY WEAKER SECTION)',
    
    'MINORITY': 'MINORITY'
};

// Standard caste categories (full names shown in form)
const STANDARD_CATEGORIES = [
    'GENERAL (UR/UNRESERVED)',
    'SC (SCHEDULED CASTE)',
    'ST (SCHEDULED TRIBE)',
    'OBC (OTHER BACKWARD CLASS)',
    'EWS (ECONOMICALLY WEAKER SECTION)',
    'MINORITY'
];

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
 * Convert short code to full name
 * @param {string} shortCode - Short code from JSON (e.g., "GEN", "SC")
 * @returns {string} - Full name (e.g., "GENERAL (UR/UNRESERVED)")
 */
const shortCodeToFullName = (shortCode) => {
    const normalized = normalizeValue(shortCode);
    if (!normalized) return '';
    
    // If it's a known short code, return full name
    if (SHORT_TO_FULL[normalized]) {
        return SHORT_TO_FULL[normalized];
    }
    
    // If already a full name, return as-is
    if (STANDARD_CATEGORIES.includes(normalized)) {
        return normalized;
    }
    
    // Return as-is if unknown
    return normalized;
};

/**
 * Parse comma-separated caste categories from JSON and convert to full names
 * @param {string} value - Comma-separated short codes from JSON
 * @returns {string[]} - Array of full names
 */
const parseAndConvertCastes = (value) => {
    if (!value || typeof value !== 'string') return [];
    return value.split(',')
        .map(v => shortCodeToFullName(v))
        .filter(v => v !== '');
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
 * Check caste category eligibility for a single requirement value
 * @param {string} userCaste - User's caste category (can be SHORT CODE or FULL NAME from form)
 * @param {string} examCasteValue - Exam's allowed castes (SHORT CODES from JSON)
 * @returns {{eligible: boolean, reason: string}}
 */
const checkSingleCasteEligibility = (userCaste, examCasteValue) => {
    const normalizedUserCaste = normalizeValue(userCaste);
    const normalizedExamCaste = normalizeValue(examCasteValue);
    
    // "" (empty) - No restriction defined → everyone passes
    if (normalizedExamCaste === '') {
        return {
            eligible: true,
            reason: 'No caste category restriction defined'
        };
    }
    
    // "ALL APPLICABLE" - Everyone passes
    if (normalizedExamCaste === 'ALL APPLICABLE') {
        return {
            eligible: true,
            reason: 'All caste categories are eligible'
        };
    }
    
    // "NOT APPLICABLE" - Criterion not considered → everyone passes
    if (normalizedExamCaste === 'NOT APPLICABLE') {
        return {
            eligible: true,
            reason: 'Caste category criterion not applicable'
        };
    }
    
    // User must have specified a caste category
    if (!normalizedUserCaste) {
        return {
            eligible: false,
            reason: 'User caste category not specified'
        };
    }
    
    // Parse exam's short codes from JSON (e.g., "GEN, OBC, SC, ST, EWS")
    const allowedShortCodes = examCasteValue.split(',').map(v => normalizeValue(v)).filter(v => v !== '');
    
    // Convert user's input to short code if it's a full name
    // e.g., "SC (SCHEDULED CASTE)" → "SC", "OBC (OTHER BACKWARD CLASS)" → "OBC"
    let userShortCode = normalizedUserCaste;
    
    // If user value contains parentheses, extract the short code (text before parenthesis)
    if (normalizedUserCaste.includes('(')) {
        userShortCode = normalizedUserCaste.split('(')[0].trim();
    }
    
    // Also check reverse mapping from short code to full name
    const userFullName = shortCodeToFullName(userShortCode);
    
    // Check if user's short code matches any allowed short code
    // Or if user's full name matches any allowed full name
    const isEligible = allowedShortCodes.some(allowedCode => {
        // Direct short code match
        if (allowedCode === userShortCode) return true;
        // Check if user's input matches the full name of allowed code
        const allowedFullName = shortCodeToFullName(allowedCode);
        if (allowedFullName === normalizedUserCaste || allowedFullName === userFullName) return true;
        return false;
    });
    
    return {
        eligible: isEligible,
        reason: isEligible 
            ? `Caste category ${userCaste} is eligible`
            : `Caste category ${userCaste} is not eligible. Allowed: ${allowedShortCodes.join(', ')}`
    };
};

/**
 * Main caste category eligibility checker
 * 
 * @param {string} userCaste - User's caste category (FULL NAME from form dropdown)
 * @param {string|Object} examCasteOrData - Either caste_category field (SHORT CODES) or full exam data
 * @returns {{eligible: boolean, eligibleDivisions: string[], field: string, userValue: string, examRequirement: string, reason: string}}
 */
export const checkCasteCategory = (userCaste, examCasteOrData) => {
    const field = 'caste_category';
    
    // Case 1: Simple string value passed (short codes from JSON)
    if (typeof examCasteOrData === 'string') {
        const result = checkSingleCasteEligibility(userCaste, examCasteOrData);
        return {
            field,
            userValue: userCaste || 'Not specified',
            examRequirement: examCasteOrData || 'No restriction',
            eligible: result.eligible,
            reason: result.reason,
            eligibleDivisions: result.eligible ? ['ALL'] : [],
            ineligibleDivisions: result.eligible ? [] : [{ division: 'ALL', reason: result.reason }]
        };
    }
    
    // Case 2: Full exam data object passed
    const examData = examCasteOrData;
    
    if (!examData || typeof examData !== 'object') {
        return {
            field,
            userValue: userCaste || 'Not specified',
            examRequirement: 'No restriction',
            eligible: true,
            reason: 'No caste category data found - everyone eligible',
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
            const divisionCaste = divisionData?.caste_category || '';
            const result = checkSingleCasteEligibility(userCaste, divisionCaste);
            
            if (result.eligible) {
                eligibleDivisions.push(divisionName);
            } else {
                ineligibleDivisions.push({
                    division: divisionName,
                    reason: result.reason,
                    requirement: divisionCaste
                });
            }
        }
        
        const overallEligible = eligibleDivisions.length > 0;
        
        return {
            field,
            userValue: userCaste || 'Not specified',
            examRequirement: 'Division-based (varies)',
            eligible: overallEligible,
            eligibleDivisions,
            ineligibleDivisions,
            reason: overallEligible 
                ? `Eligible for ${eligibleDivisions.length} division(s): ${eligibleDivisions.join(', ')}`
                : `Not eligible for any division based on caste category`
        };
    } else {
        // Non-division-based exam
        const examCaste = examData?.caste_category || '';
        const result = checkSingleCasteEligibility(userCaste, examCaste);
        
        return {
            field,
            userValue: userCaste || 'Not specified',
            examRequirement: examCaste || 'No restriction',
            eligible: result.eligible,
            reason: result.reason,
            eligibleDivisions: result.eligible ? ['ALL'] : [],
            ineligibleDivisions: result.eligible ? [] : [{ division: 'ALL', reason: result.reason }]
        };
    }
};

/**
 * Get caste category options for frontend dropdown
 * Shows FULL NAMES for user understanding
 * @returns {Array} - Array of caste category options
 */
export const getCasteCategoryOptions = () => {
    return [
        { value: 'GENERAL (UR/UNRESERVED)', label: 'General (UR/Unreserved)' },
        { value: 'SC (SCHEDULED CASTE)', label: 'SC (Scheduled Caste)' },
        { value: 'ST (SCHEDULED TRIBE)', label: 'ST (Scheduled Tribe)' },
        { value: 'OBC (OTHER BACKWARD CLASS)', label: 'OBC (Other Backward Class)' },
        { value: 'EWS (ECONOMICALLY WEAKER SECTION)', label: 'EWS (Economically Weaker Section)' },
        { value: 'MINORITY', label: 'Minority' }
    ];
};

/**
 * Check if caste category field should be shown in form
 * @param {Object} examData - Exam data object
 * @returns {boolean} - true if field should be shown
 */
export const shouldShowCasteCategoryField = (examData) => {
    const { isDivisionBased, divisions } = detectDivisionStructure(examData);
    
    if (isDivisionBased && divisions) {
        return Object.values(divisions).some(div => {
            const caste = normalizeValue(div?.caste_category || '');
            return caste !== '' && caste !== 'ALL APPLICABLE' && caste !== 'NOT APPLICABLE';
        });
    }
    
    const caste = normalizeValue(examData?.caste_category || '');
    return caste !== '' && caste !== 'ALL APPLICABLE' && caste !== 'NOT APPLICABLE';
};

/**
 * Get standard caste categories (full names)
 * @returns {string[]} - Array of standard caste category full names
 */
export const getStandardCategories = () => {
    return STANDARD_CATEGORIES;
};

export default {
    checkCasteCategory,
    getCasteCategoryOptions,
    shouldShowCasteCategoryField,
    getStandardCategories
};
