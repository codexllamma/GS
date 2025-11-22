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
      fontFamily: {
      apercu: ['var(--font-apercu)', 'system-ui', 'sans-serif'],
      rajdhani: ['var(--font-apercu)', 'system-ui', 'sans-serif'],
      saira: ['var(--font-saira)', 'system-ui', 'sans-serif']
    }
    },
  },
  plugins: [],
}
