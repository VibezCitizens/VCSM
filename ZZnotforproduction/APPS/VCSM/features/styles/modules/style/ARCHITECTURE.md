# ARCHITECTURE — styles / style
## Status: SOURCE_VERIFIED | 2026-06-05

---

## Module Classification

| Field | Value |
|-------|-------|
| Type | CSS Design Token Foundation |
| Runtime | None — pure declarative CSS |
| JS / JSX | None |
| State | None |
| Data Access | None |
| Blast Radius | GLOBAL — changes affect every component in the app |
| Load Point | main.jsx (app boot, before render) |

---

## Load Order

```
apps/VCSM/src/main.jsx
  import '@/styles/global.css'            (1st)
  import '@/styles/citizens-theme.css'    (2nd)

apps/VCSM/src/App.jsx
  <div className="citizens-theme">        (token scope activated)
```

**Critical:** `global.css` must load before `citizens-theme.css`. The baseline reset in global.css must not inherit any token values that have not yet been defined.

---

## Source File Map

| File | Type | Lines | Responsibility |
|------|------|-------|----------------|
| `apps/VCSM/src/styles/global.css` | CSS | 100+ | Reset, baseline layout, input normalization, scrollbar hide, keyframe animations, safe-area variables |
| `apps/VCSM/src/styles/citizens-theme.css` | CSS | 79 | All --vc-* custom property definitions |

---

## Token Architecture

All design tokens are defined as CSS custom properties under the `.citizens-theme` class selector. This scopes all tokens to the App.jsx root container and makes them available to every descendant element via CSS custom property inheritance.

```
:root  (no tokens here)
  └── .citizens-theme   (App.jsx root div)
        └── all --vc-* tokens defined here
              └── all components/screens inherit tokens via CSS cascade
```

**Why `.citizens-theme` not `:root`:** Class-scoped tokens allow the theme to be swapped or nested in the future without affecting `:root` globally.

---

## Token Domain Map

```
citizens-theme.css
  ├── backgrounds       --vc-bg-0, --vc-bg-1, --vc-bg-2
  ├── gradients         --vc-gradient-a, --vc-gradient-b
  ├── surfaces          --vc-surface, --vc-surface-strong, --vc-surface-input
  ├── borders           --vc-border, --vc-border-strong, --vc-border-subtle
  ├── text              --vc-text, --vc-text-soft, --vc-text-muted
  ├── accents           --vc-accent-primary, --vc-accent-primary-hover,
  │                     --vc-accent-secondary, --vc-accent-tertiary, --vc-accent-pink
  ├── semantic          --vc-success, --vc-error, --vc-warning, --vc-danger-a, --vc-danger-b
  ├── effects           --vc-shadow-card, --vc-shadow-elevated, --vc-shadow-glow,
  │                     --vc-card-bg, --vc-ring, --vc-backdrop-blur
  └── legacy aliases    --cit-* → maps to --vc-*
```

---

## Animation Layer (global.css)

```
@keyframes fadeInUp { ... }    → Used by: modal enter, card reveal
@keyframes pulse-dot { ... }   → Used by: live status indicators
@keyframes skeleton { ... }    → Used by: skeleton loading states
```

Referenced as `animation: fadeInUp 0.2s ease`, etc. in component CSS files.

---

## Dependencies

None. This module has no imports, no JavaScript, no external services.

```
styles/style
  └── (no dependencies)
```

All components depend on this module — it does not depend on any of them.

---

## Consumers

Everything. Every React component that uses a `--vc-*` token or a global CSS class is a downstream consumer. This makes the blast radius of any change GLOBAL.

Known critical consumers:
- `apps/VCSM/src/features/ui/modern/module-modern.css` — all classes use `--vc-*`
- `apps/VCSM/src/App.jsx` — applies `.citizens-theme` class
- All feature-level CSS modules — reference `--vc-*` tokens

---

## Change Policy

Changes to `citizens-theme.css` or `global.css` require:
1. Visual regression check across all major screens
2. THOR gate review (global blast radius)
3. No --cit-* tokens to be added or modified (legacy only — no new usage)

---

## Invariants

1. `global.css` loads before `citizens-theme.css` — always.
2. All design token values live exclusively in `citizens-theme.css` — no token values in component CSS files.
3. New code uses `--vc-*` only — never `--cit-*` or raw values.
4. `.citizens-theme` class must be on the App.jsx root div — removing it breaks all token inheritance.
5. No JavaScript in this module — ever. All behavior is declarative CSS.

---

## Completeness

| Area | Status |
|------|--------|
| Global reset | COMPLETE |
| Token definitions | COMPLETE |
| Keyframe animations | COMPLETE |
| Safe-area variables | COMPLETE |
| Legacy aliases | COMPLETE |
| Visual regression tests | MISSING |
| Ownership documentation | MISSING |
