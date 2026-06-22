# Internal Feature Self-Import Contract

## Purpose

Clarifies that the adapter boundary applies only to **external consumers** of a feature. Internal imports within the same feature are governed by the layer contract, not the adapter boundary.

---

## Core Rule

**Same-feature internal imports are allowed when they follow the layer contract.**

The adapter boundary exists to protect a feature from uncontrolled external coupling. It does not prohibit a feature from importing its own internal layers.

---

## Layer Contract (Internal Direction)

Internal imports must respect the layering hierarchy:

```
screens
  → hooks
    → controllers
      → models
        → DAL
```

Upper layers may import from lower layers. Lower layers must never import from upper layers.

**Allowed — upper imports lower:**

```js
// features/auth/login/hooks/useLogin.js
import { ctrlLogin } from '@/features/auth/login/controllers/login.controller'
```

**Allowed — controller imports model:**

```js
// features/auth/login/controllers/login.controller.js
import { LoginModel } from '@/features/auth/login/models/login.model'
```

**Violation — lower imports upper (circular / inverted):**

```js
// features/auth/login/controllers/login.controller.js
// FORBIDDEN: controller importing a hook
import { useLoginState } from '@/features/auth/login/hooks/useLogin'
```

---

## What This Rule Does NOT Change

- External features must still go through the adapter. This rule does not relax external import restrictions.
- Cross-feature imports remain forbidden regardless of which layer initiates them.
- The adapter still defines the public surface for all external consumers.

---

## Relationship to Adapter Contract

The adapter contract (Architecture §7) governs the external boundary. This contract governs the internal layer structure within that boundary. They operate at different scopes and are both required.

**Adapter boundary** — controls what external code can consume.  
**Layer contract** — controls how a feature's own layers interact.

See also: [[ROUTE_LAZY_BOUNDARY_CONTRACT]]

---

## Enforcement

| Violation | Severity |
|---|---|
| Lower layer importing from upper layer within same feature | ERROR |
| External feature bypassing the adapter of another feature | ERROR (Adapter Contract) |
| Same-feature import that follows layer direction | Allowed — no violation |
