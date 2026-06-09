/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // This enables the 'dark' class-based dark mode
  theme: {
    extend: {
      colors: {
        // ── Pratiyogita Setu Brand Palette ──────────────────────────
        "dark-coffee": "#2B1E17",   // primary background / dark surfaces
        "burnt-orange": "#E4572E", // primary accent / CTA
        "muted-sand": "#E8D8C3",   // secondary text / card tint
        "soft-ivory": "#FBF6EE",   // primary text / light surfaces
      },
      screens: {
        // Extra small devices
        xxs: { raw: "(min-width: 320px)" },
        xs: { raw: "(min-width: 400px)" },
        // Standard breakpoints (keeping defaults)
        sm: "640px", // Small devices
        md: "768px", // Medium devices
        lg: "1024px", // Large devices
        xl: "1280px", // Extra large devices
        "2xl": "1536px", // 2X-Large devices
        // Custom larger breakpoints
        "3xl": "1920px", // Full HD
        "4xl": "2560px", // QHD / WQHD
        "5xl": "3840px", // 4K / UHD
        // Device-specific breakpoints
        mobile: { max: "767px" },
        tablet: { min: "768px", max: "1023px" },
        desktop: { min: "1024px" },
        // Height-based breakpoints
        short: { raw: "(max-height: 639px)" },
        standard: { raw: "(min-height: 640px)" },
        tall: { raw: "(min-height: 800px)" },
        xtall: { raw: "(min-height: 1000px)" },
        // Orientation based
        portrait: { raw: "(orientation: portrait)" },
        landscape: { raw: "(orientation: landscape)" },
        // Device pixel ratio (for high DPI screens)
        retina: {
          raw: "(min-device-pixel-ratio: 2), (min-resolution: 192dpi)",
        },
      },
    },
  },
  plugins: [],
};
