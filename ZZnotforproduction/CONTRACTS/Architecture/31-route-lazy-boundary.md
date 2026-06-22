# §31 — Route Lazy Boundary

## Rule

Dynamic imports using `React.lazy()` are allowed **only** in the two approved route manifest files:

- `app/routes/lazyApp.jsx`
- `app/routes/lazyPublic.jsx`

No other file may use a dynamic import to target a feature screen.

## Allowed Targets

Route manifests may only lazy-import final screens or view screens that are part of the feature's public route surface (exported from the adapter, or listed in a route surface manifest).

## Forbidden Targets

Route manifests must never lazy-import: DAL files, models, controllers, hooks, internal components, feature utilities, or private sub-components.

## Enforcement

| Violation | Severity |
|---|---|
| Dynamic import outside approved manifest files | ERROR |
| Manifest imports non-screen target | ERROR |
| Screen on manifest not on adapter or route surface manifest | HIGH |

Source: `ROUTE_LAZY_BOUNDARY_CONTRACT.md`
