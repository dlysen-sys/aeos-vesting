/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // AEOS Theme
        'aeos-gold': '#FFB800',
        'aeos-dark': '#0F1419',
        'aeos-card': '#1A1F2E',
        'aeos-text': '#FFFFFF',
        'aeos-muted': '#A0AEC0',
        'aeos-green': '#10B981',
        'aeos-orange': '#F59E0B',
        'aeos-purple': '#8B5CF6',
        'aeos-red': '#EF4444',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
}
