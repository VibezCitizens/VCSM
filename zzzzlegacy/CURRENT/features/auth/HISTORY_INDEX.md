# HISTORY INDEX — auth

**Feature:** auth
**App:** VCSM

This file lists all audit source files read to produce this governance anchor. Each entry shows the path, date, command type, and scope.

---

## Audit Files

| File | Date | Command | Type | Scope |
|------|------|---------|------|-------|
| `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-11_venom_auth-login-trust-boundaries.md` | 2026-05-11 | VENOM | Security | Auth login, register, callback, onboarding, reset — trust boundary trace; 10 findings (2 HIGH, 5 MEDIUM, 3 LOW) |
| `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-11_sentry_auth-login-wolverine-fixes.md` | 2026-05-11 | SENTRY | Post-execution | Post-Wolverine architectural compliance review — 5 findings confirmed resolved; PASS with 2 advisory notes |
| `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_venom_auth-login-full-surface.md` | 2026-05-14 | VENOM | Security | Full auth-login surface + booking trust + dev diagnostics; 11 findings (3 HIGH, 5 MEDIUM, 3 LOW) |
| `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-23_14-00_venom_login-recovery-surface.md` | 2026-05-23 | VENOM | Security | Login/recovery surface post-BlackWidow remediation; 10 findings (2 HIGH, 3 MEDIUM, 3 LOW, 2 INFO); partial read (80 lines) |
| `TICKET-AUTH-ARCHITECT-0001` | 2026-06-02 | ARCHITECT | Architecture | `ARCHITECT_AUTH_COMPLETE`; auth architecture inventory and identity dependency risks propagated into CURRENT |

---

## Notes

- The 2026-05-11 SENTRY report was read to line 100 only (file is 46896 bytes). Content read covers the full findings summary table and Findings 1–3.
- The 2026-05-23 VENOM report was read to line 80 only. Content read covers the header, file list, security surface, trust boundary trace, and the beginning of findings. Full finding detail for VENOM-AUTH-004/005/007/008 is in the source file but was not read in this governance pass.
- No auth-specific IRONMAN, CARNAGE, DB, LOKI, or SPIDER-MAN audit files were found for this feature as of this governance creation date (2026-06-02).
- The completed ARCHITECT audit was present in session/attachment context, but no persisted output report under `CURRENT/outputs` was found during propagation verification.
