# SECURITY — styles / style
## Status: SOURCE_VERIFIED | 2026-06-05

---

## Module Security Profile

| Field | Value |
|-------|-------|
| Attack surface | None (CSS only — no user input, no JS, no DB) |
| XSS risk | None |
| Auth dependency | None |
| Data access | None |
| Blast radius concern | Global visual regression on any change |
| Last security review | 2026-06-05 |

---

## Confirmed Findings

No security findings. This module is CSS only.

---

## Security Properties

### No XSS Surface

There is no JavaScript, no template rendering, no user-controlled values, and no `dangerouslySetInnerHTML` in this module. CSS custom properties cannot execute JavaScript.

### No Data Access

No DB queries, no API calls, no auth tokens, no user data.

### No Injection Vector

CSS custom property values are static strings defined at parse time. There is no mechanism for user input to affect token values at runtime.

---

## Governance and Change Risk

The primary risk in this module is **unintended visual regression**, not security:

| Risk | Severity | Notes |
|------|---------|-------|
| Accidental token value change | HIGH (UX) | Global blast radius — every component re-renders visually differently |
| Adding `--cit-*` tokens | MEDIUM | Deepens legacy debt; increases the number of token sources |
| Load order swap | MEDIUM | Loading citizens-theme.css before global.css would cause token resolution before reset is applied |
| Removing a `--vc-*` token | HIGH (UX) | Any component using that token silently falls back to initial/inherit |

---

## Scanner Coverage

| Scanner | Status | Notes |
|---------|--------|-------|
| VENOM | N/A | CSS-only module — no security scan surface |
| ELEKTRA | N/A | CSS-only module — no security scan surface |
| BlackWidow | N/A | CSS-only module — no security scan surface |

---

## Change Gate Requirement

Any PR that modifies `global.css` or `citizens-theme.css` must:
- Receive THOR gate approval due to global blast radius
- Include visual regression check (manual or automated)
- Document which token values changed and why
