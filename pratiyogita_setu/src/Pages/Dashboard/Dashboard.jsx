import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import {
  MessageCircle,
  Brain,
  Target,
  Share2,
  TrendingUp,
  TrendingDown,
  Flame,
  Trophy,
  Clock,
  BookOpen,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  Download,
  Zap,
  Map,
  ClipboardCheck,
  LayoutDashboard,
  RefreshCw,
  FileText,
  Plus,
  Edit,
  ExternalLink,
  Pencil,
  Trash2,
  Share,
  CircleDot,
  Lightbulb,
} from "lucide-react";

// ─── Brand Tokens ─────────────────────────────────────────────
const C = {
  card: "rgba(43,30,23,0.55)",
  border: "rgba(228,87,46,0.30)",
  hoverRow: "rgba(228,87,46,0.06)",
  sectionBg: "rgba(228,87,46,0.12)",
  orange: "#E4572E",
  ivory: "#FBF6EE",
  sand: "#E8D8C3",
  sandMuted: "#E8D8C380",
  green: "#10B981",
  yellow: "#F59E0B",
  red: "#EF4444",
  purple: "#8B5CF6",
};

const cardStyle = { backgroundColor: C.card, borderColor: C.border, backdropFilter: "blur(12px)" };

// ─── Mock Data — Overview ─────────────────────────────────────
const OVERVIEW_STATS = { studySessions: 47, questionsPracticed: 312, examsTracked: 8, mindMapsCreated: 12 };

const OVERVIEW_ACTIVITY = [
  { platform: "gyan", text: "Asked 5 questions about Indian Polity", time: "2 hours ago", textHi: "भारतीय राजव्यवस्था पर 5 प्रश्न पूछे" },
  { platform: "yogya", text: "Checked eligibility for NDA 2026", time: "5 hours ago", textHi: "NDA 2026 के लिए पात्रता जांची" },
  { platform: "marg", text: "Edited mind map: SSC CGL Syllabus", time: "Yesterday", textHi: "माइंड मैप संपादित किया: SSC CGL पाठ्यक्रम" },
  { platform: "gyan", text: "Scored 80% on History MCQ quiz (16/20)", time: "Yesterday", textHi: "इतिहास MCQ क्विज़ में 80% अंक (16/20)" },
  { platform: "yogya", text: "Eligible for 5 out of 7 Defence exams", time: "2 days ago", textHi: "7 में से 5 रक्षा परीक्षाओं के लिए पात्र" },
  { platform: "marg", text: "Created new mind map: UPSC Prelims GS", time: "3 days ago", textHi: "नया माइंड मैप बनाया: UPSC प्रीलिम्स GS" },
  { platform: "gyan", text: "Completed Geography topic revision", time: "4 days ago", textHi: "भूगोल विषय पुनरीक्षण पूरा किया" },
  { platform: "yogya", text: "Re-checked eligibility for SSC CHSL", time: "5 days ago", textHi: "SSC CHSL के लिए पुनः पात्रता जांची" },
];

const OVERVIEW_STREAK = { current: 14, longest: 23, todayDone: 15, todayGoal: 20 };
const WEEK_ACTIVITY = [0.2, 0.8, 0.6, 1.0, 0.4, 0.9, 0.3];

const OVERVIEW_EXAMS = [
  { name: "NDA 2026", eligible: "yes", questions: 85, accuracy: 76, mindMaps: 3, score: 72 },
  { name: "SSC CGL 2026", eligible: "yes", questions: 120, accuracy: 82, mindMaps: 4, score: 80 },
  { name: "UPSC Prelims 2026", eligible: "not-checked", questions: 45, accuracy: 68, mindMaps: 2, score: 55 },
  { name: "SSC CHSL 2026", eligible: "yes", questions: 30, accuracy: 90, mindMaps: 1, score: 65 },
  { name: "CDS 2026", eligible: "no", questions: 20, accuracy: 55, mindMaps: 1, score: 35 },
  { name: "RRB NTPC 2026", eligible: "yes", questions: 12, accuracy: 72, mindMaps: 0, score: 40 },
];

const OVERVIEW_SUBJECTS = [
  { name: "History", nameHi: "इतिहास", accuracy: 82, color: C.orange },
  { name: "Geography", nameHi: "भूगोल", accuracy: 75, color: C.green },
  { name: "Polity", nameHi: "राजव्यवस्था", accuracy: 88, color: C.yellow },
  { name: "Economics", nameHi: "अर्थशास्त्र", accuracy: 52, color: C.red },
  { name: "Science", nameHi: "विज्ञान", accuracy: 65, color: C.purple },
  { name: "Mathematics", nameHi: "गणित", accuracy: 70, color: "#EC4899" },
];

const OVERVIEW_CATEGORIES = [
  { name: "Defence", nameHi: "रक्षा", engagement: 85 },
  { name: "SSC", nameHi: "SSC", engagement: 72 },
  { name: "Banking", nameHi: "बैंकिंग", engagement: 30 },
  { name: "Railway", nameHi: "रेलवे", engagement: 45 },
  { name: "State PSC", nameHi: "राज्य PSC", engagement: 60 },
  { name: "Teaching", nameHi: "शिक्षण", engagement: 20 },
];

const OVERVIEW_WEAK = [
  { name: "Economics", nameHi: "अर्थशास्त्र", accuracy: 52, attempted: 25, correct: 13 },
  { name: "Science", nameHi: "विज्ञान", accuracy: 65, attempted: 40, correct: 26 },
];

// ─── Mock Data — Gyan ─────────────────────────────────────────
const GYAN_STATS = { conversations: 47, questionsAsked: 156, mcqsAttempted: 312, mcqAccuracy: 72 };
const GYAN_QUIZ_SCORES = [65, 72, 60, 85, 90];
const GYAN_RECENT_QUIZZES = [
  { name: "Indian Constitution MCQ", nameHi: "भारतीय संविधान MCQ", time: "2 hours ago", score: "18/20" },
  { name: "Physical Geography Basics", nameHi: "भौतिक भूगोल मूल बातें", time: "Yesterday", score: "15/20" },
];
const GYAN_STREAK = { current: 14, best: 23 };
const GYAN_PERFORMANCE = { correct: 225, wrong: 87 };
const GYAN_SUBJECTS = [
  { name: "History", nameHi: "इतिहास", accuracy: 84, color: C.orange },
  { name: "Geography", nameHi: "भूगोल", accuracy: 78, color: C.green },
  { name: "Polity", nameHi: "राजव्यवस्था", accuracy: 91, color: C.yellow },
  { name: "Current Affairs", nameHi: "समसामयिकी", accuracy: 65, color: C.purple },
  { name: "Aptitude", nameHi: "अभिरुचि", accuracy: 82, color: "#EC4899" },
  { name: "Reasoning", nameHi: "तर्कशक्ति", accuracy: 74, color: "#06B6D4" },
];
const GYAN_WEAK = [
  { name: "Economics", nameHi: "अर्थशास्त्र", accuracy: 42, target: 60 },
  { name: "Science & Tech", nameHi: "विज्ञान और तकनीक", accuracy: 48, target: 65 },
];

// ─── Mock Data — Yogya ────────────────────────────────────────
const YOGYA_STATS = { totalChecks: 24, eligible: 18, notEligible: 6, mostChecked: "Defence" };
const YOGYA_HISTORY = [
  { name: "UPSC Civil Services 2024", date: "Oct 12, 2023", status: "eligible" },
  { name: "SSC CGL Tier I", date: "Oct 10, 2023", status: "eligible" },
  { name: "AFCAT 01/2024", date: "Oct 08, 2023", status: "not-eligible" },
  { name: "SBI PO Main Exam", date: "Sep 28, 2023", status: "eligible" },
];
const YOGYA_PROFILE = [
  { label: "Date of Birth & Age", labelHi: "जन्म तिथि और आयु", done: true },
  { label: "Educational Qualification", labelHi: "शैक्षणिक योग्यता", done: true },
  { label: "Physical Fitness Data", labelHi: "शारीरिक फिटनेस डेटा", done: false },
  { label: "Category / Reservation", labelHi: "श्रेणी / आरक्षण", done: true },
];
const YOGYA_CATEGORIES = [
  { name: "Defence", nameHi: "रक्षा", pct: 45, color: C.orange },
  { name: "SSC", nameHi: "SSC", pct: 25, color: C.yellow },
  { name: "Banking", nameHi: "बैंकिंग", pct: 15, color: C.green },
  { name: "Others", nameHi: "अन्य", pct: 15, color: C.purple },
];
const YOGYA_REPORTS = [
  { title: "Detailed Eligibility Report", titleHi: "विस्तृत पात्रता रिपोर्ट", date: "OCT 2023", size: "2.4 MB" },
  { title: "Defence Exams Roadmap", titleHi: "रक्षा परीक्षा रोडमैप", date: "SEP 2023", size: "1.8 MB" },
];

// ─── Mock Data — Marg ─────────────────────────────────────────
const MARG_STATS = { totalMaps: 12, nodesCreated: 450, exports: 8, lastEdited: "2h ago" };
const MARG_MINDMAPS = [
  { title: "Indian Constitution Hub", titleHi: "भारतीय संविधान हब", category: "UPSC", nodes: 124, edited: "2h ago" },
  { title: "Modern History Timeline", titleHi: "आधुनिक इतिहास समयरेखा", category: "SSC", nodes: 86, edited: "5h ago" },
];
const MARG_RECENT_EDITS = [
  { action: "Added 'Preamble' nodes", actionHi: "प्रस्तावना नोड्स जोड़े", map: "Indian Constitution Hub", time: "2h ago", icon: "edit" },
  { action: "Attached PDF Resource", actionHi: "PDF संसाधन संलग्न किया", map: "Modern History Timeline", time: "5h ago", icon: "file" },
  { action: "Removed duplicate links", actionHi: "डुप्लीकेट लिंक हटाए", map: "Geography - Mountains", time: "Yesterday", icon: "trash" },
  { action: "Exported as PNG", actionHi: "PNG के रूप में निर्यात किया", map: "SSC English Vocab", time: "2 days ago", icon: "download" },
  { action: "Shared with Study Group", actionHi: "स्टडी ग्रुप के साथ साझा किया", map: "Logical Reasoning", time: "3 days ago", icon: "share" },
];
const MARG_CATEGORY_ACTIVITY = [
  { name: "UPSC", value: 90 }, { name: "SSC", value: 65 }, { name: "Banking", value: 35 }, { name: "RLY", value: 20 }, { name: "Other", value: 15 },
];
const MARG_NODE_TYPES = [
  { name: "Section Nodes", nameHi: "सेक्शन नोड्स", count: 210, pct: 100 },
  { name: "Resource Links", nameHi: "रिसोर्स लिंक", count: 124, pct: 59 },
  { name: "Checklists", nameHi: "चेकलिस्ट", count: 82, pct: 39 },
  { name: "Images/Media", nameHi: "चित्र/मीडिया", count: 34, pct: 16 },
];

// ─── Shared Components ────────────────────────────────────────
const PLATFORM_COLORS = { gyan: C.orange, yogya: C.green, marg: C.yellow };
const PLATFORM_LABELS = { gyan: "Gyan", yogya: "Yogya", marg: "Marg" };
const DAYS_EN = ["M", "T", "W", "T", "F", "S", "S"];
const DAYS_HI = ["सो", "मं", "बु", "गु", "शु", "श", "र"];

const accuracyColor = (v) => (v >= 80 ? C.green : v >= 60 ? C.yellow : C.red);

const SectionHeader = ({ title, icon: Icon, isExpanded, onToggle, badge, right }) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-b"
    style={{ backgroundColor: C.sectionBg, borderColor: C.border }}
  >
    <div className="flex items-center gap-2.5">
      <Icon className="w-5 h-5" style={{ color: C.orange }} />
      <h3 className="text-sm sm:text-base font-semibold" style={{ color: C.ivory }}>{title}</h3>
      {badge && (
        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full" style={{ backgroundColor: "rgba(228,87,46,0.25)", color: C.orange }}>
          {badge}
        </span>
      )}
    </div>
    <div className="flex items-center gap-2">
      {right}
      <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} style={{ color: C.sand }} />
    </div>
  </button>
);

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, large }) => (
  <div className="rounded-xl border p-4 hover:shadow-lg transition-shadow" style={cardStyle}>
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: C.sand }}>{title}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className={`${large ? "text-3xl" : "text-2xl"} font-bold`} style={{ color: C.ivory }}>{value}</p>
          {trend !== undefined && (
            <span className={`text-xs font-semibold flex items-center ${trend > 0 ? "text-green-400" : "text-red-400"}`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
              {typeof trend === "string" ? trend : `${Math.abs(trend)}%`}
            </span>
          )}
        </div>
        {subtitle && <p className="text-[11px] mt-0.5" style={{ color: C.sandMuted }}>{subtitle}</p>}
      </div>
      <div className="shrink-0 p-2.5 rounded-full" style={{ backgroundColor: `${color}25` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
  </div>
);

const CircularProgress = ({ percent, size = 80, strokeWidth = 3, color = C.orange }) => {
  const r = (size / 2) - strokeWidth - 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(228,87,46,0.15)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color: C.ivory }}>{percent}%</span>
      </div>
    </div>
  );
};

// ─── Tab Definitions ──────────────────────────────────────────
const TABS = [
  { key: "overview", label: "Overview", labelHi: "अवलोकन", icon: LayoutDashboard },
  { key: "yogya", label: "Yogya (Eligibility)", labelHi: "योग्य (पात्रता)", icon: ClipboardCheck },
  { key: "marg", label: "Marg (Mind Maps)", labelHi: "मार्ग (माइंड मैप)", icon: Map },
  { key: "gyan", label: "Gyan (Chatbot)", labelHi: "ज्ञान (चैटबॉट)", icon: Brain },
];

// ═══════════════════════════════════════════════════════════════
//  OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════
const OverviewTab = ({ en }) => {
  const [expanded, setExpanded] = useState({ activity: true, exams: true, subjects: true, categories: false, weakAreas: false });
  const toggle = (k) => setExpanded((p) => ({ ...p, [k]: !p[k] }));

  const streakPct = Math.min((OVERVIEW_STREAK.current / 30) * 100, 100);
  const goalPct = Math.round((OVERVIEW_STREAK.todayDone / OVERVIEW_STREAK.todayGoal) * 100);

  const eligBadge = (s) => {
    if (s === "yes") return { label: en ? "Eligible" : "पात्र", bg: `${C.green}33`, color: C.green };
    if (s === "no") return { label: en ? "Not Eligible" : "अपात्र", bg: `${C.red}33`, color: C.red };
    return { label: en ? "Not Checked" : "जाँच नहीं", bg: `${C.sand}22`, color: C.sand };
  };

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title={en ? "Study Sessions" : "अध्ययन सत्र"} value={OVERVIEW_STATS.studySessions} subtitle={en ? "Across all platforms" : "सभी प्लेटफॉर्म पर"} icon={MessageCircle} color={C.orange} trend={5} />
        <StatCard title={en ? "Questions Practiced" : "प्रश्न अभ्यास"} value={OVERVIEW_STATS.questionsPracticed} subtitle={en ? "MCQs + chatbot" : "MCQ + चैटबॉट"} icon={Brain} color={C.green} trend={12} />
        <StatCard title={en ? "Exams Tracked" : "परीक्षा ट्रैक"} value={OVERVIEW_STATS.examsTracked} subtitle={en ? "Eligibility checked" : "पात्रता जाँची"} icon={Target} color={C.yellow} trend={3} />
        <StatCard title={en ? "Mind Maps" : "माइंड मैप"} value={OVERVIEW_STATS.mindMapsCreated} subtitle={en ? "Visual study aids" : "दृश्य अध्ययन सहायक"} icon={Share2} color={C.purple} trend={8} />
      </div>

      {/* Activity + Streak */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Activity Feed */}
        <div className="lg:col-span-3 rounded-xl border overflow-hidden" style={cardStyle}>
          <SectionHeader title={en ? "Recent Activity" : "हाल की गतिविधि"} icon={Clock} isExpanded={expanded.activity} onToggle={() => toggle("activity")} badge={`${OVERVIEW_ACTIVITY.length}`} />
          {expanded.activity && (
            <div className="max-h-96 overflow-y-auto">
              {OVERVIEW_ACTIVITY.map((item, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 transition-colors" style={{ borderBottom: `1px solid rgba(228,87,46,0.1)` }}>
                  <div className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PLATFORM_COLORS[item.platform] }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: `${PLATFORM_COLORS[item.platform]}20`, color: PLATFORM_COLORS[item.platform] }}>
                        {PLATFORM_LABELS[item.platform]}
                      </span>
                      <span className="text-xs" style={{ color: C.sandMuted }}>{item.time}</span>
                    </div>
                    <p className="text-sm mt-0.5 truncate" style={{ color: `${C.ivory}cc` }}>{en ? item.text : item.textHi}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Streak + Goal */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border p-4 space-y-3" style={cardStyle}>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5" style={{ color: C.orange }} />
              <h3 className="text-sm font-semibold" style={{ color: C.ivory }}>{en ? "Study Streak" : "अध्ययन स्ट्रीक"}</h3>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-extrabold" style={{ color: C.orange }}>{OVERVIEW_STREAK.current}</div>
                <p className="text-[10px]" style={{ color: C.sand }}>{en ? "Current" : "वर्तमान"}</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold" style={{ color: C.yellow }}>{OVERVIEW_STREAK.longest}</div>
                <p className="text-[10px]" style={{ color: C.sand }}>{en ? "Longest" : "सबसे लंबी"}</p>
              </div>
            </div>
            <div>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: "rgba(228,87,46,0.15)" }}>
                <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${streakPct}%`, background: `linear-gradient(to right, ${C.orange}, ${C.yellow})` }} />
              </div>
              <p className="text-[10px] mt-1" style={{ color: C.sandMuted }}>
                {30 - OVERVIEW_STREAK.current > 0 ? (en ? `${30 - OVERVIEW_STREAK.current} days to 30-day streak!` : `30-दिन स्ट्रीक तक ${30 - OVERVIEW_STREAK.current} दिन!`) : (en ? "30-day streak achieved! 🎉" : "30 दिन की स्ट्रीक हासिल! 🎉")}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium mb-1.5" style={{ color: C.sand }}>{en ? "This Week" : "इस सप्ताह"}</p>
              <div className="flex gap-1.5">
                {WEEK_ACTIVITY.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full aspect-square rounded-md" style={{ backgroundColor: v === 0 ? "rgba(228,87,46,0.08)" : `rgba(228,87,46,${0.15 + v * 0.65})` }} />
                    <span className="text-[9px]" style={{ color: C.sandMuted }}>{en ? DAYS_EN[i] : DAYS_HI[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-xl border p-4" style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5" style={{ color: C.orange }} />
              <h3 className="text-sm font-semibold" style={{ color: C.ivory }}>{en ? "Daily Goal" : "दैनिक लक्ष्य"}</h3>
            </div>
            <div className="flex items-center gap-4">
              <CircularProgress percent={goalPct} />
              <div>
                <p className="text-sm font-medium" style={{ color: C.ivory }}>{OVERVIEW_STREAK.todayDone}/{OVERVIEW_STREAK.todayGoal} {en ? "questions" : "प्रश्न"}</p>
                <p className="text-xs mt-0.5" style={{ color: C.sandMuted }}>{en ? `${OVERVIEW_STREAK.todayGoal - OVERVIEW_STREAK.todayDone} more to hit today's goal!` : `आज के लक्ष्य तक ${OVERVIEW_STREAK.todayGoal - OVERVIEW_STREAK.todayDone} और!`}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exam Journey */}
      <div className="rounded-xl border overflow-hidden" style={cardStyle}>
        <SectionHeader title={en ? "Your Exam Journey" : "आपकी परीक्षा यात्रा"} icon={Trophy} isExpanded={expanded.exams} onToggle={() => toggle("exams")} badge={`${OVERVIEW_EXAMS.length} ${en ? "exams" : "परीक्षाएं"}`} />
        {expanded.exams && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs" style={{ borderBottom: `1px solid ${C.border}`, color: C.sand }}>
                  <th className="px-4 py-2.5 font-medium">{en ? "Exam" : "परीक्षा"}</th>
                  <th className="px-4 py-2.5 font-medium">{en ? "Eligibility" : "पात्रता"}</th>
                  <th className="px-4 py-2.5 font-medium text-center">{en ? "Questions" : "प्रश्न"}</th>
                  <th className="px-4 py-2.5 font-medium text-center">{en ? "Accuracy" : "सटीकता"}</th>
                  <th className="px-4 py-2.5 font-medium text-center">{en ? "Mind Maps" : "माइंड मैप"}</th>
                  <th className="px-4 py-2.5 font-medium text-center">{en ? "Prep Score" : "तैयारी स्कोर"}</th>
                </tr>
              </thead>
              <tbody>
                {OVERVIEW_EXAMS.map((exam, i) => {
                  const b = eligBadge(exam.eligible);
                  return (
                    <tr key={i} className="transition-colors" style={{ borderBottom: "1px solid rgba(228,87,46,0.08)" }}>
                      <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: C.ivory }}>{exam.name}</td>
                      <td className="px-4 py-3"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: b.bg, color: b.color }}>{b.label}</span></td>
                      <td className="px-4 py-3 text-center" style={{ color: C.sand }}>{exam.questions}</td>
                      <td className="px-4 py-3 text-center"><span className="font-semibold" style={{ color: accuracyColor(exam.accuracy) }}>{exam.accuracy}%</span></td>
                      <td className="px-4 py-3 text-center" style={{ color: C.sand }}>{exam.mindMaps}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2" style={{ borderColor: accuracyColor(exam.score) }}>
                          <span className="text-xs font-bold" style={{ color: accuracyColor(exam.score) }}>{exam.score}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subjects + Categories + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border overflow-hidden" style={cardStyle}>
          <SectionHeader title={en ? "Subject Performance" : "विषय प्रदर्शन"} icon={BarChart3} isExpanded={expanded.subjects} onToggle={() => toggle("subjects")} />
          {expanded.subjects && (
            <div className="p-4 space-y-3">
              {OVERVIEW_SUBJECTS.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium" style={{ color: C.sand }}>{en ? s.name : s.nameHi}</span>
                    <span className="text-xs font-semibold" style={{ color: accuracyColor(s.accuracy) }}>{s.accuracy}%</span>
                  </div>
                  <div className="w-full rounded-full h-2" style={{ backgroundColor: "rgba(228,87,46,0.12)" }}>
                    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${s.accuracy}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border overflow-hidden" style={cardStyle}>
          <SectionHeader title={en ? "Category Engagement" : "श्रेणी सहभागिता"} icon={BarChart3} isExpanded={expanded.categories} onToggle={() => toggle("categories")} />
          {expanded.categories && (
            <div className="p-4 grid grid-cols-2 gap-2">
              {OVERVIEW_CATEGORIES.map((c, i) => (
                <div key={i} className="rounded-lg p-3 text-center" style={{ backgroundColor: `rgba(228,87,46,${0.06 + (c.engagement / 100) * 0.25})` }}>
                  <p className="text-xs font-semibold" style={{ color: C.ivory }}>{en ? c.name : c.nameHi}</p>
                  <p className="text-lg font-bold" style={{ color: C.orange }}>{c.engagement}</p>
                  <p className="text-[9px]" style={{ color: C.sandMuted }}>{en ? "interactions" : "इंटरैक्शन"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border p-4" style={cardStyle}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5" style={{ color: C.orange }} />
            <h3 className="text-sm font-semibold" style={{ color: C.ivory }}>{en ? "Quick Actions" : "त्वरित कार्य"}</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: Brain, label: en ? "Ask Gyan" : "ज्ञान पूछें", color: C.orange },
              { icon: ClipboardCheck, label: en ? "Check Eligibility" : "पात्रता जांचें", color: C.green },
              { icon: Map, label: en ? "Create Mind Map" : "माइंड मैप बनाएं", color: C.yellow },
              { icon: BookOpen, label: en ? "Take a Quiz" : "क्विज़ दें", color: C.purple },
              { icon: Download, label: en ? "Export Report" : "रिपोर्ट निर्यात", color: C.sand },
              { icon: Target, label: en ? "Set Daily Goal" : "दैनिक लक्ष्य", color: C.orange },
            ].map((a, i) => (
              <button key={i} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-all cursor-pointer hover:-translate-y-0.5 hover:bg-[rgba(228,87,46,0.15)]" style={{ borderColor: C.border, backgroundColor: "rgba(228,87,46,0.05)" }}>
                <a.icon className="w-5 h-5" style={{ color: a.color }} />
                <span className="text-[11px] font-medium text-center leading-tight" style={{ color: C.sand }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Weak Areas */}
      {OVERVIEW_WEAK.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={cardStyle}>
          <SectionHeader title={en ? "Areas Needing Improvement" : "सुधार की आवश्यकता"} icon={AlertCircle} isExpanded={expanded.weakAreas} onToggle={() => toggle("weakAreas")} badge={`${OVERVIEW_WEAK.length}`} />
          {expanded.weakAreas && (
            <div className="p-4 space-y-3">
              {OVERVIEW_WEAK.map((s, i) => (
                <div key={i} className="rounded-lg p-3 border" style={{ backgroundColor: `${C.red}14`, borderColor: `${C.red}40` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-sm font-semibold" style={{ color: C.ivory }}>{en ? s.name : s.nameHi}</h4>
                    <span className="text-sm font-bold" style={{ color: C.red }}>{s.accuracy}%</span>
                  </div>
                  <div className="w-full rounded-full h-2 mb-2" style={{ backgroundColor: `${C.red}22` }}>
                    <div className="h-2 rounded-full" style={{ width: `${s.accuracy}%`, backgroundColor: C.red }} />
                  </div>
                  <div className="flex justify-between text-[11px]" style={{ color: C.sandMuted }}>
                    <span>{s.attempted} {en ? "attempted" : "प्रयास"}</span>
                    <span>{s.correct} {en ? "correct" : "सही"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  GYAN TAB
// ═══════════════════════════════════════════════════════════════
const GyanTab = ({ en }) => {
  const totalQ = GYAN_PERFORMANCE.correct + GYAN_PERFORMANCE.wrong;
  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title={en ? "Total Conversations" : "कुल वार्तालाप"} value={GYAN_STATS.conversations} trend="+12% vs last week" icon={MessageCircle} color={C.orange} subtitle="" />
        <StatCard title={en ? "Questions Asked" : "प्रश्न पूछे"} value={GYAN_STATS.questionsAsked} icon={BookOpen} color={C.green} />
        <StatCard title={en ? "MCQs Attempted" : "MCQ प्रयास"} value={GYAN_STATS.mcqsAttempted} icon={Brain} color={C.yellow} />
        <StatCard title={en ? "MCQ Accuracy" : "MCQ सटीकता"} value={`${GYAN_STATS.mcqAccuracy}%`} icon={Target} color={C.orange} large />
      </div>

      {/* Quiz Performance + Streak/Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Quiz Performance Analytics */}
        <div className="lg:col-span-3 rounded-xl border p-4" style={cardStyle}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold" style={{ color: C.ivory }}>{en ? "Quiz Performance Analytics" : "क्विज़ प्रदर्शन विश्लेषण"}</h3>
            <button className="text-xs font-medium" style={{ color: C.orange }}>{en ? "Full History →" : "पूरा इतिहास →"}</button>
          </div>
          <p className="text-xs mb-4" style={{ color: C.orange }}>{en ? "Average Score: 75%" : "औसत स्कोर: 75%"}</p>

          {/* Bar Chart */}
          <div className="flex items-end gap-3 h-28 mb-4 px-2">
            {GYAN_QUIZ_SCORES.map((score, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end">
                <span className="text-[10px] font-semibold mb-1" style={{ color: C.ivory }}>{score}%</span>
                <div className="w-full rounded-t-md transition-all" style={{ height: `${score}%`, background: `linear-gradient(to top, ${C.orange}, ${C.orange}99)` }} />
                <span className="text-[9px] mt-1" style={{ color: C.sandMuted }}>{en ? `Quiz ${i + 1}` : `क्विज़ ${i + 1}`}{i === 4 ? (en ? "\nRecent" : "") : ""}</span>
              </div>
            ))}
          </div>

          {/* Recent Quizzes */}
          <div className="space-y-2">
            {GYAN_RECENT_QUIZZES.map((q, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ backgroundColor: "rgba(228,87,46,0.06)", borderBottom: `1px solid rgba(228,87,46,0.1)` }}>
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4" style={{ color: C.orange }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: C.ivory }}>{en ? q.name : q.nameHi}</p>
                    <p className="text-[10px]" style={{ color: C.sandMuted }}>{q.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: C.green }}>{q.score}</p>
                  <p className="text-[9px]" style={{ color: C.sandMuted }}>{en ? "SCORE" : "स्कोर"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Streak + Performance Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          {/* Study Streak */}
          <div className="rounded-xl border p-4" style={{ ...cardStyle, background: `linear-gradient(135deg, ${C.orange}22, ${C.card})` }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: C.ivory }}>{en ? "Study Streak" : "अध्ययन स्ट्रीक"}</h3>
              <Flame className="w-5 h-5" style={{ color: C.orange }} />
            </div>
            <div className="flex gap-4">
              <div className="flex-1 text-center p-2 rounded-lg" style={{ backgroundColor: "rgba(228,87,46,0.15)" }}>
                <div className="text-2xl font-extrabold" style={{ color: C.ivory }}>{GYAN_STREAK.current}</div>
                <p className="text-[10px] uppercase tracking-wide" style={{ color: C.sand }}>{en ? "Current Days" : "वर्तमान दिन"}</p>
              </div>
              <div className="flex-1 text-center p-2 rounded-lg" style={{ backgroundColor: "rgba(228,87,46,0.08)" }}>
                <div className="text-2xl font-extrabold" style={{ color: C.ivory }}>{GYAN_STREAK.best}</div>
                <p className="text-[10px] uppercase tracking-wide" style={{ color: C.sand }}>{en ? "Best Streak" : "सर्वश्रेष्ठ"}</p>
              </div>
            </div>
            <div className="flex gap-1.5 mt-3">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="flex-1 h-2 rounded-full" style={{ backgroundColor: i < 5 ? C.orange : "rgba(228,87,46,0.15)" }} />
              ))}
            </div>
          </div>

          {/* Performance Breakdown */}
          <div className="rounded-xl border p-4" style={cardStyle}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: C.ivory }}>{en ? "Performance Breakdown" : "प्रदर्शन विश्लेषण"}</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: C.sand }}>{en ? "Correct" : "सही"}</span>
                  <span className="font-bold" style={{ color: C.green }}>{GYAN_PERFORMANCE.correct}</span>
                </div>
                <div className="w-full rounded-full h-3" style={{ backgroundColor: "rgba(228,87,46,0.12)" }}>
                  <div className="h-3 rounded-full" style={{ width: `${(GYAN_PERFORMANCE.correct / totalQ) * 100}%`, backgroundColor: C.green }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: C.sand }}>{en ? "Wrong" : "गलत"}</span>
                  <span className="font-bold" style={{ color: C.red }}>{GYAN_PERFORMANCE.wrong}</span>
                </div>
                <div className="w-full rounded-full h-3" style={{ backgroundColor: "rgba(228,87,46,0.12)" }}>
                  <div className="h-3 rounded-full" style={{ width: `${(GYAN_PERFORMANCE.wrong / totalQ) * 100}%`, backgroundColor: C.red }} />
                </div>
              </div>
            </div>
            <div className="mt-3 p-2.5 rounded-lg flex items-start gap-2" style={{ backgroundColor: `${C.orange}15` }}>
              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.yellow }} />
              <p className="text-[11px]" style={{ color: C.sand }}>{en ? "Quick Tip: Focus more on Economics to boost overall score!" : "त्वरित सुझाव: समग्र स्कोर बढ़ाने के लिए अर्थशास्त्र पर अधिक ध्यान दें!"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subject-wise Analysis */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5" style={{ color: C.orange }} />
          <h3 className="text-base font-semibold" style={{ color: C.ivory }}>{en ? "Subject-wise Analysis" : "विषय-वार विश्लेषण"}</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {GYAN_SUBJECTS.map((s, i) => (
            <div key={i} className="rounded-xl border p-4" style={cardStyle}>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${s.color}20` }}>
                  <BookOpen className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <span className="text-lg font-bold" style={{ color: C.ivory }}>{s.accuracy}%</span>
              </div>
              <p className="text-xs font-semibold mb-2" style={{ color: C.ivory }}>{en ? s.name : s.nameHi}</p>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: "rgba(228,87,46,0.12)" }}>
                <div className="h-2 rounded-full" style={{ width: `${s.accuracy}%`, backgroundColor: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Focus Needed */}
      {GYAN_WEAK.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5" style={{ color: C.red }} />
            <h3 className="text-base font-semibold" style={{ color: C.red }}>{en ? "Focus Needed (Weak Areas)" : "ध्यान आवश्यक (कमजोर क्षेत्र)"}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GYAN_WEAK.map((s, i) => (
              <div key={i} className="rounded-xl border p-4 flex items-center gap-3" style={{ backgroundColor: `${C.red}10`, borderColor: `${C.red}35` }}>
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${C.red}20` }}>
                  <AlertCircle className="w-5 h-5" style={{ color: C.red }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: C.ivory }}>{en ? s.name : s.nameHi}</p>
                  <p className="text-[10px]" style={{ color: C.sandMuted }}>{en ? `Target Accuracy: ${s.target}%` : `लक्ष्य सटीकता: ${s.target}%`}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold" style={{ color: C.red }}>{s.accuracy}%</p>
                  <p className="text-[9px] uppercase" style={{ color: C.sandMuted }}>{en ? "Current" : "वर्तमान"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  YOGYA TAB
// ═══════════════════════════════════════════════════════════════
const YogyaTab = ({ en }) => {
  const profileDone = YOGYA_PROFILE.filter((p) => p.done).length;
  const profilePct = Math.round((profileDone / YOGYA_PROFILE.length) * 100);

  return (
    <div className="space-y-5">
      {/* History + Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Eligibility History */}
        <div className="lg:col-span-3 rounded-xl border overflow-hidden" style={cardStyle}>
          <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: C.sectionBg, borderBottom: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: C.orange }} />
              <h3 className="text-sm font-semibold" style={{ color: C.ivory }}>{en ? "Eligibility History" : "पात्रता इतिहास"}</h3>
            </div>
            <button className="text-xs font-medium" style={{ color: C.orange }}>{en ? "View All" : "सभी देखें"}</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider" style={{ color: C.sandMuted, borderBottom: `1px solid ${C.border}` }}>
                  <th className="px-4 py-2 font-medium">{en ? "Exam Name" : "परीक्षा"}</th>
                  <th className="px-4 py-2 font-medium">{en ? "Date Checked" : "तिथि"}</th>
                  <th className="px-4 py-2 font-medium">{en ? "Status" : "स्थिति"}</th>
                  <th className="px-4 py-2 font-medium">{en ? "Action" : "कार्रवाई"}</th>
                </tr>
              </thead>
              <tbody>
                {YOGYA_HISTORY.map((h, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(228,87,46,0.08)" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: C.ivory }}>{h.name}</td>
                    <td className="px-4 py-3" style={{ color: C.sand }}>{h.date}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{
                        backgroundColor: h.status === "eligible" ? `${C.green}25` : `${C.red}25`,
                        color: h.status === "eligible" ? C.green : C.red,
                      }}>
                        {h.status === "eligible" ? (en ? "Eligible" : "पात्र") : (en ? "Not Eligible" : "अपात्र")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 rounded-md transition-colors hover:bg-[rgba(228,87,46,0.15)]">
                        <RefreshCw className="w-4 h-4" style={{ color: C.sand }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Profile Completeness */}
        <div className="lg:col-span-2 rounded-xl border p-4" style={cardStyle}>
          <h3 className="text-sm font-semibold mb-4 text-center" style={{ color: C.ivory }}>{en ? "Profile Completeness" : "प्रोफ़ाइल पूर्णता"}</h3>
          <div className="flex justify-center mb-3">
            <CircularProgress percent={profilePct} size={90} strokeWidth={4} color={C.green} />
          </div>
          <p className="text-[11px] text-center mb-4" style={{ color: C.sandMuted }}>
            {en ? "Your eligibility checks are more accurate with a complete profile." : "पूर्ण प्रोफ़ाइल के साथ आपकी पात्रता जाँच अधिक सटीक होती है।"}
          </p>
          <div className="space-y-2.5 mb-4">
            {YOGYA_PROFILE.map((p, i) => (
              <div key={i} className="flex items-center gap-2.5">
                {p.done ? <CheckCircle className="w-4 h-4" style={{ color: C.green }} /> : <CircleDot className="w-4 h-4" style={{ color: C.sandMuted }} />}
                <span className="text-xs" style={{ color: p.done ? C.ivory : C.sandMuted }}>{en ? p.label : p.labelHi}</span>
              </div>
            ))}
          </div>
          <button className="w-full py-2 rounded-lg text-xs font-semibold border transition-colors hover:bg-[rgba(228,87,46,0.15)]" style={{ color: C.orange, borderColor: C.orange }}>
            {en ? "Update Profile" : "प्रोफ़ाइल अपडेट करें"}
          </button>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-5 rounded-xl border p-4" style={cardStyle}>
          <h3 className="text-sm font-semibold mb-4 text-center" style={{ color: C.ivory }}>{en ? "Category Breakdown" : "श्रेणी विश्लेषण"}</h3>
          {/* Simple donut representation */}
          <div className="flex justify-center mb-4">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="12" fill="none" stroke="rgba(228,87,46,0.1)" strokeWidth="6" />
                {(() => {
                  let offset = 0;
                  return YOGYA_CATEGORIES.map((c, i) => {
                    const dash = (c.pct / 100) * 75.4;
                    const el = <circle key={i} cx="18" cy="18" r="12" fill="none" stroke={c.color} strokeWidth="6" strokeDasharray={`${dash} ${75.4 - dash}`} strokeDashoffset={-offset} />;
                    offset += dash;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9px] uppercase" style={{ color: C.sandMuted }}>{en ? "Main" : "मुख्य"}</span>
                <span className="text-sm font-bold" style={{ color: C.ivory }}>{YOGYA_STATS.mostChecked}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {YOGYA_CATEGORIES.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <div>
                  <span className="text-[10px] font-semibold" style={{ color: C.ivory }}>{en ? c.name : c.nameHi}</span>
                  <span className="text-[10px] ml-1" style={{ color: C.sandMuted }}>{c.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  MARG TAB
// ═══════════════════════════════════════════════════════════════
const MargTab = ({ en }) => {
  return (
    <div className="space-y-5">
      {/* My Recent Mind Maps */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: C.ivory }}>{en ? "My Recent Mind Maps" : "मेरे हाल के माइंड मैप"}</h3>
          <button className="text-xs font-medium" style={{ color: C.orange }}>{en ? "View All →" : "सभी देखें →"}</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MARG_MINDMAPS.map((m, i) => (
            <div key={i} className="rounded-xl border overflow-hidden" style={cardStyle}>
              <div className="relative h-28 flex items-center justify-center" style={{ backgroundColor: "rgba(228,87,46,0.06)" }}>
                <span className="absolute top-2 left-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: `${C.orange}25`, color: C.orange }}>{m.category}</span>
                <Map className="w-10 h-10" style={{ color: `${C.sand}40` }} />
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold" style={{ color: C.ivory }}>{en ? m.title : m.titleHi}</p>
                <p className="text-[10px] mb-3" style={{ color: C.sandMuted }}>{m.nodes} Nodes · {en ? `Last edited ${m.edited}` : `अंतिम संपादन ${m.edited}`}</p>
                <div className="flex gap-2">
                  <button className="flex-1 py-1.5 rounded-md text-[11px] font-semibold text-center transition-colors" style={{ backgroundColor: C.orange, color: "#fff" }}>
                    {en ? "Open" : "खोलें"}
                  </button>
                  <button className="px-3 py-1.5 rounded-md text-[11px] font-semibold border transition-colors hover:bg-[rgba(228,87,46,0.1)]" style={{ borderColor: C.border, color: C.sand }}>
                    {en ? "Edit" : "संपादन"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════
const Dashboard = () => {
  const { language } = useTheme();
  const en = language === "en";
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="pt-20 pb-10 px-3 sm:px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">

        {/* Dashboard Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard className="w-6 h-6" style={{ color: C.orange }} />
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: C.ivory }}>
                {en ? "Dashboard" : "डैशबोर्ड"}
              </h1>
            </div>
            <p className="text-sm" style={{ color: C.sand }}>
              {en ? "Welcome back, Student! Here's your preparation overview." : "वापसी पर स्वागत है! यहाँ आपकी तैयारी का अवलोकन है।"}
            </p>
          </div>
          <button className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-[rgba(228,87,46,0.15)]" style={{ color: C.sand, borderColor: C.border }}>
            <Download className="w-4 h-4" />
            {en ? "Export" : "निर्यात"}
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1 scrollbar-hide" style={{ borderBottom: `2px solid rgba(228,87,46,0.15)` }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all relative shrink-0"
                style={{
                  color: isActive ? C.orange : C.sandMuted,
                  borderBottom: isActive ? `2px solid ${C.orange}` : "2px solid transparent",
                  marginBottom: "-2px",
                }}
              >
                <tab.icon className="w-4 h-4" />
                {en ? tab.label : tab.labelHi}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && <OverviewTab en={en} />}
        {activeTab === "gyan" && <GyanTab en={en} />}
        {activeTab === "yogya" && <YogyaTab en={en} />}
        {activeTab === "marg" && <MargTab en={en} />}

      </div>
    </div>
  );
};

export default Dashboard;
