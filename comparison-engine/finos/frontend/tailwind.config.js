/** @type {import('tailwindcss').Config} */  
export default {  
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],  
  theme: {  
    extend: {  
      colors: {  
        primary: '#0a1e2f',  
        'primary-light': '#1a3a5c',  
        accent: '#0088cc',  
        'accent-soft': '#e6f2fa',  
        gold: '#f5a623',  
        success: '#00a86b',  
        danger: '#dc3545',  
        purple: '#7c3aed',  
        gray: { 50: '#f7f9fc', 100: '#edf1f7', 200: '#dce2ec', 400: '#8a9bb5', 600: '#4a5a72', 800: '#1a2634' },  
      },  
    },  
  },  
  plugins: [],  
};
