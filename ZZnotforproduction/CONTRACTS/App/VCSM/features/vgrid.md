# Feature Contract: vgrid

**Status:** FROZEN  
**Risk:** LOW  
**Files:** 10 (scanner 2026-06-05)  
**Inbound imports:** 3  
**Outbound imports:** 5  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`vgrid` owns the grid view layout for content — a browseable grid of posts, vibes, or vport content.

**FROZEN — DOCS-ORG-001.** No new development. No refactoring. Excluded from all governance cycles.

---

## 2. Non-Goals

`vgrid` must not receive new features while FROZEN.

---

## 3. Public API / Adapter Boundary

TODO: Confirm adapter files (3 inbound consumers exist — they must be consuming through an adapter or directly).

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `vgrid/adapters/` | TODO: confirm |
| components | `vgrid/components/` | Grid components |
| hooks | `vgrid/hooks/` | Grid state |

Total: 10 files.

---

## 5. Allowed Dependencies

TODO: Confirm 5 outbound imports.

---

## 6. Prohibited Dependencies

No new dependencies may be added while FROZEN.

---

## 7. DAL / Controller Rules

No new DAL or controller work while FROZEN.

---

## 8. Known Coupling

**No violations.** Zero scanner violations.

---

## 9. Risk Notes

**LOW.** FROZEN — no active development. Current boundary state preserved.

---

## 10. Migration Notes

No migrations until FROZEN status is lifted.

---

## 11. Unknowns

- TODO: Confirm adapter boundary (3 inbound consumers)
- TODO: Confirm 5 outbound import targets
- TODO: Confirm full file list (10 files)
