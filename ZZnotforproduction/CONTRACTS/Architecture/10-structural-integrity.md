# Structural Integrity Rules
## VCSM Architecture Contract — §4.1–4.4 Structural Integrity Rules (Locked)

> **Source:** [ARCHITECTURE.md](ARCHITECTURE.md) — Lines 560–762
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [03-layer-contracts.md](03-layer-contracts.md)
> **Reads Before:** [11-naming-conventions.md](11-naming-conventions.md)
> **Cross-Links:** [03-layer-contracts.md](03-layer-contracts.md) (decomposition must follow layer boundaries)

---

## §4 Structural Integrity Rules (Locked)

These rules prevent architectural drift, god files, and cross-feature coupling.

They apply to all code in the system.

### 4.1 File Size & Decomposition Rule

> **Purpose:** Prevent god files and enforce maintainable module boundaries. Large files accumulate responsibilities, hide architectural violations, and make reasoning difficult.

**Maximum File Size Rule**

A source file must not exceed 300 lines of code.

When a file approaches 300 lines, it must be decomposed into smaller files according to architectural layer responsibilities.

This applies to:

- DAL files
- Models
- Controllers
- Hooks
- Components
- View Screens
- Final Screens

**What Counts as a Line**

The following count:

- executable code
- function declarations
- imports
- exports
- JSX
- types
- utility helpers

The following do not count:

- blank lines
- documentation comment blocks

**Required Action**

When a file reaches 300 lines, it must be split.

The split must follow architectural boundaries, not arbitrary grouping.

**Acceptable Decompositions**

Controller decomposition:

```
messageController.js
→ sendMessage.controller.js
→ editMessage.controller.js
→ deleteMessage.controller.js
```

DAL decomposition:

```
message.dal.js
→ messageReads.dal.js
→ messageWrites.dal.js
```

Hook decomposition:

```
useMessages.js
→ useMessageList.js
→ useSendMessage.js
```

Component decomposition:

```
PostCard.jsx
→ PostHeader.jsx
→ PostBody.jsx
→ PostActions.jsx
```

**Forbidden Workarounds**

The following are forbidden:

- collapsing multiple responsibilities into one file
- creating deeply nested functions inside a single file
- hiding logic inside anonymous closures
- moving code into large inline utilities inside the same file

**Recommended File Size**

Most files should naturally stay between:

```
80 — 200 lines
```

Files approaching 250 lines should be reviewed for decomposition.

---

### 4.2 Single Responsibility File Rule

> **Purpose:** Prevent files from accumulating multiple responsibilities even under 300 lines.

**Rule**

Each file must represent one coherent responsibility.

Each file should answer one focused question.

Good examples:

```
sendMessage.controller.js
→ Can this actor send a message?

getConversationMessages.dal.js
→ What messages exist for this conversation?

useMessageList.js
→ When and how should message lists load?
```

Bad example:

```
message.controller.js
→ sending
→ deleting
→ editing
→ moderating
→ notifications
```

If multiple use-cases exist in a domain, they must be separate files.

---

### 4.3 Controller Fan-Out Rule

> **Purpose:** Prevent controllers from becoming orchestration monsters.

**Rule**

A controller may call at most 5 external modules.

External modules include:

- DAL files
- Models
- other controllers
- utilities

If a controller requires more than 5 collaborators, the use-case must be decomposed.

---

### 4.4 Maximum Folder Depth Rule

> **Purpose:** Prevent deeply nested directory structures that hide architecture.

**Rule**

Feature modules must not exceed 3 directory levels below the feature root.

Depth is measured relative to the feature root.

Example:

```
src/features/messages
```

is depth 0.

Allowed:

```
src/features/messages/controller/sendMessage.controller.js
```

Not allowed:

```
src/features/messages/domain/controller/internal/sendMessage.controller.js
```

**Reasoning**

Deep nesting:

- hides architectural intent
- increases cognitive load
- slows navigation

Architecture should be visible directly from the filesystem.
