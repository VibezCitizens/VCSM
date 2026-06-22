# Wentrex User Creation Pipeline — Forensic Trace

**Date:** 2026-04-01
**Source of truth:** Real code inspection of all auth/identity files

---

## 1. Signup Entry Points

Wentrex has **no public self-signup**. All users are created by administrators.

| Entry | File | Who triggers | What is created |
|-------|------|-------------|----------------|
| Create Org Member | `supabase/functions/create-org-member/index.ts` | Admin via dashboard | Staff/teacher/admin auth user + learning actor + org membership |
| Create Student | `supabase/functions/create-student/index.ts` | Admin via dashboard | Student auth user (synthetic email) + learning actor + identity + profile + access + course enrollment |
| Create Parent | `supabase/functions/create-parent/index.ts` | Admin via dashboard | Parent auth user + learning actor + profile + identity + parent-student link |
| Staff Login | `features/auth/screens/LoginScreen.jsx` | User via login page | No creation — auth only. Platform rows self-healed on first login. |
| Student Login | `learning/screens/StudentLoginScreen.jsx` | Student via student-login page | No creation — auth via edge function + session set. Platform rows self-healed. |

**Key insight:** Wentrex is admin-provisioned, not self-service. Users exist in the database before they ever log in.

---

## 2. Full User Creation Pipelines

### 2.1 Staff/Teacher/Admin Creation (create-org-member)

**Trigger:** Admin clicks "Enroll Staff" on dashboard

**Entry UI:** `apps/wentrex/src/learning/administration/screens/DashboardScreen.jsx` → EnrollStaffModal

**Edge Function:** `supabase/functions/create-org-member/index.ts`

**Flow:**
1. **Authorization** — Caller must be: platform admin, org owner, or active org member with admin/owner/staff role
2. **Find or create auth user** — `adminClient.auth.admin.createUser({ email, password, email_confirm: true })`
3. **Provision learning identity** — RPC `learning.ensure_org_member_account()` creates:
   - `public.profiles` row (id, display_name, username, email)
   - `learning.actors` row (user_id, organization_id, is_active=true) — via internal actor resolution
   - `learning.actor_owners` row (actor_id, user_id)
   - `learning.organization_memberships` row (organization_id, actor_id, role, status=active)
   - `learning.actor_access` row (actor_id, can_access_learning_center=true)
4. **Set organization_id on actor** — Direct update
5. **Optional invite** — `adminClient.auth.admin.inviteUserByEmail(email)`
6. **Return** — `{ authUserId, actorId, membershipId, generatedPassword }`

**Tables created (in order):**
1. `auth.users` — Supabase auth account
2. `public.profiles` — Profile shell
3. `vc.actors` → `learning.actors` — Learning actor (via RPC, queries actor_owners for existing actors)
4. `vc.actor_owners` → `learning.actor_owners` — Ownership link
5. `learning.organization_memberships` — Role assignment
6. `learning.actor_access` — Platform access grant

**Platform rows created:** None at this point. Platform provisioning happens on first login via self-healing.

---

### 2.2 Student Creation (create-student)

**Trigger:** Admin clicks "Register Student" on dashboard

**Entry UI:** `apps/wentrex/src/learning/administration/screens/RegisterStudentScreen.jsx`

**Edge Function:** `supabase/functions/create-student/index.ts`

**Flow:**
1. **Authorization** — Same three-level check as org member
2. **Generate login ID** — RPC `learning.generate_student_login_id()` → 7-digit number (e.g., 2026015)
3. **Create synthetic email** — `s2026015@school.internal`
4. **Create auth user** — `adminClient.auth.admin.createUser({ email: syntheticEmail, password, email_confirm: true })`
5. **Create learning actor** — Direct INSERT into `learning.actors` (user_id, organization_id, is_active=true)
6. **Create actor identity** — UPSERT into `learning.actor_identities` (login_id, synthetic_email, parent info, must_change_password=true, is_school_managed=true)
7. **Create actor profile** — UPSERT into `learning.actor_profiles` (full_name, student_id)
8. **Grant access** — UPSERT into `learning.actor_access` (can_access_learning_center=true)
9. **Enroll in courses** — UPSERT into `learning.course_memberships` (role=student, status=active)
10. **Return** — `{ authUserId, studentActorId, loginId, generatedPassword }`

**Tables created (in order):**
1. `auth.users`
2. `learning.actors`
3. `learning.actor_identities`
4. `learning.actor_profiles`
5. `learning.actor_access`
6. `learning.course_memberships` (if courses provided)

**Key difference from org member:** Students don't use the `ensure_org_member_account` RPC. They get a direct actor insert + identity sidecar. They login with login_id, not email.

---

### 2.3 Parent Creation (create-parent)

**Trigger:** Admin clicks "Link Parent" on dashboard

**Entry UI:** `apps/wentrex/src/learning/administration/screens/LinkParentScreen.jsx`

**Edge Function:** `supabase/functions/create-parent/index.ts`

**Flow:**
1. **Authorization** — Same three-level check
2. **Find or create auth user** — By email
3. **Provision parent identity** — RPC `learning.ensure_parent_account()` creates:
   - `public.profiles` row
   - `learning.actors` row (user_id, organization_id)
   - `learning.actor_owners` row
   - `learning.actor_access` row (can_access_learning_center=true)
4. **Create parent profile** — UPSERT `learning.actor_profiles` (full_name, relationship)
5. **Create parent identity sidecar** — UPSERT `learning.actor_identities` (parent_email, parent_name)
6. **Create parent-student link** — INSERT `learning.parent_student_links`
7. **Return** — `{ authUserId, parentActorId, linkId }`

---

## 3. Login + First-Boot Pipeline

### 3.1 Staff/Admin Login

**Entry:** `features/auth/screens/LoginScreen.jsx`

**Flow:**
```
LoginScreen renders form
  ↓ useLogin() hook manages state
  ↓ handleLogin() calls signInWithPassword({ email, password })
    ↓ dalSignInWithPassword() → supabase.auth.signInWithPassword()
  ↓ Session created → auth fires SIGNED_IN event
  ↓ WentrexIdentityContext receives SIGNED_IN
    ↓ resolve() → provisionWentrexIdentity()
      ↓ resolveSessionUser() → gets userId from session
      ↓ resolveWentrexActorForProvisioning(supabase, userId)
        ↓ learning.actors WHERE user_id = userId AND is_active = true
        ↓ learning.actor_access WHERE actor_id → checks can_access_learning_center
      ↓ dalProvisionWentrexIdentity({ actorId, organizationId })
        ↓ platform.provision_wentrex_identity RPC
        ↓ Creates: user_app_access, user_app_accounts, user_app_actor_links, user_app_preferences, user_app_state
      ↓ resolveAuthenticatedContext({ appKey: 'wentrex' })
        ↓ Engine resolves: session → app → access → account → actor links → roles
        ↓ VCSM resolver derives: org roles + parent flag + student flag → roleKeys
        ↓ Destination: admin/owner → /dashboard, teacher → /teacher, parent → /parent, student → /student
  ↓ LoginScreen receives context → navigates to defaultDestination
```

### 3.2 Student Login

**Entry:** `learning/screens/StudentLoginScreen.jsx`

**Flow:**
```
StudentLoginScreen renders form (login ID + password)
  ↓ handleSubmit() calls supabase.functions.invoke("student-login", { loginId, password })
    ↓ Edge function:
      ↓ learning.actor_identities WHERE login_id = loginId → gets synthetic_email
      ↓ learning.actors WHERE id = actor_id → verifies is_active
      ↓ anonClient.auth.signInWithPassword({ email: syntheticEmail, password })
    ↓ Returns { session, must_change_password }
  ↓ supabase.auth.setSession({ access_token, refresh_token })
  ↓ If must_change_password → navigate to /change-password
  ↓ Otherwise → fires SIGNED_IN event → same flow as staff login from step 4
```

### 3.3 Session Restore (Page Reload)

**Flow:**
```
App mounts → main.jsx calls setupWentrexIdentityEngine()
  ↓ configureIdentityEngine({ supabaseClient, resolveAppContext })
  ↓ App.jsx renders WentrexIdentityProvider
    ↓ Subscribes to supabase.auth.onAuthStateChange()
    ↓ INITIAL_SESSION fires
      ↓ If session exists → resolveExisting()
        ↓ resolveAuthenticatedContext({ appKey: 'wentrex', skipLoginRecord: true })
        ↓ If ACCOUNT_NOT_FOUND or ACCESS_DENIED(none) → self-heal:
          ↓ provisionWentrexIdentity() → creates missing platform rows
        ↓ Returns context
      ↓ If no session → clear context
    ↓ RequireAuth checks getSession() → if no session → redirect to /login
```

### Self-Healing Pattern

When a user logs in and has no `platform.*` rows (first login, or rows were lost):

1. Engine's `resolveAuthenticatedContext` fails with `ACCOUNT_NOT_FOUND`
2. `WentrexIdentityContext._canSelfHeal()` returns `true`
3. `provisionWentrexIdentity()` is called
4. It resolves the learning actor and calls `provision_wentrex_identity` RPC
5. RPC creates all platform rows (idempotent)
6. `resolveAuthenticatedContext` is retried and succeeds
7. User is now fully provisioned

This means existing users (created before platform adoption) just work — their platform rows are created transparently on first login.

---

## 4. Database Objects Touched

### Auth Schema
| Object | Read/Write | By | Purpose |
|--------|-----------|-----|---------|
| `auth.users` | Write | create-org-member, create-student, create-parent | Create auth accounts |
| `auth.signInWithPassword` | Read | login.dal.js, student-login function | Authenticate |
| `auth.setSession` | Write | StudentLoginScreen.jsx | Set session from edge function tokens |
| `auth.getSession` | Read | RequireAuth, WentrexIdentityContext | Check current session |
| `auth.onAuthStateChange` | Read | WentrexIdentityContext, RequireAuth | Listen for auth events |

### Learning Schema
| Object | Read/Write | By | Purpose |
|--------|-----------|-----|---------|
| `learning.actors` | R/W | resolvers, create-student, create-org-member RPC | Actor records |
| `learning.actor_owners` | R/W | resolvers, edge functions, RPC | Ownership links |
| `learning.actor_access` | R/W | resolver, create-student, create-parent | Access gate |
| `learning.actor_identities` | R/W | create-student, student-login, create-parent | Login credentials |
| `learning.actor_profiles` | R/W | create-student, create-parent | Display info |
| `learning.organization_memberships` | Read | resolver (role derivation) | Org roles |
| `learning.parent_student_links` | Read/Write | resolver (parent flag), create-parent | Parent links |
| `learning.course_memberships` | Read/Write | resolver (student flag), create-student | Course enrollment |
| `learning.organizations` | Read | edge functions (authz) | Org metadata |
| `learning.platform_admins` | Read | edge functions (authz) | Global admin check |

### Platform Schema
| Object | Read/Write | By | Purpose |
|--------|-----------|-----|---------|
| `platform.apps` | Read | engine resolveAuthenticatedContext | App lookup by key |
| `platform.user_app_access` | R/W | engine, provision RPC | Access status |
| `platform.user_app_accounts` | R/W | engine, provision RPC | App account |
| `platform.user_app_actor_links` | R/W | engine, resolver, provision RPC | Actor-to-account link |
| `platform.user_app_preferences` | R/W | engine, provision RPC | Active actor preference |
| `platform.user_app_state` | R/W | engine, provision RPC | Login timestamps, destination |

### Public Schema
| Object | Read/Write | By | Purpose |
|--------|-----------|-----|---------|
| `public.profiles` | R/W | create-org-member RPC, create-parent RPC | User profile shell |

### RPCs
| RPC | Schema | By | Purpose |
|-----|--------|-----|---------|
| `ensure_org_member_account` | learning | create-org-member | Atomic staff provisioning |
| `ensure_parent_account` | learning | create-parent | Atomic parent provisioning |
| `generate_student_login_id` | learning | create-student | 7-digit student ID |
| `provision_wentrex_identity` | platform | provisionWentrexIdentity controller | Platform row bootstrap |

---

## 5. Architecture Explanation

### How signup is organized
Wentrex is **admin-provisioned**: administrators create users via edge functions. There is no public registration form. Users receive credentials (email+password for staff/parents, login_id+password for students) and log in for the first time.

### What is owned by auth
`auth.users` — the Supabase auth record. Created by edge functions using `adminClient.auth.admin.createUser()`. Students get synthetic emails (`s2026015@school.internal`).

### What is owned by platform
`platform.*` tables — app-account, actor links, preferences, state. Created **on first login** via the `provision_wentrex_identity` RPC, not during admin provisioning. This means platform rows don't exist until the user actually logs in (or until self-healing runs).

### What is owned by app-specific domain tables
`learning.*` tables — actors, actor_access, actor_identities, actor_profiles, organization_memberships, course_memberships, parent_student_links. Created during admin provisioning by edge functions.

### Where orchestration lives
- Edge functions (`supabase/functions/`) — server-side admin provisioning
- `WentrexIdentityContext.jsx` — client-side auth event orchestration
- `provisionWentrexIdentity.controller.js` — client-side platform provisioning

### Where identity becomes app-ready
`WentrexIdentityContext.jsx` — exposes `useWentrexIdentity()` and `useWentrexActorId()`. The context resolves after `SIGNED_IN` or `INITIAL_SESSION` events.

---

## 6. Signup / User Creation Variants

| Variant | Entry | Auth Created By | Learning Rows By | Platform Rows By | Login Method |
|---------|-------|----------------|-----------------|-----------------|-------------|
| Staff/teacher/admin | create-org-member edge fn | Admin (server-side) | ensure_org_member_account RPC | Self-healing on first login | Email + password |
| Student | create-student edge fn | Admin (server-side) | Direct inserts in edge fn | Self-healing on first login | Login ID + password (via student-login fn) |
| Parent | create-parent edge fn | Admin (server-side) | ensure_parent_account RPC | Self-healing on first login | Email + password |
| Self-healing | Login (any path) | Already exists | Already exists | provision_wentrex_identity RPC | Any |

---

## 7. File Map

### Entry / UI Files
- `features/auth/screens/LoginScreen.jsx` — Staff/admin login form
- `learning/screens/StudentLoginScreen.jsx` — Student login form (login ID)
- `features/auth/screens/ResetPasswordScreen.jsx` — Password reset
- `learning/screens/ChangePasswordScreen.jsx` — Must-change-password gate

### Auth / Controller Files
- `features/auth/hooks/useLogin.js` — Login form state + submission
- `features/auth/controllers/login.controller.js` — signInWithPassword, getAuthUser, signOut
- `features/auth/dal/login.dal.js` — Supabase auth wrappers

### Identity / Context Files
- `features/identity/setup.js` — configureIdentityEngine() at app startup
- `features/identity/WentrexIdentityContext.jsx` — Auth event listener + context provider
- `features/identity/controller/provisionWentrexIdentity.controller.js` — Platform provisioning orchestrator
- `features/identity/dal/provision.rpc.dal.js` — RPC call to provision_wentrex_identity
- `features/identity/resolvers/wentrexIdentity.resolver.js` — Learning-schema role/access resolver
- `features/identity/wentrexAccess.js` — Role guards + destination routing

### Edge Function Files
- `supabase/functions/create-org-member/index.ts` — Staff/teacher/admin creation
- `supabase/functions/create-student/index.ts` — Student creation
- `supabase/functions/create-parent/index.ts` — Parent creation
- `supabase/functions/student-login/index.ts` — Student login (login_id → synthetic_email)
- `supabase/functions/reset-student-password/index.ts` — Admin password reset
- `supabase/functions/parent-reset-student-password/index.ts` — Parent password reset

### Route / Gate Files
- `App.jsx` — RequireAuth guard + RequireRole per route + WentrexIdentityProvider wrapper
- `learning/components/RequireRole.jsx` — Role-based route guard
- `main.jsx` — Engine setup before render

---

## 8. Risk Analysis

### Partial creation risks
- **Staff:** RPC is atomic (profile + actor + membership in one transaction) — LOW risk
- **Student:** Multiple separate inserts (actor → identity → profile → access → enrollments) — MEDIUM risk. If actor insert succeeds but identity fails, student is partially created.
- **Parent:** RPC is atomic for core records, but identity sidecar and parent-student link are separate — MEDIUM risk.

### Missing platform rows
- **By design:** Platform rows are created on first login, not during admin provisioning. This is intentional — it follows the self-healing pattern.
- **Risk:** If `provision_wentrex_identity` RPC fails on first login, the context fails and self-healing retries. If RPC is permanently broken, users cannot log in.

### First-login bootstrap
- Self-healing is non-fatal for existing learning rows
- But if `ACCOUNT_NOT_FOUND` and self-heal also fails → user gets `NO_LEARNING_ACTOR` error → redirected to `/unauthorized`
- The user exists in auth but has no usable learning identity → admin must investigate

### Route gating
- `RequireAuth` redirects to `/login` if no session
- `RequireRole` redirects to unauthorized or suspended if role doesn't match
- If roles are empty (no course enrollment for student) → `defaultDestination` is null → navigates to `/unauthorized`

---

## 9. Executive Summary

**Best single entry point to understand signup:** `supabase/functions/create-org-member/index.ts` — it shows the complete admin-provisioned creation flow.

**Full high-level flow:**
1. Admin creates user via edge function (creates auth + learning rows)
2. User logs in → Supabase Auth session created → SIGNED_IN event
3. WentrexIdentityContext provisions platform rows (self-healing)
4. Engine resolves: session → app → access → account → actor link → roles
5. Wentrex resolver derives roles from learning schema
6. User navigated to role-appropriate dashboard

**Top 10 files to inspect:**
1. `features/identity/WentrexIdentityContext.jsx` — auth event orchestration
2. `features/identity/controller/provisionWentrexIdentity.controller.js` — platform provisioning
3. `features/identity/resolvers/wentrexIdentity.resolver.js` — role derivation
4. `features/identity/setup.js` — engine configuration
5. `supabase/functions/create-org-member/index.ts` — staff creation
6. `supabase/functions/create-student/index.ts` — student creation
7. `supabase/functions/create-parent/index.ts` — parent creation
8. `supabase/functions/student-login/index.ts` — student auth
9. `features/auth/screens/LoginScreen.jsx` — login UI
10. `App.jsx` — route structure + RequireAuth

**Essential platform tables:** `platform.user_app_access`, `platform.user_app_accounts`, `platform.user_app_actor_links`, `platform.user_app_preferences`, `platform.user_app_state`

**Is Wentrex already platform-first?** **Yes.** Identity resolution goes through `engines/identity` via `resolveAuthenticatedContext({ appKey: 'wentrex' })`. Platform rows are the source of truth for app-account and actor-link resolution. Learning schema provides role enrichment.

**Biggest architectural strength:** Self-healing pattern. Users created by admins get learning rows immediately. Platform rows are created transparently on first login. No user is ever stuck.

**Biggest fragile point:** Student creation — multiple separate inserts without a wrapping transaction. If one fails mid-way, the student is partially provisioned.

**What makes a new user fully usable:** Auth user exists + learning actor exists + actor_access grants learning center access + platform rows exist (via self-healing). For students: additionally needs actor_identities (for login_id) and course_memberships (for dashboard access).
