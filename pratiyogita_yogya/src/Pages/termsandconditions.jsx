import React, { useState } from "react";
import { motion } from "framer-motion";

function TermsAndConditions() {
  const [activeTab, setActiveTab] = useState("introduction");
  
  const sections = [
    { id: "introduction", title: "Introduction" },
    { id: "definitions", title: "Definitions" },
    { id: "accounts", title: "User Accounts" },
    { id: "intellectual", title: "Intellectual Property" },
    { id: "content", title: "User Content" },
    { id: "prohibited", title: "Prohibited Uses" },
    { id: "disclaimer", title: "Disclaimer of Warranties" },
    { id: "liability", title: "Limitation of Liability" },
    { id: "changes", title: "Changes" },
    { id: "contact", title: "Contact Us" },
  ];

  // Content for each section
  const sectionContent = {
    introduction: (
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <div className="p-1.5 mr-3 bg-[#E4572E]/15 rounded-lg text-[#E4572E]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#FBF6EE]">Introduction</h2>
        </div>
        <p className="text-[#E8D8C3]">
          Welcome to Pariksha Yogya. These Terms and Conditions govern your use of our website and services. By accessing or using Pariksha Yogya, you agree to be bound by these Terms. If you disagree with any part of the terms, you do not have permission to access the service.
        </p>
      </div>
    ),
    
    definitions: (
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <div className="p-1.5 mr-3 bg-[#E4572E]/15 rounded-lg text-[#E4572E]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#FBF6EE]">Definitions</h2>
        </div>
        <ul className="list-disc pl-5 space-y-2 text-[#E8D8C3]">
          <li><span className="font-semibold">"Service"</span> refers to the Pariksha Yogya website and platform.</li>
          <li><span className="font-semibold">"You"</span> refers to the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service.</li>
          <li><span className="font-semibold">"Content"</span> refers to all information displayed, transmitted, or otherwise made available via our Service.</li>
        </ul>
      </div>
    ),
    
    accounts: (
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <div className="p-1.5 mr-3 bg-[#E4572E]/15 rounded-lg text-[#E4572E]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#FBF6EE]">User Accounts</h2>
        </div>
        <div className="space-y-3 text-[#E8D8C3]">
          <p>
            When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
          </p>
          <p>
            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party.
          </p>
        </div>
      </div>
    ),
    
    intellectual: (
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <div className="p-1.5 mr-3 bg-[#E4572E]/15 rounded-lg text-[#E4572E]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#FBF6EE]">Intellectual Property</h2>
        </div>
        <div className="space-y-3 text-[#E8D8C3]">
          <p>
            The Service and its original content, features, and functionality are and will remain the exclusive property of Pariksha Yogya and its licensors. The Service is protected by copyright, trademark, and other laws.
          </p>
          <p>
            Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Pariksha Yogya.
          </p>
        </div>
      </div>
    ),
    
    content: (
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <div className="p-1.5 mr-3 bg-[#E4572E]/15 rounded-lg text-[#E4572E]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#FBF6EE]">User Content</h2>
        </div>
        <div className="space-y-3 text-[#E8D8C3]">
          <p>
            By posting, uploading, or submitting content to our Service, you grant Pariksha Yogya a non-exclusive, royalty-free, worldwide license to use, modify, publicly display, reproduce, and distribute such content on and through the Service.
          </p>
          <p>
            You represent and warrant that you own or have the necessary rights to post any content you submit and that such content does not violate the intellectual property rights or any other rights of any third party.
          </p>
        </div>
      </div>
    ),
    
    prohibited: (
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <div className="p-1.5 mr-3 bg-[#E4572E]/15 rounded-lg text-[#E4572E]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#FBF6EE]">Prohibited Uses</h2>
        </div>
        <p className="mb-2 text-[#E8D8C3]">You agree not to use the Service:</p>
        <ul className="list-disc pl-5 space-y-2 text-[#E8D8C3]">
          <li>In any way that violates any applicable national or international law or regulation.</li>
          <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or similar solicitation.</li>
          <li>To impersonate or attempt to impersonate Pariksha Yogya, a Pariksha Yogya employee, another user, or any other person or entity.</li>
          <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service.</li>
        </ul>
      </div>
    ),
    
    disclaimer: (
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <div className="p-1.5 mr-3 bg-[#E4572E]/15 rounded-lg text-[#E4572E]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#FBF6EE]">Disclaimer of Warranties</h2>
        </div>
        <div className="bg-[#E4572E]/10 border-l-4 border-[#E4572E] p-3 rounded-r-md">
          <p className="text-[#E8D8C3]">
            The Service is provided on an "AS IS" and "AS AVAILABLE" basis. Pariksha Yogya makes no warranties, whether express or implied, regarding the accuracy of exam eligibility calculations, roadmaps, or any other content provided through our Service. While we strive for accuracy, we cannot guarantee that all information is current or error-free.
          </p>
        </div>
      </div>
    ),
    
    liability: (
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <div className="p-1.5 mr-3 bg-[#E4572E]/15 rounded-lg text-[#E4572E]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#FBF6EE]">Limitation of Liability</h2>
        </div>
        <div className="bg-[#E4572E]/10 border-l-4 border-[#E4572E] p-3 rounded-r-md">
          <p className="text-[#E8D8C3]">
            In no event shall Pariksha Yogya, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>
        </div>
      </div>
    ),
    
    changes: (
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <div className="p-1.5 mr-3 bg-[#E4572E]/15 rounded-lg text-[#E4572E]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#FBF6EE]">Changes</h2>
        </div>
        <p className="text-[#E8D8C3]">
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
        </p>
      </div>
    ),
    
    contact: (
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <div className="p-1.5 mr-3 bg-[#E4572E]/15 rounded-lg text-[#E4572E]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#FBF6EE]">Contact Us</h2>
        </div>
        <div className="bg-[#E4572E]/10 p-4 rounded-lg text-center">
          <p className="text-[#E8D8C3] mb-3">
            If you have any questions about these Terms, please contact us at:
          </p>
          <a
            href="mailto:askparikshasetu@gmail.com"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-[#FBF6EE] bg-[#E4572E] hover:bg-[#E4572E]/80"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            askparikshasetu@gmail.com
          </a>
        </div>
      </div>
    )
  };

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <div className="py-10 pt-28 px-3" style={{background: "linear-gradient(135deg, rgba(228,87,46,0.3) 0%, rgba(43,30,23,0.8) 100%)"}}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms and Conditions</h1>
          <p className="text-base text-[#E8D8C3] max-w-2xl mx-auto">
            Please read these terms carefully before using the Pariksha Yogya platform
          </p>
        </div>
      </div>
      
      {/* Desktop and Mobile Layout */}
      <div className="max-w-6xl mx-auto px-3 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Table of Contents - Desktop only */}
          <div className="hidden lg:block">
            <div className="sticky top-4 p-4 rounded-lg" style={{background: "rgba(43,30,23,0.6)", border: "1px solid rgba(228,87,46,0.30)"}}>
              <h3 className="text-base font-semibold mb-3 text-[#FBF6EE] border-b border-[#E4572E]/30 pb-2">Contents</h3>
              <nav>
                <ul className="space-y-1">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <button
                        onClick={() => setActiveTab(section.id)}
                        className={`w-full text-left px-2 py-1 rounded-md transition-colors text-sm ${
                          activeTab === section.id
                            ? "bg-[#E4572E]/15 text-[#E4572E] font-medium"
                            : "hover:bg-[#E4572E]/10 text-[#E8D8C3]"
                        }`}
                      >
                        {section.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
          
          {/* Content section */}
          <div className="lg:col-span-3">
            {/* Desktop view - show only active tab content */}
            <div className="hidden lg:block">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 rounded-lg" style={{background: "rgba(43,30,23,0.6)", border: "1px solid rgba(228,87,46,0.20)"}}
              >
                {sectionContent[activeTab]}
              </motion.div>
            </div>
            
            {/* Mobile view - show all content sequentially */}
            <div className="lg:hidden space-y-6">
              {sections.map((section) => (
                <div key={section.id} id={section.id} className="p-4 rounded-lg" style={{background: "rgba(43,30,23,0.6)", border: "1px solid rgba(228,87,46,0.20)"}}>
                  {sectionContent[section.id]}
                </div>
              ))}
            </div>
            
            <div className="text-xs text-[#E8D8C3]/50 pt-3 pb-4 border-t border-[#E4572E]/20 mt-6">
              <div className="flex items-center justify-between">
                <p>Last Updated: March 21, 2025</p>
                <button 
                  onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
                  className="inline-flex items-center text-[#E8D8C3] hover:text-[#E4572E]"
                >
                  <span>Back to top</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsAndConditions;
