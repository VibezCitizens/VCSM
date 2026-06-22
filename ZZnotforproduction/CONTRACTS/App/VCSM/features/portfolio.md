# Feature Contract: portfolio

**Status:** STUB  
**Risk:** LOW  
**Files:** 2 (scanner 2026-06-05)  
**Inbound imports:** 0  
**Outbound imports:** 0  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`portfolio` is a feature-level stub that currently acts as a thin shim for the `engines/portfolio` engine.

**STUB — pending ARCH-ENGINESETUP-001.** The actual portfolio logic lives in `engines/`. This feature folder exists as a setup/wiring point.

Portfolio engine owns:
- Actor and vport portfolio entries
- Portfolio ordering and media linking

---

## 2. Non-Goals

`portfolio` must not own business logic. It must not replicate engine logic.

---

## 3. Public API / Adapter Boundary

**None confirmed.** 0 inbound imports currently.

Post-ARCH-ENGINESETUP-001: setup.js in `app/setup/` will wire the portfolio engine via DI.

---

## 4. Internal Layers

2 files total — likely:
- `portfolio/setup.js` (engine registration)
- `portfolio/index.js` (re-export)

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `engines/portfolio` | Shim target | Confirmed by purpose |

---

## 6. Prohibited Dependencies

`portfolio` must not import from other `features/`.

---

## 7. DAL / Controller Rules

No DAL, no controller. Portfolio logic is in the engine.

---

## 8. Known Coupling

None. 0 inbound, 0 outbound by scanner.

---

## 9. Risk Notes

**LOW.** 2-file stub.

---

## 10. Migration Notes

**ARCH-ENGINESETUP-001:** Move engine wiring from `features/portfolio/` → `app/setup/`. Delete `features/portfolio/` after migration.

---

## 11. Unknowns

- TODO: Confirm exact file list (2 files)
- TODO: Confirm whether portfolio engine is currently active or deferred
