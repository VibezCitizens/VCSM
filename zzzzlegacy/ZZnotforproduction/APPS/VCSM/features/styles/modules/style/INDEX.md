# INDEX — styles / style
## Status: SOURCE_VERIFIED | 2026-06-05

---

## Module Summary

| Field | Value |
|-------|-------|
| Module | style |
| Feature | styles |
| Type | CSS Design Token Foundation |
| Source Directory | apps/VCSM/src/styles/ |
| Source Files | 2 (CSS only) |
| JS / JSX Files | 0 |
| Screens | 0 |
| Routes | 0 |
| Load Order | global.css → citizens-theme.css (both in main.jsx) |
| Applied On | App.jsx root (className="citizens-theme") |
| Blast Radius | GLOBAL — changes affect entire app |
| Governance Status | SOURCE_VERIFIED |

---

## Purpose

This module owns the **CSS design token foundation** for the entire VCSM app. It consists of two CSS files loaded at boot:

1. **global.css** — CSS reset, html/body/root baseline, input/button normalization, scrollbar hide, keyframe animations, safe-area variables
2. **citizens-theme.css** — single source of truth for all `--vc-*` custom properties (30+ design tokens)

All components in the app consume `--vc-*` tokens from this module. No component should define its own color, shadow, or spacing values outside these tokens.

---

## Source File Inventory

| File | Lines | Purpose |
|------|-------|---------|
| `apps/VCSM/src/styles/global.css` | 100+ | CSS reset, baseline, animations, safe-area |
| `apps/VCSM/src/styles/citizens-theme.css` | 79 | All --vc-* design tokens (single source of truth) |

---

## Token Inventory — citizens-theme.css

### Background Tiers

| Token | Value | Use |
|-------|-------|-----|
| `--vc-bg-0` | `#0b0b0f` | Deepest background |
| `--vc-bg-1` | `#0e0d14` | Soft page background |
| `--vc-bg-2` | `#13121a` | Elevated background |

### Page Gradient

| Token | Value |
|-------|-------|
| `--vc-gradient-a` | `rgba(108, 77, 246, 0.15)` — purple top-left |
| `--vc-gradient-b` | `rgba(59, 130, 246, 0.10)` — blue bottom-right |

### Surfaces

| Token | Value |
|-------|-------|
| `--vc-surface` | `rgba(20, 18, 30, 0.66)` |
| `--vc-surface-strong` | `rgba(26, 22, 38, 0.84)` |
| `--vc-surface-input` | `rgba(14, 12, 22, 0.78)` |

### Borders

| Token | Value |
|-------|-------|
| `--vc-border` | `rgba(139, 92, 246, 0.18)` — purple tinted |
| `--vc-border-strong` | `rgba(139, 92, 246, 0.28)` |
| `--vc-border-subtle` | `rgba(139, 92, 246, 0.10)` |

### Text

| Token | Value |
|-------|-------|
| `--vc-text` | `#f0eef5` — primary text |
| `--vc-text-soft` | `#d1d0d8` — secondary text |
| `--vc-text-muted` | `#9892a6` — placeholder / muted |

### Accent Colors

| Token | Value |
|-------|-------|
| `--vc-accent-primary` | `#8b5cf6` — purple |
| `--vc-accent-primary-hover` | `#a78bfa` |
| `--vc-accent-secondary` | `#4ea4ff` — blue |
| `--vc-accent-tertiary` | `#42d3ff` — cyan |
| `--vc-accent-pink` | `#ff69c6` |

### Semantic Colors

| Token | Value |
|-------|-------|
| `--vc-success` | `#22c55e` |
| `--vc-error` | `#ef4444` |
| `--vc-warning` | `#f59e0b` |
| `--vc-danger-a` | (gradient danger start) |
| `--vc-danger-b` | (gradient danger end) |

### Effects & Shadows

| Token | Purpose |
|-------|---------|
| `--vc-shadow-card` | Standard card shadow |
| `--vc-shadow-elevated` | Elevated surface shadow |
| `--vc-shadow-glow` | Accent glow effect |
| `--vc-card-bg` | Card background gradient preset |
| `--vc-ring` | Focus ring |
| `--vc-backdrop-blur` | Backdrop blur value |

### Legacy Compatibility

`--cit-*` tokens are aliased to `--vc-*` equivalents for backwards compatibility with older components. New code must use `--vc-*`.

---

## Load Order

```
apps/VCSM/src/main.jsx
  ├── import '@/styles/global.css'        ← FIRST
  └── import '@/styles/citizens-theme.css'  ← SECOND
```

---

## Governance Files

| File | Status |
|------|--------|
| INDEX.md | SOURCE_VERIFIED |
| BEHAVIOR.md | SOURCE_VERIFIED |
| ARCHITECTURE.md | SOURCE_VERIFIED |
| SECURITY.md | SOURCE_VERIFIED |
