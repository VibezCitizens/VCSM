---
name: vcsm.auth.verify-email.security
description: Security surface map for VCSM auth/verify-email module — ARCHITECT 2026-06-06
metadata:
  type: security
  owner: ARCHITECT
  last-run: 2026-06-06
  thor-release-blocker: NO (this module)
---

# SECURITY — verify-email

**Module:** verify-email (sub-module of auth)
**THOR Release Blocker (this module):** NO
**Inherited THOR blockers:** YES — auth feature has open THOR blocker (VEN-AUTH-001). This module does not add new blockers.

---

## Surface Map

| Surface | Type | Auth Required | Risk | Notes |
|---|---|---|---|---|
| supabase.auth.resend | Auth API write | NO | MEDIUM | Email enumeration is theoretically possible — Supabase rate-limits; error is fixed string (no Supabase error surfaced) |
| user.email_confirmed_at | In-memory read | YES (AuthProvider) | LOW | Read-only from AuthProvider user state; no forgery risk |
| location.state.email | Navigation state read | NO | LOW | Display only; never written to DB or used as auth credential |
| captureFrontendError | Monitoring write | NO | LOW | Logs `hasEmail: Boolean(email)` — does NOT log the actual email value; PII-safe |

---

## Security Verdicts

**Email enumeration via resend endpoint:**
ACCEPTABLE — supabase.auth.resend is rate-limited by Supabase. The endpoint is standard Supabase behavior and not directly exploitable for credential theft.

**Error message exposure:**
CLEAN — useResendVerification uses a fixed error string: `'Could not resend verification email. Please try again.'`. No Supabase error details are surfaced in the UI.

**PII in monitoring:**
CLEAN — captureFrontendError passes `hasEmail: Boolean(email)` (true/false), not the email address itself. No PII leakage confirmed.

**Countdown redirect:**
No security impact. The countdown simply navigates to `/login` — it cannot be exploited.

**AuthPublicRoute redirect of authenticated users:**
CORRECT — authenticated users navigating to `/verify-email` are redirected to `/feed` where ProtectedRoute picks up the unverified state. This is a safe pattern.

---

## Open Findings

No CRITICAL or HIGH findings from this targeted scan.

| ID | Severity | Issue | Status |
|---|---|---|---|
| ARCH-VE-001 | LOW/UX | Countdown interrupt risk (FINDING-002) | OPEN — see ARCHITECTURE.md |
| ARCH-VE-002 | LOW/UX | Email-null degraded state UX (FINDING-003) | OPEN — see ARCHITECTURE.md |
| ARCH-VE-003 | MEDIUM/GOVERNANCE | Dual-context not documented (FINDING-001) | OPEN — LOGAN needed |

---

## Recommended Security Handoffs

No VENOM or ELEKTRA scan required for this module at this time. The security surface is minimal (read-only screen, single unauthenticated resend endpoint). If the resend endpoint behavior changes (e.g., adding rate-limit feedback or error exposure), ELEKTRA review is recommended.
