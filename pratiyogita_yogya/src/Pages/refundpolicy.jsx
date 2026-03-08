import React, { useState } from "react";
import { motion } from "framer-motion";

function RefundPolicy() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const sections = [
    { id: "overview", title: "Overview" },
    { id: "subscription", title: "Subscription Services" },
    { id: "one-time", title: "One-Time Purchases" },
    { id: "eligibility", title: "Eligibility for Refunds" },
    { id: "non-refundable", title: "Non-Refundable Items" },
    { id: "request", title: "Request a Refund" },
    { id: "processing", title: "Payment Processing" },
    { id: "changes", title: "Changes to Policy" },
    { id: "contact", title: "Contact Us" },
  ];

  // Content for each section
  const sectionContent = {
    overview: (
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <div className="p-1.5 mr-3 bg-[#E4572E]/15 rounded-lg text-[#E4572E]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#FBF6EE]">Overview</h2>
        </div>
        <p className="text-[#E8D8C3]">
          At Pariksha Yogya, we strive to ensure your satisfaction with our services. This Refund Policy outlines the circumstances under which we may provide refunds for subscription fees or purchases made on our platform.
        </p>
      </div>
    ),
    
    subscription: (
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <div className="p-1.5 mr-3 bg-[#E4572E]/15 rounded-lg text-[#E4572E]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#FBF6EE]">Subscription Services</h2>
        </div>
        <p className="mb-2 text-[#E8D8C3]">
          For subscription-based services, the following refund policies apply:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-[#E8D8C3]">
          <li>
            <span className="font-medium">7-Day Trial Period:</span> New premium subscribers may request a full refund within 7 days of initial purchase if they are unsatisfied with the service. This trial period applies only to first-time subscribers.
          </li>
          <li>
            <span className="font-medium">Monthly Subscriptions:</span> After the 7-day trial period, monthly subscription payments are generally non-refundable once the service has been accessed or used.
          </li>
          <li>
            <span className="font-medium">Annual Subscriptions:</span> For annual subscription plans, partial refunds may be considered on a pro-rata basis for the unused portion of the subscription if requested within 30 days of purchase.
          </li>
        </ul>
      </div>
    ),
    
    "one-time": (
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <div className="p-1.5 mr-3 bg-[#E4572E]/15 rounded-lg text-[#E4572E]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#FBF6EE]">One-Time Purchases</h2>
        </div>
        <p className="mb-2 text-[#E8D8C3]">
          For one-time purchases of digital materials or services:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-[#E8D8C3]">
          <li>
            <span className="font-medium">Digital Products:</span> Due to the nature of digital products, all purchases of downloadable materials, roadmaps, or resources are final and non-refundable once access has been provided.
          </li>
          <li>
            <span className="font-medium">Technical Issues:</span> If you experience technical difficulties that prevent you from accessing purchased content, please contact our support team within 48 hours of purchase. We will work to resolve the issue or process a refund if the problem cannot be fixed.
          </li>
        </ul>
      </div>
    ),
    
    eligibility: (
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <div className="p-1.5 mr-3 bg-[#E4572E]/15 rounded-lg text-[#E4572E]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#FBF6EE]">Eligibility for Refunds</h2>
        </div>
        <p className="mb-2 text-[#E8D8C3]">Refunds may be considered in the following circumstances:</p>
        <ul className="list-disc pl-6 space-y-2 text-[#E8D8C3]">
          <li>Service unavailability for extended periods not caused by scheduled maintenance</li>
          <li>Major technical issues that prevent access to key features</li>
          <li>Incorrect billing or duplicate charges</li>
          <li>Significant deviation from advertised services</li>
        </ul>
      </div>
    ),
    
    "non-refundable": (
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <div className="p-1.5 mr-3 bg-[#E4572E]/15 rounded-lg text-[#E4572E]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#FBF6EE]">Non-Refundable Items</h2>
        </div>
        <p className="mb-2 text-[#E8D8C3]">The following are generally not eligible for refunds:</p>
        <ul className="list-disc pl-6 space-y-2 text-[#E8D8C3]">
          <li>Subscriptions canceled after the refund eligibility period</li>
          <li>Digital content that has been downloaded or accessed</li>
          <li>Services that have been partially or fully utilized</li>
          <li>Purchases made using promotional codes or discounts</li>
        </ul>
      </div>
    ),
    
    request: (
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <div className="p-1.5 mr-3 bg-[#E4572E]/15 rounded-lg text-[#E4572E]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#FBF6EE]">How to Request a Refund</h2>
        </div>
        <p className="mb-2 text-[#E8D8C3]">
          To request a refund, please contact our support team at <a href="mailto:askparikshasetu@gmail.com" className="text-[#E4572E] hover:underline">askparikshasetu@gmail.com</a> with the following information:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-[#E8D8C3]">
          <li>Your full name and email address associated with your account</li>
          <li>Date of purchase</li>
          <li>Order/transaction ID (if available)</li>
          <li>Reason for requesting a refund</li>
          <li>Any relevant screenshots or documentation</li>
        </ul>
        <p className="mt-2 text-[#E8D8C3]">
          All refund requests will be reviewed within 5-7 business days, and our team will contact you regarding the status of your request.
        </p>
      </div>
    ),
    
    processing: (
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <div className="p-1.5 mr-3 bg-[#E4572E]/15 rounded-lg text-[#E4572E]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#FBF6EE]">Payment Processing</h2>
        </div>
        <p className="text-[#E8D8C3]">
          Approved refunds will be processed using the original payment method used for the purchase. Depending on your payment provider, it may take 5-10 business days for the refund to appear in your account.
        </p>
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
          <h2 className="text-xl font-bold text-[#FBF6EE]">Changes to This Policy</h2>
        </div>
        <p className="text-[#E8D8C3]">
          We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting to our website. It is your responsibility to review our Refund Policy periodically.
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
        <p className="text-[#E8D8C3]">
          If you have any questions about our Refund Policy, please contact us at <a href="mailto:askparikshasetu@gmail.com" className="text-[#E4572E] hover:underline">askparikshasetu@gmail.com</a>.
        </p>
      </div>
    ),
  };

  return (
    <div className="min-h-screen pt-14">
      {/* Header with gradient background */}
      <div className="w-full py-12 px-4" style={{background: "linear-gradient(135deg, rgba(228,87,46,0.3) 0%, rgba(43,30,23,0.8) 100%)"}}>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-[#FBF6EE] text-center">Refund Policy</h1>
          <p className="text-[#E8D8C3] text-center mt-4 max-w-3xl mx-auto">
            Our commitment to transparent and fair refund practices for all Pariksha Yogya services
          </p>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tab navigation */}
        <div className="flex overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <div className="flex space-x-2 min-w-max">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === section.id
                    ? "bg-[#E4572E]/15 text-[#E4572E]"
                    : "text-[#E8D8C3] hover:text-[#E4572E] hover:bg-[#E4572E]/10"
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content section */}
        <div className="rounded-lg p-6" style={{background: "rgba(43,30,23,0.6)", border: "1px solid rgba(228,87,46,0.20)"}}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {sectionContent[activeTab]}
          </motion.div>
        </div>
        
        <p className="text-sm text-[#E8D8C3]/50 mt-8 text-right">Last Updated: April 7, 2025</p>
      </div>
    </div>
  );
}

export default RefundPolicy;
