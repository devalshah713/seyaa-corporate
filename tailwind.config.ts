import type { Config } from 'tailwindcss'

/**
 * Colours resolve through CSS custom properties so the whole site can flip
 * between the ivory and charcoal palettes by changing one attribute on <html>.
 * Channels are stored bare ("251 249 245") so Tailwind's /opacity modifiers
 * keep working.
 */
const themed = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: themed('--surface'), // page background
          soft: themed('--surface-raised'), // panels, image wells
          line: themed('--line'), // hairlines
        },
        bone: {
          DEFAULT: themed('--text'), // primary text
          dim: themed('--text-muted'), // secondary text
        },
        gold: {
          DEFAULT: themed('--accent'), // accent fills
          soft: themed('--accent-text'), // accent text
          deep: themed('--accent-deep'),
        },
        onGold: themed('--on-accent'), // text sitting on an accent fill
      },
      fontFamily: {
        // System stacks only — nothing to download, so the site renders
        // instantly and the build never depends on a font CDN.
        serif: ['Didot', '"Bodoni MT"', '"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['"Helvetica Neue"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
      },
      letterSpacing: {
        label: '0.22em',
        wide: '0.08em',
      },
      maxWidth: {
        shell: '86rem',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
} satisfies Config
