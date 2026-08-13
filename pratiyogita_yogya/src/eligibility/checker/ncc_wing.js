/**
 * NCC Wing Eligibility Checker
 */

const canonicalizeWingValue = (value) => {
    const normalized = (value || '').toString().toUpperCase().trim();

    if (normalized === 'ARMY') return 'ARMY WING';
    if (normalized === 'NAVY') return 'NAVAL WING';
    if (normalized === 'AIR FORCE' || normalized === 'AIR FORCE WING') return 'AIR WING';

    return normalized;
};

/**
 * Check NCC wing eligibility
 * @param {string} userNccWing - User's NCC wing (ARMY WING, NAVAL WING, AIR WING)
 * @param {string} examNccWing - Exam's required NCC wing
 * @returns {{eligible: boolean, userValue: string, examRequirement: string, field: string}}
 */
export const checkNccWing = (userNccWing, examNccWing) => {
    const field = 'NCC Wing';
    
    // No restriction
    if (!examNccWing || examNccWing === '' || 
        examNccWing.toUpperCase() === 'ANY' || 
        examNccWing.toUpperCase() === 'NOT APPLICABLE' ||
        examNccWing.toUpperCase() === 'NA') {
        return {
            field,
            userValue: userNccWing || 'Not specified',
            examRequirement: examNccWing || 'Not Required',
            eligible: true
        };
    }
    
    if (!userNccWing) {
        return {
            field,
            userValue: 'Not specified',
            examRequirement: examNccWing,
            eligible: false
        };
    }
    
    const userUpper = canonicalizeWingValue(userNccWing);
    const examUpper = canonicalizeWingValue(examNccWing);
    
    // Check if user's wing matches required wing
    const allowedWings = examUpper.split(',').map(v => canonicalizeWingValue(v)).filter(Boolean);
    const eligible = allowedWings.some(allowed => 
        allowed.includes(userUpper) || userUpper.includes(allowed)
    );
    
    return {
        field,
        userValue: userNccWing,
        examRequirement: examNccWing,
        eligible
    };
};

export default {
    checkNccWing
};
