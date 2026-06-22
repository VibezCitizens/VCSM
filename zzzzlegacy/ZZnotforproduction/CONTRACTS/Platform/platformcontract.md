# Platform Architecture Contract (Locked)

> **Document Type:** Architecture Contract
> **Scope:** Entire platform workspace (`VC/`)
> **Status:** Locked — no changes without explicit contract revision
> **Change Rule:** Wording changes require contract revision; formatting changes must preserve all meaning

This contract defines the structural rules for the entire platform workspace.

The platform is composed of three primary layers:

- Apps
- Engines
- Shared

Each layer has a strict responsibility and dependency direction.

The purpose of this contract is to guarantee:

- modular architecture
- cross-app reuse
- safe multi-product development
- deterministic dependency flow
- compatibility across web and mobile platforms

---

## Platform Structure

All code must live within the following root structure.

```
VC/
  apps/
  engines/
  shared/
  contract/
```

No code may exist outside these boundaries.

---

## Layer Definitions

### Apps Layer

Location:

```
apps/<app-name>
```

Apps represent end-user products.

Examples:

```
apps/vibez-web
apps/wentrex-web
apps/vibez-ios
```

Apps are responsible for:

- routing
- layouts
- branding
- product-specific UI
- feature composition
- policy adapters
- user experience flows

Apps consume engines.

Apps must not depend on other apps.

### Engines Layer

Location:

```
engines/<engine-name>
```

Engines provide reusable domain capabilities.

Examples:

```
engines/chat
engines/notifications
engines/search
engines/payments
```

Engines are application-agnostic modules that provide business capabilities.

Examples of responsibilities:

- chat conversations
- notifications
- search indexing
- payment processing
- analytics

Engines must not contain product-specific logic.

Engines are consumed by apps.

### Shared Layer

Location:

```
shared/<module-name>
```

Shared modules provide domain-neutral primitives.

Examples:

```
shared/core
shared/ui
shared/utils
```

Shared modules contain:

- types
- utilities
- generic UI primitives
- shared infrastructure helpers

Shared modules must never depend on apps or engines.

---

## Dependency Direction Rule

Dependencies must always flow downward.

Allowed:

```
apps → engines → shared
```

Forbidden:

```
engines → apps
shared → engines
apps → apps
```

The platform must remain a Directed Acyclic Graph (DAG).

---

## Isolation Rules

### App Isolation Rule

Apps must be fully independent.

An app must never import code from another app.

Forbidden:

```
apps/wentrex → apps/vibez
```

Shared capabilities must be extracted into engines.

### Engine Isolation Rule

Engines must be reusable.

An engine must not depend on any specific app.

If an engine imports from an app, the architecture is invalid.

### Shared Isolation Rule

Shared modules must remain domain-neutral.

Shared modules must not contain:

- product logic
- engine orchestration
- business rules

If shared logic becomes domain-specific, it belongs in an engine.

---

## Engine Internal Architecture

Every engine must follow the layered architecture defined in `enginecontract.md`.

Example structure:

```
engines/chat/
  src/
    adapters/
    dal/
    model/
    controller/
    hooks/
    types/
```

Layer order is mandatory:

```
DAL → Model → Controller → Hooks → Adapters
```

Adapters define the public surface.

Apps must consume engines only through adapters.

---

## App Architecture

Apps may contain:

```
src/
  routes/
  screens/
  features/
  providers/
  layouts/
  policy/
```

Apps assemble domain experiences using engines.

Apps must never implement engine responsibilities internally.

---

## Platform Routing Rule

Routing exists only in apps.

Engines must never define routes.

Apps mount engine screens or hooks inside their own routing structure.

Example:

```
apps/vibez-web
  /inbox
  /conversation/:id

apps/wentrex-web
  /messages
  /messages/:id
```

Both apps may use the same chat engine.

---

## Platform Deployment Rule

Each app deploys independently.

Examples:

```
vibez.com
wentrex.com
```

Engines are distributed as packages and consumed during app builds.

Engines themselves are not deployed as standalone applications.

---

## Platform Event Model

Engines may emit domain events.

Examples:

```
message.sent
conversation.created
notification.created
payment.completed
```

Apps may subscribe to engine events.

Apps must not emit engine-level domain events.

---

## Platform Ownership Model

Responsibility separation:

```
Apps    → experiences
Engines → capabilities
Shared  → primitives
```

No layer may assume responsibility of another layer.

---

## Platform Scaling Model

New apps must follow the same structure.

Example:

```
apps/
  vibez-web
  wentrex-web
  vibez-ios
  vibez-admin

engines/
  chat
  notifications
  search
  payments
```

This ensures capabilities are reused rather than duplicated.

---

## Enforcement Rule

Any code violating this contract must be refactored.

Architectural boundaries must remain visible in the filesystem.

A developer should understand the entire system by reading the directory tree.

---

## Platform Principle

- Structure prevents chaos.
- Boundaries enable scale.
- Capabilities outlive products.

---

## Next Recommended Files
