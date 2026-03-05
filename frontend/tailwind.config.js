/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          300: '#A5B4FC',
          400: '#818CF8', 
          500: '#6366F1',
          600: '#4F46E5', 
          700: '#4338CA',
          900: '#312E81',
        },

        gold: {
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
        },

        dark: {
          700: '#1F2937',
          800: '#111827',
          900: '#020617',
        },

        surface: {
          light: '#FFFFFF',
          dark:  '#111827',
        },

        background: {
          light: '#F9FAFB',
          dark:  '#020617',
        },

        border: {
          light: '#E5E7EB',
          dark:  '#374151',
        },

        text: {
          primary: {
            light: '#111827',
            dark:  '#F9FAFB',
          },
          secondary: {
            light: '#4B5563',
            dark:  '#D1D5DB',
          },
          muted: {
            light: '#9CA3AF',
            dark:  '#9CA3AF',
          },
        },
      },

      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        xs:    'var(--fs-xs)',
        sm:    'var(--fs-sm)',
        base:  'var(--fs-base)',
        lg:    'var(--fs-lg)',
        xl:    'var(--fs-xl)',
        '2xl': 'var(--fs-2xl)',
      },
    },
  },
  plugins: [
    function({ addComponents }) {
      addComponents({
        '.select-styled': {
          '@apply appearance-none bg-white dark:bg-dark-800 text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark rounded-lg px-4 py-2.5 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all cursor-pointer shadow-sm': {},

          '& option': {
            '@apply bg-white dark:bg-dark-800 text-text-primary-light dark:text-text-primary-dark py-2': {},
          },

          '& option:checked': {
            '@apply bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300': {},
          },
        },
      })
    }
  ],
}