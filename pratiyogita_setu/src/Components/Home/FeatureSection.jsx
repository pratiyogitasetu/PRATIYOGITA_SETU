import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const features = [
  {
    id: "pratiyogita-yogya",
    title: "Pratiyogita Yogya",
    tagline: "Can I compete?",
    description:
      "Instantly check your eligibility for government exams. Get personalized exam matches based on your qualifications and stay updated with the latest criteria.",
    logo: "/logos/py.png",
    alt: "Pratiyogita Yogya",
    link: "https://pratiyogitayogya.vercel.app",
    comingSoon: false,
    accent: "#E4572E",
    gridItems: [
      {
        title: "Exam-Based Eligibility Check",
        desc: "Select a specific exam and check if you're eligible based on age, education, category, domicile, and more.",
        hasVisual: true,
      },
      {
        title: "Profile-Based Exam Finder",
        desc: "Enter your profile once and find ALL government exams you're eligible for at once.",
      },
      {
        title: "Multi-Level Education Table",
        desc: "Enter education details across all levels — Post Doc to 5th Class — with course, subject, marks, and status.",
      },
      {
        title: "Category-Wise Filter & Results",
        desc: "Filter exams by category (UPSC, SSC, Railway, Defence) and see category-specific eligibility for GEN/OBC/SC/ST/EWS.",
      },
      {
        title: "Division & Post-Level Checking",
        desc: "For exams with multiple posts (e.g. NDA Army vs Navy), check eligibility for each division separately.",
      },
      {
        title: "PDF Report Download",
        desc: "Download your complete eligibility results as a formatted PDF document for offline reference.",
      },
    ],
  },
  {
    id: "pratiyogita-marg",
    title: "Pratiyogita Marg",
    tagline: "What should I study?",
    description:
      "Navigate your preparation with visual learning paths, interactive mindmaps, and custom study plans. Track your progress and celebrate milestones.",
    logo: "/logos/pm.png",
    alt: "Pratiyogita Marg",
    link: null,
    comingSoon: true,
    accent: "#E4572E",
    gridItems: [
      {
        title: "Exam Catalog Explorer",
        desc: "Browse all exams organized by categories with search and filter — find your exam's syllabus mindmap instantly.",
        hasVisual: true,
      },
      {
        title: "Interactive Mindmap Editor",
        desc: "Create and edit syllabus mindmaps with a full node-based editor — drag, connect, and customize nodes.",
      },
      {
        title: "Mindmap Viewer",
        desc: "View published syllabus mindmaps in a clean read-only mode with zoom and pan controls.",
      },
      {
        title: "Node Customization",
        desc: "Customize node styles, colors, shapes, connectors, and edge settings for each mindmap element.",
      },
      {
        title: "Auto-Save & Storage",
        desc: "Mindmaps auto-save at configurable intervals and are stored and synced via the backend API.",
      },
      {
        title: "Export Mindmaps",
        desc: "Export completed mindmaps as images or shareable formats for offline study and revision.",
      },
    ],
  },
  {
    id: "pratiyogita-gyan",
    title: "Pratiyogita Gyan",
    tagline: "Explain it to me!",
    description:
      "Your 24/7 AI study companion. Get instant explanations of NCERT concepts, practice previous year questions, and receive topic-wise AI feedback.",
    logo: "/logos/pg.png",
    alt: "Pratiyogita Gyan",
    link: "https://pratiyogitagyan.vercel.app",
    comingSoon: false,
    accent: "#E4572E",
    gridItems: [
      {
        title: "AI Chatbot",
        desc: "24/7 AI-powered chat for any study question — supports NCERT concepts, current affairs, and exam prep topics.",
        hasVisual: true,
      },
      {
        title: "PYQ Section",
        desc: "Side panel showing Previous Year Questions relevant to your current chat topic, organized exam-wise.",
      },
      {
        title: "PYQ Practice Mode",
        desc: "Dedicated practice mode to attempt previous year questions with detailed solutions and explanations.",
      },
      {
        title: "Quiz Section",
        desc: "AI-generated quizzes for self-assessment with instant scoring and topic-wise performance feedback.",
      },
      {
        title: "User Dashboard",
        desc: "Analytics dashboard showing your chat history, study patterns, and preparation progress tracking.",
      },
      {
        title: "Chat History Sync",
        desc: "All conversations saved and synced via Firebase authentication — guest mode also supported with local storage.",
      },
    ],
  },
];

/* ── Bento Grid Component (text-based cards like reference) ── */
const BentoGrid = ({ feature }) => {
  const items = feature.gridItems;

  const cardBase = {
    background: "rgba(30, 30, 36, 0.7)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(8px)",
  };

  const cardHover = {
    borderColor: "rgba(228,87,46,0.3)",
    boxShadow: "0 0 20px rgba(228,87,46,0.06)",
  };

  return (
    <div
      className="grid gap-3 sm:gap-4 w-full"
      style={{
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "auto auto auto",
      }}
    >
      {/* ── Card 0: Large card (top-left, spans 1 col × 2 rows) ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        whileHover={cardHover}
        className="rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300"
        style={{
          gridColumn: "1 / 2",
          gridRow: "1 / 3",
          ...cardBase,
        }}
      >
        <div>
          <h4 className="text-[#FBF6EE] font-bold text-base sm:text-lg mb-2">
            {items[0].title}
          </h4>
          <p className="text-[#E8D8C3]/55 text-xs sm:text-sm leading-relaxed mb-4">
            {items[0].desc}
          </p>
        </div>
        {/* Visual placeholder area (like the chart in the reference) */}
        <div
          className="rounded-xl flex items-center justify-center mt-auto"
          style={{
            background: "rgba(20, 20, 26, 0.8)",
            border: "1px solid rgba(255,255,255,0.06)",
            minHeight: "120px",
            padding: "16px",
          }}
        >
          <img
            src={feature.logo}
            alt={feature.alt}
            className="w-14 h-14 object-contain"
            style={{ opacity: 0.5, filter: "grayscale(0.3)" }}
          />
        </div>
      </motion.div>

      {/* ── Card 1: Top-center ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.18 }}
        whileHover={cardHover}
        className="rounded-2xl p-5 sm:p-6 transition-all duration-300"
        style={{
          gridColumn: "2 / 3",
          gridRow: "1 / 2",
          ...cardBase,
        }}
      >
        <h4 className="text-[#FBF6EE] font-bold text-base sm:text-lg mb-2">
          {items[1].title}
        </h4>
        <p className="text-[#E8D8C3]/55 text-xs sm:text-sm leading-relaxed">
          {items[1].desc}
        </p>
      </motion.div>

      {/* ── Card 2: Top-right ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.24 }}
        whileHover={cardHover}
        className="rounded-2xl p-5 sm:p-6 transition-all duration-300"
        style={{
          gridColumn: "3 / 4",
          gridRow: "1 / 2",
          ...cardBase,
        }}
      >
        <h4 className="text-[#FBF6EE] font-bold text-base sm:text-lg mb-2">
          {items[2].title}
        </h4>
        <p className="text-[#E8D8C3]/55 text-xs sm:text-sm leading-relaxed">
          {items[2].desc}
        </p>
      </motion.div>

      {/* ── Card 3: Middle-right (spans 2 cols) ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        whileHover={cardHover}
        className="rounded-2xl p-5 sm:p-6 transition-all duration-300"
        style={{
          gridColumn: "2 / 4",
          gridRow: "2 / 3",
          ...cardBase,
        }}
      >
        <h4 className="text-[#FBF6EE] font-bold text-base sm:text-lg mb-2">
          {items[3].title}
        </h4>
        <p className="text-[#E8D8C3]/55 text-xs sm:text-sm leading-relaxed">
          {items[3].desc}
        </p>
      </motion.div>

      {/* ── Card 4: Bottom-left (spans 2 cols) ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.36 }}
        whileHover={cardHover}
        className="rounded-2xl p-5 sm:p-6 transition-all duration-300"
        style={{
          gridColumn: "1 / 3",
          gridRow: "3 / 4",
          ...cardBase,
        }}
      >
        <h4 className="text-[#FBF6EE] font-bold text-base sm:text-lg mb-2">
          {items[4].title}
        </h4>
        <p className="text-[#E8D8C3]/55 text-xs sm:text-sm leading-relaxed">
          {items[4].desc}
        </p>
      </motion.div>

      {/* ── Card 5: Bottom-right ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.42 }}
        whileHover={cardHover}
        className="rounded-2xl p-5 sm:p-6 transition-all duration-300"
        style={{
          gridColumn: "3 / 4",
          gridRow: "3 / 4",
          ...cardBase,
        }}
      >
        <h4 className="text-[#FBF6EE] font-bold text-base sm:text-lg mb-2">
          {items[5].title}
        </h4>
        <p className="text-[#E8D8C3]/55 text-xs sm:text-sm leading-relaxed">
          {items[5].desc}
        </p>
      </motion.div>
    </div>
  );
};

/* ── Mobile Feature Card (simplified grid for small screens) ── */
const MobileFeatureCards = ({ feature }) => {
  const items = feature.gridItems;

  const cardBase = {
    background: "rgba(30, 30, 36, 0.7)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(8px)",
  };

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.06 }}
          className={`rounded-xl p-4 transition-all duration-300 ${i === 0 ? "col-span-2" : ""}`}
          style={cardBase}
        >
          <h4 className="text-[#FBF6EE] font-bold text-sm mb-1.5">
            {item.title}
          </h4>
          <p className="text-[#E8D8C3]/55 text-xs leading-relaxed">
            {item.desc}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

/* ── Single Feature Row (Desktop only) ── */
const FeatureRow = ({ feature, index }) => {
  const isReversed = index % 2 !== 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className={`flex flex-col ${
        isReversed ? "lg:flex-row-reverse" : "lg:flex-row"
      } items-center gap-8 lg:gap-14 mb-20 lg:mb-28`}
    >
      {/* ── Left: Text Content ── */}
      <div className="w-full lg:w-[35%] flex flex-col items-center lg:items-start text-center lg:text-left">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-5"
        >
          <div
            className="relative w-20 h-20 rounded-2xl flex items-center justify-center p-3"
            style={{
              background: "rgba(43,30,23,0.85)",
              border: "2px solid rgba(228,87,46,0.35)",
              boxShadow: "0 8px 32px rgba(228,87,46,0.15)",
            }}
          >
            <img
              src={feature.logo}
              alt={feature.alt}
              className="w-full h-full object-contain"
            />
          </div>
        </motion.div>

        {/* Title + Coming Soon badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex items-center gap-3 mb-2"
        >
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FBF6EE]">
            {feature.title}
          </h3>
          {feature.comingSoon && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E4572E]/20 text-[#E4572E] px-2.5 py-1 rounded-full border border-[#E4572E]/30 whitespace-nowrap">
              Coming Soon
            </span>
          )}
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-lg text-[#E4572E] font-semibold mb-4 italic"
        >
          "{feature.tagline}"
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="text-sm sm:text-base text-[#E8D8C3]/70 leading-relaxed mb-6 max-w-md"
        >
          {feature.description}
        </motion.p>

        {/* CTA Button */}
        {feature.comingSoon ? (
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm cursor-default"
            style={{
              background: "rgba(228,87,46,0.15)",
              color: "rgba(228,87,46,0.6)",
              border: "1px solid rgba(228,87,46,0.2)",
            }}
          >
            Coming Soon
          </motion.span>
        ) : (
          <motion.a
            href={feature.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-colors duration-300"
            style={{
              background: "#E4572E",
              color: "#FBF6EE",
              boxShadow: "0 4px 20px rgba(228,87,46,0.3)",
            }}
          >
            Try {feature.title}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </motion.a>
        )}
      </div>

      {/* ── Right: Bento Grid ── */}
      <div className="w-full lg:w-[65%]">
        <BentoGrid feature={feature} />
      </div>
    </motion.div>
  );
};

/* ── Mobile Tabbed View ── */
const MobileTabbedFeatures = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeFeature = features[activeIndex];

  return (
    <div className="lg:hidden">
      {/* ── Logo Tab Bar ── */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {features.map((feature, index) => (
          <motion.button
            key={feature.id}
            onClick={() => setActiveIndex(index)}
            whileTap={{ scale: 0.92 }}
            className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 ${
              activeIndex === index
                ? "bg-[#E4572E]/15 border-2 border-[#E4572E]/50 shadow-lg shadow-[#E4572E]/10"
                : "bg-[#1E1E24]/60 border-2 border-transparent hover:border-[#E4572E]/20"
            }`}
            style={{ minWidth: "90px" }}
          >
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center p-2 transition-all duration-300 ${
                activeIndex === index
                  ? "bg-[#2B1E17] shadow-md shadow-[#E4572E]/20"
                  : "bg-[#1E1E24]"
              }`}
              style={{
                border: activeIndex === index
                  ? "2px solid rgba(228,87,46,0.4)"
                  : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <img
                src={feature.logo}
                alt={feature.alt}
                className={`w-full h-full object-contain transition-all duration-300 ${
                  activeIndex === index ? "opacity-100" : "opacity-40"
                }`}
              />
            </div>
            <span
              className={`text-[10px] font-semibold leading-tight text-center transition-colors duration-300 ${
                activeIndex === index ? "text-[#E4572E]" : "text-[#E8D8C3]/40"
              }`}
            >
              {feature.title.split(" ")[1]}
            </span>
            {/* Coming Soon badge */}
            {feature.comingSoon && (
              <span className="absolute -top-1 -right-1 text-[7px] font-bold uppercase tracking-wider bg-[#E4572E]/25 text-[#E4572E] px-1.5 py-0.5 rounded-full border border-[#E4572E]/30">
                Soon
              </span>
            )}
            {/* Active indicator dot */}
            {activeIndex === index && (
              <motion.div
                layoutId="activeTabDot"
                className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#E4572E]"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* ── Active Feature Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFeature.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35 }}
        >
          {/* Feature Info */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <h3 className="text-2xl font-bold text-[#FBF6EE]">
                {activeFeature.title}
              </h3>
              {activeFeature.comingSoon && (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-[#E4572E]/20 text-[#E4572E] px-2 py-0.5 rounded-full border border-[#E4572E]/30">
                  Coming Soon
                </span>
              )}
            </div>
            <p className="text-base text-[#E4572E] font-semibold italic mb-3">
              "{activeFeature.tagline}"
            </p>
            <p className="text-sm text-[#E8D8C3]/70 leading-relaxed mb-5 max-w-md mx-auto">
              {activeFeature.description}
            </p>

            {/* CTA Button */}
            {activeFeature.comingSoon ? (
              <span
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm cursor-default"
                style={{
                  background: "rgba(228,87,46,0.15)",
                  color: "rgba(228,87,46,0.6)",
                  border: "1px solid rgba(228,87,46,0.2)",
                }}
              >
                Coming Soon
              </span>
            ) : (
              <motion.a
                href={activeFeature.link}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm transition-colors duration-300"
                style={{
                  background: "#E4572E",
                  color: "#FBF6EE",
                  boxShadow: "0 4px 20px rgba(228,87,46,0.3)",
                }}
              >
                Try {activeFeature.title}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </motion.a>
            )}
          </div>

          {/* Feature Grid Cards */}
          <MobileFeatureCards feature={activeFeature} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ── Main Feature Section ── */
const FeatureSection = () => {
  return (
    <section id="features" className="py-10 sm:py-16 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="text-center max-w-3xl mx-auto mb-14 lg:mb-20">
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
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#FBF6EE] tracking-tight"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Features
          </motion.h2>
        </div>

        {/* ── Mobile: Tabbed layout ── */}
        <MobileTabbedFeatures />

        {/* ── Desktop: Feature Rows (hidden on mobile) ── */}
        <div className="hidden lg:block">
          {features.map((feature, index) => (
            <FeatureRow key={feature.id} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
