/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // xs breakpoint at 426px for mobile search/header behavior only (≤425px portrait)
      screens: {
        'xs': '426px',
      },
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
