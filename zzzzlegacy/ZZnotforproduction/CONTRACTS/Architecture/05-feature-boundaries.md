# Feature Boundary Rules
## VCSM Architecture Contract — §5.1–5.2, §5.6 Feature Boundary Rules (Locked)

> **Source:** [ARCHITECTURE.md](ARCHITECTURE.md) — Lines 789–837, 922–952
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [03-layer-contracts.md](03-layer-contracts.md)
> **Reads Before:** [06-module-contract.md](06-module-contract.md), [07-adapter-contract.md](07-adapter-contract.md)
> **Cross-Links:** [08-dependency-rules.md](08-dependency-rules.md), [09-ui-ownership.md](09-ui-ownership.md)

---

## §5 Feature Boundary Rules (Locked)

### 5.1 Feature Containment Rule

> **Purpose:** Ensure every feature owns its logic inside its own folder.

**Rule**

All files belonging to a feature must live inside that feature's folder.

Each feature must contain its own:

- adapters
- DAL
- model
- controller
- hooks
- components
- screens

Feature logic must not be placed in unrelated shared folders unless it is truly generic and domain-neutral.

Forbidden examples:

```
src/shared/messages/sendMessage.controller.js
src/lib/explore/useExploreFeed.js
src/components/onboarding/OnboardingCard.jsx
```

If logic belongs to a feature, it must live in that feature.

---

### 5.2 Cross-Feature Boundary Rule

> **Purpose:** Prevent features from importing each other's internals.

**Rule**

A feature may not import another feature's internal files, including:

- DAL
- models
- controllers
- hooks
- components
- screens
- internal utilities

Direct cross-feature imports are forbidden.

---

### 5.6 Recommended Feature Structure

```
src/features/<feature>/
  adapters/
    <feature>.adapter.js
  dal/
  model/
  controller/
  hooks/
  components/
  screens/
  resolvers/          (optional — only for features that inject DI into a shared engine)
  setup.js            (optional — only present when resolvers/ exists)
```

Example:

```
src/features/messages/
  adapters/
    messages.adapter.js
  dal/
  model/
  controller/
  hooks/
  components/
  screens/
```
