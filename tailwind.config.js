/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Esta linha é essencial para o controlo manual
  darkMode: 'class', 
  theme: {
    extend: {},
  },
  plugins: [],
}