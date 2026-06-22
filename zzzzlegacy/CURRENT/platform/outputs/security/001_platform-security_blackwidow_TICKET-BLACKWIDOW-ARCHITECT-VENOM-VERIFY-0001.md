# BLACKWIDOW Runtime Adversarial Report

**Date:** 2026-06-02
**Ticket:** TICKET-BLACKWIDOW-ARCHITECT-VENOM-VERIFY-0001
**Scope:** VCSM + ENGINE
**Application:** VCSM
**Reviewer:** BLACKWIDOW
**Input Evidence:** ARCHITECT second-pass PASS + VENOM TICKET-VENOM-ARCHITECT-FINDINGS-0001
**Governance Status:** DRAFT

---

## Behavior Contract Attack Summary

All 7 target features were evaluated for behavior contract anchoring. In every case, `BEHAVIOR.md` is absent. All findings produced by this run are therefore classified as UNANCHORED — no behavior contract exists to formally anchor the security boundary claims made during adversarial verification.

| Feature | BEHAVIOR.md | Anchor Status |
|---|---|---|
| identity | MISSING | UNANCHORED |
| profiles | MISSING | UNANCHORED |
| actors | MISSING | UNANCHORED |
| settings | MISSING | UNANCHORED |
| void | MISSING | UNANCHORED |
| engines/portfolio | MISSING | UNANCHORED |
| engines/chat (moderation shadow) | MISSING | UNANCHORED |

Until BEHAVIOR.md files are created for each feature, all security claims in this report rest on source-code evidence alone and must be re-anchored before a formal contract closure can be issued.

---

## Phase 1 — Input Reconciliation

**Evidence read:**
- ARCHITECT second-pass verdict: PARTIAL PASS (29 feature files present, non-empty, correctly routed; engine-consumer-map.md corrected during run for 5 of 8 engines)
- VENOM TICKET-VENOM-ARCHITECT-FINDINGS-0001: 10 findings (001–010) across identity, profiles, actors, booking/cross-feature, void, engines/chat, engines/hydration, engines/media, engines/portfolio
- DB verification document: `2026-05-27_05-42_db_barber-rls-verification.md` — confirms `vc.posts` RLS with forced `relforcerowsecurity = t`
- Migration `20260523010000_backfill_tracked_rls_coverage.sql` — Section 2, lines 110–120: `posts_insert_actor_owner` WITH CHECK present
- Migration `20260518040000` — endorsed but production deployment status UNCONFIRMED
- `engines/booking/src/controller/assertActorOwnsVportActor.controller.js` — engine version, self-shortcut at line 7 before kind check at line 15
- `apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js` — feature version, ELEK-004 applied, kind check unconditional at line 28
- `apps/VCSM/src/state/actors/hydrateActors.js` — 3-line shim re-exporting from `@hydration`; phantom feature-layer files confirmed absent
- `apps/VCSM/src/features/void/VoidScreen.jsx` — placeholder only, no guards
- `apps/VCSM/src/app/routes/protected/app.routes.jsx` line 161 — `/void` registered with no feature flag
- `engines/portfolio/src/config.js` lines 28–33 — `isActorOwner()` throws on unconfigured state
- `apps/VCSM/src/features/portfolio/setup.js` lines 48–53 — no explicit `.eq('user_id', ...)` filter
- `apps/VCSM/src/features/moderation/dal/conversationCover.write.dal.js` + `reports.dal.js` — shadow DAL confirmed, zero `@chat` imports

**Canonical ARCHITECTURE.md:** uppercase confirmed, no stale duplicates detected.
**Stale migration reference:** VENOM-2026-06-02-002 cited migration `20260522010000` which does not exist; correct migration is `20260523010000`. Governance discrepancy flagged and documented in BW-PROFILES-001.

---

## Phase 2 — Adversarial Target Queue

| Priority | Feature / Engine | Target | Source Evidence | Attack Goal |
|---|---|---|---|---|
| P0 | identity | `platform.provision_vcsm_identity` SECURITY DEFINER RPC | VENOM-2026-06-02-001 | Cross-user identity provisioning — poison all 6 platform objects for a victim user |
| P0 | profiles | `vc.posts` INSERT via direct PostgREST, no application ownership gate | VENOM-2026-06-02-002 | Insert system posts attributed to any VPORT actor |
| P0 | engines/portfolio | `isActorOwner()` throws on unconfigured; no explicit `user_id` filter | VENOM-2026-06-02-010 | Portfolio write controllers reachable before engine setup; RLS sole enforcement |
| P1 | identity | Identity adapter bypass — 64 call sites use deprecated direct context import | VENOM-2026-06-02-003 | Actor switch race: stale display context diverges from mutation scope |
| P1 | booking / cross-feature | Engine `assertActorOwnsVportActor` self-shortcut before kind check | VENOM-2026-06-02-005 | VPORT-kind actor bypasses user-only ownership gate via engine version |
| P1 | actors | Three phantom hydration files — governance docs model a non-existent trust boundary | VENOM-2026-06-02-004 | Security audits trace to non-existent feature layer; real `@hydration` boundary unaudited |
| P1 | void | `/void` route registered with no age gate, feature flag, or consent gate | VENOM-2026-06-02-006 | Any authenticated user reaches the void realm with no restriction |
| P1 | engines/chat (moderation) | Shadow DAL issues raw `chat.*` writes bypassing `@chat` engine entirely | VENOM-2026-06-02-007 | Two independent write paths to `inbox_entries`; no event emission, no idempotency |
| P1 | engines/media | 10 feature files import `@media` barrel directly, no adapter choke point | VENOM-2026-06-02-009 | Engine signature change propagates as silent breakage across 7 features |

---

## Phase 3 — Failure Path Modeling

| Target | Attacker | Preconditions | Abuse Path | Expected Secure Outcome | Risk |
|---|---|---|---|---|---|
| `platform.provision_vcsm_identity` | Authenticated Citizen | Valid JWT; knows victim UUID; migration 20260518040000 not deployed | Direct PostgREST RPC: `p_user_id = victim_uuid`, `p_actor_id = any_actor_uuid` | RPC raises EXCEPTION; JS layer throws session mismatch | CRITICAL — JS has no session check; DB guard unconfirmed |
| `vc.posts` INSERT | Authenticated Citizen | Valid JWT; knows victim VPORT actor UUID; `posts_insert_actor_owner` absent | POST `/rest/v1/posts` with `actor_id = victim_actor_id`, skip JS controller chain entirely | DB RLS WITH CHECK rejects insert | CRITICAL (STALE) — DB RLS confirmed present via 20260523010000; DAL has zero ownership check; sole reliance on DB gate |
| `assertActorOwnsVportActor` engine version | VPORT-kind actor | Actor UUID = targetActorId; future caller imports via `@booking` alias | Call engine version with VPORT-kind actor; self-shortcut at line 7 returns `{ok:true}` before kind check | Function throws `Only actor owners can manage this booking resource` | HIGH — LATENT; zero current consumers of engine version; armed for future regression |
| Identity adapter bypass (actor switch) | Multi-actor account holder | Two-actor account; switch initiated; hydration fails or is slow | switchActor writes platform preference (step 3) before identity hydration (step 4); 64 display consumers hold stale Actor A state while mutation scope resolves to Actor B | Atomic commit: preference write gated on hydration success | HIGH — commitIdentity() atomic for same-render; preference-before-hydration window remains across page reload |
| `/void` route | Any authenticated user | Valid JWT; email verified; legal consent accepted | Navigate directly to `/void`; ProtectedRoute passes on auth/email/consent checks only | Age gate or feature flag redirects to `/feed` | MEDIUM — current screen is scaffold only; P0 the moment any void content ships |
| `isActorOwner()` portfolio engine | Any caller | Engine invoked before `setupVcsmPortfolioEngine()` completes | Portfolio write controller fires during startup race; `isActorOwner()` throws unhandled Error | Returns structured `{ok: false}` safe denial | HIGH — throw propagates to UI; no try/catch in any of the 6 write controllers |
| Chat shadow DAL | Any moderation feature user | Access to `undoConversationCover` controller or `upsertInboxEntryFolder` | Raw `supabase.schema('chat').from('inbox_entries')` write with caller-supplied `actorId` | Ownership assertion before write; event emission through `@chat` adapter | MEDIUM — DB RLS is sole gate; no ownership assertion in moderation controller; no event emission |
| `@hydration` engine (actors) | Security auditor / developer | Trusts governance docs for actors hydration boundary | Audits `features/actors/` — finds no hydration surface; misses real `@hydration` engine boundary | Documentation matches source; phantom files removed | HIGH — architectural risk, not runtime exploit |
| `@media` barrel bypass | Developer / future feature | Imports `@media` directly for upload primitives | Engine signature change; 10 files break independently; no adapter enforcement | All uploads routed through `upload.adapter.js` | MEDIUM — no current exploit; engine change propagates as silent breakage |

---

## Phase 4 — Exploitability Classification

| Target | Classification | Severity | Confidence | Required Follow-up |
|---|---|---|---|---|
| `provision_vcsm_identity` identity poisoning | Injection exploit — confirmed JS bypass, DB guard unconfirmed | CRITICAL | HIGH | DB — confirm migration 20260518040000 deployed; add JS session check |
| `vc.posts` actor impersonation | Injection exploit — STALE; DB RLS confirmed present | CRITICAL | CONFIRMED | CARNAGE — confirm 20260523010000 in production; update VENOM-2026-06-02-002 governance status |
| Portfolio `isActorOwner()` throw | Injection exploit — confirmed unsafe failure path | HIGH | CONFIRMED | ELEKTRA — safe-failure patch; explicit `user_id` filter; try/catch in 6 controllers |
| Engine `assertActorOwnsVportActor` kind bypass | Logic-order bypass — LATENT | HIGH | CONFIRMED | IRONMAN — apply ELEK-004 to engine version; migrate settings direct imports to adapter |
| Identity adapter bypass race | Timing-dependent exploit | HIGH | HIGH | SENTRY — migrate 64 call sites; fix preference-before-hydration order in switchActorController |
| Actors hydration governance drift | Architectural risk — phantom files confirmed | HIGH | CONFIRMED | IRONMAN — remove phantom references; create `features/actors/BEHAVIOR.md`; update consumer map |
| `/void` unguarded route | Runtime abuse — confirmed | MEDIUM | CONFIRMED | WOLVERINE — `releaseFlags.voidEnabled` wrap; AgeGate component; void consent action type |
| Chat shadow DAL | Unauthorized write path — confirmed | MEDIUM | CONFIRMED | SENTRY — expose cover/uncover on `@chat` adapter; delete shadow DAL files |
| `@media` barrel bypass | Architectural risk — confirmed | MEDIUM | CONFIRMED | HAWKEYE — create `upload.adapter.js`; migrate 10 bypass files; eslint rule |

---

## Phase 5 — BLACKWIDOW Findings

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-PROFILES-001

**Finding ID:** BW-PROFILES-001
**Ticket:** TICKET-BLACKWIDOW-ARCHITECT-VENOM-VERIFY-0001
**Date:** 2026-06-02
**Feature:** profiles
**Engine:** N/A
**VENOM Reference:** VENOM-2026-06-02-002
**Behavior Contract:** MISSING (UNANCHORED)
**Governance Status:** STALE — VENOM finding references migration `20260522010000` which does not exist; actual delivery was `20260523010000`

**Scenario:** Ownership Bypass — `vc.posts` INSERT via direct PostgREST with attacker-controlled `actor_id`

**Severity:** CRITICAL
**Confidence:** CONFIRMED
**THOR Impact:** PARTIALLY RESOLVED (see below)

**Attack Vector:**
Direct PostgREST REST call: `POST /rest/v1/posts` with valid authenticated JWT and body `{ actor_id: <victim VPORT UUID>, post_type: 'barbershop_hours_update', user_id: <attacker uid>, text: '...', realm_id: '...' }`. Bypasses all application-layer ownership guards by skipping the JS controller chain.

**Attacker Role:** Authenticated Citizen — any user with a valid Supabase session JWT and knowledge of a target VPORT actor UUID.

**Preconditions:**
1. Valid authenticated JWT (any Citizen account)
2. Knowledge of a victim VPORT actor UUID (discoverable from public feed, profile URLs, or actor search)
3. Supabase PostgREST endpoint reachable
4. `posts_insert_actor_owner` RLS policy absent from live DB (precondition is STALE — policy confirmed present)

**Exploit Chain:** Injection exploit — `actor_id` injection via direct DB insert, bypassing controller ownership gate.

**Ownership Bypass Result:**
BYPASSED at the application layer. `insertPost.dal.js` performs zero ownership verification — it is a pure DB adapter accepting any `actor_id`. `posts.adapter.js::createSystemPost` verifies `auth.getUser()` but does not verify the caller owns `actorId` before passing it to `insertPost`. The JS controller gate (`assertActorOwnsVportActorController`) exists only in VPORT publish controllers and is absent from the DAL path. A direct PostgREST caller bypasses every JS layer.

**DB RLS Verification:**
PRESENT — `posts_insert_actor_owner` WITH CHECK confirmed in migration `20260523010000_backfill_tracked_rls_coverage.sql` (Section 2, lines 110–120): `WITH CHECK (EXISTS (SELECT 1 FROM vc.actor_owners ao WHERE ao.actor_id = posts.actor_id AND ao.user_id = auth.uid()))`. Forced RLS (`relforcerowsecurity = t`) confirmed by DB verification doc `2026-05-27_05-42_db_barber-rls-verification.md` line 129. Direct PostgREST INSERT with `actor_id=<victim>` is REJECTED by the DB gate.

**Governance Discrepancy:**
VENOM-2026-06-02-002 references migration `20260522010000` as pending staging. That migration file does not exist in `apps/VCSM/supabase/migrations/`. The INSERT policy was delivered via `20260523010000`. The VENOM finding's deployment-status claim is STALE and must be corrected.

**Defense Gate:**
DB RLS WITH CHECK on `vc.posts` — delivered via `20260523010000_backfill_tracked_rls_coverage.sql`. Sole gate between a direct PostgREST attacker and actor impersonation. Application-layer gate (`assertActorOwnsVportActorController`) present in VPORT publish controllers but bypassable by any caller who skips the JS layer. DAL layer has zero ownership enforcement by design.

**Evidence:**
1. `insertPost.dal.js` (lines 7–17): `supabase.schema('vc').from('posts').insert(row)` — no ownership verification
2. `posts.adapter.js::createSystemPost` (lines 4–29): verifies `auth.getUser()` but passes caller-supplied `actorId` directly
3. VPORT publish controllers (e.g. `publishBarbershopHoursUpdateAsPostController` line 72): JS gate present
4. Migration `20260523010000` lines 110–120: `posts_insert_actor_owner` WITH CHECK confirmed
5. DB verification doc lines 113–142: policy present, RLS forced, attack blocked at DB layer
6. Architecture doc explicitly documents discrepancy between `20260522010000` (never created) and `20260523010000`

**Blast Radius:**
- `vc.posts` — any VPORT actor can have system posts injected as their identity (7 post_type values)
- Public feed — injected posts appear attributed to the victim VPORT
- VPORT profile page — injected system posts appear on victim actor's profile
- Trust and reputation — attacker can publish false hours, exchange rates, portfolio updates
- Notification system — injected posts may trigger downstream notifications to victim's followers
- TICKET-FEED-CARDS-002 — `barbershop_portfolio_update` missing `payload.vportKind` discriminator exploitable by injected posts

**THOR Impact:**
PARTIALLY RESOLVED — DB gate (`posts_insert_actor_owner`) confirmed present and enforced with forced RLS. THOR BLOCKED status on VENOM-2026-06-02-002 should be downgraded to CAUTION pending: (1) CARNAGE confirmation that `20260523010000` is deployed to production; (2) DAL-layer redundant guard added to `createSystemPost`; (3) `is_void` exclusion gap noted as INFO-level pre-existing condition.

**Recommended Fix:**
TWO-LAYER FIX REQUIRED.
- Layer 1 (DAL — `posts.adapter.js::createSystemPost`): Add explicit actor ownership pre-check before calling `insertPost`. Fetch `actor_owners WHERE actor_id = actorId AND user_id = session.user.id` — if no row found, throw `'createSystemPost: caller does not own actorId'`.
- Layer 2 (RLS — already delivered): Confirm migration `20260523010000` applied to production via CARNAGE. Add `is_void` exclusion to `posts_insert_actor_owner`.
- Governance: Update VENOM-2026-06-02-002 to correct migration reference and DB gate status.

**Layer to Fix:** DAL (`posts.adapter.js::createSystemPost`), RLS (verify deployment + `is_void` exclusion)
**Follow-up Command:** CARNAGE
**SPIDER-MAN Tests:**
1. Authenticated as Citizen B, call `insertPost` directly with `actor_id` = Citizen A's VPORT actor UUID where Citizen B has no `actor_owners` row. Expected: RLS violation error.
2. Authenticated as Citizen A (VPORT owner), call `publishBarbershopHoursUpdateAsPostController` with own `actorId`. Expected: post inserted successfully.
3. Call `createSystemPost` with `actorId` belonging to a different user's VPORT. Expected after DAL fix: throws `'caller does not own actorId'`.
4. Normal vibe post creation with `identity.actorId`. Expected: no regression, post created successfully.
5. Confirm `relforcerowsecurity = t` on `vc.posts` in staging before production deploy.

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-IDENTITY-001

**Finding ID:** BW-IDENTITY-001
**Ticket:** TICKET-BLACKWIDOW-ARCHITECT-VENOM-VERIFY-0001
**Date:** 2026-06-02
**Feature:** identity
**Engine:** N/A
**VENOM Reference:** VENOM-2026-06-02-001
**Behavior Contract:** MISSING (UNANCHORED)
**Governance Status:** THOR_BLOCKED — migration `20260518040000` endorsed but production deployment unconfirmed

**Scenario:** Identity Provisioning Bypass — SECURITY DEFINER RPC lacks `auth.uid()` guard

**Severity:** CRITICAL
**Confidence:** HIGH
**THOR Impact:** BLOCKED

**Attack Vector:**
Attacker holds a valid Supabase JWT. Issues direct PostgREST RPC to `platform.provision_vcsm_identity` with `p_user_id = victim_uuid` and `p_actor_id = any_known_actor_uuid`. The JS call stack (`dalProvisionVcsmIdentity` → `ensureVcsmPlatformBootstrap`) validates only non-null presence of `userId` and `actorId` — never compares `userId` against `auth.uid()`. SECURITY DEFINER RPC executes as privileged role and, absent a DB-side assertion, writes all 6 platform objects on behalf of the victim user.

**Attacker Role:** Authenticated Citizen.

**Preconditions:**
1. Valid authenticated JWT
2. Attacker knows or can enumerate a victim user UUID
3. Migration `20260518040000` NOT applied to production
4. PostgREST RPC endpoint for platform schema reachable by authenticated clients

**Exploit Chain:** Injection exploit — cross-user identity provisioning via SECURITY DEFINER RPC.

**Session Check Present in JS:** NO
**DB Guard Verifiable:** NO (migration `20260518040000` deployment unconfirmed)
**Ownership Bypass Result:** PLAUSIBLE_DB_SIDE — JS layer has no session check; DB-side guard status unconfirmed

**Defense Gate:**
ABSENT — `dalProvisionVcsmIdentity` checks only param presence; `ensureVcsmPlatformBootstrap` checks only non-null `userId` and `actorId`; no comparison to `auth.uid()` at any JS layer; DB-side guard unconfirmed.

**Evidence:**
- `provision.rpc.dal.js` lines 29–38: passes `p_user_id` and `p_actor_id` directly with no `auth.uid()` comparison
- `ensureVcsmPlatformBootstrap.controller.js` lines 32–34: guard is `if (!userId || !actorId) return { ok: false }` — presence-only
- `useIdentityResolutionEffect.hook.js` lines 99–103: self-heal path is safe in normal flow (`userId = user.id`), but underlying DAL callable via PostgREST with arbitrary `p_user_id`

**Blast Radius:**
- `platform.user_app_access` — victim row created or overwritten
- `platform.user_app_accounts` — victim account poisoned with attacker-supplied actor link
- `platform.user_app_preferences` — victim active actor preference overwritten
- `platform.user_app_state` — victim app state poisoned
- `platform.user_app_actor_links` — arbitrary actor linked to victim account (`actor_source='vc'`)
- `vc.actors.user_app_account_id` — victim actor row bridge overwritten, severing victim from their identity
- All downstream ownership gates reliant on `actor_owners` membership become unreachable for the victim

**THOR Impact:**
BLOCKED — cannot ship any feature touching provisioning, onboarding, self-heal, or identity bootstrap until migration `20260518040000` is confirmed deployed and the DB-side `auth.uid() = p_user_id` assertion is verified live.

**Recommended Fix:**
1. Confirm deployment of migration `20260518040000` to production; verify DB body of `platform.provision_vcsm_identity` contains `IF auth.uid() != p_user_id THEN RAISE EXCEPTION`.
2. Add JS-layer session check in `dalProvisionVcsmIdentity`: read `supabase.auth.getUser()` and assert `data.user.id === userId` before calling the RPC — hard throw on divergence.
3. Add same assertion in `ensureVcsmPlatformBootstrap`.
4. Add PostgREST rate-limit or row-security check on platform schema RPC endpoint to prevent enumeration-based abuse.

**Layer to Fix:** DB, DAL, Controller
**Follow-up Command:** DB
**SPIDER-MAN Tests:**
- Authenticated user A calls `dalProvisionVcsmIdentity({ userId: userB_uuid, actorId: any_valid_actor_uuid })`. Expected: JS-layer throws `'Caller session does not match userId'`. DB-layer: RPC raises exception if `auth.uid() != p_user_id`. Regression: normal login bootstrap still succeeds when `userId === auth.uid()`.

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-IDENTITY-002

**Finding ID:** BW-IDENTITY-002
**Ticket:** TICKET-BLACKWIDOW-ARCHITECT-VENOM-VERIFY-0001
**Date:** 2026-06-02
**Feature:** identity
**Engine:** N/A
**VENOM Reference:** VENOM-2026-06-02-003
**Behavior Contract:** MISSING (UNANCHORED)
**Governance Status:** OPEN — application-layer refactor, no migration needed

**Scenario:** Identity Adapter Bypass — Actor Switch Race Between Display Context and Mutation Scope

**Severity:** HIGH
**Confidence:** HIGH
**THOR Impact:** CAUTION

**Attack Vector:**
Multi-actor account holder switches from Actor A (user) to Actor B (VPORT) via `switchActor()`. At step 3, `engineSwitchActiveActor` writes the platform preference. At step 4, `loadIdentityForActorId` hydrates the new identity. If hydration fails, `platformWriteSucceeded=true` but the React state is NOT updated — context still holds Actor A. On next page refresh, platform preference resolves to Actor B, loading Actor B's mutation scope. During the interim window, 64 components consuming `useIdentityDisplayDeprecated` display Actor A while mutations read `identity.actorId` from `useIdentity()` as Actor B — stale display with wrong mutation attribution.

**Attacker Role:** Multi-actor account holder (self-induced race, no external attacker needed).

**Preconditions:**
1. Multi-actor account (at least one user-kind and one VPORT-kind actor)
2. Actor switch initiated via `switchActor()`
3. Platform preference write succeeds but identity hydration fails or is slow
4. At least one bypass consumer mounted and reading display fields while mutation is pending
5. OR: page refresh occurs after preference write but before hydration commit

**Exploit Chain:** Timing-dependent exploit.

**Stale Display with Wrong Mutation Possible:** YES
**Adapter Normalizes Actor Switch:** NO

**Ownership Bypass Result:**
PARTIAL — `commitIdentity()` sets both `IdentityContext` and `IdentityDetailsContext` atomically in a single function call, reducing synchronous divergence window. However, platform-preference-write-before-hydration pattern in `switchActorController` (lines 127, 151) creates a durable cross-render divergence when hydration fails. 64 bypass consumers are structurally exposed because they hold a direct reference to `IdentityDetailsContext` rather than going through the adapter.

**Defense Gate:**
PARTIAL — `commitIdentity()` is atomic for same-render updates. `switchVersionRef` monotonic counter blocks stale background resolution from overwriting in-progress switch. `explicitSwitchAbortedRef` prevents background load from overwriting after link-not-found abort. Unguarded vector: platform-preference-write-before-hydration-commit across page reload, and structural coupling of 64 sites to raw context.

**Evidence:**
- `identityContext.jsx` lines 40–61: `commitIdentity()` — both contexts update in same React batch
- `switchActor.controller.js` lines 127 and 151: platform write (step 3) precedes identity hydration (step 4)
- Lines 199–206: `nextIdentity=null` on hydration failure; context NOT updated; preference already written
- `useAccountController.js` lines 4–5: imports both `useIdentity()` (adapter) AND `useIdentityDisplayDeprecated()` (direct bypass) — dual-context consumer confirmed
- `identity.adapter.js` line 6: re-exports `useIdentity` but passes deprecated hooks raw — adapter surface identical to direct context access for display fields

**Blast Radius:**
- Account settings mutations in `useAccountController` — display shows Actor A while `actorId` for ownership gate comes from `useIdentity()` as Actor B
- VPORT settings controllers using `assertActorOwnsVportActorController` — display names and avatars diverge from mutation scope during switch
- Any of 64 bypass consumer components rendering display alongside submit actions — stale display name/avatar in confirmation dialogs
- Post-switch page reload: components locally caching Actor A display state mismatch until remount
- Feed and notification attribution — actions labeled with Actor A while executing under Actor B scope

**THOR Impact:**
CAUTION — does not block current release; must be resolved before multi-actor switching is promoted as first-class or any void/18+ gating relies on actor kind checks.

**Recommended Fix:**
1. Remove `useIdentityDisplayDeprecated` and `useIdentityDetailsDeprecated` from `identity.adapter.js` re-exports.
2. Add `useIdentityDisplay()` hook to `identity.adapter.js` deriving display fields exclusively from `useIdentity().identity`.
3. Migrate all 64 bypass consumers to `useIdentityDisplay()` from the adapter.
4. In `switchActorController`, move `engineSwitchActiveActor` (platform preference write) to AFTER successful hydration — commit preference only when identity can be atomically resolved.

**Layer to Fix:** Controller, Context, Adapter
**Follow-up Command:** SENTRY
**SPIDER-MAN Tests:**
- Multi-actor user switches; mock `loadIdentityForActorId` to throw on first call. Assert: (1) `identityContext` still holds Actor A, (2) platform preference was NOT written, (3) page reload resolves to Actor A. Regression: successful switch correctly updates both contexts atomically and preference persists.

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-SETTINGS-001

**Finding ID:** BW-SETTINGS-001
**Ticket:** TICKET-BLACKWIDOW-ARCHITECT-VENOM-VERIFY-0001
**Date:** 2026-06-02
**Feature:** settings / cross-feature (booking engine)
**Engine:** engines/booking
**VENOM Reference:** VENOM-2026-06-02-005
**Behavior Contract:** MISSING (UNANCHORED)
**Governance Status:** LATENT — engine version unpatched and publicly exported; zero current exploitable consumers

**Scenario:** VPORT Kind Bypass via Engine Version of `assertActorOwnsVportActor`

**Severity:** HIGH
**Confidence:** CONFIRMED
**THOR Impact:** CAUTION

**Attack Vector:**
Attacker controls a VPORT-kind actor whose UUID equals `targetActorId`. They invoke a mutation resolving to the engine version of `assertActorOwnsVportActor` (exported via `@booking` adapter surface at `engines/booking/src/adapters/index.js` line 29). Engine version line 7 evaluates `String(requestActorId) === String(targetActorId)` and returns `{ok:true, mode:'self'}` before line 15 ever checks `requester.kind !== 'user'`. A VPORT-kind actor with matching IDs exits as an approved owner, bypassing the user-only kind gate.

**Attacker Role:** Authenticated VPORT-kind actor.

**Preconditions:**
1. Attacker possesses a VPORT-kind actor whose `actorId` equals the `targetActorId` being protected
2. A caller resolves to the engine version via the `@booking` alias rather than `@/features/booking/`
3. No app code currently imports the engine version — precondition is LATENT

**Exploit Chain:** Logic-order bypass — self-shortcut evaluated before kind guard.

**Engine Self-Shortcut Before Kind Check:** YES (engine version lines 7–15)
**Kind Bypass Possible:** YES (via engine version)
**Settings Resolve Engine Version:** NO (both direct-import settings files resolve to ELEK-004-patched feature version)

**Runtime Abuse Result:**
PARTIAL — Engine version is unpatched and kind bypass path is open, but zero app consumers currently import the engine version. Both `vportBusinessCardSettings.controller.js` and `vportSocialSettings.controller.js` import from `@/features/booking/controller/assertActorOwnsVportActor.controller.js` (patched). Adapter re-exports feature version. Engine version is dormant but armed.

**Defense Gate:**
Feature-layer ELEK-004 patch (kind check unconditional before self-shortcut). Booking adapter re-exports feature version. No current consumer reaches engine version. Engine version NOT protected by ELEK-004.

**Evidence:**
- `engines/booking/src/controller/assertActorOwnsVportActor.controller.js` lines 7–15: self-shortcut at line 7 precedes kind check at line 15
- `apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js` lines 22–36: ELEK-004 applied — kind check unconditional at line 28 before self-shortcut at line 34
- `booking.adapter.js` line 18: re-exports feature version
- `vportBusinessCardSettings.controller.js` line 3 and `vportSocialSettings.controller.js` line 1: both bypass adapter but resolve to `@/features/booking/controller/` (patched)
- `engines/booking/src/adapters/index.js` line 29: exports unpatched engine version — zero app imports confirmed

**Blast Radius:**
- Engine version armed on `@booking` surface — unpatched and exploitable if any future caller imports via `@booking`
- `vportBusinessCardSettings.controller.js` and `vportSocialSettings.controller.js` — adapter-bypassing direct imports (currently resolve to safe version; violate §5.3 boundary)
- All 9 call sites reaching the gate via `booking.adapter.js` are correctly using patched version today

**THOR Impact:**
CAUTION — not immediate blocker given zero live consumers of engine version; engine must be patched before any caller migrates to `@booking` surface.

**Recommended Fix:**
Apply ELEK-004 to the engine version: move kind-check block to execute unconditionally before the self-shortcut in `engines/booking/src/controller/assertActorOwnsVportActor.controller.js`. Mirror the feature version pattern: (1) fetch `requesterActor` via `dalGetActorById`; (2) throw if `kind !== 'user'`; (3) only then evaluate self-shortcut. Additionally, migrate `vportBusinessCardSettings.controller.js` and `vportSocialSettings.controller.js` to import via `booking.adapter.js`.

**Layer to Fix:** Engine Controller (`engines/booking/src/controller/assertActorOwnsVportActor.controller.js`), Settings Feature (adapter bypass in two controllers)
**Follow-up Command:** IRONMAN
**SPIDER-MAN Tests:**
- Construct VPORT-kind actor where `requestActorId === targetActorId`, call engine version directly — assert it throws `'Only actor owners can manage this booking resource.'` not `{ok:true}`. Same inputs to feature version must also throw. Both versions must produce identical denial behavior for VPORT-kind self-match.

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-ACTORS-001

**Finding ID:** BW-ACTORS-001
**Ticket:** TICKET-BLACKWIDOW-ARCHITECT-VENOM-VERIFY-0001
**Date:** 2026-06-02
**Feature:** actors
**Engine:** engines/hydration
**VENOM Reference:** VENOM-2026-06-02-004
**Behavior Contract:** MISSING (UNANCHORED)
**Governance Status:** DRIFT CONFIRMED — three phantom file references; no `BEHAVIOR.md` for actors feature

**Scenario:** Hydration Governance Drift — Phantom Files

**Severity:** HIGH
**Confidence:** CONFIRMED
**THOR Impact:** CAUTION

**Attack Vector:**
Security audits and governance documents model actors hydration as a feature-layer concern at `features/actors/controllers/hydrateActors.controller.js`, `features/actors/dal/getActorSummariesByIds.dal.js`, and `features/actors/model/extractActorIdsForHydration.model.js`. None of these files exist. Real hydration path is `state/actors/hydrateActors.js` — a 3-line shim re-exporting from `@hydration` engine. Any trust-boundary analysis reading governance docs and tracing actors hydration to documented feature paths is modeling a non-existent surface; the real engine trust boundary at `@hydration` is invisible to the documented audit trail.

**Phantom Files Confirmed Absent:** YES
**Shim Path Found:** YES

**Shim Content:**
```
// src/state/actors/hydrateActors.js
// Re-export from hydration engine (canonical source)
export { hydrateActorsFromRows, hydrateActorsByIds } from '@hydration'
```

**Documentation Drift Result:**
ARCHITECTURAL_RISK — Governance docs describe a feature-layer hydration surface that does not exist. Actual call path bypasses `features/actors/` entirely and lands directly in `@hydration` engine via `state/actors/hydrateActors.js`. Six callers using shim indirection operate outside the documented trust boundary. Any ELEK/VENOM analysis trusting the documentation will miss the real engine boundary.

**Defense Gate:**
ABSENT — No `BEHAVIOR.md` for actors feature. Shim provides no access control, no caller validation, and no audit surface. Engine boundary enforcement depends entirely on `@hydration` engine internals not covered by feature-layer governance.

**Evidence:**
- Phantom files confirmed absent: `features/actors/controllers/hydrateActors.controller.js`, `features/actors/dal/getActorSummariesByIds.dal.js`, `features/actors/model/extractActorIdsForHydration.model.js`
- Shim at `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/state/actors/hydrateActors.js` — 3 lines, re-exports from `@hydration` with no interposing logic
- Actors feature source files present: `adapters/actors.adapter.js`, `controllers/searchActors.controller.js`, `dal/searchActors.dal.js`, `model/searchActors.model.js` — hydration entirely absent from feature layer

**Blast Radius:**
- All 6 callers using shim operate outside documented feature boundary with no governance coverage
- Security audits tracing actors hydration via governance docs model a phantom surface — `@hydration` engine boundary goes unaudited
- ARCH-ACTORS-DRIFT-001/002/003 findings in governance docs are live misinformation
- VENOM-2026-06-02-004 trust boundary claim correct — documented boundary does not exist at feature layer
- VENOM-2026-06-02-008 connected — `feed.posts.dal.js` imports `@hydration` at DAL layer, compounding the audit gap

**THOR Impact:**
CAUTION — not a direct runtime exploit; degrades audit reliability for all hydration-related security reviews; must be resolved before any `@hydration` engine change can be safely governed.

**Recommended Fix:**
1. Remove phantom file references from all governance documents.
2. Document the real hydration path: `state/actors/hydrateActors.js` is a shim to `@hydration` engine — add to actors feature documentation and `engine-consumer-map.md`.
3. Create `features/actors/BEHAVIOR.md` anchoring the actors feature contract, documenting hydration delegation to `@hydration` engine, and listing the 6 shim consumers as governed call sites.

**Layer to Fix:** Documentation (remove phantom references; create `features/actors/BEHAVIOR.md`; update engine consumer map)
**Follow-up Command:** IRONMAN
**SPIDER-MAN Tests:**
- Verify `hydrateActorsFromRows` and `hydrateActorsByIds` throw structured denial (not internal error) when called before `configureHydrationEngine()`. Verify all 6 shim consumers pass bounded-size actorId arrays. Confirm no caller in `features/actors/` imports `@hydration` directly — all hydration through shim.

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-VOID-001

**Finding ID:** BW-VOID-001
**Ticket:** TICKET-BLACKWIDOW-ARCHITECT-VENOM-VERIFY-0001
**Date:** 2026-06-02
**Feature:** void
**Engine:** N/A
**VENOM Reference:** VENOM-2026-06-02-006
**Behavior Contract:** MISSING (UNANCHORED)
**Governance Status:** VERIFIED

**Scenario:** Unguarded `/void` Route — Age Consent Bypass

**Severity:** MEDIUM
**Confidence:** CONFIRMED
**THOR Impact:** CAUTION

**Attack Vector:**
Any authenticated user with a verified email and accepted legal consent navigates directly to `/void`. `ProtectedRoute` passes them through because it only checks `auth.uid()` presence, email verification, and legal consent — not age, feature flag, or void-specific consent.

**Route Registered:** YES
**Protected Route Present:** YES (auth only)
**Age Gate Present:** NO
**Feature Flag Present:** NO

**Void Screen Content:**
Placeholder only. Renders black background with white text and a purple dot bullet: "The Architect is currently weaving thresholds... Access will be granted when the veil thins." No logic, no data calls, no guards, no conditional rendering.

**Runtime Abuse Result:**
CONFIRMED — route renders with no additional gate. `VoidScreen.jsx` line 2 returns JSX unconditionally with zero guard logic. `app.routes.jsx` line 161 registers `{ path: '/void', element: <VoidScreen /> }` with no `releaseFlags` wrapper, no `Navigate`-guard, and no `AgeGate` component. Contrast with `/ads/vport/:actorId` (line 155) and `/dev/diagnostics` (line 164) which use `releaseFlags` or `devDiagnosticsEnabled` conditionals. `AgeGate` component does not exist anywhere in the codebase.

**Defense Gate:**
WEAK — `ProtectedRoute` enforces auth, email verification, and legal consent only. Those gates do not constitute a void-specific age or content gate.

**Evidence:**
- `apps/VCSM/src/app/routes/protected/app.routes.jsx:161` — `{ path: '/void', element: <VoidScreen /> }` with no `releaseFlags`, no `Navigate` fallback
- `apps/VCSM/src/features/void/VoidScreen.jsx` — unconditional render, zero guard
- `apps/VCSM/src/app/guards/ProtectedRoute.jsx` — checks user, email verification, and `legalConsent` only
- No `AgeGate` component found anywhere via codebase search

**Blast Radius:**
- Any authenticated user can reach `/void` without age verification or explicit void consent
- When real void content ships, every existing session user has implicit access — no gate to toggle
- No feature flag means `/void` cannot be soft-disabled without a code deployment
- 18+ content liability: absence of `AgeGate` means regulatory exposure the moment any void content is published

**THOR Impact:**
CAUTION — current screen is scaffold only, no live harm; missing gate is a P0 blocker the moment any void content ships; must be resolved before any void feature work proceeds.

**Recommended Fix:**
1. Wrap the `/void` route registration with a `releaseFlags.voidEnabled` check and `Navigate`-to-`/feed` fallback (same pattern as `vportAdsPipeline` at line 155).
2. Create an `AgeGate` component requiring explicit 18+ acknowledgment stored in the user's platform profile.
3. Add a void-specific consent record to the legal consent system so a `VoidRoute` guard can enforce it independently of general platform consent.

**Layer to Fix:** Router, ProtectedRoute guard / new VoidRoute guard, Legal consent system (new void consent action type)
**Follow-up Command:** WOLVERINE
**SPIDER-MAN Tests:**
- Authenticated user with valid session navigates to `/void` — expected: redirect to `/feed` or consent gate. User with void consent but no age confirmation — expected: `AgeGate` renders. `releaseFlags.voidEnabled = false` — expected: `Navigate` to `/feed`. No `void_consent` action in legal consent — expected: `ConsentGateScreen` renders void-specific terms.

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-PORTFOLIO-001

**Finding ID:** BW-PORTFOLIO-001
**Ticket:** TICKET-BLACKWIDOW-ARCHITECT-VENOM-VERIFY-0001
**Date:** 2026-06-02
**Feature:** N/A (engine)
**Engine:** engines/portfolio
**VENOM Reference:** VENOM-2026-06-02-010
**Behavior Contract:** MISSING (UNANCHORED)
**Governance Status:** VERIFIED

**Scenario:** Portfolio `isActorOwner` Throw-on-Unconfigured Auth Bypass

**Severity:** HIGH
**Confidence:** CONFIRMED
**THOR Impact:** BLOCKED

**Attack Vector:**
Two vectors. (A) Invoke any portfolio write controller (createItem, addMedia, deleteItem, updateItem, manageTags, removeMedia) before `setupVcsmPortfolioEngine()` completes — `isActorOwner()` throws an unhandled `Error` instead of returning safe denial; exception propagates to UI caller without structured response. (B) If `actor_owners_read_own` RLS policy is absent (interacts with TICKET-PLATFORM-RLS-001), `setup.js` lambda performs `.eq('actor_id', actorId)` without `.eq('user_id', session.user.id)` — ownership check relies entirely on RLS auto-scoping.

**Throws Instead of Denies:** YES
**User ID Filter Absent:** YES
**RLS Sole Enforcement:** YES

**Runtime Abuse Result:**
PARTIALLY CONFIRMED — Vector A confirmed: `engines/portfolio/src/config.js` lines 28–33 show `isActorOwner()` throws `Error('[PortfolioEngine] isActorOwner not configured.')` when `_config.isActorOwner` is falsy; all 6 write controllers call `isActorOwner()` at lines 34–45 without try/catch before the `ownerCheck` conditional. Vector B confirmed by code: `setup.js` lines 48–53 show `.schema('vc').from('actor_owners').select('actor_id').eq('actor_id', actorId).eq('is_void', false)` — no explicit `.eq('user_id', session.user.id)`. Comment at line 42–44 explicitly states "no explicit user_id filter is required; it is enforced at the DB layer."

**Defense Gate:**
WEAK — for Vector A: zero safe-failure path; exception leaks engine internals to caller. For Vector B: `actor_owners_read_own` RLS policy is sole `user_id` gate; TICKET-PLATFORM-RLS-001 documents live DB policy cleanup as open.

**Evidence:**
- `engines/portfolio/src/config.js:28-33` — `isActorOwner()` throws on unconfigured state
- `createItem.controller.js:34` — `const ownerCheck = await isActorOwner(actorId)` with no try/catch; same pattern in `addMedia.controller.js:45`, `deleteItem.controller.js:37`, `updateItem.controller.js:40`, `manageTags.controller.js:42`, `removeMedia.controller.js:43`
- `apps/VCSM/src/features/portfolio/setup.js:48-53` — no `.eq('user_id', ...)` filter; comment confirms RLS reliance

**Blast Radius:**
- All 6 portfolio write controllers affected by throw-on-unconfigured
- Race condition during app startup: controller fires before setup completes; unhandled exception surfaces as crash rather than permission denial
- If `actor_owners_read_own` RLS absent (TICKET-PLATFORM-RLS-001 interaction): any authenticated user can pass ownership check for any `actor_id`
- Engine internals (`'[PortfolioEngine] isActorOwner not configured.'`) leak to caller — information disclosure

**THOR Impact:**
BLOCKED — unsafe failure mode in a write-path ownership gate; explicit `user_id` filter absent; RLS sole enforcement interacts with open TICKET-PLATFORM-RLS-001; must be patched before portfolio write features ship.

**Recommended Fix:**
1. Change `isActorOwner()` in `config.js` to `return false` (safe denial) instead of throwing when `_config.isActorOwner` is not set.
2. Add `.eq('user_id', session.user.id)` as explicit filter in `setup.js` `isActorOwner` lambda as defense-in-depth.
3. Wrap `isActorOwner()` calls in all 6 write controllers with try/catch mapping exceptions to structured `{ ok: false, reason: 'ownership_check_failed' }`.
4. Block on TICKET-PLATFORM-RLS-001 resolution confirming `actor_owners_read_own` policy present and correct on live DB.

**Layer to Fix:** Engine config (safe-failure), App setup lambda (explicit `user_id` filter), Controller (try/catch in 6 files), RLS (TICKET-PLATFORM-RLS-001)
**Follow-up Command:** ELEKTRA
**SPIDER-MAN Tests:**
- Call `createItem()` before `setupVcsmPortfolioEngine()` — expect structured denial, not thrown exception. Call `createItem()` with `actorId` not owned by session user — expect `{ ok: false }`. Temporarily disable `actor_owners_read_own` RLS in staging — verify explicit `.eq('user_id')` filter blocks cross-user access independently of RLS.

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-MODERATION-001

**Finding ID:** BW-MODERATION-001
**Ticket:** TICKET-BLACKWIDOW-ARCHITECT-VENOM-VERIFY-0001
**Date:** 2026-06-02
**Feature:** moderation (shadow DAL)
**Engine:** engines/chat
**VENOM Reference:** VENOM-2026-06-02-007
**Behavior Contract:** MISSING (UNANCHORED)
**Governance Status:** VERIFIED

**Scenario:** Chat Engine Shadow DAL — Unauthorized Write Path to `chat.inbox_entries`

**Severity:** MEDIUM
**Confidence:** CONFIRMED
**THOR Impact:** CAUTION

**Attack Vector:**
Two independent write paths to `chat.inbox_entries` exist. Path 1: `engines/chat` DAL via `@chat` adapter with idempotency utilities and event emission. Path 2: moderation feature DAL via direct `supabase.schema('chat').from('inbox_entries')` with no outbox event emission and no idempotency key. The moderation feature imports zero symbols from `@chat`. `undoConversationCover` controller mutates `inbox_entries` folder and `last_message_id` fields directly, producing state that the chat engine has no visibility of.

**Shadow DAL Confirmed:** YES
**Chat Engine Bypassed:** YES

**RLS on inbox_entries:**
ASSUMED — no ownership assertion in moderation DAL callers; RLS at DB layer is sole enforcement. The moderation DAL passes `actorId` as a raw `eq()` filter but never asserts `auth.uid()` maps to that `actorId` before issuing the write.

**Cross-Feature Abuse Result:**
CONFIRMED — moderation feature DAL issues raw `chat.*` writes with: (1) no outbox event emission, (2) no idempotency key, (3) caller-supplied `actorId` with no ownership assertion.

**Defense Gate:**
WEAK — DB-layer RLS on `chat.inbox_entries` is sole enforcement gate. Moderation shadow path has no actor-ownership assertion in application code. `reports.dal.js::upsertInboxEntryFolder` at line 114 called mid-insert of moderation report with `reporterActorId` passed as `actorId` — caller-supplied, not session-derived.

**Evidence:**
- `moderation/dal/conversationCover.write.dal.js` — `updateConversationInboxFolderDAL` and `updateConversationInboxLastMessageDAL` call `supabase.schema('chat').from('inbox_entries').update()` with caller-supplied `actorId`
- `moderation/dal/reports.dal.js:42-53` — `upsertInboxEntryFolder` calls `supabase.schema('chat').from('inbox_entries').upsert()` with insert object built entirely from caller-supplied params
- `grep 'from @chat'` in moderation feature returns zero results — `@chat` engine never imported
- `engines/chat/src/events.js` confirms engine has event emitter; shadow path emits nothing

**THOR Impact:**
CAUTION — two write paths to `inbox_entries` with divergent behavior creates fold/unfold state desync risk; if chat engine adds idempotency key enforcement or schema migration, shadow path silently breaks.

**Recommended Fix:**
1. Delete `moderation/dal/conversationCover.write.dal.js` and `moderation/dal/conversationCover.read.dal.js`.
2. Expose `coverConversation()` / `uncoverConversation()` on `@chat` engine adapter surface handling `inbox_entries` mutations, event emission, and idempotency internally.
3. Refactor `undoConversationCover.controller.js` to call `@chat` adapter functions.
4. Add `session.user.id` ownership assertion in the covering/uncovering path at controller layer.
5. Route `upsertInboxEntryFolder` in `reports.dal.js` through the same `@chat` adapter call.

**Layer to Fix:** DAL (delete shadow files), Engine Adapter (new cover/uncover surface), Controller (refactor + ownership assertion)
**Follow-up Command:** SENTRY
**SPIDER-MAN Tests:**
- Cover a conversation via moderation path, then read inbox state via `@chat` engine — expect consistent folder value. Trigger `upsertInboxEntryFolder` with foreign `actorId` not owned by session user — expect DB RLS rejection. After refactor: verify `@chat` domain event emitted on cover/uncover.

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-MEDIA-001

**Finding ID:** BW-MEDIA-001
**Ticket:** TICKET-BLACKWIDOW-ARCHITECT-VENOM-VERIFY-0001
**Date:** 2026-06-02
**Feature:** upload / cross-feature
**Engine:** engines/media
**VENOM Reference:** VENOM-2026-06-02-009
**Behavior Contract:** MISSING (UNANCHORED)
**Governance Status:** VERIFIED

**Scenario:** Media Engine Barrel Bypass — No Adapter Choke Point for Upload Path

**Severity:** MEDIUM
**Confidence:** CONFIRMED
**THOR Impact:** CAUTION

**Attack Vector:**
10 feature files across 7 distinct features import `uploadMediaController` or `useMediaUpload` directly from the `@media` engine barrel. The upload feature has a `posts.adapter.js` that does not re-export upload primitives, so there is no single adapter surface through which all upload calls are routed. Any `@media` engine signature change requires touching all 10 files independently with no compile-time enforcement.

**Adapter Choke Point Exists:** NO

**Bypass Files Confirmed (10):**
1. `apps/VCSM/src/features/upload/api/uploadMedia.js`
2. `apps/VCSM/src/features/settings/profile/hooks/useProfileUploads.js`
3. `apps/VCSM/src/features/vport/controller/submitCreateVport.controller.js`
4. `apps/VCSM/src/features/dashboard/flyerBuilder/controller/flyerEditor.controller.js`
5. `apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js`
6. `apps/VCSM/src/features/wanders/core/controllers/publishWandersFromBuilder.controller.js`
7. `apps/VCSM/src/features/wanders/core/controllers/cards.controller.js`
8. `apps/VCSM/src/features/chat/conversation/hooks/conversation/useChatAttachmentUpload.js`
9. `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/components/portfolio/hooks/usePortfolioMediaUpload.js`
10. `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/hooks/useMenuItemPhotoUpload.js`

**Cross-Feature Abuse Result:**
ARCHITECTURAL_RISK — 10 feature files across 7 features import `@media` engine primitives directly. No single adapter surface routes all upload calls. Any engine change propagates as silent breakage with no compile-time enforcement.

**Defense Gate:**
ABSENT — no upload adapter wraps `@media`. `upload/api/uploadMedia.js` itself imports directly from `@media` and is used as informal intermediary by some callers, but it is not an adapter (no adapter contract, not the only path). Hook-layer files (`useChatAttachmentUpload.js`, `usePortfolioMediaUpload.js`, `useMenuItemPhotoUpload.js`) all import `useMediaUpload` from `@media` directly.

**Evidence:**
- `grep 'from @media'` across all app source returns 10 direct import lines across 7 features
- `apps/VCSM/src/features/upload/adapters/posts.adapter.js` exists but exports post-submission primitives, not upload primitives
- No file named `upload.adapter.js`, `media.adapter.js`, or equivalent choke-point adapter found in upload or media feature directories

**THOR Impact:**
CAUTION — no current runtime exploit; engine signature changes propagate as silent breakage across 7 features with no single enforcement point for upload policy, access auditing, or scope validation.

**Recommended Fix:**
1. Create `apps/VCSM/src/features/upload/adapters/upload.adapter.js` re-exporting `uploadMediaController` and `useMediaUpload` from `@media` as the sole public surface.
2. Migrate all 10 bypass files to import from the upload adapter.
3. Add eslint `no-restricted-imports` rule banning direct `@media` imports outside `features/upload/adapters/` and `features/media/setup.js`.
4. The adapter surface is the correct place to enforce scope validation and add access audit logging.

**Layer to Fix:** Feature Adapter (create `upload.adapter.js`), All 10 bypass files (import migration), ESLint config (enforcement rule)
**Follow-up Command:** HAWKEYE
**SPIDER-MAN Tests:**
- Add required parameter to `uploadMediaController` in `@media` engine — confirm only `upload.adapter.js` breaks (not all 10 callers). Add eslint rule — run lint and confirm all 10 bypass files flagged. Route upload through new adapter — confirm same behavior as direct `@media` call.

---

## Phase 5 — Finding Summary Table

| ID | Severity | Feature / Engine | Governance Status | Result | THOR Impact | Route |
|---|---|---|---|---|---|---|
| BW-PROFILES-001 | CRITICAL | profiles | STALE (VENOM migration ref wrong) | CONFIRMED — DB RLS present; DAL has no redundant guard | PARTIALLY RESOLVED → CAUTION after CARNAGE confirms prod deploy | CARNAGE |
| BW-IDENTITY-001 | CRITICAL | identity | THOR_BLOCKED | HIGH — JS bypass confirmed; DB guard unconfirmed | BLOCKED | DB |
| BW-PORTFOLIO-001 | HIGH | engines/portfolio | VERIFIED | CONFIRMED | BLOCKED | ELEKTRA |
| BW-IDENTITY-002 | HIGH | identity | OPEN | HIGH — atomic commit confirmed; preference-before-hydration window remains | CAUTION | SENTRY |
| BW-SETTINGS-001 | HIGH | settings / engines/booking | LATENT | CONFIRMED — zero live consumers; engine version armed | CAUTION | IRONMAN |
| BW-ACTORS-001 | HIGH | actors / engines/hydration | DRIFT CONFIRMED | CONFIRMED — three phantom files; shim path documented | CAUTION | IRONMAN |
| BW-VOID-001 | MEDIUM | void | VERIFIED | CONFIRMED | CAUTION | WOLVERINE |
| BW-MODERATION-001 | MEDIUM | engines/chat (moderation) | VERIFIED | CONFIRMED | CAUTION | SENTRY |
| BW-MEDIA-001 | MEDIUM | engines/media (upload) | VERIFIED | CONFIRMED | CAUTION | HAWKEYE |

---

## Phase 6 — SPIDER-MAN Test Requirements

| Finding | Test Requirement | Must Never Happen | Owner Command |
|---|---|---|---|
| BW-PROFILES-001 | Authenticated Citizen B attempts INSERT to `vc.posts` with victim VPORT `actor_id` via direct PostgREST | Insert succeeds and post appears attributed to victim actor | CARNAGE (verify prod RLS deploy) |
| BW-PROFILES-001 | Add DAL ownership pre-check; call `createSystemPost` with unowned `actorId` | `insertPost` is called with attacker-controlled `actor_id` | SPIDER-MAN |
| BW-IDENTITY-001 | Call `dalProvisionVcsmIdentity` with `userId` = foreign user UUID while session is user A | RPC executes and provisions platform objects for foreign user | DB |
| BW-IDENTITY-001 | Normal login bootstrap: `userId === auth.uid()` — verify success after fix | Bootstrap silently fails for legitimate users post-patch | SPIDER-MAN |
| BW-IDENTITY-002 | Mock hydration failure during actor switch; assert platform preference NOT written; assert page reload resolves to Actor A | Platform preference commits to Actor B when hydration fails; display and mutation scope diverge on reload | SENTRY |
| BW-SETTINGS-001 | VPORT-kind actor with `requestActorId === targetActorId` calls engine version directly — assert throws | Engine version returns `{ok:true,mode:'self'}` for VPORT-kind self-match | IRONMAN |
| BW-ACTORS-001 | Call `hydrateActorsFromRows` before `configureHydrationEngine()` — assert structured denial, not internal error leak | Internal engine error message leaks to caller | IRONMAN |
| BW-VOID-001 | Authenticated user navigates to `/void` with `releaseFlags.voidEnabled = false` | User reaches VoidScreen without age gate or feature flag | WOLVERINE |
| BW-PORTFOLIO-001 | Call `createItem()` before `setupVcsmPortfolioEngine()` completes — assert structured `{ok:false}` not thrown exception | Unhandled Error propagates to UI with internal engine message | ELEKTRA |
| BW-MODERATION-001 | Trigger `upsertInboxEntryFolder` with foreign `actorId` — assert DB RLS rejects | Write succeeds for unowned `actorId` | SENTRY |
| BW-MEDIA-001 | Add `no-restricted-imports` eslint rule banning direct `@media` imports — assert all 10 bypass files flagged | Any file outside `upload.adapter.js` / `media/setup.js` silently imports `@media` primitives without lint error | HAWKEYE |

---

## Phase 7 — THOR Impact

### BLOCKED Findings (cannot ship)

**BW-IDENTITY-001 — CRITICAL — identity**
- Block: Cannot ship any feature touching provisioning, onboarding, self-heal, or identity bootstrap
- Unblock: Confirm migration `20260518040000` deployed to production; verify `auth.uid() = p_user_id` assertion in DB body of `platform.provision_vcsm_identity`; add JS-layer session check in `dalProvisionVcsmIdentity` and `ensureVcsmPlatformBootstrap`
- Route: DB → then Controller/DAL fix

**BW-PORTFOLIO-001 — HIGH — engines/portfolio**
- Block: Cannot ship portfolio write features (createItem, addMedia, deleteItem, updateItem, manageTags, removeMedia)
- Unblock: Safe-failure in `config.js`; explicit `.eq('user_id')` in `setup.js`; try/catch in 6 write controllers; TICKET-PLATFORM-RLS-001 resolution confirming `actor_owners_read_own` present on live DB
- Route: ELEKTRA → TICKET-PLATFORM-RLS-001

**TICKET-BOOKING-RPC-001 (carried forward)**
- Block: `customer_actor_id` injection + status overpermission confirmed on live DB
- Route: CARNAGE (DB-BLOCKED — awaiting migration)

### CAUTION Findings (must resolve before promotion)

**BW-PROFILES-001 — CRITICAL (PARTIALLY RESOLVED)**
- Action: CARNAGE to confirm `20260523010000` deployed to production; update VENOM-2026-06-02-002 governance status (wrong migration ref; wrong deployment status)
- Residual: DAL has zero ownership enforcement — sole reliance on DB RLS; add application-layer backstop in `createSystemPost`

**BW-IDENTITY-002 — HIGH — identity**
- Action: SENTRY — migrate 64 bypass call sites from `useIdentityDisplayDeprecated` to adapter-normalized `useIdentityDisplay()`; fix preference-before-hydration order in `switchActorController`
- Gate: Must resolve before multi-actor switching promoted as first-class feature or before void/18+ kind-check gating relies on identity state

**BW-SETTINGS-001 — HIGH — booking engine**
- Action: IRONMAN — apply ELEK-004 to engine version of `assertActorOwnsVportActor`; migrate `vportBusinessCardSettings.controller.js` and `vportSocialSettings.controller.js` to import via `booking.adapter.js`
- Gate: Must resolve before any caller migrates to `@booking` surface

**BW-ACTORS-001 — HIGH — actors hydration**
- Action: IRONMAN — remove three phantom file references from governance docs; create `features/actors/BEHAVIOR.md`; update `engine-consumer-map.md` with shim consumer entry
- Gate: Must resolve before any `@hydration` engine change can be safely governed

**BW-VOID-001 — MEDIUM — void**
- Action: WOLVERINE — `releaseFlags.voidEnabled` route wrap; `AgeGate` component; void consent action type
- Gate: P0 blocker the moment any void content ships; must precede all void feature work

**BW-MODERATION-001 — MEDIUM — engines/chat**
- Action: SENTRY — expose `coverConversation()` / `uncoverConversation()` on `@chat` adapter; delete shadow DAL files; refactor `undoConversationCover` controller; ownership assertion at controller layer

**BW-MEDIA-001 — MEDIUM — engines/media**
- Action: HAWKEYE — create `upload.adapter.js`; migrate 10 bypass files; add eslint enforcement rule

### DB/CARNAGE Routes
- BW-IDENTITY-001: migration `20260518040000` production deployment confirmation
- BW-PROFILES-001: migration `20260523010000` production deployment confirmation; VENOM-2026-06-02-002 governance update
- TICKET-BOOKING-RPC-001 (carried): CARNAGE migration required

### SENTRY Routes
- BW-IDENTITY-002: 64 bypass call site migration + adapter normalization
- BW-MODERATION-001: shadow DAL elimination + `@chat` adapter surface expansion

### IRONMAN Routes
- BW-SETTINGS-001: engine version ELEK-004 patch + settings adapter bypass fix
- BW-ACTORS-001: phantom file documentation removal + `BEHAVIOR.md` creation + consumer map update

### VENOM Follow-ups
- VENOM-2026-06-02-002: update migration reference from `20260522010000` to `20260523010000`; update DB gate status from ABSENT to PRESENT; downgrade THOR status from BLOCKED to CAUTION

### SPIDER-MAN Tests (see Phase 6)
Total: 11 test requirements across 9 findings

---

## Phase 8 — Governance Write 2 Status

| Feature | SECURITY.md Updated | BW Section Written | VENOM Preserved | ELEKTRA Preserved |
|---|---|---|---|---|
| identity | YES | YES (BW-IDENTITY-001, BW-IDENTITY-002) | YES | YES |
| profiles | YES | YES (BW-PROFILES-001) | YES | YES |
| actors | YES | YES (BW-ACTORS-001) | YES | N/A |
| settings | YES | YES (BW-SETTINGS-001) | YES | YES |
| void | YES | YES (BW-VOID-001) | YES | N/A |

**BEHAVIOR.md Status (all features):** MISSING across all 7 target features. All BW findings are therefore UNANCHORED. Creation of `BEHAVIOR.md` for each feature is a prerequisite for formal contract closure on any finding in this report.

---

## Phase 9 — Output Confirmation

**Inputs read:**
- ARCHITECT second-pass verdict (PARTIAL PASS, 29 files verified, engine-consumer-map corrected)
- VENOM TICKET-VENOM-ARCHITECT-FINDINGS-0001 (10 findings: VENOM-2026-06-02-001 through 010)
- DB verification document `2026-05-27_05-42_db_barber-rls-verification.md`
- Migration `20260523010000_backfill_tracked_rls_coverage.sql` (Section 2 lines 110–120)
- Source files: `provision.rpc.dal.js`, `ensureVcsmPlatformBootstrap.controller.js`, `identityContext.jsx`, `switchActor.controller.js`, `identity.adapter.js`, `app.routes.jsx`, `VoidScreen.jsx`, `ProtectedRoute.jsx`, both `assertActorOwnsVportActor.controller.js` versions, `state/actors/hydrateActors.js`, `engines/portfolio/src/config.js`, `features/portfolio/setup.js`, `moderation/dal/conversationCover.write.dal.js`, `moderation/dal/reports.dal.js`
- Engine consumer map (corrected during ARCHITECT second pass)

**Targets reviewed:** 7 features + 3 engines = 10
**Findings created:** 9
**Findings rejected:** 0

**P0 THOR Blockers:**
1. BW-IDENTITY-001 — `provision_vcsm_identity` SECURITY DEFINER lacks `auth.uid()` guard (CRITICAL)
2. BW-PORTFOLIO-001 — `isActorOwner()` throws on unconfigured; no explicit `user_id` filter; RLS sole enforcement (HIGH)
3. TICKET-BOOKING-RPC-001 (carried forward) — `customer_actor_id` injection + status overpermission (P0 DB-BLOCKED)

**CAUTION Items:**
1. BW-PROFILES-001 — PARTIALLY RESOLVED; governance stale; DAL has no redundant guard
2. BW-IDENTITY-002 — preference-before-hydration actor switch race; 64 bypass call sites
3. BW-SETTINGS-001 — engine `assertActorOwnsVportActor` unpatched; settings adapter bypass
4. BW-ACTORS-001 — three phantom hydration files; `@hydration` boundary undocumented
5. BW-VOID-001 — `/void` route unguarded; no feature flag; no AgeGate
6. BW-MODERATION-001 — chat shadow DAL; two independent write paths to `inbox_entries`
7. BW-MEDIA-001 — `@media` barrel bypass across 10 files / 7 features

**SECURITY.md files updated:** 5 (identity, profiles, actors, settings, void)
**Source code modified:** NO
**Migrations modified:** NO
**DB schema modified:** NO

**Remaining Gaps:**
- `BEHAVIOR.md` MISSING for all 7 target features — all 9 findings are UNANCHORED
- Migration `20260518040000` production deployment status UNCONFIRMED (blocks BW-IDENTITY-001 resolution)
- VENOM-2026-06-02-002 governance status STALE (wrong migration reference, wrong deployment status)
- `upload.adapter.js` does not exist (BW-MEDIA-001 — no adapter choke point for 10 bypass consumers)
- `AgeGate` component does not exist anywhere in the codebase (BW-VOID-001)
- Engine `assertActorOwnsVportActor` (engine version) not patched with ELEK-004 (BW-SETTINGS-001)
- `features/actors/BEHAVIOR.md` does not exist; phantom file references still live in governance docs (BW-ACTORS-001)
- `@chat` engine has no `coverConversation` / `uncoverConversation` adapter surface (BW-MODERATION-001)

---

## Final Verdict

**BLACKWIDOW_ARCHITECT_VENOM_ADVERSARIAL_VERIFICATION_COMPLETE**

9 adversarial findings produced across 10 targets (7 features + 3 engines). 2 CRITICAL findings identified. 3 THOR blockers active (BW-IDENTITY-001, BW-PORTFOLIO-001, TICKET-BOOKING-RPC-001 carried). All findings are UNANCHORED pending creation of `BEHAVIOR.md` files for all 7 target features. No source code, migrations, or DB schema were modified during this run. All verification was READ-ONLY throughout.

---

*BLACKWIDOW run: 2026-06-02 | Ticket: TICKET-BLACKWIDOW-ARCHITECT-VENOM-VERIFY-0001*
*Scope: VCSM + ENGINE | Source code: READ-ONLY | Non-destructive throughout*
