/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Essencial para o controlo manual do tema
  darkMode: 'class', 
  theme: {
    extend: {
      colors: {
        // Mapeamento das cores oficiais da AgroSmart
        'agro': {
          'green': '#3E6837',
          'light': '#CBE6A2',
          'soft': '#EFF2E6',
          'bg': '#FDFDF5',
          'accent': '#4ade80', // Cor para destaques no Dark Mode
        }
      },
      borderRadius: {
        '4xl': '2.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'scale-up': 'scaleUp 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}