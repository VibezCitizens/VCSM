# VCSM Source Workflow Intake

## Scan Metadata

| Key | Value |
|---|---|
| Date | 2026-06-02 |
| Target root | /Users/vcsm/Desktop/VCSM/apps/VCSM |
| Source root | /Users/vcsm/Desktop/VCSM/apps/VCSM/src |
| Baseline files read | SOURCE_ROOT_CLASSIFICATION.md, FEATURE_STATUS.md, CURRENT/ feature+platform+shared+services+state+styles directories |
| Read-only | YES — no source code modified |
| Ticket | TICKET-0006 |
| Command | /Wolverine |

## Executive Summary

| Metric | Count |
|---|---|
| Total source root dirs scanned | 17 |
| Total feature folders (src/features/) | 34 |
| Total screens/routes found | 38 |
| Total governance gaps identified | 49 |
| Total new workflow additions recommended | 33 |
| Total DO_NOT_DOCUMENT_AS_FEATURE entries | 5 |

## Source Root Classification Delta

| Source Root | Exists On Disk | In SOURCE_ROOT_CLASSIFICATION.md | Classification | Recommended Doc Folder | Status | Action |
|---|---|---|---|---|---|---|
| `app` | YES | YES | PLATFORM | `CURRENT/platform/app-shell/` | COVERED | OK |
| `assets` | YES | YES | DO_NOT_DOCUMENT_AS_FEATURE | — | COVERED | DO_NOT_DOCUMENT_AS_FEATURE |
| `bootstrap` | YES | YES | PLATFORM | `CURRENT/platform/bootstrap/` | COVERED | OK |
| `debuggers-stub` | YES | YES | DO_NOT_DOCUMENT_AS_FEATURE | — | COVERED | DO_NOT_DOCUMENT_AS_FEATURE |
| `dev` | YES | YES | DO_NOT_DOCUMENT_AS_FEATURE | — | COVERED | DO_NOT_DOCUMENT_AS_FEATURE |
| `features` | YES | YES (as tree) | PLATFORM | `CURRENT/features/` | COVERED | OK |
| `i18n` | YES | YES | SHARED_INFRA | `CURRENT/shared/i18n/` | COVERED | OK |
| `learning` | YES | YES | FEATURE | `CURRENT/features/learning/` | COVERED | OK — FROZEN |
| `platform` | YES | YES | PLATFORM | `CURRENT/platform/i18n-platform/` | COVERED | OK |
| `queries` | YES | YES | SHARED_INFRA | `CURRENT/shared/queries/` | COVERED | OK |
| `screens` | YES | YES | DO_NOT_DOCUMENT_AS_FEATURE | — | COVERED | DO_NOT_DOCUMENT_AS_FEATURE |
| `scripts` | YES | YES | SCRIPT | — | COVERED | DO_NOT_DOCUMENT_AS_FEATURE |
| `season` | YES | YES | SHARED_INFRA | `CURRENT/shared/season/` | COVERED | OK |
| `services` | YES | YES | SERVICE | `CURRENT/services/` | COVERED | OK |
| `shared` | YES | YES | SHARED_INFRA | `CURRENT/shared/` | COVERED | OK |
| `state` | YES | YES | STATE | `CURRENT/state/` | COVERED | OK |
| `styles` | YES | YES | STYLE | `CURRENT/styles/` | COVERED | OK |

## Feature Intake Table

| Feature / Area | Source Path | Classification | Public/Owner/Auth Surface | Has Controller | Has DAL | Has Hooks | Has Screens | Existing CURRENT Folder | Existing FEATURE_STATUS Entry | Workflow Status | Owner Command | Priority | Reason |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `actors` | `apps/VCSM/src/features/actors` | PLATFORM | OWNER | YES | YES | NO | NO | NO | YES | PARTIAL | ARCHITECT | P0 | Core actor identity abstraction — all ownership operations depend on it |
| `ads` | `apps/VCSM/src/features/ads` | FEATURE | PUBLIC | NO | YES | YES | YES | NO | YES | PARTIAL | ARCHITECT | P3 | Ad display system — low security risk, not a write-mutation surface |
| `auth` | `apps/VCSM/src/features/auth` | PLATFORM | PUBLIC | YES | YES | YES | YES | NO | YES | PARTIAL | VENOM+ELEKTRA | P0 | Full auth pipeline — session, login/logout; foundational security surface |
| `block` | `apps/VCSM/src/features/block` | FEATURE | AUTH | YES | YES | YES | NO | NO | YES | PARTIAL | VENOM+ELEKTRA | P2 | Trust boundary write surface — block/unblock mutation with access control guards |
| `booking` | `apps/VCSM/src/features/booking` | FEATURE | OWNER | YES | YES | YES | YES | NO | YES | PARTIAL | VENOM+ELEKTRA | P0 | High-security booking write surface — open ticket TICKET-BOOKING-RPC-001 |
| `chat` | `apps/VCSM/src/features/chat` | FEATURE | AUTH | NO | YES | YES | YES | NO | YES | PARTIAL | VENOM | P1 | Real-time messaging — authenticated write surface with conversation and inbox DALs |
| `dashboard` | `apps/VCSM/src/features/dashboard` | FEATURE | OWNER | YES | YES | YES | YES | YES | YES | DOCUMENTED | ARCHITECT | P1 | Owner-only management surface — only feature with existing CURRENT folder |
| `debug` | `apps/VCSM/src/features/debug` | SHARED_INFRA | AUTH | NO | NO | NO | NO | NO | NO | UNDOCUMENTED | ARCHITECT | P4 | Debug UI components only — shared_infra classification; low governance value |
| `explore` | `apps/VCSM/src/features/explore` | FEATURE | PUBLIC | YES | YES | YES | YES | NO | YES | PARTIAL | ARCHITECT | P2 | Discovery surface — public-facing browsing; minimal write risk |
| `feed` | `apps/VCSM/src/features/feed` | FEATURE | AUTH | YES | YES | YES | YES | NO | YES | PARTIAL | ARCHITECT | P1 | Core social feed — adapters, pipeline, controllers, DALs; active content mutation path |
| `hydration` | `apps/VCSM/src/features/hydration` | PLATFORM | AUTH | NO | NO | NO | NO | NO | YES | PARTIAL | ARCHITECT | P1 | Actor hydration bootstrapper — minimal but critical platform initializer |
| `identity` | `apps/VCSM/src/features/identity` | PLATFORM | OWNER | YES | YES | YES | NO | NO | YES | PARTIAL | ARCHITECT | P0 | Canonical viewer identity resolver — all ownership gates depend on this |
| `invite` | `apps/VCSM/src/features/invite` | FEATURE | AUTH | YES | YES | YES | YES | NO | YES | PARTIAL | VENOM+ELEKTRA | P1 | Trust artifact lifecycle — invite token issuance is a security-critical write path |
| `join` | `apps/VCSM/src/features/join` | FEATURE | PUBLIC | YES | YES | YES | YES | NO | YES | PARTIAL | VENOM+ELEKTRA | P1 | Ownership-establishment surface — QR + account join; active on current branch |
| `legal` | `apps/VCSM/src/features/legal` | FEATURE | AUTH | YES | YES | YES | YES | NO | YES | PARTIAL | VENOM | P2 | Compliance-critical consent tracking — controllers and DALs for legal agreements |
| `media` | `apps/VCSM/src/features/media` | PLATFORM | OWNER | YES | YES | NO | NO | NO | YES | PARTIAL | ARCHITECT | P2 | Media management infrastructure — PLATFORM-classified; consumed by upload/portfolio/profiles |
| `moderation` | `apps/VCSM/src/features/moderation` | FEATURE | AUTH | YES | YES | YES | NO | NO | YES | PARTIAL | VENOM+ELEKTRA | P1 | Content safety write surface — report queue and review controllers |
| `notifications` | `apps/VCSM/src/features/notifications` | FEATURE | AUTH | YES | YES | YES | YES | NO | YES | PARTIAL | ARCHITECT | P2 | Push and in-app notification pipeline — inbox controller and runtime DAL |
| `onboarding` | `apps/VCSM/src/features/onboarding` | FEATURE | PUBLIC | YES | YES | YES | YES | NO | YES | PARTIAL | ARCHITECT | P2 | First-run user experience — controller and DAL for new user setup |
| `portfolio` | `apps/VCSM/src/features/portfolio` | FEATURE | OWNER | NO | NO | NO | NO | NO | YES | PARTIAL | ARCHITECT | P3 | Setup stub only — real portfolio logic lives in dashboard/cards/; verify before full coverage |
| `post` | `apps/VCSM/src/features/post` | FEATURE | AUTH | YES | YES | YES | YES | NO | YES | PARTIAL | ARCHITECT | P1 | Core social content surface — postcard + commentcard each have full MVC stacks |
| `professional` | `apps/VCSM/src/features/professional` | FEATURE | AUTH | YES | YES | YES | YES | NO | YES | PARTIAL | ARCHITECT | P3 | Professional vertical — briefings, enterprise, nurse; multi-subdomain feature |
| `profiles` | `apps/VCSM/src/features/profiles` | FEATURE | MIXED | YES | YES | YES | YES | NO | YES | PARTIAL | ARCHITECT | P1 | Core identity display for all actor kinds — vport kinds, friends, photos, tags; heavy write surface |
| `public` | `apps/VCSM/src/features/public` | FEATURE | PUBLIC | YES | YES | YES | YES | NO | YES | PARTIAL | VENOM+ELEKTRA | P1 | Zero-auth public surfaces — vportBusinessCard + vportMenu both have full MVC; trust boundary |
| `reviews` | `apps/VCSM/src/features/reviews` | FEATURE | AUTH | NO | NO | NO | NO | NO | YES | PARTIAL | ARCHITECT | P3 | Setup stub only — no subdirectories confirmed; real reviews may live in engines/ |
| `settings` | `apps/VCSM/src/features/settings` | FEATURE | OWNER | YES | YES | YES | YES | NO | YES | PARTIAL | VENOM+ELEKTRA | P1 | Write-heavy mutation surface — account, privacy, profile, vports all have full controller+DAL stacks |
| `social` | `apps/VCSM/src/features/social` | FEATURE | AUTH | YES | YES | YES | NO | NO | YES | PARTIAL | VENOM | P2 | Social graph — friend requests, subscriptions, privacy controllers; write-mutation surface |
| `ui` | `apps/VCSM/src/features/ui` | SHARED_INFRA | AUTH | NO | NO | NO | NO | NO | NO | UNDOCUMENTED | ARCHITECT | P2 | UI primitives (modern/ subdir) — SHARED_INFRA classification; no business logic |
| `upload` | `apps/VCSM/src/features/upload` | PLATFORM | OWNER | YES | YES | YES | YES | NO | YES | PARTIAL | VENOM+ELEKTRA | P2 | File upload pipeline — dual controller/ and controllers/ present; consumed by portfolio and media |
| `vgrid` | `apps/VCSM/src/features/vgrid` | FEATURE | AUTH | NO | YES | YES | YES | NO | YES | PARTIAL | ARCHITECT | P3 | FROZEN — virtual grid content browser; paused per FEATURE_STATUS |
| `void` | `apps/VCSM/src/features/void` | FEATURE | AUTH | NO | YES | YES | YES | NO | YES | PARTIAL | VENOM | P2 | Void Realm — 18+ anonymous-but-DB-tracked realm; system posts must never use void realmId |
| `vport` | `apps/VCSM/src/features/vport` | FEATURE | OWNER | YES | YES | YES | YES | NO | YES | PARTIAL | ARCHITECT | P0 | Core VPORT identity — foundational for all VPORT surfaces and ownership operations |
| `wanderex` | `apps/VCSM/src/features/wanderex` | FEATURE | AUTH | NO | YES | YES | YES | NO | YES | PARTIAL | ARCHITECT | P3 | FROZEN — product work paused per FEATURE_STATUS |
| `wanders` | `apps/VCSM/src/features/wanders` | FEATURE | AUTH | YES | YES | YES | YES | NO | YES | PARTIAL | ARCHITECT | P3 | FROZEN — product work paused per FEATURE_STATUS; large feature with core/adapters/services subtrees |

## Screen / Route Intake Table

| Screen / Route | Source Path | Owning Feature / Area | Public/Auth/Owner | Existing Workflow Coverage | Gap | Recommended Command |
|---|---|---|---|---|---|---|
| `DevDiagnosticsScreen.jsx` | `apps/VCSM/src/screens/DevDiagnosticsScreen.jsx` | dev / diagnostics | DEV_ONLY | NO | Dev-only screen — do not document | — |
| `RootLayout.jsx` | `apps/VCSM/src/app/layout/RootLayout.jsx` | app-shell | AUTH | NO | App shell layout not covered in CURRENT | ARCHITECT |
| `ProtectedRoute.jsx` | `apps/VCSM/src/app/guards/ProtectedRoute.jsx` | app-shell | AUTH | NO | Auth guard not covered in CURRENT | VENOM |
| `ProfileGatedOutlet.jsx` | `apps/VCSM/src/app/guards/ProfileGatedOutlet.jsx` | app-shell | OWNER | NO | Profile gate not covered in CURRENT | VENOM |
| `AuthProvider.jsx` | `apps/VCSM/src/app/providers/AuthProvider.jsx` | auth | AUTH | NO | Auth provider not covered | VENOM+ELEKTRA |
| `app.routes.jsx` | `apps/VCSM/src/app/routes/protected/app.routes.jsx` | app-shell | AUTH | NO | Protected route tree not documented | ARCHITECT |
| `appRoutes.redirects.jsx` | `apps/VCSM/src/app/routes/protected/appRoutes.redirects.jsx` | app-shell | AUTH | NO | Redirect logic not documented | ARCHITECT |
| `about.routes.jsx` | `apps/VCSM/src/app/routes/public/about.routes.jsx` | public | PUBLIC | NO | Public about route uncovered | VENOM |
| `auth.routes.jsx` | `apps/VCSM/src/app/routes/public/auth.routes.jsx` | auth | PUBLIC | NO | Auth entry routes not covered | VENOM+ELEKTRA |
| `contact.routes.jsx` | `apps/VCSM/src/app/routes/public/contact.routes.jsx` | public | PUBLIC | NO | Public contact route uncovered | VENOM |
| `howto.routes.jsx` | `apps/VCSM/src/app/routes/public/howto.routes.jsx` | public | PUBLIC | NO | Public how-to routes — new; not covered | VENOM |
| `join.routes.jsx` | `apps/VCSM/src/app/routes/public/join.routes.jsx` | join | PUBLIC | NO | Public join entry route uncovered — active on branch | VENOM+ELEKTRA |
| `legal.routes.jsx` | `apps/VCSM/src/app/routes/public/legal.routes.jsx` | legal | PUBLIC | NO | Legal public routes uncovered | VENOM |
| `vportMenu.routes.jsx` | `apps/VCSM/src/app/routes/public/vportMenu.routes.jsx` | public | PUBLIC | NO | VPORT menu public route uncovered | VENOM+ELEKTRA |
| `wanderex.routes.jsx` | `apps/VCSM/src/app/routes/public/wanderex.routes.jsx` | wanderex | PUBLIC | NO | FROZEN feature — public route still registered | ARCHITECT |
| `wanders.routes.jsx` | `apps/VCSM/src/app/routes/public/wanders.routes.jsx` | wanders | PUBLIC | NO | FROZEN feature — public route still registered | ARCHITECT |
| `learning.routes.jsx` (app) | `apps/VCSM/src/app/routes/learning/learning.routes.jsx` | learning | AUTH | NO | FROZEN — route still registered in app shell | ARCHITECT |
| `learning.routes.jsx` (src) | `apps/VCSM/src/learning/routes/learning.routes.jsx` | learning | AUTH | NO | FROZEN — duplicate route file in src/learning/ | ARCHITECT |
| `auth` screens | `apps/VCSM/src/features/auth/screens` | auth | PUBLIC | NO | Auth screens not individually documented | VENOM+ELEKTRA |
| `booking` screens | `apps/VCSM/src/features/booking/screens` | booking | OWNER | NO | Booking screens not covered — P0 security surface | VENOM+ELEKTRA |
| `chat/inbox` screens | `apps/VCSM/src/features/chat/inbox/screens` | chat | AUTH | NO | Chat inbox screens not covered | VENOM |
| `chat/start` screens | `apps/VCSM/src/features/chat/start/screens` | chat | AUTH | NO | Chat start screens not covered | VENOM |
| `dashboard/vport` screens | `apps/VCSM/src/features/dashboard/vport/screens` | dashboard | OWNER | PARTIAL | Dashboard has CURRENT folder; vport subscreen not confirmed covered | ARCHITECT |
| `dashboard/flyerBuilder` screens | `apps/VCSM/src/features/dashboard/flyerBuilder/screens` | dashboard | OWNER | PARTIAL | FlyerBuilder subscreen not confirmed covered | ARCHITECT |
| `explore` screens | `apps/VCSM/src/features/explore/screens` | explore | PUBLIC | NO | Explore screens not covered | ARCHITECT |
| `feed` screens | `apps/VCSM/src/features/feed/screens` | feed | AUTH | NO | Feed screens not covered | ARCHITECT |
| `invite` screens | `apps/VCSM/src/features/invite/screens` | invite | AUTH | NO | Invite screens not covered | VENOM+ELEKTRA |
| `join` screens | `apps/VCSM/src/features/join/screens` | join | PUBLIC | NO | Join screens not covered — active on branch | VENOM+ELEKTRA |
| `legal` screens | `apps/VCSM/src/features/legal/screens` | legal | PUBLIC | NO | Legal screens not covered | VENOM |
| `notifications` screen | `apps/VCSM/src/features/notifications/screen` | notifications | AUTH | NO | Notifications screen not covered | ARCHITECT |
| `onboarding` screens | `apps/VCSM/src/features/onboarding/screens` | onboarding | PUBLIC | NO | Onboarding screens not covered | ARCHITECT |
| `post` screens | `apps/VCSM/src/features/post/screens` | post | AUTH | NO | Post screens not covered | ARCHITECT |
| `profiles` screens | `apps/VCSM/src/features/profiles/screens` | profiles | MIXED | NO | Profiles screens not covered | ARCHITECT |
| `profiles/kinds/vport` screens | `apps/VCSM/src/features/profiles/kinds/vport/screens` | profiles | OWNER | NO | VPORT profile subscreen not covered — write-heavy | VENOM+ELEKTRA |
| `settings` screen | `apps/VCSM/src/features/settings/screen` | settings | OWNER | NO | Settings screens not covered | VENOM+ELEKTRA |
| `upload` screens | `apps/VCSM/src/features/upload/screens` | upload | OWNER | NO | Upload screens not covered | VENOM+ELEKTRA |
| `vport` screens | `apps/VCSM/src/features/vport/screens` | vport | OWNER | NO | Core VPORT screens not covered — P0 | ARCHITECT |
| `ads` screens | `apps/VCSM/src/features/ads/screens` | ads | PUBLIC | NO | Ads screens not covered | ARCHITECT |

## Public Surface Register

| Surface | Source Path | Auth Required | Data Exposed | Risk | Recommended Command |
|---|---|---|---|---|---|
| VPORT Business Card | `apps/VCSM/src/features/public/vportBusinessCard/` | NO | VPORT profile, contact info, services, branding | HIGH | VENOM+ELEKTRA |
| VPORT Menu (public route) | `apps/VCSM/src/features/public/vportMenu/` | NO | VPORT menu items, pricing, availability | HIGH | VENOM+ELEKTRA |
| VPORT Menu route | `apps/VCSM/src/app/routes/public/vportMenu.routes.jsx` | NO | VPORT menu data via public route | HIGH | VENOM+ELEKTRA |
| Join (QR) | `apps/VCSM/src/features/join/` + `apps/VCSM/src/app/routes/public/join.routes.jsx` | NO (entry) | Invite token, barbershop identity | CRITICAL | VENOM+ELEKTRA |
| Auth entry points | `apps/VCSM/src/app/routes/public/auth.routes.jsx` | NO | Session bootstrap, credential handling | CRITICAL | VENOM+ELEKTRA |
| How-To pages | `apps/VCSM/src/app/routes/public/howto.routes.jsx` | NO | Platform marketing/feature copy | LOW | VENOM |
| About page | `apps/VCSM/src/app/routes/public/about.routes.jsx` | NO | Static marketing content | LOW | VENOM |
| Contact page | `apps/VCSM/src/app/routes/public/contact.routes.jsx` | NO | Contact form — potential PII submission | MEDIUM | VENOM |
| Legal pages | `apps/VCSM/src/app/routes/public/legal.routes.jsx` | NO | Legal agreement text | LOW | VENOM |
| Explore / Discovery | `apps/VCSM/src/features/explore/` | NO | Public VPORT listings, content discovery | MEDIUM | ARCHITECT |
| Wanders (route registered) | `apps/VCSM/src/app/routes/public/wanders.routes.jsx` | NO | FROZEN feature — public route still live | MEDIUM | ARCHITECT |
| Wanderex (route registered) | `apps/VCSM/src/app/routes/public/wanderex.routes.jsx` | NO | FROZEN feature — public route still live | MEDIUM | ARCHITECT |

## Mutation / Write Surface Register

| Surface | Source Path | Write Type | Ownership Gate Known | Risk | Recommended Command |
|---|---|---|---|---|---|
| Booking controller | `apps/VCSM/src/features/booking/controller/` | BOOKING | PARTIAL — TICKET-BOOKING-RPC-001 open | CRITICAL | VENOM+ELEKTRA |
| Join controllers (account + QR) | `apps/VCSM/src/features/join/controllers/` | AUTH_MUTATION | PARTIAL — active on current branch | CRITICAL | VENOM+ELEKTRA |
| Auth controllers | `apps/VCSM/src/features/auth/controllers/` | AUTH_MUTATION | YES | CRITICAL | VENOM+ELEKTRA |
| Settings/account controller | `apps/VCSM/src/features/settings/account/controller/` | PROFILE_MUTATION | YES | HIGH | VENOM+ELEKTRA |
| Settings/privacy controller | `apps/VCSM/src/features/settings/privacy/controller/` | CONFIG_WRITE | YES | HIGH | VENOM+ELEKTRA |
| Settings/profile controller | `apps/VCSM/src/features/settings/profile/controller/` | PROFILE_MUTATION | YES | HIGH | VENOM+ELEKTRA |
| Settings/vports controller | `apps/VCSM/src/features/settings/vports/controller/` | CONFIG_WRITE | YES | HIGH | VENOM+ELEKTRA |
| Upload controller(s) | `apps/VCSM/src/features/upload/controller/` + `controllers/` | MEDIA_UPLOAD | PARTIAL | HIGH | VENOM+ELEKTRA |
| Media controller | `apps/VCSM/src/features/media/controller/` | MEDIA_UPLOAD | PARTIAL — TICKET-PLATFORM-RLS-001 open | HIGH | VENOM+ELEKTRA |
| Profiles/kinds/vport controller | `apps/VCSM/src/features/profiles/kinds/vport/controller/` | PROFILE_MUTATION | PARTIAL | HIGH | VENOM+ELEKTRA |
| Dashboard/vport controller | `apps/VCSM/src/features/dashboard/vport/controller/` | CONFIG_WRITE | YES — owner-only surface | HIGH | ARCHITECT |
| Dashboard cards/schedule controller | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/controller/` | SCHEDULE_WRITE | YES | HIGH | ARCHITECT |
| Dashboard cards/settings controller | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/controller/` | CONFIG_WRITE | YES | HIGH | ARCHITECT |
| Dashboard cards/portfolio controller | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/controller/` | CONTENT_PUBLISH | YES | MEDIUM | ARCHITECT |
| Dashboard cards/team controller | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/controller/` | CONFIG_WRITE | YES | MEDIUM | ARCHITECT |
| Dashboard cards/bookings controller | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/` | BOOKING | YES | HIGH | VENOM+ELEKTRA |
| Dashboard/flyerBuilder controller | `apps/VCSM/src/features/dashboard/flyerBuilder/controller/` | CONTENT_PUBLISH | YES | MEDIUM | ARCHITECT |
| Dashboard/flyerBuilder/designStudio controller | `apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/` | CONTENT_PUBLISH | YES | MEDIUM | ARCHITECT |
| Invite controller | `apps/VCSM/src/features/invite/controller/` | AUTH_MUTATION | PARTIAL | HIGH | VENOM+ELEKTRA |
| Moderation controllers | `apps/VCSM/src/features/moderation/controllers/` | CONFIG_WRITE | PARTIAL | HIGH | VENOM+ELEKTRA |
| Social friend request controllers | `apps/VCSM/src/features/social/friend/request/controllers/` | PROFILE_MUTATION | YES | MEDIUM | VENOM |
| Social friend subscribe controllers | `apps/VCSM/src/features/social/friend/subscribe/controllers/` | PROFILE_MUTATION | YES | MEDIUM | VENOM |
| Social privacy controllers | `apps/VCSM/src/features/social/privacy/controllers/` | CONFIG_WRITE | YES | MEDIUM | VENOM |
| Block controllers | `apps/VCSM/src/features/block/controllers/` | CONFIG_WRITE | YES | HIGH | VENOM+ELEKTRA |
| Feed controllers | `apps/VCSM/src/features/feed/controllers/` | CONTENT_PUBLISH | PARTIAL | MEDIUM | ARCHITECT |
| Post/commentcard controller | `apps/VCSM/src/features/post/commentcard/controller/` | CONTENT_PUBLISH | PARTIAL | MEDIUM | ARCHITECT |
| Post/postcard controller | `apps/VCSM/src/features/post/postcard/controller/` | CONTENT_PUBLISH | PARTIAL | MEDIUM | ARCHITECT |
| Notifications/inbox controller | `apps/VCSM/src/features/notifications/inbox/controller/` | NOTIFICATION_WRITE | PARTIAL | MEDIUM | ARCHITECT |
| Chat/conversation controller | `apps/VCSM/src/features/chat/conversation/controller/` | CONFIG_WRITE | YES | HIGH | VENOM |
| Chat/inbox controller | `apps/VCSM/src/features/chat/inbox/controller/` | CONFIG_WRITE | YES | HIGH | VENOM |
| vport controller | `apps/VCSM/src/features/vport/controller/` | CONFIG_WRITE | YES | HIGH | ARCHITECT |
| explore controller | `apps/VCSM/src/features/explore/controller/` | CONTENT_PUBLISH | PARTIAL | LOW | ARCHITECT |
| Dashboard cards/gasprices controller | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/controller/` | CONTENT_PUBLISH | YES | MEDIUM | ARCHITECT |
| Dashboard cards/leads controller | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/controller/` | CONFIG_WRITE | YES | MEDIUM | ARCHITECT |
| Legal controllers | `apps/VCSM/src/features/legal/controllers/` | AUTH_MUTATION | YES | MEDIUM | VENOM |
| Onboarding controller | `apps/VCSM/src/features/onboarding/controller/` | PROFILE_MUTATION | PARTIAL | MEDIUM | ARCHITECT |
| Public/vportBusinessCard controller | `apps/VCSM/src/features/public/vportBusinessCard/controller/` | PROFILE_MUTATION | NO — public surface | HIGH | VENOM+ELEKTRA |
| Public/vportMenu controller | `apps/VCSM/src/features/public/vportMenu/controller/` | MENU_WRITE | NO — public surface | HIGH | VENOM+ELEKTRA |
| Identity controller | `apps/VCSM/src/features/identity/controller/` | AUTH_MUTATION | YES | CRITICAL | ARCHITECT |
| Actors controllers | `apps/VCSM/src/features/actors/controllers/` | PROFILE_MUTATION | YES | CRITICAL | ARCHITECT |
| Profiles controller | `apps/VCSM/src/features/profiles/controller/` | PROFILE_MUTATION | PARTIAL | HIGH | ARCHITECT |

## Governance Gaps

| Gap ID | Source Path | Gap Type | Severity | Required Action | Owner Command |
|---|---|---|---|---|---|
| GAP-001 | `apps/VCSM/src/features/actors` | NO_CURRENT_DOC | CRITICAL | Create `CURRENT/platform/actors/` with controller+DAL+model inventory | ARCHITECT |
| GAP-002 | `apps/VCSM/src/features/auth` | NO_CURRENT_DOC | CRITICAL | Create `CURRENT/platform/auth/` — full auth pipeline, session management | VENOM+ELEKTRA |
| GAP-003 | `apps/VCSM/src/features/booking` | NO_CURRENT_DOC | CRITICAL | Create `CURRENT/features/booking/` — open TICKET-BOOKING-RPC-001; P0 | VENOM+ELEKTRA |
| GAP-004 | `apps/VCSM/src/features/identity` | NO_CURRENT_DOC | CRITICAL | Create `CURRENT/platform/identity/` — all ownership gates depend on this | ARCHITECT |
| GAP-005 | `apps/VCSM/src/features/vport` | NO_CURRENT_DOC | CRITICAL | Create `CURRENT/features/vport/` — P0 foundational VPORT surface | ARCHITECT |
| GAP-006 | `apps/VCSM/src/features/join` | NO_CURRENT_DOC | HIGH | Create `CURRENT/features/join/` — active on current branch; ownership establishment | VENOM+ELEKTRA |
| GAP-007 | `apps/VCSM/src/features/settings` | NO_CURRENT_DOC | HIGH | Create `CURRENT/features/settings/` — write-heavy mutation surface; account/privacy/vports | VENOM+ELEKTRA |
| GAP-008 | `apps/VCSM/src/features/public` | NO_CURRENT_DOC | HIGH | Create `CURRENT/features/public/` — zero-auth surfaces with full MVC | VENOM+ELEKTRA |
| GAP-009 | `apps/VCSM/src/features/invite` | NO_CURRENT_DOC | HIGH | Create `CURRENT/features/invite/` — trust artifact lifecycle; token issuance | VENOM+ELEKTRA |
| GAP-010 | `apps/VCSM/src/features/moderation` | NO_CURRENT_DOC | HIGH | Create `CURRENT/features/moderation/` — content safety write surface | VENOM+ELEKTRA |
| GAP-011 | `apps/VCSM/src/features/block` | NO_CURRENT_DOC | HIGH | Create `CURRENT/features/block/` — trust boundary write surface | VENOM+ELEKTRA |
| GAP-012 | `apps/VCSM/src/features/upload` | NO_CURRENT_DOC | HIGH | Create `CURRENT/platform/upload/` — dual controller present; media upload pipeline | VENOM+ELEKTRA |
| GAP-013 | `apps/VCSM/src/features/chat` | NO_CURRENT_DOC | HIGH | Create `CURRENT/features/chat/` — real-time messaging; authenticated write | VENOM |
| GAP-014 | `apps/VCSM/src/features/profiles` | NO_CURRENT_DOC | HIGH | Create `CURRENT/features/profiles/` — core identity display; write-heavy | ARCHITECT |
| GAP-015 | `apps/VCSM/src/features/social` | NO_CURRENT_DOC | HIGH | Create `CURRENT/features/social/` — social graph write surface | VENOM |
| GAP-016 | `apps/VCSM/src/features/feed` | NO_CURRENT_DOC | MEDIUM | Create `CURRENT/features/feed/` — content pipeline; controllers and DALs | ARCHITECT |
| GAP-017 | `apps/VCSM/src/features/post` | NO_CURRENT_DOC | MEDIUM | Create `CURRENT/features/post/` — dual MVC (postcard + commentcard) | ARCHITECT |
| GAP-018 | `apps/VCSM/src/features/notifications` | NO_CURRENT_DOC | MEDIUM | Create `CURRENT/features/notifications/` — inbox controller + 8 notification types | ARCHITECT |
| GAP-019 | `apps/VCSM/src/features/explore` | NO_CURRENT_DOC | MEDIUM | Create `CURRENT/features/explore/` — public-facing discovery controller | ARCHITECT |
| GAP-020 | `apps/VCSM/src/features/onboarding` | NO_CURRENT_DOC | MEDIUM | Create `CURRENT/features/onboarding/` — first-run controller + DAL | ARCHITECT |
| GAP-021 | `apps/VCSM/src/features/legal` | NO_CURRENT_DOC | MEDIUM | Create `CURRENT/features/legal/` — compliance-critical consent tracking | VENOM |
| GAP-022 | `apps/VCSM/src/features/media` | NO_CURRENT_DOC | MEDIUM | Create `CURRENT/platform/media/` — PLATFORM; TICKET-PLATFORM-RLS-001 open | VENOM+ELEKTRA |
| GAP-023 | `apps/VCSM/src/features/hydration` | NO_CURRENT_DOC | MEDIUM | Create `CURRENT/platform/hydration/` — minimal but platform-critical bootstrapper | ARCHITECT |
| GAP-024 | `apps/VCSM/src/features/void` | NO_CURRENT_DOC | MEDIUM | Create `CURRENT/features/void/` — document void realm exclusion constraint prominently | VENOM |
| GAP-025 | `apps/VCSM/src/features/ads` | NO_CURRENT_DOC | LOW | Create `CURRENT/features/ads/` — ad display system; low security risk | ARCHITECT |
| GAP-026 | `apps/VCSM/src/features/professional` | NO_CURRENT_DOC | LOW | Create `CURRENT/features/professional/` — multi-subdomain professional vertical | ARCHITECT |
| GAP-027 | `apps/VCSM/src/features/debug` | NO_CURRENT_DOC | LOW | Create `CURRENT/shared/debug/` — shared_infra classification; runtime debug primitives | ARCHITECT |
| GAP-028 | `apps/VCSM/src/features/ui` | NO_CURRENT_DOC | LOW | Create `CURRENT/shared/ui/` — UI primitives; no business logic | ARCHITECT |
| GAP-029 | `apps/VCSM/src/features/portfolio` | NO_CURRENT_DOC | LOW | Create `CURRENT/features/portfolio/` stub — confirm real logic lives in dashboard/cards/ | ARCHITECT |
| GAP-030 | `apps/VCSM/src/features/reviews` | NO_CURRENT_DOC | LOW | Create `CURRENT/features/reviews/` stub — confirm scaffold vs live feature | ARCHITECT |
| GAP-031 | `apps/VCSM/src/features/vgrid` | NO_CURRENT_DOC | LOW | Create `CURRENT/features/vgrid/` — FROZEN; minimal doc noting frozen status | ARCHITECT |
| GAP-032 | `apps/VCSM/src/features/wanders` | NO_CURRENT_DOC | LOW | Create `CURRENT/features/wanders/` — FROZEN; minimal doc noting frozen status | ARCHITECT |
| GAP-033 | `apps/VCSM/src/features/wanderex` | NO_CURRENT_DOC | LOW | Create `CURRENT/features/wanderex/` — FROZEN; minimal doc noting frozen status | ARCHITECT |
| GAP-034 | `apps/VCSM/src/app/routes/public/join.routes.jsx` | PUBLIC_UNAUDITED | CRITICAL | Public join route not audited — active on current branch; ownership establishment entry | VENOM+ELEKTRA |
| GAP-035 | `apps/VCSM/src/features/public/vportBusinessCard/` | PUBLIC_UNAUDITED | HIGH | Zero-auth surface exposing VPORT identity data — no audit on record | VENOM+ELEKTRA |
| GAP-036 | `apps/VCSM/src/features/public/vportMenu/` | PUBLIC_UNAUDITED | HIGH | Zero-auth surface exposing menu data — no audit on record | VENOM+ELEKTRA |
| GAP-037 | `apps/VCSM/src/app/routes/public/auth.routes.jsx` | PUBLIC_UNAUDITED | CRITICAL | Auth entry points not audited as a public surface | VENOM+ELEKTRA |
| GAP-038 | `apps/VCSM/src/features/booking/controller/` | WRITE_UNAUDITED | CRITICAL | Booking write surface — TICKET-BOOKING-RPC-001 open; no CURRENT doc to anchor audit findings | VENOM+ELEKTRA |
| GAP-039 | `apps/VCSM/src/features/upload/controller/` | WRITE_UNAUDITED | HIGH | Dual controller present (controller/ + controllers/); unclear which is canonical | VENOM+ELEKTRA |
| GAP-040 | `apps/VCSM/src/features/join/controllers/` | WRITE_UNAUDITED | HIGH | Join write controllers modified on current branch — no coverage | VENOM+ELEKTRA |
| GAP-041 | `apps/VCSM/src/features/media/controller/` | WRITE_UNAUDITED | HIGH | TICKET-PLATFORM-RLS-001 open — media_assets RLS policy gap; no CURRENT doc | VENOM+ELEKTRA |
| GAP-042 | `apps/VCSM/src/features/settings/account/controller/` | WRITE_UNAUDITED | HIGH | Account mutation controller — no audit anchor | VENOM+ELEKTRA |
| GAP-043 | `apps/VCSM/src/features/settings/privacy/controller/` | WRITE_UNAUDITED | HIGH | Privacy config write — no audit anchor | VENOM+ELEKTRA |
| GAP-044 | `apps/VCSM/src/app/routes/public/wanderex.routes.jsx` | FROZEN_BOUNDARY_RISK | MEDIUM | FROZEN feature still has an active public route registered in app shell | ARCHITECT |
| GAP-045 | `apps/VCSM/src/app/routes/public/wanders.routes.jsx` | FROZEN_BOUNDARY_RISK | MEDIUM | FROZEN feature still has an active public route registered in app shell | ARCHITECT |
| GAP-046 | `apps/VCSM/src/app/routes/learning/learning.routes.jsx` | FROZEN_BOUNDARY_RISK | LOW | FROZEN learning feature route registered in app shell | ARCHITECT |
| GAP-047 | `apps/VCSM/src/features/notifications/types/` | NO_SCREEN_COVERAGE | LOW | 8 notification type subdirs (booking, comment, follow, mention, reaction, review, team, components) not individually covered | ARCHITECT |
| GAP-048 | `apps/VCSM/src/features/profiles/kinds/vport/screens/` | NO_SCREEN_COVERAGE | HIGH | VPORT profile subscreens (booking, content, menu) have hooks; no screen coverage documented | VENOM+ELEKTRA |
| GAP-049 | `apps/VCSM/src/state/identity/` | NO_CURRENT_DOC | MEDIUM | State/identity has controller/ + queries/ subdirs — not documented under CURRENT/state/ | ARCHITECT |

## Recommended Workflow Additions

| Item | Type | Create CURRENT Folder | Add FEATURE_STATUS Row | First Command | Priority | Reason |
|---|---|---|---|---|---|---|
| actors | PLATFORM | `CURRENT/platform/actors/` | Already present | ARCHITECT | P0 | Core actor data layer — foundational for all identity operations |
| auth | PLATFORM | `CURRENT/platform/auth/` | Already present | VENOM+ELEKTRA | P0 | Full auth pipeline — foundational security surface |
| booking | FEATURE | `CURRENT/features/booking/` | Already present | VENOM+ELEKTRA | P0 | P0 security surface — TICKET-BOOKING-RPC-001 open |
| identity | PLATFORM | `CURRENT/platform/identity/` | Already present | ARCHITECT | P0 | All ownership gates depend on identity resolver |
| vport | FEATURE | `CURRENT/features/vport/` | Already present | ARCHITECT | P0 | Core VPORT identity — P0 foundational |
| join | FEATURE | `CURRENT/features/join/` | Already present | VENOM+ELEKTRA | P1 | Active on current branch — ownership establishment surface |
| settings | FEATURE | `CURRENT/features/settings/` | Already present | VENOM+ELEKTRA | P1 | Write-heavy mutation surface; account/privacy/vports stacks |
| public | FEATURE | `CURRENT/features/public/` | Already present | VENOM+ELEKTRA | P1 | Zero-auth surfaces — vportBusinessCard + vportMenu |
| invite | FEATURE | `CURRENT/features/invite/` | Already present | VENOM+ELEKTRA | P1 | Trust token lifecycle — invite issuance and acceptance |
| moderation | FEATURE | `CURRENT/features/moderation/` | Already present | VENOM+ELEKTRA | P1 | Content safety write surface |
| block | FEATURE | `CURRENT/features/block/` | Already present | VENOM+ELEKTRA | P1 | Trust boundary write surface |
| upload | PLATFORM | `CURRENT/platform/upload/` | Already present | VENOM+ELEKTRA | P1 | Dual controller/ + controllers/ present; needs canonical path documented |
| chat | FEATURE | `CURRENT/features/chat/` | Already present | VENOM | P1 | Real-time messaging — authenticated write surface |
| profiles | FEATURE | `CURRENT/features/profiles/` | Already present | ARCHITECT | P1 | Core identity display — write-heavy vport kinds subpath |
| social | FEATURE | `CURRENT/features/social/` | Already present | VENOM | P1 | Social graph write surface — friend/subscribe/privacy controllers |
| feed | FEATURE | `CURRENT/features/feed/` | Already present | ARCHITECT | P2 | Core social feed pipeline — controllers and DALs |
| post | FEATURE | `CURRENT/features/post/` | Already present | ARCHITECT | P2 | Dual MVC (postcard + commentcard) — core content surface |
| notifications | FEATURE | `CURRENT/features/notifications/` | Already present | ARCHITECT | P2 | 8 notification type subdirs; inbox controller + runtime |
| explore | FEATURE | `CURRENT/features/explore/` | Already present | ARCHITECT | P2 | Public discovery surface — controller + DAL |
| onboarding | FEATURE | `CURRENT/features/onboarding/` | Already present | ARCHITECT | P2 | First-run UX — controller + DAL |
| legal | FEATURE | `CURRENT/features/legal/` | Already present | VENOM | P2 | Compliance-critical consent tracking |
| media | PLATFORM | `CURRENT/platform/media/` | Already present | VENOM+ELEKTRA | P2 | TICKET-PLATFORM-RLS-001 open — media_assets RLS gap |
| hydration | PLATFORM | `CURRENT/platform/hydration/` | Already present | ARCHITECT | P2 | Platform bootstrapper — minimal but critical |
| void | FEATURE | `CURRENT/features/void/` | Already present | VENOM | P2 | Void realm system post exclusion rule must be documented |
| state/identity | STATE | `CURRENT/state/` (update) | NO — add sub-entry | ARCHITECT | P2 | state/identity has controller/ + queries/ — not yet reflected in CURRENT/state/ |
| ads | FEATURE | `CURRENT/features/ads/` | Already present | ARCHITECT | P3 | Ad display system — low risk; complete coverage of classified features |
| professional | FEATURE | `CURRENT/features/professional/` | Already present | ARCHITECT | P3 | Professional vertical — multi-subdomain feature |
| portfolio | FEATURE | `CURRENT/features/portfolio/` | Already present | ARCHITECT | P3 | Stub — needs verification against dashboard/cards/ |
| reviews | FEATURE | `CURRENT/features/reviews/` | Already present | ARCHITECT | P3 | Stub — needs verification against engines/ |
| vgrid | FEATURE | `CURRENT/features/vgrid/` | Already present | ARCHITECT | P3 | FROZEN — minimal doc noting frozen status |
| wanders | FEATURE | `CURRENT/features/wanders/` | Already present | ARCHITECT | P3 | FROZEN — minimal doc noting frozen status |
| wanderex | FEATURE | `CURRENT/features/wanderex/` | Already present | ARCHITECT | P3 | FROZEN — minimal doc noting frozen status |
| debug (shared) | SHARED_INFRA | `CURRENT/shared/debug/` | NO — not a product feature | ARCHITECT | P4 | Runtime debug rendering primitives — shared_infra |

## Do Not Document As Feature

| Source Path | Reason | Confirmed |
|---|---|---|
| `apps/VCSM/src/dev/` | Dev diagnostics tooling — groups, helpers, ui, runAllDiagnostics.js. Modified on current branch for dev use only. Never ships to production per CLAUDE.md. | YES |
| `apps/VCSM/src/debuggers-stub/` | Dev-only debugger stub shim. CLAUDE.md explicitly lists debuggers/ as "never ship to production." Zero coverage value. | YES |
| `apps/VCSM/src/assets/` | Static assets only — fonts/, icons/, images/. No business logic; no documentation value. Reference by path in other docs. | YES |
| `apps/VCSM/src/screens/` | Contains only DevDiagnosticsScreen.jsx — a single dev-only diagnostic screen. Not a product screen collection. | YES |
| `apps/VCSM/src/scripts/` | Build and utility scripts — index.js, load/. Dev/build tooling, not product code. | YES |

## Recommended Next Tickets

[TICKET-0007-SEC] Audit booking write surface and implement typed RPC state machine — P0 — TICKET-BOOKING-RPC-001 is open; customer_actor_id injection and status overpermission confirmed on live DB

[TICKET-0008-SEC] Audit and document join + invite ownership establishment flow — P0 — Active on current branch; join controllers modified; public entry point with no CURRENT coverage

[TICKET-0009-SEC] Audit zero-auth public surfaces (vportBusinessCard, vportMenu, howto, join routes) — P0 — No auth required on MVC-complete surfaces; data exposure risk unquantified

[TICKET-0010-SEC] Resolve TICKET-PLATFORM-RLS-001 — media_assets RLS policy cleanup — P1 — media_assets_learning_owner_update confirmed public on live DB; open ticket with no doc anchor

[TICKET-0011-TASK] Create CURRENT/ documentation folders for Phase 1 platform foundation (auth, identity, actors, bootstrap, services, state, hydration) — P1 — All P0-P1 platform entries lack CURRENT/ folders; governance has no anchor for audits

[TICKET-0012-TASK] Create CURRENT/ documentation folders for Phase 2 high-risk product features (booking, vport, public, settings, join, invite, social, moderation, void) — P1 — 33 features have no CURRENT/ folder; security and governance audits cannot be anchored

[TICKET-0013-SEC] Audit upload dual-controller anomaly (controller/ vs controllers/) and confirm canonical write path — P1 — Dual controller directories indicate either dead code or split ownership; ownership gate coverage unknown

[TICKET-0014-ENG] Investigate and remediate frozen feature routes still registered in app shell (wanderex, wanders, learning) — P2 — FROZEN features per FEATURE_STATUS still have live public route registrations (GAP-044, GAP-045, GAP-046)

[TICKET-0015-TASK] Create CURRENT/ documentation folders for Phase 3 core social features (feed, profiles, post, chat, notifications, explore) — P2 — Core social surfaces have no governance anchor

[TICKET-0016-SEC] Full audit of settings write surfaces (account, privacy, profile, vports controllers and DALs) — P1 — Write-heavy mutation surface with no CURRENT doc anchor; four separate controller stacks

[TICKET-0017-TASK] Verify portfolio and reviews stub features against engines/ — confirm live vs placeholder — P2 — Both contain only setup stubs; real logic may live in engines/ or dashboard/cards/; classification accuracy at risk

[TICKET-0018-TASK] Document void realm system post exclusion constraint in CURRENT/features/void/ — P2 — Memory constraint (resolvePublicRealmIdDAL() rule) has no documentation anchor; risk of regression if constraint is not codified
