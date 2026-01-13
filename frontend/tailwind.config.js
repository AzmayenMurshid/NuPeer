/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      spacing: {
        'responsive': 'clamp(1rem, 3vw, 2rem)',
        'responsive-sm': 'clamp(0.5rem, 2vw, 1rem)',
        'responsive-lg': 'clamp(1.5rem, 4vw, 3rem)',
      },
      fontSize: {
        'responsive-xs': 'clamp(0.75rem, 1.5vw, 0.875rem)',
        'responsive-sm': 'clamp(0.875rem, 1.75vw, 1rem)',
        'responsive-base': 'clamp(1rem, 2vw, 1.125rem)',
        'responsive-lg': 'clamp(1.125rem, 2.5vw, 1.25rem)',
        'responsive-xl': 'clamp(1.25rem, 3vw, 1.5rem)',
        'responsive-2xl': 'clamp(1.5rem, 4vw, 2rem)',
        'responsive-3xl': 'clamp(1.875rem, 5vw, 2.5rem)',
        'responsive-4xl': 'clamp(2.25rem, 6vw, 3rem)',
      },
      colors: {
        // Sigma Nu Official Colors: Gold/Yellow, White, Black
        // Robinhood-inspired with Sigma Nu gold
        primary: {
          50: '#fffbeb',   // Light gold
          100: '#fef3c7',  // Very light gold
          200: '#fde68a',  // Light gold
          300: '#fcd34d',  // Medium light gold
          400: '#fbbf24',  // Medium gold
          500: '#f59e0b',  // Sigma Nu Gold (primary) - Robinhood-style accent
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
        // Robinhood-inspired performance colors
        positive: '#10b981',  // Green for positive metrics
        negative: '#ef4444',   // Red for negative metrics
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

