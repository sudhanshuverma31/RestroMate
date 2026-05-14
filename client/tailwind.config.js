/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf8f0',
          100: '#faefd9',
          200: '#f3d9a8',
          300: '#eac06e',
          400: '#dfa63e',
          500: '#C4A47A',
          600: '#B8860B',
          700: '#8B5A2B',
          800: '#A0522D',
          900: '#6b3a1f',
        },
        dark: {
          bg:     '#000000',
          card:   '#1A1A1A',
          border: '#2A2A2A',
          muted:  '#111111',
          hover:  '#222222',
        },
        light: {
          bg:     '#FFF8F0',
          card:   '#FFFFFF',
          border: '#EED9C4',
          muted:  '#FAF0E6',
          hover:  '#F5E6D3',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in':      'fadeIn 0.3s ease-out',
        'slide-up':     'slideUp 0.3s ease-out',
        'slide-in':     'slideIn 0.3s ease-out',
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':    'spin 2s linear infinite',
        'bounce-light': 'bounce 1s infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(-16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
      backgroundImage: {
        'gold-gradient':  'linear-gradient(135deg, #C4A47A 0%, #B8860B 50%, #8B5A2B 100%)',
        'dark-gradient':  'linear-gradient(180deg, #1A1A1A 0%, #000000 100%)',
        'card-shimmer':   'linear-gradient(90deg, transparent, rgba(196,164,122,0.05), transparent)',
      },
      boxShadow: {
        'gold':    '0 0 20px rgba(184,134,11,0.3)',
        'gold-lg': '0 0 40px rgba(184,134,11,0.4)',
        'card':    '0 4px 24px rgba(0,0,0,0.4)',
        'inner-gold': 'inset 0 1px 0 rgba(196,164,122,0.1)',
      },
    },
  },
  plugins: [],
};
