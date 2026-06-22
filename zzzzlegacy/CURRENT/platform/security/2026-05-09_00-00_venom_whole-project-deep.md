# VENOM SECURITY REPORT — Whole Project Deep Audit
Date: 2026-05-09
Scope: ALL APPS + ENGINE
Auditor: VENOM

---

## VENOM TARGET

Feature / Route / Engine: Full repository — all protected roots
Application Scope: ALL APPS + ENGINE
Reason for review: First comprehensive cross-system VENOM pass
Primary trust boundary: Auth session → actor identity → ownership → DAL writes

---

## SECURITY SURFACE

Entry point: All authenticated and public-facing paths across VCSM, WENTREX, TRAFFIC, engines
Auth source: engines/identity (resolveAuthenticatedContext) for VCSM + WENTREX; anon for TRAFFIC
Authorization layer: Controller layer (per feature); engine controllers (booking, chat, moderation, reviews)
Identity surface: actorId + kind (canonical); profileId + vportId (internal — flagged below)
Sensitive objects: actor records, booking data, moderation actions, session context, lead submissions

---

## TRUST BOUNDARY TRACE

Client input: Browser → Supabase client (VCSM/WENTREX); Browser/Build → Supabase anon (TRAFFIC)
Validated at: Controller layer (where present); RLS at DB layer
Identity resolved at: engines/identity → resolveAuthenticatedContext (VCSM + WENTREX)
Authorization enforced at: Controller layer (variable coverage — see findings)
Data returned to: React client state / Zustand stores / Next.js static pages

---

## FINDINGS

---

### FINDING 1

VENOM SECURITY FINDING
- Location: engines/chat/src/controller/startDirectConversation.controller.js:43–84
- Application Scope: VCSM + ENGINE
- Current behavior: Four ungated `console.log` calls fire unconditionally in production. They log: `fromActorId`, `toActorId`, `realmId`, `conversationId` on every direct conversation start. No `import.meta.env.DEV` guard.
- Risk: Actor IDs and conversation IDs are logged to browser console in production. Any user with DevTools open sees internal actor identifiers of both conversation participants. If third-party analytics or monitoring scripts capture console output, these IDs are exfiltrated.
- Severity: HIGH
- Why it matters: actorId is the canonical identity surface. Exposing it in console output makes actor enumeration trivial. Conversation IDs expose relationship graphs (who talks to whom).
- Recommended mitigation: Wrap all four `console.log` calls in `if (import.meta.env?.DEV)`. Pattern already used correctly in `resolveAuthenticatedContext.controller.js` (line 79).
- Rationale: Engines ship into app bundles. A debug log with no dev gate is a production log.
- Follow-up command: Wolverine (implement gate)

---

### FINDING 2

VENOM SECURITY FINDING
- Location: engines/chat/src/hooks/useInbox.js:54–59 and engines/chat/src/dal/openConversation.rpc.js:15–93
- Application Scope: VCSM + ENGINE
- Current behavior: `useInbox.js` contains ungated `console.log` calls that log `partner_display_name`, `partner_username`, `actor_id`, and member counts for every inbox entry. `openConversation.rpc.js` logs `conversationId` and `actorId` on every conversation open.
- Risk: Inbox rendering leaks partner display names, usernames, and actor IDs to the browser console on every inbox load. This exposes PII (usernames, display names) and internal IDs unconditionally.
- Severity: HIGH
- Why it matters: Display names and usernames are PII. Their presence in production console output creates an unintended data exposure surface accessible to anyone with browser DevTools.
- Recommended mitigation: Gate all console.log calls in useInbox.js and openConversation.rpc.js behind `if (process.env.NODE_ENV !== 'production')` or `import.meta.env?.DEV`.
- Rationale: These logs were likely added during development and never removed. They fire on every inbox render — a high-frequency path.
- Follow-up command: Wolverine

---

### FINDING 3

VENOM SECURITY FINDING
- Location: apps/VCSM/src/state/identity/identity.controller.js:223
- Application Scope: VCSM
- Current behavior: Identity controller emits a payload containing `{ actorId, kind, profileId }`. The `profileId` field (`actorRow.profile_id`) is included in this event payload.
- Risk: `profileId` is an internal raw identifier that the architecture contract explicitly bans from public surfaces. Any subscriber to this identity event receives a raw profileId, which can be used to construct internal URLs, query patterns, or cross-reference internal tables — bypassing the actor abstraction layer.
- Severity: MEDIUM
- Why it matters: The architecture contract is clear: "Never expose profileId through useIdentity() or any public hook/controller surface." Emitting it in an event payload is a surface violation. If any subscriber passes this forward (to state, logs, analytics), the profileId escapes the DAL boundary.
- Recommended mitigation: Remove `profileId` from the event payload. The payload should be `{ actorId, kind }` only. If internal reconciliation needs profile_id, it must happen inside the DAL layer, never in emitted events or hooks.
- Rationale: The contract exists because profileId and vportId are join-table internals, not actor identifiers. Exposing them in event payloads creates invisible drift from the actor-based model.
- Follow-up command: CONTRACT REVIEWER

---

### FINDING 4

VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js:28–35
- Application Scope: VCSM
- Current behavior: The app-level booking ownership assertion resolves `requesterActor.profile_id` and then calls `readActorOwnerLinkByActorAndUserProfileDAL({ targetActorId, userProfileId: requesterProfileId })`. Ownership is verified by matching a `profileId` to the `actor_owners` join.
- Risk: `profileId` is used as an authority surface for ownership verification. This is a direct violation of the identity contract: "Owner always means Actor Owner — verified through actor_owners. Never scope behavior by profileId." Using profileId as the lookup key means a profileId mismatch or misresolution causes incorrect ownership grant/deny. Additionally, the contract states ownership must be through actorId, not profileId.
- Severity: MEDIUM
- Why it matters: If `actor_owners` is ever restructured to not join by profile_id, or if a profile_id is reassigned (edge case), this ownership check produces incorrect results. More importantly, it introduces profileId as an authority surface at the controller layer — exactly what the contract prohibits.
- Recommended mitigation: Ownership check should use actorId exclusively. Call engines/booking's `assertActorOwnsVportActor.controller.js` which should enforce the actor_owners relationship through actorId. The app-level controller should delegate to the engine controller, not re-implement with a different identity surface.
- Rationale: The engine-level version of this check (engines/booking/src/controller/assertActorOwnsVportActor.controller.js) already exists. The app-level re-implementation with profileId is the risk. Delete the app-level version or make it a thin wrapper.
- Follow-up command: Wolverine + CONTRACT REVIEWER

---

### FINDING 5

VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js
- Application Scope: VCSM
- Current behavior: Moderation access is determined exclusively by checking `learning.platform_admins` table. The `moderation.moderators` table referenced in the comment does not yet exist. If the table is absent (42P01 error), the function returns `false` (denial). There is no dedicated moderation role table.
- Risk: Two distinct risks: (1) Any `learning.platform_admins` member automatically has moderation access — even if they should not. This is cross-domain privilege coupling: learning admins are not necessarily intended platform moderators. (2) The moderation gate is incomplete — if a dedicated moderation role is needed, it does not exist, meaning either too few users can moderate (platform admins only) or future code incorrectly assumes a broader role table exists.
- Severity: MEDIUM
- Why it matters: Moderation actions include hiding posts and messages and recording enforcement actions. If the wrong actors have moderation access, content moderation can be abused. If no dedicated moderators table exists, the escalation path for adding moderators without giving learning admin access is unclear.
- Recommended mitigation: (1) Create `moderation.moderators` table as planned. (2) Update `_isModerationAuthorized` to check BOTH `learning.platform_admins` AND `moderation.moderators` with explicit OR logic. (3) Audit current `learning.platform_admins` members to confirm all are intended to have moderation access.
- Rationale: Cross-schema privilege coupling is a maintainability and correctness risk. As the system grows, learning admins and platform moderators will diverge.
- Follow-up command: DB + Carnage

---

### FINDING 6

VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/feed/controllers/getDebugPrivacyRows.controller.js:77 — `isOwner` check
- Application Scope: VCSM
- Current behavior: The controller computes `isOwner` as: `const isOwner = !isVport && actor?.profile_id === actorId`. This compares `actor.profile_id` (a profile UUID) to `actorId` (an actor UUID). These are different ID spaces.
- Risk: The `isOwner` field will always be `false` in the current code because `profile_id` and `actorId` are never equal — they are from different tables with different UUID spaces. This is a broken ownership check. While this particular controller is dev-only, the incorrect logic pattern represents a fundamental identity surface misuse that could be copied to production code.
- Severity: MEDIUM
- Why it matters: Ownership must be determined via `actor_owners`, not by comparing profileId to actorId. This bug demonstrates exactly the kind of profileId/actorId confusion the architecture contract was written to prevent. If this pattern is copied into a production controller, it would silently fail to enforce ownership.
- Recommended mitigation: Even in debug/dev code, correct the ownership check. Use `actor_owners` lookup or compare `actor.id === actorId`. Delete the profileId comparison — it is logically incorrect.
- Rationale: Dev code teaches patterns. Incorrect ownership logic in a debug controller is one copy-paste away from a production authorization bug.
- Follow-up command: BUGSBUNNY

---

### FINDING 7

VENOM SECURITY FINDING
- Location: apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js — `resolveClientConfig`
- Application Scope: TRAFFIC
- Current behavior: The write client resolves its Supabase config via: `process.env.NEXT_PUBLIC_SUPABASE_URL || ""` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""`. Additionally, `CtaModules.jsx` passes the URL and anon key as props to the hook: `supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL`. The fallback chain includes `process.env.SUPABASE_URL` (server-only, no NEXT_PUBLIC prefix).
- Risk: In `CtaModules.jsx`, the fallback chain `process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL` means if NEXT_PUBLIC_SUPABASE_URL is not set, the component falls back to SUPABASE_URL. In Next.js, server-only env vars are `undefined` in client components — so this fallback would silently produce an empty string, not a server URL. However, the pattern is fragile: a developer could misread the fallback chain as providing the server var to a client component, creating a false sense of configured state.
- Severity: LOW
- Why it matters: Fragile env var fallback chains in client components are a maintenance risk. A future configuration change could inadvertently expose or mis-route the Supabase URL.
- Recommended mitigation: Remove the `?? process.env.SUPABASE_URL` fallback from client components entirely. Client components must only reference NEXT_PUBLIC_ prefixed vars. Assert at runtime (not at fallback) if the key is missing.
- Rationale: Defense in depth — client/server env var boundaries should be explicit, not implicit via fallback chains.
- Follow-up command: Wolverine

---

### FINDING 8

VENOM SECURITY FINDING
- Location: apps/Traffic/src/features/conversion/model/providerLead.model.js — `mapProviderLeadUserToPrefill`; apps/Traffic/src/features/conversion/hooks/useProviderLeadCapture.js
- Application Scope: TRAFFIC
- Current behavior: When a VCSM-authenticated user visits a Traffic page, `readProviderLeadSessionUser` reads the Supabase session user, then `mapProviderLeadUserToPrefill` extracts `actor_id` from `user_metadata` or `app_metadata`. This `actorId` is stored in the lead draft and in `normalizeProviderLeadDraft` output. The RPC `submit_business_card_lead` does NOT currently pass `p_actor_id` — the actorId is used only for UI prefill.
- Risk: The actorId is read from JWT metadata claims (`user_metadata.actor_id`, `app_metadata.actor_id`, `app_metadata.claims.actor_id`). JWT metadata can be set by the Supabase auth provider. If these claims are user-editable (possible via Supabase user_metadata), a malicious user could craft a fake actorId in their JWT and have it read as a trusted identity. While the RPC currently ignores actorId, if the RPC is updated to accept it in the future without server-side validation, it becomes a privilege vector — associating a lead with an arbitrary VCSM actor.
- Severity: MEDIUM
- Why it matters: `user_metadata` in Supabase is user-editable by default. Reading actorId from user_metadata and treating it as a trusted identity claim is an unsafe pattern. `app_metadata` is server-only and safer — but the code checks user_metadata first, with app_metadata as a fallback.
- Recommended mitigation: (1) Remove `user_metadata.actor_id` from the lookup chain — only trust `app_metadata.actor_id` or `app_metadata.claims.actor_id`. (2) Ensure the RPC resolves actorId server-side from the authenticated session, not from client-submitted params. (3) Document clearly that actorId in the lead model is UI-only and must never be used as a trust claim in server-side logic.
- Rationale: user_metadata is client-editable — it is not a trust surface. app_metadata is set server-side and is the correct source for identity claims.
- Follow-up command: DB + Wolverine

---

### FINDING 9

VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js (select: `id, kind, profile_id, vport_id`) and multiple other feed/profile/upload DALs
- Application Scope: VCSM
- Current behavior: Multiple DAL files include `profile_id` and `vport_id` in their SELECT statements and return these fields to controllers, which may pass them to UI state. Affected DALs include: `feed.read.actorsBundle.dal.js`, `feed.read.viewerContext.dal.js`, `feed.read.debugPrivacyRows.dal.js`, `profiles/dal/post/fetchPostsForActor.dal.js`, `notifications/inbox/dal/senders.read.dal.js`, `upload/dal/findPostMentionsByPostIds.dal.js`, `upload/dal/findActorsByHandles.dal.js`.
- Risk: `profile_id` and `vport_id` are internal join-table foreign keys — they are the raw IDs of the underlying profiles and vport records. The architecture contract prohibits these from being exposed through public hook or controller surfaces. These fields propagate from DAL → controller → hook → potentially component state, making them available in browser memory to any JavaScript running on the page.
- Severity: MEDIUM
- Why it matters: These IDs enable internal table traversal — a knowledgeable attacker with browser access could use profile_id and vport_id to construct direct queries against profile and vport tables, bypassing the actor abstraction. Even without active exploitation, the presence of these IDs in client state is an architectural contract violation.
- Recommended mitigation: Audit each DAL that selects profile_id or vport_id. If the field is used only for internal routing (e.g., determining isVport), perform that computation in the DAL or controller and strip the raw ID before returning to the hook layer. If the field is genuinely needed in UI (e.g., slug construction), use an explicit mapped field name that signals its limited scope.
- Rationale: DAL selects define the data surface. Selecting internal join IDs and letting them propagate unchecked creates a diffuse exposure surface.
- Follow-up command: Wolverine + CONTRACT REVIEWER

---

### FINDING 10

VENOM SECURITY FINDING
- Location: Traffic — no rate limiting on anon lead/claim writes (conversion/dal/submitProviderLead.write.dal.js → submit_business_card_lead RPC)
- Application Scope: TRAFFIC
- Current behavior: Any anonymous visitor can submit a provider lead via the RPC `submit_business_card_lead`. No app-layer rate limiting exists. The only protection would be Supabase RLS INSERT policy on the destination table.
- Risk: Without rate limiting, the lead submission form is an open write surface. A bot could spam a provider with thousands of fake leads. This has two impacts: (1) denial-of-service against the provider's lead inbox, (2) if email confirmation is triggered per lead (`invokeProviderLeadConfirmation`), it becomes an email spam relay.
- Severity: MEDIUM
- Why it matters: The email confirmation path (`send-lead-confirmation` Edge Function) is called on every successful lead submission. Unthrottled lead submission → unthrottled emails sent. Email relay abuse is a real-world risk for anon-write surfaces.
- Recommended mitigation: (1) Implement rate limiting at the Edge Function level (`send-lead-confirmation`). (2) Add a Supabase RLS policy that rate-limits INSERTs by IP or user agent (using pg_net or a rate limit table). (3) Consider adding a CAPTCHA or honeypot field to the lead form. (4) The `p_ip` parameter is passed as `null` — populate it from the request context to enable server-side rate limiting by IP.
- Rationale: Anon write surfaces without rate limiting are trivially abused. The email relay risk elevates this beyond a simple spam concern.
- Follow-up command: DB + Carnage (RLS rate limit policy)

---

### FINDING 11

VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCard.read.dal.js (and related public DALs)
- Application Scope: VCSM
- Current behavior: The public vport business card and menu pages serve unauthenticated visitors. The business card lead write path (`vportBusinessCardLead.write.dal.js`) accepts unauthenticated lead submissions. The email edge function (`sendLeadConfirmationEmail.edge.dal.js`) is triggered per submission.
- Risk: Same pattern as Traffic lead submission — unthrottled anon writes trigger email relay. The VCSM business card is reachable at `/vport/:slug/card` without auth. If the lead form has no rate limit, it is an email relay.
- Severity: MEDIUM
- Why it matters: The VCSM public business card surface is the VCSM equivalent of the Traffic conversion form. Both share the same anon-write → email-trigger pattern. If rate limiting is not enforced at the edge function level, both surfaces are email relay risks.
- Recommended mitigation: Apply the same mitigation as Finding 10. Rate limit the `sendLeadConfirmationEmail` edge function. Add IP-based rate limiting to the lead write RLS policy.
- Rationale: Two separate lead submission surfaces with the same pattern means the same fix applies to both.
- Follow-up command: DB + Carnage

---

### FINDING 12

VENOM SECURITY FINDING
- Location: apps/Traffic/src/data/connectors/supabase.client.js — server-side read client vs. apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js — client-side write client
- Application Scope: TRAFFIC
- Current behavior: Traffic maintains two separate Supabase clients: (1) A server-side read client using `process.env.SUPABASE_URL` and `SUPABASE_ANON_KEY` (no NEXT_PUBLIC prefix — correctly server-only). (2) A client-side write client using `process.env.NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (correctly client-side). The read client comment explicitly states "Never call this in client components."
- Risk: A developer unfamiliar with the dual-client pattern could import `getSupabaseClient()` (the server-only read client) into a client component. The function would return `null` at runtime (env vars would be empty), causing silent failures — not a security breach, but a functional break. More dangerously: if the comment is ignored and SUPABASE_URL is set as a NEXT_PUBLIC var (to make the server client "work" in client components), the pattern collapses into a single client and the boundary disappears.
- Severity: LOW
- Why it matters: The architectural intent is correct — server reads use server env vars, client writes use public env vars. The risk is that this design is enforced only by a code comment, not by a runtime error or module-level guard.
- Recommended mitigation: Add an explicit server-only guard to `supabase.client.js`: `import 'server-only'` (Next.js 13+ support). This throws a build error if the module is imported in a client component, enforcing the boundary at the tooling level.
- Rationale: Architecture enforced by convention fails when team grows. Architecture enforced by tooling (`import 'server-only'`) fails at build time.
- Follow-up command: Wolverine

---

## IDENTITY SURFACE WARNINGS

### IDENTITY SURFACE WARNING 1
Location: apps/VCSM/src/state/identity/identity.controller.js:223
Current identity surface: `{ actorId, kind, profileId }` in event payload
Expected identity surface: `{ actorId, kind }` only
Risk: profileId escapes DAL boundary into event system and any event subscriber
Suggested correction: Remove profileId from event payload. Keep profile_id access internal to DAL only.

### IDENTITY SURFACE WARNING 2
Location: apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js:28–35
Current identity surface: `requesterActor.profile_id` used as ownership authority
Expected identity surface: actorId verified through actor_owners
Risk: Incorrect identity surface in ownership assertion — profileId should never be the authority key
Suggested correction: Delegate to engines/booking/assertActorOwnsVportActor.controller.js which enforces actorId-based ownership. Remove app-level re-implementation.

### IDENTITY SURFACE WARNING 3
Location: apps/Traffic/src/features/conversion/model/providerLead.model.js:43–55
Current identity surface: actorId read from `user_metadata.actor_id` (user-editable)
Expected identity surface: actorId from `app_metadata.actor_id` (server-set only) or not used at all
Risk: user_metadata is client-editable — treating it as a trusted identity claim is unsafe
Suggested correction: Remove user_metadata lookup. Use app_metadata exclusively, or resolve actorId server-side in the RPC.

---

## DEBUG LEAKAGE WARNINGS

### DEBUG LEAKAGE WARNING 1
Location: engines/chat/src/controller/startDirectConversation.controller.js:43–84
Current behavior: 4× ungated `console.log` calls log actorIds and conversationId in production
Leak risk: Actor enumeration, relationship graph exposure via browser console
Severity: HIGH
Recommended mitigation: Wrap in `if (import.meta.env?.DEV)` — exact pattern used in identity engine

### DEBUG LEAKAGE WARNING 2
Location: engines/chat/src/hooks/useInbox.js:54–60
Current behavior: Ungated logs dump `partner_display_name`, `partner_username`, `actor_id`, member count per inbox row on every render
Leak risk: PII (usernames, display names) in production console on every inbox load
Severity: HIGH
Recommended mitigation: Add dev gate or remove logs entirely

### DEBUG LEAKAGE WARNING 3
Location: engines/chat/src/dal/openConversation.rpc.js:15,28,49,93
Current behavior: Ungated logs dump `conversationId` and `actorId` on every conversation open
Leak risk: Internal IDs in production console
Severity: HIGH
Recommended mitigation: Gate all console.log calls in this file

---

## SECURITY RISK FINDINGS SUMMARY

Missing authorization:
- Moderation gate checks only learning.platform_admins — incomplete, cross-domain coupling (MEDIUM)
- App-level booking ownership uses profileId instead of actorId — wrong authority surface (MEDIUM)

Identity misuse:
- identity.controller.js emits profileId in event payload (MEDIUM)
- booking assertActorOwnsVportActor uses profile_id as ownership key (MEDIUM)
- Traffic lead prefill reads actorId from user-editable user_metadata (MEDIUM)
- getDebugPrivacyRows compares profile_id to actorId for isOwner — logically broken (MEDIUM)

Sensitive data exposure:
- profile_id and vport_id in feed/profile/upload actor DAL selects propagate to client state (MEDIUM)
- vportId and profileId included in notifications senders DAL and upload mention DALs (MEDIUM)

Unsafe debug leakage:
- 4 ungated console.logs in startDirectConversation engine controller (HIGH)
- useInbox.js logs partner PII on every inbox render without dev gate (HIGH)
- openConversation.rpc.js logs actorId/conversationId without dev gate (HIGH)

Policy assumption risks:
- Traffic anon lead writes have no app-layer rate limit — email relay risk (MEDIUM)
- VCSM public business card lead writes share the same risk (MEDIUM)
- Supabase view definitions are the sole protection for public field exposure (assumed RLS on views)

Dependency boundary risks:
- Traffic write client reads from NEXT_PUBLIC env vars correctly; read client is server-only — boundary enforced only by comment, not tooling (LOW)

---

## MITIGATION PLAN

### Priority 1 — Chat engine debug logs (HIGH × 3)
Risk: PII and internal IDs logged to production console
Recommended change: Add `if (import.meta.env?.DEV || process.env.NODE_ENV !== 'production')` guard to all ungated console.log calls in: startDirectConversation.controller.js, useInbox.js, openConversation.rpc.js
Why it works: Vite/Next.js strips dev-only code at build time — these logs never ship
Layer to fix: ENGINE (engines/chat/)
Follow-up command: Wolverine

### Priority 2 — profileId in identity event payload
Risk: Architecture contract violation — profileId escaping actor boundary
Recommended change: Remove `profileId` from the emitted payload in identity.controller.js:223
Why it works: Event subscribers cannot access profileId if it is not in the payload
Layer to fix: VCSM (apps/VCSM/src/state/identity/)
Follow-up command: CONTRACT REVIEWER → Wolverine

### Priority 3 — Booking ownership via profileId
Risk: Incorrect identity surface in ownership gate
Recommended change: Replace app-level assertActorOwnsVportActor with delegation to engines/booking version
Why it works: Engine version enforces correct actor_owners check through actorId
Layer to fix: VCSM (apps/VCSM/src/features/booking/controller/)
Follow-up command: Wolverine

### Priority 4 — Anon lead rate limiting (TRAFFIC + VCSM)
Risk: Email relay via unthrottled lead submissions
Recommended change: (1) Pass real IP to submit_business_card_lead RPC (p_ip param is null). (2) Implement rate limit in DB or edge function. (3) Consider CAPTCHA.
Why it works: IP-based rate limiting blocks bot submissions at the DB layer
Layer to fix: DB policy + edge function (Carnage + DB)
Follow-up command: DB + Carnage

### Priority 5 — Traffic actorId from user_metadata
Risk: User-editable claim used as identity source
Recommended change: Remove user_metadata.actor_id from the lookup chain in mapProviderLeadUserToPrefill
Why it works: app_metadata is server-set and cannot be edited by users
Layer to fix: TRAFFIC (apps/Traffic/src/features/conversion/model/)
Follow-up command: Wolverine

### Priority 6 — Moderation gate cross-schema coupling
Risk: Incomplete moderation role table; learning admin = moderation admin coupling
Recommended change: Create moderation.moderators table and update assertModerationAccess to check it
Why it works: Dedicated role table decouples learning admin from moderation admin
Layer to fix: DB (Carnage for migration)
Follow-up command: DB + Carnage

### Priority 7 — profile_id/vport_id in actor DAL selects
Risk: Internal IDs propagating to client state
Recommended change: Audit each DAL. Strip profile_id/vport_id from return shape unless genuinely needed. Replace with computed boolean (e.g., isVport: !!vport_id) where the only use is type detection.
Why it works: If IDs never leave the DAL, they cannot be accessed in client memory
Layer to fix: VCSM (multiple DAL files in feed, profiles, upload, notifications)
Follow-up command: Wolverine

### Priority 8 — Server-only guard for Traffic read client
Risk: Client component accidentally importing server-only Supabase client
Recommended change: Add `import 'server-only'` at top of apps/Traffic/src/data/connectors/supabase.client.js
Why it works: Next.js throws a build error if this module is imported in a client component
Layer to fix: TRAFFIC (apps/Traffic/src/data/connectors/)
Follow-up command: Wolverine

---

## CLEARED SURFACES (No Finding)

- DebugPrivacyPanel: correctly gated by `import.meta.env.DEV` in both component and CentralFeedScreen. Hook's `enabled` flag propagates the gate. CLEAR.
- LoginDebugPanel: correctly gated by `if (!import.meta.env.DEV) return null` at line 49. CLEAR.
- identity engine resolveAuthenticatedContext: console.log correctly gated by `_isDev` (import.meta.env.DEV). CLEAR.
- Traffic server-side Supabase client: uses server-only env vars (no NEXT_PUBLIC prefix), no credentials exposed to client. CLEAR.
- Traffic write client: correctly uses NEXT_PUBLIC vars for client-side Supabase. Anon key only — no service role key detected. CLEAR.
- Moderation controller flow: assertModerationAccessDAL is called BEFORE any read or write in both moderationActions controllers. Authorization gate is correctly positioned. CLEAR.
- Chat block check in startDirectConversation: listUserBlockRowsBetweenActors is called before getOrCreateDirectConversation. Block check correctly pre-empts conversation creation. CLEAR.

---

## VENOM COMPLETE

Trust boundaries traced: YES
Auth + authorization inspected: YES
Identity surfaces flagged: 3 violations
Concrete risks surfaced: 12 findings
Severity classified: 3 HIGH, 7 MEDIUM, 2 LOW
Mitigations proposed: 8 prioritized actions
Code modified: NONE — read-only audit only
