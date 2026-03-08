import React from "react";
import { motion } from "framer-motion";

const stats = [
  {
    label: "Exam Categories", value: "20",
    textColor: "#E4572E",
    gradient: "linear-gradient(135deg, rgba(228,87,46,0.5) 0%, rgba(228,87,46,0.28) 55%, rgba(43,30,23,0.2) 100%)",
    border: "rgba(228,87,46,0.55)",
  },
  {
    label: "Total Exams", value: "40",
    textColor: "#FBF6EE",
    gradient: "linear-gradient(135deg, rgba(251,246,238,0.18) 0%, rgba(232,216,195,0.14) 55%, rgba(43,30,23,0.2) 100%)",
    border: "rgba(232,216,195,0.35)",
  },
  {
    label: "Input Fields", value: "54",
    textColor: "#E4572E",
    gradient: "linear-gradient(135deg, rgba(228,87,46,0.38) 0%, rgba(228,87,46,0.2) 55%, rgba(43,30,23,0.2) 100%)",
    border: "rgba(228,87,46,0.4)",
  },
  {
    label: "Mind Maps", value: "12",
    textColor: "#E8D8C3",
    gradient: "linear-gradient(135deg, rgba(232,216,195,0.22) 0%, rgba(232,216,195,0.12) 55%, rgba(43,30,23,0.2) 100%)",
    border: "rgba(232,216,195,0.3)",
  },
  {
    label: "PYQs", value: "9,480",
    textColor: "#E4572E",
    gradient: "linear-gradient(135deg, rgba(228,87,46,0.55) 0%, rgba(228,87,46,0.3) 55%, rgba(43,30,23,0.2) 100%)",
    border: "rgba(228,87,46,0.5)",
  },
  {
    label: "Books", value: "6",
    textColor: "#FBF6EE",
    gradient: "linear-gradient(135deg, rgba(251,246,238,0.16) 0%, rgba(232,216,195,0.12) 55%, rgba(43,30,23,0.2) 100%)",
    border: "rgba(251,246,238,0.22)",
  },
];

const PRATIYOGITA_YOGYA_URL =
  import.meta.env.VITE_PRATIYOGITA_YOGYA_URL || "http://localhost:5173";
const PRATIYOGITA_MARG_URL =
  import.meta.env.VITE_PRATIYOGITA_MARG_URL || "http://localhost:8080";
const PRATIYOGITA_GYAN_URL =
  import.meta.env.VITE_PRATIYOGITA_GYAN_URL || "http://localhost:3002";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex flex-col items-center gap-2 mb-4">
             <motion.div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E4572E]/10 border border-[#E4572E]/35"
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="w-2 h-2 rounded-full bg-[#E4572E] animate-pulse" />
                        <span className="text-sm font-semibold text-[#E4572E]">
                         One stop solution for Competative exams
                        </span>
                      </motion.div>
          </div>
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#FBF6EE] leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Your Path to{" "}
            <span className="text-[#E4572E]">Success</span> in Competitive
            Exams
          </motion.h1>

          {/* Tagline removed as requested */}

          <motion.div
            className="mt-10 lg:mt-14 flex flex-row gap-2 sm:gap-10 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <a
              href={`${PRATIYOGITA_YOGYA_URL}/check-eligibility`}
              className="bubble-btn flex flex-col items-center gap-0.5 whitespace-nowrap"
            >
              <span className="font-bold text-xs sm:text-base">Check Now</span>
              <span className="text-[10px] sm:text-xs font-normal opacity-90">Know your Eligibility</span>
            </a>
            <a
              href={`${PRATIYOGITA_MARG_URL}/explore`}
              className="bubble-btn bubble-btn-outline flex flex-col items-center gap-0.5 whitespace-nowrap"
            >
              <span className="font-bold text-xs sm:text-base">Explore</span>
              <span className="text-[10px] sm:text-xs font-normal opacity-90">Explore Mindmaps</span>
            </a>
            <a
              href={PRATIYOGITA_GYAN_URL}
              className="bubble-btn bubble-btn-outline flex flex-col items-center gap-0.5 whitespace-nowrap"
            >
              <span className="font-bold text-xs sm:text-base">Chat with AI</span>
              <span className="text-[10px] sm:text-xs font-normal opacity-90">Chat with Gyan</span>
            </a>
          </motion.div>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div
        className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mt-8 sm:mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      >
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 + index * 0.08 }}
              className="relative overflow-hidden rounded-2xl"
              style={{ border: `1px solid ${stat.border}` }}
            >
              {/* Grainy gradient background */}
              <div
                className="absolute inset-0 rounded-2xl"
                style={{ background: stat.gradient, filter: "url(#grainy)" }}
              />
              <div className="absolute inset-0 rounded-2xl bg-[#2B1E17]/45" />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center gap-1 py-5 px-3">
                <span
                  className="text-4xl sm:text-5xl font-black tracking-tight leading-none"
                  style={{ color: stat.textColor, fontVariantNumeric: "tabular-nums" }}
                >
                  {stat.value}
                </span>
                <span className="text-[11px] sm:text-xs text-[#E8D8C3]/75 text-center leading-tight font-semibold uppercase tracking-wide mt-1">
                  {stat.label}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
