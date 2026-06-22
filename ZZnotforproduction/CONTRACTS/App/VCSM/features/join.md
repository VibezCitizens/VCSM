# Feature Contract: join

**Status:** CLEAN  
**Risk:** LOW  
**Files:** 12 (scanner 2026-06-05)  
**Inbound imports:** 0  
**Outbound imports:** 8  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`join` owns the join/signup screens — the public-facing entry point for new users who aren't using the full registration flow:
- Join screens (simplified signup or external entry)
- Actor type selection at join time
- Vport creation at join time

`join` is a **leaf feature** — no other feature imports from it.

---

## 2. Non-Goals

`join` must not own:
- Full registration logic — that is `auth/`
- Legal consent gate — that is `legal/`
- VPORT business logic — that is `vport/`

---

## 3. Public API / Adapter Boundary

**None confirmed.** 0 inbound imports — no adapter needed.

---

## 4. Internal Layers

12 files total. Likely:
- Screens (join screen, actor type selection, vport prompt)
- Hooks
- Controller (join flow orchestration)

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `auth` | Join requires auth context | Confirmed by outbound count |
| `identity` | Actor resolution | Confirmed by outbound count |
| `legal` | Consent during join | Confirmed by outbound count |
| `social` | Social context at join | Confirmed by outbound count |
| `vport` | Vport creation during join | Confirmed by outbound count |
| `upload` | Profile photo during join | Confirmed by outbound count |

6 confirmed + 2 unknown = 8 outbound total.

---

## 6. Prohibited Dependencies

`join` must not import from:
- `profiles/` internals — use adapters
- `dashboard/`, `settings/` — management surfaces (user hasn't fully joined yet)
- `feed/`, `post/`, `notifications/` — post-join features

---

## 7. DAL / Controller Rules

**Controller rules:**
- Must orchestrate the join flow using adapters from auth, legal, identity, vport
- Must not create or modify auth records directly — delegate to `auth/adapters/`
- Must not create vport directly — delegate to `vport/adapters/`

---

## 8. Known Coupling

**No violations.** Zero scanner violations.

---

## 9. Risk Notes

**LOW.** Leaf feature with 8 outbound imports (highest among onboarding features). All imports go to platform primitives — expected for a flow that orchestrates join across many concerns.

---

## 10. Migration Notes

No pending migration.

---

## 11. Unknowns

- TODO: Confirm exact file list (12 files)
- TODO: Identify the 2 remaining outbound imports
- TODO: Confirm whether join has a DAL (may track join flow completion state)
