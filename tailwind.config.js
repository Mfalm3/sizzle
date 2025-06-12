/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "selector",
  theme: {
    extend: {
      fontFamily: {
        "heading": ['Quicksand', 'sans-serif'],
        "body": ['Nunito', 'sans-serif']
      },
      colors: {
        primary: '#5F6F52',   // Sage Moss      - Grounded, natural        - Text, accents, backgrounds
        secondary: '#A9B388', // Dried Sage     - Soft, calm, herbal       - Badges, tags, secondary buttons
        background: '#FEFAE0',// Vanilla Cream  - Clean, warm, cozy        - Main background, cards, sections
        highlight: '#B99470', // Toasted Almond - Warm, rustic, comforting - Buttons, CTAs, decorative UI elements
        accent: '#F2C94C',    // Goldenrod      - Bright, cheerful, sunny  - Links, highlights, icons
      },
    },
  },
  plugins: [],
}
