import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Box, TextField, Button, Typography, Alert, Paper, MenuItem, Grid, Avatar, Divider, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { deleteUser } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
    getCoursesForLevel,
    getSubjectsForCourse,
    loadEduFinalData,
    getStatusOptionsForCourse,
    getActiveBacklogsOptionsForLevel,
    getGapYearsOptionsForLevel
} from '../eligibility/checker/education_level';
import { GENDER_OPTIONS, CASTE_CATEGORY_OPTIONS, PWD_STATUS_OPTIONS, NCC_WING_OPTIONS, NCC_CERTIFICATE_OPTIONS, NCC_GRADE_OPTIONS, NATIONALITY_OPTIONS, DOMICILE_OPTIONS, getMaritalStatusOptionsForGender } from '../config/field';

// ============================================
// THEME (matching eligibility page)
// ============================================
const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#E4572E' },
        background: { default: 'transparent', paper: '#3d2419' },
        text: { primary: '#FBF6EE', secondary: 'rgba(232,216,195,0.7)' },
    },
    components: {
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiInputBase-input': { color: '#FBF6EE', fontSize: '0.9rem' },
                    '& .MuiInputLabel-root': { color: 'rgba(232,216,195,0.7)', fontSize: '0.82rem' },
                    '& .MuiFormHelperText-root': { color: 'rgba(232,216,195,0.8)', fontSize: '0.70rem' },
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(228,87,46,0.4)' },
                        '&:hover fieldset': { borderColor: '#E4572E' },
                        '&.Mui-focused fieldset': { borderColor: '#E4572E' },
                    },
                },
            },
        },
        MuiMenuItem: { styleOverrides: { root: { fontSize: '0.82rem', color: '#FBF6EE' } } },
        MuiPopover: { defaultProps: { disableScrollLock: true } },
        MuiMenu: {
            defaultProps: { disableScrollLock: true },
            styleOverrides: {
                paper: { maxHeight: 220 },
                list: {
                    maxHeight: 220, overflowY: 'auto', scrollbarWidth: 'thin',
                    scrollbarColor: '#E4572E rgba(43,30,23,0.5)',
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-track': { background: 'rgba(43,30,23,0.5)', borderRadius: '999px' },
                    '&::-webkit-scrollbar-thumb': { background: '#E4572E', borderRadius: '999px' },
                },
            },
        },
    },
});

// ============================================
// CONSTANTS (same as eligibility page)
// ============================================
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

const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [{ value: '', label: 'Year' }];
    for (let year = currentYear; year >= currentYear - 50; year--) {
        years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
};
const yearOptions = generateYearOptions();

const eduLevelColors = [
    { border: '#E4572E', bg: 'rgba(228,87,46,0.08)', text: '#E4572E' },
    { border: '#E8D8C3', bg: 'rgba(232,216,195,0.08)', text: '#E8D8C3' },
    { border: '#5b8a72', bg: 'rgba(91,138,114,0.08)', text: '#5b8a72' },
    { border: '#9b8ec4', bg: 'rgba(155,142,196,0.08)', text: '#9b8ec4' },
    { border: '#4da6c9', bg: 'rgba(77,166,201,0.08)', text: '#4da6c9' },
    { border: '#c9a84c', bg: 'rgba(201,168,76,0.08)', text: '#c9a84c' },
    { border: '#d4726a', bg: 'rgba(212,114,106,0.08)', text: '#d4726a' },
    { border: '#6b9e78', bg: 'rgba(107,158,120,0.08)', text: '#6b9e78' },
    { border: '#b8860b', bg: 'rgba(184,134,11,0.08)', text: '#b8860b' },
];

const dropdownOptions = {
    gender: GENDER_OPTIONS,
    nationality: NATIONALITY_OPTIONS,
    caste_category: CASTE_CATEGORY_OPTIONS,
    pwd_status: PWD_STATUS_OPTIONS,
    ncc_wing: NCC_WING_OPTIONS,
    ncc_certificate: NCC_CERTIFICATE_OPTIONS,
    ncc_certificate_grade: NCC_GRADE_OPTIONS,
    domicile: DOMICILE_OPTIONS,
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function ProfilePage() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [consentInfo, setConsentInfo] = useState({
        accepted: false,
        acceptedAt: null,
        version: ''
    });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Form data — EXACT same keys as eligibility page
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

    // Date picker state
    const [dateDay, setDateDay] = useState("");
    const [dateMonth, setDateMonth] = useState("");
    const [dateYear, setDateYear] = useState("");

    const dayOptions = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1).padStart(2, '0'), label: String(i + 1) }));
    const monthOptions = [
        { value: '01', label: 'January' }, { value: '02', label: 'February' }, { value: '03', label: 'March' },
        { value: '04', label: 'April' }, { value: '05', label: 'May' }, { value: '06', label: 'June' },
        { value: '07', label: 'July' }, { value: '08', label: 'August' }, { value: '09', label: 'September' },
        { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
    ];
    const currentYear = new Date().getFullYear();
    const birthYearOptions = Array.from({ length: 100 }, (_, i) => ({
        value: String(currentYear - 15 - i), label: String(currentYear - 15 - i)
    }));

    // Domicile control
    const [isDomicileDisabled, setIsDomicileDisabled] = useState(true);

    // Education state
    const [visibleEducationLevels, setVisibleEducationLevels] = useState([]);
    const [educationTableData, setEducationTableData] = useState({});
    const [courseOptions, setCourseOptions] = useState([]);
    const [subjectOptions, setSubjectOptions] = useState([]);

    const [maritalStatusOptions, setMaritalStatusOptions] = useState(getMaritalStatusOptionsForGender());

    const parseConsentDate = (value) => {
        if (!value) return null;
        if (typeof value?.toDate === 'function') return value.toDate();
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const formatConsentDate = (date) => {
        if (!date) return 'Not available';
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // ============================================
    // LOAD DATA ON MOUNT
    // ============================================
    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        loadEduFinalData();
        async function loadProfile() {
            setLoading(true);
            try {
                const docRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const {
                        educationTableData: savedEducationTableData,
                        serviceNoticeConsent,
                        noticeConsentAccepted,
                        noticeConsentAcceptedAt,
                        ...profileFields
                    } = data;

                    const accepted = serviceNoticeConsent?.accepted === true || noticeConsentAccepted === true;
                    const acceptedAt = parseConsentDate(serviceNoticeConsent?.acceptedAt) || parseConsentDate(noticeConsentAcceptedAt);
                    setConsentInfo({
                        accepted,
                        acceptedAt,
                        version: serviceNoticeConsent?.version || ''
                    });

                    // Load personal data
                    setFormData(prev => ({ ...prev, ...profileFields }));
                    // Load date parts
                    if (profileFields.date_of_birth) {
                        const [y, m, d] = profileFields.date_of_birth.split('-');
                        setDateYear(y || '');
                        setDateMonth(m || '');
                        setDateDay(d || '');
                    }
                    // Handle dynamic marital options on load
                    if (profileFields.gender) {
                        setMaritalStatusOptions(getMaritalStatusOptionsForGender(profileFields.gender));
                    }
                    // Domicile control
                    if (profileFields.nationality) {
                        setIsDomicileDisabled(profileFields.nationality.toUpperCase() !== 'INDIAN');
                    }
                    // Load education table
                    if (profileFields.highest_education_qualification) {
                        const levelIndex = EDUCATION_HIERARCHY.findIndex(h => h.key === profileFields.highest_education_qualification);
                        if (levelIndex !== -1) {
                            setVisibleEducationLevels(EDUCATION_HIERARCHY.slice(levelIndex));
                        }
                        const courses = getCoursesForLevel(profileFields.highest_education_qualification);
                        setCourseOptions(courses);
                        if (profileFields.eligibility_education_course) {
                            const subjects = getSubjectsForCourse(profileFields.eligibility_education_course, profileFields.highest_education_qualification);
                            setSubjectOptions(subjects);
                        }
                    }
                    if (savedEducationTableData) {
                        setEducationTableData(savedEducationTableData);
                    }
                }
            } catch (err) {
                console.error("Failed to load profile:", err);
            }
            setLoading(false);
        }
        loadProfile();
    }, [currentUser, navigate]);

    // ============================================
    // HANDLERS
    // ============================================
    const handleChange = (field) => (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));
        
        if (field === 'gender') {
            const newOptions = getMaritalStatusOptionsForGender(value);
            setMaritalStatusOptions(newOptions);
            // Auto-clear marital status if it's no longer valid
            setFormData(prev => {
                if (prev.marital_status && !newOptions.some(opt => opt.value === prev.marital_status)) {
                    return { ...prev, marital_status: '' };
                }
                return prev;
            });
        }
        
        if (field === 'nationality') {
            const isIndian = value && value.toUpperCase() === 'INDIAN';
            setIsDomicileDisabled(!isIndian);
            if (!isIndian) setFormData(prev => ({ ...prev, domicile: '' }));
        }
    };

    const handleDateChange = (part) => (event) => {
        const value = event.target.value;
        if (part === 'day') setDateDay(value);
        if (part === 'month') setDateMonth(value);
        if (part === 'year') setDateYear(value);
        const day = part === 'day' ? value : dateDay;
        const month = part === 'month' ? value : dateMonth;
        const year = part === 'year' ? value : dateYear;
        if (day && month && year) {
            setFormData(prev => ({ ...prev, date_of_birth: `${year}-${month}-${day}` }));
        } else {
            setFormData(prev => ({ ...prev, date_of_birth: '' }));
        }
    };

    const handleEducationLevelChange = (event) => {
        const level = event.target.value;
        setFormData(prev => ({
            ...prev,
            highest_education_qualification: level,
            eligibility_education_course: '',
            eligibility_education_course_subject: '',
        }));
        const courses = getCoursesForLevel(level);
        setCourseOptions(courses);
        setSubjectOptions([]);
        const levelIndex = EDUCATION_HIERARCHY.findIndex(h => h.key === level);
        if (levelIndex !== -1) {
            const visibleLevels = EDUCATION_HIERARCHY.slice(levelIndex);
            setVisibleEducationLevels(visibleLevels);
            const newTableData = {};
            visibleLevels.forEach(lvl => {
                newTableData[lvl.key] = educationTableData[lvl.key] || {
                    course: '', subject: '', completionStatus: '', marks: '', completedYear: '', activeBacklogs: '', gapYears: ''
                };
            });
            setEducationTableData(newTableData);
        } else {
            setVisibleEducationLevels([]);
            setEducationTableData({});
        }
    };

    const handleCourseChange = (e) => {
        const course = e.target.value;
        setFormData(prev => ({ ...prev, eligibility_education_course: course, eligibility_education_course_subject: '' }));
        const subjects = getSubjectsForCourse(course, formData.highest_education_qualification);
        setSubjectOptions(subjects);
    };

    const handleEducationTableChange = (levelKey, field, value) => {
        setEducationTableData(prev => {
            const updated = { ...prev, [levelKey]: { ...prev[levelKey], [field]: value } };
            // Reset subject when course changes
            if (field === 'course') {
                updated[levelKey].subject = '';
            }
            return updated;
        });
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);
        try {
            const docRef = doc(db, 'users', currentUser.uid);
            await setDoc(docRef, {
                ...formData,
                educationTableData: educationTableData,
            }, { merge: true });
            setMessage('Profile updated successfully!');
        } catch (err) {
            setError('Failed to update profile: ' + err.message);
        }
        setLoading(false);
    }

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            setError('Failed to log out: ' + err.message);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            setDeleteDialogOpen(false);
            setLoading(true);
            await deleteUser(currentUser);
            navigate('/login');
        } catch (err) {
            setError('Failed to delete account. You may need to re-authenticate first: ' + err.message);
            setLoading(false);
        }
    };

    // Helper to render a dropdown field
    const renderDropdown = (key, label, options, extra = {}) => (
        <TextField
            select fullWidth size="small" label={label}
            value={formData[key] || ''}
            onChange={handleChange(key)}
            helperText={extra.helperText}
            disabled={extra.disabled}
        >
            {options.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
        </TextField>
    );

    const highestLevelStatusOptions = getStatusOptionsForCourse(
        formData.eligibility_education_course,
        formData.highest_education_qualification
    );

    if (loading && !formData.date_of_birth) {
        return <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#2b1e17', color: '#E4572E' }}>Loading...</Box>;
    }

    return (
        <ThemeProvider theme={theme}>
        <Box sx={{ minHeight: '100vh', py: 8, px: 2, bgcolor: '#2b1e17' }}>
            <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, width: '100%', maxWidth: 1200, mx: 'auto', bgcolor: '#3d2419', color: '#FBF6EE' }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

                <Grid container spacing={4}>
                    {/* ========== LEFT SIDEBAR ========== */}
                    <Grid item xs={12} md={4} lg={3}>
                        <Box display="flex" flexDirection="column" alignItems="center" p={3} sx={{ bgcolor: 'rgba(0,0,0,0.15)', borderRadius: 2, height: 'fit-content', position: 'sticky', top: 32, zIndex: 10 }}>
                            <Avatar
                                src={currentUser?.photoURL || ''}
                                sx={{ width: 100, height: 100, mb: 2, bgcolor: '#E4572E', fontSize: '2.5rem', border: '4px solid #E8D8C3' }}
                            >
                                {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : (currentUser?.email ? currentUser.email[0].toUpperCase() : 'U')}
                            </Avatar>
                            
                            <Typography variant="h6" fontWeight="bold" textAlign="center" gutterBottom color="#E8D8C3">
                                {currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'User')}
                            </Typography>
                            <Typography variant="body2" color="rgba(232,216,195,0.7)" textAlign="center" sx={{ wordBreak: 'break-all' }} mb={3}>
                                {currentUser?.email}
                            </Typography>
                            
                            <Divider sx={{ width: '100%', mb: 3, borderColor: 'rgba(232,216,195,0.1)' }} />
                            
                            <Alert severity={consentInfo.accepted ? "success" : "warning"} sx={{ width: '100%', mb: 3, '& .MuiAlert-message': { width: '100%' } }}>
                                <Typography variant="body2" fontWeight={600}>
                                    Notice consent: {consentInfo.accepted ? 'Agreed' : 'Pending'}
                                </Typography>
                                {consentInfo.accepted && (
                                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                        Accepted on: {formatConsentDate(consentInfo.acceptedAt)}
                                        {consentInfo.version ? ` | Version: ${consentInfo.version}` : ''}
                                    </Typography>
                                )}
                            </Alert>

                            <Box sx={{ flexGrow: 1 }} />

                            <Button 
                                variant="outlined" 
                                color="error" 
                                fullWidth 
                                onClick={() => setDeleteDialogOpen(true)}
                                sx={{ mt: 2 }}
                            >
                                Delete Account
                            </Button>
                        </Box>
                    </Grid>

                    {/* ========== RIGHT CONTENT ========== */}
                    <Grid item xs={12} md={8} lg={9}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Typography variant="h4" color="#E4572E">My Profile</Typography>
                            <Button variant="outlined" onClick={handleLogout} sx={{ color: '#E4572E', borderColor: '#E4572E', '&:hover': { borderColor: '#c9421e' } }}>Log Out</Button>
                        </Box>
                        
                        <Typography mb={3} sx={{ color: 'rgba(232,216,195,0.7)', fontSize: '0.9rem' }}>
                            Fill out these fields and save. Next time you check eligibility, hit "Fill Your Saved Details" to load them instantly!
                        </Typography>
                        
                        <form onSubmit={handleSubmit}>
                    {/* ========== Section 1: Personal Information ========== */}
                    <div className="p-3 mb-4 rounded-lg border-l-4 border-l-[#E8D8C3] bg-[#E8D8C3]/5 border border-[#E8D8C3]/15">
                        <h2 className="text-base font-semibold text-[#E8D8C3] mb-3 text-left">
                            Personal Information
                        </h2>
                        <div className="flex flex-col gap-4 max-w-md">
                            {/* Date of Birth - Split dropdowns */}
                            <div className="flex gap-2">
                                <TextField select label="Day" value={dateDay} onChange={handleDateChange('day')} size="small" sx={{ flex: 1 }}>
                                    <MenuItem value="">Day</MenuItem>
                                    {dayOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                </TextField>
                                <TextField select label="Month" value={dateMonth} onChange={handleDateChange('month')} size="small" sx={{ flex: 1.5 }}>
                                    <MenuItem value="">Month</MenuItem>
                                    {monthOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                </TextField>
                                <TextField select label="Year" value={dateYear} onChange={handleDateChange('year')} size="small" sx={{ flex: 1 }}>
                                    <MenuItem value="">Year</MenuItem>
                                    {birthYearOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                </TextField>
                            </div>

                            {renderDropdown('gender', 'Gender', dropdownOptions.gender, { helperText: 'Select your gender' })}
                            {renderDropdown('marital_status', 'Marital Status', maritalStatusOptions, { helperText: 'Select your marital status' })}
                            {renderDropdown('nationality', 'Nationality', dropdownOptions.nationality, { helperText: 'Select your nationality' })}
                            {renderDropdown('domicile', 'Domicile State', dropdownOptions.domicile, {
                                helperText: isDomicileDisabled ? "Select 'INDIAN' nationality first" : 'Your domicile state',
                                disabled: isDomicileDisabled
                            })}
                            {renderDropdown('caste_category', 'Caste/Category', dropdownOptions.caste_category, { helperText: 'Select your category' })}
                            {renderDropdown('pwd_status', 'Person with Disability', dropdownOptions.pwd_status, { helperText: 'Are you a PwD candidate?' })}
                        </div>
                    </div>

                    {/* ========== Section 2: Educational Qualification ========== */}
                    <div className="p-3 mb-4 rounded-lg border-l-4 border-l-[#5b8a72] bg-[#5b8a72]/5 border border-[#5b8a72]/15">
                        <h2 className="text-base font-semibold text-[#5b8a72] mb-3 text-left">
                            Educational Qualification
                        </h2>
                        
                        <div className="mb-4 max-w-md">
                            <TextField
                                select fullWidth
                                label="Highest Education Qualification"
                                value={formData.highest_education_qualification}
                                onChange={handleEducationLevelChange}
                                helperText="Select your highest qualification level"
                                size="small"
                            >
                                {staticEducationOptions.map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                            </TextField>
                        </div>

                        
                        {/* Per-level education table */}
                        {visibleEducationLevels.length > 0 && (
                            <div className="overflow-x-auto">
                                {visibleEducationLevels.map((level, levelIndex) => {
                                    const levelColor = eduLevelColors[levelIndex % eduLevelColors.length];
                                    const levelData = educationTableData[level.key] || {};
                                    const levelCourses = getCoursesForLevel(level.key);
                                    const levelSubjects = levelData.course ? getSubjectsForCourse(levelData.course, level.key) : [];
                                    const levelStatusOptions = getStatusOptionsForCourse(levelData.course, level.key);
                                    const levelBacklogOptions = getActiveBacklogsOptionsForLevel(level.key);
                                    const levelGapYearOptions = getGapYearsOptionsForLevel(level.key);
                                    
                                    return (
                                        <div 
                                            key={level.key}
                                            className="flex flex-col gap-4 mb-5 p-4 rounded-lg border-l-4 max-w-md"
                                            style={{ backgroundColor: levelColor.bg, borderLeftColor: levelColor.border, borderTop: `1px solid ${levelColor.border}25`, borderRight: `1px solid ${levelColor.border}25`, borderBottom: `1px solid ${levelColor.border}25` }}
                                        >
                                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: levelColor.text, mb: 1 }}>
                                                {level.label}
                                            </Typography>
                                            
                                            <TextField
                                                select fullWidth size="small" label="Course/Stream"
                                                value={levelData.course || ''}
                                                onChange={(e) => handleEducationTableChange(level.key, 'course', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ '& .MuiInputBase-root': { fontSize: '0.9rem' } }}
                                            >
                                                <MenuItem value="">Select</MenuItem>
                                                {levelCourses.map(opt => (
                                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                                ))}
                                            </TextField>
                                            
                                            <TextField
                                                select fullWidth size="small" label="Subject"
                                                value={levelData.subject || ''}
                                                onChange={(e) => handleEducationTableChange(level.key, 'subject', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                disabled={!levelData.course}
                                                sx={{ '& .MuiInputBase-root': { fontSize: '0.9rem' } }}
                                            >
                                                <MenuItem value="">Select</MenuItem>
                                                {levelSubjects.map(opt => (
                                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                                ))}
                                            </TextField>
                                            
                                            <TextField
                                                select fullWidth size="small" label="Status"
                                                value={levelData.completionStatus || ''}
                                                onChange={(e) => handleEducationTableChange(level.key, 'completionStatus', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ '& .MuiInputBase-root': { fontSize: '0.9rem' } }}
                                            >
                                                {levelStatusOptions.map(opt => (
                                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                                ))}
                                            </TextField>
                                            
                                            <TextField
                                                fullWidth size="small" label="Marks" type="number"
                                                value={levelData.marks || ''}
                                                onChange={(e) => handleEducationTableChange(level.key, 'marks', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{ min: 0, max: 100 }}
                                                sx={{ '& .MuiInputBase-root': { fontSize: '0.9rem' } }}
                                            />
                                            
                                            <TextField
                                                select fullWidth size="small" label="Year"
                                                value={levelData.completedYear || ''}
                                                onChange={(e) => handleEducationTableChange(level.key, 'completedYear', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ '& .MuiInputBase-root': { fontSize: '0.9rem' } }}
                                            >
                                                {yearOptions.map(opt => (
                                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                                ))}
                                            </TextField>

                                            <TextField
                                                select fullWidth size="small" label="Active Backlogs"
                                                value={levelData.activeBacklogs || ''}
                                                onChange={(e) => handleEducationTableChange(level.key, 'activeBacklogs', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ '& .MuiInputBase-root': { fontSize: '0.9rem' } }}
                                            >
                                                {levelBacklogOptions.map((opt) => (
                                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                                ))}
                                            </TextField>

                                            <TextField
                                                select fullWidth size="small" label="Gap Years"
                                                value={levelData.gapYears || ''}
                                                onChange={(e) => handleEducationTableChange(level.key, 'gapYears', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ '& .MuiInputBase-root': { fontSize: '0.9rem' } }}
                                            >
                                                {levelGapYearOptions.map((opt) => (
                                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                                ))}
                                            </TextField>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ========== Section 3: NCC Details ========== */}
                    <div className="p-3 mb-4 rounded-lg border-l-4 border-l-[#9b8ec4] bg-[#9b8ec4]/5 border border-[#9b8ec4]/15">
                        <h2 className="text-base font-semibold text-[#9b8ec4] mb-3 text-left">
                            NCC Details
                        </h2>
                        <div className="flex flex-col gap-4 max-w-md">
                            {renderDropdown('ncc_wing', 'NCC Wing', dropdownOptions.ncc_wing)}
                            {renderDropdown('ncc_certificate', 'NCC Certificate', dropdownOptions.ncc_certificate)}
                            {renderDropdown('ncc_certificate_grade', 'NCC Grade', dropdownOptions.ncc_certificate_grade)}
                        </div>
                    </div>

                    <Box mt={4} display="flex" justifyContent="center">
                        <Button disabled={loading} type="submit" variant="contained" size="large" sx={{ bgcolor: '#E4572E', '&:hover': { bgcolor: '#c9421e' }, minWidth: 200 }}>
                            Save Profile
                        </Button>
                    </Box>
                </form>
                    </Grid>
                </Grid>
            </Paper>
            
            {/* Delete Confirmation Dialog */}
            <Dialog 
                open={deleteDialogOpen} 
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{ sx: { bgcolor: '#3d2419', color: '#FBF6EE' } }}
            >
                <DialogTitle color="#E4572E">Delete Account?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        Are you sure you want to permanently delete your account? This action cannot be undone and you will lose all saved profile details and eligibility history.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, color: '#E4572E' }}>
                        Note: For security reasons, if you haven't logged in recently, you may be asked to re-authenticate first.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: 'rgba(232,216,195,0.7)' }}>Cancel</Button>
                    <Button onClick={handleDeleteAccount} color="error" variant="contained" disabled={loading}>
                        Yes, Delete Account
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
        </ThemeProvider>
    );
}
