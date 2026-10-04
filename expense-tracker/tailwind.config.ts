import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Named semantic tokens for the Charcoal + Amber theme
        primary: {
          DEFAULT: '#f59e0b',  // amber-500
          light:   '#fbbf24',  // amber-400
          dark:    '#d97706',  // amber-600
          glow:    'rgba(245, 158, 11, 0.15)',
        },
        surface: {
          DEFAULT: '#18181b',  // zinc-900
          raised:  '#27272a',  // zinc-800
          overlay: '#3f3f46',  // zinc-700
        },
      },
      boxShadow: {
        'amber-glow': '0 0 24px rgba(245, 158, 11, 0.18)',
        'amber-sm':   '0 0 10px rgba(245, 158, 11, 0.12)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #f59e0b, #fbbf24)',
        'charcoal-gradient': 'linear-gradient(180deg, #18181b 0%, #09090b 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
