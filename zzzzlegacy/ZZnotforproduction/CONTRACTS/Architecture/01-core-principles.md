# Core Principles
## VCSM Architecture Contract — §1 Global Rules (Locked)

> **Source:** [ARCHITECTURE.md](ARCHITECTURE.md) — Lines 9–20, 119–153
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads Before:** [02-identity-contract.md](02-identity-contract.md), [03-layer-contracts.md](03-layer-contracts.md)

---

## System Design Goals

This architecture enforces clear ownership of meaning, authority, and responsibility across the system.

Each layer answers exactly one question and nothing more.

The system is designed to remain:

- modular
- predictable
- scalable
- refactorable
- safe for multiple engineers

---

## §1 Global Rules (Locked)

### 1.1 Import Path Rule

All new imports must use:

```
@/...
```

Relative imports like the following are forbidden in new modules:

```
../../..
```

---

### 1.2 Module Build Order Rule

All future modules must be built in this order:

```
DAL
Model
Controller
Hooks
Components
View Screen
Final Screen
```

This order is mandatory.

A layer must not be built before the layer below it is defined.
