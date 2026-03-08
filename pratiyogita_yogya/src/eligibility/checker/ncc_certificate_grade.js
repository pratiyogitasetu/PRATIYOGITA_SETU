/**
 * NCC Certificate Grade Eligibility Checker
 * 
 * Handles the certificate-specific object format with arrays:
 * {
 *   "C CERTIFICATE": ["A", "B"],
 *   "B CERTIFICATE": ["A", "B"],
 *   "A CERTIFICATE": ["A", "B", "C"]
 * }
 * 
 * Similar to how marital_status depends on gender,
 * ncc_certificate_grade depends on ncc_certificate.
 * 
 * Standard Values:
 * - "" or missing: No restriction → everyone passes
 * - "NOT APPLICABLE": Grade not required
 * - "ALL APPLICABLE": Any grade accepted
 * - Object with certificate keys containing arrays of allowed grades
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
 * Normalize key for loose matching (removes spaces, special chars)
 * @param {string} value - Value to normalize
 * @returns {string} - Normalized key
 */
const normalizeKeyLoose = (value) => {
    if (!value) return '';
    return value.toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
};

/**
 * Check if ncc_certificate_grade is in object format (certificate-based)
 * @param {*} value - The ncc_certificate_grade value
 * @returns {boolean}
 */
const isObjectFormat = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    const keys = Object.keys(value).map(k => k.toUpperCase());
    return keys.some(k => k.includes('CERTIFICATE'));
};

/**
 * Get allowed grades array for a specific NCC certificate
 * @param {Object} nccGradeObj - { "C CERTIFICATE": ["A", "B"], ... }
 * @param {string} userNccCertificate - User's NCC certificate (could be "C", "C CERTIFICATE", etc.)
 * @returns {string[]} - Array of allowed grades for that certificate
 */
const getAllowedGradesForCertificate = (nccGradeObj, userNccCertificate) => {
    if (!userNccCertificate) return [];
    
    const normalizedUserCert = normalizeKeyLoose(userNccCertificate);
    
    // Extract just the letter (A, B, C) from user's certificate for flexible matching
    const userCertLetter = userNccCertificate.toUpperCase().trim().charAt(0);
    
    for (const [key, value] of Object.entries(nccGradeObj)) {
        const normalizedKey = normalizeKeyLoose(key);
        const keyLetter = key.toUpperCase().trim().charAt(0);
        
        // Match if:
        // 1. Exact normalized match (CCERTIFICATE === CCERTIFICATE)
        // 2. User's full normalized matches key's start (C matches CCERTIFICATE)
        // 3. First letter matches (for "C" vs "C CERTIFICATE")
        if (normalizedKey === normalizedUserCert || 
            normalizedKey.startsWith(normalizedUserCert) ||
            normalizedUserCert.startsWith(normalizedKey) ||
            keyLetter === userCertLetter) {
            // Value should be an array
            if (Array.isArray(value)) {
                return value.map(v => normalizeValue(v));
            }
            // Backward compatibility: if string, split by comma
            if (typeof value === 'string') {
                return value.split(',').map(v => normalizeValue(v).trim()).filter(v => v !== '');
            }
            return [];
        }
    }
    
    // No rule for this certificate = not eligible
    return [];
};

/**
 * Check if value indicates no restriction
 * @param {*} value - Value to check
 * @returns {boolean}
 */
const isNoRestriction = (value) => {
    if (!value || value === '') return true;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return true;
    
    const normalized = normalizeValue(String(value));
    return normalized === 'NOT APPLICABLE' || 
           normalized === 'NA' || 
           normalized === 'NOT REQUIRED' ||
           normalized === 'NONE' ||
           normalized === '';
};

/**
 * Check if value indicates all grades are accepted
 * @param {*} value - Value to check
 * @returns {boolean}
 */
const isAllAccepted = (value) => {
    const normalized = normalizeValue(String(value));
    return normalized === 'ALL APPLICABLE' || 
           normalized === 'ALL' || 
           normalized === 'ANY' ||
           normalized === 'ALL GRADES';
};

/**
 * Check NCC certificate grade eligibility (single check)
 * @param {string} userNccGrade - User's NCC grade (A, B, C, D)
 * @param {string|Object} examNccGrade - Exam's required NCC grade(s)
 * @param {string} userNccCertificate - User's NCC certificate (A CERTIFICATE, B CERTIFICATE, C CERTIFICATE)
 * @returns {{eligible: boolean, userValue: string, examRequirement: string, field: string, reason: string}}
 */
export const checkNccCertificateGrade = (userNccGrade, examNccGrade, userNccCertificate) => {
    const field = 'NCC Certificate Grade';
    
    // No restriction - Grade not required
    if (isNoRestriction(examNccGrade)) {
        return {
            field,
            userValue: userNccGrade || 'Not specified',
            examRequirement: examNccGrade || 'Not Required',
            eligible: true,
            reason: 'NCC grade not required for this exam'
        };
    }
    
    // All grades accepted
    if (isAllAccepted(examNccGrade)) {
        if (!userNccGrade || normalizeValue(userNccGrade) === '') {
            return {
                field,
                userValue: userNccGrade || 'Not specified',
                examRequirement: 'Any Grade',
                eligible: false,
                reason: 'NCC grade is required but not provided'
            };
        }
        return {
            field,
            userValue: userNccGrade,
            examRequirement: 'Any Grade',
            eligible: true,
            reason: 'Any NCC grade is accepted'
        };
    }
    
    // Object format - certificate-based grades
    if (isObjectFormat(examNccGrade)) {
        if (!userNccCertificate) {
            return {
                field,
                userValue: userNccGrade || 'Not specified',
                examRequirement: JSON.stringify(examNccGrade),
                eligible: false,
                reason: 'NCC certificate not specified'
            };
        }
        
        const allowedGrades = getAllowedGradesForCertificate(examNccGrade, userNccCertificate);
        
        if (allowedGrades.length === 0) {
            return {
                field,
                userValue: userNccGrade || 'Not specified',
                examRequirement: `Certificate ${userNccCertificate} not found`,
                eligible: false,
                reason: `No grade requirements found for certificate ${userNccCertificate}`
            };
        }
        
        if (!userNccGrade) {
            return {
                field,
                userValue: 'Not specified',
                examRequirement: allowedGrades.join(', '),
                eligible: false,
                reason: 'NCC grade not specified'
            };
        }
        
        const normalizedUserGrade = normalizeValue(userNccGrade);
        const eligible = allowedGrades.some(grade => 
            normalizedUserGrade === grade || 
            normalizedUserGrade.includes(grade) || 
            grade.includes(normalizedUserGrade)
        );
        
        return {
            field,
            userValue: userNccGrade,
            examRequirement: allowedGrades.join(', '),
            eligible,
            reason: eligible 
                ? `Grade ${userNccGrade} is accepted for ${userNccCertificate}`
                : `Grade ${userNccGrade} not in allowed list: ${allowedGrades.join(', ')}`
        };
    }
    
    // String/Array format - simple grade check (backward compatibility)
    if (!userNccGrade) {
        return {
            field,
            userValue: 'Not specified',
            examRequirement: String(examNccGrade),
            eligible: false,
            reason: 'NCC grade not specified'
        };
    }
    
    // Parse allowed grades from string or array
    let allowedGrades = [];
    if (Array.isArray(examNccGrade)) {
        allowedGrades = examNccGrade.map(g => normalizeValue(g));
    } else if (typeof examNccGrade === 'string') {
        allowedGrades = examNccGrade.split(',').map(g => normalizeValue(g).trim()).filter(g => g !== '');
    }
    
    const normalizedUserGrade = normalizeValue(userNccGrade);
    const eligible = allowedGrades.some(grade => 
        normalizedUserGrade === grade || 
        normalizedUserGrade.includes(grade) || 
        grade.includes(normalizedUserGrade)
    );
    
    return {
        field,
        userValue: userNccGrade,
        examRequirement: allowedGrades.join(', '),
        eligible,
        reason: eligible 
            ? `Grade ${userNccGrade} matches requirement`
            : `Grade ${userNccGrade} not in allowed list: ${allowedGrades.join(', ')}`
    };
};

/**
 * Get allowed grades for dropdown based on user's NCC certificate
 * @param {string|Object} examNccGrade - Exam's NCC grade requirement
 * @param {string} userNccCertificate - User's selected NCC certificate
 * @returns {string[]} - Array of allowed grade values
 */
export const getAllowedGrades = (examNccGrade, userNccCertificate) => {
    if (isNoRestriction(examNccGrade)) {
        return ['A', 'B', 'C', 'D'];
    }
    
    if (isAllAccepted(examNccGrade)) {
        return ['A', 'B', 'C', 'D'];
    }
    
    if (isObjectFormat(examNccGrade) && userNccCertificate) {
        return getAllowedGradesForCertificate(examNccGrade, userNccCertificate);
    }
    
    // String/Array format
    if (Array.isArray(examNccGrade)) {
        return examNccGrade;
    }
    
    if (typeof examNccGrade === 'string') {
        return examNccGrade.split(',').map(g => g.trim()).filter(g => g !== '');
    }
    
    return [];
};

export default {
    checkNccCertificateGrade,
    getAllowedGrades
};
