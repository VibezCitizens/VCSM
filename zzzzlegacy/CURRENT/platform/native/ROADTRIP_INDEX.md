# ROADTRIP INDEX
**VCSM Web/PWA → Native iOS Transfer — Master Entry Point**

Updated: May 9, 2026.

> Always read this file before starting a native transfer session.

---

## Architecture Contract Gate

Before any native code work, read:

```
/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md
```

Apply these rules to all native implementation:

- Actor-based identity only: use `actorId` and `kind`.
- Never scope behavior by `profileId`, `vportId`, or raw `userId`.
- Owner means Actor Owner through `actor_owners`.
- Build order: DAL → Model → Controller → Hooks → Components → View Screen → Final Screen.
- DAL must use explicit column selects. Never use `.select('*')`.
- Screens must respect role boundaries — no business logic in screens, no DB access in hooks.
- Cross-feature imports must go through adapters.
- Fail closed on all safety, RLS, and moderation checks.

---

## Canonical Project Paths

| Role | Path |
|---|---|
| Web/PWA source of truth | `/Users/vcsm/Desktop/VCSM/apps/VCSM` |
| Native iOS app | `/Users/vcsm/Documents/New project/native/VCSMNativeApp` |
| Shared native core | `/Users/vcsm/Documents/New project/native/VCSMNativeCore` |
| ROADTRIP original (docx) | `/Users/vcsm/Desktop/MAGES/ROADTRIP.docx` |
| ROADTRIP consolidated (md) | `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/ROADTRIP.md` |
| This index | `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/ROADTRIP_INDEX.md` |

> **Route inventory note:** Prior audit recorded 71 NativeAppRoute cases. A read-only recheck on 2026-05-12 found 76 explicit case lines in `NativeAppRoute.swift`. Recount after any native route edits and update this note.

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

| Module | PWA status | Native status | Primary gap/risk | Module file |
|---|---|---|---|---|
| Auth callback / PKCE / session restore | Complete | Risky | Runtime callback/session restore verification; welcome screen implemented | [auth.md](modules/auth.md) |
| Identity engine / actor switching / VPORT switching | Complete | Partial | Actor graph parity, route refresh after switch | [identity.md](modules/identity.md) |
| Feed pipeline | Complete | Risky | Runtime page-size and fail-closed visibility verification | [feed.md](modules/feed.md) |
| Post card | Complete | Partial | Core card at parity; quote/hashtag/link preview are P2 polish | [post-card.md](modules/post-card.md) |
| Post detail / comments / reactions | Complete | Partial | Core at parity (threaded comments, reactions, editing, safety filtering); polish items remain | [post-detail.md](modules/post-detail.md) |
| Composer / upload / media picker / compression | Complete | Risky | Runtime Cloudflare upload and media_assets write-back verification | [composer-upload.md](modules/composer-upload.md) |
| Notifications / badges / realtime fallback | Complete | Partial | All 15 types verified at parity; badge actor-scoped; push token RLS + runtime testing remain | [notifications.md](modules/notifications.md) |
| Explore / search | Complete | Partial | Filter chips aligned to PWA; Wanders disabled; runtime search/routing verification remains | [explore-search.md](modules/explore-search.md) |
| Settings | Complete | Partial | Two-step VPORT delete + citizen Edge Function implemented; runtime testing pending | [settings.md](modules/settings.md) |
| Social follow / subscribe flows | Complete | Partial | Followers/following screens added; runtime state machine testing pending | [social-follow.md](modules/social-follow.md) |
| Moderation / report / block flows | Complete | Risky | Runtime moderation RPC/report flow verification | [moderation.md](modules/moderation.md) |
| Public VPORT profile | Complete | Partial | Business card implemented; tab parity and anonymous access unverified | [public-vport-profile.md](modules/public-vport-profile.md) |
| Public menu | Complete | Partial | Migrated to vport.public_menu_read_model_v; slug resolution + runtime testing remain | [public-menu.md](modules/public-menu.md) |
| Reviews | Complete | Partial | Write RPC verified, QR route verified, self-review guard verified; runtime testing remains | [reviews.md](modules/reviews.md) |
| Booking / resources relationship | Complete | **Complete** | Schema migrated to vport; runtime testing needed | [booking.md](modules/booking.md) |
| Dashboard routes | Complete | Partial | Leads/team/team-requests implemented; owner guard audit + add-barber invite remain | [dashboard-routes.md](modules/dashboard-routes.md) |
| Learning | Complete | Missing | Native has mock `LearningHubScreen` only; PWA role/detail route tree not transferred | [learning.md](modules/learning.md) |
| Wanders | Complete | Risky | Native feature gate disabled | [wanders.md](modules/wanders.md) |
| Chat / inbox | Complete | Partial | Falcon 2026-05-14: badge DAL at full parity; native is realtime-first (improvement over PWA); DRIFT-01 `canPost` not enforced in send gate (P1); DRIFT-02 `platform.media_assets` not recorded for attachments (P1); runtime moderation/bg-fg tests remain | [chat-inbox.md](modules/chat-inbox.md) |
| Supabase schema: vc | Heavily used | Risky | Broader vc write ownership and legacy path audit | [schema-vc.md](modules/schema-vc.md) |
| Supabase schema: vport | Canonical | Near-complete | All vport_ and booking_ prefixed tables migrated; legacy vc.vports write audit remains | [schema-vport.md](modules/schema-vport.md) |
| Supabase schema: reviews | Explicit | Partial | Write RPC and public views verified at parity; runtime testing remains | [schema-reviews.md](modules/schema-reviews.md) |
| Supabase schema: platform | Identity/legal/media | Partial | Chat media parity and runtime legal/upload tests | [schema-platform.md](modules/schema-platform.md) |
| RLS-compatible authenticated access | Protected-route source | Risky | Route guard classification and runtime RLS regression | [rls-authenticated-access.md](modules/rls-authenticated-access.md) |

---

## Transfer Workflow

1. Read this index at the start of every transfer session.
2. Open the affected module file from `modules/`.
3. After any PWA change, fill in the **PWA → Native Transfer Log** in the module before starting native work.
4. After native work, update **Native Transfer Status**, **Native Gaps**, and **Transfer History** in the module.
5. Update the parity table above if a module status changes.

**Update rules:**
- Do not mark `Complete` unless route, screen, service/DAL, and schema usage are all proven in current native files.
- Use `Partial` when UI exists but behavior, route, schema path, RLS assumption, or fallback is not fully aligned.
- Use `Risky` when behavior exists but can fail open, uses stale schema/table, bypasses canonical RPCs, or is feature-gated off.
- Preserve old notes under Archived Notes in each module — never delete transfer history.

**Last-updated rule:**
- Whenever a module file changes, update its **Transfer History** date.
- If a module's status changes (e.g., Partial → Complete), update the parity table above.

---

## Definition of Done (Per Module)

A module may be marked `Complete` only when all of the following are true:

- [ ] Native route(s) exist and match PWA route contract.
- [ ] Native screen(s) exist with UI parity for launch-critical surfaces.
- [ ] Native service/DAL uses correct Supabase schema, table names, and relationship names.
- [ ] All write paths use actor-authenticated, RLS-compatible queries (no raw deletes or auth.uid() bypasses).
- [ ] Safety-critical lookups fail closed (not silently empty).
- [ ] No direct fallback paths bypass canonical RPCs.
- [ ] Transfer log entry added and status updated in this index.

---

## P0 — Launch Blockers (Fix First)

- [x] Build-verified auth PKCE verifier persistence and legal gate fail-closed behavior. Runtime callback/session restore testing remains. → [auth.md](modules/auth.md)
- [x] Build-verified feed page-size cap removal and block/follow fail-closed behavior. Runtime feed testing remains. → [feed.md](modules/feed.md)
- [x] Build-verified native block/report writes with PWA moderation RPC/schema. Runtime moderation flow testing remains. → [moderation.md](modules/moderation.md)
- [x] Build-verified direct VPORT delete fallback removal. Two-step VPORT delete (soft/restore/hard) and citizen Edge Function delete implemented. Runtime delete RPC testing remains. → [settings.md](modules/settings.md)
- [x] Build-verified composer upload through shared Cloudflare service and `platform.media_assets` recording. Runtime upload testing remains. → [composer-upload.md](modules/composer-upload.md)
- [x] Build-verified runtime schema alignment for screenshot failures: no native reads from retired `vc.actor_presentation`, retired `vc.notifications`, legacy `vc.user_blocks`, or non-existent `moderation.blocks.id`. Runtime screen regression remains. → [feed.md](modules/feed.md), [explore-search.md](modules/explore-search.md), [notifications.md](modules/notifications.md), [settings.md](modules/settings.md)

## P1 — Product Parity

- [x] Dedicated `/welcome` screen implemented with three action cards (profile, VPORT, explore). Auto-shown after onboarding. → [auth.md](modules/auth.md)
- [x] Schedule route wired to `OwnerDashboardCalendarViewScreen`. Leads/team/team-requests screens fully implemented (DAL + controller + UI). Card grid type-aware with all 8 PWA presets. → [dashboard-routes.md](modules/dashboard-routes.md)
- [x] `/vport/:slug/card` business card screen implemented (`VPortPublicCardScreen.swift`). → [public-vport-profile.md](modules/public-vport-profile.md)
- [x] All 15 notification types verified at parity (including `team_invite`). Badge is actor-scoped via `resolveCurrentIdentity`. → [notifications.md](modules/notifications.md)
- [x] Followers/following list screens implemented; profile header counts tappable. Runtime state machine testing remains. → [social-follow.md](modules/social-follow.md)
- [x] Public VPORT profile tabs verified at parity. Only Content/Team tabs differ (both disabled in PWA). → [public-vport-profile.md](modules/public-vport-profile.md)
- [ ] Bring Wanders to runtime parity before enabling feature gate. → [wanders.md](modules/wanders.md)
- [ ] Transfer embedded VCSM Learning route tree beyond the mock native hub. → [learning.md](modules/learning.md)

## P2 — Nice-To-Have

- [ ] Ads/VPORT ads polish beyond existing native VPortAds files.
- [ ] Professional workspace parity beyond current native placeholder/substantial start.
- [ ] Flyer builder/design studio advanced parity after core launch risks are closed.
- [ ] Full SEO/PWA-only web surface parity only if native product requirements demand it.

---

## Exact File-by-File Findings (Priority Reference)

| Priority | File / lines | Finding | Why it matters |
|---|---|---|---|
| P0 | `LiveFeedService.swift:28-29` | Feed page-size fixed | `visibleTarget` now honors requested page size; runtime pagination test remains |
| P0 | `LiveFeedService.swift:196-219` | Safety fail-closed fixed | Block/follow lookup failures now throw instead of becoming empty sets/maps |
| P0 | `LiveAuthService.swift:82-99`, `:433-440` | PKCE persistence fixed | Reset/recovery now stores a verifier and reuses it during callback exchange; runtime deep-link test remains |
| P0 | `SessionStore.swift:365-390` | Legal gate fail-closed fixed | Legal gate errors now sign out with retry messaging |
| P0 | `SupabaseClient.swift:1580-1609` | Block schema aligned | Native uses `moderation.block_actor` / `moderation.unblock_actor` |
| P0 | `SupabaseClient.swift:2714-2862` | Report schema aligned | Native uses `moderation.reports` / `moderation.report_events` |
| P0 | `SupabaseClient.swift`, `SafetyReads.dal.swift` | Block read schema aligned | Native reads current `moderation.blocks` actor/domain columns and no longer selects `id` |
| P0 | `SupabaseClient.swift`, `ProfileReads.dal.swift`, `ProfileHandleReads.dal.swift` | Actor directory schema aligned | Native no longer reads retired `vc.actor_presentation`; actor search/hydration uses `identity` schema |
| P0 | `SupabaseClient.swift`, `NotificationsView.swift` | Notification engine schema aligned | Native no longer reads/writes retired `vc.notifications`; reads/counts use `notification.inbox_full_view`, writes use `notification.inbox_items`, realtime uses `notification.recipients` |
| P0 | `LiveSettingsService.swift:321-323` | VPORT delete fallback removed | Native surfaces `delete_my_vport` RPC failure instead of raw table delete |
| P1 | `WelcomeScreen.swift` | Welcome screen implemented | `/welcome` now routes to dedicated screen with three action cards; auto-shown after onboarding |
| P1 | `app.routes.jsx:204-213` | Dashboard route gap narrowed | Schedule wired to calendar; leads/team/team-requests have no DB backing |
| P1 | `VPortPublicCardScreen.swift` | Business card implemented | `/vport/:slug/card` now has dedicated screen with `ActorGuardedRouteScreen` |
| P1 | `LivePostComposerService.swift:127-240` | Upload/media asset parity implemented | Composer uses shared Cloudflare upload and best-effort media asset write-back; runtime upload test remains |
| P1 | `NativeFeatureGate.swift:5` | Wanders disabled | Wanders files/routes exist but runtime gate is `false` |

---

## High-Risk Sync Areas

- **Block/unblock:** PWA → `moderation.block_actor` / `moderation.unblock_actor` RPCs. Native scoped service path is build-verified against those RPCs; runtime flow testing remains.
- **Reports:** PWA → `moderation.reports` / `moderation.report_events`. Native scoped service path is build-verified against those tables; runtime report/event audit remains.
- **Feed safety:** Block/follow failures now fail closed in the scoped service path; actor privacy and runtime error UX still need verification.
- **VPORT profile source:** `vport.profiles` is canonical. Direct `vc.vports` delete fallback was removed from the scoped settings path; broader profile parity still needs verification.
- **Public menu view contract:** ~~PWA uses `vport.public_menu_read_model_v`; native uses `vc_public`.~~ **RESOLVED 2026-05-04:** Native migrated to `vport.public_menu_read_model_v`. Zero `vc_public` references remain in native.
- **Reviews:** Public reviews must stay on `reviews` public views; write must use approved RPC and prevent owner self-review.
- **Booking:** ~~Keep `booking_resources`, `booking_resource_services`, `booking_service_profiles`, `booking_availability_*` relationship names stable across both platforms.~~ **RESOLVED 2026-05-09:** All booking DALs migrated from `vc.booking_*` to `vport.*` (resources, availability_rules, availability_exceptions, resource_services, service_booking_profiles, bookings). Dashboard DALs also migrated. All `vport_` prefixed tables (services, rates, fuel, menu, ads) migrated to `vport.*`.
- **Platform media:** Composer post uploads now record `platform.media_assets` with UUID `app_id` and link `vc.post_media`; chat attachment parity and runtime upload testing remain.
- **Actor directory:** Current DB snapshot has `identity.actor_directory` and `identity.search_actor_directory`; native must not reintroduce `vc.actor_presentation`.
- **Notifications:** Current runtime path is `notification.inbox_full_view` / `notification.recipients` / `notification.inbox_items`; native must not reintroduce `vc.notifications`.
- **Block reads:** Current `moderation.blocks` has no `id`; native must keep reads on actor/domain composite fields.

---

## Files That Should Be Changed First

```
VCSMNativeApp/Services/Auth/LiveAuthService.swift
VCSMNativeApp/Session/SessionStore.swift
VCSMNativeApp/Services/Feed/LiveFeedService.swift
VCSMNativeApp/Services/Supabase/SupabaseClient.swift    ← scoped block/report/delete/upload methods only
VCSMNativeApp/Services/Settings/LiveSettingsService.swift
VCSMNativeApp/Services/Composer/LivePostComposerService.swift
VCSMNativeApp/Services/Cloudflare/CloudflareUploadService.swift
VCSMNativeApp/Navigation/AppRouteParser.swift            ← only after route additions are approved
VCSMNativeCore/Sources/VCSMNativeCore/NativeAppRoute.swift  ← only after route additions are approved
```

---

## Do Not Touch Without Approval

| Path | Reason |
|---|---|
| `VCSMNativeApp/Features/Booking/*` | Appears complete/substantial; only touch for booking-specific work or schema drift |
| `VCSMNativeApp/Features/Chat/*` and `Features/Inbox/*` | Substantial runtime; make focused parity fixes only |
| `VCSMNativeApp/Features/Dashboard/*` | Large working surface; add missing routes/screens surgically |
| `VCSMNativeApp/Features/Profile/*` | Broad surface; avoid unrelated refactors while fixing public VPORT/social gaps |
| `VCSMNativeApp/Features/PublicMenu/*` | Substantial; do not rename public view/model fields without schema confirmation |
| `VCSMNativeApp/Services/Supabase/SupabaseClient.swift` | Central DAL; change only scoped methods with before/after query notes |
| `VCSMNativeCore/Sources/VCSMNativeCore/NativeAppRoute.swift` | Shared route contract; do not add/delete/rename cases without route audit |
| `VCSMNativeCore/Sources/VCSMNativeCore/NativeFeatureGate.swift` | Do not enable Wanders gate until runtime parity is verified |
| `apps/VCSM/src/features/*` | PWA is source of truth; do not change PWA code while updating this tracker |

---

## Missing Native Screens / Routes Compared to PWA

- ~~`/actor/:actorId/dashboard/leads`~~ — Implemented 2026-05-04
- ~~`/actor/:actorId/dashboard/team`~~ — Implemented 2026-05-04
- ~~`/actor/:actorId/dashboard/team-requests`~~ — Implemented 2026-05-04
- Learning subroutes beyond `/learning` (student/teacher/parent/admin, course, lesson, assignment, roster, submissions)
- Wanders runtime access (files/routes exist; `NativeFeatureGate` disables them)

---

## Suggested Next Codex Prompt

> You are working in my native iOS project. Use ROADTRIP as the source of truth. P0 Batch 1 is build-verified; do runtime verification only for auth reset/deep-link/session restore/legal gate, feed pagination and blocked/private visibility, post/profile/chat block/report moderation RPCs, VPORT delete RPC, and composer Cloudflare upload plus `platform.media_assets` write-back. Do not delete/rename/restructure files. Do not rewrite working native code. Before editing any fix, list the exact file and Supabase table/RPC involved. After verification, update ROADTRIP module statuses only for proven runtime results.

---

## Module File Index

| Module file | Status | Last updated |
|---|---|---|
| [auth.md](modules/auth.md) | Risky | 2026-05-03 |
| [identity.md](modules/identity.md) | Partial | 2026-05-03 |
| [feed.md](modules/feed.md) | Risky | 2026-05-03 |
| [post-card.md](modules/post-card.md) | Partial | 2026-05-03 |
| [post-detail.md](modules/post-detail.md) | Partial | 2026-05-03 |
| [composer-upload.md](modules/composer-upload.md) | Risky | 2026-05-03 |
| [notifications.md](modules/notifications.md) | Partial | 2026-05-04 |
| [explore-search.md](modules/explore-search.md) | Partial | 2026-05-04 |
| [settings.md](modules/settings.md) | Partial | 2026-05-03 |
| [social-follow.md](modules/social-follow.md) | Partial | 2026-05-03 |
| [moderation.md](modules/moderation.md) | Risky | 2026-05-04 |
| [public-vport-profile.md](modules/public-vport-profile.md) | Partial | 2026-05-03 |
| [public-menu.md](modules/public-menu.md) | Partial | 2026-05-04 |
| [reviews.md](modules/reviews.md) | Partial | 2026-05-04 |
| [booking.md](modules/booking.md) | Complete | 2026-05-09 |
| [dashboard-routes.md](modules/dashboard-routes.md) | Partial | 2026-05-04 |
| [learning.md](modules/learning.md) | Missing | 2026-05-12 |
| [wanders.md](modules/wanders.md) | Risky | 2026-05-03 |
| [chat-inbox.md](modules/chat-inbox.md) | Partial | 2026-05-14 |
| [chat-inbox-deep-audit.md](modules/chat-inbox-deep-audit.md) | Deep audit | 2026-05-04 |
| [schema-vc.md](modules/schema-vc.md) | Risky | 2026-05-03 |
| [schema-vport.md](modules/schema-vport.md) | Near-complete | 2026-05-09 |
| [schema-reviews.md](modules/schema-reviews.md) | Partial | 2026-05-03 |
| [schema-platform.md](modules/schema-platform.md) | Partial | 2026-05-03 |
| [rls-authenticated-access.md](modules/rls-authenticated-access.md) | Risky | 2026-05-03 |

---

## Archived / Historical Notes

The original phase-based audit (April 26, 2026) is preserved in `/Users/vcsm/Desktop/MAGES/ROADTRIP.docx`. It includes:
- Full file/folder inventory for both VCSM Web and Native iOS
- Numbered file maps
- Folder architecture maps
- Gap matrix
- Transfer roadmap phases
- Risk/blocker list
- Testing checklist

The April 26 audit found:
- VCSM Web: ~1,947 total files (1,622 JS/JSX source), 34 feature modules, 60+ routes
- Native iOS: ~431 total files (324 Swift source), 21 feature modules, 67 NativeAppRoute cases (recount)
- VCSM web is approximately 4× larger by file count; much of that is web-specific (PWA, SSR, serverless, SEO, LMS) and does not transfer

> New transfer work should use the module tracker files above as the active source of truth, not the April 26 snapshot.
