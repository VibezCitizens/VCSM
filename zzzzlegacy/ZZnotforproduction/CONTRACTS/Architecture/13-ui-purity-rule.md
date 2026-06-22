# UI Purity Rule
## VCSM Architecture Contract — §8 UI Purity Rule (Locked)

> **Source:** New addition — 2026-06-05
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [09-ui-ownership.md](09-ui-ownership.md)
> **Cross-Links:** [03-layer-contracts.md](03-layer-contracts.md), [09-ui-ownership.md](09-ui-ownership.md), [12-final-principles.md](12-final-principles.md)

---

## §8 UI Purity Rule (Locked)

> **Purpose:** Keep screens and components focused on rendering. Prevent business logic, validation, security rules, and infrastructure concerns from leaking into the UI layer.

**Rule**

UI files exist to render state.

Screens and components must not own business logic.

Business logic belongs to:

```
DAL → Model → Controller → Hook → Screen
```

UI is the final rendering layer only.

---

### Forbidden Inside UI

Screens and components must not contain:

- business rules
- domain validation
- permission enforcement
- actor ownership checks
- Supabase queries
- database access
- RPC calls
- API calls
- localStorage decision logic
- sessionStorage decision logic
- security enforcement
- domain transformations
- reusable pure validation functions
- workflow orchestration

Forbidden:

```jsx
function ProfileScreen() {
  const canEdit = actor.role === 'admin'
}
```

```jsx
function RegisterScreen() {
  const valid = EMAIL_REGEX.test(email)
}
```

```jsx
const { data } = await supabase
  .from('profiles')
  .select('*')
```

---

### Allowed Inside UI

Screens and components may contain:

- rendering
- layout
- controlled inputs
- displaying state
- displaying validation results
- invoking hook handlers
- invoking adapter exports
- simple event forwarding

Allowed:

```jsx
<button onClick={handleSubmit}>
  Save
</button>
```

```jsx
<input
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

---

### Ownership Boundary

Models own validation.

Controllers own business rules.

Hooks orchestrate state.

Screens render results.

Violation occurs when a lower layer is skipped.
