/**
 * Exam Data Loader Configuration
 * 
 * All dropdown options, category mappings, and blank templates
 * for the Exam Data Loader page.
 * Sources: possiblefields.json + allexamnames.json structure
 */

// ============================================
// CATEGORY FOLDER NAMES & LABELS
// ============================================

export const CATEGORY_OPTIONS = [
  { value: "SSC_EXAMS", label: "SSC Exams" },
  { value: "BANKING_EXAMS", label: "Banking Exams" },
  { value: "CIVIL_SERVICES_EXAMS", label: "Civil Services Exams" },
  { value: "RAILWAY_EXAMS", label: "Railway Exams" },
  { value: "DEFENCE_EXAMS", label: "Defence Exams" },
  { value: "INSURANCES_EXAMS", label: "Insurance Exams" },
  { value: "NURSING_EXAMS", label: "Nursing Exams" },
  { value: "PG_EXAMS", label: "PG Exams" },
  { value: "CAMPUS_PLACEMENT_EXAMS", label: "Campus Placement" },
  { value: "MBA_EXAMS", label: "MBA Exams" },
  { value: "ACCOUNTING_COMMERCE_EXAMS", label: "Accounting & Commerce" },
  { value: "JUDICIARY_EXAMS", label: "Judiciary Exams" },
  { value: "Other_EXAMS", label: "Other Exams" },
  { value: "UG_EXAMS", label: "UG Exams" },
  { value: "POLICE_EXAMS", label: "Police Exams" },
  { value: "OTHER_GOV_EXAMS", label: "Other Government Exams" },
  { value: "SCHOOL_EXAMS", label: "School Exams" },
  { value: "TEACHING_EXAMS", label: "Teaching Exams" },
  { value: "ENGINEERING_RECRUITING_EXAMS", label: "Engineering Recruiting Exams" },
];

// ============================================
// SECTION 1: BASIC EXAM INFO OPTIONS
// ============================================

export const EXAM_LEVEL_OPTIONS = [
  "INTERNATIONAL", "NATIONAL", "STATE", "REGIONAL", "UNIVERSITY", "INSTITUTIONAL"
];

export const EXAM_TARGET_OPTIONS = [
  "OFFICER / GROUP A", "OFFICER / GROUP B", "CLERICAL / GROUP C", "GROUP D",
  "PROBATIONARY OFFICER", "MANAGEMENT TRAINEE", "ASSISTANT", "CLERK",
  "JUNIOR ENGINEER", "SENIOR ENGINEER", "TECHNICIAN", "CONSTABLE",
  "SUB INSPECTOR", "ASSISTANT COMMANDANT", "COMMANDANT",
  "LECTURER / PROFESSOR", "TEACHER", "MEDICAL OFFICER", "STAFF NURSE",
  "PHARMACIST", "CADET / TRAINEE", "SCIENTIST", "RESEARCHER",
  "JUDICIAL OFFICER", "ADVOCATE", "ADMISSION (UG)", "ADMISSION (PG)",
  "ADMISSION (PhD)", "FELLOWSHIP", "OTHER"
];

export const EXAM_FREQUENCY_OPTIONS = ["1", "2", "3", "4", "IRREGULAR"];

// ============================================
// SECTION 3: EXAM PATTERN OPTIONS
// ============================================

export const EXAM_TIERS_OPTIONS = [
  "SINGLE STAGE CBT", "TIER-I (PRELIMINARY)", "TIER-II (MAINS)",
  "TIER-III (DESCRIPTIVE)", "TIER-IV (SKILL TEST)",
  "PRELIMINARY EXAMINATION", "MAINS EXAMINATION",
  "INTERVIEW / PERSONALITY TEST", "PRELIMS + MAINS",
  "PRELIMS + MAINS + INTERVIEW", "CBT + PHYSICAL TEST",
  "CBT + SKILL TEST", "CBT + TYPING TEST",
  "WRITTEN + SSB INTERVIEW", "WRITTEN + SSB INTERVIEW + MEDICAL",
  "WRITTEN + PHYSICAL + MEDICAL", "ONLINE CBT",
  "OFFLINE (PEN AND PAPER)", "COMPUTER BASED TEST (CBT)",
  "DOCUMENT VERIFICATION", "MEDICAL EXAMINATION",
  "PHYSICAL EFFICIENCY TEST (PET)", "PHYSICAL STANDARD TEST (PST)",
  "TRADE TEST", "TECHNICAL TEST",
  "AFSB (Air Force Selection Board)", "SSB (Services Selection Board)", "OTHER"
];

export const EXAM_SUBJECTS_OPTIONS = [
  "ENGLISH", "ENGLISH LANGUAGE", "ENGLISH LANGUAGE & COMPREHENSION",
  "HINDI", "GENERAL KNOWLEDGE", "GENERAL KNOWLEDGE / GENERAL AWARENESS",
  "GENERAL AWARENESS", "GENERAL AWARENESS / CURRENT AFFAIRS",
  "CURRENT AFFAIRS", "STATIC GK", "MATHEMATICS", "QUANTITATIVE APTITUDE",
  "NUMERICAL ABILITY", "QUANTITATIVE APTITUDE / MATHEMATICS",
  "REASONING", "LOGICAL REASONING", "ANALYTICAL REASONING",
  "GENERAL INTELLIGENCE", "GENERAL INTELLIGENCE & REASONING",
  "VERBAL REASONING", "NON-VERBAL REASONING",
  "DATA INTERPRETATION", "DATA ANALYSIS & INTERPRETATION",
  "COMPUTER KNOWLEDGE", "COMPUTER AWARENESS", "COMPUTER APTITUDE",
  "GENERAL SCIENCE", "PHYSICS", "CHEMISTRY", "BIOLOGY",
  "HISTORY", "GEOGRAPHY", "POLITY", "INDIAN POLITY",
  "ECONOMICS", "INDIAN ECONOMY", "ENVIRONMENT & ECOLOGY",
  "SCIENCE & TECHNOLOGY", "CSAT (CIVIL SERVICES APTITUDE TEST)",
  "ESSAY", "ETHICS, INTEGRITY & APTITUDE", "OPTIONAL SUBJECT",
  "TECHNICAL SUBJECT", "PROFESSIONAL KNOWLEDGE",
  "ENGINEERING SUBJECTS", "MEDICAL SUBJECTS", "LAW",
  "BANKING AWARENESS", "FINANCIAL AWARENESS", "INSURANCE AWARENESS",
  "RAILWAY AWARENESS", "AGRICULTURE", "PEDAGOGY",
  "CHILD DEVELOPMENT & PEDAGOGY", "TEACHING APTITUDE", "RESEARCH APTITUDE",
  "OTHER"
];

export const EXAM_PATTERN_OPTIONS = [
  "OBJECTIVE TYPE", "OBJECTIVE TYPE (MCQ)", "OBJECTIVE TYPE (CBT)",
  "OBJECTIVE TYPE WRITTEN EXAM", "MULTIPLE CHOICE QUESTIONS (MCQ)",
  "MCQ", "MCQ, MSQ, NAT", "MCQ + DESCRIPTIVE",
  "DESCRIPTIVE TYPE", "ESSAY TYPE", "SUBJECTIVE",
  "MIXED (OBJECTIVE + DESCRIPTIVE)", "COMPUTER BASED TEST",
  "PEN AND PAPER", "ONLINE CBT", "OFFLINE PBT",
  "TYPING TEST", "SKILL TEST", "PRACTICAL TEST",
  "INTERVIEW", "PERSONALITY TEST", "PHYSICAL TEST", "AS PER TIER"
];

export const EXAM_SECTIONS_OPTIONS = [
  "SECTION A", "SECTION B", "SECTION C", "SECTION A, B, C",
  "PART A, PART B", "PAPER I, PAPER II", "PAPER I, PAPER II, PAPER III",
  "ENGLISH, GK", "ENGLISH, GK, MATHS",
  "ENGLISH, MATHS, REASONING, GK",
  "GENERAL INTELLIGENCE, ENGLISH, QUANTITATIVE APTITUDE, GENERAL AWARENESS",
  "REASONING, ENGLISH, QUANTITATIVE, GENERAL AWARENESS",
  "REASONING, ENGLISH, QUANT, GA, COMPUTER",
  "GS, CSAT",
  "GS-I, GS-II, GS-III, GS-IV, OPTIONAL, ESSAY",
  "AS PER SUBJECT", "AS PER SYLLABUS"
];

export const MODE_OF_EXAM_OPTIONS = [
  "ONLINE (COMPUTER BASED TEST)", "OFFLINE (PEN AND PAPER)",
  "OFFLINE (OMR BASED)", "ONLINE + OFFLINE",
  "CBT (COMPUTER BASED TEST)", "PBT (PEN BASED TEST)",
  "HYBRID", "REMOTE PROCTORED"
];

export const EXAM_DURATION_OPTIONS = [
  "60 MINUTES", "60 MINUTES (TIER-1)", "90 MINUTES",
  "2 HOURS", "2 HOURS PER PAPER", "2.5 HOURS",
  "3 HOURS", "3 HOURS PER PAPER", "4 HOURS",
  "AS PER TIER", "AS PER PAPER", "VARIES BY SECTION"
];

export const TOTAL_MARKS_OPTIONS = [
  "50", "100", "150", "200", "250", "300", "400", "500",
  "600", "700", "800", "1000", "1750", "2000", "2025",
  "AS PER TIER", "AS PER PAPER", "VARIES"
];

export const NUMBER_OF_QUESTIONS_OPTIONS = [
  "25", "30", "40", "50", "60", "75", "100", "120",
  "150", "180", "200", "VARIES", "AS PER SECTION"
];

export const MARKING_SCHEME_OPTIONS = [
  "NO NEGATIVE MARKING", "NEGATIVE MARKING",
  "NEGATIVE MARKING 1/4", "NEGATIVE MARKING 1/3",
  "NEGATIVE MARKING 0.25 MARKS", "NEGATIVE MARKING 0.50 MARKS",
  "NEGATIVE MARKING FOR MCQ", "NEGATIVE MARKING FOR WRONG ANSWERS",
  "DIFFERENTIAL MARKING", "1 MARK PER QUESTION",
  "2 MARKS PER QUESTION", "3 MARKS PER QUESTION", "4 MARKS PER QUESTION",
  "SECTION-WISE MARKING", "AS PER EXAM RULES"
];

export const PAPER_MEDIUM_OPTIONS = [
  "ENGLISH", "HINDI", "ENGLISH, HINDI", "ENGLISH AND HINDI",
  "REGIONAL LANGUAGES", "SPECIFIC LANGUAGE",
  "BILINGUAL (ENGLISH/HINDI)", "ENGLISH, HINDI AND REGIONAL LANGUAGES",
  "TAMIL", "TELUGU", "KANNADA", "MALAYALAM", "MARATHI",
  "GUJARATI", "BENGALI", "PUNJABI", "ASSAMESE", "ODIA",
  "URDU", "KONKANI", "MANIPURI", "NEPALI", "SANSKRIT",
  "SINDHI", "KASHMIRI", "DOGRI", "BODO", "MAITHILI", "SANTHALI",
  "AS PER STATE", "AS PER EXAM RULES"
];

// ============================================
// SECTION 4: AGE & DOB OPTIONS
// ============================================

export const AGE_CRITERIA_TYPE_OPTIONS = [
  "STARTING_AGE", "ENDING_AGE", "BETWEEN_AGE",
  "MINIMUM_DOB", "MAXIMUM_DOB", "BETWEEN_DOB", "NO_AGE_LIMIT"
];

// ============================================
// SECTION 5: PERSONAL & RESERVATION OPTIONS
// ============================================

export const GENDER_OPTIONS = ["MALE", "FEMALE", "TRANSGENDER"];

export const MARITAL_STATUS_OPTIONS = [
  "UNMARRIED", "MARRIED", "WIDOW", "WIDOWER",
  "DIVORCEE", "DIVORCED", "SEPARATED"
];

export const NATIONALITY_OPTIONS = [
  "INDIAN", "CITIZEN OF NEPAL", "CITIZEN OF BHUTAN",
  "TIBETAN REFUGEE (PRE-1962)",
  "PERSON OF INDIAN ORIGIN (PIO) FROM PAKISTAN",
  "PERSON OF INDIAN ORIGIN (PIO) FROM BURMA/MYANMAR",
  "PERSON OF INDIAN ORIGIN (PIO) FROM BANGLADESH",
  "PERSON OF INDIAN ORIGIN (PIO) FROM SRI LANKA",
  "PERSON OF INDIAN ORIGIN (PIO) FROM KENYA",
  "PERSON OF INDIAN ORIGIN (PIO) FROM UGANDA",
  "PERSON OF INDIAN ORIGIN (PIO) FROM TANZANIA",
  "PERSON OF INDIAN ORIGIN (PIO) FROM ZAMBIA",
  "PERSON OF INDIAN ORIGIN (PIO) FROM MALAWI",
  "PERSON OF INDIAN ORIGIN (PIO) FROM ZAIRE/DR CONGO",
  "PERSON OF INDIAN ORIGIN (PIO) FROM ETHIOPIA",
  "PERSON OF INDIAN ORIGIN (PIO) FROM SOUTH AFRICA",
  "PERSON OF INDIAN ORIGIN (PIO) FROM MAURITIUS",
  "PERSON OF INDIAN ORIGIN (PIO) FROM VIETNAM",
  "PERSON OF INDIAN ORIGIN (PIO) FROM MALAYSIA",
  "PERSON OF INDIAN ORIGIN (PIO) FROM SINGAPORE",
  "PERSON OF INDIAN ORIGIN (PIO) FROM INDONESIA",
  "PERSON OF INDIAN ORIGIN (PIO) FROM THAILAND",
  "PERSON OF INDIAN ORIGIN (PIO) FROM PHILIPPINES",
  "OCI (OVERSEAS CITIZEN OF INDIA) FROM UNITED STATES",
  "OCI (OVERSEAS CITIZEN OF INDIA) FROM UNITED KINGDOM",
  "OCI (OVERSEAS CITIZEN OF INDIA) FROM CANADA",
  "OCI (OVERSEAS CITIZEN OF INDIA) FROM AUSTRALIA",
  "NRI (NON-RESIDENT INDIAN) IN UNITED STATES",
  "NRI (NON-RESIDENT INDIAN) IN UNITED KINGDOM",
  "NRI (NON-RESIDENT INDIAN) IN UAE",
  "NRI (NON-RESIDENT INDIAN) IN SAUDI ARABIA",
  "FOREIGN NATIONAL", "FOREIGN NATIONAL WITH INDIAN DEGREE",
  "FOREIGN NATIONAL WITH INDIAN ORIGIN"
];

export const DOMICILE_OPTIONS = [
  "ALL STATES",
  "ANDHRA PRADESH", "ARUNACHAL PRADESH", "ASSAM", "BIHAR",
  "CHHATTISGARH", "GOA", "GUJARAT", "HARYANA", "HIMACHAL PRADESH",
  "JHARKHAND", "KARNATAKA", "KERALA", "MADHYA PRADESH", "MAHARASHTRA",
  "MANIPUR", "MEGHALAYA", "MIZORAM", "NAGALAND", "ODISHA",
  "PUNJAB", "RAJASTHAN", "SIKKIM", "TAMIL NADU", "TELANGANA",
  "TRIPURA", "UTTAR PRADESH", "UTTARAKHAND", "WEST BENGAL",
  "ANDAMAN AND NICOBAR ISLANDS", "CHANDIGARH",
  "DADRA AND NAGAR HAVELI AND DAMAN AND DIU", "DELHI",
  "JAMMU AND KASHMIR", "LADAKH", "LAKSHADWEEP", "PUDUCHERRY"
];

export const CASTE_CATEGORY_OPTIONS = ["GEN", "OBC", "EWS", "SC", "ST"];

export const PWD_APPLICABILITY_OPTIONS = ["APPLICABLE", "NOT APPLICABLE"];

// ============================================
// SECTION 6: EDUCATION OPTIONS
// ============================================

export const HIGHEST_EXAMSUCATION_OPTIONS = [
  "POST DOCTORATE", "PHD", "POST GRADUATION", "GRADUATION",
  "DIPLOMA", "(12TH) HIGHER SECONDARY", "(10TH) SECONDARY",
  "CLASS VIII", "CLASS VI", "NO EDUCATION"
];

export const EDUCATION_LEVEL_KEYS = [
  "post_doctorate", "phd", "post_graduation", "graduation",
  "diploma", "12th_higher_secondary", "10th_secondary",
  "CLASS_VIII", "CLASS_VI", "no_education"
];

export const EDUCATION_LEVEL_LABELS = {
  post_doctorate: "Post Doctorate",
  phd: "PhD",
  post_graduation: "Post Graduation",
  graduation: "Graduation",
  diploma: "Diploma",
  "12th_higher_secondary": "12th / Higher Secondary",
  "10th_secondary": "10th / Secondary",
  CLASS_VIII: "Class VIII",
  CLASS_VI: "Class VI",
  no_education: "No Education",
};

export const GRADUATION_COURSES = [
  "BTech", "BE", "BSc", "BA", "BCom", "MBBS", "BDS",
  "LLB", "BCA", "BBA", "BPharm", "BEd", "BArch", "BHM",
  "ALL COURSES", "OTHER"
];

export const POST_GRADUATION_COURSES = [
  "MTech", "MBA", "MSc", "MA", "MCom", "MD", "MS (Medical)",
  "LLM", "MCA", "MPharm", "MArch", "ALL COURSES", "OTHER"
];

export const DIPLOMA_COURSES = [
  "Polytechnic Diploma", "ITI", "DPharm", "PGDCA",
  "ALL COURSES", "OTHER"
];

export const TWELFTH_COURSES = [
  "Science", "Commerce", "Arts", "Vocational",
  "ALL COURSES", "OTHER"
];

export const TENTH_COURSES = ["(10TH) SECONDARY", "OTHER"];

export const STATUS_OPTIONS = [
  "PASSED", "FINAL YEAR / APPEARING", "ALL STATUS"
];

export const BOARD_UNIVERSITY_OPTIONS = [
  "CBSE", "ICSE", "STATE BOARD", "NIOS", "RECOGNIZED UNIVERSITY", "OTHER"
];

export const ACTIVE_BACKLOGS_OPTIONS = ["NOT APPLICABLE", "APPLICABLE"];

// ============================================
// SECTION 7: ADDITIONAL CRITERIA OPTIONS
// ============================================

export const GAP_YEARS_OPTIONS = [
  "NO LIMIT", "0", "1", "2", "3", "4", "5", ">5"
];

export const NCC_WING_OPTIONS = ["ARMY", "NAVY", "AIR FORCE"];

export const NCC_CERTIFICATE_OPTIONS = [
  "A Certificate", "B Certificate", "C Certificate"
];

export const NCC_GRADE_OPTIONS = ["A", "B", "C", "D"];

export const EX_SERVICEMEN_OPTIONS = [
  "NOT APPLICABLE", "APPLICABLE",
  "EX-SERVICEMAN (ESM)", "EX-SERVICEMEN", "DISABLED EX-SERVICEMEN",
  "DEPENDENT OF EX-SERVICEMEN", "WIDOW OF EX-SERVICEMEN",
  "WAR WIDOW", "GALLANTRY AWARD WINNER",
  "SERVING DEFENCE PERSONNEL", "RELEASED/RETIRED FROM ARMED FORCES"
];

export const SPORTS_QUOTA_OPTIONS = [
  "NOT APPLICABLE", "DISTRICT LEVEL", "INTER-UNIVERSITY",
  "INTERNATIONAL (OLYMPICS, WORLD CHAMPIONSHIPS, ASIAN GAMES, COMMONWEALTH GAMES)",
  "NATIONAL (SENIOR/JUNIOR NATIONALS, NATIONAL GAMES)",
  "STATE LEVEL"
];

export const CPL_OPTIONS = [
  "NOT APPLICABLE", "YES", "NO",
  "CPL (COMMERCIAL PILOT LICENSE)", "PPL (PRIVATE PILOT LICENSE)",
  "ATPL (AIRLINE TRANSPORT PILOT LICENSE)", "CATEGORY A", "CATEGORY B"
];

export const VISION_OPTIONS = [
  "NOT APPLICABLE", "6/6 (NORMAL VISION)", "6/6 EACH EYE",
  "6/9 EACH EYE", "6/12 EACH EYE", "6/6 OR 6/9",
  "NORMAL (WITHOUT GLASSES)", "CORRECTABLE WITH GLASSES",
  "COLOR VISION NORMAL", "NO COLOR BLINDNESS",
  "AS PER DEFENCE STANDARDS", "AS PER MEDICAL STANDARDS",
  "LASIK/PRK ALLOWED", "LASIK/PRK NOT ALLOWED"
];

export const LANGUAGE_OPTIONS = [
  "ENGLISH", "HINDI", "TAMIL", "TELUGU", "KANNADA",
  "MALAYALAM", "MARATHI", "GUJARATI", "BENGALI", "PUNJABI",
  "ASSAMESE", "ODIA", "URDU", "KONKANI", "MANIPURI",
  "NEPALI", "SANSKRIT"
];

export const DRIVING_LICENSE_OPTIONS = [
  "NOT APPLICABLE", "MCWG (MOTORCYCLE WITH GEAR)",
  "MCWOG (MOTORCYCLE WITHOUT GEAR)",
  "LMV (LIGHT MOTOR VEHICLE)", "LMV-NT (LIGHT MOTOR VEHICLE NON-TRANSPORT)",
  "LMV-TR (LIGHT MOTOR VEHICLE TRANSPORT)", "HMV (HEAVY MOTOR VEHICLE)",
  "HGMV (HEAVY GOODS MOTOR VEHICLE)", "HPMV (HEAVY PASSENGER MOTOR VEHICLE)",
  "TRANSPORT LICENSE", "TWO-WHEELER", "FOUR-WHEELER",
  "BOTH TWO & FOUR WHEELER"
];

export const EMPLOYMENT_STATUS_OPTIONS = [
  "NOT APPLICABLE", "UNEMPLOYED", "STUDENT", "FRESHER",
  "CENTRAL GOVERNMENT EMPLOYEE", "STATE GOVERNMENT EMPLOYEE",
  "PUBLIC SECTOR UNDERTAKING (PSU) EMPLOYEE", "PRIVATE SECTOR EMPLOYEE",
  "SELF-EMPLOYED", "BUSINESS OWNER", "CONTRACTUAL EMPLOYEE",
  "RETIRED", "HOMEMAKER", "DEFENCE PERSONNEL (SERVING)",
  "DEFENCE PERSONNEL (RETIRED)"
];

export const WORK_EXPERIENCE_REQUIRED_OPTIONS = [
  "NO", "YES", "FRESHER", "NO EXPERIENCE REQUIRED",
  "EXPERIENCE PREFERRED", "EXPERIENCE MANDATORY", "AS PER POST"
];

export const WORK_EXPERIENCE_YEARS_OPTIONS = [
  "0", "1", "2", "3", "4", "5",
  "1-2 YEARS", "2-3 YEARS", "3-5 YEARS",
  "5-7 YEARS", "7-10 YEARS", "10+ YEARS",
  "MINIMUM 1 YEAR", "MINIMUM 2 YEARS", "MINIMUM 3 YEARS",
  "MINIMUM 5 YEARS", "AS PER POST REQUIREMENT", "IN RELEVANT FIELD"
];

// ============================================
// DIVISION-LEVEL FIELD GROUPS
// (These fields exist per-division when has_divisions=true,
//  or at top level when has_divisions=false)
// ============================================

export const CASTE_KEYS = ["GEN", "OBC", "EWS", "SC", "ST"];
export const DOB_YEARS = ["2026", "2027", "2028", "2029", "2030"];

// ============================================
// BLANK TEMPLATES
// ============================================

const blankCasteObj = () => ({ GEN: "", OBC: "", EWS: "", SC: "", ST: "" });
const blankDobYears = () => ({ "2026": "", "2027": "", "2028": "", "2029": "", "2030": "" });

export const blankEducationLevel = () => ({
  course: { options: [], except_course: [] },
  subject: "",
  mandatory_subject: "",
  mandatory_subjects: [],
  status: "",
  marks_percentage: blankCasteObj(),
  mandatory_subject_marks_percentage: blankCasteObj(),
  mandatory_subjects_marks_percentage: blankCasteObj(),
  completed_year: "",
  board_university: "",
  active_backlogs_allowed: "",
});

export const blankDivision = () => ({
  // Division header
  _divisionKey: "",
  post_name: "",
  post_code: "",
  group: "",
  ministry_department: "",

  // Exam pattern
  exam_tiers: "",
  exam_subjects: "",
  exam_pattern: "",
  exam_sections: "",
  mode_of_exam: "",
  exam_duration: "",
  total_marks: "",
  number_of_questions: "",
  marking_scheme: "",
  paper_medium: "",
  exam_date: "",
  maximum_attempts_allowed: "",

  // Age & DOB
  age_criteria_type: "",
  starting_age: "",
  ending_age: "",
  between_age: "",
  minimum_dob: "",
  maximum_dob: "",
  between_dob: blankDobYears(),
  no_age_limit: "",
  between_dob_mode: "simple", // "simple" | "category"
  between_dob_category: {
    GEN: blankDobYears(),
    OBC: blankDobYears(),
    EWS: blankDobYears(),
    SC: blankDobYears(),
    ST: blankDobYears(),
  },

  // Personal & reservation
  gender: "MALE, FEMALE, TRANSGENDER",
  special_gender_eligibility: "",
  marital_status: {
    MALE: ["MARRIED", "UNMARRIED"],
    FEMALE: ["MARRIED", "UNMARRIED"],
    TRANSGENDER: ["MARRIED", "UNMARRIED"],
  },
  nationality: ["INDIAN"],
  domicile: "ALL STATES",
  caste_category: "GEN, OBC, EWS, SC, ST",
  pwd_status: {
    applicability: "",
    marks_percentage_basis: blankCasteObj(),
    age_relaxation_basis: blankCasteObj(),
  },
  age_relaxation: { GEN: "", OBC: "", EWS: "", SC: "", ST: "", EX_SERVICEMEN: "" },

  // Education
  highest_education_qualification: "",
  education_levels: {
    post_doctorate: "",
    phd: "",
    post_graduation: "",
    graduation: "",
    diploma: "",
    "12th_higher_secondary": "",
    "10th_secondary": "",
    CLASS_VI: "",
    CLASS_VIII: "",
    no_education: "",
  },

  // Additional
  gap_years_allowed: "",
  educational_stream_restriction: "",
  ncc_wing: "",
  ncc_certificate: "",
  ncc_certificate_grade: "",
  ex_servicemen_status: "",
  sports_quota_eligibility: "",
  cpl_holder: "",
  height_cm: "",
  weight_kg: "",
  vision_eyesight: "",
  language_proficiency: "",
  driving_license_type: "",
  current_employment_status: "",
  work_experience_required: "",
  work_experience_years: "",
});

export const blankExamData = () => ({
  // Section 1: Basic info
  exam_code: "",
  exam_name: "",
  exam_level: "",
  exam_sector: "",
  exam_target: "",
  exam_frequency_year: "",
  conducting_body: "",
  posts_classes_courses_departments_academies: "",
  has_divisions: false,

  // Divisions array (UI-only, converted to academies object on export)
  divisions: [blankDivision()],

  // Section 8: Official info
  official_website: "",
  notification_link: "",
  application_form_link: "",
  application_fee: {
    GEN: "", OBC: "", EWS: "", SC: "", ST: "",
    FEMALE: "", PWD: "", EX_SERVICEMEN: "",
  },
  payment_mode: "",
  selection_process: [],
  training_duration: "",
  service_bond: "",
  probation_period: "",
  pay_scale: "",
  posting_locations: "",
  important_dates: {
    notification_date: "",
    application_start_date: "",
    application_end_date: "",
    exam_date: "",
    admit_card_date: "",
    result_date: "",
  },
  helpline: { email: "", phone: "" },
  remarks: "",
});

// ============================================
// CONVERT FORM STATE → FINAL JSON
// ============================================

/**
 * Serialize education_levels from a division/top-level data
 */
const serializeEducationLevels = (eduLevels) => {
  if (!eduLevels || typeof eduLevels !== "object") return eduLevels;
  const result = {};
  for (const [key, val] of Object.entries(eduLevels)) {
    if (!val || val === "" || (typeof val === "object" && Object.keys(val).length === 0)) {
      result[key] = "";
    } else {
      result[key] = val;
    }
  }
  return result;
};

/**
 * Serialize between_dob based on mode
 */
const serializeBetweenDob = (div) => {
  if (div.between_dob_mode === "category") {
    return div.between_dob_category;
  }
  return div.between_dob;
};

/**
 * Clean up a division object for export (remove UI-only fields)
 */
const serializeDivision = (div) => {
  const result = { ...div };
  // Remove UI-only fields
  delete result._divisionKey;
  delete result.between_dob_mode;
  delete result.between_dob_category;
  // Fix between_dob
  result.between_dob = serializeBetweenDob(div);
  // Fix education
  result.education_levels = serializeEducationLevels(result.education_levels);
  // Handle minimum_dob / maximum_dob — convert to year-based object if string
  if (typeof result.minimum_dob === "string" && result.minimum_dob === "") {
    result.minimum_dob = "";
  }
  if (typeof result.maximum_dob === "string" && result.maximum_dob === "") {
    result.maximum_dob = "";
  }
  return result;
};

/**
 * Convert the full form state into the final JSON structure
 */
export const formStateToJson = (state) => {
  const json = {};

  // Basic fields
  json.exam_code = state.exam_code;
  json.exam_name = state.exam_name;
  json.full_form = state.full_form || "";
  json.exam_level = state.exam_level;
  json.exam_sector = state.exam_sector;
  json.exam_target = state.exam_target;
  json.exam_frequency_year = state.exam_frequency_year;
  json.conducting_body = state.conducting_body;
  json.posts_classes_courses_departments_academies = state.posts_classes_courses_departments_academies;

  if (state.has_divisions && state.divisions.length > 0) {
    // Build academies object
    const academies = {};
    state.divisions.forEach((div) => {
      const key = div._divisionKey || div.post_name || "UNNAMED";
      academies[key] = serializeDivision(div);
    });
    json.academies = academies;
  } else {
    // Flat structure — put division[0] fields at top level
    const flat = serializeDivision(state.divisions[0] || blankDivision());
    Object.assign(json, flat);
  }

  // Official info
  json.official_website = state.official_website;
  json.notification_link = state.notification_link;
  json.application_form_link = state.application_form_link;
  json.application_fee = state.application_fee;
  json.payment_mode = state.payment_mode;
  json.selection_process = state.selection_process;
  json.training_duration = state.training_duration;
  json.service_bond = state.service_bond;
  json.probation_period = state.probation_period;
  json.pay_scale = state.pay_scale;
  json.posting_locations = state.posting_locations;
  json.important_dates = state.important_dates;
  json.helpline = state.helpline;
  json.remarks = state.remarks;

  return json;
};

/**
 * Generate the allexamnames.json entry for this exam
 */
export const generateCatalogEntry = (state, category, fileName) => ({
  exam_name: state.exam_name,
  exam_code: state.exam_code,
  exam_code_lower: (state.exam_code || "").toLowerCase(),
  linked_json_file: `${category}/${fileName}`,
  has_divisions: state.has_divisions,
});
