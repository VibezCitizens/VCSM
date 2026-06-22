# CAPTAIN Master Log — Single Source of Truth

Last Consolidated: 2026-06-06
Total Entries: 23
Total Source Files: 7

---

## Source Inventory

| Date | Source File | Entries | Origin |
|------|-------------|---------|--------|
| 2026-04-01 | `zzzzlegacy/CURRENT/platform/documentation/2026-04-01.captain-log.md` | 2 | Legacy |
| 2026-04-10 | `zzzzlegacy/CURRENT/platform/documentation/2026-04-10.captain-log.md` | 1 | Legacy |
| 2026-04-13 | `zzzzlegacy/CURRENT/platform/documentation/2026-04-13.captain-log.md` | 1 | Legacy |
| 2026-04-19 | `zzzzlegacy/CURRENT/platform/documentation/2026-04-19.captain-log.md` | 2 | Legacy |
| 2026-05-10 | `zzzzlegacy/CURRENT/platform/documentation/2026-05-10.captain-log.md` | 5 | Legacy |
| 2026-06-05 | `ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/CAPTAIN/2026-06-05.captain-log.md` | 1 | Active |
| 2026-06-06 | `ZZnotforproduction/GOVERNANCE/outputs/2026/06/06/CAPTAIN/2026-06-06.captain-log.md` | 11 | Active |

---

## Entry Index

| # | Date | Idea | Scope | Arch Impact |
|---|------|------|-------|-------------|
| 1 | 2026-04-01 | Wentrex student no-enrollment fallback UX fix | WENTREX | No |
| 2 | 2026-04-01 | VCSM auth migration to platform/identity engine | VCSM + ENGINE | Yes |
| 3 | 2026-04-10 | Migrate app reads from old vc tables to new vport schema tables | VCSM + ENGINE | No |
| 4 | 2026-04-13 | Today's Specials — VPORT public menu, meta-field driven | VCSM | Possible |
| 5 | 2026-04-19 | Bundle analyzer setup for VCSM Vite app | VCSM | No |
| 6 | 2026-04-19 | TRAZE Public Pages Architecture — Phase 0 | VCSM + TRAFFIC | Yes |
| 7 | 2026-05-10 | Retire legacy /posts feed route and delete PostFeed.screen.jsx | VCSM | Yes |
| 8 | 2026-05-10 | Gate unguarded console.log in fetchFeedPage.pipeline.js | VCSM | No |
| 9 | 2026-05-10 | Gate console.warn error leak in useFeed.js | VCSM | No |
| 10 | 2026-05-10 | Request RLS audit on vc.posts — feed DAL has no viewer auth anchor | VCSM | Possible |
| 11 | 2026-05-10 | Remove profile_id / vport_id from getDebugPrivacyRowsController | VCSM | No |
| 12 | 2026-06-05 | Session Intelligence & Device Trust Architecture | VCSM | Yes |
| 13 | 2026-06-06 | Source of Truth Cleanup — Actor-First Surface Hardening | VCSM | Yes |
| 14 | 2026-06-06 | Platform Tooling Roadmap — Strategic Vision | VCSM | Yes |
| 15 | 2026-06-06 | Layer 1 — Complete Runtime Monitoring Platform | VCSM | Yes |
| 16 | 2026-06-06 | Layer 2 — Governance Scanner | VCSM | Yes |
| 17 | 2026-06-06 | Layer 3 — Architecture Registry and Formal Named Contracts | VCSM | Yes |
| 18 | 2026-06-06 | Layer 4 — Function Registry | VCSM | Yes |
| 19 | 2026-06-06 | Layer 5 — Complete Security Platform | VCSM | Possible |
| 20 | 2026-06-06 | Layer 6 — CI Runner | VCSM | Yes |
| 21 | 2026-06-06 | Layer 7 — Release Center | VCSM | Yes |
| 22 | 2026-06-06 | Layer 8 — Mission Control | VCSM | Yes |
| 23 | 2026-06-06 | Future Platform Services — API, Observability, Docs, Feature Flags | VCSM | Yes |

---

## All Entries — Chronological

---

### [2026-04-01 19:30] — Entry 1

**Idea:**
Harden student no-enrollment fallback — explicit empty state instead of broken navigation

**Context:**
Requiring active course enrollment before showing the student dashboard is correct authorization. The problem is the failure mode: when a student has no enrollment, roleKeys resolves empty, defaultDestination falls back to `"wentrex_dashboard"` (a raw platform key, not a route), and the app navigates to a non-existent route — making the student appear logged out. This is bad UX and weak defensive coding.

**Next Action:**
1. Fix the identity resolver or routing layer so that empty roleKeys for a known student actor produces a clear "not enrolled" state instead of navigating to an invalid route
2. Never let `platform.user_app_state.default_destination_key` be used as a raw navigation target — it must be mapped to a valid route or ignored
3. Add an explicit `/student/not-enrolled` route (or equivalent) that shows: "Your account is active, but you are not enrolled in any class yet. Contact your school administrator."
4. Ensure the flow is: auth succeeds → actor resolves → no enrollment detected → clear message, not: auth succeeds → empty roles → broken fallback → silent redirect to landing page

**Scope:** WENTREX

**Architecture Impact:** No

**Engine Impact:** No

**Notes:**
- The enrollment requirement is good practice — keep it
- The fallback behavior is the bug, not the rule
- `wentrex_dashboard` as a destination key should never reach `navigate()` — it's a platform-level key, not a frontend route
- Consider whether `defaultDestination` in the identity context should be validated against a known route list before being used

---

### [2026-04-01 21:00] — Entry 2

**Idea:**
VCSM auth migration to platform/identity engine — complete plan designed

**Context:**
Full forensic trace completed of VCSM's current auth/identity flows (24 files). Current state: VCSM uses vc.actors + vc.actor_owners + public.profiles directly. Does NOT use engines/identity at all. Engines/identity is proven working via Wentrex. VCSM needs to adopt the engine so both apps share identity infrastructure.

Key findings from the trace:
- Registration: auth.signUp → profiles upsert → onboarding → RPC create_actor_for_user → vc.actor_owners upsert
- Login: auth.signInWithPassword → session hydrate → ensure discoverable
- Identity: lists vc.actor_owners → hydrates with profiles/vports/privacy/realms → provides useIdentity()
- No platform.* tables touched anywhere in VCSM auth/identity flow
- No provisioning RPC exists for VCSM (provision_vcsm_identity does not exist yet)
- The engine already expects appKey='vcsm' as valid
- Wentrex pattern is proven: setup.js → resolver → context → adapter

**Next Action:**
1. Create `platform.provision_vcsm_identity` RPC (mirrors provision_wentrex_identity but for vc.actors)
2. Ensure `platform.apps` has row with key='vcsm'
3. Build VCSM identity adapter: features/identity/setup.js, resolvers/vcsmIdentity.resolver.js, VcsmIdentityContext.jsx
4. Add @identity Vite alias to VCSM vite.config.js
5. Phase 1: dual-write on signup (existing vc.* flow + platform provisioning)
6. Phase 2: login resolves via engine first, fallback to legacy
7. Phase 3: identity context wraps engine instead of direct vc.* queries
8. Phase 4: reduce legacy identity dependence

**Scope:** VCSM + ENGINE

**Architecture Impact:** Yes

**Engine Impact:** Yes

**Notes:**
- Current auth files: features/auth/ (14 files), state/identity/ (7 files), app/providers/AuthProvider.jsx, app/guards/ProtectedRoute.jsx, features/auth/screens/CompleteProfileGate.jsx
- First 5 files to change: onboarding.controller.js, identity.controller.js, identityContext.jsx, vite.config.js, features/identity/setup.js (new)
- Lowest-risk start: add @identity alias + create features/identity/setup.js (zero behavior change)
- Biggest risk: identity resolution must never break — entire app depends on useIdentity()
- Legacy users without platform rows must still work via self-healing pattern
- Do NOT rewrite — incremental migration only

---

### [2026-04-10 09:15] — Entry 3

**Idea:**
Migrate app reads from old vc vertical detail tables to new vport schema tables

**Context:**
Phase 3 data migration is validated. New tables exist in the vport schema (vport.barber_portfolio_details, vport.locksmith_portfolio_details, vport.locksmith_service_areas, vport.locksmith_service_details). Old vc.vport_* tables still present for safety. App code still reads from old tables. Need to switch read paths without changing writes or dropping old tables.

**Next Action:**
1. Audit every code reference to vc.vport_barber_portfolio_details, vc.vport_locksmith_portfolio_details, vc.vport_locksmith_service_areas, vc.vport_locksmith_service_details
2. Classify each as read/write/dead
3. Migrate read paths to new vport.* tables
4. Preserve returned shape for UI/controllers
5. Validate barber portfolio, locksmith portfolio, locksmith services, locksmith areas still load
6. Report remaining old-table references (writes) for future phase

**Scope:** VCSM + ENGINE

**Architecture Impact:** No

**Engine Impact:** Yes

**Notes:**
- Do not modify database schema
- Do not drop old tables
- Focus on reads only — writes stay on old tables for now
- Engine files (engines/portfolio/) likely have the barber/locksmith detail DALs
- Check engines/portfolio/src/dal/barberDetails.read.dal.js and locksmithDetails.read.dal.js

---

### [2026-04-13] — Entry 4

**Idea:**
Today's Specials — VPORT public menu, meta-field driven, no schema changes

**Context:**
VPORT owners want to highlight specials on their public menu. The existing `vport.menu_items.meta` jsonb field can carry special metadata without any schema migration. This keeps the feature additive and reversible.

**Next Action:**
Implement Today's Specials end-to-end using only `menu_items.meta`:
1. Inspect current menu item edit flow and public menu read model
2. Add special fields to the item edit modal (is_special, special_label, special_price_cents, special_starts_at, special_ends_at, special_priority, special_note)
3. Build active-special resolution logic (time-window check, fallback to item price, default label)
4. Update public menu view to show a dedicated "Today's Specials" section above regular categories
5. Ensure `menu_item_meta` is exposed through `vport.public_menu_read_model_v` if not already
6. No new tables, no schema changes

**Scope:** VCSM

**Architecture Impact:** Possible — public menu read view may need `menu_item_meta` column added; model normalizer will need special resolution logic

**Engine Impact:** No

**Notes:**
- Active special = `meta.is_special === true` AND current time within `special_starts_at` / `special_ends_at` window (open-ended if dates not set) AND item `is_active === true`
- Special price falls back to normal item `price_cents` if `special_price_cents` is absent
- Default label is "Today's Special" if `special_label` is not set
- Specials section hidden entirely when no active specials exist
- Item should still appear in its regular category listing (dual render)
- Owner UI: simple toggle within existing item edit modal, not a separate promotions system
- First version only — do not build scheduling, bulk promotion, or admin tooling

---

### [2026-04-19 07:15] — Entry 5

**Idea:**
Bundle analyzer setup for VCSM Vite app — inspect 4MB production bundle

**Context:**
The VCSM production bundle is ~4MB uncompressed. Before any optimization work can begin, the exact contents of each chunk need to be visible. `rollup-plugin-visualizer` generates a `dist/stats.html` treemap showing every module and its contribution to bundle size.

**Next Action:**
1. Install `rollup-plugin-visualizer` as a dev dependency in `apps/VCSM`
2. Add to `vite.config.js` plugins: `visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true, open: true })`
3. Run `npm run build`, confirm `dist/stats.html` generated
4. DO NOT optimize in this task — analysis only

**Scope:** VCSM

**Architecture Impact:** No — build tooling only

**Engine Impact:** No

**Notes:**
- `open: true` auto-opens report in browser after build
- Add `dist/stats.html` to `.gitignore` if not already excluded
- Analysis only — optimization is a separate future task

---

### [2026-04-19 19:00] — Entry 6

**Idea:**
TRAZE Public Pages Architecture — VCSM as Source of Truth + Traffic as SEO Renderer (Phase 0)

**Context:**
Architecture is already decided. VCSM owns the data and publish controls. Traffic (TRAZE) is a read-only Next.js SSG/ISR renderer that consumes VCSM public APIs. The split intentionally avoids embedding SEO rendering into VCSM or exposing raw DB tables as public contracts.

Current system already has `vport.public_content_read_model_v` as the source. Traffic has a connector/DAL/repository layer ready to consume real APIs. The critical missing pieces are:
1. A VCSM public content endpoint backed by the view
2. The VCSM → Traffic revalidation trigger
3. Content field alignment (summary vs excerpt vs coverImageUrl)
4. Real provider/location/service feeds

**Next Action:**
Execute Phase 0:
1. Create VCSM public content API backed by `vport.public_content_read_model_v`
   - enforce `is_published`, `is_indexable`, active profile constraints
2. Align Traffic connector/DAL/repository to consume this API (replace mock data)
3. Implement VCSM → Traffic revalidation trigger:
   - fires on publish, update, unpublish of content pages
   - calls Traffic `/api/revalidate` with paths + tags
4. Keep current Traffic route graph unchanged

**Scope:** VCSM + TRAFFIC

**Architecture Impact:** Yes — introduces VCSM public API contract + cross-app data flow from VCSM to Traffic

**Engine Impact:** No

**Notes:**
Future phases already defined:

Phase 1:
- Fix field drift (summary vs excerpt vs coverImageUrl)
- Add SEO + indexability fields in VCSM admin
- Enforce stricter public API contract

Phase 2:
- Introduce provider/location/service public APIs
- Replace Traffic mock repos gradually

Phase 3:
- Full public read-model architecture
- Event-driven publish system with retries
- Remove legacy routes

Critical missing pieces today:
- VCSM public content endpoint
- VCSM → Traffic revalidation trigger
- Content field alignment
- Real provider/location/service feeds

---

### [2026-05-10 00:00] — Entry 7

**Idea:**
Retire legacy `/posts` feed route and delete `PostFeed.screen.jsx`

**Context:**
VENOM audit (2026-05-10) confirmed the double feed pipeline is still live. `/feed` uses `useCentralFeed` (React Query, current). `/posts` uses the legacy `useFeed` hook via `useFeed.adapter.js`. Both routes are registered and publicly navigable. Security patches applied to the current feed path do not reach the legacy screen. This is the highest-priority finding (F1 — HIGH).

**Next Action:**
1. Add router-level redirect: `/posts` → `/feed` in `app.routes.jsx`
2. Delete `apps/VCSM/src/features/post/screens/PostFeed.screen.jsx`
3. Delete `apps/VCSM/src/features/feed/adapters/hooks/useFeed.adapter.js`
4. Confirm `useFeed.js` has no remaining callers, then delete it
5. Remove the `PostFeedScreen` import and lazy registration from `lazyApp.jsx` and `index.jsx`

**Scope:** VCSM

**Architecture Impact:** Yes

**Engine Impact:** No

**Notes:**
VENOM audit persisted at: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom_feed-engine-double-pipeline.md`
The adapter `useFeed.adapter.js` exists solely to serve `PostFeed.screen.jsx` — it has no other consumers. Once the screen is gone, the adapter is dead code.

---

### [2026-05-10 00:01] — Entry 8

**Idea:**
Gate unguarded `console.log` in `fetchFeedPage.pipeline.js`

**Context:**
VENOM audit F2 (MEDIUM). Line 125 of the pipeline has a `console.log` that is not wrapped in `import.meta.env.DEV`. If any caller passes a non-null `debugPostId`, the full `pagePostIds` batch is logged to the browser console in production. Readable by extensions, injected scripts, and XSS payloads.

**Next Action:**
Wrap the block at `fetchFeedPage.pipeline.js:124-129` with `if (import.meta.env.DEV)`.

**Scope:** VCSM

**Architecture Impact:** No

**Engine Impact:** No

**Notes:**
Quick fix — one line guard. Should be bundled with the F4 fix (console.warn in useFeed.js) in a single cleanup commit.

---

### [2026-05-10 00:02] — Entry 9

**Idea:**
Gate `console.warn` error leak in `useFeed.js`

**Context:**
VENOM audit F4 (LOW). `useFeed.js:241` has `console.warn("[useFeed] error", e)` with no DEV guard. Error objects may expose stack traces and Supabase query internals in production.

**Next Action:**
Wrap with `if (import.meta.env.DEV) console.warn(...)`.

**Scope:** VCSM

**Architecture Impact:** No

**Engine Impact:** No

**Notes:**
Bundle with the F2 fix above into one cleanup commit. Both are one-line guards.

---

### [2026-05-10 00:03] — Entry 10

**Idea:**
Request RLS audit on `vc.posts` — feed DAL has no viewer auth anchor

**Context:**
VENOM audit F6 (MEDIUM). `readFeedPostsPage` filters only by `realm_id` and `deleted_at`. The viewer's actorId does not appear in the base DB query. All post-visibility enforcement (block/follow/hidden) runs in-process after the read. If RLS on `vc.posts` has any anon gap or misconfiguration, all posts for a realm are readable by any caller before in-process filters run.

**Next Action:**
Run `/DB` to audit RLS policy on `vc.posts` for authenticated and anon roles. Confirm no policy gap exists and that authenticated viewer session is enforced at the table level.

**Scope:** VCSM

**Architecture Impact:** Possible

**Engine Impact:** No

**Notes:**
This is a defense-in-depth gap, not a confirmed exploit. Current client path is safe. But if a service-role key or anon bypass ever hits the DAL directly, posts are exposed unfiltered.

---

### [2026-05-10 00:04] — Entry 11

**Idea:**
Remove `profile_id` / `vport_id` from `getDebugPrivacyRowsController` return shape

**Context:**
VENOM audit F5 (LOW). The controller returns `profile_id` and `vport_id` as named fields — both are prohibited identity surfaces per the architecture contract. The consuming panel is dev-only gated in the screen, but the controller itself bakes in the identity surface violation permanently.

**Next Action:**
Remove `profile_id` and `vport_id` from the return object in `getDebugPrivacyRows.controller.js:72-83`. If `DebugPrivacyPanel` needs them for display, scope to a `__dev_only__` wrapper with an explicit DEV guard inside the controller.

**Scope:** VCSM

**Architecture Impact:** No

**Engine Impact:** No

**Notes:**
Low severity — render path is dev-only gated. But the return shape violation should be cleaned up before this controller is ever reused or referenced outside the debug panel.

---

### [2026-06-05 00:00] — Entry 12

**Idea:**
Session Intelligence & Device Trust Architecture

**Context:**
[TICKET-SECURITY-DEVICES-001]

Today VCSM knows: user authenticated, session exists, refresh token exists. But VCSM does NOT know: which device created the session, whether device is trusted, how many devices are active, which device was last used, whether a login is new, whether a device should be revoked. As a result: Sign Out Everywhere has no visibility layer, login notifications cannot be generated, security dashboard cannot exist, compromise investigations are difficult.

Design principle: Track sessions. Do NOT attempt invasive browser fingerprinting. Use stable identifiers generated and controlled by VCSM.

Proposed 4-layer model:
- Layer 1: Device Identity — generate local `vcsm_device_id`, stored locally, survives logout, not tied to auth/cookies/Supabase
- Layer 2: Session Identity — every successful login creates a `session_id` (User + Device + Login Event)
- Layer 3: Login Events — store every auth event (LOGIN_SUCCESS, LOGIN_FAILED, PASSWORD_RESET, SIGN_OUT, SIGN_OUT_EVERYWHERE, SESSION_REVOKED)
- Layer 4: Device Trust — track trusted / untrusted / revoked status per device

New device detection flow: user signs in → device ID submitted → lookup existing trusted device → if found: update last_seen_at → if not found: create device + create login event + trigger notification.

Email notification: "New login to your Vibez Citizens account" with device, time, approximate location, and "Secure Account" CTA.

Security dashboard (Settings → Security): current device, other devices, revoke/sign-out-everywhere actions.

**Next Action:**
Architecture review only — do not implement. Produce: architecture review, data model, ERD, session lifecycle diagram, device lifecycle diagram, security review, migration plan, Edge Function plan, RLS plan, rollout strategy.

**Scope:** VCSM

**Architecture Impact:** Yes

**Engine Impact:** No

**Notes:**
Future capability phases: Phase 1 (device tracking) → Phase 2 (login notifications) → Phase 3 (session management) → Phase 4 (security dashboard) → Phase 5 (suspicious login detection — impossible travel, new country, new device, VPN/proxy/TOR detection, repeated failed login patterns).

Open questions: table design, client-generated vs server-generated device_id, session ↔ Supabase auth.users relationship, revoked session sync, RLS model, required Edge Functions, existing telemetry reuse.

---

### [2026-06-06 00:00] — Entry 13

**Idea:**
Source of Truth Cleanup — Actor-First Surface Hardening (TICKET-SOT-2026-06-06)

**Context:**
Internal IDs (ownerUserId, userId, user_id, vportId) are leaking into public-facing view models, search models, canonical post models, and hook contracts. The canonical identity surface should expose actorId and kind only. Ownership must resolve through actor_owners, not raw UUIDs. Four specific sites have been identified and scoped with exact removal actions.

**Next Action:**

P1-ID-001 — `features/explore/model/search.model.js`
Remove `ownerUserId: row.owner_user_id ?? null` from `mapVportSearchResult`.

P1-ID-002 — `features/profiles/model/postCanonical.model.js`
Remove `userId: row?.user_id ?? row?.userId ?? null` and `user_id: row?.user_id ?? row?.userId ?? null` from `buildCanonicalProfilePostModel`.

P1-ID-003 — `features/settings/profile/model/vportPublicDetails.model.js`
Remove `vportId: row.vport_id ?? null` from `mapVportPublicDetailsToView`.

P1-ID-004 — `features/profiles/hooks/header/useProfileHeaderMessaging.js` + `features/profiles/screens/views/ActorProfileHeader.jsx`
Rename hook parameter `profileId` → `actorId` at both the hook definition and the call site.

**Scope:** VCSM

**Architecture Impact:** Yes

**Engine Impact:** No

**Notes:**
Out of scope: ownerActorId in public identity, owner_user_id DAL filters, actor_owners ownership logic, booking engine profileId internals, Wanders ownership flow, OneSignal externalId, profile_actor_access fallback, D-002 callerActorId systemic ownership bug, listMyVports ownership migration, actor_can_manage_profile migration.

---

### [2026-06-06 12:00] — Entry 14

**Idea:**
VCSM Platform Tooling Roadmap — Strategic Vision Capture

**Context:**
VCSM is intended to evolve from a product application into a governed, self-aware platform. The platform should eventually be capable of monitoring itself, auditing its own architecture, validating contracts, scanning source code, testing security boundaries, managing releases, and enforcing governance — all while remaining actor-first. This entry captures the full strategic intent so it is not lost between sessions.

**Next Action:**
Promote this roadmap into a formal platform strategy document in the planning system. Break each layer into its own ticket when the layer is ready to be built. Do not build any layer until current sprint work is complete.

**Scope:** VCSM

**Architecture Impact:** Yes

**Engine Impact:** Possible

**Notes:**
This roadmap establishes 8 platform layers and 4 future platform service categories. Each has its own entry (15–23 below). All systems must remain actor-first. Citizen, VPORT, and future Void actors are first-class actors across all platform systems.

---

### [2026-06-06 12:01] — Entry 15

**Idea:**
Layer 1 — Complete Runtime Monitoring Platform (Partially Implemented)

**Context:**
The frontend error capture layer is working (monitoringClient.js → monitoring-ingest-error Edge Function → Quicksilver). What does not yet exist: Error Groups UI, Feature Health scoring, Actor Health scoring, and Mission Control Runtime panel. The ingest pipeline exists but there is no surface to observe or act on the collected data.

**Next Action:**
Define the data model for Feature Health (per-feature error rate aggregation). Build the Error Groups read path from `monitoring.error_groups`. Design the Actor Health score contract. Assign these to Quicksilver as the canonical owner of the reporting surface.

**Scope:** VCSM

**Architecture Impact:** Yes

**Engine Impact:** No

**Notes:**
Partially implemented: ingest works, storage works (Quicksilver migration), Sentry wrapper works. Missing: all reporting surfaces, health scoring, actor-level attribution. Runtime Monitor, Error Groups, Feature Health, Actor Health, and Mission Control Runtime are Quicksilver modules — not VCSM features.

---

### [2026-06-06 12:02] — Entry 16

**Idea:**
Layer 2 — Governance Scanner (Planned)

**Context:**
No automated governance scanning exists today. All contract enforcement is manual (agent-driven review). A governance scanner would flag identity contract violations, ownership contract violations, actor contract violations, layer boundary violations, and service role leaks — automatically, without requiring an agent session.

**Next Action:**
Design the scanner contract. Define what a governance finding looks like (file, line, rule, severity, contract reference). Decide whether the scanner runs as a CLI, Edge Function, or CI step. Map it to the existing contract library at `ZZnotforproduction/CONTRACTS/Architecture/`.

**Scope:** VCSM

**Architecture Impact:** Yes

**Engine Impact:** Possible

**Notes:**
Five modules needed: Identity Scanner, Ownership Scanner, Actor Scanner, Boundary Scanner, Security Scanner. These are the automated equivalent of what VENOM, ELEKTRA, and ARCHITECT agents do today.

---

### [2026-06-06 12:03] — Entry 17

**Idea:**
Layer 3 — Architecture Registry and Formal Named Contracts (Planned)

**Context:**
Architecture contracts currently live as freeform markdown in ZZnotforproduction/CONTRACTS/. No machine-readable registry. A formal Architecture Registry would assign contract IDs (ACTOR-001, IDENTITY-001, etc.), track coverage, and allow the governance scanner to reference specific contract rules by ID in its findings.

**Next Action:**
Create the contract ID namespace. Assign IDs to existing contracts. Define the registry schema (id, title, scope, path, status, coverage). Decide where the registry lives.

**Scope:** VCSM

**Architecture Impact:** Yes

**Engine Impact:** No

**Notes:**
Named contracts to create: ACTOR-001 (Citizen), ACTOR-002 (VPORT), ACTOR-003 (Void — reserved), IDENTITY-001 (Public Identity), OWNERSHIP-001 (Ownership), DASHBOARD-001 (Dashboard), MESSAGING-001 (Messaging).

---

### [2026-06-06 12:04] — Entry 18

**Idea:**
Layer 4 — Function Registry (Planned)

**Context:**
Critical platform functions have no central registry. No way to know which functions are high-risk, which have contract coverage, or when they were last modified. A Function Registry would track this metadata and feed the governance scanner and release gate.

**Next Action:**
Define the Function Registry schema. Decide on storage format (JSON, markdown table, or DB table). Seed with known critical functions. Assign risk levels and contract coverage flags.

**Scope:** VCSM

**Architecture Impact:** Yes

**Engine Impact:** No

**Notes:**
Tracked fields: Function Name, Module, Layer, Dependencies, Risk Level, Contract Coverage, Last Modified. Initial seed: assertActorOwnsVportActorController, assertSessionOwnsVportActorController, switchActorController, createVport, completeOnboardingController.

---

### [2026-06-06 12:05] — Entry 19

**Idea:**
Layer 5 — Complete Security Platform (Partially Implemented)

**Context:**
RLS scanning, penetration tests, auth scanning, and ownership scanning are partially implemented through VENOM/ELEKTRA/BLACKWIDOW agent commands. Missing: persistent Security Center dashboard, Threat Registry (structured finding history), and automated Security Reports.

**Next Action:**
Define the Security Center data model (findings, severity, status, resolved date). Design the Threat Registry schema — how is a finding identified over time (fingerprint)? Assign Security Center to Quicksilver as its owner.

**Scope:** VCSM

**Architecture Impact:** Possible

**Engine Impact:** No

**Notes:**
Missing modules: Security Center (dashboard), Threat Registry (persistent record over time), Security Reports (automated, timestamped). The scanning capability already exists as agent skills. The missing piece is persistent structured output that feeds a dashboard.

---

### [2026-06-06 12:06] — Entry 20

**Idea:**
Layer 6 — CI Runner (Planned)

**Context:**
No automated CI pipeline currently exists for VCSM. All validation is manual. A CI Runner would automate: build verification, test execution, governance scanning, security scanning, and architecture validation on every push or PR.

**Next Action:**
Choose the CI runtime. Define pipeline stages in order: Build → Test → Governance Scan → Security Scan → Architecture Validation. Decide what constitutes a blocking failure at each stage.

**Scope:** VCSM

**Architecture Impact:** Yes

**Engine Impact:** No

**Notes:**
Deployment targets under consideration: Local Mac Mini, Docker Runner, VPS Runner, Railway Runner, Render Runner. Blocking rules must match Release Center rules: no deployment with critical findings, failing governance scans, or failing builds.

---

### [2026-06-06 12:07] — Entry 21

**Idea:**
Layer 7 — Release Center (Planned)

**Context:**
Deployments are currently manual with no automated gate. A Release Center would provide structured release approval, release candidate validation, deploy eligibility scoring, rollback tracking, and deployment history.

**Next Action:**
Define the Release Center data model. Design the deploy eligibility gate — which signals must be green before a deploy is allowed. Connect to CI Runner output and Security Platform findings.

**Scope:** VCSM

**Architecture Impact:** Yes

**Engine Impact:** No

**Notes:**
Three hard rules: (1) No deployment with critical findings. (2) No deployment with failing governance scans. (3) No deployment with failing builds. Release Center is the upstream consumer of CI Runner, Security Platform, Governance Scanner, and Architecture Registry status.

---

### [2026-06-06 12:08] — Entry 22

**Idea:**
Layer 8 — Mission Control (Planned)

**Context:**
No unified operational dashboard exists. Monitoring, security, CI, deployments, auth health, actor health, and feature health are all siloed. Mission Control is a single panel that surfaces all platform signals in one place.

**Next Action:**
Design the Mission Control panel layout. Define the widget contracts (what data each widget reads, from where). Decide whether Mission Control is a VCSM internal route or Quicksilver-hosted.

**Scope:** VCSM

**Architecture Impact:** Yes

**Engine Impact:** No

**Notes:**
Panels: Runtime, Governance, Security, CI, Deployments, Auth, Actor System, Feature Health. Widgets: Open Findings, Latest Build, Latest Deploy, Actor Health, Identity Errors, Security Status, Platform Health Score. Mission Control is the consumer — not the producer — of all platform layer data.

---

### [2026-06-06 12:09] — Entry 23

**Idea:**
Future Platform Services — API Platform, Observability, Documentation, Feature Flags

**Context:**
Four future platform services analogous to external SaaS tools but built into VCSM as first-class actor-aware modules. Long-horizon items — not near-term work.

**Next Action:**
No immediate action. Revisit when Layers 1–8 have meaningful implementations. Use this entry as a reference when evaluating whether to build internally or use external tools.

**Scope:** VCSM

**Architecture Impact:** Yes

**Engine Impact:** Possible

**Notes:**
Four services:

API Platform (equiv: Postman / Insomnia / Hoppscotch) — API Registry, API Tester, Edge Function Tester, Contract Validator.

Observability Platform (equiv: Datadog / Grafana / New Relic / Prometheus) — Mission Control, Feature Health, System Health, Actor Health.

Documentation Platform (equiv: Confluence / Notion / Internal Wiki) — Architecture Registry, Governance Registry, Platform Bible, Contract Library.

Feature Flag Platform (equiv: LaunchDarkly / Unleash) — Feature Registry, Feature Enablement, Beta Rollouts, Controlled Releases.

All four must remain actor-first.

---

## Maintenance

To keep this file current, run a consolidation pass after each new CAPTAIN invocation or at the start of a new sprint.

New source files to add:

```
ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/CAPTAIN/YYYY-MM-DD.captain-log.NNN.md
```

Update: Source Inventory table, Entry Index table, entry count in header, and append new entries at the bottom of the chronological list.
