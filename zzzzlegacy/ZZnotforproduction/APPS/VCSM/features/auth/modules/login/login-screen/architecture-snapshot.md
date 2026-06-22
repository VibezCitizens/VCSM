---
ticket: TICKET-LOGIN-0001
document: architecture-snapshot
created: 2026-06-05
---

# Architecture Snapshot — Login Screen

## Screen Responsibilities

The login screen is responsible for:

1. **Authentication** — Accepting email/password credentials and delegating to the auth provider (Supabase).
2. **Session Initialization** — On success, writing the session to the app's auth context/store.
3. **Redirect Guard** — Detecting an existing valid session on mount and redirecting authenticated users away from this route.
4. **Error Communication** — Presenting normalized auth errors to the user without leaking enumeration-sensitive detail.
5. **Navigation Hub** — Providing entry points to forgot-password, registration, and legal/info pages.
6. **Beta Signal** — Communicating platform beta status to visitors.

---

## Architecture Diagram

```
Browser
  └── React App (/login route)
        │
        ├── LoginPage (component)
        │     ├── Reads: Auth Context (session state)
        │     ├── Writes: Auth Context (on success)
        │     └── LoginForm
        │           ├── Controlled form state (email, password, isSubmitting, error)
        │           └── onSubmit → useAuth hook (or direct SDK call)
        │
        ├── useAuth (hook — ASSUMED)
        │     └── Calls: supabase.auth.signInWithPassword({ email, password })
        │
        ├── Supabase JS Client
        │     └── HTTPS POST → Supabase Auth API (auth.supabase.co)
        │           └── Returns: session (access_token, refresh_token, user)
        │
        ├── Auth Context / Session Store
        │     ├── Stores: session object
        │     └── Triggers: router redirect to /dashboard
        │
        └── React Router
              ├── Route guard: redirect to /login if no session
              └── Redirect to /dashboard on successful auth
```

---

## Services Involved

| Service | Role |
|---|---|
| Supabase Auth | Primary authentication provider — `signInWithPassword` |
| React Router | Client-side routing, auth guards, redirect on success |
| Auth Context | Shared session state across the app |
| Service Worker | Registered — caching strategy must exclude auth API calls |
| PERF debugger | Dev-only performance instrumentation (must not ship) |
| Session debugger | Dev-only session state overlay (must not ship) |

---

## Backend Interactions

| Interaction | Endpoint | Method | Notes |
|---|---|---|---|
| Login | Supabase Auth `/token?grant_type=password` | POST | Via Supabase JS SDK |
| Password reset email | Supabase Auth `/recover` | POST | From `/forgot-password` — adjacent flow |
| Session refresh | Supabase Auth `/token?grant_type=refresh_token` | POST | Automatic via SDK |

---

## State Management

| Layer | Mechanism |
|---|---|
| Form state | Local component state (`useState` or form library) |
| Auth session | Context (`AuthContext` or Supabase `onAuthStateChange`) |
| Route state | React Router location / navigation |
| Debug state | Debug widget hooks (dev-only) |

---

## Routing Behavior

| Scenario | Behavior |
|---|---|
| No session | Render login form |
| Valid session on mount | Redirect to `/dashboard` (or `returnTo` param) |
| Successful login | Navigate to `/dashboard` |
| Failed login | Stay on `/login`, show error |
| Session expired (from redirect) | Stay on `/login`, show expiry notice |

---

## Current Architecture Assessment

**Strengths:**
- Supabase provides battle-tested auth with JWT refresh, session persistence, and MFA support.
- The screen is visually clean and focused — no feature bloat on the auth surface.
- Debug widgets are present but appear to be dev-only overlays — good separation of concerns (if properly gated).

**Risks:**

| Risk | Severity | Notes |
|---|---|---|
| Debug widgets in production | Critical | Must be gated by `NODE_ENV` or build flags |
| Error message enumeration | High | Must normalize all auth errors to generic message |
| No visible rate limiting UI | High | Must confirm server-side rate limit enforcement |
| Token storage strategy unknown | Medium | Supabase default is localStorage — XSS risk |
| No MFA visible | Medium | Single-factor auth only |
| Mobile layout unverified | Medium | Card must be responsive |
| Error/loading states not visible | Medium | Must be confirmed as implemented |

---

## Recommended Improvements

| Priority | Improvement |
|---|---|
| P0 | Gate all debug widgets behind `NODE_ENV === 'development'` |
| P0 | Confirm generic error message for all auth failures |
| P1 | Add visible loading state to Login button |
| P1 | Add inline error messages per field |
| P1 | Verify rate limiting (Supabase + optional WAF) |
| P2 | Audit token storage strategy |
| P2 | Add `autocomplete` attributes to inputs |
| P2 | Test on 375px viewport |
| P3 | Evaluate MFA for elevated-privilege accounts |
| P3 | Add password visibility toggle |
