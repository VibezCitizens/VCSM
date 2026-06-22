# SEC-REG-INVITE-ARCH-001-LIFECYCLE
## Citizen Invite Attribution — Lifecycle Validation

**Date:** 2026-06-06
**Type:** ARCHITECT Focused Investigation
**Scope:** vc.vibe_invites acceptance lifecycle — when does a valid actorId first exist?
**Predecessor:** SEC-REG-INVITE-ARCH-001.md (invite system architecture map)
**Verdict Status:** COMPLETE

---

## 1. Full Lifecycle — /register?invite_code=<uuid> Through Attribution

### Phase 0 — URL Capture

```
/register?invite_code=550e8400-e29b-41d4-a716-446655440000
  |
  v useRegister.js:40-43
    const inviteCode = useMemo(() => {
      const raw = params.get('invite_code') || null
      return isValidInviteCode(raw) ? raw : null   // UUID regex only
    }, [location.search])
```

`inviteCode` exists as React state in the hook. It is NOT stored anywhere durable.
It is NOT passed to `ctrlRegisterAccount`. It is NOT forwarded in `goOnboarding()` navigate state.
It is NOT in session/localStorage.
It is NOT in `auth.users.user_metadata`.

At this point: `inviteCode` = in-memory only.

---

### Phase 1a — Registration WITH Email Confirm (most users)

```
handleRegister() [useRegister.js:117]
  |
  v ctrlRegisterAccount({ email, password, isWandersFlow }) [register.controller.js:88]
    — inviteCode NOT passed —
    |
    v dalSignUpRegisterUser() — creates auth.users row
      authData.session = null (email unconfirmed)
      returns: { ok:true, requiresEmailConfirm:true, userId:null }
  |
  v navigate('/verify-email', state: { email }) [useRegister.js:138-139]
    — inviteCode LOST. No navigate state. No storage write. —
  |
  v User clicks email link → /auth/callback
  |
  v useAuthCallback.js → resolveAuthCallbackController()
    dalExchangeCodeForSession(code) → session established
    returns: { ok:true, session, isRecovery:false }
  |
  v navigate('/explore', replace:true) [useAuthCallback.js:41]
    — NO onboarding. NO actor creation. NO invite attribution. —
```

**State after Phase 1a:**
- auth.users row: EXISTS
- public.profiles row: DOES NOT EXIST (created in register.controller but only on non-email-confirm path — see Phase 1b)
- vc.actors row: DOES NOT EXIST
- vc.vibe_invites.accepted_actor_id: NULL (no write ever attempted)
- inviteCode: PERMANENTLY LOST (browser tab may have closed between /verify-email and /auth/callback)

Wait — re-reading register.controller.js:126-145: `dalUpsertRegisterProfile` is only called when `newSession` is non-null. For email-confirm path `newSession = null`, so profile is NOT created at registration. Profile is created at onboarding.

**Correction confirmed:**
- For email-confirm path: auth.users created, NO profile, NO actor at Phase 1a completion.
- User lands on /explore → AuthProvider/route guard detects incomplete onboarding → redirects to /onboarding
- They proceed through onboarding normally (Phase 2 below) — but inviteCode is irretrievably gone

---

### Phase 1b — Registration WITHOUT Email Confirm (anonymous upgrade path)

```
handleRegister() [useRegister.js:117]
  |
  v ctrlRegisterAccount({ email, password, isWandersFlow }) [register.controller.js:88]
    existingSession: anonymous user found
    dalUpdateRegisterUser() — upgrade anonymous → permanent
    dalUpsertRegisterProfile() — creates public.profiles row
    returns: { ok:true, requiresEmailConfirm:false, userId: auth.users.id }
  |
  v ctrlRecordSignupConsent() [useRegister.js:146]
  |
  v goOnboarding() [useRegister.js:104]
    navigate('/onboarding', state: { from, card, wandersFlow })
    — inviteCode NOT in navigate state —
    — inviteCode still in-memory React state, about to unmount —
    — inviteCode LOST on unmount —
```

**State after Phase 1b:**
- auth.users row: EXISTS
- public.profiles row: EXISTS (shell — no display_name, no username, no birthdate)
- vc.actors row: DOES NOT EXIST
- vc.vibe_invites.accepted_actor_id: NULL
- inviteCode: LOST on component unmount during navigate

---

### Phase 2 — Onboarding Bootstrap (both paths)

```
/onboarding route mounts
  |
  v useAuthOnboarding.js:76-104 (useEffect)
    getOnboardingBootstrapController() [onboarding.controller.js:40]
      dalGetAuthSession() → session.user.id (auth.users.id)
      readProfileForOnboardingDAL(user.id) → profile row (may be empty shell)
      returns: { ok:true, data: { userId: auth.users.id, form: { display_name:'', username_base:'', ... } } }
    setUserId(auth.users.id)
    setForm({ display_name:'', username_base:'', birthdate:'', sex:'' })
```

**State:** userId = auth.users.id available in React state. NO actorId. NO actor in DB.
**inviteCode:** Not accessible. Not in location.state. Not in sessionStorage. Not in user_metadata.

---

### Phase 3 — Onboarding Completion — FIRST VALID ACTOR ID

```
handleSave() [useAuthOnboarding.js:124]
  |
  v completeOnboardingController({ userId, form, ensureVcsmPlatformBootstrap, refreshActorFn })
    [onboarding.controller.js:59]
    |
    v dalGetAuthSession() — re-verify session
    v normalizeOnboardingFormModel(form)
    v generateUsernameDAL({ displayName, usernameBase })
    v computeAgeFromBirthdateModel(birthdate)
    v upsertCompletedOnboardingProfileDAL({ profileId, displayName, username, birthdate, age, ... })
      — public.profiles row is NOW COMPLETE —
    |
    v createUserActorForProfile({ profileId: user.id, userId: user.id, refreshActorFn })
      [createUserActor.controller.js:15]
      |
      v dalGetActorByProfile(profileId) → null (first time)
      v dalCreateUserActor(profileId) → vc.actors row created
        *** FIRST MOMENT vc.actors.id EXISTS ***
        actor.id = <uuid>  (this is vc.actors.id, NOT auth.users.id, NOT profile.id)
      v dalCreateActorOwner(actor.id, userId) → actor_owners row
      v refreshActorFn(actor.id) → identity cache refreshed
      returns: ActorModel(actor)   → { id: <uuid>, kind:'user', ... }
    |
    v actor.id is available [onboarding.controller.js:122]
    |
    v ensureVcsmPlatformBootstrap({ userId, actorId: actor.id })
      — platform-level bootstrap (district membership, etc.) —
    |
    returns { ok:true, data: { userId } }
  |
  v navigate(navState.redirectTo, replace:true) [useAuthOnboarding.js:144]
```

**CONFIRMED:** `actor.id` (vc.actors.id) exists for the FIRST TIME at line 116-121 of onboarding.controller.js, after `createUserActorForProfile` returns.

---

## 2. What Does `accepted_actor_id` Refer To?

Evidence from the barbershop join flow (`joinBarbershopAccount.controller.js` + `joinInvite.dal.js`):
```js
acceptJoinResourceDAL(resourceId, barberVportActorId)
// barberVportActorId is vc.actors.id — confirmed from createUserActorForProfile return
```

Evidence from team invite DAL (`vportTeamInvite.write.dal.js`):
```js
acceptTeamInviteByActorDAL(resourceId, barberVportActorId, currentMeta)
// writes member_actor_id — same vc.actors.id
```

Evidence from vibeInvites.dal.js schema:
```
accepted_actor_id — column in vc.vibe_invites
inviter_actor_id — column in vc.vibe_invites (set at invite creation time)
```

**VERDICT:** `accepted_actor_id` refers to `vc.actors.id`. NOT auth.users.id. NOT profiles.id.
This is the actor ID produced by `createUserActorForProfile()`.

---

## 3. Actor Creation Timeline

| Event | Timing | userId available | actorId available |
|---|---|---|---|
| Registration submit | t=0 | NO (email-confirm) or YES (anon upgrade) | NO |
| Email verification (/auth/callback) | t+varies | YES (auth.users.id) | NO |
| Onboarding screen load | t+varies | YES | NO |
| Profile upsert (displayName, username) | onboarding form submit | YES | NO |
| `createUserActorForProfile()` returns | onboarding form submit | YES | **YES — FIRST POINT** |
| `ensureVcsmPlatformBootstrap()` | after actor creation | YES | YES |
| navigate(redirectTo) | after bootstrap | YES | YES (cached in identity store) |

---

## 4. Options Analysis — Safest Attribution Trigger

### Option A — Immediately after ctrlRegisterAccount
**Verdict: REJECTED**
- actorId does not exist
- For email-confirm path, userId is null
- Would require a separate "pending invite" record — wrong abstraction
- accepted_actor_id cannot be populated

### Option B — At email verification callback
**Verdict: REJECTED**
- actorId still does not exist after PKCE code exchange
- Only auth session established — actor creation has not happened
- accepted_actor_id cannot be populated

### Option C — After createUserActorForProfile in completeOnboardingController
**Verdict: VIABLE — RECOMMENDED**
- actor.id is guaranteed non-null at this point
- Profile is complete (username, birthdate confirmed valid)
- Same pattern used by barbershop join flow — proven correct
- Requires inviteCode to survive to this point (see Section 5)
- Attribution is idempotent with proper state guard (status='pending' AND accepted_actor_id IS NULL)

### Option D — After ensureVcsmPlatformBootstrap in completeOnboardingController
**Verdict: VIABLE — LESS PREFERRED**
- Functionally identical to C — actor.id same value
- No benefit from delaying past actor creation
- Only advantage: platform bootstrap has run — unnecessary for attribution

### Option E — Lazy on first feature use after onboarding
**Verdict: REJECTED**
- Significant implementation complexity
- Attribution window widens — possible failure modes increase
- No product justification for deferral
- Onboarding completion is the clean, bounded closure point

---

## 5. inviteCode Persistence — Critical Path Problem

**The core problem:** inviteCode is captured from the URL at `/register?invite_code=...` and must survive to onboarding completion — which may happen on a different device, browser, or tab session (email-confirm path).

**sessionStorage approach — INSUFFICIENT:**
- Scoped to the current tab/session
- For email-confirm branch: user clicks link from email client (different tab, possibly different device)
- sessionStorage on original tab is not accessible from verification link
- Would work ONLY for the anonymous-upgrade path (same tab, same session)

**localStorage approach — PARTIALLY SUFFICIENT:**
- Survives tab closes on same device/browser profile
- Still fails cross-device (mobile registers, desktop verifies email)
- Leaks inviteCode across unrelated future sessions if not cleared

**RECOMMENDED: user_metadata approach — FULLY ROBUST:**
Store inviteCode in `options.data` of `supabase.auth.signUp()`. Supabase stores this in `auth.users.raw_user_meta_data`. Accessible at any time via `session.user.user_metadata.invite_code`. Survives email verification on any device.

```js
// In dalSignUpRegisterUser — add options.data:
supabase.auth.signUp({
  email,
  password,
  options: {
    data: { invite_code: inviteCode }  // persisted in auth.users.user_metadata
  }
})
```

At `completeOnboardingController`:
```js
const inviteCode = session.user.user_metadata?.invite_code ?? null
// if non-null and actor.id exists → call acceptVibeInviteByCodeDAL
```

This requires `inviteCode` to be threaded from `useRegister.js` through `ctrlRegisterAccount` and into `dalSignUpRegisterUser`.

---

## 6. Required Files to Modify

| File | Change | Reason |
|---|---|---|
| `apps/VCSM/src/features/auth/hooks/useRegister.js` | Thread `inviteCode` through `handleRegister()` → `ctrlRegisterAccount` | inviteCode currently silently discarded |
| `apps/VCSM/src/features/auth/controllers/register.controller.js` | Accept `inviteCode` param, pass to `dalSignUpRegisterUser` options.data | Controller strips param today |
| `apps/VCSM/src/features/auth/dal/register.dal.js` | Add `inviteCode` to `signUp({ options: { data: { invite_code } } })` | DAL must write to user_metadata |
| `apps/VCSM/src/features/onboarding/dal/vibeInvites.dal.js` | Add `acceptVibeInviteByCodeDAL(inviteCode, acceptedActorId)` | No write DAL exists today |
| `apps/VCSM/src/features/auth/controllers/onboarding.controller.js` | Read `invite_code` from session.user.user_metadata after actor creation; call acceptance DAL | Attribution trigger point |

---

## 7. Proposed DAL Signature

```js
// File: apps/VCSM/src/features/onboarding/dal/vibeInvites.dal.js

export async function acceptVibeInviteByCodeDAL(inviteCode, acceptedActorId) {
  const { data, error } = await supabase
    .schema('vc')
    .from('vibe_invites')
    .update({
      accepted_actor_id: acceptedActorId,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('invite_code', inviteCode)
    .eq('status', 'pending')          // atomic state guard — idempotent
    .is('accepted_actor_id', null)    // prevent double-attribution
    .select('id, inviter_actor_id')
    .maybeSingle()

  if (error) throw error
  return data  // null if no matching pending invite (not an error — may have expired or been used)
}
```

**State guard rationale:** `.eq('status', 'pending').is('accepted_actor_id', null)` ensures:
- Only pending invites are accepted (no double-accept)
- If inviteCode was already used (race condition), the update silently matches 0 rows
- No error thrown — attribution is best-effort; a failed attribution should never block onboarding

---

## 8. Risk Analysis

| Risk | Severity | Mitigation |
|---|---|---|
| inviteCode lost on email-confirm cross-device | HIGH (current state) | Store in user_metadata at signup |
| inviteCode lost on anonymous upgrade | LOW | sessionStorage would work but user_metadata is cleaner and consistent |
| Double-attribution (same code used twice) | MEDIUM | Atomic state guard in DAL: .eq('status','pending').is('accepted_actor_id',null) |
| Expired invite accepted | LOW | Add .gt('expires_at', now()) to DAL guard if expiry is enforced |
| Invite attributed to wrong actor (session change) | LOW | completeOnboardingController already re-verifies session at line 65-77; actor created from verified session.user.id |
| user_metadata invite_code exposed to client | INFO | user_metadata is readable by the authenticated user only — acceptable; code is already in URL |
| Actor creation fails but onboarding continues | MEDIUM | createUserActorForProfile is currently inside completeOnboardingController without a separate error boundary for attribution — use fire-and-forget pattern with captureFrontendError so attribution failure never blocks onboarding |

---

## 9. Final Verdict

**Invite acceptance should occur at the point where `createUserActorForProfile()` returns a non-null `actor.id` inside `completeOnboardingController` (onboarding.controller.js:116-121), because this is the first guaranteed moment a `vc.actors.id` exists to populate `accepted_actor_id`.**

The inviteCode must be persisted in `auth.users.user_metadata` at signup (`dalSignUpRegisterUser` → `options.data.invite_code`) rather than in sessionStorage, so that it survives the email-confirm redirect on a different device. Attribution should be fire-and-forget (failure logs via `captureFrontendError` but does NOT block onboarding completion).

**This is identical to the pattern already used by the barbershop join flow:** actor created → `actor.id` confirmed → acceptance DAL called atomically with state guard.

---

## 10. Recommended Product Ticket

This investigation confirms TICKET-INVITE-ATTRIBUTION-001 from SEC-REG-INVITE-ARCH-001.

Updated scope:

```
TICKET-INVITE-ATTRIBUTION-001
Status: Open
Priority: P2
Type: TASK
App: VCSM

Scope:
1. Thread inviteCode from useRegister.js through ctrlRegisterAccount → dalSignUpRegisterUser → options.data.invite_code
2. Add acceptVibeInviteByCodeDAL (write DAL) to vibeInvites.dal.js
3. In completeOnboardingController: after createUserActorForProfile returns actor.id, read invite_code from session.user.user_metadata; call acceptVibeInviteByCodeDAL fire-and-forget
4. Clear invite_code from user_metadata after attribution (optional — prevents re-read)

Constraints:
- Attribution failure must NEVER block onboarding completion
- No migration required — vc.vibe_invites schema already has accepted_actor_id, status, accepted_at
- DAL must use atomic state guard: status='pending' AND accepted_actor_id IS NULL
- SPIDER-MAN regression test required for both success and failure paths
```

---

*Produced by ARCHITECT focused investigation. No code changes made. All findings advisory.*
