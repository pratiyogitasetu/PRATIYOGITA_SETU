/**
 * Exam Data Loader Page
 *
 * A form-based tool to create/edit exam JSON files for the eligibility checker.
 * Steps:
 *   1. Pick category folder + exam (or create new)
 *   2. Fill form across 8 accordion sections
 *   3. Preview / Download / Copy the generated JSON
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import FormControlLabel from "@mui/material/FormControlLabel";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Download,
  Copy,
  FileJson,
  FolderPlus,
} from "lucide-react";

import {
  CATEGORY_OPTIONS,
  EXAM_LEVEL_OPTIONS,
  EXAM_TARGET_OPTIONS,
  EXAM_FREQUENCY_OPTIONS,
  EXAM_TIERS_OPTIONS,
  EXAM_SUBJECTS_OPTIONS,
  EXAM_PATTERN_OPTIONS,
  EXAM_SECTIONS_OPTIONS,
  MODE_OF_EXAM_OPTIONS,
  EXAM_DURATION_OPTIONS,
  TOTAL_MARKS_OPTIONS,
  NUMBER_OF_QUESTIONS_OPTIONS,
  MARKING_SCHEME_OPTIONS,
  PAPER_MEDIUM_OPTIONS,
  AGE_CRITERIA_TYPE_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  NATIONALITY_OPTIONS,
  DOMICILE_OPTIONS,
  CASTE_CATEGORY_OPTIONS,
  PWD_APPLICABILITY_OPTIONS,
  HIGHEST_EXAMSUCATION_OPTIONS,
  EDUCATION_LEVEL_KEYS,
  EDUCATION_LEVEL_LABELS,
  GRADUATION_COURSES,
  POST_GRADUATION_COURSES,
  DIPLOMA_COURSES,
  TWELFTH_COURSES,
  TENTH_COURSES,
  STATUS_OPTIONS,
  BOARD_UNIVERSITY_OPTIONS,
  ACTIVE_BACKLOGS_OPTIONS,
  GAP_YEARS_OPTIONS,
  NCC_WING_OPTIONS,
  NCC_CERTIFICATE_OPTIONS,
  NCC_GRADE_OPTIONS,
  EX_SERVICEMEN_OPTIONS,
  SPORTS_QUOTA_OPTIONS,
  CPL_OPTIONS,
  VISION_OPTIONS,
  LANGUAGE_OPTIONS,
  DRIVING_LICENSE_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  WORK_EXPERIENCE_REQUIRED_OPTIONS,
  WORK_EXPERIENCE_YEARS_OPTIONS,
  CASTE_KEYS,
  DOB_YEARS,
  blankDivision,
  blankExamData,
  blankEducationLevel,
  formStateToJson,
  generateCatalogEntry,
} from "./examDataLoaderConfig";

// ============================================
// THEME (matching eligibility page)
// ============================================

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#E4572E" },
    background: { default: "transparent", paper: "#3d2419" },
    text: { primary: "#FBF6EE", secondary: "rgba(232,216,195,0.7)" },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-root": { fontSize: "0.9rem", color: "#FBF6EE" },
          "& .MuiInputBase-input": { color: "#FBF6EE" },
          "& .MuiInputLabel-root": { fontSize: "0.9rem", color: "rgba(232,216,195,0.7)" },
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "rgba(228,87,46,0.4)" },
            "&:hover fieldset": { borderColor: "#E4572E" },
            "&.Mui-focused fieldset": { borderColor: "#E4572E" },
          },
        },
      },
    },
    MuiMenuItem: { styleOverrides: { root: { fontSize: "0.9rem", color: "#FBF6EE" } } },
    MuiPopover: { defaultProps: { disableScrollLock: true } },
    MuiMenu: {
      defaultProps: { disableScrollLock: true },
      styleOverrides: {
        paper: { maxHeight: 220 },
        list: {
          maxHeight: 220, overflowY: "auto", scrollbarWidth: "thin",
          scrollbarColor: "#E4572E rgba(43,30,23,0.5)",
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { background: "rgba(43,30,23,0.5)", borderRadius: "999px" },
          "&::-webkit-scrollbar-thumb": { background: "#E4572E", borderRadius: "999px" },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        listbox: {
          maxHeight: 220, overflowY: "auto", scrollbarWidth: "thin",
          scrollbarColor: "#E4572E rgba(43,30,23,0.5)",
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { background: "rgba(43,30,23,0.5)", borderRadius: "999px" },
          "&::-webkit-scrollbar-thumb": { background: "#E4572E", borderRadius: "999px" },
        },
      },
    },
    MuiModal: { defaultProps: { disableScrollLock: true } },
  },
});

const buildDefaultFileName = (examCode, examName) => {
  const baseName = (examCode || examName || "exam")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${baseName || "exam"}.json`;
};

const parseDivisionNames = (value) => value
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const syncDivisionsFromNames = (names, existingDivisions) => {
  const existingMap = new Map(
    (existingDivisions || []).flatMap((division) => {
      const keys = [division?._divisionKey, division?.post_name]
        .map((key) => (key || "").trim())
        .filter(Boolean);

      return keys.map((key) => [key, division]);
    })
  );

  return names.map((name) => {
    const existing = existingMap.get(name);
    if (!existing) {
      return {
        ...blankDivision(),
        _divisionKey: name,
        post_name: name,
      };
    }

    return {
      ...existing,
      _divisionKey: name,
      post_name: existing.post_name || name,
    };
  });
};

// ============================================
// HELPER COMPONENTS
// ============================================

/** Collapsible accordion section */
const Section = ({ title, defaultOpen = false, children, badge }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-3 rounded-xl border border-[rgba(228,87,46,0.3)] overflow-hidden bg-[rgba(43,30,23,0.45)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left
                   bg-[rgba(228,87,46,0.12)] hover:bg-[rgba(228,87,46,0.2)] transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={18} className="text-[#E4572E]" /> : <ChevronRight size={18} className="text-[#E4572E]" />}
          <span className="text-[#FBF6EE] font-semibold text-sm">{title}</span>
          {badge && (
            <span className="ml-2 bg-[#E4572E] text-white text-xs px-2 py-0.5 rounded-full">{badge}</span>
          )}
        </div>
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
};

/** A  2-column grid row */
const Row = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
);

/** Simple select field */
const SelectField = ({ label, value, onChange, options, freeSolo = false, ...rest }) => {
  if (freeSolo) {
    return (
      <Autocomplete
        freeSolo
        size="small"
        options={options}
        value={value || ""}
        onInputChange={(_, v) => onChange(v)}
        renderInput={(params) => <TextField {...params} label={label} size="small" {...rest} />}
      />
    );
  }
  return (
    <TextField select label={label} value={value || ""} onChange={(e) => onChange(e.target.value)} size="small" fullWidth {...rest}>
      <MenuItem value="">
        <em>— Select —</em>
      </MenuItem>
      {options.map((o) => (
        <MenuItem key={o} value={o}>{o}</MenuItem>
      ))}
    </TextField>
  );
};

/** Multi-select with chips */
const MultiSelect = ({ label, value, onChange, options }) => {
  const arr = Array.isArray(value) ? value : typeof value === "string" && value ? value.split(",").map((s) => s.trim()) : [];
  return (
    <Autocomplete
      multiple
      freeSolo
      size="small"
      options={options}
      value={arr}
      onChange={(_, v) => onChange(v)}
      renderTags={(val, getTagProps) =>
        val.map((option, index) => (
          <Chip key={index} label={option} size="small" {...getTagProps({ index })}
            sx={{ bgcolor: "rgba(228,87,46,0.25)", color: "#FBF6EE", fontSize: "0.75rem", height: 22 }} />
        ))
      }
      renderInput={(params) => <TextField {...params} label={label} size="small" />}
    />
  );
};

/** 5-caste row fields (GEN, OBC, EWS, SC, ST) */
const CasteFields = ({ label, obj, onChange }) => (
  <div>
    <Typography variant="caption" sx={{ color: "rgba(232,216,195,0.7)", mb: 0.5, display: "block" }}>{label}</Typography>
    <div className="grid grid-cols-5 gap-2">
      {CASTE_KEYS.map((k) => (
        <TextField key={k} label={k} size="small" value={obj?.[k] || ""} onChange={(e) => onChange({ ...obj, [k]: e.target.value })} />
      ))}
    </div>
  </div>
);

/** Year-wise DOB fields (2026-2030) */
const DobYearFields = ({ label, obj, onChange }) => (
  <div>
    <Typography variant="caption" sx={{ color: "rgba(232,216,195,0.7)", mb: 0.5, display: "block" }}>{label}</Typography>
    <div className="grid grid-cols-5 gap-2">
      {DOB_YEARS.map((y) => (
        <TextField key={y} label={y} size="small" value={obj?.[y] || ""} onChange={(e) => onChange({ ...obj, [y]: e.target.value })} />
      ))}
    </div>
  </div>
);

// ============================================
// EDUCATION LEVEL SUB-FORM
// ============================================

const getCoursesForKey = (levelKey) => {
  switch (levelKey) {
    case "graduation": return GRADUATION_COURSES;
    case "post_graduation": return POST_GRADUATION_COURSES;
    case "diploma": return DIPLOMA_COURSES;
    case "12th_higher_secondary": return TWELFTH_COURSES;
    case "10th_secondary": return TENTH_COURSES;
    default: return ["ALL COURSES", "OTHER"];
  }
};

const EducationLevelForm = ({ levelKey, data, onChange }) => {
  if (!data || data === "") {
    return (
      <Button size="small" variant="outlined" sx={{ borderColor: "rgba(228,87,46,0.4)", color: "#E4572E", textTransform: "none" }}
        onClick={() => onChange(blankEducationLevel())}>
        + Enable {EDUCATION_LEVEL_LABELS[levelKey] || levelKey}
      </Button>
    );
  }

  const upd = (field, val) => onChange({ ...data, [field]: val });

  return (
    <div className="space-y-3 p-3 rounded-lg border border-[rgba(228,87,46,0.2)] bg-[rgba(43,30,23,0.3)]">
      <div className="flex justify-between items-center">
        <Typography variant="subtitle2" sx={{ color: "#E4572E" }}>
          {EDUCATION_LEVEL_LABELS[levelKey] || levelKey}
        </Typography>
        <IconButton size="small" onClick={() => onChange("")} sx={{ color: "rgba(228,87,46,0.6)" }}>
          <Trash2 size={14} />
        </IconButton>
      </div>

      <Row>
        <MultiSelect label="Courses Allowed" value={data.course?.options || []}
          onChange={(v) => upd("course", { ...data.course, options: v })}
          options={getCoursesForKey(levelKey)} />
        <MultiSelect label="Except Courses" value={data.course?.except_course || []}
          onChange={(v) => upd("course", { ...data.course, except_course: v })}
          options={getCoursesForKey(levelKey)} />
      </Row>
      <Row>
        <TextField label="Subject" size="small" fullWidth value={data.subject || ""} onChange={(e) => upd("subject", e.target.value)} />
        <TextField label="Mandatory Subject" size="small" fullWidth value={data.mandatory_subject || ""} onChange={(e) => upd("mandatory_subject", e.target.value)} />
      </Row>
      <MultiSelect label="Mandatory Subjects (array)" value={data.mandatory_subjects || []}
        onChange={(v) => upd("mandatory_subjects", v)} options={[]} />
      <Row>
        <SelectField label="Status" value={data.status || ""} onChange={(v) => upd("status", v)} options={STATUS_OPTIONS} freeSolo />
        <SelectField label="Active Backlogs Allowed" value={data.active_backlogs_allowed || ""} onChange={(v) => upd("active_backlogs_allowed", v)} options={ACTIVE_BACKLOGS_OPTIONS} freeSolo />
      </Row>
      <CasteFields label="Marks Percentage (by caste)" obj={data.marks_percentage} onChange={(v) => upd("marks_percentage", v)} />
      <CasteFields label="Mandatory Subject Marks %" obj={data.mandatory_subject_marks_percentage} onChange={(v) => upd("mandatory_subject_marks_percentage", v)} />
      <CasteFields label="Mandatory Subjects Marks %" obj={data.mandatory_subjects_marks_percentage} onChange={(v) => upd("mandatory_subjects_marks_percentage", v)} />
      <Row>
        <TextField label="Completed Year" size="small" fullWidth value={data.completed_year || ""} onChange={(e) => upd("completed_year", e.target.value)} />
        <SelectField label="Board / University" value={typeof data.board_university === "string" ? data.board_university : ""}
          onChange={(v) => upd("board_university", v)} options={BOARD_UNIVERSITY_OPTIONS} freeSolo />
      </Row>
    </div>
  );
};

// ============================================
// DIVISION FORM (Sections 3-7 for one division)
// ============================================

const DivisionForm = ({ index, data, onChange, onRemove, hasDivisions }) => {
  const upd = (field, val) => {
    const next = { ...data, [field]: val };
    onChange(next);
  };

  const updNested = (path, val) => {
    const keys = path.split(".");
    const next = { ...data };
    let cur = next;
    for (let i = 0; i < keys.length - 1; i++) {
      cur[keys[i]] = { ...cur[keys[i]] };
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = val;
    onChange(next);
  };

  return (
    <div className={hasDivisions ? "p-3 rounded-xl border border-[rgba(228,87,46,0.25)] bg-[rgba(43,30,23,0.25)] space-y-3" : "space-y-3"}>
      {hasDivisions && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
            <TextField label="Division Key (e.g. NDA (ARMY))" size="small" fullWidth
              value={data._divisionKey || ""} onChange={(e) => upd("_divisionKey", e.target.value)} />
            <TextField label="Post Name" size="small" fullWidth
              value={data.post_name || ""} onChange={(e) => upd("post_name", e.target.value)} />
            <TextField label="Post Code" size="small" fullWidth
              value={data.post_code || ""} onChange={(e) => upd("post_code", e.target.value)} />
          </div>
          {onRemove && (
            <IconButton onClick={onRemove} sx={{ color: "rgba(228,87,46,0.6)" }} size="small">
              <Trash2 size={16} />
            </IconButton>
          )}
        </div>
      )}
      {hasDivisions && (
        <Row>
          <SelectField label="Group" value={data.group || ""} onChange={(v) => upd("group", v)}
            options={["GROUP A", "GROUP B", "GROUP C", "GROUP D"]} freeSolo />
          <TextField label="Ministry / Department" size="small" fullWidth
            value={data.ministry_department || ""} onChange={(e) => upd("ministry_department", e.target.value)} />
        </Row>
      )}

      {/* --- Section 3: Exam Pattern --- */}
      <Section title="Exam Pattern" defaultOpen={!hasDivisions}>
        <Row>
          <SelectField label="Exam Tiers" value={data.exam_tiers} onChange={(v) => upd("exam_tiers", v)} options={EXAM_TIERS_OPTIONS} freeSolo />
          <SelectField label="Exam Pattern" value={data.exam_pattern} onChange={(v) => upd("exam_pattern", v)} options={EXAM_PATTERN_OPTIONS} freeSolo />
        </Row>
        <TextField label="Exam Subjects" size="small" fullWidth multiline rows={2}
          value={data.exam_subjects || ""} onChange={(e) => upd("exam_subjects", e.target.value)}
          helperText="Comma-separated" />
        <Row>
          <SelectField label="Exam Sections" value={data.exam_sections} onChange={(v) => upd("exam_sections", v)} options={EXAM_SECTIONS_OPTIONS} freeSolo />
          <SelectField label="Mode of Exam" value={data.mode_of_exam} onChange={(v) => upd("mode_of_exam", v)} options={MODE_OF_EXAM_OPTIONS} freeSolo />
        </Row>
        <Row>
          <SelectField label="Exam Duration" value={data.exam_duration} onChange={(v) => upd("exam_duration", v)} options={EXAM_DURATION_OPTIONS} freeSolo />
          <SelectField label="Total Marks" value={data.total_marks} onChange={(v) => upd("total_marks", v)} options={TOTAL_MARKS_OPTIONS} freeSolo />
        </Row>
        <Row>
          <SelectField label="No. of Questions" value={data.number_of_questions} onChange={(v) => upd("number_of_questions", v)} options={NUMBER_OF_QUESTIONS_OPTIONS} freeSolo />
          <SelectField label="Marking Scheme" value={data.marking_scheme} onChange={(v) => upd("marking_scheme", v)} options={MARKING_SCHEME_OPTIONS} freeSolo />
        </Row>
        <Row>
          <SelectField label="Paper Medium" value={data.paper_medium} onChange={(v) => upd("paper_medium", v)} options={PAPER_MEDIUM_OPTIONS} freeSolo />
          <TextField label="Exam Date" size="small" fullWidth value={data.exam_date || ""} onChange={(e) => upd("exam_date", e.target.value)} />
        </Row>
        <TextField label="Maximum Attempts Allowed" size="small" fullWidth value={typeof data.maximum_attempts_allowed === "string" ? data.maximum_attempts_allowed : JSON.stringify(data.maximum_attempts_allowed || "")}
          onChange={(e) => upd("maximum_attempts_allowed", e.target.value)}
          helperText='Simple text like "TILL AGE LIMIT REACHED" or JSON object for category-wise' />
      </Section>

      {/* --- Section 4: Age & DOB --- */}
      <Section title="Age & DOB Criteria">
        <Row>
          <SelectField label="Age Criteria Type" value={data.age_criteria_type} onChange={(v) => upd("age_criteria_type", v)} options={AGE_CRITERIA_TYPE_OPTIONS} />
          <TextField label="Between Age (e.g. 20-30)" size="small" fullWidth value={data.between_age || ""} onChange={(e) => upd("between_age", e.target.value)} />
        </Row>
        <Row>
          <TextField label="Starting Age" size="small" fullWidth value={data.starting_age || ""} onChange={(e) => upd("starting_age", e.target.value)} />
          <TextField label="Ending Age" size="small" fullWidth value={data.ending_age || ""} onChange={(e) => upd("ending_age", e.target.value)} />
        </Row>

        {(data.age_criteria_type === "MINIMUM_DOB") && (
          <DobYearFields label="Minimum DOB (per year)" obj={typeof data.minimum_dob === "object" ? data.minimum_dob : {}} onChange={(v) => upd("minimum_dob", v)} />
        )}
        {(data.age_criteria_type === "MAXIMUM_DOB") && (
          <DobYearFields label="Maximum DOB (per year)" obj={typeof data.maximum_dob === "object" ? data.maximum_dob : {}} onChange={(v) => upd("maximum_dob", v)} />
        )}

        {(data.age_criteria_type === "BETWEEN_DOB") && (
          <>
            <FormControlLabel
              control={<Switch checked={data.between_dob_mode === "category"} onChange={(e) => upd("between_dob_mode", e.target.checked ? "category" : "simple")} sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#E4572E" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#E4572E" } }} />}
              label={<Typography variant="caption" sx={{ color: "rgba(232,216,195,0.7)" }}>Category-wise DOB ranges</Typography>}
            />
            {data.between_dob_mode === "category" ? (
              <div className="space-y-2">
                {CASTE_KEYS.map((cat) => (
                  <DobYearFields key={cat} label={`${cat} — Between DOB`} obj={data.between_dob_category?.[cat] || {}}
                    onChange={(v) => updNested(`between_dob_category.${cat}`, v)} />
                ))}
              </div>
            ) : (
              <DobYearFields label="Between DOB (per year)" obj={data.between_dob || {}} onChange={(v) => upd("between_dob", v)} />
            )}
          </>
        )}

        <TextField label="No Age Limit Note" size="small" fullWidth value={data.no_age_limit || ""} onChange={(e) => upd("no_age_limit", e.target.value)} />
      </Section>

      {/* --- Section 5: Personal & Reservation --- */}
      <Section title="Personal & Reservation Criteria">
        <Row>
          <TextField label="Gender" size="small" fullWidth value={data.gender || ""} onChange={(e) => upd("gender", e.target.value)} helperText='e.g. "MALE, FEMALE, TRANSGENDER"' />
          <TextField label="Special Gender Eligibility" size="small" fullWidth value={data.special_gender_eligibility || ""} onChange={(e) => upd("special_gender_eligibility", e.target.value)} />
        </Row>

        {/* Marital status per gender */}
        <Typography variant="caption" sx={{ color: "rgba(232,216,195,0.7)" }}>Marital Status (per gender)</Typography>
        {GENDER_OPTIONS.map((g) => (
          <MultiSelect key={g} label={`${g} — Marital Status`}
            value={data.marital_status?.[g] || []}
            onChange={(v) => updNested(`marital_status.${g}`, v)}
            options={MARITAL_STATUS_OPTIONS} />
        ))}

        <MultiSelect label="Nationality" value={data.nationality || []} onChange={(v) => upd("nationality", v)} options={NATIONALITY_OPTIONS} />

        <Row>
          <SelectField label="Domicile" value={data.domicile || ""} onChange={(v) => upd("domicile", v)} options={DOMICILE_OPTIONS} freeSolo />
          <TextField label="Caste Category" size="small" fullWidth value={data.caste_category || ""} onChange={(e) => upd("caste_category", e.target.value)} helperText='e.g. "GEN, OBC, EWS, SC, ST"' />
        </Row>

        {/* PwD */}
        <SelectField label="PwD Applicability" value={data.pwd_status?.applicability || ""} onChange={(v) => updNested("pwd_status.applicability", v)} options={PWD_APPLICABILITY_OPTIONS} />
        {data.pwd_status?.applicability === "APPLICABLE" && (
          <>
            <CasteFields label="PwD Marks % Basis" obj={data.pwd_status?.marks_percentage_basis} onChange={(v) => updNested("pwd_status.marks_percentage_basis", v)} />
            <CasteFields label="PwD Age Relaxation Basis" obj={data.pwd_status?.age_relaxation_basis} onChange={(v) => updNested("pwd_status.age_relaxation_basis", v)} />
          </>
        )}

        {/* Age relaxation */}
        <Typography variant="caption" sx={{ color: "rgba(232,216,195,0.7)" }}>Age Relaxation</Typography>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[...CASTE_KEYS, "EX_SERVICEMEN"].map((k) => (
            <TextField key={k} label={k} size="small" value={data.age_relaxation?.[k] || ""}
              onChange={(e) => updNested(`age_relaxation.${k}`, e.target.value)} />
          ))}
        </div>
      </Section>

      {/* --- Section 6: Education --- */}
      <Section title="Education Levels">
        <SelectField label="Highest Education Qualification" value={data.highest_education_qualification || ""}
          onChange={(v) => upd("highest_education_qualification", v)} options={HIGHEST_EXAMSUCATION_OPTIONS} freeSolo />

        {EDUCATION_LEVEL_KEYS.map((lk) => (
          <EducationLevelForm
            key={lk}
            levelKey={lk}
            data={data.education_levels?.[lk]}
            onChange={(v) => {
              const next = { ...data.education_levels, [lk]: v };
              upd("education_levels", next);
            }}
          />
        ))}
      </Section>

      {/* --- Section 7: Additional Criteria --- */}
      <Section title="Additional Criteria">
        <Row>
          <SelectField label="Gap Years Allowed" value={data.gap_years_allowed || ""} onChange={(v) => upd("gap_years_allowed", v)} options={GAP_YEARS_OPTIONS} freeSolo />
          <TextField label="Educational Stream Restriction" size="small" fullWidth value={data.educational_stream_restriction || ""} onChange={(e) => upd("educational_stream_restriction", e.target.value)} />
        </Row>
        <Row>
          <MultiSelect label="NCC Wing" value={data.ncc_wing ? (Array.isArray(data.ncc_wing) ? data.ncc_wing : [data.ncc_wing].filter(Boolean)) : []} onChange={(v) => upd("ncc_wing", v.join(", ") || "")} options={NCC_WING_OPTIONS} />
          <SelectField label="NCC Certificate" value={data.ncc_certificate || ""} onChange={(v) => upd("ncc_certificate", v)} options={NCC_CERTIFICATE_OPTIONS} freeSolo />
        </Row>
        <Row>
          <SelectField label="NCC Grade" value={data.ncc_certificate_grade || ""} onChange={(v) => upd("ncc_certificate_grade", v)} options={NCC_GRADE_OPTIONS} freeSolo />
          <SelectField label="Ex-Servicemen Status" value={data.ex_servicemen_status || ""} onChange={(v) => upd("ex_servicemen_status", v)} options={EX_SERVICEMEN_OPTIONS} freeSolo />
        </Row>
        <Row>
          <SelectField label="Sports Quota" value={data.sports_quota_eligibility || ""} onChange={(v) => upd("sports_quota_eligibility", v)} options={SPORTS_QUOTA_OPTIONS} freeSolo />
          <SelectField label="CPL Holder" value={data.cpl_holder || ""} onChange={(v) => upd("cpl_holder", v)} options={CPL_OPTIONS} freeSolo />
        </Row>
        <Row>
          <TextField label="Height (cm)" size="small" fullWidth value={data.height_cm || ""} onChange={(e) => upd("height_cm", e.target.value)} />
          <TextField label="Weight (kg)" size="small" fullWidth value={data.weight_kg || ""} onChange={(e) => upd("weight_kg", e.target.value)} />
        </Row>
        <Row>
          <SelectField label="Vision/Eyesight" value={data.vision_eyesight || ""} onChange={(v) => upd("vision_eyesight", v)} options={VISION_OPTIONS} freeSolo />
          <MultiSelect label="Language Proficiency" value={data.language_proficiency ? (Array.isArray(data.language_proficiency) ? data.language_proficiency : [data.language_proficiency].filter(Boolean)) : []} onChange={(v) => upd("language_proficiency", v.join(", ") || "")} options={LANGUAGE_OPTIONS} />
        </Row>
        <Row>
          <SelectField label="Driving License Type" value={data.driving_license_type || ""} onChange={(v) => upd("driving_license_type", v)} options={DRIVING_LICENSE_OPTIONS} freeSolo />
          <SelectField label="Current Employment Status" value={data.current_employment_status || ""} onChange={(v) => upd("current_employment_status", v)} options={EMPLOYMENT_STATUS_OPTIONS} freeSolo />
        </Row>
        <Row>
          <SelectField label="Work Experience Required" value={data.work_experience_required || ""} onChange={(v) => upd("work_experience_required", v)} options={WORK_EXPERIENCE_REQUIRED_OPTIONS} freeSolo />
          <SelectField label="Work Experience Years" value={data.work_experience_years || ""} onChange={(v) => upd("work_experience_years", v)} options={WORK_EXPERIENCE_YEARS_OPTIONS} freeSolo />
        </Row>
      </Section>
    </div>
  );
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function ExamDataLoader() {
  // Step control
  const [category, setCategory] = useState("");
  const [existingExams, setExistingExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState("__new__");
  const [fileName, setFileName] = useState("");
  const [isFileNameManual, setIsFileNameManual] = useState(false);
  const [examLevelOptions, setExamLevelOptions] = useState(EXAM_LEVEL_OPTIONS);
  const [examSectorOptions, setExamSectorOptions] = useState([]);
  const [examTargetOptions, setExamTargetOptions] = useState(EXAM_TARGET_OPTIONS);
  const [examFrequencyOptions, setExamFrequencyOptions] = useState(EXAM_FREQUENCY_OPTIONS);

  // Form state
  const [formData, setFormData] = useState(blankExamData());

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const resolvedFileName = useMemo(
    () => fileName || buildDefaultFileName(formData.exam_code, formData.exam_name),
    [fileName, formData.exam_code, formData.exam_name]
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/examsdata/possiblefields.json");
        const data = await res.json();
        const levelOptions = Array.isArray(data?.exam_level)
          ? data.exam_level.filter((value) => value && value !== "ALL APPLICABLE" && value !== "NOT APPLICABLE")
          : [];
        const sectorOptions = Array.isArray(data?.exam_sector)
          ? data.exam_sector.filter((value) => value && value !== "ALL APPLICABLE" && value !== "NOT APPLICABLE")
          : [];
        const targetOptions = Array.isArray(data?.exam_target)
          ? data.exam_target.filter((value) => value && value !== "ALL APPLICABLE" && value !== "NOT APPLICABLE")
          : [];
        const frequencyOptions = Array.isArray(data?.exam_frequency_year)
          ? data.exam_frequency_year.filter((value) => value && value !== "ALL APPLICABLE" && value !== "NOT APPLICABLE")
          : [];

        setExamLevelOptions(levelOptions.length > 0 ? levelOptions : EXAM_LEVEL_OPTIONS);
        setExamSectorOptions(sectorOptions);
        setExamTargetOptions(targetOptions.length > 0 ? targetOptions : EXAM_TARGET_OPTIONS);
        setExamFrequencyOptions(frequencyOptions.length > 0 ? frequencyOptions : EXAM_FREQUENCY_OPTIONS);
      } catch {
        setExamLevelOptions(EXAM_LEVEL_OPTIONS);
        setExamSectorOptions([]);
        setExamTargetOptions(EXAM_TARGET_OPTIONS);
        setExamFrequencyOptions(EXAM_FREQUENCY_OPTIONS);
      }
    })();
  }, []);

  // Load exam catalog from MongoDB API
  useEffect(() => {
    if (!category) { setExistingExams([]); return; }
    (async () => {
      try {
        const res = await fetch("/api/exams/catalog");
        const data = await res.json();
        const exams = data[category] || [];
        setExistingExams(exams);
      } catch { setExistingExams([]); }
    })();
  }, [category]);

  // Count total exams from MongoDB documents
  const [totalExamCount, setTotalExamCount] = useState(0);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/exams/count");
        const data = await res.json();
        setTotalExamCount(data.count || 0);
      } catch { /* ignore */ }
    })();
  }, [existingExams]); // re-count when exams change (after add/delete)

  // Load existing exam JSON when selected
  useEffect(() => {
    if (selectedExam === "__new__" || !selectedExam) {
      setFormData(blankExamData());
      setFileName("");
      setIsFileNameManual(false);
      return;
    }

    const exam = existingExams.find((e) => e.exam_code === selectedExam);

    if (!exam) {
      setFormData(blankExamData());
      setFileName("");
      setIsFileNameManual(false);
      return;
    }

    setFormData((prev) => ({
      ...blankExamData(),
      exam_code: exam.exam_code || "",
      exam_name: exam.exam_name || "",
      has_divisions: typeof exam.has_divisions === "boolean" ? exam.has_divisions : prev.has_divisions,
    }));
    setIsFileNameManual(false);

    if (!exam.linked_json_file) {
      setFileName("");
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      try {
        const docId = exam.linked_json_file.replace(/\.json$/i, '').replace(/\//g, '__');
        const res = await fetch(`/api/exams/${encodeURIComponent(docId)}`);
        const json = await res.json();
        const nextState = jsonToFormState(json);
        nextState.exam_code = nextState.exam_code || exam.exam_code || "";
        nextState.exam_name = nextState.exam_name || exam.exam_name || "";
        setFormData(nextState);
        // Extract filename from path
        const parts = exam.linked_json_file.split("/");
        setFileName(parts[parts.length - 1]);
        setIsFileNameManual(false);
      } catch (err) {
        console.error("Failed to load exam:", err);
        setSnackMsg("Failed to load exam data");
      } finally { setLoading(false); }
    })();
  }, [selectedExam, existingExams]);

  useEffect(() => {
    if (isFileNameManual) return;

    const exam = existingExams.find((entry) => entry.exam_code === selectedExam);
    if (exam?.linked_json_file) return;

    setFileName(buildDefaultFileName(formData.exam_code, formData.exam_name));
  }, [formData.exam_code, formData.exam_name, isFileNameManual, existingExams, selectedExam]);

  // Generate output JSON
  const outputJson = useMemo(() => {
    try { return JSON.stringify(formStateToJson(formData), null, 4); }
    catch { return "{}"; }
  }, [formData]);

  const catalogEntry = useMemo(() => {
    try { return JSON.stringify(generateCatalogEntry(formData, category, resolvedFileName), null, 4); }
    catch { return "{}"; }
  }, [formData, category, resolvedFileName]);

  // Actions
  const handleDownload = () => {
    const fn = resolvedFileName;
    const blob = new Blob([outputJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fn; a.click();
    URL.revokeObjectURL(url);
    setSnackMsg(`Downloaded ${fn}`);
  };

  const handleAddIntoFolder = async () => {
    if (!category) {
      setSnackMsg("Select a category first");
      return;
    }

    try {
      const res = await fetch("/api/admin/save-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": import.meta.env.VITE_ADMIN_API_KEY || "",
        },
        body: JSON.stringify({
          category,
          fileName: resolvedFileName,
          examData: outputJson,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSnackMsg(`Saved to MongoDB: ${data.docId}`);
      } else {
        setSnackMsg(data.error || "Failed to save");
      }
    } catch (error) {
      console.error("Failed to save JSON:", error);
      setSnackMsg("Failed to save exam data");
    }
  };

  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnackMsg(`${label} copied to clipboard!`);
    } catch { setSnackMsg("Copy failed"); }
  };

  const handleDeleteExam = async () => {
    if (!category || !selectedExam || selectedExam === "__new__") {
      setSnackMsg("Select an exam to delete");
      return;
    }

    const exam = existingExams.find((e) => e.exam_code === selectedExam);
    if (!exam) {
      setSnackMsg("Exam not found");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${exam.exam_name}" from ${category}?\n\nThis will permanently remove:\n• The exam data from MongoDB\n• The catalog entry\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/admin/delete-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": import.meta.env.VITE_ADMIN_API_KEY || "",
        },
        body: JSON.stringify({
          category,
          examCode: exam.exam_code,
          linkedJsonFile: exam.linked_json_file || "",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSnackMsg(`Deleted "${exam.exam_name}" successfully`);
        setSelectedExam("__new__");
        // Refresh the exam list
        setExistingExams((prev) => prev.filter((e) => e.exam_code !== exam.exam_code));
      } else {
        setSnackMsg(data.error || "Failed to delete");
      }
    } catch (error) {
      console.error("Failed to delete exam:", error);
      setSnackMsg("Failed to delete exam");
    }
  };

  // Update single form field
  const setField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleDivisionNamesChange = useCallback((value) => {
    const divisionNames = parseDivisionNames(value);

    setFormData((prev) => ({
      ...prev,
      posts_classes_courses_departments_academies: value,
      has_divisions: divisionNames.length > 0,
      divisions: divisionNames.length > 0
        ? syncDivisionsFromNames(divisionNames, prev.divisions)
        : [blankDivision()],
    }));
  }, []);

  // Division management
  const addDivision = () => {
    setFormData((prev) => ({ ...prev, divisions: [...prev.divisions, blankDivision()] }));
  };

  const updateDivision = (idx, data) => {
    setFormData((prev) => {
      const divs = [...prev.divisions];
      divs[idx] = data;
      return { ...prev, divisions: divs };
    });
  };

  const removeDivision = (idx) => {
    setFormData((prev) => ({
      ...prev,
      divisions: prev.divisions.filter((_, i) => i !== idx),
    }));
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="h-screen overflow-hidden pt-16 pb-2 px-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3 max-w-400 mx-auto w-full shrink-0">
          <FileJson size={28} className="text-[#E4572E]" />
          <div>
            <h1 className="text-xl font-bold text-[#FBF6EE]">Exam Data Loader
              {totalExamCount > 0 && (
                <span className="ml-2 bg-[#E4572E] text-white text-xs px-2 py-0.5 rounded-full font-normal align-middle">
                  {totalExamCount} exams in DB
                </span>
              )}
            </h1>
            <p className="text-xs text-[rgba(232,216,195,0.6)]">Create, edit or delete exam JSON files for eligibility checker</p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-4 max-w-400 mx-auto w-full flex-1 min-h-0">

        {/* ========== LEFT COLUMN: Form ========== */}
        <div className="flex-1 min-w-0 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#E4572E rgba(43,30,23,0.5)" }}>
        <Section title="1. Select Category & Exam" defaultOpen={true}>
          <Row>
            <TextField select label="Exam Category (Folder)" size="small" fullWidth value={category} onChange={(e) => { setCategory(e.target.value); setSelectedExam("__new__"); setFileName(""); setIsFileNameManual(false); }}>
              <MenuItem value=""><em>— Select Category —</em></MenuItem>
              {CATEGORY_OPTIONS.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Exam" size="small" fullWidth value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} disabled={!category}>
              <MenuItem value="__new__">
                <em>+ Create New Exam</em>
              </MenuItem>
              {existingExams.map((ex) => (
                <MenuItem key={ex.exam_code} value={ex.exam_code}>
                  {ex.exam_name} {ex.linked_json_file ? "" : "(no JSON)"}
                </MenuItem>
              ))}
            </TextField>
          </Row>
          <TextField label="Output File Name" size="small" fullWidth value={fileName}
            onChange={(e) => { setFileName(e.target.value); setIsFileNameManual(Boolean(e.target.value.trim())); }}
            placeholder={resolvedFileName}
            helperText={`Will save as: examsdata/${category || "CATEGORY"}/${resolvedFileName}`} />
        </Section>

        {loading && (
          <div className="text-center py-8">
            <Typography sx={{ color: "rgba(232,216,195,0.7)" }}>Loading exam data...</Typography>
          </div>
        )}

        {!loading && (
          <>
            {/* ========== SECTION 1: Basic Info ========== */}
            <Section title="2. Basic Exam Info" defaultOpen={true}>
              <Row>
                <TextField label="Exam Code" size="small" fullWidth value={formData.exam_code} onChange={(e) => setField("exam_code", e.target.value)} />
                <TextField label="Exam Name" size="small" fullWidth value={formData.exam_name} onChange={(e) => setField("exam_name", e.target.value)} />
              </Row>

              <Row>
                <SelectField label="Exam Level" value={formData.exam_level} onChange={(v) => setField("exam_level", v)} options={examLevelOptions} freeSolo />
                <SelectField label="Exam Target" value={formData.exam_target} onChange={(v) => setField("exam_target", v)} options={examTargetOptions} freeSolo />
              </Row>
              <Row>
                <SelectField label="Exam Sector" value={formData.exam_sector} onChange={(v) => setField("exam_sector", v)} options={examSectorOptions} freeSolo />
                <SelectField label="Exam Frequency/Year" value={formData.exam_frequency_year} onChange={(v) => setField("exam_frequency_year", v)} options={examFrequencyOptions} freeSolo />
              </Row>
              <TextField label="Conducting Body" size="small" fullWidth value={formData.conducting_body} onChange={(e) => setField("conducting_body", e.target.value)} />
              <TextField label="Posts / Classes / Courses / Departments / Academies" size="small" fullWidth multiline rows={2}
                value={formData.posts_classes_courses_departments_academies}
                onChange={(e) => handleDivisionNamesChange(e.target.value)}
                helperText="Comma-separated list of all post/division names" />

              <FormControlLabel
                control={
                  <Switch checked={formData.has_divisions}
                    onChange={(e) => setField("has_divisions", e.target.checked)}
                    sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#E4572E" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#E4572E" } }} />
                }
                label={<Typography variant="body2" sx={{ color: "#FBF6EE" }}>Has Divisions / Academies (multiple posts)</Typography>}
              />
            </Section>

            {/* ========== DIVISIONS / TOP-LEVEL ========== */}
            {formData.has_divisions ? (
              <Section title="3. Divisions / Academies" defaultOpen={true} badge={formData.divisions.length}>
                {formData.divisions.map((div, idx) => (
                  <div key={idx} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-[rgba(232,216,195,0.5)]">Division {idx + 1}</span>
                      <span className="text-xs text-[#E4572E] font-mono">{div._divisionKey || "(unnamed)"}</span>
                    </div>
                    <DivisionForm
                      index={idx}
                      data={div}
                      hasDivisions={true}
                      onChange={(d) => updateDivision(idx, d)}
                      onRemove={formData.divisions.length > 1 ? () => removeDivision(idx) : null}
                    />
                  </div>
                ))}
                <Button variant="outlined" startIcon={<Plus size={16} />}
                  onClick={addDivision}
                  sx={{ borderColor: "rgba(228,87,46,0.4)", color: "#E4572E", textTransform: "none" }}>
                  Add Division / Post
                </Button>
              </Section>
            ) : (
              <Section title="3. Exam Details (Non-Division)" defaultOpen={true}>
                <DivisionForm
                  index={0}
                  data={formData.divisions[0] || blankDivision()}
                  hasDivisions={false}
                  onChange={(d) => updateDivision(0, d)}
                  onRemove={null}
                />
              </Section>
            )}

            {/* ========== SECTION 8: Official Info ========== */}
            <Section title="4. Official Info & Links">
              <Row>
                <TextField label="Official Website" size="small" fullWidth value={formData.official_website} onChange={(e) => setField("official_website", e.target.value)} />
                <TextField label="Notification Link" size="small" fullWidth value={formData.notification_link} onChange={(e) => setField("notification_link", e.target.value)} />
              </Row>
              <TextField label="Application Form Link" size="small" fullWidth value={formData.application_form_link} onChange={(e) => setField("application_form_link", e.target.value)} />

              <Typography variant="caption" sx={{ color: "rgba(232,216,195,0.7)", display: "block" }}>Application Fee</Typography>
              <div className="grid grid-cols-4 gap-2">
                {["GEN", "OBC", "EWS", "SC", "ST", "FEMALE", "PWD", "EX_SERVICEMEN"].map((k) => (
                  <TextField key={k} label={k} size="small"
                    value={formData.application_fee?.[k] || ""}
                    onChange={(e) => setField("application_fee", { ...formData.application_fee, [k]: e.target.value })} />
                ))}
              </div>

              <Row>
                <TextField label="Payment Mode" size="small" fullWidth value={formData.payment_mode} onChange={(e) => setField("payment_mode", e.target.value)} />
                <MultiSelect label="Selection Process" value={formData.selection_process || []} onChange={(v) => setField("selection_process", v)} options={["PRELIMINARY EXAM", "MAINS EXAM", "INTERVIEW", "DOCUMENT VERIFICATION", "MEDICAL EXAMINATION", "PHYSICAL TEST", "SKILL TEST"]} />
              </Row>
              <Row>
                <TextField label="Training Duration" size="small" fullWidth value={formData.training_duration} onChange={(e) => setField("training_duration", e.target.value)} />
                <TextField label="Service Bond" size="small" fullWidth value={formData.service_bond} onChange={(e) => setField("service_bond", e.target.value)} />
              </Row>
              <Row>
                <TextField label="Probation Period" size="small" fullWidth value={formData.probation_period} onChange={(e) => setField("probation_period", e.target.value)} />
                <TextField label="Pay Scale" size="small" fullWidth value={formData.pay_scale} onChange={(e) => setField("pay_scale", e.target.value)} />
              </Row>
              <TextField label="Posting Locations" size="small" fullWidth value={formData.posting_locations} onChange={(e) => setField("posting_locations", e.target.value)} />

              <Typography variant="caption" sx={{ color: "rgba(232,216,195,0.7)", display: "block" }}>Important Dates</Typography>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {["notification_date", "application_start_date", "application_end_date", "exam_date", "admit_card_date", "result_date"].map((dk) => (
                  <TextField key={dk} label={dk.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} size="small"
                    value={formData.important_dates?.[dk] || ""}
                    onChange={(e) => setField("important_dates", { ...formData.important_dates, [dk]: e.target.value })} />
                ))}
              </div>

              <Row>
                <TextField label="Helpline Email" size="small" fullWidth value={formData.helpline?.email || ""} onChange={(e) => setField("helpline", { ...formData.helpline, email: e.target.value })} />
                <TextField label="Helpline Phone" size="small" fullWidth value={formData.helpline?.phone || ""} onChange={(e) => setField("helpline", { ...formData.helpline, phone: e.target.value })} />
              </Row>
              <TextField label="Remarks" size="small" fullWidth multiline rows={2} value={formData.remarks} onChange={(e) => setField("remarks", e.target.value)} />
            </Section>
          </>
        )}
        </div>{/* end left column */}

          {/* ========== RIGHT COLUMN: Live JSON Output ========== */}
          <div className="w-120 shrink-0 flex flex-col min-h-0">
            <div className="rounded-xl border border-[rgba(228,87,46,0.3)] bg-[rgba(43,30,23,0.45)] flex flex-col min-h-0 h-full">
              {/* Panel Header */}
              <div className="px-4 py-3 bg-[rgba(228,87,46,0.12)] border-b border-[rgba(228,87,46,0.2)] flex items-center gap-2">
                <FileJson size={16} className="text-[#E4572E]" />
                <span className="text-[#FBF6EE] font-semibold text-sm">Live JSON Output</span>
                <span className="ml-1 bg-[#E4572E] text-white text-xs px-2 py-0.5 rounded-full">JSON</span>
              </div>

              {/* Action Buttons */}
              <div className="px-4 py-2 flex flex-wrap gap-2 border-b border-[rgba(228,87,46,0.15)]">
                <Button size="small" variant="outlined" startIcon={<Download size={14} />} onClick={handleDownload}
                  sx={{ borderColor: "#E4572E", color: "#E4572E", textTransform: "none", fontSize: "0.75rem", py: 0.5 }}>
                  Download
                </Button>
                <Button size="small" variant="outlined" startIcon={<FolderPlus size={14} />} onClick={handleAddIntoFolder}
                  sx={{ borderColor: "#E4572E", color: "#E4572E", textTransform: "none", fontSize: "0.75rem", py: 0.5 }}>
                  Save to DB
                </Button>
                {selectedExam && selectedExam !== "__new__" && (
                  <Button size="small" variant="outlined" startIcon={<Trash2 size={14} />} onClick={handleDeleteExam}
                    sx={{ borderColor: "#ef4444", color: "#ef4444", textTransform: "none", fontSize: "0.75rem", py: 0.5, "&:hover": { borderColor: "#dc2626", bgcolor: "rgba(239,68,68,0.1)" } }}>
                    Delete Exam
                  </Button>
                )}
                <Button size="small" variant="outlined" startIcon={<Copy size={14} />} onClick={() => handleCopy(outputJson, "Exam JSON")}
                  sx={{ borderColor: "#E4572E", color: "#E4572E", textTransform: "none", fontSize: "0.75rem", py: 0.5 }}>
                  Copy JSON
                </Button>
                <Button size="small" variant="outlined" startIcon={<Copy size={14} />} onClick={() => handleCopy(catalogEntry, "Catalog entry")}
                  sx={{ borderColor: "rgba(228,87,46,0.5)", color: "rgba(232,216,195,0.7)", textTransform: "none", fontSize: "0.7rem", py: 0.5 }}>
                  Copy allexamnames
                </Button>
              </div>

              {/* Save path hint */}
              <div className="px-4 py-1.5 border-b border-[rgba(228,87,46,0.1)]">
                <Typography variant="caption" sx={{ color: "rgba(232,216,195,0.5)", fontSize: "0.7rem" }}>
                  Save as: examsdata/{category || "CATEGORY"}/{resolvedFileName}
                </Typography>
              </div>

              {/* JSON Preview (always visible, scrollable) */}
              <div className="flex-1 overflow-auto px-3 py-2" style={{ scrollbarWidth: "thin", scrollbarColor: "#E4572E rgba(43,30,23,0.5)" }}>
                <pre className="text-xs text-[#E8D8C3] whitespace-pre-wrap wrap-break-word font-mono leading-relaxed m-0">{outputJson}</pre>
              </div>

              {/* Catalog Entry (collapsible) */}
              <div className="border-t border-[rgba(228,87,46,0.2)]">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-[rgba(228,87,46,0.1)] transition-colors"
                >
                  {showPreview ? <ChevronDown size={14} className="text-[#E4572E]" /> : <ChevronRight size={14} className="text-[#E4572E]" />}
                  <span className="text-xs text-[rgba(232,216,195,0.6)]">allexamnames.json entry</span>
                </button>
                {showPreview && (
                  <pre className="px-3 pb-3 text-xs text-[#E8D8C3] overflow-auto m-0" style={{ maxHeight: "150px", scrollbarWidth: "thin", scrollbarColor: "#E4572E rgba(43,30,23,0.5)" }}>{catalogEntry}</pre>
                )}
              </div>
            </div>
          </div>{/* end right column */}
        </div>{/* end two-column layout */}

        <Snackbar open={!!snackMsg} autoHideDuration={3000} onClose={() => setSnackMsg("")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert severity="success" onClose={() => setSnackMsg("")} sx={{ bgcolor: "rgba(228,87,46,0.9)", color: "#FBF6EE" }}>
            {snackMsg}
          </Alert>
        </Snackbar>
      </div>
    </ThemeProvider>
  );
}

// ============================================
// JSON → FORM STATE (for loading existing exams)
// ============================================

function jsonToFormState(json) {
  const state = blankExamData();

  // Basic info
  state.exam_code = json.exam_code || "";
  state.exam_name = json.exam_name || "";
  state.full_form = json.full_form || ""; // preserved for JSON output
  state.exam_level = json.exam_level || "";
  state.exam_sector = json.exam_sector || "";
  state.exam_target = json.exam_target || "";
  state.exam_frequency_year = json.exam_frequency_year || "";
  state.conducting_body = json.conducting_body || "";
  state.posts_classes_courses_departments_academies = json.posts_classes_courses_departments_academies || "";

  // Check for divisions
  const divisionFields = ["academies", "posts", "departments", "courses", "classes"];
  let divisionsData = null;
  for (const f of divisionFields) {
    if (json[f] && typeof json[f] === "object" && !Array.isArray(json[f])) {
      divisionsData = json[f];
      break;
    }
  }

  if (divisionsData && Object.keys(divisionsData).length > 0) {
    state.has_divisions = true;
    state.divisions = Object.entries(divisionsData).map(([key, divJson]) => {
      return jsonDivisionToFormDivision(key, divJson);
    });
  } else {
    state.has_divisions = false;
    state.divisions = [jsonDivisionToFormDivision("", json)];
  }

  // Official info
  state.official_website = json.official_website || "";
  state.notification_link = json.notification_link || "";
  state.application_form_link = json.application_form_link || "";
  state.application_fee = json.application_fee || state.application_fee;
  state.payment_mode = json.payment_mode || "";
  state.selection_process = json.selection_process || [];
  state.training_duration = json.training_duration || "";
  state.service_bond = json.service_bond || "";
  state.probation_period = json.probation_period || "";
  state.pay_scale = json.pay_scale || "";
  state.posting_locations = json.posting_locations || "";
  state.important_dates = json.important_dates || state.important_dates;
  state.helpline = json.helpline || state.helpline;
  state.remarks = json.remarks || "";

  return state;
}

function jsonDivisionToFormDivision(key, d) {
  const div = blankDivision();
  if (!d || typeof d !== "object") return div;

  div._divisionKey = key;
  div.post_name = d.post_name || "";
  div.post_code = d.post_code || "";
  div.group = d.group || "";
  div.ministry_department = d.ministry_department || "";

  // Exam pattern
  div.exam_tiers = d.exam_tiers || "";
  div.exam_subjects = d.exam_subjects || "";
  div.exam_pattern = d.exam_pattern || "";
  div.exam_sections = d.exam_sections || "";
  div.mode_of_exam = d.mode_of_exam || "";
  div.exam_duration = d.exam_duration || "";
  div.total_marks = d.total_marks || "";
  div.number_of_questions = d.number_of_questions || "";
  div.marking_scheme = d.marking_scheme || "";
  div.paper_medium = d.paper_medium || "";
  div.exam_date = d.exam_date || "";
  div.maximum_attempts_allowed = d.maximum_attempts_allowed || "";

  // Age
  div.age_criteria_type = d.age_criteria_type || "";
  div.starting_age = d.starting_age || "";
  div.ending_age = d.ending_age || "";
  div.between_age = d.between_age || "";
  div.no_age_limit = d.no_age_limit || "";

  // Handle minimum_dob
  if (d.minimum_dob && typeof d.minimum_dob === "object") {
    div.minimum_dob = d.minimum_dob;
  }
  // Handle maximum_dob
  if (d.maximum_dob && typeof d.maximum_dob === "object") {
    div.maximum_dob = d.maximum_dob;
  }

  // Handle between_dob — detect if category-wise
  if (d.between_dob && typeof d.between_dob === "object") {
    const keys = Object.keys(d.between_dob);
    const isCategoryBased = keys.some((k) => ["GEN", "OBC", "EWS", "SC", "ST"].includes(k));
    if (isCategoryBased) {
      div.between_dob_mode = "category";
      div.between_dob_category = { ...div.between_dob_category };
      for (const cat of CASTE_KEYS) {
        if (d.between_dob[cat]) {
          div.between_dob_category[cat] = d.between_dob[cat];
        }
      }
    } else {
      div.between_dob_mode = "simple";
      div.between_dob = d.between_dob;
    }
  }

  // Personal
  div.gender = d.gender || "";
  div.special_gender_eligibility = d.special_gender_eligibility || "";
  div.marital_status = d.marital_status || div.marital_status;
  div.nationality = d.nationality || [];
  div.domicile = d.domicile || "";
  div.caste_category = d.caste_category || "";
  if (d.pwd_status && typeof d.pwd_status === "object") {
    div.pwd_status = {
      applicability: d.pwd_status.applicability || "",
      marks_percentage_basis: d.pwd_status.marks_percentage_basis || div.pwd_status.marks_percentage_basis,
      age_relaxation_basis: d.pwd_status.age_relaxation_basis || div.pwd_status.age_relaxation_basis,
    };
  }
  if (d.age_relaxation && typeof d.age_relaxation === "object") {
    div.age_relaxation = { ...div.age_relaxation, ...d.age_relaxation };
  }

  // Education
  div.highest_education_qualification = d.highest_education_qualification || "";
  if (d.education_levels && typeof d.education_levels === "object") {
    div.education_levels = { ...div.education_levels };
    for (const [lk, lv] of Object.entries(d.education_levels)) {
      if (lv && typeof lv === "object" && Object.keys(lv).length > 0) {
        div.education_levels[lk] = lv;
      } else {
        div.education_levels[lk] = lv;
      }
    }
  }

  // Additional
  div.gap_years_allowed = d.gap_years_allowed || "";
  div.educational_stream_restriction = d.educational_stream_restriction || "";
  div.ncc_wing = d.ncc_wing || "";
  div.ncc_certificate = d.ncc_certificate || "";
  div.ncc_certificate_grade = d.ncc_certificate_grade || "";
  div.ex_servicemen_status = d.ex_servicemen_status || "";
  div.sports_quota_eligibility = d.sports_quota_eligibility || "";
  div.cpl_holder = d.cpl_holder || "";
  div.height_cm = d.height_cm || "";
  div.weight_kg = d.weight_kg || "";
  div.vision_eyesight = d.vision_eyesight || "";
  div.language_proficiency = d.language_proficiency || "";
  div.driving_license_type = d.driving_license_type || "";
  div.current_employment_status = d.current_employment_status || "";
  div.work_experience_required = d.work_experience_required || "";
  div.work_experience_years = d.work_experience_years || "";

  return div;
}
