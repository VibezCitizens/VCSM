# VENOM SECURITY REPORT
======================
Scope: VCSM — legal · media · moderation · monitoring · notifications
Date: 2026-06-07T14:10:00
Command: VENOM (Blue Team — Security Sheriff)
Ticket: ARCH-MULTI-MODULE-001 (batch 16–20)
Application Scope: VCSM

---

## VENOM ARCHITECT OUTPUT CHECK
==================================
ARCHITECT Output: ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ARCHITECT/architect-security-surface.json
Generated At: 2026-06-07T08:30:00.000Z
Age: ~6h
Freshness: FRESH (3-day downstream window)
Scope: ALL
Status: PASS

Security Surface Counts (from ARCHITECT output):
Write surfaces: 487 (24 in scope for these 5 features)
RPC surfaces: 71 (6 in scope)
Security paths: 610 (30 in scope)
Evidence bundles consumed: 5 (legal, media, moderation, monitoring, notifications)

---

## Summary

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 3 |
| MEDIUM | 4 |
| LOW | 1 |
| DB AUDIT NOTES | 5 |

**VENOM Recommendation: CAUTION**

Three HIGH findings — two DB-layer RLS gaps (blocking on DB phase) and one
app-layer ownership gap (markSeen). No CRITICAL findings. Requires BLACKWIDOW
adversarial pass and ELEKTRA source-to-sink verification before THOR.

---

## VENOM-001 [SOURCE_VERIFIED] — HIGH — notifications/markSeen ownership gap

**VENOM SECURITY FINDING**
- Location: `apps/VCSM/src/features/notifications/runtime/index.js` line 271–275
- Application Scope: VCSM
- Current behavior: `export async function markSeen({ recipientIds })` calls `markNotificationRecipientsSeenDAL(recipientIds, now)` with no ownership check. Any external caller can pass arbitrary `recipientIds` to mark another actor's notifications as seen.
- Risk: Authenticated actor A can mark actor B's notifications as seen using known or guessed recipient UUIDs, clearing B's unread badge without B's consent.
- Severity: HIGH
- Why it matters: Notification inbox state is personal. Marking another actor's notifications as seen is an unauthorized write to their state, violates actor ownership, and can mask important notifications (bookings, alerts, follow requests).

Exploitability: HIGH
Attack Preconditions:
- Authenticated Citizen account required
- Target notification.recipients.id UUIDs required (obtainable if exposed elsewhere)
- No ownership verification on the markSeen path

Blast Radius:
- Single actor (targeted) or Multi-actor (batch)

Trust Boundary: Authenticated Citizen
Boundary Violated: Authenticated Citizen → other Citizen's notification inbox

RLS Dependency: UNVERIFIED — notification.inbox_items RLS status not confirmed in db-policy-map

Platform Surface: PWA · Shared Engine (notifications)

Identity Leak Type: None (writes, not reads)

Cache Trust Type: None

Contract Violated: Actor Ownership Contract

- Recommended mitigation: Add ownership check to `markSeen` — pass `actorId` and verify `recipientIds ⊆ notification.recipients WHERE recipient_actor_id = actorId` before calling the DAL. Model after `markRead`/`dismiss`/`archive` which already call `verifyRecipientOwnership`. Alternatively restrict `markSeen` to internal-only (unexport) and require all external callers to use `markRead`.
- Rationale: Three parallel functions (markRead, dismiss, archive) correctly call `verifyRecipientOwnership`. `markSeen` is the odd one out — the pattern exists, it was just not applied here.
- Follow-up command: ELEKTRA (full source-to-sink trace of markSeen call chain), BLACKWIDOW (bypass and chained exploit analysis)
- CISSP Domain:
  - Primary: Access Control (authorization enforcement)
  - Secondary: Software Development Security (incomplete authorization pattern)

---

## VENOM-002 [SOURCE_VERIFIED] — HIGH — DB AUDIT: platform.user_consents RLS OFF

**VENOM SECURITY FINDING**
- Location: `supabase/migrations/20260510030000_user_consents_immutability_and_grant.sql`; confirmed by db-policy-map.json (`rlsEnabled: false` on `platform.user_consents`)
- Application Scope: VCSM
- Current behavior: RLS is NOT enabled on `platform.user_consents`. The migration creates RESTRICTIVE UPDATE/DELETE policies but omits `ALTER TABLE platform.user_consents ENABLE ROW LEVEL SECURITY`. PostgreSQL does not evaluate any policies (permissive or restrictive) when RLS is disabled. Any authenticated user can INSERT a consent record for any arbitrary `user_id`.
- Risk: Actor A can call `dalRecordLegalAcceptance` with any `userId` value and record a fake legal consent acceptance on behalf of any user — bypassing the legal gate for that user.
- Severity: HIGH

Exploitability: HIGH
Attack Preconditions:
- Authenticated Citizen account required
- Target user_id UUID required (auth.users.id — potentially obtainable via profile queries)
- The `dalRecordLegalAcceptance` DAL inserts user_id directly without RLS enforcement

Blast Radius:
- Multi-actor — any authenticated user can spoof consent for any user
- Legal/compliance impact — fraudulent consent records undermine audit trail integrity

Trust Boundary: Authenticated Citizen
Boundary Violated: Authenticated Citizen → any user's consent record

RLS Dependency: BYPASSED — policies defined but RLS not enabled; policies are inert

Platform Surface: PWA · Supabase Table/View (platform.user_consents)

Identity Leak Type: None (writes)

Cache Trust Type: Identity-sensitive (consentCache keyed to userId:appId)

Contract Violated: Actor Ownership Contract · Legal/Compliance integrity

DB AUDIT NOTE:
- DB object: platform.user_consents
- Risk: RLS OFF — INSERT allowed for any authenticated user for any user_id
- Why deferred: DB phase only — requires migration to ENABLE ROW LEVEL SECURITY and add INSERT policy
- Suggested SQL: `ALTER TABLE platform.user_consents ENABLE ROW LEVEL SECURITY; CREATE POLICY user_consents_insert_own ON platform.user_consents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())`

- Recommended mitigation: Enable RLS on `platform.user_consents`. Add INSERT policy enforcing `user_id = auth.uid()`. Review whether the existing RESTRICTIVE policies also need a companion SELECT policy.
- Rationale: The migration's intent was immutability (deny UPDATE/DELETE). It achieved that goal for those operations but neglected to enable RLS entirely, leaving INSERT unprotected.
- Follow-up command: DB (migration), Carnage (policy review)
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Legal/Regulatory Compliance (consent record integrity)

---

## VENOM-003 [SOURCE_VERIFIED] — HIGH — DB AUDIT: vc.posts RLS OFF

**VENOM SECURITY FINDING**
- Location: `apps/VCSM/src/features/moderation/dal/reports.dal.js` `hidePostRow` function; db-policy-map.json confirms `rlsEnabled: false` on `vc.posts` despite 8 policies defined
- Application Scope: VCSM
- Current behavior: `hidePostRow` updates `vc.posts` (`is_hidden`, `hidden_at`, `hidden_by_actor_id`) with only `.eq('id', postId)` in the WHERE clause. RLS is OFF on `vc.posts`. The sole enforcement is `assertModerationAccessController` at the app layer, which resolves from `auth.uid()` — not from the passed `moderatorActorId`.
- Risk: (1) Since RLS is OFF, any direct API call bypassing the app layer can UPDATE vc.posts without ownershipcheck. (2) The moderator actorId used in `hidden_by_actor_id` is the passed-in parameter, not the session-verified actor — creating audit trail forgery risk if actorId != session actor.
- Severity: HIGH

Exploitability: MEDIUM (requires moderator role at app layer; DB direct access bypasses even that)
Attack Preconditions:
- Direct Supabase API access (bypasses app layer entirely)
- OR: Moderator-role actor passing a different actorId to forge attribution

Blast Radius:
- Feed-wide — content can be hidden or attributed to wrong actor
- Admin/moderation — audit trail integrity undermined

Trust Boundary: Moderator
Boundary Violated: DB direct access bypasses moderator role check

RLS Dependency: BYPASSED — 8 policies defined but RLS not enabled; policies inert

Platform Surface: PWA · Admin/Moderation · Supabase Table/View (vc.posts)

Identity Leak Type: None

Contract Violated: Actor Ownership Contract · Moderation state integrity

DB AUDIT NOTE:
- DB object: vc.posts
- Risk: RLS OFF — direct Supabase API calls can UPDATE posts without moderator check
- Why deferred: DB phase — requires migration to ENABLE ROW LEVEL SECURITY + review all 8 existing policies
- Suggested SQL: Review why RLS was not enabled when policies were created. `ALTER TABLE vc.posts ENABLE ROW LEVEL SECURITY;`

- Recommended mitigation: Enable RLS on `vc.posts`. Review the 8 existing policies for correctness before enabling. Add code-layer session binding: pass `auth.uid()` directly in the DB call or add a `WHERE owner_actor_id = auth.uid()` constraint to moderator writes.
- Rationale: Without RLS, the DB is a single-layer system relying entirely on app-layer enforcement. Any direct API access circumvents all moderation controls.
- Follow-up command: DB, Carnage
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Security Architecture (defense-in-depth failure)

---

## VENOM-004 [SOURCE_VERIFIED] — MEDIUM — moderation/undoConversationCover no app-layer ownership

**VENOM SECURITY FINDING**
- Location: `apps/VCSM/src/features/moderation/controllers/undoConversationCover.controller.js` line 8–38
- Application Scope: VCSM
- Current behavior: `undoConversationCover({ actorId, conversationId })` accepts actorId from the caller without session verification. It calls `dalDeleteConversationHideAction`, `updateConversationInboxFolderDAL`, and `updateConversationInboxLastMessageDAL` using the passed actorId with no ownership check.
- Risk: If the hook passes an attacker-controlled actorId (e.g., via prop injection or state confusion), the controller will apply conversation folder changes to any actorId's inbox without verification. The only defense is DB RLS on chat.inbox_entries (`chat_inbox_update_own` policy — VERIFIED as ON).
- Severity: MEDIUM (DB RLS provides defense-in-depth; risk reduced but app layer is trusting caller)

Exploitability: MEDIUM
Attack Preconditions:
- Authenticated account required
- Ability to pass arbitrary actorId into the hook (e.g., prop injection on shared component)
- DB RLS would still block cross-actor write; this is about app-layer trust, not full exploit

Blast Radius:
- Single actor (targeted inbox)

Trust Boundary: Authenticated Citizen
Boundary Violated: Authenticated Citizen → other Citizen's chat inbox (blocked by DB RLS)

RLS Dependency: REQUIRED — chat.inbox_entries RLS is VERIFIED ON; currently the only enforcement

Platform Surface: PWA · Supabase Table/View (chat.inbox_entries)

Identity Leak Type: None

Cache Trust Type: None

Contract Violated: Actor Ownership Contract

ACTOR OWNERSHIP WARNING
Location: `apps/VCSM/src/features/moderation/controllers/undoConversationCover.controller.js`
Caller actor: passed-in `actorId` (not verified against session)
Target actor: same actorId used in all DB writes
Ownership verification: ABSENT at app layer; PRESENT at DB layer (RLS)
Risk: App-layer trust gap — relies entirely on DB RLS
Recommended mitigation: Add `const sessionActorId = getSessionActorId(); if (actorId !== sessionActorId) return { ok: false }` or derive actorId from session at the hook layer

- Recommended mitigation: Derive `actorId` from session identity at the hook layer (via `useIdentity()`) rather than accepting it as a prop. The hook `useConversationCover` already receives actorId from a parent — verify that parent always uses session identity.
- Rationale: Layered defense requires app-layer ownership check independent of DB RLS. DB RLS is a last resort, not the primary authorization mechanism.
- Follow-up command: BLACKWIDOW (bypass via prop injection path)
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security

---

## VENOM-005 [SOURCE_VERIFIED] — MEDIUM — moderation/moderatorActorId audit trail mismatch

**VENOM SECURITY FINDING**
- Location: `apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js` line 19; `apps/VCSM/src/features/moderation/controllers/moderationActions.controller.js` line 28, 129
- Application Scope: VCSM
- Current behavior: `isModerationAuthorizedDAL(actorId)` ignores `actorId` parameter — authorization resolves exclusively from `auth.uid()` server-side. But `hideReportedObjectController` and `dismissReportController` pass `moderatorActorId` (caller-provided) to subsequent DAL writes (`hidden_by_actor_id`, `actor_id` in moderation.actions). If the caller passes a different actorId than their session actor, authorization succeeds (via auth.uid()) but attribution is wrong (uses passed actorId).
- Risk: A moderator with two actor identities (or a moderator impersonating another) could authenticate as actor X but record moderation actions attributed to actor Y. Audit trail is forged without triggering an auth failure.
- Severity: MEDIUM

Exploitability: MEDIUM
Attack Preconditions:
- Authenticated Moderator role required
- Knowledge of another actorId to forge attribution

Blast Radius:
- Admin/moderation — audit trail integrity for all moderation actions

Trust Boundary: Moderator
Boundary Violated: Moderator attribution forgery in audit trail

RLS Dependency: ASSUMED — moderation.actions RLS ON (actions_insert_own_actor policy); but does this enforce actor_id = auth.uid() on INSERT?

Platform Surface: Admin/Moderation · Supabase Table/View

Identity Leak Type: None (write, not read)

Contract Violated: Actor Ownership Contract · Moderation audit trail integrity

IDENTITY SURFACE WARNING
Location: `apps/VCSM/src/features/moderation/controllers/moderationActions.controller.js`
Current identity surface: moderatorActorId (caller-provided parameter)
Expected identity surface: session actor derived from auth.uid() or verified against auth.uid() via actor_owners
Risk: Audit trail attribution can be forged by passing a different actorId
Suggested correction: After `assertModerationAccessController` passes, resolve the verified session actorId and use it for all subsequent writes, discarding the caller-supplied value if they differ

- Recommended mitigation: After `assertModerationAccessController(moderatorActorId)` passes, verify `moderatorActorId` matches the session user's actor via `actor_owners`. Or: resolve the session actor ID directly from `supabase.auth.getUser()` and use that for write attribution, ignoring the passed parameter.
- Rationale: The separation between "auth check" (from auth.uid()) and "write attribution" (from caller param) is a design mismatch that creates an audit forgery path.
- Follow-up command: DB (confirm moderation.actions INSERT policy enforces actor_id = auth.uid())
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Audit and Accountability

---

## VENOM-006 [SOURCE_VERIFIED] — MEDIUM — monitoring/captureMonitoringError Sentry context unsanitized

**VENOM SECURITY FINDING**
- Location: `apps/VCSM/src/services/monitoring/monitoring.js` line 52–55
- Application Scope: VCSM
- Current behavior: `captureMonitoringError(error, context)` calls `Sentry.captureException(error, { extra: context })` with the raw context object. No forbidden-key stripping is applied (contrast with `vcsmMonitoring.js` which applies a robust `_stripForbidden` + `_allowlistContext` sanitization).
- Risk: Any caller that passes actor IDs, user IDs, tokens, email, or other PII in the `context` object will send that data to Sentry unfiltered. Sentry stores `extra` data in the clear.
- Severity: MEDIUM

Exploitability: LOW (requires a calller to inadvertently pass sensitive keys — no attacker control)
Blast Radius: Unknown — depends on caller patterns; worst case: actor IDs and session data in Sentry

Trust Boundary: System Service → External (Sentry)
Boundary Violated: PII/ID leakage to external monitoring system

RLS Dependency: NONE

Platform Surface: PWA · Unknown (Sentry external)

Identity Leak Type: Actor correlation · Internal UUID exposure (if callers pass raw IDs)

Contract Violated: Privacy/data minimization contract

DEBUG LEAKAGE WARNING
Location: `apps/VCSM/src/services/monitoring/monitoring.js` line 54
Current behavior: Sentry extra = raw context object
Leak risk: PII, actor IDs, session data if callers pass them
Severity: MEDIUM
Recommended mitigation: Apply same `_stripForbidden` sanitization from vcsmMonitoring.js before passing to Sentry extra

- Recommended mitigation: Import and apply `_stripForbidden` from `vcsmMonitoring.js` (or extract to a shared utility) in `captureMonitoringError` before passing context to Sentry. Alternatively, use `vcsmMonitoring.captureVcsmError` exclusively and deprecate `captureMonitoringError` for calls that may include identity context.
- Rationale: Dual monitoring systems with inconsistent sanitization guarantees creates a leakage gap. The `vcsmMonitoring.js` sanitization is well-designed — it should be the standard for all monitoring paths.
- Follow-up command: ELEKTRA (audit all callers of captureMonitoringError to assess actual leakage surface)
- CISSP Domain:
  - Primary: Information Security Governance (data handling policy)
  - Secondary: Privacy (PII/identity data minimization)

---

## VENOM-007 [SOURCE_VERIFIED] — MEDIUM — media/adapter exposes controllers directly

**VENOM SECURITY FINDING**
- Location: `apps/VCSM/src/features/media/adapters/media.adapter.js` lines 1–3
- Application Scope: VCSM
- Current behavior: `media.adapter.js` exports `createMediaAssetController` and `softDeleteMediaAssetController` — raw controller functions. The adapter contract requires adapters to expose only hooks, components, and view screens — never DAL functions, models, or controllers.
- Risk: External feature consumers calling the controller directly bypass the adapter pattern's intent. If a caller ever passes an attacker-controlled `ownerActorId` to `createMediaAssetController`, there is no session-verification check in the controller itself. The current caller (useProfileUploads) is safe, but the exported API surface allows unsafe callers in the future.
- Severity: MEDIUM

Exploitability: LOW (current callers are correct; risk is future misuse)
Blast Radius: Single actor or Multi-actor (depends on caller)

Trust Boundary: Authenticated Citizen
Boundary Violated: Adapter boundary — controllers leaked through adapter

RLS Dependency: ASSUMED — platform.media_assets INSERT RLS present; relies on DB enforcement for actor ownership

Platform Surface: PWA · Media/Storage

Identity Leak Type: None

Contract Violated: Adapter Boundary Contract (VCSM architecture)

- Recommended mitigation: Create a `useMediaAsset` hook (or similar) that wraps `createMediaAssetController` with session-bound identity, and export the hook from the adapter instead of the raw controller. This enforces session binding at the adapter boundary.
- Rationale: Adapter boundary violation today is an architecture risk that grows into a security risk when more callers are added. The safe call pattern is accidental, not structural.
- Follow-up command: Wolverine (refactor task), Carnage (architecture review)
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Architecture

---

## VENOM-008 [SOURCE_VERIFIED] — LOW — media/media_assets {public} UPDATE policy (DB audit deferred)

**VENOM SECURITY FINDING**
- Location: `apps/VCSM/src/features/media/dal/mediaAssets.softDelete.dal.js` line 28–31 (comment)
- Application Scope: VCSM
- Current behavior: DAL comment confirms `media_assets_vc_owner_update` ({public} role, unrestricted column UPDATE) coexists with the actor-ownership soft-delete policy. Phase 6 cleanup not applied.
- Risk: The {public} role policy grants unauthenticated users (or any role) unrestricted UPDATE access to `platform.media_assets`. This effectively negates the actor-ownership soft-delete policy for all UPDATE operations — not just soft-delete. An unauthenticated attacker could potentially UPDATE arbitrary columns on any media_asset row.
- Severity: LOW (noted and deferred by design; likely not exposed publicly given Supabase anon key policy; but technically an unconfined UPDATE grant)

Exploitability: MEDIUM (if anon key is used; LOW if only authenticated service role reaches this)
Blast Radius: Multi-actor — all media assets

Trust Boundary: Public Visitor (if anon key allows)
Boundary Violated: Media Access Contract

RLS Dependency: BYPASSED — actor-ownership UPDATE policy coexists with {public} unrestricted policy

Platform Surface: Media/Storage · Supabase Table/View

Identity Leak Type: None

DB AUDIT NOTE:
- DB object: platform.media_assets (media_assets_vc_owner_update policy)
- Risk: {public} role unrestricted column UPDATE coexists with actor-ownership policy
- Why deferred: Phase 6 cleanup migration pending per DAL comment
- Suggested SQL: `DROP POLICY IF EXISTS media_assets_vc_owner_update ON platform.media_assets; REVOKE UPDATE ON platform.media_assets FROM public;`

Contract Violated: Media Access Contract

- Recommended mitigation: Apply Phase 6 cleanup migration: drop `media_assets_vc_owner_update`, revoke public UPDATE, and ensure all legitimate UPDATE paths go through the actor-ownership soft-delete policy.
- Follow-up command: DB, Carnage (Phase 6 migration planning)
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Asset Security

---

## DB Audit Notes Summary (deferred to DB phase)

| # | Finding | Table | Risk | Priority |
|---|---|---|---|---|
| DB-001 | VENOM-002 | platform.user_consents | RLS OFF — INSERT unprotected | HIGH |
| DB-002 | VENOM-003 | vc.posts | RLS OFF — UPDATE unprotected | HIGH |
| DB-003 | VENOM-008 | platform.media_assets | {public} UPDATE policy coexists | LOW |
| DB-004 | FINDING-ARCH-009 | notification.inbox_items | RLS status UNKNOWN | MEDIUM |
| DB-005 | FINDING-ARCH-010 | moderation.reports | RLS status UNKNOWN | MEDIUM |

---

## CISSP Domain Summary

| Domain | Findings |
|---|---|
| Access Control | VENOM-001, VENOM-002, VENOM-003, VENOM-004, VENOM-005, VENOM-008 |
| Audit and Accountability | VENOM-005 |
| Software Development Security | VENOM-001, VENOM-004, VENOM-007 |
| Security Architecture | VENOM-003, VENOM-007 |
| Information Security Governance | VENOM-006 |
| Privacy | VENOM-006 |
| Asset Security | VENOM-008 |

Uncovered CISSP Domains (no findings in this scope):
- Communications Security
- Cryptography
- Physical and Environmental Security
- Identity and Access Management (IAM) platform (no IAM surface in scope)

---

## Source Read Summary

Full Rediscovery Performed: NO
ARCHITECT evidence-bundles consumed: 5
Source files validated: 22 (read by ARCHITECT pass; VENOM verified against bundle)
New source reads performed by VENOM: 0 (all findings confirmed via ARCHITECT source reads)

---

## VENOM Recommendation: CAUTION

8 findings total — 3 HIGH, 4 MEDIUM, 1 LOW.

**Release blockers (must resolve before THOR):**
- VENOM-001: markSeen ownership gap — app-layer code fix required
- VENOM-002: user_consents RLS OFF — DB migration required (DB phase)
- VENOM-003: vc.posts RLS OFF — DB migration required (DB phase)

**Non-blockers (patch in separate ticket):**
- VENOM-004 through VENOM-008: MEDIUM/LOW — can proceed to BLACKWIDOW, but should be tracked

BLACKWIDOW adversarial pass required before THOR.
ELEKTRA source-to-sink verification required for VENOM-001 (markSeen) and VENOM-005 (actorId mismatch).

Release authority: THOR only.
