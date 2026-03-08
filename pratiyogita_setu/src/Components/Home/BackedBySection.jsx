import React from "react";
import { motion } from "framer-motion";

const BackedBySection = () => {
  return (
    <section className="relative py-10 sm:py-14">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row items-center justify-center gap-8 sm:gap-20 lg:gap-36">

          {/* Backed by — Microsoft */}
          <motion.div
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="text-xs uppercase tracking-widest text-[#E8D8C3]/55 font-semibold">
              Backed by
            </span>
            <img
              src="/microsoft.png"
              alt="Microsoft for Startups"
              className="h-20 sm:h-44 w-auto object-contain"
              style={{ filter: "brightness(0) invert(1)", opacity: 0.9 }}
            />
          </motion.div>

          {/* Divider */}
          <div className="block w-px h-12 sm:h-16 bg-[#E4572E]/25" />

          {/* Featured on — NxtWave */}
          <motion.div
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <span className="text-xs uppercase tracking-widest text-[#E8D8C3]/55 font-semibold">
              Featured on
            </span>
            <img
              src="/nxtwave.png"
              alt="NxtWave"
              className="h-20 sm:h-44 w-auto object-contain"
              style={{ filter: "brightness(0) invert(1)", opacity: 0.9 }}
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default BackedBySection;
