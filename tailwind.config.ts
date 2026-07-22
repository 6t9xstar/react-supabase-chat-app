import type { Config } from 'tailwindcss'

/**
 * iOS Messages design tokens
 * Inspired by Apple's Human Interface Guidelines (light + dark).
 * Colors use rgb() format so opacity modifiers (e.g. bg-ios-bg-light/80) work.
 */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ios: {
          blue: {
            light: 'rgb(0, 122, 255)',
            dark: 'rgb(10, 132, 255)',
          },
          bg: {
            light: 'rgb(255, 255, 255)',
            dark: 'rgb(0, 0, 0)',
          },
          grouped: {
            light: 'rgb(242, 242, 247)',
            dark: 'rgb(28, 28, 30)',
          },
          secondary: {
            light: 'rgb(255, 255, 255)',
            dark: 'rgb(44, 44, 46)',
          },
          separator: {
            light: 'rgba(60, 60, 67, 0.29)',
            dark: 'rgba(84, 84, 88, 0.65)',
          },
          bubble: {
            light: 'rgb(233, 233, 235)',
            dark: 'rgb(58, 58, 60)',
          },
          text: {
            light: 'rgb(0, 0, 0)',
            dark: 'rgb(255, 255, 255)',
          },
          label: {
            light: 'rgb(0, 0, 0)',
            dark: 'rgb(255, 255, 255)',
          },
          secondary_label: {
            light: 'rgba(60, 60, 67, 0.6)',
            dark: 'rgba(235, 235, 245, 0.6)',
          },
          tertiary_label: {
            light: 'rgba(60, 60, 67, 0.3)',
            dark: 'rgba(235, 235, 245, 0.3)',
          },
          green: {
            light: 'rgb(52, 199, 89)',
            dark: 'rgb(48, 209, 88)',
          },
          red: {
            light: 'rgb(255, 59, 48)',
            dark: 'rgb(255, 69, 58)',
          },
          orange: {
            light: 'rgb(255, 149, 0)',
            dark: 'rgb(255, 159, 10)',
          },
          yellow: {
            light: 'rgb(255, 204, 0)',
            dark: 'rgb(255, 214, 10)',
          },
          purple: {
            light: 'rgb(175, 82, 222)',
            dark: 'rgb(191, 90, 242)',
          },
          pink: {
            light: 'rgb(255, 45, 85)',
            dark: 'rgb(255, 55, 95)',
          },
          indigo: {
            light: 'rgb(88, 86, 214)',
            dark: 'rgb(94, 92, 230)',
          },
          teal: {
            light: 'rgb(90, 200, 250)',
            dark: 'rgb(100, 210, 255)',
          },
          fill: {
            light: 'rgba(120, 120, 128, 0.2)',
            dark: 'rgba(120, 120, 128, 0.36)',
          },
        },
      },
      borderRadius: {
        bubble: '20px 20px 20px 4px',
        'bubble-r': '20px 20px 4px 20px',
        'bubble-full': '20px',
        'ios-sm': '8px',
        ios: '10px',
        'ios-lg': '14px',
        'ios-xl': '18px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        'ios-callout': ['16px', { lineHeight: '21px', letterSpacing: '-0.32px' }],
        'ios-subhead': ['15px', { lineHeight: '20px', letterSpacing: '-0.24px' }],
        'ios-footnote': ['13px', { lineHeight: '18px', letterSpacing: '-0.08px' }],
        'ios-caption-1': ['12px', { lineHeight: '16px', letterSpacing: '0px' }],
        'ios-caption-2': ['11px', { lineHeight: '13px', letterSpacing: '0.07px' }],
      },
      boxShadow: {
        'ios-sm': '0 1px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.02)',
        ios: '0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'ios-lg': '0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)',
        'ios-nav': '0 -1px 0 rgba(0,0,0,0.05)',
        'ios-sheet': '0 -8px 32px rgba(0,0,0,0.12)',
      },
      animation: {
        'ios-pop': 'iosPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'ios-slide-up': 'iosSlideUp 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        'ios-fade': 'iosFade 0.2s ease-out',
        'ios-bubble-in': 'iosBubbleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'ios-typing': 'iosTyping 1.4s infinite ease-in-out',
      },
      keyframes: {
        iosPop: {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        iosSlideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        iosFade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        iosBubbleIn: {
          '0%': { transform: 'scale(0.9) translateY(4px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        iosTyping: {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '30%': { transform: 'translateY(-3px)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
