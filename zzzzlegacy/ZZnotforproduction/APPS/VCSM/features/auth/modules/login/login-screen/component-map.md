---
ticket: TICKET-LOGIN-0001
document: component-map
created: 2026-06-05
---

# Login Screen — Component Map

## Component Tree

```
LoginPage                               (route: /login)
├── BackgroundLayer                     (full-viewport dark background)
│   ├── BaseColor                       (near-black, #0d0d0d or equivalent)
│   └── VignetteOverlay                 (edge darkening — implied by gradient depth)
│
├── LoginCard                           (centered card, rounded corners, dark surface)
│   ├── LogoTitle                       ("Vibez Citizens" — serif, gold/amber)
│   ├── Tagline                         ("Where your vibez belongs." — small, muted)
│   │
│   ├── EmailField                      (labeled input)
│   │   ├── Label                       ("Email")
│   │   └── TextInput                   (placeholder: "you@example.com", type=email)
│   │
│   ├── PasswordField                   (labeled input)
│   │   ├── Label                       ("Password")
│   │   └── TextInput                   (placeholder: "Enter your password", type=password)
│   │
│   ├── LoginButtonGroup                (relative container)
│   │   ├── LoginButton                 ("Login" — full width, dark/slate bg)
│   │   └── BetaBadge                   ("BETA" — pink/red pill, absolute top-right)
│   │
│   ├── ForgotPasswordLink              ("Forgot password?" — text link, left-aligned)
│   └── CreateAccountLink              ("Create account" — text link, right-aligned)
│
├── FooterLinks                         (bottom center, small text)
│   ├── AboutLink                       ("About")
│   ├── Separator                       ("|")
│   ├── ContactLink                     ("Contact")
│   ├── Separator                       ("|")
│   ├── PrivacyLink                     ("Privacy")
│   ├── Separator                       ("|")
│   └── TermsLink                       ("Terms")
│
└── DebugWidgets                        (dev-only overlays — must not ship)
    ├── SWBadge                         ("SW" — top-left, black pill)
    ├── PERFIndicator                   ("PERF 0q 0ms" — bottom-left, green dot + text)
    ├── SessionStatusBadge              ("NO_SESSION_USER" — top-right, dark pill)
    └── ContextIdBadge                  ("ID (38)" — top-right, dark pill, below session badge)
```

---

## Component Details

### LoginPage

| Field | Value |
|---|---|
| Purpose | Root screen component for `/login` route |
| Expected State | Unauthenticated; redirects if session present |
| Props | None (reads from auth context) |
| Data Source | Auth context / session store |
| Event Handlers | `onSubmit` (delegates to auth hook) |
| Security | Must redirect authenticated users; must not leak session tokens to DOM |

---

### BackgroundLayer

| Field | Value |
|---|---|
| Purpose | Full-viewport dark ambient background |
| Expected State | Static — no dynamic data |
| Props | None |
| Data Source | None |
| Event Handlers | None |
| Security | None |

---

### LoginCard

| Field | Value |
|---|---|
| Purpose | Visual container for all login form elements |
| Expected State | Default / Error / Loading |
| Props | None (internal state via form hook) |
| Data Source | None (form state only) |
| Event Handlers | `onSubmit` |
| Security | Should not auto-fill with sensitive pre-populated values |

---

### LogoTitle

| Field | Value |
|---|---|
| Purpose | Brand identity header |
| Expected State | Static |
| Props | None |
| Data Source | Static string: "Vibez Citizens" |
| Event Handlers | None |
| Security | None |

---

### Tagline

| Field | Value |
|---|---|
| Purpose | Brand sub-header copy |
| Expected State | Static |
| Props | None |
| Data Source | Static string: "Where your vibez belongs." |
| Event Handlers | None |
| Security | None |

---

### EmailField

| Field | Value |
|---|---|
| Purpose | Capture user email credential |
| Expected State | Empty / Filled / Error |
| Props | `value`, `onChange`, `error?` |
| Data Source | Controlled form state |
| Event Handlers | `onChange` |
| Security | `type="email"` for basic format enforcement; no autocomplete leakage to 3rd party |

---

### PasswordField

| Field | Value |
|---|---|
| Purpose | Capture user password credential |
| Expected State | Empty / Filled / Error |
| Props | `value`, `onChange`, `error?` |
| Data Source | Controlled form state |
| Event Handlers | `onChange` |
| Security | `type="password"` to mask input; must not log value; no clipboard write |

---

### LoginButton

| Field | Value |
|---|---|
| Purpose | Submit credentials for authentication |
| Expected State | Idle / Loading / Disabled |
| Props | `onClick` / form `type="submit"`, `disabled` |
| Data Source | Form state (disabled when loading) |
| Event Handlers | `onClick` → triggers auth call |
| Security | Must debounce / disable on in-flight request to prevent duplicate submissions |

---

### BetaBadge

| Field | Value |
|---|---|
| Purpose | Visual indicator that the platform is in beta |
| Expected State | Static |
| Props | None |
| Data Source | Static string: "BETA" |
| Event Handlers | None |
| Security | None |

---

### ForgotPasswordLink

| Field | Value |
|---|---|
| Purpose | Navigate to password reset flow |
| Expected State | Static link |
| Props | `href` or `to` (router link) |
| Data Source | Static route |
| Event Handlers | `onClick` (router navigation) |
| Security | None |

---

### CreateAccountLink

| Field | Value |
|---|---|
| Purpose | Navigate to registration flow |
| Expected State | Static link |
| Props | `href` or `to` (router link) |
| Data Source | Static route |
| Event Handlers | `onClick` (router navigation) |
| Security | None |

---

### FooterLinks

| Field | Value |
|---|---|
| Purpose | Legal / informational navigation |
| Expected State | Static |
| Props | None |
| Data Source | Static routes |
| Event Handlers | `onClick` per link |
| Security | None |

---

### DebugWidgets (Dev-Only)

#### SWBadge
| Field | Value |
|---|---|
| Purpose | Indicates Service Worker is registered |
| Expected State | Active when SW is running |
| Props | None |
| Data Source | Service Worker registration state |
| Security | Must be stripped in production build |

#### PERFIndicator
| Field | Value |
|---|---|
| Purpose | Shows pending query count and response time |
| Expected State | `0q 0ms` = idle (no in-flight queries) |
| Props | Query count, response time |
| Data Source | Performance instrumentation hook |
| Security | Must be stripped in production build |

#### SessionStatusBadge
| Field | Value |
|---|---|
| Purpose | Shows current session authentication status |
| Expected State | `NO_SESSION_USER` = unauthenticated |
| Props | Session status string |
| Data Source | Auth context |
| Security | Must be stripped in production build — exposes session state |

#### ContextIdBadge
| Field | Value |
|---|---|
| Purpose | Shows a numeric debug context identifier |
| Expected State | `ID (38)` — inferred as a debug context/render ID, not a user ID |
| Props | ID value |
| Data Source | Debug context |
| Security | Must be stripped in production build |
