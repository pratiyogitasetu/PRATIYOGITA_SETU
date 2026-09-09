import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  ArrowLeft,
  Sparkles,
  User,
  GraduationCap,
  Shield,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  Info,
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import { useLayout } from '../contexts/LayoutContext'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../config/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import {
  getGenderOptionsFromMongo,
  getMaritalStatusOptionsFromMongo,
  getNationalityOptionsFromMongo,
  getDomicileOptionsFromMongo,
  getCasteCategoryOptionsFromMongo,
  getHighestEducationOptionsFromMongo,
  getNccWingOptionsFromMongo,
  getNccCertificateOptionsFromMongo,
  getNccCertificateGradeOptionsFromMongo,
  getCoursesForTierFromMongo,
  getSubjectsForCourseFromMongo
} from '../services/eligibilityFieldsService'

// Educational tiers definition matching MongoDB schema and Yogya
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
]

// Completion statuses
const STATUS_OPTIONS = ['Completed / Passed', 'Appearing / Pursuing']

// Generate year options from 2026 down to 1975
const YEAR_OPTIONS = Array.from({ length: 52 }, (_, i) => 2026 - i)

// Person with Benchmark Disability options
const PWD_OPTIONS = [
  { value: 'NO', label: 'No (Not a PwD candidate)' },
  { value: 'LOCOMOTOR', label: 'Yes - Locomotor Disability (OH)' },
  { value: 'VISUAL', label: 'Yes - Visual Impairment (VH)' },
  { value: 'HEARING', label: 'Yes - Hearing Impairment (HH)' },
  { value: 'MULTIPLE', label: 'Yes - Multiple Disabilities (MD)' }
]

// Initial table data
const createInitialEducationData = () => {
  const data = {}
  EDUCATION_TIERS.forEach((tier) => {
    data[tier.key] = {
      course: '',
      subject: '',
      haveYouStudied: '-',
      completionStatus: 'Completed / Passed',
      marks: '',
      completedYear: '',
      activeBacklogs: '-',
      gapYears: '-'
    }
  })
  return data
}

const YogyaDetailsSection = ({ onClose }) => {
  const { contentOffsetLeft, isMobile } = useLayout()
  const { currentUser } = useAuth()

  // 1. Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    dobDay: '15',
    dobMonth: '08',
    dobYear: '2001',
    gender: 'MALE',
    maritalStatus: 'UNMARRIED',
    nationality: 'INDIAN',
    domicileState: 'RAJASTHAN',
    casteCategory: 'GENERAL (UR/UNRESERVED)',
    pwdCandidate: 'NO'
  })

  // 2. Educational Qualification State
  const [highestQualification, setHighestQualification] = useState('GRADUATION')
  const [educationRows, setEducationRows] = useState(createInitialEducationData)

  // 3. NCC Details State
  const [nccDetails, setNccDetails] = useState({
    wing: '',
    certificate: '',
    grade: ''
  })

  // Dynamic MongoDB Atlas Dropdown Options
  const [genderOptions, setGenderOptions] = useState([])
  const [maritalStatusOptions, setMaritalStatusOptions] = useState([])
  const [nationalityOptions, setNationalityOptions] = useState([])
  const [domicileOptions, setDomicileOptions] = useState([])
  const [casteOptions, setCasteOptions] = useState([])
  const [highestEduOptions, setHighestEduOptions] = useState([])
  const [nccWingOptions, setNccWingOptions] = useState([])
  const [nccCertificateOptions, setNccCertificateOptions] = useState([])
  const [nccCertificateGradeOptions, setNccCertificateGradeOptions] = useState([])

  // Dynamic course and subject options for each tier
  const [tierCourseOptions, setTierCourseOptions] = useState({})
  const [tierSubjectOptions, setTierSubjectOptions] = useState({})

  // Toast / feedback message state
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [saving, setSaving] = useState(false)

  // 1. Load Dropdown Options from MongoDB Atlas
  useEffect(() => {
    let cancelled = false

    async function loadOptions() {
      try {
        const [
          genders,
          maritals,
          nationalities,
          domiciles,
          castes,
          highestEdus,
          nccWings,
          nccCerts,
          nccGrades
        ] = await Promise.all([
          getGenderOptionsFromMongo(),
          getMaritalStatusOptionsFromMongo(),
          getNationalityOptionsFromMongo(),
          getDomicileOptionsFromMongo(),
          getCasteCategoryOptionsFromMongo(),
          getHighestEducationOptionsFromMongo(),
          getNccWingOptionsFromMongo(),
          getNccCertificateOptionsFromMongo(),
          getNccCertificateGradeOptionsFromMongo()
        ])

        if (!cancelled) {
          setGenderOptions(genders || [])
          setMaritalStatusOptions(maritals || [])
          setNationalityOptions(nationalities || [])
          setDomicileOptions(domiciles || [])
          setCasteOptions(castes || [])
          setHighestEduOptions(highestEdus || [])
          setNccWingOptions(nccWings || [])
          setNccCertificateOptions(nccCerts || [])
          setNccCertificateGradeOptions(nccGrades || [])

          // Fetch courses for each tier
          const coursePromises = EDUCATION_TIERS.map(async (tier) => {
            const courses = await getCoursesForTierFromMongo(tier.key)
            return { [tier.key]: courses }
          })
          const courseMaps = await Promise.all(coursePromises)
          const mergedCourses = Object.assign({}, ...courseMaps)
          setTierCourseOptions(mergedCourses)
        }
      } catch (err) {
        console.error('Error fetching MongoDB eligibility fields in Gyan:', err)
      }
    }

    loadOptions()
    return () => {
      cancelled = true
    }
  }, [])

  // 2. Load Existing Data from Firestore users/{uid}
  useEffect(() => {
    if (!currentUser) return

    let isMounted = true

    async function loadUserData() {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (userDoc.exists() && isMounted) {
          const data = userDoc.data()

          // Date of birth
          let dobDay = '15'
          let dobMonth = '08'
          let dobYear = '2001'
          if (data.date_of_birth) {
            const parts = data.date_of_birth.split('-')
            if (parts.length === 3) {
              dobYear = parts[0]
              dobMonth = parts[1]
              dobDay = parts[2]
            }
          }

          setPersonalInfo({
            dobDay,
            dobMonth,
            dobYear,
            gender: data.gender || 'MALE',
            maritalStatus: data.marital_status || 'UNMARRIED',
            nationality: data.nationality || 'INDIAN',
            domicileState: data.domicile || 'RAJASTHAN',
            casteCategory: data.caste_category || 'GENERAL (UR/UNRESERVED)',
            pwdCandidate: data.pwd_status || 'NO'
          })

          if (data.gender) {
            getMaritalStatusOptionsFromMongo(data.gender).then((opts) => {
              if (isMounted) setMaritalStatusOptions(opts)
            })
          }

          if (data.highest_education_qualification) {
            setHighestQualification(data.highest_education_qualification)
          }

          if (data.educationTableData && typeof data.educationTableData === 'object') {
            const merged = createInitialEducationData()
            Object.keys(data.educationTableData).forEach((k) => {
              merged[k] = {
                ...merged[k],
                ...data.educationTableData[k]
              }
            })
            setEducationRows(merged)

            // Populate subjects
            const subMap = {}
            for (const tierKey of Object.keys(merged)) {
              const row = merged[tierKey]
              if (row.course) {
                const subs = await getSubjectsForCourseFromMongo(tierKey, row.course)
                subMap[tierKey] = subs
              }
            }
            if (isMounted) setTierSubjectOptions(subMap)
          }

          setNccDetails({
            wing: data.ncc_wing || '',
            certificate: data.ncc_certificate || '',
            grade: data.ncc_certificate_grade || ''
          })
        }
      } catch (err) {
        console.error('Error loading user profile in Gyan:', err)
      }
    }

    loadUserData()
    return () => {
      isMounted = false
    }
  }, [currentUser])

  const handleBack = () => {
    if (typeof onClose === 'function') {
      onClose()
    } else {
      window.dispatchEvent(new CustomEvent('switchToChat'))
    }
  }

  const handlePersonalInfoChange = (field, value) => {
    setPersonalInfo((prev) => ({ ...prev, [field]: value }))

    if (field === 'gender') {
      getMaritalStatusOptionsFromMongo(value).then((newOptions) => {
        setMaritalStatusOptions(newOptions)
        setPersonalInfo((prev) => {
          if (prev.maritalStatus && !newOptions.some((opt) => opt.value === prev.maritalStatus)) {
            return { ...prev, maritalStatus: '' }
          }
          return prev
        });
      })
    }

    if (field === 'nationality') {
      const isIndian = value && value.toUpperCase() === 'INDIAN'
      if (!isIndian) {
        setPersonalInfo((prev) => ({ ...prev, domicileState: '' }))
      }
    }
  }

  const handleEducationRowChange = async (tierKey, field, value) => {
    setEducationRows((prev) => {
      const updatedRow = {
        ...prev[tierKey],
        [field]: value
      }
      if (field === 'course') {
        updatedRow.subject = ''
      }
      return {
        ...prev,
        [tierKey]: updatedRow
      }
    })

    if (field === 'course') {
      const subs = await getSubjectsForCourseFromMongo(tierKey, value)
      setTierSubjectOptions((prev) => ({ ...prev, [tierKey]: subs }))
    }
  }

  const handleNccChange = (field, value) => {
    setNccDetails((prev) => ({ ...prev, [field]: value }))
  }

  // Save to Firebase Firestore
  const handleSaveDetails = async () => {
    if (!currentUser) {
      setFeedbackMessage('Please log in to sync your profile with Firebase.')
      setTimeout(() => setFeedbackMessage(''), 4000)
      return
    }

    setSaving(true)
    setErrorMessage('')
    setFeedbackMessage('')

    try {
      const dob =
        personalInfo.dobYear && personalInfo.dobMonth && personalInfo.dobDay
          ? `${personalInfo.dobYear}-${personalInfo.dobMonth}-${personalInfo.dobDay}`
          : ''

      const userDocRef = doc(db, 'users', currentUser.uid)
      await setDoc(
        userDocRef,
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
      )

      setFeedbackMessage('All details successfully saved to Firebase and synced with Pratiyogita Setu!')
      setTimeout(() => setFeedbackMessage(''), 5000)
    } catch (err) {
      console.error('Failed to save details to Firebase:', err)
      setErrorMessage('Could not save details: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setPersonalInfo({
      dobDay: '01',
      dobMonth: '01',
      dobYear: '2000',
      gender: genderOptions[0]?.value || 'MALE',
      maritalStatus: maritalStatusOptions[0]?.value || 'UNMARRIED',
      nationality: 'INDIAN',
      domicileState: domicileOptions[0]?.value || '',
      casteCategory: casteOptions[0]?.value || 'GENERAL (UR/UNRESERVED)',
      pwdCandidate: 'NO'
    })
    setHighestQualification('GRADUATION')
    setEducationRows(createInitialEducationData())
    setNccDetails({
      wing: '',
      certificate: '',
      grade: ''
    })
    setFeedbackMessage('Form reset to default values.')
    setTimeout(() => setFeedbackMessage(''), 3000)
  }

  return (
    <div
      className={`yogya-details-page flex-1 flex flex-col h-full overflow-hidden ${
        isMobile ? 'p-0' : 'pr-1 pb-1'
      }`}
      style={{
        paddingTop: isMobile ? '56px' : '60px',
        marginLeft: isMobile ? 0 : `${contentOffsetLeft}px`,
        width: isMobile ? '100%' : `calc(100% - ${contentOffsetLeft + 4}px)`,
        transition:
          'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div
        className={`flex-1 bg-white flex flex-col overflow-hidden ${
          isMobile ? 'border-0 rounded-none' : 'border border-gray-200 rounded-lg shadow-sm'
        }`}
      >
        {/* Top Header */}
        <div className="border-b border-gray-200 px-3 py-2.5 sm:px-6 sm:py-3.5 bg-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={handleBack}
                className="p-1.5 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors flex items-center justify-center shrink-0 border border-gray-200 cursor-pointer"
                title="Back to Home / Chat"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight truncate">
                    Pratiyogita Yogya Details
                  </h1>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-[#E4572E] border border-orange-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#E4572E]" />
                    <span>Live MongoDB & Firebase Sync</span>
                  </span>
                </div>
                <p className="text-gray-600 mt-0.5 text-xs sm:text-sm truncate">
                  Personal Information, Educational Matrix & NCC Criteria synced with Pratiyogita Setu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 sm:px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5 border border-gray-200 cursor-pointer"
                title="Reset to default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Form</span>
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="px-2.5 sm:px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5 cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 bg-gray-50/50">
          
          {/* Notifications */}
          {feedbackMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5 shadow-xs animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">{feedbackMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-2.5 shadow-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Quick Notice Info */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 shadow-xs">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Saare dropdown options MongoDB Atlas se dynamically load ho rahe hain, aur aapka data directly Firebase Firestore (<span className="font-mono font-bold">users/{currentUser?.uid || 'guest'}</span>) me sync hota hai.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 1: PERSONAL INFORMATION                                           */}
          {/* ========================================================================= */}
          <div className="rounded-xl bg-[#111827] border border-gray-800 shadow-sm p-4 sm:p-6 text-white transition-all">
            <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-gray-800">
              <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-[#f9734c] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Personal Information
                </h2>
                <p className="text-[11px] text-gray-400">Basic aspirant identity and category criteria (MongoDB Atlas)</p>
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
                      className="w-full appearance-none bg-[#1f2937] border border-gray-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-gray-100 focus:outline-none focus:border-[#E4572E] focus:ring-1 focus:ring-[#E4572E] transition-colors pr-8 cursor-pointer"
                    >
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => {
                        const day = String(i + 1).padStart(2, '0')
                        return (
                          <option key={day} value={day} className="bg-[#1f2937] text-white">
                            {day}
                          </option>
                        )
                      })}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Month */}
                  <div className="relative">
                    <select
                      value={personalInfo.dobMonth}
                      onChange={(e) => handlePersonalInfoChange('dobMonth', e.target.value)}
                      className="w-full appearance-none bg-[#1f2937] border border-gray-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-gray-100 focus:outline-none focus:border-[#E4572E] focus:ring-1 focus:ring-[#E4572E] transition-colors pr-8 cursor-pointer"
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
                      className="w-full appearance-none bg-[#1f2937] border border-gray-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-gray-100 focus:outline-none focus:border-[#E4572E] focus:ring-1 focus:ring-[#E4572E] transition-colors pr-8 cursor-pointer"
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 60 }, (_, i) => {
                        const yr = String(new Date().getFullYear() - 14 - i)
                        return (
                          <option key={yr} value={yr} className="bg-[#1f2937] text-white">
                            {yr}
                          </option>
                        )
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
                <p className="text-[11px] text-gray-400 mt-1 pl-1">Select your gender (MongoDB Atlas)</p>
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
                <p className="text-[11px] text-gray-400 mt-1 pl-1">Your domicile state (Enabled for Indian citizens only)</p>
              </div>

              {/* Caste/Category */}
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
                <p className="text-[11px] text-gray-400 mt-1 pl-1">Select your category (MongoDB Atlas)</p>
              </div>

              {/* Person with Disability */}
              <div>
                <div className="relative border border-gray-700 rounded-xl bg-[#1f2937] py-2.5 px-3 focus-within:border-[#E4572E] transition-colors">
                  <select
                    value={personalInfo.pwdCandidate}
                    onChange={(e) => handlePersonalInfoChange('pwdCandidate', e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-gray-200 focus:outline-none appearance-none pr-8 cursor-pointer"
                  >
                    {PWD_OPTIONS.map((opt) => (
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
          {/* SECTION 2: EDUCATIONAL QUALIFICATION                                      */}
          {/* ========================================================================= */}
          <div className="rounded-xl bg-[#111827] border border-gray-800 shadow-sm p-4 sm:p-6 text-white transition-all">
            <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-gray-800">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Educational Qualification Matrix
                </h2>
                <p className="text-[11px] text-gray-400">Complete tiered qualifications loaded dynamically from MongoDB Atlas</p>
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
                    const rowData = educationRows[tier.key] || {}
                    const courses = tierCourseOptions[tier.key] || []
                    const subjects = tierSubjectOptions[tier.key] || []

                    return (
                      <tr
                        key={tier.key}
                        className="hover:bg-[#1f2937]/50 transition-colors group"
                      >
                        {/* Qualification Label */}
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
                              onChange={(e) =>
                                handleEducationRowChange(tier.key, 'course', e.target.value)
                              }
                              className="w-full appearance-none bg-[#1f2937] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 pr-6 cursor-pointer"
                            >
                              <option value="">Select Course</option>
                              {courses.map((opt) => (
                                <option key={opt} value={opt} className="bg-[#1f2937] text-white">
                                  {opt}
                                </option>
                              ))}
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
                                onChange={(e) =>
                                  handleEducationRowChange(tier.key, 'subject', e.target.value)
                                }
                                className="w-full appearance-none bg-[#1f2937] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 pr-6 cursor-pointer"
                              >
                                <option value="">Select Subject</option>
                                {subjects.map((sub) => (
                                  <option key={sub} value={sub} className="bg-[#1f2937] text-white">
                                    {sub}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={rowData.subject || ''}
                              onChange={(e) =>
                                handleEducationRowChange(tier.key, 'subject', e.target.value)
                              }
                              placeholder="Subject"
                              className="w-full bg-[#1f2937] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                            />
                          )}
                        </td>

                        {/* Have you studied */}
                        <td className="py-2 px-2 text-center">
                          <select
                            value={rowData.haveYouStudied || '-'}
                            onChange={(e) =>
                              handleEducationRowChange(tier.key, 'haveYouStudied', e.target.value)
                            }
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
                              onChange={(e) =>
                                handleEducationRowChange(tier.key, 'completionStatus', e.target.value)
                              }
                              className="w-full appearance-none bg-[#1f2937] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 pr-5 cursor-pointer"
                            >
                              {STATUS_OPTIONS.map((st) => (
                                <option key={st} value={st} className="bg-[#1f2937] text-white">
                                  {st}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </td>

                        {/* Marks (%) */}
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={rowData.marks || ''}
                            onChange={(e) =>
                              handleEducationRowChange(tier.key, 'marks', e.target.value)
                            }
                            placeholder="Marks %"
                            className="w-full bg-[#1f2937] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-center"
                          />
                        </td>

                        {/* Completed Year */}
                        <td className="py-2 px-2">
                          <div className="relative">
                            <select
                              value={rowData.completedYear || ''}
                              onChange={(e) =>
                                handleEducationRowChange(tier.key, 'completedYear', e.target.value)
                              }
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
                            onChange={(e) =>
                              handleEducationRowChange(tier.key, 'activeBacklogs', e.target.value)
                            }
                            className="bg-[#1f2937] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none cursor-pointer"
                          >
                            <option value="-">—</option>
                            <option value="0">0</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3+">3+</option>
                          </select>
                        </td>

                        {/* Gap Years */}
                        <td className="py-2 px-2 text-center">
                          <select
                            value={rowData.gapYears || '-'}
                            onChange={(e) =>
                              handleEducationRowChange(tier.key, 'gapYears', e.target.value)
                            }
                            className="bg-[#1f2937] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none cursor-pointer"
                          >
                            <option value="-">—</option>
                            <option value="0">0</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3+">3+</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              💡 Mobile view par table ko horizontally scroll karke saare columns dekh aur fill kar sakte hain.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: NCC DETAILS                                                    */}
          {/* ========================================================================= */}
          <div className="rounded-xl bg-[#111827] border border-gray-800 shadow-sm p-4 sm:p-6 text-white transition-all">
            <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-gray-800">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  NCC Details
                </h2>
                <p className="text-[11px] text-gray-400">Cadet wing, certification level, and grading from MongoDB Atlas</p>
              </div>
            </div>

            <div className="space-y-3.5 max-w-xl">
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

          {/* Bottom Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 pb-8">
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Unified Firestore Storage active (`users/{currentUser?.uid || 'guest'}`)</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-colors shadow-2xs cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSaveDetails}
                disabled={saving}
                className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold bg-[#E4572E] hover:bg-[#c9451e] text-white shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Save Details</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

YogyaDetailsSection.propTypes = {
  onClose: PropTypes.func
}

export default YogyaDetailsSection
