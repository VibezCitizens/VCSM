# TONYSTARK REPORT

## Output Metadata
| Field | Value |
|---|---|
| Command | TONYSTARK V1 (manual scan) |
| Ticket | TICKET-INVITE-ATTRIBUTION-001 |
| Scope | auth/register — inviteCode citizen invite attribution system |
| Mode | Area 6 (Module Architecture) + Area 7 (Dead/Spaghetti) |
| Run Date | 2026-06-06 |
| Status | COMPLETE |

---

## Mission

Map the complete architecture of the citizen invite code attribution system — from capture at `/register?invite_code=` through the missing attribution write — determine what is built, what is dead, what is missing, and declare build-readiness for TICKET-INVITE-ATTRIBUTION-001.

---

## Source Scope

| File | Role | Status |
|---|---|---|
| `apps/VCSM/src/features/auth/hooks/useRegister.js` | Capture layer | READ |
| `apps/VCSM/src/features/auth/screens/RegisterScreen.jsx` | Consumer screen | READ |
| `apps/VCSM/src/features/auth/model/authInputValidation.model.js` | Validation model | READ |
| `apps/VCSM/src/features/auth/controllers/register.controller.js` | Registration controller | READ |
| `apps/VCSM/src/features/auth/dal/register.dal.js` | Registration DAL | READ |
| `apps/VCSM/src/features/auth/controllers/onboarding.controller.js` | Onboarding + actor creation | READ |
| `apps/VCSM/src/features/auth/hooks/useAuthOnboarding.js` | Onboarding hook | READ |
| `apps/VCSM/src/features/auth/controllers/createUserActor.controller.js` | Actor creation | READ |
| `apps/VCSM/src/features/onboarding/dal/vibeInvites.dal.js` | Invite DAL (reads only) | READ |
| `apps/VCSM/src/features/invite/controller/invite.controller.js` | Invite send controller | READ |
| `apps/VCSM/src/features/invite/dal/invite.dal.js` | Invite send DAL | READ |
| `apps/VCSM/src/features/auth/controllers/authCallback.controller.js` | Email verify callback | READ |
| `apps/VCSM/src/features/auth/hooks/useAuthCallback.js` | Callback hook | READ |

---

## Module Ownership Map

| Layer | File | Responsibility |
|---|---|---|
| Model | `auth/model/authInputValidation.model.js` | `isValidInviteCode()` — UUID regex validation |
| Hook | `auth/hooks/useRegister.js` | Capture, validate, return inviteCode (currently dead return) |
| Screen | `auth/screens/RegisterScreen.jsx` | Mounts hook — does NOT destructure inviteCode |
| Controller | `auth/controllers/register.controller.js` | `ctrlRegisterAccount` — no inviteCode param |
| DAL | `auth/dal/register.dal.js` | `dalSignUpRegisterUser` — no options.data.invite_code |
| Controller | `auth/controllers/onboarding.controller.js` | `completeOnboardingController` — actor creation point |
| Controller | `auth/controllers/createUserActor.controller.js` | First guaranteed `actor.id` |
| DAL (missing) | `onboarding/dal/vibeInvites.dal.js` | Write DAL does not exist — only reads |

---

## Route / Entry Map

| Entry | Owner | Guard | Notes |
|---|---|---|---|
| `/register?invite_code=<uuid>` | auth/register | AuthPublicRoute (auth'd → /feed) | inviteCode read here |
| `/verify-email` | auth/verify-email | none | inviteCode LOST here (not in state) |
| `/auth/callback` | auth/callback | none | PKCE exchange → navigate('/explore') |
| `/onboarding` | auth/onboarding | session required | actor creation here |

---

## Dependency Map

| From | To | Type | Boundary | Status |
|---|---|---|---|---|
| useRegister.js | authInputValidation.model.js | model | same feature | OK |
| useRegister.js | register.controller.js | controller | same feature | OK — but inviteCode not threaded |
| onboarding.controller.js | createUserActor.controller.js | controller | same feature | OK |
| onboarding.controller.js | vibeInvites.dal.js | DAL | MISSING — cross-feature write needed | GAP |
| register.dal.js | supabase.auth.signUp | external | service boundary | inviteCode not in options.data |

---

## Execution Chain Map

### Current (broken) chain:

```
/register?invite_code=<uuid>
  RegisterScreen.jsx
    useRegister.js
      useMemo → inviteCode = <uuid>          [CAPTURED]
      handleRegister()
        ctrlRegisterAccount({ email, password, isWandersFlow })
                           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                           inviteCode NOT PASSED               [FIRST DROP]
          dalSignUpRegisterUser({ email, password })
                                                               [inviteCode gone]
            supabase.auth.signUp({ email, password })
                                                               [user_metadata empty]

      inviteCode returned at line 191                          [RETURNED]
  RegisterScreen.jsx destructure
      ← inviteCode NOT destructured                            [SECOND DROP — consumer ignores it]

navigate('/onboarding', state: { from, card, wandersFlow })    [THIRD DROP — not in state]

  /onboarding
    useAuthOnboarding.js
      completeOnboardingController({ userId, form, ... })
        createUserActorForProfile()
          actor.id = <uuid>                                    [FIRST VALID ACTOR ID]
        ensureVcsmPlatformBootstrap()
        return { ok: true }                                    [attribution never fires]

navigate(redirectTo)                                           [done — zero attribution written]
```

### Required (correct) chain:

```
/register?invite_code=<uuid>
  RegisterScreen.jsx
    useRegister.js
      inviteCode = <uuid>                                      [CAPTURED — same]
      handleRegister()
        ctrlRegisterAccount({ email, password, isWandersFlow, inviteCode })
                                                               [THREAD inviteCode]
          dalSignUpRegisterUser({ email, password, inviteCode })
            supabase.auth.signUp({
              email, password,
              options: { data: { invite_code: inviteCode } }   [PERSIST to user_metadata]
            })

  /onboarding (any device, any session)
    useAuthOnboarding.js
      completeOnboardingController({ userId, form, ... })
        const inviteCode = session.user.user_metadata?.invite_code ?? null
        createUserActorForProfile()
          actor.id = <uuid>                                    [FIRST VALID ACTOR ID]

        if (inviteCode && actor.id) {
          acceptVibeInviteByCodeDAL(inviteCode, actor.id)      [ATTRIBUTION FIRES]
          — fire and forget — failure does NOT block onboarding
        }

        ensureVcsmPlatformBootstrap()
        return { ok: true }
```

---

## Boundary Review

| Boundary | Status | Notes |
|---|---|---|
| UI / logic separation | PASS | inviteCode logic in hook, not screen |
| Feature boundary | WARNING | attribution trigger spans auth + onboarding features |
| Adapter boundary | PASS | no adapter violations |
| DAL boundary | FAIL | write DAL missing from vibeInvites.dal.js |
| Service boundary | PARTIAL | supabase.auth.signUp called without options.data |
| Monitoring boundary | PASS | captureFrontendError already imported |
| Security boundary | PASS | inviteCode UUID-validated, grants no access |

---

## File Impact Map

| File | Change Type | Reason | Risk |
|---|---|---|---|
| `auth/hooks/useRegister.js` | MODIFY | Thread inviteCode into ctrlRegisterAccount call | LOW — additive param |
| `auth/controllers/register.controller.js` | MODIFY | Accept inviteCode param, pass to DAL | LOW — additive |
| `auth/dal/register.dal.js` | MODIFY | Add options.data.invite_code to signUp call | LOW — additive, ignored if null |
| `onboarding/dal/vibeInvites.dal.js` | ADD FUNCTION | acceptVibeInviteByCodeDAL(inviteCode, actorId) | LOW — new function, no schema change |
| `auth/controllers/onboarding.controller.js` | MODIFY | Read user_metadata.invite_code after actor creation, call DAL fire-and-forget | LOW — failure cannot block |

---

## Must Change

1. [useRegister.js](apps/VCSM/src/features/auth/hooks/useRegister.js) — pass `inviteCode` through `handleRegister` to `ctrlRegisterAccount`
2. [register.controller.js](apps/VCSM/src/features/auth/controllers/register.controller.js) — accept `inviteCode`, forward to `dalSignUpRegisterUser`
3. [register.dal.js](apps/VCSM/src/features/auth/dal/register.dal.js) — add `options: { data: { invite_code } }` to `signUp` call
4. [vibeInvites.dal.js](apps/VCSM/src/features/onboarding/dal/vibeInvites.dal.js) — add `acceptVibeInviteByCodeDAL`
5. [onboarding.controller.js](apps/VCSM/src/features/auth/controllers/onboarding.controller.js) — read `user_metadata.invite_code`, call DAL after actor creation

---

## Must Not Change

- `authInputValidation.model.js` — `isValidInviteCode()` is correct as-is
- `useAuthOnboarding.js` — hook layer is not the right place for attribution logic
- `createUserActor.controller.js` — actor creation is complete and correct
- `RegisterScreen.jsx` — screen does not need inviteCode; logic stays in hook/controller
- `authCallback.controller.js` — email verify callback is not the attribution point
- Any SYSTEM B files (`onboarding.controller.helpers.js`, SHOW_INVITE_ONBOARDING_CARD)

---

## Risks / Blockers

| Risk | Severity | Mitigation |
|---|---|---|
| inviteCode lost cross-device on email-confirm path | HIGH (current) | user_metadata approach eliminates this |
| Attribution failure blocks onboarding | HIGH (must prevent) | fire-and-forget with captureFrontendError |
| Double-attribution (race) | MEDIUM | Atomic state guard: `.eq('status','pending').is('accepted_actor_id',null)` |
| Expired invite attributed | LOW | Add `.gt('expires_at', now())` guard in DAL |
| user_metadata.invite_code readable by client | INFO | Acceptable — code already visible in URL |
| SYSTEM A / SYSTEM B confusion | MEDIUM | No SYSTEM B files touched; write DAL is additive only |

---

## Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | TODO comment + SEC-REG-INVITE-ARCH-001 | — |
| Owner defined | PARTIAL | auth/register (capture), auth/onboarding (trigger) | Split ownership across features |
| Entry points mapped | PASS | `/register?invite_code=` confirmed | — |
| Controllers present/delegated | PARTIAL | capture controller OK; attribution controller absent | completeOnboardingController missing DAL call |
| DAL/repository present | FAIL | vibeInvites.dal.js read-only; write DAL missing | acceptVibeInviteByCodeDAL must be added |
| Models/transformers | PASS | isValidInviteCode() correct | — |
| Hooks/view models | PARTIAL | useRegister captures; screen ignores return | inviteCode not destructured at screen |
| Screens/components | PASS | RegisterScreen mounts correctly | — |
| Database objects mapped | PASS | vc.vibe_invites schema confirmed (has all columns) | No migration needed |
| Authorization path | PASS | inviteCode grants no access; attribution is write-only | — |
| Cache/runtime behavior | PASS | user_metadata persists across sessions/devices | — |
| Error/loading/empty states | PARTIAL | Onboarding error states exist; attribution error state missing | Fire-and-forget + captureFrontendError |
| Documentation linked | PASS | SEC-REG-INVITE-ARCH-001, LIFECYCLE report | — |
| Tests/validation | FAIL | No tests for attribution path | SPIDER-MAN required |
| Native parity | N/A | — | — |
| Engine dependencies | PASS | No engine dependency needed | — |

---

## MODULE INDEPENDENCE STATUS

```
Module:         auth/register — inviteCode attribution
Classification: FRAGMENTED
Reason:         Capture lives in auth/register. Attribution trigger must live in
                auth/onboarding.controller.js. Write DAL lives in onboarding/dal/.
                Three separate feature areas involved. No single file owns the
                complete lifecycle.
Blocking gaps:  Missing write DAL. Missing controller call. Missing user_metadata
                persistence at signup. inviteCode orphaned after hook return.
```

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| `acceptVibeInviteByCodeDAL` function | HIGH | Attribution write cannot fire without it | onboarding/dal/vibeInvites.dal.js |
| `inviteCode` param in `ctrlRegisterAccount` | HIGH | Code never reaches persistence layer | auth/controllers/register.controller.js |
| `options.data.invite_code` in `dalSignUpRegisterUser` | HIGH | Code lost on email-confirm cross-device without user_metadata | auth/dal/register.dal.js |
| Attribution call in `completeOnboardingController` | HIGH | Trigger point never wired up | auth/controllers/onboarding.controller.js |
| SPIDER-MAN tests for attribution path | MEDIUM | No regression coverage exists | SPIDER-MAN |

---

## MODULE BOUNDARY WARNING

```
MODULE BOUNDARY WARNING
Location:      onboarding/dal/vibeInvites.dal.js
Module:        auth/register attribution
Current:       DAL file owned by onboarding feature; write function needed by auth/onboarding controller
Expected:      Write function added to existing vibeInvites.dal.js (onboarding owns the DAL)
               auth/onboarding controller calls across feature boundary to onboarding DAL
Risk:          Cross-feature DAL call — acceptable because onboarding controller already
               has precedent for calling onboarding DALs (readVibeInvitesDAL already called
               in onboarding.controller.js)
Suggested:     Add write function to vibeInvites.dal.js; import in onboarding.controller.js
```

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| authInputValidation.model.js | model | auth/register → auth/model | APPROVED | isValidInviteCode |
| register.controller.js | controller | hook → controller | APPROVED | additive param |
| register.dal.js | DAL | controller → DAL | APPROVED | additive options.data |
| supabase.auth | external service | DAL → Supabase | APPROVED | user_metadata write |
| vibeInvites.dal.js | DAL | onboarding controller → onboarding DAL | APPROVED | same feature |
| vc.vibe_invites | database | DAL → DB | APPROVED | no migration needed |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `?invite_code` URL param | read | URL / browser | useRegister.js | LOW |
| `inviteCode` (React state) | derived | useRegister.js | nobody (orphaned) | HIGH — fix required |
| `auth.users.user_metadata.invite_code` | write (missing) | register.dal.js | onboarding.controller.js | HIGH — not written yet |
| `vc.vibe_invites.accepted_actor_id` | write (missing) | vibeInvites.dal.js | completeOnboardingController | HIGH — DAL missing |
| `vc.vibe_invites.status` | write (missing) | vibeInvites.dal.js | completeOnboardingController | HIGH — DAL missing |
| `vc.vibe_invites.accepted_at` | write (missing) | vibeInvites.dal.js | completeOnboardingController | HIGH — DAL missing |
| `vc.actors.id` | read | createUserActor.controller.js | completeOnboardingController | PASS — confirmed timing |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route entry exists | PASS | /register?invite_code= works | — |
| Loading state | PASS | useRegister loading state present | — |
| Error state (registration) | PASS | errorMessage, captureFrontendError | — |
| Error state (attribution) | FAIL | No attribution error path | Add fire-and-forget + captureFrontendError |
| Auth gate | PASS | AuthPublicRoute present | — |
| Cross-device survival | FAIL | sessionStorage would fail; user_metadata required | Fix in register.dal.js |
| Double-submit guard | PASS | submittingRef already in useRegister | — |
| Attribution idempotency | PARTIAL | DAL not written yet; atomic guard planned | Implement state guard in DAL |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| ARCHITECT report | outputs/2026/06/06/ARCHITECT/SEC-REG-INVITE-ARCH-001.md | PRESENT |
| Lifecycle investigation | outputs/2026/06/06/ARCHITECT/SEC-REG-INVITE-ARCH-001-LIFECYCLE.md | PRESENT |
| VENOM finding | auth/SECURITY.md — VEN-REG-008 | PRESENT (reclassify to PRODUCT) |
| BLACKWIDOW finding | auth/SECURITY.md — BW-REG-007 | PRESENT (reclassify to PRODUCT) |
| Product ticket | TICKET-INVITE-ATTRIBUTION-001 | OPEN |
| SPIDER-MAN tests | — | MISSING |
| OWNERSHIP.md | auth feature | MISSING |

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P2 | `acceptVibeInviteByCodeDAL` in vibeInvites.dal.js | Write DAL is the missing foundation | Implementation |
| P2 | Thread inviteCode through register.controller + register.dal | Persistence layer gap | Implementation |
| P2 | Attribution call in completeOnboardingController | Trigger point | Implementation |
| P3 | SPIDER-MAN regression tests | Attribution success + failure paths | SPIDER-MAN |
| P3 | Reclassify VEN-REG-008 / BW-REG-007 in SECURITY.md | Now product ticket, not security finding | LOGAN |

---

## Validation Plan

After implementation:

```bash
# 1. Confirm inviteCode threads into signUp
grep -n "invite_code\|inviteCode" apps/VCSM/src/features/auth/dal/register.dal.js

# 2. Confirm write DAL exists
grep -n "acceptVibeInviteByCode" apps/VCSM/src/features/onboarding/dal/vibeInvites.dal.js

# 3. Confirm attribution call in onboarding controller
grep -n "acceptVibeInviteByCode\|user_metadata" apps/VCSM/src/features/auth/controllers/onboarding.controller.js

# 4. Confirm no production console.log added
grep -n "console.log" apps/VCSM/src/features/auth/controllers/onboarding.controller.js

# 5. Confirm fire-and-forget pattern (no await blocking onboarding)
# Manual: read completeOnboardingController — attribution call must not be awaited in blocking position
```

---

## Final Verdict

**BUILD_WITH_CAUTION**

The module is architecturally sound at the capture layer. All five required changes are surgical, additive, and carry low risk individually. The cross-device persistence gap (user_metadata) is the critical design decision that makes the difference between a reliable implementation and a broken one. The fire-and-forget attribution requirement is non-negotiable — attribution failure must never block onboarding completion. No migration required. No schema change required. Five files, one new function.

RECOMMENDED HANDOFFS: Implementation → SPIDER-MAN → LOGAN
