/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // SwingPop brand palette: warm vintage / Wes Anderson direction.
        // Reused from the earlier theme pass so the agreed direction stays intact.
        swing: {
          ink: '#2e2720',
          muted: '#675748',
          paper: '#fff3d7',
          cream: '#f7dfad',
          peach: '#e9a47d',
          coral: '#c8614c',
          gold: '#c6932f',
          sage: '#a9b98f',
          mint: '#c8d7bf',
          sky: '#9fbfd0',
          teal: '#336f6a',
          'teal-deep': '#26534f',
          burgundy: '#7d342c',
          border: '#6e4b36',
        },
      },
      fontFamily: {
        // Gowun Batang carries Korean glyphs, unlike the previous Georgia-only stack.
        display: ['"Gowun Batang"', 'Georgia', '"Times New Roman"', 'serif'],
        body: ['"Noto Sans KR"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        frame: '0.28em',
      },
      boxShadow: {
        frame: '0 1px 0 0 rgba(110, 75, 54, 0.18), 0 12px 28px -18px rgba(46, 39, 32, 0.5)',
      },
    },
  },
  plugins: [],
}
