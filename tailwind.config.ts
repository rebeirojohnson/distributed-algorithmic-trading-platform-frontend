import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', './tests/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: '#050912',
          900: '#08111f',
          850: '#0c1627',
          800: '#111d31',
          700: '#1c2d46',
        },
        steel: '#8ea3ba',
        buy: '#31d084',
        sell: '#ff5c6c',
        pending: '#f4b740',
        info: '#5ba7ff',
      },
      fontFamily: {
        display: ['"Arial Narrow"', '"Roboto Condensed"', 'Arial', 'sans-serif'],
        mono: ['"Roboto Mono"', '"Cascadia Mono"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(91,167,255,0.18), 0 22px 70px rgba(0,0,0,0.32)',
      },
    },
  },
  plugins: [],
} satisfies Config;
