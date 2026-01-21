/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          DEFAULT: '#6366F1',
          dark: '#818CF8',
        },
        // Semantic colors for numbers
        expense: {
          DEFAULT: '#EF4444',
          dark: '#F87171',
        },
        profit: {
          DEFAULT: '#10B981',
          dark: '#34D399',
        },
        investment: {
          DEFAULT: '#6366F1',
          dark: '#818CF8',
        },
        // Background colors
        background: {
          DEFAULT: '#FFFFFF',
          dark: '#0F172A',
        },
        surface: {
          DEFAULT: '#F5F5F5',
          dark: '#1E293B',
        },
      },
    },
  },
  plugins: [],
};
