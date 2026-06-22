# MODULE ARCHITECTURE REPORT

**Module:** wanders
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — Digital Card Sending System
**Primary Root:** `apps/VCSM/src/features/wanders/`
**Independence Status:** FRAGMENTED
**Completeness Status:** INCOMPLETE

---

## PURPOSE

Wanders is a digital greeting card / business card system allowing Citizens to create, send, and receive themed cards (birthday, Valentine's, Mother's Day, Teacher Appreciation, business). Cards can be shared publicly via link, received in a mailbox, and replied to. Wanders supports both authenticated and anonymous (guest) users.

---

## OWNERSHIP

Wanders owns: card creation (templates + builder), card publishing, card sharing (public links, VCSM-native share), mailbox inbox, replies, card key management (QR/link identifiers), guest user provisioning, and actor integration (linking guest sessions to VCSM accounts).

---

## ENTRY POINTS

- `/wanders` → `WandersHome.screen.jsx`
- `/wanders/create` → `WandersCreate.screen.jsx`
- `/wanders/sent` → `WandersSent.screen.jsx`
- `/wanders/mailbox` → `WandersMailbox.screen.jsx`
- `/wanders/outbox` → `WandersOutbox.screen.jsx`
- `/wanders/card/:cardId` (public) → `WandersCardPublic.screen.jsx`
- `/wanders/inbox/:inboxId` (public) → `WandersInboxPublic.screen.jsx`
- `/wanders/integrate` → `WandersIntegrateActor.screen.jsx`

---

## LAYER MAP

**core/ sub-module (canonical layer stack):**

DAL (read):
- `actorOwners.read.dal.js`, `cardKeys.read.dal.js`, `cards.read.dal.js`, `droplinks.read.dal.js`, `events.read.dal.js`, `inboxes.read.dal.js`, `mailbox.read.dal.js`, `replies.read.dal.js`, `userFingerprints.read.dal.js`

DAL (write):
- `cardKeys.write.dal.js`, `cards.write.dal.js`, `droplinks.write.dal.js`, `events.write.dal.js`, `inboxes.write.dal.js`, `mailbox.write.dal.js`, `replies.write.dal.js`, `userFingerprints.write.dal.js`

DAL (rpc):
- `mailbox.rpc.dal.js`

Controllers:
- `authSession.controller.js`, `cardKeys.controller.js`, `cards.controller.js`, `createWandersCard.controller.js`, `ensureGuestUser.controller.js`, `mailbox.controller.js`, `publishWandersFromBuilder.controller.js`, `replies.controller.js`, `wandersInboxes.controller.js`

Hooks:
- `usePublishWandersFromBuilder.js`, `useWandersBusinessCardOps.js`, `useWandersCards.hook.js`, `useWandersCreateCardExperience.hook.js`, `useWandersGuest.js`, `useWandersHomeExperience.hook.js`, `useWandersInboxes.js`, `useWandersMailbox.hook.js`, `useWandersMailboxExperience.hook.js`, `useWandersPublicCardExperience.hook.js`, `useWandersReplies.hook.js`, `useWandersReplies.js`, `useWandersSentExperience.hook.js`
- `mailboxExperience/` helpers (constants, helpers, selection, storage)

Model (core):
- `reply.model.js`

Adapter: `core/adapters/wanders.adapter.js`

**STRUCTURAL NOTE:** `core/adapters/wanders.adapter.js` is separate from the top-level non-core adapter.

**Root-level (non-core) — legacy/parallel structure:**

DAL: `dal/wandersCardKeys.dal.js` — DUPLICATE of `core/dal/read/cardKeys.read.dal.js`
Hooks: `hooks/useWandersActorIntegration.js`, `hooks/useWandersCardKey.js`
Controllers: `controllers/wandersCardKeys.controller.js` — appears to duplicate `core/controllers/cardKeys.controller.js`
Models: `model/wandersSharePreview.model.js` AND `models/*.model.js` — two model folder naming conventions
Services: `services/wandersAuthSession.js`, `services/wandersSupabaseClient.js` — **CRITICAL: custom Supabase client**
Adapters: `adapters/services/wandersSupabaseClient.adapter.js`

**Components:**
- 15+ card template components (birthday, valentines, mothers day, teacher appreciation, photo, business, generic)
- `CardBuilder.jsx`, `cardBuilderTiles.jsx`, `registry.js`
- `WandersCardDetail.jsx`, `WandersCardPreview.jsx`, `WandersEmptyState.jsx`, `WandersLoading.jsx`
- Mailbox components: `WandersMailboxItemRow.jsx`, `WandersMailboxList.jsx`, `WandersMailboxToolbar.jsx`
- Reply components: `WandersRepliesList.jsx`, `WandersReplyComposer.jsx`
- Share components: `WandersSharePreview.jsx`, `WandersShareVCSM.jsx`

**Screens:**
- `WandersCardPublic.screen.jsx` + `view/WandersCardPublic.view.jsx`
- `WandersCreate.screen.jsx` + `view/WandersCreate.view.jsx`
- `WandersHome.screen.jsx` + `view/WandersHome.view.jsx`
- `WandersInboxPublic.screen.jsx`
- `WandersIntegrateActor.screen.jsx`
- `WandersMailbox.screen.jsx` + `view/WandersMailbox.view.jsx`
- `WandersOutbox.screen.jsx` + `screens/components/WandersOutboxDetailPane.jsx` + `WandersOutboxListPane.jsx`
- `WandersSent.screen.jsx` + `view/WandersSent.view.jsx`

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Card sending domain clear | — |
| Owner defined | PARTIAL | No IRONMAN record | — |
| Entry points mapped | PASS | 8 screens routed | — |
| Controllers present/delegated | PARTIAL | Core controllers present, root-level duplicates | Duplicate controllers |
| DAL/repository present/delegated | PARTIAL | Core DAL present, root-level legacy DAL | Duplicate DAL structure |
| Models/transformers present | PARTIAL | `model/` AND `models/` folders | Naming inconsistency |
| Hooks/view models present | PASS | 13+ hooks | — |
| Screens/components present | PASS | 8 screens, 25+ components | — |
| Services/adapters present | FAIL | Custom Supabase client is CRITICAL violation | Custom client = trust boundary breach |
| Database objects mapped | PARTIAL | wanders schema tables accessed | Schema not documented |
| Authorization path mapped | PARTIAL | ensureGuestUser + authSession in core | Guest/actor auth boundary unclear |
| Cache/runtime behavior mapped | PARTIAL | mailboxExperience.storage.js | Storage scope unclear |
| Error/loading/empty states mapped | PARTIAL | WandersEmptyState, WandersLoading | Error state not confirmed |
| Documentation linked | FAIL | No Logan doc | — |
| Tests/validation noted | FAIL | No tests | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | FAIL | Custom Supabase client bypasses engine pattern | CRITICAL |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `wandersSupabaseClient.js` | service | wanders → custom client | NO — CRITICAL | Creates a second Supabase client outside platform singleton |
| `vc.actor_owners` | database | wanders reads | YES | Actor integration |
| wanders schema tables | database | wanders reads/writes | YES | cards, inboxes, mailbox, replies, cardKeys |
| `@identity` engine | engine | wanders reads session | PARTIAL | via wandersAuthSession.js |
| `social` feature | feature | wanders → social | UNKNOWN | Actor integration unclear |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| Wanders cards | read/write | wanders | wanders screens | — |
| Card keys | read/write | wanders | QR/share links | Key rotation not documented |
| Mailbox | read/write | wanders | WandersMailbox | — |
| Replies | read/write | wanders | WandersCardPublic | — |
| Guest user fingerprint | write | wanders | ensureGuestUser | MEDIUM — fingerprint stored |
| Actor integration | write | wanders | WandersIntegrateActor | Privacy risk if mishandled |
| User fingerprints | read/write | wanders | guest system | MEDIUM |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | 8 screens routed | — |
| Loading state | PASS | WandersLoading | — |
| Empty state | PASS | WandersEmptyState | — |
| Error state | PARTIAL | Not confirmed | — |
| Auth/owner gates | PARTIAL | ensureGuestUser + auth session | Guest/actor boundary unclear |
| Cache behavior | PARTIAL | mailboxExperience storage | Scope not confirmed |
| Runtime dependencies | FAIL | Custom Supabase client = runtime isolation risk | Sessions not shared with platform client |
| Hot paths | MEDIUM | Card public share view — unauthenticated | — |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| Custom Supabase client | `wandersSupabaseClient.js` creates own client | CRITICAL — independent auth session | VENOM |
| Duplicate DAL | `dal/wandersCardKeys.dal.js` AND `core/dal/read/cardKeys.read.dal.js` | HIGH | SENTRY |
| Duplicate controllers | `controllers/wandersCardKeys.controller.js` AND `core/controllers/cardKeys.controller.js` | HIGH | SENTRY |
| Dual model folders | `model/` AND `models/` | MEDIUM — naming inconsistency | LOGAN |
| Two adapters | `core/adapters/wanders.adapter.js` AND `adapters/services/` | HIGH — unclear canonical adapter | SENTRY |
| `wandersCardCta.model.js` in screens/view/ | Model file inside screen folder | MEDIUM — layer violation | SENTRY |
| `useWandersReplies.hook.js` AND `useWandersReplies.js` | Two files with same name, different suffix | HIGH — which is canonical? | SENTRY |
| `mailboxExperience/` helpers | Constants, helpers, selection, storage in hooks/ | MEDIUM — mixed concerns | SENTRY |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | — | MISSING |
| Ownership record | — | MISSING |
| Security audit | VENOM | CRITICAL MISSING |
| Runtime audit | LOKI | MISSING |
| Performance audit | KRAVEN | MISSING |
| Migration audit | CARNAGE | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | N/A | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Remove/consolidate custom Supabase client | CRITICAL | Separate auth session = security boundary breach, session tokens not unified | VENOM |
| Consolidate duplicate DAL (root vs core) | CRITICAL | Two sources of truth for card keys = data inconsistency risk | SENTRY |
| Consolidate duplicate controllers | HIGH | Unclear which is called | SENTRY |
| Resolve dual model folders | HIGH | Naming inconsistency breaks discoverability | LOGAN |
| Clarify canonical adapter | HIGH | Two adapter paths — consumers cannot know which to use | SENTRY |
| Logan documentation | HIGH | No canonical wanders flow documented | LOGAN |
| Security audit of guest user system | HIGH | Fingerprinting + anonymous DB records = privacy risk | VENOM |
| Resolve useWandersReplies duplicate | HIGH | Which hook is canonical? | IRONMAN |

---

## MODULE BOUNDARY WARNINGS

**MODULE BOUNDARY WARNING**
Location: `features/wanders/services/wandersSupabaseClient.js`
Module: wanders
Current dependency: Creates independent Supabase client with own auth session
Expected boundary: All Supabase access via `@/services/supabase/supabaseClient` singleton
Risk: CRITICAL — sessions not unified with platform auth, token management duplicated
Suggested correction: Remove custom client; use platform supabaseClient with wanders-specific queries

**MODULE BOUNDARY WARNING**
Location: `features/wanders/dal/wandersCardKeys.dal.js` (root)
Module: wanders
Current dependency: Root-level DAL duplicates `core/dal/read/cardKeys.read.dal.js`
Expected boundary: Single canonical DAL in `core/dal/`
Risk: HIGH
Suggested correction: Remove root DAL, migrate all imports to core

**MODULE BOUNDARY WARNING**
Location: `features/wanders/screens/view/wandersCardCta.model.js`
Module: wanders
Current dependency: Model file lives inside `screens/view/`
Expected boundary: Models belong in `model/` or `models/`
Risk: MEDIUM — layer violation
Suggested correction: Move to `core/models/` or `models/`

---

## FINAL MODULE STATUS: INCOMPLETE

## RECOMMENDED HANDOFFS:
- VENOM (security: custom Supabase client, guest fingerprinting)
- SENTRY (boundary: duplicate DAL, controller, adapter — full deduplication audit)
- LOGAN (documentation: wanders system docs)
- CARNAGE (schema: wanders schema mapping)
- IRONMAN (ownership: resolve duplicate hooks)
- LOKI (runtime: guest to actor integration trace)
