# SECURITY — ui / ui
## Status: SOURCE_VERIFIED | 2026-06-05

---

## Module Security Profile

| Field | Value |
|-------|-------|
| Attack surface | None (pure presentational components) |
| XSS risk | None |
| Auth dependency | None |
| Data access | None |
| User-controlled rendering | Children props only (caller-controlled) |
| Last security review | 2026-06-05 |

---

## Confirmed Findings

No security findings. This module is stateless presentational components with no data access, no auth, and no user input handling.

---

## Security Properties

### No XSS Surface

- No `dangerouslySetInnerHTML`
- No `eval`, `new Function`, or dynamic script construction
- All rendered content arrives via `children` prop — callers control content

### No User Input Handling

This module does not accept or process user input. Props are structural:
- `children` — any React node (caller-supplied)
- `variant` — string enum ("soft" | "accent")
- `onClick` — callback passthrough via `...rest`
- `style` — CSS object passthrough via `...rest`

Input validation is the caller's responsibility, not this module's.

### No Auth Dependency

No auth tokens, no session reads, no identity checks. These components render identically for any user state.

### No Data Access

No DB queries, no API calls, no Supabase client usage.

---

## Caller Responsibility

Since all rendered content is controlled by the caller via `children`, the security posture of any screen using these components depends on the caller:

- If a caller renders user-generated content inside `ModernShell`, the caller must sanitize that content.
- `ModernButton` spreads `...rest` — callers must not pass dangerous props (`dangerouslySetInnerHTML`, event handlers that trigger untrusted code).

---

## Scanner Coverage

| Scanner | Status | Notes |
|---------|--------|-------|
| VENOM | N/A | Presentational-only module — no security scan surface |
| ELEKTRA | N/A | Presentational-only module — no security scan surface |
| BlackWidow | N/A | Presentational-only module — no security scan surface |
