import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

const Footer = () => {
  const { theme, language } = useTheme();
  const isDark = theme === "dark";
  const currentYear = new Date().getFullYear();

  const PRATIYOGITA_SETU_URL = import.meta.env.VITE_PRATIYOGITA_SETU_URL || "https://psetu.com/";
  const PRATIYOGITA_YOGYA_URL = import.meta.env.VITE_PRATIYOGITA_YOGYA_URL || "https://yogya.psetu.com/";
  const PRATIYOGITA_MARG_URL = import.meta.env.VITE_PRATIYOGITA_MARG_URL || "https://marg.psetu.com/";
  const PRATIYOGITA_GYAN_URL = import.meta.env.VITE_PRATIYOGITA_GYAN_URL || "https://gyan.psetu.com/";

  return (
    <footer className="w-full relative overflow-hidden" style={{background: 'linear-gradient(to top, rgba(249,115,22,0.18) 60%, transparent 100%)'}}>
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 md:py-10">
        {/* Two-column layout: Our Services | About Us */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

          {/* Left Column - Our Services */}
          <div>
            <div className="inline-block bg-orange-500 rounded-lg px-3 py-1 mb-5">
              <h3 className="text-sm sm:text-base font-semibold text-white">
                {language === "en" ? "Our Services" : "हमारी सेवाएं"}
              </h3>
            </div>

            <div className="space-y-5">
              {/* Pratiyogita Yogya */}
              <div>
                <a href={PRATIYOGITA_YOGYA_URL} className="flex items-center gap-2 mb-1.5">
                  <img src="/logos/py.png" alt="Pratiyogita Yogya" className="h-10 sm:h-12 w-auto object-contain" />
                  <span className="text-base sm:text-lg font-bold text-white">Pratiyogita Yogya</span>
                </a>
                <p className="text-sm text-white/70 leading-relaxed text-justify">
                  {language === "en"
                    ? "Exam eligibility and attempts calculator providing personalized insights based on age, education, and criteria for competitive exams."
                    : "प्रतियोगी परीक्षाओं के लिए आयु, शिक्षा और मानदंडों के आधार पर व्यक्तिगत जानकारी प्रदान करने वाला परीक्षा पात्रता और प्रयास कैलकुलेटर।"}
                </p>
              </div>

              {/* Pratiyogita Marg */}
              <div>
                <a href={PRATIYOGITA_MARG_URL} className="flex items-center gap-2 mb-1.5">
                  <img src="/logos/pm.png" alt="Pratiyogita Marg" className="h-10 sm:h-12 w-auto object-contain" />
                  <span className="text-base sm:text-lg font-bold text-white">Pratiyogita Marg</span>
                </a>
                <p className="text-sm text-white/70 leading-relaxed text-justify">
                  {language === "en"
                    ? "Guided path to competitive exam success with Subject - Expert roadmaps, best practices, and essential study materials."
                    : "विषय-विशेषज्ञ रोडमैप, सर्वोत्तम प्रथाओं और आवश्यक अध्ययन सामग्री के साथ प्रतियोगी परीक्षा सफलता का मार्गदर्शित पथ।"}
                </p>
              </div>

              {/* Pratiyogita Gyan */}
              <div>
                <a href={PRATIYOGITA_GYAN_URL} className="flex items-center gap-2 mb-1.5">
                  <img src="/logos/pg.png" alt="Pratiyogita Gyan" className="h-10 sm:h-12 w-auto object-contain" />
                  <span className="text-base sm:text-lg font-bold text-white">Pratiyogita Gyan</span>
                </a>
                <p className="text-sm text-white/70 leading-relaxed text-justify">
                  {language === "en"
                    ? "AI-powered chatbot with all necessary books, references, and explanations for competitive exam preparation."
                    : "प्रतियोगी परीक्षा की तैयारी के लिए सभी आवश्यक पुस्तकों, संदर्भों और स्पष्टीकरणों के साथ AI-संचालित चैटबॉट।"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - About Us */}
          <div>
            <div className="inline-block bg-orange-500 rounded-lg px-3 py-1 mb-5">
              <h3 className="text-sm sm:text-base font-semibold text-white">
                {language === "en" ? "About Us" : "हमारे बारे में"}
              </h3>
            </div>

            {/* Pariksha Setu logo + description */}
            <div className="mb-4">
              <Link to="/" className="flex items-center gap-2 mb-2">
                <img src="/logos/ps.png" alt="Pariksha Setu" className="h-10 sm:h-12 w-auto object-contain" />
                <span className="text-base sm:text-lg font-bold text-white">Pariksha Setu</span>
              </Link>
              <p className="text-sm text-white/70 leading-relaxed text-justify">
                {language === "en"
                  ? "One-stop platform for competitive exam aspirants, offering a personalized exam eligibility and attempts calculator, an AI-powered chatbot with essential books and explanations, and a structured roadmap with best practices and study resources."
                  : "प्रतियोगी परीक्षा के उम्मीदवारों के लिए एक-स्थान मंच, जो व्यक्तिगत परीक्षा पात्रता और प्रयास कैलकुलेटर, आवश्यक पुस्तकों और स्पष्टीकरणों के साथ AI-संचालित चैटबॉट, और सर्वोत्तम प्रथाओं और अध्ययन संसाधनों के साथ एक संरचित रोडमैप प्रदान करता है।"}
              </p>
            </div>

            {/* Support email */}
            <div className="flex flex-wrap items-center gap-1.5 mb-5">
              <span className="text-sm text-white/50">
                {language === "en" ? "For help and support:" : "सहायता के लिए:"}
              </span>
              <a href="mailto:askparikshasetu@gmail.com" className="text-orange-400 hover:underline text-sm">
                askparikshasetu@gmail.com
              </a>
            </div>

            {/* Connect With Us */}
            <div className="inline-block bg-orange-500 rounded-lg px-3 py-1 mb-4">
              <h3 className="text-sm sm:text-base font-semibold text-white">
                {language === "en" ? "Connect With Us" : "हमसे जुड़ें"}
              </h3>
            </div>

            {/* Social Media Icons */}
            <div className="flex flex-wrap gap-3 sm:gap-4 mb-5">
              <a href="mailto:askparikshasetu@gmail.com" className="text-white/50 hover:text-indigo-400 transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                  <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                </svg>
              </a>
              <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-blue-400 transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-pink-400 transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.508-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.247-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428.254-.66.599-1.216 1.153-1.772.5-.508 1.105-.902 1.772-1.153.637-.247 1.363-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.8c-2.67 0-2.986.01-4.04.059-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.041 0 2.67.01 2.986.058 4.04.045.977.207 1.505.344 1.858.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058 2.67 0 2.986-.01 4.04-.058.977-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041 0-2.67-.01-2.986-.058-4.04-.045-.977-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15c-.35-.35-.683-.566-1.15-.748-.353-.137-.882-.3-1.857-.344-1.055-.048-1.37-.058-4.041-.058zm0 3.1a5.1 5.1 0 110 10.2 5.1 5.1 0 010-10.2zm0 8.4a3.3 3.3 0 100-6.6 3.3 3.3 0 000 6.6zm6.4-8.63a1.19 1.19 0 11-2.38 0 1.19 1.19 0 012.38 0z" />
                </svg>
              </a>
            </div>

            {/* Nav Links */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link to="/" className="text-white/70 hover:text-orange-400 hover:underline transition-colors">
                {language === "en" ? "Home" : "होम"}
              </Link>
              <a href={PRATIYOGITA_SETU_URL} className="text-white/70 hover:text-orange-400 hover:underline transition-colors">
                {language === "en" ? "Pratiyogita Setu" : "प्रतियोगिता सेतु"}
              </a>
              <a href={PRATIYOGITA_YOGYA_URL} className="text-white/70 hover:text-orange-400 hover:underline transition-colors">
                {language === "en" ? "Pratiyogita Yogya" : "प्रतियोगिता योग्य"}
              </a>
              <a href={PRATIYOGITA_MARG_URL} className="text-white/70 hover:text-orange-400 hover:underline transition-colors">
                {language === "en" ? "Pratiyogita Marg" : "प्रतियोगिता मार्ग"}
              </a>
              <a href={PRATIYOGITA_GYAN_URL} className="text-white/70 hover:text-orange-400 hover:underline transition-colors">
                {language === "en" ? "Pratiyogita Gyan" : "प्रतियोगिता ज्ञान"}
              </a>
              <Link to="/about" className="text-white/70 hover:text-orange-400 hover:underline transition-colors">
                {language === "en" ? "About Us" : "हमारे बारे में"}
              </Link>
              <Link to="/contribution" className="text-white/70 hover:text-orange-400 hover:underline transition-colors">
                {language === "en" ? "Contribution" : "योगदान"}
              </Link>
              <Link to="/contact" className="text-white/70 hover:text-orange-400 hover:underline transition-colors">
                {language === "en" ? "Contact Us" : "संपर्क करें"}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-orange-500/40 mt-6 pt-3">
          <div className="flex flex-col sm:flex-row justify-between items-center text-white/60 text-xs sm:text-sm">
            <div>{language === "en" ? "Made with ❤️ for Aspirants" : "उम्मीदवारों के लिए ❤️ से बनाया गया"}</div>
            <div className="mt-1 sm:mt-0">
              © {currentYear} |{" "}
              <Link to="/privacy-policy" className="underline hover:text-orange-400">
                {language === "en" ? "Privacy Policy" : "गोपनीयता नीति"}
              </Link>{" "}|{" "}
              <Link to="/terms-and-conditions" className="underline hover:text-orange-400">
                {language === "en" ? "Terms & Conditions" : "नियम और शर्तें"}
              </Link>{" "}|{" "}
              <Link to="/refund-policy" className="underline hover:text-orange-400">
                {language === "en" ? "Refund Policy" : "वापसी नीति"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
