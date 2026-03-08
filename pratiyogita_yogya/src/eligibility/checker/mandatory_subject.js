/**
 * Mandatory Subject Eligibility Checker
 * 
 * Checks if user has studied the required mandatory subject for a post/academy.
 * 
 * Logic:
 * - If user selects "ALL" → Eligible for all posts (has studied all subjects)
 * - If user selects "NO" → Not eligible for posts requiring specific subjects, eligible for posts with no requirement
 * - If user selects specific subjects → Eligible for posts where mandatory_subject matches one of user's subjects
 * - If post has no mandatory_subject (empty or "NOT APPLICABLE") → User is eligible regardless of selection
 * 
 * New Fields Handled:
 * - mandatory_subject (string): Single subject required
 * - mandatory_subjects (array): ALL subjects required (AND logic)
 * - mandatory_subject_marks_percentage: Marks required for single subject
 * - mandatory_subjects_marks_percentage: Marks required for multiple subjects
 * - except_course: Courses that bypass mandatory subject check
 * 
 * Data Structure:
 * - studiedMandatorySubjects: { 'GRADUATION': ['STATISTICS'], '(12TH)HIGHER SECONDARY': ['MATHEMATICS'] }
 * - subjectWiseMarks: { 'GRADUATION': { 'STATISTICS': '80' }, '(12TH)HIGHER SECONDARY': { 'MATHEMATICS': '65' } }
 */

// Map UI level keys to JSON level keys
const UI_TO_JSON_LEVEL_KEY = {
    'POST DOCTORATE': 'post_doctorate',
    'PHD': 'phd',
    'POST GRADUATION': 'post_graduation',
    'GRADUATION': 'graduation',
    'DIPLOMA / ITI (POLYTECHNIC, ITI, DPHARM, PGDCA)': 'diploma',
    '(12TH)HIGHER SECONDARY': '12th_higher_secondary',
    '(12TH) HIGHER SECONDARY': '12th_higher_secondary',
    '(10TH)SECONDARY': '10th_secondary',
    '(10TH) SECONDARY': '10th_secondary'
};

/**
 * Check mandatory subject eligibility with marks validation
 * @param {Object} userInput - User input containing studiedMandatorySubjects (object by level), subjectWiseMarks (object by level), casteCategory
 * @param {Object} examData - Single division/post data or exam data
 * @param {string} highestEducation - User's highest education level
 * @returns {Object} - { eligible: boolean, message: string, requiredSubject: string }
 */
export const checkMandatorySubjectEligibility = (userInput, examData, highestEducation) => {
    // Get user's selected subjects and marks (now per-level objects)
    const studiedSubjectsByLevel = userInput.studiedMandatorySubjects || {};
    const subjectMarksByLevel = userInput.subjectWiseMarks || {};
    const userCategory = (userInput.caste_category || 'GEN').toUpperCase();
    const userCourse = getUserCourse(userInput, highestEducation);
    
    // Flatten for backward compatibility - collect all subjects from all levels
    const allUserSubjects = [];
    Object.values(studiedSubjectsByLevel).forEach(subjects => {
        if (Array.isArray(subjects)) {
            allUserSubjects.push(...subjects);
        }
    });
    
    // If user hasn't made any selection at any level, skip this check
    if (allUserSubjects.length === 0) {
        return {
            eligible: true,
            message: "No mandatory subject selection made - check skipped",
            requiredSubject: "",
            skipped: true
        };
    }
    
    // Get mandatory subject requirements from exam data (checks all levels)
    const allRequirements = getAllLevelRequirements(examData);
    
    // If no mandatory subject is required at any level, user is eligible
    if (!allRequirements.hasAnyRequirement) {
        return {
            eligible: true,
            message: "No mandatory subject required for this post",
            requiredSubject: ""
        };
    }
    
    // Check if user's course is in except_course list (bypass all mandatory checks)
    if (allRequirements.exceptCourses && allRequirements.exceptCourses.length > 0) {
        const normalizedUserCourse = userCourse.toUpperCase().trim();
        const isExcepted = allRequirements.exceptCourses.some(course => 
            normalizedUserCourse.includes(course.toUpperCase().trim()) ||
            course.toUpperCase().trim().includes(normalizedUserCourse)
        );
        
        if (isExcepted) {
            return {
                eligible: true,
                message: `Your course (${userCourse}) is exempted from mandatory subject requirement`,
                requiredSubject: allRequirements.allRequiredSubjects.join(', '),
                exempted: true
            };
        }
    }
    
    // Check each level's requirements
    const failedChecks = [];
    const passedChecks = [];
    
    for (const [jsonLevelKey, levelReq] of Object.entries(allRequirements.byLevel)) {
        if (!levelReq.hasRequirement) continue;
        
        // Find the UI level key for this JSON level
        const uiLevelKey = Object.keys(UI_TO_JSON_LEVEL_KEY).find(
            k => UI_TO_JSON_LEVEL_KEY[k] === jsonLevelKey
        ) || jsonLevelKey.toUpperCase();
        
        // Get user's selections for this level
        const userSubjectsForLevel = studiedSubjectsByLevel[uiLevelKey] || [];
        const userMarksForLevel = subjectMarksByLevel[uiLevelKey] || {};
        
        // Check if user selected "ALL" for this level
        if (userSubjectsForLevel.includes('ALL')) {
            passedChecks.push({
                level: jsonLevelKey,
                message: `All subjects studied at ${jsonLevelKey} level`
            });
            continue;
        }
        
        // Check if user selected "NO" for this level
        if (userSubjectsForLevel.includes('NO') && userSubjectsForLevel.length === 1) {
            failedChecks.push({
                level: jsonLevelKey,
                message: `Required subject(s) at ${jsonLevelKey}: ${levelReq.requiredSubjects.join(', ')}, but you haven't studied any`
            });
            continue;
        }
        
        // Normalize user subjects
        const userSubjectsNormalized = userSubjectsForLevel.map(s => s.toUpperCase().trim());
        
        // Check each required subject
        for (const reqSubject of levelReq.requiredSubjects) {
            const normalizedReq = reqSubject.toUpperCase().trim();
            
            if (!userSubjectsNormalized.includes(normalizedReq)) {
                failedChecks.push({
                    level: jsonLevelKey,
                    message: `Missing ${reqSubject} at ${jsonLevelKey} level`
                });
                continue;
            }
            
            // Check marks if required
            if (levelReq.marksPercentage) {
                const requiredMarks = parseFloat(levelReq.marksPercentage[userCategory] || levelReq.marksPercentage.GEN || '0');
                const userMarks = parseFloat(userMarksForLevel[reqSubject] || userMarksForLevel[normalizedReq] || '0');
                
                if (requiredMarks > 0 && userMarks < requiredMarks) {
                    failedChecks.push({
                        level: jsonLevelKey,
                        message: `Need ${requiredMarks}% in ${reqSubject}, have ${userMarks}%`
                    });
                } else {
                    passedChecks.push({
                        level: jsonLevelKey,
                        message: `${reqSubject} check passed`
                    });
                }
            } else {
                passedChecks.push({
                    level: jsonLevelKey,
                    message: `${reqSubject} check passed`
                });
            }
        }
    }
    
    // Determine overall eligibility
    if (failedChecks.length > 0) {
        return {
            eligible: false,
            message: failedChecks.map(f => f.message).join('; '),
            requiredSubject: allRequirements.allRequiredSubjects.join(', '),
            failedChecks
        };
    }
    
    return {
        eligible: true,
        message: "All mandatory subject requirements met",
        requiredSubject: allRequirements.allRequiredSubjects.join(', '),
        passedChecks
    };
};

/**
 * Get all mandatory subject requirements from all education levels
 */
const getAllLevelRequirements = (examData) => {
    const result = {
        hasAnyRequirement: false,
        allRequiredSubjects: [],
        exceptCourses: [],
        byLevel: {}
    };
    
    if (!examData || !examData.education_levels) {
        return result;
    }
    
    const educationLevels = examData.education_levels;
    const levelKeys = ['graduation', 'post_graduation', '12th_higher_secondary', '10th_secondary', 'diploma', 'phd', 'post_doctorate'];
    
    for (const levelKey of levelKeys) {
        const levelData = educationLevels[levelKey];
        if (!levelData || typeof levelData !== 'object') continue;
        
        const levelReq = {
            hasRequirement: false,
            requiredSubjects: [],
            marksPercentage: null
        };
        
        // Check for single mandatory_subject
        if (levelData.mandatory_subject && levelData.mandatory_subject.trim() !== '' && 
            levelData.mandatory_subject.toUpperCase() !== 'NOT APPLICABLE') {
            levelReq.hasRequirement = true;
            const subjects = levelData.mandatory_subject.split(',').map(s => s.trim());
            levelReq.requiredSubjects.push(...subjects);
            result.allRequiredSubjects.push(...subjects);
            
            if (levelData.mandatory_subject_marks_percentage) {
                levelReq.marksPercentage = levelData.mandatory_subject_marks_percentage;
            }
        }
        
        // Check for multiple mandatory_subjects (array)
        if (levelData.mandatory_subjects && Array.isArray(levelData.mandatory_subjects) && 
            levelData.mandatory_subjects.length > 0) {
            levelReq.hasRequirement = true;
            levelReq.requiredSubjects.push(...levelData.mandatory_subjects);
            result.allRequiredSubjects.push(...levelData.mandatory_subjects);
            
            if (levelData.mandatory_subjects_marks_percentage) {
                levelReq.marksPercentage = levelData.mandatory_subjects_marks_percentage;
            }
        }
        
        // Check for except_course
        if (levelData.course && levelData.course.except_course && 
            Array.isArray(levelData.course.except_course)) {
            result.exceptCourses.push(...levelData.course.except_course);
        }
        
        if (levelReq.hasRequirement) {
            result.hasAnyRequirement = true;
            result.byLevel[levelKey] = levelReq;
        }
    }
    
    return result;
};

/**
 * Get user's course from education table data
 */
const getUserCourse = (userInput, highestEducation) => {
    if (!userInput.education_levels) return '';
    
    const levelKey = UI_TO_JSON_LEVEL_KEY[highestEducation?.toUpperCase()] || highestEducation?.toLowerCase().replace(/ /g, '_');
    const levelData = userInput.education_levels[levelKey];
    
    return levelData?.course || '';
};

export default {
    checkMandatorySubjectEligibility
};
