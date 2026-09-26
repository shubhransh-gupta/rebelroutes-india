/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0c0f17',
          950: '#06080d',
          800: '#151b28',
          700: '#1f293d',
        },
        rebel: {
          emerald: '#10b981',
          cyan: '#06b6d4',
          orange: '#f97316',
          amber: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
