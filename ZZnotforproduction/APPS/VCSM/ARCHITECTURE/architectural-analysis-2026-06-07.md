# VCSM Platform — Architectural Analysis
Date: 2026-06-07
Scope: apps/VCSM/src/features (38 feature domains, 1,715 total files)
Author: Automated first-principles analysis — all claims verified against source

---

## 1. Executive Summary

The VCSM platform is a full-stack social commerce application built in JavaScript (ES Modules, React Native/web hybrid via Expo/Vite). At its core the codebase is evolving toward a **Feature-Sliced Design (FSD)** architecture with a strict **Clean Architecture** layering contract enforced by build tooling conventions and adapter boundaries. The architecture is ambitious, partially complete, and increasingly consistent across newer features while older or secondary features still carry legacy patterns.

The dominant pattern is a five-layer vertical stack per feature: `DAL → Model → Controller → Hook → Screen/Adapter`. This stack is enforced by a documented CLAUDE.md contract (`apps/VCSM/CLAUDE.md`) that explicitly forbids skipping layers. The adapter boundary rule — "never import another feature's internal files directly" — is architecturally sound and largely respected, with notable exceptions documented in adapter files themselves via `§5.3 exception` comments. The `booking` feature's `assertActorOwnsVportActorController` is the most widely consumed shared controller, reached from 9+ cross-feature call sites through `booking.adapter.js`, making it a de facto platform ownership primitive.

State management is split: Supabase (Postgres + Realtime) handles server state via React Query in most features; Zustand handles UI state in a limited but explicit way (one confirmed store: `chat/store/chatUiStore.js`; global actor store: `@/state/actors/actorStore`; identity stores: `@/state/identity/`). The platform's identity model is actor-centric — every operation is scoped to an `actorId` of kind `user` or `vport`, never a raw `userId` or `profileId`.

Key strengths are the hardened ownership verification chain (`actor_owners` table via controller guards), the feed pipeline's parallel DAL composition pattern, the adapter boundary enforcement, and a real monitoring integration (`captureVcsmError`). Key architectural risks are the significant feature size asymmetry (profiles at 396 files vs. actors at 4), session calls leaking into non-DAL layers in a handful of files, the booking feature being overloaded as a shared security primitive (ownership checks from 9 features depend on it), and the existence of sub-features inside `post` (119 files), `wanders` (124), and `vportDashboard` (200) that each represent internal modular monolith growth that has not been split into separate top-level features.

The codebase is a serious commercial platform with genuine security reasoning at the controller layer, well-structured adapter boundaries, and explicit documentation of known gaps (DB audit notes, `§5.3 exception` comments, TICKET references inline in code). The team has clearly internalized the architecture contract and it shows in the consistency of newer code.

---

## 2. Feature Inventory

| Feature | Files | Core Layers Present | Notes |
|---|---|---|---|
| actors | 4 | adapters, controllers, dal, model | Minimal — search-only surface |
| ads | 18 | adapters, api, constants, dal, hooks, lib, model, screens, ui, usecases | Has `usecases/` layer (rare) |
| auth | 61 | adapters, components, controllers, dal, hooks, model, screens, styles | Full stack; tests present |
| block | 18 | adapters, controllers, dal, guards, hooks, ui | Has `guards/` layer for BlockGate.jsx |
| booking | 70 | adapters, controllers, dal, hooks, model | Largest non-profile feature; shared security primitive |
| chat | 66 | adapters, conversation/, inbox/, start/, store, setup.js | Internal sub-domain split |
| debug | 3 | components, helpers, store | Dev-only panel |
| explore | 23 | adapters, controllers, dal, hooks, models, screens, ui, usecases | Has `usecases/` layer |
| feed | 46 | adapters, components, controllers, dal, hooks, model, pipeline, queries, screens | Has `pipeline/` layer |
| flyerBuilder | 54 | adapters, components, controllers, dal, designStudio/, hooks, models, screens, styles | Deep nested sub-domain |
| hydration | 2 | setup.js, vcsmActorHydrator.js | Engine bridge only |
| identity | 10 | adapters, controllers, dal, hooks, resolvers, setup.js | Engine-backed; thin |
| initiation | 18 | adapters, components, controllers, dal, hooks, models, screens | Onboarding flow |
| invite | 7 | adapters, controllers, dal, hooks, screens | Small |
| join | 13 | adapters, controllers, dal, hooks, screens | Barbershop QR join flow |
| legal | 26 | adapters, config, controllers, dal, docs, engine, hooks, screens | Has `engine/` layer (internal) |
| media | 9 | adapters, controllers, dal, models, setup.js | Media asset lifecycle |
| moderation | 35 | adapters, components, controllers, dal, hooks, models, types | Full stack |
| notifications | 46 | adapters, hooks, inbox/, publish.js, runtime/, screen/, setup.js, types/ | Engine-backed; sub-domain split |
| portfolio | 2 | setup.js only | Stub/engine bridge |
| post | 119 | adapters, commentcard/, postcard/ | Major internal split into two sub-features |
| professional | 34 | adapters, briefings/, core/, enterprise/, professional-nurse/, screens | Multi-sub-domain |
| profiles | 396 | adapters, components, controller, dal, debug, hooks, kinds/ | Largest feature; kinds/ has citizen + vport sub-trees |
| public | 64 | adapters, screens, vportBusinessCard/, vportMenu/ | Two sub-domains for unauthenticated surfaces |
| qrcode | 8 | adapters, tests | QR generation |
| reviews | 1 | setup.js only | Engine setup stub |
| settings | 85 | adapters, account/, privacy/, profile/, ui, vports/ | 4 sub-domains |
| shell | 6 | adapters, modules/bottom-bar/ | Navigation shell |
| social | 45 | adapters, components, friend/request/, friend/subscribe/, privacy/ | Multi-sub-domain follow/subscribe |
| upload | 38 | adapters, controllers, dal, hooks, screens | Media upload pipeline |
| vgrid | 0 | empty | Frozen / placeholder |
| void | 11 | screens, hooks, models, controller | Void realm feature |
| vport | 29 | adapters, components, controllers, dal, hooks, models, public/, screens | Vport creation/lifecycle |
| vportDashboard | 200 | adapters, components, controller, dal, dashboard/cards/ | Deepest nesting; 10+ dashboard card sub-features |
| wanderex | 23 | adapters, controllers, dal, hooks, models, screens | Public-facing wander marketplace |
| wanders | 124 | core/, services, adapters, hooks | Wanders async messaging sub-system |

---

## 3. Architecture Classification

### Evidence Evaluation

**Vertical Slice Architecture (strong match)**
Each feature is a self-contained vertical slice with its own DAL, model, controller, hook, and screen layers. Cross-slice communication occurs only through documented adapter boundaries. Evidence: `booking.adapter.js`, `identity.adapter.js`, `social.adapter.js` all act as the explicit public surface of their respective slices. The CLAUDE.md contract mandates: "Never import another feature's internal files directly."

**Feature-Sliced Design (partial match)**
The `features/` top-level is FSD terminology. Adapters are the "public API" of each slice. However, VCSM does not use FSD's entities/shared/widgets layer structure. The `@/shared/` path alias maps to shared primitives, and `@/state/` provides global actor and identity stores. This is a looser FSD variant rather than a strict implementation.

**Clean Architecture (strong match at layer level)**
The explicit layer contract `DAL → Model → Controller → Hook → Screen` maps cleanly to Clean Architecture's Data/Domain/Application/Presentation rings. The strict rule that screens call hooks, hooks call controllers, controllers call models and DALs — and that direction is never reversed — reflects Clean Architecture's dependency rule. The adapter layer acts as Clean Architecture's interface adapters ring.

**Domain-Driven Design (partial match)**
The platform uses domain vocabulary consistently: Actor, Vport, Citizen, Booking, Availability, Notification, Feed. The `profiles/kinds/` tree reflects an aggregate approach to actor-kind polymorphism. However, explicit Aggregate objects, Domain Events, and Repository interfaces are absent. The controller layer performs work that DDD would place in a Domain Service.

**Hexagonal Architecture (weak match)**
The DAL layer is the only port/adapter boundary. There is no inversion-of-control container, no injected repository interfaces, and no test doubles for Supabase. The `feed/pipeline/` file does use dependency injection at the DAL level (injecting wrapped DALs for dev profiling) but this is not systematic.

**Modular Monolith (accurate descriptor)**
At the repository level, this is a modular monolith: all features compile together, share a single Supabase client singleton, and communicate via in-process function calls through adapter boundaries.

### Verdict

The VCSM platform is building a **Modular Monolith with Feature-Sliced Vertical Slices**, enforcing a **Clean Architecture layer contract** within each slice, with **actor-centric Domain vocabulary** and **explicit adapter boundaries** as the inter-slice communication contract. It is not a strict implementation of any single architectural pattern — it is a practical hybrid built under an enforced contract that has been refined iteratively.

---

## 4. Domain Map

### Core Domains (revenue-critical)

| Domain | Feature(s) | Evidence |
|---|---|---|
| Identity & Actor Management | identity, auth, hydration | `vcsmIdentity.resolver.js`, `identityContext`, `hydrateVcsmActor` |
| Vport (Business Profile) | vport, vportDashboard, profiles/kinds/vport | `vport.core.dal.js`, 200+ vportDashboard files |
| Booking & Availability | booking, vportDashboard/bookings | `createBooking.controller.js`, 70 booking files |
| Feed & Content | feed, post, upload | `fetchFeedPage.pipeline.js`, 119 post files |
| Commerce (Gas, Menu, Rates, Exchange) | vportDashboard/gasprices, profiles/kinds/vport/menu, profiles/kinds/vport/rates | vportDashboard/gasprices controllers, profiles menu/rates |
| Reviews | reviews (setup), profiles/kinds/vport/review | `reviews/setup.js`, VportReviews.controller.js |

### Supporting Domains

| Domain | Feature(s) | Evidence |
|---|---|---|
| Notifications | notifications | `publish.js` + engine bridge; 46 files |
| Chat & Messaging | chat | 66 files, Supabase Realtime |
| Social Graph (Follow/Subscribe) | social | follow/subscribe/request sub-domains |
| Moderation | moderation | `assertModerationAccessController`, reports DAL |
| Block | block | BlockGate.jsx, `blockActor.controller.js` |
| Media Assets | media, upload | `createMediaAsset.controller.js`, upload pipeline |
| Settings | settings | account, privacy, profile, vports sub-domains |
| Profiles (public view) | profiles, public | `getProfileView.controller.js`, public vportMenu/businessCard |

### Generic Domains (infrastructure)

| Domain | Feature(s) | Evidence |
|---|---|---|
| Authentication | auth | Supabase auth DAL wrappers |
| QR Codes | qrcode | `@/shared/lib/qrUrlBuilders` |
| Legal / Consent | legal | `legalCompliance.engine.js` |
| Advertising | ads | `adPipeline.usecase.js` |
| Design Studio / Flyer Builder | flyerBuilder | Canvas, Konva, design tools |
| Wanders | wanders, wanderex | 124+23 files; distinct messaging sub-system |
| Professional | professional | nurse, enterprise sub-domains |
| Initiation / Onboarding | initiation | Vibe tags, onboarding steps |

### Bounded Contexts

Four bounded contexts are identifiable:

1. **Authenticated Citizen Context** — auth, identity, profiles, social, feed, post, chat, notifications, moderation, block, settings. All operations require `useIdentity()` and a resolved `actorId`.

2. **Vport Business Context** — vport, vportDashboard, booking, reviews, profiles/kinds/vport, flyerBuilder. Operations are scoped to a vport actor; ownership enforced via `assertActorOwnsVportActorController`.

3. **Public/Unauthenticated Context** — `public/vportMenu`, `public/vportBusinessCard`, `legal` (public docs), `wanderex`. No session required; read-only Supabase queries only.

4. **System/Engine Context** — hydration, identity/resolver, notifications/publish, reviews/setup, portfolio/setup. Bridge files that configure shared engines.

### Cross-Domain Coupling (with file evidence)

1. **Booking as platform security primitive**: `booking/adapters/booking.adapter.js` exports `assertActorOwnsVportActorController` as a cross-feature auth primitive consumed by `settings/privacy/controller/actorPrivacy.controller.js`, `settings/account/controller/account.controller.js`, `settings/vports/controller/vportDirectoryVisibility.controller.js`, `settings/vports/controller/vportBusinessCardSettings.controller.js`, `settings/vports/controller/vportBusinessCard.controller.js`, `settings/vports/controller/vportSocialSettings.controller.js`, `join/controllers/joinBarbershopAccount.controller.js`, `join/controllers/joinBarbershopQr.controller.js`. This is a documented §5.3 exception in the adapter file.

2. **Identity as universal dependency**: `identity/adapters/identity.adapter.js` is imported by ~114 files across ads, settings, professional, post, moderation, feed, social, vportDashboard, and more.

3. **Feed cache invalidation from settings privacy**: `settings/privacy/controller/actorPrivacy.controller.js` imports `invalidateActorBundleEntry` from `feed/adapters/feedCache.adapter.js` — creating a settings → feed coupling.

4. **Settings imports from social**: `settings/privacy/controller/actorPrivacy.controller.js` imports `invalidateActorPrivacyCacheAdapter` from `social/adapters/privacy/actorPrivacy.adapter.js`.

5. **Settings imports from vport**: `settings/profile/controller/recordProfileMediaAsset.controller.js` imports `updateVportAvatarMediaAssetIdDAL` and `updateVportBannerMediaAssetIdDAL` from `vport/adapters/vport.adapter.js`.

6. **Professional imports from settings**: `professional/enterprise/components/EnterpriseWorkspace.jsx` and `professional/enterprise/components/enterprisePanels.jsx` import `Card` from `settings/adapters/settings.adapter.js`.

---

## 5. Layer Architecture Analysis

### DAL (Data Access Layer)

**Responsibility in practice**: Direct Supabase client operations — `.from()`, `.rpc()`, `.functions.invoke()`. Every DAL file wraps one or a small set of related Supabase queries. DAL files receive typed parameters and return data shapes. They never perform business logic.

**Consistency**: High in well-established features (booking, feed, profiles, moderation). Most DAL files follow explicit column selection rather than `select('*')` (banned per CLAUDE.md). TTL caching is applied in read DALs where latency matters: `feed.read.actorsBundle.dal.js`, `feed.read.blockRows.dal.js`, `social/friend/request/dal/actorFollows.dal.js`, `social/privacy/dal/actorSocialSettings.dal.js`, `public/vportMenu/dal/*.dal.js`.

**Breakdowns**:
- `settings/vports/dal/vports.read.dal.js` and `settings/vports/dal/vports.write.dal.js` call `supabase.auth.getUser()` directly inside DAL files — auth logic leaking into the data layer.
- `settings/profile/dal/profile.write.dal.js` calls `supabase.auth.getUser()` inside a write DAL.
- `upload/adapters/posts.adapter.js` (misnamed as adapter) calls `supabase.auth.getUser()` directly — this file is functionally a controller, not an adapter.

### Model (Domain Model)

**Responsibility in practice**: Pure data transformations, shape mappers, business rules without side effects. Examples: `normalizeFeedRows.model.js`, `buildBookingPayload.model.js`, `feedBlockVisibility.model.js`, `feedFollowVisibility.model.js`, `mapVportPublicDetails.model.js`. Models receive raw data rows and return structured domain objects.

**Consistency**: Well-established. Model files are consistently named `*.model.js` and contain no Supabase calls. Some features use `*.model.js` for UI state/defaults (e.g., `vportAdsSettingsShell.model.js`, `vportActorMenuCategory.model.js` inside screens/menu/components/) which represents a naming inconsistency — these are closer to view-models.

**Breakdowns**:
- `profiles/kinds/vport/screens/menu/components/vportActorMenuCategory.model.js` is in a screens subfolder, not a model subfolder — layering discipline breaks for UI-specific model-like files.
- Some model files are named `*.model.js` but sit inside `screens/` or `components/` subdirectories.

### Controller (Application Logic)

**Responsibility in practice**: Orchestrate DAL calls, validate inputs, enforce ownership/auth, handle error cases, invoke engine APIs, and map results through model functions. Controllers are async functions (not classes). They are the primary security enforcement point at the app layer.

**Consistency**: Good in core features (booking, moderation, social, profiles, vportDashboard). The strongest controllers like `createBooking.controller.js` are well-documented with explicit source validation, actor kind checks, and monitoring calls.

**Breakdowns**:
- `legal/controllers/legalConsent.controller.js` calls `supabase.auth.getUser()` directly in the controller body rather than delegating to a DAL.
- `moderation/controllers/moderationActions.controller.js` calls `supabase.auth.getUser()` twice — auth check done inside controller rather than delegated.
- `moderation/controllers/undoConversationCover.controller.js` also calls `supabase.auth.getUser()` directly.

### Hook (React Integration Layer)

**Responsibility in practice**: Bind controller functions to React lifecycle (useState, useEffect, useCallback), manage loading/error states, call React Query's useQuery/useMutation for server state, and surface results to components. Hooks never import Supabase directly.

**Consistency**: High. Hooks consistently use `useIdentity()` from `identity/adapters/identity.adapter.js` to get `actorId` and pass it into controller calls. React Query is used where appropriate (settings features predominantly). Many features use manual state management with useEffect + useState for simple reads.

**Breakdowns**:
- Mixed patterns: some hooks use React Query, others use manual setState + useEffect. This creates inconsistent loading/caching semantics across features.
- `settings/privacy/hooks/useActorPrivacy.js` uses both `useAuth()` (from `@/app/providers/AuthProvider`) and `useIdentity()` — dual auth source.

### Adapter (Cross-Feature Contract)

**Responsibility in practice**: Re-export a feature's public surface (hooks, components, selected controllers) for other features to consume. Adapters are the only legal cross-feature import target. Most adapter files are simple barrel re-exports. Some adapters contain component binding logic (e.g., `moderation/adapters/components/ReportModal.adapter.js`).

**Consistency**: Good. All major features have at least one `*.adapter.js`. The adapter naming convention is consistent. Cross-feature imports from non-adapter files are rare and when present are documented with exception comments.

**Breakdowns**:
- `upload/adapters/posts.adapter.js` contains a `createSystemPost` function with business logic and Supabase auth calls — it is not a pure re-export adapter.
- Some adapter files contain hook bindings that perform data transformation (blurring adapter and hook responsibilities).

### Screen/View Layer

**Responsibility in practice**: Render-only React components. Top-level screens compose hooks and present data. The convention `Screen.jsx` → `View.jsx` → `components/` → sub-components is visible in well-structured features (notifications, vportDashboard, public/vportBusinessCard).

**Consistency**: Variable. Mature features (notifications, public, vportDashboard) have a clear `Screen → View` separation. Older or less-developed features (ads, initiation) place logic directly in screen files.

### Pipeline Layer (feed only)

**Responsibility in practice**: `feed/pipeline/fetchFeedPage.pipeline.js` introduces a pipeline abstraction for orchestrating parallel DAL calls without holding that logic in a controller. This is the only pipeline file in the codebase — an experimental architectural layer that has not propagated to other features.

---

## 6. Dependency Map

### Cross-Feature Imports (documented violations and exceptions)

All legitimate cross-feature imports go through adapters. Known documented exceptions:

| Consumer Feature | Imported Adapter/Exception | Purpose |
|---|---|---|
| `settings/privacy/controller` | `booking/adapters/booking.adapter` — `assertActorOwnsVportActorController` | Ownership check (§5.3 exception) |
| `settings/account/controller` | `booking/adapters/booking.adapter` — same | Ownership check |
| `settings/vports/controller/*` (4 files) | `booking/adapters/booking.adapter` — same | Ownership check |
| `join/controllers` (2 files) | `booking/adapters/booking.adapter` — same | Ownership check |
| `settings/privacy/controller` | `feed/adapters/feedCache.adapter` | Feed cache invalidation |
| `settings/privacy/controller` | `social/adapters/privacy/actorPrivacy.adapter` | Social privacy cache invalidation |
| `settings/profile/controller` | `vport/adapters/vport.adapter` | Profile media asset update |
| `settings/account/hooks` | `vport/adapters/vport.public.adapter` | Vport core ops |
| `settings/vports/ui` | `vport/adapters/CreateVportForm.jsx.adapter` | Vport creation form |
| `settings/vports/ui` | `ads/adapters/widgets/OnemoredaysAd.adapter` | Ad widget in settings |
| `settings/vports/ui` | `qrcode/adapters/qrcode.adapter` | QR modal |
| `settings/privacy/ui` | `social/adapters/friend/request/hooks/*.adapter` | Follow request actions |
| `professional/enterprise/components` | `settings/adapters/settings.adapter` — `Card` component | UI primitive reuse |

### Engine Consumption Patterns

No files in `features/` import directly from `engines/` paths (confirmed: grep returned zero results). Engine access happens through:
- `@hydration` path alias → hydration engine (used in `feed/pipeline/fetchFeedPage.pipeline.js`, `post/commentcard/hooks/useCommentThread.js`)
- `@notifications` path alias → notifications engine (used in `notifications/publish.js`)
- `@reviews` path alias → reviews engine (used in `reviews/setup.js`)
- `@/state/identity/` → identity state context (used in `identity/adapters/identity.adapter.js`)
- `@/state/actors/` → actor store (used in feed hooks, post views, settings)
- `@/state/social/` → social state (follow requests store)

### Shared Utility Consumption

`@/shared/` imports are present in ~60+ files. Most common: `@/shared/lib/ttlCache` (6+ DAL files), `@/shared/components/ActorLink`, `@/shared/components/Spinner`, `@/shared/hooks/useDesktopBreakpoint`, `@/shared/lib/qrUrlBuilders`, `@/shared/lib/shareNative`, `@/shared/components/Skeleton`, `@/shared/lib/businessCard/businessCardSettings.model`.

### Circular Dependency Risks

1. **booking → settings → booking**: `settings/vports/controller/*.controller.js` imports `booking.adapter` which exports `assertActorOwnsVportActorController`. This is a one-directional dependency (settings imports booking, booking does not import settings), so no circular dependency exists — but it is a tight coupling worth monitoring.

2. **settings → feed → ???**: `settings/privacy/controller/actorPrivacy.controller.js` imports from `feed/adapters/feedCache.adapter.js`. Feed does not import from settings — no cycle, but unexpected domain coupling.

3. **settings → social**: `settings/privacy/controller/actorPrivacy.controller.js` imports from `social/adapters`. Social does not import from settings — no cycle.

### Dependency Direction Violations

1. `settings/privacy/hooks/useActorPrivacy.js` imports from both `@/app/providers/AuthProvider` (app layer) and `@/features/identity/adapters/identity.adapter` — dual auth source pattern is a violation of the identity-as-single-source rule.

2. `upload/adapters/posts.adapter.js` is named as an adapter but contains controller logic (`createSystemPost` with supabase.auth call) — layer role violation.

3. `settings/vports/dal/vports.read.dal.js` and `vports.write.dal.js` call `supabase.auth.getUser()` — auth logic in DAL is a layer violation. Auth session should be fetched at the controller or hook level and passed into DAL functions.

---

## 7. Data Flow Analysis

### Authentication + Session Establishment

Entry: `auth/screens/LoginScreen.jsx` → `auth/hooks/useLogin.js` → `auth/controllers/login.controller.js` → `auth/dal/login.dal.js` → `supabase.auth.signInWithPassword()`

After auth: `auth/controllers/authCallback.controller.js` → `auth/dal/authCallback.dal.js` (exchange code for session) → `identity/controllers/ensureVcsmPlatformBootstrap.controller.js` → `identity/resolvers/vcsmIdentity.resolver.js` → `platform.user_app_actor_links` query → identity context populated via `@/state/identity/identityContext`

Session is stored in Supabase Auth storage and read via `supabase.auth.getSession()` / `supabase.auth.getUser()` at the DAL layer.

### Actor/Identity Resolution

`identity/adapters/identity.adapter.js` re-exports `useIdentity` from `@/state/identity/identityContext`. The identity context holds the active actor, available actors, and switch function. `hydrateVcsmActor` in `hydration/vcsmActorHydrator.js` performs the full actor hydration: actor → kind-dispatch → profile/vport lookup → privacy lookup → ownerActorId resolution.

### Feed Content Publishing

Entry: `upload/` feature → `upload/adapters/posts.adapter.js` (createSystemPost) or upload hooks → upload controllers → `upload/dal/insertPost.dal.js` → `vc.posts` table → Supabase Realtime triggers feed refresh.

Feed read: `feed/screens/CentralFeedScreen.jsx` → `feed/hooks/useCentralFeed.js` → uses React Query + `feed/queries/fetchCentralFeedPage.js` → `feed/pipeline/fetchFeedPage.pipeline.js` → 9 parallel DAL calls for posts, media, mentions, actors, blocks, follows, comments, reactions, reaction counts → `normalizeFeedRows.model.js` maps to view objects.

### Booking Creation

Entry: `profiles/kinds/vport/screens/booking/view/VportPublicBookingFlow.jsx` → `profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.js` → `booking/hooks/useCreateBooking.js` → `booking/controllers/createBooking.controller.js`

Controller validates: source classification, duration bounds, resource exists and is active, service linkage, ownership (for management sources), actor kind (citizens only for public), customer actor binding (session injection prevention), slot time validation → `insertBooking.dal.js` → `vc.bookings` → notify via `publishVcsmNotification`.

### Chat Messaging

Entry: `chat/conversation/components/ChatInput.jsx` → `chat/conversation/hooks/conversation/useSendMessageActions.js` → chat engine (via `@/engines/chat` path alias — not in features). Chat inbox: `chat/inbox/hooks/useChatInbox.js` → React Query → Supabase realtime subscription for live updates. Unread count: `chat/inbox/controller/chatUnread.controller.js` → `chat/inbox/dal/inboxUnread.read.dal.js`.

### Profile / Vport Management

Entry: `vport/screens/` or `settings/` → `vport/controllers/submitCreateVport.controller.js` (creation) or `profiles/kinds/vport/controller/*` (management) → `vport/dal/vport.core.dal.js` (creation with `supabase.auth.getUser()` call) → `vport.profile` + `vc.actors` records.

### Media Upload

Entry: `upload/screens/` → `upload/hooks/` → `upload/controllers/` → `upload/dal/uploadMedia.dal.js` → Supabase Storage → `media/controllers/createMediaAsset.controller.js` → `media/dal/mediaAssets.write.dal.js` → `platform.media_assets` record.

### Notifications

Publish: Any controller calls `publishVcsmNotification()` from `notifications/publish.js` → session guard → actor ownership guard (`vc.actor_owners`) → `publishEvent()` from `@notifications` engine → `notification.events` table (with DB BEFORE INSERT trigger enforcing actor ownership).

Read: `notifications/inbox/hooks/useNotificationInbox.js` → `notifications/inbox/controller/Notifications.controller.js` → `notifications/inbox/dal/` → `notification.events` + `notification.inbox` tables.

---

## 8. State Management Architecture

### Libraries Used

1. **Supabase Realtime** — chat, notifications live subscriptions
2. **React Query (`@tanstack/react-query`)** — server state in settings (privacy, profile, vports, account), chat inbox operations (archive, delete, mark-read), selected other features
3. **Zustand** — UI-only state: `chat/store/chatUiStore.js` (confirmed); `@/state/actors/actorStore` (actor hydration store), `@/state/identity/identitySelection.store` (identity switcher), `@/state/social/followRequestsStore` (follow requests)
4. **React Context** — `@/state/identity/identityContext` (identity/actor), `@/app/providers/AuthProvider` (raw Supabase session)
5. **Manual useState/useEffect** — still prevalent in older/simpler hooks; not using React Query for those reads

### Global State Held In

- `@/state/identity/identityContext` (React Context) — active actor, available actors, setIdentity
- `@/state/actors/actorStore` (Zustand) — actor summary map for cross-feature actor lookups
- `@/state/social/followRequestsStore` (Zustand) — pending follow requests
- `@/state/identity/identitySelection.store` (Zustand) — identity selection mode

### Server State Held In

- React Query cache — settings features, chat inbox, social follow status, actor lookups
- Manual hook state (`useState` + async call) — most features use this pattern
- TTL caches in DAL files (`@/shared/lib/ttlCache`) — actor bundles, follow rows, block rows, privacy settings

### Local / Ephemeral State

- `chat/store/chatUiStore.js` (Zustand) — conversation selection, draft text, filter mode
- Per-component `useState` for form state, modal visibility, loading indicators

### Risks

1. **Dual state sources for identity**: Both `useAuth()` (raw Supabase session) and `useIdentity()` (actor context) are used in some hooks (`useActorPrivacy.js`, `useProfileController.js`, `useAccountController.js`, `useVportsController.js`). This creates fragility if one source updates without the other.

2. **Inconsistent React Query adoption**: Settings features use React Query; most other features use manual async state. This means different invalidation, caching, and loading semantics across the platform.

3. **TTL cache staleness**: Multiple DAL files implement their own TTL caches (`createTTLCache` from `@/shared/lib/ttlCache`). These caches bypass React Query's cache invalidation system, creating a secondary cache that is not invalidated on mutations.

4. **Actor store as shared mutable state**: `@/state/actors/actorStore` is directly mutated by `settings/profile/controller/profile.controller.js` (`useActorStore.getState().upsertActors(...)`) — calling the store's write API outside a React hook context.

---

## 9. Security Boundary Review

### Auth Enforcement: Where Checked

**Controller layer (primary app-level gate):**
- `booking/controllers/createBooking.controller.js` — verifies `requestActorId` is a real, non-void citizen; session-binds `customer_actor_id` for public bookings
- `booking/controllers/assertActorOwnsVportActorController.js` — verifies actor kind is `user`, then checks `vc.actor_owners`
- `moderation/controllers/assertModerationAccess.controller.js` — checks moderation authorization via `isModerationAuthorizedDAL`
- `notifications/publish.js` — session guard + actor ownership guard before publish

**DAL layer (mixed, some violations):**
- `settings/vports/dal/vports.read.dal.js` — `supabase.auth.getUser()` called 4x inside DAL read functions (violation: auth check in data layer)
- `settings/vports/dal/vports.write.dal.js` — `supabase.auth.getUser()` called 3x inside DAL write functions (violation)
- `settings/profile/dal/profile.write.dal.js` — `supabase.auth.getUser()` inside write DAL
- `flyerBuilder/designStudio/dal/designStudio.auth.dal.js` — auth DAL (acceptable: dedicated auth DAL file)

**Controller layer (mixed, some violations):**
- `legal/controllers/legalConsent.controller.js` — `supabase.auth.getUser()` called in controller body (acceptable as interim)
- `moderation/controllers/moderationActions.controller.js` — `supabase.auth.getUser()` called twice in controller body
- `moderation/controllers/undoConversationCover.controller.js` — `supabase.auth.getUser()` in controller body

### Actor Ownership: How Enforced

Primary mechanism: `assertActorOwnsVportActorController` (in `booking/controllers/`) checks:
1. `requestActorId` is non-null and non-void
2. `requestActorId.kind === 'user'` (kind gate, unconditional, precedes self-shortcut)
3. If `requestActorId === targetActorId` (self-shortcut) — OK, no DB query needed
4. Otherwise: reads `vc.actor_owners` where `actor_id = targetActorId` and `user_id = requesterActor.profile_id`

This controller is consumed by 9+ call sites via `booking.adapter.js`. The choice to centralize ownership checking in the booking feature and export it as a platform primitive creates a tight coupling between booking and all features that need ownership verification.

Secondary mechanism: `assertSessionOwnsVportActorController` (also in booking) — session-derived variant that calls `supabase.auth.getUser()` at the DAL level (`readOwnerLinkByActorAndSession.dal.js`).

### DAL-Level Protection

Present: `vc.actor_owners` RLS policy enforces `user_id = auth.uid()` at the database level — any direct query is pre-filtered to the authenticated user's owned actors. This is defense-in-depth: even if the app layer passes the wrong actor ID, the DB returns no rows.

DAL files do not perform ownership checks themselves (by design). Ownership verification is the controller's responsibility.

### Session Binding: Controller-Level vs Model-Level

Session binding happens at the **controller level**. In `createBooking.controller.js`:
```javascript
// Session-bind: customer_actor_id must always equal the verified requestActorId for
// public bookings. Reject any caller-supplied customerActorId to prevent actor injection.
customerActorId = requestActorId;
```

This is explicit, documented, and tested.

In `notifications/publish.js`, session binding happens in a publish adapter:
```javascript
const { data: { session } } = await supabase.auth.getSession()
if (!session) return false
// verify actorId is owned by session.user.id
```

### Fragmented vs Centralized Enforcement

The platform uses **layered enforcement**: app-layer controller checks (defense-in-depth) + DB-layer RLS (enforcement backstop). The ownership check is centralized in the booking feature and re-exported via adapter. Session checks are fragmented: some are in DAL files, some in controllers, some in adapter-level functions. The fragmentation is a known architectural gap — the eventual direction is to move all session checks to dedicated auth DAL files and call them from controllers.

---

## 10. Scalability Assessment

### 10k Users: Current Risks

- **TTL caches in DAL files**: Multiple independent TTL caches (actorsBundle, followRows, blockRows, privacySettings, menuSlug) will hold stale data under concurrent access. No distributed cache invalidation. Acceptable at 10k users; becomes an issue at 100k+.
- **Feed pipeline parallelism**: 9 parallel Supabase queries per feed page load is efficient at low concurrency. Supabase connection pool limits may surface under load.
- **Actor store mutable outside React**: `useActorStore.getState().upsertActors()` called from controller — no async safety guarantee.

### 100k Users: Architectural Gaps

- **Feed without server-side aggregation**: The feed pipeline queries 9 tables client-side per page. At high fanout, this should migrate to a materialized feed or server-side aggregation function (Supabase Edge Function / RPC).
- **React Query vs manual state**: Inconsistent caching means some features hit the DB on every render, others cache aggressively. Standardizing on React Query would enable global cache management.
- **Notification publish coupling**: `notifications/publish.js` performs an `actor_owners` query on every notification publish to verify actor ownership. At high notification volume this adds latency and DB load. A session-bound token or cached actor set would help.
- **profiles feature at 396 files**: The `profiles` feature is overloaded. It contains both citizen and vport profile kinds, each with deep sub-trees. At team scale this creates merge conflicts and cognitive load.

### 1M Users: Structural Blockers

- **Single Supabase client singleton**: All features share one Supabase client instance — no per-feature client isolation, no connection pooling hints, no read replica routing.
- **vportDashboard at 200 files**: This is a bounded context masquerading as a feature. At 1M users it would need to be extracted as a separate deployment unit with its own data contracts.
- **Booking as cross-feature security primitive**: The `assertActorOwnsVportActorController` creates a coupling that would prevent independent scaling or deployment of features that depend on it.
- **Manual cache management**: TTL caches, React Query, and manual useState are three independent cache systems with no coordination layer. At scale, cache inconsistency events become visible to users.

### Data Ownership Risks

- `booking/controllers/assertActorOwnsVportActorController.js` fetches actor records from `vc.actors` — a direct read DAL inside the booking feature for ownership checks. If actor schema changes, booking must change too.
- `hydration/vcsmActorHydrator.js` calls `vport.profile_actor_access` table directly alongside `@/state/identity/*.dal` files — mixed schema access.

### Team Scaling Risks

- 396-file `profiles` feature is too large for a single owner to review confidently.
- `vportDashboard` at 200 files with 10+ sub-domains (`gasprices`, `bookings`, `calendar`, `exchange`, `team`, `settings`) should be split into separate features.
- The booking feature owns a cross-cutting security primitive — changes to `assertActorOwnsVportActorController` can break 9 consumers across 6 features.

---

## 11. Quality Scores

| Dimension | Score (1-10) | Rationale |
|---|---|---|
| Domain separation | 7 | Clear bounded contexts; some features overloaded (profiles 396 files, vportDashboard 200 files) |
| Feature isolation | 8 | Adapter boundaries largely respected; §5.3 exceptions documented |
| Maintainability | 6 | Layer contract is enforced; feature sizes vary wildly; settings DAL auth leaks need cleanup |
| Testability | 5 | ~15 test files found; controllers are testable by design but test coverage is sparse; no injected Supabase client |
| Scalability | 5 | Feed pipeline and booking are well-designed; multiple TTL caches and no React Query standardization limit scaling |
| Security architecture | 7 | Ownership guard centralized and well-documented; DB RLS backstop present; session leaks into DAL/controller layers are known gaps |
| Consistency across features | 6 | Core features (booking, feed, moderation) are consistent; secondary features (professional, wanders) less so |
| Developer experience | 7 | CLAUDE.md contract is clear; adapter boundaries are explicit; layer naming is consistent; some features too large to navigate |

---

## 12. Architectural Risks (Ranked by Severity)

### CRITICAL

**RISK-001: Booking feature as cross-platform security primitive creates dangerous coupling**
- Description: `assertActorOwnsVportActorController` exported from `booking/adapters/booking.adapter.js` is the ownership check used by 9+ controllers across 6 features (settings/privacy, settings/account, settings/vports/*, join/*). If `booking` is refactored, has a bug, or needs to be extracted, all 9 consumers break.
- Evidence: `booking/adapters/booking.adapter.js` lines 17-22; 9 consumer files confirmed via grep
- Severity: CRITICAL
- Impact: Change management nightmare; security regression risk; prevents booking feature isolation

**RISK-002: Auth session calls leaking into DAL layer**
- Description: `settings/vports/dal/vports.read.dal.js` and `vports.write.dal.js` call `supabase.auth.getUser()` directly inside DAL functions (7 occurrences). This violates the layer contract and makes DALs dependent on session state.
- Evidence: grep `supabase.auth.getUser` in dal files: settings/vports/dal/vports.read.dal.js:23, :64, :102, :125; vports.write.dal.js:35, :66, :97
- Severity: CRITICAL
- Impact: DALs cannot be unit tested without a live session; session expiry causes silent DAL failures; layer boundary violation

### HIGH

**RISK-003: Dual auth source pattern in settings hooks**
- Description: `settings/privacy/hooks/useActorPrivacy.js`, `settings/profile/hooks/useProfileController.js`, `settings/account/hooks/useAccountController.js`, `settings/vports/hooks/useVportsController.js` import from both `@/app/providers/AuthProvider` (raw session) and `@/features/identity/adapters/identity.adapter` (actor context). These can desynchronize.
- Evidence: files listed above; `useAuth()` and `useIdentity()` called in same hook body
- Severity: HIGH
- Impact: Race conditions on session refresh; stale identity data; confusing ownership of auth state

**RISK-004: profiles feature overloaded at 396 files**
- Description: The `profiles` feature contains citizen profiles, vport profiles, 8+ vport sub-domains (barbershop, locksmith, exchange, menu, rates, services, review, content, booking, portfolio), and adapters for all. This is multiple bounded contexts in one feature.
- Evidence: `profiles/kinds/vport/` alone has 200+ files across 15 sub-directories
- Severity: HIGH
- Impact: Team scaling bottleneck; review/PR conflicts; makes ownership of `profiles` impossible to assign to one engineer

**RISK-005: vportDashboard feature at 200 files with 10 distinct card-domains**
- Description: `vportDashboard/dashboard/cards/` contains gasprices, bookings, calendar, exchange, team, settings, and more. Each card has its own DAL/controller/hooks structure. This is a modular monolith sub-system that has outgrown its feature container.
- Evidence: 200 files found via `find` command; 10+ `dashboard/cards/` sub-directories
- Severity: HIGH
- Impact: Cannot be extracted or scaled independently; test coverage isolation is hard

**RISK-006: upload/adapters/posts.adapter.js is not an adapter**
- Description: `upload/adapters/posts.adapter.js` exports `createSystemPost` which calls `supabase.auth.getUser()` directly and contains insertion logic. This is a controller named as an adapter.
- Evidence: `upload/adapters/posts.adapter.js` lines 1-29
- Severity: HIGH
- Impact: Misclassification breaks the security mental model; auth leak in what consumers think is a pure boundary file

### MEDIUM

**RISK-007: Auth session calls in controller bodies (moderation, legal)**
- Description: `moderation/controllers/moderationActions.controller.js` (2x), `moderation/controllers/undoConversationCover.controller.js`, `legal/controllers/legalConsent.controller.js` call `supabase.auth.getUser()` directly in controller bodies rather than through a dedicated auth DAL.
- Evidence: grep results above
- Severity: MEDIUM
- Impact: Inconsistent auth pattern; harder to mock for tests; risk of silent failures if auth is unavailable

**RISK-008: Three independent cache systems with no coordination**
- Description: TTL caches in DAL files, React Query cache (settings features), and manual useState (most features) operate independently. Cache invalidation in one system does not propagate to others.
- Evidence: `@/shared/lib/ttlCache` used in 6+ DAL files; React Query used in settings hooks; manual useState everywhere else
- Severity: MEDIUM
- Impact: Stale data shown to users; impossible to reason about cache state globally

**RISK-009: settings/privacy/controller/actorPrivacy.controller.js has unexpected cross-feature coupling**
- Description: This controller imports from booking, feed, and social adapters — three unrelated domains — to perform privacy toggle side effects (cache invalidation).
- Evidence: `actorPrivacy.controller.js` imports `assertActorOwnsVportActorController` from booking, `invalidateActorBundleEntry` from feed, `invalidateActorPrivacyCacheAdapter` from social
- Severity: MEDIUM
- Impact: High coupling score for a settings controller; changes to feed or social cache API can break privacy settings

**RISK-010: wanders at 124 files with incomplete feature classification**
- Description: `wanders` feature has `services/`, `core/`, `hooks/`, adapters — but no consistent controller/DAL/model stack. The `wanders/services/wandersAuthSession.js` calls `supabase.auth.signInAnonymously()` — a special auth path with no equivalent anywhere else.
- Evidence: 124 files; `wandersAuthSession.js` anonymous auth; `wanders/core/dal/rpc/mailbox.rpc.dal.js` has an example-style comment with no real implementation
- Severity: MEDIUM
- Impact: Layer contract not enforced; anonymous auth path is not documented in the architecture contract

### LOW

**RISK-011: vgrid feature is empty (0 files)**
- Description: `features/vgrid/` exists but contains zero JavaScript files.
- Evidence: `find features/vgrid -type f` returns nothing
- Severity: LOW
- Impact: Dead directory; cognitive overhead

**RISK-012: reviews feature is a single stub file**
- Description: `features/reviews/` contains only `setup.js` — the entire reviews domain is delegated to the reviews engine. The feature is a thin wrapper.
- Evidence: `reviews/setup.js` is the only file; comment states "PLANNED FATE: move to app/setup/reviews.setup.js"
- Severity: LOW
- Impact: Directory is placeholder; should be cleaned up per existing plan

---

## 13. Architectural Strengths

### 1. Ownership verification is centralized and hardened
`assertActorOwnsVportActorController` is a single, tested, well-documented ownership gate. It enforces: null checks → kind check (unconditional, before self-shortcut) → void check → `actor_owners` DB query. This is the correct layering for app-layer ownership checks. The DB RLS policy on `actor_owners` provides a backstop independent of the app layer. Evidence: `booking/controllers/assertActorOwnsVportActor.controller.js` lines 1-81.

### 2. Feed pipeline is architecturally sound for parallel data fetching
`fetchFeedPage.pipeline.js` orchestrates 9 parallel Supabase queries with `Promise.all()`, keeping latency proportional to the slowest query rather than their sum. The pipeline is fully composable and the DAL wrapping for dev profiling (via `wrapDAL`) shows good separation of concerns. Evidence: `feed/pipeline/fetchFeedPage.pipeline.js`.

### 3. Adapter boundaries are enforced and exceptions are documented
Every cross-feature dependency goes through an adapter file. When exceptions are necessary (ownership check, cache invalidation), they are documented with `§5.3 exception` comments in the adapter file itself, with call-site counts. This is a mature governance pattern. Evidence: `booking/adapters/booking.adapter.js` lines 17-22.

### 4. Session binding for public bookings prevents actor injection
The `createBooking.controller.js` explicitly overwrites any caller-supplied `customerActorId` with the verified `requestActorId` for public bookings, preventing an attacker from booking on behalf of another actor. The comment documents the security intent clearly. Evidence: `createBooking.controller.js` lines 127-130.

### 5. Notification publisher has app-layer and DB-layer defense in depth
`notifications/publish.js` checks session, verifies `actorId` ownership via `actor_owners` at the app layer, then defers to the notification engine. The DB has a BEFORE INSERT trigger enforcing the same ownership rule. This is textbook defense in depth. Evidence: `notifications/publish.js` lines 57-73.

### 6. Monitoring is integrated with domain context
`captureVcsmError` is called consistently across booking, identity, moderation, and social controllers with structured domain context fields (`feature`, `module`, `behavior_id`, `severity`, `operation`, `context`). This makes production debugging tractable. Evidence: `booking/controllers/createBooking.controller.js`, `booking/controllers/assertActorOwnsVportActor.controller.js`.

### 7. TTL caching in feed DALs reduces DB round trips
Feed read DALs apply TTL caching to high-frequency reads (actor bundles, follow rows, block rows) using a shared utility. This is an appropriate optimization at the data layer without polluting the business logic. Evidence: `feed/dal/feed.read.actorsBundle.dal.js`, `feed/dal/feed.read.blockRows.dal.js`.

### 8. Explicit column selection in DAL files
The architecture contract bans `select('*')`. Inspection of booking, feed, and profiles DAL files confirms explicit column lists. This is critical for performance and prevents accidental data exposure. Evidence: `booking/dal/insertBooking.dal.js`, `profiles/kinds/vport/dal/vportPublicDetails.read.dal.js`.

---

## 14. Recommended Architectural Direction

### Natural Direction Emerging

The codebase is naturally evolving toward:
1. **Engine extraction**: `reviews`, `portfolio`, `notifications`, `hydration`, `identity` are already engine-backed. The direction is to push more domain logic into engines, leaving features as thin orchestration + UI layers.
2. **React Query standardization**: Settings features adopted React Query fully. The natural next step is to standardize React Query across all features, replacing manual `useState + useEffect` async patterns.
3. **Ownership primitive extraction**: The `assertActorOwnsVportActorController` should be extracted from the booking feature into a dedicated `ownership` or `authorization` feature/engine to remove the coupling dependency.

### What to Strengthen

1. **Extract ownership checking into its own bounded context**: Create `features/authorization/` with `assertActorOwns.controller.js` and expose it via `authorization/adapters/authorization.adapter.js`. Remove the §5.3 exception from booking — booking should not own cross-platform security primitives.

2. **Move auth session calls out of DAL files**: `settings/vports/dal/vports.*.dal.js` should accept a `userId` parameter from callers (controllers/hooks) instead of calling `supabase.auth.getUser()` internally. This makes DALs testable and layer-compliant.

3. **Standardize on React Query for server state**: Adopt React Query as the universal server state manager. Convert manual `useState + async call` hooks to `useQuery/useMutation` progressively, starting with the highest-traffic features (feed, booking, profiles).

4. **Split profiles and vportDashboard**: Extract `profiles/kinds/vport/` into a `vportProfile` feature and `vportDashboard/dashboard/cards/gasprices/`, `vportDashboard/dashboard/cards/bookings/` into separate features. Target: no feature exceeding 100 files.

### What to Avoid

1. **Do not add more cross-feature imports through non-adapter paths**. The §5.3 exceptions are a necessary evil for now but must not grow.

2. **Do not add Supabase client calls to model files**. Models must remain pure functions.

3. **Do not add more Zustand stores** until the three-cache problem (TTL + React Query + Zustand) is rationalized. Each new store adds coordination surface.

4. **Do not let wanders grow further without establishing its layer contract**. At 124 files with non-standard service layer naming, wanders is the most likely future technical debt source.

### Next Logical Evolution

The platform is 18-24 months away from needing a full micro-frontend or service extraction. The current modular monolith with feature-sliced vertical slices is the correct architecture for the current team size and product phase. The three most impactful next steps in order are:

1. Extract `assertActorOwnsVportActorController` into a platform-level authorization primitive (breaks the booking coupling).
2. Standardize React Query across all features (eliminates the cache coordination problem).
3. Split `profiles` and `vportDashboard` into appropriately-sized features (enables team ownership assignment).

---

## 15. Appendix: File Inventory

### actors (4 files)
```
/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/actors/adapters/actors.adapter.js
/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/actors/controllers/searchActors.controller.js
/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/actors/dal/searchActors.dal.js
/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/actors/model/searchActors.model.js
```

### ads (18 files)
```
adapters/hooks/useVportAds.adapter.js
adapters/widgets/OnemoredaysAd.adapter.js
ads.feature.js
api/ad.api.js
constants.js
dal/ad.storage.dal.js
hooks/useDesktopBreakpoint.js
hooks/useVportAds.js
lib/ad.validation.js
model/ad.model.js
model/vportAdsSettingsShell.model.js
screens/VportAdsSettingsScreen.jsx
screens/adsScreens.js
ui/VportAdsBackButton.jsx
ui/adsPipeline.ui.js
ui/components.jsx
usecases/adPipeline.usecase.js
widgets/OnemoredaysAd.jsx
```

### auth (61 files) — adapters, components, controllers (with tests), dal, hooks (with tests), model (with tests), screens, styles

### block (18 files) — adapters, controllers, dal, guards, hooks, ui

### booking (70 files) — adapters, controllers (with tests), dal, hooks, model, setup.js

### chat (66 files) — adapters, conversation (controller/dal/hooks/permissions/lib/screen/components), inbox (controller/dal/hooks/lib/model/screens), start, store, setup.js, index.js

### debug (3 files) — LoginDebugPanel.jsx, loginDebug.helpers.js, loginDebug.store.js

### explore (23 files) — adapters, controllers, dal, hooks, models, screens, ui, usecases

### feed (46 files) — adapters, components, controllers, dal, hooks, model, pipeline, queries, screens

### flyerBuilder (54 files) — adapters, components, controllers, dal, designStudio (sub-domain), hooks, models, screens, styles

### hydration (2 files) — setup.js, vcsmActorHydrator.js

### identity (10 files) — adapters, controllers, dal, hooks, resolvers, setup.js

### initiation (18 files) — adapters, components, controllers, dal, hooks, models, screens

### invite (7 files) — adapters, controllers, dal, hooks, screens

### join (13 files) — adapters, controllers (with tests), dal, hooks, screens

### legal (26 files) — adapters, config, controllers, dal, docs, engine, hooks, screens

### media (9 files) — adapters, controllers, dal, models, setup.js

### moderation (35 files) — adapters, components, controllers, dal, hooks, models, types

### notifications (46 files) — adapters, hooks, inbox, publish.js, runtime, screen, setup.js, types

### portfolio (2 files) — setup.js, portfolioTrace.adapter.js

### post (119 files) — adapters (top-level + commentcard/ + postcard/), commentcard sub-domain, postcard sub-domain (with postModules: barbershop, locksmith, exchange, fuel, menu, fuelPrices)

### professional (34 files) — adapters, briefings, core, enterprise, professional-nurse, screens

### profiles (396 files) — adapters (top-level + kinds/vport/*), components, controller, dal, debug, hooks, kinds/citizen, kinds/vport (with all vport sub-systems)

### public (64 files) — adapters, vportBusinessCard (dal/hooks/model/screen/view), vportMenu (controller/dal/hooks/model/view/components)

### qrcode (8 files) — adapters, tests

### reviews (1 file) — setup.js

### settings (85 files) — adapters, account (controller/dal/hooks/ui), privacy (controller/dal/hooks/ui), profile (adapter/controller/dal/hooks/ui), ui, vports (controller/dal/hooks/ui)

### shell (6 files) — adapters, modules/bottom-bar

### social (45 files) — adapters (top-level + privacy + friend/*), friend/request, friend/subscribe, privacy

### upload (38 files) — adapters, controllers, dal, hooks, screens

### vgrid (0 files)

### void (11 files) — controller, hooks, models, screens

### vport (29 files) — adapters, components, controllers, dal, hooks, models, public, screens

### vportDashboard (200 files) — adapters, components, controller, dal, dashboard/cards/* (10 card domains)

### wanderex (23 files) — adapters, controllers, dal, hooks, models, screens

### wanders (124 files) — adapters, core, hooks, services

---

*Total: 1,715 files across 38 feature domains. Analysis performed 2026-06-07 from source code only — no prior reports consulted.*
