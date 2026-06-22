# RED TEAM SECURITY REVIEW — ONBOARDING SYSTEM
**Date:** 2026-06-06
**Reviewer:** Principal Application Security Engineer (Red Team)
**Scope:** VCSM onboarding flow — auth, profile, actor, invite attribution, redirects, session trust
**Verdict:** CONDITIONAL PASS

---

## 1. EXECUTIVE SUMMARY

The main onboarding path (`/onboarding`) is structurally sound. Session identity is pinned from bootstrap through completion, profile writes are tied to `user.id` from a freshly-fetched session, actor creation is idempotent and owner-scoped, and redirect destinations are validated through a strict whitelist. The invite attribution path is fire-and-forget with proper replay protection.

**Two real vulnerabilities were found:**

1. **The barbershop join path (`bootstrapJoinOnboardingController`) entirely bypasses age validation.** A user who registers through the join invite flow completes onboarding without age or `is_adult` being set, and without the 13-year minimum age gate executing.
2. **The `dalGetAuthSession()` call uses `getSession()` (cached, not server-revalidated) for the critical ownership check before profile writes.** This is partially mitigated by downstream RLS but is architecturally weaker than `getUser()`.

Two additional concerns require evidence from the live database schema (not resolvable from source alone): RLS on `public.profiles` INSERT/UPDATE and RLS on `vc.actor_owners` INSERT. The third (`vc.vibe_invites`, OB-004) is closed — the invite flow is frozen and not in production; revisit when the flow is re-enabled.

---

## 2. ONBOARDING ATTACK SURFACE MAP

```
Browser UI (Onboarding.jsx)
  → useAuthOnboarding (React hook)
    → getOnboardingBootstrapController()
        → dalGetAuthSession()                          [SESSION TRUST POINT]
        → readProfileForOnboardingDAL(user.id)         [READ: public.profiles]
    → completeOnboardingController({ userId, form })
        → dalGetAuthSession()                          [SESSION RE-VERIFY]
        → normalizeOnboardingFormModel(form)           [INPUT NORMALIZATION]
        → normalizeSexValueModel(sex)                  [SEX WHITELIST]
        → generateUsernameDAL({ displayName, usernameBase }) [DB RPC]
        → computeAgeFromBirthdateModel(birthdate)     [AGE GATE]
        → upsertCompletedOnboardingProfileDAL({ ... }) [WRITE: public.profiles]
        → createUserActorForProfile({ ... })
            → profileId === userId guard              [IDOR GUARD]
            → dalGetActorByProfile(profileId)          [READ: vc.actors]
            → dalCreateUserActor(profileId)            [RPC: vc.create_actor_for_user]
            → dalCreateActorOwner(actor.id, userId)   [WRITE: vc.actor_owners]
        → acceptCitizenInviteAttribution(code, actor.id)
            → acceptVibeInviteByCodeDAL(code, actorId) [WRITE: vc.vibe_invites]
        → ensureVcsmPlatformBootstrap({ userId, actorId })
            → platform.provision_vcsm_identity RPC    [WRITE: platform tables]

Alternative path (join/barbershop invite flow):
  → autoResumeInviteOnboarding(token, { ... })
    → bootstrapJoinOnboardingController({ userId, displayName, desiredUsername })
        → dalGetAuthSession()                          [SESSION VERIFY]
        → generateUsernameDAL(...)
        → upsertCompletedOnboardingProfileDAL(...)     ⚠ NO AGE GATE
        → createUserActorForProfile(...)
        → ensureVcsmPlatformBootstrap(...)
```

Route guard: `/onboarding` is inside `<ProtectedRoute>`, which requires:
1. Authenticated user (non-null `user`)
2. Email verified
3. Legal consent accepted
4. No anonymous user (isAnonymous check in bootstrap)

---

## 3. FINDINGS TABLE

| ID | Title | Severity | Category | Status |
|----|-------|----------|----------|--------|
| OB-001 | Join flow bypasses age gate entirely | HIGH | Authorization / Age Gate | CONFIRMED |
| OB-002 | `getSession()` used for security checks — not server-validated | MEDIUM | Session Trust | CONFIRMED |
| OB-003 | `public.profiles` INSERT/UPDATE RLS not confirmed in migrations | MEDIUM | RLS Gap | UNCONFIRMED (needs DB) |
| OB-004 | `vc.vibe_invites` RLS not visible in any migration | MEDIUM | RLS Gap | CLOSED — invite flow frozen, not in production |
| OB-005 | `vc.actor_owners` INSERT RLS not confirmed | MEDIUM | RLS Gap | UNCONFIRMED (needs DB) |
| OB-006 | `bootstrapJoinOnboardingController` skips input normalization | LOW | Input Validation | CONFIRMED |
| OB-007 | Username base has no format/content validation | LOW | Input Validation | CONFIRMED |
| OB-008 | `logOnboardingStepFailure` logs actorId to console in production | LOW | Data Leakage | CONFIRMED |
| OB-009 | Age is computed from client clock, not server time | INFORMATIONAL | Age Gate | CONFIRMED |
| OB-010 | DEV-only `console.log` in readQualifyingVibeInviteCountDAL | FALSE POSITIVE | Data Leakage | FALSE POSITIVE |

---

## 4. DETAILED FINDINGS

---

### OB-001 — Join Flow Bypasses Age Gate Entirely
**Severity:** HIGH
**Category:** Authorization / Age Verification Bypass

**Attack Scenario:**
A user under the minimum age (13) or an adult user who wants to register without declaring age can use the barbershop join invitation path. The `bootstrapJoinOnboardingController` writes a complete profile with no age check, no birthdate, and no `is_adult` flag.

**Exploit Steps:**
1. Obtain or generate a valid barbershop join invite token.
2. Register a new account via `/join/barbershop/:token`.
3. After email confirmation, the `autoResumeInviteOnboarding` path runs.
4. `bootstrapJoinOnboardingController` is called with `displayName` and `desiredUsername` from `user_metadata` — these were provided at registration.
5. The controller calls `upsertCompletedOnboardingProfileDAL` with `sex: null` and **no `birthdate`, `age`, or `isAdult` parameters**.
6. Result: the profile row has `birthdate = NULL`, `age = NULL`, `is_adult = NULL`.
7. The user is now a fully-onboarded platform member with no age record on file.

**Evidence:**
```js
// onboarding.controller.js:204-242
export async function bootstrapJoinOnboardingController({
  userId, displayName, desiredUsername, refreshActorFn, ensureVcsmPlatformBootstrap,
}) {
  // ... session check ...
  await upsertCompletedOnboardingProfileDAL({
    profileId: authedId,
    displayName,
    username: finalUsername,
    sex: null,
    updatedAt: new Date().toISOString(),
    // birthdate: NOT PASSED
    // age: NOT PASSED
    // isAdult: NOT PASSED
  })
```

**Compare to main flow** (onboarding.controller.js:121-158):
```js
const age = computeAgeFromBirthdateModel(normalized.birthdate)
if (age == null) return { ok: false, error: { message: 'Invalid birthdate.' } }
if (age < MIN_ONBOARDING_AGE) return { ok: false, error: { message: '...' } }
// ...
await upsertCompletedOnboardingProfileDAL({
  profileId: user.id,
  birthdate: normalized.birthdate,
  age,
  isAdult: age >= 18,
  // ...
})
```

**Impact:**
- Users can bypass the minimum age (13) requirement using the join flow.
- The `is_adult` flag is not set — features gated on `is_adult` (including the planned Void realm) behave unpredictably for join-flow users.
- Age verification is structurally incomplete for ~50% of onboarding paths.

**Recommendation:**
Either:
1. Require age collection as a separate post-join step, OR
2. Add `MIN_AGE_GATE` to `bootstrapJoinOnboardingController` before the profile write.

If age cannot be collected at join time (no UI step), explicitly set `is_adult = false` and `age = null` as a safer default than leaving them unset.

---

### OB-002 — `getSession()` Used for Ownership Check (Not Server-Revalidated)
**Severity:** MEDIUM
**Category:** Session Trust

**Attack Scenario:**
`dalGetAuthSession()` wraps `supabase.auth.getSession()`. Per Supabase documentation: "The session returned can be null if the user is not signed in. On the client, `getSession()` reads from the local storage (browser) or cookie — **it does not re-check the session's validity with the server**."

For security-critical pre-write identity checks, this means a revoked or manipulated local session could pass the application-layer check. The flow is:
1. Session is established (valid JWT).
2. User's JWT is revoked server-side (account compromised, admin action, etc.).
3. `completeOnboardingController()` calls `dalGetAuthSession()` — returns the locally-cached revoked session.
4. `userId !== user.id` check passes (session user.id matches the stored userId).
5. The profile write is attempted with the revoked JWT.
6. PostgREST rejects the write because the JWT is invalid.

So the final write is blocked by RLS, but the application layer does not detect the revoked state.

**Evidence:**
```js
// authSession.read.dal.js:7-10
export async function dalGetAuthSession() {
  const { data, error } = await supabase.auth.getSession() // ← cached, not server-validated
  if (error) throw error
  return data?.session ?? null
}
```

**Impact:**
- Minor: the DB write will fail anyway due to JWT rejection at PostgREST.
- The identity mismatch check (`userId && userId !== user.id`) provides defense-in-depth but against a stale session scenario, not a fully revoked one.
- An attacker who has physical access to a device with a logged-in session but a revoked account would still reach the DB write layer.

**Recommendation:**
Replace `dalGetAuthSession()` with `supabase.auth.getUser()` in `getOnboardingBootstrapController` and `completeOnboardingController`. This performs a server-side token validation on every call. Alternatively, use `getSession()` for initial hydration but `getUser()` for the pre-write identity pin.

```js
// Replacement
const { data, error } = await supabase.auth.getUser()
if (error) throw error
const user = data?.user ?? null
```

---

### OB-003 — `public.profiles` INSERT/UPDATE RLS Not Confirmed in Migrations
**Severity:** MEDIUM
**Category:** RLS Gap

**Attack Scenario:**
The Supabase anon key is embedded in the client bundle and publicly visible. Any actor who extracts it can call the Supabase PostgREST API directly, bypassing all application-layer controls.

`upsertCompletedOnboardingProfileDAL` performs:
```js
supabase.from('profiles').upsert({ id: profileId, ... })
```

If `public.profiles` has no INSERT WITH CHECK or UPDATE USING policy enforcing `id = auth.uid()`, an authenticated user can upsert any profile row with any UUID as the `id`.

**Evidence:**
No migration in `supabase/migrations/` was found that creates INSERT or UPDATE RLS policies on `public.profiles`. The migrations found that reference `public.profiles` are:
- `20260430500000_profile_media_asset_writeback_columns.sql` — column additions only
- `20260430400000_media_asset_writeback_columns.sql` — no profile policies

**Impact:**
- Full profile takeover for any user.
- `display_name`, `username`, `birthdate`, `age`, `is_adult`, `publish`, `discoverable` overwrite.

**Recommendation:**
Confirm live DB policy state with:
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';
```

If absent, add:
```sql
CREATE POLICY profiles_upsert_own ON public.profiles
  FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
```

---

### OB-004 — `vc.vibe_invites` RLS Not Visible in Any Migration
**Severity:** MEDIUM
**Category:** RLS Gap
**Status:** CLOSED — 2026-06-06. The `vc.vibe_invites` invite attribution flow is frozen and not active in production. This finding must be reopened and the DB confirmation query run before the invite flow is re-enabled.

**Attack Scenario:**
`acceptVibeInviteByCodeDAL` writes directly to `vc.vibe_invites`. The invite code is a UUID (sufficient entropy), but if SELECT on this table is open to all authenticated users, invite codes can be enumerated.

If UPDATE is open, any authenticated user can accept any pending invite by knowing the code and calling the Supabase API directly:
```
PATCH /rest/v1/vibe_invites?invite_code=eq.<known-uuid>&status=eq.pending&accepted_actor_id=is.null
Body: { "accepted_actor_id": "<attacker-actor-id>", "status": "accepted" }
```

This would steal invite credit (referral attribution, social graph connection) from the intended recipient.

**Evidence:**
No migration found for `vc.vibe_invites` RLS. The table is accessed as:
```js
supabase.schema('vc').from('vibe_invites').update({ accepted_actor_id: actorId, ... })
  .eq('invite_code', citizenInviteCode)
  .eq('status', 'pending')
  .is('accepted_actor_id', null)
  .gt('expires_at', ...)
```

**Impact:**
- Invite code enumeration if SELECT is open.
- Referral fraud via invite code theft.
- Social graph manipulation.

**Recommendation:**
Confirm live DB state:
```sql
SELECT rowsecurity FROM pg_tables WHERE schemaname = 'vc' AND tablename = 'vibe_invites';
SELECT policyname, cmd, qual, with_check FROM pg_policies
WHERE schemaname = 'vc' AND tablename = 'vibe_invites';
```

Add policies gating UPDATE on `accepted_actor_id IN (SELECT actor_id FROM vc.actor_owners WHERE user_id = auth.uid())`.

---

### OB-005 — `vc.actor_owners` INSERT RLS Not Confirmed
**Severity:** MEDIUM
**Category:** RLS Gap

**Attack Scenario:**
`dalCreateActorOwner` writes:
```js
supabase.schema('vc').from('actor_owners').upsert(
  { actor_id: actorId, user_id: userId },
  { onConflict: 'actor_id,user_id', ignoreDuplicates: true }
)
```

If INSERT on `vc.actor_owners` is not gated by `user_id = auth.uid()`, an authenticated user calling the API directly could insert `{ actor_id: <victim-actor-id>, user_id: <attacker-uid> }` to claim ownership of another user's actor.

**Note:** `actor_id` comes from `create_actor_for_user` RPC which presumably creates a new actor for the calling user — so the `actor_id` is valid. But if an attacker knows a target's `actor_id`, they could try to insert an ownership record.

**Evidence:**
No INSERT policy found for `vc.actor_owners` in migrations. The `actor_onboarding_steps` table has full RLS (confirmed in `20260518010000_actor_onboarding_steps_rls.sql`), but `actor_owners` is referenced only via EXISTS checks — not seen with its own policy block.

**Impact:**
- Actor identity takeover.
- An attacker gains actor privileges (post, message, book) under another user's actor.

**Recommendation:**
```sql
SELECT policyname, cmd, qual, with_check FROM pg_policies
WHERE schemaname = 'vc' AND tablename = 'actor_owners';
```

Add: `WITH CHECK (user_id = auth.uid())` on INSERT.

---

### OB-006 — `bootstrapJoinOnboardingController` Skips Input Normalization
**Severity:** LOW
**Category:** Input Validation

**Attack Scenario:**
In the main onboarding flow, user input is normalized through `normalizeOnboardingFormModel`:
```js
displayName: String(form?.display_name ?? '').trim()
usernameBase: String(form?.username_base ?? '').trim()
```

In the join flow, `displayName` and `desiredUsername` come from `user.user_metadata`:
```js
const displayName = String(meta.display_name || "").trim()
const desiredUsername = String(meta.desired_username || displayName).trim()
```

The normalization is similar but skips the model layer entirely. More importantly, there is **no length validation** on either field in either path. A registration payload with `display_name: "<script>".repeat(10000)` would be stored in user_metadata and propagated to the profile write.

**Impact:**
- Oversized display names (mitigated by DB column constraints, but those limits are unknown from source).
- The join flow bypasses any future content policy checks added to `normalizeOnboardingFormModel`.

**Recommendation:**
Add explicit length limits before the `upsertCompletedOnboardingProfileDAL` call in `bootstrapJoinOnboardingController`:
```js
if (!displayName || displayName.length > 100) throw new Error('Invalid display name.')
```

---

### OB-007 — Username Base Has No Format Validation on Client
**Severity:** LOW
**Category:** Input Validation

**Attack Scenario:**
The `username_base` field in the onboarding form accepts any string:
```js
setForm((prev) => ({ ...prev, [name]: value }))
```

The normalization only trims:
```js
usernameBase: String(form?.username_base ?? '').trim()
```

No regex, no length limit, no reserved word check at the application layer. An attacker could submit:
- `admin`, `root`, `support`, `vcsm` — reserved-word usernames
- Unicode lookalike characters (homograph attack)
- Very long strings

**Impact:**
- Server-side `generate_username` RPC presumably handles sanitization, but client-side validation would provide defense-in-depth and better UX.
- If the RPC doesn't enforce reserved words, squatting on brand names is possible.

**Recommendation:**
Add client-side regex: `/^[a-zA-Z0-9_]{2,30}$/` before submitting. Enforce reserved-word list in the `generate_username` RPC.

---

### OB-008 — `logOnboardingStepFailure` Logs actorId to Console in All Environments
**Severity:** LOW
**Category:** Data Leakage

**Attack Scenario:**
```js
// onboarding.controller.helpers.js:69-80
function logOnboardingStepFailure({ step, actorId, error }) {
  console.error(`[onboarding/cards] ${step} failed`, {
    actorId,    // ← logged unconditionally
    message: error?.message ?? null,
    ...
  })
}
```

This runs in production. A user who opens DevTools can see their own actorId. This is low risk since actorId is not a secret credential, but combined with another actor ID lookup vulnerability, it could assist actor enumeration.

**Impact:** Low — exposes actorId in browser console, not a secret but unnecessary disclosure.

**Recommendation:** Gate behind `import.meta.env.DEV` or omit actorId from the log payload.

---

### OB-009 — Age Is Computed from Client Clock
**Severity:** INFORMATIONAL
**Category:** Age Gating

**Attack Scenario:**
```js
export function computeAgeFromBirthdateModel(isoDate, referenceDate = new Date()) {
  // referenceDate defaults to local machine time
}
```

An attacker could:
1. Set system clock to a future date (e.g., 2030).
2. Enter birthdate = 2018-01-01 (which is 12 years old in 2030, but "valid" against the manipulated clock).
3. The age gate (13 minimum) would still fail in this case — so clock manipulation doesn't help bypass it in the forward direction.

**Forward-date manipulation does not help bypass the minimum age gate**, since the attacker would need the birthdate to be BEFORE `today - 13 years`. A future system clock makes "today" later, which doesn't change whether a fixed past birthdate clears the 13-year threshold.

**BUT**: A self-reported false birthdate (e.g., entering 2000-01-01 when actually born 2015-01-01) cannot be detected. This is an inherent limitation of browser-based age verification with no server-side check.

**Impact:** INFORMATIONAL — This is not a code vulnerability. Birthdate-only age gates on web are inherently bypassable by self-reporting. The `max={todayISO}` HTML attribute prevents browser-UI future-date entry but is trivially bypassed by API calls.

**Recommendation:** Accept this limitation for now. For adult-content gating, add ID verification at a later gate.

---

### OB-010 — DEV Console.log in `readQualifyingVibeInviteCountDAL`
**Verdict:** FALSE POSITIVE

```js
if (import.meta.env.DEV) {
  console.log('[DEV onboarding/vibe_invites] qualifying count', { senderActorId, count, error })
}
```

This is correctly gated by `import.meta.env.DEV` and will not appear in production bundles (Vite sets DEV to false in production builds). No action required.

---

## 5. FALSE POSITIVES IDENTIFIED

| ID | Description | Reason |
|----|-------------|--------|
| OB-010 | DEV console.log in readQualifyingVibeInviteCountDAL | DEV-gated, stripped by Vite at build |
| — | `handleChange` using `[name]: value` | Only permitted form field names reach controller normalization |
| — | `bounceToRegister` passes `navState.redirectTo` as state | This is state, not a URL param; isSafeAuthReturnPath validated it upstream |
| — | Stack traces in captureFrontendError | Sent to server-side monitoring, not user-facing |

---

## 6. VERIFIED PROTECTIONS

| Control | Location | Works Because |
|---------|----------|---------------|
| Double-submit prevention | `useAuthOnboarding:savingRef` | ref survives re-renders; checked before and reset after |
| Session pinning | `completeOnboardingController:87-94` | Re-fetches session; compares stored userId vs session user.id |
| Open redirect protection | `authInputValidation.model:isSafeAuthReturnPath` | Whitelist of prefixes; rejects `//`, protocols, non-string |
| Sex field whitelist | `onboarding.model:normalizeSexValueModel` | Only 'Male'/'Female' survive; null returns error |
| Future birthdate rejection | `onboarding.model:computeAgeFromBirthdateModel` | isFutureBirthdate check returns null → 'Invalid birthdate' |
| Anonymous user rejection | `onboarding.controller:isAnonymousUser` | Checked at bootstrap AND completion |
| Actor creation is owner-scoped | `createUserActor.controller:profileId !== userId guard` | Throws before any DB write |
| Actor creation is idempotent | `createUserActor.controller:dalGetActorByProfile before create` | No duplicate actors |
| Invite replay protection | `vibeInvites.dal:acceptVibeInviteByCodeDAL` | status=pending + IS NULL + expires_at filter |
| Attribution is non-blocking | `onboarding.controller:168-182` | `.catch()` swallows errors; controller returns ok:true |
| Error message sanitization | `authInputValidation.model:mapLoginError` | Whitelist of safe messages; Supabase internals mapped to generic |
| Email PII scrubbing in telemetry | `monitoringClient:scrubMessagePii` | Regex strips email patterns before logging |
| PII key stripping in telemetry | `monitoringClient:stripPii` | Known PII keys stripped from context/tags |
| `platform.provision_vcsm_identity` ownership guard | Migration `20260518050000` | Checks `auth.uid() === p_user_id` AND actor ownership |
| `actor_onboarding_steps` RLS | Migration `20260518010000` | Own-actor SELECT/UPSERT via actor_owners join |
| Anonymous session detection | `isAnonymousUser()` | Checks both `is_anonymous` and `app_metadata.is_anonymous` |
| Email verification gate | `ProtectedRoute` → `useEmailVerified` | Hard gate before /onboarding is reached |

---

## 7. TRUST BOUNDARY ANALYSIS

```
[ Browser / Attacker-Controlled ]
  - HTML form inputs (display_name, username_base, birthdate, sex)
  - location.state.from (redirect target)
  - JavaScript execution environment (clock, localStorage)

[ Application Layer (client-side, bypassable) ]
  - isValid check in hook (empty-field validation)
  - savingRef double-submit prevention
  - normalizeOnboardingFormModel (trim + type coerce)
  - normalizeSexValueModel (whitelist)
  - computeAgeFromBirthdateModel (age gate)
  - isSafeAuthReturnPath (redirect validation)
  - userId === user.id comparison

[ Supabase Auth Layer (server-validated) ]
  - JWT validation on every PostgREST request
  - auth.uid() in all RLS policies
  - getUser() would be server-validated; getSession() is not

[ Database Layer (true security boundary) ]
  - RLS on all tables (where present)
  - RPCs with SECURITY DEFINER guards
  - Unique constraints (username uniqueness)
  - NOT NULL constraints on required fields
```

**Key finding:** The client-side application layer is the UX layer, not the security boundary. The database RLS policies are the actual security enforcement. Any gap in RLS (OB-003, OB-004, OB-005) is a real vulnerability because the anon key is public.

---

## 8. RLS DEPENDENCY ANALYSIS

| Table | Confirmed RLS | Source |
|-------|--------------|--------|
| `public.profiles` INSERT/UPDATE | **UNCONFIRMED** | No migration found |
| `public.profiles` SELECT | Likely (pre-migration) | Referenced in multiple places |
| `vc.actors` | Unknown | Not reviewed |
| `vc.actor_owners` INSERT | **UNCONFIRMED** | No migration found |
| `vc.vibe_invites` | **UNCONFIRMED** | No migration found |
| `vc.actor_onboarding_steps` | **CONFIRMED** | `20260518010000` |
| `platform.*` tables | **CONFIRMED** | `20260518050000` |
| `vc.friend_ranks` | **CONFIRMED** | `20260519120000` |
| `vport.profiles` | **CONFIRMED** | `20260523220000` |

The three unconfirmed tables (OB-003, OB-004, OB-005) must be validated against the live database before production sign-off.

---

## 9. REMAINING RISK RATING

| Risk Area | Level | Notes |
|-----------|-------|-------|
| Age gate bypass (join flow) | HIGH | Confirmed in source; OB-001 |
| Session trust (getSession vs getUser) | MEDIUM | Mitigated by PostgREST JWT validation |
| public.profiles RLS | MEDIUM (pending DB confirmation) | Cannot confirm from source |
| vc.vibe_invites RLS | MEDIUM (pending DB confirmation) | Cannot confirm from source |
| vc.actor_owners RLS | MEDIUM (pending DB confirmation) | Cannot confirm from source |
| Open redirect | LOW | Whitelist confirmed working |
| Username format | LOW | Sanitized by DB RPC |
| Double-submit | LOW | savingRef prevents UI double-submit |
| Data leakage | LOW | actorId in console only |

---

## 10. PRODUCTION READINESS VERDICT

### CONDITIONAL PASS

**Required before production sign-off:**

1. **[OB-001] BLOCKER — Fix join flow age gate.** Add minimum age check and `is_adult` flag to `bootstrapJoinOnboardingController`. The join path must not produce profiles with no age record.

2. **[OB-003, OB-004, OB-005] BLOCKER — Confirm RLS on live DB.** Run the verification queries against the live Supabase instance for `public.profiles`, `vc.vibe_invites`, and `vc.actor_owners`. If any are absent, write and apply migrations before shipping.

**Recommended (non-blocking):**

3. **[OB-002]** Replace `dalGetAuthSession()` with `supabase.auth.getUser()` in both onboarding controller pre-write checks.

4. **[OB-006]** Add length validation in `bootstrapJoinOnboardingController`.

5. **[OB-007]** Add username format regex in client validation and `generate_username` RPC.

6. **[OB-008]** Gate `logOnboardingStepFailure` actorId logging behind `DEV` flag.

**The main `/onboarding` path is structurally sound** for all reviewed attack vectors. The join onboarding path has one confirmed blocker (OB-001) and three database confirmations required (OB-003/004/005).
