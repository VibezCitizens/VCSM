# Module: Bottom Navigation Runtime — Native Parity

## ROBIN NATIVE PARITY REPORT

**Generated:** 2026-05-11
**Application Scope:** apps/VCSM
**Module:** Bottom Navigation Bar + all 7 button flows
**PWA Blueprint:** `shared/components/BottomNavBar.jsx` + per-button features
**ARCHITECT Source:** `architect/bottom-navigation-runtime-map.md` + `home-central-feed-runtime-map.md` + `bottom-navigation/vcsm.bottom-nav.*.architecture.md`
**Robin Scope:** iOS parity review only. Android deferred to Winter Soldier.

---

## Boundary Contract: ENFORCED

Protected roots confirmed. Scope: apps/VCSM read-only + native-transfer doc update only.
No PWA code modified. No native code modified.

---

## NATIVE COMMAND CENTER + ROADTRIP INDEX LOADED ✓

ROADTRIP_INDEX active path: `native-transfer/ROADTRIP_INDEX.md` (last updated: May 9, 2026)

**CRITICAL: ARCHITECT revealed PWA source drift in ROADTRIP.**
The feed module file (`modules/feed.md`) still lists `useFeed.js` as the DAL source. The PWA has replaced this with `useCentralFeed.js` + `fetchFeedPagePipeline`. ROADTRIP must be updated — see feed drift finding below.

---

## TRANSFER STATUS — ALL 7 BOTTOM NAV BUTTONS

### Button 1: HOME (/feed)

**Transfer Classification:** PARTIAL PARITY
**Confidence:** HIGH
**Blocking Issues:**
- PWA source is now `useCentralFeed.js` (React Query `useInfiniteQuery`) + `fetchFeedPagePipeline`. ROADTRIP feed.md cites `useFeed.js` — stale reference.
- 9 parallel Supabase reads per feed page not documented in native module.
- `vc.post_reactions` read twice per page (viewer reactions + aggregate counts) — need native verification.
- 300ms debounce → loop pattern for initial load (up to 2× pipeline calls) — native behavior unknown.

---

### Button 2: EXPLORE (/explore)

**Transfer Classification:** PARTIAL PARITY
**Confidence:** MEDIUM
**Blocking Issues:**
- PWA has 300ms debounce + 45s in-memory cache (120 entries) + inflight deduplication — native cache behavior unverified.
- PWA `localStorage.getItem('search:lastFilter')` persists filter between sessions — native persistence unknown.
- PWA `OnboardingCardsView` + `ExploreFeed` render in empty state — native empty state unknown.
- `videos` and `groups` filter tabs are dead (return `[]`) in PWA — confirm native doesn't attempt actual DB search for these.

---

### Button 3: VOX / CHAT (/chat)

**Transfer Classification:** PARTIAL PARITY
**Confidence:** MEDIUM
**Blocking Issues:**
- PWA inbox polls every 30s; badge polls every 30s — native polling intervals need parity verification.
- PWA BottomNavBar fires `noti:refresh` event on entering `/chat` route — native equivalent unknown.
- PWA Realtime intentionally disabled in inbox (comment in useChatInbox.js) — native has Realtime active; this is behavior DRIFT.
- Block DAL duplicated in PWA chat/inbox (known spaghetti) — confirm native uses canonical `moderation.blocks` path.

---

### Button 4: CREATE + (/upload)

**Transfer Classification:** PARTIAL PARITY
**Confidence:** MEDIUM
**Blocking Issues:**
- PWA uses FFmpeg WASM for video compression — native uses AVFoundation; behavior parity not verified for video compression quality/size.
- PWA `postAuthRollback.dal.js` exists for rollback if post write fails mid-flow — native rollback behavior unknown.
- PWA dual `controller/` + `controllers/` folder is a known spaghetti signal — both may be invoked; native must match the correct controller chain.
- `platform.media_assets` recording: build-verified in native but runtime not tested.

---

### Button 5: NOTIFICATIONS (/notifications)

**Transfer Classification:** PARTIAL PARITY
**Confidence:** HIGH (type cards verified) / MEDIUM (badge lifecycle)
**Blocking Issues:**
- PWA auto-marks notifications seen on inbox load (autoMarkSeen in DB) — native autoMarkSeen behavior needs parity.
- PWA `noti:refresh` window event fired when entering `/notifications` — native equivalent?
- PWA `MyAppointmentsView` rendered inside notifications screen for `user` kind actors — native has no equivalent section documented.
- PWA badge: `useNotificationUnread` polls every 60s via React Query — native badge polling interval needs verification.
- PWA `keepPreviousData` pattern (warm vs cold open skeleton) — native skeleton behavior unknown.

---

### Button 6: PROFILE (/profile)

**Transfer Classification:** PARTIAL PARITY
**Confidence:** MEDIUM
**Blocking Issues:**
- PWA profile tab uses `/profile/{slug}` route with 10min TTL slug cache — native profile route family unknown (uses `/u/` or `/profile/`?).
- PWA `ProfileNavTab.isActive` will NOT highlight on `/u/:username` or `/v/:slug` routes — confirm native tab active state matches correctly.
- PWA slug resolution waterfall: 7 distinct loading skeleton states before render — native loading states unknown.
- `PROFILE_KIND_REGISTRY` not read — full user/vport dispatch not traced from PWA side.

---

### Button 7: SETTINGS (/settings)

**Transfer Classification:** PARTIAL PARITY
**Confidence:** MEDIUM
**Blocking Issues:**
- PWA lazy-loads all settings tab views (privacy, profile, account, vports) — native presumably eager loads.
- PWA `queries/` folder (6 hook files) possibly dead post-refactor — if native was transferred from this stale path, behavior may be wrong.
- Privacy/block tab in PWA duplicates block.adapter internals — native block settings path needs audit.

---

## BOTTOM NAV LIFECYCLE — CRITICAL FINDING

**Classification:** RUNTIME DRIFT

PWA `BottomNavBar` is **always mounted** — CSS `display:none` hides it; it never unmounts.

**Consequence:**
- `useBootstrapHydration(actorId)` runs persistently — badge polling never resets between routes.
- `useNotificationUnread` (60s) and `useChatUnread` (30s) React Query polls run at all times.
- `useOneSignalPush()` fires once on identity hydration — never repeated.
- `VportLeadsChip` also always mounted alongside BottomNavBar.

**Native status:** INFERRED — Native iOS tab bar is always rendered as SwiftUI TabView — this is likely equivalent. But badge polling implementation (not React Query) must be verified for equivalent persistence across tab switches.

**Severity:** HIGH — If native recreates the tab bar on route change, badge polling restarts on every tab tap.

---

## NATIVE DRIFT FINDINGS

---

### NATIVE DRIFT FINDING 1

**Drift Type:** Data contract drift (feed source file)
**PWA Behavior:** Feed owned by `useCentralFeed.js` + `fetchFeedPagePipeline` (React Query `useInfiniteQuery`)
**Native Behavior:** ROADTRIP feed.md references `useFeed.js` as the DAL hook source — this file is superseded
**Risk:** Native transfer work may have been done against a stale PWA hook; the pipeline architecture (`fetchFeedPagePipeline` with 9 parallel reads) may not be fully represented in native `LiveFeedService.swift`
**Severity:** HIGH
**Recommended correction:** Update `feed.md` PWA source to `useCentralFeed.js` + `fetchFeedPage.pipeline.js`. Run LOKI to compare native feed fetch against PWA parallel read chain.

---

### NATIVE DRIFT FINDING 2

**Drift Type:** Runtime drift (feed: double reaction reads)
**PWA Behavior:** `vc.post_reactions` read twice per feed page — `readViewerReactionsBatch` (viewer reactions) + `readReactionCountsBatch` (aggregate counts + rose gifts)
**Native Behavior:** Unknown — native `LiveFeedService.swift` read chain not traced at this level
**Risk:** Native may read reaction data only once, missing either viewer state or aggregate counts
**Severity:** MEDIUM
**Recommended correction:** Verify native `LiveFeedService.swift` reads both reaction viewer state and aggregate counts per post batch.

---

### NATIVE DRIFT FINDING 3

**Drift Type:** Behavior drift (Realtime in chat inbox)
**PWA Behavior:** Realtime intentionally DISABLED in chat inbox — polling only (30s React Query refetch). Comment in `useChatInbox.js` explicitly documents this.
**Native Behavior:** Native has Realtime active in chat inbox per `chat-inbox.md`
**Risk:** Behavioral inconsistency — native users see messages in near-real-time while PWA users wait up to 30s; not a safety risk but a parity contract difference
**Severity:** LOW (not a safety risk, but a documented PWA behavior)
**Recommended correction:** Document the intentional divergence in `chat-inbox.md`. If PWA re-enables Realtime, native is already ahead. No native change needed — but ROADTRIP should document this is an intentional native improvement.

---

### NATIVE DRIFT FINDING 4

**Drift Type:** Cache drift (slug resolution)
**PWA Behavior:** `buildActorCanonicalSlugController` has a 10min TTL in-memory cache. Profile tab tap checks this cache synchronously; on hit → zero DB reads for profile navigation.
**Native Behavior:** No equivalent slug cache documented in native. Native profile navigation likely always goes through slug resolution.
**Risk:** Native profile tab is slower on repeat taps; 1 DB read per tap vs 0 in PWA after first visit
**Severity:** LOW (performance, not safety)
**Recommended correction:** KRAVEN — document native profile tap latency vs PWA. Consider native slug cache.

---

### NATIVE DRIFT FINDING 5

**Drift Type:** Behavior drift (explore filter persistence)
**PWA Behavior:** Selected filter tab persisted to `localStorage` via `localStorage.setItem('search:lastFilter', filter)`. Filter restored on next Explore open.
**Native Behavior:** Filter persistence behavior unknown. Native likely does not use localStorage — needs UserDefaults equivalent.
**Risk:** UX inconsistency — native users lose their filter preference on app relaunch
**Severity:** LOW (UX only)
**Recommended correction:** Confirm native persists explore filter via UserDefaults or equivalent.

---

### NATIVE DRIFT FINDING 6

**Drift Type:** Routing drift (profile tab isActive)
**PWA Behavior:** `ProfileNavTab.isActive` checks `location.pathname.startsWith('/profile')`. Profile at `/u/:username` or `/v/:slug` will NOT highlight the tab.
**Native Behavior:** Native tab bar highlights profile tab based on tab selection, not URL prefix — native likely correct by default
**Risk:** PWA has a known isActive bug; native is probably better. Document the divergence — PWA needs fix.
**Severity:** LOW for native (native is better); MEDIUM for PWA (known UX bug)
**Recommended correction:** Update ROADTRIP to note native tab highlighting is MORE correct than PWA. Flag PWA profile tab isActive as a PWA bug for IRONMAN.

---

### NATIVE DRIFT FINDING 7

**Drift Type:** Dead feature drift (explore tabs)
**PWA Behavior:** `videos` and `groups` filter tabs in Explore explicitly return `Promise.resolve([])` — dead features rendered silently
**Native Behavior:** Native filter chips — `groups` label was aligned to PWA "Districts" per explore-search.md. But runtime behavior for these tabs unknown.
**Risk:** Native may attempt actual DB reads for `videos`/`groups` filters that PWA intentionally no-ops
**Severity:** MEDIUM — if native fires DB reads for dead tabs, it's wasted traffic and a contract violation
**Recommended correction:** Verify native `groups`/`videos` filter paths return empty without DB calls. Align to PWA no-op behavior.

---

### NATIVE DRIFT FINDING 8

**Drift Type:** Feature drift (MyAppointmentsView in notifications)
**PWA Behavior:** NotificationsScreen for `user` kind actors shows a second tab: "Appointments" (`?view=appointments`) → `MyAppointmentsView` powered by `useMyAppointments` hook
**Native Behavior:** No `MyAppointmentsView` section documented in native notifications
**Risk:** Native missing a PWA feature (appointments tab in notifications) — incomplete product parity
**Severity:** MEDIUM (P1 product gap)
**Recommended correction:** Document gap in `notifications.md`. Determine if MyAppointmentsView is launch-critical.

---

## NATIVE TRUST BOUNDARY WARNINGS

---

### NATIVE TRUST BOUNDARY WARNING 1

**Location:** Feed visibility filtering — `LiveFeedService.swift` block/follow enrichment
**PWA enforcement:** Block and follow rows fetched per page batch; applied client-side via `buildBlockedActorSetModel` + `buildFollowedActorSetModel`; on lookup failure → feed page fails closed (throws, not silent empty)
**Native enforcement:** Build-verified fail-closed (throws on lookup failure) — ROADTRIP P0 checklist item confirmed
**Risk:** Runtime verification not yet complete. Block schema (`moderation.blocks`) column alignment confirmed build-side but not against live Supabase runtime.
**Severity:** HIGH — not yet runtime-verified
**Recommended correction:** Run LOKI feed runtime test against Supabase with a blocked actor in the feed. Verify blocked posts are hidden, not just slow.

---

### NATIVE TRUST BOUNDARY WARNING 2

**Location:** Explore search — `identity.search_actor_directory` RPC
**PWA enforcement:** `p_viewer_actor_id` passed to RPC — block-aware search at DB level
**Native enforcement:** `SupabaseClient.swift:1234` calls `search_actor_directory` — viewer actor ID passed (confirmed per ROADTRIP)
**Risk:** If viewer actor ID is null or stale during actor switch, search may expose private/blocked actors
**Severity:** HIGH — actor switch during search could return wrong actor's visibility
**Recommended correction:** Verify native search call refreshes `viewerActorId` from current session state, not a captured value.

---

### NATIVE TRUST BOUNDARY WARNING 3

**Location:** Badge polling — BottomNavBar always-mounted in PWA
**PWA enforcement:** `useBootstrapHydration(actorId)` resets store on `actorId` change — previous actor's badge counts are cleared before new actor's queries activate
**Native enforcement:** Unknown — native badge update mechanism not traced to actor-switch behavior
**Risk:** After actor switch (user → VPORT or VPORT → VPORT), native badges could show stale counts from the previous actor
**Severity:** HIGH — notification/chat badge actor leakage
**Recommended correction:** Verify native badge polling resets + restarts on actor switch. Confirm `actorId` change invalidates prior badge query.

---

### NATIVE TRUST BOUNDARY WARNING 4

**Location:** Notification inbox — autoMarkSeen
**PWA enforcement:** `getNotifications` controller triggers autoMarkSeen in DB on every inbox load. PWA then invalidates `notificationUnread` query key — badge drops to 0 immediately after inbox is viewed.
**Native enforcement:** Unknown — autoMarkSeen behavior in native `LiveNotificationsService.swift` not verified
**Risk:** If native does not mark notifications seen on inbox open, badge count may never clear
**Severity:** HIGH — broken trust signal: user thinks they have new notifications they've already seen
**Recommended correction:** Verify native marks notifications seen on inbox open and triggers badge refresh.

---

### NATIVE TRUST BOUNDARY WARNING 5

**Location:** Profile navigation — `getCachedActorCanonicalSlug` (PWA) vs native profile route
**PWA enforcement:** Profile navigation uses a 10min TTL controller cache. Cache miss triggers `vport.public_actor_seo_v` read + ActorSeoModel slug construction.
**Native enforcement:** Native profile navigation mechanism unknown — if native passes raw actorId in URLs, it may expose internal UUIDs in navigation history
**Risk:** Per project memory: "Raw UUIDs must never appear in public-facing URLs"
**Severity:** HIGH — UUID exposure in navigation if native doesn't use slug routing
**Recommended correction:** Verify native profile navigation uses slug-based routes not raw UUID-based routes. Confirm native does not expose `actor_id` in deep links or shared URLs.

---

## NATIVE MODULE COMPLETENESS — BOTTOM NAV RUNTIME

| Area | Home (Feed) | Explore | Vox (Chat) | Upload | Notifications | Profile | Settings |
|---|---|---|---|---|---|---|---|
| Screens | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| View models/hooks | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| Controllers/services | PARTIAL | PARTIAL | PARTIAL | RISKY | PARTIAL | PARTIAL | PARTIAL |
| DTO/data mapping | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PASS | PARTIAL | PARTIAL |
| Supabase/RPC integration | RISKY | PASS | PARTIAL | RISKY | PARTIAL | PARTIAL | PARTIAL |
| Loading states | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| Empty states | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| Error states | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| Moderation states | RISKY | N/A | PARTIAL | N/A | N/A | N/A | N/A |
| Owner states | PARTIAL | N/A | N/A | PARTIAL | N/A | PASS | PASS |
| Booking states | N/A | N/A | N/A | N/A | PARTIAL | N/A | N/A |
| Cache/runtime handling | PARTIAL | FAIL | PARTIAL | PARTIAL | PARTIAL | FAIL | PARTIAL |
| Feature gates | N/A | PARTIAL | N/A | N/A | N/A | N/A | N/A |
| Deep links | PARTIAL | PARTIAL | PARTIAL | N/A | PARTIAL | RISKY | N/A |
| Documentation | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL |
| Runtime testing notes | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL |

---

## NATIVE RUNTIME PARITY REVIEW

| Runtime Area | PWA | Native | Drift | Severity |
|---|---|---|---|---|
| Feed data source | `useCentralFeed.js` + `fetchFeedPagePipeline` | `LiveFeedService.swift` | ROADTRIP references stale `useFeed.js` | HIGH |
| Feed parallel reads | 9 parallel Supabase reads per page | Unknown parallelization in service | INFERRED drift | MEDIUM |
| Feed reaction reads | vc.post_reactions read TWICE per page | Unknown — 1 or 2 reads? | INFERRED partial | MEDIUM |
| Feed safety (fail-closed) | throws on block/follow failure | Build-verified throws | ALIGNED (runtime unverified) | HIGH pending test |
| Feed cache | React Query staleTime 30s, gcTime 10min | Unknown iOS cache strategy | RUNTIME DRIFT risk | MEDIUM |
| Feed mention rows | Conditional: only if @ present in text | Unknown conditional | INFERRED drift | LOW |
| Feed pipeline loop | Up to 2× pipeline calls on initial load | Unknown — single call? | INFERRED drift | MEDIUM |
| Explore debounce | 300ms client-side | Unknown | INFERRED drift | LOW |
| Explore result cache | 45s in-memory Map (120 entries) | Unknown | INFERRED missing | MEDIUM |
| Explore filter persistence | localStorage `search:lastFilter` | Unknown (UserDefaults?) | INFERRED drift | LOW |
| Explore dead tabs | videos/groups return `[]` | Unknown — may attempt DB reads | RUNTIME DRIFT risk | MEDIUM |
| Chat inbox realtime | DISABLED (polling only, 30s) | ACTIVE realtime | INTENTIONAL DRIFT | LOW (noted) |
| Chat badge poll | 30s React Query | Unknown iOS interval | INFERRED drift | MEDIUM |
| Noti badge poll | 60s React Query | Unknown iOS interval | INFERRED drift | MEDIUM |
| Noti autoMarkSeen | On inbox load (DB trigger) | Unknown | INFERRED drift | HIGH |
| Noti MyAppointments | Tab for `user` kind actors | Missing | FEATURE DRIFT | MEDIUM |
| Profile slug cache | 10min TTL controller cache | Unknown | INFERRED missing | LOW |
| Profile tab active | Only `/profile` prefix highlights tab | Tab bar always correct | NATIVE BETTER | LOW |
| Profile UUID exposure | Slug-based routes only | Unknown | SECURITY risk | HIGH |
| Badge lifecycle | Always-mounted polling never stops | Unknown on tab switch | RUNTIME DRIFT risk | HIGH |
| Badge actor switch | Reset on actorId change | Unknown reset behavior | TRUST BOUNDARY risk | HIGH |
| Upload video compress | FFmpeg WASM (client) | AVFoundation (native) | Platform-appropriate | LOW |
| Upload rollback | `postAuthRollback.dal.js` | Unknown rollback path | INFERRED missing | MEDIUM |
| Settings tabs | Lazy-loaded (Suspense) | Likely eager-loaded | Behavior drift | LOW |

---

## NATIVE OWNERSHIP MAP

| Area | PWA Owner | Native Owner | Shared Engine | Risk |
|---|---|---|---|---|
| Bottom nav bar | `shared/components/BottomNavBar.jsx` | Native TabView | None | Runtime lifecycle divergence |
| Badge polling | `bootstrap.selectors.js` + `bootstrap.store` | `LiveNotificationsService` + `InboxService` | None | Actor switch reset unverified |
| Feed pipeline | `feed/pipeline/fetchFeedPage.pipeline.js` | `LiveFeedService.swift` | None | Source drift in ROADTRIP |
| Explore search | `explore/controller/searchResults.controller.js` | `LiveFeedService.swift` (co-located) | None | Explore co-located with feed service in native — architecture drift |
| Chat badge | `bootstrap.selectors.js` → `chat.adapter` | Unknown iOS service | `@chat` engine (PWA) | Native must match actor scoping |
| Notification badge | `bootstrap.selectors.js` → `notifications.adapter` | `LiveNotificationsService` | `@notifications` engine (PWA) | Actor scope on switch |
| Profile slug | `buildActorCanonicalSlugController.js` | Unknown (no slug cache) | None | UUID exposure risk |
| Upload media | `@media` engine + `createMediaAsset.controller.js` | `LivePostComposerService.swift` + `CloudflareUploadService` | `@media` engine (PWA) | Build-verified, runtime unverified |

---

## NATIVE PRIORITY MATRIX

| Priority | Module | Gap | Reason | Owner |
|---|---|---|---|---|
| P0 | Feed pipeline | ROADTRIP cites stale `useFeed.js`; `fetchFeedPagePipeline` with 9 parallel reads not verified in native | Runtime regression risk; feed is the home screen | LOKI + KRAVEN |
| P0 | Badge actor switch | Badge polling reset behavior on actor switch unverified | Trust boundary — cross-actor badge leakage | VENOM |
| P0 | Notification autoMarkSeen | Native autoMarkSeen on inbox open unverified | Badge never clears if missing | LOKI |
| P0 | Profile UUID exposure | Profile deep links may expose raw actorId in native | Privacy contract: raw UUIDs must not appear in URLs | VENOM |
| P0 | Feed: block visibility runtime | Build-verified fail-closed; runtime against live Supabase unverified | Safety: blocked actor content may appear | LOKI |
| P1 | Explore search cache | 45s in-memory cache + inflight dedup not in native | Performance + UX parity | KRAVEN |
| P1 | Explore dead tabs | `videos`/`groups` tabs may fire DB reads in native | Wasted traffic + contract violation | IRONMAN |
| P1 | Notifications MyAppointments | Appointments tab for user actors missing in native | Product parity gap | IRONMAN |
| P1 | Chat inbox Realtime vs polling | Intentional drift — native has Realtime active; PWA intentionally disabled | Document + align strategy | IRONMAN |
| P1 | Upload rollback | `postAuthRollback.dal.js` — native rollback path unknown | Data integrity: orphaned posts without media | IRONMAN |
| P2 | Profile slug cache | Native lacks 10min TTL slug cache for zero-DB profile nav | Performance only | KRAVEN |
| P2 | Explore filter persistence | Filter tab not persisted in native (no UserDefaults equivalent) | UX only | IRONMAN |
| P2 | Settings lazy-load | PWA lazy-loads tabs; native likely eager | Performance only | KRAVEN |
| P3 | Feed: double reaction reads | `vc.post_reactions` read twice per page in PWA | Potential native optimization opportunity | KRAVEN |
| P3 | ROADTRIP feed.md source update | `useFeed.js` → `useCentralFeed.js` + `fetchFeedPage.pipeline.js` | Documentation accuracy | LOGAN |

---

## NATIVE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc — bottom nav | None | MISSING |
| Logan doc — feed pipeline | None | MISSING |
| ROADTRIP feed module | `native-transfer/modules/feed.md` | PRESENT — STALE (cites useFeed.js) |
| ROADTRIP explore module | `native-transfer/modules/explore-search.md` | PRESENT — PARTIAL |
| ROADTRIP notifications module | `native-transfer/modules/notifications.md` | PRESENT — PARTIAL |
| ROADTRIP chat module | `native-transfer/modules/chat-inbox.md` | PRESENT — PARTIAL |
| ROADTRIP upload/composer module | `native-transfer/modules/composer-upload.md` | PRESENT — RISKY |
| ROADTRIP settings module | `native-transfer/modules/settings.md` | PRESENT — PARTIAL |
| ROADTRIP identity module | `native-transfer/modules/identity.md` | PRESENT — PARTIAL |
| SENTRY review — bottom nav | None | MISSING |
| VENOM review — trust boundaries | `audits/security/2026-05-10_venom-robin_*` | PRESENT (vport/dashboard) — bottom nav not covered |
| THOR release gate | None | MISSING |
| LOKI runtime audit — feed | None | MISSING |
| LOKI runtime audit — notifications | None | MISSING |
| KRAVEN performance — feed pipeline | None | MISSING |
| Architecture audit — bottom nav | `architect/bottom-navigation-runtime-map.md` | PRESENT (this session) |

---

## NATIVE RELEASE GATE

| Module | Status | Blocking Risk | Required Follow-Up |
|---|---|---|---|
| Home / Feed | CAUTION | Feed pipeline stale in ROADTRIP; runtime parity unverified for 9-read chain | LOKI runtime test; update feed.md |
| Explore | CAUTION | Dead tabs may fire DB reads; cache drift; explore co-located in feed service | IRONMAN dead tab audit; LOKI search runtime |
| Vox / Chat | CAUTION | Realtime vs polling drift documented; moderation cover runtime unverified | LOKI runtime; document intentional drift |
| Create / Upload | CAUTION | Rollback path unknown; `platform.media_assets` runtime unverified | LOKI Cloudflare upload test; rollback audit |
| Notifications | BLOCKED | autoMarkSeen unverified; MyAppointments missing; badge actor switch unverified | LOKI autoMarkSeen test; IRONMAN appointments gap |
| Profile | BLOCKED | UUID exposure risk in native deep links/routes unknown; slug cache absent | VENOM deep link audit; LOKI profile nav test |
| Settings | CAUTION | Sub-view DAL chains not traced; lazy-load vs eager-load behavior drift | LOKI settings runtime |
| Badge lifecycle | BLOCKED | Actor switch badge reset unverified — cross-actor badge leakage risk | VENOM trust audit; LOKI actor switch test |

---

## FINAL ROBIN STATUS: CAUTION (3 BLOCKED areas)

**Blocked areas:**
1. Notifications — autoMarkSeen + MyAppointments gap + badge actor switch
2. Profile — UUID exposure risk + native route family unknown
3. Badge lifecycle — actor switch reset behavior unverified

**Cleared for runtime testing (not blocked):**
- Home/Feed, Explore, Chat, Upload, Settings — CAUTION only, no hard blockers

---

## SENTRY PARITY REVIEW

**Required:** YES
**Scope:** Native architecture for badge lifecycle + explore co-location in feed service
**Timing:** Before next native release batch
**Reason:**
- Explore logic is co-located inside `LiveFeedService.swift` in native — this is an architecture drift from PWA where explore is its own feature module (`features/explore/`)
- Badge polling actor switch reset is a trust-boundary concern requiring boundary review
- Native `LiveFeedService.swift` needs SENTRY review to confirm parallel read chain matches PWA `fetchFeedPagePipeline` contract

---

## ROBIN → WINTER SOLDIER HANDOFF

**Module:** Bottom Navigation Runtime (all 7 buttons)
**PWA Blueprint:** `architect/bottom-navigation-runtime-map.md` + `home-central-feed-runtime-map.md`
**Transfer Classification:** PARTIAL PARITY (iOS) — Android status unknown

**Known Drift Areas:**
- Feed: ROADTRIP cites stale source (`useFeed.js`); `fetchFeedPagePipeline` is the current pipeline
- Feed: `vc.post_reactions` read twice per page — Android must match both reads
- Explore: in-memory 45s cache + inflight deduplication pattern — Android must implement or document absence
- Explore: `videos` + `groups` filter tabs are dead in PWA (return `[]`) — Android must not fire DB reads for these
- Chat: Realtime vs polling — PWA inbox is polling-only (30s); iOS has Realtime; Android TBD
- Notifications: autoMarkSeen on inbox open; MyAppointmentsView for user actors; 60s badge poll
- Profile: slug-based routing; 10min TTL slug cache; no UUID in URLs/deep links
- Badge: always-mounted polling; actor switch reset required

**Trust-Boundary Risks:**
- Badge actor switch reset — applies equally to Android
- Profile UUID exposure — deep link contract applies equally to Android
- Feed block visibility fail-closed — must verify on Android
- Notification autoMarkSeen — applies equally to Android
- Explore search actor ID passed to `search_actor_directory` — applies equally

**Runtime Risks:**
- Feed pipeline: 10+ Supabase reads per page (1 serial + 9 parallel)
- Explore: search fires 2 parallel queries per text search (text + tag)
- Notification badge: 60s poll + immediate invalidation on inbox open

**Booking Risks:** None for bottom nav specifically — booking is VPORT dashboard scope

**Lifecycle Risks:**
- Badge polling must survive Android lifecycle (background/foreground transitions)
- Push token (OneSignal) init must trigger after identity hydration on Android

**Ownership Risks:**
- Explore co-located in feed service in iOS native — Android architecture unknown
- No Logan docs exist for any bottom nav module on either platform

**Required Android Follow-Up:**
1. Map Android TabBar / bottom nav implementation — does it always stay mounted?
2. Verify Android feed service parallel read chain vs `fetchFeedPagePipeline`
3. Verify Android explore dead tab behavior
4. Verify Android badge polling intervals match (notifications 60s, chat 30s)
5. Verify Android autoMarkSeen on notification inbox open
6. Verify Android profile navigation uses slug routes not raw UUID
7. Document Android explore/search cache strategy

**Recommended Priority:** P0 — badge actor switch, profile UUID exposure, feed pipeline parity
**Related Governance Reports:** `architect/bottom-navigation-runtime-map.md`, `architect/home-central-feed-runtime-map.md`, `native-transfer/modules/feed.md`, `native-transfer/modules/notifications.md`

---

## WINTER SOLDIER HANDOFF STATUS: GENERATED

---

## CROSS-PLATFORM DRIFT MATRIX — BOTTOM NAV

| Area | PWA | iOS | Android | Drift Severity |
|---|---|---|---|---|
| Tab bar mount strategy | Always mounted (CSS hide) | Always rendered (SwiftUI TabView) | UNKNOWN | MEDIUM |
| Feed pipeline (reads per page) | 10+ (1 serial + 9 parallel) | PARTIALLY matched (runtime unverified) | UNKNOWN | HIGH |
| Explore search cache | 45s in-memory + inflight dedup | MISSING | UNKNOWN | MEDIUM |
| Chat inbox realtime | DISABLED (30s poll) | ACTIVE realtime | UNKNOWN | LOW (noted) |
| Badge polling (noti) | 60s React Query | INFERRED implemented | UNKNOWN | HIGH |
| Badge polling (chat) | 30s React Query | INFERRED implemented | UNKNOWN | HIGH |
| Badge actor switch reset | React Query key change | UNVERIFIED | UNKNOWN | HIGH |
| Profile URL encoding | Slug-based only | UNVERIFIED | UNKNOWN | HIGH |
| autoMarkSeen on inbox open | YES (DB trigger) | UNVERIFIED | UNKNOWN | HIGH |
| MyAppointmentsView | YES (user kind only) | MISSING | UNKNOWN | MEDIUM |
| Dead filter tabs (explore) | Return `[]` silently | UNVERIFIED | UNKNOWN | MEDIUM |
| Upload video compress | FFmpeg WASM | AVFoundation | MediaCodec/exo? | LOW (platform-appropriate) |
| Upload rollback | `postAuthRollback.dal.js` | UNKNOWN | UNKNOWN | MEDIUM |
| Slug cache (profile nav) | 10min TTL controller cache | MISSING | UNKNOWN | LOW |
