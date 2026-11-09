/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        '3k-red': '#815633',
        '3k-red-hover': '#62432B',
        '3k-bg': '#F5EFE3',
      }
    },
  },
  plugins: [],
}