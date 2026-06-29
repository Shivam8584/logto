import { Theme } from '@logto/schemas';
import { formatRgb, type Oklch } from 'culori';
import { useEffect, useContext } from 'react';

import PageContext from '@/Providers/PageContextProvider/PageContext';

/**
 * Brand-NEUTRAL accent. This is a multi-tenant OAuth experience that renders behind
 * many third-party identities (Google, Apple, GitHub…), so we intentionally IGNORE
 * the tenant's configured `primaryColor` and pin a single calm blue accent that reads
 * as neutral "infrastructure" regardless of tenant config — no purple, no per-tenant
 * brand colour leaking into buttons / focus rings / carets / links.
 *
 * The whole accent ramp (solid, hover, pressed, and the translucent overlays) is
 * DERIVED from one base oklch colour per theme via culori — a single source of truth,
 * so the perceptual steps stay even and consistent with index.css's `--primary*`
 * tokens. We emit rgba() (not oklch()) so the values render on the package's older
 * browserslist targets (Opera Mini / KaiOS / UC) that don't support oklch(); culori
 * does the oklch→sRGB conversion. We re-assert these on the body so the tenant SIE
 * colour can never override the design system at runtime.
 */

// Base accent per theme, in oklch [Lightness, Chroma, Hue]. Light = blue-600 (#2563eb),
// dark = blue-500 (#3b82f6) — lighter + slightly less chroma so the blue holds its
// perceptual weight against near-black. (Exact oklch coords derived from the hexes.)
const ACCENT_BASE = {
  light: { l: 0.546, c: 0.215, h: 263 },
  dark: { l: 0.623, c: 0.188, h: 260 },
} as const;

/** An oklch colour at a stepped lightness (clamped to a sane range). */
const step = (base: Oklch, deltaL: number): Oklch => ({
  ...base,
  l: Math.min(0.95, Math.max(0.2, base.l + deltaL)),
});

/** Solid sRGB string (e.g. `rgb(37, 99, 235)`) for an oklch colour. */
const solid = (color: Oklch): string => formatRgb(color);

/** Translucent sRGB string (e.g. `rgba(37, 99, 235, 0.16)`) at the given alpha. */
const alpha = (color: Oklch, opacity: number): string => formatRgb({ ...color, alpha: opacity });

const generateColorLibrary = (isDark: boolean) => {
  const base: Oklch = { mode: 'oklch', ...ACCENT_BASE[isDark ? 'dark' : 'light'] };
  // Hover/pressed step lightness (lighter on dark, darker on light) so the CTA stays
  // recognisably blue in both themes rather than collapsing to black/white.
  const hover = step(base, isDark ? 0.07 : -0.06);
  const pressed = step(base, isDark ? 0.13 : -0.12);

  return {
    [`--color-brand-default`]: solid(base),
    [`--primary`]: solid(base),
    [`--primary-hover`]: solid(hover),
    [`--primary-contrast`]: '#ffffff',
    [`--primary-tint`]: alpha(base, isDark ? 0.22 : 0.16),
    [`--primary-wash`]: alpha(base, isDark ? 0.1 : 0.05),
    // The glossy top-edge highlight reads on a coloured button in light mode, but a
    // white edge on the lighter dark-mode button would be muddy — drop it on dark.
    [`--btn-edge`]: isDark ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0.5)',
    [`--color-brand-hover`]: solid(hover),
    [`--color-brand-pressed`]: solid(pressed),
    [`--color-brand-loading`]: 'rgba(255,255,255,0.65)',
    [`--color-overlay-brand-focused`]: alpha(base, isDark ? 0.26 : 0.18),
    [`--color-overlay-brand-hover`]: alpha(base, isDark ? 0.14 : 0.07),
    [`--color-overlay-brand-pressed`]: alpha(base, isDark ? 0.2 : 0.12),
  };
};

const useColorTheme = () => {
  const { theme } = useContext(PageContext);

  useEffect(() => {
    const library = generateColorLibrary(theme === Theme.Dark);

    for (const [key, value] of Object.entries(library)) {
      document.body.style.setProperty(key, value);
    }
  }, [theme]);
};

export default useColorTheme;
