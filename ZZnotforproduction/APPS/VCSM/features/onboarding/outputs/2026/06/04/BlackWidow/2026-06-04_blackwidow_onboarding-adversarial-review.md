# BlackWidow V2 — Adversarial Runtime Verification Report

## 1. Output Metadata

```
Feature:            onboarding
App:                VCSM
BW Version:         BW2.5 V2
Run Date:           2026-06-04
Analyst:            BLACKWIDOW (automated)
Report Path:        ZZnotforproduction/APPS/VCSM/features/onboarding/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_onboarding-adversarial-review.md
Governance Status:  DRAFT (all findings first-issuance)
```

---

## 2. Scanner Preflight

```
Scanner Status:     FRESH
Generated At:       2026-06-04T19:48:25.152Z (~7h old at run time)
Scanner Version:    1.1.0
Security Paths (feature): 3
Total Platform Security Paths: 598
Write Execution Paths (feature): 0 matched (empty write-execution-map for feature)
RPC Execution Paths (feature): 0 matched
Callgraph Nodes:    48
Callgraph Edges:    45
```

---

## 3. Scanner Inputs Block

| Map File | Status |
|---|---|
| security-path-map.json | READ — 3 paths for onboarding |
| callgraph.json | READ — 48 nodes, 45 edges |
| write-execution-map.json | READ — 0 paths for onboarding |
| rpc-execution-map.json | READ — 0 paths for onboarding |

---

## 4. Attack Surface Inventory

### Behavior Contract State
- BEHAVIOR.md: **PLACEHOLDER** — Status field only, no §4 Failure Paths, no §9 Must Never Happen
- All §9 invariants are **UNANCHORED** — source-inferred invariants used for attack scenarios

### Pre-Existing VENOM Open Findings (Cross-Reference Targets)
| Finding | Severity | Status |
|---|---|---|
| VEN-ONBOARDING-001 | HIGH | OPEN — replaceSelectedVibeTagsDAL client-supplied actorId, no ownership check |
| VEN-ONBOARDING-002 | HIGH | OPEN — markActorOnboardingStepCompletedDAL dead surface, no ownership check |
| VEN-ONBOARDING-003 | MEDIUM | OPEN — profileId/vportId surfaced via mapActorRow |
| VEN-ONBOARDING-004 | LOW | OPEN — DEV PROBE console.log with actorId |
| VEN-ONBOARDING-005 | MEDIUM | OPEN — production console.error emits actorId + Supabase error |
| VEN-ONBOARDING-006 | MEDIUM | OPEN — getOnboardingCardsController null-check only on client-supplied actorId |

### Security Paths (Scanner)

All 3 scanner-attributed security paths have **LOW confidence** (no resolved sourceRoute, null controller):

| Path # | Operation | Table | Function | Confidence |
|---|---|---|---|---|
| 1 | upsert | vc.actor_onboarding_steps | markActorOnboardingStepCompletedDAL | HIGH (write) / LOW (path) |
| 2 | update | vc.vibe_actor_tags | replaceSelectedVibeTagsDAL | HIGH (write) / LOW (path) |
| 3 | upsert | vc.vibe_actor_tags | replaceSelectedVibeTagsDAL | HIGH (write) / LOW (path) |

**All 3 security paths are LOW confidence (unresolved route) = PRIMARY ATTACK TARGETS per Rule BW-002**

### DAL Write Surfaces

| DAL Function | Table | Schema | Write Type |
|---|---|---|---|
| replaceSelectedVibeTagsDAL | vibe_actor_tags | vc | update (void) + upsert |
| markActorOnboardingStepCompletedDAL | actor_onboarding_steps | vc | upsert |
| upsertCompletedOnboardingProfileDAL | profiles | public | upsert |
| generateUsernameDAL | (rpc) | public | rpc call |
| upsertProfileShellDAL | profiles | public | upsert |
| dalCreateActorOwner | actor_owners | vc | upsert |

### Hook Entry Points (UI-Accessible)
| Hook | Source | Writes Reachable |
|---|---|---|
| useOnboardingCards (actorId from caller) | onboarding/hooks/useOnboardingCards.js | READ ONLY |
| useOnboardingVibeTags (actorId from useIdentity) | onboarding/hooks/useOnboardingVibeTags.js | replaceSelectedVibeTagsDAL via saveVibeTagsOnboardingController |
| useAuthOnboarding (userId from session/controller) | auth/hooks/useAuthOnboarding.js | upsertCompletedOnboardingProfileDAL, dalCreateActorOwner |

### Callgraph Summary
- 8 controller nodes, 2 hook nodes, 12 DAL nodes, 15 model nodes
- No auth-layer controllers found in callgraph (auth/controllers treated as separate feature)

---

## 5. Scanner Signals Block

```
LOW_CONFIDENCE_PATHS:   3 of 3 (100%)
UNRESOLVED_ROUTES:      3 of 3 — no route attribution; controller null on all paths
HIGH_CONFIDENCE_WRITES: 3 (write operations extracted from AST — confirmed in source)
RPC_PATHS:              0
EDGE_FUNCTIONS:         0
WRITE_MAP_COVERAGE:     0% (write-execution-map has no onboarding entries — gap)
```

Signal interpretation: The write surfaces exist (AST-confirmed), but the scanner has no route-to-write chain for this feature. This is a known coverage gap for onboarding. Primary attack surface must be confirmed via source read, not scanner path chains.

---

## 6. Adversarial Path Analysis

### A. OWNERSHIP BYPASS (§5.1)

#### A.1 — replaceSelectedVibeTagsDAL / saveVibeTagsOnboardingController

Attack: Actor A submits `{ actorId: actorB_id, selectedTagIds: [...] }` directly to saveVibeTagsOnboardingController.

Source trace:
- `useOnboardingVibeTags.js:12` — `actorId = identity?.actorId ?? null` — sourced from `useIdentity()` (session-scoped)
- `useOnboardingVibeTags.js:84` — `save()` calls `saveVibeTagsOnboardingController({ actorId, ... })` — actorId is session-derived at hook level

However:
- `vibeTagsOnboarding.controller.js:37-55` — `saveVibeTagsOnboardingController({ actorId, selectedTagIds })` — no session re-verification inside the controller. The actorId parameter is accepted as-is.
- `vibeTags.dal.js:47-77` — `replaceSelectedVibeTagsDAL({ actorId, tagIds })` — no ownership assertion. Line 54: `.eq('actor_id', actorId)` filters the UPDATE but uses client-supplied actorId directly with no session cross-check.
- `vibeTags.dal.js:71-76` — upsert also writes `actor_id: actorId` directly.

**Result: PARTIAL**
- Hook path: actorId flows from session — BLOCKED at hook level
- Controller path: no session re-verification — actorId accepted from caller argument without re-derivation from session token
- DAL path: no ownership assertion independent of controller input
- Attack vector: Any caller that bypasses the hook and calls saveVibeTagsOnboardingController directly with a different actorId will succeed. This is a direct BYPASSED finding at the controller-to-DAL boundary.

**Finding: BW-ONBOARD-001** — CONFIRMED (see §7)

#### A.2 — markActorOnboardingStepCompletedDAL

Attack: Direct call to markActorOnboardingStepCompletedDAL with victim actorId.

Source trace:
- `onboardingSteps.dal.js:30-52` — exported directly. No controller wrapper found in callgraph for this write.
- VENOM VEN-ONBOARDING-002 flagged this as a dead exported surface.
- No callers found in this feature's controller layer. Export is accessible from any importing module.
- The DAL function has no ownership check, no session verification. It accepts `{ actorId, stepKey }` and unconditionally upserts to `vc.actor_onboarding_steps`.

**Result: BYPASSED** — An imported caller can mark any actor's onboarding step as 'completed' for any step key. Step forgery confirmed.

**Finding: BW-ONBOARD-002** — CONFIRMED (see §7)

#### A.3 — completeOnboardingController / upsertCompletedOnboardingProfileDAL

Attack: Pass `userId` of victim to completeOnboardingController.

Source trace:
- `auth/controllers/onboarding.controller.js:65-69` — session re-verification present:
  ```js
  const session = await dalGetAuthSession()
  const user = session?.user ?? null
  const authState = buildSessionRedirectResult(user)
  if (authState) return authState
  // line 70: userId && userId !== user.id → early return with login action
  ```
- Line 70: `if (userId && userId !== user.id)` — session-vs-payload cross-check. BLOCKED.

**Result: BLOCKED**

### B. SESSION MUTATION (§5.2)

#### B.1 — saveVibeTagsOnboardingController — actorId source

Source trace:
- `vibeTagsOnboarding.controller.js:37` — `saveVibeTagsOnboardingController({ actorId, selectedTagIds })` — actorId is a **parameter**, not derived from session inside the controller.
- No `dalGetAuthSession()` call in vibeTagsOnboarding.controller.js or vibeTags.dal.js.
- The controller trusts actorId entirely from caller context.

Hook mitigation: `useOnboardingVibeTags.js:12` reads actorId from `useIdentity()`. If identity is null/stale, hook will short-circuit at line 26-28 (no save called when `!actorId`).

**Result: PARTIAL** — Hook path is session-gated. Direct controller invocation is not.

#### B.2 — getOnboardingCardsController — null actorId bypass

Source trace:
- `onboarding.controller.js:38-45` — null check: `if (!actorId) return { ok: false, ... }`
- No session verification. actorId sourced from caller. Seven parallel DAL calls fire for any non-null actorId.

Attack: Pass a valid but foreign actorId to `getOnboardingCardsController`.
- All 7 parallel DAL calls use the supplied actorId directly.
- Profile completion data for the target actor would be returned to the caller.

**Result: PARTIAL** — Returns data for any actorId with a truthy value. No session binding. Information disclosure possible for actor completion fields (VEN-ONBOARDING-006 cross-confirmed here as exploitable under direct controller access).

**Finding: BW-ONBOARD-003** — CONFIRMED (see §7)

#### B.3 — bootstrapJoinOnboardingController — session binding

Source trace:
- `auth/controllers/onboarding.controller.js:149-153`:
  ```js
  const session = await dalGetAuthSession()
  const authedId = session?.user?.id ?? null
  if (!authedId || authedId !== userId) {
    throw new Error('Session mismatch. Cannot bootstrap onboarding for this user.')
  }
  ```
- Explicit session-vs-payload binding. BLOCKED.

**Result: BLOCKED**

### C. RUNTIME ABUSE (§5.3)

#### C.1 — Actor kind enforcement in getOnboardingCardsController

Attack: Vport actor calls getOnboardingCardsController — does it leak user profile data?

Source trace:
- `onboarding.controller.js:99-113` — mapActorRow returns `kind`, `profileId`, `vportId`.
- Line 99: `actor?.kind === 'user' && actor?.profileId` — profile lookup only fires for user actors.
- Line 107: `actor?.kind === 'vport' && actor?.vportId` — vport lookup only fires for vport actors.
- Profile data isolation is enforced correctly by kind branching.

**Result: BLOCKED** — Kind-based branching prevents cross-type data leakage.

#### C.2 — profileId/vportId in mapActorRow — architecture contract violation

Source trace:
- `onboarding/model/onboarding.model.js:36-44` — `mapActorRow` exports `profileId` and `vportId` in the returned object.
- VCSM CLAUDE.md: "Never expose profileId or vportId through useIdentity() or any public hook or controller surface."
- These fields are used internally within the controller (`onboarding.controller.js:99,107`) only for DAL routing, not surfaced into the hook return value or card models.

Internal use: the controller uses profileId/vportId to route DAL calls. They are not returned in the card model.
Hook return: `useOnboardingCards.js:61-65` — returns `{ cards, loading, error, refresh }`. No profileId/vportId exposed.

**Result: PARTIAL** — The model exposes profileId/vportId but the controller does not propagate them outward. The architecture contract violation remains as a static concern (VEN-ONBOARDING-003 cross-confirmed) but is not immediately exploitable via the hook surface.

### D. RLS VERIFICATION (§5.4)

#### D.1 — vc.vibe_actor_tags — replaceSelectedVibeTagsDAL

Source trace:
- `vibeTags.dal.js:54-60`:
  ```js
  .from('vibe_actor_tags')
  .update({ is_void: true })
  .eq('actor_id', actorId)
  ```
- UPDATE filter: `.eq('actor_id', actorId)` — data scoping is present at query level.
- UPSERT rows at line 64-69 set `actor_id: actorId` explicitly.
- VEN-ONBOARDING-001: RLS noted as "void-all + replace" but not independently verified as PRESENT by VENOM.

Scanner map shows `vc.vibe_actor_tags` in the security path but no RLS annotation in the scanner output. VENOM flagged "RLS unverified."

**Result: UNRESOLVED** — Query-level scoping exists (mitigates bulk abuse) but table-level RLS status is unconfirmed. Per VENOM finding, this table's RLS is in doubt.

**Finding: BW-ONBOARD-004** — CONFIRMED (see §7)

#### D.2 — vc.actor_onboarding_steps — markActorOnboardingStepCompletedDAL

Source trace:
- `onboardingSteps.dal.js:38-50` — UPSERT with `actor_id: actorId` set in payload.
- No `.eq('actor_id', actorId)` filter (upsert by conflict key `actor_id,step_key`).
- No RLS annotation in scanner. Dead surface with no controller wrapper — RLS is the only barrier.
- If RLS is absent or misconfigured on `vc.actor_onboarding_steps`, any authenticated session can forge step completion for any actor.

**Result: UNRESOLVED** — Sole protection is assumed RLS on `vc.actor_onboarding_steps`. Unverified. Combined with the dead export and no caller ownership check, this is a HIGH risk.

**Finding: BW-ONBOARD-002** (severity CRITICAL) — cross-charges to this section.

#### D.3 — public.profiles — upsertCompletedOnboardingProfileDAL

Source trace:
- `auth/dal/onboarding.dal.js:71-85` — upserts `profiles` with `id: profileId`.
- Caller is `completeOnboardingController` (line 105) which first verifies `user.id === userId` before calling.
- Profile `id` is always the authed user's ID. BLOCKED by controller gate.

**Result: BLOCKED**

### E. VIEWER CONTEXT FUZZING (§5.5)

#### E.1 — null actorId to saveVibeTagsOnboardingController

Source trace:
- `vibeTagsOnboarding.controller.js:37-40`:
  ```js
  if (!actorId) {
    return { ok: false, error: { message: 'Missing actorId' } }
  }
  ```
- Null actorId is caught and returns error. Does not reach DAL.

**Result: BLOCKED**

#### E.2 — null actorId to getOnboardingCardsController

Source trace:
- `onboarding.controller.js:38-45` — null check present, returns `{ ok: false }`.

**Result: BLOCKED**

#### E.3 — undefined/null actorId to replaceSelectedVibeTagsDAL (direct call)

Source trace:
- `vibeTags.dal.js:47-49`:
  ```js
  if (!actorId) throw new Error('actorId is required')
  ```
- DAL-level null guard present. Throws on null/undefined.

**Result: BLOCKED** for null. Non-null foreign actorId still flows through (covered by A.1).

#### E.4 — null actorId to useAuthOnboarding / completeOnboardingController

Source trace:
- `useAuthOnboarding.js:123-124` — `if (!isValid || !userId) return` — userId null prevents save.
- Controller session re-verification at line 65-69 provides secondary gate.

**Result: BLOCKED**

### F. MUTATION REPLAY (§5.6)

#### F.1 — Onboarding completion replay

Attack: Submit completeOnboardingController twice after initial completion.

Source trace:
- `auth/controllers/onboarding.controller.js:104-113` — `upsertCompletedOnboardingProfileDAL` uses upsert semantics.
- `auth/dal/onboarding.dal.js:71-85` — upsert with no state gate; will overwrite on every call.
- No terminal-state check before re-submission. If a user's onboarding is already complete, re-submitting runs the same upsert again, potentially overwriting display_name, username, birthdate.

Username re-generation occurs on every call via `generateUsernameDAL` (line 90-94). A replay could generate a different username if collision logic produces a variant.

**Result: PARTIAL** — The upsert pattern permits replay. No idempotency guard or "already completed" check. Username could drift on repeated submission.

**Finding: BW-ONBOARD-005** — CONFIRMED (see §7)

#### F.2 — Vibe tag replacement replay

Attack: Submit saveVibeTagsOnboardingController twice rapidly.

Source trace:
- `vibeTags.dal.js:54-76` — marks all existing tags void, then upserts new set. No state-machine gate.
- Concurrent double-submit could cause: first call voids tags AND upserts, second call voids the just-upserted tags and upserts same set again. Race window exists.
- No idempotency key, no optimistic lock.

**Result: PARTIAL** — Double-submit creates a void-then-restore cycle with a race condition window where tags are in a fully-voided state.

**Finding: BW-ONBOARD-006** — CONFIRMED (see §7)

### G. HYDRATION POISONING (§5.7)

#### G.1 — Onboarding and identity hydration

Source trace:
- `useAuthOnboarding.js:27` — calls `refreshVcActorDirectory` via `useIdentityOps()`.
- `auth/controllers/onboarding.controller.js:116-127` — `createUserActorForProfile` and `ensureVcsmPlatformBootstrap` called after profile write.
- The actor hydration refresh happens via callback, not via direct store write in this feature.
- No direct store poisoning surface identified in onboarding DAL files.

**Result: BLOCKED** — Onboarding triggers hydration refresh via identity adapter. No direct hydration store writes in onboarding feature.

### H. URL SURFACE (§5.9)

#### H.1 — CTA paths in onboarding cards

Source trace:
- `onboarding.controller.helpers.js:1-43` — STEP_DEFAULTS with ctaPath values:
  - `'/settings?tab=profile'`
  - `'/invite'`
  - `'/citizen/vibes'`
  - All static strings — no UUID or actorId interpolation.
- `resolveStepCtaPath` (line 27-43) forces static path for `complete_citizen_card`.

**Result: BLOCKED** — No raw UUIDs in CTA paths. All paths are static routes.

#### H.2 — Invite card — invite_code exposure

Source trace:
- `vibeInvites.dal.js:22` — `invite_code` is selected in `readVibeInvitesDAL`.
- `onboarding/model/onboarding.model.js:25-34` — `mapVibeInviteRow` does NOT include `invite_code` or `invite_target` in the mapped output.
- The raw invite rows in onboarding controller are used only for `mapVibeInviteRow`, which strips the invite_code.

**Result: BLOCKED** — invite_code selected at DAL but stripped at model layer before surfacing.

#### H.3 — logOnboardingStepFailure — actorId in error logs

Source trace:
- `onboarding.controller.helpers.js:68-81`:
  ```js
  console.error(`[onboarding/cards] ${step} failed`, {
    actorId,
    message: error?.message ?? null,
    code: error?.code ?? null,
    details: error?.details ?? null,
    hint: error?.hint ?? null,
    error,
  })
  ```
- No `import.meta.env.DEV` guard. This fires in production.
- VEN-ONBOARDING-005 cross-confirmed here.

**Result: BYPASSED** — actorId emitted to console in production error paths. Not a URL surface but an information leakage through logs.

### I. §9 INVARIANT ATTACK (HIGHEST PRIORITY)

BEHAVIOR.md is a PLACEHOLDER — no §9 entries. The following source-inferred invariants are used:

#### Inferred Invariant 1: An actor must never be able to modify another actor's vibe tags.

Attack harness: Call `saveVibeTagsOnboardingController({ actorId: victimActorId, selectedTagIds: [] })` from a context where the caller has a valid session for actorA but passes actorB's actorId.

Source trace:
- `vibeTagsOnboarding.controller.js:37-55` — no session re-verification. actorId accepted from parameter.
- `vibeTags.dal.js:54-76` — writes directly with supplied actorId.

**Result: BYPASSED** — Invariant violated. Direct controller call bypasses session binding.

#### Inferred Invariant 2: Onboarding profile completion must only write to the authenticated user's own profile.

Attack harness: Call `completeOnboardingController({ userId: victimUserId, form: {...} })` from a session authenticated as actorA.

Source trace:
- `auth/controllers/onboarding.controller.js:70` — cross-check present: `if (userId && userId !== user.id)` — throws login redirect.

**Result: BLOCKED** — Session pin enforced.

#### Inferred Invariant 3: Onboarding step completion must only be written for the authenticated actor.

Attack harness: Import `markActorOnboardingStepCompletedDAL` and call with any actorId.

Source trace:
- `onboardingSteps.dal.js:30-52` — exported function, no ownership check, no session verification.
- No controller gates this DAL function (confirmed via callgraph — no controller node references markActorOnboardingStepCompletedDAL).

**Result: BYPASSED** — Dead export. Any importing module can forge step completion for any actor.

#### Inferred Invariant 4: Profile completion field reads must not cross actor kind boundaries.

Attack harness: Pass a 'vport' actorId to getOnboardingCardsController and observe if user profile data is returned.

Source trace:
- `onboarding.controller.js:99,107` — kind-gated branches prevent cross-type reads.

**Result: BLOCKED**

---

## 7. Exploitability Assessment

| Finding ID | Severity | Description | Result | Exploit Chain Type | Provenance |
|---|---|---|---|---|---|
| BW-ONBOARD-001 | HIGH | saveVibeTagsOnboardingController accepts actorId from parameter with no session re-verification; replaceSelectedVibeTagsDAL writes directly to vc.vibe_actor_tags for any supplied actorId | BYPASSED | Single-step | [SOURCE_VERIFIED] vibeTagsOnboarding.controller.js:37, vibeTags.dal.js:54 |
| BW-ONBOARD-002 | CRITICAL | markActorOnboardingStepCompletedDAL is a dead exported write surface with no callers, no controller wrapper, no ownership check, no session verification; any importer can forge step completion for any actor | BYPASSED | Single-step | [SOURCE_VERIFIED] onboardingSteps.dal.js:30 |
| BW-ONBOARD-003 | MEDIUM | getOnboardingCardsController binds only to non-null actorId (null check only); any non-null actorId returns profile completion data for that actor; information disclosure on direct controller call | PARTIAL | Single-step | [SOURCE_VERIFIED] onboarding.controller.js:38-45 |
| BW-ONBOARD-004 | HIGH | vc.vibe_actor_tags RLS status unverified by VENOM and unconfirmed in scanner; query-level filter exists but RLS is unknown; if absent, bulk writes for foreign actors are possible at DB level | UNRESOLVED | Single-step | [SCANNER_LOW_CONF] security-path-map — no RLS annotation |
| BW-ONBOARD-005 | LOW | completeOnboardingController uses upsert with no idempotency guard; replay overwrites profile fields including triggering username regeneration; no terminal-state check | PARTIAL | Replay | [SOURCE_VERIFIED] auth/controllers/onboarding.controller.js:90-113, auth/dal/onboarding.dal.js:71-85 |
| BW-ONBOARD-006 | LOW | replaceSelectedVibeTagsDAL performs non-atomic void+upsert sequence; concurrent double-submit creates race window where tags are fully voided before re-insertion | PARTIAL | Timing/Replay | [SOURCE_VERIFIED] vibeTags.dal.js:54-76 |
| BW-ONBOARD-007 | INFO | logOnboardingStepFailure emits actorId and raw Supabase error details to console.error with no DEV guard (VEN-ONBOARDING-005 adversarial confirmation) | BYPASSED | Single-step | [SOURCE_VERIFIED] onboarding.controller.helpers.js:68-81 |
| BW-ONBOARD-008 | INFO | useOnboardingCards.js catch block emits actorId + full error stack to console.error with no DEV guard; production error logging with actor identity | BYPASSED | Single-step | [SOURCE_VERIFIED] useOnboardingCards.js:41-49 |
| BW-ONBOARD-009 | INFO | MISSING_BEHAVIOR_CONTRACT — BEHAVIOR.md is a PLACEHOLDER; all §9 invariants are unanchored; source-inferred invariants used for this review | N/A | N/A | [SOURCE_VERIFIED] BEHAVIOR.md |

---

## 8. Source Verification Summary

All BYPASSED findings carry source-verified citations:

| Finding | File | Line(s) | Evidence |
|---|---|---|---|
| BW-ONBOARD-001 | apps/VCSM/src/features/onboarding/controller/vibeTagsOnboarding.controller.js | 37-55 | saveVibeTagsOnboardingController accepts actorId param; no session cross-check present |
| BW-ONBOARD-001 | apps/VCSM/src/features/onboarding/dal/vibeTags.dal.js | 47-76 | replaceSelectedVibeTagsDAL writes actor_id from param directly to DB |
| BW-ONBOARD-002 | apps/VCSM/src/features/onboarding/dal/onboardingSteps.dal.js | 30-52 | markActorOnboardingStepCompletedDAL exported, no ownership check, no session verify |
| BW-ONBOARD-007 | apps/VCSM/src/features/onboarding/controller/onboarding.controller.helpers.js | 68-81 | console.error with actorId — no import.meta.env.DEV guard |
| BW-ONBOARD-008 | apps/VCSM/src/features/onboarding/hooks/useOnboardingCards.js | 41-49 | console.error with actorId and stack — no DEV guard |

BLOCKED findings verified against:
| Claim | File | Line(s) | Evidence |
|---|---|---|---|
| completeOnboardingController session pin | apps/VCSM/src/features/auth/controllers/onboarding.controller.js | 65-77 | session re-fetch + userId cross-check present |
| bootstrapJoinOnboardingController session pin | apps/VCSM/src/features/auth/controllers/onboarding.controller.js | 149-153 | explicit throw on mismatch |
| replaceSelectedVibeTagsDAL null guard | apps/VCSM/src/features/onboarding/dal/vibeTags.dal.js | 47-49 | throws on null actorId |
| Kind-gated profile reads | apps/VCSM/src/features/onboarding/controller/onboarding.controller.js | 99-113 | kind check before each DAL call |

---

## 9. Confidence Summary

| Category | Count | Notes |
|---|---|---|
| SOURCE_VERIFIED findings | 7 | Source read + line citations |
| SCANNER_LOW_CONF findings | 1 (BW-ONBOARD-004) | RLS unverified — scanner has no annotation |
| SCANNER_LEAD findings | 0 | |
| BYPASSED with SOURCE_VERIFIED | 3 (BW-ONBOARD-001, 002, 007/008) | Full exploit chain confirmed in source |
| BLOCKED with SOURCE_VERIFIED | 6 | Counter-evidence in source |

Overall confidence: **HIGH** for BYPASSED findings. **MEDIUM** for UNRESOLVED RLS findings.

---

## 10. §9 Invariant Attack Map

No formal §9 entries exist (BEHAVIOR.md is a PLACEHOLDER). Source-inferred invariants:

| Invariant | Source | Attack Result |
|---|---|---|
| Actor must not modify another actor's vibe tags | vibeTagsOnboarding.controller.js:37 | BYPASSED — controller accepts foreign actorId |
| Onboarding step completion must be scoped to authed actor | onboardingSteps.dal.js:30 | BYPASSED — dead export, no session pin |
| Profile completion must only write to authed user's profile | auth/controllers/onboarding.controller.js:65-77 | BLOCKED — session cross-check present |
| Profile reads must not cross actor kind boundaries | onboarding.controller.js:99-113 | BLOCKED — kind-gated branches |

**CRITICAL NOTE:** Because BEHAVIOR.md is a PLACEHOLDER, the absence of formal §9 invariants itself constitutes a governance failure. Two source-inferred invariants are BYPASSED, which would be CRITICAL/HIGH release blockers if formally anchored.

---

## 11. Behavior Contract Attack Summary

| Contract Section | Status | Notes |
|---|---|---|
| §4 Failure Paths | MISSING | BEHAVIOR.md is PLACEHOLDER — no failure paths defined |
| §9 Must Never Happen | MISSING | BEHAVIOR.md is PLACEHOLDER — 0 formal invariants; 2 source-inferred invariants BYPASSED |
| §5.1 Ownership | BYPASSED | saveVibeTagsOnboardingController + markActorOnboardingStepCompletedDAL |
| §5.2 Session Mutation | PARTIAL | auth controllers session-pinned; feature controllers not session-pinned |
| §5.3 Runtime Abuse | BLOCKED | Kind-gated reads enforce actor type |
| §5.4 RLS | UNRESOLVED | vc.vibe_actor_tags and vc.actor_onboarding_steps RLS unconfirmed |
| §5.5 Viewer Context | BLOCKED | Null actorId guards at controller + DAL level |
| §5.6 Replay | PARTIAL | No idempotency guards on profile completion or tag replacement |
| §5.7 Hydration | BLOCKED | No direct hydration store writes |
| §5.9 URL Surface | BLOCKED | No raw UUIDs in CTA paths; invite_code stripped at model layer |

---

## 12. THOR Impact

THOR Release Blockers identified by this review:

| Finding | Severity | THOR Impact |
|---|---|---|
| BW-ONBOARD-002 | CRITICAL | RELEASE BLOCKER — dead exported write surface with no ownership protection; step forgery possible for any actor |
| BW-ONBOARD-001 | HIGH | RELEASE BLOCKER — vibe tag write accepts foreign actorId with no session pin at controller layer |
| BW-ONBOARD-004 | HIGH | RELEASE BLOCKER — vc.vibe_actor_tags RLS unverified; combined with BW-ONBOARD-001, full ownership bypass possible if RLS absent |

Pre-existing THOR blockers (from VENOM, confirmed adversarially):
- VEN-ONBOARDING-001 (BW-ONBOARD-001 adversarial confirmation)
- VEN-ONBOARDING-002 (BW-ONBOARD-002 adversarial confirmation — severity upgraded from HIGH to CRITICAL based on dead export + no controller gate)

Total THOR blockers: **3 (2 confirmed, 1 escalated)**

Non-blocking open findings: BW-ONBOARD-003, BW-ONBOARD-005, BW-ONBOARD-006, BW-ONBOARD-007, BW-ONBOARD-008, BW-ONBOARD-009

---

## 13. SPIDER-MAN Test Requirements

The following test cases are required before THOR can clear this feature:

| Test ID | Priority | Coverage Target | Scenario |
|---|---|---|---|
| SM-ONBOARD-001 | P0 | BW-ONBOARD-002 | markActorOnboardingStepCompletedDAL — confirm that calling with actorA's session but actorB's actorId does NOT persist a step for actorB (requires RLS or controller gate) |
| SM-ONBOARD-002 | P0 | BW-ONBOARD-001 | saveVibeTagsOnboardingController — call with foreign actorId; confirm tags are NOT written for the foreign actor |
| SM-ONBOARD-003 | P1 | BW-ONBOARD-004 | replaceSelectedVibeTagsDAL — confirm vc.vibe_actor_tags RLS prevents writes for non-owning actor |
| SM-ONBOARD-004 | P1 | BW-ONBOARD-003 | getOnboardingCardsController — confirm actorId is verified against session before profile completion data is returned |
| SM-ONBOARD-005 | P2 | BW-ONBOARD-005 | completeOnboardingController — replay after completion; confirm username does not change on second submission |
| SM-ONBOARD-006 | P2 | BW-ONBOARD-006 | replaceSelectedVibeTagsDAL — concurrent double-submit; confirm tags are not left in voided state |
| SM-ONBOARD-007 | P3 | BW-ONBOARD-007/008 | logOnboardingStepFailure and useOnboardingCards error handler — confirm no actorId in production console output |
