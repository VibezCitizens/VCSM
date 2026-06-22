# ARCHITECTURE — ui / ui
## Status: SOURCE_VERIFIED | 2026-06-05

---

## Module Classification

| Field | Value |
|-------|-------|
| Type | Shared UI Primitives — Presentational Layer |
| Pattern | Stateless layout components + CSS utility classes |
| State | None |
| Data Access | None |
| Hooks | None |
| Router | None |
| Dependency | styles/style (--vc-* CSS custom properties) |

---

## Layer Position

```
[Any VCSM Screen or Feature Component]
  └── imports ModernPage, ModernContainer, ModernShell, ModernTopBar, ModernButton
        └── apps/VCSM/src/features/ui/modern/ModernPrimitives.jsx
              └── consumes --vc-* tokens
                    └── apps/VCSM/src/styles/citizens-theme.css   (styles/style module)
```

This module sits between feature screens (consumers) and the token foundation (styles/style). It translates design tokens into reusable layout primitives.

---

## Source File Map

| File | Layer | Lines | Exports |
|------|-------|-------|---------|
| `apps/VCSM/src/features/ui/modern/ModernPrimitives.jsx` | React primitives | 100+ | `ModernPage`, `ModernContainer`, `ModernShell`, `ModernTopBar`, `ModernButton` |
| `apps/VCSM/src/features/ui/modern/module-modern.css` | CSS utilities | 69 | 8 CSS class definitions |

---

## Component Architecture

### ModernPage

```
ModernPage
  └── div
        style: {
          minHeight: '100vh',
          background: 'radial-gradient(ellipse at top left, rgba(108,77,246,0.15), transparent)',
          padding: '18px'
        }
        children
```

### ModernContainer

```
ModernContainer
  └── div
        style: {
          maxWidth: '900px',  // mobile
          maxWidth: '1280px', // desktop (media query)
          margin: '0 auto',
          paddingBottom: '56px'
        }
        children
```

### ModernShell

```
ModernShell
  └── div
        style: {
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          boxShadow: var(--vc-shadow-elevated)
        }
        children
```

### ModernTopBar

```
ModernTopBar
  └── div (flex, justify-between, align-center, padding: 14px)
        ├── div.left   ← props.left
        ├── div.title  ← props.title (center)
        └── div.right  ← props.right
```

### ModernButton

```
ModernButton
  └── button
        variant="soft"   → muted surface background, border
        variant="accent" → --vc-accent-primary background
        padding: '10px 13px'
        borderRadius: '14px'
        fontWeight: 900
        onClick, ...rest (passthrough)
```

---

## CSS Architecture — module-modern.css

All 8 classes consume `--vc-*` tokens exclusively:

```css
.module-modern-shell {
  border: 1px solid var(--vc-border);
  background: var(--vc-card-bg);
  box-shadow: var(--vc-shadow-elevated);
}

.module-modern-input {
  border: 1px solid var(--vc-border);
  background: var(--vc-surface-input);
  transition: box-shadow 0.15s;
}
.module-modern-input:focus {
  box-shadow: 0 0 0 2px var(--vc-ring);
}

.module-modern-btn--primary {
  background: var(--vc-accent-primary);
}
```

---

## Import Boundary

No `index.js` barrel exists. All consumers import directly:

```js
// JSX components
import { ModernPage, ModernContainer } from '@/features/ui/modern/ModernPrimitives.jsx'

// CSS utility classes
import '@/features/ui/modern/module-modern.css'
```

**Known gap:** Absence of a barrel file means there is no enforced import boundary. Consumers reach into the `modern/` subfolder directly. If additional subfolders are added to `features/ui/`, each would need its own direct import path.

---

## External Dependencies

| Dependency | Type | Purpose |
|-----------|------|---------|
| `styles/style` | CSS module | --vc-* tokens consumed by all CSS classes and inline styles |
| React | Framework | JSX rendering for all components |

No external npm packages beyond React.

---

## Invariants

1. No component in this module should access data, call hooks, or perform navigation.
2. All CSS classes must use `--vc-*` tokens — no hardcoded color, shadow, or border values.
3. `ModernButton` must spread `...rest` — it owns no event logic itself.
4. `ModernTopBar` must always render exactly 3 slots (left, title, right) — even if some are `null`.
5. Backdrop blur on `ModernShell` requires a non-transparent background behind it to be visible — components must not compose `ModernShell` on a pure white or transparent parent.

---

## Completeness

| Area | Status |
|------|--------|
| Layout primitives | COMPLETE |
| CSS utility classes | COMPLETE |
| Token dependency | COMPLETE |
| Barrel / index.js | MISSING |
| Tests | MISSING |
| Storybook / visual documentation | MISSING |
| Additional component variants | FRAGMENTED (only "modern" subfolder exists) |
