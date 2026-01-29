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
          500: '#6366F1',
          700: '#4338CA',
          900: '#312E81',
        },

        gold: {
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
        },

        dark: {
          700: '#1F2937', // surface muted
          800: '#111827', // surface
          900: '#020617', // background
        },

        surface: {
          light: '#FFFFFF',
          dark: '#111827',
        },

        background: {
          light: '#F9FAFB',
          dark: '#020617',
        },

        border: {
          light: '#E5E7EB',
          dark: '#374151',
        },

        text: {
          primary: {
            light: '#111827',
            dark: '#F9FAFB',
          },
          secondary: {
            light: '#4B5563',
            dark: '#D1D5DB',
          },
          muted: {
            light: '#9CA3AF',
            dark: '#9CA3AF',
          },
        },
      },

      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        xs: 'var(--fs-xs)',
        sm: 'var(--fs-sm)',
        base: 'var(--fs-base)',
        lg: 'var(--fs-lg)',
        xl: 'var(--fs-xl)',
        '2xl': 'var(--fs-2xl)',
      },
    },
  },
  plugins: [],
}
