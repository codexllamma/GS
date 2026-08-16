/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#F8F7F3",
          card: "#F1EEE7",
          sage: "#626B5A",
          olive: "#3E4638",
          stone: "#E6E1D6",
          border: "#E0DDD6",
          charcoal: "#2F3335",
          textSec: "#6B6F72",
          caption: "#8D8F93",
          disabled: "#A6A9AD",
          btn: "#4F5A46",
          altBg: "#EEF3EC",
          success: "#DCE2D7",
          lightText: "#D7D7D7",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        apercu: ["var(--font-apercu)", "system-ui", "sans-serif"],
        rajdhani: ["var(--font-rajdhani)", "system-ui", "sans-serif"],
        saira: ["var(--font-saira)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};