/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0a7e3e',
          light: '#d1fae5',
          dark: '#065f2e',
        },
        secondary: {
          DEFAULT: '#1e3a8a',
        },
        accent: {
          DEFAULT: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 4px 16px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
