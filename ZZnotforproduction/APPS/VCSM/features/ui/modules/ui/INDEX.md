# INDEX — ui / ui
## Status: SOURCE_VERIFIED | 2026-06-05

---

## Module Summary

| Field | Value |
|-------|-------|
| Module | ui |
| Feature | ui |
| Type | Shared UI Primitives — Presentational Components |
| Source Directory | apps/VCSM/src/features/ui/modern/ |
| Source Files | 2 |
| Components | 5 |
| CSS Classes | 8 |
| Screens | 0 |
| Routes | 0 |
| State | None |
| Data Access | None |
| Depends On | styles/style (--vc-* tokens) |
| Governance Status | SOURCE_VERIFIED |

---

## Purpose

This module provides **stateless layout primitives** used across VCSM screens. These are pure presentational components — they accept structural props (children, variant, className) and apply layout + styling. They contain no business logic, no data fetching, no hooks, and no navigation.

All CSS classes reference `--vc-*` tokens from `styles/style`.

---

## Source File Inventory

| File | Lines | Purpose |
|------|-------|---------|
| `apps/VCSM/src/features/ui/modern/ModernPrimitives.jsx` | 100+ | React layout component library |
| `apps/VCSM/src/features/ui/modern/module-modern.css` | 69 | CSS utility class definitions |

---

## Component Library — ModernPrimitives.jsx

| Component | Props | Description |
|-----------|-------|-------------|
| `ModernPage` | `children`, `style?` | Full-viewport container; radial gradient background; padding: 18px |
| `ModernContainer` | `children`, `style?` | Max-width constraint (900px mobile, 1280px desktop); margin: auto; paddingBottom: 56px |
| `ModernShell` | `children`, `style?` | Card surface; borderRadius: 24px; border 1px solid rgba(255,255,255,0.12); backdrop-filter blur(18px); box-shadow |
| `ModernTopBar` | `left`, `title`, `right`, `style?` | Flex top bar with left / title / right slot pattern; padding: 14px |
| `ModernButton` | `children`, `variant`, `onClick?`, `style?`, `...rest` | Styled button; variant: "soft" \| "accent"; padding: 10px 13px; borderRadius: 14px; fontWeight: 900 |

---

## CSS Class Library — module-modern.css

| Class | Purpose |
|-------|---------|
| `.module-modern-page` | Full-viewport gradient background (matches ModernPage) |
| `.module-modern-shell` | Card border + card-bg + shadow-elevated |
| `.module-modern-search-shell` | Inset shadow variant for search inputs |
| `.module-modern-card` | Standard card border + card-bg |
| `.module-modern-input` | Border + surface-input + transition; focus: --vc-ring |
| `.module-modern-btn` | Base button styles |
| `.module-modern-btn--ghost` | Ghost/outline button variant |
| `.module-modern-btn--primary` | Primary accent button variant |

---

## Import Pattern

No barrel/index.js exists. Consumers import directly by path:

```js
import { ModernPage, ModernContainer, ModernShell, ModernTopBar, ModernButton }
  from '@/features/ui/modern/ModernPrimitives.jsx'
```

```css
/* CSS utility classes — imported in component CSS modules or inline via className */
import '@/features/ui/modern/module-modern.css'
```

---

## Token Dependency

All CSS classes and inline component styles reference `--vc-*` tokens:

```
ui/ui module
  └── consumes → styles/style (--vc-border, --vc-card-bg, --vc-shadow-elevated, --vc-ring, --vc-surface-input, ...)
```

If `styles/style` is not loaded, all visual styling in this module degrades silently.

---

## Governance Files

| File | Status |
|------|--------|
| INDEX.md | SOURCE_VERIFIED |
| BEHAVIOR.md | SOURCE_VERIFIED |
| ARCHITECTURE.md | SOURCE_VERIFIED |
| SECURITY.md | SOURCE_VERIFIED |
