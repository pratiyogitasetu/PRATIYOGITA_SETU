import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Highlighter } from "../../Components/ui/highlighter";

// ─── Animated counter hook ────────────────────────────────────────────────────
const useCountUp = (target, duration = 1800, active = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, active]);
  return count;
};





// ─── Exam logos carousel ───────────────────────────────────────────────────────
const examLogos = [
  { src: "/infinityimages/upsc.png",         alt: "UPSC" },
  { src: "/infinityimages/railways.png",     alt: "Railways" },
  { src: "/infinityimages/airforce.png",     alt: "Air Force" },
  { src: "/infinityimages/bsf.png",          alt: "BSF" },
  { src: "/infinityimages/csir.png",         alt: "CSIR" },
  { src: "/infinityimages/delhimetro.png",   alt: "Delhi Metro" },
  { src: "/infinityimages/air_authority.png",alt: "Air Authority" },
  { src: "/infinityimages/uppolice.png",     alt: "UP Police" },
];

const examScrollStyles = `
  @keyframes examScrollLeft {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-33.333%); }
  }
  .animate-exam-scroll {
    animation: examScrollLeft 12s linear infinite;
    display: flex;
    width: max-content;
  }
`;

const ExamCarousel = () => (
  <div className="w-full overflow-hidden mt-6">
    <style>{examScrollStyles}</style>
    <p className="text-xs font-bold mb-3 uppercase tracking-[0.18em] text-[#E4572E]">
      Supported Exams
    </p>
    <div className="relative overflow-hidden">
      {/* fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 z-10"
        style={{ background: "linear-gradient(to right, #FBF6EE, transparent)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 z-10"
        style={{ background: "linear-gradient(to left, #FBF6EE, transparent)" }} />
      <div className="animate-exam-scroll">
        {[0, 1, 2].map((copy) => (
          <div key={copy} className="flex items-center gap-12 px-8 flex-none">
            {examLogos.map((logo, i) => (
              <img
                key={`${copy}-${i}`}
                src={logo.src}
                alt={logo.alt}
                className="w-14 h-14 sm:w-18 sm:h-18 object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
                loading="lazy"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Typewriter headline ───────────────────────────────────────────────────────
const HEADLINE = "One Broken System.";
const TypewriterHeadline = ({ active }) => {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!active) return;
    let i = 0;
    const id = setInterval(() => {
      setDisplayed(HEADLINE.slice(0, i + 1));
      i++;
      if (i >= HEADLINE.length) clearInterval(id);
    }, 55);
    return () => clearInterval(id);
  }, [active]);
  return (
    <span>
      {displayed}
      {displayed.length < HEADLINE.length && active && (
        <span className="inline-block w-0.5 h-[1.1em] align-middle bg-[#E4572E] ml-0.5 animate-pulse" />
      )}
    </span>
  );
};

// ─── Floating stat card (overlaid on map) ─────────────────────────────────────
const FloatCard = ({ value, suffix, label, delay, floatDelay, active, style }) => {
  const count = useCountUp(value, 1800, active);
  return (
    <motion.div
      className="absolute z-20 flex flex-col bg-[#FBF6EE]/85 border border-[#E4572E]/25 rounded-2xl backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-3"
      style={style}
      initial={{ opacity: 0, scale: 0.8, y: 0 }}
      animate={active ? { opacity: 1, scale: 1, y: [0, -9, 0] } : {}}
      transition={{
        opacity:  { duration: 0.45, delay },
        scale:    { duration: 0.45, delay },
        y:        { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: floatDelay },
      }}
    >
      <span className="text-base sm:text-lg lg:text-xl font-extrabold text-[#E4572E] leading-none tabular-nums">
        {count}{suffix}
      </span>
      <span className="text-[9px] sm:text-[10px] font-semibold text-[#2B1E17]/65 mt-0.5 leading-tight">
        {label}
      </span>
    </motion.div>
  );
};

// ─── Map + overlaid stat cards ─────────────────────────────────────────────────
const MapWithStats = ({ active }) => {
  const [svgContent, setSvgContent] = useState("");
  useEffect(() => {
    fetch("/india.svg")
      .then((r) => r.text())
      .then((t) => setSvgContent(t.replace(/<\?xml[^?]*\?>\s*/, "")));
  }, []);

  return (
    <div className="relative w-full">
      {/* Map SVG */}
      <div className="india-map-container w-full mx-auto" dangerouslySetInnerHTML={{ __html: svgContent }} />

      {/* ── Floating stat cards at four corners ── */}
      <FloatCard value={3000} suffix="+" label="Competitive Exams"
        style={{ top: "12%",  left: "2%"  }} delay={0.5} floatDelay={0.0} active={active} />
      <FloatCard value={10}   suffix="M+" label="Aspirants / year"
        style={{ top: "12%",  right: "0%" }} delay={0.6} floatDelay={0.8} active={active} />
      <FloatCard value={6}    suffix="+"  label="Exam Domains"
        style={{ bottom: "10%", left: "2%"  }} delay={0.7} floatDelay={1.6} active={active} />
      <FloatCard value={100}  suffix="%"  label="AI-Powered"
        style={{ bottom: "10%", right: "0%" }} delay={0.8} floatDelay={2.4} active={active} />
    </div>
  );
};

// ─── Problem paragraphs ────────────────────────────────────────────────────────
const paragraphs = [
  {
    text: "Over 10 million Indian aspirants face fragmented, inefficient exam preparation systems. Eligibility confusion, static roadmaps, and unverified AI answers reduce preparation effectiveness.",
  },
  {
    text: "Students start with many possibilities, but without clarity, those possibilities fade over time. What remains is not always the right path — it is just the last visible one.",
  },
  {
    text: "Pratiyogita Setu is an All-in-One AI-powered Solution integrating eligibility intelligence, NCERT-Based learning, adaptive roadmaps, topic-wise PYQ practice, and performance analytics.",
    highlight: true,
  },
  {
    text: "The platform ensures structured, verified, efficient and data-driven preparation across all competitive exams.",
  },
];

// ─── Main section ─────────────────────────────────────────────────────────────
const ProblemSection = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.25 });

  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.14 } },
  };
  const paraVariant = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
  };

  return (
    <section ref={sectionRef} className="relative py-10 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="relative rounded-4xl overflow-hidden mx-auto bg-[#FBF6EE] max-w-screen-2xl">
        <div className="relative z-10 py-10 sm:py-8 px-4 sm:px-8 lg:px-12">

          {/* ── Section header ── */}
          <motion.div
            className="text-center mb-8 sm:mb-10"
            initial={{ opacity: 0, y: -16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-[#E4572E] border border-[#E4572E]/40 rounded-full px-4 py-1 mb-4 bg-[#E4572E]/8">
              The Problem
            </span>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-[#2B1E17] leading-tight">
              10+ Million Aspirants.{" "}
              <span className="text-[#E4572E]">
                <TypewriterHeadline active={isInView} />
              </span>
            </h2>
            {/* animated underline */}
            <motion.div
              className="mx-auto mt-3 h-0.5 rounded-full bg-[#E4572E]"
              initial={{ width: 0 }}
              animate={isInView ? { width: "5rem" } : {}}
              transition={{ duration: 0.7, delay: 0.5 }}
            />
          </motion.div>

          {/* ── Two-column layout ── */}
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* Left — India Map with overlaid stat cards */}
            <motion.div
              className="w-full lg:w-5/12 shrink-0 flex justify-center"
              initial={{ opacity: 0, x: -40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <MapWithStats active={isInView} />
            </motion.div>

            {/* Right — Text + Carousel */}
            <motion.div
              className="w-full lg:w-7/12 pr-0 lg:pr-6"
              variants={stagger}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              {/* First paragraph with highlighter */}
              <motion.p
                variants={paraVariant}
                className="text-xs sm:text-sm lg:text-base leading-relaxed text-[#2B1E17] mb-3"
              >
                Every year {" "}
                <Highlighter action="highlight" color="#E8D8C3">10 million Indian aspirants</Highlighter>
                {" "}prepare for competative exam, while preperation face fragmented, inefficient exam preparation systems. Eligibility confusion, static roadmaps, and unverified AI answers reduce preparation effectiveness.
              </motion.p>

              {paragraphs.slice(1).map((p, i) =>
                p.highlight ? (
                  <motion.div
                    key={i}
                    variants={paraVariant}
                    className="my-4 rounded-xl border-l-4 border-[#E4572E] bg-[#E4572E]/8 px-5 py-4"
                  >
                    <p className="text-xs sm:text-sm lg:text-base leading-relaxed text-[#2B1E17] font-semibold">
                      {p.text}
                    </p>
                  </motion.div>
                ) : (
                  <motion.p
                    key={i}
                    variants={paraVariant}
                    className="text-xs sm:text-sm lg:text-base leading-relaxed text-[#2B1E17] mb-3"
                  >
                    {p.text}
                  </motion.p>
                )
              )}

              <ExamCarousel />
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
