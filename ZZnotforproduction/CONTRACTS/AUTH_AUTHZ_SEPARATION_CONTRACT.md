# Authentication vs Authorization Separation Contract

## Purpose

Authentication and authorization are separate platform concerns.

They must never be mixed in the same feature, controller, DAL, hook, or screen.

---

## Authentication

Authentication answers:

```
Who is the logged-in user?
Is there a valid session?
Has the email been verified?
Can the user sign in, sign out, register, or reset password?
```

Authentication may manage:

- login
- logout
- registration
- password recovery
- email verification
- session hydration
- auth callback
- account entry flow

Authentication must not decide:

- whether an actor owns another actor
- whether an actor can manage a VPORT
- whether an actor can publish, edit, or delete content
- whether an actor can access a dashboard resource
- whether an actor has permission to perform a domain action

---

## Authorization

Authorization answers:

```
Can this actor perform this action?
Does this actor own this resource?
Can this actor manage this VPORT?
Is this actor permitted to access this dashboard feature?
```

Authorization may manage:

- actor ownership checks
- VPORT management permission
- content publish, edit, and delete access guards
- dashboard resource access
- resource ownership resolution
- permission gates passed to feature logic

Authorization must not:

- check whether a session exists
- verify email confirmation status
- call Supabase auth APIs directly
- manage login, logout, or registration flows
- handle session hydration

---

## Structural Separation Rules

### Feature Scope

A feature that handles login, registration, or password recovery must contain no ownership or permission logic.

A feature that handles actor permissions, VPORT management, or content authorization must contain no session management or auth flow logic.

### Controller Scope

An auth controller may call `supabase.auth.*` methods.

An auth controller must not check whether the calling actor owns a VPORT or has a specific domain permission.

An authorization controller may check actor ownership or resource access.

An authorization controller must not call `supabase.auth.*` methods or check session validity.

### DAL Scope

An auth DAL may query `auth.users`, `auth.sessions`, or related Supabase auth tables.

An auth DAL must not query domain ownership tables (`vc.actor_owners`, `vc.vports`, etc.) to make permission decisions.

An authorization DAL may query domain ownership or permission tables.

An authorization DAL must not call auth APIs or depend on session state directly.

### Hook Scope

A hook that surfaces auth state (`useSession`, `useAuthStatus`) must not resolve actor ownership or perform permission checks.

A hook that surfaces permission state (`useCanEdit`, `useIsVportOwner`) must not call auth APIs or manage session state.

---

## Mixing Violations

The following are **always violations**:

| Pattern | Violation |
|---|---|
| Auth controller checks whether actor owns a VPORT | Auth performing authorization |
| Login screen renders based on actor permission | Auth screen consuming authorization state |
| Ownership hook calls `supabase.auth.getSession()` | Authorization performing authentication |
| Permission DAL queries `auth.users` for authorization decisions | Authorization depending on auth infrastructure |
| Feature that handles both session hydration and resource access gating | Mixed feature scope |
| Hook that returns both session state and actor permission in same export | Mixed hook responsibility |

---

## Enforcement

| Violation | Severity |
|---|---|
| Auth feature/controller/hook performing ownership or permission logic | ERROR |
| Authorization feature/controller/hook managing session or auth flow | ERROR |
| Mixed feature containing both auth flow and permission gates | ERROR |
| Auth DAL querying domain ownership tables for permission decisions | HIGH |
| Authorization DAL directly calling Supabase auth APIs | HIGH |

---

## Relationship to Existing Contracts

This contract governs **structural separation at the code layer**.

The Security Engineering Contract (`02-auth-authorization.md`) governs **security rules** — session security, password handling, RLS enforcement, and role verification. Both contracts apply simultaneously and do not conflict.

The Single Source Actor Architecture governs **who may write actor state**. Authorization reads actor state; it must never write it directly.

See also: [[SINGLE_SOURCE_ACTOR_ARCHITECTURE]] · [[SECURITY_ENGINEERING_CONTRACT]]
