/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // SwingPop brand palette: warm vintage / Wes Anderson direction.
        // Reused from the earlier theme pass so the agreed direction stays intact.
        //
        // Driven by CSS variables (channel triples in src/index.css) so a `.dark`
        // ancestor can swap the whole palette without touching any utility class.
        // The light values in :root are identical to the old hex, so light mode is
        // unchanged. <alpha-value> keeps `/40`-style opacity utilities working.
        swing: {
          ink: 'rgb(var(--swing-ink) / <alpha-value>)',
          muted: 'rgb(var(--swing-muted) / <alpha-value>)',
          paper: 'rgb(var(--swing-paper) / <alpha-value>)',
          cream: 'rgb(var(--swing-cream) / <alpha-value>)',
          peach: 'rgb(var(--swing-peach) / <alpha-value>)',
          coral: 'rgb(var(--swing-coral) / <alpha-value>)',
          gold: 'rgb(var(--swing-gold) / <alpha-value>)',
          sage: 'rgb(var(--swing-sage) / <alpha-value>)',
          mint: 'rgb(var(--swing-mint) / <alpha-value>)',
          sky: 'rgb(var(--swing-sky) / <alpha-value>)',
          teal: 'rgb(var(--swing-teal) / <alpha-value>)',
          'teal-deep': 'rgb(var(--swing-teal-deep) / <alpha-value>)',
          burgundy: 'rgb(var(--swing-burgundy) / <alpha-value>)',
          border: 'rgb(var(--swing-border) / <alpha-value>)',
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
