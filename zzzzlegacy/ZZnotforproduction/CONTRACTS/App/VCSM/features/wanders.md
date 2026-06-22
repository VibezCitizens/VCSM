# Feature Contract: wanders

**Status:** SPLIT_CANDIDATE + VIOLATIONS  
**Risk:** MEDIUM  
**Files:** 124 (scanner 2026-06-05)  
**Inbound imports:** 3  
**Outbound imports:** 8  
**Violations:** 2  
**Split candidate:** YES (exceeds 100-file threshold)

---

## 1. Purpose

`wanders` owns the greeting card / visual message system:
- Greeting card creation (core + templates)
- Card sharing
- Card business card overlay (integrates public business card data)
- Card management

`wanders` has two internal subsystems:
- **`core/` (52 files)** — Full write/read/rpc DAL + controllers + hooks for greeting card operations
- **`components/cardstemplates/` (22 files)** — Card template components

**Note:** Per DOCS-ORG-001, `wanders` is FROZEN — no new development until further notice.

---

## 2. Non-Goals

`wanders` must not own:
- Accommodation booking — that is `wanderex/` (separate feature)
- Public business card rendering — that is `public/`
- Social feeds — that is `feed/`
- Profile data — that is `profiles/`

---

## 3. Public API / Adapter Boundary

**Known adapters:**
- `wanders/adapters/` — TODO: confirm exact adapter files

The low inbound count (3) suggests wanders is relatively isolated — few features consume its output.

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| core | `wanders/core/` | 52 files — DAL, controllers, hooks, RPC calls |
| templates | `wanders/components/cardstemplates/` | 22 template components |
| hooks | `wanders/hooks/` | `useWandersBusinessCardOps.js` confirmed — source of 2 violations |
| dal | `wanders/dal/` (likely inside core/) | Card data access |
| model | `wanders/model/` | Card shapes |
| screens | `wanders/screens/` | Card creation and viewing screens |
| adapters | `wanders/adapters/` | TODO: confirm |

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `public` | Card business card overlay uses public business card data — VIOLATIONS PRESENT | MIXED — 2 violations (controller + model direct imports) |
| `media` | Card media (images, assets) | Confirmed by outbound count |
| `social` | Social sharing | Confirmed by outbound count |
| `upload` | Media upload for card creation | Confirmed by outbound count |
| `identity` | Active actor | Confirmed by outbound count |

---

## 6. Prohibited Dependencies

`wanders` must not import from:
- `public/vportBusinessCard/controller/` directly — VIOLATION (currently happening)
- `public/vportBusinessCard/model/` directly — VIOLATION (model violation resolves via ARCH-BIDIR-MODEL-001)
- `profiles/` — profile data is not a wanders concern
- `booking/` — booking is a separate engine
- `dashboard/` — management surface

---

## 7. DAL / Controller Rules

**DAL rules for `wanders/core/dal/`:**
- May query wanders/greeting card tables
- Must not query `vc.actor_owners` for authorization decisions
- Must use explicit column projections

**Hook rules for `wanders/hooks/useWandersBusinessCardOps.js`:**
- Currently imports `public/vportBusinessCard/controller/vportBusinessCard.controller` directly — VIOLATION
- This hook manages the business card overlay on a greeting card
- After fix: must import from `public/adapters/` (adapter to be created)

---

## 8. Known Coupling

**2 confirmed violations:**

| From File | To | Rule | Status |
|---|---|---|---|
| `hooks/useWandersBusinessCardOps.js` | `public/vportBusinessCard/controller/vportBusinessCard.controller` | `NO_INTERNAL_WITHOUT_ADAPTER` | OPEN — needs public adapter |
| `hooks/useWandersBusinessCardOps.js` | `public/vportBusinessCard/model/businessCardSettings.model` | `NO_INTERNAL_WITHOUT_ADAPTER` | Resolves via ARCH-BIDIR-MODEL-001 |

**Remediation:**
- ARCH-BIDIR-MODEL-001: model moves to `shared/lib/businessCard/`; wanders updates import path (model violation auto-resolves)
- New ticket needed: `public` exposes `vportBusinessCard.controller` via `public/adapters/`; wanders updates import

---

## 9. Risk Notes

**MEDIUM.** The feature is frozen (DOCS-ORG-001) which limits new violation risk. Existing 2 violations must still be resolved before any split or reactivation.

At 124 files, wanders meets the split candidate threshold but the `core/` (52 files) + `templates/` (22 files) split is clear and may be low-risk when the feature is unfrozen.

---

## 10. Migration Notes

Feature is FROZEN — no active development. Violations will be resolved as part of general BIDIR remediation (ARCH-BIDIR-MODEL-001 + new public adapter ticket).

When feature is unfrozen, evaluate split into:
- `wanders/` (core greeting card logic)
- `wandersTemplates/` (template components) — if the 22-file template subsystem has grown independently

---

## 11. Unknowns

- TODO: Confirm `wanders/adapters/` exists and what it exports
- TODO: Confirm full directory structure of `wanders/core/` (52 files)
- TODO: Identify the 3 inbound consumers
- TODO: Identify remaining 5 outbound imports (8 total — 2 public violations + 1 media + 1 social + 1 upload + 1 identity assumed = 1 unknown)
- TODO: Confirm when `wanders` FROZEN status will be lifted (DOCS-ORG-001)
