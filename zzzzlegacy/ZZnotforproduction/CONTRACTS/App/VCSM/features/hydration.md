# Feature Contract: hydration

**Status:** STUB  
**Risk:** LOW  
**Files:** 2 (scanner 2026-06-05)  
**Inbound imports:** 0  
**Outbound imports:** 0  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`hydration` is a feature-level stub that currently acts as a thin shim for the `engines/hydration` engine.

**STUB — pending ARCH-ENGINESETUP-001.** The actual hydration logic lives in `engines/`. This feature folder exists as a setup/wiring point.

---

## 2. Non-Goals

`hydration` must not own business logic. It must not replicate engine logic.

---

## 3. Public API / Adapter Boundary

**None confirmed.** 0 inbound imports currently.

Post-ARCH-ENGINESETUP-001: setup.js in `app/setup/` will wire the hydration engine via DI, eliminating the need for this stub.

---

## 4. Internal Layers

2 files total — likely:
- `hydration/setup.js` (engine registration)
- `hydration/index.js` (re-export)

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `engines/hydration` | Shim target | Confirmed by purpose |

---

## 6. Prohibited Dependencies

`hydration` must not import from other `features/` — it is infrastructure, not a consumer.

---

## 7. DAL / Controller Rules

No DAL, no controller. Hydration logic is in the engine.

---

## 8. Known Coupling

None. 0 inbound, 0 outbound by scanner.

---

## 9. Risk Notes

**LOW.** 2-file stub. Once ARCH-ENGINESETUP-001 completes, this folder may be deleted (or absorbed into `app/setup/`).

---

## 10. Migration Notes

**ARCH-ENGINESETUP-001:** Move engine wiring from `features/hydration/` → `app/setup/`. Delete `features/hydration/` after migration.

---

## 11. Unknowns

- TODO: Confirm exact file list (2 files)
- TODO: Confirm whether `hydration/` has any consumer not yet showing in scanner (may be injected at runtime, invisible to static analysis)
