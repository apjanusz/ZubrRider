/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'zubr-dark': '#1b5e20',   // main dark green
        'zubr-gold': '#fdd835',   // gold
        'zubr-light': '#f1f8e9',  // bright bg
        'zubr-hover': '#2e7d32',  // hovery
      }
    },
  },
  plugins: [],
}