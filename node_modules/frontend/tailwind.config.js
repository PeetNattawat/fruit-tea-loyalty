/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-red': '#8B1E12',
        'deep-red-dark': '#6B170E',
        'fruit-orange': '#F59E0B',
        'fruit-orange-light': '#FBBF24',
        'lemon-yellow': '#FFD34D',
        'cream': '#FFF6E5',
        'tea-brown': '#4B2E1E',
      },
      fontFamily: {
        sans: ['Poppins', 'Fredoka', 'system-ui', 'sans-serif'],
        display: ['Fredoka', 'Poppins', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
}
