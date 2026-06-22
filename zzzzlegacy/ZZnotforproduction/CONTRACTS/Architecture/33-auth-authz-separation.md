# §33 — Authentication vs Authorization Separation

## Rule

Authentication and authorization are separate platform concerns. They must never be mixed in the same feature, controller, DAL, hook, or screen.

## Authentication Scope

**Answers:** Who is the logged-in user? Is there a valid session? Has the email been verified?

**May manage:** login · logout · registration · password recovery · email verification · session hydration · auth callback · account entry flow

**Must not decide:** actor ownership · VPORT management rights · content publish/edit/delete permission · dashboard access · domain action permission

## Authorization Scope

**Answers:** Can this actor perform this action? Does this actor own this resource? Is this actor permitted to access this feature?

**May manage:** actor ownership checks · VPORT management permission · content access guards · dashboard resource access · permission gates

**Must not:** check session existence · verify email status · call Supabase auth APIs · manage login/logout/registration flows

## Structural Enforcement

| Code Location | Auth Violation | Authorization Violation |
|---|---|---|
| Controller | Checks VPORT ownership | Calls `supabase.auth.*` |
| DAL | Queries `vc.actor_owners` for permission | Queries `auth.users` for authorization |
| Hook | Returns ownership state alongside session | Calls `supabase.auth.getSession()` |
| Feature | Contains both session flow and permission gates | — |

## Enforcement

| Violation | Severity |
|---|---|
| Auth feature/controller/hook performing ownership or permission logic | ERROR |
| Authorization feature/controller/hook managing session or auth flow | ERROR |
| Mixed feature containing both auth flow and permission gates | ERROR |
| Auth DAL querying domain ownership tables for permission | HIGH |
| Authorization DAL calling Supabase auth APIs directly | HIGH |

Source: `AUTH_AUTHZ_SEPARATION_CONTRACT.md`
