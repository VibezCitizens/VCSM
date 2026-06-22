---
ticket: TICKET-LOGIN-0001
document: screen-flow
created: 2026-06-05
---

# Screen Flow Map — Login Screen

## Navigation Paths

```mermaid
flowchart TD
    START([Visitor / Unauthenticated User])

    START --> LOGIN[/login\nLogin Screen]

    LOGIN -->|Clicks Login with valid credentials| AUTH_SUCCESS[Auth Success\nSession Created]
    LOGIN -->|Clicks Login with invalid credentials| AUTH_FAIL[Auth Failed\nError State\nRemain on /login]
    LOGIN -->|Clicks Forgot password?| FORGOT[/forgot-password\nForgot Password Screen]
    LOGIN -->|Clicks Create account| REGISTER[/register or /create-account\nRegistration Screen]
    LOGIN -->|Clicks About| ABOUT[/about\nAbout Page]
    LOGIN -->|Clicks Contact| CONTACT[/contact\nContact Page]
    LOGIN -->|Clicks Privacy| PRIVACY[/privacy\nPrivacy Policy]
    LOGIN -->|Clicks Terms| TERMS[/terms\nTerms of Service]

    AUTH_SUCCESS -->|Redirect| DASHBOARD[/dashboard or /home\nAuthenticated Home]
    AUTH_FAIL -->|User retries| LOGIN
    AUTH_FAIL -->|User clicks Forgot password?| FORGOT

    FORGOT -->|User submits email| RESET_SENT[Password Reset Email Sent\nConfirmation Screen]
    FORGOT -->|User clicks Back / Cancel| LOGIN

    RESET_SENT -->|User opens email link| RESET_FORM[/reset-password?token=...\nPassword Reset Form]
    RESET_FORM -->|Reset successful| LOGIN

    REGISTER -->|Registration complete| ONBOARDING[Onboarding Flow\nor Dashboard]
```

---

## Authenticated User Entry

```mermaid
flowchart TD
    AUTH_USER([Authenticated User])
    AUTH_USER -->|Navigates to /login| AUTH_CHECK{Session Valid?}
    AUTH_CHECK -->|Yes| REDIRECT[Redirect to /dashboard]
    AUTH_CHECK -->|No / Expired| LOGIN[/login\nLogin Screen]
```

---

## Session Expiry Flow

```mermaid
flowchart TD
    ACTIVE([Authenticated User — Active Session])
    ACTIVE -->|Session expires| EXPIRY[Session Expired]
    EXPIRY -->|Protected route access attempt| REDIRECT_LOGIN[Redirect to /login]
    REDIRECT_LOGIN --> LOGIN[/login\nLogin Screen]
    LOGIN -->|Successful re-auth| RESTORE[Return to\nPrevious Route or Dashboard]
```

---

## Post-Logout Flow

```mermaid
flowchart TD
    LOGGED_IN([Authenticated User])
    LOGGED_IN -->|Clicks Logout| CLEAR_SESSION[Clear Session / Tokens]
    CLEAR_SESSION --> REDIRECT_LOGIN[Redirect to /login]
    REDIRECT_LOGIN --> LOGIN[/login\nLogin Screen]
```

---

## Path Summary Table

| From | Action | To | Notes |
|---|---|---|---|
| `/login` | Valid credentials | `/dashboard` | Session initialized |
| `/login` | Invalid credentials | `/login` | Error state shown |
| `/login` | "Forgot password?" | `/forgot-password` | Password recovery flow |
| `/login` | "Create account" | `/register` | Registration flow |
| `/login` | "About" | `/about` | Informational page |
| `/login` | "Contact" | `/contact` | Contact page |
| `/login` | "Privacy" | `/privacy` | Legal page |
| `/login` | "Terms" | `/terms` | Legal page |
| Any protected route | No session | `/login` | Auth guard redirect |
| `/login` | Session already valid | `/dashboard` | Auto-redirect |
| Any screen | Logout | `/login` | Post-logout redirect |
| `/forgot-password` | Submit email | Confirmation screen | Reset email sent |
| `/reset-password?token=` | Reset success | `/login` | Re-authentication |
