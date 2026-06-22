# BEHAVIOR — styles / style
## Status: SOURCE_VERIFIED | 2026-06-05

---

## Behavior Inventory

| ID | Behavior | Source File | Status |
|----|----------|-------------|--------|
| BEH-STYLES-001 | Apply CSS reset to all elements | global.css | SOURCE_VERIFIED |
| BEH-STYLES-002 | Baseline html/body/root layout | global.css | SOURCE_VERIFIED |
| BEH-STYLES-003 | Normalize inputs and buttons | global.css | SOURCE_VERIFIED |
| BEH-STYLES-004 | Hide scrollbars globally | global.css | SOURCE_VERIFIED |
| BEH-STYLES-005 | Define safe-area CSS variables | global.css | SOURCE_VERIFIED |
| BEH-STYLES-006 | Define keyframe animations | global.css | SOURCE_VERIFIED |
| BEH-STYLES-007 | Provide --vc-background tokens | citizens-theme.css | SOURCE_VERIFIED |
| BEH-STYLES-008 | Provide --vc-surface tokens | citizens-theme.css | SOURCE_VERIFIED |
| BEH-STYLES-009 | Provide --vc-border tokens | citizens-theme.css | SOURCE_VERIFIED |
| BEH-STYLES-010 | Provide --vc-text tokens | citizens-theme.css | SOURCE_VERIFIED |
| BEH-STYLES-011 | Provide --vc-accent tokens | citizens-theme.css | SOURCE_VERIFIED |
| BEH-STYLES-012 | Provide --vc-semantic color tokens | citizens-theme.css | SOURCE_VERIFIED |
| BEH-STYLES-013 | Provide --vc-effect and shadow tokens | citizens-theme.css | SOURCE_VERIFIED |
| BEH-STYLES-014 | Provide --cit-* legacy alias tokens | citizens-theme.css | SOURCE_VERIFIED |

---

## BEH-STYLES-001 — CSS reset

**Source:** `apps/VCSM/src/styles/global.css`

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```

Applied universally. Ensures all elements start from a consistent baseline with no browser-default margin/padding.

---

## BEH-STYLES-002 — Baseline html/body/root layout

**Source:** `apps/VCSM/src/styles/global.css`

```css
html, body {
  height: 100%;
  font-family: system-ui, sans-serif;
  background: var(--vc-bg-1);
  color: var(--vc-text);
}

#root {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
```

Tokens used: `--vc-bg-1`, `--vc-text` (defined in citizens-theme.css, loaded after global.css).

---

## BEH-STYLES-003 — Normalize inputs and buttons

**Source:** `apps/VCSM/src/styles/global.css`

Inputs and buttons inherit font properties and reset border/background so component-level styling applies cleanly without fighting browser defaults.

---

## BEH-STYLES-004 — Hide scrollbars globally

**Source:** `apps/VCSM/src/styles/global.css`

```css
* {
  scrollbar-width: none;       /* Firefox */
  -ms-overflow-style: none;    /* IE/Edge */
}
*::-webkit-scrollbar {
  display: none;               /* Chrome/Safari/Opera */
}
```

Scrolling is still functional — only the scrollbar visual is hidden. This is the platform-wide design decision.

---

## BEH-STYLES-005 — Safe-area CSS variables

**Source:** `apps/VCSM/src/styles/global.css`

Defines safe-area inset variables for mobile devices with notches and home indicators:

```css
:root {
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
}
```

---

## BEH-STYLES-006 — Keyframe animations

**Source:** `apps/VCSM/src/styles/global.css`

Defines reusable keyframe animations referenced across the app:

| Animation | Effect |
|-----------|--------|
| `fadeInUp` | Fade in with upward translate |
| `pulse-dot` | Pulsing opacity for live indicators |
| `skeleton` | Shimmer/skeleton loading sweep |

---

## BEH-STYLES-007 through BEH-STYLES-013 — Design token groups

**Source:** `apps/VCSM/src/styles/citizens-theme.css`

All tokens are defined under `.citizens-theme` selector, which is applied to the App.jsx root element.

Token groups (see INDEX.md for full values):
- Background tiers (--vc-bg-0 through --vc-bg-2)
- Gradient stops (--vc-gradient-a, --vc-gradient-b)
- Surfaces (--vc-surface, --vc-surface-strong, --vc-surface-input)
- Borders (--vc-border, --vc-border-strong, --vc-border-subtle)
- Text (--vc-text, --vc-text-soft, --vc-text-muted)
- Accents (5 accent colors)
- Semantic (success, error, warning, danger)
- Effects (shadows, glow, card-bg, ring, backdrop-blur)

---

## BEH-STYLES-014 — Legacy alias tokens

**Source:** `apps/VCSM/src/styles/citizens-theme.css`

`--cit-*` tokens are aliased to their `--vc-*` equivalents. These exist for backwards compatibility with components written before the `--vc-*` naming convention was adopted.

**Policy:** No new code should use `--cit-*`. All new components must use `--vc-*`.

---

## Activation

These behaviors are purely declarative CSS — they activate at load time when the browser parses the stylesheets. No JavaScript, no event listeners, no runtime behavior.

```
main.jsx
  ├── import '@/styles/global.css'           → BEH-001 through BEH-006 activate
  └── import '@/styles/citizens-theme.css'   → BEH-007 through BEH-014 activate

App.jsx
  └── <div className="citizens-theme">       → all --vc-* tokens in scope
```
