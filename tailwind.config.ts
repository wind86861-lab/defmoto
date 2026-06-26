import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.25rem',
        lg: '2rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1200px',
        '2xl': '1320px',
      },
    },
    extend: {
      colors: {
        // Brand — logo-derived palette
        brand: {
          // Primary yellows
          yellow: {
            50: '#FFFBEB',
            100: '#FFF3C4',
            200: '#FFE88A',
            300: '#FFDB55',
            400: '#FFCC2E',
            DEFAULT: '#FFB800',
            500: '#FFB800',
            600: '#E69E00',
            700: '#B97D00',
            800: '#8C5E00',
            900: '#5C3E00',
            glow: '#FF8C00',
          },
          // Deep blacks
          dark: {
            DEFAULT: '#0A0A0A',
            50: '#1A1A1A',
            100: '#171717',
            200: '#141414',
            300: '#121212',
            400: '#0F0F0F',
            500: '#0A0A0A',
            600: '#080808',
            700: '#050505',
          },
          surface: {
            DEFAULT: '#141414',
            elevated: '#1C1C1C',
            sunken: '#0A0A0A',
            border: '#2A2A2A',
          },
        },
        // Semantic
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-sora)', 'var(--font-inter)', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // Mobile-first display sizes
        'display-2xl': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '800' }],
        'display-xl': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'display-lg': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'display-sm': ['1.75rem', { lineHeight: '1.25', fontWeight: '700' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        // Neon glow effect inspired by the logo
        'glow-sm': '0 0 12px rgba(255, 184, 0, 0.35)',
        'glow': '0 0 24px rgba(255, 184, 0, 0.45)',
        'glow-lg': '0 0 48px rgba(255, 184, 0, 0.55)',
        'glow-yellow': '0 8px 32px rgba(255, 184, 0, 0.4), 0 0 16px rgba(255, 184, 0, 0.3)',
        'card': '0 1px 2px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.6), 0 8px 24px rgba(0, 0, 0, 0.4)',
        'inset-border': 'inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
      },
      backgroundImage: {
        'gradient-yellow': 'linear-gradient(135deg, #FFB800 0%, #FFD700 50%, #FF8C00 100%)',
        'gradient-yellow-radial': 'radial-gradient(circle at 50% 0%, #FFD700 0%, #FFB800 50%, #FF8C00 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0A0A0A 0%, #141414 100%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s linear infinite',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'reveal-up': 'revealUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'reveal-left': 'revealLeft 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'reveal-right': 'revealRight 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 16px rgba(255, 184, 0, 0.35)' },
          '50%': { boxShadow: '0 0 32px rgba(255, 184, 0, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        revealUp: {
          '0%': { opacity: '0', transform: 'translateY(2rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        revealLeft: {
          '0%': { opacity: '0', transform: 'translateX(-2.5rem)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        revealRight: {
          '0%': { opacity: '0', transform: 'translateX(2.5rem)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
