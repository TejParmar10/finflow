import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0D0F1A',
        secondary: '#141622',
        card: 'rgba(255,255,255,0.04)',
        'border-subtle': 'rgba(255,255,255,0.07)',
        'text-primary': '#E8EAF6',
        'text-muted': 'rgba(255,255,255,0.4)',
        'accent-teal': '#4ECDC4',
        'accent-coral': '#FF6B6B',
        'accent-yellow': '#FFE66D',
        'accent-green': '#00C896',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
        serif: ['var(--font-dm-serif)', 'DM Serif Display', 'serif'],
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
}

export default config
