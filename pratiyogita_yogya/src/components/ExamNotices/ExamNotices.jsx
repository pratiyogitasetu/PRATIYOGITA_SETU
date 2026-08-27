import React from "react";

// Sample notices — replace with real data later
const sampleNotices = [
  {
    id: 1,
    exam: "SSC CGL 2026",
    title: "Application window extended",
    date: "Aug 20, 2026",
    type: "update",
  },
  {
    id: 2,
    exam: "IBPS PO 2026",
    title: "Admit card released for Prelims",
    date: "Aug 18, 2026",
    type: "notice",
  },
  {
    id: 3,
    exam: "UPSC CSE 2026",
    title: "Mains exam date confirmed",
    date: "Aug 15, 2026",
    type: "notice",
  },
  {
    id: 4,
    exam: "RRB NTPC",
    title: "CBT-2 result declared",
    date: "Aug 12, 2026",
    type: "result",
  },
  {
    id: 5,
    exam: "SBI Clerk 2026",
    title: "Vacancy increased to 14,000+",
    date: "Aug 10, 2026",
    type: "update",
  },
  {
    id: 6,
    exam: "SSC CHSL 2026",
    title: "Notification released",
    date: "Aug 8, 2026",
    type: "new",
  },
  {
    id: 7,
    exam: "CDS II 2026",
    title: "Registration opens Sep 1",
    date: "Aug 5, 2026",
    type: "new",
  },
];

const TYPE_STYLES = {
  notice: {
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    dot: "bg-blue-500",
    label: "Notice",
  },
  update: {
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    dot: "bg-amber-500",
    label: "Update",
  },
  result: {
    bg: "bg-green-500/10",
    text: "text-green-600",
    dot: "bg-green-500",
    label: "Result",
  },
  new: {
    bg: "bg-[#E4572E]/10",
    text: "text-[#E4572E]",
    dot: "bg-[#E4572E]",
    label: "New",
  },
};

export default function ExamNotices({ notices = sampleNotices }) {
  return (
    <div className="bg-[#F4F2EF] rounded-xl border border-[#E4572E]/40 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-[#E4572E]/10 border-b border-[#E4572E]/20 px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-[#E4572E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 className="text-sm font-bold text-[#0B0A08]">Exam Notices</h3>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider bg-[#E4572E]/15 text-[#E4572E] px-1.5 py-0.5 rounded-full">
          {notices.length} new
        </span>
      </div>

      {/* Notices list */}
      <div
        className="overflow-y-auto flex-1"
        style={{
          maxHeight: "280px",
          scrollbarWidth: "thin",
          scrollbarColor: "#E4572E rgba(11,10,8,0.04)",
        }}
      >
        <div className="divide-y divide-[#0B0A08]/6">
          {notices.map((notice) => {
            const style = TYPE_STYLES[notice.type] || TYPE_STYLES.notice;
            return (
              <div
                key={notice.id}
                className="px-3 py-2.5 hover:bg-[#E4572E]/5 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-2">
                  <span className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${style.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[11px] font-bold text-[#0B0A08] truncate">
                        {notice.exam}
                      </span>
                      <span
                        className={`shrink-0 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}
                      >
                        {style.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#0B0A08]/65 leading-snug">
                      {notice.title}
                    </p>
                    <p className="text-[9px] text-[#0B0A08]/35 mt-0.5 font-medium">
                      {notice.date}
                    </p>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 text-[#0B0A08]/20 group-hover:text-[#E4572E] transition-colors shrink-0 mt-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#E4572E]/15 px-3 py-1.5 shrink-0">
        <button className="w-full text-center text-[10px] font-semibold text-[#E4572E] hover:text-[#c9421e] transition-colors cursor-pointer">
          View All Notices →
        </button>
      </div>
    </div>
  );
}
