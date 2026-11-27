/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/templates/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Young Serif", "Georgia", "serif"],
        sans: ["Figtree", "system-ui", "sans-serif"],
      },
      colors: {
        paper: "#F4EEE2", // page background
        surface: "#FFFCF6", // panels, inputs
        ink: "#24211C", // text
        muted: "#6B6356", // secondary text (5.2:1 on paper)
        line: "#E3D9C7", // borders, dividers
        herb: { DEFAULT: "#2F4B33", dark: "#223825", soft: "#DCE4D4" }, // actions, links
        danger: "#9A3412", // form errors (5.8:1 on saffron-soft, 6.3:1 on paper)
        saffron: { DEFAULT: "#D99A1E", soft: "#F6E3B8", deep: "#A6720C" }, // highlights; "deep" where it must meet contrast (numerals, icons)
      },
      fontSize: {
        // Display sizes for Young Serif; body sizes stay on Tailwind's defaults.
        "display-xl": [
          "clamp(2.75rem, 6vw, 5rem)",
          { lineHeight: "1.02", letterSpacing: "-0.02em" },
        ],
        "display-lg": [
          "clamp(2.25rem, 4.5vw, 3.5rem)",
          { lineHeight: "1.05", letterSpacing: "-0.015em" },
        ],
        "display-md": [
          "clamp(1.75rem, 3vw, 2.25rem)",
          { lineHeight: "1.1", letterSpacing: "-0.01em" },
        ],
        "display-sm": ["1.375rem", { lineHeight: "1.2" }],
      },
      maxWidth: {
        page: "78rem",
        prose: "40rem",
      },
      boxShadow: {
        plate: "0 24px 48px -24px rgba(52, 40, 20, 0.45), 0 0 0 10px #FFFCF6",
        lift: "0 12px 32px -16px rgba(52, 40, 20, 0.35)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
}
