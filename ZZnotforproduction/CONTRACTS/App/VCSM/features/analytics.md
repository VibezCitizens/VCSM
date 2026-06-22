# Feature Contract: analytics

**Status:** DEPRECATED  
**Risk:** MEDIUM (active imports — until ARCH-ANALYTICS-001 completes)  
**Files:** 1 (scanner 2026-06-05)  
**Inbound imports:** 3  
**Outbound imports:** 0  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`analytics` was a feature-level analytics utility. It is now deprecated — its sole function (`funnelSource.js`) will be moved to `shared/lib/funnelSource.js`.

**DEPRECATED — pending ARCH-ANALYTICS-001.**

---

## 2. Non-Goals

`analytics/` must not receive new files. No new development.

---

## 3. Public API / Adapter Boundary

**Current (DEPRECATED):**
- `analytics/funnelSource.js` — consumed by 3 import paths (in `legal/screens/`)

**Post-ARCH-ANALYTICS-001:**
- All 3 import paths update from `features/analytics/funnelSource` → `@/shared/lib/funnelSource`
- `analytics/` folder is then deleted entirely

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| funnelSource | `analytics/funnelSource.js` | 1 file — the entire feature |

---

## 5. Allowed Dependencies

None — `analytics` is terminal (0 outbound).

---

## 6. Prohibited Dependencies

No new imports into `analytics/`.

---

## 7. DAL / Controller Rules

`analytics/funnelSource.js` is a utility function, not a DAL or controller. No DB access.

---

## 8. Known Coupling

3 import paths from `legal/screens/` — these are the 3 paths that ARCH-ANALYTICS-001 must update.

---

## 9. Risk Notes

**MEDIUM while DEPRECATED.** The 3 active consumers create coupling to a deprecated path. Once ARCH-ANALYTICS-001 moves the function and updates the 3 import paths, risk drops to NONE (folder deleted).

---

## 10. Migration Notes

**ARCH-ANALYTICS-001 (from FEATURES_TICKET_PLAN.md):**
1. Copy `analytics/funnelSource.js` → `shared/lib/funnelSource.js`
2. Update 3 import paths in `legal/screens/` from `features/analytics/funnelSource` → `@/shared/lib/funnelSource`
3. Delete `analytics/` folder entirely

---

## 11. Unknowns

- TODO: Confirm the 3 import paths (which exact files in `legal/screens/` import `funnelSource`)
- TODO: Confirm ARCH-ANALYTICS-001 ticket status (open/in-progress)
