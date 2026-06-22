# Feature Contract: invite

**Status:** CLEAN  
**Risk:** LOW  
**Files:** 6 (scanner 2026-06-05)  
**Inbound imports:** 0  
**Outbound imports:** 2  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`invite` owns the invite flow — sending and accepting invitations to join VCSM or to join a vport.

`invite` is a **leaf feature** — no other feature imports from it. It is a small flow consumed only by app-level routing.

---

## 2. Non-Goals

`invite` must not own:
- Account registration — that is `auth/` and `join/`
- Vport membership management — that is `vport/`

---

## 3. Public API / Adapter Boundary

**None confirmed.** 0 inbound imports — no adapter needed.

---

## 4. Internal Layers

6 files total. Likely:
- Screens (invite screen, accept invite screen)
- Hooks
- Controller (invite validation, acceptance)

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `auth` | Invite acceptance requires auth context | Confirmed by outbound count (2 total) |
| `identity` | Resolve actor after accepting invite | Confirmed by outbound count |

---

## 6. Prohibited Dependencies

`invite` must not import from:
- `profiles/`, `feed/`, `social/` — post-onboarding features
- `dashboard/`, `settings/` — management features
- `vport/` internals — vport membership changes go through vport adapters

---

## 7. DAL / Controller Rules

**Controller rules:**
- Must validate invite token before accepting
- Must not create or modify account records — delegate to `auth/`

---

## 8. Known Coupling

**No violations.** Zero scanner violations.

---

## 9. Risk Notes

**LOW.** Tiny leaf feature with no violations.

---

## 10. Migration Notes

No pending migration.

---

## 11. Unknowns

- TODO: Confirm exact file list (6 files)
- TODO: Confirm the 2 outbound import targets
- TODO: Confirm whether invite has a DAL (invite token validation may require DB access)
