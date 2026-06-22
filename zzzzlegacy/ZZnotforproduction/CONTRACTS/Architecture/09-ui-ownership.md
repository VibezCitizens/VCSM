# UI Ownership Rule
## VCSM Architecture Contract — §7 UI Ownership Rule (Locked)

> **Source:** [ARCHITECTURE.md](ARCHITECTURE.md) — Lines 1180–1255
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [07-adapter-contract.md](07-adapter-contract.md)
> **Cross-Links:** [05-feature-boundaries.md](05-feature-boundaries.md), [03-layer-contracts.md](03-layer-contracts.md)

---

## §7 UI Ownership Rule (Locked)

> **Purpose:** Prevent UI spaghetti and tangled rendering dependencies. UI must remain owned by the feature that defines the domain experience.

**Rule**

UI components belong to the feature that owns the domain behavior.

Components must not be imported directly across feature boundaries.

If another feature needs UI from a feature, it must access it through that feature's adapter.

**Allowed UI Imports**

Inside the same feature, components may import each other freely.

Example:

```
src/features/messages/components/MessageComposer.jsx
```

may import:

```
src/features/messages/components/MessageInput.jsx
src/features/messages/components/MessageToolbar.jsx
```

**Forbidden UI Imports**

A feature must never import another feature's internal UI.

Forbidden:

```
src/features/explore/components/ExploreFeed.jsx
imports
src/features/messages/components/MessageComposer.jsx
```

or

```
src/features/profile/components/ProfileHeader.jsx
imports
src/features/explore/components/ExploreCard.jsx
```

**Correct Access Pattern**

Allowed:

```js
import { MessageComposer } from '@/features/messages/adapters/messages.adapter';
```

Forbidden:

```js
import MessageComposer from '@/features/messages/components/MessageComposer';
```

**Shared UI Exception**

Shared UI may exist only if it is domain-neutral.

Example:

```
src/shared/ui/
```

Shared UI must not contain domain meaning.
