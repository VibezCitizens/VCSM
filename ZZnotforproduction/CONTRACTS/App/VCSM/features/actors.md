# Feature Contract: actors

**Status:** CLEAN  
**Risk:** LOW  
**Files:** 4 (scanner 2026-06-05)  
**Inbound imports:** 2  
**Outbound imports:** 0  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`actors` is a thin adapter stub that exposes actor identity resolution to features that need to look up actor data (search, display by slug, etc.). It is the **UI-facing** actor data surface, as distinct from `identity/` which is the session-facing actor resolver.

Known consumers (from architecture review):
- `settings/` — actor lookup for settings/privacy user lookup
- `shell/` — referenced in architecture notes

---

## 2. Non-Goals

`actors` must not own:
- Session identity resolution — that is `identity/`
- Actor profile rendering — that is `profiles/`
- Actor follow/subscribe logic — that is `social/`
- Actor ownership checks — that is the Controller layer of any feature that requires ownership

---

## 3. Public API / Adapter Boundary

**Known adapter:**
- `apps/VCSM/src/features/actors/adapters/actors.adapter.js`

This is the only approved entry point. The architecture review notes it is consumed by `settings/privacy` for user lookup.

Per ARCH-STUBS-001, this file should have a comment block added documenting its status and planned fate:
- Status: active adapter
- Planned fate: evaluate merge into `identity/` (see boundary clarification note in `identity.md`)

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `actors/adapters/actors.adapter.js` | Only confirmed file beyond this is unknown |

Total: 4 files. With the adapter file confirmed, the remaining 3 files are unconfirmed. Likely supporting utilities or DAL calls routed through the adapter.

---

## 5. Allowed Dependencies

**None confirmed by scanner (outbound: 0).**

`actors` is a terminal feature in the DAG. If it needs Supabase access, it should follow the initialized-DAL pattern.

---

## 6. Prohibited Dependencies

`actors` must not import from:
- `identity/` directly — the boundary between actors and identity must be architectural, not an import chain
- `profiles/` — profile rendering is separate from actor data lookup
- `social/`, `feed/`, `notifications/` — higher-layer features

---

## 7. DAL / Controller Rules

`actors` is a stub with 4 files. It likely has no full DAL/Controller stack.

If `actors` contains DAL files, they must:
- Return raw actor rows (no derived flags)
- Not query `vc.actor_owners`
- Use explicit column projections (no `.select('*')`)

If `actors` needs ownership context, it must receive `actorId` as a parameter from its caller — it must not resolve ownership independently.

---

## 8. Known Coupling

No cross-feature coupling detected (outbound: 0, violations: 0).

Known consumers (inbound: 2):
- `settings/` — via `actors/adapters/actors.adapter`
- One other consumer — TODO: identify from FEATURE_IMPORT_MAP.json

---

## 9. Risk Notes

**LOW.** Stub feature. Clean. The risk is primarily the unclear boundary with `identity/` — if a feature needs actor lookup, it may reach for `identity/` or `actors/` unpredictably.

---

## 10. Migration Notes

ARCH-STUBS-001: Add comment block to `actors/adapters/actors.adapter.js` documenting its status and planned fate.

Evaluate merge into `identity/` — this decision should be made in ARCH-NAMING-001 or a dedicated boundary clarification ticket.

---

## 11. Unknowns

- TODO: Identify the second inbound consumer (scanner shows 2 inbound imports)
- TODO: Confirm full file list (4 files — what are the other 3 beyond actors.adapter.js)
- TODO: Confirm whether `actors` has a DAL file and what tables it queries
- TODO: Decision needed: merge into `identity/` or establish clear boundary documentation
