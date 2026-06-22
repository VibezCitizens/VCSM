# Resolver Contract
## VCSM Architecture Contract — §2.8 Resolver Contract (Locked)

> **Source:** [ARCHITECTURE.md](ARCHITECTURE.md) — Lines 459–513
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [03-layer-contracts.md](03-layer-contracts.md)
> **Cross-Links:** [02-identity-contract.md](02-identity-contract.md), [11-naming-conventions.md](11-naming-conventions.md)

---

### 2.8 Resolver Contract

> **Purpose:** Resolvers are DI factory layers. They create injectable closures that are passed to shared engine `configure*()` functions at app startup. They answer one question only: *What VCSM-specific data does this shared engine need to perform its job?*

**When to use a Resolver**

A Resolver is only required when a feature needs to inject VCSM-specific data access behavior into a shared engine (e.g. `engines/identity/`). Most features do not need a Resolver.

**Resolvers may:**

- import Supabase
- query Supabase directly using explicit column projections (initialized-DAL pattern — supabase client is captured once at factory call time via closure)
- return factory functions that are passed to engine `configure*()` calls
- export multiple factory functions for different engine configuration needs

**Resolvers must:**

- live in a `resolvers/` sub-folder inside the feature root
- end with `.resolver.js`
- be wired exclusively through `setup.js` at app startup
- use explicit column projections (`.select('*')` is forbidden)
- be treated as DAL-equivalent in terms of privilege and review scope

**Resolvers must not:**

- be imported by components, hooks, screens, or controllers at runtime
- be called directly outside of `setup.js` DI wiring
- apply business rules, ownership logic, or domain transforms
- export functions that accept arbitrary caller-supplied supabase clients (dead export risk)
- contain UI logic

**Resolver naming**

```
features/<feature>/resolvers/<name>.resolver.js
```

Example:

```
features/identity/resolvers/vcsmIdentity.resolver.js
```

**Relationship to DAL**

A Resolver performs Supabase access like a DAL, but it is not a DAL file:

- A DAL is called at runtime by a controller or hook
- A Resolver is called at startup by `setup.js` to configure an engine; its returned closure is called by the engine at runtime
- A DAL uses the shared singleton Supabase client; a Resolver captures the client at factory creation time

**`setup.js` — DI Bootstrap File**

Each feature that uses a Resolver must have a `setup.js` file at the feature root. `setup.js` is the only file that calls Resolver factories and passes them to engine `configure*()` functions. It must be called once at app startup (e.g. `main.jsx`) before any components render.
