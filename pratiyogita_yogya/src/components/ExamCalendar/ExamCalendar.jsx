import React, { useState, useEffect } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Date type constants with their color configs
const DATE_TYPES = {
  starting: {
    label: "Apply Start",
    dotColor: "bg-blue-500",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600",
    ringColor: "ring-blue-500/40",
    selectedBg: "bg-blue-500",
    shadowColor: "shadow-blue-500/30",
    hoverBg: "hover:bg-blue-500/20",
    cellBg: "bg-blue-500/8",
  },
  lastDate: {
    label: "Apply Deadline",
    dotColor: "bg-red-500",
    bgColor: "bg-red-500/10",
    textColor: "text-red-600",
    ringColor: "ring-red-500/40",
    selectedBg: "bg-red-500",
    shadowColor: "shadow-red-500/30",
    hoverBg: "hover:bg-red-500/20",
    cellBg: "bg-red-500/8",
  },
  exam: {
    label: "Exam Date",
    dotColor: "bg-emerald-500",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-600",
    ringColor: "ring-emerald-500/40",
    selectedBg: "bg-emerald-500",
    shadowColor: "shadow-emerald-500/30",
    hoverBg: "hover:bg-emerald-500/20",
    cellBg: "bg-emerald-500/8",
  },
};

/**
 * Parse DD-MM-YYYY date string to a Date object
 */
function parseDateDMY(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

/**
 * Format a date to YYYY-MM-DD key for calendar lookup
 */
function formatDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/**
 * Build a lookup map from exam dates API response
 * Returns: { "YYYY-MM-DD": [{ name, type, examCode, category }] }
 */
function buildDateMap(examsData) {
  const dateMap = {};
  // Strip time from today so comparison is date-only
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (const exam of examsData) {
    const entries = [
      { dateStr: exam.starting_date_to_apply, type: "starting" },
      { dateStr: exam.last_date_to_apply, type: "lastDate" },
      { dateStr: exam.exam_date, type: "exam" },
    ];

    for (const { dateStr, type } of entries) {
      if (!dateStr) continue;
      const parsed = parseDateDMY(dateStr);
      if (!parsed) continue;

      // Skip dates that are in the past
      if (parsed < todayStart) continue;

      const key = formatDateKey(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate()
      );

      if (!dateMap[key]) dateMap[key] = [];
      dateMap[key].push({
        name: exam.exam_name || exam.exam_code || "Unknown Exam",
        type,
        examCode: exam.exam_code || "",
        category: exam.category || "",
      });
    }
  }

  return dateMap;
}

export default function ExamCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [examDates, setExamDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch exam dates from API
  useEffect(() => {
    let cancelled = false;

    const fetchDates = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/exams/dates");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!cancelled) {
          setExamDates(buildDateMap(data));
        }
      } catch (err) {
        console.error("Failed to fetch exam dates:", err);
        if (!cancelled) {
          setError("Could not load dates");
          setExamDates({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDates();
    return () => { cancelled = true; };
  }, []);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const isToday = (day) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const getEventsForDay = (day) => {
    const key = formatDateKey(currentYear, currentMonth, day);
    return examDates[key] || [];
  };

  const handleDayClick = (day) => {
    const key = formatDateKey(currentYear, currentMonth, day);
    setSelectedDate(selectedDate === key ? null : key);
  };

  /**
   * Get the dominant event type for a day (for cell background coloring).
   * Priority: exam > lastDate > starting
   */
  const getDominantType = (events) => {
    if (events.some((e) => e.type === "exam")) return "exam";
    if (events.some((e) => e.type === "lastDate")) return "lastDate";
    if (events.some((e) => e.type === "starting")) return "starting";
    return null;
  };

  // Build calendar grid
  const blanks = Array.from({ length: firstDay }, (_, i) => (
    <div key={`blank-${i}`} className="h-7 sm:h-8" />
  ));

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const events = getEventsForDay(day);
    const dateKey = formatDateKey(currentYear, currentMonth, day);
    const hasEvents = events.length > 0;
    const isSelected = selectedDate === dateKey;
    const todayClass = isToday(day);
    const dominantType = hasEvents ? getDominantType(events) : null;
    const typeConfig = dominantType ? DATE_TYPES[dominantType] : null;

    // Get unique event types for multi-dot display
    const uniqueTypes = [...new Set(events.map((e) => e.type))];

    return (
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        className={`h-7 sm:h-8 rounded-lg text-xs sm:text-sm font-medium relative transition-all duration-200 cursor-pointer
          ${isSelected && typeConfig
            ? `${typeConfig.selectedBg} text-white shadow-md ${typeConfig.shadowColor} ring-2 ring-offset-1 ${typeConfig.ringColor}`
            : isSelected
              ? "bg-[#E4572E] text-white shadow-md shadow-[#E4572E]/30"
              : todayClass && hasEvents && typeConfig
                ? `${typeConfig.selectedBg} text-white font-bold ring-2 ring-offset-1 ring-[#E4572E]/60`
                : todayClass
                  ? "bg-[#E4572E]/15 text-[#E4572E] font-bold ring-1 ring-[#E4572E]/40"
                  : hasEvents && typeConfig
                    ? `${typeConfig.selectedBg} text-white font-semibold ${typeConfig.hoverBg}`
                    : "text-[#0B0A08]/70 hover:bg-[#0B0A08]/5"
          }`}
      >
        {day}
      </button>
    );
  });

  const selectedEvents = selectedDate ? (examDates[selectedDate] || []) : [];

  return (
    <div className="bg-[#F4F2EF] rounded-xl border border-[#E4572E]/40 overflow-hidden">
      {/* Header */}
      <div className="bg-[#E4572E]/10 border-b border-[#E4572E]/20 px-3 py-2 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-[#0B0A08]/60 hover:bg-[#E4572E]/15 hover:text-[#E4572E] transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-sm font-bold text-[#0B0A08]">
          {MONTHS[currentMonth]} {currentYear}
        </h3>
        <button
          onClick={nextMonth}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-[#0B0A08]/60 hover:bg-[#E4572E]/15 hover:text-[#E4572E] transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="px-3 py-4 text-center">
          <div className="inline-block w-4 h-4 border-2 border-[#E4572E]/30 border-t-[#E4572E] rounded-full animate-spin" />
          <p className="text-[10px] text-[#0B0A08]/40 mt-1">Loading dates...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="px-3 py-2">
          <p className="text-[10px] text-red-500 text-center">{error}</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 px-2 pt-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[9px] sm:text-[10px] font-semibold text-[#0B0A08]/40 uppercase">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5 px-2 py-1.5">
            {blanks}
            {days}
          </div>

          {/* Selected date events */}
          {selectedDate && (
            <div className="border-t border-[#E4572E]/15 px-3 py-2">
              {selectedEvents.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedEvents.map((event, i) => {
                    const config = DATE_TYPES[event.type] || DATE_TYPES.exam;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span
                          className={`shrink-0 w-1.5 h-1.5 rounded-full ${config.dotColor}`}
                        />
                        <span className="text-[#0B0A08]/80 font-medium truncate">{event.name}</span>
                        <span
                          className={`ml-auto shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${config.bgColor} ${config.textColor}`}
                        >
                          {config.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-[#0B0A08]/40 text-center">No events on this date</p>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="border-t border-[#E4572E]/10 px-3 py-1.5 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[9px] text-[#0B0A08]/50">Apply Start</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[9px] text-[#0B0A08]/50">Deadline</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] text-[#0B0A08]/50">Exam</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
