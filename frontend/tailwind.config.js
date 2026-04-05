/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Händler Brand Colors
        handler: {
          red: '#E30613',
          'red-light': '#FF1A2A',
          'red-dark': '#B8050F',
          gold: '#FFC107',
          'gold-light': '#FFD54F',
          'gold-dark': '#FFA000',
          black: '#1A1A1A',
        },
        // Surface colors - Dark theme
        surface: {
          50: '#2A2A2A',
          100: '#252525',
          200: '#202020',
          300: '#1A1A1A',
          400: '#151515',
          500: '#111111',
          600: '#0D0D0D',
          700: '#0A0A0A',
          800: '#070707',
          900: '#030303',
        },
        // Semantic grays for text/borders on dark
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        // Functional colors
        success: {
          50: '#0D2818',
          100: '#134D2A',
          200: '#166534',
          300: '#22C55E',
          400: '#4ADE80',
          500: '#86EFAC',
        },
        warning: {
          50: '#2D1F00',
          100: '#523A00',
          200: '#7C5800',
          300: '#F59E0B',
          400: '#FBBF24',
          500: '#FDE68A',
        },
        danger: {
          50: '#2D0A0A',
          100: '#5C1515',
          200: '#991B1B',
          300: '#EF4444',
          400: '#F87171',
          500: '#FCA5A5',
        },
        info: {
          50: '#0A1929',
          100: '#0D3B66',
          200: '#1D5FA0',
          300: '#3B82F6',
          400: '#60A5FA',
          500: '#93C5FD',
        },
        // SGA chemical danger colors
        sga: {
          'sin-riesgo': '#22C55E',
          'inflamable': '#F97316',
          'corrosivo': '#EAB308',
          'toxico': '#EF4444',
          'comburente': '#3B82F6',
          'explosivo': '#A855F7',
        },
        // Shelf map states
        shelf: {
          empty: '#1F2937',
          occupied: '#3B82F6',
          expired: '#EF4444',
          warning: '#F59E0B',
          selected: '#22C55E',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xxs': ['0.625rem', { lineHeight: '0.875rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '68': '17rem',
        '76': '19rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
        'sidebar': '16rem',
        'sidebar-mini': '4.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'fade-in-down': 'fadeInDown 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-subtle': 'bounceSubtle 0.6s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(227,6,19,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(227,6,19,0.6)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0,0,0,0.3)',
        'medium': '0 4px 20px rgba(0,0,0,0.4)',
        'large': '0 8px 40px rgba(0,0,0,0.5)',
        'glow-red': '0 0 15px rgba(227,6,19,0.3)',
        'glow-gold': '0 0 15px rgba(255,193,7,0.3)',
        'glow-blue': '0 0 15px rgba(59,130,246,0.3)',
        'inner': 'inset 0 2px 4px rgba(0,0,0,0.3)',
        'card': '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        'card-hover': '0 4px 15px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backdropBlur: {
        'xs': '2px',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
    },
  },
  plugins: [],
};