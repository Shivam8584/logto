import { absoluteDarken, absoluteLighten } from '@logto/core-kit';
import { Theme } from '@logto/schemas';
import color from 'color';
import { useEffect, useContext } from 'react';

import PageContext from '@/Providers/PageContextProvider/PageContext';

/**
 * Hypedrive brand is a neutral near-black — we intentionally IGNORE the tenant's
 * configured `primaryColor` (historically a purple) so the experience always
 * renders in the Hypedrive design language. The brand colour drives buttons,
 * input carets, focus rings and links; pinning it keeps the whole UI consistent
 * and purple-free regardless of tenant config.
 */
const BRAND_LIGHT = '#0e1116';
const BRAND_DARK = '#fafafa';

const generateColorLibrary = (primaryColor: color, isDark: boolean) => ({
  [`--color-brand-default`]: primaryColor.hex(),
  // Keep the static design-token primary (used by .btn-primary / focus rings /
  // carets in index.css) in lockstep with the runtime brand so the primary
  // button inverts to near-white on dark backgrounds instead of staying
  // near-black (which read as a low-contrast dark-on-dark block).
  [`--primary`]: primaryColor.hex(),
  [`--primary-hover`]: isDark ? absoluteLighten(primaryColor, 8).string() : '#000000',
  [`--primary-contrast`]: isDark ? '#0e1116' : '#ffffff',
  [`--primary-tint`]: primaryColor.alpha(0.16).string(),
  [`--primary-wash`]: primaryColor.alpha(0.06).string(),
  // The glossy top-edge highlight reads on a dark button but must disappear on a
  // light (dark-mode) button, where a white edge would be invisible / muddy.
  [`--btn-edge`]: isDark ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0.85)',
  [`--color-brand-hover`]: isDark ? absoluteLighten(primaryColor, 8).string() : '#000000',
  [`--color-brand-pressed`]: isDark ? absoluteDarken(primaryColor, 8).string() : '#000000',
  [`--color-brand-loading`]: isDark ? absoluteDarken(primaryColor, 12).string() : '#2a2a2a',
  // Neutral focus/hover overlays — derived from the near-black brand so they
  // read as soft grey washes, never a coloured tint.
  [`--color-overlay-brand-focused`]: primaryColor.alpha(0.16).string(),
  [`--color-overlay-brand-hover`]: primaryColor.alpha(0.06).string(),
  [`--color-overlay-brand-pressed`]: primaryColor.alpha(0.1).string(),
});

const useColorTheme = () => {
  const { theme } = useContext(PageContext);

  useEffect(() => {
    const isDark = theme === Theme.Dark;
    const brand = color(isDark ? BRAND_DARK : BRAND_LIGHT);
    const library = generateColorLibrary(brand, isDark);

    for (const [key, value] of Object.entries(library)) {
      document.body.style.setProperty(key, value);
    }
  }, [theme]);
};

export default useColorTheme;
