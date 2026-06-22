# Feature Contract: professional

**Status:** CLEAN (scanner); OPEN (settings Card.adapter usage classification)  
**Risk:** LOW  
**Files:** 33 (scanner 2026-06-05)  
**Inbound imports:** 0  
**Outbound imports:** 6  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`professional` owns professional profile types — specialized profile experiences for professional roles:
- Nurse/healthcare professional profile view
- Enterprise workspace profile view
- Professional briefings view

`professional` is a **leaf feature** — no other feature imports from it (0 inbound). It is a consumer of settings and identity.

---

## 2. Non-Goals

`professional` must not own:
- Actor profile rendering (base layer) — that is `profiles/`
- Enterprise administration — that is a potential future feature
- Booking — that is `booking/`
- Moderation — that is `moderation/`

---

## 3. Public API / Adapter Boundary

**None needed.** 0 inbound imports — no adapter surface required.

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| enterprise | `professional/enterprise/` | Enterprise workspace UI — `EnterpriseWorkspace.jsx`, `enterprisePanels.jsx` |
| briefings | `professional/briefings/` | `ProfessionalBriefingsScreenView.jsx` — confirmed by FEATURES_TICKET_PLAN.md |
| screens | `professional/screens/` | Nurse/professional profile screens |
| hooks | `professional/hooks/` | Professional profile hooks |
| model | `professional/model/` | Professional profile shapes |

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `settings` | Uses `settings/adapters/ui/Card.adapter` — CONFIRMED CLEAN | YES — `EnterpriseWorkspace.jsx`, `enterprisePanels.jsx`, `ProfessionalBriefingsScreenView.jsx` all import `settings/adapters/ui/Card.adapter` |
| `identity` | Active actor | Confirmed by outbound count |

**Note on `Card.adapter`:** `settings/adapters/ui/Card.adapter` is consumed by professional for UI layout. This is an unusual coupling — a `Card` component should ideally live in `shared/components/`, not in `settings/adapters/ui/`. The adapter import is through the adapter boundary (not a violation), but the component's location in `settings` is architecturally questionable.

This is documented in ARCH-BIDIR-001 as an unexpected single-direction dependency (Case A: professional→settings) — classified in ARCH-BIDIR-001 for review but not a violation per current rules.

---

## 6. Prohibited Dependencies

`professional` must not import from:
- `profiles/` internals — use adapters if needed
- `booking/`, `social/`, `feed/`, `post/` — unrelated features
- `dashboard/` — management surface
- `settings/` internals beyond `settings/adapters/` — must use adapter boundary

---

## 7. DAL / Controller Rules

**DAL rules:**
- If professional has its own DAL (professional credentials, enterprise data), must use explicit column projections
- Must not determine ownership independently

**Controller rules:**
- Must not import Supabase directly
- Must use feature adapters for cross-feature operations

---

## 8. Known Coupling

**No violations.** Scanner confirms 0 violations.

**Flagged single-direction dependency (not a violation):**
- `professional/` → `settings/adapters/ui/Card.adapter` — through adapter boundary (CLEAN per current rules)
- This was flagged in ARCH-BIDIR-001 as Case A (unexpected single-direction) and noted for review
- Long-term: `Card` component should migrate to `shared/components/Card.jsx`

---

## 9. Risk Notes

**LOW.** Leaf feature with no violations. The `Card.adapter` dependency on settings is architecturally impure but not a current violation.

---

## 10. Migration Notes

No pending migration for professional.

When `settings/adapters/ui/Card.adapter` is reviewed for extraction to `shared/components/`, professional will need an import path update — low risk.

---

## 11. Unknowns

- TODO: Confirm remaining 3 outbound imports (6 total — Card.adapter ×3 + identity + 2 unknown)
- TODO: Confirm full file structure (33 files)
- TODO: Confirm whether professional has its own DAL or relies on identity/profiles for data
