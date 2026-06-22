---
ticket: TICKET-LOGIN-0001
document: security-review
created: 2026-06-05
---

# Security Review — Login Screen

**Scope:** Visual + architectural analysis of the login screen.
**Source:** Screenshot analysis only. Source code not reviewed.
**Severity Scale:** Critical / High / Medium / Low / Info

---

## Summary

| Severity | Count |
|---|---|
| Critical | 1 |
| High | 3 |
| Medium | 4 |
| Low | 3 |
| Info | 2 |

---

## Findings

---

### [CRITICAL] Debug Widgets Must Not Ship to Production

**Finding:** Four debug overlays are visible on screen: `SW`, `PERF 0q 0ms`, `NO_SESSION_USER`, `ID (38)`.

**Risk:**
- `NO_SESSION_USER` exposes session state to the browser UI — confirms to an observer (shoulder surfing, screenshot) whether a session is active.
- `ID (38)` exposes an internal numeric identifier — if this maps to a database row ID or Supabase channel ID, it leaks platform internals.
- PERF widget reveals query count and response time — aids timing-based analysis of auth flow.
- A production build with these widgets intact would fail any security audit.

**Remediation:**
- Gate all debug widgets behind `process.env.NODE_ENV === 'development'` or an explicit `DEV_MODE` flag.
- Confirm production build strips these via tree-shaking or conditional imports.
- Add a production smoke test that asserts no debug widget DOM elements are present.

---

### [HIGH] Credential Enumeration Risk via Error Messages

**Finding:** The error message returned on failed login must not differentiate between "email not found" and "password incorrect."

**Risk:** If the UI (or the Supabase error passthrough) returns different messages for unknown email vs wrong password, an attacker can enumerate valid email addresses on the platform.

**Remediation:**
- Always return: `"Invalid email or password."` — never "Account not found" or "Wrong password."
- Verify Supabase auth error is not passed raw to the UI.
- Confirm the UI error handler normalizes all 401/400 auth errors to this single generic message.

---

### [HIGH] Rate Limiting — Login Attempts

**Finding:** No rate limiting UI is visible from the screenshot. The login button does not show a lockout state or attempt counter.

**Risk:** Without rate limiting, credential stuffing and brute force attacks against valid email addresses are possible at scale.

**Remediation:**
- Verify Supabase Auth rate limiting is enabled (it enforces limits by default but these are configurable).
- Implement client-side lockout feedback: "Too many attempts. Please wait X minutes."
- Do NOT rely solely on client-side rate limiting — server-side enforcement (Supabase / WAF) is required.

---

### [HIGH] No Visible CSRF Protection

**Finding:** Cannot confirm presence of CSRF token in form submission from the screenshot.

**Risk:** If the auth form submits as a traditional POST without CSRF protection, a malicious page could trigger a login submission from a victim's browser.

**Remediation:**
- Supabase SDK calls use `Authorization` headers with Bearer tokens — inherently CSRF-resistant for API calls.
- Verify the login form uses Supabase JS SDK (`signInWithPassword`) and does NOT submit as a traditional HTML form POST to a server endpoint.
- If any server-rendered form POST endpoint exists, confirm CSRF tokens are implemented.

---

### [MEDIUM] Token Storage Strategy — Unknown

**Finding:** Cannot confirm from the screenshot whether session tokens are stored in `localStorage`, `sessionStorage`, or `httpOnly` cookies.

**Risk:**
- `localStorage` token storage is vulnerable to XSS — a single script injection can steal the session token.
- `sessionStorage` is per-tab and cleared on close — better for XSS isolation but poor UX (no persistent login).
- `httpOnly` cookies are the most secure option — inaccessible to JavaScript.

**Remediation:**
- Verify Supabase session persistence strategy.
- If `localStorage` is used (Supabase default), ensure a strict Content Security Policy (CSP) is enforced to mitigate XSS risk.
- Consider migrating to `httpOnly` cookie storage via Supabase's `cookies` storage adapter.

---

### [MEDIUM] No Visible MFA / 2FA

**Finding:** No multi-factor authentication step is visible in the login flow from the screenshot.

**Risk:** Single-factor authentication (email + password only) is insufficient for accounts with elevated privilege (admins, VPORT owners, payment handlers).

**Remediation:**
- Evaluate TOTP-based MFA (Supabase supports it natively).
- At minimum, flag the absence of MFA as a risk for high-privilege accounts.
- Consider MFA as a roadmap item before production launch.

---

### [MEDIUM] No Visible Password Visibility Toggle

**Finding:** The password field has no show/hide toggle.

**Risk:** Not a direct security risk — but absence of a toggle increases likelihood of password entry errors, leading to account lockouts and password reset flows that carry their own risks.

**Remediation:**
- Add a show/hide toggle to the password field (standard UX pattern).
- Ensure the toggle does not log the exposed password value to the console.

---

### [MEDIUM] "BETA" Badge — User Trust Signal

**Finding:** A prominent "BETA" badge is overlaid on the login card.

**Risk:** The BETA label may reduce user trust in the security and data handling of the platform — users may be less likely to use strong passwords or trust the platform with sensitive data if they perceive it as unpolished.

**Remediation:**
- This is a low-severity UX+trust issue. Consider positioning the badge less prominently (e.g., header/footer of the page rather than directly on the auth form).

---

### [LOW] Autocomplete Attribute Verification Needed

**Finding:** Cannot confirm `autocomplete="email"` and `autocomplete="current-password"` are set on input fields.

**Risk:**
- Missing `autocomplete` attributes degrade UX (password managers won't fill) and may trigger browser security warnings.
- `autocomplete="off"` on password fields is discouraged by NIST — it degrades security by encouraging users to use simpler, more memorable passwords.

**Remediation:**
- Verify `<input type="email" autocomplete="email">` and `<input type="password" autocomplete="current-password">`.

---

### [LOW] Service Worker Scope

**Finding:** `SW` badge indicates a service worker is registered.

**Risk:** A service worker with overly broad scope could intercept auth API requests and potentially cache sensitive tokens or responses.

**Remediation:**
- Verify the service worker explicitly excludes Supabase auth endpoints from caching: `supabase.co/auth/**`.
- Confirm the SW cache strategy for API calls is `NetworkOnly` or `NetworkFirst` — never `CacheFirst` for auth.

---

### [LOW] No "Secure Connection" Indicator in Dev

**Finding:** The browser shows `http://localhost:5173` — HTTP, not HTTPS. This is expected for local development.

**Risk:** No risk in dev. In production, HTTPS is mandatory. If the domain is served over HTTP in production, credentials are transmitted in cleartext.

**Remediation:**
- Confirm production deployment enforces HTTPS with HSTS headers.
- Add `Strict-Transport-Security: max-age=63072000; includeSubDomains` response header.

---

### [INFO] Footer Links Lead to Static Pages

**Finding:** About / Contact / Privacy / Terms are footer links.

**Risk:** Low — but Privacy and Terms pages must be accurate and up to date before any public launch, as GDPR/CCPA compliance requires accessible privacy notices.

**Remediation:**
- Verify Privacy and Terms pages are current and legally reviewed.

---

### [INFO] No Social / OAuth Login Visible

**Finding:** No Google, Apple, or other OAuth provider buttons are visible.

**Risk:** None — but if OAuth is planned, it introduces additional attack surface (token leakage, open redirect, callback URL manipulation).

**Remediation:**
- If OAuth is added, verify redirect URI whitelisting in Supabase Auth settings.
