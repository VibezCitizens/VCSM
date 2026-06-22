---
ticket: TICKET-LOGIN-0001
document: screen-inventory
created: 2026-06-05
---

# Screen Inventory — Login Screen

## Identity

| Field | Value |
|---|---|
| **Screen Name** | Login |
| **Route** | `/login` |
| **Dev URL** | `http://localhost:5173/login` |
| **Purpose** | Authenticate returning users via email/password |
| **User Type** | Unauthenticated visitor |
| **Auth Required** | No — this IS the auth entry point |

## Purpose

The login screen is the primary authentication gate for the VCSM platform. It handles:
- Email/password credential submission
- Session initialization on success
- Navigation to password recovery flow
- Navigation to account creation flow

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| Supabase Auth | Backend | Email/password sign-in provider |
| Session store / auth hook | State | `useSession` or equivalent hook reads/sets session |
| React Router | Routing | Guards other routes, redirects authenticated users away from `/login` |
| Service Worker | Runtime | SW badge visible — app registers a service worker |
| PERF debugger | Dev-only | Performance instrumentation overlay |
| Session debugger | Dev-only | `NO_SESSION_USER` / `ID (38)` debug badges |

## Entry Points

| Source | Trigger |
|---|---|
| Direct URL navigation | User lands on `/login` manually |
| Protected route redirect | App redirects unauthenticated users here |
| Session expiry redirect | Expired session triggers redirect to `/login` |
| Post-logout redirect | Logout clears session and redirects here |
| Footer / nav links | Any unauthenticated surface with a "Login" CTA |

## Exit Points

| Destination | Trigger |
|---|---|
| Dashboard / Home | Successful authentication |
| `/forgot-password` | User clicks "Forgot password?" |
| `/register` or `/create-account` | User clicks "Create account" |
| `/about` | Footer "About" link |
| `/contact` | Footer "Contact" link |
| `/privacy` | Footer "Privacy" link |
| `/terms` | Footer "Terms" link |

## Authentication Requirements

- No session required to view this screen.
- If a valid session already exists, the app should redirect to the authenticated home/dashboard rather than render this screen.

## Observations from Screenshot

- App is in beta — a "BETA" badge is visible on the login card.
- Debug overlays are active: `SW` badge, `PERF 0q 0ms`, `NO_SESSION_USER`, `ID (38)`.
- These are dev-only widgets; they must not ship to production.
- The `ID (38)` widget implies a numeric debug context identifier (not a user ID — user is not authenticated).
