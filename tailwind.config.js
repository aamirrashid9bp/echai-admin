/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        chai: {
          50: '#FDFBF7',
          100: '#F7F2EA',
          200: '#ECE2D4',
          300: '#DECDBD',
          400: '#C9A887',
          500: '#B87333',
          600: '#9B5824',
          700: '#7B3F11',
          800: '#522A0D',
          900: '#351806',
          950: '#230E03',
        },
        warmgray: {
          50: '#FAF9F6',
          100: '#F3F1EC',
          200: '#E8E5DD',
          300: '#D6D1C6',
          400: '#A8A193',
          500: '#7C7467',
          600: '#595246',
          700: '#413C33',
          800: '#2B2721',
          900: '#181613',
        }
      }
    },
  },
  plugins: [],
}
