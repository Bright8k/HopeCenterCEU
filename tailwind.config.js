/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#8B1A8F',
        'primary-dark': '#6A1270',
        accent: '#D4A843',
        'accent-dark': '#B0883A',
        surface: '#F5F0F5',
      },
    },
  },
  plugins: [],
};
