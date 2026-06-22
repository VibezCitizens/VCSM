---
title: SEC-REG-INVITE-ARCH-001 — Invite Architecture Full Trace
date: 2026-06-06
type: Architecture Investigation
scope: VCSM — invite-related functionality (all systems)
status: COMPLETE
verdict: D (citizen invite) + C (team invite)
---

# SEC-REG-INVITE-ARCH-001 — Invite Architecture Full Trace

**Date:** 2026-06-06
**Type:** Architecture Investigation
**Scope:** VCSM — all invite-related functionality (citizen invite, team/barbershop invite, join barbershop)
**Status:** COMPLETE
**Originating Finding:** VEN-REG-008 (LOW) / BW-REG-007 (LOW) — "inviteCode attribution gap — UUID-validated but never persisted"

---

## EXECUTIVE SUMMARY

Three distinct invite systems exist in VCSM. They operate independently, use different tables, and have different states of implementation:

| System | Table | Status | Acceptance Recorded |
|---|---|---|---|
| Citizen Invite (vc.vibe_invites) | vc.vibe_invites | PARTIALLY IMPLEMENTED | NO — acceptance step is a TODO |
| Team/Barbershop Invite (vport.resources) | vport.resources | FULLY IMPLEMENTED | YES — atomic write + accepted_at |
| Join/QR Barbershop (vport.resources) | vport.resources | FULLY IMPLEMENTED | YES — same atomic write path |

**Security impact:** NONE. Invite codes do not gate access. Possessing a citizen invite_code grants no privilege — registration is open to all, and the invite_code is silently discarded at registration.

**Product impact:** Attribution gap in citizen invite system. Inviter never receives credit for a completed registration. The vc.vibe_invites record stays status='pending' indefinitely.

**Original finding verdict:** VEN-REG-008 / BW-REG-007 should be RECLASSIFIED from LOW security finding to PRODUCT ticket. Not a security vulnerability.

---

## PHASE 1 — CODE DISCOVERY

### All invite-related symbols found across VCSM src

**vc.vibe_invites system (citizen invite):**

| File | Line | Symbol | Behavior |
|---|---|---|---|
| `apps/VCSM/src/features/auth/hooks/useRegister.js` | 37-38 | TODO comment | "look up vc.vibe_invites by invite_code and mark it accepted" |
| `apps/VCSM/src/features/auth/hooks/useRegister.js` | 40-43 | `inviteCode` | Reads `?invite_code=` URL param, validates UUID format, returns in hook |
| `apps/VCSM/src/features/auth/hooks/useRegister.js` | 191 | `inviteCode` | Exposed in useRegister return value — NOT passed to ctrlRegisterAccount |
| `apps/VCSM/src/features/auth/model/authInputValidation.model.js` | 9 | `INVITE_CODE_UUID_REGEX` | UUID format regex: `/^[0-9a-f]{8}-...-[0-9a-f]{12}$/i` |
| `apps/VCSM/src/features/auth/model/authInputValidation.model.js` | 67-70 | `isValidInviteCode()` | UUID validation only; exported and used in useRegister |
| `apps/VCSM/src/features/onboarding/dal/vibeInvites.dal.js` | 3-45 | `readVibeInvitesDAL` | Reads from vc.vibe_invites by inviter_actor_id; READ ONLY |
| `apps/VCSM/src/features/onboarding/dal/vibeInvites.dal.js` | 47-57 | `readVibeInviteCountDAL` | Count query; READ ONLY |
| `apps/VCSM/src/features/onboarding/dal/vibeInvites.dal.js` | 60-81 | `readQualifyingVibeInviteCountDAL` | Count where status IN ('pending', 'accepted'); READ ONLY; has DEV PROBE comment |
| `apps/VCSM/src/features/invite/controller/invite.controller.js` | 25-37 | `ctrlSendCitizenInvite` | Validates email + inviterType; calls sendCitizenInviteDAL |
| `apps/VCSM/src/features/invite/dal/invite.dal.js` | 12-23 | `sendCitizenInviteDAL` | Invokes `send-citizen-invite` Edge Function; Edge Function NOT in supabase/functions |
| `apps/VCSM/src/features/invite/hooks/useInvite.js` | 5-74 | `useInvite` | Hook for /invite screen; calls ctrlSendCitizenInvite |
| `apps/VCSM/src/features/invite/screens/InviteView.jsx` | 112, 125 | DEV PROBE comment | "[DEV INVITE] — remove after invite tracking confirmed working" |
| `apps/VCSM/src/features/onboarding/controller/onboarding.controller.js` | 88-90 | invite step reads | readVibeInvitesDAL + readQualifyingVibeInviteCountDAL called during onboarding card build |
| `apps/VCSM/src/features/onboarding/controller/onboarding.controller.helpers.js` | 25 | `SHOW_INVITE_ONBOARDING_CARD` | **false** — invite card is feature-flagged OFF |
| `apps/VCSM/src/app/routes/protected/app.routes.jsx` | 152 | `/invite` route | Protected route — exists, reachable for authenticated users |

**vport.resources team invite system:**

| File | Line | Symbol | Behavior |
|---|---|---|---|
| `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/controller/vportTeam.controller.js` | 110 | `kind: "team_invite"` | Creates a staff resource invite record |
| `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/controller/vportTeamInvite.controller.js` | 99-120 | `acceptBarbershopInviteController` | Validates callerActorId; checks invite state; calls acceptTeamInviteByActorDAL |
| `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/dal/vportTeamInvite.write.dal.js` | 98-124 | `acceptTeamInviteByActorDAL` | Atomic UPDATE on vport.resources; state guard: meta.status='pending_acceptance'; writes accepted_at |
| `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/dal/vportTeamInvite.write.dal.js` | 41-66 | `acceptTeamRequestDAL` | Accepts a team request (barber-initiated path); writes accepted_at |
| `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/hooks/useBarberTeamRequests.js` | 6,58 | hook wiring | Calls accept/decline controllers |

**join/barbershop system:**

| File | Line | Symbol | Behavior |
|---|---|---|---|
| `apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js` | 14-43 | `signUpForBarbershopInvite` | New-user registration path for invited barbers |
| `apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js` | 22 | `pending_invite_token` | Token stored in user_metadata at signup |
| `apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js` | 72-113 | `autoResumeInviteOnboarding` | Completes invite onboarding after email confirm; calls acceptJoinResourceDAL |
| `apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js` | 116-134 | `createBarberVportAndAccept` | Creates VPORT + accepts invite; calls acceptJoinResourceDAL |
| `apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js` | 137-150 | `useExistingBarberVportAndAccept` | Uses existing VPORT + accepts invite; calls acceptJoinResourceDAL |
| `apps/VCSM/src/features/join/dal/joinInvite.dal.js` | 19-56 | `acceptJoinResourceDAL` | Atomic UPDATE on vport.resources; state guard: meta.status='pending_onboarding', member_actor_id IS NULL; writes accepted_at |
| `apps/VCSM/src/features/join/dal/joinAuth.dal.js` | 3 | `signUpForInviteDAL` | Standard Supabase signUp with invite metadata |

**Chat/membership invite references (separate, unrelated to this investigation):**

| File | Symbol | Behavior |
|---|---|---|
| `apps/VCSM/src/features/chat/inbox/screens/RequestsInboxScreen.jsx:44-50` | `status === 'invited'`, `invite_pending` | Chat membership state checks — not related to registration or citizen invite |

---

**Symbols NOT FOUND anywhere in VCSM src:**

| Symbol | Result |
|---|---|
| `accepted_by` | Not found |
| `accepted_user_id` | Not found |
| `referral` / `referrer` / `referred_by` | Not found |
| `invitation` / `invitationCode` | Not found |
| `inviteId` / `invite_id` | Not found (only invite_code used) |
| Write function for vc.vibe_invites acceptance | Not found — no DAL function in codebase |

**Edge Functions:**

| Function | Status |
|---|---|
| `send-citizen-invite` | NOT FOUND in supabase/functions/ or supabase/ directory |
| VCSM supabase/functions/ directory | Does not exist as a directory containing VCSM functions |
| (Wentrex has its own supabase/functions/ — separate app, not applicable) | — |

---

## PHASE 2 — REGISTRATION TRACE

### Complete call chain: /register → onboarding

```
USER OPENS: /register?invite_code=<UUID>&intent=<profile|vport>
                                |
                         RegisterScreen
                                |
                         useRegister.js
                                |
    ┌────────────────────────────┬─────────────────────────────┐
    │                            │                             │
intent read (line 29-34)   inviteCode read (line 40-44)   navState read (line 46-57)
  →  '/welcome?intent=...'   isValidInviteCode(raw)         from/card/wandersFlow
  →  'profile' | 'vport'     UUID format only               isSafeAuthReturnPath applied
  →  null                    null if invalid                 (FIX APPLIED ON CURRENT BRANCH)
                                |
                       inviteCode = UUID string | null
                                |
                    DEAD END — not passed anywhere
                    returned in hook: line 191
                    NOT passed to ctrlRegisterAccount
                    NOT passed to goOnboarding
                    NOT passed to navigate state
                    NOT stored in session/localStorage
                                |
                    USER SUBMITS FORM
                                |
                         handleRegister()
                                |
                   ctrlRegisterAccount({ email, password, isWandersFlow })
                   — NO inviteCode parameter —
                                |
                   register.controller.js
                     ├── dalReadRegisterSession
                     ├── if anonymous: dalUpdateRegisterUser
                     ├── else: dalSignUpRegisterUser
                     ├── dalUpsertRegisterProfile (public.profiles)
                     └── maybeMirrorWandersSession (Wanders only)
                                |
                   return { ok, requiresEmailConfirm, userId }
                                |
                   if requiresEmailConfirm → navigate('/verify-email')
                                |
                   ctrlRecordSignupConsent → platform.user_consents INSERT
                                |
                   goOnboarding() → navigate('/onboarding', { state: { from, card, wandersFlow } })
                   — invite_code NOT in onboarding navigation state —
                                |
                          /onboarding
                                |
                       useAuthOnboarding.js
                         → reads redirectTo from state.from (isSafeAuthReturnPath checked — FIX APPLIED)
                         → bootstraps actor/profile
                         → navigate(navState.redirectTo, { replace: true })
                                |
                   — inviteCode is GONE — never reached onboarding
```

**Point of loss:**

`inviteCode` is captured at `useRegister.js:40-43`. It exits the hook return at `useRegister.js:191`. No downstream consumer reads it. It is not passed to `ctrlRegisterAccount`, not forwarded in navigate state, not stored in any persistent store. It is garbage-collected when the component unmounts.

**Line-exact evidence:**

- `useRegister.js:131` — ctrlRegisterAccount call: `{ email: form.email, password: form.password, isWandersFlow }` — no inviteCode
- `register.controller.js:88-92` — ctrlRegisterAccount signature: `{ email, password, isWandersFlow = false }` — no inviteCode param
- `useRegister.js:104-113` — goOnboarding: navigate state `{ from, card, wandersFlow }` — no inviteCode
- No inviteCode reference anywhere in `register.controller.js`, `register.dal.js`, or `auth.adapter.js`

**Is invite data captured?** YES — at useRegister.js:40-43
**Is invite data persisted?** NO — never sent to any API, DB, or storage
**Is invite data discarded?** YES — silently at registration submit time (never included in ctrlRegisterAccount call)
**Is invite data transformed?** YES — UUID validation applied (isValidInviteCode)
**Is invite data validated?** PARTIAL — UUID format validated; existence in DB not validated

---

## PHASE 3 — DATABASE DISCOVERY

### vc.vibe_invites

**Table definition:** NOT FOUND in supabase/migrations directory. All searched migration files were scanned — no CREATE TABLE for vibe_invites.

**Conclusion:** The table exists in production (it is actively read by vibeInvites.dal.js) but was created before the current migration history, is managed externally, or exists in a DB snapshot not checked into the repo.

**Fields confirmed by application code (vibeInvites.dal.js:10-24):**

| Column | Type (inferred) | Source |
|---|---|---|
| id | UUID | vibeInvites.dal.js SELECT list |
| inviter_actor_id | UUID (actor ref) | vibeInvites.dal.js SELECT + eq filter |
| invite_channel | text | vibeInvites.dal.js |
| invite_target | text | vibeInvites.dal.js (recipient email or identifier) |
| invite_code | UUID | vibeInvites.dal.js — the lookup key |
| status | text | vibeInvites.dal.js — values: 'pending', 'accepted' (used in readQualifyingVibeInviteCountDAL) |
| accepted_actor_id | UUID (actor ref) | vibeInvites.dal.js — the field that SHOULD be written on acceptance |
| message | text | vibeInvites.dal.js |
| metadata | jsonb | vibeInvites.dal.js |
| created_at | timestamptz | vibeInvites.dal.js |
| accepted_at | timestamptz | vibeInvites.dal.js |
| expires_at | timestamptz | vibeInvites.dal.js |

**DB callers — READ:**
- `readVibeInvitesDAL` — onboarding controller (called during onboarding card build)
- `readVibeInviteCountDAL` — not found in a controller call
- `readQualifyingVibeInviteCountDAL` — onboarding controller (used for invite card progress)

**DB callers — WRITE:**
- NONE found in any source file in the repository

**Status of acceptance fields:**
- `accepted_actor_id` — designed to be written on acceptance; never written by any app code
- `accepted_at` — designed to be written on acceptance; never written by any app code
- `status` — designed to transition to 'accepted'; never updated by any app code

### vport.resources (team invite + join)

**Table definition:** Referenced in migrations:
- `supabase/migrations/20260527020000_vport_resources_update_member_policy.sql` — mentions acceptTeamInviteByActorDAL

**Fields used by application code:**

| Column | Type | Usage |
|---|---|---|
| id | UUID | resource ID / invite token |
| name | text | Display name |
| resource_type | text | 'staff' for team invites |
| is_active | boolean | false=pending, true=accepted |
| member_actor_id | UUID | SET on acceptance (null until accepted) |
| owner_actor_id | UUID | Barbershop owner |
| profile_id | UUID | Barbershop profile |
| meta | jsonb | status, requested_at, accepted_at, pending_invite_token, etc. |
| sort_order | int | Display ordering |

**DB callers — WRITE:**
- `insertTeamRequestDAL` — creates new team request
- `acceptTeamRequestDAL` — accepts barber-initiated request
- `declineTeamRequestDAL` — declines request or invite
- `acceptTeamInviteByActorDAL` — accepts barbershop-initiated invite
- `acceptJoinResourceDAL` — accepts via /join route
- `deleteTeamResourceDAL` — deletes a resource record

**Status of acceptance fields:** ACTIVE — written correctly by both acceptance DAL functions with atomic state guard.

### Additional DB objects searched

| Object | Result |
|---|---|
| Tables: invites, vibe_invites, referrals, invitation_logs, actor_invites, onboarding_invites | Only vc.vibe_invites found (via app code reads); others not found in migrations or app code |
| Views: invite-related | None found |
| RPCs: invite-related | No invite-specific RPCs found (team invite uses direct table update; join uses direct table update) |
| Triggers: invite acceptance | None found |
| Triggers: actor creation | Not found in local migrations (may exist in DB schema not in migrations) |

---

## PHASE 4 — AUTH BOUNDARY ANALYSIS

### Does invite_code influence any of the following?

| Boundary | Citizen invite_code | Team invite token |
|---|---|---|
| Registration | NO | YES (pending_invite_token stored in user_metadata — but only for /join flow, not /register) |
| Actor creation | NO | YES (/join flow creates VPORT actor; /register flow creates actor independently of invite) |
| Onboarding | NO | YES (/join auto-resume path — bootstrapJoinOnboarding called after email confirm) |
| Role assignment | NO | NO |
| Permissions | NO | NO |
| Organization membership | NO | YES (team invite creates vport.resources link = barbershop team membership) |
| Community membership | NO | NO |
| Vibe membership | NO | NO |
| Access gates (any content gated behind invite) | NO | NO — registration at /register is fully open |

### Can a user gain access to anything solely by possessing an invite code?

**For citizen invite_code (vc.vibe_invites):** **NO**

Evidence:
1. useRegister.js:40-43 reads the code but NEVER passes it anywhere
2. ctrlRegisterAccount (register.controller.js:88) accepts no inviteCode parameter
3. The invite_code does not unlock any registration path, feature flag, or access gate
4. Registration at /register is open to anyone — no invite required
5. The only effect of having an invite_code at /register is exactly nothing observable

**For team invite token (vport.resources.id):** **YES, scoped**

Possession of a team invite token (resource ID) allows a barber VPORT to be linked to a barbershop team slot. This is an authorization action — it grants membership in a barbershop. However:
- The token is not a secret guessing target (UUID)
- Acceptance requires the barber VPORT to be owned by the session user (assertActorOwnsVportActorController is called before accept)
- The atomic guard prevents replay (pending_onboarding + member_actor_id IS NULL)
- This is intended behavior — the invite IS the authorization mechanism

---

## PHASE 5 — RUNTIME FLOW MAPPING

### Flow A: Citizen Invite (vc.vibe_invites)

```
SEND FLOW (complete):
  Inviter navigates to /invite (protected route — must be authenticated)
    ↓
  InviteView.jsx → useInvite.js → ctrlSendCitizenInvite → sendCitizenInviteDAL
    ↓
  supabase.functions.invoke('send-citizen-invite', { targetEmail, inviterType, inviterActorId })
    ↓
  [Edge Function — NOT IN LOCAL CODEBASE — presumably:]
  → Creates vc.vibe_invites row: { inviter_actor_id, invite_code: uuid4(), status: 'pending', invite_target: email }
  → Sends email to targetEmail containing deep link: /register?invite_code=<UUID>
  → Returns { ok: true } or error code

  [UNKNOWN: whether Edge Function actually exists in production]

RECEIVE FLOW (incomplete acceptance):
  Invitee opens email link: /register?invite_code=<UUID>
    ↓
  AuthPublicRoute → RegisterScreen → useRegister
    ↓
  useRegister.js:40-43: inviteCode = isValidInviteCode(raw) ? raw : null
    ↓
  inviteCode is captured (UUID string if valid, null if not)
    ↓
  *** INVITE CODE LOST HERE ***
  useRegister.js:131: ctrlRegisterAccount({ email, password, isWandersFlow })
  — inviteCode NOT included —
    ↓
  Registration completes (auth.signUp → profile upsert → consent → navigate('/onboarding'))
    ↓
  vc.vibe_invites remains: { status: 'pending', accepted_actor_id: null, accepted_at: null }
  (never updated)

WHAT SHOULD HAPPEN (per TODO comment):
  After ctrlRegisterAccount succeeds and userId is known:
  → Look up vc.vibe_invites WHERE invite_code = inviteCode AND status = 'pending'
  → Write: { accepted_actor_id: actorId, accepted_at: now(), status: 'accepted' }
  → This write DAL DOES NOT EXIST in the codebase
```

### Flow B: Team/Barbershop Invite (vport.resources) — COMPLETE

```
SEND FLOW:
  Barbershop owner (vport.resources owner) opens team dashboard card
    ↓
  vportTeam.controller.js → insertTeamRequestDAL OR invite path
    ↓
  vport.resources INSERT: { resource_type: 'staff', meta.status: 'pending_acceptance', is_active: false }

RECEIVE FLOW:
  Barber views invite (via notification or UI)
    ↓
  acceptBarbershopInviteController(token, barberVportActorId, callerActorId)
    ↓
  Validates: callerActorId required, invite state = pending_acceptance
    ↓
  acceptTeamInviteByActorDAL(resourceId, barberVportActorId, meta)
    ↓
  vport.resources UPDATE (atomic):
    WHERE id = resourceId
    AND member_actor_id = barberVportActorId
    AND meta->>status = 'pending_acceptance'
    SET is_active = true, meta.status = 'linked', meta.accepted_at = now()
    ↓
  Returns linked resource | throws "invite is no longer available"
```

### Flow C: Join/QR Barbershop — COMPLETE (similar to B)

```
  User opens /join/barbershop/:token
    ↓
  loadInviteForJoin(token) → fetchJoinResourceByIdDAL → reads vport.resources
    ↓
  If not signed in → signUpForBarbershopInvite (new account with pending_invite_token in user_metadata)
  If signed in with pending token → autoResumeInviteOnboarding
  If signed in, existing barber vport → useExistingBarberVportAndAccept
  If signed in, new vport needed → createBarberVportAndAccept
    ↓
  All paths call acceptJoinResourceDAL(token, barberVportActorId)
    ↓
  vport.resources UPDATE (atomic):
    WHERE id = resourceId
    AND meta->>status = 'pending_onboarding'
    AND member_actor_id IS NULL
    SET member_actor_id = barberVportActorId, is_active = true, meta.status = 'linked', meta.accepted_at = now()
```

---

## PHASE 6 — DEAD CODE DETECTION

| Item | Classification | Evidence |
|---|---|---|
| vc.vibe_invites table — write path (accept) | ORPHANED | Table columns accepted_actor_id, accepted_at, status exist; no write DAL function exists anywhere in codebase |
| `send-citizen-invite` Edge Function | UNKNOWN — not in local codebase | invite.dal.js calls it; not found in supabase/functions/ (may be deployed externally) |
| `inviteCode` in useRegister.js return value | ORPHANED | Returned by hook; RegisterScreen does not use it; nothing downstream reads it |
| `readVibeInviteCountDAL` | PARTIALLY USED | Exported in vibeInvites.dal.js; not found in any controller call (only readVibeInvitesDAL and readQualifyingVibeInviteCountDAL are called) |
| Invite onboarding card (inviteCardModel) | ORPHANED | Built in onboarding.controller.js but gated behind SHOW_INVITE_ONBOARDING_CARD = false — never shown to users |
| `SHOW_INVITE_ONBOARDING_CARD` flag | ACTIVE (as a guard) | Set to false — intentional feature flag; related infrastructure is present but hidden |
| DEV PROBE in InviteView.jsx:112 and :125 | PARTIALLY USED (dev only) | "[DEV INVITE] {rawDebugError}" — present in production bundle but gated by condition |
| vport.resources — team invite stack | ACTIVE | Fully wired through vportTeamInvite.controller.js → write DAL |
| vport.resources — join stack | ACTIVE | Fully wired through joinBarbershopAccount.controller.js → acceptJoinResourceDAL |

---

## PHASE 7 — FINAL VERDICT

**For vc.vibe_invites (citizen invite):**

**D: Invite system exists but acceptance is never recorded.**

- SEND path: Built (invite.dal.js → Edge Function), but Edge Function not in local codebase
- RECEIVE path: Invite code captured (useRegister.js:40-43); UUID validated; discarded silently
- ACCEPT path: TODO — no write DAL function, no controller code, no DB write ever occurs
- Acceptance columns accepted_actor_id, accepted_at, status exist in the table schema but are never written
- DEV PROBE comment in InviteView.jsx confirms this is known incomplete ("remove after invite tracking confirmed working")
- SHOW_INVITE_ONBOARDING_CARD = false confirms the feature is explicitly off

**For vport.resources (team/barbershop invite):**

**C: Invite system exists and works correctly.**

- SEND: Creates staff resource record with pending_acceptance state
- RECEIVE: Multiple acceptance paths all call acceptJoinResourceDAL or acceptTeamInviteByActorDAL
- ACCEPT: Atomic UPDATE with state guard; writes member_actor_id + is_active:true + accepted_at
- Fully implemented, hardened against replay

---

## DELIVERABLES SUMMARY

### 1. Repository-Wide Invite Inventory

| System | Files | State |
|---|---|---|
| Citizen invite send | invite.controller.js, invite.dal.js, useInvite.js, InviteScreen.jsx, InviteView.jsx | ACTIVE — send path built |
| Citizen invite receive (registration) | useRegister.js, authInputValidation.model.js | PARTIALLY USED — capture only; discard on submit |
| Citizen invite accept (DB write) | vibeInvites.dal.js (READ only) | ORPHANED — write function does not exist |
| Citizen invite onboarding card | onboarding.controller.js, vibeInvites.dal.js | ORPHANED — gated off by SHOW_INVITE_ONBOARDING_CARD=false |
| Team invite (barbershop-initiated) | vportTeam.controller.js, vportTeamInvite.controller.js, vportTeamInvite.write.dal.js | ACTIVE |
| Team request (barber-initiated) | vportTeamInvite.controller.js, vportTeamInvite.write.dal.js | ACTIVE |
| Join/QR barbershop | joinBarbershopAccount.controller.js, joinBarbershopQr.controller.js, joinInvite.dal.js | ACTIVE |

### 2. Registration/Onboarding Trace

See Phase 2. inviteCode is captured at useRegister.js:40-43 and discarded when handleRegister calls ctrlRegisterAccount without it.

### 3. Database Object Inventory

See Phase 3. vc.vibe_invites: read functions present; write function absent. vport.resources: fully implemented for team + join.

### 4. Invite Lifecycle Diagram

See Phase 5 flow diagrams. Citizen invite: SEND complete → RECEIVE partial → ACCEPT missing. Team: all three phases complete.

### 5. Security Impact Assessment

**Impact: NONE.** Invite codes do not gate any access. Registration is open. inviteCode is discarded silently. No privilege escalation, no access bypass, no data corruption.

### 6. Product Impact Assessment

**Impact: ATTRIBUTION GAP.** When a citizen invite leads to a registration:
- Inviter's invite record stays `status='pending'` permanently
- `accepted_actor_id` and `accepted_at` remain null permanently
- The inviter's onboarding card counts pending invites (still shows progress) but attribution is incorrect
- Edge Function `send-citizen-invite` missing from local codebase — send path may or may not work in production

### 7. Dead Code Assessment

See Phase 6. The vibe_invites accept write path is ORPHANED. The onboarding invite card is ORPHANED (feature-flagged). DEV PROBE remains in InviteView.jsx.

### 8. Exact Root Cause of Audit Finding

**VEN-REG-008 / BW-REG-007 root cause:**

The TODO comment at `useRegister.js:37-38` is a documented acknowledgment that the acceptance handshake was never implemented. The inviteCode is exposed in the hook return value (`useRegister.js:191`) which suggests it was intended to be used by RegisterScreen for something (possibly display or confirmation), but no downstream consumer actually reads it.

The gap exists at `useRegister.js:131` where ctrlRegisterAccount is called — inviteCode is in scope but excluded from the call. There is no write DAL for acceptance (vibeInvites.dal.js has only read functions). The send-citizen-invite Edge Function, which creates the vibe_invites record, is not in the local codebase.

### 9. Recommended Action

**VEN-REG-008:** RECLASSIFY — convert from LOW security finding to PRODUCT ticket.
**BW-REG-007:** RECLASSIFY — convert from LOW security finding to PRODUCT ticket.
**These findings are NOT security vulnerabilities.** The invite code grants no access. Discarding it harms attribution only.

**New ticket scope:**

```
[TICKET-INVITE-ATTRIBUTION-001]
Status: Open
Priority: P2
Type: PRODUCT
App: VCSM
Goal: Complete the citizen invite acceptance handshake at registration.
Context:
  - useRegister.js captures ?invite_code= but discards it (line 37-38 TODO confirms this)
  - vibeInvites.dal.js has no write function — must be built
  - A write DAL is needed: accepts inviteCode + actorId, writes to vc.vibe_invites
  - SHOW_INVITE_ONBOARDING_CARD must remain false until acceptance works
  - DEV PROBE in InviteView.jsx must be removed when confirmed working
  - send-citizen-invite Edge Function must be audited for existence in production
Constraints:
  - inviteCode should be captured after registration completes and actorId is known
  - Write must be idempotent (already-accepted invites should not throw)
  - Write failure must NOT block registration (fire-and-forget or soft fail)
Next Action: Engineering scoping — build vibeInvites.write.dal.js acceptance function
```

---

**END OF REPORT — SEC-REG-INVITE-ARCH-001**
