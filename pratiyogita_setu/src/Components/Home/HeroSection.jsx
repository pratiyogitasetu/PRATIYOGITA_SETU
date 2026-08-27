import React from "react";
import { motion } from "framer-motion";

const defaultStats = [
  {
    key: "categories",
    label: "Exam Categories",
    value: "14+",
    textColor: "#E4572E",
    gradient: "linear-gradient(135deg, rgba(228,87,46,0.5) 0%, rgba(228,87,46,0.28) 55%, rgba(43,30,23,0.2) 100%)",
    border: "rgba(228,87,46,0.55)",
  },
  {
    key: "exams",
    label: "Total Exams",
    value: "1,100+",
    textColor: "#FBF6EE",
    gradient: "linear-gradient(135deg, rgba(251,246,238,0.18) 0%, rgba(232,216,195,0.14) 55%, rgba(43,30,23,0.2) 100%)",
    border: "rgba(232,216,195,0.35)",
  },
  {
    key: "pyqs",
    label: "Total PYQs",
    value: "9,480+",
    textColor: "#E4572E",
    gradient: "linear-gradient(135deg, rgba(228,87,46,0.55) 0%, rgba(228,87,46,0.3) 55%, rgba(43,30,23,0.2) 100%)",
    border: "rgba(228,87,46,0.5)",
  },
];

const PRATIYOGITA_YOGYA_URL =
  import.meta.env.VITE_PRATIYOGITA_YOGYA_URL || "https://pratiyogitayogya.vercel.app";
const PRATIYOGITA_MARG_URL = null; // Coming Soon
const PRATIYOGITA_GYAN_URL =
  import.meta.env.VITE_PRATIYOGITA_GYAN_URL || "https://pratiyogitagyan.vercel.app";

const HeroSection = () => {
  const [stats, setStats] = React.useState(defaultStats);

  React.useEffect(() => {
    let isMounted = true;
    async function fetchLiveStats() {
      try {
        const res = await fetch(`${PRATIYOGITA_YOGYA_URL}/api/exams/catalog`);
        if (res.ok) {
          const data = await res.json();
          const categoryCount = Object.keys(data).length;
          let totalCount = 0;
          Object.values(data).forEach((arr) => {
            if (Array.isArray(arr)) totalCount += arr.length;
          });

          if (isMounted && categoryCount > 0) {
            setStats((prev) =>
              prev.map((s) => {
                if (s.key === "categories") {
                  return { ...s, value: `${categoryCount}+` };
                }
                if (s.key === "exams" && totalCount > 0) {
                  return { ...s, value: `${totalCount.toLocaleString()}+` };
                }
                return s;
              })
            );
          }
        }
      } catch {
        // Keep resilient default values
      }
    }

    fetchLiveStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="relative overflow-hidden py-14 sm:py-20">
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
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#FBF6EE] leading-tight tracking-tight"
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
            className="mt-8 lg:mt-10 flex flex-row gap-2 sm:gap-6 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <a
              href={`${PRATIYOGITA_YOGYA_URL}/check-eligibility`}
              className="bubble-btn flex flex-col items-center gap-0.5 whitespace-nowrap"
            >
              <span className="font-bold text-xs sm:text-sm">Check Now</span>
              <span className="text-[10px] sm:text-[11px] font-normal opacity-90">Know your Eligibility</span>
            </a>
            <span
              className="bubble-btn bubble-btn-outline flex flex-col items-center gap-0.5 whitespace-nowrap relative cursor-default"
              style={{ opacity: 0.5, pointerEvents: "none" }}
            >
              <span className="font-bold text-xs sm:text-sm">Explore</span>
              <span className="text-[10px] sm:text-[11px] font-normal opacity-90">Explore Mindmaps</span>
              <span className="absolute -top-2 -right-2 text-[7px] sm:text-[8px] font-bold uppercase tracking-wider bg-[#E4572E]/25 text-[#E4572E] px-1.5 py-0.5 rounded-full border border-[#E4572E]/30">
                Soon
              </span>
            </span>
            <a
              href={PRATIYOGITA_GYAN_URL}
              className="bubble-btn bubble-btn-outline flex flex-col items-center gap-0.5 whitespace-nowrap"
            >
              <span className="font-bold text-xs sm:text-sm">Chat with AI</span>
              <span className="text-[10px] sm:text-[11px] font-normal opacity-90">Chat with Gyan</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 max-w-3xl mx-auto gap-3.5 sm:gap-5">
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
              <div className="relative z-10 flex flex-col items-center gap-1.5 py-4 px-3">
                <span
                  className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-none"
                  style={{ color: stat.textColor, fontVariantNumeric: "tabular-nums" }}
                >
                  {stat.value}
                </span>
                <span className="text-xs sm:text-sm text-[#E8D8C3]/80 text-center leading-tight font-semibold uppercase tracking-wider mt-1">
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
