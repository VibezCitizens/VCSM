# BLACKWIDOW V2 — Adversarial Runtime Verification Report

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | join |
| App | VCSM |
| Run Date | 2026-06-04 |
| Analyst | BLACKWIDOW V2 (BW2.5 V2) |
| Protocol Version | BW2.9 |
| BEHAVIOR.md Status | PLACEHOLDER — all §9 invariants UNANCHORED |
| Scanner Version | 1.1.0 |
| Scanner Maps Generated | 2026-06-04T19:48:25.152Z (FRESH — ~7h old) |

---

## 2. Scanner Preflight

- Scanner version: 1.1.0
- Maps generated: 2026-06-04T19:48:25.152Z
- Status: FRESH (within 24h window)
- Security paths attributed to join in scanner: 1
- Total platform security paths: 598
- Callgraph nodes for join: 33 (controller: 12, dal: 5, hook: 1, screen: 15)
- Callgraph edges for join: 42
- Write execution paths for join: 0 confirmed routes (all LOW confidence)
- RPC execution paths for join: 0

---

## 3. Scanner Inputs

| Map File | Used |
|---|---|
| security-path-map.json | YES — 1 join path extracted |
| callgraph.json | YES — 33 nodes, 42 edges |
| write-execution-map.json | YES — 0 join write paths (no confirmed route) |
| rpc-execution-map.json | YES — 0 join RPC paths |

Security path confidence: LOW (unresolved sourceRoute — no confirmed route in scanner)
This elevates all write surfaces to PRIMARY ATTACK TARGETS per Rule BW-002.

---

## 4. Attack Surface Inventory

### 4a. Security Paths (Scanner-attributed)

| Path | Confidence | Route | Access |
|---|---|---|---|
| acceptJoinResourceDAL (resources UPDATE) | HIGH (write) / LOW (path) | null — unresolved | unknown |

### 4b. Hook Entry Points (UI-accessible)

| Hook | File |
|---|---|
| useJoinBarbershop | apps/VCSM/src/features/join/hooks/useJoinBarbershop.js |

### 4c. Controller Entry Points

| Function | File |
|---|---|
| loadInviteForJoin | joinBarbershopAccount.controller.js |
| signUpForBarbershopInvite | joinBarbershopAccount.controller.js |
| loginForInvite | joinBarbershopAccount.controller.js |
| checkJoinAuthState | joinBarbershopAccount.controller.js |
| getExistingBarberVport | joinBarbershopAccount.controller.js |
| autoResumeInviteOnboarding | joinBarbershopAccount.controller.js |
| createBarberVportAndAccept | joinBarbershopAccount.controller.js |
| useExistingBarberVportAndAccept | joinBarbershopAccount.controller.js |
| loadQrJoin | joinBarbershopQr.controller.js |
| findCurrentUserBarberVport | joinBarbershopQr.controller.js |
| acceptQrJoin | joinBarbershopQr.controller.js |
| createBarberVportAndAcceptQr | joinBarbershopQr.controller.js |

### 4d. DAL Write Surfaces

| Function | Table | Operation | File |
|---|---|---|---|
| acceptJoinResourceDAL | resources | UPDATE (conditional) | joinInvite.dal.js |
| signUpForInviteDAL | auth.users | INSERT (Supabase auth.signUp) | joinAuth.dal.js |

### 4e. DAL Read Surfaces (relevant to attacks)

| Function | Table | File |
|---|---|---|
| fetchJoinResourceByIdDAL | resources | joinInvite.dal.js |
| readBarberVportByOwnerUserIdDAL | profiles | barberVport.read.dal.js |
| findBarberVportForUserDAL | profile_categories + profiles | barberVport.read.dal.js |

### 4f. Callgraph Backward Trace (DAL write → Hook)

```
useJoinBarbershop (hook)
  ├── acceptQrJoin (controller) → acceptJoinResourceDAL (DAL) → resources UPDATE
  ├── createBarberVportAndAcceptQr (controller) → acceptJoinResourceDAL (DAL) → resources UPDATE
  ├── createBarberVportAndAccept (controller) → acceptJoinResourceDAL (DAL) → resources UPDATE
  ├── useExistingBarberVportAndAccept (controller) → acceptJoinResourceDAL (DAL) → resources UPDATE
  └── autoResumeInviteOnboarding (controller) → acceptJoinResourceDAL (DAL) → resources UPDATE
```

All five write paths ultimately call `acceptJoinResourceDAL`. Every path goes through `assertActorOwnsVportActorController` before reaching the DAL write.

---

## 5. Scanner Signals

| Signal | Value |
|---|---|
| Unresolved security paths (LOW confidence) | 1 |
| Write surfaces without confirmed route | 1 (acceptJoinResourceDAL) |
| RPCs in scope | 0 |
| Edge functions in scope | 0 |
| Schema inferred from scanner | resources table (vport schema) |
| VENOM open findings carried forward | VEN-JOIN-001, VEN-JOIN-002, VEN-JOIN-003, VEN-JOIN-004 |

---

## 6. Adversarial Path Analysis

### 6A. OWNERSHIP BYPASS (§5.1)

**Target:** Can an actor submit a mutation with another actor's VPORT actor ID and complete the join?

**Attack Vector:**
Attacker calls `acceptQrJoin(token, victim_vport_actor_id, attacker_actor_id)` via the hook `acceptQr()`.

**Source Trace:**
- `useJoinBarbershop.js:176` — `await acceptQrJoin(token, barberVport.actor_id, callerActorId)` — callerActorId comes from `identity?.actorId`
- `joinBarbershopQr.controller.js:21-24` — `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: barberVportActorId })`
- `assertActorOwnsVportActor.controller.js:23-29` — actor fetched, kind === "user" verified
- `assertActorOwnsVportActor.controller.js:43-49` — `readActorOwnerLinkByActorAndUserProfileDAL` checked; throws "Actor does not own this vport actor." if link absent

**Verdict: BLOCKED** — ownership gate at controller layer prevents cross-actor resource claim.

**For `createBarberVportAndAccept` (invite flow):**
- `joinBarbershopAccount.controller.js:127-134` — same `assertActorOwnsVportActorController` before `acceptJoinResourceDAL`

**For `useExistingBarberVportAndAccept`:**
- `joinBarbershopAccount.controller.js:143-148` — same assertion before DAL write

**For `autoResumeInviteOnboarding`:**
- `joinBarbershopAccount.controller.js:89-98` — `bootstrapJoinOnboardingController` returns actor from session; callerActorId resolved from that actor
- `joinBarbershopAccount.controller.js:106-109` — `assertActorOwnsVportActorController` with session-derived callerActorId

**Note — partial gap in `autoResumeInviteOnboarding`:** The `vportResult.actorId` comes from `createVport?.()` (an injected function). The ownership assertion runs AFTER VPORT creation but uses the session-derived actor. If `createVport` produces a VPORT not owned by the session actor due to a bug in the underlying adapter, the ownership assertion would catch it. This is a defense-in-depth dependency rather than a bypass.

**Result: BLOCKED [SOURCE_VERIFIED]**
- joinBarbershopQr.controller.js:21-24
- joinBarbershopAccount.controller.js:127-134, 143-148, 106-109

---

### 6B. SESSION MUTATION (§5.2)

**Target:** Is `viewerActorId`/`callerActorId` taken from session (trusted) or from client payload (untrusted)?

**Source Trace — QR flow:**
- `useJoinBarbershop.js:171` — `const callerActorId = identity?.actorId ?? null`
- `identity` is sourced from `useIdentity()` which resolves from the platform identity store (server-side session hydration), not from the URL or form body.

**Source Trace — invite flow `autoResumeInviteOnboarding`:**
- `joinBarbershopAccount.controller.js:79` — `const user = await readCurrentAuthUserDAL?.()` — reads current auth session
- `joinBarbershopAccount.controller.js:89` — `bootstrapJoinOnboardingController({ userId: user.id, ... })` — session userId passed in
- `onboarding.controller.js:149-153` — `dalGetAuthSession()` called; throws if `authedId !== userId` — session mismatch check prevents callerActorId injection

**Source Trace — `createBarberVportAndAccept` / `useExistingBarberVportAndAccept`:**
- `useJoinBarbershop.js:230` — `callerActorId: identity?.actorId ?? null` — same session-resolved identity

**Null Session Attack:** If `identity?.actorId` is null:
- `useJoinBarbershop.js:172` — `if (!callerActorId) return` — early exit without calling controller
- `joinBarbershopAccount.controller.js:117` — `if (!callerActorId) throw new Error("createBarberVportAndAccept: callerActorId required")`
- `joinBarbershopQr.controller.js:19-21` — `if (!callerActorId) throw new Error("acceptQrJoin: callerActorId required")`

**Result: BLOCKED [SOURCE_VERIFIED]**
- useJoinBarbershop.js:171-172
- joinBarbershopAccount.controller.js:117
- joinBarbershopQr.controller.js:19-21
- onboarding.controller.js:149-153

---

### 6C. RUNTIME ABUSE (§5.3)

**Target:** Can a non-owner actor type (e.g., a VPORT-kind actor) reach owner-only join paths?

**Source Trace:**
- `assertActorOwnsVportActor.controller.js:28-30` — `if (requesterActor.kind !== "user") throw new Error("Only actor owners can manage this booking resource.")`
- This kind check is unconditional and runs BEFORE the self-shortcut (ELEK-004 note in file confirms this)
- A VPORT-kind actor with `requestActorId === targetActorId` would fail at the kind gate

**Secondary:** `autoResumeInviteOnboarding` only resolves callerActorId from `bootstrapJoinOnboardingController`, which creates a user-kind actor from the auth session. A VPORT actor cannot be injected here.

**Result: BLOCKED [SOURCE_VERIFIED]**
- assertActorOwnsVportActor.controller.js:28-30

---

### 6D. RLS VERIFICATION (§5.4)

**Target:** For each DAL write: is there ownership filter in the query, or is RLS the only barrier?

**`acceptJoinResourceDAL` analysis:**
- `joinInvite.dal.js:48-51` — query has `.eq("meta->>status", "pending_onboarding")` and `.is("member_actor_id", null)` as write conditions
- These are application-layer predicates on the UPDATE, not RLS alone
- RLS on the `resources` table (vport schema) has not been independently verified in this session
- No `owner_user_id` or `actor_id` filter on the UPDATE row itself — the resource is identified by `resourceId` and the state conditions only

**FINDING: BW-JOIN-001** — The `acceptJoinResourceDAL` UPDATE uses application-layer state guards (.eq status + .is member_actor_id null) but does NOT include a caller-identity ownership filter in the SQL predicate. The ownership check (assertActorOwnsVportActorController) runs at the controller layer and is not represented in the DAL query. If RLS on the `resources` table is absent or misconfigured, a session-authenticated user who passes auth but fails the ownership gate client-side (e.g., an error is swallowed) could write to an arbitrary resource row. The scanner has not confirmed RLS status for `vport.resources`.

**`signUpForInviteDAL`:**
- Calls `supabase.auth.signUp()` — standard Supabase auth flow, no custom table writes here. RLS not applicable.

**`readBarberVportByOwnerUserIdDAL` / `findBarberVportForUserDAL`:**
- Read operations only; `owner_user_id` used as filter
- RLS gap may exist but writes are not in scope for these reads

**Result: PARTIAL [SCANNER_LOW_CONF] — no RLS verification for `vport.resources` table**

---

### 6E. VIEWER CONTEXT FUZZING (§5.5)

**Target:** What happens if null/undefined callerActorId is passed?

**`acceptQrJoin(token, barberVportActorId, null)`:**
- `joinBarbershopQr.controller.js:20` — `if (!callerActorId) throw new Error("acceptQrJoin: callerActorId required")`
- Test file confirms: `joinBarbershopQr.controller.test.js:49-63` — tested for both null and undefined
- `assertActorOwnsVportActorController` is NOT called before the null check fails

**`createBarberVportAndAcceptQr(token, name, { callerActorId: null })`:**
- `joinBarbershopQr.controller.js:49` — `if (!callerActorId) throw new Error(...)`

**`createBarberVportAndAccept(token, name, { callerActorId: null })`:**
- `joinBarbershopAccount.controller.js:117` — `if (!callerActorId) throw new Error(...)`

**`useExistingBarberVportAndAccept(token, vportActorId, { callerActorId: null })`:**
- `joinBarbershopAccount.controller.js:138` — `if (!callerActorId) throw new Error(...)`

**`autoResumeInviteOnboarding` with unauthenticated call:**
- `joinBarbershopAccount.controller.js:79` — `const user = await readCurrentAuthUserDAL?.()` — null DAL injection
- `joinBarbershopAccount.controller.js:80` — `if (!user) throw new Error("Not signed in.")`
- If `readCurrentAuthUserDAL` itself is undefined (optional chaining `?.`), returns `undefined` — triggers "Not signed in."

**FINDING: BW-JOIN-002** — `autoResumeInviteOnboarding` uses optional chaining on `readCurrentAuthUserDAL?.()`. If the dependency injection object is `{}` (missing key), `readCurrentAuthUserDAL` evaluates to `undefined`, the optional chain returns `undefined`, and `user` is `undefined` — which is falsy, so the "Not signed in" guard fires correctly. However, the callerActorId in this function is derived from `bootstrapJoinOnboardingController` response (`actor?.id ?? null`), and if bootstrap returns an actor with no `id`, the null check at line 98 throws. This path is guarded. MEDIUM confidence — behavior is correct but relies on runtime duck-typing, not type-safe contracts.

**Result: BLOCKED (with MEDIUM-confidence structural note) [SOURCE_VERIFIED]**
- joinBarbershopQr.controller.js:20, 49
- joinBarbershopAccount.controller.js:117, 138, 80, 98

---

### 6F. MUTATION REPLAY (§5.6)

**Target:** Can a completed/cancelled join resource token be re-submitted?

**QR path replay:**
- `joinBarbershopQr.controller.js:30-37` — after ownership passes, `fetchJoinResourceByIdDAL(token)` re-fetches resource; checks `meta.status !== "pending_onboarding"` and `member_actor_id` is set — throws if already claimed
- `joinInvite.dal.js:48-51` — DAL UPDATE also guards `.eq("meta->>status", "pending_onboarding").is("member_actor_id", null)` — atomic conditional update; if rows=0 returned, DAL throws "join resource is no longer available"

**Double-submit / race condition:**
- Two simultaneous calls from the same actor: first write sets `member_actor_id`, second write matches no rows (member_actor_id no longer null), DAL throws. This is the ELEK-001 guard.
- The controller-layer resource re-fetch is a TOCTOU window between fetch and UPDATE, but the DAL's atomic conditional UPDATE is the definitive guard.

**Invite path replay (`autoResumeInviteOnboarding` and `createBarberVportAndAccept`):**
- These do NOT include a controller-layer status re-check before calling `acceptJoinResourceDAL`
- They rely solely on the DAL-layer atomic guard: `.eq("meta->>status", "pending_onboarding").is("member_actor_id", null)`
- If the resource was already accepted by another path (e.g., QR flow first), the DAL throws
- **FINDING BW-JOIN-003:** The invite-path controllers (`autoResumeInviteOnboarding`, `createBarberVportAndAccept`, `useExistingBarberVportAndAccept`) do not perform a controller-layer resource state pre-check before calling `acceptJoinResourceDAL`. Only the QR path (`acceptQrJoin`) has the explicit controller-layer guard (ELEK-001). The invite paths rely solely on the DAL atomic UPDATE guard. While this is functionally correct (the DAL guard is atomic and sufficient), the asymmetry means a replay attempt on the invite path produces a DAL-level error with the message "join resource is no longer available" that propagates to the UI without a typed controller-layer gate. The QR path has defense-in-depth; the invite path does not.

**Result: BLOCKED at DAL layer for all paths; QR path has defense-in-depth; invite paths rely on DAL only [SOURCE_VERIFIED]**
- joinBarbershopQr.controller.js:30-37
- joinInvite.dal.js:48-51

---

### 6G. HYDRATION POISONING (§5.7)

**Target:** Does this feature interact with the hydration store? Can actor summaries be poisoned?

**Source Analysis:**
- `useJoinBarbershop.js:41` — `refreshVcActorDirectory` is called via `autoResumeInviteOnboarding` to refresh the identity store after bootstrap
- `autoResumeInviteOnboarding` calls `refreshActorFn` (injected from hook) which is `refreshVcActorDirectory`
- This refreshes from the server; it does not accept client-supplied data for hydration

No client-side hydration injection vector found. The identity refresh is a server read, not a client write to the hydration store.

**Result: BLOCKED [SOURCE_VERIFIED]**
- useJoinBarbershop.js:41
- joinBarbershopAccount.controller.js:93-95 (actor resolved from bootstrapJoinOnboardingController, server-derived)

---

### 6H. URL SURFACE (§5.9)

**Target:** Do any notification linkPaths, share links, or deep links expose raw UUIDs?

**Source Analysis:**
- `joinBarbershopAccount.controller.js:16` — `const emailRedirectTo = ${window.location.origin}/join/barbershop/${token}`
  - The `token` here is the invite token (resource ID from the `resources` table). This is the raw UUID of the resource row.
  - This URL is sent as the email confirmation redirect in Supabase auth signup.
  - The token IS the join resource identifier — it is the mechanism for joining, not a human-readable slug.

**FINDING BW-JOIN-004:** The join invite URL embeds the raw resource UUID as the join token in the path `/join/barbershop/{token}`. This token is the `resources.id` UUID value. Per the platform rule "raw UUIDs must never appear in public-facing URLs" (memory: feedback_no_raw_ids_in_urls.md), this constitutes a policy violation. The URL is constructed in `joinBarbershopAccount.controller.js:16` and embedded in the Supabase auth email redirect. The token also appears in the browser URL bar when the user visits `/join/barbershop/{uuid}`.

Note: the QR join path exposes the same token in the URL (the screen reads `token` from `useParams()` at `JoinBarbershopScreen.jsx:10`).

Severity: MEDIUM (policy violation; token is a one-time-use opaque identifier, not a user identity UUID, but rule applies regardless).

**Result: BYPASSED [SOURCE_VERIFIED]**
- joinBarbershopAccount.controller.js:16
- JoinBarbershopScreen.jsx:10 (useParams token from URL)

---

### 6I. §9 INVARIANT ATTACK MAP

**BEHAVIOR.md Status: PLACEHOLDER**

No §9 invariants are defined. All invariants are UNANCHORED. The following source-inferred invariants are derived from the code and used as attack targets:

**Inferred Invariant 1: A join resource can only ever be claimed once (atomic single-claim)**

- Attack: Concurrent double-submit from two browser tabs with the same token and same actor
- Result: BLOCKED — DAL UPDATE `.is("member_actor_id", null)` is atomic; second update finds member_actor_id already set, matches 0 rows, throws

**Inferred Invariant 2: A join resource cannot be claimed by an actor who does not own the target VPORT**

- Attack: Pass a foreign `barberVportActorId` with valid `callerActorId` (attacker owns their own vport but claims a resource slot for a victim's vport)
- Result: BLOCKED — `assertActorOwnsVportActorController` checks `actor_owners` link between callerActorId and targetActorId

**Inferred Invariant 3: A join resource cannot be claimed by an unauthenticated call**

- Attack: Call `acceptQrJoin(token, actorId, null)`
- Result: BLOCKED — null guard at controller line 20

**Inferred Invariant 4: A join resource that is already in "linked" status cannot be reverted to "pending_onboarding"**

- Attack: Attempt to re-accept a linked resource by replaying the token
- Result: BLOCKED — DAL `.eq("meta->>status", "pending_onboarding")` prevents update of already-linked rows

**Inferred Invariant 5: Only user-kind actors can accept join resources (not VPORT actors)**

- Attack: Pass a VPORT-kind `requestActorId` to any accept path
- Result: BLOCKED — `assertActorOwnsVportActorController` kind check line 28-30

**Inferred Invariant 6: An expired QR token cannot be used to join**

- Attack: Submit `acceptQrJoin` with an expired token
- Result: BLOCKED — `joinBarbershopQr.controller.js:38-40` checks `join_expires_at` before calling DAL

**Inferred Invariant 7 — UNANCHORED/PARTIAL: The invite token (resource UUID) must not be exposed in public URLs**

- Attack: Observe the URL in browser while on join page
- Result: BYPASSED — token is the raw UUID, visible in URL bar — finding BW-JOIN-004

---

## 7. Exploitability Assessment

| Finding | Exploitability | Notes |
|---|---|---|
| BW-JOIN-001 | LOW-MEDIUM | Requires RLS absence + controller error suppression; depends on DB config |
| BW-JOIN-002 | LOW | Structural concern; correct behavior observed at runtime |
| BW-JOIN-003 | LOW | DAL-layer protection is sufficient; invite replay rejected, but no controller pre-check |
| BW-JOIN-004 | LOW | Token is opaque UUID, one-time-use; real attack surface is token harvest + replay, not identity |

No CRITICAL or HIGH severity findings. No confirmed exploit chains that bypass all layers of defense.

---

## 8. Source Verification Summary

| Finding | Verified | Source File | Line(s) |
|---|---|---|---|
| BW-JOIN-001 (PARTIAL) | YES — ownership gap in DAL | joinInvite.dal.js | 35-51 |
| BW-JOIN-002 (PARTIAL) | YES — optional chaining noted | joinBarbershopAccount.controller.js | 79-98 |
| BW-JOIN-003 (MEDIUM) | YES — asymmetric replay guard | joinBarbershopAccount.controller.js | 116-134; joinBarbershopQr.controller.js | 29-44 |
| BW-JOIN-004 (MEDIUM) | YES — raw UUID in URL | joinBarbershopAccount.controller.js | 16; JoinBarbershopScreen.jsx | 10 |

All BLOCKED findings are [SOURCE_VERIFIED] with specific line citations above in §6.

---

## 9. Confidence Summary

| Category | Count | Confidence |
|---|---|---|
| Source-verified BLOCKED | 7 | HIGH |
| Source-verified BYPASSED/PARTIAL findings | 4 | HIGH |
| Scanner LOW-confidence paths | 1 | LOW (PRIMARY TARGET — reviewed) |
| BEHAVIOR.md anchored invariants | 0 | N/A (PLACEHOLDER) |
| Source-inferred invariants tested | 7 | MEDIUM-HIGH |

Overall confidence: MEDIUM-HIGH. All write surfaces read. Primary scanner LOW-confidence path fully traced. BEHAVIOR.md gap noted.

---

## 10. §9 Invariant Attack Map

BEHAVIOR.md is PLACEHOLDER. No anchored §9 invariants exist.

Source-inferred invariants tested: 7 (see §6I above)
Results: 6 BLOCKED, 1 BYPASSED (raw UUID in URL — BW-JOIN-004)

---

## 11. Behavior Contract Attack Summary

| Contract Status | Finding |
|---|---|
| PLACEHOLDER — no §4 Failure Paths | All failure paths inferred from source code |
| PLACEHOLDER — no §9 Must Never Happen | 7 source-inferred invariants tested |
| VEN-JOIN-001 (OPEN) | Pre-auth token validity oracle via unauthenticated resource fetch — not retested by BW (read-only, out of write scope) |
| VEN-JOIN-002 (OPEN) | autoResumeInviteOnboarding creates side-effects before verifying invite resource state — BW confirms: no resource state check before bootstrapJoinOnboardingController; account creation can occur even for a token that will later be rejected at acceptJoinResourceDAL |
| VEN-JOIN-003 (OPEN) | Client-controlled metadata in JWT without server-side length/character validation — confirmed at joinBarbershopAccount.controller.js:18-28; metadata passed directly to signUpForInviteDAL with no sanitization |
| VEN-JOIN-004 (OPEN) | BEHAVIOR.md placeholder — still unresolved |

**VEN-JOIN-002 Adversarial Confirmation:**
`autoResumeInviteOnboarding` path: account bootstrap (profile creation + actor creation) fires at line 89-95 before `acceptJoinResourceDAL` at line 111. If the resource is already claimed at the time the DAL write fires, the user now has a fully bootstrapped account and actor but the join was never completed. This is a confirmed side-effect-before-guard pattern consistent with VEN-JOIN-002. Not a new BW finding (VEN owns this) but BW confirms it adversarially.

---

## 12. THOR Impact

All BW findings are DRAFT on first issuance.

| Finding | Severity | THOR Impact |
|---|---|---|
| BW-JOIN-001 | MEDIUM | Not a release blocker per current severity |
| BW-JOIN-002 | LOW | Not a release blocker |
| BW-JOIN-003 | MEDIUM | Not a release blocker |
| BW-JOIN-004 | MEDIUM | Not a release blocker |

**THOR Release Blocker: NO** — no CRITICAL or HIGH findings from this BW run.

Combined with open VENOM findings (3 MEDIUM, 1 LOW), overall feature THOR status remains: NO BLOCKER.

---

## 13. SPIDER-MAN Test Requirements

The following test cases are MISSING or UNVERIFIED and should be added:

| Test ID | Target | Scenario | Priority |
|---|---|---|---|
| SM-JOIN-001 | createBarberVportAndAccept | Replay: call with already-linked resource token | HIGH |
| SM-JOIN-002 | useExistingBarberVportAndAccept | Replay: call with already-linked resource token | HIGH |
| SM-JOIN-003 | autoResumeInviteOnboarding | Replay: resource already claimed before bootstrapJoinOnboardingController completes | HIGH |
| SM-JOIN-004 | autoResumeInviteOnboarding | Verify account is NOT left in partially-bootstrapped state when acceptJoinResourceDAL rejects | MEDIUM |
| SM-JOIN-005 | createBarberVportAndAccept / useExistingBarberVportAndAccept | VPORT-kind actor as callerActorId — should be rejected at assertActorOwnsVportActorController | HIGH |
| SM-JOIN-006 | signUpForBarbershopInvite | Oversized metadata values (display_name > 1000 chars, desired_username with special chars) | MEDIUM |
| SM-JOIN-007 | acceptJoinResourceDAL | Concurrent double-submit race: verify second UPDATE returns 0 rows and throws | HIGH |
| SM-JOIN-008 | loadQrJoin | Expired token (join_expires_at in past) must return null, not resource | MEDIUM |

Existing test coverage:
- `joinBarbershopQr.controller.test.js` — covers null callerActorId, ownership rejection, ELEK-001 state guard, replay simulation (DAL error propagation), and legitimate owner happy path. Coverage is GOOD for the QR path.
- **Gap:** No tests for invite-path controllers (createBarberVportAndAccept, useExistingBarberVportAndAccept, autoResumeInviteOnboarding).

---

*Output: ZZnotforproduction/APPS/VCSM/features/join/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_join-adversarial-review.md*
