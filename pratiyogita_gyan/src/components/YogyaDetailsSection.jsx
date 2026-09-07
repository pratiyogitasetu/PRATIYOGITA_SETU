import React, { useState } from 'react'
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
  X
} from 'lucide-react'
import { useLayout } from '../contexts/LayoutContext'

// Indian States and Union Territories list
const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (NCT)',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
]

// Educational tiers definition matching Screenshot 2
const EDUCATION_TIERS = [
  {
    id: 'post_doctorate',
    name: 'Post Doctorate',
    color: '#ef4444',
    badgeText: '#f87171'
  },
  {
    id: 'phd',
    name: 'PhD',
    color: '#d97706',
    badgeText: '#fbbf24'
  },
  {
    id: 'post_graduation',
    name: 'Post Graduation',
    color: '#10b981',
    badgeText: '#34d399'
  },
  {
    id: 'graduation',
    name: 'Graduation',
    color: '#8b5cf6',
    badgeText: '#c4b5fd'
  },
  {
    id: 'diploma_iti',
    name: 'Diploma ITI',
    color: '#06b6d4',
    badgeText: '#67e8f9'
  },
  {
    id: 'twelfth',
    name: '12th Higher Secondary',
    color: '#f59e0b',
    badgeText: '#fde68a'
  },
  {
    id: 'tenth',
    name: '10th Secondary',
    color: '#f43f5e',
    badgeText: '#fecdd3'
  },
  {
    id: 'eighth',
    name: '8th Class',
    color: '#14b8a6',
    badgeText: '#99f6e4'
  },
  {
    id: 'fifth',
    name: '5th Class',
    color: '#b45309',
    badgeText: '#fed7aa'
  }
]

// Available streams
const STREAM_OPTIONS = [
  'General',
  'Science (PCM)',
  'Science (PCB)',
  'Arts / Humanities',
  'Commerce',
  'Engineering / B.Tech',
  'Medical / MBBS / BDS',
  'Law (LLB)',
  'Computer Science / IT',
  'Agriculture',
  'Management / BBA',
  'Other Stream'
]

// Completion statuses
const STATUS_OPTIONS = ['Completed / Passed', 'Appearing / Pursuing', 'Not Applicable']

// Generate year options from 2026 down to 1980
const YEAR_OPTIONS = Array.from({ length: 47 }, (_, i) => 2026 - i)

// Initial mock table data
const createInitialEducationData = () => {
  const data = {}
  EDUCATION_TIERS.forEach((tier) => {
    data[tier.id] = {
      courseStream: '',
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

  // 1. Personal Information State (Pure UI)
  const [personalInfo, setPersonalInfo] = useState({
    dobDay: '15',
    dobMonth: 'August',
    dobYear: '2001',
    gender: 'Transgender',
    maritalStatus: 'Unmarried',
    nationality: 'Indian',
    domicileState: 'Rajasthan',
    casteCategory: 'General',
    pwdCandidate: 'No'
  })

  // 2. Educational Qualification State (Pure UI)
  const [highestQualification, setHighestQualification] = useState('Post Doctorate')
  const [educationRows, setEducationRows] = useState(createInitialEducationData)

  // 3. NCC Details State (Pure UI)
  const [nccDetails, setNccDetails] = useState({
    wing: 'Army Wing',
    certificate: 'Certificate B',
    grade: 'Grade A'
  })

  // Toast / feedback message state
  const [feedbackMessage, setFeedbackMessage] = useState('')

  const handleBack = () => {
    if (typeof onClose === 'function') {
      onClose()
    } else {
      window.dispatchEvent(new CustomEvent('switchToChat'))
    }
  }

  const handlePersonalInfoChange = (field, value) => {
    setPersonalInfo((prev) => ({ ...prev, [field]: value }))
  }

  const handleEducationRowChange = (tierId, field, value) => {
    setEducationRows((prev) => ({
      ...prev,
      [tierId]: {
        ...prev[tierId],
        [field]: value
      }
    }))
  }

  const handleNccChange = (field, value) => {
    setNccDetails((prev) => ({ ...prev, [field]: value }))
  }

  const handleSavePreview = () => {
    setFeedbackMessage('Form data saved in local UI state! (Backend connection disabled as per instructions)')
    setTimeout(() => setFeedbackMessage(''), 4500)
  }

  const handleReset = () => {
    setPersonalInfo({
      dobDay: '01',
      dobMonth: 'January',
      dobYear: '2000',
      gender: 'Male',
      maritalStatus: 'Unmarried',
      nationality: 'Indian',
      domicileState: 'Rajasthan',
      casteCategory: 'General',
      pwdCandidate: 'No'
    })
    setHighestQualification('Graduation')
    setEducationRows(createInitialEducationData())
    setNccDetails({
      wing: 'None',
      certificate: 'None',
      grade: 'N/A'
    })
    setFeedbackMessage('Form reset to default sample values.')
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
        {/* Top Header - Matches Dashboard */}
        <div className="border-b border-gray-200 px-3 py-2.5 sm:px-6 sm:py-3.5 bg-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={handleBack}
                className="p-1.5 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors flex items-center justify-center shrink-0 border border-gray-200"
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
                    <span>Eligibility Setup</span>
                  </span>
                </div>
                <p className="text-gray-600 mt-0.5 text-xs sm:text-sm truncate">
                  Personal Information, Educational Matrix & NCC Criteria
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 sm:px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5 border border-gray-200"
                title="Reset to default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Form</span>
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="px-2.5 sm:px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5"
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
          
          {/* Notification Banner / Toast */}
          {feedbackMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5 shadow-xs animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">{feedbackMessage}</span>
            </div>
          )}

          {/* Quick Notice Info */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 shadow-xs">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Yeh form purely frontend UI preview ke liye taiyar kiya gaya hai. Isme aap dropdowns aur inputs ko interactively check kar sakte hain. Koi bhi data abhi backend ya database me connect nahi hai.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 1: PERSONAL INFORMATION (Sleek Dark Container like Mobile Navbar) */}
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
                <p className="text-[11px] text-gray-400">Basic aspirant identity and category criteria</p>
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
                        'January',
                        'February',
                        'March',
                        'April',
                        'May',
                        'June',
                        'July',
                        'August',
                        'September',
                        'October',
                        'November',
                        'December'
                      ].map((month) => (
                        <option key={month} value={month} className="bg-[#1f2937] text-white">
                          {month}
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
                      {Array.from({ length: 46 }, (_, i) => 2015 - i).map((yr) => (
                        <option key={yr} value={String(yr)} className="bg-[#1f2937] text-white">
                          {yr}
                        </option>
                      ))}
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
                    <option value="Male" className="bg-[#1f2937] text-white">Male</option>
                    <option value="Female" className="bg-[#1f2937] text-white">Female</option>
                    <option value="Transgender" className="bg-[#1f2937] text-white">Transgender</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-gray-400 mt-1 pl-1">Select your gender</p>
              </div>

              {/* Marital Status */}
              <div>
                <div className="relative border border-gray-700 rounded-xl bg-[#1f2937] py-2.5 px-3 focus-within:border-[#E4572E] transition-colors">
                  <select
                    value={personalInfo.maritalStatus}
                    onChange={(e) => handlePersonalInfoChange('maritalStatus', e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-gray-200 focus:outline-none appearance-none pr-8 cursor-pointer"
                  >
                    <option value="Unmarried" className="bg-[#1f2937] text-white">Unmarried / Single</option>
                    <option value="Married" className="bg-[#1f2937] text-white">Married</option>
                    <option value="Divorced" className="bg-[#1f2937] text-white">Divorced</option>
                    <option value="Widowed" className="bg-[#1f2937] text-white">Widowed</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-gray-400 mt-1 pl-1">Select your marital status</p>
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
                    <option value="Indian" className="bg-[#1f2937] text-white">Indian</option>
                    <option value="Other / NRI" className="bg-[#1f2937] text-white">Other / NRI</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-gray-400 mt-1 pl-1">Select your nationality</p>
              </div>

              {/* Domicile State */}
              <div>
                <div className="relative border border-gray-700 rounded-xl bg-[#1f2937] py-2.5 px-3 focus-within:border-[#E4572E] transition-colors">
                  <select
                    value={personalInfo.domicileState}
                    onChange={(e) => handlePersonalInfoChange('domicileState', e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-gray-200 focus:outline-none appearance-none pr-8 cursor-pointer"
                  >
                    <option value="" disabled>Domicile State</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state} className="bg-[#1f2937] text-white">
                        {state}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-gray-400 mt-1 pl-1">Your domicile state</p>
              </div>

              {/* Caste/Category */}
              <div>
                <div className="relative border border-gray-700 rounded-xl bg-[#1f2937] py-2.5 px-3 focus-within:border-[#E4572E] transition-colors">
                  <select
                    value={personalInfo.casteCategory}
                    onChange={(e) => handlePersonalInfoChange('casteCategory', e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-gray-200 focus:outline-none appearance-none pr-8 cursor-pointer"
                  >
                    <option value="General" className="bg-[#1f2937] text-white">General (Unreserved)</option>
                    <option value="OBC (Non-Creamy)" className="bg-[#1f2937] text-white">OBC (Non-Creamy Layer)</option>
                    <option value="OBC (Creamy)" className="bg-[#1f2937] text-white">OBC (Creamy Layer)</option>
                    <option value="SC" className="bg-[#1f2937] text-white">SC (Scheduled Caste)</option>
                    <option value="ST" className="bg-[#1f2937] text-white">ST (Scheduled Tribe)</option>
                    <option value="EWS" className="bg-[#1f2937] text-white">EWS (Economically Weaker Section)</option>
                    <option value="MBC" className="bg-[#1f2937] text-white">MBC (Most Backward Classes)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-gray-400 mt-1 pl-1">Select your category</p>
              </div>

              {/* Person with Disability */}
              <div>
                <div className="relative border border-gray-700 rounded-xl bg-[#1f2937] py-2.5 px-3 focus-within:border-[#E4572E] transition-colors">
                  <select
                    value={personalInfo.pwdCandidate}
                    onChange={(e) => handlePersonalInfoChange('pwdCandidate', e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-gray-200 focus:outline-none appearance-none pr-8 cursor-pointer"
                  >
                    <option value="No" className="bg-[#1f2937] text-white">No (Not a PwD candidate)</option>
                    <option value="Yes - Locomotor" className="bg-[#1f2937] text-white">Yes - Locomotor Disability (OH)</option>
                    <option value="Yes - Visual" className="bg-[#1f2937] text-white">Yes - Visual Impairment (VH)</option>
                    <option value="Yes - Hearing" className="bg-[#1f2937] text-white">Yes - Hearing Impairment (HH)</option>
                    <option value="Yes - Other" className="bg-[#1f2937] text-white">Yes - Other / Multiple Disabilities</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-gray-400 mt-1 pl-1">Are you a PwD candidate?</p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: EDUCATIONAL QUALIFICATION (Sleek Dark Container)               */}
          {/* ========================================================================= */}
          <div className="rounded-xl bg-[#111827] border border-gray-800 shadow-sm p-4 sm:p-6 text-white transition-all">
            <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-gray-800">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Educational Qualification
                </h2>
                <p className="text-[11px] text-gray-400">Higher secondary to doctorate qualification matrix</p>
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
                  {EDUCATION_TIERS.map((tier) => (
                    <option key={tier.id} value={tier.name} className="bg-[#1f2937] text-white">
                      {tier.name}
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
                    <th scope="col" className="py-3 px-2 w-40">Course/Stream</th>
                    <th scope="col" className="py-3 px-2 w-36">Subject</th>
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
                    const rowData = educationRows[tier.id] || {}
                    return (
                      <tr
                        key={tier.id}
                        className="hover:bg-[#1f2937]/50 transition-colors group"
                      >
                        {/* Qualification Label with Colored Left Stripe & Badge */}
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
                              value={rowData.courseStream}
                              onChange={(e) =>
                                handleEducationRowChange(tier.id, 'courseStream', e.target.value)
                              }
                              className="w-full appearance-none bg-[#1f2937] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 pr-6"
                            >
                              <option value="">Course/Stream</option>
                              {STREAM_OPTIONS.map((opt) => (
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
                          <div className="relative">
                            <input
                              type="text"
                              value={rowData.subject}
                              onChange={(e) =>
                                handleEducationRowChange(tier.id, 'subject', e.target.value)
                              }
                              placeholder="Subject"
                              className="w-full bg-[#1f2937] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </td>

                        {/* Have you studied */}
                        <td className="py-2 px-2 text-center">
                          <select
                            value={rowData.haveYouStudied}
                            onChange={(e) =>
                              handleEducationRowChange(tier.id, 'haveYouStudied', e.target.value)
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
                              value={rowData.completionStatus}
                              onChange={(e) =>
                                handleEducationRowChange(tier.id, 'completionStatus', e.target.value)
                              }
                              className="w-full appearance-none bg-[#1f2937] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 pr-5 cursor-pointer"
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
                            value={rowData.marks}
                            onChange={(e) =>
                              handleEducationRowChange(tier.id, 'marks', e.target.value)
                            }
                            placeholder="Marks %"
                            className="w-full bg-[#1f2937] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-center"
                          />
                        </td>

                        {/* Completed Year */}
                        <td className="py-2 px-2">
                          <div className="relative">
                            <select
                              value={rowData.completedYear}
                              onChange={(e) =>
                                handleEducationRowChange(tier.id, 'completedYear', e.target.value)
                              }
                              className="w-full appearance-none bg-[#1f2937] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 pr-5 cursor-pointer"
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
                            value={rowData.activeBacklogs}
                            onChange={(e) =>
                              handleEducationRowChange(tier.id, 'activeBacklogs', e.target.value)
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
                            value={rowData.gapYears}
                            onChange={(e) =>
                              handleEducationRowChange(tier.id, 'gapYears', e.target.value)
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
          {/* SECTION 3: NCC DETAILS (Sleek Dark Container)                             */}
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
                <p className="text-[11px] text-gray-400">Cadet wing, certification level, and grading</p>
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
                    <option value="None" className="bg-[#1f2937] text-white">None (Not an NCC Cadet)</option>
                    <option value="Army Wing" className="bg-[#1f2937] text-white">Army Wing</option>
                    <option value="Naval Wing" className="bg-[#1f2937] text-white">Naval Wing</option>
                    <option value="Air Wing" className="bg-[#1f2937] text-white">Air Wing</option>
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
                    <option value="None" className="bg-[#1f2937] text-white">None / No Certificate</option>
                    <option value="Certificate A" className="bg-[#1f2937] text-white">Certificate A</option>
                    <option value="Certificate B" className="bg-[#1f2937] text-white">Certificate B</option>
                    <option value="Certificate C" className="bg-[#1f2937] text-white">Certificate C</option>
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
                    <option value="N/A" className="bg-[#1f2937] text-white">N/A / None</option>
                    <option value="Grade A" className="bg-[#1f2937] text-white">Grade A</option>
                    <option value="Grade B" className="bg-[#1f2937] text-white">Grade B</option>
                    <option value="Grade C" className="bg-[#1f2937] text-white">Grade C</option>
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
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>UI Mockup Mode — Backend sync is disabled.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-colors shadow-2xs"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSavePreview}
                className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold bg-[#E4572E] hover:bg-[#c9451e] text-white shadow-sm hover:shadow-md transition-all"
              >
                Save Details (UI Only)
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
