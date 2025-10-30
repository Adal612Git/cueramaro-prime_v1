/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0a59c1',
        secondary: '#f57c00',
        background: '#F8F8F8',
        text: '#1E1E1E'
      },
      fontFamily: {
        sans: ['"Poppins"', '"Montserrat"', '"Inter"', 'sans-serif']
      }
    }
  },
  plugins: []
};
