/**
 * Eligibility Basis Checker
 * 
 * This module handles the "Eligibility Basis" search mode:
 * User fills their details first, and we show them all exams 
 * they're eligible for based on their profile.
 */

import {
    checkFullEligibility,
    getDisplayDetails
} from "./eligibilityChecker";

import {
    ensureExamCatalogLoaded,
    getExamDropdownOptions,
    loadExamDataBulk,
    getDivisionOptions,
    getDivisionData,
    examHasDivisions,
    getExamSessionOptions
} from "./examDataLoader";

import { prepareUserInput } from "./exambasis";

// ============================================
// ELIGIBILITY BASIS CHECKING
// ============================================

/**
 * Extract year from session string (e.g., "2026-I" -> "2026", "2026" -> "2026")
 */
const extractYearFromSession = (session) => {
    if (!session || session === "N/A") return null;
    const match = session.match(/^(\d{4})/);
    return match ? match[1] : null;
};

/**
 * Extract session number from session string (e.g., "2026-I" -> "I", "2026-II" -> "II")
 */
const extractSessionNumber = (session) => {
    if (!session || session === "N/A") return null;
    const match = session.match(/-([IVX]+)$/);
    return match ? match[1] : null;
};

/**
 * Check eligibility for ALL available exams based on user profile
 * @param {Object} formData - The form data from UI
 * @param {Object} educationTableData - Education table data from UI
 * @param {Function} onProgress - Optional callback for progress updates (examName, current, total)
 * @returns {Promise<Object>} - Object with unified table data
 */
export const checkEligibilityBasis = async (formData, educationTableData, onProgress = null) => {
    await ensureExamCatalogLoaded();
    const examOptions = getExamDropdownOptions();
    const allResults = [];

    const linkedFiles = examOptions
        .map((option) => option.linkedFile)
        .filter(Boolean);
    const examDataMap = await loadExamDataBulk(linkedFiles);
    
    // Prepare user input once
    const userInput = prepareUserInput(formData, educationTableData);
    
    // Check each exam
    for (let i = 0; i < examOptions.length; i++) {
        const examOption = examOptions[i];
        
        // Progress callback
        if (onProgress) {
            onProgress(examOption.label, i + 1, examOptions.length);
        }
        
        if (!examOption.linkedFile) continue;
        
        try {
            const examData = examDataMap[examOption.linkedFile] || null;
            if (!examData) continue;
            
            const hasDiv = examHasDivisions(examData);
            const examFrequency = parseInt(examData.exam_frequency_year) || 1;
            
            if (hasDiv) {
                // Check each division
                const divOpts = getDivisionOptions(examData);
                
                for (const divOpt of divOpts) {
                    const divData = getDivisionData(examData, divOpt.value);
                    if (!divData) continue;
                    
                    // Get sessions for this division
                    const sessionOptions = getExamSessionOptions(divData);
                    
                    if (sessionOptions.length > 0) {
                        // Check each session
                        for (const sessionOpt of sessionOptions) {
                            const result = checkFullEligibility(
                                userInput,
                                divData,
                                sessionOpt.value
                            );
                            
                            allResults.push({
                                ...result,
                                examCode: examOption.value,
                                examName: examData.exam_name || examOption.label,
                                examLabel: examOption.label,
                                division: divOpt.value,
                                session: sessionOpt.label,
                                year: extractYearFromSession(sessionOpt.label),
                                sessionNumber: extractSessionNumber(sessionOpt.label),
                                examFrequency: examFrequency,
                                linkedFile: examOption.linkedFile,
                                displayDetails: getDisplayDetails(examData)
                            });
                        }
                    } else {
                        // No sessions - single check
                        const result = checkFullEligibility(
                            userInput,
                            divData,
                            null
                        );
                        
                        allResults.push({
                            ...result,
                            examCode: examOption.value,
                            examName: examData.exam_name || examOption.label,
                            examLabel: examOption.label,
                            division: divOpt.value,
                            session: "N/A",
                            year: null,
                            sessionNumber: null,
                            examFrequency: examFrequency,
                            linkedFile: examOption.linkedFile,
                            displayDetails: getDisplayDetails(examData)
                        });
                    }
                }
            } else {
                // No divisions - check exam directly
                const sessionOptions = getExamSessionOptions(examData);
                
                if (sessionOptions.length > 0) {
                    // Check each session
                    for (const sessionOpt of sessionOptions) {
                        const result = checkFullEligibility(
                            userInput,
                            examData,
                            sessionOpt.value
                        );
                        
                        allResults.push({
                            ...result,
                            examCode: examOption.value,
                            examName: examData.exam_name || examOption.label,
                            examLabel: examOption.label,
                            division: null,
                            session: sessionOpt.label,
                            year: extractYearFromSession(sessionOpt.label),
                            sessionNumber: extractSessionNumber(sessionOpt.label),
                            examFrequency: examFrequency,
                            linkedFile: examOption.linkedFile,
                            displayDetails: getDisplayDetails(examData)
                        });
                    }
                } else {
                    // No sessions - single check
                    const result = checkFullEligibility(
                        userInput,
                        examData,
                        null
                    );
                    
                    allResults.push({
                        ...result,
                        examCode: examOption.value,
                        examName: examData.exam_name || examOption.label,
                        examLabel: examOption.label,
                        division: null,
                        session: "N/A",
                        year: null,
                        sessionNumber: null,
                        examFrequency: examFrequency,
                        linkedFile: examOption.linkedFile,
                        displayDetails: getDisplayDetails(examData)
                    });
                }
            }
        } catch (err) {
            console.error(`Error checking exam ${examOption.label}:`, err);
            // Continue with next exam
        }
    }
    
    // Process results into unified table format
    return processResultsForUnifiedTable(allResults, examOptions.length);
};

/**
 * Process raw results into unified table format
 * @param {Array} allResults - All eligibility check results
 * @param {number} totalExamsChecked - Total number of exams checked
 * @returns {Object} - Processed data for unified table
 */
const processResultsForUnifiedTable = (allResults, totalExamsChecked) => {
    // Get unique years from results
    const yearsSet = new Set();
    allResults.forEach(r => {
        if (r.year) yearsSet.add(r.year);
    });
    const years = Array.from(yearsSet).sort();
    
    // If no years found, use default years
    const displayYears = years.length > 0 ? years : ['2026', '2027', '2028', '2029', '2030'];
    
    // Group results by exam + division (unique row identifier)
    const rowsMap = new Map();
    
    allResults.forEach(result => {
        // Create unique row key: examCode + division (if exists)
        const rowKey = result.division 
            ? `${result.examCode}__${result.division}`
            : result.examCode;
        
        // Display name: "Exam Name (Division)" or just "Exam Name"
        const displayName = result.division 
            ? `${result.examLabel} (${result.division})`
            : result.examLabel;
        
        if (!rowsMap.has(rowKey)) {
            rowsMap.set(rowKey, {
                rowKey,
                examCode: result.examCode,
                examLabel: result.examLabel,
                displayName,
                division: result.division,
                examFrequency: result.examFrequency,
                displayDetails: result.displayDetails,
                yearData: {} // { year: { eligible: boolean, eligibleSessions: number, totalSessions: number, failedCriteria: [] } }
            });
        }
        
        const row = rowsMap.get(rowKey);
        const year = result.year || 'N/A';
        
        if (!row.yearData[year]) {
            row.yearData[year] = {
                eligible: false,
                eligibleSessions: 0,
                totalSessions: 0,
                failedCriteria: [],
                results: []
            };
        }
        
        row.yearData[year].totalSessions++;
        row.yearData[year].results.push(result);
        
        if (result.eligible) {
            row.yearData[year].eligibleSessions++;
            row.yearData[year].eligible = true;
        } else {
            // Collect failed criteria
            if (result.results) {
                result.results.filter(r => !r.eligible).forEach(r => {
                    if (!row.yearData[year].failedCriteria.includes(r.field)) {
                        row.yearData[year].failedCriteria.push(r.field);
                    }
                });
            }
        }
    });
    
    // Convert map to array and sort
    const tableRows = Array.from(rowsMap.values()).sort((a, b) => {
        // Sort by exam label first, then by division
        if (a.examLabel !== b.examLabel) {
            return a.examLabel.localeCompare(b.examLabel);
        }
        return (a.division || '').localeCompare(b.division || '');
    });
    
    // Calculate totals
    let totalEligible = 0;
    let totalIneligible = 0;
    
    allResults.forEach(r => {
        if (r.eligible) totalEligible++;
        else totalIneligible++;
    });
    
    return {
        tableRows,
        years: displayYears,
        totalExamsChecked,
        eligibleCount: totalEligible,
        ineligibleCount: totalIneligible,
        uniqueExamDivisions: tableRows.length
    };
};

/**
 * Get a summary of eligible exams grouped by exam name
 * @param {Object} results - Results from checkEligibilityBasis
 * @returns {Array} - Grouped results by exam (for backward compatibility)
 */
export const getEligibleExamsSummary = (results) => {
    if (!results || !results.tableRows) return [];
    
    // Group by exam code
    const examMap = new Map();
    
    results.tableRows.forEach(row => {
        const key = row.examCode;
        if (!examMap.has(key)) {
            examMap.set(key, {
                examCode: row.examCode,
                examLabel: row.examLabel,
                displayDetails: row.displayDetails,
                divisions: [],
                totalEligible: 0
            });
        }
        
        const exam = examMap.get(key);
        
        // Count eligible years/sessions
        Object.values(row.yearData).forEach(yd => {
            exam.totalEligible += yd.eligibleSessions;
        });
        
        if (row.division && !exam.divisions.includes(row.division)) {
            exam.divisions.push(row.division);
        }
    });
    
    return Array.from(examMap.values()).sort((a, b) => b.totalEligible - a.totalEligible);
};

/**
 * Filter eligible results by criteria
 * @param {Array} results - Array of results
 * @param {Object} filters - Filter criteria { examLevel, conductingBody, etc. }
 * @returns {Array} - Filtered results
 */
export const filterEligibleResults = (results, filters = {}) => {
    return results.filter(result => {
        if (filters.examLevel && result.displayDetails?.exam_level) {
            if (result.displayDetails.exam_level.toLowerCase() !== filters.examLevel.toLowerCase()) {
                return false;
            }
        }
        
        if (filters.conductingBody && result.displayDetails?.conducting_body) {
            if (!result.displayDetails.conducting_body.toLowerCase().includes(filters.conductingBody.toLowerCase())) {
                return false;
            }
        }
        
        if (filters.examName) {
            if (!result.examName.toLowerCase().includes(filters.examName.toLowerCase()) &&
                !result.examLabel.toLowerCase().includes(filters.examName.toLowerCase())) {
                return false;
            }
        }
        
        return true;
    });
};

// Re-export for convenience
export { prepareUserInput } from "./exambasis";
export { getExamDropdownOptions };
