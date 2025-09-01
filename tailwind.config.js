/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        // UT Brand Colors
        'ut-orange': '#BF5700',
        'ut-white': '#FFFFFF',
        'ut-dark-gray': '#333F48',
        'ut-light-gray': '#F9FAFB',
        'ut-text': '#1F2937',
        'ut-success': '#10B981',
        'ut-warning': '#F59E0B',
        'ut-error': '#EF4444',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'ut': '0 10px 25px rgba(0,0,0,0.1)',
        'ut-hover': '0 4px 12px rgba(191, 87, 0, 0.1)',
      },
    },
  },
  plugins: [],
}

