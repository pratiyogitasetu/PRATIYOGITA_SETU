import React, { useState } from "react";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      console.log("Form submitted:", formData);
      setIsSubmitting(false);
      setSubmitSuccess(true);

      // Reset success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen pt-18 md:pt-18 px-3 sm:px-4">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight">
            <span className="text-[#E4572E]">
              Get In Touch
            </span>
          </h1>
          <p className="mt-2 max-w-2xl mx-auto text-xs md:text-sm text-[#E8D8C3]">
            Have questions or feedback? We're here to help! Our team will get
            back to you within 24 hours.
          </p>
        </div>

        {/* Main Contact Container */}
        <div className="flex flex-col md:flex-row rounded-xl overflow-hidden" style={{background: 'rgba(43,30,23,0.6)', border: '1px solid rgba(228,87,46,0.30)'}}>
          {/* Left Section - Contact Form */}
          <div className="w-full md:w-3/5 p-3 md:p-5 border-b md:border-b-0 md:border-r border-[#E4572E]/20">
            <div className="mb-3 md:mb-4">
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#E4572E]/15 text-[#E4572E] mb-2">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
                    clipRule="evenodd"
                  />
                </svg>
                Send us a message
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-[#FBF6EE] mb-1">
                Let's Start a Conversation
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative text-left">
                  <label
                    htmlFor="firstName"
                    className="block text-xs font-medium text-[#E8D8C3] mb-1"
                  >
                    First name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <svg
                        className="h-4 w-4 text-[#E8D8C3]/50"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      placeholder="Your first name"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="pl-8 w-full p-2 text-xs border border-[#E4572E]/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4572E] focus:border-[#E4572E] bg-[#2B1E17]/50 text-[#FBF6EE]"
                      required
                    />
                  </div>
                </div>
                <div className="relative text-left">
                  <label
                    htmlFor="lastName"
                    className="block text-xs font-medium text-[#E8D8C3] mb-1"
                  >
                    Last name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <svg
                        className="h-4 w-4 text-[#E8D8C3]/50"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      placeholder="Your last name"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="pl-8 w-full p-2 text-xs border border-[#E4572E]/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4572E] focus:border-[#E4572E] bg-[#2B1E17]/50 text-[#FBF6EE]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email and Phone - also change grid-cols-1 to grid-cols-2 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative text-left">
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium text-[#E8D8C3] mb-1"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <svg
                        className="h-4 w-4 text-[#E8D8C3]/50"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="yourname@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-8 w-full p-2 text-xs border border-[#E4572E]/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4572E] focus:border-[#E4572E] bg-[#2B1E17]/50 text-[#FBF6EE]"
                      required
                    />
                  </div>
                </div>

                <div className="relative text-left">
                  <label
                    htmlFor="phoneNumber"
                    className="block text-xs font-medium text-[#E8D8C3] mb-1"
                  >
                    Phone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <svg
                        className="h-4 w-4 text-[#E8D8C3]/50"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      placeholder="+1 (555) 444-0000"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="pl-8 w-full p-2 text-xs border border-[#E4572E]/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4572E] focus:border-[#E4572E] bg-[#2B1E17]/50 text-[#FBF6EE]"
                    />
                  </div>
                </div>
              </div>

              <div className="relative text-left">
                <label
                  htmlFor="message"
                  className="block text-xs font-medium text-[#E8D8C3] mb-1"
                >
                  Message
                </label>
                <div className="relative">
                  <div className="absolute left-0 top-2 pl-2 flex items-start pointer-events-none">
                    <svg
                      className="h-4 w-4 text-[#E8D8C3]/50"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Tell us how we can help you..."
                    value={formData.message}
                    onChange={handleChange}
                    rows={3}
                    className="pl-8 w-full p-2 text-xs border border-[#E4572E]/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E4572E] focus:border-[#E4572E] bg-[#2B1E17]/50 text-[#FBF6EE]"
                    required
                  />
                </div>
              </div>

              {submitSuccess && (
                <div
                  className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 text-xs rounded-lg"
                  role="alert"
                >
                  <strong className="font-bold">Success! </strong>
                  <span>Your message has been sent successfully.</span>
                </div>
              )}

              <button
                type="submit"
                className={`w-full bg-[#E4572E] text-[#FBF6EE] py-2 px-4 text-sm rounded-lg 
                  ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Send Message"
                )}
              </button>
            </form>
          </div>

          {/* Right Section - Contact Info with Map */}
          <div className="w-full md:w-2/5 text-[#FBF6EE] p-3 md:p-5" style={{background: 'linear-gradient(135deg, rgba(228,87,46,0.8) 0%, rgba(43,30,23,0.9) 100%)'}}>
            <div className="h-full flex flex-col">
              <div className="mb-3">
                <h3 className="text-lg font-bold mb-1">Contact Information</h3>
                <p className="text-[#E8D8C3] text-xs">
                  You can reach out to us through any of these channels.
                </p>
              </div>

              <div className="space-y-3 mb-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-white/20 p-2 rounded-lg mr-2">
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white/80 text-left">
                      Email
                    </h4>
                    <a
                      href="mailto:support@pariksha-yogya.com"
                      className="text-xs hover:underline"
                    >
                      support@pariksha-yogya.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-white/20 p-2 rounded-lg mr-2">
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white/80 text-left">
                      Phone
                    </h4>
                    <a
                      href="tel:+919876543210"
                      className="text-xs hover:underline"
                    >
                      (+91) 987 654 3210
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-white/20 p-2 rounded-lg mr-2">
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white/80 text-left">
                      Office Address
                    </h4>
                    <address className="text-xs not-italic">
                      230 Norman Street, New Delhi, India 110001
                    </address>
                  </div>
                </div>
              </div>

              {/* Map integrated within contact info section */}
              <div className="mt-2 flex-grow">
                <h4 className="text-xs font-semibold text-white/80 mb-1">
                  Our Location
                </h4>
                <div className="rounded-lg overflow-hidden h-48 md:h-44">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d224346.48129412968!2d77.06889754863329!3d28.52728034389636!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd5b347eb62d%3A0x52c2b7494e204dce!2sNew%20Delhi%2C%20Delhi!5e0!3m2!1sen!2sin!4v1653556182678!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0, borderRadius: "8px" }}
                    allowFullScreen=""
                    loading="lazy"
                    title="Office Location Map"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
