/**
 * NCC Certificate Eligibility Checker
 * 
 * Handles the wing-specific object format with arrays:
 * {
 *   "ARMY": ["C CERTIFICATE"],
 *   "NAVY": ["C CERTIFICATE"],
 *   "AIR FORCE": ["C CERTIFICATE"]
 * }
 * 
 * Similar to how marital_status depends on gender,
 * ncc_certificate depends on ncc_wing.
 * 
 * Standard Values:
 * - "" or missing: No restriction → everyone passes
 * - "NOT APPLICABLE": NCC not required
 * - "ALL APPLICABLE": Any certificate accepted
 * - Object with wing keys containing arrays of allowed certificates
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
 * Check if ncc_certificate is in object format (wing-based)
 * @param {*} value - The ncc_certificate value
 * @returns {boolean}
 */
const isObjectFormat = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    const keys = Object.keys(value).map(k => k.toUpperCase());
    return keys.some(k => k.includes('ARMY') || k.includes('NAVY') || k.includes('AIR'));
};

/**
 * Get allowed certificates array for a specific NCC wing
 * @param {Object} nccCertObj - { "ARMY": [...], "NAVY": [...], "AIR FORCE": [...] }
 * @param {string} userNccWing - User's NCC wing
 * @returns {string[]} - Array of allowed certificates for that wing
 */
const getAllowedCertificatesForWing = (nccCertObj, userNccWing) => {
    const normalizedWing = normalizeKeyLoose(userNccWing);
    
    for (const [key, value] of Object.entries(nccCertObj)) {
        if (normalizeKeyLoose(key) === normalizedWing) {
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
    
    // No rule for this wing = not eligible (wing not accepted)
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
 * Check if value indicates all certificates are accepted
 * @param {*} value - Value to check
 * @returns {boolean}
 */
const isAllAccepted = (value) => {
    const normalized = normalizeValue(String(value));
    return normalized === 'ALL APPLICABLE' || 
           normalized === 'ALL' || 
           normalized === 'ANY' ||
           normalized === 'ALL CERTIFICATES';
};

/**
 * Check NCC certificate eligibility (single check)
 * @param {string} userNccCertificate - User's NCC certificate (A CERTIFICATE, B CERTIFICATE, C CERTIFICATE)
 * @param {string|Object} examNccCertificate - Exam's required NCC certificate(s)
 * @param {string} userNccWing - User's NCC wing (ARMY, NAVY, AIR FORCE)
 * @returns {{eligible: boolean, userValue: string, examRequirement: string, field: string, reason: string}}
 */
export const checkNccCertificate = (userNccCertificate, examNccCertificate, userNccWing) => {
    const field = 'NCC Certificate';
    
    // No restriction - NCC not required
    if (isNoRestriction(examNccCertificate)) {
        return {
            field,
            userValue: userNccCertificate || 'Not specified',
            examRequirement: examNccCertificate || 'Not Required',
            eligible: true,
            reason: 'NCC certificate not required for this exam'
        };
    }
    
    // All certificates accepted
    if (isAllAccepted(examNccCertificate)) {
        if (!userNccCertificate || normalizeValue(userNccCertificate) === 'NO' || normalizeValue(userNccCertificate) === '') {
            return {
                field,
                userValue: userNccCertificate || 'Not specified',
                examRequirement: 'Any NCC Certificate',
                eligible: false,
                reason: 'NCC certificate is required but not provided'
            };
        }
        return {
            field,
            userValue: userNccCertificate,
            examRequirement: 'Any NCC Certificate',
            eligible: true,
            reason: 'Any NCC certificate is accepted'
        };
    }
    
    // Object format - wing-based certificates
    if (isObjectFormat(examNccCertificate)) {
        if (!userNccWing) {
            return {
                field,
                userValue: userNccCertificate || 'Not specified',
                examRequirement: JSON.stringify(examNccCertificate),
                eligible: false,
                reason: 'NCC wing not specified'
            };
        }
        
        const allowedCertificates = getAllowedCertificatesForWing(examNccCertificate, userNccWing);
        
        if (allowedCertificates.length === 0) {
            return {
                field,
                userValue: userNccCertificate || 'Not specified',
                examRequirement: `Wing ${userNccWing} not accepted`,
                eligible: false,
                reason: `NCC wing ${userNccWing} is not accepted for this exam`
            };
        }
        
        if (!userNccCertificate) {
            return {
                field,
                userValue: 'Not specified',
                examRequirement: allowedCertificates.join(', '),
                eligible: false,
                reason: 'NCC certificate not specified'
            };
        }
        
        const normalizedUserCert = normalizeValue(userNccCertificate);
        const eligible = allowedCertificates.some(cert => 
            normalizedUserCert.includes(cert) || cert.includes(normalizedUserCert) ||
            normalizeKeyLoose(normalizedUserCert) === normalizeKeyLoose(cert)
        );
        
        return {
            field,
            userValue: userNccCertificate,
            examRequirement: allowedCertificates.join(', '),
            eligible,
            reason: eligible 
                ? `Certificate ${userNccCertificate} is accepted for ${userNccWing} wing`
                : `Certificate ${userNccCertificate} not in allowed list: ${allowedCertificates.join(', ')}`
        };
    }
    
    // String/Array format - simple certificate check (backward compatibility)
    if (!userNccCertificate) {
        return {
            field,
            userValue: 'Not specified',
            examRequirement: String(examNccCertificate),
            eligible: false,
            reason: 'NCC certificate not specified'
        };
    }
    
    // Parse allowed certificates from string or array
    let allowedCertificates = [];
    if (Array.isArray(examNccCertificate)) {
        allowedCertificates = examNccCertificate.map(c => normalizeValue(c));
    } else if (typeof examNccCertificate === 'string') {
        allowedCertificates = examNccCertificate.split(',').map(c => normalizeValue(c)).filter(c => c !== '');
    }
    
    const normalizedUserCert = normalizeValue(userNccCertificate);
    const eligible = allowedCertificates.some(cert => 
        normalizedUserCert.includes(cert) || cert.includes(normalizedUserCert) ||
        normalizeKeyLoose(normalizedUserCert) === normalizeKeyLoose(cert)
    );
    
    return {
        field,
        userValue: userNccCertificate,
        examRequirement: allowedCertificates.join(', '),
        eligible,
        reason: eligible 
            ? `Certificate ${userNccCertificate} matches requirement`
            : `Certificate ${userNccCertificate} not in allowed list: ${allowedCertificates.join(', ')}`
    };
};

/**
 * Get allowed certificates for dropdown based on user's NCC wing
 * @param {string|Object} examNccCertificate - Exam's NCC certificate requirement
 * @param {string} userNccWing - User's selected NCC wing
 * @returns {string[]} - Array of allowed certificate values
 */
export const getAllowedCertificates = (examNccCertificate, userNccWing) => {
    if (isNoRestriction(examNccCertificate)) {
        return ['A CERTIFICATE', 'B CERTIFICATE', 'C CERTIFICATE'];
    }
    
    if (isAllAccepted(examNccCertificate)) {
        return ['A CERTIFICATE', 'B CERTIFICATE', 'C CERTIFICATE'];
    }
    
    if (isObjectFormat(examNccCertificate) && userNccWing) {
        return getAllowedCertificatesForWing(examNccCertificate, userNccWing);
    }
    
    // String/Array format
    if (Array.isArray(examNccCertificate)) {
        return examNccCertificate;
    }
    
    if (typeof examNccCertificate === 'string') {
        return examNccCertificate.split(',').map(c => c.trim()).filter(c => c !== '');
    }
    
    return [];
};

export default {
    checkNccCertificate,
    getAllowedCertificates
};
