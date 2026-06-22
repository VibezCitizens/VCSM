# Feature Contract: vport

**Status:** CLEAN  
**Risk:** LOW  
**Files:** 29 (scanner 2026-06-05)  
**Inbound imports:** 7  
**Outbound imports:** 11  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`vport` owns the VPORT creation, preview, and core data management:
- Creating a new VPORT (business actor)
- VPORT type selection and configuration
- VPORT preview before publish
- Core VPORT data (actor identity, type, active state)
- VPORT restoration flow

`vport` is distinct from `profiles/kinds/vport/` (which owns vport-type-specific profile rendering) and `dashboard/vport/` (which owns the owner management dashboard).

---

## 2. Non-Goals

`vport` must not own:
- Vport-type-specific profile screens — that is `profiles/kinds/vport/`
- Vport dashboard and management cards — that is `dashboard/vport/`
- Social settings for vport — that is `settings/`
- Booking management — that is `booking/`
- Feed display — that is `feed/`

---

## 3. Public API / Adapter Boundary

**Known adapters (confirmed by scanner):**
- `vport/adapters/vport.adapter` — consumed by settings controllers
- `vport/adapters/vport.public.adapter` — consumed by `settings/hooks/useVportAccountOps.js`
- `vport/adapters/CreateVportForm.jsx.adapter` — consumed by `settings/vports/ui/VportsCreateModal.jsx`

**Bidirectional pair (LEGITIMATE):**
- `settings` ↔ `vport` — Pair 15. Settings creates/manages vport (settings→vport through adapter). Vport restore navigates to settings (vport→settings through adapter).

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `vport/adapters/` | 3 confirmed adapter files |
| hooks | `vport/hooks/` | `useRestoreVport.js` confirmed — imports `settings/adapters/settings.adapter` |
| controllers | `vport/controller/` | VPORT creation, type config, restore flow |
| dal | `vport/dal/` | VPORT data access |
| model | `vport/model/` | VPORT data shapes |
| screens | `vport/screens/` | Creation and preview screens |

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `settings` | Vport restore navigates to settings flow — BIDIR SAFE (Pair 15) | YES — `vport/hooks/useRestoreVport.js` → `settings/adapters/settings.adapter` |
| `identity` | Active actor for vport creation | Confirmed by outbound count |
| `auth` | Auth context for vport gating | Confirmed by outbound count |

---

## 6. Prohibited Dependencies

`vport` must not import from:
- `profiles/` — profile rendering is not vport's concern
- `dashboard/` — dashboard management is separate
- `booking/` — booking is a separate engine
- `social/`, `feed/`, `post/` — content features

---

## 7. DAL / Controller Rules

**DAL rules:**
- May query `vc.actor_vports`, `vc.actor_vport_members`, or equivalent tables
- Must not determine ownership independently — ownership decision belongs to the controller
- Must use explicit column projections

**Controller rules:**
- VPORT creation must verify actor context
- VPORT type assignment must validate allowed types
- Must not import Supabase directly
- `useRestoreVport.js` hook (not controller) navigates to settings — acceptable at hook level

---

## 8. Known Coupling

**Bidirectional pair — LEGITIMATE:**
- `vport` ↔ `settings` — Pair 15 (both through adapters; SAFE AS-IS)

**No violations.** Scanner confirms 0 violations.

Inbound consumers (7):
- `settings/` — primary consumer for vport management
- Others: TODO identify from FEATURE_IMPORT_MAP.json

---

## 9. Risk Notes

**LOW.** Clean feature with clear responsibilities. The settings↔vport pair is well-managed through adapters. No split needed.

The naming distinction between `features/vport/` (this feature — creation/core) and `profiles/kinds/vport/` (rendering) and `dashboard/vport/` (management) can be confusing for new developers. Clarify in ARCH-STUBS-001 documentation comments.

---

## 10. Migration Notes

No pending migration for `vport` itself. The related `profiles/kinds/vport/` extraction (ARCH-VPORTPROFILE-001) does not affect `features/vport/`.

---

## 11. Unknowns

- TODO: Confirm full adapter surface (what functions do `vport.adapter`, `vport.public.adapter`, and `CreateVportForm.jsx.adapter` export?)
- TODO: Identify all 7 inbound consumers
- TODO: Identify remaining outbound imports (11 total — 1 to settings confirmed + 10 unknown)
- TODO: Clarify the difference between `vport/adapters/vport.adapter` and `vport/adapters/vport.public.adapter` — public vs authenticated access?
