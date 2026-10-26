/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        '3k-red': '#C41E3A',
        '3k-red-hover': '#a01829',
        '3k-bg': '#f5f1ed',
      }
    },
  },
  plugins: [],
}