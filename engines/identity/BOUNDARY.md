# Identity Engine — Boundary Protection Rules

**Purpose:** Prevent app-specific logic from leaking into the engine core.
**Applies to:** All code under `engines/identity/`
**Enforcement:** Manual code review + import boundary checks

---

## 1. Forbidden Imports

No file inside `engines/identity/` may import from:

```
apps/*                          — never
engines/chat/*                  — never
engines/hydration/*             — never
engines/feed/*                  — never
shared/*                        — never
```

The ONLY external dependency allowed is the Supabase client, injected via `configureIdentityEngine()`.

---

## 2. Forbidden Schema References

No DAL file inside `engines/identity/` may reference:

```
.schema("vc")                   — belongs to VCSM
.schema("learning")             — belongs to Wentrex
.schema("chat")                 — belongs to chat engine
.schema("moderation")           — belongs to chat engine
.schema("wanders")              — belongs to VCSM
.from("actors")                 — ambiguous; use platform.user_app_actor_links
```

The engine reads/writes ONLY from `.schema("platform")` and `supabase.auth.*`.

---

## 3. Forbidden Naming

No export from `engines/identity/src/adapters/index.js` may contain:

```
Vcsm, VCSM, vcsm               — app-specific
Wentrex, wentrex                — app-specific
Barber, barber                  — domain-specific
Learning, learning              — domain-specific
Citizen, citizen                — product-specific
Vport, vport                    — product-specific
```

Public exports must use neutral names only:
- `resolveAuthenticatedContext` (not `resolveVcsmContext`)
- `resolveAvailableActors` (not `resolveVcActors`)
- `configureIdentityEngine` (not `configureVcsmIdentity`)

---

## 4. Forbidden Patterns

### No app-specific resolver implementations inside the engine

```
BAD:  engines/identity/src/resolvers/vcsmIdentity.resolver.js
GOOD: apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js

BAD:  engines/identity/src/resolvers/wentrexIdentity.resolver.js
GOOD: apps/wentrex/src/features/identity/resolvers/wentrexIdentity.resolver.js
```

### No app-specific role interpretation

```
BAD:  if (roleKeys.includes('teacher')) { ... }
BAD:  if (actorKind === 'vport') { ... }
GOOD: return { roleKeys }  // app interprets
```

### No app-specific destination logic

```
BAD:  return roleKeys.includes('admin') ? '/dashboard' : '/feed'
GOOD: return state?.defaultDestinationKey ?? null
```

### No conditional logic based on appKey

```
BAD:  if (appKey === 'vcsm') { ... } else if (appKey === 'wentrex') { ... }
GOOD: const resolver = getAppContextResolver()
      if (resolver) { return resolver({ ... }) }
```

---

## 5. Injection Points (Where App Logic Enters)

All app-specific behavior enters through these DI points ONLY:

| Injection point | Config key | Purpose |
| --- | --- | --- |
| App context resolver | `resolveAppContext` | Replaces platform-schema queries for actors/roles/capabilities |
| Actor link enricher | `enrichActorLinks` | Overrides snapshot data with live actor data |
| Debug reporter | `debugReporter` | App-owned instrumentation sink |

If you need a new app-specific behavior, ADD A NEW INJECTION POINT.
Do not add app-specific code to the engine core.

---

## 6. Code Review Checklist

Before merging any change to `engines/identity/`:

- [ ] No imports from `apps/`, `engines/chat/`, `engines/hydration/`, `shared/`
- [ ] No `.schema("vc")`, `.schema("learning")`, `.schema("chat")` in any DAL file
- [ ] No app-specific names in public API exports (VCSM, Wentrex, barber, etc.)
- [ ] No conditional logic branching on `appKey` values
- [ ] No app-specific role/capability interpretation
- [ ] No React code (components, hooks, providers, context)
- [ ] No HTTP handlers or WebSocket logic
- [ ] No resolver implementations (only resolver contracts/types)
- [ ] All new public API exports go through `src/adapters/index.js`
- [ ] DAL files use explicit column projections (no `.select('*')`)
- [ ] All database queries target `platform.*` only
- [ ] New DI points documented in CONTRACT.md

---

## 7. Lint / Import Boundary Recommendation

If using ESLint, add this no-restricted-imports rule:

```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [
        { "group": ["**/apps/**"], "message": "Engine must not import from apps/" },
        { "group": ["**/engines/chat/**"], "message": "Engine must not import from chat engine" },
        { "group": ["**/engines/hydration/**"], "message": "Engine must not import from hydration engine" },
        { "group": ["**/shared/**"], "message": "Engine must not import from shared/" }
      ]
    }]
  }
}
```

---

## 8. What Belongs Where

| Item | Location | Why |
| --- | --- | --- |
| Session resolution | `engines/identity/` | Neutral — reads supabase auth |
| App access gate | `engines/identity/` | Neutral — reads platform.user_app_access |
| Actor link resolution | `engines/identity/` | Neutral — reads platform.user_app_actor_links |
| Active actor selection | `engines/identity/` | Neutral — preference/state-based algorithm |
| Role key aggregation | `engines/identity/` | Neutral — reads platform.app_roles |
| VCSM actor enrichment | `apps/VCSM/` | VCSM-specific — reads vc.actors, profiles |
| Wentrex role derivation | `apps/wentrex/` | Wentrex-specific — reads learning.* tables |
| VCSM provisioning RPC | `apps/VCSM/` | VCSM-specific — calls provision_vcsm_identity |
| Wentrex provisioning RPC | `apps/wentrex/` | Wentrex-specific — calls provision_wentrex_identity |
| Identity UI (useIdentity hook) | `apps/<app>/` | App-specific — wraps engine output for React |
| Actor switching UI | `apps/<app>/` | App-specific — product-level UX decision |
| Debug reporter implementation | `apps/<app>/` | App-specific — app-owned instrumentation |

---

## 9. Regression Detection

If any of these appear in a PR touching `engines/identity/`:

- A new file under `src/resolvers/` — **REJECT** (resolvers belong in apps)
- An import path containing `apps/` — **REJECT**
- A `.schema("vc")` or `.schema("learning")` call — **REJECT**
- An export named with `Vcsm`, `Wentrex`, or app-specific terms — **REJECT**
- A new React import (`react`, `useState`, `useEffect`) — **REJECT**
- A new `if (appKey === '...')` conditional — **REJECT** (use DI instead)

These are non-negotiable boundary violations.
