/**
 * Completion Status Eligibility Checker
 * 
 * This module checks if user's education completion status (PASSED, APPEARING, year/semester)
 * is eligible for a specific exam based on exam JSON and edu_final.json requirements.
 * 
 * STATUS FORMAT IN EXAM JSON:
 * 1. Object with options: { "status": { "options": ["PASSED", "APPEARING"] } }
 * 2. String: { "status": "PASSED" }
 * 3. String with multiple: { "status": "PASSED / APPEARING" }
 * 4. Empty string: { "status": "" } - means no restriction
 * 
 * STATUS FORMAT IN edu_final.json:
 * Course-specific array: { "status": { "BTech": ["PASSED", "(4TH YEAR)", "8th Sem"] } }
 */

// ============================================
// STANDARD COMPLETION STATUS VALUES
// ============================================

/**
 * All valid completion status values
 */
export const COMPLETION_STATUS_VALUES = [
    // Basic statuses
    'PASSED',
    'APPEARING',
    // Year-wise (for multi-year courses)
    '(6TH YEAR)',
    '(5TH YEAR)',
    '(4TH YEAR)',
    '(3RD YEAR)',
    '(2ND YEAR)',
    '(1ST YEAR)',
    // Semester-wise
    '12th Sem',
    '11th Sem',
    '10th Sem',
    '9th Sem',
    '8th Sem',
    '7th Sem',
    '6th Sem',
    '5th Sem',
    '4th Sem',
    '3rd Sem',
    '2nd Sem',
    '1st Sem'
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Normalize status value for comparison
 * @param {string} value - Status value
 * @returns {string} - Normalized value
 */
const normalizeStatus = (value) => {
    if (!value || typeof value !== 'string') return '';
    return value.toUpperCase().trim();
};

/**
 * Parse status data from exam JSON
 * Handles multiple formats:
 * 1. { options: ["PASSED", "APPEARING"] }
 * 2. "PASSED"
 * 3. "PASSED / APPEARING"
 * 4. ["PASSED", "APPEARING"]
 * 5. "" (empty - all allowed)
 * 
 * @param {Object|string|string[]} statusData - Status data from exam JSON
 * @returns {string[]} - Array of allowed statuses
 */
export const parseStatusData = (statusData) => {
    if (!statusData) return [];
    
    // Handle object with options
    if (typeof statusData === 'object' && !Array.isArray(statusData)) {
        if (statusData.options && Array.isArray(statusData.options)) {
            return statusData.options.map(s => normalizeStatus(s)).filter(s => s);
        }
        return [];
    }
    
    // Handle array
    if (Array.isArray(statusData)) {
        return statusData.map(s => normalizeStatus(s)).filter(s => s);
    }
    
    // Handle string
    if (typeof statusData === 'string') {
        const upper = statusData.toUpperCase().trim();
        
        // Handle "ALL" or empty string - no restrictions
        if (upper === '' || upper === 'ALL' || upper === 'ALL APPLICABLE' || upper === 'NOT APPLICABLE') {
            return [];
        }
        
        // Handle "PASSED / APPEARING" format
        if (upper.includes('/')) {
            return upper.split('/').map(s => s.trim()).filter(s => s);
        }
        
        // Handle comma-separated
        if (upper.includes(',')) {
            return upper.split(',').map(s => s.trim()).filter(s => s);
        }
        
        // Single value
        return [upper];
    }
    
    return [];
};

/**
 * Check if all statuses are eligible (no restriction)
 * @param {Object|string|string[]} statusData - Status data from exam
 * @returns {boolean}
 */
export const isAllStatusesEligible = (statusData) => {
    if (!statusData) return true;
    if (statusData === '') return true;
    
    if (typeof statusData === 'string') {
        const upper = statusData.toUpperCase().trim();
        return upper === '' || upper === 'ALL' || upper === 'ALL APPLICABLE' || upper === 'NOT APPLICABLE';
    }
    
    if (typeof statusData === 'object' && !Array.isArray(statusData)) {
        if (statusData.options) {
            if (!Array.isArray(statusData.options) || statusData.options.length === 0) {
                return true;
            }
        } else {
            return true;
        }
    }
    
    return false;
};

/**
 * Map user status to check if it qualifies as a more advanced status
 * For example, "PASSED" includes all appearing statuses
 * "(4TH YEAR)" includes "(3RD YEAR)", "(2ND YEAR)", "(1ST YEAR)"
 * 
 * @param {string} userStatus - User's status
 * @param {string} examAllowedStatus - Exam's allowed status
 * @returns {boolean} - True if user status qualifies
 */
const statusQualifies = (userStatus, examAllowedStatus) => {
    const userUpper = normalizeStatus(userStatus);
    const examUpper = normalizeStatus(examAllowedStatus);
    
    // Direct match
    if (userUpper === examUpper) return true;
    
    // PASSED qualifies for everything
    if (userUpper === 'PASSED') return true;
    
    // If exam allows APPEARING, check if user's status indicates appearing
    if (examUpper === 'APPEARING') {
        const appearingStatuses = [
            'APPEARING',
            '(6TH YEAR)', '(5TH YEAR)', '(4TH YEAR)', '(3RD YEAR)', '(2ND YEAR)', '(1ST YEAR)',
            '12TH SEM', '11TH SEM', '10TH SEM', '9TH SEM', '8TH SEM', '7TH SEM',
            '6TH SEM', '5TH SEM', '4TH SEM', '3RD SEM', '2ND SEM', '1ST SEM'
        ];
        return appearingStatuses.includes(userUpper);
    }
    
    // Year/Semester hierarchy check
    // If exam requires "(3RD YEAR)" minimum, "(4TH YEAR)" and above also qualify
    const yearOrder = ['(1ST YEAR)', '(2ND YEAR)', '(3RD YEAR)', '(4TH YEAR)', '(5TH YEAR)', '(6TH YEAR)', 'PASSED'];
    const semOrder = ['1ST SEM', '2ND SEM', '3RD SEM', '4TH SEM', '5TH SEM', '6TH SEM', 
                      '7TH SEM', '8TH SEM', '9TH SEM', '10TH SEM', '11TH SEM', '12TH SEM', 'PASSED'];
    
    const userYearIdx = yearOrder.indexOf(userUpper);
    const examYearIdx = yearOrder.indexOf(examUpper);
    if (userYearIdx >= 0 && examYearIdx >= 0) {
        return userYearIdx >= examYearIdx;
    }
    
    const userSemIdx = semOrder.indexOf(userUpper);
    const examSemIdx = semOrder.indexOf(examUpper);
    if (userSemIdx >= 0 && examSemIdx >= 0) {
        return userSemIdx >= examSemIdx;
    }
    
    return false;
};

// ============================================
// MAIN CHECKER FUNCTION
// ============================================

/**
 * Check completion status eligibility
 * 
 * @param {string} userStatus - User's completion status (e.g., "PASSED", "(2ND YEAR)", "4th Sem")
 * @param {Object|string|string[]} examStatusData - Exam's status requirement from JSON
 * @param {string} levelKey - Education level (e.g., "graduation", "12th_higher_secondary")
 * @returns {Object} - {field, eligible, reason, userValue, examRequirement, details}
 * 
 * @example
 * // Example 1: NDA - allows PASSED or APPEARING
 * checkCompletionStatus("PASSED", { options: ["PASSED", "APPEARING"] }, "12th_higher_secondary")
 * // Returns: { eligible: true, reason: "Your completion status meets requirements" }
 * 
 * @example
 * // Example 2: GATE - requires PASSED or final year only
 * checkCompletionStatus("(2ND YEAR)", { options: ["PASSED", "(4TH YEAR)"] }, "graduation")
 * // Returns: { eligible: false, reason: "You are in 2ND YEAR, but exam requires PASSED or 4TH YEAR minimum" }
 * 
 * @example
 * // Example 3: SSC CGL - requires PASSED only
 * checkCompletionStatus("APPEARING", "PASSED", "graduation")
 * // Returns: { eligible: false, reason: "Exam requires PASSED but you are APPEARING" }
 */
export const checkCompletionStatus = (userStatus, examStatusData, levelKey = '') => {
    const field = 'Completion Status';
    const levelName = getLevelDisplayName(levelKey);
    
    // If no user status provided
    if (!userStatus) {
        return {
            field,
            userValue: 'Not specified',
            examRequirement: formatExamRequirement(examStatusData),
            eligible: false,
            reason: `Please specify your ${levelName} completion status`
        };
    }
    
    const normalizedUserStatus = normalizeStatus(userStatus);
    
    // If exam has no restriction (empty or "ALL")
    if (isAllStatusesEligible(examStatusData)) {
        return {
            field,
            userValue: userStatus,
            examRequirement: 'No restriction',
            eligible: true,
            reason: `No completion status restriction for ${levelName}`
        };
    }
    
    // Parse allowed statuses from exam data
    const allowedStatuses = parseStatusData(examStatusData);
    
    if (allowedStatuses.length === 0) {
        return {
            field,
            userValue: userStatus,
            examRequirement: 'No restriction',
            eligible: true,
            reason: `No completion status restriction for ${levelName}`
        };
    }
    
    // Check if user's status qualifies for any allowed status
    for (const allowedStatus of allowedStatuses) {
        if (statusQualifies(userStatus, allowedStatus)) {
            return {
                field,
                userValue: userStatus,
                examRequirement: allowedStatuses.join(' / '),
                eligible: true,
                reason: `Your status "${userStatus}" meets the ${levelName} requirement`
            };
        }
    }
    
    // Not eligible
    return {
        field,
        userValue: userStatus,
        examRequirement: allowedStatuses.join(' / '),
        eligible: false,
        reason: `Your status "${userStatus}" does not meet requirements. Exam requires: ${allowedStatuses.join(' or ')}`
    };
};

// ============================================
// HELPER FORMATTERS
// ============================================

/**
 * Get display name for education level
 * @param {string} levelKey - Education level key
 * @returns {string} - Display name
 */
const getLevelDisplayName = (levelKey) => {
    const names = {
        'post_doctorate': 'Post Doctorate',
        'phd': 'PhD',
        'post_graduation': 'Post Graduation',
        'graduation': 'Graduation',
        'diploma': 'Diploma/ITI',
        '12th_higher_secondary': '12th (Higher Secondary)',
        '10th_secondary': '10th (Secondary)',
        '8th_class': '8th Class',
        '5th_class': '5th Class'
    };
    return names[levelKey] || levelKey || 'Education';
};

/**
 * Format exam requirement for display
 * @param {Object|string|string[]} examStatusData - Exam status data
 * @returns {string} - Formatted string
 */
const formatExamRequirement = (examStatusData) => {
    if (!examStatusData) return 'No restriction';
    
    const statuses = parseStatusData(examStatusData);
    if (statuses.length === 0) return 'No restriction';
    
    return statuses.join(' / ');
};

// ============================================
// DIVISION-BASED CHECKER
// ============================================

/**
 * Check completion status for exam with divisions (academies/posts)
 * 
 * @param {string} userStatus - User's completion status
 * @param {Object} examData - Full exam data object
 * @param {string} levelKey - Education level key
 * @returns {Object} - Check result with division details
 */
export const checkCompletionStatusWithDivisions = (userStatus, examData, levelKey = 'graduation') => {
    const field = 'Completion Status';
    
    if (!examData) {
        return {
            field,
            userValue: userStatus || 'Not specified',
            examRequirement: 'Exam data not available',
            eligible: false,
            reason: 'Exam data not found'
        };
    }
    
    // Check for division fields
    const divisionFields = ['academies', 'posts', 'departments', 'courses', 'classes'];
    let hasDivisions = false;
    let divisionsData = null;
    let divisionFieldName = '';
    
    for (const divField of divisionFields) {
        if (examData[divField] && typeof examData[divField] === 'object' && Object.keys(examData[divField]).length > 0) {
            hasDivisions = true;
            divisionsData = examData[divField];
            divisionFieldName = divField;
            break;
        }
    }
    
    if (!hasDivisions) {
        // Non-division exam - check root level education_levels
        const statusData = examData.education_levels?.[levelKey]?.status;
        return checkCompletionStatus(userStatus, statusData, levelKey);
    }
    
    // Division-based exam
    const divisionResults = {};
    const eligibleDivisions = [];
    const ineligibleDivisions = [];
    
    for (const [divName, divData] of Object.entries(divisionsData)) {
        const statusData = divData?.education_levels?.[levelKey]?.status;
        const result = checkCompletionStatus(userStatus, statusData, levelKey);
        
        divisionResults[divName] = result;
        
        if (result.eligible) {
            eligibleDivisions.push(divName);
        } else {
            ineligibleDivisions.push(divName);
        }
    }
    
    const totalDivisions = Object.keys(divisionsData).length;
    const allEligible = ineligibleDivisions.length === 0;
    const noneEligible = eligibleDivisions.length === 0;
    
    return {
        field,
        userValue: userStatus || 'Not specified',
        examRequirement: 'Varies by division',
        eligible: !noneEligible,
        reason: allEligible 
            ? `Eligible for all ${totalDivisions} divisions`
            : noneEligible
            ? `Not eligible for any division (${ineligibleDivisions.join(', ')})`
            : `Eligible for ${eligibleDivisions.length}/${totalDivisions} divisions`,
        details: {
            divisionField: divisionFieldName,
            totalDivisions,
            eligibleDivisions,
            ineligibleDivisions,
            divisionResults
        }
    };
};

// ============================================
// EXPORTS
// ============================================

export default {
    checkCompletionStatus,
    checkCompletionStatusWithDivisions,
    parseStatusData,
    isAllStatusesEligible,
    COMPLETION_STATUS_VALUES
};
