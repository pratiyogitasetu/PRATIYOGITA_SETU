import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  User,
  GraduationCap,
  Shield,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  Info,
  Check,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  getCoursesForLevel,
  getSubjectsForCourse,
  loadEduFinalData,
  getStatusOptionsForCourse,
  getActiveBacklogsOptionsForLevel,
  getGapYearsOptionsForLevel
} from '../eligibility/checker/education_level';
import {
  getGenderOptionsFromMongo,
  getMaritalStatusOptionsFromMongo,
  getNationalityOptionsFromMongo,
  getDomicileOptionsFromMongo,
  getCasteCategoryOptionsFromMongo,
  getNccWingOptionsFromMongo,
  getNccCertificateOptionsFromMongo,
  getNccCertificateGradeOptionsFromMongo,
  getHighestEducationQualificationOptionsFromMongo
} from '../eligibility/examDataLoader';
import { PWD_STATUS_OPTIONS } from '../config/field';

// Educational hierarchy matching MongoDB and eligibility matrix
const EDUCATION_TIERS = [
  {
    key: 'POST DOCTORATE',
    name: 'Post Doctorate',
    color: '#ef4444',
    badgeText: '#f87171'
  },
  {
    key: 'PHD',
    name: 'PhD',
    color: '#d97706',
    badgeText: '#fbbf24'
  },
  {
    key: 'POST GRADUATION',
    name: 'Post Graduation',
    color: '#10b981',
    badgeText: '#34d399'
  },
  {
    key: 'GRADUATION',
    name: 'Graduation',
    color: '#8b5cf6',
    badgeText: '#c4b5fd'
  },
  {
    key: 'DIPLOMA / ITI (POLYTECHNIC, ITI, DPHARM, PGDCA)',
    name: 'Diploma / ITI',
    color: '#06b6d4',
    badgeText: '#67e8f9'
  },
  {
    key: '(12TH)HIGHER SECONDARY',
    name: '12th Higher Secondary',
    color: '#f59e0b',
    badgeText: '#fde68a'
  },
  {
    key: '(10TH)SECONDARY',
    name: '10th Secondary',
    color: '#f43f5e',
    badgeText: '#fecdd3'
  },
  {
    key: '(8TH)MIDDLE SCHOOL',
    name: '8th Middle School',
    color: '#14b8a6',
    badgeText: '#99f6e4'
  },
  {
    key: '(5TH)PRIMARY SCHOOL',
    name: '5th Primary School',
    color: '#b45309',
    badgeText: '#fed7aa'
  }
];

// Generate year options from 2026 down to 1975
const YEAR_OPTIONS = Array.from({ length: 52 }, (_, i) => 2026 - i);

// Helper functions to safely extract value and label from strings or option objects
const getOptionValue = (opt) => (typeof opt === 'object' && opt !== null ? opt.value : opt);
const getOptionLabel = (opt) => (typeof opt === 'object' && opt !== null ? (opt.label ?? opt.value) : opt);

const createInitialEducationData = () => {
  const data = {};
  EDUCATION_TIERS.forEach((tier) => {
    data[tier.key] = {
      course: '',
      subject: '',
      haveYouStudied: '-',
      completionStatus: '',
      marks: '',
      completedYear: '',
      activeBacklogs: '-',
      gapYears: '-'
    };
  });
  return data;
};

export default function ProfilePage() {
  const { currentUser, getUserProfile } = useAuth();
  const navigate = useNavigate();

  // Loading & Feedback
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    gender: '',
    maritalStatus: '',
    nationality: 'INDIAN',
    domicileState: '',
    casteCategory: '',
    pwdCandidate: 'NO'
  });

  // 2. Educational Qualification State
  const [highestQualification, setHighestQualification] = useState('GRADUATION');
  const [educationRows, setEducationRows] = useState(createInitialEducationData);

  // 3. NCC Details State
  const [nccDetails, setNccDetails] = useState({
    wing: '',
    certificate: '',
    grade: ''
  });

  // Dynamic MongoDB Atlas Dropdown Options
  const [genderOptions, setGenderOptions] = useState([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState([]);
  const [nationalityOptions, setNationalityOptions] = useState([]);
  const [domicileOptions, setDomicileOptions] = useState([]);
  const [casteOptions, setCasteOptions] = useState([]);
  const [highestEduOptions, setHighestEduOptions] = useState([]);
  const [nccWingOptions, setNccWingOptions] = useState([]);
  const [nccCertificateOptions, setNccCertificateOptions] = useState([]);
  const [nccCertificateGradeOptions, setNccCertificateGradeOptions] = useState([]);

  // Per-tier dynamic course and subject options loaded from MongoDB
  const [tierCourseOptions, setTierCourseOptions] = useState({});
  const [tierSubjectOptions, setTierSubjectOptions] = useState({});

  // 1. Load Dropdown Options from MongoDB Atlas
  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        await loadEduFinalData();

        const [
          genders,
          maritals,
          nationalities,
          domiciles,
          castes,
          nccWings,
          nccCerts,
          nccGrades,
          highestEdus
        ] = await Promise.all([
          getGenderOptionsFromMongo(),
          getMaritalStatusOptionsFromMongo(),
          getNationalityOptionsFromMongo(),
          getDomicileOptionsFromMongo(),
          getCasteCategoryOptionsFromMongo(),
          getNccWingOptionsFromMongo(),
          getNccCertificateOptionsFromMongo(),
          getNccCertificateGradeOptionsFromMongo(),
          getHighestEducationQualificationOptionsFromMongo()
        ]);

        if (!cancelled) {
          setGenderOptions(genders || []);
          setMaritalStatusOptions(maritals || []);
          setNationalityOptions(nationalities || []);
          setDomicileOptions(domiciles || []);
          setCasteOptions(castes || []);
          setNccWingOptions(nccWings || []);
          setNccCertificateOptions(nccCerts || []);
          setNccCertificateGradeOptions(nccGrades || []);
          setHighestEduOptions(highestEdus || []);

          // Load courses for each tier from MongoDB
          const coursesMap = {};
          EDUCATION_TIERS.forEach((tier) => {
            coursesMap[tier.key] = getCoursesForLevel(tier.key) || [];
          });
          setTierCourseOptions(coursesMap);
        }
      } catch (err) {
        console.error('Error fetching MongoDB eligibility fields:', err);
      }
    }

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Load Existing User Data from Firestore
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    let isMounted = true;

    async function loadUserData() {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && isMounted) {
          const data = userDoc.data();

          // DOB extraction
          let dobDay = '';
          let dobMonth = '';
          let dobYear = '';
          if (data.date_of_birth) {
            const parts = data.date_of_birth.split('-');
            if (parts.length === 3) {
              dobYear = parts[0];
              dobMonth = parts[1];
              dobDay = parts[2];
            }
          }

          setPersonalInfo({
            dobDay,
            dobMonth,
            dobYear,
            gender: data.gender || '',
            maritalStatus: data.marital_status || '',
            nationality: data.nationality || 'INDIAN',
            domicileState: data.domicile || '',
            casteCategory: data.caste_category || '',
            pwdCandidate: data.pwd_status || 'NO'
          });

          // Fetch gender-specific marital status options
          if (data.gender) {
            getMaritalStatusOptionsFromMongo(data.gender).then((opts) => {
              if (isMounted) setMaritalStatusOptions(opts);
            });
          }

          if (data.highest_education_qualification) {
            setHighestQualification(data.highest_education_qualification);
          }

          // Education table rows
          if (data.educationTableData && typeof data.educationTableData === 'object') {
            const merged = createInitialEducationData();
            Object.keys(data.educationTableData).forEach((key) => {
              merged[key] = {
                ...merged[key],
                ...data.educationTableData[key]
              };
            });
            setEducationRows(merged);

            // Populate subject options for rows with selected course
            const subjectsMap = {};
            Object.keys(merged).forEach((tierKey) => {
              const row = merged[tierKey];
              if (row.course) {
                subjectsMap[tierKey] = getSubjectsForCourse(row.course, tierKey) || [];
              }
            });
            setTierSubjectOptions(subjectsMap);
          }

          // NCC details
          setNccDetails({
            wing: data.ncc_wing || '',
            certificate: data.ncc_certificate || '',
            grade: data.ncc_certificate_grade || ''
          });
        }
      } catch (err) {
        console.error('Failed to load user profile from Firestore:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUserData();
    return () => {
      isMounted = false;
    };
  }, [currentUser, navigate]);

  // Handle personal info changes
  const handlePersonalInfoChange = (field, value) => {
    setPersonalInfo((prev) => ({ ...prev, [field]: value }));

    if (field === 'gender') {
      getMaritalStatusOptionsFromMongo(value).then((newOptions) => {
        setMaritalStatusOptions(newOptions);
        setPersonalInfo((prev) => {
          if (prev.maritalStatus && !newOptions.some((opt) => opt.value === prev.maritalStatus)) {
            return { ...prev, maritalStatus: '' };
          }
          return prev;
        });
      });
    }

    if (field === 'nationality') {
      const isIndian = value && value.toUpperCase() === 'INDIAN';
      if (!isIndian) {
        setPersonalInfo((prev) => ({ ...prev, domicileState: '' }));
      }
    }
  };

  // Handle education row changes
  const handleEducationRowChange = (tierKey, field, value) => {
    setEducationRows((prev) => {
      const updatedRow = {
        ...prev[tierKey],
        [field]: value
      };
      if (field === 'course') {
        updatedRow.subject = '';
        const subjects = getSubjectsForCourse(value, tierKey) || [];
        setTierSubjectOptions((subPrev) => ({ ...subPrev, [tierKey]: subjects }));
      }
      return {
        ...prev,
        [tierKey]: updatedRow
      };
    });
  };

  // Handle NCC changes
  const handleNccChange = (field, value) => {
    setNccDetails((prev) => ({ ...prev, [field]: value }));
  };

  // Save profile to Firestore
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setSaving(true);
    setErrorMessage('');
    setFeedbackMessage('');

    try {
      const dob =
        personalInfo.dobYear && personalInfo.dobMonth && personalInfo.dobDay
          ? `${personalInfo.dobYear}-${personalInfo.dobMonth}-${personalInfo.dobDay}`
          : '';

      const docRef = doc(db, 'users', currentUser.uid);
      await setDoc(
        docRef,
        {
          date_of_birth: dob,
          gender: personalInfo.gender,
          marital_status: personalInfo.maritalStatus,
          nationality: personalInfo.nationality,
          domicile: personalInfo.domicileState,
          caste_category: personalInfo.casteCategory,
          pwd_status: personalInfo.pwdCandidate,
          highest_education_qualification: highestQualification,
          educationTableData: educationRows,
          ncc_wing: nccDetails.wing,
          ncc_certificate: nccDetails.certificate,
          ncc_certificate_grade: nccDetails.grade,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      setFeedbackMessage('Profile and eligibility criteria successfully saved & synced!');
      setTimeout(() => setFeedbackMessage(''), 5000);
    } catch (err) {
      console.error('Error saving profile to Firestore:', err);
      setErrorMessage('Failed to save profile: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Reset Form
  const handleReset = () => {
    setPersonalInfo({
      dobDay: '01',
      dobMonth: '01',
      dobYear: '2000',
      gender: genderOptions[0]?.value || '',
      maritalStatus: maritalStatusOptions[0]?.value || '',
      nationality: 'INDIAN',
      domicileState: '',
      casteCategory: casteOptions[0]?.value || '',
      pwdCandidate: 'NO'
    });
    setHighestQualification('GRADUATION');
    setEducationRows(createInitialEducationData());
    setNccDetails({ wing: '', certificate: '', grade: '' });
    setFeedbackMessage('Form reset to default values.');
    setTimeout(() => setFeedbackMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-[#1E140F] text-[#FBF6EE] pt-20 pb-16 px-3 sm:px-6 max-w-7xl mx-auto space-y-6">
      
      {/* ========================================================================= */}
      {/* TOP HEADER & TITLE                                                        */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#2B1E17] border border-[#E4572E]/40 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#E4572E]/20 border border-[#E4572E]/50 flex items-center justify-center text-[#E4572E] shadow-sm">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                Pratiyogita Yogya Details
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-orange-500/20 text-[#f9734c] border border-orange-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Eligibility & Profile</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#E8D8C3]/80 mt-0.5">
              Personal Information, Educational Matrix & NCC Criteria synced across Pratiyogita Setu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 bg-[#1E140F] hover:bg-[#38261e] text-[#E8D8C3] rounded-xl transition-all text-xs sm:text-sm font-semibold flex items-center gap-1.5 border border-[#E4572E]/30 cursor-pointer"
            title="Reset Form"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#E4572E]" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-5 py-2 bg-[#E4572E] hover:bg-[#c9451e] text-white rounded-xl transition-all text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-orange-500/20 cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {feedbackMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5 shadow-md animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span className="font-semibold">{feedbackMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs sm:text-sm flex items-center gap-2.5 shadow-md">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: PERSONAL INFORMATION (Sleek Dark Container)                     */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-[#111827] border border-gray-800 shadow-xl p-4 sm:p-6 text-white transition-all">
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-[#f9734c] flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Personal Information
            </h2>
            <p className="text-[11px] text-gray-400">Basic aspirant identity and category criteria from MongoDB Atlas</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Date of Birth: 3 Inline Selects */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Date of Birth
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Day */}
              <div className="relative">
                <select
                  value={personalInfo.dobDay}
                  onChange={(e) => handlePersonalInfoChange('dobDay', e.target.value)}
                  className="w-full appearance-none bg-[#1f2937] border border-gray-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-gray-100 focus:outline-none focus:border-[#E4572E] transition-colors pr-8 cursor-pointer"
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => {
                    const day = String(i + 1).padStart(2, '0');
                    return (
                      <option key={day} value={day} className="bg-[#1f2937] text-white">
                        {day}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Month */}
              <div className="relative">
                <select
                  value={personalInfo.dobMonth}
                  onChange={(e) => handlePersonalInfoChange('dobMonth', e.target.value)}
                  className="w-full appearance-none bg-[#1f2937] border border-gray-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-gray-100 focus:outline-none focus:border-[#E4572E] transition-colors pr-8 cursor-pointer"
                >
                  <option value="">Month</option>
                  {[
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
                    { value: '12', label: 'December' }
                  ].map((m) => (
                    <option key={m.value} value={m.value} className="bg-[#1f2937] text-white">
                      {m.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Year */}
              <div className="relative">
                <select
                  value={personalInfo.dobYear}
                  onChange={(e) => handlePersonalInfoChange('dobYear', e.target.value)}
                  className="w-full appearance-none bg-[#1f2937] border border-gray-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-gray-100 focus:outline-none focus:border-[#E4572E] transition-colors pr-8 cursor-pointer"
                >
                  <option value="">Year</option>
                  {Array.from({ length: 60 }, (_, i) => {
                    const yr = String(new Date().getFullYear() - 14 - i);
                    return (
                      <option key={yr} value={yr} className="bg-[#1f2937] text-white">
                        {yr}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Gender */}
          <div>
            <div className="relative border border-gray-700 rounded-xl bg-[#1f2937] pt-3 pb-1.5 px-3 focus-within:border-[#E4572E] transition-colors">
              <span className="absolute -top-2.5 left-3 bg-[#1f2937] px-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Gender
              </span>
              <select
                value={personalInfo.gender}
                onChange={(e) => handlePersonalInfoChange('gender', e.target.value)}
                className="w-full bg-transparent text-sm sm:text-base text-gray-100 font-semibold focus:outline-none appearance-none pr-8 cursor-pointer"
              >
                <option value="" className="bg-[#1f2937] text-gray-400">Select Gender</option>
                {genderOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#1f2937] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1 pl-1">Select your gender (dynamically fetched from MongoDB)</p>
          </div>

          {/* Marital Status */}
          <div>
            <div className="relative border border-gray-700 rounded-xl bg-[#1f2937] py-2.5 px-3 focus-within:border-[#E4572E] transition-colors">
              <select
                value={personalInfo.maritalStatus}
                onChange={(e) => handlePersonalInfoChange('maritalStatus', e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-gray-200 focus:outline-none appearance-none pr-8 cursor-pointer"
              >
                <option value="" className="bg-[#1f2937] text-gray-400">Select Marital Status</option>
                {maritalStatusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#1f2937] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1 pl-1">Select your marital status (dynamically filtered by gender)</p>
          </div>

          {/* Nationality */}
          <div>
            <div className="relative border border-gray-700 rounded-xl bg-[#1f2937] pt-3 pb-1.5 px-3 focus-within:border-[#E4572E] transition-colors">
              <span className="absolute -top-2.5 left-3 bg-[#1f2937] px-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Nationality
              </span>
              <select
                value={personalInfo.nationality}
                onChange={(e) => handlePersonalInfoChange('nationality', e.target.value)}
                className="w-full bg-transparent text-sm sm:text-base text-gray-100 font-semibold focus:outline-none appearance-none pr-8 cursor-pointer"
              >
                <option value="" className="bg-[#1f2937] text-gray-400">Select Nationality</option>
                {nationalityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#1f2937] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1 pl-1">Select your nationality</p>
          </div>

          {/* Domicile State */}
          <div>
            <div className={`relative border rounded-xl bg-[#1f2937] py-2.5 px-3 transition-colors ${
              personalInfo.nationality.toUpperCase() !== 'INDIAN'
                ? 'border-gray-800 opacity-60'
                : 'border-gray-700 focus-within:border-[#E4572E]'
            }`}>
              <select
                value={personalInfo.domicileState}
                onChange={(e) => handlePersonalInfoChange('domicileState', e.target.value)}
                disabled={personalInfo.nationality.toUpperCase() !== 'INDIAN'}
                className="w-full bg-transparent text-xs sm:text-sm text-gray-200 focus:outline-none appearance-none pr-8 cursor-pointer disabled:cursor-not-allowed"
              >
                <option value="" className="bg-[#1f2937] text-gray-400">Select Domicile State</option>
                {domicileOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#1f2937] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1 pl-1">
              Your domicile state (Enabled for Indian citizens only)
            </p>
          </div>

          {/* Caste Category */}
          <div>
            <div className="relative border border-gray-700 rounded-xl bg-[#1f2937] py-2.5 px-3 focus-within:border-[#E4572E] transition-colors">
              <select
                value={personalInfo.casteCategory}
                onChange={(e) => handlePersonalInfoChange('casteCategory', e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-gray-200 focus:outline-none appearance-none pr-8 cursor-pointer"
              >
                <option value="" className="bg-[#1f2937] text-gray-400">Select Caste / Category</option>
                {casteOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#1f2937] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1 pl-1">Select your caste category</p>
          </div>

          {/* Person with Disability (PWD) */}
          <div>
            <div className="relative border border-gray-700 rounded-xl bg-[#1f2937] py-2.5 px-3 focus-within:border-[#E4572E] transition-colors">
              <select
                value={personalInfo.pwdCandidate}
                onChange={(e) => handlePersonalInfoChange('pwdCandidate', e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-gray-200 focus:outline-none appearance-none pr-8 cursor-pointer"
              >
                {PWD_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#1f2937] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1 pl-1">Are you a Person with Benchmark Disability (PwBD)?</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: EDUCATIONAL QUALIFICATION (Sleek Dark Container)               */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-[#111827] border border-gray-800 shadow-xl p-4 sm:p-6 text-white transition-all">
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Educational Qualification Matrix
            </h2>
            <p className="text-[11px] text-gray-400">
              Complete hierarchical qualifications (Doctorate to 5th Primary) loaded dynamically from MongoDB
            </p>
          </div>
        </div>

        {/* Highest Education Qualification Selector */}
        <div className="mb-5 max-w-sm">
          <div className="relative border border-gray-700 rounded-xl bg-[#1f2937] pt-3 pb-1.5 px-3 focus-within:border-emerald-500 transition-colors">
            <span className="absolute -top-2.5 left-3 bg-[#1f2937] px-1.5 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Highest Education Qualification
            </span>
            <select
              value={highestQualification}
              onChange={(e) => setHighestQualification(e.target.value)}
              className="w-full bg-transparent text-sm sm:text-base text-gray-100 font-semibold focus:outline-none appearance-none pr-8 cursor-pointer"
            >
              {highestEduOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#1f2937] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <p className="text-[11px] text-gray-400 mt-1 pl-1">
            Select your highest qualification level
          </p>
        </div>

        {/* Responsive Qualification Matrix / Table */}
        <div className="relative overflow-x-auto rounded-xl border border-gray-800 bg-[#0f141f]">
          <table className="w-full text-left text-xs min-w-[950px]">
            <thead className="bg-[#1f2937] text-gray-300 uppercase text-[11px] font-bold tracking-wider border-b border-gray-800">
              <tr>
                <th scope="col" className="py-3 px-3 w-48">Qualification Level</th>
                <th scope="col" className="py-3 px-2 w-44">Course/Stream</th>
                <th scope="col" className="py-3 px-2 w-40">Subject</th>
                <th scope="col" className="py-3 px-2 text-center w-28">Have you studied</th>
                <th scope="col" className="py-3 px-2 w-36">Completion Status</th>
                <th scope="col" className="py-3 px-2 w-28">Marks (%)</th>
                <th scope="col" className="py-3 px-2 w-32">Completed Year</th>
                <th scope="col" className="py-3 px-2 text-center w-28">Active Backlogs</th>
                <th scope="col" className="py-3 px-2 text-center w-24">Gap Years</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {EDUCATION_TIERS.map((tier) => {
                const rowData = educationRows[tier.key] || {};
                const courses = tierCourseOptions[tier.key] || [];
                const subjects = tierSubjectOptions[tier.key] || [];
                const statusOpts = getStatusOptionsForCourse(rowData.course, tier.key);
                const backlogOpts = getActiveBacklogsOptionsForLevel(tier.key);
                const gapOpts = getGapYearsOptionsForLevel(tier.key);

                return (
                  <tr key={tier.key} className="hover:bg-[#1f2937]/50 transition-colors group">
                    {/* Level Label */}
                    <td className="py-3 px-3 font-semibold text-gray-100 flex items-center gap-2">
                      <span
                        className="w-1.5 h-6 rounded-full shrink-0"
                        style={{ backgroundColor: tier.color }}
                      />
                      <span
                        className="text-xs font-bold truncate"
                        style={{ color: tier.badgeText }}
                      >
                        {tier.name}
                      </span>
                    </td>

                    {/* Course/Stream */}
                    <td className="py-2 px-2">
                      <div className="relative">
                        <select
                          value={rowData.course || ''}
                          onChange={(e) => handleEducationRowChange(tier.key, 'course', e.target.value)}
                          className="w-full appearance-none bg-[#1f2937] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 pr-6 cursor-pointer"
                        >
                          <option value="">Select Course</option>
                          {courses
                            .filter((c) => {
                              const val = getOptionValue(c);
                              return val !== '' && val !== undefined && val !== null;
                            })
                            .map((c) => {
                              const val = getOptionValue(c);
                              const lbl = getOptionLabel(c);
                              return (
                                <option key={val} value={val} className="bg-[#1f2937] text-white">
                                  {lbl}
                                </option>
                              );
                            })}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="py-2 px-2">
                      {subjects.length > 0 ? (
                        <div className="relative">
                          <select
                            value={rowData.subject || ''}
                            onChange={(e) => handleEducationRowChange(tier.key, 'subject', e.target.value)}
                            className="w-full appearance-none bg-[#1f2937] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 pr-6 cursor-pointer"
                          >
                            <option value="">Select Subject</option>
                            {subjects
                              .filter((sub) => {
                                const val = getOptionValue(sub);
                                return val !== '' && val !== undefined && val !== null;
                              })
                              .map((sub) => {
                                const val = getOptionValue(sub);
                                const lbl = getOptionLabel(sub);
                                return (
                                  <option key={val} value={val} className="bg-[#1f2937] text-white">
                                    {lbl}
                                  </option>
                                );
                              })}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={rowData.subject || ''}
                          onChange={(e) => handleEducationRowChange(tier.key, 'subject', e.target.value)}
                          placeholder="Subject"
                          className="w-full bg-[#1f2937] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                        />
                      )}
                    </td>

                    {/* Have you studied */}
                    <td className="py-2 px-2 text-center">
                      <select
                        value={rowData.haveYouStudied || '-'}
                        onChange={(e) => handleEducationRowChange(tier.key, 'haveYouStudied', e.target.value)}
                        className="bg-[#1f2937] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none cursor-pointer"
                      >
                        <option value="-">—</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </td>

                    {/* Completion Status */}
                    <td className="py-2 px-2">
                      <div className="relative">
                        <select
                          value={rowData.completionStatus || ''}
                          onChange={(e) => handleEducationRowChange(tier.key, 'completionStatus', e.target.value)}
                          className="w-full appearance-none bg-[#1f2937] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 pr-5 cursor-pointer"
                        >
                          <option value="">Status</option>
                          {statusOpts
                            .filter((st) => {
                              const val = getOptionValue(st);
                              return val !== '' && val !== undefined && val !== null;
                            })
                            .map((st) => {
                              const val = getOptionValue(st);
                              const lbl = getOptionLabel(st);
                              return (
                                <option key={val} value={val} className="bg-[#1f2937] text-white">
                                  {lbl}
                                </option>
                              );
                            })}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>

                    {/* Marks (%) */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={rowData.marks || ''}
                        onChange={(e) => handleEducationRowChange(tier.key, 'marks', e.target.value)}
                        placeholder="Marks %"
                        className="w-full bg-[#1f2937] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-center"
                      />
                    </td>

                    {/* Completed Year */}
                    <td className="py-2 px-2">
                      <div className="relative">
                        <select
                          value={rowData.completedYear || ''}
                          onChange={(e) => handleEducationRowChange(tier.key, 'completedYear', e.target.value)}
                          className="w-full appearance-none bg-[#1f2937] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 pr-5 cursor-pointer"
                        >
                          <option value="">Year</option>
                          {YEAR_OPTIONS.map((yr) => (
                            <option key={yr} value={String(yr)} className="bg-[#1f2937] text-white">
                              {yr}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>

                    {/* Active Backlogs */}
                    <td className="py-2 px-2 text-center">
                      <select
                        value={rowData.activeBacklogs || '-'}
                        onChange={(e) => handleEducationRowChange(tier.key, 'activeBacklogs', e.target.value)}
                        className="bg-[#1f2937] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none cursor-pointer"
                      >
                        <option value="-">—</option>
                        {backlogOpts
                          .filter((bo) => {
                            const val = getOptionValue(bo);
                            return val !== '' && val !== undefined && val !== null;
                          })
                          .map((bo) => {
                            const val = getOptionValue(bo);
                            const lbl = getOptionLabel(bo);
                            return (
                              <option key={val} value={val} className="bg-[#1f2937] text-white">
                                {lbl}
                              </option>
                            );
                          })}
                      </select>
                    </td>

                    {/* Gap Years */}
                    <td className="py-2 px-2 text-center">
                      <select
                        value={rowData.gapYears || '-'}
                        onChange={(e) => handleEducationRowChange(tier.key, 'gapYears', e.target.value)}
                        className="bg-[#1f2937] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none cursor-pointer"
                      >
                        <option value="-">—</option>
                        {gapOpts
                          .filter((go) => {
                            const val = getOptionValue(go);
                            return val !== '' && val !== undefined && val !== null;
                          })
                          .map((go) => {
                            const val = getOptionValue(go);
                            const lbl = getOptionLabel(go);
                            return (
                              <option key={val} value={val} className="bg-[#1f2937] text-white">
                                {lbl}
                              </option>
                            );
                          })}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-[#E4572E]" />
          <span>Scroll horizontally on mobile devices to view and edit all education matrix columns.</span>
        </p>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: NCC DETAILS (Sleek Dark Container)                             */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-[#111827] border border-gray-800 shadow-xl p-4 sm:p-6 text-white transition-all">
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              National Cadet Corps (NCC) Details
            </h2>
            <p className="text-[11px] text-gray-400">Cadet wing, certificate type, and grade from MongoDB Atlas</p>
          </div>
        </div>

        <div className="space-y-4 max-w-xl">
          {/* NCC Wing */}
          <div>
            <div className="relative border border-gray-700 rounded-xl bg-[#1f2937] py-2.5 px-3 focus-within:border-purple-400 transition-colors">
              <select
                value={nccDetails.wing}
                onChange={(e) => handleNccChange('wing', e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-gray-200 focus:outline-none appearance-none pr-8 cursor-pointer"
              >
                <option value="" className="bg-[#1f2937] text-gray-400">Select NCC Wing</option>
                {nccWingOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#1f2937] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1 pl-1">Select your NCC Wing</p>
          </div>

          {/* NCC Certificate */}
          <div>
            <div className="relative border border-gray-700 rounded-xl bg-[#1f2937] py-2.5 px-3 focus-within:border-purple-400 transition-colors">
              <select
                value={nccDetails.certificate}
                onChange={(e) => handleNccChange('certificate', e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-gray-200 focus:outline-none appearance-none pr-8 cursor-pointer"
              >
                <option value="" className="bg-[#1f2937] text-gray-400">Select NCC Certificate</option>
                {nccCertificateOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#1f2937] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1 pl-1">Select your NCC Certificate</p>
          </div>

          {/* NCC Grade */}
          <div>
            <div className="relative border border-gray-700 rounded-xl bg-[#1f2937] py-2.5 px-3 focus-within:border-purple-400 transition-colors">
              <select
                value={nccDetails.grade}
                onChange={(e) => handleNccChange('grade', e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-gray-200 focus:outline-none appearance-none pr-8 cursor-pointer"
              >
                <option value="" className="bg-[#1f2937] text-gray-400">Select NCC Grade</option>
                {nccCertificateGradeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#1f2937] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1 pl-1">Select your NCC Grade</p>
          </div>
        </div>
      </div>

      {/* Bottom Save Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Unified Firestore Storage active (`users/{currentUser?.uid}`)</span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Reset Form
          </button>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#E4572E] hover:bg-[#c9451e] text-white shadow-lg transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
