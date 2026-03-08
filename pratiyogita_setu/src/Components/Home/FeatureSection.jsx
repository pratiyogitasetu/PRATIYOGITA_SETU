import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AUTO_ROTATE_MS = 6000;

const features = [
  {
    id: "pratiyogita-yogya",
    title: "Pratiyogita Yogya",
    tagline: "Can I compete?",
    badges: [
      "Eligibility Calculator",
      "Personalized Exam Match",
      "Filter by Qualification",
      "Latest Criteria Updates",
      "Save Favourite Exams",
    ],
    logo: "/logos/py.png",
    alt: "Pratiyogita Yogya",
    link: "https://pratiyogitayogya.vercel.app",
  },
  {
    id: "pratiyogita-marg",
    title: "Pratiyogita Marg",
    tagline: "What should I study?",
    badges: [
      "Visual Learning Paths",
      "Interactive Mindmaps",
      "Custom Study Plans",
      "Progress Tracking",
      "Milestone Achievements",
    ],
    logo: "/logos/pm.png",
    alt: "Pratiyogita Marg",
    link: "https://pratiyogitamarg.vercel.app",
  },
  {
    id: "pratiyogita-gyan",
    title: "Pratiyogita Gyan",
    tagline: "Explain it to me!",
    badges: [
      "AI Chatbot 24/7",
      "NCERT Concept Explainer",
      "Instant Q&A",
      "PYQ Practice",
      "Topic-wise AI Feedback",
    ],
    logo: "/logos/pg.png",
    alt: "Pratiyogita Gyan",
    link: "https://pratiyogita-gyan.vercel.app",
  },
];

const logoVariants = {
  enter:  { opacity: 0, scale: 0.6, y: -20 },
  center: { opacity: 1, scale: 1,   y: 0, transition: { duration: 0.55, ease: [0.34, 1.56, 0.64, 1] } },
  exit:   { opacity: 0, scale: 0.6, y: 20, transition: { duration: 0.35, ease: "easeIn" } },
};

const textVariants = {
  enter:  { opacity: 0, y: 24 },
  center: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] } },
  exit:   { opacity: 0, y: -16, transition: { duration: 0.3, ease: "easeIn" } },
};

const FeatureSection = () => {
  const [active, setActive] = useState(0);
  const [autorotate, setAutorotate] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!autorotate) return;
    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % features.length);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(intervalRef.current);
  }, [autorotate, active]);

  const handleSelect = (i) => {
    setActive(i);
    setAutorotate(false);
  };

  const f = features[active];

  // Cards distributed: left [col1=3, col2=2], right [col1=2, col2=3]
  const leftCol1 = [features[0], features[1], features[2]];
  const leftCol2 = [features[1], features[2]];
  const rightCol1 = [features[0], features[2]];
  const rightCol2 = [features[0], features[1], features[2]];

  const SideCard = ({ feat, delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="rounded-2xl flex flex-col items-center justify-center gap-2 p-3 w-[150px] h-[140px] xl:w-[170px] xl:h-[150px]"
      style={{
        background: "rgba(43,30,23,0.6)",
        border: "1px solid rgba(228,87,46,0.20)",
      }}
    >
      <img src={feat.logo} alt={feat.alt} className="object-contain" style={{ width: 60, height: 60 }} />
      <span className="text-[#E8D8C3]/70 text-[9px] xl:text-[10px] font-semibold text-center leading-tight">
        {feat.title.replace("Pratiyogita ", "")}
      </span>
    </motion.div>
  );

  return (
    <section id="features" className="py-10 sm:py-16 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <motion.span
            className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-[#E4572E] border border-[#E4572E]/40 rounded-full px-4 py-1 mb-4"
            style={{ backgroundColor: "rgba(228,87,46,0.08)" }}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            Solution
          </motion.span>
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-[#FBF6EE]"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Features
          </motion.h2>
        </div>

        {/* ── 3-column layout: side cards + center slider ── */}
        <div className="flex items-center justify-center gap-4 xl:gap-6">

          {/* ── Left side cards (hidden below xl) ── */}
          <div className="hidden xl:flex items-center gap-3 shrink-0">
            {/* col 1: 3 cards */}
            <div className="flex flex-col gap-3">
              {leftCol1.map((feat, i) => <SideCard key={i} feat={feat} delay={i * 0.1} />)}
            </div>
            {/* col 2: 2 cards (offset down) */}
            <div className="flex flex-col gap-3 mt-14">
              {leftCol2.map((feat, i) => <SideCard key={i} feat={feat} delay={0.15 + i * 0.1} />)}
            </div>
          </div>

        {/* ── Testimonial-style centered card ── */}
        <div className="relative mx-auto max-w-2xl flex-1 min-w-0">

          {/* Radial glow sphere — the circular backdrop */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 38%, rgba(228,87,46,0.22) 0%, rgba(228,87,46,0.08) 40%, transparent 72%)",
            }}
          />

          {/* Outer soft ring */}
          <div
            className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full pointer-events-none"
            style={{
              width: "480px",
              height: "480px",
              background:
                "radial-gradient(circle, rgba(228,87,46,0.10) 0%, transparent 70%)",
              top: "-40px",
            }}
          />

          {/* Progress bar at very top */}
          {autorotate && (
            <motion.div
              key={`bar-${active}`}
              className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-[#E4572E]"
              initial={{ width: "0%" }}
              animate={{ width: "60%" }}
              transition={{ duration: AUTO_ROTATE_MS / 1000, ease: "linear" }}
              style={{ zIndex: 10 }}
            />
          )}

          <div className="relative flex flex-col items-center text-center pt-12 pb-10 px-6 sm:px-10">

            {/* ── Logo circle (like testimonial avatar) ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`logo-${active}`}
                variants={logoVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="relative z-10 mb-8"
              >
                {/* Outer decorative ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    margin: "-8px",
                    border: "1.5px solid rgba(228,87,46,0.25)",
                    borderRadius: "9999px",
                  }}
                />
                <div
                  className="w-18 h-18 rounded-full flex items-center justify-center p-2"
                  style={{
                    background: "rgba(43,30,23,0.85)",
                    border: "2px solid rgba(228,87,46,0.35)",
                  }}
                >
                  <img src={f.logo} alt={f.alt} className="w-full h-full object-contain" />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* ── Quote / Description text ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${active}`}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="relative z-10"
              >
                {/* Feature badges */}
                <div className="flex flex-wrap justify-center gap-2 mb-7">
                  {f.badges.map((badge, bi) => (
                    <motion.span
                      key={badge}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 + bi * 0.07 }}
                      className="inline-block rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        background: "rgba(228,87,46,0.12)",
                        border: "1px solid rgba(228,87,46,0.30)",
                        color: "#E8D8C3",
                      }}
                    >
                      {badge}
                    </motion.span>
                  ))}
                </div>

                {/* CTA */}
                <a
                  href={f.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-xs transition-colors duration-200"
                  style={{
                    background: "rgba(228,87,46,0.15)",
                    border: "1px solid rgba(228,87,46,0.35)",
                    color: "#E4572E",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#E4572E";
                    e.currentTarget.style.color = "#FBF6EE";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(228,87,46,0.15)";
                    e.currentTarget.style.color = "#E4572E";
                  }}
                >
                  Try {f.title}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </motion.div>
            </AnimatePresence>

            {/* ── Pill tab buttons ── */}
            <div className="relative z-10 flex gap-2 sm:gap-3 justify-center flex-wrap mt-10">
              {features.map((feat, i) => (
                <button
                  key={feat.id}
                  onClick={() => handleSelect(i)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] sm:text-xs font-semibold transition-all duration-200"
                  style={
                    active === i
                      ? { background: "#E4572E", color: "#FBF6EE", border: "1px solid #E4572E" }
                      : {
                          background: "rgba(251,246,238,0.06)",
                          color: "rgba(232,216,195,0.65)",
                          border: "1px solid rgba(228,87,46,0.20)",
                        }
                  }
                  onMouseEnter={(e) => {
                    if (active !== i) {
                      e.currentTarget.style.background = "rgba(228,87,46,0.15)";
                      e.currentTarget.style.color = "#E4572E";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (active !== i) {
                      e.currentTarget.style.background = "rgba(251,246,238,0.06)";
                      e.currentTarget.style.color = "rgba(232,216,195,0.65)";
                    }
                  }}
                >
                  <img
                    src={feat.logo}
                    alt=""
                    className="w-4 h-4 object-contain"
                    style={active !== i ? { filter: "grayscale(0.5) opacity(0.6)" } : {}}
                  />
                  <span>{feat.title}</span>
                </button>
              ))}
            </div>

          </div>
        </div>{/* closes center card */}

          {/* ── Right side cards (hidden below xl) ── */}
          <div className="hidden xl:flex items-center gap-3 shrink-0">
            {/* col 1: 2 cards (offset down) */}
            <div className="flex flex-col gap-3 mt-14">
              {rightCol1.map((feat, i) => <SideCard key={i} feat={feat} delay={0.1 + i * 0.1} />)}
            </div>
            {/* col 2: 3 cards */}
            <div className="flex flex-col gap-3">
              {rightCol2.map((feat, i) => <SideCard key={i} feat={feat} delay={i * 0.1} />)}
            </div>
          </div>

        </div>{/* closes 3-column flex wrapper */}

      </div>
    </section>
  );
};

export default FeatureSection;
