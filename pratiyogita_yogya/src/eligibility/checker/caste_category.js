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

import { getCachedCasteCategories, loadEligibilityFieldsFromMongo } from '../examDataLoader.js';

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
 * Dynamically match user caste against exam requirement code
 * Supports both short codes ("GEN", "UR", "SC", "ST", "OBC", "EWS")
 * and full names ("GENERAL (UR/UNRESERVED)", "SC (SCHEDULED CASTE)", etc.)
 * without hardcoded static dictionaries.
 */
const matchesCasteCategory = (userCaste, examCode) => {
    const u = normalizeValue(userCaste);
    const e = normalizeValue(examCode);
    if (!u || !e) return false;
    if (u === e) return true;

    // Check prefix before parenthesis
    const parenIdx = u.indexOf('(');
    const prefix = (parenIdx !== -1 ? u.slice(0, parenIdx) : u).trim();
    if (prefix === e || prefix.startsWith(e) || e.startsWith(prefix)) return true;

    // Check inside parenthesis if present (e.g. "UR/UNRESERVED", "SCHEDULED CASTE")
    if (parenIdx !== -1) {
        const parenEnd = u.indexOf(')', parenIdx);
        const insideParen = (parenEnd !== -1 ? u.slice(parenIdx + 1, parenEnd) : u.slice(parenIdx + 1)).trim();
        if (insideParen === e || insideParen.startsWith(e) || e.startsWith(insideParen)) return true;

        const tokens = insideParen.split(/[\/\s,]+/).map(t => t.trim()).filter(Boolean);
        if (tokens.some(t => t === e || t.startsWith(e) || e.startsWith(t))) return true;
    }

    return false;
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
    
    // Check if user's input matches any allowed code dynamically
    const isEligible = allowedShortCodes.some(allowedCode => matchesCasteCategory(normalizedUserCaste, allowedCode));
    
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
 * Deprecated: Caste category options are loaded dynamically from MongoDB via getCasteCategoryOptionsFromMongo()
 * @returns {Array} - Empty array (options must be loaded from MongoDB)
 */
export const getCasteCategoryOptions = () => {
    return [];
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
 * Get standard caste categories (full names) from MongoDB
 * @returns {Promise<string[]>} - Array of standard caste category full names
 */
export const getStandardCategories = async () => {
    const cached = getCachedCasteCategories();
    if (cached && cached.length > 0) return cached;
    const mongoData = await loadEligibilityFieldsFromMongo();
    return Array.isArray(mongoData?.caste_category) ? mongoData.caste_category : [];
};

export default {
    checkCasteCategory,
    getCasteCategoryOptions,
    shouldShowCasteCategoryField,
    getStandardCategories
};
