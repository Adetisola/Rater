/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: '#FEC312',
        brand: '#7C3BED',
        surface: '#EBEBEB',
        muted: '#999999',
      }
    },
  },
  plugins: [],
}
