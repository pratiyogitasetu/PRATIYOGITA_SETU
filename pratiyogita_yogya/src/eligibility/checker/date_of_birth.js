/**
 * Date of Birth / Age Eligibility Checker
 * Checker 7 of 31
 * 
 * ============================================
 * 7 AGE/DOB CRITERIA TYPES:
 * ============================================
 * 
 * AGE-BASED CRITERIA (requires age calculation):
 * 1. STARTING_AGE (MIN_AGE) - Minimum age requirement
 *    Example: starting_age: "19" → candidates aged 19 or older are eligible
 * 
 * 2. ENDING_AGE (MAX_AGE) - Maximum age requirement
 *    Example: ending_age: "25" → candidates aged 25 or younger are eligible
 * 
 * 3. BETWEEN_AGE - Age must fall within a range (inclusive)
 *    Example: between_age: "19 - 25" → candidates aged 19 to 25 are eligible
 * 
 * DOB-BASED CRITERIA (direct date comparison, no age calculation):
 * 4. MINIMUM_DOB (MIN_DOB) - Born on or before a date
 *    Example: minimum_dob: "31-12-2009" → born on/before this date are eligible
 *    (This sets the EARLIEST acceptable birth date)
 * 
 * 5. MAXIMUM_DOB (MAX_DOB) - Born on or after a date
 *    Example: maximum_dob: "01-01-2003" → born on/after this date are eligible
 *    (This sets the LATEST acceptable birth date)
 * 
 * 6. BETWEEN_DOB - DOB must fall between two dates (inclusive)
 *    Example: between_dob: "02-01-2003 to 01-01-2008" → DOB within this range are eligible
 * 
 * NO RESTRICTION CRITERIA:
 * 7. NO_AGE_LIMIT / NO AGE LIMIT - No age/DOB restriction
 *    Example: no_age_limit: { "2026": "NO AGE LIMIT" } → All candidates eligible regardless of age
 *    Used for exams like GATE, CUET-PG, IIT-JAM that have no upper age limit
 * 
 * ============================================
 * SESSION FORMAT (Year-wise with exam frequency):
 * ============================================
 * 
 * For exams conducted once per year:
 *   "2026": "31-12-2009"        (for DOB-based)
 *   "2026": "NO AGE LIMIT"      (for no age limit exams)
 *   "2027": "31-12-2010"
 * 
 * For exams conducted multiple times per year (I, II, III):
 *   "2026-I": "02-01-2003 to 01-01-2008"
 *   "2026-II": "02-07-2003 to 01-07-2008"
 * 
 * ============================================
 * JSON STRUCTURE:
 * ============================================
 * 
 * For exams WITH age/DOB restrictions:
 * {
 *   "age_criteria_type": "BETWEEN_DOB",
 *   "between_dob": {
 *     "2026-I": "02-01-2003 to 01-01-2008",
 *     "2026-II": "02-07-2003 to 01-07-2008"
 *   }
 * }
 * 
 * For exams WITHOUT age restrictions (GATE, CUET-PG, IIT-JAM):
 * {
 *   "age_criteria_type": "NO AGE LIMIT",
 *   "no_age_limit": {
 *     "2026": "NO AGE LIMIT",
 *     "2027": "NO AGE LIMIT"
 *   }
 * }
 */

// ============================================
// AGE CRITERIA TYPE CONSTANTS
// ============================================

export const AGE_CRITERIA_TYPES = {
    // Age-based (requires calculation)
    STARTING_AGE: 'STARTING_AGE',
    MIN_AGE: 'MIN_AGE',
    ENDING_AGE: 'ENDING_AGE',
    MAX_AGE: 'MAX_AGE',
    BETWEEN_AGE: 'BETWEEN_AGE',
    
    // DOB-based (direct comparison)
    MINIMUM_DOB: 'MINIMUM_DOB',
    MIN_DOB: 'MIN_DOB',
    MAXIMUM_DOB: 'MAXIMUM_DOB',
    MAX_DOB: 'MAX_DOB',
    BETWEEN_DOB: 'BETWEEN_DOB',
    
    // No restriction
    NO_AGE_LIMIT: 'NO_AGE_LIMIT',
    NOT_APPLICABLE: 'NOT_APPLICABLE'
};

// ============================================
// DATE PARSING & FORMATTING
// ============================================

/**
 * Parse date string in DD-MM-YYYY or DD.MM.YYYY format to Date object
 * @param {string} dateStr - Date string in DD-MM-YYYY or DD.MM.YYYY format
 * @returns {Date|null} - Parsed Date object or null
 */
export const parseDateDDMMYYYY = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    
    const str = dateStr.trim();
    
    // Handle both DD-MM-YYYY and DD.MM.YYYY formats
    const separator = str.includes('.') ? '.' : '-';
    const parts = str.split(separator);
    
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > 2100) return null;
    
    const date = new Date(year, month, day);
    
    // Validate the date is real (e.g., Feb 30 would be invalid)
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
        return null;
    }
    
    return date;
};

/**
 * Format Date object to DD-MM-YYYY string
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
export const formatDateDDMMYYYY = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
};

// ============================================
// AGE CALCULATION
// ============================================

/**
 * Calculate exact age from date of birth
 * @param {Date} dob - Date of birth
 * @param {Date} referenceDate - Reference date (default: today)
 * @returns {{years: number, months: number, days: number, totalYears: number}}
 */
export const calculateAge = (dob, referenceDate = new Date()) => {
    if (!dob || !(dob instanceof Date) || isNaN(dob)) {
        return { years: 0, months: 0, days: 0, totalYears: 0 };
    }
    
    let years = referenceDate.getFullYear() - dob.getFullYear();
    let months = referenceDate.getMonth() - dob.getMonth();
    let days = referenceDate.getDate() - dob.getDate();
    
    // Adjust for negative days
    if (days < 0) {
        months--;
        // Get last day of previous month
        const lastMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 0);
        days += lastMonth.getDate();
    }
    
    // Adjust for negative months
    if (months < 0) {
        years--;
        months += 12;
    }
    
    // Calculate total years as decimal for precise comparison
    const totalYears = years + (months / 12) + (days / 365);
    
    return { 
        years, 
        months, 
        days, 
        totalYears: parseFloat(totalYears.toFixed(2)) 
    };
};

/**
 * Format age as readable string
 * @param {{years: number, months: number, days: number}} age - Age object
 * @returns {string} - Formatted age string
 */
export const formatAge = (age) => {
    if (!age) return 'Unknown';
    
    const parts = [];
    if (age.years > 0) parts.push(`${age.years} year${age.years !== 1 ? 's' : ''}`);
    if (age.months > 0) parts.push(`${age.months} month${age.months !== 1 ? 's' : ''}`);
    if (age.days > 0 && age.years === 0) parts.push(`${age.days} day${age.days !== 1 ? 's' : ''}`);
    
    return parts.length > 0 ? parts.join(', ') : '0 days';
};

// ============================================
// SESSION HANDLING
// ============================================

/**
 * Get reference date for exam session (for age calculation)
 * @param {string} examSession - Exam session like "2026", "2026-I", "NDA-II-2027"
 * @returns {Date} - Reference date for age calculation
 */
export const getExamReferenceDate = (examSession) => {
    if (!examSession) return new Date();
    
    // Extract year from session string
    const yearMatch = examSession.match(/\d{4}/);
    if (yearMatch) {
        const year = parseInt(yearMatch[0], 10);
        
        // Check for session number (I, II) to determine month
        const sessionMatch = examSession.match(/[-_](I{1,3}|[12])[-_]/i);
        if (sessionMatch) {
            const session = sessionMatch[1].toUpperCase();
            // I = first half (around April-June), II = second half (around August-October)
            if (session === 'I' || session === '1') {
                return new Date(year, 3, 1); // April 1
            } else if (session === 'II' || session === '2') {
                return new Date(year, 7, 1); // August 1
            }
        }
        
        // Default to August 1 of exam year (common cutoff)
        return new Date(year, 7, 1);
    }
    
    return new Date();
};

// ============================================
// CASTE-WISE DOB HELPER
// ============================================

/**
 * Caste category keys used to detect caste-wise DOB structure
 */
const CASTE_KEYS = ['GEN', 'OBC', 'EWS', 'SC', 'ST'];

/**
 * Resolve caste-wise between_dob structure
 * 
 * Handles TWO structures:
 * 1. Flat/year-wise: { "2026": "02-01-2003 to 01-01-2008", ... }
 *    → Returns as-is
 * 2. Caste-wise: { "GEN": { "2026": "..." }, "OBC": { "2026": "..." }, ... }
 *    → Returns the sub-object for user's caste category
 * 
 * @param {Object} betweenDobData - The between_dob field from exam data
 * @param {string} userCategory - User's caste category (GEN, OBC, SC, ST, EWS)
 * @returns {Object|null} - Year-wise DOB data object or null
 */
export const resolveCasteWiseDob = (betweenDobData, userCategory = null) => {
    if (!betweenDobData || typeof betweenDobData !== 'object') return betweenDobData;
    
    const keys = Object.keys(betweenDobData);
    if (keys.length === 0) return betweenDobData;
    
    // Check if first key is a caste category
    const firstKey = keys[0].toUpperCase();
    const isCasteWise = CASTE_KEYS.includes(firstKey);
    
    if (!isCasteWise) {
        // Flat/year-wise structure → return as-is
        return betweenDobData;
    }
    
    // Caste-wise structure → pick user's category
    const category = (userCategory || 'GEN').toUpperCase();
    
    // Try exact match first
    if (betweenDobData[category]) {
        return betweenDobData[category];
    }
    
    // Try case-insensitive match
    const matchKey = keys.find(k => k.toUpperCase() === category);
    if (matchKey) {
        return betweenDobData[matchKey];
    }
    
    // Fallback to GEN or first available
    return betweenDobData['GEN'] || betweenDobData[keys[0]];
};

/**
 * Get available exam sessions from exam data
 * @param {Object} examData - Exam data object (can be division-specific or root)
 * @returns {string[]} - Array of session names
 */
export const getExamSessions = (examData) => {
    if (!examData) return [];
    
    // Check all session-based fields
    const sessionFields = [
        'between_dob', 'minimum_dob', 'maximum_dob',
        'between_age', 'starting_age', 'ending_age'
    ];
    
    for (const field of sessionFields) {
        let value = examData[field];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            let keys = Object.keys(value);
            
            // Check if this is a caste-wise structure (first key is GEN/OBC/SC/ST/EWS)
            if (keys.length > 0 && CASTE_KEYS.includes(keys[0].toUpperCase())) {
                // Drill into first caste sub-object to get session keys
                value = value[keys[0]];
                if (value && typeof value === 'object') {
                    keys = Object.keys(value);
                } else {
                    continue;
                }
            }
            
            // Filter out non-session keys
            if (keys.length > 0 && keys[0].match(/\d{4}/)) {
                return keys;
            }
        }
    }
    
    return [];
};

/**
 * Extract year from session string
 * @param {string} session - Session like "2026", "2026-I", "NDA-II-2027"
 * @returns {string|null} - Just the year "2026", "2027", etc.
 */
export const extractYearFromSession = (session) => {
    if (!session) return null;
    const match = session.match(/\d{4}/);
    return match ? match[0] : null;
};

/**
 * Get value for a specific session from session-based data
 * Handles both simple year keys ("2026") and complex keys ("2026-I", "NDA-II-2026")
 * 
 * @param {Object|string} data - Session-based data object or direct value
 * @param {string} examSession - User-selected session like "2026-I"
 * @param {string} examCode - Exam code like "CDS", "NDA" (optional, for building session key)
 * @returns {string|null} - Value for the session or null
 */
export const getValueForSession = (data, examSession, examCode = null) => {
    if (!data) return null;
    
    // If data is a string, return it directly (non-session-based)
    if (typeof data === 'string') {
        return data.trim() !== '' ? data : null;
    }
    
    // If data is not an object, return null
    if (typeof data !== 'object' || Array.isArray(data)) return null;
    
    // Get all available session keys
    const sessionKeys = Object.keys(data);
    if (sessionKeys.length === 0) return null;
    
    // If no specific session requested, try to find current/default
    if (!examSession) {
        // Return first available session
        const firstKey = sessionKeys[0];
        return data[firstKey] || null;
    }
    
    // Try exact match first
    if (data[examSession]) {
        return data[examSession];
    }
    
    // Try case-insensitive match
    const lowerSession = examSession.toLowerCase();
    const matchKey = sessionKeys.find(k => k.toLowerCase() === lowerSession);
    if (matchKey) {
        return data[matchKey];
    }
    
    // Try building key with exam code if provided
    // e.g., examCode="CDS", examSession="I-2026" → "2026-I"
    if (examCode) {
        const possibleKeys = [
            `${examCode}-${examSession}`,
            `${examCode}_${examSession}`,
            `${examCode}${examSession}`
        ];
        for (const key of possibleKeys) {
            if (data[key]) return data[key];
            const matchKey = sessionKeys.find(k => k.toLowerCase() === key.toLowerCase());
            if (matchKey) return data[matchKey];
        }
    }
    
    // Try just year match if session contains year
    const yearMatch = examSession.match(/\d{4}/);
    if (yearMatch) {
        const year = yearMatch[0];
        // Check if there's a key with just the year
        if (data[year]) return data[year];
        
        // Find keys containing this year
        const yearKeys = sessionKeys.filter(k => k.includes(year));
        if (yearKeys.length > 0) {
            // If user selected I or II, try to match
            const sessionNum = examSession.match(/[-_](I{1,3}|[12])[-_]?/i);
            if (sessionNum) {
                const num = sessionNum[1].toUpperCase();
                const matchKey = yearKeys.find(k => k.toUpperCase().includes(`-${num}-`) || k.toUpperCase().includes(`_${num}_`));
                if (matchKey) return data[matchKey];
            }
            // Return first year match
            return data[yearKeys[0]];
        }
    }
    
    return null;
};

// ============================================
// PARSING HELPERS
// ============================================

/**
 * Parse age range string like "19 to 25", "19-25", "19 - 25"
 * @param {string} rangeStr - Age range string
 * @returns {{minAge: number, maxAge: number}|null}
 */
export const parseAgeRange = (rangeStr) => {
    if (!rangeStr) return null;
    
    const str = rangeStr.toString().trim();
    
    // Try "19 to 25" format
    if (str.toLowerCase().includes(' to ')) {
        const parts = str.toLowerCase().split(' to ');
        if (parts.length === 2) {
            const minAge = parseFloat(parts[0].trim());
            const maxAge = parseFloat(parts[1].trim());
            if (!isNaN(minAge) && !isNaN(maxAge)) {
                return { minAge, maxAge };
            }
        }
    }
    
    // Try "19 - 25" format (with spaces around dash)
    if (str.includes(' - ')) {
        const parts = str.split(' - ');
        if (parts.length === 2) {
            const minAge = parseFloat(parts[0].trim());
            const maxAge = parseFloat(parts[1].trim());
            if (!isNaN(minAge) && !isNaN(maxAge)) {
                return { minAge, maxAge };
            }
        }
    }
    
    // Try "19-25" format (but not date format like DD-MM-YYYY)
    // Avoid matching dates by checking for short numbers
    if (str.includes('-') && !str.match(/\d{2}-\d{2}-\d{4}/)) {
        const parts = str.split('-');
        if (parts.length === 2) {
            const minAge = parseFloat(parts[0].trim());
            const maxAge = parseFloat(parts[1].trim());
            // Age should be reasonable (1-100)
            if (!isNaN(minAge) && !isNaN(maxAge) && minAge < 100 && maxAge < 100) {
                return { minAge, maxAge };
            }
        }
    }
    
    return null;
};

/**
 * Parse DOB range string like "02-01-2003 to 01-01-2008"
 * @param {string} rangeStr - DOB range string
 * @returns {{startDob: string, endDob: string}|null}
 */
export const parseDobRange = (rangeStr) => {
    if (!rangeStr || typeof rangeStr !== 'string') return null;
    
    const str = rangeStr.trim();
    
    // Try "DD-MM-YYYY to DD-MM-YYYY" format
    if (str.toLowerCase().includes(' to ')) {
        const parts = str.split(/\s+to\s+/i);
        if (parts.length === 2) {
            const startDob = parts[0].trim();
            const endDob = parts[1].trim();
            
            // Validate both are valid date strings
            if (parseDateDDMMYYYY(startDob) && parseDateDDMMYYYY(endDob)) {
                return { startDob, endDob };
            }
        }
    }
    
    return null;
};

// ============================================
// CRITERIA TYPE 1: STARTING AGE (Minimum Age)
// User must be AT LEAST this age
// ============================================

/**
 * Check if user meets minimum age requirement
 * @param {Date} userDob - User's date of birth
 * @param {number|string} startingAge - Minimum age required
 * @param {Date} referenceDate - Reference date for age calculation
 * @returns {{eligible: boolean, userAge: object, requiredAge: number}}
 */
export const checkStartingAge = (userDob, startingAge, referenceDate = new Date()) => {
    if (!userDob || !startingAge) {
        return { eligible: true, userAge: null, requiredAge: null, skipped: true };
    }
    
    const age = calculateAge(userDob, referenceDate);
    const requiredAge = parseFloat(startingAge);
    
    if (isNaN(requiredAge)) {
        return { eligible: true, userAge: age, requiredAge: null, skipped: true };
    }
    
    return {
        eligible: age.years >= requiredAge,
        userAge: age,
        requiredAge,
        skipped: false
    };
};

// ============================================
// CRITERIA TYPE 2: ENDING AGE (Maximum Age)
// User must be AT MOST this age
// ============================================

/**
 * Check if user is within maximum age limit
 * @param {Date} userDob - User's date of birth
 * @param {number|string} endingAge - Maximum age allowed
 * @param {Date} referenceDate - Reference date for age calculation
 * @returns {{eligible: boolean, userAge: object, maxAge: number}}
 */
export const checkEndingAge = (userDob, endingAge, referenceDate = new Date()) => {
    if (!userDob || !endingAge) {
        return { eligible: true, userAge: null, maxAge: null, skipped: true };
    }
    
    const age = calculateAge(userDob, referenceDate);
    const maxAge = parseFloat(endingAge);
    
    if (isNaN(maxAge)) {
        return { eligible: true, userAge: age, maxAge: null, skipped: true };
    }
    
    return {
        eligible: age.years <= maxAge,
        userAge: age,
        maxAge,
        skipped: false
    };
};

// ============================================
// CRITERIA TYPE 3: BETWEEN AGE (Age Range)
// User's age must fall within the range (inclusive)
// ============================================

/**
 * Check if user's age falls within a range
 * @param {Date} userDob - User's date of birth
 * @param {number|string} minAge - Minimum age
 * @param {number|string} maxAge - Maximum age
 * @param {Date} referenceDate - Reference date for age calculation
 * @returns {{eligible: boolean, userAge: object, minAge: number, maxAge: number}}
 */
export const checkBetweenAge = (userDob, minAge, maxAge, referenceDate = new Date()) => {
    if (!userDob) {
        return { eligible: false, userAge: null, minAge: null, maxAge: null, skipped: true };
    }
    
    const age = calculateAge(userDob, referenceDate);
    const min = parseFloat(minAge);
    const max = parseFloat(maxAge);
    
    if (isNaN(min) || isNaN(max)) {
        return { eligible: true, userAge: age, minAge: null, maxAge: null, skipped: true };
    }
    
    return {
        eligible: age.years >= min && age.years <= max,
        userAge: age,
        minAge: min,
        maxAge: max,
        skipped: false
    };
};

// ============================================
// CRITERIA TYPE 4: MINIMUM DOB (Born on or before)
// Sets the EARLIEST acceptable birth date
// Example: minimum_dob: "31-12-2009" means born on/before Dec 31, 2009
// ============================================

/**
 * Check if user was born on or before a specific date
 * @param {Date} userDob - User's date of birth
 * @param {string} minDobStr - Minimum DOB date in DD-MM-YYYY format
 * @returns {{eligible: boolean, userDob: Date, minDob: Date}}
 */
export const checkMinimumDob = (userDob, minDobStr) => {
    if (!userDob || !minDobStr) {
        return { eligible: true, userDob: null, minDob: null, skipped: true };
    }
    
    const minDob = parseDateDDMMYYYY(minDobStr);
    if (!minDob) {
        return { eligible: true, userDob, minDob: null, skipped: true };
    }
    
    // User's DOB must be on or before the minimum DOB
    // Example: minDob = Dec 31, 2009
    // User born Dec 30, 2009 → eligible (born before cutoff)
    // User born Dec 31, 2009 → eligible (born on cutoff)
    // User born Jan 1, 2010 → NOT eligible (born after cutoff)
    return {
        eligible: userDob.getTime() <= minDob.getTime(),
        userDob,
        minDob,
        skipped: false
    };
};

// ============================================
// CRITERIA TYPE 5: MAXIMUM DOB (Born on or after)
// Sets the LATEST acceptable birth date
// Example: maximum_dob: "01-01-2003" means born on/after Jan 1, 2003
// ============================================

/**
 * Check if user was born on or after a specific date
 * @param {Date} userDob - User's date of birth
 * @param {string} maxDobStr - Maximum DOB date in DD-MM-YYYY format
 * @returns {{eligible: boolean, userDob: Date, maxDob: Date}}
 */
export const checkMaximumDob = (userDob, maxDobStr) => {
    if (!userDob || !maxDobStr) {
        return { eligible: true, userDob: null, maxDob: null, skipped: true };
    }
    
    const maxDob = parseDateDDMMYYYY(maxDobStr);
    if (!maxDob) {
        return { eligible: true, userDob, maxDob: null, skipped: true };
    }
    
    // User's DOB must be on or after the maximum DOB
    // Example: maxDob = Jan 1, 2003
    // User born Jan 1, 2003 → eligible (born on cutoff)
    // User born Jan 2, 2003 → eligible (born after cutoff)
    // User born Dec 31, 2002 → NOT eligible (born before cutoff)
    return {
        eligible: userDob.getTime() >= maxDob.getTime(),
        userDob,
        maxDob,
        skipped: false
    };
};

// ============================================
// CRITERIA TYPE 6: BETWEEN DOB (DOB within range)
// DOB must fall between two dates (inclusive)
// Example: "02-01-2003 to 01-01-2008" means born between these dates
// ============================================

/**
 * Check if user's DOB falls between two dates (inclusive)
 * Used for NDA, CDS type exams
 * @param {Date} userDob - User's date of birth
 * @param {string} startDobStr - Start date in DD-MM-YYYY format (born on/after this)
 * @param {string} endDobStr - End date in DD-MM-YYYY format (born on/before this)
 * @returns {{eligible: boolean, userDob: Date, startDob: Date, endDob: Date}}
 */
export const checkBetweenDob = (userDob, startDobStr, endDobStr) => {
    if (!userDob) {
        return { eligible: false, userDob: null, startDob: null, endDob: null, skipped: true };
    }
    
    const startDob = parseDateDDMMYYYY(startDobStr);
    const endDob = parseDateDDMMYYYY(endDobStr);
    
    if (!startDob || !endDob) {
        return { eligible: true, userDob, startDob: null, endDob: null, skipped: true };
    }
    
    // User's DOB must be >= startDob AND <= endDob
    // Example: startDob = Jan 2, 2003, endDob = Jan 1, 2008
    // User born Jan 2, 2003 → eligible
    // User born Dec 15, 2005 → eligible
    // User born Jan 1, 2008 → eligible
    // User born Jan 1, 2003 → NOT eligible (before start)
    // User born Jan 2, 2008 → NOT eligible (after end)
    const userTime = userDob.getTime();
    return {
        eligible: userTime >= startDob.getTime() && userTime <= endDob.getTime(),
        userDob,
        startDob,
        endDob,
        skipped: false
    };
};

// ============================================
// LEGACY SUPPORT FUNCTIONS
// ============================================

/**
 * Legacy: Check minimum age (born before date)
 * @deprecated Use checkMinimumDob instead
 */
export const checkMinAge = (userDob, minDateStr) => {
    const result = checkMinimumDob(userDob, minDateStr);
    return result.eligible;
};

/**
 * Legacy: Check maximum age (born after date)
 * @deprecated Use checkMaximumDob instead
 */
export const checkMaxAge = (userDob, maxDateStr) => {
    const result = checkMaximumDob(userDob, maxDateStr);
    return result.eligible;
};

// ============================================
// HELPER: DETECT IF EXAM HAS AGE REQUIREMENT
// ============================================

/**
 * Check if exam has any age/DOB requirement
 * @param {Object} examData - Exam data (can be division-specific)
 * @returns {boolean}
 */
export const hasAgeRequirement = (examData) => {
    if (!examData) return false;
    
    const criteriaType = (examData.age_criteria_type || '').toUpperCase().replace(/\s+/g, '_').trim();
    
    // No age limit - normalize both "NO AGE LIMIT" and "NO_AGE_LIMIT"
    if (criteriaType === 'NO_AGE_LIMIT' || criteriaType === 'NOT_APPLICABLE') {
        return false;
    }
    
    // Check if any age/DOB field has value
    const ageFields = [
        'starting_age', 'ending_age', 'between_age',
        'minimum_dob', 'maximum_dob', 'between_dob'
    ];
    
    for (const field of ageFields) {
        const value = examData[field];
        if (value) {
            if (typeof value === 'string' && value.trim() !== '') return true;
            if (typeof value === 'object' && Object.keys(value).length > 0) return true;
        }
    }
    
    return false;
};

/**
 * Check if DOB field should be shown in form
 * @param {Object} examData - Exam data
 * @returns {boolean}
 */
export const shouldShowDobField = (examData) => {
    // DOB field should always be shown unless exam explicitly has NO_AGE_LIMIT
    if (!examData) return true;
    
    const criteriaType = (examData.age_criteria_type || '').toUpperCase().replace(/\s+/g, '_').trim();
    return criteriaType !== 'NO_AGE_LIMIT' && criteriaType !== 'NOT_APPLICABLE';
};

// ============================================
// MAIN CHECK FUNCTION
// ============================================

/**
 * Comprehensive age/DOB eligibility check
 * 
 * RULE: Check is based on age_criteria_type field:
 * - STARTING_AGE/MIN_AGE: Use starting_age field, calculate age
 * - ENDING_AGE/MAX_AGE: Use ending_age field, calculate age
 * - BETWEEN_AGE: Use between_age field, calculate age
 * - MINIMUM_DOB/MIN_DOB: Use minimum_dob field, compare dates
 * - MAXIMUM_DOB/MAX_DOB: Use maximum_dob field, compare dates
 * - BETWEEN_DOB: Use between_dob field, compare dates
 * - NO_AGE_LIMIT/NOT_APPLICABLE: Skip check, eligible
 * 
 * @param {string} userDobStr - User's date of birth in DD-MM-YYYY format
 * @param {Object} examData - Exam data containing age/DOB fields (division-specific data passed by frontend)
 * @param {string} examSession - Exam session like "2026", "2026-I", "NDA-II-2027"
 * @param {string} examCode - Exam code like "CDS", "NDA" (optional, helps with session matching)
 * @param {string} userCategory - User's caste category (GEN, OBC, SC, ST, EWS) for caste-wise DOB ranges
 * @returns {{eligible: boolean, userValue: string, examRequirement: string, field: string, reason: string, userAge: string, details: object}}
 */
export const checkDateOfBirth = (userDobStr, examData, examSession = null, examCode = null, userCategory = null) => {
    const field = 'Date of Birth';
    
    // ============================================
    // CASE 1: No exam data - no restriction
    // ============================================
    if (!examData) {
        return {
            field,
            userValue: userDobStr || 'Not specified',
            examRequirement: 'No age restriction',
            eligible: true,
            reason: 'No age/DOB criteria specified',
            userAge: 'N/A',
            details: null
        };
    }
    
    // ============================================
    // CASE 2: Get criteria type (normalize spaces to underscores)
    // ============================================
    const criteriaType = (examData.age_criteria_type || '').toUpperCase().replace(/\s+/g, '_').trim();
    
    // No age limit - automatically eligible (handles both "NO AGE LIMIT" and "NO_AGE_LIMIT")
    if (criteriaType === 'NO_AGE_LIMIT' || criteriaType === 'NOT_APPLICABLE' || criteriaType === '') {
        // Check if there's really no age data OR if no_age_limit field exists
        if (!hasAgeRequirement(examData) || examData.no_age_limit) {
            // Get session info if available
            const noAgeLimitValue = examData.no_age_limit ? 
                getValueForSession(examData.no_age_limit, examSession, examCode) : 'NO AGE LIMIT';
            
            return {
                field,
                userValue: userDobStr || 'Not specified',
                examRequirement: noAgeLimitValue || 'No age restriction',
                eligible: true,
                reason: 'No age limit for this exam',
                userAge: 'N/A',
                details: { criteriaType: 'NO_AGE_LIMIT', session: examSession }
            };
        }
    }
    
    // ============================================
    // CASE 3: User DOB not provided
    // ============================================
    if (!userDobStr || userDobStr.trim() === '') {
        return {
            field,
            userValue: 'Not specified',
            examRequirement: 'Date of birth required',
            eligible: false,
            reason: 'Please provide your date of birth',
            userAge: 'N/A',
            details: null
        };
    }
    
    // ============================================
    // CASE 4: Parse user DOB
    // ============================================
    const userDob = parseDateDDMMYYYY(userDobStr);
    
    if (!userDob) {
        return {
            field,
            userValue: userDobStr,
            examRequirement: 'Valid date required',
            eligible: false,
            reason: 'Invalid date format. Please use DD-MM-YYYY format',
            userAge: 'N/A',
            details: { error: 'Invalid date format' }
        };
    }
    
    // ============================================
    // CASE 5: Calculate user's current age
    // ============================================
    const referenceDate = examSession ? getExamReferenceDate(examSession) : new Date();
    const userAge = calculateAge(userDob, referenceDate);
    const userAgeStr = formatAge(userAge);
    const userDobFormatted = formatDateDDMMYYYY(userDob);
    
    // ============================================
    // CASE 6: Check based on criteria type
    // ============================================
    
    let result = null;
    let examRequirement = '';
    let reason = '';
    
    switch (criteriaType) {
        // ----------------------------------------
        // AGE-BASED CRITERIA (requires calculation)
        // ----------------------------------------
        
        case 'STARTING_AGE':
        case 'MIN_AGE': {
            const ageValue = getValueForSession(examData.starting_age, examSession, examCode);
            
            if (!ageValue) {
                return {
                    field,
                    userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                    examRequirement: 'No minimum age specified',
                    eligible: true,
                    reason: 'Minimum age not specified for selected session',
                    userAge: userAgeStr,
                    details: { age: userAge, criteriaType }
                };
            }
            
            const check = checkStartingAge(userDob, ageValue, referenceDate);
            examRequirement = `Minimum age: ${ageValue} years`;
            
            if (check.eligible) {
                reason = `Your age (${userAge.years} years) meets the minimum age requirement of ${ageValue} years`;
            } else {
                reason = `Your age (${userAge.years} years) is below the minimum age requirement of ${ageValue} years`;
            }
            
            result = {
                field,
                userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                examRequirement,
                eligible: check.eligible,
                reason,
                userAge: userAgeStr,
                details: {
                    age: userAge,
                    criteriaType,
                    check: { ...check, type: 'STARTING_AGE' }
                }
            };
            break;
        }
        
        case 'ENDING_AGE':
        case 'MAX_AGE': {
            // For MAX_AGE criteria (like NEET), check minimum_dob if ending_age is empty
            let ageValue = getValueForSession(examData.ending_age, examSession, examCode);
            
            // NEET uses minimum_dob with MAX_AGE criteria type
            if (!ageValue && examData.minimum_dob) {
                const minDobValue = getValueForSession(examData.minimum_dob, examSession, examCode);
                
                if (minDobValue) {
                    const check = checkMinimumDob(userDob, minDobValue);
                    examRequirement = `Born on or before: ${minDobValue}`;
                    
                    if (check.eligible) {
                        reason = `Your date of birth (${userDobFormatted}) is on or before ${minDobValue}`;
                    } else {
                        reason = `Your date of birth (${userDobFormatted}) is after ${minDobValue}. You must be born on or before ${minDobValue}`;
                    }
                    
                    result = {
                        field,
                        userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                        examRequirement,
                        eligible: check.eligible,
                        reason,
                        userAge: userAgeStr,
                        details: {
                            age: userAge,
                            criteriaType,
                            check: { ...check, type: 'MINIMUM_DOB' }
                        }
                    };
                    break;
                }
            }
            
            if (!ageValue) {
                return {
                    field,
                    userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                    examRequirement: 'No maximum age specified',
                    eligible: true,
                    reason: 'Maximum age not specified for selected session',
                    userAge: userAgeStr,
                    details: { age: userAge, criteriaType }
                };
            }
            
            const check = checkEndingAge(userDob, ageValue, referenceDate);
            examRequirement = `Maximum age: ${ageValue} years`;
            
            if (check.eligible) {
                reason = `Your age (${userAge.years} years) is within the maximum age limit of ${ageValue} years`;
            } else {
                reason = `Your age (${userAge.years} years) exceeds the maximum age limit of ${ageValue} years`;
            }
            
            result = {
                field,
                userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                examRequirement,
                eligible: check.eligible,
                reason,
                userAge: userAgeStr,
                details: {
                    age: userAge,
                    criteriaType,
                    check: { ...check, type: 'ENDING_AGE' }
                }
            };
            break;
        }
        
        case 'BETWEEN_AGE': {
            // Check between_age first, then between_dob as fallback
            let betweenAgeValue = getValueForSession(examData.between_age, examSession, examCode);
            
            // If between_age is empty but between_dob has value, use DOB check
            if (!betweenAgeValue && examData.between_dob) {
                const resolvedDob = resolveCasteWiseDob(examData.between_dob, userCategory);
                const betweenDobValue = getValueForSession(resolvedDob, examSession, examCode);
                
                if (betweenDobValue) {
                    const parsed = parseDobRange(betweenDobValue);
                    
                    if (parsed) {
                        const check = checkBetweenDob(userDob, parsed.startDob, parsed.endDob);
                        examRequirement = `DOB between: ${parsed.startDob} to ${parsed.endDob}`;
                        
                        if (check.eligible) {
                            reason = `Your date of birth (${userDobFormatted}) falls within the eligible range`;
                        } else {
                            if (userDob < check.startDob) {
                                reason = `Your date of birth (${userDobFormatted}) is before the eligible range. You must be born on or after ${parsed.startDob}`;
                            } else {
                                reason = `Your date of birth (${userDobFormatted}) is after the eligible range. You must be born on or before ${parsed.endDob}`;
                            }
                        }
                        
                        result = {
                            field,
                            userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                            examRequirement,
                            eligible: check.eligible,
                            reason,
                            userAge: userAgeStr,
                            details: {
                                age: userAge,
                                criteriaType,
                                check: { ...check, type: 'BETWEEN_DOB' }
                            }
                        };
                        break;
                    }
                }
            }
            
            if (!betweenAgeValue) {
                return {
                    field,
                    userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                    examRequirement: 'No age range specified',
                    eligible: true,
                    reason: 'Age range not specified for selected session',
                    userAge: userAgeStr,
                    details: { age: userAge, criteriaType }
                };
            }
            
            // Parse the age range
            const parsed = parseAgeRange(betweenAgeValue);
            
            if (!parsed) {
                return {
                    field,
                    userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                    examRequirement: `Age range: ${betweenAgeValue}`,
                    eligible: true,
                    reason: 'Could not parse age range format',
                    userAge: userAgeStr,
                    details: { age: userAge, criteriaType, rawValue: betweenAgeValue }
                };
            }
            
            const check = checkBetweenAge(userDob, parsed.minAge, parsed.maxAge, referenceDate);
            examRequirement = `Age: ${parsed.minAge} to ${parsed.maxAge} years`;
            
            if (check.eligible) {
                reason = `Your age (${userAge.years} years) is within the eligible range of ${parsed.minAge} to ${parsed.maxAge} years`;
            } else {
                if (userAge.years < parsed.minAge) {
                    reason = `Your age (${userAge.years} years) is below the minimum age of ${parsed.minAge} years`;
                } else {
                    reason = `Your age (${userAge.years} years) exceeds the maximum age of ${parsed.maxAge} years`;
                }
            }
            
            result = {
                field,
                userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                examRequirement,
                eligible: check.eligible,
                reason,
                userAge: userAgeStr,
                details: {
                    age: userAge,
                    criteriaType,
                    check: { ...check, type: 'BETWEEN_AGE' }
                }
            };
            break;
        }
        
        // ----------------------------------------
        // DOB-BASED CRITERIA (direct comparison)
        // ----------------------------------------
        
        case 'MINIMUM_DOB':
        case 'MIN_DOB': {
            const minDobValue = getValueForSession(examData.minimum_dob, examSession, examCode);
            
            if (!minDobValue) {
                return {
                    field,
                    userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                    examRequirement: 'No minimum DOB specified',
                    eligible: true,
                    reason: 'Minimum DOB not specified for selected session',
                    userAge: userAgeStr,
                    details: { age: userAge, criteriaType }
                };
            }
            
            const check = checkMinimumDob(userDob, minDobValue);
            examRequirement = `Born on or before: ${minDobValue}`;
            
            if (check.eligible) {
                reason = `Your date of birth (${userDobFormatted}) is on or before ${minDobValue}`;
            } else {
                reason = `Your date of birth (${userDobFormatted}) is after ${minDobValue}. You must be born on or before ${minDobValue}`;
            }
            
            result = {
                field,
                userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                examRequirement,
                eligible: check.eligible,
                reason,
                userAge: userAgeStr,
                details: {
                    age: userAge,
                    criteriaType,
                    check: { ...check, type: 'MINIMUM_DOB' }
                }
            };
            break;
        }
        
        case 'MAXIMUM_DOB':
        case 'MAX_DOB': {
            const maxDobValue = getValueForSession(examData.maximum_dob, examSession, examCode);
            
            if (!maxDobValue) {
                return {
                    field,
                    userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                    examRequirement: 'No maximum DOB specified',
                    eligible: true,
                    reason: 'Maximum DOB not specified for selected session',
                    userAge: userAgeStr,
                    details: { age: userAge, criteriaType }
                };
            }
            
            const check = checkMaximumDob(userDob, maxDobValue);
            examRequirement = `Born on or after: ${maxDobValue}`;
            
            if (check.eligible) {
                reason = `Your date of birth (${userDobFormatted}) is on or after ${maxDobValue}`;
            } else {
                reason = `Your date of birth (${userDobFormatted}) is before ${maxDobValue}. You must be born on or after ${maxDobValue}`;
            }
            
            result = {
                field,
                userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                examRequirement,
                eligible: check.eligible,
                reason,
                userAge: userAgeStr,
                details: {
                    age: userAge,
                    criteriaType,
                    check: { ...check, type: 'MAXIMUM_DOB' }
                }
            };
            break;
        }
        
        case 'BETWEEN_DOB': {
            const resolvedDobData = resolveCasteWiseDob(examData.between_dob, userCategory);
            const betweenDobValue = getValueForSession(resolvedDobData, examSession, examCode);
            
            if (!betweenDobValue) {
                return {
                    field,
                    userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                    examRequirement: 'No DOB range specified',
                    eligible: true,
                    reason: 'DOB range not specified for selected session',
                    userAge: userAgeStr,
                    details: { age: userAge, criteriaType }
                };
            }
            
            // Parse the DOB range
            const parsed = parseDobRange(betweenDobValue);
            
            if (!parsed) {
                return {
                    field,
                    userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                    examRequirement: `DOB range: ${betweenDobValue}`,
                    eligible: true,
                    reason: 'Could not parse DOB range format',
                    userAge: userAgeStr,
                    details: { age: userAge, criteriaType, rawValue: betweenDobValue }
                };
            }
            
            const check = checkBetweenDob(userDob, parsed.startDob, parsed.endDob);
            examRequirement = `DOB between: ${parsed.startDob} to ${parsed.endDob}`;
            
            if (check.eligible) {
                reason = `Your date of birth (${userDobFormatted}) falls within the eligible range`;
            } else {
                if (check.startDob && userDob < check.startDob) {
                    reason = `Your date of birth (${userDobFormatted}) is before the eligible range. You must be born on or after ${parsed.startDob}`;
                } else {
                    reason = `Your date of birth (${userDobFormatted}) is after the eligible range. You must be born on or before ${parsed.endDob}`;
                }
            }
            
            result = {
                field,
                userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                examRequirement,
                eligible: check.eligible,
                reason,
                userAge: userAgeStr,
                details: {
                    age: userAge,
                    criteriaType,
                    check: { ...check, type: 'BETWEEN_DOB' }
                }
            };
            break;
        }
        
        // ----------------------------------------
        // FALLBACK: Try to detect criteria from data
        // ----------------------------------------
        default: {
            // Try all criteria types based on which fields have data
            
            // Try between_dob first (most specific)
            if (examData.between_dob) {
                const resolvedDobFallback = resolveCasteWiseDob(examData.between_dob, userCategory);
                const betweenDobValue = getValueForSession(resolvedDobFallback, examSession, examCode);
                if (betweenDobValue) {
                    const parsed = parseDobRange(betweenDobValue);
                    if (parsed) {
                        const check = checkBetweenDob(userDob, parsed.startDob, parsed.endDob);
                        examRequirement = `DOB between: ${parsed.startDob} to ${parsed.endDob}`;
                        
                        if (check.eligible) {
                            reason = `Your date of birth (${userDobFormatted}) falls within the eligible range`;
                        } else {
                            if (check.startDob && userDob < check.startDob) {
                                reason = `Your date of birth (${userDobFormatted}) is before the eligible range`;
                            } else {
                                reason = `Your date of birth (${userDobFormatted}) is after the eligible range`;
                            }
                        }
                        
                        result = {
                            field,
                            userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                            examRequirement,
                            eligible: check.eligible,
                            reason,
                            userAge: userAgeStr,
                            details: { age: userAge, criteriaType: 'BETWEEN_DOB (auto-detected)', check }
                        };
                        break;
                    }
                }
            }
            
            // Try minimum_dob
            if (examData.minimum_dob) {
                const minDobValue = getValueForSession(examData.minimum_dob, examSession, examCode);
                if (minDobValue) {
                    const check = checkMinimumDob(userDob, minDobValue);
                    examRequirement = `Born on or before: ${minDobValue}`;
                    
                    if (check.eligible) {
                        reason = `Your date of birth (${userDobFormatted}) is on or before ${minDobValue}`;
                    } else {
                        reason = `Your date of birth (${userDobFormatted}) is after ${minDobValue}`;
                    }
                    
                    result = {
                        field,
                        userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                        examRequirement,
                        eligible: check.eligible,
                        reason,
                        userAge: userAgeStr,
                        details: { age: userAge, criteriaType: 'MINIMUM_DOB (auto-detected)', check }
                    };
                    break;
                }
            }
            
            // Try maximum_dob
            if (examData.maximum_dob) {
                const maxDobValue = getValueForSession(examData.maximum_dob, examSession, examCode);
                if (maxDobValue) {
                    const check = checkMaximumDob(userDob, maxDobValue);
                    examRequirement = `Born on or after: ${maxDobValue}`;
                    
                    if (check.eligible) {
                        reason = `Your date of birth (${userDobFormatted}) is on or after ${maxDobValue}`;
                    } else {
                        reason = `Your date of birth (${userDobFormatted}) is before ${maxDobValue}`;
                    }
                    
                    result = {
                        field,
                        userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                        examRequirement,
                        eligible: check.eligible,
                        reason,
                        userAge: userAgeStr,
                        details: { age: userAge, criteriaType: 'MAXIMUM_DOB (auto-detected)', check }
                    };
                    break;
                }
            }
            
            // Try between_age
            if (examData.between_age) {
                const betweenAgeValue = getValueForSession(examData.between_age, examSession, examCode);
                if (betweenAgeValue) {
                    const parsed = parseAgeRange(betweenAgeValue);
                    if (parsed) {
                        const check = checkBetweenAge(userDob, parsed.minAge, parsed.maxAge, referenceDate);
                        examRequirement = `Age: ${parsed.minAge} to ${parsed.maxAge} years`;
                        
                        if (check.eligible) {
                            reason = `Your age (${userAge.years} years) is within the eligible range`;
                        } else {
                            reason = `Your age (${userAge.years} years) is outside the eligible range`;
                        }
                        
                        result = {
                            field,
                            userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                            examRequirement,
                            eligible: check.eligible,
                            reason,
                            userAge: userAgeStr,
                            details: { age: userAge, criteriaType: 'BETWEEN_AGE (auto-detected)', check }
                        };
                        break;
                    }
                }
            }
            
            // Try starting_age
            if (examData.starting_age) {
                const ageValue = getValueForSession(examData.starting_age, examSession, examCode);
                if (ageValue) {
                    const check = checkStartingAge(userDob, ageValue, referenceDate);
                    examRequirement = `Minimum age: ${ageValue} years`;
                    
                    if (check.eligible) {
                        reason = `Your age (${userAge.years} years) meets the minimum age requirement`;
                    } else {
                        reason = `Your age (${userAge.years} years) is below the minimum age requirement`;
                    }
                    
                    result = {
                        field,
                        userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                        examRequirement,
                        eligible: check.eligible,
                        reason,
                        userAge: userAgeStr,
                        details: { age: userAge, criteriaType: 'STARTING_AGE (auto-detected)', check }
                    };
                    break;
                }
            }
            
            // Try ending_age
            if (examData.ending_age) {
                const ageValue = getValueForSession(examData.ending_age, examSession, examCode);
                if (ageValue) {
                    const check = checkEndingAge(userDob, ageValue, referenceDate);
                    examRequirement = `Maximum age: ${ageValue} years`;
                    
                    if (check.eligible) {
                        reason = `Your age (${userAge.years} years) is within the maximum age limit`;
                    } else {
                        reason = `Your age (${userAge.years} years) exceeds the maximum age limit`;
                    }
                    
                    result = {
                        field,
                        userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                        examRequirement,
                        eligible: check.eligible,
                        reason,
                        userAge: userAgeStr,
                        details: { age: userAge, criteriaType: 'ENDING_AGE (auto-detected)', check }
                    };
                    break;
                }
            }
            
            // No criteria found
            result = {
                field,
                userValue: `DOB: ${userDobFormatted} (Age: ${userAgeStr})`,
                examRequirement: 'No age restriction',
                eligible: true,
                reason: 'No age/DOB criteria found for this exam',
                userAge: userAgeStr,
                details: { age: userAge, criteriaType: 'NONE' }
            };
        }
    }
    
    return result;
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
    // Constants
    AGE_CRITERIA_TYPES,
    
    // Date parsing & formatting
    parseDateDDMMYYYY,
    formatDateDDMMYYYY,
    
    // Age calculation
    calculateAge,
    formatAge,
    
    // Session handling
    getExamReferenceDate,
    getExamSessions,
    extractYearFromSession,
    getValueForSession,
    resolveCasteWiseDob,
    
    // Parsing helpers
    parseAgeRange,
    parseDobRange,
    
    // Individual check functions
    checkStartingAge,
    checkEndingAge,
    checkBetweenAge,
    checkMinimumDob,
    checkMaximumDob,
    checkBetweenDob,
    
    // Legacy support
    checkMinAge,
    checkMaxAge,
    
    // Helper functions
    hasAgeRequirement,
    shouldShowDobField,
    
    // Main check function
    checkDateOfBirth
};
