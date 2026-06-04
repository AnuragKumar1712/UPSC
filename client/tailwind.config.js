/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        upsc: {
          navy: '#1e3a5f',
          gold: '#c9a227',
          cream: '#f8f6f1',
        },
      },
    },
  },
  plugins: [],
};
