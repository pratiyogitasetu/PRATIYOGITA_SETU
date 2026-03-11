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
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────

const MOCK_STATS = {
  studySessions: 47,
  questionsPracticed: 312,
  examsTracked: 8,
  mindMapsCreated: 12,
};

const MOCK_ACTIVITY = [
  { platform: "gyan", text: "Asked 5 questions about Indian Polity", time: "2 hours ago", textHi: "भारतीय राजव्यवस्था पर 5 प्रश्न पूछे" },
  { platform: "yogya", text: "Checked eligibility for NDA 2026", time: "5 hours ago", textHi: "NDA 2026 के लिए पात्रता जांची" },
  { platform: "marg", text: "Edited mind map: SSC CGL Syllabus", time: "Yesterday", textHi: "माइंड मैप संपादित किया: SSC CGL पाठ्यक्रम" },
  { platform: "gyan", text: "Scored 80% on History MCQ quiz (16/20)", time: "Yesterday", textHi: "इतिहास MCQ क्विज़ में 80% अंक (16/20)" },
  { platform: "yogya", text: "Eligible for 5 out of 7 Defence exams", time: "2 days ago", textHi: "7 में से 5 रक्षा परीक्षाओं के लिए पात्र" },
  { platform: "marg", text: "Created new mind map: UPSC Prelims GS", time: "3 days ago", textHi: "नया माइंड मैप बनाया: UPSC प्रीलिम्स GS" },
  { platform: "gyan", text: "Completed Geography topic revision", time: "4 days ago", textHi: "भूगोल विषय पुनरीक्षण पूरा किया" },
  { platform: "yogya", text: "Re-checked eligibility for SSC CHSL", time: "5 days ago", textHi: "SSC CHSL के लिए पुनः पात्रता जांची" },
];

const MOCK_STREAK = { current: 14, longest: 23, todayDone: 15, todayGoal: 20 };

const MOCK_WEEK_ACTIVITY = [0.2, 0.8, 0.6, 1.0, 0.4, 0.9, 0.3]; // Mon–Sun (0–1 intensity)

const MOCK_EXAMS = [
  { name: "NDA 2026", eligible: "yes", questions: 85, accuracy: 76, mindMaps: 3, score: 72 },
  { name: "SSC CGL 2026", eligible: "yes", questions: 120, accuracy: 82, mindMaps: 4, score: 80 },
  { name: "UPSC Prelims 2026", eligible: "not-checked", questions: 45, accuracy: 68, mindMaps: 2, score: 55 },
  { name: "SSC CHSL 2026", eligible: "yes", questions: 30, accuracy: 90, mindMaps: 1, score: 65 },
  { name: "CDS 2026", eligible: "no", questions: 20, accuracy: 55, mindMaps: 1, score: 35 },
  { name: "RRB NTPC 2026", eligible: "yes", questions: 12, accuracy: 72, mindMaps: 0, score: 40 },
];

const MOCK_SUBJECTS = [
  { name: "History", nameHi: "इतिहास", accuracy: 82, color: "#3B82F6" },
  { name: "Geography", nameHi: "भूगोल", accuracy: 75, color: "#10B981" },
  { name: "Polity", nameHi: "राजव्यवस्था", accuracy: 88, color: "#8B5CF6" },
  { name: "Economics", nameHi: "अर्थशास्त्र", accuracy: 52, color: "#F59E0B" },
  { name: "Science", nameHi: "विज्ञान", accuracy: 65, color: "#EF4444" },
  { name: "Mathematics", nameHi: "गणित", accuracy: 70, color: "#EC4899" },
];

const MOCK_CATEGORIES = [
  { name: "Defence", nameHi: "रक्षा", engagement: 85 },
  { name: "SSC", nameHi: "SSC", engagement: 72 },
  { name: "Banking", nameHi: "बैंकिंग", engagement: 30 },
  { name: "Railway", nameHi: "रेलवे", engagement: 45 },
  { name: "State PSC", nameHi: "राज्य PSC", engagement: 60 },
  { name: "Teaching", nameHi: "शिक्षण", engagement: 20 },
];

const MOCK_WEAK_AREAS = [
  { name: "Economics", nameHi: "अर्थशास्त्र", accuracy: 52, attempted: 25, correct: 13 },
  { name: "Science", nameHi: "विज्ञान", accuracy: 65, attempted: 40, correct: 26 },
];

// ─── Helper Components ────────────────────────────────────────

const PLATFORM_COLORS = { gyan: "#3B82F6", yogya: "#10B981", marg: "#8B5CF6" };
const PLATFORM_LABELS = { gyan: "Gyan", yogya: "Yogya", marg: "Marg" };
const DAYS_EN = ["M", "T", "W", "T", "F", "S", "S"];
const DAYS_HI = ["सो", "मं", "बु", "गु", "शु", "श", "र"];

const SectionHeader = ({ title, icon: Icon, isExpanded, onToggle, badge }) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-xl cursor-pointer hover:from-orange-100 hover:to-amber-100 transition-colors border-b border-orange-200/60"
  >
    <div className="flex items-center gap-2.5">
      <Icon className="w-5 h-5 text-orange-600" />
      <h3 className="text-sm sm:text-base font-semibold text-gray-900">{title}</h3>
      {badge && (
        <span className="px-2 py-0.5 text-[10px] font-semibold bg-orange-100 text-orange-700 rounded-full">
          {badge}
        </span>
      )}
    </div>
    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
  </button>
);

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 truncate">{title}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend !== undefined && (
            <span className={`text-xs font-semibold flex items-center ${trend > 0 ? "text-green-600" : "text-red-500"}`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="shrink-0 p-2.5 rounded-full" style={{ backgroundColor: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────

const Dashboard = () => {
  const { theme, language } = useTheme();
  const isDark = theme === "dark";
  const en = language === "en";

  const [expanded, setExpanded] = useState({
    activity: true,
    exams: true,
    subjects: true,
    categories: false,
    weakAreas: false,
  });

  const toggle = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const accuracyColor = (v) => (v >= 80 ? "#10B981" : v >= 60 ? "#F59E0B" : "#EF4444");
  const eligibilityBadge = (status) => {
    if (status === "yes") return { label: en ? "Eligible" : "पात्र", bg: "bg-green-100", text: "text-green-700" };
    if (status === "no") return { label: en ? "Not Eligible" : "अपात्र", bg: "bg-red-100", text: "text-red-700" };
    return { label: en ? "Not Checked" : "जाँच नहीं", bg: "bg-gray-100", text: "text-gray-500" };
  };

  const streakPercent = Math.min((MOCK_STREAK.current / 30) * 100, 100);
  const goalPercent = Math.round((MOCK_STREAK.todayDone / MOCK_STREAK.todayGoal) * 100);

  return (
    <div className="pt-20 pb-10 px-3 sm:px-6 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard className="w-6 h-6 text-orange-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {en ? "Dashboard" : "डैशबोर्ड"}
              </h1>
            </div>
            <p className="text-sm text-gray-500">
              {en
                ? "Welcome back, Student! Here's your combined preparation overview."
                : "वापसी पर स्वागत है, छात्र! यहाँ आपकी संयुक्त तैयारी का अवलोकन है।"}
            </p>
          </div>
          <button className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            {en ? "Export" : "निर्यात"}
          </button>
        </div>

        {/* ── Overview Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title={en ? "Study Sessions" : "अध्ययन सत्र"} value={MOCK_STATS.studySessions} subtitle={en ? "Across all platforms" : "सभी प्लेटफॉर्म पर"} icon={MessageCircle} color="#3B82F6" trend={5} />
          <StatCard title={en ? "Questions Practiced" : "प्रश्न अभ्यास"} value={MOCK_STATS.questionsPracticed} subtitle={en ? "MCQs + chatbot" : "MCQ + चैटबॉट"} icon={Brain} color="#10B981" trend={12} />
          <StatCard title={en ? "Exams Tracked" : "परीक्षा ट्रैक"} value={MOCK_STATS.examsTracked} subtitle={en ? "Eligibility checked" : "पात्रता जाँची"} icon={Target} color="#8B5CF6" trend={3} />
          <StatCard title={en ? "Mind Maps" : "माइंड मैप"} value={MOCK_STATS.mindMapsCreated} subtitle={en ? "Visual study aids" : "दृश्य अध्ययन सहायक"} icon={Share2} color="#F59E0B" trend={8} />
        </div>

        {/* ── Activity Feed + Streak (Two Columns) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Recent Activity Feed — 3/5 */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <SectionHeader title={en ? "Recent Activity" : "हाल की गतिविधि"} icon={Clock} isExpanded={expanded.activity} onToggle={() => toggle("activity")} badge={`${MOCK_ACTIVITY.length}`} />
            {expanded.activity && (
              <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto">
                {MOCK_ACTIVITY.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PLATFORM_COLORS[item.platform] }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: `${PLATFORM_COLORS[item.platform]}15`, color: PLATFORM_COLORS[item.platform] }}>
                          {PLATFORM_LABELS[item.platform]}
                        </span>
                        <span className="text-xs text-gray-400">{item.time}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5 truncate">{en ? item.text : item.textHi}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Streak & Daily Goal — 2/5 */}
          <div className="lg:col-span-2 space-y-4">
            {/* Streak Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-semibold text-gray-900">{en ? "Study Streak" : "अध्ययन स्ट्रीक"}</h3>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-orange-600">{MOCK_STREAK.current}</div>
                  <p className="text-[10px] text-gray-500">{en ? "Current" : "वर्तमान"}</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-blue-600">{MOCK_STREAK.longest}</div>
                  <p className="text-[10px] text-gray-500">{en ? "Longest" : "सबसे लंबी"}</p>
                </div>
              </div>
              <div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-500" style={{ width: `${streakPercent}%` }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  {30 - MOCK_STREAK.current > 0
                    ? en ? `${30 - MOCK_STREAK.current} days to 30-day streak!` : `30-दिन स्ट्रीक तक ${30 - MOCK_STREAK.current} दिन!`
                    : en ? "30-day streak achieved! 🎉" : "30 दिन की स्ट्रीक हासिल! 🎉"}
                </p>
              </div>

              {/* Weekly heatmap */}
              <div>
                <p className="text-[10px] font-medium text-gray-500 mb-1.5">{en ? "This Week" : "इस सप्ताह"}</p>
                <div className="flex gap-1.5">
                  {MOCK_WEEK_ACTIVITY.map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full aspect-square rounded-md transition-colors"
                        style={{
                          backgroundColor: v === 0 ? "#E5E7EB" : `rgba(249,115,22,${0.2 + v * 0.8})`,
                        }}
                      />
                      <span className="text-[9px] text-gray-400">{en ? DAYS_EN[i] : DAYS_HI[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily Goal */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-900">{en ? "Daily Goal" : "दैनिक लक्ष्य"}</h3>
              </div>
              <div className="flex items-center gap-4">
                {/* Circular progress */}
                <div className="relative w-20 h-20 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3B82F6" strokeWidth="3" strokeDasharray={`${goalPercent} ${100 - goalPercent}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-900">{goalPercent}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">{MOCK_STREAK.todayDone}/{MOCK_STREAK.todayGoal} {en ? "questions" : "प्रश्न"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {en
                      ? `${MOCK_STREAK.todayGoal - MOCK_STREAK.todayDone} more to hit today's goal!`
                      : `आज के लक्ष्य तक ${MOCK_STREAK.todayGoal - MOCK_STREAK.todayDone} और!`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Exam Journey Table ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <SectionHeader title={en ? "Your Exam Journey" : "आपकी परीक्षा यात्रा"} icon={Trophy} isExpanded={expanded.exams} onToggle={() => toggle("exams")} badge={`${MOCK_EXAMS.length} ${en ? "exams" : "परीक्षाएं"}`} />
          {expanded.exams && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-2.5 font-medium">{en ? "Exam" : "परीक्षा"}</th>
                    <th className="px-4 py-2.5 font-medium">{en ? "Eligibility" : "पात्रता"}</th>
                    <th className="px-4 py-2.5 font-medium text-center">{en ? "Questions" : "प्रश्न"}</th>
                    <th className="px-4 py-2.5 font-medium text-center">{en ? "Accuracy" : "सटीकता"}</th>
                    <th className="px-4 py-2.5 font-medium text-center">{en ? "Mind Maps" : "माइंड मैप"}</th>
                    <th className="px-4 py-2.5 font-medium text-center">{en ? "Prep Score" : "तैयारी स्कोर"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MOCK_EXAMS.map((exam, i) => {
                    const badge = eligibilityBadge(exam.eligible);
                    return (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{exam.name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>{badge.label}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">{exam.questions}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold" style={{ color: accuracyColor(exam.accuracy) }}>{exam.accuracy}%</span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">{exam.mindMaps}</td>
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

        {/* ── Three-Column: Subjects · Categories · Quick Actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Subject Performance */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <SectionHeader title={en ? "Subject Performance" : "विषय प्रदर्शन"} icon={BarChart3} isExpanded={expanded.subjects} onToggle={() => toggle("subjects")} />
            {expanded.subjects && (
              <div className="p-4 space-y-3">
                {MOCK_SUBJECTS.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-700">{en ? s.name : s.nameHi}</span>
                      <span className="text-xs font-semibold" style={{ color: accuracyColor(s.accuracy) }}>{s.accuracy}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${s.accuracy}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-gray-400 pt-1">
                  {en ? `Based on ${MOCK_STATS.questionsPracticed} MCQs across all subjects` : `सभी विषयों में ${MOCK_STATS.questionsPracticed} MCQ पर आधारित`}
                </p>
              </div>
            )}
          </div>

          {/* Category Heatmap */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <SectionHeader title={en ? "Category Engagement" : "श्रेणी सहभागिता"} icon={BarChart3} isExpanded={expanded.categories} onToggle={() => toggle("categories")} />
            {expanded.categories && (
              <div className="p-4 grid grid-cols-2 gap-2">
                {MOCK_CATEGORIES.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-lg p-3 text-center transition-colors"
                    style={{ backgroundColor: `rgba(249,115,22,${0.08 + (c.engagement / 100) * 0.35})` }}
                  >
                    <p className="text-xs font-semibold text-gray-800">{en ? c.name : c.nameHi}</p>
                    <p className="text-lg font-bold text-orange-700">{c.engagement}</p>
                    <p className="text-[9px] text-gray-500">{en ? "interactions" : "इंटरैक्शन"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-orange-600" />
              <h3 className="text-sm font-semibold text-gray-900">{en ? "Quick Actions" : "त्वरित कार्य"}</h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: Brain, label: en ? "Ask Gyan" : "ज्ञान पूछें", color: "#3B82F6" },
                { icon: ClipboardCheck, label: en ? "Check Eligibility" : "पात्रता जांचें", color: "#10B981" },
                { icon: Map, label: en ? "Create Mind Map" : "माइंड मैप बनाएं", color: "#8B5CF6" },
                { icon: BookOpen, label: en ? "Take a Quiz" : "क्विज़ दें", color: "#F59E0B" },
                { icon: Download, label: en ? "Export Report" : "रिपोर्ट निर्यात", color: "#6B7280" },
                { icon: Target, label: en ? "Set Daily Goal" : "दैनिक लक्ष्य सेट करें", color: "#EF4444" },
              ].map((action, i) => (
                <button
                  key={i}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <action.icon className="w-5 h-5" style={{ color: action.color }} />
                  <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Weak Areas ── */}
        {MOCK_WEAK_AREAS.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <SectionHeader title={en ? "Areas Needing Improvement" : "सुधार की आवश्यकता वाले क्षेत्र"} icon={AlertCircle} isExpanded={expanded.weakAreas} onToggle={() => toggle("weakAreas")} badge={`${MOCK_WEAK_AREAS.length} ${en ? "subjects" : "विषय"}`} />
            {expanded.weakAreas && (
              <div className="p-4 space-y-3">
                <p className="text-xs text-gray-500">{en ? "Subjects below 60% accuracy — focus on these to improve." : "60% से कम सटीकता वाले विषय — सुधार के लिए इन पर ध्यान दें।"}</p>
                {MOCK_WEAK_AREAS.map((s, i) => (
                  <div key={i} className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-sm font-semibold text-gray-900">{en ? s.name : s.nameHi}</h4>
                      <span className="text-sm font-bold text-red-600">{s.accuracy}%</span>
                    </div>
                    <div className="w-full bg-red-100 rounded-full h-2 mb-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${s.accuracy}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>{s.attempted} {en ? "attempted" : "प्रयास"}</span>
                      <span>{s.correct} {en ? "correct" : "सही"}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                        {en ? "Practice Now" : "अभ्यास करें"}
                      </button>
                      <button className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors">
                        {en ? "View Mind Map" : "माइंड मैप देखें"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
