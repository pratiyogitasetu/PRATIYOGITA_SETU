"use client";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Briefcase,
  BookOpen,
  Target,
  Clock,
  School,
  Users,
  Compass,
  Building2,
  Palette,
} from "lucide-react";

const leftAudience = [
  {
    icon: Target,
    title: "Competitive Exam Aspirants",
    tags: "UPSC, SSC, Banking, Defence, Railways",
    description: "Check eligibility, plan roadmaps, resolve doubts, PYQ practice.",
    color: "#E4572E",
  },
  {
    icon: GraduationCap,
    title: "College Students (UG/PG)",
    tags: "Discover exams early",
    description: "Discover exams based on degree, age & category. Start early prep.",
    color: "#E8D8C3",
  },
  {
    icon: BookOpen,
    title: "School Students (6–12)",
    tags: "Build strong foundations",
    description: "Build NCERT foundations, practice PYQs, develop exam awareness.",
    color: "#FBF6EE",
  },
  {
    icon: Briefcase,
    title: "Working Professionals",
    tags: "Time-efficient prep",
    description: "Quickly assess eligibility, calculate attempts, focused study.",
    color: "#E4572E",
  },
  {
    icon: Clock,
    title: "Full-time Aspirants",
    tags: "Structured & tracked prep",
    description: "Structured syllabus visualization, track progress, AI answers.",
    color: "#E8D8C3",
  },
];

const rightAudience = [
  {
    icon: School,
    title: "Coaching Institutes",
    tags: "Eligibility verification",
    description: "Recommend platform for eligibility verification & self-study.",
    color: "#E8D8C3",
  },
  {
    icon: Users,
    title: "Parents & Guardians",
    tags: "Track child's progress",
    description: "Gain clarity on child's qualified exams. Track preparation.",
    color: "#FBF6EE",
  },
  {
    icon: Compass,
    title: "Career Counselors",
    tags: "Profile-based advice",
    description: "Use eligibility engine for exam advice by age & education.",
    color: "#E4572E",
  },
  {
    icon: Building2,
    title: "Exam Conducting Bodies",
    tags: "Reduce ineligible apps",
    description: "Aspirants pre-check eligibility before applying to exams.",
    color: "#E8D8C3",
  },
  {
    icon: Palette,
    title: "Content Creators",
    tags: "Visual syllabus tools",
    description: "Use Marg's mind-map builder. Share visual syllabus roadmaps.",
    color: "#FBF6EE",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: "easeOut" },
  }),
};

function AudienceCard({ item, index, side }) {
  const Icon = item.icon;
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={`group flex items-start gap-3 p-3 rounded-xl bg-[#2B1E17]/55 border border-[#E4572E]/18 hover:border-[#E4572E]/50 hover:bg-[#2B1E17]/75 transition-all duration-300 ${
        side === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <div
        className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${item.color}20`, border: `1px solid ${item.color}40` }}
      >
        <Icon className="w-8 h-8 md:w-10 md:h-10" style={{ color: item.color }} />
      </div>
      <div className="min-w-0">
        <h4 className="text-base md:text-lg font-extrabold text-[#FBF6EE] leading-tight">{item.title}</h4>
        <p className="text-sm md:text-base text-[#E8D8C3] mt-2 font-semibold leading-relaxed">{item.description}</p>
      </div>
    </motion.div>
  );
}

export default function WhoIsItFor() {
  return (
    <section className="py-16 md:py-20 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <motion.div
          className="text-center mb-10 md:mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E4572E]/10 border border-[#E4572E]/35 mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <span className="w-2 h-2 rounded-full bg-[#E4572E] animate-pulse" />
            <span className="text-sm font-semibold text-[#E4572E]">
              Target Audience
            </span>
          </motion.div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#FBF6EE] mb-4">
            Who Is{" "}
            <span className="bg-gradient-to-r from-[#E4572E] to-[#cf4a23] bg-clip-text text-transparent">
              Pratiyogita Setu
            </span>{" "}
            For?
          </h2>
          
        </motion.div>

        {/* Desktop: 5 left + 5 right */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-5">
          <div className="flex flex-col gap-3">
            {leftAudience.map((item, i) => (
              <AudienceCard key={item.title} item={item} index={i} side="left" />
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {rightAudience.map((item, i) => (
              <AudienceCard key={item.title} item={item} index={i} side="right" />
            ))}
          </div>
        </div>

        {/* Mobile/Tablet: Stacked */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...leftAudience, ...rightAudience].map((item, i) => (
            <AudienceCard key={item.title} item={item} index={i} side="left" />
          ))}
        </div>
      </div>
    </section>
  );
}