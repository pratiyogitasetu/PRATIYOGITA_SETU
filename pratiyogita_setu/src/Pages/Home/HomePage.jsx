import React from "react";
import HeroSection from "../../Components/Home/HeroSection";
import BackedBySection from "../../Components/Home/BackedBySection";
import FeatureSection from "../../Components/Home/FeatureSection";
import FAQSection from "../../Components/Home/FAQSection";
import WhoIsItFor from "../../Components/Home/WhoIsItFor/whoisitfor.jsx";
import ProblemSection from "../../Components/Home/ProblemSection";
import HowItWorksNew from "../../Components/Home/HowItWorksNew";

const HomePage = () => {
  return (
    <div className="pt-16">
      {/* <div className="bg-blue-500 xs:bg-red-500 sm:bg-green-500">
        Resize me!
      </div> */}

      <HeroSection />
      <BackedBySection />
      <ProblemSection />

      <FeatureSection />
      <HowItWorksNew />
      <WhoIsItFor />
      {/* <StatsSection />
      <TestimonialSection /> */}
      <FAQSection />
    </div>
  );
};

export default HomePage;
