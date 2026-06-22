# Feature Contract: explore

**Status:** CLEAN  
**Risk:** LOW  
**Files:** 22 (scanner 2026-06-05)  
**Inbound imports:** 0  
**Outbound imports:** 2  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`explore` owns the search and discovery experience:
- Search UI (tags, filters, result rendering)
- Discovery feed (suggested actors, vports)
- Exploration of content outside the followed feed

`explore` is a **leaf feature** — no other feature imports from it (0 inbound).

**Note:** Per DOCS-ORG-001, `explore` may be in a frozen state — confirm before new development.

---

## 2. Non-Goals

`explore` must not own:
- Central feed — that is `feed/`
- Actor profiles — that is `profiles/`
- Search indexing — that is backend/infrastructure
- TRAZE/Traffic programmatic SEO — that is the separate `apps/Traffic/` application

---

## 3. Public API / Adapter Boundary

**None needed.** 0 inbound imports — no adapter surface required.

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| screens | `explore/screens/` | TODO: confirm |
| ui | `explore/ui/` | 12 files + nested `features/` subfolder (`explore/ui/features/`) — unusual naming |
| hooks | `explore/hooks/` | Search/discovery hooks |
| dal | `explore/dal/` | Search data access |
| model | `explore/model/` | Search result shapes |

**Architecture note:** The `explore/ui/features/` subfolder path is unusual — a `features/` subfolder inside `ui/` creates a confusing path for components. This should be renamed to a more descriptive name (ARCH-NAMING-001 consideration).

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `identity` | Active actor for search context | Confirmed by outbound count |
| `social` | Follow status for discovery results | Confirmed by outbound count (2 total) |

The architecture review notes explore uses both `@hydration` engine directly and feature hooks — the engine alias usage should be standardized (ARCH-NAMING-001).

---

## 6. Prohibited Dependencies

`explore` must not import from:
- `feed/` — explore is a separate discovery surface
- `profiles/` internals — use adapters for actor data
- `dashboard/`, `settings/` — management surfaces

---

## 7. DAL / Controller Rules

**DAL rules:**
- May query search-related tables or invoke Supabase full-text search
- Must use explicit column projections
- Must receive `actorId` from controller for personalized search

---

## 8. Known Coupling

**No violations.** Zero violations, zero inbound imports.

---

## 9. Risk Notes

**LOW.** Leaf feature with zero violations. The unusual `ui/features/` subfolder naming is a structural noise issue, not a violation.

---

## 10. Migration Notes

No pending migration. ARCH-NAMING-001 should address the `explore/ui/features/` subfolder naming.

---

## 11. Unknowns

- TODO: Confirm completion status (is explore FROZEN per DOCS-ORG-001?)
- TODO: Confirm what `explore/ui/features/` contains and whether the naming is intentional
- TODO: Confirm whether explore has its own adapter exports (none needed currently given 0 inbound)
- TODO: Confirm `@hydration` alias usage in explore — standardize with ARCH-NAMING-001
