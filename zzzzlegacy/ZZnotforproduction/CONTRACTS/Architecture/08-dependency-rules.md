# Dependency Rules
## VCSM Architecture Contract — §6 Dependency Rules (Locked)

> **Source:** [ARCHITECTURE.md](ARCHITECTURE.md) — Lines 1106–1177
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [07-adapter-contract.md](07-adapter-contract.md)
> **Cross-Links:** [03-layer-contracts.md](03-layer-contracts.md), [05-feature-boundaries.md](05-feature-boundaries.md), [06-module-contract.md](06-module-contract.md)

---

## §6 Dependency Rules (Locked)

### 6.1 Dependency Direction Rule

> **Purpose:** Prevent circular dependencies and preserve architectural clarity.

**Rule**

Dependencies must always flow in one direction.

Modules may only depend on modules below them in the architecture hierarchy.

Modules must never depend on modules above them.

**Allowed Dependency Flow**

```
screens
↓
features
↓
shared
↓
core
```

Higher layers may depend on lower layers.

Lower layers must never depend on higher layers.

---

### 6.2 Feature Dependency Rule

Features may depend on:

- shared utilities
- shared UI components
- core infrastructure

Features may not depend directly on other features unless through that feature's adapter boundary.

---

### 6.3 Circular Dependency Rule

Dependency cycles are forbidden.

Forbidden example:

```
explore → messages
messages → notifications
notifications → explore
```

If a cycle appears, the shared logic must be extracted into:

```
src/shared/
```

Both features may depend on shared modules, but shared modules must never depend on features.

---

### 6.4 DAG Principle

The system must form a Directed Acyclic Graph (DAG) of dependencies.

Dependencies always flow in one direction.

No cycles are allowed.

---

### 6.5 Approved Path Alias Exceptions

The `@/` prefix is the standard import path convention for all app-internal modules.

The following aliases resolve to paths **outside** `apps/VCSM/src/` and are registered
in `vite.config.js`. They cannot use the `@/` prefix and are approved for use as-is:

| Alias | Resolves To | Purpose |
|---|---|---|
| `@i18n` | `engines/i18n/index.js` | Internationalization engine |
| `@i18n/<path>` | `engines/i18n/<path>` | i18n sub-path imports |
| `@debuggers` | `ZZnotforproduction/_ACTIVE/debuggers` (dev) / `src/debuggers-stub` (prod) | Dev-only debug utilities — stripped in production |
| `@identity` | `engines/identity/index.js` | Identity engine |
| `@hydration` | `engines/hydration/index.js` | Hydration engine |
| `@chat` | `engines/chat/index.js` | Chat engine |
| `@reviews` | `engines/reviews/index.js` | Reviews engine |
| `@portfolio` | `engines/portfolio/index.js` | Portfolio engine |
| `@booking` | `engines/booking/index.js` | Booking engine |
| `@media` | `engines/media/index.js` | Media engine |
| `@notifications` | `src/features/notifications/runtime/index.js` | Notification runtime |

All other imports must use `@/` path aliases. Relative `../../` chains are forbidden.

Adding a new approved alias requires updating both `vite.config.js` and this table.
