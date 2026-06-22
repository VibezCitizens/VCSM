# Feature Contract: ui

**Status:** STUB  
**Risk:** MEDIUM (unknown consumers)  
**Files:** 1 (scanner 2026-06-05)  
**Inbound imports:** Unknown  
**Outbound imports:** 0  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`ui` is a feature-level stub of unknown purpose. It has 1 file and 0 outbound imports.

**STUB — purpose unclear.** This may be:
- A legacy shared component stub
- A UI primitive that predates the `shared/components/` pattern
- A dead file

---

## 2. Non-Goals

`ui` must not serve as a shared component library — that belongs in `shared/components/`.

---

## 3. Public API / Adapter Boundary

TODO: Confirm if any feature imports from `ui/`. Scanner shows 0 outbound from `ui/` — but the scanner counts imports FROM `ui`, not imports TO `ui`. Need to verify inbound.

---

## 4. Internal Layers

1 file total — file name unknown.

---

## 5. Allowed Dependencies

None confirmed (0 outbound).

---

## 6. Prohibited Dependencies

If `ui/` exports anything, those exports must be migrated to `shared/components/` before the folder is deleted.

---

## 7. DAL / Controller Rules

`ui/` must not contain DAL or controller files — it is a UI primitive stub.

---

## 8. Known Coupling

Unknown. The stub's consumers are unconfirmed.

---

## 9. Risk Notes

**MEDIUM.** Unknown consumers. If any feature is importing from `features/ui/`, removing this folder without migrating the export would break the consumer silently.

---

## 10. Migration Notes

**Recommended:** Audit `features/ui/` — if it exports a component, migrate to `shared/components/` and update import paths. Then delete `features/ui/`.

---

## 11. Unknowns

- TODO: Read `features/ui/` to identify the 1 file and its exports
- TODO: Grep all features for imports from `features/ui/` or `@/features/ui`
- TODO: Determine whether this folder is actively consumed or can be deleted
