/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aether: {
          50: '#f0f7ff',
          100: '#e0eefe',
          200: '#bbdcfd',
          300: '#7fbffb',
          400: '#3a9bf8',
          500: '#1280ec',
          600: '#0663c9',
          700: '#074fa0',
          800: '#0a4483',
          900: '#0d3a6e',
          950: '#082347',
        },
        accent: {
          400: '#5eead4',
          500: '#2dd4bf',
          600: '#14b8a6',
        },
        warn: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        danger: {
          400: '#fb7185',
          500: '#f43f5e',
        },
        ok: {
          400: '#4ade80',
          500: '#22c55e',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Sora"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(2, 12, 30, 0.18)',
        glow: '0 0 40px rgba(58, 155, 248, 0.35)',
        'glow-accent': '0 0 40px rgba(45, 212, 191, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease forwards',
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-down': 'slideDown 0.4s ease forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin 18s linear infinite',
        float: 'float 8s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
        aurora: 'aurora 16s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        aurora: {
          '0%': { transform: 'translate(-10%, -5%) rotate(0deg) scale(1)' },
          '50%': { transform: 'translate(10%, 5%) rotate(8deg) scale(1.15)' },
          '100%': { transform: 'translate(-5%, 8%) rotate(-6deg) scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};
