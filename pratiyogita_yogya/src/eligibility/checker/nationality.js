/**
 * Nationality Eligibility Checker
 * 
 * GLOBAL ELIGIBILITY RULEBOOK - Rule Implementation for Nationality
 * 
 * FORMAT: Nationality in exam JSON can be:
 * - Empty string "" → Skip check, all eligible
 * - "ALL APPLICABLE" → All nationalities eligible
 * - "ALL ELIGIBLE" → All nationalities eligible
 * - "NOT APPLICABLE" → No nationality restriction (all eligible)
 * - Array: ["INDIAN", "CITIZEN OF NEPAL", "CITIZEN OF BHUTAN"]
 * - Single value string (legacy): "INDIAN"
 * - Comma-separated string (legacy): "INDIAN, CITIZEN OF NEPAL, CITIZEN OF BHUTAN"
 * 
 * STANDARD VALUES (from possiblefields.json):
 * - INDIAN
 * - CITIZEN OF NEPAL
 * - CITIZEN OF BHUTAN
 * - TIBETAN REFUGEE (PRE-1962)
 * - PERSON OF INDIAN ORIGIN (PIO) FROM PAKISTAN, BURMA/MYANMAR, BANGLADESH, SRI LANKA, 
 *   NEPAL, BHUTAN, AFGHANISTAN, KENYA, UGANDA, TANZANIA, ZAMBIA, MALAWI, ZAIRE/DR CONGO,
 *   ETHIOPIA, SOUTH AFRICA, MAURITIUS, VIETNAM, MALAYSIA, SINGAPORE, INDONESIA, THAILAND, PHILIPPINES
 * - OCI (OVERSEAS CITIZEN OF INDIA) FROM UNITED STATES, UNITED KINGDOM, CANADA, AUSTRALIA,
 *   NEW ZEALAND, GERMANY, FRANCE, ITALY, NETHERLANDS, JAPAN, SOUTH KOREA, UAE, SAUDI ARABIA,
 *   QATAR, KUWAIT, OMAN, BAHRAIN
 * - NRI (NON-RESIDENT INDIAN) IN various countries
 * - FOREIGN NATIONAL
 * - FOREIGN NATIONAL WITH INDIAN DEGREE
 * - FOREIGN NATIONAL WITH INDIAN ORIGIN
 * 
 * DOMICILE LOGIC:
 * - If user nationality is "INDIAN" → Enable domicile dropdown
 * - If user nationality is any other → Disable domicile dropdown (not applicable)
 * 
 * EXAM DATA FORMATS:
 * 1. Non-Division: examData.nationality = ["INDIAN", "CITIZEN OF NEPAL", ...]
 * 2. Division-Based: examData.academies.IMA.nationality = ["INDIAN", "CITIZEN OF NEPAL", ...]
 * 3. Legacy string format is also supported for backward compatibility
 */

// ============================================
// STANDARD NATIONALITY VALUES
// ============================================

/**
 * Standard nationality values from possiblefields.json
 * Used for validation and dropdown options
 */
export const STANDARD_NATIONALITIES = [
    'INDIAN',
    'CITIZEN OF NEPAL',
    'CITIZEN OF BHUTAN',
    'TIBETAN REFUGEE (PRE-1962)',
    // PIO Countries
    'PERSON OF INDIAN ORIGIN (PIO) FROM PAKISTAN',
    'PERSON OF INDIAN ORIGIN (PIO) FROM BURMA/MYANMAR',
    'PERSON OF INDIAN ORIGIN (PIO) FROM BANGLADESH',
    'PERSON OF INDIAN ORIGIN (PIO) FROM SRI LANKA',
    'PERSON OF INDIAN ORIGIN (PIO) FROM NEPAL',
    'PERSON OF INDIAN ORIGIN (PIO) FROM BHUTAN',
    'PERSON OF INDIAN ORIGIN (PIO) FROM AFGHANISTAN',
    'PERSON OF INDIAN ORIGIN (PIO) FROM KENYA',
    'PERSON OF INDIAN ORIGIN (PIO) FROM UGANDA',
    'PERSON OF INDIAN ORIGIN (PIO) FROM TANZANIA',
    'PERSON OF INDIAN ORIGIN (PIO) FROM ZAMBIA',
    'PERSON OF INDIAN ORIGIN (PIO) FROM MALAWI',
    'PERSON OF INDIAN ORIGIN (PIO) FROM ZAIRE/DR CONGO',
    'PERSON OF INDIAN ORIGIN (PIO) FROM ETHIOPIA',
    'PERSON OF INDIAN ORIGIN (PIO) FROM SOUTH AFRICA',
    'PERSON OF INDIAN ORIGIN (PIO) FROM MAURITIUS',
    'PERSON OF INDIAN ORIGIN (PIO) FROM VIETNAM',
    'PERSON OF INDIAN ORIGIN (PIO) FROM MALAYSIA',
    'PERSON OF INDIAN ORIGIN (PIO) FROM SINGAPORE',
    'PERSON OF INDIAN ORIGIN (PIO) FROM INDONESIA',
    'PERSON OF INDIAN ORIGIN (PIO) FROM THAILAND',
    'PERSON OF INDIAN ORIGIN (PIO) FROM PHILIPPINES',
    // OCI Countries
    'OCI (OVERSEAS CITIZEN OF INDIA) FROM UNITED STATES',
    'OCI (OVERSEAS CITIZEN OF INDIA) FROM UNITED KINGDOM',
    'OCI (OVERSEAS CITIZEN OF INDIA) FROM CANADA',
    'OCI (OVERSEAS CITIZEN OF INDIA) FROM AUSTRALIA',
    'OCI (OVERSEAS CITIZEN OF INDIA) FROM NEW ZEALAND',
    'OCI (OVERSEAS CITIZEN OF INDIA) FROM GERMANY',
    'OCI (OVERSEAS CITIZEN OF INDIA) FROM FRANCE',
    'OCI (OVERSEAS CITIZEN OF INDIA) FROM ITALY',
    'OCI (OVERSEAS CITIZEN OF INDIA) FROM NETHERLANDS',
    'OCI (OVERSEAS CITIZEN OF INDIA) FROM JAPAN',
    'OCI (OVERSEAS CITIZEN OF INDIA) FROM SOUTH KOREA',
    'OCI (OVERSEAS CITIZEN OF INDIA) FROM UAE',
    'OCI (OVERSEAS CITIZEN OF INDIA) FROM SAUDI ARABIA',
    'OCI (OVERSEAS CITIZEN OF INDIA) FROM QATAR',
    'OCI (OVERSEAS CITIZEN OF INDIA) FROM KUWAIT',
    'OCI (OVERSEAS CITIZEN OF INDIA) FROM OMAN',
    'OCI (OVERSEAS CITIZEN OF INDIA) FROM BAHRAIN',
    // NRI Countries
    'NRI (NON-RESIDENT INDIAN) IN UNITED STATES',
    'NRI (NON-RESIDENT INDIAN) IN UNITED KINGDOM',
    'NRI (NON-RESIDENT INDIAN) IN CANADA',
    'NRI (NON-RESIDENT INDIAN) IN AUSTRALIA',
    'NRI (NON-RESIDENT INDIAN) IN NEW ZEALAND',
    'NRI (NON-RESIDENT INDIAN) IN GERMANY',
    'NRI (NON-RESIDENT INDIAN) IN FRANCE',
    'NRI (NON-RESIDENT INDIAN) IN ITALY',
    'NRI (NON-RESIDENT INDIAN) IN NETHERLANDS',
    'NRI (NON-RESIDENT INDIAN) IN JAPAN',
    'NRI (NON-RESIDENT INDIAN) IN SINGAPORE',
    'NRI (NON-RESIDENT INDIAN) IN MALAYSIA',
    'NRI (NON-RESIDENT INDIAN) IN UAE',
    'NRI (NON-RESIDENT INDIAN) IN SAUDI ARABIA',
    'NRI (NON-RESIDENT INDIAN) IN QATAR',
    'NRI (NON-RESIDENT INDIAN) IN KUWAIT',
    'NRI (NON-RESIDENT INDIAN) IN OMAN',
    'NRI (NON-RESIDENT INDIAN) IN BAHRAIN',
    'NRI (NON-RESIDENT INDIAN) IN SOUTH AFRICA',
    'NRI (NON-RESIDENT INDIAN) IN MAURITIUS',
    // Foreign Nationals
    'FOREIGN NATIONAL',
    'FOREIGN NATIONAL WITH INDIAN DEGREE',
    'FOREIGN NATIONAL WITH INDIAN ORIGIN'
];

/**
 * Shortened versions that might appear in JSON
 * Maps short forms to full standard forms
 */
const SHORT_TO_FULL = {
    'OCI': 'OCI (OVERSEAS CITIZEN OF INDIA)',
    'PIO': 'PERSON OF INDIAN ORIGIN (PIO)',
    'PERSON OF INDIAN ORIGIN (PIO)': 'PERSON OF INDIAN ORIGIN (PIO)',
    'TIBETAN REFUGEE': 'TIBETAN REFUGEE (PRE-1962)'
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Normalize nationality value - convert short forms to full standard forms
 * @param {string} value - Nationality value from JSON or form
 * @returns {string} - Normalized full form
 */
const normalizeNationality = (value) => {
    if (!value) return '';
    const upperValue = value.trim().toUpperCase();
    
    // If it's already a full standard form, return as-is
    if (STANDARD_NATIONALITIES.includes(upperValue)) {
        return upperValue;
    }
    
    // Check if it matches a short form
    if (SHORT_TO_FULL[upperValue]) {
        return SHORT_TO_FULL[upperValue];
    }
    
    return upperValue;
};

/**
 * Parse nationality from exam JSON into array of allowed nationalities
 * Handles both array format and legacy comma-separated string format
 * @param {string|string[]} nationalityData - Nationality data from exam JSON
 * @returns {string[]} - Array of normalized nationality values
 */
const parseNationalityData = (nationalityData) => {
    if (!nationalityData) {
        return [];
    }
    
    // Handle array format (new format)
    if (Array.isArray(nationalityData)) {
        return nationalityData
            .map(n => (typeof n === 'string' ? n.trim().toUpperCase() : ''))
            .filter(n => n !== '' && n !== 'ALL APPLICABLE' && n !== 'NOT APPLICABLE' && n !== 'ALL ELIGIBLE');
    }
    
    // Handle string format (legacy format)
    if (typeof nationalityData === 'string') {
        // Check for special values
        const upperData = nationalityData.trim().toUpperCase();
        if (upperData === '' || upperData === 'ALL APPLICABLE' || upperData === 'NOT APPLICABLE' || upperData === 'ALL ELIGIBLE') {
            return [];
        }
        
        // Parse comma-separated string
        return nationalityData
            .split(',')
            .map(n => n.trim().toUpperCase())
            .filter(n => n !== '' && n !== 'ALL APPLICABLE' && n !== 'NOT APPLICABLE' && n !== 'ALL ELIGIBLE');
    }
    
    return [];
};

/**
 * Check if nationality data indicates all nationalities are eligible
 * @param {string|string[]} nationalityData - Nationality data from exam JSON
 * @returns {boolean} - True if all nationalities are eligible
 */
const isAllNationalitiesEligible = (nationalityData) => {
    if (!nationalityData) return true;
    if (nationalityData === '') return true;
    
    if (typeof nationalityData === 'string') {
        const upperData = nationalityData.trim().toUpperCase();
        return upperData === '' || upperData === 'ALL APPLICABLE' || upperData === 'NOT APPLICABLE' || upperData === 'ALL ELIGIBLE';
    }
    
    // For array, empty array means no restriction
    if (Array.isArray(nationalityData) && nationalityData.length === 0) {
        return true;
    }
    
    return false;
};

// ============================================
// MAIN CHECK FUNCTION
// ============================================

/**
 * Check nationality eligibility
 * 
 * @param {string} userNationality - User's nationality from form (full standard form)
 * @param {string|string[]|Object} examNationalityOrData - Exam's allowed nationalities OR full examData for division-based
 * @param {string} [divisionName] - Optional division name for division-based exams
 * @returns {{eligible: boolean, userValue: string, examRequirement: string, field: string, reason: string}}
 */
export const checkNationality = (userNationality, examNationalityOrData, divisionName = null) => {
    const field = 'nationality';
    
    // Determine exam nationality requirement
    let examNationality = null;
    
    if (typeof examNationalityOrData === 'object' && examNationalityOrData !== null && !Array.isArray(examNationalityOrData)) {
        // Division-based exam - extract nationality from division data
        examNationality = examNationalityOrData.nationality || '';
    } else {
        // Non-division exam - use directly (could be string or array)
        examNationality = examNationalityOrData || '';
    }
    
    // Handle skip conditions - all nationalities allowed
    if (isAllNationalitiesEligible(examNationality)) {
        return {
            field,
            userValue: userNationality || 'Not specified',
            examRequirement: Array.isArray(examNationality) ? examNationality.join(', ') : (examNationality || 'All nationalities allowed'),
            eligible: true,
            reason: 'No nationality restriction for this exam'
        };
    }
    
    // User must specify nationality if exam has requirements
    if (!userNationality || userNationality === '') {
        const reqDisplay = Array.isArray(examNationality) ? examNationality.join(', ') : examNationality;
        return {
            field,
            userValue: 'Not specified',
            examRequirement: reqDisplay,
            eligible: false,
            reason: 'Please specify your nationality'
        };
    }
    
    // Normalize user's nationality
    const normalizedUserNationality = normalizeNationality(userNationality);
    
    // Parse allowed nationalities from exam (handles both array and string)
    const allowedNationalities = parseNationalityData(examNationality);
    
    // Check if user's nationality is in the allowed list
    let isEligible = false;
    
    for (const allowed of allowedNationalities) {
        const normalizedAllowed = normalizeNationality(allowed);
        
        // Exact match
        if (normalizedUserNationality === normalizedAllowed) {
            isEligible = true;
            break;
        }
        
        // Special handling for PIO - if exam allows any PIO country, check if user selected that specific country
        if (normalizedUserNationality.includes('PERSON OF INDIAN ORIGIN (PIO)') && 
            normalizedAllowed.includes('PERSON OF INDIAN ORIGIN (PIO)')) {
            if (normalizedUserNationality === normalizedAllowed) {
                isEligible = true;
                break;
            }
        }
        
        // Special handling for OCI - if exam allows any OCI country
        if (normalizedUserNationality.includes('OCI (OVERSEAS CITIZEN OF INDIA)') && 
            normalizedAllowed.includes('OCI (OVERSEAS CITIZEN OF INDIA)')) {
            if (normalizedUserNationality === normalizedAllowed) {
                isEligible = true;
                break;
            }
        }
        
        // Special handling for NRI - if exam allows any NRI country
        if (normalizedUserNationality.includes('NRI (NON-RESIDENT INDIAN)') && 
            normalizedAllowed.includes('NRI (NON-RESIDENT INDIAN)')) {
            if (normalizedUserNationality === normalizedAllowed) {
                isEligible = true;
                break;
            }
        }
    }
    
    const reqDisplay = Array.isArray(examNationality) ? examNationality.join(', ') : examNationality;
    
    return {
        field,
        userValue: userNationality,
        examRequirement: reqDisplay,
        eligible: isEligible,
        reason: isEligible 
            ? `Your nationality (${userNationality}) is eligible for this exam`
            : `Your nationality (${userNationality}) is not in the allowed list`
    };
};

// ============================================
// DOMICILE CONTROL FUNCTIONS
// ============================================

/**
 * Check if domicile dropdown should be enabled based on nationality
 * Only Indian nationals have domicile (state/UT of India)
 * 
 * @param {string} userNationality - User's selected nationality
 * @returns {boolean} - True if domicile should be enabled
 */
export const shouldEnableDomicile = (userNationality) => {
    if (!userNationality || userNationality === '') {
        return false; // No nationality selected yet
    }
    
    const normalized = normalizeNationality(userNationality);
    
    // Domicile is only applicable for Indian nationals
    return normalized === 'INDIAN';
};

/**
 * Check if domicile field should be shown at all for this exam
 * (based on exam requirements, not user selection)
 * 
 * @param {Object} examData - Exam JSON data
 * @returns {boolean} - True if domicile field should be shown
 */
export const shouldShowDomicileField = (examData) => {
    if (!examData) return false;
    
    // Check if nationality allows Indian candidates
    const nationality = examData.nationality;
    
    // If all nationalities allowed, show domicile for Indians
    if (isAllNationalitiesEligible(nationality)) {
        return true;
    }
    
    const allowedNationalities = parseNationalityData(nationality);
    
    // Show domicile field if INDIAN is one of the allowed nationalities
    return allowedNationalities.some(n => normalizeNationality(n) === 'INDIAN');
};

// ============================================
// DROPDOWN OPTIONS FUNCTIONS
// ============================================

/**
 * Get nationality options for dropdown based on exam requirements
 * 
 * @param {string|string[]|Object} examNationalityOrData - Exam's nationality field or division data
 * @returns {string[]} - Array of nationality options for dropdown
 */
export const getNationalityOptions = (examNationalityOrData) => {
    let examNationality = null;
    
    if (typeof examNationalityOrData === 'object' && examNationalityOrData !== null && !Array.isArray(examNationalityOrData)) {
        examNationality = examNationalityOrData.nationality || '';
    } else {
        examNationality = examNationalityOrData || '';
    }
    
    // If no restriction or all eligible, return all standard nationalities
    if (isAllNationalitiesEligible(examNationality)) {
        return STANDARD_NATIONALITIES;
    }
    
    // Parse and return only allowed nationalities (handles both array and string)
    const allowed = parseNationalityData(examNationality);
    
    // Return normalized values, preserving order from JSON
    return allowed.map(n => {
        // Return the full standard form if it matches
        const normalized = normalizeNationality(n);
        if (STANDARD_NATIONALITIES.includes(normalized)) {
            return normalized;
        }
        // Otherwise return the original (trimmed and uppercased)
        return n;
    });
};

/**
 * Check if nationality field should be shown for this exam
 * 
 * @param {Object} examData - Exam JSON data (can be division-specific)
 * @returns {boolean} - True if nationality field should be shown
 */
export const shouldShowNationalityField = (examData) => {
    if (!examData) return false;
    
    const nationality = examData.nationality;
    
    // Show field if:
    // 1. nationality is undefined/null → show with default options
    // 2. nationality is empty string → hide (exam doesn't need this info)
    // 3. nationality is "NOT APPLICABLE" → hide
    // 4. nationality is array with values → show with those options
    // 5. nationality is "ALL ELIGIBLE" or "ALL APPLICABLE" → show all options
    
    if (nationality === '' || nationality === 'NOT APPLICABLE') {
        return false;
    }
    
    // Show for arrays (even empty - will show all options)
    if (Array.isArray(nationality)) {
        return true;
    }
    
    return true;
};

/**
 * Get all standard nationality values
 * @returns {string[]} - Array of all standard nationality values
 */
export const getStandardNationalities = () => {
    return [...STANDARD_NATIONALITIES];
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if a nationality value is valid (exists in standard list)
 * @param {string} nationality - Nationality to validate
 * @returns {boolean} - True if valid
 */
export const isValidNationality = (nationality) => {
    if (!nationality) return false;
    const normalized = normalizeNationality(nationality);
    return STANDARD_NATIONALITIES.includes(normalized);
};

/**
 * Get the normalized form of a nationality
 * @param {string} nationality - Nationality value
 * @returns {string} - Normalized nationality
 */
export const getNormalizedNationality = (nationality) => {
    return normalizeNationality(nationality);
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
    checkNationality,
    shouldEnableDomicile,
    shouldShowDomicileField,
    getNationalityOptions,
    shouldShowNationalityField,
    getStandardNationalities,
    isValidNationality,
    getNormalizedNationality,
    STANDARD_NATIONALITIES
};
