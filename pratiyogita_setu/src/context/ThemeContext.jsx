import React, { createContext, useState, useEffect, useContext } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Start with dark (coffee palette optimized for dark mode)
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    // Check for user preference in localStorage
    const savedTheme = localStorage.getItem("pariksha-setu-theme");
    const savedLanguage = localStorage.getItem("pariksha-setu-language");

    // Set theme based on saved preference or system preference
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Default to dark for the coffee palette design
      const initialTheme = "dark";
      setTheme(initialTheme);
      localStorage.setItem("pariksha-setu-theme", initialTheme);
    }

    // Set language based on saved preference
    if (savedLanguage) {
      setLanguage(savedLanguage);
    } else {
      localStorage.setItem("pariksha-setu-language", "en");
    }

    // Log current theme
    console.log(
      "ThemeContext initialized with theme:",
      savedTheme ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light")
    );
  }, []);

  useEffect(() => {
    // Apply theme to the document element
    const html = document.documentElement;
    const body = document.body;

    if (theme === "dark") {
      // Apply dark mode
      html.classList.add("dark");
      html.classList.remove("light");

      // Set explicit background and text colors for dark mode
      body.style.backgroundColor = "#1a202c"; // Dark background
      body.style.color = "#e2e8f0"; // Light text

      // Update other global styles
      body.classList.add("dark-mode");
      body.classList.remove("light-mode");
    } else {
      // Apply light mode
      html.classList.remove("dark");
      html.classList.add("light");

      // Set explicit background and text colors for light mode
      body.style.backgroundColor = "#ffffff"; // White background
      body.style.color = "#1a202c"; // Dark text

      // Update other global styles
      body.classList.remove("dark-mode");
      body.classList.add("light-mode");
    }

    // Update CSS variables for theme colors
    document.documentElement.style.setProperty(
      "--color-primary",
      theme === "light" ? "#4F46E5" : "#818CF8"
    );
    document.documentElement.style.setProperty(
      "--color-background",
      theme === "light" ? "#ffffff" : "#1a202c"
    );
    document.documentElement.style.setProperty(
      "--color-text",
      theme === "light" ? "#1a202c" : "#e2e8f0"
    );
    document.documentElement.style.setProperty(
      "--color-border",
      theme === "light" ? "#e5e7eb" : "#4b5563"
    );
    document.documentElement.style.setProperty(
      "--color-card-bg",
      theme === "light" ? "#ffffff" : "#2d3748"
    );

    // Save preference to localStorage
    localStorage.setItem("pariksha-setu-theme", theme);

    // Debug logging
    console.log("Theme changed to:", theme);
    console.log("Classes on html element:", html.className);
  }, [theme]);

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem("pariksha-setu-language", language);
  }, [language]);

  const toggleTheme = () => {
    console.log("Toggle theme clicked. Current theme:", theme);
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      console.log("Setting new theme to:", newTheme);
      return newTheme;
    });
  };

  const toggleLanguage = () => {
    setLanguage((prevLang) => (prevLang === "en" ? "hi" : "en"));
  };

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, language, toggleLanguage }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for accessing theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
