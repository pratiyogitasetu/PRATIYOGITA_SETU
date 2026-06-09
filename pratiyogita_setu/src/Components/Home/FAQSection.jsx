import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

const FAQItem = ({ question, answer, isOpen, onClick }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`mb-4 overflow-hidden rounded-xl bg-[#2B1E17]/60 border border-[#E4572E]/40 transition-all duration-200 hover:border-[#E4572E]/70`}
    >
      <button
        className={`flex w-full items-center justify-between p-3 sm:p-4 md:p-5 text-left font-medium text-[#FBF6EE]`}
        onClick={onClick}
      >
        <span className="text-sm sm:text-base pr-2">{question}</span>
        <svg
          className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 transform transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          } text-[#E4572E]`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="px-3 sm:px-4 md:px-5 pb-3 sm:pb-4 md:pb-5 pt-0 text-sm sm:text-base text-[#E8D8C3]"
            >
              {typeof answer === "string" ? <p>{answer}</p> : answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const { theme, language } = useTheme();
  const isDark = theme === "dark";

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs =
    language === "en"
      ? [
          {
            question: "What is Pratiyogita Setu?",
            answer:
              "Pratiyogita Setu is a comprehensive platform designed to help students prepare for competitive exams. It provides personalized learning paths, practice tests, and interactive study materials tailored to various competitive exams.",
          },
          {
            question: "How does Pratiyogita Setu help in exam preparation?",
            answer:
              "Pratiyogita Setu offers a three-pronged approach to exam preparation: Pratiyogita Yogya (personalized learning), Pratiyogita Marg (strategic preparation paths), and Pratiyogita Gyan (intelligent assistant). These tools work together to provide comprehensive support throughout your exam journey.",
          },
          {
            question: "Is Pratiyogita Setu available for all competitive exams?",
            answer:
              "Currently, Pratiyogita Setu supports preparation for major competitive exams in India, including UPSC, SSC, Banking, Railways, and various state-level examinations. We are continuously expanding our coverage to include more exams.",
          },
          {
            question: "How personalized is the learning experience?",
            answer:
              "Pratiyogita Setu uses advanced algorithms to analyze your strengths, weaknesses, and learning patterns. Based on this analysis, it creates a completely personalized study plan and recommends specific resources that align with your learning style and goals.",
          },
          {
            question: "Can I access Pratiyogita Setu on mobile devices?",
            answer:
              "Yes, Pratiyogita Setu is fully responsive and can be accessed on smartphones, tablets, laptops, and desktop computers. We also offer a dedicated mobile app for Android and iOS devices for a seamless learning experience on the go.",
          },
          {
            question:
              "What makes Pratiyogita Setu different from other exam preparation platforms?",
            answer:
              "Pratiyogita Setu stands out with its integrated approach combining AI-driven personalization, comprehensive content coverage, and community-based learning. Our platform adapts to your individual learning needs while providing quality content vetted by subject matter experts.",
          },
        ]
      : [
          {
            question: "परीक्षा सेतु क्या है?",
            answer:
              "परीक्षा सेतु एक व्यापक प्लेटफॉर्म है जो छात्रों को प्रतियोगी परीक्षाओं की तैयारी में मदद करने के लिए डिज़ाइन किया गया है। यह विभिन्न प्रतियोगी परीक्षाओं के लिए अनुकूलित व्यक्तिगत शिक्षण पथ, अभ्यास परीक्षण और इंटरैक्टिव अध्ययन सामग्री प्रदान करता है।",
          },
          {
            question: "परीक्षा सेतु परीक्षा की तैयारी में कैसे मदद करता है?",
            answer:
              "परीक्षा सेतु परीक्षा की तैयारी के लिए तीन-प्रोंग्ड दृष्टिकोण प्रदान करता है: परीक्षा योग्य (व्यक्तिगत शिक्षा), परीक्षा मार्ग (रणनीतिक तैयारी पथ), और परीक्षा चैटबॉट (बुद्धिमान सहायक)। ये उपकरण आपकी परीक्षा यात्रा के दौरान व्यापक सहायता प्रदान करने के लिए एक साथ काम करते हैं।",
          },
          {
            question:
              "क्या परीक्षा सेतु सभी प्रतियोगी परीक्षाओं के लिए उपलब्ध है?",
            answer:
              "वर्तमान में, परीक्षा सेतु भारत में प्रमुख प्रतियोगी परीक्षाओं की तैयारी का समर्थन करता है, जिसमें UPSC, SSC, बैंकिंग, रेलवे और विभिन्न राज्य-स्तरीय परीक्षाएं शामिल हैं। हम अधिक परीक्षाओं को शामिल करने के लिए लगातार अपने कवरेज का विस्तार कर रहे हैं।",
          },
          {
            question: "शिक्षा का अनुभव कितना व्यक्तिगत है?",
            answer:
              "परीक्षा सेतु आपकी ताकत, कमजोरियों और सीखने के पैटर्न का विश्लेषण करने के लिए उन्नत एल्गोरिदम का उपयोग करता है। इस विश्लेषण के आधार पर, यह एक पूरी तरह से व्यक्तिगत अध्ययन योजना बनाता है और विशिष्ट संसाधनों की सिफारिश करता है जो आपकी सीखने की शैली और लक्ष्यों के अनुरूप हैं।",
          },
          {
            question:
              "क्या मैं मोबाइल उपकरणों पर परीक्षा सेतु का उपयोग कर सकता हूं?",
            answer:
              "हां, परीक्षा सेतु पूरी तरह से प्रतिक्रियाशील है और स्मार्टफोन, टैबलेट, लैपटॉप और डेस्कटॉप कंप्यूटर पर एक्सेस किया जा सकता है। हम चलते-फिरते सीखने के अनुभव के लिए Android और iOS उपकरणों के लिए एक समर्पित मोबाइल ऐप भी प्रदान करते हैं।",
          },
          {
            question:
              "परीक्षा सेतु अन्य परीक्षा तैयारी प्लेटफार्मों से अलग क्या है?",
            answer:
              "परीक्षा सेतु AI-संचालित व्यक्तिगतकरण, व्यापक सामग्री कवरेज और समुदाय-आधारित सीखने को जोड़ने वाले अपने एकीकृत दृष्टिकोण के साथ प्रमुखता से सामने आता है। हमारा प्लेटफॉर्म विषय विशेषज्ञों द्वारा जांची गई गुणवत्तापूर्ण सामग्री प्रदान करते हुए आपकी व्यक्तिगत सीखने की जरूरतों के अनुकूल है।",
          },
        ];

  return (
    <section
      className="py-8 sm:py-12 md:py-16"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`text-xl sm:text-2xl font-bold tracking-tight sm:text-3xl text-[#FBF6EE]`}
          >
            {language === "en"
              ? "Frequently Asked Questions"
              : "अक्सर पूछे जाने वाले प्रश्न"}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-2 sm:mt-4 text-sm sm:text-base text-[#E8D8C3]"
          >
            {language === "en"
              ? "Have questions about Pratiyogita Setu? Find quick answers to common queries below."
              : "परीक्षा सेतु के बारे में प्रश्न हैं? नीचे सामान्य प्रश्नों के त्वरित उत्तर प्राप्त करें।"}
          </motion.p>
        </div>

        <div className="mx-auto mt-6 sm:mt-8 md:mt-12 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onClick={() => toggleFAQ(index)}
              />
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 sm:mt-8 md:mt-10 text-center"
          >
            <p
              className="mb-4 sm:mb-6 text-sm sm:text-base text-[#E8D8C3]"
            >
              {language === "en"
                ? "Didn't find what you're looking for?"
                : "जो आप ढूंढ रहे हैं वह नहीं मिला?"}
            </p>
            <a
              href="#contact"
              className="inline-flex items-center rounded-lg px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold bg-[#E4572E] text-[#FBF6EE] hover:bg-[#cf4a23] transition-colors duration-300"
            >
              {language === "en" ? "Contact Us" : "हमसे संपर्क करें"}
              <svg
                className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
