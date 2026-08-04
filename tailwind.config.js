/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        glass: {
          50: 'rgba(255,255,255,0.04)',
          100: 'rgba(255,255,255,0.06)',
          200: 'rgba(255,255,255,0.08)',
          300: 'rgba(255,255,255,0.12)',
          border: 'rgba(255,255,255,0.10)',
          borderHover: 'rgba(255,255,255,0.22)',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.45)',
        glow: '0 0 40px rgba(255,255,255,0.08)',
        glowSm: '0 0 20px rgba(255,255,255,0.06)',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(20px, -20px)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.6s ease-out forwards',
        fadeIn: 'fadeIn 0.5s ease-out forwards',
        scaleIn: 'scaleIn 0.35s ease-out forwards',
        pulseGlow: 'pulseGlow 2.2s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        drift: 'drift 8s ease-in-out infinite',
        driftSlow: 'drift 14s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};