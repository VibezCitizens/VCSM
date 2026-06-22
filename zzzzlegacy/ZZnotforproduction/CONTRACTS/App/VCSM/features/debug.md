# Feature Contract: debug

**Status:** STUB  
**Risk:** LOW (dev-only)  
**Files:** 3 (scanner 2026-06-05)  
**Inbound imports:** 0  
**Outbound imports:** 2  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`debug` is a dev-only diagnostics feature. It surfaces developer panels and debug overlays during development.

**Dev-only.** Must never ship debug output to production. The debugger architecture pattern (memory: `feedback_debugger_pattern.md`) governs debug tooling:
- All debuggers live in `zNOTFORPRODUCTION/debuggers/[feature]/` (4-file structure)
- Never inline in screens
- Debug output must render on screen (dev-only, never production)
- No `console.log` in production

---

## 2. Non-Goals

`debug` must not:
- Ship to production
- Import from features in a way that creates production coupling
- Be referenced by any non-debug feature

---

## 3. Public API / Adapter Boundary

**None confirmed.** 0 inbound imports — no feature imports from `debug/`.

---

## 4. Internal Layers

3 files total — likely:
- `debug/index.js` — debug panel export
- `debug/components/` — debug UI component(s)
- `debug/hooks/` — debug state hook(s)

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `identity` | Debug panel shows actor info | Confirmed by outbound count (2 total) |
| `auth` | Debug panel shows auth state | Confirmed by outbound count |

---

## 6. Prohibited Dependencies

`debug` must not:
- Import from `dashboard/`, `profiles/`, `booking/` — coupling production features to debug
- Be imported from any production screen or component

---

## 7. DAL / Controller Rules

No DAL, no controller. `debug` is a presentational dev tool only.

---

## 8. Known Coupling

**No violations.** Zero scanner violations.

---

## 9. Risk Notes

**LOW.** Dev-only feature. The risk is entirely about accidentally shipping debug panels to production — managed by dev-only guards and build configuration, not architecture.

---

## 10. Migration Notes

No migrations. `debug/` may be gated behind dev-mode checks (e.g., `__DEV__` or `process.env.NODE_ENV !== 'production'`).

---

## 11. Unknowns

- TODO: Confirm exact file list (3 files)
- TODO: Confirm how debug panels are gated from production builds
- TODO: Confirm whether `debug/` references `zNOTFORPRODUCTION/debuggers/` or is fully self-contained
