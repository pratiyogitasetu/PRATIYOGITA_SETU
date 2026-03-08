/**
 * Age Relaxation Checker
 * 
 * ============================================
 * PURPOSE:
 * ============================================
 * In Indian government exams, age relaxation is provided to candidates
 * from reserved categories (SC, ST, OBC, PWD, Ex-Servicemen, etc.)
 * 
 * This allows them to have a higher maximum age limit than general category.
 * 
 * ============================================
 * HOW AGE RELAXATION WORKS:
 * ============================================
 * 
 * Example: SSC GD Constable
 * - Base age limit: 18-23 years (for General category)
 * - OBC relaxation: 3 years → effective age limit becomes 18-26 years
 * - SC/ST relaxation: 5 years → effective age limit becomes 18-28 years
 * 
 * In DOB terms (for 2026 session):
 * - General: DOB between 02-01-2002 to 01-01-2007 (age 19-24 on cutoff)
 * - With 5 years relaxation: DOB between 02-01-1997 to 01-01-2007
 *   (minimum DOB extended back by 5 years)
 * 
 * ============================================
 * JSON STRUCTURE:
 * ============================================
 * 
 * "age_relaxation": {
 *     "GEN": "0 YEARS",
 *     "OBC": "3 YEARS",
 *     "EWS": "0 YEARS", 
 *     "SC": "5 YEARS",
 *     "ST": "5 YEARS"
 * }
 * 
 * Or simple string:
 * "age_relaxation": "NO AGE RELAXATION"
 * "age_relaxation": ""
 */

// ============================================
// PARSE RELAXATION VALUE
// ============================================

/**
 * Parse relaxation string to get years
 * @param {string} relaxationStr - e.g., "5 YEARS", "3 YEARS", "0 YEARS"
 * @returns {number} - Number of years (0 if not applicable)
 */
export const parseRelaxationYears = (relaxationStr) => {
    if (!relaxationStr || typeof relaxationStr !== 'string') {
        return 0;
    }
    
    const str = relaxationStr.toUpperCase().trim();
    
    // Handle "NO AGE RELAXATION" or empty
    if (str === '' || str.includes('NO') || str === 'NOT APPLICABLE' || str === 'N/A') {
        return 0;
    }
    
    // Extract number from strings like "5 YEARS", "3 YEARS", "5", etc.
    const match = str.match(/(\d+)/);
    if (match) {
        return parseInt(match[1], 10);
    }
    
    return 0;
};

// ============================================
// GET RELAXATION FOR CATEGORY
// ============================================

/**
 * Get age relaxation years for a specific category
 * @param {Object|string} ageRelaxationData - age_relaxation field from exam JSON
 * @param {string} userCategory - User's caste category (GEN, OBC, SC, ST, EWS)
 * @param {boolean} isPwd - Whether user is PWD (optional, for PWD_ prefix check)
 * @param {Object} examData - Full exam data (optional, for new pwd_status structure)
 * @returns {number} - Years of relaxation
 */
export const getRelaxationForCategory = (ageRelaxationData, userCategory, isPwd = false, examData = null) => {
    if (!userCategory) {
        return 0;
    }
    
    const category = userCategory.toUpperCase().trim();
    
    // ============================================
    // PWD-SPECIFIC RELAXATION CHECK
    // ============================================
    if (isPwd) {
        // Check new structure: pwd_status.age_relaxation_basis
        if (examData?.pwd_status?.age_relaxation_basis && 
            typeof examData.pwd_status.age_relaxation_basis === 'object') {
            const pwdRelaxation = examData.pwd_status.age_relaxation_basis;
            
            // Check if there are actual values
            const hasValues = Object.values(pwdRelaxation).some(v => v && v !== '');
            
            if (hasValues) {
                // Direct match for category
                if (pwdRelaxation[category] && pwdRelaxation[category] !== '') {
                    return parseRelaxationYears(pwdRelaxation[category]);
                }
                // Try base category
                const baseCategory = category.split('(')[0].trim();
                if (pwdRelaxation[baseCategory] && pwdRelaxation[baseCategory] !== '') {
                    return parseRelaxationYears(pwdRelaxation[baseCategory]);
                }
            }
        }
        
        // Check old structure: age_relaxation.PWD_GEN, PWD_OBC, etc.
        if (ageRelaxationData && typeof ageRelaxationData === 'object') {
            const pwdKey = `PWD_${category}`;
            if (ageRelaxationData[pwdKey]) {
                return parseRelaxationYears(ageRelaxationData[pwdKey]);
            }
            // Try base category with PWD prefix
            const baseCategory = category.split('(')[0].trim();
            const pwdBaseKey = `PWD_${baseCategory}`;
            if (ageRelaxationData[pwdBaseKey]) {
                return parseRelaxationYears(ageRelaxationData[pwdBaseKey]);
            }
        }
    }
    
    // ============================================
    // STANDARD RELAXATION (Non-PWD or no PWD-specific found)
    // ============================================
    if (!ageRelaxationData) {
        return 0;
    }
    
    // If it's a simple string (like "NO AGE RELAXATION")
    if (typeof ageRelaxationData === 'string') {
        return parseRelaxationYears(ageRelaxationData);
    }
    
    // If it's an object with category-wise relaxation
    if (typeof ageRelaxationData === 'object') {
        // Direct match
        if (ageRelaxationData[category]) {
            return parseRelaxationYears(ageRelaxationData[category]);
        }
        
        // Try variations
        const variations = {
            'GENERAL': 'GEN',
            'GEN': 'GENERAL',
            'SC (SCHEDULED CASTE)': 'SC',
            'ST (SCHEDULED TRIBE)': 'ST',
            'OBC (OTHER BACKWARD CLASS)': 'OBC',
            'SCHEDULED CASTE': 'SC',
            'SCHEDULED TRIBE': 'ST',
            'OTHER BACKWARD CLASS': 'OBC'
        };
        
        // Check if user category contains a known category
        for (const [full, short] of Object.entries(variations)) {
            if (category.includes(full) || category.includes(short)) {
                const key = category.includes(full) ? short : full;
                if (ageRelaxationData[key]) {
                    return parseRelaxationYears(ageRelaxationData[key]);
                }
                if (ageRelaxationData[short]) {
                    return parseRelaxationYears(ageRelaxationData[short]);
                }
            }
        }
        
        // Extract base category from formats like "SC (SCHEDULED CASTE)"
        const baseCategory = category.split('(')[0].trim();
        if (ageRelaxationData[baseCategory]) {
            return parseRelaxationYears(ageRelaxationData[baseCategory]);
        }
    }
    
    return 0;
};

// ============================================
// APPLY RELAXATION TO DOB RANGE
// ============================================

/**
 * Apply age relaxation to a DOB range
 * Relaxation extends the MINIMUM DOB (allows older candidates)
 * 
 * @param {Date} minDob - Minimum DOB (earliest birth date allowed)
 * @param {Date} maxDob - Maximum DOB (latest birth date allowed)
 * @param {number} relaxationYears - Years of relaxation to apply
 * @returns {Object} - { minDob, maxDob, relaxationApplied }
 */
export const applyRelaxationToDobRange = (minDob, maxDob, relaxationYears) => {
    if (!relaxationYears || relaxationYears <= 0) {
        return {
            minDob,
            maxDob,
            relaxationApplied: false,
            relaxationYears: 0
        };
    }
    
    // Create new minimum DOB by subtracting relaxation years
    // This allows OLDER candidates (born earlier)
    const relaxedMinDob = new Date(minDob);
    relaxedMinDob.setFullYear(relaxedMinDob.getFullYear() - relaxationYears);
    
    return {
        minDob: relaxedMinDob,
        maxDob, // Maximum DOB stays same (minimum age requirement unchanged)
        relaxationApplied: true,
        relaxationYears
    };
};

// ============================================
// APPLY RELAXATION TO AGE RANGE
// ============================================

/**
 * Apply age relaxation to an age range
 * Relaxation increases the MAXIMUM AGE
 * 
 * @param {number} minAge - Minimum age required
 * @param {number} maxAge - Maximum age allowed
 * @param {number} relaxationYears - Years of relaxation
 * @returns {Object} - { minAge, maxAge, relaxationApplied }
 */
export const applyRelaxationToAgeRange = (minAge, maxAge, relaxationYears) => {
    if (!relaxationYears || relaxationYears <= 0) {
        return {
            minAge,
            maxAge,
            relaxationApplied: false,
            relaxationYears: 0
        };
    }
    
    return {
        minAge, // Minimum age stays same
        maxAge: maxAge + relaxationYears, // Maximum age increased
        relaxationApplied: true,
        relaxationYears
    };
};

// ============================================
// CHECK ELIGIBILITY WITH RELAXATION
// ============================================

/**
 * Check if user's DOB is eligible with age relaxation
 * 
 * @param {Date} userDob - User's date of birth
 * @param {Date} minDob - Minimum DOB from exam criteria (without relaxation)
 * @param {Date} maxDob - Maximum DOB from exam criteria
 * @param {number} relaxationYears - Years of relaxation for user's category
 * @returns {Object} - { eligible, eligibleWithRelaxation, relaxationApplied, message }
 */
export const checkDobWithRelaxation = (userDob, minDob, maxDob, relaxationYears) => {
    // First check without relaxation
    const eligibleWithoutRelaxation = userDob >= minDob && userDob <= maxDob;
    
    if (eligibleWithoutRelaxation) {
        return {
            eligible: true,
            eligibleWithRelaxation: false, // Didn't need relaxation
            relaxationApplied: false,
            relaxationYears: 0,
            message: 'Eligible (within age limit)'
        };
    }
    
    // If not eligible without relaxation, check with relaxation
    if (relaxationYears > 0) {
        const { minDob: relaxedMinDob } = applyRelaxationToDobRange(minDob, maxDob, relaxationYears);
        const eligibleAfterRelaxation = userDob >= relaxedMinDob && userDob <= maxDob;
        
        if (eligibleAfterRelaxation) {
            return {
                eligible: true,
                eligibleWithRelaxation: true, // Needed relaxation to be eligible
                relaxationApplied: true,
                relaxationYears,
                message: `Eligible (with ${relaxationYears} years age relaxation)`
            };
        }
    }
    
    return {
        eligible: false,
        eligibleWithRelaxation: false,
        relaxationApplied: relaxationYears > 0,
        relaxationYears,
        message: relaxationYears > 0 
            ? `Not eligible (even with ${relaxationYears} years relaxation)` 
            : 'Not eligible (age criteria not met)'
    };
};

/**
 * Check if user's age is eligible with age relaxation
 * 
 * @param {number} userAge - User's age
 * @param {number} minAge - Minimum age from exam criteria
 * @param {number} maxAge - Maximum age from exam criteria (without relaxation)
 * @param {number} relaxationYears - Years of relaxation for user's category
 * @returns {Object} - { eligible, eligibleWithRelaxation, relaxationApplied, message }
 */
export const checkAgeWithRelaxation = (userAge, minAge, maxAge, relaxationYears) => {
    // First check without relaxation
    const eligibleWithoutRelaxation = userAge >= minAge && userAge <= maxAge;
    
    if (eligibleWithoutRelaxation) {
        return {
            eligible: true,
            eligibleWithRelaxation: false,
            relaxationApplied: false,
            relaxationYears: 0,
            message: 'Eligible (within age limit)'
        };
    }
    
    // If not eligible without relaxation, check with relaxation
    if (relaxationYears > 0) {
        const relaxedMaxAge = maxAge + relaxationYears;
        const eligibleAfterRelaxation = userAge >= minAge && userAge <= relaxedMaxAge;
        
        if (eligibleAfterRelaxation) {
            return {
                eligible: true,
                eligibleWithRelaxation: true,
                relaxationApplied: true,
                relaxationYears,
                message: `Eligible (with ${relaxationYears} years age relaxation)`
            };
        }
    }
    
    return {
        eligible: false,
        eligibleWithRelaxation: false,
        relaxationApplied: relaxationYears > 0,
        relaxationYears,
        message: relaxationYears > 0 
            ? `Not eligible (even with ${relaxationYears} years relaxation)` 
            : 'Not eligible (age criteria not met)'
    };
};

// ============================================
// FORMAT RELAXATION INFO FOR DISPLAY
// ============================================

/**
 * Format age relaxation information for display
 * @param {Object|string} ageRelaxationData - age_relaxation from exam JSON
 * @returns {string} - Formatted string for display
 */
export const formatRelaxationInfo = (ageRelaxationData) => {
    if (!ageRelaxationData) {
        return 'No age relaxation information';
    }
    
    if (typeof ageRelaxationData === 'string') {
        return ageRelaxationData || 'No age relaxation';
    }
    
    if (typeof ageRelaxationData === 'object') {
        const parts = [];
        for (const [category, relaxation] of Object.entries(ageRelaxationData)) {
            parts.push(`${category}: ${relaxation}`);
        }
        return parts.join(', ');
    }
    
    return 'No age relaxation';
};

export default {
    parseRelaxationYears,
    getRelaxationForCategory,
    applyRelaxationToDobRange,
    applyRelaxationToAgeRange,
    checkDobWithRelaxation,
    checkAgeWithRelaxation,
    formatRelaxationInfo
};
