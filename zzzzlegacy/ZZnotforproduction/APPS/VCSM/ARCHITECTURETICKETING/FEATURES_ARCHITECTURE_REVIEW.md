# Full Feature Architecture Review
**Generated:** 2026-06-06  
**Scope:** `/apps/VCSM/src/features/`  
**Method:** Full static analysis — file counts, import graphs, naming audit, dependency mapping  

---

## 1. Executive Summary

The features layer is a **1,360-file, 35-feature system** built on a consistent layered pattern (adapters → hooks → controllers → dal → model) with a well-established adapter-boundary discipline. The adapter pattern is the strongest structural asset in the codebase — nearly every feature exposes a named adapter file that other features consume instead of importing internals directly. That alone separates this codebase from most React Native codebases of this scale.

The primary structural problems are:

1. **`profiles` is a God feature.** At 374 files it encompasses personal actor profiles, all vport-type-specific profile views (122 files under `kinds/vport/`), in-profile booking flows, menu management, photography, tag systems, and team management. This is 3–4 distinct concerns.

2. **`dashboard` is a mini-app.** At 263 files it contains a flyer builder, a QR code generator, and 11 distinct vport dashboard cards — each card with its own controller/dal/hooks/model. It is not one feature.

3. **`post` has embedded vport-type business logic.** The `postModules/` sub-system contains 8 vport-kind-specific modules (barbershopHours, exchangeRates, fuelPrices, locksmithHours, etc.) baked directly into the post rendering path.

4. **Naming is inconsistent across features.** `controller/` vs `controllers/`, `screen/` vs `screens/`, `model/` vs `models/` — all three variants exist simultaneously across the 35 features.

5. **Several features are stubs with 1–4 files** that exist purely as engine adapters or empty placeholders (`analytics`, `reviews`, `ui`, `actors`, `hydration`, `portfolio`). Their purpose is unclear from structure alone.

6. **Barrel file coverage is not uniform.** `vgrid` and `void` have an index.js per subfolder. `auth`, `block`, `chat`, `settings` have feature-level barrels. Most features have none. This inconsistency makes consumption patterns unpredictable.

The good news: cross-feature coupling is low and well-controlled. Only 5 same-directory relative imports cross feature boundaries. The `@/features/X` alias pattern is used universally for cross-feature references, which is correct. The shared/ library (41 files) is appropriately scoped to generic utilities and UI primitives.

**State of the codebase:** Healthy foundation, three large features that need splitting, naming conventions that need standardizing, and several stubs that need documentation of intent.

---

## 2. Current Structure Map

```
src/features/
├── actors/          (4 files)   — Thin. Actor identity adapter.
├── ads/             (18 files)  — Ad display and targeting widgets.
├── analytics/       (1 file)    — Funnel source tracking stub.
├── auth/            (64 files)  — Full auth: login, register, onboarding, reset.
├── block/           (18 files)  — Block/unblock actor actions and guards.
├── booking/         (68 files)  — Booking state machine, dal, hooks, model.
├── chat/            (66 files)  — Inbox + conversation UI + realtime.
├── dashboard/       (263 files) — OVERSIZED. Contains:
│   ├── flyerBuilder/ (31)       — Design studio for poster/flyer creation.
│   ├── qrcode/       (9)        — QR code card generation.
│   └── vport/        (217)      — Vport dashboard with 11 card subsystems.
│       └── dashboard/cards/
│           ├── bookings/
│           ├── calendar/
│           ├── exchange/
│           ├── gasprices/
│           ├── leads/
│           ├── locksmith/
│           ├── portfolio/
│           ├── reviews/
│           ├── schedule/
│           ├── services/
│           ├── settings/
│           └── team/
├── debug/           (3 files)   — Dev-only debug panel.
├── explore/         (22 files)  — Search and discovery UI.
├── feed/            (46 files)  — Central feed: dal, hooks, model, pipeline.
├── hydration/       (2 files)   — Engine setup stub.
├── identity/        (9 files)   — Actor identity resolver adapter.
├── initiation/      (18 files)  — App init flow (post-auth, first launch).
├── invite/          (6 files)   — Invite flow screens.
├── join/            (12 files)  — Join/signup screens.
├── legal/           (26 files)  — Terms, privacy, landing, about, contact.
├── media/           (9 files)   — Media engine adapter.
├── moderation/      (35 files)  — Report, spam, hide post/comment/chat.
├── notifications/   (44 files)  — Notification inbox, runtime, types.
├── portfolio/       (2 files)   — Portfolio engine adapter stub.
├── post/            (116 files) — Post card, comment card + postModules (8 vport types).
├── professional/    (33 files)  — Professional profiles (nurse, enterprise, briefings).
├── profiles/        (374 files) — GOD FEATURE. Contains:
│   ├── [actor profiles]         — Actor profile screen, header, tabs.
│   ├── dal/, hooks/, model/     — Shared profile data.
│   ├── controller/              — Profile actions (photos, friends, tags, posts).
│   └── kinds/vport/  (122)      — ALL vport-type profile views:
│       ├── screens/booking/ (in-profile booking flow)
│       ├── screens/menu/ (26 files — menu management)
│       ├── screens/portfolio/
│       ├── screens/services/
│       ├── screens/rates/
│       ├── screens/content/
│       ├── screens/barbershop/
│       ├── screens/owner/
│       └── screens/review/
├── public/          (64 files)  — Public-facing (no auth) business card + menu.
│   ├── vportBusinessCard/ (16)
│   └── vportMenu/ (46)
├── reviews/         (1 file)    — Reviews engine adapter stub.
├── settings/        (91 files)  — Account, privacy, profile, vports settings.
├── shell/           (6 files)   — Bottom navigation bar module.
├── social/          (44 files)  — Follow, subscribe, friend request, privacy.
├── ui/              (1 file)    — Single modern UI component stub.
├── upload/          (38 files)  — Media upload pipeline.
├── vgrid/           (10 files)  — VGrid feature with full barrel system.
├── void/            (11 files)  — Void realm feature with full barrel system.
├── vport/           (29 files)  — Vport creation + preview + core data.
└── wanders/         (124 files) — Greeting card system.
    ├── core/        (52)        — Full write/read/rpc DAL + controllers + hooks.
    └── components/cardstemplates/ (22) — Card templates.

wanderex/            (22 files)  — Accommodation booking flow (separate from wanders).
```

---

## 3. Feature-by-Feature Analysis

### `actors` — 4 files
- **Role:** Thin adapter that exposes actor identity resolution to the rest of the app.
- **Strengths:** Correctly scoped. Acts as the public API for actor lookups.
- **Problems:** Its function overlaps with `identity/`. Unclear ownership boundary between `actors` and `identity`.
- **Coupling:** Consumed by settings, shell, profiles via `@/features/actors/adapters/actors.adapter`.
- **Suggested boundaries:** Merge into `identity/` or clarify that `actors` = UI-facing actor data, `identity` = session/auth-facing identity.
- **Risk:** LOW. Stub file — safe to analyze and document without touching.

---

### `ads` — 18 files
- **Role:** Ad placement widgets and hooks. Drives `OnemoredaysAd` placement.
- **Strengths:** Well-contained. Has adapter layer, hooks, model, UI widgets.
- **Problems:** Has two parallel paths: `adapters/hooks/` and `adapters/widgets/` alongside top-level `hooks/` and `widgets/`. The nested adapter pattern adds indirection without clear benefit.
- **Coupling:** Used by feed, explore, or other display surfaces (1 cross-feature import count).
- **Suggested boundaries:** Keep as-is. Flatten `adapters/hooks/` and `adapters/widgets/` into top-level hooks/widgets.
- **Risk:** LOW.

---

### `analytics` — 1 file
- **Role:** Exports `funnelSource` — a tracking utility consumed by legal, and potentially other acquisition-path screens.
- **Problems:** Single-file feature is not a feature — it's a utility. Should live in `shared/lib/` or `shared/utils/`.
- **Coupling:** Imported by `legal` (3x). No feature-level isolation needed.
- **Suggested boundaries:** Move `funnelSource.js` to `shared/lib/analytics.js` and delete this feature folder.
- **Risk:** LOW. Three import sites to update.

---

### `auth` — 64 files
- **Role:** Full authentication feature: login, register, reset password, email verification, onboarding, profile completion, session management.
- **Strengths:** Best-structured feature in the codebase. Has `__tests__/` coverage, clear layer separation (controllers/dal/hooks/model), adapter boundary, screen components.
- **Problems:**
  - `RegisterFormCard.jsx` is >200 lines — form logic may be extractable to a hook.
  - `onboarding.controller.js` is >200 lines — orchestration logic, acceptable.
  - `ui/` folder has only 1 file — sparse layer.
  - `usecases/` folder has 1 file — may not need its own layer.
- **Coupling:** Heavily consumed (76 cross-feature imports). This is correct — auth is a platform primitive.
- **Suggested boundaries:** Keep current structure. Audit `usecases/` — if it's a single file, fold it back into controllers.
- **Risk:** LOW. Auth structure is healthy.

---

### `block` — 18 files
- **Role:** Block/unblock actor, block guard for profile gating, block status hooks.
- **Strengths:** Clean layered structure. Has guards as a named concept.
- **Problems:** None significant.
- **Coupling:** Consumed by profiles (3x), social (2x), chat (2x) — correct pattern.
- **Suggested boundaries:** Keep as-is.
- **Risk:** LOW.

---

### `booking` — 68 files
- **Role:** Booking state machine — creating, reading, updating booking records via engine.
- **Strengths:** Well-layered (controller/dal/hooks/model). Has `__tests__/`.
- **Problems:**
  - `controller/` folder (not `controllers/`) — diverges from auth/feed/social naming.
  - Empty `components/` and `screens/` folders exist — booking UI lives inside `profiles/kinds/vport/screens/booking/` and `wanderex/`. The feature itself has no rendering layer.
  - No barrel file — consumed via deep imports.
- **Coupling:** Consumed by settings (4x), profiles (via engine adapter). The booking UI is spread across profiles and wanderex.
- **Suggested boundaries:** The booking feature should own its state machine. The booking UI views should remain in the consuming features. Remove empty folders.
- **Risk:** MEDIUM. Touching booking requires understanding the engine contract.

---

### `chat` — 66 files
- **Role:** Messaging system — inbox listing, conversation view, realtime updates, start conversation.
- **Strengths:** Well-organized into `inbox/` and `conversation/` subsystems. Has store for realtime state. Clear adapter boundary.
- **Problems:**
  - `ChatInput.jsx`, `MessageBubble.jsx`, `ConversationView.jsx` are all >200 lines. Component complexity is high.
  - `start/` folder under both `adapters/start/` and `start/` at root — duplicated structure.
  - Imports from `@identity` engine directly (16x in chat feature) AND uses `@/features/identity/` (8x). Mixed consumption of engine alias vs feature adapter.
  - `styles/` folder exists but is empty.
- **Coupling:** Imports `identity` (8x), `moderation` (4x), `media` (2x), `block` (2x) — all reasonable.
- **Suggested boundaries:** 
  - Standardize engine consumption: use `@chat` or `@/features/chat/` — not both.
  - Consolidate `start/` vs `adapters/start/`.
  - Remove empty `styles/`.
- **Risk:** MEDIUM. Chat has realtime state management — any restructuring needs care.

---

### `dashboard` — 263 files — CRITICAL
- **Role:** Currently contains three unrelated subsystems:
  1. **flyerBuilder** — Design studio with canvas, sidebar, color picker, templates, print QR.
  2. **qrcode** — QR code generation and flyer card display.
  3. **vport dashboard** — Owner-facing VPORT management with 11 specialized cards.

- **Problems:**
  - This is not one feature. A flyer builder and a business dashboard are different domains.
  - `flyerBuilder/designStudio/` has 5 subfolders of its own — it's a mini-app.
  - 11 dashboard cards each have their own full controller/dal/hooks/model stack. Cards like `gasprices/` have 47 files.
  - `DesignStudioCanvasStage.jsx` and `FlyerEditorPanel.jsx` are >200 lines — complex rendering.
  - `dashboard/vport/dashboard/` path has three levels of "dashboard" in the name — a naming collision that points to structural confusion.

- **Coupling:** Imports `media` (5x), `identity` (via engine adapter), settings (1x).

- **Suggested split:**
  ```
  features/
    flyerBuilder/        — Canvas design studio + print QR
    qrcode/              — QR code generation (already has index.js barrel)
    vportDashboard/      — Owner dashboard + all 11 card subsystems
      cards/
        bookings/
        calendar/
        ... etc.
  ```
  The 11 cards can remain as subfolder modules inside `vportDashboard/cards/` — they do not need to be separate features.

- **Risk:** HIGH. Dashboard is actively used. Split must be preceded by import-graph mapping to catch all consumers.

---

### `debug` — 3 files
- **Role:** Dev-only debug panel component.
- **Strengths:** Correctly isolated.
- **Problems:** Should confirm this is gated from production builds.
- **Risk:** LOW.

---

### `explore` — 22 files
- **Role:** Search/discovery screen with tags, filters, results.
- **Strengths:** Reasonably scoped.
- **Problems:**
  - `ui/` has 12 files + a nested `features/` subfolder inside `ui/` — unusual path `explore/ui/features/`.
  - One cross-feature relative import: `ExploreScreen.jsx` imports `SearchScreen.view` from `'../ui/SearchScreen.view'` (internal — acceptable).
  - Uses both `@hydration` engine directly and feature hooks.
- **Risk:** LOW.

---

### `feed` — 46 files
- **Role:** Central feed rendering — data fetching, pagination, post pipeline, caching.
- **Strengths:** Has a `pipeline/` and `queries/` layer — thoughtful data flow separation.
- **Problems:**
  - `useCentralFeed.js`, `useCentralFeedActions.js`, `useFeed.js` are all >200 lines — feed logic is dense.
  - Imports from `@/features/post/` (4x), `@/features/moderation/` (4x), `@/features/social/` (2x) — feed is a consumer aggregator, which is correct, but creates a wide import surface.
  - `queries/` is a non-standard layer name (only used in feed and settings). Most features use `dal/` for data access.
- **Coupling:** Feed → post, moderation, social. Social → feed (invalidation). This bidirectional dependency between `feed` and `social` warrants attention — social actions should emit events, not import feed directly.
- **Risk:** MEDIUM.

---

### `hydration` — 2 files
- **Role:** Engine setup stub. Calls `configureHydrationEngine()` at app startup.
- **Problems:** This is app-init configuration, not a feature. Should live in `app/setup/` or `app/engines/`.
- **Risk:** LOW. 2 files to move.

---

### `identity` — 9 files
- **Role:** Actor identity resolution — resolves `actorId → actor profile data` using the identity engine.
- **Strengths:** Correctly layered (adapters, controller, dal, hooks, resolvers).
- **Problems:** Overlaps with `actors/`. The `resolvers/` subfolder is unique to this feature.
- **Coupling:** Consumed heavily (38x across the codebase). This is correct — identity is a platform primitive.
- **Risk:** LOW.

---

### `initiation` — 18 files
- **Role:** App first-launch flow and post-auth onboarding handoff.
- **Problems:** Imports from `identity` (2x) and `auth` (2x). These are correct dependencies.
- **Risk:** LOW.

---

### `invite` — 6 files
- **Role:** Invite flow screens. 3 screen files, 1 controller, 1 dal, 1 hook.
- **Problems:** Very thin feature — may be a candidate for merging with `join/` or `auth/` depending on its user journey.
- **Risk:** LOW.

---

### `join` — 12 files
- **Role:** Join/signup UI. Components, controllers, DAL, hooks, screens.
- **Problems:** Overlaps conceptually with `auth/`. The distinction between `join` and `auth` registration should be documented.
- **Risk:** LOW.

---

### `legal` — 26 files
- **Role:** Terms of service, privacy policy, about page, contact, vport landing pages, how-to pages.
- **Problems:**
  - `legal/docs/` contains 3 content files — document content mixed with routing code.
  - `engine/` subfolder (1 file) — is this a local engine or a wrapper? Non-standard name.
  - `VportCategoryLandingScreen.jsx` and `HowToCreateVportScreen.jsx` are SEO/public landing pages — they arguably belong in `public/` or a `landing/` feature, not in `legal`.
  - `vportLandingContent.js` is >200 lines — content data files this large are better stored as JSON/markdown.
  - Imports `analytics` (3x), `vport` (2x), `auth` (2x) — broad cross-feature surface.
- **Risk:** LOW for legal content. MEDIUM for moving landing screens.

---

### `media` — 9 files
- **Role:** Media engine adapter — provides file upload, image compression, and storage routing to the rest of the app.
- **Strengths:** Correctly scoped engine adapter.
- **Problems:** `mediaAppId.adapter.js` alongside `media.adapter.js` — two adapter files with unclear split of responsibility.
- **Risk:** LOW.

---

### `moderation` — 35 files
- **Role:** Report flow, spam detection, content hiding — for posts, comments, and chat.
- **Strengths:** Well-organized with adapters for both UI components and hooks. Covers all three surfaces (posts, comments, chat) consistently.
- **Problems:**
  - `models/` (plural) diverges from the `model/` convention used elsewhere.
  - `types/` folder (1 file) — is this a TypeScript types file or a string constants file?
- **Coupling:** Consumed by feed (4x), chat (4x) — correct.
- **Risk:** LOW.

---

### `notifications` — 44 files
- **Role:** Notification inbox, runtime listener, typed notification models per notification category.
- **Strengths:** `types/` subfolder with per-category type files (booking, comment, follow, mention, reaction, review, team) is well-structured.
- **Problems:**
  - `NotificationsScreenView.jsx` uses 4 relative imports from `../../inbox/` — this is within the same feature, but the relative path crosses a sub-module boundary. These should be absolute (`@/features/notifications/inbox/...`).
  - `runtime/` has a barrel `index.js` but the runtime notification DAL (`notificationRuntime.dal.js`) is >200 lines.
  - `MyAppointmentsView.jsx` is in `notifications/screen/views/` — an "appointments" view is booking domain, not notification domain.
- **Coupling:** Consumes `identity` (4x), `social` (2x). Consumed by social (2x) — bidirectional with social, same concern as feed↔social.
- **Risk:** MEDIUM. Runtime notification path is sensitive.

---

### `portfolio` — 2 files
- **Role:** Portfolio engine adapter stub.
- **Problems:** Almost empty. The real portfolio rendering lives in `profiles/kinds/vport/screens/portfolio/`. This feature exists only as an adapter wrapper.
- **Risk:** LOW. Document its role.

---

### `post` — 116 files — CRITICAL
- **Role:** Post card rendering, comment card rendering, post actions, post detail view.
- **Strengths:** Clear split between `postcard/` and `commentcard/` subsystems.
- **Problems:**
  - `postModules/` contains 8 vport-type-specific modules: `barbershopHours`, `barbershopPortfolio`, `exchangeRates`, `fuelPrices`, `locksmithHours`, `locksmithPortfolio`, `locksmithServiceArea`, `menuDrop`. This is vport business logic embedded in the generic post-rendering layer. When a new vport type is added, this folder grows — it is the wrong location.
  - `PostCard.view.jsx`, `PostDetail.view.jsx`, `CommentCard.view.jsx`, `MediaCarousel.jsx` are all >200 lines.
  - `adapters/` has 14 files split across `postcard/`, `commentcard/`, and top-level — complex sub-adapter hierarchy.
- **Coupling:** Consumed by feed (4x). Imports nothing from other features.
- **Suggested boundaries:** `postModules/` should move to `profiles/kinds/vport/postModules/` or a dedicated `vportPostTypes/` feature. The post card itself should be a generic renderer that accepts a typed payload — the type-specific rendering should be injected, not embedded.
- **Risk:** HIGH. Post rendering is used in the central feed. Changes here affect every feed rendering path.

---

### `professional` — 33 files
- **Role:** Professional profile types — nurse housing/facility, enterprise, briefings.
- **Problems:**
  - `professional-nurse/` uses a hyphenated subfolder name — all other subfolders use camelCase or slash-separated. Inconsistent.
  - `core/config/` and `core/storage/` (2 files total in core) — very sparse core.
  - Imports `settings` (3x) — professional features reaching into settings for configuration data.
  - No adapter file — direct consumption pattern.
- **Risk:** MEDIUM. Professional profile types interact with settings and have specialized UI.

---

### `profiles` — 374 files — CRITICAL
- **Role:** Currently: actor profiles, vport profile views, vport booking, vport menu management, photos, tags, friends, team management.
- **This is 3–4 distinct features.**

**What belongs in `profiles/`:**
- Actor profile screen and header
- Actor profile tabs (friends, photos, posts, tags)
- Friends management (request, top friends editor)
- Photo reactions
- Tag system
- Core profile DAL (fetchPostsForActor, readActorSeoData)

**What should be a separate feature:**
- `profiles/kinds/vport/` (122 files) → **`vportProfile/`** feature
  - All vport-type-specific views (menu, portfolio, services, rates, barbershop, booking, reviews, content)
  - This is the vport owner's profile experience — distinct from a citizen's personal profile

**What overlaps with `booking`:**
- `profiles/kinds/vport/screens/booking/` (dedicated booking flow hooks and views) — this is a booking UI consumer that lives inside profiles. Should stay here (it's a view layer) but be clearly labeled.

**What overlaps with `vport`:**
- `profiles/adapters/kinds/vport/` (8 adapter files) — these are the public API for vport profile data. Should move with the vport profile split.

- **Risk:** CRITICAL. The largest feature. Any split must be preceded by a full import graph and done in phases. Do not split until all consumers are mapped.

---

### `public` — 64 files
- **Role:** Public-facing (no-auth) views for vport business card and vport menu.
- **Strengths:** Well-organized into `vportBusinessCard/` and `vportMenu/` subsystems.
- **Problems:**
  - `vportMenu/` (46 files) is larger than some full features. It has components, controller, dal, hooks, model, screen, view layers.
  - Business card and menu are both under `public/` but serve different purposes and have very little shared code.
  - `VportPublicMenuView.jsx`, `VportPublicMenuQrView.jsx` are >200 lines.
- **Coupling:** Consumed by `wanders` (2x) — wanders shows public vport links.
- **Suggested boundaries:** Keep `public/` as the namespace for no-auth vport views. Consider whether `vportBusinessCard/` and `vportMenu/` should be peer features if they grow further.
- **Risk:** LOW. Well-contained.

---

### `reviews` — 1 file
- **Role:** Reviews engine adapter stub. 1 file.
- **Problems:** The real reviews rendering lives in `profiles/kinds/vport/screens/review/`. This is an adapter shell only.
- **Risk:** LOW.

---

### `settings` — 91 files
- **Role:** User account settings, privacy settings, profile settings, vport visibility settings.
- **Strengths:** Well-organized into `account/`, `privacy/`, `profile/`, `vports/` subsystems. Has barrel files for profile and vports subsystems.
- **Problems:**
  - `queries/` folder (6 files) — non-standard layer name alongside `dal/` in subsystems. Inconsistent data access pattern: some settings use `dal/`, others use `queries/`.
  - Imports from 9 different features: identity (8x), social (5x), booking (4x), vport (3x), profiles (1x), notifications (1x), media (1x), feed (1x), dashboard (1x). This is the highest fan-in of any feature. Settings is a feature aggregator — that is its nature, but the `dashboard` import is suspicious.
  - `professional` imports from `settings` (3x) — this is a bidirectional concern worth reviewing (settings should not depend on professional, and professional depending on settings may create coupling).
  - `adapters/` has 4 files at different depth levels: `settings.adapter.js`, `privacy/hooks/useMyBlocks.adapter.js`, `profile/ui/VportAboutDetails.view.adapter.js`, `ui/Card.adapter.js`.
- **Risk:** MEDIUM. Settings touches many features; changes here need broad validation.

---

### `shell` — 6 files
- **Role:** Bottom navigation bar — the app shell chrome.
- **Strengths:** Appropriately thin.
- **Problems:**
  - `shell/adapters/shell.adapter.js` imports from `profiles` (1x) and `identity` (1x). Shell reaching into profiles is a mild coupling concern — the bottom nav should receive actor data via props or context, not by importing profile internals.
  - `shell/modules/bottom-bar/docs/` — a docs folder inside a feature (only one). Per workspace rules, docs belong in `logan/`. This is a minor rules violation.
- **Risk:** LOW.

---

### `social` — 44 files
- **Role:** Follow, subscribe, friend requests, social privacy settings.
- **Strengths:** Clean split into `friend/request/`, `friend/subscribe/`, `privacy/`.
- **Problems:**
  - `followRequests.controller.js` is >200 lines.
  - `useSubscribeAction.js` is >200 lines.
  - Bidirectional dependency with `notifications` (social → notifications: 2x, notifications → social: 2x). These should be decoupled via events or a shared types layer.
  - Bidirectional with `feed` (social → feed: 3x, feed → social: 2x). Same concern.
- **Coupling:** Imports from `feed` (3x), `notifications` (2x), `block` (2x), `identity` (1x).
- **Risk:** MEDIUM. Bidirectional dependencies with feed and notifications.

---

### `ui` — 1 file
- **Role:** Single file `modern/` folder. Unclear purpose.
- **Problems:** This should either be populated or deleted. A single-file feature named `ui` is confusing alongside `shared/components/`.
- **Risk:** LOW.

---

### `upload` — 38 files
- **Role:** Media upload pipeline — camera, gallery, compression, storage, post creation.
- **Strengths:** Has `lib/` for upload utilities, well-layered.
- **Problems:**
  - `CaptionCard.jsx` is >200 lines.
  - `controllers/` and `controller/` both exist (singular and plural).
  - `ui/` has 13 files — substantial UI layer within the upload feature.
- **Risk:** MEDIUM. Upload pipeline is user-critical.

---

### `vgrid` — 10 files
- **Role:** VGrid feature (image grid layout system).
- **Strengths:** Exemplary barrel system — every subfolder has an `index.js`. Well-documented pattern.
- **Problems:** Very thin implementation files (1 file per subfolder). If this is a stub/placeholder, the barrel system is over-engineered for 10 files.
- **Risk:** LOW.

---

### `void` — 11 files
- **Role:** Void realm feature. Same structure as vgrid.
- **Strengths:** Same exemplary barrel pattern.
- **Problems:** Same thin implementation concern.
- **Risk:** LOW.

---

### `vport` — 29 files
- **Role:** Vport creation, preview, core VPORT data operations.
- **Problems:**
  - The name `vport` collides with `profiles/kinds/vport/` (122 files). There are two things named "vport" at completely different scales.
  - `CreateVportForm.jsx` is >200 lines.
  - `vportPhonePreviewScreens.jsx` is >200 lines.
  - `public/` subfolder inside `vport/` — separate from the `public/` feature folder. This creates two public-facing vport paths.
  - Imports from `settings` (1x), `profiles` (1x), `media` (1x), `identity` (1x).
- **Risk:** MEDIUM. Core VPORT creation is a critical path.

---

### `wanders` — 124 files
- **Role:** Greeting card system — send, receive, template, mailbox. Premium card templates.
- **Problems:**
  - `core/` (52 files) is a complex subsystem unto itself with full write/read/rpc DAL, controllers, hooks.
  - `components/cardstemplates/` (22 files) — 4 specific campaign templates (lovedrop, mothersday, photo, teacherappreciation). These content-specific templates will grow with each campaign.
  - `mothersDayPremiumForm.jsx`, `teacher_appreciation.classroom_thank_you.jsx` are >200 lines and use an inconsistent naming convention (`snake_case.jsx` vs `camelCase.jsx`).
  - `core/adapters/` separate from `adapters/services/` at root level — two adapter entry points.
- **Coupling:** Imports `media` (4x), `public` (2x).
- **Risk:** MEDIUM. Active feature with premium content.

---

### `wanderex` — 22 files
- **Role:** Accommodation/experience booking flow. Completely separate from `wanders`.
- **Problems:**
  - Name is dangerously close to `wanders`. A developer unfamiliar with the codebase will confuse these. Wanderex should be renamed to `stays/`, `accommodations/`, or `experiences/` to make its distinct purpose clear.
  - `WanderExBookingLaneCalendar.jsx`, `WanderExBookingSteps.jsx`, `WanderExDirectory.screen.jsx` are all >200 lines.
  - `useWanderExBookingFlow.js` is >200 lines — heavy orchestration hook.
  - `wanderexAvailability.model.js`, `wanderexPublic.model.js` are both >200 lines.
- **Risk:** MEDIUM. Active booking flow.

---

## 4. Cross-Feature Dependency Audit

### Import Volume by Source Feature
| Feature | Cross-feature Imports Out |
|---|---|
| settings | 87 |
| chat | 81 |
| auth | 76 |
| profiles | 73 |
| notifications | 44 |
| social | 34 |
| feed | 27 |
| professional | 24 |
| initiation | 23 |
| vport | 19 |

### Key Dependency Pairs (count)
| From → To | Count | Assessment |
|---|---|---|
| settings → identity | 8 | Correct. Settings reads actor identity. |
| chat → identity | 8 | Correct. Chat resolves message actors. |
| settings → social | 5 | Correct. Settings manages follow/block. |
| dashboard → media | 5 | Correct. Flyer builder uses media engine. |
| wanders → media | 4 | Correct. Card media attachments. |
| settings → booking | 4 | Correct. Settings manages availability. |
| profiles → social | 4 | Correct. Profile shows follow state. |
| notifications → identity | 4 | Correct. Notifications resolve actors. |
| feed → post | 4 | Correct. Feed renders post cards. |
| feed → moderation | 4 | Correct. Feed applies moderation overlays. |
| chat → moderation | 4 | Correct. Chat applies spam covers. |
| **social → feed** | 3 | **CONCERN.** Social actions shouldn't import feed. |
| settings → vport | 3 | Correct. Settings manages vport config. |
| profiles → block | 3 | Correct. Profile checks block state. |
| **notifications → social** | 2 | **CONCERN.** Bidirectional with social→notifications. |
| **social → notifications** | 2 | **CONCERN.** Bidirectional. |
| professional → settings | 3 | **CONCERN.** Professional depends on settings — reverse should not exist. |
| settings → dashboard | 1 | **INVESTIGATE.** Why does settings import dashboard? |
| shell → profiles | 1 | **CONCERN.** Shell should not import profile internals. |

### Bidirectional Dependencies (violate clean DAG)
1. **social ↔ feed** — Social actions invalidate feed; feed renders social state. Should communicate via React Query cache invalidation or events, not direct imports.
2. **social ↔ notifications** — Social sends notifications; notifications display social events. Shared type definitions should live in a neutral location.
3. **professional ↔ settings** — Professional imports settings for configuration. Should settings push config down via provider or should professional read from a shared config?

### Inverted Direction
- **shell → profiles**: Bottom nav bar importing from profile feature internals. Shell should receive actor data via an identity provider/context, not import from profiles.
- **vport → profiles**: Vport creation importing from profiles. Vport creation and profile display are separate concerns — this may be acceptable if vport needs profile data after creation, but should be through an adapter.

---

## 5. Shared Code Candidates

### Move to `shared/lib/`
| Current Location | Reason |
|---|---|
| `features/analytics/funnelSource.js` | Generic utility, not a feature |
| `features/shared/` (inside dashboard) | Global shared dashboard component |

### Move to `shared/hooks/`
Candidates from features that are truly generic:
- Any hook using `useOneSignalPush` patterns (currently in `shared/hooks/useOneSignalPush.js`) — ensure no feature duplicates this.
- `useDesktopBreakpoint.js` is already in shared — verify no feature re-implements a breakpoint hook.

### Move to `shared/components/`
| Pattern | Evidence |
|---|---|
| Skeleton/Spinner patterns | Multiple features likely render their own loading states |
| Modal patterns | Multiple features have custom modals — audit for a shared `ConfirmModal` base |
| Generic form field wrappers | auth `RegisterFormCard` may contain re-usable field components |

### Needs `shared/types/` (does not currently exist)
- Notification event types — currently embedded in `notifications/types/` but consumed by social and booking
- Actor/Profile types — referenced across identity, profiles, auth, settings
- Booking status enum — used across booking, dashboard, profiles

### Needs `app/setup/` (currently scattered across feature stubs)
| Current Location | Move To |
|---|---|
| `features/hydration/` (2 files) | `app/setup/hydration.setup.js` |
| `features/booking/setup.js` | `app/setup/booking.setup.js` |
| Any other `setup.js` files in features | `app/setup/` |

---

## 6. Proposed Modular Architecture

Based on the actual codebase, the target architecture is an **evolution of the existing pattern** — not a rewrite. The existing layered structure (adapters/hooks/controller/dal/model) is correct and should be preserved. The changes are:

1. Split three oversized features
2. Rename one confusingly-named feature
3. Promote engine-setup stubs out of features
4. Delete three 1-file stub features or fold them into shared/

```
src/
  features/
    # ── PLATFORM PRIMITIVES ──
    auth/               ✓ Keep as-is
    identity/           ✓ Keep as-is (merge actors/ into here)
    media/              ✓ Keep as-is
    moderation/         ✓ Keep as-is
    notifications/      ✓ Keep — fix bidirectional with social
    social/             ✓ Keep — fix bidirectional with notifications/feed
    block/              ✓ Keep as-is

    # ── CONTENT SYSTEM ──
    feed/               ✓ Keep — fix bidirectional with social
    post/               ✓ Keep — EXTRACT postModules/ out
    vportPostTypes/     ← NEW: move postModules/ content here
    upload/             ✓ Keep as-is

    # ── PROFILE SYSTEM ──
    profiles/           ✓ Keep — but scope to ACTOR profiles only
    vportProfile/       ← NEW: extract profiles/kinds/vport/ (122 files)

    # ── VPORT MANAGEMENT ──
    vport/              ✓ Keep — creation + core VPORT data
    vportDashboard/     ← RENAMED from dashboard/vport/ (217 files)
      cards/            ← Keep 11 card subsystems as subfolders

    # ── DISCOVERY TOOLS ──
    flyerBuilder/       ← SPLIT from dashboard/flyerBuilder/ (31 files)
    qrcode/             ← SPLIT from dashboard/qrcode/ (9 files, already has barrel)
    explore/            ✓ Keep as-is

    # ── PUBLIC SURFACES ──
    public/             ✓ Keep — no-auth business card + menu
    legal/              ✓ Keep — trim landing screens to a landing/ feature eventually

    # ── BOOKING SYSTEM ──
    booking/            ✓ Keep — state machine only
    wanderex/           ← RENAME to stays/ or experiences/

    # ── SOCIAL FEATURES ──
    chat/               ✓ Keep
    wanders/            ✓ Keep — trim postModules confusion

    # ── SETTINGS ──
    settings/           ✓ Keep — standardize queries/ → dal/

    # ── ACQUISITION ──
    join/               ✓ Keep
    invite/             ✓ Keep
    initiation/         ✓ Keep

    # ── SPECIALIZED ──
    ads/                ✓ Keep
    professional/       ✓ Keep — fix hyphenated subfolder
    shell/              ✓ Keep — decouple from profiles
    vgrid/              ✓ Keep
    void/               ✓ Keep

    # ── DELETE / ABSORB ──
    analytics/          → shared/lib/analytics.js
    hydration/          → app/setup/hydration.setup.js
    portfolio/          → Document as engine adapter stub or delete
    reviews/            → Document as engine adapter stub or delete
    ui/                 → Delete or populate
    actors/             → Merge into identity/
    debug/              → Move to app-level dev infrastructure

  shared/
    components/         ✓ Keep + audit for missing shared components
    hooks/              ✓ Keep + audit for missing shared hooks
    lib/                ✓ Keep + add analytics utility
    utils/              ✓ Keep
    config/             ✓ Keep (releaseFlags.js)
    types/              ← ADD: Actor, Booking, Notification, Social types
    themes/             ✓ Keep
    styles/             ✓ Keep
    constants/          ✓ Keep

  app/
    setup/              ← ADD: engine setup files from features/
    providers/          (existing — AuthProvider, etc.)
    routes/             (existing)
    guards/             (existing)
    layout/             (existing)
    config/             (existing)
    platform/           (existing)
```

---

## 7. Migration Plan

### Phase 1: Audit and Safe Cleanup
**Goal:** Eliminate dead structure, document stub features, fix empty folders.  
**Risk:** VERY LOW — no behavior changes.  
**Files affected:** ~15 folders/files.

**Actions:**
1. Delete empty `booking/components/` and `booking/screens/` folders.
2. Delete empty `chat/styles/` folder.
3. Delete `ui/` feature (1 file — move to shared if needed, or delete).
4. Add a `README.md` (or inline comment in index.js) to `analytics/`, `hydration/`, `portfolio/`, `reviews/`, `actors/` explaining each stub's purpose and planned fate.
5. Move `shell/modules/bottom-bar/docs/` content to `logan/` per workspace rules.
6. Move `features/debug/` to app-level dev infrastructure.

**Validation:** No import changes required. Run existing tests.

---

### Phase 2: Standardize Naming Conventions
**Goal:** Make layer names uniform across all features.  
**Risk:** LOW — only renames, each rename is internal to its feature.  
**Files affected:** ~25 folder renames.

**Actions:**
1. Establish canonical layer names:
   - `controller/` → adopt one form. **Use `controller/`** (singular, already majority).
   - `screen/` → `screens/`. **Use `screens/`** (already majority).
   - `model/` → keep singular. **Use `model/`**.
   - `models/` in moderation and wanders → rename to `model/`.
2. Rename in order: moderation, wanders, upload, wanders (these have mixed names).
3. Fix `professional-nurse/` → `professionalNurse/` (no hyphens in folder names).
4. Rename `settings/queries/` → `settings/dal/` or document why it's different.

**Validation:** Verify no imports break (all imports use `@/features/X/...` paths, so folder renames inside a feature only affect internal imports).

---

### Phase 3: Promote Engine Setup Out of Features
**Goal:** Move engine initialization stubs from `features/` to `app/setup/`.  
**Risk:** LOW — these are startup-only files.  
**Files affected:** `features/hydration/` (2 files), `features/booking/setup.js`.

**Actions:**
1. Create `src/app/setup/` directory.
2. Move `features/hydration/*.js` → `app/setup/hydration.setup.js`.
3. Move `features/booking/setup.js` → `app/setup/booking.setup.js`.
4. Update import in `main.jsx` (or wherever these are called at startup).
5. Delete the `features/hydration/` folder after move.

**Validation:** App startup must still configure engines correctly. Test cold launch.

---

### Phase 4: Extract `analytics` to `shared/lib/`
**Goal:** Remove the 1-file `analytics/` feature.  
**Risk:** LOW — 3 import sites (all in `legal/`).  
**Files affected:** `features/analytics/funnelSource.js`, `features/legal/` (3 files).

**Actions:**
1. Move `features/analytics/funnelSource.js` → `shared/lib/funnelSource.js`.
2. Update 3 imports in `features/legal/` from `@/features/analytics/funnelSource` → `@/shared/lib/funnelSource`.
3. Delete `features/analytics/` folder.

**Validation:** Legal screens must still fire funnel source tracking. Verify in dev.

---

### Phase 5: Fix Bidirectional Dependencies
**Goal:** Break the social ↔ feed and social ↔ notifications bidirectional dependencies.  
**Risk:** MEDIUM — requires understanding the data flow direction.  
**Files affected:** 3–5 files per dependency pair.

**Actions (investigate first, then act):**
1. **social → feed**: Find the 3 imports in social that reference feed. These are likely query invalidation calls. Replace with React Query `queryClient.invalidateQueries()` calls using key constants defined in `feed/`. Feed exports its query keys; social uses them without importing feed's hooks.
2. **social ↔ notifications**: The shared type definitions (notification event shapes) should move to `shared/types/notifications.types.js`. Both social and notifications import types from there.
3. **notifications → social**: Check if notifications is importing social hooks to display "follow request" notification actions. These UI adapters should live in notifications, not pull from social.

**Validation:** Full social flow test — follow, unfollow, block, notification receipt.

---

### Phase 6: Extract `post/postModules/` to `vportPostTypes/`
**Goal:** Remove vport-specific business logic from the generic post renderer.  
**Risk:** HIGH — touches the central feed rendering path.  
**Files affected:** `post/postcard/postModules/` (8 modules), feed rendering chain.

**Actions (do not start without full consumer mapping):**
1. Map all imports of `postModules/` across the codebase.
2. Create `features/vportPostTypes/` with the same 8 module subfolders.
3. Move modules one at a time, updating imports.
4. Make `post/postcard/` accept a `renderModule` prop or registry injection rather than importing modules directly.
5. Register all 8 modules in `app/setup/` or in `vportPostTypes/index.js`.

**Validation:** Feed must correctly render all 8 vport post types. Test each vport type in a dev build.

---

### Phase 7: Split `dashboard` into Three Features
**Goal:** Separate flyerBuilder, qrcode, and vportDashboard.  
**Risk:** HIGH — dashboard is 263 files and has cross-feature consumers.  
**Files affected:** All 263 dashboard files + all dashboard consumers.

**Actions (after consumer mapping):**
1. Map all `@/features/dashboard/...` imports across the codebase.
2. Create `features/flyerBuilder/` — move `dashboard/flyerBuilder/` contents.
3. Elevate `features/qrcode/` from `dashboard/qrcode/` (qrcode already has a barrel — use it).
4. Create `features/vportDashboard/` — move `dashboard/vport/` contents.
5. Update all consumers to the new paths.
6. Delete `features/dashboard/`.

**Validation:** Vport dashboard must fully function — all 11 cards. Flyer builder must produce and download. QR code must generate correctly.

---

### Phase 8: Extract `vportProfile/` from `profiles/`
**Goal:** Separate vport-type profile views (122 files) from actor profile screens.  
**Risk:** CRITICAL — profiles is the largest feature and most-consumed.  
**Files affected:** `profiles/kinds/vport/` (122 files) + all profile consumers.

**Actions (last phase — do not start before Phase 7 is validated):**
1. Fully map every import of `profiles/kinds/vport/` and `profiles/adapters/kinds/vport/`.
2. Create `features/vportProfile/` with the same internal structure.
3. Move `profiles/kinds/vport/` → `vportProfile/`.
4. Move `profiles/adapters/kinds/vport/` → `vportProfile/adapters/`.
5. Update all consumers.
6. Keep `profiles/` for actor-only profile code.

**Validation:** All vport profile screens (menu, portfolio, services, rates, barbershop, reviews, content, booking) must function. Actor profiles must be unaffected.

---

## 8. Do Not Touch List

The following files, features, and behaviors must not be changed without explicit architectural review and a dedicated ticket:

| Scope | Reason |
|---|---|
| `features/auth/` (all DAL and controllers) | Auth is session-critical. Any DAL change = security risk. |
| `features/booking/` (all controller and dal) | Active state machine with RPC security tickets open (TICKET-BOOKING-RPC-001). |
| `features/chat/` (conversation + realtime) | Realtime state is fragile. Any structural change risks breaking presence. |
| `features/notifications/runtime/` | Notification runtime DAL manages realtime subscriptions. |
| `features/feed/pipeline/` | Central feed pipeline — changes here affect all users. |
| `features/social/friend/subscribe/` | Follow/unfollow is a core social primitive. |
| `features/profiles/dal/` | Profile DAL files include SEO-critical read functions. |
| `features/vport/` (core) | VPORT creation is the platform's primary onboarding path. |
| `features/wanders/core/rpc/` | Wanders RPC path handles premium purchase actions. |
| `features/public/vportMenu/` | Public menu is the primary externally-shared VPORT surface. |
| `features/moderation/` (all adapters) | Moderation adapters are safety infrastructure. |
| All `*.test.js` files | Test files must not be modified as part of structural changes — only update if the tested path genuinely changes. |
| All `supabase/migrations/` | Owned by the operator. Zero agent access. |

---

## 9. Questions / Unknowns

1. **actors vs identity**: What is the precise boundary? Is `actors/` the UI-facing actor data layer and `identity/` the session-facing resolver? Or are they duplicates with `identity/` being newer?

2. **settings → dashboard**: The `settings` feature imports `dashboard` (1x). What specifically is it importing? This import direction is unexpected — settings should not depend on dashboard.

3. **professional ↔ settings direction**: `professional` imports `settings` (3x). What data does professional need from settings? Is this a read of global config or does professional actually manage settings state?

4. **wanderex renaming**: Is `wanderex` a brand name or an internal code name? If it's a product-facing name, the folder name is correct. If it's internal, rename to clarify (e.g. `stays/`).

5. **vgrid and void**: Both are very thin (10–11 files each) but have comprehensive barrel systems. Are these actively developed features or placeholders? DOCS-ORG-001 memory notes these are FROZEN — confirm they should be excluded from the migration plan entirely.

6. **wanders FROZEN status**: The same memory notes wanders is FROZEN. Should Phase 6 (postModules) and other wanders-touching phases skip wanders-specific content?

7. **postModules injection pattern**: Does the post card currently use a registry/injection pattern for postModules, or does it use direct `if (type === 'barbershop')` conditionals? The migration approach in Phase 6 depends on which pattern exists.

8. **`queries/` in settings**: Is there a deliberate reason settings uses `queries/` instead of `dal/`? This may be a React Query separation of concern (queries = read, dal = write). If intentional, it should be documented and potentially standardized across other features.

9. **`MyAppointmentsView.jsx` in notifications**: An appointments view living in notifications feels misplaced. Is this the user's appointment reminder notification, or is it a full booking management view? If the latter, it belongs in `booking/` or `profiles/`.

10. **Engine alias imports**: Some features import engines via alias (`@chat`, `@media`) and some via feature adapter (`@/features/chat/adapters/chat.adapter`). Is there a policy on which pattern is correct? This inconsistency in `chat/` (using both patterns) should be resolved.

---

## 10. Final Recommended Next Action

**Start with Phase 1 + Phase 4 in parallel — these are zero-risk.**

Phase 1 (empty folder cleanup + stub documentation) touches no behavior and removes visual noise that makes the codebase harder to read. It takes under an hour.

Phase 4 (analytics → shared/lib) is 4 file changes with 3 import updates. It eliminates a 1-file pseudo-feature and sets the precedent for how stub features are handled going forward.

After those complete: investigate and answer questions #1 (actors vs identity), #7 (postModules pattern), and #3 (professional ↔ settings direction) before proceeding to any further phases.

**Do not start Phase 6, 7, or 8 without:**
- A full consumer map generated by an automated import trace
- A dedicated ticket per split
- The wanders/vgrid/void frozen-feature exclusion confirmed

The architecture is structurally sound. The improvements are organizational, not behavioral. The risk is proportional to the size of what moves — small moves first, large splits last.
