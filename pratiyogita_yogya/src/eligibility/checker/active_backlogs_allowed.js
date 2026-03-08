/**
 * Active Backlogs Allowed Checker
 * 
 * This checker looks at the `highest_education_qualification` field to determine
 * which education level to check for `active_backlogs_allowed`.
 * 
 * The `active_backlogs_allowed` field is stored INSIDE the education level
 * that matches `highest_education_qualification`:
 * - If highest_education_qualification = "GRADUATION", check education_levels.graduation.active_backlogs_allowed
 * - If highest_education_qualification = "(12TH) HIGHER SECONDARY", check education_levels.12th_higher_secondary.active_backlogs_allowed
 * - etc.
 */

// Map highest_education_qualification values to education_levels keys
const EDUCATION_LEVEL_KEY_MAP = {
    'POST DOCTORATE': 'post_doctorate',
    'POST-DOCTORATE': 'post_doctorate',
    'POSTDOCTORATE': 'post_doctorate',
    'PHD': 'phd',
    'PH.D': 'phd',
    'PH.D.': 'phd',
    'DOCTORATE': 'phd',
    'POST GRADUATION': 'post_graduation',
    'POST-GRADUATION': 'post_graduation',
    'POSTGRADUATION': 'post_graduation',
    'PG': 'post_graduation',
    'MASTERS': 'post_graduation',
    'MASTER\'S': 'post_graduation',
    'GRADUATION': 'graduation',
    'GRADUATE': 'graduation',
    'UG': 'graduation',
    'UNDER GRADUATION': 'graduation',
    'UNDERGRADUATE': 'graduation',
    'BACHELORS': 'graduation',
    'BACHELOR\'S': 'graduation',
    'DIPLOMA': 'diploma',
    '12TH': '12th_higher_secondary',
    '12TH HIGHER SECONDARY': '12th_higher_secondary',
    '(12TH) HIGHER SECONDARY': '12th_higher_secondary',
    'HIGHER SECONDARY': '12th_higher_secondary',
    'HSC': '12th_higher_secondary',
    'INTERMEDIATE': '12th_higher_secondary',
    '+2': '12th_higher_secondary',
    '10+2': '12th_higher_secondary',
    '10TH': '10th_secondary',
    '10TH SECONDARY': '10th_secondary',
    '(10TH) SECONDARY': '10th_secondary',
    'SECONDARY': '10th_secondary',
    'SSC': '10th_secondary',
    'MATRIC': '10th_secondary',
    'MATRICULATION': '10th_secondary',
    'BELOW 10TH': 'below_10th',
    'BELOW_10TH': 'below_10th',
    'NO EDUCATION': 'no_education',
    'NO_EXAMSUCATION': 'no_education'
};

/**
 * Get the education level key from highest_education_qualification value
 * @param {string} highestEducation - The highest_education_qualification value
 * @returns {string|null} - The corresponding education_levels key
 */
export const getEducationLevelKeyForBacklogs = (highestEducation) => {
    if (!highestEducation) return null;
    
    const normalized = highestEducation.toUpperCase().trim();
    return EDUCATION_LEVEL_KEY_MAP[normalized] || null;
};

/**
 * Get active_backlogs_allowed value from exam data based on highest_education_qualification
 * @param {Object} examData - The exam JSON data
 * @returns {{value: string, levelKey: string, levelName: string}}
 */
export const getActiveBacklogsFromExam = (examData) => {
    if (!examData) {
        return { value: '', levelKey: '', levelName: '' };
    }
    
    const highestEducation = examData.highest_education_qualification;
    if (!highestEducation) {
        return { value: '', levelKey: '', levelName: '' };
    }
    
    const levelKey = getEducationLevelKeyForBacklogs(highestEducation);
    if (!levelKey) {
        return { value: '', levelKey: '', levelName: highestEducation };
    }
    
    const educationLevels = examData.education_levels;
    if (!educationLevels || typeof educationLevels !== 'object') {
        return { value: '', levelKey, levelName: highestEducation };
    }
    
    const levelData = educationLevels[levelKey];
    if (!levelData || typeof levelData !== 'object') {
        return { value: '', levelKey, levelName: highestEducation };
    }
    
    return {
        value: levelData.active_backlogs_allowed || '',
        levelKey,
        levelName: highestEducation
    };
};

/**
 * Check active backlogs eligibility
 * 
 * The check is done based on the `highest_education_qualification`:
 * - Get the education level key from highest_education_qualification
 * - Look inside education_levels[levelKey] for active_backlogs_allowed
 * - Compare user's backlog status against the requirement
 * 
 * @param {string|number} userBacklogs - User's number of active backlogs (or "YES"/"NO" for has backlogs)
 * @param {Object} examData - Full exam JSON data (to extract active_backlogs_allowed from correct education level)
 * @returns {{eligible: boolean, userValue: string, examRequirement: string, field: string, reason: string}}
 */
export const checkActiveBacklogsAllowed = (userBacklogs, examData) => {
    const field = 'Active Backlogs';
    
    // Get active_backlogs_allowed from the correct education level
    const { value: examBacklogs, levelKey, levelName } = getActiveBacklogsFromExam(examData);
    
    // No restriction cases
    if (!examBacklogs || examBacklogs === '') {
        return {
            field,
            userValue: userBacklogs !== undefined && userBacklogs !== '' ? String(userBacklogs) : 'Not specified',
            examRequirement: 'No backlog restriction',
            eligible: true,
            reason: `No backlog requirement specified for ${levelName || 'this exam'}`
        };
    }
    
    const examUpper = examBacklogs.toUpperCase().trim();
    
    // NOT APPLICABLE - backlogs not relevant for this education level
    if (examUpper === 'NOT APPLICABLE' || examUpper === 'NA' || examUpper === 'N/A') {
        return {
            field,
            userValue: userBacklogs !== undefined && userBacklogs !== '' ? String(userBacklogs) : 'Not specified',
            examRequirement: `Not Applicable (for ${levelName})`,
            eligible: true,
            reason: `Backlogs check not applicable for ${levelName}`
        };
    }
    
    // APPLICABLE - backlogs are allowed
    if (examUpper === 'APPLICABLE' || examUpper === 'YES' || examUpper === 'ALLOWED') {
        return {
            field,
            userValue: userBacklogs !== undefined && userBacklogs !== '' ? String(userBacklogs) : 'Not specified',
            examRequirement: `Backlogs Allowed (for ${levelName})`,
            eligible: true,
            reason: `Backlogs are allowed for ${levelName}`
        };
    }
    
    // NO backlogs allowed
    if (examUpper === 'NO' || examUpper === 'NONE' || examUpper === '0' || examUpper === 'NOT ALLOWED') {
        // Normalize user input
        let userHasBacklogs = false;
        if (typeof userBacklogs === 'string') {
            const userUpper = userBacklogs.toUpperCase().trim();
            if (userUpper === 'YES' || userUpper === 'TRUE') {
                userHasBacklogs = true;
            } else if (userUpper === 'NO' || userUpper === 'FALSE' || userUpper === 'NONE' || userUpper === '0' || userUpper === '') {
                userHasBacklogs = false;
            } else {
                // Try to parse as number
                const num = parseInt(userBacklogs);
                userHasBacklogs = !isNaN(num) && num > 0;
            }
        } else if (typeof userBacklogs === 'number') {
            userHasBacklogs = userBacklogs > 0;
        } else if (typeof userBacklogs === 'boolean') {
            userHasBacklogs = userBacklogs;
        }
        
        const eligible = !userHasBacklogs;
        return {
            field,
            userValue: userHasBacklogs ? 'Yes (has backlogs)' : 'No backlogs',
            examRequirement: `No backlogs allowed (for ${levelName})`,
            eligible,
            reason: eligible 
                ? `User has no backlogs - meets ${levelName} requirement`
                : `User has backlogs but ${levelName} requires no backlogs`
        };
    }
    
    // Specific number of backlogs allowed
    const allowedBacklogs = parseInt(examBacklogs);
    if (!isNaN(allowedBacklogs)) {
        let userBacklogNum = 0;
        if (typeof userBacklogs === 'string') {
            const userUpper = userBacklogs.toUpperCase().trim();
            if (userUpper === 'YES' || userUpper === 'TRUE') {
                // User has backlogs but didn't specify count - assume at least 1
                userBacklogNum = 1;
            } else if (userUpper === 'NO' || userUpper === 'FALSE' || userUpper === 'NONE' || userUpper === '') {
                userBacklogNum = 0;
            } else {
                userBacklogNum = parseInt(userBacklogs) || 0;
            }
        } else if (typeof userBacklogs === 'number') {
            userBacklogNum = userBacklogs;
        } else if (typeof userBacklogs === 'boolean') {
            userBacklogNum = userBacklogs ? 1 : 0;
        }
        
        const eligible = userBacklogNum <= allowedBacklogs;
        return {
            field,
            userValue: String(userBacklogNum),
            examRequirement: `Maximum ${allowedBacklogs} backlogs allowed (for ${levelName})`,
            eligible,
            reason: eligible 
                ? `User has ${userBacklogNum} backlogs - within ${allowedBacklogs} allowed for ${levelName}`
                : `User has ${userBacklogNum} backlogs - exceeds ${allowedBacklogs} allowed for ${levelName}`
        };
    }
    
    // Unknown format - default to eligible
    return {
        field,
        userValue: userBacklogs !== undefined && userBacklogs !== '' ? String(userBacklogs) : 'Not specified',
        examRequirement: `${examBacklogs} (for ${levelName})`,
        eligible: true,
        reason: `Backlog requirement format not recognized for ${levelName}`
    };
};

/**
 * Check if active_backlogs_allowed field should be shown
 * @param {Object} examData - Exam JSON data
 * @returns {boolean}
 */
export const shouldShowActiveBacklogsField = (examData) => {
    const { value } = getActiveBacklogsFromExam(examData);
    
    // Show field if there's a specific backlog restriction
    if (!value || value === '') return false;
    
    const upper = value.toUpperCase().trim();
    
    // Don't show if NOT APPLICABLE
    if (upper === 'NOT APPLICABLE' || upper === 'NA' || upper === 'N/A') {
        return false;
    }
    
    // Show for all other cases (APPLICABLE, NO, specific numbers)
    return true;
};

/**
 * Get the backlog requirement description for display
 * @param {Object} examData - Exam JSON data
 * @returns {string}
 */
export const getBacklogRequirementDescription = (examData) => {
    const { value, levelName } = getActiveBacklogsFromExam(examData);
    
    if (!value || value === '') {
        return 'No backlog restriction';
    }
    
    const upper = value.toUpperCase().trim();
    
    if (upper === 'NOT APPLICABLE' || upper === 'NA' || upper === 'N/A') {
        return `Not Applicable for ${levelName}`;
    }
    
    if (upper === 'APPLICABLE' || upper === 'YES' || upper === 'ALLOWED') {
        return `Backlogs allowed for ${levelName}`;
    }
    
    if (upper === 'NO' || upper === 'NONE' || upper === '0' || upper === 'NOT ALLOWED') {
        return `No backlogs allowed for ${levelName}`;
    }
    
    const num = parseInt(value);
    if (!isNaN(num)) {
        return `Maximum ${num} backlogs allowed for ${levelName}`;
    }
    
    return `${value} for ${levelName}`;
};

export default {
    checkActiveBacklogsAllowed,
    getActiveBacklogsFromExam,
    getEducationLevelKeyForBacklogs,
    shouldShowActiveBacklogsField,
    getBacklogRequirementDescription
};
