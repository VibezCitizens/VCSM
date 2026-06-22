# Feature Contract: wanderex

**Status:** CLEAN  
**Risk:** LOW  
**Files:** 22 (scanner 2026-06-05)  
**Inbound imports:** 0  
**Outbound imports:** 2  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`wanderex` owns the accommodation booking flow — distinct from the `wanders` greeting card system. It provides the complete UI flow for booking accommodation-type vports.

`wanderex` is a **leaf feature** — no other feature imports from it (0 inbound). It is a consumer of the booking engine and identity system.

**Note:** Per DOCS-ORG-001, `wanderex` is FROZEN — no new development until further notice.

---

## 2. Non-Goals

`wanderex` must not own:
- Booking state machine — that is `booking/`
- Accommodation profile rendering — that is `profiles/` (or eventually `vportProfile/`)
- Greeting cards — that is `wanders/` (separate feature)
- General VPORT management — that is `dashboard/`

---

## 3. Public API / Adapter Boundary

**None confirmed.** Scanner shows 0 inbound imports — wanderex is not consumed by any other feature. No adapter surface is required at this time.

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| screens | `wanderex/screens/` | Accommodation booking flow screens |
| hooks | `wanderex/hooks/` | Booking interaction hooks |
| controllers | `wanderex/controller/` or `controllers/` | Booking flow orchestration |
| dal | `wanderex/dal/` | Accommodation data access |
| model | `wanderex/model/` | Accommodation booking shapes |

22 total files across these layers.

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `booking` | Accommodation booking uses the booking engine | Confirmed by outbound count |
| `auth` | Auth required for booking | Confirmed by outbound count |

Only 2 outbound imports confirmed by scanner.

---

## 6. Prohibited Dependencies

`wanderex` must not import from:
- `wanders/` — these are separate features despite similar names
- `profiles/` internals — use adapters if profile data needed
- `dashboard/` — management surface
- Any feature's `dal/` or `controller/` directly

---

## 7. DAL / Controller Rules

**DAL rules:**
- If wanderex has its own DAL (accommodation-specific data), it must use explicit column projections
- Must not query `vc.actor_owners`
- Must receive actor context from its controller

**Controller rules:**
- Must use `booking/adapters/booking.adapter` for all booking operations
- Must not call `booking/dal/` or `booking/controller/` directly

---

## 8. Known Coupling

**No violations.** Scanner shows 0 violations.

**0 inbound imports** — wanderex is fully isolated as a leaf consumer.

---

## 9. Risk Notes

**LOW.** Frozen feature with no violations. The primary risk is naming confusion with `wanders/` — they are structurally and functionally separate.

---

## 10. Migration Notes

Feature is FROZEN — no active development (DOCS-ORG-001).

When unfrozen, evaluate whether wanderex should remain a standalone feature or be merged into the `profiles/kinds/vport/screens/booking/` booking flow.

---

## 11. Unknowns

- TODO: Confirm exact file structure (22 files)
- TODO: Confirm which 2 features are imported (scanner shows outbound: 2 — booking and auth assumed)
- TODO: Confirm whether wanderex has its own DAL or relies entirely on booking engine
