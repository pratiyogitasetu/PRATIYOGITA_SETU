/**
 * Domicile Eligibility Checker
 * 
 * GLOBAL ELIGIBILITY RULEBOOK - Rule Implementation for Domicile
 * 
 * PREREQUISITE: Domicile check is ONLY applicable when user's nationality is "INDIAN"
 * For non-Indian nationals, domicile check should be skipped.
 * 
 * FORMAT: Domicile in exam JSON can be:
 * - Empty string "" → Skip check, all eligible
 * - "ALL APPLICABLE" → All domiciles eligible (national level exam)
 * - "NOT APPLICABLE" → No domicile restriction
 * - "ALL STATES" or "PAN INDIA" → All Indian states eligible
 * - "ALL STATES" → All Indian states eligible
 * - Single value: "RAJASTHAN"
 * - Multiple values: "RAJASTHAN, UTTAR PRADESH, BIHAR"
 * 
 * STANDARD VALUES (from eligibilityfields.json):
 * 28 States + 8 Union Territories = 36 total
 * 
 * EXAM DATA FORMATS:
 * 1. Non-Division: examData.domicile = "ALL STATES" or "RAJASTHAN, UP"
 * 2. Division-Based: examData.academies.IMA.domicile = "ALL STATES"
 */

// ============================================
// STANDARD DOMICILE VALUES (All Indian States & UTs)
// ============================================

/**
 * All 28 States of India
 */
export const INDIAN_STATES = [
    'ANDHRA PRADESH',
    'ARUNACHAL PRADESH',
    'ASSAM',
    'BIHAR',
    'CHHATTISGARH',
    'GOA',
    'GUJARAT',
    'HARYANA',
    'HIMACHAL PRADESH',
    'JHARKHAND',
    'KARNATAKA',
    'KERALA',
    'MADHYA PRADESH',
    'MAHARASHTRA',
    'MANIPUR',
    'MEGHALAYA',
    'MIZORAM',
    'NAGALAND',
    'ODISHA',
    'PUNJAB',
    'RAJASTHAN',
    'SIKKIM',
    'TAMIL NADU',
    'TELANGANA',
    'TRIPURA',
    'UTTAR PRADESH',
    'UTTARAKHAND',
    'WEST BENGAL'
];

/**
 * All 8 Union Territories of India
 */
export const UNION_TERRITORIES = [
    'ANDAMAN AND NICOBAR ISLANDS',
    'CHANDIGARH',
    'DADRA AND NAGAR HAVELI AND DAMAN AND DIU',
    'DELHI',
    'JAMMU AND KASHMIR',
    'LADAKH',
    'LAKSHADWEEP',
    'PUDUCHERRY'
];

/**
 * All Indian States and Union Territories combined
 */
export const ALL_DOMICILES = [...INDIAN_STATES, ...UNION_TERRITORIES];

/**
 * Values that indicate "all domiciles allowed"
 * These values in exam JSON mean any domicile is acceptable
 */
const ALL_ALLOWED_KEYWORDS = [
    'ALL APPLICABLE',
    'ALL INDIA',
    'ALL STATES',           // Used in exam JSONs
    'ALL INDIAN STATES',
    'PAN INDIA',
    'ANY',
    'NATIONWIDE'
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Normalize domicile value for comparison
 * @param {string} value - Domicile value
 * @returns {string} - Normalized uppercase value
 */
const normalizeDomicile = (value) => {
    if (!value) return '';
    return value.trim().toUpperCase();
};

/**
 * Check if the exam domicile requirement means "all allowed"
 * @param {string} examDomicile - Exam's domicile requirement
 * @returns {boolean} - True if all domiciles are allowed
 */
const isAllDomicilesAllowed = (examDomicile) => {
    if (!examDomicile || examDomicile === '') return true;
    
    const normalized = normalizeDomicile(examDomicile);
    return ALL_ALLOWED_KEYWORDS.includes(normalized) || normalized === 'NOT APPLICABLE';
};

/**
 * Parse domicile string from exam JSON into array of allowed domiciles
 * @param {string} domicileStr - Comma-separated domicile string
 * @returns {string[]} - Array of normalized domicile values
 */
const parseDomicileString = (domicileStr) => {
    if (!domicileStr || typeof domicileStr !== 'string') {
        return [];
    }
    
    // If it's an "all allowed" value, return empty array (handled separately)
    if (isAllDomicilesAllowed(domicileStr)) {
        return [];
    }
    
    return domicileStr
        .split(',')
        .map(d => d.trim().toUpperCase())
        .filter(d => d !== '' && !ALL_ALLOWED_KEYWORDS.includes(d));
};

// ============================================
// MAIN CHECK FUNCTION
// ============================================

/**
 * Check domicile eligibility
 * 
 * NOTE: This function should only be called for Indian nationals.
 * The frontend/caller should skip this check for non-Indian users.
 * 
 * @param {string} userDomicile - User's domicile state/UT from form
 * @param {string|Object} examDomicileOrData - Exam's allowed domicile OR full examData
 * @param {string} [userNationality] - Optional user's nationality (for safety check)
 * @returns {{eligible: boolean, userValue: string, examRequirement: string, field: string, reason: string}}
 */
export const checkDomicile = (userDomicile, examDomicileOrData, userNationality = null) => {
    const field = 'domicile';
    
    // Safety check: If nationality is provided and not Indian, skip domicile check
    if (userNationality && normalizeDomicile(userNationality) !== 'INDIAN') {
        return {
            field,
            userValue: userDomicile || 'Not applicable',
            examRequirement: 'N/A (Non-Indian national)',
            eligible: true,
            reason: 'Domicile check not applicable for non-Indian nationals'
        };
    }
    
    // Determine exam domicile requirement
    let examDomicile = '';
    
    if (typeof examDomicileOrData === 'object' && examDomicileOrData !== null) {
        // Division-based exam - extract domicile from division data
        examDomicile = examDomicileOrData.domicile || '';
    } else {
        // Non-division exam - use directly
        examDomicile = examDomicileOrData || '';
    }
    
    // Handle skip conditions - all domiciles allowed
    if (!examDomicile || examDomicile === '' || isAllDomicilesAllowed(examDomicile)) {
        return {
            field,
            userValue: userDomicile || 'Not specified',
            examRequirement: examDomicile || 'All India (No restriction)',
            eligible: true,
            reason: 'No domicile restriction for this exam - open for all Indian states/UTs'
        };
    }
    
    // User must specify domicile if exam has specific requirements
    if (!userDomicile || userDomicile === '') {
        return {
            field,
            userValue: 'Not specified',
            examRequirement: examDomicile,
            eligible: false,
            reason: 'Please specify your domicile state/UT'
        };
    }
    
    // Normalize user's domicile
    const normalizedUserDomicile = normalizeDomicile(userDomicile);
    
    // Parse allowed domiciles from exam
    const allowedDomiciles = parseDomicileString(examDomicile);
    
    // If parsing returned empty but examDomicile is not "all allowed", 
    // it might be a single state
    if (allowedDomiciles.length === 0 && examDomicile && !isAllDomicilesAllowed(examDomicile)) {
        // Single state requirement
        const singleState = normalizeDomicile(examDomicile);
        if (normalizedUserDomicile === singleState) {
            return {
                field,
                userValue: userDomicile,
                examRequirement: examDomicile,
                eligible: true,
                reason: `Your domicile (${userDomicile}) matches the requirement`
            };
        } else {
            return {
                field,
                userValue: userDomicile,
                examRequirement: examDomicile,
                eligible: false,
                reason: `This exam is only for candidates from ${examDomicile}`
            };
        }
    }
    
    // Check if user's domicile is in the allowed list
    const isEligible = allowedDomiciles.includes(normalizedUserDomicile);
    
    return {
        field,
        userValue: userDomicile,
        examRequirement: examDomicile,
        eligible: isEligible,
        reason: isEligible 
            ? `Your domicile (${userDomicile}) is eligible for this exam`
            : `Your domicile (${userDomicile}) is not in the allowed list: ${examDomicile}`
    };
};

// ============================================
// DROPDOWN OPTIONS FUNCTIONS
// ============================================

/**
 * Get domicile options for dropdown based on exam requirements
 * 
 * @param {string|Object} examDomicileOrData - Exam's domicile field or division data
 * @returns {string[]} - Array of domicile options for dropdown
 */
export const getDomicileOptions = (examDomicileOrData) => {
    let examDomicile = '';
    
    if (typeof examDomicileOrData === 'object' && examDomicileOrData !== null) {
        examDomicile = examDomicileOrData.domicile || '';
    } else {
        examDomicile = examDomicileOrData || '';
    }
    
    // If no restriction or "all allowed", return all domiciles
    if (!examDomicile || examDomicile === '' || isAllDomicilesAllowed(examDomicile)) {
        return ALL_DOMICILES;
    }
    
    // Parse and return only allowed domiciles
    const allowed = parseDomicileString(examDomicile);
    
    // If single state (not comma-separated), return just that
    if (allowed.length === 0 && examDomicile) {
        const singleState = normalizeDomicile(examDomicile);
        if (ALL_DOMICILES.includes(singleState)) {
            return [singleState];
        }
    }
    
    // Return allowed domiciles, filtering to only valid ones
    return allowed.filter(d => ALL_DOMICILES.includes(d));
};

/**
 * Check if domicile field should be shown for this exam
 * Domicile is only relevant for Indian nationals
 * 
 * @param {Object} examData - Exam JSON data (can be division-specific)
 * @param {string} userNationality - User's selected nationality
 * @returns {boolean} - True if domicile field should be shown
 */
export const shouldShowDomicileField = (examData, userNationality) => {
    // Only show domicile for Indian nationals
    if (!userNationality || normalizeDomicile(userNationality) !== 'INDIAN') {
        return false;
    }
    
    if (!examData) return true; // Default to showing for Indians
    
    const domicile = examData.domicile;
    
    // Show field unless explicitly "NOT APPLICABLE" (which is rare)
    // Most exams will have "ALL STATES" or specific states
    if (domicile === 'NOT APPLICABLE') {
        return false;
    }
    
    return true;
};

/**
 * Check if domicile dropdown should be enabled based on nationality
 * (Same as nationality.js shouldEnableDomicile but here for completeness)
 * 
 * @param {string} userNationality - User's selected nationality
 * @returns {boolean} - True if domicile should be enabled
 */
export const isDomicileApplicable = (userNationality) => {
    if (!userNationality || userNationality === '') {
        return false;
    }
    return normalizeDomicile(userNationality) === 'INDIAN';
};

/**
 * Get all standard domicile values (states + UTs)
 * @returns {string[]} - Array of all Indian states and UTs
 */
export const getAllDomiciles = () => {
    return [...ALL_DOMICILES];
};

/**
 * Get only Indian states
 * @returns {string[]} - Array of 28 Indian states
 */
export const getIndianStates = () => {
    return [...INDIAN_STATES];
};

/**
 * Get only Union Territories
 * @returns {string[]} - Array of 8 Union Territories
 */
export const getUnionTerritories = () => {
    return [...UNION_TERRITORIES];
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if a domicile value is valid (exists in standard list)
 * @param {string} domicile - Domicile to validate
 * @returns {boolean} - True if valid
 */
export const isValidDomicile = (domicile) => {
    if (!domicile) return false;
    const normalized = normalizeDomicile(domicile);
    return ALL_DOMICILES.includes(normalized);
};

/**
 * Check if domicile is a state (not UT)
 * @param {string} domicile - Domicile to check
 * @returns {boolean} - True if it's a state
 */
export const isState = (domicile) => {
    if (!domicile) return false;
    const normalized = normalizeDomicile(domicile);
    return INDIAN_STATES.includes(normalized);
};

/**
 * Check if domicile is a Union Territory
 * @param {string} domicile - Domicile to check
 * @returns {boolean} - True if it's a UT
 */
export const isUnionTerritory = (domicile) => {
    if (!domicile) return false;
    const normalized = normalizeDomicile(domicile);
    return UNION_TERRITORIES.includes(normalized);
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
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
};
