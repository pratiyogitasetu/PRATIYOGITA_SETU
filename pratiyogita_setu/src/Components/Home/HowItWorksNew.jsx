"use client";

import React, { useEffect, useRef, useState, useId } from "react";
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

const BeamPath = ({ d, delay = 0 }) => {
  const gradientId = useId();

  return (
    <>
      <path
        d={d}
        stroke="#E4572E"
        strokeWidth="2"
        strokeOpacity="0.18"
        strokeLinecap="round"
        fill="none"
      />
      <motion.path
        d={d}
        stroke={`url(#${gradientId})`}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0.2, opacity: 0.35 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay }}
      />
      <defs>
        <motion.linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          initial={{ x1: "0%", x2: "20%", y1: "0%", y2: "0%" }}
          animate={{ x1: ["0%", "100%"], x2: ["20%", "120%"], y1: ["0%", "0%"], y2: ["0%", "0%"] }}
          transition={{ duration: 2.6, delay, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.4 }}
        >
          <stop offset="0%" stopColor="#E4572E" stopOpacity="0" />
          <stop offset="35%" stopColor="#F3A712" stopOpacity="1" />
          <stop offset="70%" stopColor="#E4572E" stopOpacity="1" />
          <stop offset="100%" stopColor="#E4572E" stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </>
  );
};

const HowItWorksNew = () => {
  const sectionRef = useRef(null);
  const beamContainerRef = useRef(null);
  const cardRefs = useRef([]);
  const [beamData, setBeamData] = useState({ width: 0, height: 0, paths: [] });
  const inView = useInView(sectionRef, { once: true, amount: 0.25 });

  useEffect(() => {
    const updateBeamPaths = () => {
      if (!beamContainerRef.current || cardRefs.current.length !== steps.length) {
        return;
      }

      const containerRect = beamContainerRef.current.getBoundingClientRect();
      const isDesktop = window.innerWidth >= 768;

      const nextPaths = cardRefs.current.slice(0, -1).map((card, index) => {
        const nextCard = cardRefs.current[index + 1];

        if (!card || !nextCard) {
          return "";
        }

        const fromRect = card.getBoundingClientRect();
        const toRect = nextCard.getBoundingClientRect();

        if (isDesktop) {
          const startX = fromRect.right - containerRect.left - 18;
          const startY = fromRect.top - containerRect.top + fromRect.height * 0.42;
          const endX = toRect.left - containerRect.left + 18;
          const endY = toRect.top - containerRect.top + toRect.height * 0.42;
          const controlX = (startX + endX) / 2;
          const controlY = Math.min(startY, endY) - 46;

          return `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`;
        }

        const startX = fromRect.left - containerRect.left + fromRect.width / 2;
        const startY = fromRect.bottom - containerRect.top - 12;
        const endX = toRect.left - containerRect.left + toRect.width / 2;
        const endY = toRect.top - containerRect.top + 12;
        const controlX = startX + (endX - startX) * 0.18;
        const controlY = (startY + endY) / 2;

        return `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`;
      }).filter(Boolean);

      setBeamData({
        width: containerRect.width,
        height: containerRect.height,
        paths: nextPaths,
      });
    };

    const resizeObserver = new ResizeObserver(updateBeamPaths);

    if (beamContainerRef.current) {
      resizeObserver.observe(beamContainerRef.current);
    }

    cardRefs.current.forEach((card) => {
      if (card) {
        resizeObserver.observe(card);
      }
    });

    updateBeamPaths();
    window.addEventListener("resize", updateBeamPaths);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateBeamPaths);
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">

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
          className="text-xl sm:text-2xl md:text-3xl font-bold text-[#FBF6EE]"
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
      <div ref={beamContainerRef} className="relative max-w-5xl mx-auto">

        {beamData.paths.length > 0 && (
          <svg
            className="pointer-events-none absolute inset-0 z-0 overflow-visible"
            width={beamData.width}
            height={beamData.height}
            viewBox={`0 0 ${beamData.width} ${beamData.height}`}
            fill="none"
            aria-hidden="true"
          >
            {beamData.paths.map((path, index) => (
              <BeamPath key={`${index}-${path}`} d={path} delay={0.5 + index * 0.2} />
            ))}
          </svg>
        )}

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              custom={i}
              variants={cardVariant}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              ref={(element) => {
                cardRefs.current[i] = element;
              }}
              className="relative z-10 flex flex-col items-center text-center
                         bg-[#FBF6EE] rounded-2xl border border-[#E4572E]/25 shadow-[0_24px_60px_rgba(228,87,46,0.12)]
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
              {/* Title */}
              <h3 className="text-lg sm:text-xl font-bold text-[#2B1E17]">{step.title}</h3>

              {/* Divider */}
              <div className="w-8 h-0.5 rounded-full bg-[#E4572E]/50" />

              {/* Description */}
              <p className="text-sm sm:text-base text-[#2B1E17]/70 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default HowItWorksNew;
