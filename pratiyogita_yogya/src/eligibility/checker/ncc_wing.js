/**
 * NCC Wing Eligibility Checker
 */

/**
 * Check NCC wing eligibility
 * @param {string} userNccWing - User's NCC wing (ARMY, NAVY, AIR FORCE)
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
    
    const userUpper = userNccWing.toUpperCase().trim();
    const examUpper = examNccWing.toUpperCase().trim();
    
    // Check if user's wing matches required wing
    const allowedWings = examUpper.split(',').map(v => v.trim());
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
