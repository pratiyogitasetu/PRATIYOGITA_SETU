/**
 * Check Eligibility Page
 * 
 * This is the main UI component for the eligibility checking feature.
 * It contains only the frontend/UI code.
 * 
 * Logic is handled by:
 * - eligibility/exambasis.js (Exam Basis mode)
 * - eligibility/eligibilitybasis.js (Eligibility Basis mode)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import Checkbox from "@mui/material/Checkbox";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { jsPDF } from "jspdf";

// Import exam basis logic
import {
    getExamDropdownOptions,
    loadExamDataForBasis,
    extractOptionsFromExamData,
    extractMandatorySubjectsFromExamData,
    checkIfExamRequiresSubjectMarks,
    valuesToOptions,
    prepareUserInput,
    checkExamBasisEligibility,
    getDisplayDetails
} from "../eligibility/exambasis";
import { ensureExamCatalogLoaded } from "../eligibility/examDataLoader";

// Import eligibility basis logic
import {
    checkEligibilityBasis,
    getEligibleExamsSummary,
    getExamDropdownOptions as getExamOptions
} from "../eligibility/eligibilitybasis";

// Import education level functions
import { 
    getCoursesForLevel,
    getSubjectsForCourse,
    loadEduFinalData
} from "../eligibility/checker/education_level";

// ============================================
// THEME & STYLES
// ============================================

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: "#E4572E",
        },
        background: {
            default: 'transparent',
            paper: '#3d2419',
        },
        text: {
            primary: '#FBF6EE',
            secondary: 'rgba(232,216,195,0.7)',
        },
    },
    components: {
        MuiTextField: {
            styleOverrides: {
                root: {
                    "& .MuiInputBase-root": {
                        fontSize: "0.95rem",
                        color: "#FBF6EE",
                    },
                    "& .MuiInputBase-input": {
                        color: "#FBF6EE",
                    },
                    "& .MuiInputLabel-root": {
                        fontSize: "0.95rem",
                        color: "rgba(232,216,195,0.7)",
                    },
                    "& .MuiFormHelperText-root": {
                        fontSize: "0.8rem",
                        marginTop: "1px",
                        color: "rgba(232,216,195,0.5)",
                    },
                    "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                            borderColor: "rgba(228,87,46,0.4)",
                        },
                        "&:hover fieldset": {
                            borderColor: "#E4572E",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#E4572E",
                        },
                    },
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    fontSize: "0.95rem",
                    color: "#FBF6EE",
                },
            },
        },
        MuiPopover: {
            defaultProps: {
                disableScrollLock: true,
            },
        },
        MuiMenu: {
            defaultProps: {
                disableScrollLock: true,
            },
            styleOverrides: {
                // Limit dropdown height (≈5 items) + thin red scrollbar
                paper: {
                    maxHeight: 220,
                },
                list: {
                    maxHeight: 220,
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#E4572E rgba(43,30,23,0.5)',
                    '&::-webkit-scrollbar': {
                        width: '4px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'rgba(43,30,23,0.5)',
                        borderRadius: '999px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#E4572E',
                        borderRadius: '999px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        background: '#c9421e',
                    },
                },
            },
        },
        MuiAutocomplete: {
            styleOverrides: {
                listbox: {
                    maxHeight: 220,
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#E4572E rgba(43,30,23,0.5)',
                    '&::-webkit-scrollbar': {
                        width: '4px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'rgba(43,30,23,0.5)',
                        borderRadius: '999px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#E4572E',
                        borderRadius: '999px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        background: '#c9421e',
                    },
                },
            },
        },
        MuiModal: {
            defaultProps: {
                disableScrollLock: true,
            },
        },
    },
});

const thinScrollbarStyle = {
    '&::-webkit-scrollbar': {
        width: '4px',
        height: '4px',
    },
    '&::-webkit-scrollbar-track': {
        background: 'rgba(43,30,23,0.5)',
        borderRadius: '2px',
    },
    '&::-webkit-scrollbar-thumb': {
        background: '#E4572E',
        borderRadius: '2px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
        background: '#c9421e',
    },
    scrollbarWidth: 'thin',
    scrollbarColor: '#E4572E rgba(43,30,23,0.5)',
};

// Orange scrollbar for the /checkeligibility form/page scroll area
const greenScrollbarStyle = {
    paddingRight: '4px',
    marginRight: '2px',
    '&::-webkit-scrollbar': {
        width: '6px',
    },
    '&::-webkit-scrollbar-track': {
        background: 'transparent',
        borderRadius: '999px',
        margin: '8px 0',
    },
    '&::-webkit-scrollbar-thumb': {
        background: 'linear-gradient(180deg, #E4572E, #c9421e)',
        borderRadius: '999px',
        border: '1px solid rgba(232,216,195,0.1)',
    },
    '&::-webkit-scrollbar-thumb:hover': {
        background: 'linear-gradient(180deg, #c9421e, #a8351a)',
    },
    scrollbarWidth: 'thin',
    scrollbarColor: '#E4572E transparent',
};

// ============================================
// STATIC OPTIONS (User Input Choices)
// ============================================

const staticGenderOptions = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "TRANSGENDER", label: "Transgender" },
];

const maritalStatusByGender = {
    MALE: [
        { value: "UNMARRIED", label: "Unmarried" },
        { value: "MARRIED", label: "Married" },
        { value: "SEPARATED", label: "Separated" },
        { value: "DIVORCED", label: "Divorced" },
        { value: "WIDOWER", label: "Widower" },
    ],
    FEMALE: [
        { value: "UNMARRIED", label: "Unmarried" },
        { value: "MARRIED", label: "Married" },
        { value: "SEPARATED", label: "Separated" },
        { value: "DIVORCEE", label: "Divorcee" },
        { value: "WIDOW", label: "Widow" },
    ],
    TRANSGENDER: [
        { value: "UNMARRIED", label: "Unmarried" },
        { value: "MARRIED", label: "Married" },
        { value: "SEPARATED", label: "Separated" },
        { value: "DIVORCED", label: "Divorced" },
        { value: "DIVORCEE", label: "Divorcee" },
        { value: "WIDOW", label: "Widow" },
        { value: "WIDOWER", label: "Widower" },
    ],
};

const staticMaritalStatusOptions = [
    { value: "UNMARRIED", label: "Unmarried" },
    { value: "MARRIED", label: "Married" },
    { value: "SEPARATED", label: "Separated" },
    { value: "DIVORCED", label: "Divorced" },
    { value: "DIVORCEE", label: "Divorcee" },
    { value: "WIDOW", label: "Widow" },
    { value: "WIDOWER", label: "Widower" },
];

const getMaritalStatusOptionsForGender = (gender) => {
    if (!gender) return staticMaritalStatusOptions;
    const upperGender = gender.toUpperCase();
    return maritalStatusByGender[upperGender] || staticMaritalStatusOptions;
};

const staticNationalityOptions = [
    // Indian Citizens
    { value: "INDIAN", label: "Indian" },
    // Neighboring Countries
    { value: "CITIZEN OF NEPAL", label: "Citizen of Nepal" },
    { value: "CITIZEN OF BHUTAN", label: "Citizen of Bhutan" },
    { value: "TIBETAN REFUGEE (PRE-1962)", label: "Tibetan Refugee (Pre-1962)" },
    // PIO - Person of Indian Origin
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM PAKISTAN", label: "PIO from Pakistan" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM BURMA/MYANMAR", label: "PIO from Burma/Myanmar" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM BANGLADESH", label: "PIO from Bangladesh" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM SRI LANKA", label: "PIO from Sri Lanka" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM NEPAL", label: "PIO from Nepal" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM BHUTAN", label: "PIO from Bhutan" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM AFGHANISTAN", label: "PIO from Afghanistan" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM KENYA", label: "PIO from Kenya" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM UGANDA", label: "PIO from Uganda" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM TANZANIA", label: "PIO from Tanzania" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM ZAMBIA", label: "PIO from Zambia" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM MALAWI", label: "PIO from Malawi" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM ZAIRE/DR CONGO", label: "PIO from Zaire/DR Congo" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM ETHIOPIA", label: "PIO from Ethiopia" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM SOUTH AFRICA", label: "PIO from South Africa" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM MAURITIUS", label: "PIO from Mauritius" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM VIETNAM", label: "PIO from Vietnam" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM MALAYSIA", label: "PIO from Malaysia" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM SINGAPORE", label: "PIO from Singapore" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM INDONESIA", label: "PIO from Indonesia" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM THAILAND", label: "PIO from Thailand" },
    { value: "PERSON OF INDIAN ORIGIN (PIO) FROM PHILIPPINES", label: "PIO from Philippines" },
    // OCI - Overseas Citizen of India
    { value: "OCI (OVERSEAS CITIZEN OF INDIA) FROM UNITED STATES", label: "OCI from United States" },
    { value: "OCI (OVERSEAS CITIZEN OF INDIA) FROM UNITED KINGDOM", label: "OCI from United Kingdom" },
    { value: "OCI (OVERSEAS CITIZEN OF INDIA) FROM CANADA", label: "OCI from Canada" },
    { value: "OCI (OVERSEAS CITIZEN OF INDIA) FROM AUSTRALIA", label: "OCI from Australia" },
    { value: "OCI (OVERSEAS CITIZEN OF INDIA) FROM NEW ZEALAND", label: "OCI from New Zealand" },
    { value: "OCI (OVERSEAS CITIZEN OF INDIA) FROM GERMANY", label: "OCI from Germany" },
    { value: "OCI (OVERSEAS CITIZEN OF INDIA) FROM FRANCE", label: "OCI from France" },
    { value: "OCI (OVERSEAS CITIZEN OF INDIA) FROM ITALY", label: "OCI from Italy" },
    { value: "OCI (OVERSEAS CITIZEN OF INDIA) FROM NETHERLANDS", label: "OCI from Netherlands" },
    { value: "OCI (OVERSEAS CITIZEN OF INDIA) FROM JAPAN", label: "OCI from Japan" },
    { value: "OCI (OVERSEAS CITIZEN OF INDIA) FROM SOUTH KOREA", label: "OCI from South Korea" },
    { value: "OCI (OVERSEAS CITIZEN OF INDIA) FROM UAE", label: "OCI from UAE" },
    { value: "OCI (OVERSEAS CITIZEN OF INDIA) FROM SAUDI ARABIA", label: "OCI from Saudi Arabia" },
    { value: "OCI (OVERSEAS CITIZEN OF INDIA) FROM QATAR", label: "OCI from Qatar" },
    { value: "OCI (OVERSEAS CITIZEN OF INDIA) FROM KUWAIT", label: "OCI from Kuwait" },
    { value: "OCI (OVERSEAS CITIZEN OF INDIA) FROM OMAN", label: "OCI from Oman" },
    { value: "OCI (OVERSEAS CITIZEN OF INDIA) FROM BAHRAIN", label: "OCI from Bahrain" },
    // NRI - Non-Resident Indian
    { value: "NRI (NON-RESIDENT INDIAN) IN UNITED STATES", label: "NRI in United States" },
    { value: "NRI (NON-RESIDENT INDIAN) IN UNITED KINGDOM", label: "NRI in United Kingdom" },
    { value: "NRI (NON-RESIDENT INDIAN) IN CANADA", label: "NRI in Canada" },
    { value: "NRI (NON-RESIDENT INDIAN) IN AUSTRALIA", label: "NRI in Australia" },
    { value: "NRI (NON-RESIDENT INDIAN) IN NEW ZEALAND", label: "NRI in New Zealand" },
    { value: "NRI (NON-RESIDENT INDIAN) IN GERMANY", label: "NRI in Germany" },
    { value: "NRI (NON-RESIDENT INDIAN) IN FRANCE", label: "NRI in France" },
    { value: "NRI (NON-RESIDENT INDIAN) IN ITALY", label: "NRI in Italy" },
    { value: "NRI (NON-RESIDENT INDIAN) IN NETHERLANDS", label: "NRI in Netherlands" },
    { value: "NRI (NON-RESIDENT INDIAN) IN JAPAN", label: "NRI in Japan" },
    { value: "NRI (NON-RESIDENT INDIAN) IN SINGAPORE", label: "NRI in Singapore" },
    { value: "NRI (NON-RESIDENT INDIAN) IN MALAYSIA", label: "NRI in Malaysia" },
    { value: "NRI (NON-RESIDENT INDIAN) IN UAE", label: "NRI in UAE" },
    { value: "NRI (NON-RESIDENT INDIAN) IN SAUDI ARABIA", label: "NRI in Saudi Arabia" },
    { value: "NRI (NON-RESIDENT INDIAN) IN QATAR", label: "NRI in Qatar" },
    { value: "NRI (NON-RESIDENT INDIAN) IN KUWAIT", label: "NRI in Kuwait" },
    { value: "NRI (NON-RESIDENT INDIAN) IN OMAN", label: "NRI in Oman" },
    { value: "NRI (NON-RESIDENT INDIAN) IN BAHRAIN", label: "NRI in Bahrain" },
    { value: "NRI (NON-RESIDENT INDIAN) IN SOUTH AFRICA", label: "NRI in South Africa" },
    { value: "NRI (NON-RESIDENT INDIAN) IN MAURITIUS", label: "NRI in Mauritius" },
    // Foreign Nationals
    { value: "FOREIGN NATIONAL", label: "Foreign National" },
    { value: "FOREIGN NATIONAL WITH INDIAN DEGREE", label: "Foreign National with Indian Degree" },
    { value: "FOREIGN NATIONAL WITH INDIAN ORIGIN", label: "Foreign National with Indian Origin" },
];

const staticCasteOptions = [
    { value: "GEN", label: "General (UR)" },
    { value: "OBC", label: "OBC" },
    { value: "SC", label: "SC" },
    { value: "ST", label: "ST" },
    { value: "EWS", label: "EWS" },
];

const staticPwdOptions = [
    { value: "NO", label: "No" },
    { value: "YES", label: "Yes (PwD)" },
];

const staticEducationOptions = [
    { value: "POST DOCTORATE", label: "Post Doctorate" },
    { value: "PHD", label: "PhD" },
    { value: "POST GRADUATION", label: "Post Graduation" },
    { value: "GRADUATION", label: "Graduation" },
    { value: "DIPLOMA / ITI (POLYTECHNIC, ITI, DPHARM, PGDCA)", label: "Diploma / ITI" },
    { value: "(12TH)HIGHER SECONDARY", label: "Higher Secondary (12th)" },
    { value: "(10TH)SECONDARY", label: "Secondary (10th)" },
    { value: "(8TH)CLASS", label: "Class 8th" },
    { value: "(5TH)CLASS", label: "Class 5th" },
    { value: "BELOW 10TH", label: "Below 10th" },
    { value: "NO EDUCATION", label: "No Education" },
];

const staticCourseYearOptions = [
    // Completion Status
    { value: "PASSED", label: "Passed" },
    { value: "APPEARING", label: "Appearing" },
    // Year-wise (for multi-year courses)
    { value: "(6TH YEAR)", label: "6th Year" },
    { value: "(5TH YEAR)", label: "5th Year" },
    { value: "(4TH YEAR)", label: "4th Year" },
    { value: "(3RD YEAR)", label: "3rd Year" },
    { value: "(2ND YEAR)", label: "2nd Year" },
    { value: "(1ST YEAR)", label: "1st Year" },
    // Semester-wise
    { value: "12th Sem", label: "12th Semester" },
    { value: "11th Sem", label: "11th Semester" },
    { value: "10th Sem", label: "10th Semester" },
    { value: "9th Sem", label: "9th Semester" },
    { value: "8th Sem", label: "8th Semester" },
    { value: "7th Sem", label: "7th Semester" },
    { value: "6th Sem", label: "6th Semester" },
    { value: "5th Sem", label: "5th Semester" },
    { value: "4th Sem", label: "4th Semester" },
    { value: "3rd Sem", label: "3rd Semester" },
    { value: "2nd Sem", label: "2nd Semester" },
    { value: "1st Sem", label: "1st Semester" },
];

const staticDomicileOptions = [
    { value: "ANDHRA PRADESH", label: "Andhra Pradesh" },
    { value: "ARUNACHAL PRADESH", label: "Arunachal Pradesh" },
    { value: "ASSAM", label: "Assam" },
    { value: "BIHAR", label: "Bihar" },
    { value: "CHHATTISGARH", label: "Chhattisgarh" },
    { value: "GOA", label: "Goa" },
    { value: "GUJARAT", label: "Gujarat" },
    { value: "HARYANA", label: "Haryana" },
    { value: "HIMACHAL PRADESH", label: "Himachal Pradesh" },
    { value: "JHARKHAND", label: "Jharkhand" },
    { value: "KARNATAKA", label: "Karnataka" },
    { value: "KERALA", label: "Kerala" },
    { value: "MADHYA PRADESH", label: "Madhya Pradesh" },
    { value: "MAHARASHTRA", label: "Maharashtra" },
    { value: "MANIPUR", label: "Manipur" },
    { value: "MEGHALAYA", label: "Meghalaya" },
    { value: "MIZORAM", label: "Mizoram" },
    { value: "NAGALAND", label: "Nagaland" },
    { value: "ODISHA", label: "Odisha" },
    { value: "PUNJAB", label: "Punjab" },
    { value: "RAJASTHAN", label: "Rajasthan" },
    { value: "SIKKIM", label: "Sikkim" },
    { value: "TAMIL NADU", label: "Tamil Nadu" },
    { value: "TELANGANA", label: "Telangana" },
    { value: "TRIPURA", label: "Tripura" },
    { value: "UTTAR PRADESH", label: "Uttar Pradesh" },
    { value: "UTTARAKHAND", label: "Uttarakhand" },
    { value: "WEST BENGAL", label: "West Bengal" },
    { value: "ANDAMAN AND NICOBAR ISLANDS", label: "Andaman and Nicobar Islands" },
    { value: "CHANDIGARH", label: "Chandigarh" },
    { value: "DADRA AND NAGAR HAVELI AND DAMAN AND DIU", label: "Dadra and Nagar Haveli and Daman and Diu" },
    { value: "DELHI", label: "Delhi (NCT)" },
    { value: "JAMMU AND KASHMIR", label: "Jammu and Kashmir" },
    { value: "LADAKH", label: "Ladakh" },
    { value: "LAKSHADWEEP", label: "Lakshadweep" },
    { value: "PUDUCHERRY", label: "Puducherry" },
];

const staticNccWingOptions = [
    { value: "NONE", label: "None / Not in NCC" },
    { value: "ARMY", label: "Army Wing" },
    { value: "NAVY", label: "Navy Wing" },
    { value: "AIR FORCE", label: "Air Force Wing" },
];

const staticNccCertificateOptions = [
    { value: "NONE", label: "None" },
    { value: "A", label: "A Certificate" },
    { value: "B", label: "B Certificate" },
    { value: "C", label: "C Certificate" },
];

const staticNccCertificateGradeOptions = [
    { value: "NONE", label: "None / Not Applicable" },
    { value: "A", label: "Grade A" },
    { value: "B", label: "Grade B" },
    { value: "C", label: "Grade C" },
];

const EDUCATION_HIERARCHY = [
    { key: 'POST DOCTORATE', label: 'Post Doctorate', shortLabel: 'Post Doctorate' },
    { key: 'PHD', label: 'PhD', shortLabel: 'PhD' },
    { key: 'POST GRADUATION', label: 'Post Graduation', shortLabel: 'Post Graduation' },
    { key: 'GRADUATION', label: 'Graduation', shortLabel: 'Graduation' },
    { key: 'DIPLOMA / ITI (POLYTECHNIC, ITI, DPHARM, PGDCA)', label: 'Diploma / ITI', shortLabel: 'Diploma ITI' },
    { key: '(12TH)HIGHER SECONDARY', label: '12th Higher Secondary', shortLabel: '12th Higher Secondary' },
    { key: '(10TH)SECONDARY', label: '10th Secondary', shortLabel: '10th Secondary' },
    { key: '(8TH)CLASS', label: '8th Class', shortLabel: '8th Class' },
    { key: '(5TH)CLASS', label: '5th Class', shortLabel: '5th Class' },
];

const completionStatusOptions = [
    { value: '', label: 'Select' },
    // Completion Status
    { value: 'PASSED', label: 'Passed' },
    { value: 'APPEARING', label: 'Appearing' },
    // Year-wise (for multi-year courses)
    { value: '(6TH YEAR)', label: '6th Year' },
    { value: '(5TH YEAR)', label: '5th Year' },
    { value: '(4TH YEAR)', label: '4th Year' },
    { value: '(3RD YEAR)', label: '3rd Year' },
    { value: '(2ND YEAR)', label: '2nd Year' },
    { value: '(1ST YEAR)', label: '1st Year' },
    // Semester-wise
    { value: '12th Sem', label: '12th Sem' },
    { value: '11th Sem', label: '11th Sem' },
    { value: '10th Sem', label: '10th Sem' },
    { value: '9th Sem', label: '9th Sem' },
    { value: '8th Sem', label: '8th Sem' },
    { value: '7th Sem', label: '7th Sem' },
    { value: '6th Sem', label: '6th Sem' },
    { value: '5th Sem', label: '5th Sem' },
    { value: '4th Sem', label: '4th Sem' },
    { value: '3rd Sem', label: '3rd Sem' },
    { value: '2nd Sem', label: '2nd Sem' },
    { value: '1st Sem', label: '1st Sem' },
];

const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [{ value: '', label: 'Year' }];
    for (let year = currentYear; year >= currentYear - 50; year--) {
        years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
};
const yearOptions = generateYearOptions();

// ============================================
// MAIN COMPONENT
// ============================================

function CheckEligibilityPage() {
    // State for exam selection
    const [examOptions, setExamOptions] = useState([]);
    const [selectedExam, setSelectedExam] = useState("");
    const [examData, setExamData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    // State for exam filters
    const [examFilter, setExamFilter] = useState('');
    const [examCategory, setExamCategory] = useState('ALL');
    
    // State for search mode toggle
    const [searchMode, setSearchMode] = useState('exam'); // 'exam' or 'eligibility'
    
    // State for Important Notice Dialog
    const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);

    // State for divisions
    const [hasDivisions, setHasDivisions] = useState(false);
    const [divisions, setDivisions] = useState([]);

    // State for dropdown options
    const [genderOptions, setGenderOptions] = useState(staticGenderOptions);
    const [maritalStatusOptions, setMaritalStatusOptions] = useState(staticMaritalStatusOptions);
    const [nationalityOptions, setNationalityOptions] = useState(staticNationalityOptions);
    const [casteOptions, setCasteOptions] = useState(staticCasteOptions);
    const [pwdOptions, setPwdOptions] = useState(staticPwdOptions);
    const [educationOptions, setEducationOptions] = useState(staticEducationOptions);
    const [courseOptions, setCourseOptions] = useState([]);
    const [subjectOptions, setSubjectOptions] = useState([]);
    const [courseYearOptions, setCourseYearOptions] = useState(staticCourseYearOptions);
    const [domicileOptions, setDomicileOptions] = useState(staticDomicileOptions);
    const [nccWingOptions, setNccWingOptions] = useState(staticNccWingOptions);
    const [nccCertificateOptions, setNccCertificateOptions] = useState(staticNccCertificateOptions);
    const [nccCertificateGradeOptions, setNccCertificateGradeOptions] = useState(staticNccCertificateGradeOptions);

    // State for mandatory subjects dropdown - now per level
    const [mandatorySubjectOptions, setMandatorySubjectOptions] = useState([]);
    const [selectedMandatorySubjects, setSelectedMandatorySubjects] = useState({}); // { 'GRADUATION': ['STATISTICS'], '12TH': ['MATHEMATICS'] }
    const [subjectWiseMarks, setSubjectWiseMarks] = useState({}); // { 'GRADUATION': { 'STATISTICS': '80' }, '12TH': { 'MATHEMATICS': '65' } }
    const [examRequiresSubjectMarks, setExamRequiresSubjectMarks] = useState(false);

    // State for domicile control
    const [isDomicileDisabled, setIsDomicileDisabled] = useState(true);

    // State for education table
    const [educationTableData, setEducationTableData] = useState({});
    const [visibleEducationLevels, setVisibleEducationLevels] = useState([]);

    // State for form data
    const [formData, setFormData] = useState({
        date_of_birth: "",
        gender: "",
        marital_status: "",
        nationality: "",
        caste_category: "",
        pwd_status: "",
        domicile: "",
        highest_education_qualification: "",
        eligibility_education_course: "",
        eligibility_education_course_subject: "",
        eligibility_course_year: "",
        eligibility_marks: "",
        percentage_10th_requirement: "",
        percentage_12th_requirement: "",
        subjects_at_10th: "",
        subjects_at_12th: "",
        ncc_wing: "",
        ncc_certificate: "",
        ncc_certificate_grade: "",
    });

    // State for results
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [displayDetails, setDisplayDetails] = useState(null);
    
    // State for eligibility basis mode
    const [eligibilityBasisResults, setEligibilityBasisResults] = useState(null);
    const [checkingProgress, setCheckingProgress] = useState({ current: 0, total: 0, examName: '' });

    // Ref for scrolling to results
    const resultsRef = useRef(null);

    // State for date picker (separate day, month, year)
    const [dateDay, setDateDay] = useState("");
    const [dateMonth, setDateMonth] = useState("");
    const [dateYear, setDateYear] = useState("");

    // Generate options for date picker
    const dayOptions = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1).padStart(2, '0'), label: String(i + 1) }));
    const monthOptions = [
        { value: '01', label: 'January' },
        { value: '02', label: 'February' },
        { value: '03', label: 'March' },
        { value: '04', label: 'April' },
        { value: '05', label: 'May' },
        { value: '06', label: 'June' },
        { value: '07', label: 'July' },
        { value: '08', label: 'August' },
        { value: '09', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];
    const currentYear = new Date().getFullYear();
    const birthYearOptions = Array.from({ length: 100 }, (_, i) => ({
        value: String(currentYear - 15 - i),
        label: String(currentYear - 15 - i)
    }));

    // ============================================
    // LOCK PAGE SCROLL (only for this route)
    // ============================================

    // ============================================
    // LOAD DATA ON MOUNT
    // ============================================

    useEffect(() => {
        let cancelled = false;

        const loadExamOptions = async () => {
            try {
                await ensureExamCatalogLoaded();
                const options = getExamDropdownOptions();

                if (!cancelled) {
                    setExamOptions(options);
                    setError("");
                }
            } catch (err) {
                console.error('Failed to load exam catalog:', err);
                if (cancelled) return;

                setError('Failed to load exams. Please try again later.');
            }
        };

        loadExamOptions();

        return () => {
            cancelled = true;
        };
    }, []);

    // Filter exam options based on search and category
    const filteredExamOptions = examOptions.filter(option => {
        // Filter by search text
        const matchesSearch = option.label.toLowerCase().includes(examFilter.toLowerCase());
        
        // Filter by category
        let matchesCategory = true;
        if (examCategory !== 'ALL') {
            // Extract category from exam name (e.g., SSC, UPSC, Railway, etc.)
            const examLabel = option.label.toUpperCase();
            matchesCategory = examLabel.includes(examCategory.toUpperCase());
        }
        
        return matchesSearch && matchesCategory;
    });

    // Extract unique categories from exam options
    const examCategories = ['ALL', ...Array.from(new Set(
        examOptions.map(option => {
            const label = option.label.toUpperCase();
            if (label.includes('SSC')) return 'SSC';
            if (label.includes('UPSC') || label.includes('CIVIL')) return 'UPSC';
            if (label.includes('RAILWAY') || label.includes('RRB')) return 'RAILWAY';
            if (label.includes('BANKING') || label.includes('BANK')) return 'BANKING';
            if (label.includes('DEFENCE') || label.includes('NDA') || label.includes('CDS')) return 'DEFENCE';
            if (label.includes('STATE') || label.includes('PSC')) return 'STATE PSC';
            if (label.includes('GATE') || label.includes('ENGINEERING')) return 'ENGINEERING';
            if (label.includes('POLICE')) return 'POLICE';
            if (label.includes('TEACHING') || label.includes('TET')) return 'TEACHING';
            return 'OTHER';
        })
    )).filter(Boolean)];

    useEffect(() => {
        const loadEducationData = async () => {
            try {
                await loadEduFinalData();
                console.log('edu_final.json loaded successfully');
            } catch (error) {
                console.error('Failed to load edu_final.json:', error);
            }
        };
        loadEducationData();
    }, []);

    // ============================================
    // HANDLERS
    // ============================================

    const handleExamChange = useCallback(async (event) => {
        const examCode = event.target.value;
        setSelectedExam(examCode);
        setResults([]);
        setShowResults(false);
        setError("");
        
        // Reset form data
        setFormData(prev => ({
            ...prev,
            gender: "",
            marital_status: "",
            nationality: "",
            caste_category: "",
            pwd_status: "",
            domicile: "",
            highest_education_qualification: "",
            eligibility_education_course: "",
            eligibility_education_course_subject: "",
            eligibility_course_year: "",
            eligibility_marks: "",
            ncc_wing: "",
            ncc_certificate: "",
            ncc_certificate_grade: "",
        }));
        
        setIsDomicileDisabled(true);

        if (!examCode) {
            setExamData(null);
            setHasDivisions(false);
            setDivisions([]);
            setDisplayDetails(null);
            setGenderOptions(staticGenderOptions);
            setMaritalStatusOptions(staticMaritalStatusOptions);
            setNationalityOptions(staticNationalityOptions);
            setCasteOptions(staticCasteOptions);
            setMandatorySubjectOptions([]);
            setSelectedMandatorySubjects([]);
            setSubjectWiseMarks({});
            setExamRequiresSubjectMarks(false);
            return;
        }

        setLoading(true);
        const result = await loadExamDataForBasis(examCode, examOptions);
        
        if (result.error) {
            setError(result.error);
            setLoading(false);
            return;
        }

        setExamData(result.examData);
        setDisplayDetails(result.displayDetails);
        setHasDivisions(result.hasDivisions);
        setDivisions(result.divisions);

        // Set options
        setGenderOptions(staticGenderOptions);
        setPwdOptions(staticPwdOptions);
        setEducationOptions(staticEducationOptions);

        // Extract caste options from exam data
        const casteValues = extractOptionsFromExamData(result.examData, 'caste_category');
        if (casteValues.length > 0) {
            setCasteOptions(valuesToOptions(casteValues, {
                'GEN': 'GENERAL (UR/UNRESERVED)',
                'SC': 'SC (SCHEDULED CASTE)',
                'ST': 'ST (SCHEDULED TRIBE)',
                'OBC': 'OBC (OTHER BACKWARD CLASS)',
                'EWS': 'EWS (ECONOMICALLY WEAKER SECTION)',
            }));
        } else {
            setCasteOptions(staticCasteOptions);
        }

        // Nationality options - always use static options (like gender)
        // The checker will validate against exam JSON requirements
        setNationalityOptions(staticNationalityOptions);

        // Extract mandatory subjects from exam data
        const mandatorySubjects = extractMandatorySubjectsFromExamData(result.examData);
        // Build options: ALL, NO, and dynamic subjects
        const subjectOptions = [
            { value: 'ALL', label: 'ALL (Studied All Subjects)' },
            { value: 'NO', label: 'NO (Haven\'t Studied Any)' },
            ...mandatorySubjects.map(subject => ({
                value: subject,
                label: subject.charAt(0) + subject.slice(1).toLowerCase()
            }))
        ];
        setMandatorySubjectOptions(subjectOptions);
        // Reset selected subjects and marks when exam changes
        setSelectedMandatorySubjects([]);
        setSubjectWiseMarks({});
        
        // Check if exam requires marks for mandatory subjects
        const requiresMarks = checkIfExamRequiresSubjectMarks(result.examData);
        setExamRequiresSubjectMarks(requiresMarks);

        setLoading(false);
    }, [examOptions]);

    const handleChange = (field) => (event) => {
        const newValue = event.target.value;
        setFormData(prev => ({ ...prev, [field]: newValue }));
        setShowResults(false);
        
        if (field === 'gender') {
            const newMaritalOptions = getMaritalStatusOptionsForGender(newValue);
            setMaritalStatusOptions(newMaritalOptions);
            const isValidMaritalStatus = newMaritalOptions.some(opt => opt.value === formData.marital_status);
            if (!isValidMaritalStatus && formData.marital_status) {
                setFormData(prev => ({ ...prev, marital_status: '' }));
            }
        }
        
        if (field === 'nationality') {
            const isIndian = newValue && newValue.toUpperCase() === 'INDIAN';
            setIsDomicileDisabled(!isIndian);
            if (!isIndian) {
                setFormData(prev => ({ ...prev, domicile: '' }));
            }
        }
    };

    // Handle date component changes
    const handleDateChange = (part) => (event) => {
        const value = event.target.value;
        if (part === 'day') setDateDay(value);
        if (part === 'month') setDateMonth(value);
        if (part === 'year') setDateYear(value);
        
        // Update formData if all parts are filled
        const day = part === 'day' ? value : dateDay;
        const month = part === 'month' ? value : dateMonth;
        const year = part === 'year' ? value : dateYear;
        
        if (day && month && year) {
            const dateString = `${year}-${month}-${day}`;
            setFormData(prev => ({ ...prev, date_of_birth: dateString }));
        } else {
            setFormData(prev => ({ ...prev, date_of_birth: '' }));
        }
        setShowResults(false);
    };

    // ============================================
    // MOCK DATA FILL FUNCTION
    // ⚠️ EDIT THIS SECTION TO CUSTOMIZE MOCK DATA
    // ============================================
    const fillMockData = () => {
        // ========== DATE OF BIRTH ==========
        // Format: DD, MM, YYYY
        setDateDay('03');
        setDateMonth('07');
        setDateYear('2003');
        
        // ========== PERSONAL INFORMATION ==========
        // You can change any of these values
        setFormData(prev => ({
            ...prev,
            date_of_birth: '2003-07-03',
            gender: 'MALE',                    // Options: MALE, FEMALE, TRANSGENDER
            marital_status: 'UNMARRIED',       // Options: UNMARRIED, MARRIED, SEPARATED, DIVORCED, DIVORCEE, WIDOW, WIDOWER
            nationality: 'INDIAN',             // Options: INDIAN, CITIZEN OF NEPAL, etc.
            caste_category: 'GEN',             // Options: GEN, SC, ST, OBC, EWS
            pwd_status: 'NO',                  // Options: YES, NO
            domicile: 'DELHI',                 // Any Indian state
            highest_education_qualification: 'GRADUATION',  // Options: GRADUATION, POST GRADUATION, 12TH, 10TH, etc.
            eligibility_education_course: 'BTech',  // Must match dropdown values (BTech, not B.TECH)
            eligibility_education_course_subject: 'Computer Science & Engineering',  // Must match dropdown
            eligibility_course_year: 'PASSED',
            eligibility_marks: '85',
            ncc_wing: 'ARMY',                  // Options: NONE, ARMY, NAVY, AIR FORCE
            ncc_certificate: 'NONE',           // Options: NONE, A, B, C
            ncc_certificate_grade: 'NONE',     // Options: NONE, A, B, C
        }));
        
        setIsDomicileDisabled(false);
        const newMaritalOptions = getMaritalStatusOptionsForGender('MALE');
        setMaritalStatusOptions(newMaritalOptions);
        
        // ========== EDUCATION TABLE SETUP ==========
        const graduationLevel = 'GRADUATION';
        
        // Set visible education levels based on highest qualification
        const levelIndex = EDUCATION_HIERARCHY.findIndex(h => h.key === graduationLevel);
        if (levelIndex !== -1) {
            const visibleLevels = EDUCATION_HIERARCHY.slice(levelIndex);
            setVisibleEducationLevels(visibleLevels);
            
            // ========== EDUCATION TABLE DATA ==========
            // ⚠️ CUSTOMIZE YOUR EDUCATION DETAILS HERE
            const mockEducationData = {};
            
            // Fill each visible level with mock data
            visibleLevels.forEach(lvl => {
                if (lvl.key === 'GRADUATION') {
                    mockEducationData[lvl.key] = {
                        course: 'BTech',                           // MUST match exact case from dropdown
                        subject: 'Computer Science & Engineering', // MUST match exact case from dropdown
                        haveStudied: 'YES',                        // YES or NO
                        completionStatus: 'PASSED',                // PASSED, APPEARING, 1ST YEAR, 2ND YEAR, etc.
                        marks: '75',                               // Percentage (0-100)
                        completedYear: '2023',                     // Year of completion
                        activeBacklogs: '0'                        // Number of active backlogs
                    };
                } else if (lvl.key === '(12TH)HIGHER SECONDARY') {
                    mockEducationData[lvl.key] = {
                        course: 'Science',                         // MUST match exact case: Science, Commerce, Arts
                        subject: 'Physics, Chemistry, Mathematics (PCM)', // MUST match exact format
                        haveStudied: 'YES',
                        completionStatus: 'PASSED',
                        marks: '85',
                        completedYear: '2018',
                        activeBacklogs: '0'
                    };
                } else if (lvl.key === '(10TH)SECONDARY') {
                    mockEducationData[lvl.key] = {
                        course: '(10TH) SECONDARY',                // Standard 10th course
                        subject: 'Science, Mathematics, Social Science, Languages',
                        haveStudied: 'YES',
                        completionStatus: 'PASSED',
                        marks: '80',
                        completedYear: '2016',
                        activeBacklogs: '0'
                    };
                } else {
                    // Initialize other levels with empty data
                    mockEducationData[lvl.key] = {
                        course: '',
                        subject: '',
                        haveStudied: '',
                        completionStatus: '',
                        marks: '',
                        completedYear: '',
                        activeBacklogs: ''
                    };
                }
            });
            
            setEducationTableData(mockEducationData);
            
            // Set course and subject options for the main qualification level
            const courses = getCoursesForLevel(graduationLevel);
            setCourseOptions(courses);
            const subjects = getSubjectsForCourse('BTech', graduationLevel);
            setSubjectOptions(subjects);
        }
    };
    // ============================================
    // END OF MOCK DATA SECTION
    // ============================================
    
    const handleEducationLevelChange = (event) => {
        const level = event.target.value;
        
        setFormData(prev => ({ 
            ...prev, 
            highest_education_qualification: level,
            eligibility_education_course: "",
            eligibility_education_course_subject: ""
        }));
        setShowResults(false);
        
        const courses = getCoursesForLevel(level);
        setCourseOptions(courses);
        setSubjectOptions([]);
        
        const levelIndex = EDUCATION_HIERARCHY.findIndex(h => h.key === level);
        if (levelIndex !== -1) {
            const visibleLevels = EDUCATION_HIERARCHY.slice(levelIndex);
            setVisibleEducationLevels(visibleLevels);
            
            const initialTableData = {};
            visibleLevels.forEach(lvl => {
                if (!educationTableData[lvl.key]) {
                    initialTableData[lvl.key] = {
                        course: '',
                        subject: '',
                        completionStatus: '',
                        marks: '',
                        completedYear: ''
                    };
                } else {
                    initialTableData[lvl.key] = educationTableData[lvl.key];
                }
            });
            setEducationTableData(initialTableData);
        } else {
            setVisibleEducationLevels([]);
            setEducationTableData({});
        }
    };
    
    const handleEducationTableChange = (levelKey, field, value) => {
        setEducationTableData(prev => ({
            ...prev,
            [levelKey]: {
                ...prev[levelKey],
                [field]: value,
                ...(field === 'course' ? { subject: '' } : {})
            }
        }));
        setShowResults(false);
        
        if (levelKey === formData.highest_education_qualification) {
            if (field === 'course') {
                setFormData(prev => ({
                    ...prev,
                    eligibility_education_course: value,
                    eligibility_education_course_subject: ''
                }));
                const subjects = getSubjectsForCourse(value, levelKey);
                setSubjectOptions(subjects);
            } else if (field === 'subject') {
                setFormData(prev => ({
                    ...prev,
                    eligibility_education_course_subject: value
                }));
            } else if (field === 'completionStatus') {
                setFormData(prev => ({
                    ...prev,
                    eligibility_course_year: value
                }));
            } else if (field === 'marks') {
                setFormData(prev => ({
                    ...prev,
                    eligibility_marks: value
                }));
            }
        }
        
        if (levelKey === '(10TH)SECONDARY') {
            if (field === 'marks') {
                setFormData(prev => ({ ...prev, percentage_10th_requirement: value }));
            } else if (field === 'subject') {
                setFormData(prev => ({ ...prev, subjects_at_10th: value }));
            }
        } else if (levelKey === '(12TH)HIGHER SECONDARY') {
            if (field === 'marks') {
                setFormData(prev => ({ ...prev, percentage_12th_requirement: value }));
            } else if (field === 'subject') {
                setFormData(prev => ({ ...prev, subjects_at_12th: value }));
            }
        }
    };
    
    const getCourseOptionsForLevel = (levelKey) => {
        return getCoursesForLevel(levelKey);
    };
    
    const getSubjectOptionsForCourse = (course, levelKey = null) => {
        return getSubjectsForCourse(course, levelKey);
    };

    // ============================================
    // CHECK ELIGIBILITY
    // ============================================

    const handleCheckEligibility = () => {
        setError("");

        if (searchMode === 'exam') {
            // Exam Basis Mode
            if (!selectedExam) {
                setError("Please select a target exam");
                return;
            }
            if (!formData.date_of_birth) {
                setError("Please enter your date of birth");
                return;
            }
            if (!examData) {
                setError("Exam data not loaded");
                return;
            }

            // Include selected mandatory subjects and their marks in form data
            const formDataWithMandatorySubjects = {
                ...formData,
                studiedMandatorySubjects: selectedMandatorySubjects,
                subjectWiseMarks: subjectWiseMarks
            };

            const userInput = prepareUserInput(formDataWithMandatorySubjects, educationTableData, examData);
            const allResults = checkExamBasisEligibility(userInput, examData, hasDivisions, divisions, selectedExam);
            
            setResults(allResults);
            setShowResults(true);
        } else {
            // Eligibility Basis Mode
            if (!formData.date_of_birth) {
                setError("Please enter your date of birth");
                return;
            }
            
            setLoading(true);
            setCheckingProgress({ current: 0, total: examOptions.length, examName: '' });
            
            checkEligibilityBasis(formData, educationTableData, (examName, current, total) => {
                setCheckingProgress({ current, total, examName });
            }).then(result => {
                // Store full results for eligibility basis (now contains tableRows, years, etc.)
                setEligibilityBasisResults(result);
                
                // Get summary grouped by exam (for backward compatibility)
                const summary = getEligibleExamsSummary(result);
                setResults(summary);
                setShowResults(true);
                setLoading(false);
                setCheckingProgress({ current: 0, total: 0, examName: '' });
            }).catch(err => {
                setError("Error checking eligibility: " + err.message);
                setLoading(false);
                setCheckingProgress({ current: 0, total: 0, examName: '' });
            });
        }
        
        // Scroll to results
        setTimeout(() => {
            if (resultsRef.current) {
                resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    // ============================================
    // PDF DOWNLOAD FUNCTION
    // ============================================
    
    const downloadPDF = () => {
        if (!eligibilityBasisResults) return;
        
        const { tableRows, years, totalExamsChecked, eligibleCount, ineligibleCount, uniqueExamDivisions } = eligibilityBasisResults;
        
        const doc = new jsPDF('landscape', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 15;
        
        // Title
        doc.setFontSize(18);
        doc.setTextColor(79, 70, 229); // Indigo
        doc.text('Pariksha Yogya - Eligibility Report', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
        
        // Date
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        
        // User Details Section
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        doc.setFont(undefined, 'bold');
        doc.text('Your Details:', 14, yPos);
        yPos += 6;
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        
        // Personal Information
        const personalInfo = [
            ['Date of Birth', formData.date_of_birth || 'Not provided'],
            ['Gender', formData.gender || 'Not provided'],
            ['Marital Status', formData.marital_status || 'Not provided'],
            ['Nationality', formData.nationality || 'Not provided'],
            ['Domicile State', formData.domicile || 'Not provided'],
            ['Caste/Category', formData.caste_category || 'Not provided'],
            ['PWD Status', formData.pwd_status || 'Not provided'],
        ];
        
        // Draw personal info in 2 columns
        const colWidth = 70;
        let col = 0;
        let startY = yPos;
        
        personalInfo.forEach((item, idx) => {
            const xPos = 14 + (col * colWidth);
            doc.setFont(undefined, 'bold');
            doc.text(`${item[0]}:`, xPos, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(` ${item[1]}`, xPos + 28, yPos);
            
            if (col === 0) {
                col = 1;
            } else {
                col = 0;
                yPos += 5;
            }
        });
        
        if (col === 1) yPos += 5;
        yPos += 3;
        
        // Education Details
        doc.setFont(undefined, 'bold');
        doc.text(`Highest Education: ${formData.highest_education_qualification || 'Not provided'}`, 14, yPos);
        yPos += 7;
        
        // Education Table Details
        const educationLevels = Object.keys(educationTableData);
        if (educationLevels.length > 0) {
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text('Education Details:', 14, yPos);
            yPos += 5;
            
            // Draw education table header
            doc.setFillColor(229, 231, 235); // Gray-200
            doc.rect(14, yPos, pageWidth - 28, 6, 'F');
            doc.setFontSize(7);
            doc.setTextColor(55, 65, 81);
            
            const eduColWidths = [45, 50, 40, 40, 20, 25, 30]; // Level, Course, Subject, Status, Marks, Year, Backlogs
            let eduXPos = 16;
            ['Level', 'Course/Stream', 'Subject', 'Status', 'Marks', 'Year', 'Backlogs'].forEach((header, idx) => {
                doc.text(header, eduXPos, yPos + 4);
                eduXPos += eduColWidths[idx];
            });
            yPos += 6;
            
            doc.setFont(undefined, 'normal');
            doc.setTextColor(30, 30, 30);
            doc.setFontSize(7);
            
            // Draw education rows
            educationLevels.forEach((levelKey, idx) => {
                const levelData = educationTableData[levelKey];
                if (!levelData) return;
                
                // Alternate row background
                if (idx % 2 === 0) {
                    doc.setFillColor(249, 250, 251);
                    doc.rect(14, yPos - 1, pageWidth - 28, 5, 'F');
                }
                
                eduXPos = 16;
                
                // Level name (shortened)
                const levelInfo = EDUCATION_HIERARCHY.find(h => h.key === levelKey);
                const levelName = levelInfo ? levelInfo.shortLabel : levelKey;
                doc.text(levelName.substring(0, 20), eduXPos, yPos + 2);
                eduXPos += eduColWidths[0];
                
                // Course
                const course = levelData.course || '-';
                doc.text(course.substring(0, 25), eduXPos, yPos + 2);
                eduXPos += eduColWidths[1];
                
                // Subject
                const subject = levelData.subject || '-';
                doc.text(subject.substring(0, 20), eduXPos, yPos + 2);
                eduXPos += eduColWidths[2];
                
                // Status
                const status = levelData.completionStatus || '-';
                doc.text(status.substring(0, 18), eduXPos, yPos + 2);
                eduXPos += eduColWidths[3];
                
                // Marks
                const marks = levelData.marks ? `${levelData.marks}%` : '-';
                doc.text(marks, eduXPos, yPos + 2);
                eduXPos += eduColWidths[4];
                
                // Year
                const year = levelData.completedYear || '-';
                doc.text(year, eduXPos, yPos + 2);
                eduXPos += eduColWidths[5];
                
                // Active Backlogs
                const backlogs = levelData.activeBacklogs || '-';
                doc.text(backlogs, eduXPos, yPos + 2);
                
                yPos += 5;
            });
            
            yPos += 3;
        }
        
        // NCC Details
        if (formData.ncc_wing || formData.ncc_certificate || formData.ncc_certificate_grade) {
            doc.text('NCC Details:', 14, yPos);
            yPos += 5;
            doc.setFont(undefined, 'normal');
            const nccText = `Wing: ${formData.ncc_wing || 'N/A'} | Certificate: ${formData.ncc_certificate || 'N/A'} | Grade: ${formData.ncc_certificate_grade || 'N/A'}`;
            doc.text(nccText, 14, yPos);
            yPos += 8;
        }
        
        // Summary Stats
        yPos += 2;
        doc.setFillColor(240, 240, 250);
        doc.rect(14, yPos - 4, pageWidth - 28, 12, 'F');
        doc.setFont(undefined, 'bold');
        doc.setFontSize(10);
        doc.text(`Summary: ${totalExamsChecked} Exams Checked | ${uniqueExamDivisions} Exam/Divisions | ${eligibleCount} Eligible Sessions | ${ineligibleCount} Not Eligible`, 20, yPos + 3);
        
        // Start new page for Results Table
        doc.addPage();
        yPos = 15;
        
        // Table Header
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text('Eligibility Results - Year-wise Analysis', 14, yPos);
        yPos += 6;
        
        // Calculate column widths
        const examColWidth = 55;
        const yearColWidth = (pageWidth - 28 - examColWidth) / years.length;
        
        // Draw table header
        doc.setFillColor(55, 65, 81); // Gray-800
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text('Exam / Division', 16, yPos + 5.5);
        
        years.forEach((year, idx) => {
            const xPos = 14 + examColWidth + (idx * yearColWidth) + (yearColWidth / 2);
            doc.text(year, xPos, yPos + 5.5, { align: 'center' });
        });
        
        yPos += 8;
        doc.setTextColor(30, 30, 30);
        
        // Draw table rows
        tableRows.forEach((row, rowIndex) => {
            // Check if we need a new page
            if (yPos > pageHeight - 20) {
                doc.addPage();
                yPos = 15;
                
                // Redraw header on new page
                doc.setFillColor(55, 65, 81);
                doc.rect(14, yPos, pageWidth - 28, 8, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(9);
                doc.setFont(undefined, 'bold');
                doc.text('Exam / Division', 16, yPos + 5.5);
                years.forEach((year, idx) => {
                    const xPos = 14 + examColWidth + (idx * yearColWidth) + (yearColWidth / 2);
                    doc.text(year, xPos, yPos + 5.5, { align: 'center' });
                });
                yPos += 8;
                doc.setTextColor(30, 30, 30);
            }
            
            // Alternate row background
            if (rowIndex % 2 === 0) {
                doc.setFillColor(249, 250, 251);
                doc.rect(14, yPos, pageWidth - 28, 7, 'F');
            }
            
            // Exam name
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);
            const displayName = row.displayName.length > 30 ? row.displayName.substring(0, 30) + '...' : row.displayName;
            doc.text(displayName, 16, yPos + 4.5);
            
            // Year columns
            years.forEach((year, idx) => {
                const xPos = 14 + examColWidth + (idx * yearColWidth) + (yearColWidth / 2);
                const yearData = row.yearData[year];
                
                if (!yearData || yearData.totalSessions === 0) {
                    doc.setTextColor(180, 180, 180);
                    doc.text('-', xPos, yPos + 4.5, { align: 'center' });
                } else if (row.examFrequency > 1 || yearData.totalSessions > 1) {
                    // Multi-session - draw colored circle + text
                    if (yearData.eligibleSessions === 0) {
                        // Red circle for not eligible
                        doc.setFillColor(239, 68, 68);
                        doc.circle(xPos - 8, yPos + 3.5, 2, 'F');
                        doc.setTextColor(239, 68, 68);
                        doc.text(`${yearData.eligibleSessions}/${yearData.totalSessions}`, xPos + 2, yPos + 4.5, { align: 'center' });
                    } else if (yearData.eligibleSessions === yearData.totalSessions) {
                        // Green circle for fully eligible
                        doc.setFillColor(34, 197, 94);
                        doc.circle(xPos - 8, yPos + 3.5, 2, 'F');
                        doc.setTextColor(34, 197, 94);
                        doc.text(`${yearData.eligibleSessions}/${yearData.totalSessions}`, xPos + 2, yPos + 4.5, { align: 'center' });
                    } else {
                        // Yellow/Orange circle for partial
                        doc.setFillColor(234, 179, 8);
                        doc.circle(xPos - 8, yPos + 3.5, 2, 'F');
                        doc.setTextColor(180, 130, 8);
                        doc.text(`${yearData.eligibleSessions}/${yearData.totalSessions}`, xPos + 2, yPos + 4.5, { align: 'center' });
                    }
                } else {
                    // Single session - draw colored circle
                    if (yearData.eligible) {
                        doc.setFillColor(34, 197, 94); // Green
                        doc.circle(xPos, yPos + 3.5, 2.5, 'F');
                    } else {
                        doc.setFillColor(239, 68, 68); // Red
                        doc.circle(xPos, yPos + 3.5, 2.5, 'F');
                    }
                }
                doc.setTextColor(30, 30, 30);
            });
            
            yPos += 7;
        });
        
        // Legend at bottom
        yPos += 5;
        if (yPos > pageHeight - 15) {
            doc.addPage();
            yPos = 15;
        }
        
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        
        // Draw legend with colored circles
        doc.setFillColor(34, 197, 94);
        doc.circle(18, yPos - 1, 2, 'F');
        doc.text('= Eligible', 22, yPos);
        
        doc.setFillColor(239, 68, 68);
        doc.circle(58, yPos - 1, 2, 'F');
        doc.text('= Not Eligible', 62, yPos);
        
        doc.setFillColor(234, 179, 8);
        doc.circle(108, yPos - 1, 2, 'F');
        doc.text('= Partially Eligible', 112, yPos);
        
        doc.text('| X/Y = Eligible sessions / Total sessions per year', 160, yPos);
        
        // Footer
        doc.setFontSize(7);
        doc.text('Generated by Pariksha Yogya - www.parikshayogya.com', pageWidth / 2, pageHeight - 8, { align: 'center' });
        
        // Save the PDF
        const fileName = `Eligibility_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    };

    // ============================================
    // RENDER FUNCTIONS
    // ============================================

    // Render for Exam Basis Mode
    const renderExamBasisSummary = () => {
        if (!showResults || results.length === 0) return null;

        const eligibleCount = results.filter(r => r.eligible).length;
        const notEligibleCount = results.length - eligibleCount;

        return (
            <div className="bg-[#2B1E17]/40 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden h-fit">
                <h3 className="bg-[#2B1E17]/50 text-[#FBF6EE] px-3 py-2 font-semibold text-sm">
                    📋 Results Summary
                </h3>
                
                <div className="p-2 sm:p-3">
                    <p className="text-sm text-[#FBF6EE]/60 mb-2">
                        {examData?.exam_name || selectedExam}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                        <div className="text-center px-2 py-1 bg-green-500/15 rounded-lg flex-1">
                            <p className="text-lg font-bold text-green-400">{eligibleCount}</p>
                            <p className="text-sm text-green-300">Eligible</p>
                        </div>
                        <div className="text-center px-2 py-1 bg-red-500/15 rounded-lg flex-1">
                            <p className="text-lg font-bold text-red-400">{notEligibleCount}</p>
                            <p className="text-sm text-red-300">Not Eligible</p>
                        </div>
                    </div>
                    <p className="text-sm text-[#FBF6EE]/50 mt-2">
                        Checked {results.length} combination(s)
                    </p>
                </div>

                <div
                    className="overflow-x-auto max-h-[320px] sm:max-h-[350px] overflow-y-auto"
                    style={thinScrollbarStyle}
                >
                    <table className="w-full min-w-[320px]">
                        <thead className="bg-[#2B1E17]/50 sticky top-0">
                            <tr>
                                <th className="px-2 sm:px-3 py-2 text-left text-sm sm:text-base text-[#FBF6EE]/70">Division</th>
                                <th className="px-2 sm:px-3 py-2 text-left text-sm sm:text-base text-[#FBF6EE]/70">Session</th>
                                <th className="px-2 sm:px-3 py-2 text-center text-sm sm:text-base text-[#FBF6EE]/70">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((result, index) => (
                                <tr 
                                    key={index} 
                                    className={`border-b border-white/10 hover:bg-[#2B1E17]/40 ${result.eligible ? '' : 'bg-red-500/5'}`}
                                >
                                    <td className="px-2 sm:px-3 py-2 text-sm sm:text-base">
                                        <span className="font-semibold text-[#E4572E]">{result.division}</span>
                                    </td>
                                    <td className="px-2 sm:px-3 py-2 text-sm sm:text-base text-[#FBF6EE]/70">{result.session}</td>
                                    <td className="px-2 sm:px-3 py-2 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <Chip
                                                label={result.eligible ? "✓" : "✗"}
                                                color={result.eligible ? "success" : "error"}
                                                size="small"
                                            />
                                            {result.eligibleWithRelaxation && (
                                                <span className="text-sm bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                                                    Age Relaxation
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // Render for Eligibility Basis Mode - Unified Table View
    const renderEligibilityBasisSummary = () => {
        if (!showResults || !eligibilityBasisResults) return null;

        const { tableRows, years, totalExamsChecked, eligibleCount, ineligibleCount, uniqueExamDivisions } = eligibilityBasisResults;

        // Helper function to render cell content
        const renderCellContent = (yearData, examFrequency) => {
            if (!yearData) {
                // No data for this year - show dash
                return (
                    <span className="text-gray-300 text-base">—</span>
                );
            }

            const { eligible, eligibleSessions, totalSessions } = yearData;

            if (totalSessions === 0) {
                return <span className="text-gray-300 text-base">—</span>;
            }

            // For exams with multiple sessions per year
            if (examFrequency > 1 || totalSessions > 1) {
                if (eligibleSessions === 0) {
                    // Not eligible for any session
                    return (
                        <div className="flex flex-col items-center leading-tight">
                            <span className="text-red-500 text-base font-bold">✗</span>
                            <span className="text-sm text-red-400">{eligibleSessions}/{totalSessions}</span>
                        </div>
                    );
                } else if (eligibleSessions === totalSessions) {
                    // Eligible for all sessions
                    return (
                        <div className="flex flex-col items-center leading-tight">
                            <span className="text-green-500 text-base font-bold">✓</span>
                            <span className="text-sm text-green-600">{eligibleSessions}/{totalSessions}</span>
                        </div>
                    );
                } else {
                    // Partially eligible
                    return (
                        <div className="flex flex-col items-center leading-tight">
                            <span className="text-yellow-500 text-base font-bold">◐</span>
                            <span className="text-sm text-yellow-600">{eligibleSessions}/{totalSessions}</span>
                        </div>
                    );
                }
            }

            // Single session exam
            if (eligible) {
                return <span className="text-green-500 text-lg font-bold">✓</span>;
            } else {
                return <span className="text-red-500 text-lg font-bold">✗</span>;
            }
        };

        return (
            <div className="bg-[#2B1E17]/40 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-[#E4572E]/40">
                <h3 className="bg-[#E4572E]/20 text-[#FBF6EE] px-2 py-1.5 font-semibold text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-sm sm:text-base">📊 Eligibility Results - Year-wise Analysis</span>
                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                        <div className="hidden sm:flex gap-1 text-sm">
                            <span className="bg-white/20 px-1.5 py-0.5 rounded">✓ Eligible</span>
                            <span className="bg-white/20 px-1.5 py-0.5 rounded">✗ Not Eligible</span>
                            <span className="bg-white/20 px-1.5 py-0.5 rounded">◐ Partial</span>
                        </div>
                        <button
                            onClick={downloadPDF}
                            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-sm font-medium transition-colors ml-auto"
                            title="Download as PDF"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            PDF
                        </button>
                    </div>
                </h3>
                
                <div className="p-2 bg-[#E4572E]/5 border-b border-[#E4572E]/20">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        <div className="text-center px-2 py-1 bg-blue-500/15 rounded-lg">
                            <p className="text-lg font-bold text-blue-400">{totalExamsChecked}</p>
                            <p className="text-sm text-blue-300">Exams Checked</p>
                        </div>
                        <div className="text-center px-2 py-1 bg-purple-500/15 rounded-lg">
                            <p className="text-lg font-bold text-purple-400">{uniqueExamDivisions}</p>
                            <p className="text-sm text-purple-300">Exam/Divisions</p>
                        </div>
                        <div className="text-center px-2 py-1 bg-green-500/15 rounded-lg">
                            <p className="text-lg font-bold text-green-400">{eligibleCount}</p>
                            <p className="text-sm text-green-300">Eligible Sessions</p>
                        </div>
                        <div className="text-center px-2 py-1 bg-red-500/15 rounded-lg">
                            <p className="text-lg font-bold text-red-400">{ineligibleCount}</p>
                            <p className="text-sm text-red-300">Not Eligible</p>
                        </div>
                    </div>
                </div>

                <div
                    className="sm:hidden overflow-y-auto max-h-[520px] p-2 space-y-2"
                    style={thinScrollbarStyle}
                >
                    {tableRows.length === 0 ? (
                        <div className="px-2 py-4 text-center text-[#FBF6EE]/50">
                            <p className="text-sm">No exams found to display.</p>
                        </div>
                    ) : (
                        tableRows.map((row, index) => (
                            <div
                                key={row.rowKey}
                                className={`rounded-lg border border-white/10 p-2 ${index % 2 === 0 ? 'bg-[#2B1E17]/40' : 'bg-white/[0.02]'}`}
                            >
                                <div className="flex flex-col leading-tight">
                                    <span className="font-semibold text-sm text-[#FBF6EE]">{row.displayName}</span>
                                    {row.displayDetails?.conducting_body && (
                                        <span className="text-sm text-[#FBF6EE]/50 mt-0.5">
                                            {row.displayDetails.conducting_body}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-2 grid grid-cols-3 gap-1.5">
                                    {years.map(year => (
                                        <div key={year} className="rounded-md border border-white/10 bg-[#2B1E17]/40 px-1 py-1 text-center">
                                            <p className="text-sm text-[#FBF6EE]/50">{year}</p>
                                            <div className="mt-0.5 flex justify-center">
                                                {renderCellContent(row.yearData[year], row.examFrequency)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div
                    className="hidden sm:block overflow-x-auto overflow-y-auto max-h-[500px]"
                    style={thinScrollbarStyle}
                >
                    <table className="w-full border-collapse">
                        <thead className="bg-[#2B1E17]/50 sticky top-0 z-10">
                            <tr>
                                <th className="px-1.5 py-1 text-left text-sm text-[#FBF6EE] font-semibold border-r border-white/10 min-w-[140px] sticky left-0 bg-[#2B1E17]/90 z-20">
                                    Exam / Division
                                </th>
                                {years.map(year => (
                                    <th key={year} className="px-0.5 py-1 text-center text-sm text-[#FBF6EE] font-semibold border-r border-white/10 min-w-[42px]">
                                        {year}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.length === 0 ? (
                                <tr>
                                    <td colSpan={years.length + 1} className="px-2 py-4 text-center text-[#FBF6EE]/50">
                                        <p className="text-sm">No exams found to display.</p>
                                    </td>
                                </tr>
                            ) : (
                                tableRows.map((row, index) => (
                                    <tr 
                                        key={row.rowKey} 
                                        className={`border-b border-white/10 hover:bg-[#2B1E17]/40 ${index % 2 === 0 ? 'bg-white/[0.02]' : 'bg-[#2B1E17]/40'}`}
                                    >
                                        <td className={`px-1.5 py-1 text-sm border-r border-white/10 sticky left-0 z-10 ${index % 2 === 0 ? 'bg-[#2B1E17]/90' : 'bg-gray-800/90'}`}>
                                            <div className="flex flex-col leading-tight">
                                                <span className="font-semibold text-[#FBF6EE]">{row.displayName}</span>
                                                {row.displayDetails?.conducting_body && (
                                                    <span className="text-sm text-[#FBF6EE]/50 truncate max-w-[130px]" title={row.displayDetails.conducting_body}>
                                                        {row.displayDetails.conducting_body}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {years.map(year => (
                                            <td key={year} className="px-0.5 py-1 text-center border-r border-white/10">
                                                {renderCellContent(row.yearData[year], row.examFrequency)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Legend */}
                <div className="px-2 py-1.5 bg-[#2B1E17]/40 border-t border-white/10">
                    <div className="flex flex-wrap gap-3 text-sm text-[#FBF6EE]/60">
                        <div className="flex items-center gap-0.5">
                            <span className="text-green-500 font-bold">✓</span>
                            <span>Eligible</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <span className="text-red-500 font-bold">✗</span>
                            <span>Not Eligible</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <span className="text-yellow-500 font-bold">◐</span>
                            <span>Partial</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <span className="text-gray-300">—</span>
                            <span>No Data</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-0.5 ml-auto">
                            <span className="text-sm bg-gray-200 px-1 rounded">X/Y</span>
                            <span>= Eligible/Total sessions per year</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Combined render function that decides which to show
    const renderResultsSummary = () => {
        if (searchMode === 'exam') {
            return renderExamBasisSummary();
        } else {
            return renderEligibilityBasisSummary();
        }
    };

    // Detailed Results for Exam Basis Mode
    const renderExamBasisDetails = () => {
        if (!showResults || results.length === 0) return null;

        return (
            <div className="h-full">
                <h3 className="bg-[#2B1E17]/50 text-[#FBF6EE] px-3 py-2 font-semibold text-sm rounded-t-lg">
                    📝 Detailed Eligibility Check
                </h3>
                
                <div className="p-3 bg-[#E4572E]/5 border-b border-[#E4572E]/20">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {hasDivisions && divisions.length > 0 ? (
                            <div>
                                <span className="text-[#FBF6EE]/50">Divisions:</span>
                                <p className="font-medium text-[#E4572E]">{divisions.length} divisions checked</p>
                            </div>
                        ) : (
                            <div>
                                <span className="text-[#FBF6EE]/50">Type:</span>
                                <p className="font-medium text-[#E4572E]">Single exam</p>
                            </div>
                        )}
                        {displayDetails?.conducting_body && (
                            <div>
                                <span className="text-[#FBF6EE]/50">Conducting Body:</span>
                                <p className="font-medium text-[#E4572E]">{displayDetails.conducting_body}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div 
                    className="p-2 max-h-[350px] overflow-y-auto"
                    style={thinScrollbarStyle}
                >
                    {results.map((result, index) => (
                        <div 
                            key={index} 
                            className={`rounded-lg p-2 border mb-2 ${result.eligible ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}
                        >
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="font-bold text-[#E4572E] text-sm">{result.division}</span>
                                <span className="text-[#FBF6EE]/30">|</span>
                                <span className="text-sm text-[#FBF6EE]/60">{result.session}</span>
                                <Chip
                                    label={result.eligible ? "Eligible" : "Not Eligible"}
                                    color={result.eligible ? "success" : "error"}
                                    size="small"
                                />
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#2B1E17]/50">
                                        <tr>
                                            <th className="px-2 py-1 text-left text-[#FBF6EE]/70">Criteria</th>
                                            <th className="px-2 py-1 text-left text-[#FBF6EE]/70">You</th>
                                            <th className="px-2 py-1 text-left text-[#FBF6EE]/70">Required</th>
                                            <th className="px-2 py-1 text-center text-[#FBF6EE]/70">✓/✗</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.results && result.results.map((check, idx) => (
                                            <tr key={idx} className={`border-b border-white/10 ${check.eligible ? '' : 'bg-red-500/10'}`}>
                                                <td className="px-2 py-1 text-[#FBF6EE]/80">{check.field}</td>
                                                <td className="px-2 py-1 text-[#FBF6EE]/80">{check.userValue}</td>
                                                <td className="px-2 py-1 text-[#FBF6EE]/60 truncate max-w-[80px]" title={check.examRequirement}>
                                                    {check.examRequirement?.length > 12 ? check.examRequirement.substring(0, 12) + '...' : check.examRequirement}
                                                </td>
                                                <td className="px-2 py-1 text-center">
                                                    {check.eligible ? (
                                                        <span className="text-green-600 font-bold">✓</span>
                                                    ) : (
                                                        <span className="text-red-600 font-bold">✗</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Detailed Results for Eligibility Basis Mode - No longer needed as we have unified table
    const renderEligibilityBasisDetails = () => {
        // Return null for eligibility basis mode - unified table shows everything
        return null;
    };

    // Combined detailed results render function
    const renderDetailedResultsInline = () => {
        if (searchMode === 'exam') {
            return renderExamBasisDetails();
        } else {
            // For eligibility basis, we don't show separate details panel
            return null;
        }
    };

    // ============================================
    // MAIN RENDER
    // ============================================

    return (
        <ThemeProvider theme={theme}>
            <div className="font-fredoka bg-transparent pt-22 px-2 sm:px-3 lg:px-4 pb-8 min-h-[calc(100vh-80px)] lg:min-h-screen">
                {/* Header Section */}
                <div className="w-full mx-auto p-2 sm:p-3 mb-2">
                    <div className="flex flex-row items-center gap-2 sm:gap-3">
                        <div className="flex-1">
                            <div className=" rounded-xl px-3 py-2 sm:px-6 sm:py-3 flex items-center justify-center gap-2 sm:gap-3">
                                <h1 className="text-base sm:text-2xl font-bold text-[#FBF6EE] whitespace-nowrap">
                                    Check Your Eligibility
                                </h1>
                                <button
                                    onClick={() => setNoticeDialogOpen(true)}
                                    className="flex items-center gap-1 sm:gap-1.5 bg-red-500 hover:bg-red-600 rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1 transition-all duration-200 cursor-pointer"
                                >
                                    <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-white"></span>
                                    </span>
                                    <span className="text-sm sm:text-base font-semibold text-[#FBF6EE]">Notice</span>
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                            <div className="bg-[#2B1E17]/40 border border-[#E4572E]/40 sm:border-2 rounded-lg sm:rounded-xl px-1.5 py-1 sm:px-4 sm:py-2 text-center">
                                <span className="text-sm sm:text-base text-[#FBF6EE]/60 font-medium">Total exam : </span>
                                <span className="text-sm sm:text-base font-bold text-[#FBF6EE]">{examOptions.length}</span>
                            </div>
                            <div className="bg-[#2B1E17]/40 border border-[#E4572E]/40 sm:border-2 rounded-lg sm:rounded-xl px-1.5 py-1 sm:px-4 sm:py-2 text-center">
                                <span className="text-sm sm:text-base text-[#FBF6EE]/60 font-medium">Total inputs : </span>
                                <span className="text-sm sm:text-base font-bold text-[#FBF6EE]">54</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Important Notice Dialog */}
                <Dialog 
                    open={noticeDialogOpen} 
                    onClose={() => setNoticeDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: '16px',
                            overflow: 'hidden'
                        }
                    }}
                >
                    <DialogTitle sx={{ 
                        background: 'linear-gradient(135deg, #E4572E 0%, #c9421e 100%)',
                        color: '#FBF6EE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 2
                    }}>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">⚠️</span>
                            <Typography variant="h6" component="span" fontWeight="bold">
                                Important Notice
                            </Typography>
                        </div>
                        <IconButton 
                            onClick={() => setNoticeDialogOpen(false)} 
                            sx={{ color: '#FBF6EE' }}
                            size="small"
                        >
                            ✕
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3, pb: 2, bgcolor: '#2B1E17' }}>
                        <div className="space-y-4">
                            <div className="bg-[#E4572E]/10 border-l-4 border-[#E4572E] p-4 rounded-r-lg">
                                <Typography variant="h6" className="text-[#FBF6EE] font-bold mb-2">
                                    🙏 Welcome to Pratiyogita Yogya!
                                </Typography>
                                <Typography variant="body2" className="text-[#E8D8C3]">
                                    Your trusted companion for exam eligibility checking.
                                </Typography>
                            </div>

                            <div className="bg-green-500/10 border-l-4 border-green-500 p-4 rounded-r-lg">
                                <Typography variant="subtitle1" className="text-green-400 font-bold mb-2">
                                    🔒 Data Privacy & Security
                                </Typography>
                                <Typography variant="body2" className="text-green-300">
                                    We <strong>DO NOT</strong> sell your data or use it for any fraudulent activities. 
                                    Your information is safe with us.
                                </Typography>
                            </div>

                            <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                                <Typography variant="subtitle1" className="text-yellow-400 font-bold mb-2">
                                    📋 Eligibility Criteria Disclaimer
                                </Typography>
                                <Typography variant="body2" className="text-yellow-300">
                                    The information is <strong>only</strong> to determine eligibility based on our defined criteria.
                                </Typography>
                            </div>

                            <div className="bg-purple-500/10 border-l-4 border-purple-500 p-4 rounded-r-lg">
                                <Typography variant="subtitle1" className="text-purple-400 font-bold mb-2">
                                    📄 Official Notification
                                </Typography>
                                <Typography variant="body2" className="text-purple-300">
                                    Always refer to the <strong>official exam notification</strong> for complete eligibility criteria.
                                </Typography>
                            </div>
                        </div>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', bgcolor: '#2B1E17' }}>
                        <Button 
                            onClick={() => setNoticeDialogOpen(false)} 
                            variant="contained"
                            sx={{ 
                                background: 'linear-gradient(135deg, #E4572E 0%, #c9421e 100%)',
                                borderRadius: '8px',
                                px: 4,
                                py: 1,
                                textTransform: 'none',
                                fontWeight: 'bold',
                            }}
                        >
                            I Understand
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Content (form + results) */}
                <div className="pb-4">
                    {error && (
                        <Alert severity="error" className="mb-4" onClose={() => setError("")}>
                            {error}
                        </Alert>
                    )}

                    {/* Form Section */}
                    <div className="w-full">
                        <div className="bg-[#2B1E17]/40 backdrop-blur-sm rounded-xl shadow-lg p-3 border border-[#E4572E]/40">
                            <Box component="form" noValidate autoComplete="off">
                            {/* Section 1: Exam Selection with Toggle */}
                            <div className="p-3 mb-3 rounded-lg border-l-4 border-l-[#E4572E] bg-[#E4572E]/8 border border-[#E4572E]/15">
                                <h2 className="text-base font-semibold text-[#E4572E] mb-3 text-left">
                                    Select Target Exam
                                </h2>
                                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                    {/* Toggle Switch */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-sm font-semibold transition-colors ${searchMode === 'exam' ? 'text-green-400' : 'text-[#FBF6EE]/40'}`}>
                                            Exam Basis
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setSearchMode(searchMode === 'exam' ? 'eligibility' : 'exam')}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                                                searchMode === 'eligibility' ? 'bg-[#E4572E]' : 'bg-green-500'
                                            }`}
                                        >
                                            <span
                                                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${
                                                    searchMode === 'eligibility' ? 'translate-x-6' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                        <span className={`text-sm font-semibold transition-colors ${searchMode === 'eligibility' ? 'text-[#E4572E]' : 'text-[#FBF6EE]/40'}`}>
                                            Eligibility Basis
                                        </span>
                                        
                                        {/* Info Icon with Tooltip */}
                                        <div className="relative group">
                                            <span className="cursor-help text-[#FBF6EE]/40 hover:text-[#FBF6EE]/70 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </span>
                                            <div className="absolute left-0 top-6 z-50 hidden group-hover:block w-72 bg-[#2B1E17] text-[#FBF6EE] text-sm rounded-lg p-3 shadow-xl">
                                                <div className="mb-2 pb-2 border-b border-gray-700">
                                                    <span className="font-bold text-green-400">🎯 Exam Basis:</span>
                                                    <p className="mt-1 text-gray-300">Select an exam first, then fill your details to check if you're eligible.</p>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-[#E4572E]">📋 Eligibility Basis:</span>
                                                    <p className="mt-1 text-gray-300">Fill your details first, and we'll show you all exams you're eligible for.</p>
                                                </div>
                                                <div className="absolute -top-1 left-2 w-2 h-2 bg-[#2B1E17] transform rotate-45"></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Target Exam Dropdown - Only show in Exam Basis mode */}
                                    {searchMode === 'exam' && (
                                        <div className="flex-1 w-full">
                                            {/* Category + Exam side by side */}
                                            <div className="flex gap-2 flex-wrap">
                                                <TextField
                                                    select
                                                    size="small"
                                                    label="Category"
                                                    value={examCategory}
                                                    onChange={(e) => setExamCategory(e.target.value)}
                                                    sx={{ 
                                                        minWidth: '160px',
                                                        '& .MuiInputBase-root': {
                                                            fontSize: '0.95rem',
                                                        }
                                                    }}
                                                >
                                                    {examCategories.map((cat) => (
                                                        <MenuItem key={cat} value={cat}>
                                                            {cat}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                                <TextField
                                                    select
                                                    label="Target Exam"
                                                    required
                                                    value={selectedExam}
                                                    onChange={handleExamChange}
                                                    helperText={`${filteredExamOptions.length} exam(s) found`}
                                                    size="small"
                                                    disabled={loading}
                                                    sx={{ 
                                                        flex: 1, 
                                                        minWidth: '200px',
                                                        '& .MuiInputBase-root': {
                                                            fontSize: '0.95rem',
                                                        }
                                                    }}
                                                >
                                                    <MenuItem value="">
                                                        <em>Select an exam</em>
                                                    </MenuItem>
                                                    {filteredExamOptions.map((option) => (
                                                        <MenuItem key={option.value} value={option.value}>
                                                            {option.label}
                                                            {option.hasDivisions && (
                                                                <Chip 
                                                                    label="Multi-Division" 
                                                                    size="small" 
                                                                    color="primary"
                                                                    variant="outlined"
                                                                    className="ml-2" 
                                                                />
                                                            )}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Eligibility Basis Mode Description */}
                                    {searchMode === 'eligibility' && (
                                        <div className="flex-1 w-full bg-[#E4572E]/10 border border-[#E4572E]/30 rounded-lg p-3">
                                            <div className="flex items-start gap-2">
                                                <span className="text-[#E4572E] text-lg">📋</span>
                                                <div>
                                                    <p className="text-sm font-semibold text-[#E4572E]">Eligibility Basis Mode</p>
                                                    <p className="text-sm text-orange-300 mt-1">
                                                        Fill in your details below, and we'll check <strong>all {examOptions.length} exams</strong> to show which ones you're eligible for.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {loading && (
                                    <div className="flex flex-col items-center justify-center mt-4 p-4 bg-[#E4572E]/10 rounded-lg">
                                        <CircularProgress size={24} />
                                        {searchMode === 'eligibility' && checkingProgress.total > 0 ? (
                                            <div className="mt-2 text-center">
                                                <p className="text-sm text-[#FBF6EE]">
                                                    Checking: <span className="font-semibold">{checkingProgress.examName}</span>
                                                </p>
                                                <p className="text-sm text-[#FBF6EE]/60">
                                                    {checkingProgress.current} of {checkingProgress.total} exams
                                                </p>
                                                <div className="w-48 h-2 bg-gray-200 rounded-full mt-2">
                                                    <div 
                                                        className="h-2 bg-[#E4572E] rounded-full transition-all duration-300"
                                                        style={{ width: `${(checkingProgress.current / checkingProgress.total) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="ml-2 text-sm">Loading...</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Section 2: Personal Information */}
                            {(examData || searchMode === 'eligibility') && (
                                <div className="p-3 mb-3 rounded-lg border-l-4 border-l-[#E8D8C3] bg-[#E8D8C3]/8 border border-[#E8D8C3]/15">
                                    <div className="flex justify-between items-center mb-3">
                                        <h2 className="text-base font-semibold text-[#E8D8C3] text-left">
                                            Personal Information
                                        </h2>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={fillMockData}
                                            sx={{ 
                                                fontSize: '0.85rem', 
                                                padding: '2px 8px',
                                                borderColor: '#E4572E',
                                                color: '#E4572E',
                                                '&:hover': {
                                                    borderColor: '#c9421e',
                                                    backgroundColor: 'rgba(228,87,46,0.1)',
                                                }
                                            }}
                                        >
                                            🧪 Fill Mock Data
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                        {/* Date of Birth - Now with separate dropdowns */}
                                        <div className="flex gap-1" style={{ gridColumn: 'span 1' }}>
                                            <TextField
                                                select
                                                label="Day"
                                                required
                                                value={dateDay}
                                                onChange={handleDateChange('day')}
                                                size="small"
                                                sx={{ flex: 1 }}
                                            >
                                                <MenuItem value="">Day</MenuItem>
                                                {dayOptions.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                            <TextField
                                                select
                                                label="Month"
                                                required
                                                value={dateMonth}
                                                onChange={handleDateChange('month')}
                                                size="small"
                                                sx={{ flex: 1.5 }}
                                            >
                                                <MenuItem value="">Month</MenuItem>
                                                {monthOptions.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                            <TextField
                                                select
                                                label="Year"
                                                required
                                                value={dateYear}
                                                onChange={handleDateChange('year')}
                                                size="small"
                                                sx={{ flex: 1 }}
                                            >
                                                <MenuItem value="">Year</MenuItem>
                                                {birthYearOptions.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </div>

                                        {/* Gender + Marital Status: side by side on mobile */}
                                        <div className="grid grid-cols-2 gap-2 sm:contents">
                                        <TextField
                                            select
                                            fullWidth
                                            label="Gender"
                                            required
                                            value={formData.gender}
                                            onChange={handleChange("gender")}
                                            helperText="Select your gender"
                                            size="small"
                                        >
                                            {genderOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        <TextField
                                            select
                                            fullWidth
                                            label="Marital Status"
                                            required
                                            value={formData.marital_status}
                                            onChange={handleChange("marital_status")}
                                            helperText="Select your marital status"
                                            size="small"
                                        >
                                            {maritalStatusOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                        </div>

                                        {/* Nationality + Domicile: side by side on mobile */}
                                        <div className="grid grid-cols-2 gap-2 sm:contents">
                                        <TextField
                                            select
                                            fullWidth
                                            label="Nationality"
                                            required
                                            value={formData.nationality}
                                            onChange={handleChange("nationality")}
                                            helperText="Select your nationality"
                                            size="small"
                                        >
                                            {nationalityOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        <TextField
                                            select
                                            fullWidth
                                            label="Domicile State"
                                            value={formData.domicile}
                                            onChange={handleChange("domicile")}
                                            helperText={isDomicileDisabled ? "Select 'INDIAN' nationality first" : "Your domicile state"}
                                            size="small"
                                            disabled={isDomicileDisabled}
                                        >
                                            {domicileOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                        </div>

                                        <TextField
                                            select
                                            fullWidth
                                            label="Caste/Category"
                                            required
                                            value={formData.caste_category}
                                            onChange={handleChange("caste_category")}
                                            helperText="Select your category"
                                            size="small"
                                        >
                                            {casteOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        <TextField
                                            select
                                            fullWidth
                                            label="Person with Disability"
                                            value={formData.pwd_status}
                                            onChange={handleChange("pwd_status")}
                                            helperText="Are you a PwD candidate?"
                                            size="small"
                                        >
                                            {pwdOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </div>
                                </div>
                            )}

                            {/* Section 3: Educational Qualification */}
                            {(examData || searchMode === 'eligibility') && (
                                <div className="p-3 mb-3 rounded-lg border-l-4 border-l-[#5b8a72] bg-[#5b8a72]/8 border border-[#5b8a72]/15">
                                    <h2 className="text-base font-semibold text-[#5b8a72] mb-3 text-left">
                                        Educational Qualification
                                    </h2>
                                    
                                    <div className="mb-4 max-w-xs">
                                        <TextField
                                            select
                                            fullWidth
                                            label="Highest Education Qualification"
                                            required
                                            value={formData.highest_education_qualification}
                                            onChange={handleEducationLevelChange}
                                            helperText="Select your highest qualification level"
                                            size="small"
                                        >
                                            {educationOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </div>
                                    
                                    {visibleEducationLevels.length > 0 && (
                                        <div className="overflow-x-auto">
                                            <div className="hidden sm:grid sm:grid-cols-8 gap-2 mb-2 px-2 text-sm font-semibold text-[#FBF6EE]/60">
                                                <div className="text-left"></div>
                                                <div className="text-left">Course/Stream</div>
                                                <div className="text-left">Subject</div>
                                                <div className="text-left">Have you studied</div>
                                                <div className="text-left">Completion Status</div>
                                                <div className="text-left">Marks (%)</div>
                                                <div className="text-left">Completed Year</div>
                                                <div className="text-left">Active Backlogs</div>
                                            </div>
                                            
                                            {visibleEducationLevels.map((level, levelIndex) => {
                                                // Color palette for differentiating each education level
                                                const eduLevelColors = [
                                                    { border: '#E4572E', bg: 'rgba(228,87,46,0.08)', text: '#E4572E' },     // Burnt Orange
                                                    { border: '#E8D8C3', bg: 'rgba(232,216,195,0.08)', text: '#E8D8C3' },   // Muted Sand
                                                    { border: '#5b8a72', bg: 'rgba(91,138,114,0.08)', text: '#5b8a72' },     // Sage Green
                                                    { border: '#9b8ec4', bg: 'rgba(155,142,196,0.08)', text: '#9b8ec4' },    // Soft Purple
                                                    { border: '#4da6c9', bg: 'rgba(77,166,201,0.08)', text: '#4da6c9' },     // Teal Blue
                                                    { border: '#c9a84c', bg: 'rgba(201,168,76,0.08)', text: '#c9a84c' },     // Gold
                                                    { border: '#d4726a', bg: 'rgba(212,114,106,0.08)', text: '#d4726a' },    // Rose
                                                    { border: '#6b9e78', bg: 'rgba(107,158,120,0.08)', text: '#6b9e78' },    // Forest Green
                                                    { border: '#b8860b', bg: 'rgba(184,134,11,0.08)', text: '#b8860b' },     // Dark Goldenrod
                                                ];
                                                const levelColor = eduLevelColors[levelIndex % eduLevelColors.length];
                                                const levelData = educationTableData[level.key] || {};
                                                const levelCourses = getCourseOptionsForLevel(level.key);
                                                const levelSubjects = levelData.course ? getSubjectOptionsForCourse(levelData.course, level.key) : [];
                                                
                                                // Map UI level key to JSON level key
                                                const uiToJsonLevelKey = {
                                                    'POST DOCTORATE': 'post_doctorate',
                                                    'PHD': 'phd',
                                                    'POST GRADUATION': 'post_graduation',
                                                    'GRADUATION': 'graduation',
                                                    'DIPLOMA / ITI (POLYTECHNIC, ITI, DPHARM, PGDCA)': 'diploma',
                                                    '(12TH)HIGHER SECONDARY': '12th_higher_secondary',
                                                    '(10TH)SECONDARY': '10th_secondary',
                                                    '(8TH)CLASS': '8th_class',
                                                    '(5TH)CLASS': '5th_class'
                                                };
                                                const jsonLevelKey = uiToJsonLevelKey[level.key] || level.key.toLowerCase().replace(/ /g, '_');
                                                
                                                // Get mandatory subjects specifically for THIS level (not all levels)
                                                const levelMandatorySubjects = (() => {
                                                    if (!examData) return [];
                                                    const subjects = new Set();
                                                    const divisionFields = ['academies', 'posts', 'departments', 'courses', 'classes'];
                                                    for (const field of divisionFields) {
                                                        if (examData[field] && typeof examData[field] === 'object') {
                                                            for (const divData of Object.values(examData[field])) {
                                                                const eduLevels = divData?.education_levels;
                                                                if (eduLevels && eduLevels[jsonLevelKey]) {
                                                                    const lvl = eduLevels[jsonLevelKey];
                                                                    // Get from mandatory_subject (string)
                                                                    if (lvl.mandatory_subject && lvl.mandatory_subject.trim() !== '') {
                                                                        lvl.mandatory_subject.split(',').forEach(s => {
                                                                            if (s.trim()) subjects.add(s.trim().toUpperCase());
                                                                        });
                                                                    }
                                                                    // Get from mandatory_subjects (array)
                                                                    if (lvl.mandatory_subjects && Array.isArray(lvl.mandatory_subjects)) {
                                                                        lvl.mandatory_subjects.forEach(s => {
                                                                            if (s.trim()) subjects.add(s.trim().toUpperCase());
                                                                        });
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                    // Check root level
                                                    const eduLevels = examData.education_levels;
                                                    if (eduLevels && eduLevels[jsonLevelKey]) {
                                                        const lvl = eduLevels[jsonLevelKey];
                                                        if (lvl.mandatory_subject && lvl.mandatory_subject.trim() !== '') {
                                                            lvl.mandatory_subject.split(',').forEach(s => {
                                                                if (s.trim()) subjects.add(s.trim().toUpperCase());
                                                            });
                                                        }
                                                        if (lvl.mandatory_subjects && Array.isArray(lvl.mandatory_subjects)) {
                                                            lvl.mandatory_subjects.forEach(s => {
                                                                if (s.trim()) subjects.add(s.trim().toUpperCase());
                                                            });
                                                        }
                                                    }
                                                    return Array.from(subjects);
                                                })();
                                                
                                                // Check if THIS level has mandatory subjects in any division
                                                const levelHasMandatorySubjects = levelMandatorySubjects.length > 0;
                                                
                                                // Build dropdown options for THIS level only
                                                const levelMandatorySubjectOptions = levelMandatorySubjects.length > 0 ? [
                                                    { value: 'ALL', label: 'ALL (Studied All Subjects)' },
                                                    { value: 'NO', label: 'NO (Haven\'t Studied Any)' },
                                                    ...levelMandatorySubjects.map(subject => ({
                                                        value: subject,
                                                        label: subject.charAt(0) + subject.slice(1).toLowerCase()
                                                    }))
                                                ] : [];
                                                
                                                // Check if THIS level has marks requirement for mandatory subjects
                                                const levelHasMarksRequirement = (() => {
                                                    if (!examData) return false;
                                                    const divisionFields = ['academies', 'posts', 'departments', 'courses', 'classes'];
                                                    for (const field of divisionFields) {
                                                        if (examData[field] && typeof examData[field] === 'object') {
                                                            for (const divData of Object.values(examData[field])) {
                                                                const eduLevels = divData?.education_levels;
                                                                if (eduLevels && eduLevels[jsonLevelKey]) {
                                                                    const lvl = eduLevels[jsonLevelKey];
                                                                    if (lvl.mandatory_subject_marks_percentage || lvl.mandatory_subjects_marks_percentage) {
                                                                        return true;
                                                                    }
                                                                }
                                                            }
                                                            return false;
                                                        }
                                                    }
                                                    // Check root level
                                                    const eduLevels = examData.education_levels;
                                                    if (eduLevels && eduLevels[jsonLevelKey]) {
                                                        const lvl = eduLevels[jsonLevelKey];
                                                        if (lvl.mandatory_subject_marks_percentage || lvl.mandatory_subjects_marks_percentage) {
                                                            return true;
                                                        }
                                                    }
                                                    return false;
                                                })();
                                                
                                                // Check if user's graduation course is in except_course list (bypasses mandatory subject check)
                                                const isExemptedByCourse = (() => {
                                                    if (!examData) return false;
                                                    // Get user's graduation course from education table
                                                    const userGradCourse = educationTableData['GRADUATION']?.course || '';
                                                    if (!userGradCourse) return false;
                                                    
                                                    const divisionFields = ['academies', 'posts', 'departments', 'courses', 'classes'];
                                                    for (const field of divisionFields) {
                                                        if (examData[field] && typeof examData[field] === 'object') {
                                                            for (const divData of Object.values(examData[field])) {
                                                                const eduLevels = divData?.education_levels;
                                                                // Check graduation level for except_course
                                                                if (eduLevels?.graduation?.course?.except_course) {
                                                                    const exceptCourses = eduLevels.graduation.course.except_course;
                                                                    if (Array.isArray(exceptCourses)) {
                                                                        const normalizedUserCourse = userGradCourse.toUpperCase().trim();
                                                                        const isExcepted = exceptCourses.some(course => 
                                                                            normalizedUserCourse.includes(course.toUpperCase().trim()) ||
                                                                            course.toUpperCase().trim().includes(normalizedUserCourse)
                                                                        );
                                                                        if (isExcepted) return true;
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                    // Check root level
                                                    const eduLevels = examData.education_levels;
                                                    if (eduLevels?.graduation?.course?.except_course) {
                                                        const exceptCourses = eduLevels.graduation.course.except_course;
                                                        if (Array.isArray(exceptCourses)) {
                                                            const normalizedUserCourse = userGradCourse.toUpperCase().trim();
                                                            const isExcepted = exceptCourses.some(course => 
                                                                normalizedUserCourse.includes(course.toUpperCase().trim()) ||
                                                                course.toUpperCase().trim().includes(normalizedUserCourse)
                                                            );
                                                            if (isExcepted) return true;
                                                        }
                                                    }
                                                    return false;
                                                })();
                                                
                                                // Final check: show mandatory subjects only if level has them AND user is not exempted by course
                                                const shouldShowMandatorySubjects = levelHasMandatorySubjects && !isExemptedByCourse;
                                                const shouldShowMarksInput = levelHasMarksRequirement && !isExemptedByCourse;
                                                
                                                // Get exam's highest_education_qualification from academies/divisions or root level
                                                let examHighestEdu = '';
                                                if (examData) {
                                                    // First check root level
                                                    if (examData.highest_education_qualification) {
                                                        examHighestEdu = examData.highest_education_qualification;
                                                    } else {
                                                        // Check inside academies/posts/departments/courses/classes
                                                        const divisionFields = ['academies', 'posts', 'departments', 'courses', 'classes'];
                                                        for (const field of divisionFields) {
                                                            if (examData[field] && typeof examData[field] === 'object') {
                                                                const firstDivision = Object.values(examData[field])[0];
                                                                if (firstDivision?.highest_education_qualification) {
                                                                    examHighestEdu = firstDivision.highest_education_qualification;
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                                examHighestEdu = examHighestEdu.toUpperCase();
                                                const levelKeyUpper = level.key.toUpperCase();
                                                
                                                // Map exam's requirement to UI key for comparison
                                                const isExamRequiredLevel = 
                                                    (examHighestEdu.includes('GRADUATION') && !examHighestEdu.includes('POST') && levelKeyUpper === 'GRADUATION') ||
                                                    (examHighestEdu.includes('POST GRADUATION') && levelKeyUpper === 'POST GRADUATION') ||
                                                    ((examHighestEdu.includes('12TH') || examHighestEdu.includes('HIGHER SECONDARY')) && levelKeyUpper.includes('12TH')) ||
                                                    ((examHighestEdu.includes('10TH') || examHighestEdu === 'SECONDARY') && levelKeyUpper.includes('10TH')) ||
                                                    (examHighestEdu.includes('DIPLOMA') && levelKeyUpper.includes('DIPLOMA')) ||
                                                    (examHighestEdu.includes('PHD') && levelKeyUpper === 'PHD') ||
                                                    (examHighestEdu.includes('POST DOCTORATE') && levelKeyUpper === 'POST DOCTORATE');
                                                
                                                return (
                                                    <React.Fragment key={level.key}>
                                                    <div 
                                                        className="grid grid-cols-1 sm:grid-cols-8 gap-2 mb-3 p-2 rounded-lg items-center border-l-4"
                                                        style={{ backgroundColor: levelColor.bg, borderLeftColor: levelColor.border, borderTop: `1px solid ${levelColor.border}25`, borderRight: `1px solid ${levelColor.border}25`, borderBottom: `1px solid ${levelColor.border}25` }}
                                                    >
                                                        <div className="font-medium text-sm sm:text-left" style={{ color: levelColor.text }}>
                                                            {level.shortLabel}
                                                        </div>
                                                        
                                                        <TextField
                                                            select
                                                            fullWidth
                                                            size="small"
                                                            label="Course/Stream"
                                                            value={levelData.course || ''}
                                                            onChange={(e) => handleEducationTableChange(level.key, 'course', e.target.value)}
                                                            InputLabelProps={{ shrink: true }}
                                                            sx={{ '& .MuiInputBase-root': { fontSize: '0.9rem' } }}
                                                        >
                                                            <MenuItem value="">Select</MenuItem>
                                                            {levelCourses.map((opt) => (
                                                                <MenuItem key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </MenuItem>
                                                            ))}
                                                        </TextField>
                                                        
                                                        <TextField
                                                            select
                                                            fullWidth
                                                            size="small"
                                                            label="Subject"
                                                            value={levelData.subject || ''}
                                                            onChange={(e) => handleEducationTableChange(level.key, 'subject', e.target.value)}
                                                            InputLabelProps={{ shrink: true }}
                                                            disabled={!levelData.course}
                                                            sx={{ '& .MuiInputBase-root': { fontSize: '0.9rem' } }}
                                                        >
                                                            <MenuItem value="">Select</MenuItem>
                                                            {levelSubjects.map((opt) => (
                                                                <MenuItem key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </MenuItem>
                                                            ))}
                                                        </TextField>
                                                        
                                                        {/* Have you studied - Show for levels that have mandatory subjects (if not exempted by course) */}
                                                        {shouldShowMandatorySubjects && levelMandatorySubjectOptions.length > 2 ? (
                                                            <Autocomplete
                                                                multiple
                                                                size="small"
                                                                options={levelMandatorySubjectOptions}
                                                                getOptionLabel={(option) => option.label || option.value || ''}
                                                                value={levelMandatorySubjectOptions.filter(opt => 
                                                                    (selectedMandatorySubjects[level.key] || []).includes(opt.value)
                                                                )}
                                                                onChange={(event, newValue) => {
                                                                    // Handle ALL and NO as exclusive selections
                                                                    const newValues = newValue.map(v => v.value);
                                                                    let finalValues;
                                                                    if (newValues.includes('ALL')) {
                                                                        // If ALL is selected, only keep ALL
                                                                        finalValues = ['ALL'];
                                                                    } else if (newValues.includes('NO') && newValues.length > 1) {
                                                                        // If NO is selected with others, keep only NO
                                                                        finalValues = ['NO'];
                                                                    } else {
                                                                        finalValues = newValues;
                                                                    }
                                                                    setSelectedMandatorySubjects(prev => ({
                                                                        ...prev,
                                                                        [level.key]: finalValues
                                                                    }));
                                                                }}
                                                                disableCloseOnSelect
                                                                renderOption={(props, option, { selected }) => {
                                                                    const { key, ...otherProps } = props;
                                                                    return (
                                                                        <li key={key} {...otherProps} style={{ fontSize: '0.9rem', padding: '4px 8px' }}>
                                                                            <Checkbox
                                                                                style={{ marginRight: 8 }}
                                                                                checked={selected}
                                                                                size="small"
                                                                            />
                                                                            {option.label}
                                                                        </li>
                                                                    );
                                                                }}
                                                                renderInput={(params) => (
                                                                    <TextField
                                                                        {...params}
                                                                        label="Have you studied"
                                                                        placeholder={(selectedMandatorySubjects[level.key] || []).length === 0 ? "Select..." : ""}
                                                                        InputLabelProps={{ shrink: true }}
                                                                        sx={{ '& .MuiInputBase-root': { fontSize: '0.85rem' } }}
                                                                    />
                                                                )}
                                                                sx={{ 
                                                                    '& .MuiChip-root': { 
                                                                        height: '18px', 
                                                                        fontSize: '0.95rem' 
                                                                    },
                                                                    '& .MuiAutocomplete-input': {
                                                                        fontSize: '0.85rem'
                                                                    }
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="text-center text-gray-400 text-sm">—</div>
                                                        )}
                                                        
                                                        {/* Status + Marks + Year: side by side on mobile */}
                                                        <div className="grid grid-cols-3 gap-2 sm:contents">
                                                        <TextField
                                                            select
                                                            fullWidth
                                                            size="small"
                                                            label="Status"
                                                            value={levelData.completionStatus || ''}
                                                            onChange={(e) => handleEducationTableChange(level.key, 'completionStatus', e.target.value)}
                                                            InputLabelProps={{ shrink: true }}
                                                            sx={{ '& .MuiInputBase-root': { fontSize: '0.9rem' } }}
                                                        >
                                                            {completionStatusOptions.map((opt) => (
                                                                <MenuItem key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </MenuItem>
                                                            ))}
                                                        </TextField>
                                                        
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            label="Marks"
                                                            type="number"
                                                            value={levelData.marks || ''}
                                                            onChange={(e) => handleEducationTableChange(level.key, 'marks', e.target.value)}
                                                            InputLabelProps={{ shrink: true }}
                                                            inputProps={{ min: 0, max: 100 }}
                                                            sx={{ '& .MuiInputBase-root': { fontSize: '0.9rem' } }}
                                                        />
                                                        
                                                        <TextField
                                                            select
                                                            fullWidth
                                                            size="small"
                                                            label="Year"
                                                            value={levelData.completedYear || ''}
                                                            onChange={(e) => handleEducationTableChange(level.key, 'completedYear', e.target.value)}
                                                            InputLabelProps={{ shrink: true }}
                                                            sx={{ '& .MuiInputBase-root': { fontSize: '0.9rem' } }}
                                                        >
                                                            {yearOptions.map((opt) => (
                                                                <MenuItem key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </MenuItem>
                                                            ))}
                                                        </TextField>
                                                        </div>
                                                        
                                                        {/* Active Backlogs - Only show for exam's required education level */}
                                                        {isExamRequiredLevel ? (
                                                            <TextField
                                                                select
                                                                fullWidth
                                                                size="small"
                                                                label="Active Backlogs"
                                                                value={levelData.activeBacklogs || ''}
                                                                onChange={(e) => handleEducationTableChange(level.key, 'activeBacklogs', e.target.value)}
                                                                InputLabelProps={{ shrink: true }}
                                                                sx={{ '& .MuiInputBase-root': { fontSize: '0.9rem' } }}
                                                            >
                                                                <MenuItem value="">Select</MenuItem>
                                                                <MenuItem value="0">No Backlogs</MenuItem>
                                                                <MenuItem value="1">1</MenuItem>
                                                                <MenuItem value="2">2</MenuItem>
                                                                <MenuItem value="3">3</MenuItem>
                                                                <MenuItem value="4">4</MenuItem>
                                                                <MenuItem value="5">5+</MenuItem>
                                                            </TextField>
                                                        ) : (
                                                            <div className="text-center text-gray-400 text-sm">—</div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Subject-wise Marks Row - Show when subjects are selected and this level requires marks (if not exempted) */}
                                                    {shouldShowMandatorySubjects && 
                                                     shouldShowMarksInput && 
                                                     (selectedMandatorySubjects[level.key] || []).length > 0 && 
                                                     !(selectedMandatorySubjects[level.key] || []).includes('ALL') && 
                                                     !(selectedMandatorySubjects[level.key] || []).includes('NO') && (
                                                        <div className="col-span-1 sm:col-span-8 p-2 bg-[#E4572E]/10 rounded-lg border border-[#E4572E]/30 mt-1">
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <span className="text-sm font-medium text-[#E4572E]">
                                                                    📝 Marks in Selected Subjects:
                                                                </span>
                                                                {(selectedMandatorySubjects[level.key] || []).map(subject => (
                                                                    <div key={subject} className="flex items-center gap-1">
                                                                        <span className="text-sm text-[#FBF6EE]/70">{subject}:</span>
                                                                        <TextField
                                                                            size="small"
                                                                            type="number"
                                                                            value={(subjectWiseMarks[level.key] || {})[subject] || ''}
                                                                            onChange={(e) => setSubjectWiseMarks(prev => ({
                                                                                ...prev,
                                                                                [level.key]: {
                                                                                    ...(prev[level.key] || {}),
                                                                                    [subject]: e.target.value
                                                                                }
                                                                            }))}
                                                                            InputProps={{
                                                                                endAdornment: <span className="text-sm text-gray-500">%</span>,
                                                                                inputProps: { min: 0, max: 100 }
                                                                            }}
                                                                            sx={{ 
                                                                                width: 80,
                                                                                '& .MuiInputBase-root': { fontSize: '0.9rem' },
                                                                                '& .MuiInputBase-input': { padding: '4px 8px' }
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                                );
                                            })}
                                        </div>
                                    )}
                                    
                                </div>
                            )}

                            {/* Section 5: NCC & Sports */}
                            {(examData || searchMode === 'eligibility') && (
                                <div className="p-3 mb-3 rounded-lg border-l-4 border-l-[#9b8ec4] bg-[#9b8ec4]/8 border border-[#9b8ec4]/15">
                                    <h2 className="text-base font-semibold text-[#9b8ec4] mb-3 text-left">
                                        NCC & Sports Details
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                        <TextField
                                            select
                                            fullWidth
                                            label="NCC Wing"
                                            value={formData.ncc_wing}
                                            onChange={handleChange("ncc_wing")}
                                            helperText="NCC wing (if any)"
                                            size="small"
                                        >
                                            {nccWingOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        {/* NCC Certificate + NCC Grade: side by side on mobile */}
                                        <div className="grid grid-cols-2 gap-2 sm:contents">
                                        <TextField
                                            select
                                            fullWidth
                                            label="NCC Certificate"
                                            value={formData.ncc_certificate}
                                            onChange={handleChange("ncc_certificate")}
                                            helperText="NCC certificate level"
                                            size="small"
                                        >
                                            {nccCertificateOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        <TextField
                                            select
                                            fullWidth
                                            label="NCC Certificate Grade"
                                            value={formData.ncc_certificate_grade}
                                            onChange={handleChange("ncc_certificate_grade")}
                                            helperText="NCC certificate grade"
                                            size="small"
                                        >
                                            {nccCertificateGradeOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            {(examData || searchMode === 'eligibility') && (
                                <div className="flex justify-center mt-4">
                                    <Button
                                        variant="contained"
                                        size="medium"
                                        onClick={handleCheckEligibility}
                                        disabled={loading}
                                        sx={{
                                            backgroundColor: "#E4572E",
                                            "&:hover": {
                                                backgroundColor: "#c9421e",
                                            },
                                            borderRadius: "20px",
                                            paddingX: 3,
                                            paddingY: 1,
                                            textTransform: "none",
                                            fontWeight: 600,
                                            fontSize: "0.9rem",
                                        }}
                                    >
                                        {loading ? 'Checking...' : 'Check Eligibility and Attempts'}
                                    </Button>
                                </div>
                            )}
                            </Box>
                        </div>
                    </div>

                    {/* Results Section - Side by Side */}
                    {/* Results Section - For Exam Basis Mode (Side by Side) */}
                    {showResults && results.length > 0 && searchMode === 'exam' && (
                        <div ref={resultsRef} className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-[#2B1E17]/40 backdrop-blur-sm rounded-xl shadow-lg p-3 border border-[#E4572E]/40">
                                {renderResultsSummary()}
                            </div>
                            
                            <div className="bg-[#2B1E17]/40 backdrop-blur-sm rounded-xl shadow-lg p-3 border border-[#E4572E]/40">
                                {renderDetailedResultsInline()}
                            </div>
                        </div>
                    )}

                    {/* Results Section - For Eligibility Basis Mode (Full Width Unified Table) */}
                    {showResults && eligibilityBasisResults && searchMode === 'eligibility' && (
                        <div ref={resultsRef} className="mt-4">
                            {renderResultsSummary()}
                        </div>
                    )}

                </div>
            </div>
        </ThemeProvider>
    );
}

export default CheckEligibilityPage;
