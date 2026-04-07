import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f0f1a',
        surface: '#1a1a2e',
        'surface-2': '#23234a',
        accent: '#7c3aed',
        'accent-light': '#a855f7',
        'accent-glow': '#9333ea',
        border: '#2d2d44',
        'text-base': '#f1f5f9',
        'text-muted': '#94a3b8',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
