/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sigma Nu Official Colors: Gold/Yellow, White, Black
        primary: {
          50: '#fffbeb',   // Light gold
          100: '#fef3c7',  // Very light gold
          200: '#fde68a',  // Light gold
          300: '#fcd34d',  // Medium light gold
          400: '#fbbf24',  // Medium gold
          500: '#f59e0b',  // Sigma Nu Gold (primary)
          600: '#d97706',  // Dark gold
          700: '#b45309',  // Darker gold
          800: '#92400e',  // Very dark gold
          900: '#78350f',  // Darkest gold
        },
        // Sigma Nu secondary colors
        gold: {
          light: '#fef3c7',
          DEFAULT: '#f59e0b',  // Sigma Nu Gold
          dark: '#d97706',
        },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        'float-slow-delayed': 'float-slow-delayed 8s ease-in-out infinite 2s',
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
        'pulse-slow-delayed': 'pulse-slow-delayed 4s ease-in-out infinite 2s',
        'gradient-x': 'gradient-x 3s ease infinite',
        'bounce-slow': 'bounce-slow 3s ease-in-out infinite',
        'bounce-slow-delayed': 'bounce-slow-delayed 3s ease-in-out infinite 0.5s',
        'bounce-slow-delayed-2': 'bounce-slow-delayed-2 3s ease-in-out infinite 1s',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '33%': { transform: 'translateY(-20px) translateX(10px)' },
          '66%': { transform: 'translateY(10px) translateX(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-30px) rotate(5deg)' },
        },
        'float-slow-delayed': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(30px) rotate(-5deg)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.5' },
        },
        'pulse-slow-delayed': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.5' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'bounce-slow-delayed': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'bounce-slow-delayed-2': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}

