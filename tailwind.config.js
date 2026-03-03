/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        'xiv-bg': '#1a1a2e',
        'xiv-surface': '#16213e',
        'xiv-card': '#0f3460',
        'xiv-accent': '#e94560',
        'xiv-text': '#e2e8f0',
        'xiv-muted': '#94a3b8',
      }
    }
  },
  plugins: []
}
