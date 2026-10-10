import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primitive colors
        violet: {
          500: '#A78BFA',
          600: '#7C3AED',
          700: '#6D28D9',
        },
        cyan: {
          500: '#06B6D4',
          600: '#0891B2',
        },
        emerald: {
          500: '#10B981',
        },
        amber: {
          500: '#F59E0B',
        },
        rose: {
          500: '#F43F5E',
        },
        zinc: {
          50: '#FAFAFA',
          100: '#F4F4F4',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
          950: '#09090B',
        },

        // Semantic colors (Light mode defaults)
        primary: {
          DEFAULT: '#7C3AED',
          hover: '#6D28D9',
          muted: '#A78BFA',
        },
        accent: {
          DEFAULT: '#06B6D4',
          hover: '#0891B2',
        },
        success: '#10B981',
        warning: '#F59E0B',
        destructive: '#F43F5E',

        background: '#FFFFFF',
        foreground: '#18181B',
        card: '#FFFFFF',
        'card-foreground': '#18181B',
        muted: '#F4F4F4',
        'muted-foreground': '#71717A',
        border: '#E4E4E7',
        'input-border': '#D4D4D8',
        'focus-ring': '#7C3AED',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['Space Grotesk', 'monospace'],
      },
      fontSize: {
        'display-hero': ['56px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-h1': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-h2': ['40px', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
        'display-h3': ['32px', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'body-lg': ['18px', { lineHeight: '1.625' }],
        'body-base': ['16px', { lineHeight: '1.5' }],
        'body-sm': ['14px', { lineHeight: '1.5' }],
        'body-xs': ['12px', { lineHeight: '1.5' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      lineHeight: {
        tight: '1.1',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.04)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
        lg: '0 12px 32px rgba(0,0,0,0.12)',
        glass: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      transitionDuration: {
        instant: '100ms',
        fast: '200ms',
        normal: '300ms',
        slow: '500ms',
        cinematic: '800ms',
        epic: '1200ms',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.32, 0.72, 0, 1)',
        'spring-sharp': 'cubic-bezier(0.4, 0, 0.2, 1)',
        expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
        bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'slide-up-fade': 'slide-up-fade 200ms cubic-bezier(0.32, 0.72, 0, 1)',
        'slide-right': 'slide-right 300ms cubic-bezier(0.32, 0.72, 0, 1)',
        'slide-right-exit': 'slide-right-exit 300ms cubic-bezier(0.32, 0.72, 0, 1)',
        'scale-fade': 'scale-fade 300ms cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        'slide-up-fade': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-right': {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-right-exit': {
          from: { opacity: '1', transform: 'translateX(0)' },
          to: { opacity: '0', transform: 'translateX(100%)' },
        },
        'scale-fade': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
} satisfies Config