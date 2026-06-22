# BEHAVIOR — ui / ui
## Status: SOURCE_VERIFIED | 2026-06-05

---

## Behavior Inventory

| ID | Behavior | Source File | Status |
|----|----------|-------------|--------|
| BEH-UI-UI-001 | Render full-viewport page container with gradient background | ModernPrimitives.jsx | SOURCE_VERIFIED |
| BEH-UI-UI-002 | Constrain content width with responsive max-width container | ModernPrimitives.jsx | SOURCE_VERIFIED |
| BEH-UI-UI-003 | Render card shell with border, blur, and elevation | ModernPrimitives.jsx | SOURCE_VERIFIED |
| BEH-UI-UI-004 | Render top bar with left/title/right slot layout | ModernPrimitives.jsx | SOURCE_VERIFIED |
| BEH-UI-UI-005 | Render styled button with variant appearance | ModernPrimitives.jsx | SOURCE_VERIFIED |
| BEH-UI-UI-006 | Apply card utility classes via CSS | module-modern.css | SOURCE_VERIFIED |
| BEH-UI-UI-007 | Apply input utility classes via CSS | module-modern.css | SOURCE_VERIFIED |
| BEH-UI-UI-008 | Apply button utility classes via CSS | module-modern.css | SOURCE_VERIFIED |

---

## BEH-UI-UI-001 — ModernPage: full-viewport container

**Source:** `apps/VCSM/src/features/ui/modern/ModernPrimitives.jsx`

```jsx
<ModernPage>
  {children}
</ModernPage>
```

Renders a `div` with:
- `minHeight: '100vh'`
- Radial gradient background (purple top-left → transparent)
- `padding: 18px`

Used as the outermost wrapper for most screens. Provides the signature gradient look.

---

## BEH-UI-UI-002 — ModernContainer: responsive width constraint

**Source:** `apps/VCSM/src/features/ui/modern/ModernPrimitives.jsx`

```jsx
<ModernContainer>
  {children}
</ModernContainer>
```

Renders a `div` with:
- `maxWidth: '900px'` on mobile
- `maxWidth: '1280px'` on desktop (via media query)
- `margin: '0 auto'`
- `paddingBottom: '56px'` (accounts for bottom nav)

Constrains readable content width. Composed inside `ModernPage`.

---

## BEH-UI-UI-003 — ModernShell: card surface

**Source:** `apps/VCSM/src/features/ui/modern/ModernPrimitives.jsx`

```jsx
<ModernShell>
  {children}
</ModernShell>
```

Renders a `div` with:
- `borderRadius: 24px`
- `border: 1px solid rgba(255,255,255,0.12)`
- `backdropFilter: blur(18px)` + `-webkit-backdropFilter`
- `boxShadow` from `--vc-shadow-elevated`

Used to wrap panel content, drawer bodies, and card sections.

---

## BEH-UI-UI-004 — ModernTopBar: slot-based header

**Source:** `apps/VCSM/src/features/ui/modern/ModernPrimitives.jsx`

```jsx
<ModernTopBar
  left={<BackButton />}
  title="Screen Title"
  right={<ActionButton />}
/>
```

Renders a flex row with 3 named slots:
- `left` — icon, back button, avatar
- `title` — string or element (center-aligned)
- `right` — action, menu trigger, count badge

Padding: `14px`. Used as the top navigation bar for most screens.

---

## BEH-UI-UI-005 — ModernButton: styled action element

**Source:** `apps/VCSM/src/features/ui/modern/ModernPrimitives.jsx`

```jsx
<ModernButton variant="accent" onClick={handleSubmit}>
  Submit
</ModernButton>

<ModernButton variant="soft" onClick={handleCancel}>
  Cancel
</ModernButton>
```

Variants:
- `"soft"` — muted surface background, subtle border
- `"accent"` — `--vc-accent-primary` background, high contrast text

Base styles: `padding: 10px 13px`, `borderRadius: 14px`, `fontWeight: 900`.

---

## BEH-UI-UI-006 — CSS: card classes

**Source:** `apps/VCSM/src/features/ui/modern/module-modern.css`

- `.module-modern-shell` — border + `var(--vc-card-bg)` + `var(--vc-shadow-elevated)`
- `.module-modern-search-shell` — inset shadow variant for search inputs
- `.module-modern-card` — border + `var(--vc-card-bg)` (no shadow)

Used by components that cannot use `ModernShell` directly (e.g., list items, section dividers).

---

## BEH-UI-UI-007 — CSS: input class

**Source:** `apps/VCSM/src/features/ui/modern/module-modern.css`

- `.module-modern-input` — border + `var(--vc-surface-input)` background + transition on focus
- Focus state: `box-shadow: 0 0 0 2px var(--vc-ring)` — matches the platform focus ring pattern

---

## BEH-UI-UI-008 — CSS: button classes

**Source:** `apps/VCSM/src/features/ui/modern/module-modern.css`

- `.module-modern-btn` — base button utility (border radius, padding, font weight)
- `.module-modern-btn--ghost` — transparent background with border
- `.module-modern-btn--primary` — `var(--vc-accent-primary)` background

Used for inline buttons or when `ModernButton` JSX component is not available (CSS-only contexts).

---

## No Event-Driven or Data-Driven Behaviors

All behaviors in this module are **purely presentational**:
- No data fetching
- No side effects
- No navigation
- No state updates
- Props are structural (children, variant, slot content) — not data

All event handling (`onClick`, etc.) is passed through `...rest` — the component does not own any event logic.
