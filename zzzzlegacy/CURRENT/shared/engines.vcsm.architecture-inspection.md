# VCSM Engine Architecture Inspection

**Date:** 2026-04-01 (revised)
**Scope:** apps/VCSM (1,540 source files) + engines/ (177 files)
**Source of truth:** Real code inspection, not assumptions

---

## 1. Purpose of This Document

This is a code-based architecture guide for `/apps/VCSM`. Every claim is backed by file paths and imports from the actual codebase. It serves as:
- Onboarding reference for new developers
- Architecture decision record for the current state
- Engine extraction planning document
- Pipeline reference for debugging production issues

---

## 2. Project Overview

VCSM is a social marketplace hybrid (Instagram + Airbnb). Users create profiles, switch between personal and business (vport) identities, post content, follow others, send messages, book services, send digital greeting cards (Wanders), and manage business dashboards.

**Core identity model:** Every user has one or more `actors` (user or vport type). An actor is the unit of identity across the platform. Posts, messages, follows, bookings, and notifications all reference `actor_id`, not `user_id`.

**Schema:** All VCSM data lives in the `vc.*` Postgres schema, with `public.profiles` for user profiles and `wanders.*` for the greeting card system.

**Technology:** React 19, Vite, Supabase (PostgreSQL + Auth + Realtime), Cloudflare R2 (media storage), Zustand (state), no SSR.

---

## 3. Folder Structure Overview

```
apps/VCSM/src/
  app/                    (25 files) — Routes, guards, providers, layout
    routes/               — Route definitions (public, protected, learning, wanders, vport)
    providers/            — AuthProvider (root auth context)
    guards/               — ProtectedRoute (auth guard)
    layout/               — RootLayout (app shell)
    platform/             — iOS platform helpers

  features/               (1,215 files) — Feature-based modules
    profiles/     (300)   — User + vport profiles, views, tabs, friends
    chat/         (132)   — Messaging: inbox, conversations, start DM
    wanders/      (114)   — Digital greeting cards + mailbox
    post/          (85)   — Post display, reactions, comments
    dashboard/     (79)   — Vport owner dashboard, flyer builder, QR
    settings/      (63)   — Account, privacy, profile, vport switching
    notifications/ (41)   — Typed notification system
    feed/          (40)   — Post timeline with visibility pipeline
    booking/       (40)   — Service booking, availability, scheduling
    auth/          (38)   — Login, register, onboarding, actor creation
    upload/        (36)   — Post creation, media upload, mentions
    social/        (36)   — Follow/friend system, privacy
    professional/  (32)   — Role-based workspace (nurse, chef, driver)
    moderation/    (31)   — Reports, content hiding, conversation covers
    explore/       (26)   — Search with actor-aware privacy
    block/         (18)   — User blocking with cascading side effects
    ads/           (18)   — Ad framework (UI only, backend incomplete)
    public/        (17)   — Public routes (vport menus)
    onboarding/    (15)   — Onboarding flows
    language/      (13)   — i18n (not yet implemented)
    vport/         (11)   — Vport creation form + core DAL
    void/          (11)   — Void/debug identity features
    vgrid/         (10)   — Grid layout components
    actors/         (6)   — Actor store hooks

  learning/              (171 files) — Embedded LMS (separate from Wentrex)
    controller/           — Role-based controllers (admin, teacher, student, parent)
    screens/              — Role-based screens
    components/           — Shared learning UI
    adapters/             — Actor/realm/learning adapters

  state/                  (15 files) — Global state management
    identity/             — Actor identity resolution (context, controller, DAL, storage, switcher)
    actors/               — Zustand actor cache store
    social/               — Follow request store

  services/               (10 files) — Infrastructure
    supabase/             — Supabase client singleton, auth helpers
    cloudflare/           — R2 upload helpers

  shared/                 (31 files) — Common UI + utilities
    components/           — BottomNavBar, TopNav, Spinner, ActorLink, PullToRefresh
    hooks/                — useUserLocation, useIOSKeyboardLock
    lib/                  — clipboard, compressImage, formatTimestamp, shareNative
    config/               — releaseFlags
    utils/                — resolveRealm
```

---

## 4. Main Architectural Style

VCSM follows a consistent **DAL → Model → Controller → Hook → Screen** pattern:

```
Database (vc.* schema)
  ↓
DAL (raw Supabase queries, explicit column lists)
  ↓
Model (snake_case → camelCase, domain shape)
  ↓
Controller (business logic, auth checks, orchestration)
  ↓
Hook (React state, loading/error, async lifecycle)
  ↓
Screen/Component (UI rendering)
```

**Adapters** sit between features when one feature consumes another's output. They normalize data shapes across boundaries.

**No engine consumption:** VCSM does NOT import from `engines/identity` or `engines/chat`. It has its own parallel implementations. The engines exist but were built for Wentrex and never integrated into VCSM.

---

## 5. Core Domain Areas

### Identity & Actors
- **Files:** `state/identity/` (7 files), `features/auth/` (38 files), `state/actors/` (5 files)
- **Schema:** `vc.actors`, `vc.actor_owners`, `public.profiles`, `vc.vports`, `vc.realms`, `vc.actor_privacy_settings`
- **Key concept:** Users own one or more actors (user type or vport type). The active actor determines what the user sees and does.

### Posts & Feed
- **Files:** `features/upload/` (36 files for creation), `features/post/` (85 files for display), `features/feed/` (40 files for timeline)
- **Schema:** `vc.posts`, `vc.post_media`, `vc.post_mentions`, `vc.actor_presentation`
- **Key concept:** Posts support multi-media carousels, hashtags, @mentions, location. Feed applies visibility rules (blocks, privacy, follows) at read time.

### Chat/Messaging
- **Files:** `features/chat/` (132 files)
- **Schema:** `vc.messages`, `vc.conversations`, `vc.inbox_entries`, `vc.conversation_members`, `vc.message_receipts`
- **Key concept:** Full messaging system with inbox folders (inbox/spam/requests/archived), realtime subscriptions, optimistic UI via clientId.

### Social Graph
- **Files:** `features/social/` (36 files), `features/block/` (18 files)
- **Schema:** `vc.actor_follows`, `vc.social_follow_requests`, `vc.user_blocks`, `vc.friend_ranks`
- **Key concept:** Directed follow graph with private account support (follow requests). Blocking cascades: deletes follow edges + friend ranks.

### Profiles & Vports
- **Files:** `features/profiles/` (300 files), `features/vport/` (11 files), `features/dashboard/` (79 files)
- **Schema:** `vc.vports`, `vc.vport_public_details`, `vc.vport_services`, `vc.vport_service_catalog`
- **Key concept:** Vports are business pages with type-specific features (gas stations, restaurants, lawyers, etc.). Each vport is an actor.

### Booking
- **Files:** `features/booking/` (40 files)
- **Schema:** `vport.bookings`, `vport.resources`, `vport.availability_rules`, `vport.availability_exceptions`, `vport.resource_services`
- **Key concept:** Resources have recurring availability rules. Bookings check free slots (rules - exceptions - existing bookings).

### Notifications
- **Files:** `features/notifications/` (41 files)
- **Schema:** `vc.notifications`
- **Key concept:** Typed notifications (like, dislike, rose, follow, comment, mention). Created by DB triggers on social actions.

### Moderation
- **Files:** `features/moderation/` (31 files)
- **Schema:** `vc.reports`, `vc.report_events`, `vc.moderation_actions`, `vc.conversation_covers`
- **Key concept:** Reports with status workflow (open → triaged → actioned/dismissed). Content hiding. Conversation spam covers.

### Wanders (Greeting Cards)
- **Files:** `features/wanders/` (114 files)
- **Schema:** `wanders.*` (cards, mailbox_items, inboxes, replies, droplinks, card_keys, events)
- **Key concept:** Async greeting card system. Guest-auth compatible. Card templates (Valentine, Birthday, etc.). Share via link. Replies. Encryption support.

### Professional Workspaces
- **Files:** `features/professional/` (32 files)
- **Schema:** Reuses `vc.notifications` for briefings
- **Key concept:** Role-based dashboards for professions (Nurse, Chef, Driver). Extensible via catalog config.

### Learning (Embedded LMS)
- **Files:** `learning/` (171 files)
- **Key concept:** VCSM's own embedded LMS with admin/teacher/student/parent roles. Separate from Wentrex's standalone LMS.

---

## 6. Request/Data Flow Pattern

**Typical write flow:**
```
User action in Screen
  → Hook calls Controller function
    → Controller validates + orchestrates
      → Controller calls DAL function(s)
        → DAL executes Supabase query on vc.* schema
      → DAL returns raw row(s)
    → Controller maps through Model
  → Hook updates React state
→ Screen re-renders with new data
```

**Typical read flow:**
```
Screen mounts or user navigates
  → Hook triggers load via Controller
    → Controller calls DAL (possibly multiple in parallel)
      → DAL queries vc.* with explicit column lists
    → Controller maps results through Model
    → Controller applies business rules (visibility, permissions)
  → Hook stores results in state
→ Screen renders data
```

**Key patterns:**
- DALs never import Controllers (dependency flows down only)
- Controllers never import Hooks or Screens
- Adapters bridge between features
- No direct Supabase queries in Screens or Components
- RPC calls used for complex atomic operations (create_actor_for_user, create_vport, generate_username)

---

## 7. Pipeline Catalog

| Pipeline | Status | Entry Point | Key Files |
|----------|--------|-------------|-----------|
| Post creation | Complete | `features/upload/screens/UploadScreenModern.jsx` | 19 files across upload/, post/, feed/ |
| Post read/display | Complete | `features/feed/screens/CentralFeedScreen.jsx` | feed pipeline + post components |
| User signup | Complete | `features/auth/screens/RegisterScreen.jsx` | 18 files across auth/, state/ |
| Sign-in/bootstrap | Complete | `features/auth/screens/LoginScreen.jsx` | AuthProvider → ProtectedRoute → CompleteProfileGate → IdentityContext |
| Actor resolution | Complete | `state/identity/identityContext.jsx` | identity controller, DAL, selectors, storage |
| Vport creation | Complete | `features/vport/CreateVportForm.jsx` | RPC create_vport → services upsert |
| Vport dashboard | Complete | `features/dashboard/vport/` | Public details, gas, services, exchange, reviews |
| Profile load/update | Complete | `features/profiles/` + `features/settings/profile/` | 300+ profile files |
| Media upload | Complete | `features/upload/api/uploadMedia.js` | R2 upload with compression |
| Chat/messaging | Complete | `features/chat/` | 132 files (parallel to engines/chat) |
| Notification | Complete | `features/notifications/` | DB-trigger-created, typed display |
| Feed pipeline | Complete | `features/feed/pipeline/fetchFeedPage.pipeline.js` | 7 parallel DAL fetches + visibility |
| Follow/social | Complete | `features/social/` | Follow edges, requests, privacy |
| Block | Complete | `features/block/` | Block + cascading side effects |
| Moderation/report | Complete | `features/moderation/` | Reports, hiding, conversation covers |
| Booking | Complete | `features/booking/` | Resources, availability, slots |
| Wanders | Complete | `features/wanders/` | Guest-auth cards, templates, mailbox |
| Search/explore | Partial | `features/explore/` | Actor/vport search works; posts/videos/groups = stubs |
| Professional | Complete | `features/professional/` | Config-based profession workspaces |
| Ads | Partial | `features/ads/` | UI framework only, no backend schema |
| Onboarding | Complete | `features/auth/controllers/onboarding.controller.js` | Profile completion → actor creation |
| Route protection | Complete | `app/guards/ProtectedRoute.jsx` | Auth guard → profile gate → identity |

---

## 8. Detailed Pipeline Traces

### 8.1 Post Creation Pipeline

**Purpose:** User creates a post with optional media, mentions, hashtags, and location.

1. **Entry UI** — `features/upload/screens/UploadScreenModern.jsx`: Form with caption, visibility selector, mode (VIBES/Stories/Vdrops), file picker, mention typeahead, location input.

2. **Media handling** — `features/upload/hooks/useMediaSelection.js`: Validates file type/size (max 10 photos, 50MB). `features/upload/lib/compressIfNeeded.js`: Compresses images client-side. `features/upload/api/uploadMedia.js`: Uploads to Cloudflare R2.

3. **Mention resolution** — `features/upload/hooks/useMentionAutocomplete.js`: Real-time typeahead searching `vc.actor_presentation`. `features/upload/dal/findActorsByHandles.js`: Fallback resolution via `profiles` + `vc.vports` + `vc.actors`.

4. **Submit** — `features/upload/hooks/useUploadSubmit.js`: Orchestrates uploadMedia() → createPostController().

5. **Business logic** — `features/upload/controllers/createPostController.js`: Auth check → extract hashtags → resolve mentions (UI priority, fallback parse) → insertPost → insertPostMedia → insertPostMentions. Manual rollback if media insert fails.

6. **Persistence** — `features/upload/dal/insertPost.js`: INSERT into `vc.posts`. `features/upload/dal/insertPostMedia.js`: INSERT into `vc.post_media`. `features/upload/dal/insertPostMentions.js`: INSERT into `vc.post_mentions`.

7. **Read path** — `features/feed/pipeline/fetchFeedPage.pipeline.js`: 7 parallel DAL fetches (posts, media, mentions, actors, blocks, follows, hidden). `features/feed/model/normalizeFeedRows.js`: Applies visibility rules, builds mention maps. `features/feed/hooks/useFeed.js`: Cursor-paginated state.

8. **Render** — `features/feed/screens/CentralFeedScreen.jsx` → `features/post/adapters/postCard.adapter.js` → `features/post/postcard/ui/PostCard.view.jsx`.

**Risks:** No transaction boundary (3 separate inserts). R2 upload before DB insert (orphan files on failure). Mention rollback missing.

---

### 8.2 User Creation Pipeline

**Purpose:** New user signs up, completes profile, gets an actor identity.

1. **Signup** — `features/auth/screens/RegisterScreen.jsx` → `features/auth/hooks/useRegister.js` → `features/auth/controllers/register.controller.js`: Calls `supabase.auth.signUp()` + upserts `profiles` row.

2. **Onboarding** — `features/auth/hooks/useAuthOnboarding.js` → `features/auth/controllers/onboarding.controller.js`: User fills display_name, username, birthdate, sex. Controller generates username via RPC, computes age, updates `profiles`, then calls `createUserActorForProfile()`.

3. **Actor creation** — `features/auth/controllers/createUserActor.controller.js`: Calls RPC `create_actor_for_user` → inserts `vc.actors` (kind='user'). Then upserts `vc.actor_owners` (links user to actor).

4. **Session bootstrap** — `app/providers/AuthProvider.jsx`: Provides auth context. `app/guards/ProtectedRoute.jsx`: Guards routes. `features/auth/screens/CompleteProfileGate.jsx`: Ensures profile is complete.

5. **Identity resolution** — `state/identity/identityContext.jsx`: Lists owned actors → hydrates with profile/vport/privacy → resolves realm → provides `useIdentity()`.

**DB tables created:** `auth.users`, `public.profiles`, `vc.actors`, `vc.actor_owners`.

**Risks:** No transaction across profile + actor + ownership. Race condition in profile gate if user opens two tabs.

---

### 8.3 Vport Creation Pipeline

**Purpose:** User creates a business page (vport) with type-specific services.

1. **Entry** — `features/vport/CreateVportForm.jsx`: Two-tab form (Profile + Services). Avatar upload to Cloudflare.

2. **Creation** — `features/vport/dal/vport.core.dal.js`: Calls RPC `create_vport` which atomically creates: `vc.vports` + `vc.actors` (kind='vport') + `vc.actor_owners`.

3. **Services** — `features/profiles/kinds/vport/hooks/useUpsertVportServices.js` → controller → `features/profiles/kinds/vport/dal/upsertVportServicesByActor.dal.js`: UPSERT `vc.vport_services`.

4. **Public details** — Separate flow via `features/dashboard/vport/`: UPSERT `vc.vport_public_details`.

5. **Identity** — New vport actor auto-discovered on next identity load.

**Risks:** Strongest pipeline — RPC is atomic. Form mixes some business logic with UI. Public details start empty.

---

### 8.4 Booking Pipeline

**Purpose:** Customers book time slots at vport businesses.

1. **Availability setup** — Owner configures recurring rules (weekday + time window) and exceptions (blocked dates) via `features/booking/` controllers.

2. **Slot calculation** — `features/booking/controller/getResourceAvailability.controller.js`: Rules - exceptions - existing bookings = free slots.

3. **Booking creation** — `features/booking/controller/createBooking.controller.js`: Validates ownership, checks slot availability, inserts `vport.bookings`.

4. **Lifecycle** — Bookings move through: pending → confirmed → completed/cancelled.

---

### 8.5 Social/Follow Pipeline

**Public account follow:** `follow.controller.js` → `dalInsertFollow()` → `vc.actor_follows`. DB trigger creates notification.

**Private account follow:** `follow.controller.js` → `dalUpsertPendingRequest()` → `vc.social_follow_requests` (status=pending). Target accepts → `dalUpdateRequestStatus()` → `dalInsertFollow()`.

**Block:** `blockActorController()` → `blockActor()` → `vc.user_blocks` + cascading: delete follow edges + friend ranks.

---

### 8.6 Wanders Pipeline

**Card creation:** Guest-auth → `createWandersCardDAL()` → `wanders.cards` + `wanders.mailbox_items` (role=sender). Returns public URL.

**Card viewing:** Public screen → `getWandersCardByPublicId()` → display with template → track open (update opened_at, open_count).

**Reply:** `insertReply()` → `wanders.replies`.

---

## 9. Important Files and Responsibilities

### Identity System
| File | Role |
|------|------|
| `state/identity/identityContext.jsx` | React context providing `useIdentity()` — the source of current actor |
| `state/identity/identity.controller.js` | Loads, hydrates, and resolves actor identity |
| `state/identity/identity.read.dal.js` | Queries vc.actors, vc.actor_owners, profiles, vports, realms, privacy |
| `state/identity/identitySelectors.js` | Pure selectors: getActorId, getRealmId, getDisplayName |
| `state/identity/identityStorage.js` | localStorage persistence for current actor |

### Auth System
| File | Role |
|------|------|
| `app/providers/AuthProvider.jsx` | Root auth context: user, session, loading, logout |
| `app/guards/ProtectedRoute.jsx` | Auth guard: no user → /login |
| `features/auth/controllers/register.controller.js` | Signup: auth.signUp + profile upsert |
| `features/auth/controllers/onboarding.controller.js` | Profile completion + actor creation |
| `features/auth/controllers/createUserActor.controller.js` | RPC create_actor_for_user + actor_owners |

### Post System
| File | Role |
|------|------|
| `features/upload/controllers/createPostController.js` | Post creation orchestration with rollback |
| `features/feed/pipeline/fetchFeedPage.pipeline.js` | Feed page orchestration (7 parallel fetches) |
| `features/feed/model/feedRowVisibility.model.js` | Visibility rules (blocks, privacy, follows) |
| `features/post/adapters/postCard.adapter.js` | Normalizes post shape for display |

### Chat System
| File | Role |
|------|------|
| `features/chat/conversation/controllers/sendMessage.controller.js` | Send message (membership check + insert + inbox bump) |
| `features/chat/inbox/controllers/getInboxEntries.controller.js` | Inbox load with fallback from memberships |
| `features/chat/conversation/hooks/useConversationMessages.js` | Realtime message hook with optimistic UI |

---

## 10. App-Specific vs Reusable Logic

### Clearly App-Specific (should stay in apps/VCSM)
- All UI components (screens, views, cards, modals)
- Vport type configuration and type-specific features
- Wanders card templates (Valentine, Birthday, etc.)
- Professional profession catalog
- Feed visibility rules (VCSM social graph semantics)
- Post reactions (like/dislike/rose — VCSM-specific reaction types)
- Flyer builder, QR code generator
- Gas price management

### Potentially Reusable (engine candidates)
- Chat business logic (controllers, DAL, models, permissions) → already exists in engines/chat
- Identity resolution (session → actor → context) → already exists in engines/identity
- Notification system (typed notifications, sender resolution)
- Moderation/report system (reports, status workflow, content hiding)
- Booking system (availability rules, slot calculation, booking lifecycle)
- Follow/social system (follow edges, requests, privacy)
- Block system (block edges, cascading side effects)
- Search framework (actor-aware, privacy-filtered)

### Mixed Files (would need splitting)
- `features/vport/CreateVportForm.jsx` — mixes UI + business logic
- `state/identity/identity.controller.js` — generic resolution + vc-specific hydration
- `features/feed/pipeline/fetchFeedPage.pipeline.js` — orchestration (reusable pattern) + vc-specific DALs

---

## 11. Weak Spots / Risk Areas

### Transaction Safety
- **Post creation:** 3 separate inserts (post, media, mentions) with partial rollback
- **User creation:** profile update + actor creation + ownership are not transactional
- **R2 upload:** media uploaded before DB insert — orphan files on failure

### Duplication
- **Chat:** 132 files duplicate engines/chat (143 files) on different schema
- **Identity:** 7 files duplicate engines/identity (34 files) on different schema
- **Auth session reading:** duplicated in 5+ DAL files

### Architecture Gaps
- **No engine consumption:** VCSM imports zero from engines/identity or engines/chat
- **Schema wall:** VCSM uses `vc.*`, engines use `platform.*` + `chat.*`
- **Permission model:** VCSM chat has no can_post/can_manage/can_moderate
- **Feed is read-computed:** no pre-computed feed, every load runs full visibility pipeline

### Incomplete Features
- **Ads:** UI framework exists, no backend schema
- **Search:** Posts/videos/groups search returns empty stubs
- **Language/i18n:** Not implemented

---

## 12. Recommended Reading Order for New Developers

1. **Start with identity:** `state/identity/identityContext.jsx` → `identity.controller.js` → `identity.read.dal.js`. Understand actor model.
2. **Understand auth:** `app/providers/AuthProvider.jsx` → `app/guards/ProtectedRoute.jsx` → `features/auth/controllers/register.controller.js` → `createUserActor.controller.js`.
3. **Read routing:** `app/routes/index.jsx`. Map all routes.
4. **Follow a post:** `features/upload/controllers/createPostController.js` → `features/feed/pipeline/fetchFeedPage.pipeline.js` → `features/feed/model/normalizeFeedRows.js`.
5. **Understand vports:** `features/vport/CreateVportForm.jsx` → `features/vport/dal/vport.core.dal.js`.
6. **Read chat:** `features/chat/conversation/controllers/sendMessage.controller.js` → `features/chat/inbox/controllers/getInboxEntries.controller.js`.
7. **Read social:** `features/social/friend/subscribe/controller/follow.controller.js` → `features/block/controller/blockActor.controller.js`.
8. **Read booking:** `features/booking/controller/createBooking.controller.js` → `features/booking/controller/getResourceAvailability.controller.js`.
9. **Skim notifications:** `features/notifications/inbox/controller/Notifications.controller.js`.
10. **Explore Wanders:** `features/wanders/controllers/createWandersCard.controller.js`.

---

## 13. Engine Extraction Opportunities

### Immediate (Low Risk)
1. **Move vcsmIdentity.resolver.js** out of engines/identity into apps/VCSM — it queries vc.actors (engine contract violation). Wentrex already migrated its resolver.
2. **Add @identity/@chat Vite aliases** to VCSM — zero-risk preparation.

### Near-Term (Medium Risk)
3. **Build VCSM identity adapter** — mirror Wentrex pattern: setup.js + resolver + context wrapper. VCSM would configure engines/identity with vc-specific dependencies.
4. **Build VCSM chat adapter** — mirror Wentrex pattern: setup.js + policy + adapter. Requires vc.* → chat.* schema migration first.

### Long-Term (High Risk)
5. **Notification engine** — extract typed notification system. Generic: creation, delivery, marking. App-specific: notification kinds, routing.
6. **Moderation engine** — extract report workflow, content hiding. Generic: report lifecycle, action logging. App-specific: reason codes, object types.
7. **Booking engine** — extract availability calculation, booking lifecycle. Generic: rules, exceptions, slots. App-specific: resource types, service catalog.
8. **Social graph engine** — extract follow/block edges. Generic: directed graph operations. App-specific: privacy semantics, cascading rules.

### Should NOT Extract
- Feed visibility pipeline (too tightly coupled to VCSM social graph)
- Post reactions (rose is VCSM-specific)
- Wanders (unique product, not reusable)
- Professional workspaces (VCSM-specific vertical)
- Vport type configuration (gas, restaurant, etc.)

---

## 14. Engine vs App: Current State

### engines/identity (34 files) — Clean, underutilized
- Fully app-agnostic except `vcsmIdentity.resolver.js` (pending migration)
- Operates on `platform.*` schema
- Used by Wentrex via adapters, NOT used by VCSM
- VCSM has its own parallel identity in `state/identity/` (7 files)

### engines/chat (143 files) — Clean, not consumed by VCSM
- Fully app-agnostic, zero vc.* references
- Operates on `chat.*` schema
- Used by Wentrex via adapters, NOT used by VCSM
- VCSM has its own parallel chat in `features/chat/` (132 files) on `vc.*` schema

### Schema Wall
- VCSM: `vc.*` schema for everything
- Engines: `platform.*` (identity) + `chat.*` (messaging)
- No abstraction bridges them
- Migration requires vc.messages → chat.messages, vc.conversations → chat.conversations, etc.

---

## 15. Final Summary

VCSM is a 1,540-file social marketplace with 12+ complete production features. It follows a consistent DAL → Model → Controller → Hook → Screen architecture. The codebase is well-organized by feature with clean separation of concerns within each module.

**The biggest architectural reality:** VCSM predates the shared engines and was never migrated to use them. The engines (identity + chat) were extracted and refined for Wentrex, but VCSM still runs its own parallel implementations on the `vc.*` schema. This creates:
- 132 duplicated chat files
- 7 duplicated identity files
- Zero shared code between the two apps despite identical patterns

**The strongest parts:** Vport creation (atomic RPC), booking system (clean availability math), moderation (comprehensive report workflow), Wanders (full feature with guest auth + encryption).

**The weakest parts:** Post creation (no transaction, orphan files), user creation (no transaction across profile + actor), feed (full visibility recomputation on every load).

**For a new developer:** Start with identity (`state/identity/`), then auth (`features/auth/`), then follow one post from creation to feed display. That covers 80% of the architecture patterns.
