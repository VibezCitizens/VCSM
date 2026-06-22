# VCSM Native iOS Translation Guide

Generated: 2026-04-05
Source: Full codebase inspection of apps/VCSM + engines/ + logan/


## 1. Project Overview

VCSM is an actor-first social marketplace (Instagram + Airbnb) built as a React 19 SPA on Vite with Supabase as the backend. The app supports dual identity (citizen + vport business), real-time chat, a social feed, booking, and a unique "Wanders" async postcard system.

**Stack:** React 19, Vite, Supabase (PostgreSQL + Auth + Realtime), UnoCSS, Framer Motion, Zustand, Cloudflare R2, FFmpeg WASM

**Total app files:** ~1,400
**Feature modules:** 28
**Shared engines consumed:** Identity, Chat, Hydration (all fully isolated)

**Identity model:** Actor-based. Every user has at least one actor (citizen). They can create additional vport actors (business storefronts). The active actor determines what the user sees, posts, and messages as.


## 2. Folder Map

```
apps/VCSM/src/
├── app/                         # App shell: providers, routes, guards, layout, iOS platform
│   ├── providers/AuthProvider   # Supabase auth session management
│   ├── guards/ProtectedRoute    # Auth gate for protected routes
│   ├── layout/RootLayout        # Bottom nav + shell
│   ├── routes/                  # All route definitions (57 protected, ~20 public)
│   └── platform/ios/            # iOS-specific: keyboard, install prompt, HUD
├── features/                    # 28 feature modules (1,300+ files)
│   ├── auth/                    # Login, register, onboarding, password reset
│   ├── identity/                # Platform bootstrap, resolvers, provisioning
│   ├── chat/                    # Inbox, conversations, start, settings (engine-backed)
│   ├── feed/                    # Central feed pipeline + visibility filtering
│   ├── post/                    # Post detail, reactions, comments, editing
│   ├── upload/                  # Media upload + post creation
│   ├── profiles/                # Profile view, editing, vport kinds (309 files!)
│   ├── social/                  # Follow/subscribe, privacy, friend system
│   ├── block/                   # Block/unblock with social cleanup
│   ├── notifications/           # Bell notifications + badge system
│   ├── settings/                # Account, privacy, profile, vport management
│   ├── vport/                   # Vport CRUD + service catalog
│   ├── dashboard/               # Vport dashboard, flyer builder, QR codes
│   ├── booking/                 # Service booking + availability
│   ├── explore/                 # Search across users, vports, posts
│   ├── wanders/                 # Async postcard system (own schema)
│   ├── moderation/              # Reports, hide/unhide, spam covers
│   ├── onboarding/              # Cards, vibe tags, invites
│   ├── professional/            # Professional access + briefings
│   ├── ads/                     # Vport advertising
│   ├── hydration/               # VCSM actor hydrator setup
│   └── debug/                   # Dev debug components
├── state/                       # Global state stores
│   ├── identity/                # IdentityContext, controller, storage, switcher
│   ├── actors/                  # Actor store (Zustand), hydration helpers
│   └── social/                  # Follow request store
├── services/
│   ├── supabase/                # Client singleton, vc schema client, helpers
│   └── cloudflare/              # R2 upload helpers
├── shared/                      # Domain-neutral components, hooks, utils
│   ├── components/              # BottomNavBar, TopNav, Spinner, Toast, etc.
│   ├── hooks/                   # iOS keyboard, location
│   ├── lib/                     # Clipboard, compress, timestamp, share
│   └── utils/                   # resolveRealm
├── learning/                    # Embedded LMS (NOT Wentrex — separate product)
├── dev/diagnostics/             # Dev-only feature test suites
└── styles/                      # Global CSS
```

**Engines consumed (external to app):**
```
engines/identity/    # Auth→App→Account→Actor resolution (platform.* schema)
engines/chat/        # Conversations, messages, inbox (chat.* schema)
engines/hydration/   # Actor hydration dispatch (pure adapter)
```


## 3. App Bootstrap and Providers

**iOS equivalent:** AppDelegate / App struct + dependency injection container

**Web flow (main.jsx):**
```
1. setupVcsmIdentityEngine()     → configures @identity with Supabase + VCSM resolver
2. setupVcsmHydration()          → registers VCSM actor hydrator
3. setupVcsmChatEngine()         → configures @chat with actor summaries, realm, blocks
4. Render: AuthProvider → IdentityProvider → App → Routes
```

**iOS translation:**
- Engine setup → singleton initialization in AppDelegate/App.init
- AuthProvider → `SessionManager` (ObservableObject) wrapping Supabase auth
- IdentityProvider → `IdentityManager` (ObservableObject) with resolve/commit cycle
- BrowserRouter → NavigationStack or coordinator pattern
- ProtectedRoute → ViewModifier that checks session/identity


## 4. Auth Pipeline

**Web files:**
- `features/auth/hooks/useLogin.js` → form orchestrator
- `features/auth/controllers/login.controller.js` → signInWithPassword wrapper
- `features/auth/dal/login.dal.js` → supabase.auth.signInWithPassword
- `app/providers/AuthProvider.jsx` → session state + onAuthStateChange

**Runtime flow:**
1. User submits email+password
2. supabase.auth.signInWithPassword → session created
3. navigate('/feed') fires BEFORE identity resolves
4. onAuthStateChange fires SIGNED_IN
5. AuthProvider: setUser(newUser)
6. IdentityProvider effect triggers

**iOS translation:**
- `SessionManager`: ObservableObject with @Published user/session
- Login: async function, await signIn, then set state
- Auth state listener: Supabase `onAuthStateChange` → update SessionManager
- **CRITICAL:** In iOS, do NOT navigate until identity resolves (fix the web timing bug)
- Use `@MainActor` for state updates

**iOS layer mapping:**
| Web | iOS |
|-----|-----|
| useLogin hook | LoginViewModel |
| login.controller | SessionManager.signIn() |
| login.dal | SupabaseClient.auth.signIn() |
| AuthProvider | SessionManager (ObservableObject) |


## 5. Identity Pipeline

**Web files:**
- `state/identity/identityContext.jsx` → provider + resolve effect + switchActor
- `state/identity/identity.controller.js` → loadDefaultIdentityForUser
- `state/identity/identityStorage.js` → userId-scoped localStorage cache
- `features/identity/resolvers/vcsmIdentity.resolver.js` → multi-actor query
- `features/identity/controller/ensureVcsmPlatformBootstrap.controller.js` → self-heal

**Engine files consumed:**
- `engines/identity/src/controller/resolveAuthenticatedContext.controller.js`
- `engines/identity/src/services/actorService.js` → resolveActiveActor

**Runtime flow:**
1. Auth user changes → clear identity, set loading
2. resolveAuthenticatedContext({ appKey: 'vcsm' })
3. Engine: session → app → access → account → prefs → state → links → active actor
4. VCSM resolver: reads ALL active vc actor links (multi-actor)
5. Engine selects active actor: prefs → state → primary → first
6. App: readIdentityActorByIdDAL → hydrateIdentityActor
7. Ownership guard + version guard → setIdentity(hydrated)

**iOS translation:**
- `IdentityManager`: ObservableObject with @Published identity, loading
- Resolve cycle: async method, called when SessionManager.user changes
- Actor selection: pure function (same logic as resolveActiveActor)
- Hydration: SupabaseClient queries to vc.actors + profiles/vports
- Guards: version counter + userId check before publishing identity
- Storage: UserDefaults keyed by userId (replaces localStorage)

**Known pitfalls to avoid in iOS:**
- `can_view_actor()` RLS returns NULL for actors without privacy rows → handle gracefully
- Self-heal provisions account but not actor links → check for zero links
- Multi-actor accounts need array query, not single-row


## 6. Feed Pipeline

**Web files:**
- `features/feed/screens/CentralFeedScreen.jsx`
- `features/feed/hooks/useFeed.js` → pagination, drain, preload
- `features/feed/pipeline/fetchFeedPage.pipeline.js` → 7 parallel DAL calls
- `features/feed/model/feedRowVisibility.model.js` → per-post visibility
- `features/feed/model/normalizeFeedRows.js` → final shape

**Runtime flow:**
1. Screen mounts with identity.actorId as viewerActorId
2. useFeed fetches pages (10 posts, cursor-based)
3. Pipeline runs 7 parallel reads: posts, media, mentions, hidden, actors, blocks, follows
4. Visibility model filters: blocked, missing actor, private, inactive vport
5. Normalization: enrich media, hydrate actor, map mentions
6. Pagination: drain up to 3 pages if all filtered, preload first 3 images

**iOS translation:**
- `FeedViewModel`: @Published posts, loading, hasMore
- Pagination: AsyncStream or Combine publisher
- Pipeline: structured concurrency (async let for parallel reads)
- Visibility: pure model function (same logic)
- Image preload: prefetch with URLSession or Kingfisher
- Pull-to-refresh: native ScrollView.refreshable

**Tables queried:** vc.posts, vc.post_media, vc.post_mentions, vc.actors, vc.profiles, vc.vports, vc.actor_privacy_settings, moderation.blocks, vc.actor_follows, moderation.actions


## 7. Chat Pipeline

**Web files:**
- `features/chat/setup.js` → engine DI wiring
- `features/chat/inbox/hooks/useInbox.js` → delegates to @chat engine
- `features/chat/conversation/hooks/*/` → all delegate to @chat engine
- `features/chat/start/hooks/useStartConversation.js` → engine startDirectConversation
- `features/chat/conversation/lib/resolvePartnerActor.js` → display name resolution

**Engine handles:** inbox read/write, conversation CRUD, message send (atomic RPC), realtime subscriptions, typing presence, mark-read

**iOS translation:**
- `ChatService`: wraps engine DAL calls via Supabase client
- `InboxViewModel`: loads from chat.inbox_entries, subscribes to realtime
- `ConversationViewModel`: messages + members + send
- Realtime: Supabase realtime channels (same as web but native Swift client)
- Partner name: pure function resolving from member model (vportName for vport, displayName for user)

**Tables:** chat.conversations, chat.conversation_members, chat.messages, chat.inbox_entries, chat.outbox_events

**Key point:** Chat is ENGINE-BACKED. iOS should call the same RPCs (chat.send_message_atomic, chat.get_or_create_direct_conversation) — not reinvent the write path.


## 8. Profiles and VPORT Pipeline

**Web files:** 309 files in features/profiles/
- `profiles/screens/views/ActorProfileViewScreen.jsx` → citizen profile
- `profiles/kinds/vport/` → vport-specific screens (menu, services, reviews, gas, booking)
- `profiles/hooks/useProfileGate.js` → privacy gate (canView = !private || self || following)
- `features/vport/dal/vport.core.dal.js` → createVport RPC wrapper

**Vport creation writes:**
vc.vports, vc.actors, vc.actor_owners, platform.user_app_access, platform.user_app_accounts, platform.user_app_preferences, platform.user_app_state, platform.user_app_actor_links (all via vc.create_vport SECURITY DEFINER RPC)

**iOS translation:**
- `ProfileViewModel` + `VportProfileViewModel`
- `VportCreationService`: calls the same vc.create_vport RPC
- Privacy gate: pure model logic
- Profile kinds: use enum + protocol pattern instead of file-based routing


## 9. Data Access Layer Structure

**Web pattern:** Every feature has its own DAL files that query Supabase directly.

```
feature/dal/read.dal.js     → supabase.schema('vc').from('table').select(...)
feature/dal/write.dal.js    → supabase.schema('vc').from('table').insert/update/upsert(...)
feature/dal/rpc.dal.js      → supabase.schema('vc').rpc('function_name', params)
```

**iOS translation:** Repository pattern.

```swift
protocol FeedRepository {
    func fetchFeedPage(viewerActorId: UUID, cursor: Date?, pageSize: Int) async throws -> FeedPage
}

class SupabaseFeedRepository: FeedRepository {
    let client: SupabaseClient
    // Same queries, Swift types
}
```

**Key schemas:**
- `vc.*` — VCSM domain (posts, actors, profiles, vports, social, booking)
- `platform.*` — shared identity engine (accounts, links, preferences)
- `chat.*` — shared chat engine
- `wanders.*` — postcard system
- `public.*` — auth-linked profiles


## 10. Realtime/Subscription Behavior

**Web channels:**
| Channel | Schema | Table | Purpose |
|---------|--------|-------|---------|
| chat-conv-{id}-{n} | chat | messages | New messages in conversation |
| chat-inbox-{actorId}-{n} | chat | inbox_entries | Inbox changes |
| chat-badge-{actorId} | chat | inbox_entries | Chat unread badge |
| noti-badge-{actorId} | vc | notifications | Bell notification badge |
| typing-{convId} | — | — (Presence) | Typing indicators |

**iOS translation:**
- Use Supabase Swift SDK realtime channels
- Manage channel lifecycle in a `RealtimeManager` singleton
- Clean up on logout (remove all channels)
- Unique channel names per subscription (prevents reuse bugs)


## 11. Debugging and Investigation Files in Logan

**30 files in logan/ — key ones for iOS developers:**

| File | iOS Relevance | Key Takeaway |
|------|---------------|-------------|
| VCSM Login Pipeline — Definitive Code-Level Trace | HIGH | Exact auth→identity→commit timing |
| VCSM Identity Context Deep Search | HIGH | All identity files + null paths |
| Citizen-to-Vport Switch — Full Pipeline | HIGH | Actor switch requires platform write before hydration |
| Engine Isolation Audit | HIGH | Proves which logic is shared vs app-specific |
| VCSM_MUTATION_MATRIX.md | HIGH | Authority chain for every mutation |
| VCSM_HIGH_RISK_MUTATIONS.md | HIGH | Top bugs to test in iOS |
| VCSM_SILENT_FAILURE_MAP.md | HIGH | Mutations that fail silently |
| VCSM_TRANSACTION_BOUNDARY_MAP.md | HIGH | Which mutations are atomic vs multi-step |
| VCSM_IDEMPOTENCY_MATRIX.md | HIGH | Retry safety per mutation |
| Vport-Creation Multi-Actor Login Audit | HIGH | Provisioning gaps + self-heal |


## 12. Web-to-iOS Translation Rules

**DO NOT copy directly:**
- React Context/Provider → use ObservableObject + EnvironmentObject
- useEffect → use .task { } or .onChange { } modifiers
- useState → @State or @Published
- useCallback/useMemo → computed properties or lazy vars
- React Router → NavigationStack + NavigationPath
- localStorage → UserDefaults (keyed by userId)
- sessionStorage → in-memory store (cleared on app terminate)
- Vite/import.meta.env → Info.plist or build config
- CSS/UnoCSS → SwiftUI modifiers + ViewModifiers
- Framer Motion → withAnimation + matchedGeometryEffect
- FFmpeg WASM → AVFoundation for video processing
- Supabase JS client → Supabase Swift SDK

**Conceptual translations:**
| Web Concept | iOS Equivalent |
|-------------|---------------|
| Hook | ViewModel method or Combine pipeline |
| Controller | Service or UseCase class |
| DAL | Repository protocol + Supabase implementation |
| Model/Mapper | Swift struct + Codable |
| Screen/View | SwiftUI View |
| Adapter | Protocol conformance |
| Pipeline | async let + TaskGroup |
| Realtime subscription | Supabase RealtimeChannel |
| Debug panel | #if DEBUG conditional views |


## 13. Recommended Native iOS Architecture

```
VCSMApp/
├── App/
│   ├── VCSMApp.swift              # @main, engine setup, root view
│   ├── SessionManager.swift       # Supabase auth wrapper (@Observable)
│   ├── IdentityManager.swift      # Identity resolve/commit/switch (@Observable)
│   └── AppCoordinator.swift       # Navigation state
├── Core/
│   ├── SupabaseClient.swift       # Singleton client
│   ├── RealtimeManager.swift      # Channel lifecycle
│   └── Models/                    # Shared domain models (Actor, Identity, etc.)
├── Features/
│   ├── Auth/
│   │   ├── LoginView.swift
│   │   ├── RegisterView.swift
│   │   └── LoginViewModel.swift
│   ├── Feed/
│   │   ├── FeedView.swift
│   │   ├── FeedViewModel.swift
│   │   ├── FeedRepository.swift
│   │   └── PostVisibilityModel.swift
│   ├── Chat/
│   │   ├── InboxView.swift
│   │   ├── ConversationView.swift
│   │   ├── ChatService.swift      # Wraps engine RPCs
│   │   └── InboxViewModel.swift
│   ├── Profile/
│   │   ├── ProfileView.swift
│   │   ├── VportProfileView.swift
│   │   └── ProfileViewModel.swift
│   ├── Vport/
│   │   ├── CreateVportView.swift
│   │   └── VportService.swift     # Calls vc.create_vport RPC
│   ├── Social/
│   │   ├── FollowService.swift
│   │   └── BlockService.swift
│   ├── Upload/
│   │   ├── MediaPicker.swift
│   │   ├── UploadService.swift    # Cloudflare R2 upload
│   │   └── PostCreationViewModel.swift
│   └── Notifications/
│       ├── NotificationBadgeManager.swift
│       └── NotificationsView.swift
├── Repositories/                  # Supabase DAL wrappers
│   ├── FeedRepository.swift
│   ├── ProfileRepository.swift
│   ├── ChatRepository.swift       # Thin wrapper over engine RPCs
│   └── IdentityRepository.swift   # Platform table reads
└── Debug/
    └── IdentityDebugView.swift    # #if DEBUG only
```


## 14. Feature-by-Feature Migration Map

| Feature | Priority | Complexity | iOS Approach |
|---------|----------|-----------|-------------|
| Auth (login/register) | P0 | Low | Direct — Supabase Swift SDK |
| Identity resolve | P0 | High | Rewrite — same logic, Swift async |
| Feed | P0 | Medium | Direct — same queries, SwiftUI list |
| Chat inbox | P0 | Medium | Direct — same engine RPCs |
| Chat conversation | P0 | Medium | Direct — same engine RPCs + realtime |
| Profiles | P1 | High | Adapted — split citizen vs vport views |
| Vport creation | P1 | Low | Direct — single RPC call |
| Actor switching | P1 | Medium | Rewrite — same logic, IdentityManager |
| Upload/post creation | P1 | High | Adapted — native camera + R2 upload |
| Notifications | P1 | Medium | Direct — same table reads + realtime |
| Social (follow) | P2 | Low | Direct — same DAL queries |
| Block system | P2 | Low | Direct — same DAL queries |
| Settings | P2 | Low | Direct |
| Explore/search | P2 | Medium | Direct — same RPCs |
| Booking | P3 | Medium | Direct |
| Wanders | P3 | High | Redesigned — unique UX |
| Dashboard/flyer | P3 | High | Redesigned — canvas not native |
| Professional | P3 | Low | Omit initially |
| Ads | P3 | Low | Omit initially |


## 15. Known Pitfalls and Drift Risks

**From logan investigations:**

1. **can_view_actor RLS returns NULL** for actors without privacy rows → iOS must handle this gracefully or the actor read will fail silently

2. **Redirect before identity** — web navigates to /feed before identity resolves. iOS must NOT do this — wait for identity.

3. **Self-heal creates account but not actor links** — provision_vcsm_identity RPC is incomplete. iOS self-heal must check for zero links.

4. **Multi-actor resolver** — must query array, not single row. iOS must handle 2+ actor links per account.

5. **Upload before persist** — media uploads to R2 before DB write. If DB fails, media is orphaned. iOS should implement cleanup.

6. **Chat engine is shared** — use the same RPCs (send_message_atomic, get_or_create_direct_conversation). Do NOT reinvent write paths.

7. **Dual badge system** — notification bell (vc.notifications) and chat badge (chat.inbox_entries) are independent. Subscribe to both.

8. **Actor-based identity** — everything is scoped to actorId, not userId. The active actor determines what you see and post as.

9. **Vport creation writes to 8 tables** — via SECURITY DEFINER RPC. Do NOT try to replicate these writes client-side.

10. **Follow-request acceptance is non-atomic** — two separate writes. iOS should handle partial failure.


## 16. Final Migration Priorities

**Phase 1 — Core (must work first):**
1. Supabase client + auth
2. Identity resolution + actor selection
3. Feed (read-only)
4. Chat inbox + conversation (read + send)

**Phase 2 — Social + Creation:**
5. Profile viewing + privacy gate
6. Post creation + upload
7. Vport creation
8. Follow/unfollow
9. Notifications

**Phase 3 — Business + Advanced:**
10. Vport dashboard + services
11. Booking
12. Search/explore
13. Actor switching (citizen ⇄ vport)
14. Settings + account management

**Phase 4 — Specialized:**
15. Wanders
16. Professional features
17. Moderation/reporting
18. Ads
19. Embedded LMS (/learning)
