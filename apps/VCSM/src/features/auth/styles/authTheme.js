/**
 * Shared dark theme constants for auth, legal, and public-facing screens.
 *
 * Values mirror the --vc-* CSS custom properties from citizens-theme.css.
 * Used for inline `style={}` props where CSS classes aren't practical.
 *
 * To switch themes: update citizens-theme.css — these values follow.
 * If you need runtime theme switching, read from getComputedStyle instead.
 */

export const authTheme = {
  // Page background — matches .vc-dynamic-gradient
  pageBackground:
    'radial-gradient(900px 500px at 15% 10%, var(--vc-gradient-a), transparent 60%), ' +
    'radial-gradient(800px 420px at 85% 90%, var(--vc-gradient-b), transparent 60%), ' +
    'var(--vc-bg-0)',

  // Card background — matches --vc-card-bg
  cardBackground: 'var(--vc-card-bg)',
  cardShadow:
    '0 30px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)',
}
