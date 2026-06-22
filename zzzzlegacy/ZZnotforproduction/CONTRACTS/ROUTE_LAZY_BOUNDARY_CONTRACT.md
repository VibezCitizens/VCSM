# Route Lazy Boundary Contract

## Purpose

Defines the only approved locations for dynamic imports used with `React.lazy()` code-splitting, and the restrictions on what those imports may target.

---

## Route Manifest Exception

Route manifest files may dynamically import feature screens for code splitting.

**Approved route manifest files:**

- `app/routes/lazyApp.jsx`
- `app/routes/lazyPublic.jsx`

These are the **only** files where dynamic imports may target feature screen files directly.

This exception exists because `React.lazy()` requires a module-level dynamic import target, and feature adapters expose named static exports — not default exports — making them incompatible with the standard lazy wrapper pattern.

---

## Restrictions

Route manifests may only lazy-import:

- Final screens
- View screens explicitly approved for routing

Route manifests **must never** lazy-import:

- DAL files
- Models
- Controllers
- Hooks
- Internal components
- Feature utilities
- Private sub-components

Violation severity: **ERROR** — same level as cross-feature boundary imports.

---

## Feature Requirement

Any screen imported by a route manifest must be considered part of the feature's public route surface.

The screen must be either:

1. Exported from the feature adapter, **or**
2. Listed in a route surface manifest

**Example — compliant:**

```js
// feature adapter
export { CentralFeedScreen } from '@/features/CentralFeed/screens/CentralFeedScreen'

// lazyApp.jsx — allowed because the screen is on the adapter's public surface
const CentralFeedScreen = React.lazy(() =>
  import('@/features/CentralFeed/screens/CentralFeedScreen').then(m => ({ default: m.CentralFeedScreen }))
)
```

**Example — violation:**

```js
// lazyApp.jsx — FORBIDDEN: targets an internal component, not a public screen
const SomeWidget = React.lazy(() =>
  import('@/features/CentralFeed/components/SomeWidget')
)
```

---

## Enforcement

| Violation | Severity |
|---|---|
| Dynamic import in a non-manifest file | ERROR |
| Manifest imports non-screen target (DAL, model, hook, component) | ERROR |
| Screen on manifest not exported from adapter and not in route surface manifest | HIGH |

---

## Relationship to Adapter Contract

This contract is a specialization of the Adapter Contract (Architecture §7). The adapter boundary governs external consumers at import time. This contract governs route manifests specifically, which require dynamic imports that cannot go through a static adapter export. The two are complementary, not contradictory.

See also: [[INTERNAL_FEATURE_SELF_IMPORT_CONTRACT]]
