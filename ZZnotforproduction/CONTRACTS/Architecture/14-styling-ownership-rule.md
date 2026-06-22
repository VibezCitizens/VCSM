# Styling Ownership Rule
## VCSM Architecture Contract — §9 Styling Ownership Rule (Locked)

> **Source:** New addition — 2026-06-05
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [13-ui-purity-rule.md](13-ui-purity-rule.md)
> **Cross-Links:** [03-layer-contracts.md](03-layer-contracts.md), [13-ui-purity-rule.md](13-ui-purity-rule.md), [12-final-principles.md](12-final-principles.md)

---

## §9 Styling Ownership Rule (Locked)

> **Purpose:** Prevent design drift, duplicated colors, scattered CSS, and inconsistent visual behavior.

**Rule**

Styling must originate from approved styling layers.

Visual values must not be invented inside random feature files.

---

### Approved Styling Locations

Allowed:

```
src/shared/styles/
src/shared/theme/
src/shared/tokens/
feature/*.css
feature/*.module.css
theme configuration files
```

---

### Forbidden

Do not place design values directly inside components.

Forbidden:

```jsx
style={{
  color: '#6C4DF6'
}}
```

```jsx
className="text-[#6C4DF6]"
```

```jsx
className="bg-[#ef4444]"
```

---

### Design Tokens Required

Colors must use tokens.

Example:

```css
color: var(--vc-primary);
background: var(--vc-surface);
border-color: var(--vc-border);
```

---

### Screen Responsibilities

Screens may select styles.

Screens may not define styles.

Allowed:

```jsx
className="vc-button-primary"
```

Forbidden:

```jsx
className="bg-[#6C4DF6] hover:bg-[#7657ff]"
```

---

### Theme Ownership

Theme values belong to:

```
shared/theme
shared/tokens
feature theme files
```

Changing a brand color must require changing one source of truth.

A theme change must never require editing multiple screens.

---

### Shared UI Requirement

Shared UI components must consume tokens.

Shared UI components must never hardcode:

- colors
- spacing systems
- typography scales
- z-index systems

unless explicitly documented as framework defaults.
