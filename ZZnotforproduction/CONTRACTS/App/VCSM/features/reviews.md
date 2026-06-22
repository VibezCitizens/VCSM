# Feature Contract: reviews

**Status:** STUB  
**Risk:** LOW  
**Files:** 1 (scanner 2026-06-05)  
**Inbound imports:** 0  
**Outbound imports:** 0  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`reviews` is a feature-level stub that currently acts as a thin shim for the `engines/reviews` engine.

**STUB — pending ARCH-ENGINESETUP-001.** The actual reviews logic lives in `engines/`. This feature folder exists as a setup/wiring point.

Reviews engine owns:
- Service provider rating and review submission
- Review aggregation and display

---

## 2. Non-Goals

`reviews` must not own business logic. It must not replicate engine logic.

---

## 3. Public API / Adapter Boundary

**None confirmed.** 0 inbound imports currently.

Post-ARCH-ENGINESETUP-001: setup.js in `app/setup/` will wire the reviews engine via DI.

---

## 4. Internal Layers

1 file total — likely:
- `reviews/index.js` or `reviews/setup.js`

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `engines/reviews` | Shim target | Confirmed by purpose |

---

## 6. Prohibited Dependencies

`reviews` must not import from other `features/`.

---

## 7. DAL / Controller Rules

No DAL, no controller. Reviews logic is in the engine.

---

## 8. Known Coupling

None. 0 inbound, 0 outbound by scanner.

---

## 9. Risk Notes

**LOW.** 1-file stub. Smallest feature in the codebase.

---

## 10. Migration Notes

**ARCH-ENGINESETUP-001:** Move engine wiring from `features/reviews/` → `app/setup/`. Delete `features/reviews/` after migration.

---

## 11. Unknowns

- TODO: Confirm file name (`index.js` or `setup.js`)
- TODO: Confirm whether reviews engine is active in the DB or deferred
