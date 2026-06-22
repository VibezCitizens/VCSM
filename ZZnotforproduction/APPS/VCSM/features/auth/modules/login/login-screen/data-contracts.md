---
ticket: TICKET-LOGIN-0001
document: data-contracts
created: 2026-06-05
---

# Data Contracts — Login Screen

**Legend:**
- `ASSUMED` — inferred from platform patterns and screenshot; not source-verified
- `VERIFIED` — confirmed from source code or live API
- `UNKNOWN` — cannot be inferred; requires source inspection

---

## Login Request

Sent to Supabase Auth on form submit.

```typescript
interface LoginRequest {
  email: string;       // ASSUMED — Supabase signInWithPassword param
  password: string;    // ASSUMED — Supabase signInWithPassword param
}
```

**Notes:**
- Supabase SDK call: `supabase.auth.signInWithPassword({ email, password })`  — ASSUMED
- No additional fields inferred from the visible UI.
- MFA fields (TOTP) are not visible — either not implemented or handled in a separate flow.

---

## Login Response (Supabase Auth)

Returned by Supabase on successful authentication.

```typescript
interface LoginResponse {
  data: {
    session: {
      access_token: string;       // ASSUMED — Supabase JWT
      refresh_token: string;      // ASSUMED — long-lived refresh token
      expires_in: number;         // ASSUMED — seconds until access_token expires
      expires_at: number;         // ASSUMED — Unix timestamp of expiry
      token_type: string;         // ASSUMED — "bearer"
      user: {
        id: string;               // ASSUMED — UUID (Supabase auth.users.id)
        email: string;            // ASSUMED
        role: string;             // ASSUMED — "authenticated"
        created_at: string;       // ASSUMED — ISO timestamp
        app_metadata: object;     // ASSUMED — provider, roles
        user_metadata: object;    // ASSUMED — custom fields from registration
      };
    } | null;
    user: User | null;            // ASSUMED
  };
  error: AuthError | null;        // ASSUMED — non-null on failure
}
```

---

## Auth Error Shape

```typescript
interface AuthError {
  message: string;    // ASSUMED — "Invalid login credentials" etc.
  status: number;     // ASSUMED — HTTP status code (400, 401, 429)
  code?: string;      // ASSUMED — Supabase error code string
}
```

---

## Session Status (Debug Widget)

The `NO_SESSION_USER` badge in the top-right debug overlay maps to this shape.

```typescript
interface SessionStatus {
  authenticated: boolean;    // ASSUMED — false when NO_SESSION_USER shown
  userId: string | null;     // ASSUMED — null when unauthenticated
  label: string;             // ASSUMED — "NO_SESSION_USER" | "SESSION_USER:[id]"
}
```

**Notes:**
- The `ID (38)` badge is a separate debug context identifier — not tied to session.  — ASSUMED
- `38` is inferred as a render/route context ID, not a database user ID.  — ASSUMED

---

## Form State (Internal to Component)

```typescript
interface LoginFormState {
  email: string;           // ASSUMED — controlled input value
  password: string;        // ASSUMED — controlled input value
  isSubmitting: boolean;   // ASSUMED — true during auth call
  error: string | null;    // ASSUMED — error message string or null
}
```

---

## Performance Indicator (Debug Widget)

The `PERF 0q 0ms` badge maps to a live performance probe shape.

```typescript
interface PerfIndicatorState {
  pendingQueries: number;    // ASSUMED — "0q" = 0 pending queries
  responseTime: number;      // ASSUMED — "0ms" = 0ms last response time (ms)
  status: 'idle' | 'active'; // ASSUMED — green dot = idle
}
```

---

## Context ID Widget

```typescript
interface ContextIdWidget {
  id: number;    // ASSUMED — numeric debug context ID; "ID (38)" observed in screenshot
}
```

**Note:** This is a dev-only widget. The `38` value is likely a Supabase Realtime channel ID, a render cycle counter, or a debug fixture ID — not a production user identifier. — ASSUMED

---

## Supabase Auth Configuration (Inferred)

```typescript
interface SupabaseAuthConfig {
  provider: 'email';                   // ASSUMED — email/password flow visible
  persistSession: boolean;             // ASSUMED true — session cookie/localStorage
  autoRefreshToken: boolean;           // ASSUMED true — Supabase default
  detectSessionInUrl: boolean;         // ASSUMED true — needed for magic links / OAuth
}
```

---

## Password Reset Request (Adjacent Flow)

Invoked from "Forgot password?" navigation. Not visible on this screen but part of the adjacent flow.

```typescript
interface PasswordResetRequest {
  email: string;           // ASSUMED
  redirectTo?: string;     // ASSUMED — post-reset redirect URL
}

interface PasswordResetResponse {
  data: {} | null;         // ASSUMED — empty on success
  error: AuthError | null; // ASSUMED
}
```

---

## Data Flow Summary

```
[User fills form]
       ↓
LoginFormState (client-side controlled state)
       ↓
[Submit]
       ↓
LoginRequest → Supabase Auth API
       ↓
LoginResponse ← Supabase Auth API
       ↓
  Success? ──→ Store session (access_token, refresh_token)
               ──→ Navigate to /dashboard
  Error?   ──→ Display error message
               ──→ Remain on /login
```
