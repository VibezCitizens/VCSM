---
name: vcsm.profiles.behavior
description: Feature-level behavior contract for the VCSM profiles feature — built from governance artifacts
metadata:
  type: behavior
  status: ACTIVE
  authored-by: LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
  date: 2026-06-05
  priority: P0
  evidence-standard: GOVERNANCE_ARTIFACTS_ONLY
---

# Feature Behavior Contract — profiles
**Application:** VCSM
**Status:** ACTIVE — built from governance artifacts (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
**Evidence standard:** Governance artifacts only. No source code read. UNKNOWN = unproven.

---

## §1 Purpose

The profiles feature is the universal actor profile renderer for the VCSM platform. It resolves any route parameter (UUID, slug, "self", or username) to a canonical actor identity, determines actor kind (user vs. vport), and dispatches to the correct kind-specific profile view.

For vport actors, profiles manages a deeply nested sub-system covering: service catalogs, menus, gas prices, rates, locksmith details, content pages, portfolio, reviews, and subscriber counts.

For user actors, profiles renders a tabbed view of posts, photos, friends, and vibe tags.

The feature is the largest single module in the VCSM platform — 374 source files, 12 engine dependencies, 30 write surfaces across 14+ tables, and 221 screen entries in the callgraph.

**Sources:** ARCHITECTURE.md (Purpose section), CURRENT_STATUS.md (Top gap, Final module status)

---

## §2 Entry Points

- Route `/profile/:actorId` — universal entry point, handled by `ActorProfileScreen.jsx`.
- `ActorProfileScreen` dispatches to `PROFILE_KIND_REGISTRY` keyed by actor kind (`user` | `vport`).
- User kind: dispatches to `ActorProfileViewScreen.jsx`.
- Vport kind: dispatches to `VportProfileKindScreen.jsx` → `VportProfileViewScreen.jsx`.
- Public adapter exports consumed by other features: `useProfilesOps`, `useActorCanonicalSlug` via `profiles.adapter.js`.
- Route parameter accepts: UUID, human-readable slug, the literal string "self", or a username. All forms are resolved to a canonical actor.

**Note:** The `/profile/:actorId` route is registered in the app-level router, not inside the profiles feature itself. Zero routes are registered in the feature's own route-map scanner output.

**Sources:** ARCHITECTURE.md (Entry Points section), INDEX.md (Routes section)

---

## §3 User Flows

The following flows are derivable from governance artifacts. Specifics of individual sub-flows are UNKNOWN where module BEHAVIOR.md files remain STUBs.

### 3.1 Universal Profile Resolution (All Actors)
- Viewer navigates to `/profile/:actorId` (UUID, slug, "self", or username).
- `ActorProfileScreen` resolves the route parameter to a canonical actor identity via `resolveActorBySlug.controller.js` and `resolveActorSlug.dal.js`.
- Slug resolution cache TTL: 10 minutes (controller-level TTL cache keyed by actorId).
- If slug resolution succeeds: canonical actor is identified; profile kind dispatches to user or vport sub-view.
- If slug resolution fails: generic error message shown; no retry UI available (known gap — see §11).
- If slugNotFound or missing canonical slug: redirect to `/feed`.

**Source:** ARCHITECTURE.md (Module Runtime Readiness — Route/screen entry, Empty state, Error state)

### 3.2 Profile Privacy and Block Gate
- `useProfileGate.js` enforces privacy + block + follow access rules before profile content is rendered.
- Gate logic: `canView = isSelf || (!isBlocked && (!isPrivate || isFollowing))`.
- `undefined` viewerActorId causes gate to return `loading = true` — safe default (no premature access).
- `PrivateProfileGate` and `UnavailableProfileGate` are presented when canView is false.

**Source:** ARCHITECTURE.md (Auth/owner gates row, Module Boundary Warnings — useProfileGate), BW output (E3 — undefined viewerActorId BLOCKED finding)

### 3.3 User Actor Profile View
- Profile shows tabbed view: posts, photos, friends, vibe tags.
- Header shows follow state (following/follower counts).
- Photos tab: displays post media grid (specific behavior UNKNOWN — module BEHAVIOR.md is STUB).
- Friends tab: displays top friend candidates; actor may save top friend ranks to `vc.friend_ranks`.
- Posts tab: loads actor's public posts (visibility filter details UNKNOWN — social module BEHAVIOR.md is STUB).

**Source:** ARCHITECTURE.md (Purpose), modules/social/BEHAVIOR.md (STUB), modules/photos/BEHAVIOR.md (STUB), modules/friends/BEHAVIOR.md (STUB)

### 3.4 Vport Actor Profile View
- Vport profile routes to `VportProfileKindScreen` → `VportProfileViewScreen`.
- Vport owner views sub-screens for: rates/services, gas/fuel prices, reviews, menu, locksmith details, subscriber counts.
- Specific sub-flow behavior per vport kind is UNKNOWN — modules/vport/BEHAVIOR.md is STUB.

**Source:** ARCHITECTURE.md (Purpose), modules/vport/BEHAVIOR.md (STUB)

### 3.5 Vport Content Page Management
- Vport owner may create, update, delete, and toggle-publish content pages.
- All four operations (INSERT, DELETE, UPDATE patch, UPDATE toggle-publish) require `assertActorOwnsVportActorController` before reaching DAL.
- DAL enforces `.eq("actor_id", actorId)` double filter on DELETE and toggle-publish operations.

**Source:** VENOM output (§4 Surface Inventory — content_pages — VERIFIED_SAFE rows), BW output (D5, D6 — BLOCKED)

### 3.6 Vport Menu Management
- Vport owner may create, update, and delete menu categories and menu items.
- CREATE operations for both categories and items require actor ownership check (gap confirmed — see §6, §9).
- DELETE operations: `assertActorOwnsVportActorController` called at controller layer; however, DAL-level actor_id scope is absent (see §6).
- Menu item media INSERT: profileId resolved from actorId correctly; itemId ownership not verified (see §6).

**Source:** VENOM output (§4 Surface Inventory — menu_* rows), BW output (A2, A3, D1, D2)

### 3.7 Vport Locksmith Management
- Locksmith vport owner may manage service areas (INSERT/UPDATE/DELETE/UPSERT), service details (UPSERT/DELETE), and portfolio details (UPSERT).
- All locksmith write controllers call `assertActorOwnsVportActorController` and verify `identityActorId` is non-null.
- Null identityActorId throws an error before reaching ownership assertion.
- Portfolio UPSERT and service detail UPSERT have DAL-layer scoping gaps (see §6).

**Source:** VENOM output (§4 Surface Inventory — locksmith_* rows), BW output (B2 — BLOCKED, A controllers section)

### 3.8 Friend Rank Writes
- Authenticated actor may save top friend ranks via `useSaveTopFriendRanks` hook → `saveTopFriendRanksController` → `save_friend_ranks` RPC.
- `ownerActorId` is currently derived from URL route params (`useParams`), not from session identity (CRITICAL security gap — BW-PROF-001, THOR BLOCKER).

**Source:** modules/friends/BEHAVIOR.md (STUB), VENOM output (VEN-PROFILES-002), BW output (A1, B1)

### 3.9 Subscriber Data
- `count_vport_subscribers` RPC: read-only; privacy gate (`dalCanViewActorSignal`) enforced in `getSubscribersController`.
- `list_vport_subscribers` RPC: read-only; privacy gate enforced in `getSubscribersController` only — DAL is callable without the gate if imported directly.

**Source:** VENOM output (§4 Surface Inventory — subscriber rows, VEN-PROFILES-007)

### 3.10 Canonical Slug and Post URLs
- Profile URL: constructed from vport slug or username. On resolution failure, falls back to bare actorId UUID — platform policy violation (BW-PROF-010, THOR BLOCKER).
- Post share URL: constructed as `/post/{postId}` using raw UUID — platform policy violation (BW-PROF-011, THOR BLOCKER).
- Post edit navigation URL: constructed as `/post/{postId}/edit` using raw UUID (BW-PROF-012).

**Source:** BW output (H1, H2, H3)

---

## §4 Business Rules

All business rules below are derived from governance artifacts. Cite is listed per rule.

**BR-001:** Actor identity must always be resolved from a canonical source (UUID, slug, username, or "self") — never invented or inferred client-side.
Source: ARCHITECTURE.md (Purpose, Entry Points)

**BR-002:** Profile kind (user vs. vport) determines the sub-view rendered. Kind mismatch must not be silently corrected.
Source: ARCHITECTURE.md (Purpose — dispatches to PROFILE_KIND_REGISTRY)

**BR-003:** Privacy and block state must be evaluated before any profile content is rendered to the viewer.
Source: ARCHITECTURE.md (Auth/owner gates row — useProfileGate)

**BR-004:** Vport write operations (menu, locksmith, rates, services, content pages) must verify the calling actor owns the target vport actor before executing any mutation.
Source: VENOM output (§4 Surface Inventory — confirmed VERIFIED_SAFE surfaces), ARCHITECTURE.md (Authorization path mapped)

**BR-005:** All ownership verification for vport mutations must use `assertActorOwnsVportActorController`. No alternative ownership pattern is documented as approved.
Source: VENOM output (§4 — confirmed surfaces show assertActorOwnsVportActorController pattern)

**BR-006:** Subscriber lists are privacy-sensitive PII. The visibility gate (`dalCanViewActorSignal`) must be applied before subscriber list data is returned to any caller.
Source: VENOM output (VEN-PROFILES-007)

**BR-007:** Public-facing profile URLs must use human-readable slugs — never raw UUIDs. (Platform memory rule.)
Source: BW output (H1 — BW-PROF-010 finding), project memory [No raw IDs in public URLs]

**BR-008:** Post share URLs must use slugs or post-specific identifiers — never raw UUIDs. (Platform memory rule.)
Source: BW output (H2 — BW-PROF-011 finding), project memory [No raw IDs in public URLs]

**BR-009:** Debug output must never reach browser console in production. All dev-only debug output must use the platform debugger pattern. (Platform memory rule.)
Source: VENOM output (VEN-PROFILES-009)

**BR-010:** The profiles feature must never import DAL or controller files from other product apps (apps/wentrex, apps/Traffic). Shared logic must come from engines/ or shared/.
Source: CLAUDE.md (Isolation Rules)

**BR-011:** Content pages are owned exclusively by the profiles feature. Other features must not write directly to content_pages.
Source: ARCHITECTURE.md (Module Data Contract — content_pages owned by profiles)

---

## §5 State Rules

State machine rules directly documented in governance artifacts:

**State: Slug Resolution**
- Resolving → Success: canonical actor identified, profile rendered.
- Resolving → Not Found: redirect to /feed.
- Resolving → Error: generic error message shown; no retry (MEDIUM gap — ARCHITECTURE.md).

**State: Profile Gate**
- Loading (viewerActorId undefined or targetActorId undefined).
- Blocked: PrivateProfileGate or UnavailableProfileGate shown.
- Open: profile content rendered.

**State: Content Page Publish**
- Toggle publish is idempotent — any boolean transition is accepted. No state machine enforcing valid publish transitions documented.
Source: BW output (F2 — INFO, no invariant violation)

**State: Friend Ranks**
- Friend rank save is idempotent — the `save_friend_ranks` RPC replaces all ranks atomically. Replay produces same result.
Source: BW output (F1 — no replay risk)

**State: Cache Layers**
- readActorProfile.dal.js: 30s TTL cache.
- resolveActorSlug.dal.js: 10-minute TTL cache.
- useProfileView hook: 60s staleTime.
- Three independent TTL caches on overlapping data — stale state after update is possible (MEDIUM risk — ARCHITECTURE.md).

UNKNOWN: state machine rules for any vport kind sub-systems (menu, locksmith, gas prices) — module BEHAVIOR.md files are STUBs with no confirmed state machines.

---

## §6 Security Constraints

Each constraint is derived from a VENOM or BlackWidow finding. Status of all findings is OPEN (DRAFT).

**CONSTRAINT-001:** Friend rank writes must derive ownerActorId from the authenticated session, not from URL route params.
Evidence: VEN-PROFILES-002 (HIGH) — ownerActorId taken from `useParams()` → passed to save_friend_ranks RPC. BW-PROF-001 (CRITICAL) — BYPASSED adversarial test confirms exploit.

**CONSTRAINT-002:** Menu category DELETE DAL must include an actor_id or profile_id ownership scope filter, not categoryId alone.
Evidence: VEN-PROFILES-003 (HIGH) — deleteVportActorMenuCategoryDAL uses `.eq("id", categoryId)` only. BW-PROF-006 (MEDIUM) — controller gate present, DAL unscoped.

**CONSTRAINT-003:** Menu item DELETE DAL must include an actor_id or profile_id ownership scope filter, not itemId alone.
Evidence: VEN-PROFILES-004 (HIGH) — deleteVportActorMenuItemDAL uses `.eq("id", itemId)` only. BW-PROF-007 (MEDIUM) — controller gate present, DAL unscoped.

**CONSTRAINT-004:** locksmith_portfolio_details UPSERT must include actor_id in the DB filter or onConflict composite key.
Evidence: VEN-PROFILES-005 (HIGH) — onConflict is portfolio_item_id only; no actor_id scope at DAL. BW-PROF-008 (MEDIUM) — controller gate present, DAL unscoped.

**CONSTRAINT-005:** menu_item_media INSERT must verify that the target itemId belongs to the resolved profileId before inserting.
Evidence: VEN-PROFILES-006 (MEDIUM) — itemId passed unverified against profileId.

**CONSTRAINT-006:** list_vport_subscribers DAL must not be called without the privacy gate (dalCanViewActorSignal). Subscriber list data is PII.
Evidence: VEN-PROFILES-007 (MEDIUM) — DAL is callable without the controller privacy gate.

**CONSTRAINT-007:** locksmith_service_details UPSERT must include actor_id in the onConflict composite key or DB filter.
Evidence: VEN-PROFILES-008 (MEDIUM) — onConflict is service_id only; actor_id in row payload is not enforced.

**CONSTRAINT-008:** No debug output using console.error, console.log, or console.warn may exist in any controller, DAL, model, or hook — dev-only output must use the platform debugger pattern.
Evidence: VEN-PROFILES-009 (LOW) — console.error in upsertVportServices.controller.js inside DEV guard.

**CONSTRAINT-009:** Menu category CREATE and menu item CREATE must call assertActorOwnsVportActorController before executing any write.
Evidence: BW-PROF-002 (HIGH) — saveVportActorMenuCategory.controller.js CREATE path has no assertActorOwnsVportActorController call. BW-PROF-003 (HIGH) — saveVportActorMenuItem.controller.js CREATE path has no assertActorOwnsVportActorController call.

**CONSTRAINT-010:** useSaveTopFriendRanks hook must source ownerActorId from useIdentity() — it must not accept ownerActorId as an externally supplied argument.
Evidence: BW-PROF-004 (HIGH) — hook accepts ownerActorId as external argument; no useIdentity() binding.

**CONSTRAINT-011:** Public-facing profile URLs must never expose raw UUID actorIds. When slug resolution fails, a human-readable fallback (not a bare UUID) must be produced.
Evidence: BW-PROF-010 (HIGH) — buildActorCanonicalSlug.controller.js:89 falls back to bare actorId on failure.

**CONSTRAINT-012:** Post share URLs must never expose raw UUID postIds. Share links must use slug-based or opaque identifiers.
Evidence: BW-PROF-011 (HIGH) — useActorProfileActions.js:31 constructs `/post/{postId}`.

**CONSTRAINT-013:** Post edit navigation must not use raw UUID postIds in client-side routes.
Evidence: BW-PROF-012 (MEDIUM) — useActorProfileActions.js:80 navigates to `/post/{postId}/edit`.

---

## §7 Error Handling

Error states derivable from governance artifacts:

**Slug resolution error:** Generic error message is shown to the user. No retry UI or recovery path available. This is a documented gap — transient DB errors permanently redirect users away from a valid profile. (ARCHITECTURE.md — Error state row: "User has no recovery path on transient error")

**slugNotFound:** Redirect to `/feed`. (ARCHITECTURE.md — Empty state row)

**Missing canonical slug:** Redirect to `/feed`. (ARCHITECTURE.md — Empty state row)

**Loading states:** Skeleton loading shown on all async branches including slug resolution, kind fetch, and canonical redirect. (ARCHITECTURE.md — Loading state row: READY)

**Profile gate blocked:** `PrivateProfileGate` or `UnavailableProfileGate` presented to viewer when access is denied.

**null/undefined guard failures (vport write controllers):**
- Locksmith controllers: null identityActorId throws before ownership assertion. (BW output B2 — BLOCKED)
- Content page controllers: null callerActorId throws before ownership assertion. (BW output B3 — BLOCKED)
- Menu category controller: null actorId throws. (BW output E1 — BLOCKED)
- Friend ranks controller: null ownerActorId returns `{ ok: false, error: ... }` — does not throw. (BW output E2 — BLOCKED)

**useProfileGate undefined viewerActorId:** Gate returns loading=true; no premature canView grant. (BW output E3 — BLOCKED)

**resolveVportProfileId returning null for user-kind actor calling vport writes:** DAL silently returns null (no error thrown, no write). Menu category CREATE silently returns null for non-vport actors — no error surface indicates unauthorized attempt. (BW-PROF-005 — MEDIUM finding)

UNKNOWN: Error handling for any vport kind sub-system failures (menu save, locksmith save, rates, services) — module BEHAVIOR.md files are STUBs.

UNKNOWN: Retry behavior or partial-failure handling for the 12-engine import chain on profile load.

---

## §8 Cross-Feature Dependencies

All dependencies documented from ARCHITECTURE.md (Module Dependency Graph).

| Dependency | Type | Direction | Boundary Status |
|---|---|---|---|
| engines/identity | engine | inbound | APPROVED — via adapter (useIdentity, actor resolution) |
| engines/hydration | engine | inbound | APPROVED — via adapter (useActorStore hydration) |
| engines/profile | engine | inbound | APPROVED — via adapter (profile engine reads) |
| engines/booking | engine | inbound | APPROVED — via adapter (booking data on vport screens) |
| engines/review | engine | inbound | APPROVED — via adapter (reviews tab on vport) |
| engines/menu | engine | inbound | APPROVED — via adapter (menu tab on vport) |
| engines/media | engine | inbound | APPROVED — via adapter (media uploads for portfolio) |
| engines/notification | engine | inbound | APPROVED — via adapter (post publish notifications) |
| engines/portfolio | engine | inbound | APPROVED — via adapter (portfolio tab on vport) |
| engines/qr | engine | inbound | APPROVED — via adapter (QR code modal on profile header) |
| engines/chat | engine | inbound | APPROVED — via adapter (messaging from profile) |
| engines/content | engine | inbound | APPROVED — via adapter (content pages on vport) |
| features/social | feature | inbound | APPROVED — via adapter (privacy, follow, block adapters) |
| features/block | feature | inbound | LOW RISK (direct import, not via adapter) — `useBlockStatus` imported from `@/features/block` directly; violates adapter boundary convention per ARCHITECTURE.md boundary warning |

**DB tables (read/write):**
- `vc.actors` — READ (identity engine intermediary)
- `public.profiles` — READ + partial WRITE (settings owns write authority; profiles reads raw table — MEDIUM risk)
- `vport.profiles` — READ + partial WRITE (vport feature owns write authority; profiles reads raw table — MEDIUM risk)
- `content_pages` — INSERT/UPDATE/DELETE (profiles owns exclusively)
- `locksmith_*` tables — UPSERT/DELETE (profiles owns exclusively)
- `menu_categories`, `menu_items`, `menu_item_media` — INSERT/UPDATE/DELETE (profiles owns exclusively)
- `rates`, `services`, `service_addons` — UPSERT/DELETE (profiles owns exclusively)
- `vc.friend_ranks` — via RPCs get_friend_ranks and save_friend_ranks
- `vc.count_vport_subscribers` — RPC read
- `vc.list_vport_subscribers` — RPC read

**Sources:** ARCHITECTURE.md (Module Dependency Graph, Module Data Contract)

---

## §9 Must Never Happen — Security Invariants

Each invariant is anchored to a VENOM or BlackWidow finding. All findings status: OPEN (DRAFT). Adversarial results noted where BW confirmed bypass.

**INVARIANT-001:** Friend rank write operations must never use a URL-param-sourced actor ID as the write subject.
Violated by: VEN-PROFILES-002 (HIGH), BW-PROF-001 (CRITICAL — BYPASSED), BW-PROF-004 (HIGH — BYPASSED)

**INVARIANT-002:** A non-owner authenticated actor must never be able to create menu categories under another actor's vport profile.
Violated by: BW-PROF-002 (HIGH — BYPASSED — no assertActorOwnsVportActorController in CREATE path)

**INVARIANT-003:** A non-owner authenticated actor must never be able to create menu items under another actor's vport profile.
Violated by: BW-PROF-003 (HIGH — BYPASSED — no assertActorOwnsVportActorController in CREATE path)

**INVARIANT-004:** menu_category DELETE must never execute without actor ownership scope in the DB query.
Violated by: VEN-PROFILES-003 (HIGH — DAL uses .eq("id", categoryId) only), BW-PROF-006 (MEDIUM — PARTIAL, controller gate present)

**INVARIANT-005:** menu_item DELETE must never execute without actor ownership scope in the DB query.
Violated by: VEN-PROFILES-004 (HIGH — DAL uses .eq("id", itemId) only), BW-PROF-007 (MEDIUM — PARTIAL, controller gate present)

**INVARIANT-006:** locksmith_portfolio_details UPSERT must never resolve a conflict key that excludes actor ownership.
Violated by: VEN-PROFILES-005 (HIGH — onConflict: portfolio_item_id only), BW-PROF-008 (MEDIUM — PARTIAL, controller gate present)

**INVARIANT-007:** menu_item_media INSERT must never link media to a menu item not owned by the calling actor's vport profile.
Violated by: VEN-PROFILES-006 (MEDIUM — itemId passed unverified)

**INVARIANT-008:** list_vport_subscribers must never be returned to a caller without first applying the dalCanViewActorSignal privacy gate.
Violated by: VEN-PROFILES-007 (MEDIUM — DAL callable without controller privacy gate)

**INVARIANT-009:** locksmith_service_details UPSERT must never update a row identified solely by service_id without actor ownership validation in the conflict key.
Violated by: VEN-PROFILES-008 (MEDIUM — onConflict: service_id only), BW-PROF-009 (MEDIUM — PARTIAL)

**INVARIANT-010:** No console.error, console.log, or console.warn call may exist on any production code path, including inside DEV guards, within this feature.
Violated by: VEN-PROFILES-009 (LOW — console.error in upsertVportServices.controller.js)

**INVARIANT-011:** Public-facing profile URLs must never expose bare UUID actorIds. A slug resolution failure must not produce a raw UUID URL.
Violated by: BW-PROF-010 (HIGH — BYPASSED — buildActorCanonicalSlug.controller.js:89 UUID fallback)

**INVARIANT-012:** Post share URLs must never expose bare UUID postIds in any public-facing share link.
Violated by: BW-PROF-011 (HIGH — BYPASSED — useActorProfileActions.js:31 constructs /post/{postId})

**INVARIANT-013:** Post edit internal navigation routes must not use raw UUID postIds.
Violated by: BW-PROF-012 (MEDIUM — useActorProfileActions.js:80 navigates to /post/{postId}/edit)

---

## §10 Module Responsibilities

Modules identified from ARCHITECTURE.md layer map and index. Module-level specifics are UNKNOWN where module BEHAVIOR.md is STUB.

### Module: profile
**Responsibility (governance-derivable):** Canonical actor resolution, slug lookup, profile kind dispatch, and profile cache management. Routes any URL param (UUID, slug, "self", username) to the correct profile sub-view.
**Key files:** ActorProfileScreen.jsx, getProfileView.controller.js, resolveActorBySlug.controller.js, readActorProfile.dal.js, resolveActorSlug.dal.js, useProfileView.js, useProfileGate.js, useActorCanonicalSlug.js.
**Module BEHAVIOR.md status:** STUB — specific cache key format, profileCache.controller behavior, and slug resolution fallback logic are UNKNOWN.
**Sources:** ARCHITECTURE.md (Layer Map), modules/profile/BEHAVIOR.md (STUB)

### Module: vport
**Responsibility (governance-derivable):** Vport kind profile view and all vport kind-specific management screens — rates, services, menu, gas prices, locksmith, content pages, portfolio, reviews, subscriber counts. The "module-within-a-module" sub-system (kinds/vport/).
**Key files:** VportProfileKindScreen.jsx, VportProfileViewScreen.jsx, upsertVportRate.controller.js, and all kinds/vport controllers and DALs.
**Module BEHAVIOR.md status:** STUB — assertActorOwnsVportActorController call site verification and menu ownership enforcement path are UNKNOWN.
**Sources:** ARCHITECTURE.md (Purpose), modules/vport/BEHAVIOR.md (STUB)

### Module: friends
**Responsibility (governance-derivable):** Friend candidates display and top friend rank save via vc.friend_ranks RPCs.
**Key files:** friendRanks.write.dal.js, friendRanks.reconcile.dal.js, friends.read.dal.js, useSaveTopFriendRanks.js, TopFriendsRankEditor.jsx.
**Module BEHAVIOR.md status:** STUB — target table for friendRanks.write.dal, useSaveTopFriendRanks hook location, and confirmed invariants are UNKNOWN.
**Known security gap:** ownerActorId derived from useParams(), not session identity (BW-PROF-001, BW-PROF-004 — CRITICAL/HIGH THOR blockers).
**Sources:** modules/friends/BEHAVIOR.md (STUB), VENOM output (VEN-PROFILES-002)

### Module: social
**Responsibility (governance-derivable):** Posts tab (actor's public posts with media), follow state display, vibe tags on profile header.
**Module BEHAVIOR.md status:** STUB — post visibility filter (public vs. all), follow state read scope are UNKNOWN.
**Sources:** modules/social/BEHAVIOR.md (STUB)

### Module: photos
**Responsibility (governance-derivable):** Photo grid rendering from actor's post media. Photo tap navigates to post detail.
**Module BEHAVIOR.md status:** STUB — which DAL file serves photo data, visibility filtering details are UNKNOWN.
**Sources:** modules/photos/BEHAVIOR.md (STUB)

---

## §11 Known Gaps

### Documentation Gaps
- OWNERSHIP.md does not exist — no named team or individual owner for the largest feature in the platform. (ARCHITECTURE.md Module Completeness Matrix — Owner defined: FAIL)
- TESTS.md does not exist.
- ELEKTRA has never run on this feature. (SECURITY.md — ELEKTRA Status: NOT RUN)
- modules/vport/BEHAVIOR.md is STUB.
- modules/social/BEHAVIOR.md is STUB.
- modules/profile/BEHAVIOR.md is STUB.
- modules/friends/BEHAVIOR.md is STUB.
- modules/photos/BEHAVIOR.md is STUB.

### Runtime Gaps
- No retry or recovery UI when slug resolution fails — users are permanently redirected to /feed on transient DB errors. (ARCHITECTURE.md — Error state row)
- Three independent TTL caches (30s, 10min, 60s) cover overlapping profile data — stale state after updates is likely. (ARCHITECTURE.md — Cache behavior: WATCH)

### Test Coverage Gaps
- 12 test files cover DAL, controller, hook, and model units only.
- Zero screen-level or integration tests.
- No route render or tab transition test coverage.
- SPIDER-MAN P0 regression tests needed for BW-PROF-001, 002, 003, 004.
(Sources: ARCHITECTURE.md, INDEX.md test list, BW output §13)

### Security Gaps (Open THOR Blockers)
- VEN-PROFILES-002: Friend rank IDOR — ownerActorId from URL.
- BW-PROF-001: Friend rank IDOR BYPASSED adversarially — CRITICAL.
- BW-PROF-002: Menu category CREATE missing ownership gate.
- BW-PROF-003: Menu item CREATE missing ownership gate.
- BW-PROF-004: useSaveTopFriendRanks hook not session-bound.
- BW-PROF-010: Raw UUID in public profile URLs.
- BW-PROF-011: Raw UUID in post share URLs.

### Architecture Gaps
- useBlockStatus imported directly from `@/features/block` (not via adapter boundary) — LOW risk but violates adapter convention. (ARCHITECTURE.md — Module Boundary Warnings)
- No RPC ownership audit confirmed for vc.friend_ranks. (ARCHITECTURE.md — DB objects mapped row)
- No screen-level or integration tests — 221 screen entries, 0 screen tests. (ARCHITECTURE.md — Missing Pieces)
- The vport kinds sub-system (kinds/vport/) warrants its own dedicated architecture review. (ARCHITECTURE.md — Spaghetti Score)

---

## §12 Validation Sources

| Governance File | Status | Key Facts Extracted |
|---|---|---|
| ZZnotforproduction/APPS/VCSM/features/profiles/CURRENT_STATUS.md | READ | Architecture state: EVOLVING; Independence: DEPENDENT; Spaghetti: WATCH; Top gap: BEHAVIOR.md placeholder; 374 files, 12 engines, 30 write surfaces |
| ZZnotforproduction/APPS/VCSM/features/profiles/SECURITY.md | READ | 9 VENOM findings (5 HIGH, 3 MEDIUM, 1 LOW), 12 BW findings (1 CRITICAL, 6 HIGH, 5 MEDIUM), THOR blockers: VEN-PROFILES-002 + 6 BW findings, ELEKTRA never run |
| ZZnotforproduction/APPS/VCSM/features/profiles/ARCHITECTURE.md | READ | Full module architecture, layer counts, dependency graph, data contract, runtime readiness, boundary warnings, spaghetti score |
| ZZnotforproduction/APPS/VCSM/features/profiles/OWNERSHIP.md | DOES NOT EXIST | No declared owner |
| ZZnotforproduction/APPS/VCSM/features/profiles/TESTS.md | DOES NOT EXIST | No test governance documented |
| ZZnotforproduction/APPS/VCSM/features/profiles/INDEX.md | READ | 374 source files, 30 write surface operations, 12 engine dependencies, 12 test files (unit-level), 0 routes registered in feature |
| ZZnotforproduction/APPS/VCSM/features/profiles/modules/vport/BEHAVIOR.md | READ (STUB) | Expected behaviors unverified; ownership gap in vport controllers noted |
| ZZnotforproduction/APPS/VCSM/features/profiles/modules/social/BEHAVIOR.md | READ (STUB) | Expected behaviors unverified; post visibility filter unknown |
| ZZnotforproduction/APPS/VCSM/features/profiles/modules/profile/BEHAVIOR.md | READ (STUB) | Slug fallback UUID issue noted (THOR BLOCKER); post share URL UUID issue noted |
| ZZnotforproduction/APPS/VCSM/features/profiles/modules/friends/BEHAVIOR.md | READ (STUB) | ownerActorId from useParams() confirmed; BW-PROF-001 invariant unverified |
| ZZnotforproduction/APPS/VCSM/features/profiles/modules/photos/BEHAVIOR.md | READ (STUB) | Photo grid behavior unverified |
| ZZnotforproduction/APPS/VCSM/features/profiles/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_profiles-security-review.md | READ | 9 VENOM findings with full source verification, THOR impact analysis, mitigation plan |
| ZZnotforproduction/APPS/VCSM/features/profiles/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_profiles-adversarial-review.md | READ | 12 BW findings, 5 BYPASSED exploit chains, 4 PARTIAL, §9 invariant attack map, THOR impact |

---

## §13 THOR Release Status

**THOR Release Blocker: YES**

Blockers listed verbatim from SECURITY.md and confirmed by BW output §12:

| Blocker ID | Source | Severity | Description |
|---|---|---|---|
| VEN-PROFILES-002 | VENOM | HIGH | IDOR on friend rank writes — ownerActorId derived from URL param (useParams), not session identity |
| BW-PROF-001 | BLACKWIDOW | CRITICAL | IDOR on friend rank writes — ownerActorId has no session binding at controller layer; adversarially BYPASSED |
| BW-PROF-002 | BLACKWIDOW | HIGH | menu_categories CREATE has no assertActorOwnsVportActorController call; adversarially BYPASSED |
| BW-PROF-003 | BLACKWIDOW | HIGH | menu_items CREATE has no assertActorOwnsVportActorController call; adversarially BYPASSED |
| BW-PROF-004 | BLACKWIDOW | HIGH | useSaveTopFriendRanks hook accepts ownerActorId as external argument with no useIdentity() binding; adversarially BYPASSED |
| BW-PROF-010 | BLACKWIDOW | HIGH | Raw UUID exposed in public-facing profile URL when slug resolution fails; adversarially BYPASSED |
| BW-PROF-011 | BLACKWIDOW | HIGH | Raw postId (UUID) exposed in post share URLs; adversarially BYPASSED |

**Current THOR Status: BLOCKED**

Total blockers: 7 (1 CRITICAL, 6 HIGH).
ELEKTRA has not run — additional blockers may be identified once ELEKTRA executes.
All 7 blockers are OPEN (DRAFT) status.

**Required before next THOR evaluation:**
1. Fix BW-PROF-001/VEN-PROFILES-002: Bind ownerActorId to session identity in controller and hook.
2. Fix BW-PROF-002: Add assertActorOwnsVportActorController to menu category CREATE path.
3. Fix BW-PROF-003: Add assertActorOwnsVportActorController to menu item CREATE path.
4. Fix BW-PROF-004: Source ownerActorId from useIdentity() inside useSaveTopFriendRanks hook.
5. Fix BW-PROF-010: Eliminate raw UUID fallback in buildActorCanonicalSlug.controller.js:89.
6. Fix BW-PROF-011: Replace raw postId in share URL with slug-based identifier.
7. Run ELEKTRA for patch proposals on all DAL-layer scoping gaps.
8. Run DB to verify RLS on: menu_categories, menu_items, locksmith_portfolio_details, locksmith_service_details, save_friend_ranks RPC, list_vport_subscribers RPC.
9. Author SPIDER-MAN regression tests for all P0 BW findings before re-evaluation.
