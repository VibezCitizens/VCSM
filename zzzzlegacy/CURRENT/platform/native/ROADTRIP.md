> **This file has been split into modular trackers. Start at [native-transfer/ROADTRIP_INDEX.md](native-transfer/ROADTRIP_INDEX.md).**
> This consolidated file is preserved for history. Do not use it as the active source of truth for transfer work.

---

# ROADTRIP
**Permanent VCSM Web/PWA → Native iOS Transfer Tracker**

Updated: May 3, 2026. This file is the single source of truth for tracking Web/PWA behavior that has been transferred to native iOS.

Scope: documentation-only update. No app code was changed by this ROADTRIP tracker refresh.

---

## Canonical Project Paths

| Role | Path |
|---|---|
| Web/PWA source of truth | `/Users/vcsm/Desktop/VCSM/apps/VCSM` |
| Native iOS app | `/Users/vcsm/Documents/New project/native/VCSMNativeApp` |
| Shared native core | `/Users/vcsm/Documents/New project/native/VCSMNativeCore` |
| ROADTRIP document (original) | `/Users/vcsm/Desktop/MAGES/ROADTRIP.docx` |

> **Important correction:** `/Users/vcsm/Desktop/VCSM/apps/VCSM` is the Web/PWA app, not the native app. Native code lives under the native paths above.

> **Route inventory note:** Prior audit recorded 71 NativeAppRoute cases. A read-only recheck during this tracker refresh found 67 explicit case lines in `NativeAppRoute.swift`. Recount after any native route edits and update this note.

---

## How To Keep This File Updated

- When PWA behavior changes, update the affected Module section **before** starting native transfer work.
- Add the changed PWA route/screen/service/schema/RLS details to that module's **Future PWA Update Log**.
- Do **not** mark Native Transfer Status as `Complete` unless current native files prove the route, screen, service/DAL behavior, and schema usage are present.
- Use `Partial` when UI exists but a behavior, route, schema path, RLS assumption, or fallback behavior is not fully aligned.
- Use `Risky` when behavior exists but can fail open, uses a stale schema/table, bypasses canonical RPCs, or is feature-gated off.
- Preserve old audit notes under **Archived / Historical ROADTRIP Snapshot** — do not delete history.
- Every native implementation batch should start by copying the module checklist items into the Codex prompt and listing files that must not be touched.

---

## Status Legend

| Status | Meaning |
|---|---|
| `Complete` | Native files prove the module has route/screen/service behavior and schema usage matching the PWA source for launch needs. |
| `Partial` | Native has meaningful transferred files/behavior but at least one route, screen, service, schema path, or edge case is missing. |
| `Missing` | Native has no meaningful implementation for the module. |
| `Risky` | Native has implementation, but a security, RLS, schema, fail-open, feature-gate, or production behavior risk remains. |
| `Not Started` | No native transfer work is known/proven yet. |

---

## Native vs PWA Parity Summary

| Module | PWA status | Native status | Primary remaining gap/risk |
|---|---|---|---|
| Auth callback / PKCE / session restore | Complete source flow | Risky | PKCE verifier persistence, ASWebAuthenticationSession, /welcome, legal fail-open |
| Identity engine / actor switching / VPORT switching | Complete source engine | Partial | Actor graph parity and route refresh after switch |
| Feed pipeline | Complete source pipeline | Risky | Visible target cap and fail-open block/follow safety |
| Post card | Complete PostCard suite | Partial | Visual/action parity |
| Post detail / comments / reactions | Complete detail flow | Partial | Nested/comment/reaction parity and safety filtering |
| Composer / upload / media picker / compression | Complete upload/media flow | Risky | Duplicate Cloudflare path and media_assets parity |
| Notifications / badges / realtime fallback | Complete notification runtime | Partial | Type cards, badge actor scope, push token RLS |
| Explore / search | Complete search UI/RPC | Partial | Wanders disabled and tab/card parity |
| Settings | Complete account/privacy/VPORT | Risky | Direct VPORT delete fallback and schema drift |
| Social follow / subscribe flows | Complete social flows | Partial | Follow/request/subscriber parity |
| Moderation / report / block flows | Moderation schema/RPC source | Risky | Native vc table writes vs PWA moderation path |
| Public VPORT profile | Complete public/profile routes | Partial | /vport/:slug/card placeholder |
| Public menu | Complete public menu source | Partial | vc_public vs vport public view contract check |
| Reviews | Complete reviews views/RPCs | Partial | Write RPC and QR/details parity |
| Booking / resources relationship | Complete booking relationship source | **Complete** | Keep relationship names synced |
| Dashboard routes | Complete route list | Partial | Missing leads, team, team-requests, schedule |
| Wanders | Complete large PWA module | Risky | Native feature gate disabled |
| Chat / inbox | Complete chat/inbox | Partial | Media messages, folder parity, moderation mismatch |
| Supabase schema usage: vc | Heavily used | Risky | Legacy vc.vports and moderation-table mismatch |
| Supabase schema usage: vport | Canonical VPORT profile schema | Partial | Native legacy/public-view alignment |
| Supabase schema usage: reviews | Explicit reviews schema | Partial | Write/view key parity |
| Supabase schema usage: platform | Identity/legal/media source | Partial | media_assets and legal hardening |
| RLS-compatible authenticated access | Protected-route source | Risky | Route guard classification and fail-closed rules |

---

## Exact File-by-File Findings

| Priority | File / lines | Finding | Why it matters |
|---|---|---|---|
| P0 | `VCSMNativeApp/Services/Feed/LiveFeedService.swift:29` | Feed under-fetch | `visibleTarget` caps initial page to 3 and pagination to 1. |
| P0 | `VCSMNativeApp/Services/Feed/LiveFeedService.swift:195-213` | Safety fail-open | Block/follow lookup failures can become empty sets/maps. |
| P0 | `VCSMNativeApp/Services/Auth/LiveAuthService.swift:423-450` | PKCE risk | Code exchange depends on URL `code_verifier`; no persisted verifier found. |
| P0 | `VCSMNativeApp/Session/SessionStore.swift:365-391` | Legal gate risk | Legal gate can fail open into signed-in state on error. |
| P0 | `VCSMNativeApp/Services/Supabase/SupabaseClient.swift`, `SafetyReads.dal.swift` | Block schema aligned 2026-05-03 | Native scoped paths use `moderation.block_actor`/`moderation.unblock_actor` and read current `moderation.blocks` columns without `id`; runtime testing remains. |
| P0 | `VCSMNativeApp/Services/Supabase/SupabaseClient.swift` | Report schema aligned 2026-05-03 | Native scoped paths write `moderation.reports`/`moderation.report_events`; runtime testing remains. |
| P0 | `VCSMNativeApp/Services/Supabase/SupabaseClient.swift`, `ProfileReads.dal.swift`, `ProfileHandleReads.dal.swift` | Actor directory schema aligned 2026-05-03 | Native no longer reads retired `vc.actor_presentation`; runtime Explore/Profile/Chat search testing remains. |
| P0 | `VCSMNativeApp/Services/Supabase/SupabaseClient.swift`, `NotificationsView.swift` | Notification schema aligned 2026-05-03 | Native no longer reads/writes retired `vc.notifications`; runtime notification testing remains. |
| P0 | `VCSMNativeApp/Services/Settings/LiveSettingsService.swift:321-330` | VPORT delete fallback | Native falls back to direct delete after RPC failure. |
| P0 | `VCSMNativeApp/Navigation/AppRouteParser.swift:65-67` | /welcome parity | Native maps `/welcome` into onboarding while PWA has a dedicated `WelcomeScreen`. |
| P1 | `apps/VCSM/src/app/routes/protected/app.routes.jsx:204-213` | Dashboard route gap | PWA has leads, team, team-requests, schedule routes missing from native parser/routes. |
| P1 | `VCSMNativeApp/App/AppRootView.swift:195` | Business-card placeholder | `/vport/:slug/card` is documented as placeholder to public menu. |
| P1 | `VCSMNativeApp/Services/Composer/LivePostComposerService.swift:204-245` | Upload duplication | Composer owns Cloudflare upload path instead of shared fallback service. |
| P1 | `VCSMNativeCore/Sources/VCSMNativeCore/NativeFeatureGate.swift:5` | Wanders disabled | Wanders files/routes exist but runtime gate is `false`. |

---

## Risky Supabase Queries / Relationship Names

- **Block/unblock:** PWA uses `moderation.block_actor` / `moderation.unblock_actor` RPCs; native scoped paths are build-verified on `moderation` RPC/schema. Runtime testing remains.
- **Reports:** PWA writes `moderation.reports` and `moderation.report_events`; native scoped paths are build-verified on `moderation` schema. Runtime testing remains.
- **Actor directory:** Current runtime source is `identity.actor_directory` / `identity.search_actor_directory`; do not reintroduce retired `vc.actor_presentation`.
- **Notifications:** Current runtime source is `notification.inbox_full_view`, `notification.recipients`, and `notification.inbox_items`; do not reintroduce retired `vc.notifications`.
- **Feed safety:** block/follow/actor privacy failures must not silently fail open into visible content.
- **VPORT profile source:** PWA `vport.core.dal` states `vport.profiles` is canonical and legacy `vc.vports` is no longer used for core VPORT records. Native direct `vc.vports` delete fallback is risky.
- **Public menu:** PWA public menu source uses `vport` public read models; native uses `vc_public.vport_menu_public` / `vc_public.vports_public`. Confirm these are supported aliases before changing either side.
- **Reviews:** Public reviews must stay on `reviews` public views; review writes must use the approved reviews RPC/function and prevent owner self-review.
- **Booking:** Keep `booking_resources`, `booking_resource_services`, `booking_service_profiles`, `booking_availability_*` relationship names stable across PWA and native.
- **Platform media:** Uploads must record `platform.media_assets` with `platform.apps` UUID `app_id` and then link `vc.post_media`/chat attachment rows.

---

## Missing Native Screens / Routes Compared to PWA Roadmap

- Dedicated `/welcome` native screen; current native maps `/welcome` into onboarding.
- Dashboard leads route/screen: `/actor/:actorId/dashboard/leads`
- Dashboard team route/screen: `/actor/:actorId/dashboard/team`
- Dashboard team requests route/screen: `/actor/:actorId/dashboard/team-requests`
- Dashboard schedule route/screen: `/actor/:actorId/dashboard/schedule` (unless intentionally replaced by native calendar route)
- Dedicated `/vport/:slug/card` native public business-card route/screen; current native uses public menu placeholder.
- Wanders runtime access; files/routes exist, but `NativeFeatureGate` disables user access.
- Full PWA-style public/marketing/legal routes are not tracked as launch-critical native routes unless required by App Store/legal product decisions.

---

## Next Native Transfer Batch

### P0 — Launch Blockers First

- [ ] Fix auth callback/PKCE verifier persistence and production callback handling.
- [ ] Harden legal consent gate so it does not fail open into signed-in state.
- [ ] Fix feed page-size cap and block/follow/privacy fail-open behavior.
- [ ] Align native block/report writes with PWA moderation RPC/schema.
- [ ] Remove direct VPORT delete fallback after RPC path verification.
- [ ] Unify composer upload through shared Cloudflare upload service and `platform.media_assets` recording.

### P1 — Product Parity Second

- [ ] Add dedicated `/welcome` native screen or formally document the onboarding mapping.
- [ ] Add dashboard route parity for leads, team, team-requests, and schedule.
- [ ] Implement `/vport/:slug/card` public business-card route/screen.
- [ ] Complete notification type card parity and badge actor-scope tests.
- [ ] Finish social follow/subscribe state, counts, and follow request parity.
- [ ] Complete public VPORT profile/menu/reviews parity checks.
- [ ] Bring Wanders to runtime parity before enabling feature gate.

### P2 — Nice-To-Have Last

- [ ] Ads/VPORT ads polish beyond existing native VPortAds files.
- [ ] Professional workspace parity beyond current native placeholder/substantial start.
- [ ] Flyer builder/design studio advanced parity after core launch risks are closed.
- [ ] Full SEO/PWA-only web surface parity only if native product requirements demand it.

---

## Files That Should Be Changed First

```
VCSMNativeApp/Services/Auth/LiveAuthService.swift
VCSMNativeApp/Session/SessionStore.swift
VCSMNativeApp/Services/Feed/LiveFeedService.swift
VCSMNativeApp/Services/Supabase/SupabaseClient.swift  ← only scoped block/report/delete/upload-related methods
VCSMNativeApp/Services/Settings/LiveSettingsService.swift
VCSMNativeApp/Services/Composer/LivePostComposerService.swift
VCSMNativeApp/Services/Cloudflare/CloudflareUploadService.swift
VCSMNativeApp/Navigation/AppRouteParser.swift         ← only after route additions are approved
VCSMNativeCore/Sources/VCSMNativeCore/NativeAppRoute.swift  ← only after route additions are approved
```

---

## Do Not Touch Without Approval

| Path | Reason |
|---|---|
| `VCSMNativeApp/Features/Booking/*` | Appears complete/substantial; only touch for booking-specific transfer work or schema drift. |
| `VCSMNativeApp/Features/Chat/*` and `Features/Inbox/*` | Substantial runtime; avoid broad rewrites, make focused parity fixes. |
| `VCSMNativeApp/Features/Dashboard/*` | Large working surface; add missing routes/screens surgically. |
| `VCSMNativeApp/Features/Profile/*` | Broad profile surface; avoid unrelated refactors while fixing public VPORT/social gaps. |
| `VCSMNativeApp/Features/PublicMenu/*` | Substantial; do not rename public view/model fields without schema confirmation. |
| `VCSMNativeApp/Services/Supabase/SupabaseClient.swift` | Central DAL; change only scoped methods with before/after query notes. |
| `VCSMNativeCore/Sources/VCSMNativeCore/NativeAppRoute.swift` | Shared route contract; do not add/delete/rename route cases without route audit. |
| `VCSMNativeCore/Sources/VCSMNativeCore/NativeFeatureGate.swift` | Do not enable Wanders gate until runtime parity is verified. |
| `apps/VCSM/src/features/*` | PWA is source of truth for this tracker task; do not change PWA code while updating ROADTRIP. |

---

## PWA Change Template

Copy/paste this after future PWA work and fill it in before starting native transfer.

> **Primary target:** Always update the affected `native-transfer/modules/<module>.md` first. Update `ROADTRIP_INDEX.md` only if module status/priority/parity changes. Update this file only if the monolithic baseline needs correction.

- Date:
- Module:
- Change type: Feature / Fix / Schema / UI / RLS
- PWA files changed:
- Routes affected:
- Screens/components changed:
- Services/DAL changed:
- Behavior change:
- Supabase schema/RPC change:
- RLS expectations changed:
- Affected native modules:
- Priority: P0 / P1 / P2
- Native status: Not started / Partial / Risky / Complete
- Testing notes:
- Notes:

---

## Suggested Next Codex Prompt

> You are working in my native iOS project. Use ROADTRIP as the source of truth. Implement only the first P0 transfer batch: auth callback/PKCE/session restore, legal gate hardening, feed page-size + fail-closed visibility, moderation block/report schema alignment, direct VPORT delete fallback removal, and composer upload unification. Read ROADTRIP first. Do not delete/rename/restructure files. Do not rewrite working native code. Before editing, list the exact files you will touch and the Supabase tables/RPCs involved. After implementation, run focused build/tests and update ROADTRIP module statuses only for proven changes.

---

## Module Trackers

---

### Module: Auth callback / PKCE / session restore

#### PWA Source of Truth

**Routes:** `/login`, `/register`, `/reset`, `/auth/callback`, `/verify-email`, `/welcome`

**Screens/components:**
- `apps/VCSM/src/features/auth/screens/WelcomeScreen.jsx`
- `apps/VCSM/src/app/providers/AuthProvider.jsx`
- `apps/VCSM/src/features/legal/screens/*`

**Services/DAL:**
- `apps/VCSM/src/features/auth/*`
- `apps/VCSM/src/features/legal/dal/*`
- `apps/VCSM/src/features/legal/engine/legalCompliance.engine.js`

**Supabase schema/tables/RPCs:** `auth session`, `platform.legal_documents`, `platform.user_consents`, `platform.apps`

**RLS expectations:** Authenticated session must be restored before protected routes; legal consent reads/writes must stay RLS-compatible and should not fail open.

**Current PWA status:** Complete enough to be source of truth, including dedicated WelcomeScreen and legal consent flow.

#### Native Transfer Status

**Status:** `Risky`

**Transferred native files:**
- `VCSMNativeApp/Features/Auth/LoginView.swift`
- `VCSMNativeApp/Features/Auth/RegisterView.swift`
- `VCSMNativeApp/Features/Auth/ResetPasswordView.swift`
- `VCSMNativeApp/Features/Auth/VerifyEmailScreen.swift`
- `VCSMNativeApp/Services/Auth/LiveAuthService.swift`
- `VCSMNativeApp/Session/SessionStore.swift`
- `VCSMNativeApp/VCSMNativeApp.entitlements`
- `VCSMNativeApp/Navigation/AppRouteParser.swift`

**Native behavior currently present:**
- Login/register/reset/verify screens exist.
- SessionStore persists and restores session state.
- Associated domains present for `vibezcitizens.com` and `www.vibezcitizens.com`.
- Legal document metadata and `user_consents` handled through `platform` schema.

**Native gaps:**
- No `ASWebAuthenticationSession` usage was found.
- Auth code exchange depends on URL-provided `code_verifier`; no local PKCE verifier persistence found.
- `/welcome` currently maps into onboarding instead of a dedicated native Welcome screen.
- Legal gate can fail open into signed-in state if gate resolution throws.

**Risk notes:**
- `LiveAuthService.swift:423` exchanges with `payload.codeVerifier`; `:450` reads `code_verifier` from URL parameters.
- `SessionStore.swift:365-391` contains the legal gate resolution path with fail-open risk.
- `AppRouteParser.swift:65-67` documents `/welcome` mapping into onboarding.

#### Pending Transfer Checklist

- [ ] Persist native PKCE verifier locally for auth/reset callback before exchange.
- [ ] Add or wire `ASWebAuthenticationSession`/deep-link callback handling for production auth.
- [ ] Add dedicated native Welcome screen or document intentional `/welcome` behavior difference.
- [ ] Change legal gate error behavior from fail-open to explicit retry/block state.
- [ ] Regression test login, register, reset deep link, verify email, kill/relaunch session restore.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Identity engine / actor switching / VPORT switching

#### PWA Source of Truth

**Routes:** Engine/module; no single route — `/settings`, `/vport/restore`

**Screens/components:**
- `apps/VCSM/src/features/settings/vports/*`
- `apps/VCSM/src/features/identity/*`
- `apps/VCSM/src/state/identity/*`

**Services/DAL:**
- `apps/VCSM/src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js`
- `apps/VCSM/src/features/identity/controller/switchActor.controller.js`
- `apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js`
- `apps/VCSM/src/features/vport/dal/vport.core.dal.js`

**Supabase schema/tables/RPCs:**
- `platform.provision_vcsm_identity`
- `platform.user_app_access`
- `platform.user_app_accounts`
- `platform.user_app_preferences`
- `platform.user_app_actor_links`
- `vc.actors.user_app_account_id`
- `vport.profiles`

**RLS expectations:** Actor switching must only expose actor links owned by the authenticated Supabase user and must persist active actor through `platform.user_app_preferences`.

**Current PWA status:** Canonical identity engine exists and owns actor bootstrap/switching semantics.

#### Native Transfer Status

**Status:** `Partial`

**Transferred native files:**
- `VCSMNativeApp/Services/Supabase/SupabaseClient.swift`
- `VCSMNativeApp/Services/Settings/LiveSettingsService.swift`
- `VCSMNativeApp/Features/Settings/VPortManagementView.swift`
- `VCSMNativeApp/Features/Settings/VPortManagementCards.swift`
- `VCSMNativeCore/Sources/VCSMNativeCore/NativeAppRoute.swift`

**Native behavior currently present:**
- Native resolves active identity, available actors, and fallback primary actor.
- Native persists active identity to `platform.user_app_preferences`.
- VPORT management screen can switch active VPORT identities.

**Native gaps:**
- Needs parity verification against PWA actor-owner graph, realm, soft-delete, and vport actor linkage logic.
- Switcher appears settings-centric; audit whether every route refreshes actor context after switch.
- Current route enum recheck found 67 explicit NativeAppRoute cases; prior audit had recorded 71.

**Risk notes:**
- `SupabaseClient.swift:291-417` includes identity resolve and preference persistence paths.
- Identity bugs have wide blast radius: feed, dashboard, notifications, chat, booking, settings.

#### Pending Transfer Checklist

- [ ] Create parity tests/fixtures for user actor, owned VPORT actor, soft-deleted actor, and deleted VPORT.
- [ ] Confirm native uses the same `actor_source` and platform link assumptions as PWA.
- [ ] Confirm actor switch refreshes session identity, tab badge context, feed actor, dashboard owner actor, and composer actor.
- [ ] Recount route enum after any route work and update this tracker.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Feed pipeline

#### PWA Source of Truth

**Routes:** `/feed`, `/posts`

**Screens/components:**
- `apps/VCSM/src/features/feed/*`
- `apps/VCSM/src/features/post/postcard/*`

**Services/DAL:**
- `apps/VCSM/src/features/feed/hooks/useFeed.js`
- `apps/VCSM/src/features/feed/dal/*`
- `apps/VCSM/src/features/feed/pipeline/*`

**Supabase schema/tables/RPCs:**
- `vc.posts`, `vc.post_media`, `vc.post_reactions`, `vc.post_comments`
- `vc.get_actor_summaries`
- `moderation.blocks` read path in PWA
- `vc.actor_follows` / `vc.actor_privacy_settings`

**RLS expectations:** Feed must be authenticated-only, hide blocked actors, respect private/follow visibility, and avoid showing content when safety lookups fail.

**Current PWA status:** Source of truth for feed pagination, actor hydration, media hydration, reactions, and safety filtering.

#### Native Transfer Status

**Status:** `Risky`

**Transferred native files:**
- `VCSMNativeApp/Features/Feed/FeedView.swift`
- `VCSMNativeApp/Features/Feed/FeedViewModel.swift`
- `VCSMNativeApp/Features/Feed/FeedRowView.swift`
- `VCSMNativeApp/Services/Feed/LiveFeedService.swift`
- `VCSMNativeApp/Services/Feed/FeedService.swift`

**Native behavior currently present:**
- Native feed, row rendering, view model, paging service, actor summaries, post media, reaction summaries, comments count, and privacy lookup code exist.
- Explore service also lives in `LiveFeedService`.

**Native gaps:**
- Initial `visibleTarget` is capped at 3 and pagination target at 1, making native feed under-fetch versus PWA.
- Block/follow visibility failures currently degrade to empty maps/sets and can fail open.
- Needs parity pass for mention maps, reaction viewer state, pull-to-refresh, infinite scroll thresholds, and empty/error states.

**Risk notes:**
- `LiveFeedService.swift:29` sets `visibleTarget` to 3 initial / 1 pagination.
- `LiveFeedService.swift:195-213` is the fail-open safety lookup zone from prior audit.
- `apps/VCSM/src/features/feed/dal/feed.read.blockRows.dal.js` reads `moderation.blocks`.

#### Pending Transfer Checklist

- [ ] Remove debug/temporary `visibleTarget` caps and honor requested page size.
- [ ] Change block/follow safety lookup failure from fail-open to safe empty/error behavior.
- [ ] Align block source with PWA `moderation.blocks` or documented backend RPC.
- [ ] Verify actor privacy + follow state before rendering each item.
- [ ] Compare native pagination cursor contract to PWA feed pipeline.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Post card

#### PWA Source of Truth

**Routes:** `/feed`, `/profile/:id`, `/posts/:id`

**Screens/components:**
- `apps/VCSM/src/features/post/postcard/*`
- `apps/VCSM/src/features/feed/*`

**Services/DAL:**
- `apps/VCSM/src/features/post/postcard/dal/*`
- `apps/VCSM/src/features/post/postcard/controller/*`

**Supabase schema/tables/RPCs:**
- `vc.posts`, `vc.post_media`, `vc.post_reactions`, `vc.post_comments`, `vc.post_rose_gifts`

**RLS expectations:** Post card reads must respect same feed visibility and actor safety rules as feed/detail.

**Current PWA status:** Canonical PostCard suite includes header, body, media, reactions, comments/share footer, and actor actions menu.

#### Native Transfer Status

**Status:** `Partial`

**Transferred native files:**
- `VCSMNativeApp/Features/Feed/FeedRowView.swift`
- `VCSMNativeApp/Features/Feed/FeedActionMenu.swift`
- `VCSMNativeApp/Features/Feed/SpreadShareButton.swift`
- `VCSMNativeApp/Services/Feed/LiveFeedService.swift`

**Native behavior currently present:**
- Native feed rows and actions exist.
- Native has share button and action menu files.

**Native gaps:**
- Needs direct visual/behavior parity against PWA PostCard for media carousel, reaction bar, comment count, actor metadata, mentions, and own-post actions.
- Should share models with post detail where possible; do not rewrite working row code wholesale.

**Risk notes:**
- Post card inherits feed visibility risks and post detail reaction/comment contract risks.
- Any card-level action should remain RLS-compatible and authenticated-only.

#### Pending Transfer Checklist

- [ ] Inventory PWA PostCard props and state transitions.
- [ ] Map each card action to a native service call or existing action menu.
- [ ] Verify media aspect ratios, multi-media display, and native share payload.
- [ ] Add screenshot-level QA after implementation, not during this tracker update.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Post detail / comments / reactions

#### PWA Source of Truth

**Routes:** `/posts/:id`, `/posts/:id/edit`, `/noti/post/:id`

**Screens/components:**
- `apps/VCSM/src/features/post/*`
- `apps/VCSM/src/features/post/commentcard/*`
- `apps/VCSM/src/features/post/reactions/*`

**Services/DAL:**
- `apps/VCSM/src/features/post/postcard/dal/*`
- `apps/VCSM/src/features/post/postcard/controller/*`

**Supabase schema/tables/RPCs:**
- `vc.posts`, `vc.post_comments`, `vc.post_reactions`, `vc.post_mentions`, `vc.post_media`, `vc.post_rose_gifts`

**RLS expectations:** Only authenticated users can comment/react; edit/delete must be owner-scoped; hidden/reported/blocked content must stay hidden.

**Current PWA status:** Source of truth for nested comments, reaction state, edits, deletes, report/share actions, and notification deep-link targets.

#### Native Transfer Status

**Status:** `Partial`

**Transferred native files:**
- `VCSMNativeApp/Features/PostDetail/PostDetailView.swift`
- `VCSMNativeApp/Features/PostDetail/PostDetailViewModel.swift`
- `VCSMNativeApp/Services/Post/LivePostService.swift`
- `VCSMNativeApp/Services/Post/PostService.swift`

**Native behavior currently present:**
- Native post detail, view model, and post service exist.
- Prior audit found native handles edit/delete/report/share plus comments/reaction loading paths.

**Native gaps:**
- Needs parity validation for nested reply UI, reaction animations/counts, viewer reaction state, edit flow, and notification route behavior.
- Needs shared safety filtering with feed and profile content.

**Risk notes:**
- Comment/reaction writes are high-RLS areas and should not be duplicated outside PostService/DAL patterns.

#### Pending Transfer Checklist

- [ ] Compare PWA nested comment model to native comment tree model.
- [ ] Verify add/edit/delete/comment/report writes use correct `actor_id` and auth token.
- [ ] Ensure notification post links open the same detail state.
- [ ] Confirm blocked/reported authors are filtered in detail and comments.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Composer / upload / media picker / compression

#### PWA Source of Truth

**Routes:** `/upload`, composer entry points in feed/profile

**Screens/components:**
- `apps/VCSM/src/features/upload/*`
- `apps/VCSM/src/features/post/*`
- `apps/VCSM/src/shared/lib/compressImage*`

**Services/DAL:**
- `apps/VCSM/src/features/upload/controller/*`
- `apps/VCSM/src/features/media/controller/createMediaAsset.controller.js`
- `apps/VCSM/src/features/media/dal/mediaAssets.write.dal.js`
- `apps/VCSM/src/features/upload/dal/updatePostMediaAssetId.write.dal.js`
- `apps/VCSM/cloudflare-worker-upload/*`

**Supabase schema/tables/RPCs:**
- `vc.posts`, `vc.post_media`, `platform.media_assets`, `platform.apps`
- Cloudflare/R2 upload endpoint

**RLS expectations:** Post/media writes require authenticated actor; `platform.media_assets` `app_id` must be resolved and linked without blocking post creation incorrectly.

**Current PWA status:** Source of truth for upload endpoint contract, compression, `platform.media_assets` recording, and post media linking.

#### Native Transfer Status

**Status:** `Risky`

**Transferred native files:**
- `VCSMNativeApp/Features/Composer/CreatePostView.swift`
- `VCSMNativeApp/Features/Composer/CreatePostViewModel.swift`
- `VCSMNativeApp/Features/Composer/PostComposerText.swift`
- `VCSMNativeApp/Features/Composer/MentionSuggestionOverlay.swift`
- `VCSMNativeApp/Services/Composer/LivePostComposerService.swift`
- `VCSMNativeApp/Services/Cloudflare/CloudflareUploadService.swift`

**Native behavior currently present:**
- Native has a `PhotosPicker`-based composer, media loading rules, compression/prep, mention suggestions, and post creation service.
- Native has a shared `CloudflareUploadService` used elsewhere.

**Native gaps:**
- Composer duplicates Cloudflare upload logic instead of using the shared `CloudflareUploadService` fallback path.
- Need verify `platform.media_assets` recording and `vc.post_media.media_asset_id` update parity with PWA.
- Need verify hash tags, mentions, upload failures, auth headers, and no-media post behavior.

**Risk notes:**
- `LivePostComposerService.swift:204-245` contains composer-specific upload path.
- `CloudflareUploadService.swift:16-62` contains shared upload fallback behavior.

#### Pending Transfer Checklist

- [ ] Unify composer upload through `CloudflareUploadService` without rewriting composer UI.
- [ ] Match PWA bearer/header and fallback upload contract.
- [ ] Record `platform.media_assets` and backfill `vc.post_media.media_asset_id` like PWA.
- [ ] Test image compression, multi-image order, failed upload retry, and media-less posts.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Notifications / badges / realtime fallback

#### PWA Source of Truth

**Routes:** `/notifications`, `/noti/post/:id`

**Screens/components:**
- `apps/VCSM/src/features/notifications/*`
- `apps/VCSM/src/bootstrap/*`

**Services/DAL:**
- `apps/VCSM/src/features/notifications/inbox/*`
- `apps/VCSM/src/features/notifications/realtime/*`

**Supabase schema/tables/RPCs:**
- notification engine tables/views
- `vc.device_push_tokens`
- realtime channels
- booking/comment/follow/mention/reaction/review payloads

**RLS expectations:** Unread counts and notification rows must be scoped to the authenticated active actor; realtime must have polling fallback.

**Current PWA status:** Source of truth for notification type handling, unread count, realtime subscription, and fallback polling semantics.

#### Native Transfer Status

**Status:** `Partial`

**Transferred native files:**
- `VCSMNativeApp/Features/Notifications/NotificationsView.swift`
- `VCSMNativeApp/Features/Notifications/NotificationsViewModel.swift`
- `VCSMNativeApp/Services/Notifications/LiveNotificationsService.swift`
- `VCSMNativeApp/Services/Supabase/SupabaseClient+Push.swift`
- `VCSMNativeApp/App/AppNavigationView.swift`

**Native behavior currently present:**
- Native notifications screen, realtime/polling support, view model, badge wiring, and push token upsert path exist.
- Prior audit found realtime plus 60-second polling fallback in `NotificationsView`.

**Native gaps:**
- Verify every PWA type card exists: booking, comment, follow, mention, reaction, review.
- Push token payload appears sparse; confirm user/actor association and RLS.
- Badge clearing and tab badge behavior need parity testing across active actor switches.

**Risk notes:**
- `SupabaseClient+Push.swift:15-38` upserts `vc.device_push_tokens` with token/platform fields.
- Realtime reliability on iOS background/sleep requires polling to remain active on foreground.

#### Pending Transfer Checklist

- [ ] Map each notification type to native row UI and destination.
- [ ] Verify unread count RPC/query and badge clear behavior.
- [ ] Validate push token RLS and actor/user ownership.
- [ ] Test active actor switch does not leak prior actor notifications.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Explore / search

#### PWA Source of Truth

**Routes:** `/explore`

**Screens/components:**
- `apps/VCSM/src/features/explore/*`

**Services/DAL:**
- `apps/VCSM/src/features/explore/dal/*`
- `apps/VCSM/src/features/explore/hooks/*`
- `apps/VCSM/src/features/explore/ui/*`

**Supabase schema/tables/RPCs:**
- `identity.search_actor_directory` RPC
- `identity.actor_directory`
- vc actors
- vport profile/category rows

**RLS expectations:** Search should return only public/searchable directory records and avoid owner-only vport profile reads.

**Current PWA status:** Source of truth for citizens/vports/wanders tab behavior, chips, result cards, and search RPC contract.

#### Native Transfer Status

**Status:** `Partial`

**Transferred native files:**
- `VCSMNativeApp/Features/Feed/FeedExploreView.swift`
- `VCSMNativeApp/Services/Feed/LiveFeedService.swift`
- `VCSMNativeApp/Services/Supabase/SupabaseClient.swift`

**Native behavior currently present:**
- Native explore view, filter chips, search RPC call, and result routing exist.
- `SupabaseClient.swift:1234` calls `search_actor_directory`.

**Native gaps:**
- Wanders results are route-gated off by `NativeFeatureGate`.
- Need verify PWA tabs/categories and card metadata parity.
- Need confirm empty/error/loading states match source behavior.

**Risk notes:**
- Search can expose private actors if directory/RLS assumptions drift.
- Explore relies on the same slug/actor route parser as profiles and public VPORT modules.

#### Pending Transfer Checklist

- [ ] Compare native filter chips to PWA citizens/vports/wanders tabs.
- [ ] Verify search result routes for user profile, VPORT profile, public menu/card, and Wanders.
- [ ] Keep directory search on identity RPC rather than raw owner-only profile tables.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Settings

#### PWA Source of Truth

**Routes:** `/settings`, `/vport/restore`, `/actor/:actorId/settings`

**Screens/components:**
- `apps/VCSM/src/features/settings/account/*`
- `apps/VCSM/src/features/settings/profile/*`
- `apps/VCSM/src/features/settings/privacy/*`
- `apps/VCSM/src/features/settings/vports/*`

**Services/DAL:**
- `apps/VCSM/src/features/settings/*/dal/*`
- `apps/VCSM/src/features/vport/dal/vport.core.dal.js`
- `apps/VCSM/supabase/functions/delete-citizen-account/index.ts`

**Supabase schema/tables/RPCs:**
- `platform` user/app records
- `vc.actors`, `moderation.blocks`, `vc.actor_privacy_settings`
- `vport.profiles`
- vport soft/hard delete RPCs

**RLS expectations:** Settings writes must be owner/authenticated-only; account/VPORT delete must use backend RPCs, not raw table delete fallbacks.

**Current PWA status:** Source of truth for account, profile, privacy, VPORT management, restore, and delete flows.

#### Native Transfer Status

**Status:** `Risky`

**Transferred native files:**
- `VCSMNativeApp/Features/Settings/SettingsView.swift`
- `VCSMNativeApp/Features/Settings/SettingsViewModel.swift`
- `VCSMNativeApp/Features/Settings/PrivacySettingsView.swift`
- `VCSMNativeApp/Features/Settings/VPortManagementView.swift`
- `VCSMNativeApp/Features/Settings/VPortRestoreScreen.swift`
- `VCSMNativeApp/Services/Settings/LiveSettingsService.swift`

**Native behavior currently present:**
- Native settings, privacy, account/VPORT delete UI, VPORT switch/create/restore, profile editor, invite screen, and view model exist.

**Native gaps:**
- Direct VPORT delete fallback remains and should be removed once RPC path is verified.
- Need account delete, profile privacy, blocked users, follow requests, and VPORT switcher parity testing.
- Need ensure settings writes use `vport.profiles` where PWA has migrated away from legacy `vc.vports`.

**Risk notes:**
- `LiveSettingsService.swift:321-330` calls `deleteMyVPort` then direct delete fallback.
- `SupabaseClient.swift:575-584` directly deletes `vc.vports` in prior audit.

#### Pending Transfer Checklist

- [ ] Remove direct VPORT delete fallback after verifying RPC behavior.
- [ ] Verify profile settings use `vport.profiles` for VPORT identity/profile data.
- [ ] Confirm account deletion only goes through approved edge function/RPC path.
- [ ] Regression test privacy toggles, blocked users, follow requests, vport restore and switch.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Social follow / subscribe flows

#### PWA Source of Truth

**Routes:** Integrated into profile, public VPORT, notifications, settings follow requests

**Screens/components:**
- `apps/VCSM/src/features/social/*`
- `apps/VCSM/src/features/profiles/*`
- `apps/VCSM/src/features/settings/privacy/*`

**Services/DAL:**
- `apps/VCSM/src/features/social/friend/request/dal/*`
- `apps/VCSM/src/features/social/friend/subscribe/*`
- `apps/VCSM/src/features/social/privacy/dal/actorPrivacy.dal.js`

**Supabase schema/tables/RPCs:**
- `vc.actor_follows`, `vc.follow_requests`, `vc.actor_privacy_settings`
- notification follow events

**RLS expectations:** Follow/request/subscriber writes must be actor-authenticated, privacy-aware, and active-actor scoped.

**Current PWA status:** Source of truth for follow/unfollow, request accept/reject, subscriber counts, and private actor behavior.

#### Native Transfer Status

**Status:** `Partial`

**Transferred native files:**
- `VCSMNativeApp/Features/Profile/Controller/TriggerProfileFollow.controller.swift`
- `VCSMNativeApp/Features/Profile/DAL/ProfileFollowRequests.dal.swift`
- `VCSMNativeApp/Features/Profile/Screens/FollowRequestsScreen.swift`
- `VCSMNativeApp/Features/Profile/DAL/ProfileContentReads.dal.swift`
- `VCSMNativeApp/Features/Notifications/NotificationsView.swift`

**Native behavior currently present:**
- Native follow trigger, follow request screen/DAL, profile social sections, and follow request notification actions exist.

**Native gaps:**
- Need verify follow/unfollow/request state machine against PWA.
- Subscriber count/list parity for VPORT public/profile screens needs confirmation.
- Follow privacy side effects with feed visibility and notifications need integration tests.

**Risk notes:**
- Follow state feeds into private profile visibility and feed filtering; partial behavior can leak or hide content incorrectly.

#### Pending Transfer Checklist

- [ ] Compare PWA follow status states to native model enum/state.
- [ ] Test public profile follow, private profile request, accept/reject, unfollow, and notification actions.
- [ ] Verify subscriber counts/lists for VPORT profile tabs.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Moderation / report / block flows

#### PWA Source of Truth

**Routes:** Integrated into post, profile, chat, settings privacy

**Screens/components:**
- `apps/VCSM/src/features/moderation/*`
- `apps/VCSM/src/features/block/*`
- `apps/VCSM/src/shared/components/ActorActionsMenu*`

**Services/DAL:**
- `apps/VCSM/src/features/block/dal/block.write.dal.js`
- `apps/VCSM/src/features/moderation/dal/reports.dal.js`
- `apps/VCSM/src/features/feed/dal/feed.read.blockRows.dal.js`

**Supabase schema/tables/RPCs:**
- PWA block write: `moderation.block_actor` / `moderation.unblock_actor` RPCs
- PWA report write: `moderation.reports` / `moderation.report_events`
- Native P0 scoped path now reads/writes `moderation` schema/RPCs; historical drift was `vc.user_blocks` and `vc.reports`/`vc.report_events`

**RLS expectations:** Moderation writes should go through `SECURITY DEFINER` RPC/schema paths where PWA does; client must not bypass moderation RLS or fail open.

**Current PWA status:** Source of truth uses `moderation` schema/RPCs for block/report flows.

#### Native Transfer Status

**Status:** `Risky`

**Transferred native files:**
- `VCSMNativeApp/Features/Safety/*`
- `VCSMNativeApp/Features/Chat/DAL/ChatModeration.dal.swift`
- `VCSMNativeApp/Services/Supabase/SupabaseClient.swift`
- `VCSMNativeApp/Features/Safety/DAL/SafetyReads.dal.swift`

**Native behavior currently present:**
- Native safety module includes visibility guards, blocked/reported cover cards, hide/unhide controllers, and report/block service calls.
- Chat moderation controllers exist for reporting conversations/messages and spam cover state.

**Native gaps:**
- Native block/report DAL is build-verified on `moderation` RPC/schema; runtime behavior remains untested.
- All scoped block/report writes are aligned to canonical backend path.
- Need verify cover overlays, hide actions, unblock side effects, and conversation cover behavior.

**Risk notes:**
- `block.write.dal.js:27` uses `moderation.block_actor`; `:50` uses `moderation.unblock_actor`.
- `reports.dal.js:106` inserts `moderation.reports`; `:192` inserts `moderation.report_events`.
- Historical drift: `SupabaseClient.swift` previously used `vc.user_blocks`, `vc.reports`, and `vc.report_events`; scoped native paths were aligned to `moderation` on 2026-05-03.

#### Pending Transfer Checklist

- [x] Replace native block/unblock writes with `moderation` RPC path or document confirmed backend equivalence.
- [x] Replace native report writes with `moderation` schema path or document confirmed backend equivalence.
- [x] Make feed/profile/chat safety reads fail closed enough to avoid showing blocked content on lookup errors.
- [ ] Test report/block from post card, post detail, profile, and chat.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Public VPORT profile

#### PWA Source of Truth

**Routes:** `/profile/:slug`, `/u/:username`, `/m/:actorId`, `/vport/:slug/menu`, `/vport/:slug/reviews`, `/vport/:slug/card`

**Screens/components:**
- `apps/VCSM/src/features/profiles/kinds/vport/*`
- `apps/VCSM/src/features/public/vportMenu/*`
- `apps/VCSM/src/features/public/vportBusinessCard/*`

**Services/DAL:**
- `apps/VCSM/src/features/profiles/dal/resolveActorSlug.dal.js`
- `apps/VCSM/src/features/public/vportMenu/dal/*`
- `apps/VCSM/src/features/vport/dal/*`

**Supabase schema/tables/RPCs:**
- `vport.profiles`, `vport.profile_public_details`, `vport.public_menu_read_model_v`
- `reviews` public views
- `vc.actors`

**RLS expectations:** Public profile/menu reads must use public views or public-safe queries; owner-only tables must not be queried anonymously unless wrapped by public views/RPCs.

**Current PWA status:** Source of truth for slug resolution, profile sections, menu/reviews/business-card public surfaces.

#### Native Transfer Status

**Status:** `Partial`

**Transferred native files:**
- `VCSMNativeApp/Features/Profile/*`
- `VCSMNativeApp/Features/PublicMenu/*`
- `VCSMNativeApp/Navigation/AppRouteParser.swift`
- `VCSMNativeApp/App/AppRootView.swift`

**Native behavior currently present:**
- Native profile, handle resolution, VPORT profile tabs, public menu, public reviews, public flyer, and booking tabs exist.
- Native `AppRouteParser` documents canonical `/profile/:slug` and `/profile/:slug/reviews` handling.

**Native gaps:**
- `/vport/:slug/card` resolves to a public menu placeholder rather than dedicated business card.
- Need verify public anonymous access assumptions for each VPORT surface.
- Need compare public profile tabs/sections to PWA, especially services, rates, booking, portfolio, reviews, subscribers.

**Risk notes:**
- `AppRootView.swift:195` documents `/vport/:slug/card` business-card placeholder behavior.

#### Pending Transfer Checklist

- [ ] Implement native public business-card route or document intentional deferral.
- [ ] Verify slug resolution uses `vport.profiles`/public-safe sources and not legacy `vc.vports`.
- [ ] Compare public VPORT profile tabs to PWA tab list.
- [ ] Test anonymous/public menu and reviews reads if native exposes unauthenticated entry.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Public menu

#### PWA Source of Truth

**Routes:** `/vport/:slug/menu`, `/profile/:slug/menu`

**Screens/components:**
- `apps/VCSM/src/features/public/vportMenu/*`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/*`

**Services/DAL:**
- `apps/VCSM/src/features/public/vportMenu/dal/readVportPublicMenu.rpc.dal.js`
- `apps/VCSM/src/features/public/vportMenu/dal/resolveMenuSlug.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/menu/*`

**Supabase schema/tables/RPCs:**
- `vport.public_menu_read_model_v`
- `vport.menu_*`
- `vc.vport_actor_menu_*` legacy/native model names

**RLS expectations:** Public menu reads must use anon-safe public views/RPCs; owner menu edits must be authenticated owner-only.

**Current PWA status:** Source of truth for public menu view, category/item shapes, directions/address helpers, menu media.

#### Native Transfer Status

**Status:** `Partial`

**Transferred native files:**
- `VCSMNativeApp/Features/PublicMenu/DAL/PublicMenuReads.dal.swift`
- `VCSMNativeApp/Features/PublicMenu/Screens/VPortPublicMenuScreen.swift`
- `VCSMNativeApp/Features/PublicMenu/Screens/VPortPublicMenuViewScreen.swift`
- `VCSMNativeApp/Features/PublicMenu/Components/*`
- `VCSMNativeApp/Features/Profile/Screens/VPortMenuEditorScreen.swift`

**Native behavior currently present:**
- Native public menu screen, QR screen, public menu DAL, components, and owner menu editor exist.
- Native `PublicMenuReads` uses `vc_public.vport_menu_public` / `vc_public.vports_public` and reviews public views.

**Native gaps:**
- Need verify native public menu read model exactly matches current PWA `vport.public_menu_read_model_v` field names.
- Need verify slug-based public menu resolution and owner edit/publish state parity.

**Risk notes:**
- `PublicMenuReads.dal.swift:302-328` uses `vc_public` public menu/vport views.
- Schema/view naming differs from PWA `vport.public_menu_read_model_v`; confirm backend aliases are intentional.

#### Pending Transfer Checklist

- [ ] Compare PWA public menu DTO to native `PublicMenuContent` model.
- [ ] Confirm `vc_public` view names are supported production contract or switch to vport public read model.
- [ ] Test empty menu, menu with media, address/directions, QR sharing.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Reviews

#### PWA Source of Truth

**Routes:** `/profile/:slug/reviews`, `/vport/:slug/reviews`, `/vport/:slug/reviews/qr`

**Screens/components:**
- `apps/VCSM/src/features/reviews/*`
- `apps/VCSM/src/features/public/vportMenu/components/VportPublicReviewsPanel.jsx`
- `apps/VCSM/src/features/public/vportMenu/view/VportPublicReviewsQrView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/review/*`

**Services/DAL:**
- `apps/VCSM/src/services/supabase/reviewsClient.js`
- `apps/VCSM/src/features/public/vportMenu/dal/readPublicVportReviews.dal.js`
- `apps/VCSM/src/features/public/vportMenu/dal/readPublicVportReviewSummary.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/review/VportReviews.controller.js`

**Supabase schema/tables/RPCs:**
- `reviews.public_vport_reviews_v`
- `reviews.public_vport_review_summary_v`
- `reviews.public_vport_review_dimensions_v`
- `reviews.upsert_neutral_review`

**RLS expectations:** Public reviews use public views; review writes must be authenticated citizens and must reject owner self-review.

**Current PWA status:** Source of truth for public reviews list/summary/dimensions and citizen review submission rules.

#### Native Transfer Status

**Status:** `Partial`

**Transferred native files:**
- `VCSMNativeApp/Features/PublicMenu/DAL/PublicMenuReads.dal.swift`
- `VCSMNativeApp/Features/PublicMenu/Screens/VPortPublicMenuViewScreen.swift`
- `VCSMNativeApp/Features/Profile/DAL/ProfileContentReads.dal.swift`
- `VCSMNativeApp/Features/Profile/DAL/ProfileReviewsWrites.dal.swift`
- `VCSMNativeApp/Features/Dashboard/DAL/DashboardReviews.dal.swift`
- `VCSMNativeApp/Features/Profile/Screens/VPortReviewComposerScreen.swift`

**Native behavior currently present:**
- Native reads public review summary/dimensions/reviews, profile reviews, dashboard reviews, and has review composer write DAL.

**Native gaps:**
- Need verify write path calls `reviews` RPC/function contract exactly.
- Need validate QR route and dedicated public reviews surface parity.
- Need ensure owner self-review guard and blocked author filtering match PWA.

**Risk notes:**
- `PublicMenuReads.dal.swift:335-376` uses reviews public views.
- `ProfileReviewsWrites.dal.swift:77-141` writes `reviews` schema.

#### Pending Transfer Checklist

- [ ] Confirm native write DAL matches `reviews.upsert_neutral_review` and RLS expectations.
- [ ] Test public reviews list, dimensions, summary, QR, and service-mode filters.
- [ ] Test citizen review creation and owner self-review rejection.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Booking / resources relationship

#### PWA Source of Truth

**Routes:** Embedded in public VPORT profile and `/actor/:actorId/dashboard/*` booking screens

**Screens/components:**
- `apps/VCSM/src/features/booking/*`
- `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardScheduleScreen.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/*`

**Services/DAL:**
- `apps/VCSM/src/features/booking/dal/*`
- `apps/VCSM/src/features/dashboard/vport/controller/vportPublicBooking.controller.js`

**Supabase schema/tables/RPCs:**
- `vport.resources`, `vport.availability_rules`, `vport.availability_exceptions`
- `vport.resource_services`, `vport.service_booking_profiles`, `vport.bookings`, `vc.actor_owners`

> **Schema migration note:** Booking tables moved from `vc.booking_*` to `vport.*` in a prior PWA session. Native DAL files must be verified to use `vport.*` names. Do not use stale `vc.booking_*` references.

**RLS expectations:** Public booking reads must only expose bookable resources; owner schedule/history writes must require actor ownership.

**Current PWA status:** Source of truth for booking resource/service relationships and schedule/booking dashboard behavior.

#### Native Transfer Status

**Status:** `Complete`

**Transferred native files:**
- `VCSMNativeApp/Features/Booking/*`
- `VCSMNativeApp/Features/Booking/DAL/BookingResourceReads.dal.swift`
- `VCSMNativeApp/Features/Booking/DAL/BookingAvailabilityReads.dal.swift`
- `VCSMNativeApp/Features/Booking/DAL/BookingWrites.dal.swift`
- `VCSMNativeApp/Features/Dashboard/Components/DashboardCalendarEditor.swift`
- `VCSMNativeApp/Features/Dashboard/DAL/DashboardCalendar.dal.swift`

**Native behavior currently present:**
- Native booking feature has DAL, models, controllers, hooks, components, screens, adapters.
- Native reads booking_resources, availability tables, resource services, service profiles, and writes bookings.
- Dashboard calendar editor exists.

**Native gaps:**
- Status is Complete for file/behavior presence, but relationship names must be protected during future PWA changes.
- Need ongoing test coverage for public access token path and owner-only history/update paths.

**Risk notes:**
- **Schema migration already happened.** Booking tables moved from `vc.booking_*` to `vport.*`. The current risk is stale docs or native DAL code using old `vc.booking_*` table names.
- `BookingAvailabilityReads.dal.swift` uses booking resource/service/profile relationships — verify it queries `vport.*` tables, not stale `vc.booking_*` names.
- Do not rename booking PostgREST relationship names (`booking_resources`, `booking_resource_services`, `booking_service_profiles`, `booking_availability_*`) without updating native DAL and PWA DAL together — these relationship names may differ from the underlying table names.

#### Pending Transfer Checklist

- [ ] Add/keep regression fixtures for resource → services → service profile duration relationships.
- [ ] Retest public booking creation after any PWA booking schema migration.
- [ ] Keep dashboard schedule route parity item under Dashboard routes module.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Dashboard routes

#### PWA Source of Truth

**Routes:**
- `/actor/:actorId/dashboard`
- `/actor/:actorId/dashboard/gas`
- `/actor/:actorId/dashboard/reviews`
- `/actor/:actorId/dashboard/services`
- `/actor/:actorId/dashboard/exchange`
- `/actor/:actorId/dashboard/calendar`
- `/actor/:actorId/dashboard/portfolio`
- `/actor/:actorId/dashboard/locksmith`
- `/actor/:actorId/dashboard/booking-history`
- `/actor/:actorId/dashboard/leads`
- `/actor/:actorId/dashboard/team`
- `/actor/:actorId/dashboard/team-requests`
- `/actor/:actorId/dashboard/schedule`

**Screens/components:**
- `apps/VCSM/src/features/dashboard/vport/screens/*`
- `apps/VCSM/src/features/dashboard/flyerBuilder/*`

**Services/DAL:**
- `apps/VCSM/src/features/dashboard/vport/dal/*`
- `apps/VCSM/src/features/dashboard/vport/controller/*`

**Supabase schema/tables/RPCs:**
- vc dashboard tables
- vport profile/details tables
- reviews dashboard views
- booking tables

**RLS expectations:** Every dashboard read/write must be owner-only for the active actor and must not resolve by untrusted route actor alone.

**Current PWA status:** Source of truth includes leads, team, team-requests, and schedule routes in addition to existing native route set.

#### Native Transfer Status

**Status:** `Partial`

**Transferred native files:**
- `VCSMNativeApp/Features/Dashboard/*`
- `VCSMNativeApp/Navigation/AppRouteParser.swift`
- `VCSMNativeCore/Sources/VCSMNativeCore/NativeAppRoute.swift`

**Native behavior currently present:**
- Native has dashboard overview, gas, reviews, services, exchange, calendar, portfolio, locksmith, booking history, owner settings, VPORT ads, and flyer design studio routes/screens.

**Native gaps:**
- Native dashboard route parity is missing leads, team, team-requests, and schedule.
- Need confirm whether native calendar route intentionally replaces PWA schedule route or both are needed.
- Prior ROADTRIP said dashboard complete, but current route comparison makes it Partial.

**Risk notes:**
- `apps/VCSM/src/app/routes/protected/app.routes.jsx:204-213` defines leads/team/team-requests/schedule routes.
- `AppRouteParser.swift:369-391` handles current native dashboard subroutes.

#### Pending Transfer Checklist

- [ ] Add missing native route cases and parser entries only after approval to change route files.
- [ ] Implement or intentionally map leads/team/team-requests/schedule to existing native screens.
- [ ] Verify dashboard owner guards for every route.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Wanders

#### PWA Source of Truth

**Routes:** `/wanders`, `/wanders/*`, `/wanders/c/:publicId`, `/wanders/i/:publicId`

**Screens/components:**
- `apps/VCSM/src/features/wanders/*`
- `apps/VCSM/src/app/routes/public/wanders.routes.jsx`

**Services/DAL:**
- `apps/VCSM/src/features/wanders/core/*`

**Supabase schema/tables/RPCs:**
- Wanders core tables/RPCs from PWA module
- vc actor ownership helpers

**RLS expectations:** Public claim/card routes must expose only public-safe card data; create/mailbox/reply routes must be authenticated and actor-scoped.

**Current PWA status:** Source of truth has large Wanders module with templates, create flow, mailbox/replies/outbox/sent, and public cards.

#### Native Transfer Status

**Status:** `Risky`

**Transferred native files:**
- `VCSMNativeApp/Features/Wanders/*`
- `VCSMNativeCore/Sources/VCSMNativeCore/NativeFeatureGate.swift`
- `VCSMNativeCore/Sources/VCSMNativeCore/NativeAppRoute.swift`
- `VCSMNativeApp/App/AppNavigationView.swift`
- `VCSMNativeApp/Navigation/AppRouteParser.swift`

**Native behavior currently present:**
- Native Wanders files and routes exist: home, create, claim, outbox/sent/card/public card route cases.
- Runtime access is guarded by `NativeFeatureGate`.

**Native gaps:**
- `NativeFeatureGate.wandersEnabled` is `false`, so runtime access is disabled.
- Need full parity for templates, create flow, mailbox, replies, business card intersections, and public claim screens.

**Risk notes:**
- `NativeFeatureGate.swift:5` sets `wandersEnabled = false`.
- Do not simply flip the gate without testing public/authenticated routes and RLS.

#### Pending Transfer Checklist

- [ ] Audit native Wanders model/DAL against current PWA Wanders core.
- [ ] Complete create/mailbox/reply/template behavior before enabling gate.
- [ ] Test public card/claim routes and authenticated owner views.
- [ ] Only enable `NativeFeatureGate` after product and RLS parity pass.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Chat / inbox

#### PWA Source of Truth

**Routes:** `/chat`, `/chat/:id`, `/chat/new`, `/chat/spam`, `/chat/requests`, `/chat/archived`

**Screens/components:**
- `apps/VCSM/src/features/chat/*`

**Services/DAL:**
- `apps/VCSM/src/features/chat/conversation/*`
- `apps/VCSM/src/features/chat/inbox/*`
- `apps/VCSM/src/features/chat/start/*`

**Supabase schema/tables/RPCs:**
- vc conversations/messages/inbox entries
- realtime channels
- moderation/report tables or RPCs
- `platform.media_assets` for attachments

**RLS expectations:** Conversations and inbox folders must be active-actor scoped; blocked/spam/requests states must prevent unauthorized access and writes.

**Current PWA status:** Source of truth for inbox folders, realtime messages, typing presence, start conversation, moderation covers, and media attachments.

#### Native Transfer Status

**Status:** `Partial`

**Transferred native files:**
- `VCSMNativeApp/Features/Chat/*`
- `VCSMNativeApp/Features/Inbox/*`
- `VCSMNativeApp/Services/Conversation/*`
- `VCSMNativeApp/Services/Inbox/*`

**Native behavior currently present:**
- Native chat and inbox are substantial: conversations, inbox folders, realtime socket/payloads, typing presence, moderation cards, settings screens, and start conversation view exist.

**Native gaps:**
- Need verify media messages and `platform.media_assets` attachment recording parity.
- Need verify start-conversation search adapter, folder filtering, requests/spam/archived behavior, and skeleton/error states.
- Moderation/report table mismatch from moderation module also applies here.

**Risk notes:**
- Chat has App Store moderation implications; report/block/cover flow must work before launch.

#### Pending Transfer Checklist

- [ ] Compare PWA inbox folder filters to native `InboxFolder` handling.
- [ ] Verify realtime + polling/reload fallback after background/foreground.
- [ ] Test conversation report/block/spam/request/archived actions.
- [ ] Validate media attachment upload and `platform.media_assets` recording.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Supabase schema usage: vc

#### PWA Source of Truth

**Routes:** Cross-cutting

**Services/DAL:**
- `apps/VCSM/src/services/supabase/vcClient.js`
- `apps/VCSM/src/features/feed/*`
- `apps/VCSM/src/features/post/*`
- `apps/VCSM/src/features/booking/*`
- `apps/VCSM/src/features/social/*`

**Supabase schema/tables/RPCs:**
- `vc.actors`, `vc.posts`, `vc.post_media`, `vc.actor_follows`
- `vc.booking_*`, `vc.inbox_entries`, `vc.actor_privacy_settings`
- legacy `vc.vports` risk

**RLS expectations:** `vc` schema is mostly authenticated and actor-scoped; raw writes must preserve active actor ownership and avoid legacy table paths where PWA migrated away.

**Current PWA status:** PWA uses `vc` heavily for actor/feed/post/booking/social, while VPORT profile source of truth has migrated to `vport.profiles` in several areas.

#### Native Transfer Status

**Status:** `Risky`

**Transferred native files:**
- `VCSMNativeApp/Services/Supabase/SupabaseClient.swift`
- `VCSMNativeApp/Features/Booking/DAL/*`
- `VCSMNativeApp/Features/Dashboard/DAL/*`
- `VCSMNativeApp/Features/Profile/DAL/*`

**Native behavior currently present:**
- Native `SupabaseClient` and feature DALs use `schema: "vc"` extensively.
- Native booking/dashboard/feed/post/profile/chat paths are built on `vc` schema calls.

**Native gaps:**
- Some native block/report paths use `vc` where PWA now uses `moderation` schema/RPCs.
- Direct `vc.vports` delete fallback is risky against current PWA VPORT source-of-truth migration.

**Risk notes:**
- Before any native change, confirm whether a table is canonical `vc` source or legacy compatibility surface.

#### Pending Transfer Checklist

- [ ] Document every `vc` table touched by first implementation batch.
- [ ] Verify each write is authenticated and actor-owner scoped.
- [ ] Remove or quarantine legacy `vc.vports` delete/write paths.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Supabase schema usage: vport

#### PWA Source of Truth

**Routes:** VPORT profile/menu/settings/dashboard/public routes

**Screens/components:**
- `apps/VCSM/src/features/vport/*`
- `apps/VCSM/src/features/settings/vports/*`
- `apps/VCSM/src/features/public/vportMenu/*`
- `apps/VCSM/src/features/dashboard/vport/*`

**Services/DAL:**
- `apps/VCSM/src/services/supabase/vportClient.js`
- `apps/VCSM/src/features/vport/dal/vport.core.dal.js`
- `apps/VCSM/src/features/settings/vports/dal/*`
- `apps/VCSM/src/features/public/vportMenu/dal/*`

**Supabase schema/tables/RPCs:**
- `vport.profiles`, `vport.profile_public_details`, `vport.profile_categories`, `vport.categories`
- `vport.public_menu_read_model_v`, `vport.set_business_card_publish_state`

**RLS expectations:** Public VPORT reads must use public views or anon-safe rows; owner dashboard/settings writes require owner actor links.

**Current PWA status:** PWA comments explicitly state `vport.profiles` is canonical and legacy `vc.vports` is no longer used for core VPORT profile records.

#### Native Transfer Status

**Status:** `Partial`

**Transferred native files:**
- `VCSMNativeApp/Features/Profile/DAL/ProfileHandleReads.dal.swift`
- `VCSMNativeApp/Features/Settings/VPortRestoreScreen.swift`
- `VCSMNativeApp/Features/PublicMenu/DAL/PublicMenuReads.dal.swift`
- `VCSMNativeApp/Services/Supabase/SupabaseClient.swift`

**Native behavior currently present:**
- Native has some `vport` schema reads for handle/profile/restore paths.
- Native public menu currently also uses `vc_public` views for public menu/VPORT public data.

**Native gaps:**
- Need audit native VPORT writes/deletes for legacy `vc.vports` usage and align to `vport.profiles`/RPCs.
- Need confirm `vc_public` views are accepted public-contract aliases for PWA vport public models.

**Risk notes:**
- `vport.core.dal.js` documents: All VPORTs are in `vport.profiles`; legacy `vc.vports` is no longer used.

#### Pending Transfer Checklist

- [ ] Search any first-batch native files for `vc.vports` before editing.
- [ ] Use `vport.profiles` and vport RPCs for VPORT profile/business-card state.
- [ ] Update tracker whenever PWA vport schema changes.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Supabase schema usage: reviews

#### PWA Source of Truth

**Routes:** Reviews used in profile, public menu, dashboard, and review composer routes

**Screens/components:**
- `apps/VCSM/src/features/reviews/*`
- `apps/VCSM/src/features/public/vportMenu/*`
- `apps/VCSM/src/features/profiles/kinds/vport/*`

**Services/DAL:**
- `apps/VCSM/src/services/supabase/reviewsClient.js`
- `apps/VCSM/src/features/public/vportMenu/dal/readPublicVportReview*.js`

**Supabase schema/tables/RPCs:**
- `reviews.public_vport_reviews_v`
- `reviews.public_vport_review_summary_v`
- `reviews.public_vport_review_dimensions_v`
- `reviews.upsert_neutral_review`

**RLS expectations:** Public read views can be anon-safe; review writes are authenticated citizen-only and must prevent self-review.

**Current PWA status:** PWA reviews schema usage is explicit and mostly centralized.

#### Native Transfer Status

**Status:** `Partial`

**Transferred native files:**
- `VCSMNativeApp/Features/PublicMenu/DAL/PublicMenuReads.dal.swift`
- `VCSMNativeApp/Features/Profile/DAL/ProfileContentReads.dal.swift`
- `VCSMNativeApp/Features/Profile/DAL/ProfileReviewsWrites.dal.swift`
- `VCSMNativeApp/Features/Dashboard/DAL/DashboardReviews.dal.swift`

**Native behavior currently present:**
- Native uses `schema: "reviews"` in public menu, profile content, profile review writes, and dashboard review DALs.

**Native gaps:**
- Need function/RPC name parity check for review writes.
- Need ongoing sync if PWA changes review dimension keys or public view field names.

**Risk notes:**
- Reviews touch public surfaces and authenticated writes, so schema drift causes both display bugs and RLS failures.

#### Pending Transfer Checklist

- [ ] Record every future PWA reviews view/RPC change in this file.
- [ ] Run native profile/public menu/dashboard review smoke tests after schema changes.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: Supabase schema usage: platform

#### PWA Source of Truth

**Routes:** Identity, legal, media upload, app bootstrap

**Screens/components:**
- `apps/VCSM/src/features/identity/*`
- `apps/VCSM/src/features/legal/*`
- `apps/VCSM/src/features/media/*`
- `apps/VCSM/src/features/upload/*`

**Services/DAL:**
- `apps/VCSM/src/features/identity/dal/provision.rpc.dal.js`
- `apps/VCSM/src/features/media/dal/mediaAssets.write.dal.js`
- `apps/VCSM/src/features/legal/dal/*`

**Supabase schema/tables/RPCs:**
- `platform.provision_vcsm_identity`
- `platform.user_app_preferences`, `platform.user_app_accounts`, `platform.user_app_actor_links`
- `platform.apps`, `platform.media_assets`
- `platform.legal_documents`, `platform.user_consents`

**RLS expectations:** Identity/legal/media writes must resolve the authenticated user/app context and never use `app_key` where a UUID `app_id` is required.

**Current PWA status:** Source of truth for identity provisioning, active actor preferences, legal consent, and media asset recording.

#### Native Transfer Status

**Status:** `Partial`

**Transferred native files:**
- `VCSMNativeApp/Services/Supabase/SupabaseClient.swift`
- `VCSMNativeApp/Session/SessionStore.swift`
- `VCSMNativeApp/Services/Composer/LivePostComposerService.swift`
- `VCSMNativeApp/Services/Conversation/LiveConversationService.swift`

**Native behavior currently present:**
- Native uses `platform` schema for identity preferences, legal documents/consents, app context, and media-related paths.

**Native gaps:**
- Need verify composer and chat attachment uploads record `platform.media_assets` like PWA.
- Need verify `app_id` resolution uses `platform.apps` UUID and not string `app_key`.
- Need harden legal consent error path.

**Risk notes:**
- `platform` schema mistakes often present as RLS 401/403, silent missing media links, or actor switch not persisting.

#### Pending Transfer Checklist

- [ ] Trace media asset insert and post/chat attachment update for first upload batch.
- [ ] Trace identity preference write after actor switch.
- [ ] Trace legal consent acceptance and app context lookup.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

### Module: RLS-compatible authenticated access

#### PWA Source of Truth

**Routes:** Cross-cutting protected app routes

**Screens/components:**
- `apps/VCSM/src/app/guards/ProtectedRoute.jsx`
- `apps/VCSM/src/app/providers/AuthProvider.jsx`
- `apps/VCSM/src/app/routes/protected/app.routes.jsx`

**Services/DAL:**
- `apps/VCSM/src/services/supabase/*`
- `apps/VCSM/src/features/*/dal/*`

**Supabase schemas:** `vc`, `vport`, `reviews`, `platform`, `moderation`, `identity`, `notification` engine

**RLS expectations:** Protected screens should not make unauthenticated table calls; actor-scoped writes must include active actor and access token; public routes must use public views/RPCs.

**Current PWA status:** PWA is source of truth for which routes are public, protected, owner-only, or public-view based.

#### Native Transfer Status

**Status:** `Risky`

**Transferred native files:**
- `VCSMNativeApp/App/AppRootView.swift`
- `VCSMNativeApp/App/AppNavigationView.swift`
- `VCSMNativeApp/Session/SessionStore.swift`
- `VCSMNativeApp/Services/Supabase/SupabaseClient.swift`
- `VCSMNativeApp/Services/Supabase/PostgRESTSafe.swift`

**Native behavior currently present:**
- Native centralizes many PostgREST calls through `SupabaseClient` and has session-aware navigation.
- Some public surfaces use `publicRestSelect`/public views.

**Native gaps:**
- Need route-by-route guard parity against PWA protected/public route maps.
- Need fix fail-open safety lookups and legal gate fail-open behavior.
- Need remove raw delete fallback paths and schema mismatches that bypass canonical RPCs.

**Risk notes:**
- RLS failures must be treated as product/security signals, not silently transformed into empty visibility state on safety-critical paths.

#### Pending Transfer Checklist

- [ ] Classify each `NativeAppRoute` as public, authenticated, owner-only, or feature-gated.
- [ ] For P0 edits, list every Supabase table/RPC touched before implementation.
- [ ] Add error handling rules: fail closed for safety/legal/owner checks; soft empty only for non-security optional decorations.

#### Future PWA Update Log

```
Date:
PWA files changed:
Behavior changed:
Supabase schema/RPC/RLS changes:
Native files likely affected:
Transfer notes:
```

---

## Archived / Historical ROADTRIP Snapshot

The original April 26, 2026 phase-based audit is preserved in `/Users/vcsm/Desktop/MAGES/ROADTRIP.docx`. New transfer work should use the module tracker above as the active source of truth.

**Original audit summary (April 26, 2026 — read-only, no files modified):**

| Metric | VCSM Web | Native iOS |
|---|---|---|
| Total files | ~1,947 | ~431 |
| Source files | 1,622 (JS/JSX) | 324 (Swift) |
| Feature modules | 34 | 21 |
| Routes/screens | 60+ | 71 NativeAppRoute cases |
| Config files | 9 | 1 (AppConfiguration) |
| Asset files | 35 (public) | 77 (xcassets) |
| Migrations | 25 SQL | N/A (shared backend) |
| Serverless functions | 12 (Cloudflare) + 3 (Supabase Edge) | N/A |
| Service layer files | N/A (inline) | 34 (protocol + Live pairs) |
| Shared/lib utilities | 38 | 5 |
| Design system files | 2 CSS | 1 Swift (AppTheme) |

The VCSM web project is approximately 4× larger by file count than the native app, but much of that is web-specific (PWA, SSR, serverless, SEO, sitemaps, learning/LMS) that does not transfer.

> Full phase-based audit (inventory summary, file maps, folder architecture, gap matrix, transfer roadmap, risks, testing checklist) is in the original ROADTRIP.docx.
