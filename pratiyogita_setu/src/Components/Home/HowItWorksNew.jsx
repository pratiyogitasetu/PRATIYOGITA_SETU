"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

const steps = [
  {
    logo: "/logos/py.png",
    alt:  "Pratiyogita Yogya",
    step: "01",
    title: "Pratiyogita Yogya",
    description: "Check your eligibility and remaining attempts for your target exam before investing time.",
  },
  {
    logo: "/logos/pm.png",
    alt:  "Pratiyogita Marg",
    step: "02",
    title: "Pratiyogita Marg",
    description: "Get a structured, topic-wise roadmap tailored to only the exams you qualify for.",
  },
  {
    logo: "/logos/pg.png",
    alt:  "Pratiyogita Gyan",
    step: "03",
    title: "Pratiyogita Gyan",
    description: "Practice PYQs and learn any topic instantly with our AI-powered chatbot.",
  },
];

const cardVariant = {
  hidden: { opacity: 0, y: 28 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.18 } }),
};

const HowItWorksNew = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <section ref={ref} className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">

      {/* ── Header ── */}
      <div className="text-center mb-12 sm:mb-16">

        {/* Tagline badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45 }}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold
                     text-[#E4572E] border border-[#E4572E]/35 rounded-full
                     px-4 py-1.5 mb-5 bg-[#E4572E]/8 flex-wrap justify-center"
        >
          <span>Yogya = <em>Can I?</em></span>
          <span className="opacity-50">→</span>
          <span>Marg = <em>What to study?</em></span>
          <span className="opacity-50">→</span>
          <span>Gyan = <em>Teach me.</em></span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#FBF6EE]"
        >
          How It Works
        </motion.h2>

        {/* Animated underline */}
        <motion.div
          className="mx-auto mt-3 h-0.5 rounded-full bg-[#E4572E]"
          initial={{ width: 0 }}
          animate={inView ? { width: "4rem" } : {}}
          transition={{ duration: 0.6, delay: 0.35 }}
        />
      </div>

      {/* ── 3 boxes + connector line ── */}
      <div className="relative max-w-5xl mx-auto">

        {/* Horizontal connector line — visible on md+ */}
        <div className="hidden md:block absolute top-[88px] left-[calc(16.6%+16px)] right-[calc(16.6%+16px)] h-px bg-[#E4572E]/30 z-0" />

        {/* Animated dot traveling along the line */}
        <motion.div
          className="hidden md:block absolute top-[84px] w-2.5 h-2.5 rounded-full bg-[#E4572E] z-10"
          initial={{ left: "calc(16.6% + 16px)" }}
          animate={inView ? { left: "calc(83.4% - 16px)" } : {}}
          transition={{ duration: 2.2, delay: 0.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.5 }}
        />

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              custom={i}
              variants={cardVariant}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              className="relative z-10 flex flex-col items-center text-center
                         bg-[#FBF6EE] rounded-2xl border border-[#E4572E]/25
                         px-6 py-8 gap-4"
            >
              {/* Step number */}
              <span className="absolute top-4 right-5 text-xs font-bold text-[#E4572E]/40 tracking-widest">
                {step.step}
              </span>

              {/* Logo */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                <img src={step.logo} alt={step.alt} className="w-full h-full object-contain" />
              </div>

              {/* Connector arrow between cards — mobile only */}
              {i < steps.length - 1 && (
                <div className="md:hidden flex justify-center w-full mt-1">
                  {/* arrow rendered after card via sibling — handled below */}
                </div>
              )}

              {/* Title */}
              <h3 className="text-lg sm:text-xl font-bold text-[#2B1E17]">{step.title}</h3>

              {/* Divider */}
              <div className="w-8 h-0.5 rounded-full bg-[#E4572E]/50" />

              {/* Description */}
              <p className="text-sm sm:text-base text-[#2B1E17]/70 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Mobile vertical connectors between cards */}
        <div className="md:hidden flex flex-col items-center -mt-3 mb-1 gap-0">
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.4 + i * 0.2 }}
            >
              {/* This renders BETWEEN grid rows — but since grid stacks naturally, we overlay arrows using absolute positioning trick below */}
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default HowItWorksNew;
