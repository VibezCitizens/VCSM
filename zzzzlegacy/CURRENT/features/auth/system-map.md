# VCSM System Map
Generated: 2026-05-01

---

## Applications

| App | Path | Type |
|-----|------|------|
| VCSM | `apps/VCSM/` | Social commerce platform (Instagram + Airbnb hybrid) |
| Wentrex | `apps/wentrex/` | Standalone multi-tenant LMS SaaS |
| Traffic | `apps/Traffic/` | Programmatic SEO directory engine (Next.js 14) |

---

## Engines (shared, consumed by apps)

| Engine | Path | Status |
|--------|------|--------|
| booking | `engines/booking/` | Active — consumed by VCSM |
| chat | `engines/chat/` | Active — consumed by VCSM |
| feed | `engines/feed/` | Available |
| hydration | `engines/hydration/` | Active — consumed by VCSM |
| identity | `engines/identity/` | Active — consumed by VCSM |
| media | `engines/media/` | Active — consumed by VCSM |
| notifications | `engines/notifications/` | Active — consumed by VCSM |
| portfolio | `engines/portfolio/` | Active — consumed by VCSM |
| reviews | `engines/reviews/` | Active — consumed by VCSM |

---

## VCSM Application Structure

```
apps/VCSM/src/
├── features/          36 features
├── engines/           engine setup bindings
├── learning/          embedded LMS (not Wentrex)
├── state/             Zustand stores
├── services/          Supabase client
├── dev/               diagnostics + debuggers
└── styles/            citizens-theme.css (token source of truth)
```

---

## Structural Boundaries

- Apps NEVER import from each other
- Apps consume engines via `@/features/*/setup` abstraction layer
- No direct `/engines/` imports in app source code
- Traffic is isolated — no auth, no DB, no engine imports
