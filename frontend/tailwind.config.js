/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#006AD4',
        secondary: '#FF6F00',
        background: '#F8F8F8',
        text: '#1E1E1E'
      },
      fontFamily: {
        sans: ['"Inter"', '"Poppins"', 'sans-serif']
      }
    }
  },
  plugins: []
};
