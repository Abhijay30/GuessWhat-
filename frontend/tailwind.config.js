/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0f172a',
          light: '#1a2540',
        },
        accent: {
          DEFAULT: '#4f46e5',
          hover: '#4338ca',
        },
        status: {
          planned: '#f59e0b',
          progress: '#3b82f6',
          completed: '#10b981',
          delayed: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
