# Engine Independence Audit — Phase 0 Report

**Generated:** 2026-03-31
**Scope:** `engines/identity`, `engines/chat`, `apps/wentrex/features/identity`, `apps/wentrex/features/communication`
**Goal:** Make both engines fully independent from Wentrex-specific assumptions, VC-era coupling, and hidden schema/product dependencies.

---

## 1. Executive Summary

Both engines are **architecturally sound** but not yet fully independent:

- **Identity engine** is 90% clean. The platform layer (DAL, models, services, controllers) is fully app-agnostic. Wentrex-specific logic is correctly isolated in resolver files and one provisioning controller. The public API exports these Wentrex-specific functions alongside generic ones — they need to be separated so the engine's public contract is portable.

- **Chat engine** is 85% clean. All message/conversation/inbox state lives in `chat.*` schema. Policy is injectable. However, three DAL files query `vc.*` schema directly (actor search, realm routing, block relations), coupling the engine to VC infrastructure. These must be replaced with injectable dependencies.

- **Wentrex adapters** are mostly compliant. Identity adapter is clean. Communication adapter has 4 direct `@chat` imports from screens that bypass the adapter layer, plus 2 direct `@identity` imports from UI components.

---

## 2. Dependency Map

```
apps/wentrex/src/main.jsx
  ├── features/identity/setup.js
  │     └── @identity: configureIdentityEngine, createWentrexAppContextResolver
  ├── features/communication/setup.js
  │     └── @chat: configureChatEngine
  │     └── @/features/actors/dal: getActorSummariesByIdsDal
  │     └── @/features/communication/policy: createWentrexConversationPolicyResolver
  │     └── @/shared/utils/resolveRealm: resolveRealm
  │
  ├── features/identity/WentrexIdentityContext.jsx
  │     └── @identity: provisionWentrexIdentity, resolveAuthenticatedContext
  │
  ├── features/communication/adapters/chatEngine.adapter.js
  │     └── @chat: evaluateConversationPolicy, createAllowedConversation,
  │              createAnnouncementConversation, CONVERSATION_ACCESS_MODES
  │
  ├── features/communication/policy/wentrexMessagingPolicy.js
  │     └── @chat: CONVERSATION_ACCESS_MODES
  │
  ├── features/communication/conversation/screen/ConversationView.jsx
  │     └── @chat: useConversation, useConversationMessages, useConversationMembers  ← BYPASS
  │
  ├── features/communication/inbox/screens/InboxScreen.jsx
  │     └── @chat: useInbox, startDirectConversation  ← BYPASS
  │
  ├── learning/components/TopBar.jsx
  │     └── @identity: logoutCleanup  ← BYPASS
  │
  └── learning/components/RequireRole.jsx
        └── @identity: wentrexCanAccess  ← BYPASS
```

**Engine internal dependencies:**

```
engines/identity/
  ├── platform.* schema (generic) — DAL layer
  ├── learning.* schema — ONLY in wentrexIdentity.resolver.js (injected)
  └── vc.* schema — ONLY in vcsmIdentity.resolver.js (injected)

engines/chat/
  ├── chat.* schema (generic) — all DAL writes + most reads
  ├── vc.actor_presentation — searchActors.dal.js  ← COUPLING
  ├── vc.actors — actorRealm.read.dal.js  ← COUPLING
  └── vc.user_blocks — blockRelations.read.dal.js  ← COUPLING
```

---

## 3. Coupling Violations

### Identity Engine Violations

| # | File | Line | Violation | Severity |
|---|------|------|-----------|----------|
| I1 | `resolvers/wentrexIdentity.resolver.js` | 51-74 | Queries `learning.actors`, `learning.actor_access` directly inside engine | LOW — correctly isolated in injectable resolver |
| I2 | `resolvers/wentrexIdentity.resolver.js` | 145-166 | Queries `learning.organization_memberships`, `learning.parent_student_links`, `learning.course_memberships` | LOW — correctly isolated in injectable resolver |
| I3 | `resolvers/wentrexIdentity.resolver.js` | 198-229 | `wentrexDestinationFromRoleKeys()` and `wentrexCanAccess()` — Wentrex-specific role logic | MEDIUM — exported from engine public API as generic exports |
| I4 | `controller/provisionWentrexIdentity.controller.js` | 1-70 | Entire controller is Wentrex-specific | MEDIUM — exported from engine public API |
| I5 | `adapters/index.js` | 15, 33-37 | Public API exports `provisionWentrexIdentity`, `createWentrexAppContextResolver`, `wentrexDestinationFromRoleKeys`, `wentrexCanAccess` | HIGH — engine public contract contains app-specific functions |
| I6 | `dal/provision.rpc.dal.js` | 40-42 | Calls `platform.provision_wentrex_identity()` RPC | MEDIUM — Wentrex-named RPC called from engine DAL |

**No profileId/vportId leakage found.** The engine is already actor-first.

### Chat Engine Violations

| # | File | Line | Violation | Severity |
|---|------|------|-----------|----------|
| C1 | `dal/searchActors.dal.js` | 17-58 | Queries `vc.actor_presentation` — selects `vport_name`, `vport_slug`, `kind` | HIGH — hardcoded VC schema dependency |
| C2 | `dal/actorRealm.read.dal.js` | 3-19 | Queries `vc.actors` for `is_void` flag | HIGH — hardcoded VC schema dependency |
| C3 | `dal/blockRelations.read.dal.js` | 3-25 | Queries `vc.user_blocks` for block relationships | HIGH — hardcoded VC schema dependency |
| C4 | `model/DirectorySearchResult.model.js` | (all) | Exposes `vportName`, `vportSlug` fields | MEDIUM — VC-specific fields in engine domain model |
| C5 | `controller/startDirectConversation.controller.js` | 14, 46 | Calls `actorRealm.read.dal` and `blockRelations.read.dal` directly | MEDIUM — orchestrates VC-coupled DALs |
| C6 | `controller/searchDirectory.controller.js` | (all) | Calls `searchActors.dal` directly | MEDIUM — orchestrates VC-coupled DAL |
| C7 | `utils/actorRefs.js` | 1-30 | `actorSource` normalized to `'learning' | 'vc' | null` — hardcoded enum | LOW — cosmetic, values are app-defined |

### Wentrex Adapter Violations

| # | File | Line | Violation | Severity |
|---|------|------|-----------|----------|
| W1 | `communication/conversation/screen/ConversationView.jsx` | 3 | Imports `useConversation`, `useConversationMessages`, `useConversationMembers` from `@chat` | MEDIUM — bypasses adapter |
| W2 | `communication/inbox/screens/InboxScreen.jsx` | 5 | Imports `useInbox`, `startDirectConversation` from `@chat` | MEDIUM — bypasses adapter |
| W3 | `learning/components/TopBar.jsx` | 2 | Imports `logoutCleanup` from `@identity` | LOW — stateless utility, acceptable |
| W4 | `learning/components/RequireRole.jsx` | 3 | Imports `wentrexCanAccess` from `@identity` | MEDIUM — Wentrex function exported from engine |
| W5 | `communication/inbox/screens/InboxScreen.jsx` | 57 | Direct `learning.rpc("get_messageable_contacts")` call | LOW — app-domain query, not engine leak |

---

## 4. Canonical Public Contract — Identity Engine (Target)

### What the engine SHOULD export (portable):

```javascript
// Configuration
configureIdentityEngine(config)

// Controllers (generic)
resolveAuthenticatedContext({ appKey, skipLoginRecord })
switchActiveActor({ userAppAccountId, actorLinkId })
logoutCleanup()

// Granular services (generic)
resolveSessionUser()
resolveUserAppAccess({ userId, appId })
resolveUserAppAccount({ userId, appKey })
resolveAvailableActors({ userAppAccountId })
resolveActiveActor({ actors, preferences, state })
resolveRoleKeys({ userAppAccountId })
resolveCapabilityKeys({ userAppAccountId })
resolveDefaultDestination({ state })

// Auth state
onAuthStateChange(callback)

// Events
EVENTS, onIdentityEvent(event, callback)
```

### What MUST move to `apps/wentrex/features/identity/` (app-specific):

```javascript
// These are currently exported from the engine but belong in Wentrex:
provisionWentrexIdentity()          → move to Wentrex adapter
createWentrexAppContextResolver()   → already injected via config, just remove from public exports
wentrexDestinationFromRoleKeys()    → move to Wentrex adapter
wentrexCanAccess()                  → move to Wentrex adapter
createVcsmActorEnricher()           → move to apps/VCSM adapter (not Wentrex concern)
```

### Identity contract output shape (canonical):

```javascript
{
  userId: string,                    // Supabase auth user
  appId: string,                     // Platform app ID
  userAppAccountId: string,          // Account in this app
  activeActor: {
    id: string,                      // Actor link ID
    actorId: string,                 // Domain actor ID
    actorKind: string,               // e.g. 'learning_actor', 'vc_actor'
    actorSource: string | null,      // e.g. 'learning', 'vc'
    isPrimary: boolean,
    isSwitchable: boolean,
    displayName: string | null,
    avatarUrl: string | null,
    meta: object | null,             // App-specific metadata (opaque to engine)
  },
  actors: ActorLink[],               // All available actor links
  roleKeys: string[],                // App-defined role keys
  capabilityKeys: string[],          // App-defined capability keys
  isSuspended: boolean,
  defaultDestination: string | null, // App-defined post-login route
  state: DomainState,                // Onboarding, login timestamps
  preferences: DomainPreferences,    // Theme, locale, active actor
}
```

No `profileId`, no `vportId`, no Wentrex role semantics. Apps interpret `roleKeys` and `meta` themselves.

---

## 5. Canonical Public Contract — Chat Engine (Target)

### What the engine SHOULD export (portable):

```javascript
// Configuration
configureChatEngine(config)

// Conversation lifecycle
evaluateConversationPolicy(request)
createAllowedConversation(request)
createAnnouncementConversation(request)
createConversation(params)
startDirectConversation(params)      // NEEDS REFACTOR: remove vc.actors dependency
getOrCreateDirectConversation(params)
openConversation(conversationId)

// Messages
getConversationMessages(params)
sendMessage(params)
editMessage(params)
unsendMessage(params)
deleteMessage(params), deleteMessageForSelf(params), hideMessage(params)
hardDeleteMessage(params), deleteMessageAdmin(params)

// Inbox
getInboxEntries(params)
archiveConversationForActor(params)
moveConversationToFolder(params)
updateInboxFlags(params)

// Membership
ensureConversationMembership(params)
getConversationMembers(params)
readConversationMembers(params)

// Directory & Permissions
searchDirectory(params)              // NEEDS REFACTOR: remove vc.actor_presentation dependency
getPermissionSnapshot(params)

// Reactions, receipts, attachments, typing, outbox
addReaction, removeReaction, groupReactionsForMessage
markDelivered, markRead
attachFileToMessage, getAttachmentsForMessage, validateAttachment
startTyping, stopTyping, pruneStaleTypingStates
fetchPendingOutboxEvents, markOutboxEventPublished, markOutboxEventFailed

// Models & Constants (portable)
ConversationModel, MessageModel, ConversationMemberModel, InboxEntryModel
CONVERSATION_ROLES, MESSAGE_TYPES, INBOX_FLAGS, CONVERSATION_ACCESS_MODES
createPermissionSnapshot
```

### What MUST become injectable (currently hardcoded VC):

```javascript
// These are hardcoded VC queries that must become config injections:
config.searchActors(query)           // replaces dal/searchActors.dal.js → vc.actor_presentation
config.resolveActorRealm(actorId)    // replaces dal/actorRealm.read.dal.js → vc.actors
config.checkBlockRelation(a, b)      // replaces dal/blockRelations.read.dal.js → vc.user_blocks
```

### Chat contract — no app-specific fields:

- `scope_kind` / `scope_id` — generic, stored and returned, not interpreted by engine
- `actorSource` — generic tag, engine doesn't interpret values
- `realmId` — injected via config, engine doesn't know what a realm means
- No `vportName`, `vportSlug` in engine models (move to app-level search result enrichment)

---

## 6. Files to Change — Ordered by Phase

### Phase 1: Identity Engine Independence

| # | Action | File | Change |
|---|--------|------|--------|
| 1a | MOVE | `engines/identity/src/resolvers/wentrexIdentity.resolver.js` | Move to `apps/wentrex/features/identity/resolvers/wentrexIdentity.resolver.js` |
| 1b | MOVE | `engines/identity/src/controller/provisionWentrexIdentity.controller.js` | Move to `apps/wentrex/features/identity/controller/provisionWentrexIdentity.controller.js` |
| 1c | MOVE | `engines/identity/src/dal/provision.rpc.dal.js` | Move to `apps/wentrex/features/identity/dal/provision.rpc.dal.js` |
| 1d | MOVE | `engines/identity/src/resolvers/vcsmIdentity.resolver.js` | Move to `apps/VCSM/` (out of scope today; tag for later) |
| 1e | EDIT | `engines/identity/src/adapters/index.js` | Remove all Wentrex/VCSM-specific exports |
| 1f | EDIT | `apps/wentrex/features/identity/setup.js` | Import resolver from local path instead of engine |
| 1g | EDIT | `apps/wentrex/features/identity/WentrexIdentityContext.jsx` | Import provisioning controller from local path |
| 1h | CREATE | `apps/wentrex/features/identity/wentrexCanAccess.js` | Local copy of access guard (currently in engine resolver) |
| 1i | EDIT | `apps/wentrex/src/learning/components/RequireRole.jsx` | Import `wentrexCanAccess` from features/identity instead of @identity |
| 1j | VERIFY | All Wentrex files importing from `@identity` | Confirm no remaining Wentrex-specific imports |

### Phase 2: Chat Engine Independence

| # | Action | File | Change |
|---|--------|------|--------|
| 2a | REFACTOR | `engines/chat/src/config.js` | Add `searchActors`, `resolveActorRealm`, `checkBlockRelation` to config interface |
| 2b | REFACTOR | `engines/chat/src/dal/searchActors.dal.js` | Replace hardcoded `vc.actor_presentation` query with `config.searchActors()` call |
| 2c | REFACTOR | `engines/chat/src/dal/actorRealm.read.dal.js` | Replace hardcoded `vc.actors` query with `config.resolveActorRealm()` call |
| 2d | REFACTOR | `engines/chat/src/dal/blockRelations.read.dal.js` | Replace hardcoded `vc.user_blocks` query with `config.checkBlockRelation()` call |
| 2e | EDIT | `engines/chat/src/model/DirectorySearchResult.model.js` | Remove `vportName`/`vportSlug` from engine model; let app enrich |
| 2f | EDIT | `apps/wentrex/features/communication/setup.js` | Provide `searchActors`, `resolveActorRealm`, `checkBlockRelation` implementations |
| 2g | VERIFY | All chat DAL files | Confirm zero `vc.*` schema references remain |

### Phase 3: Wentrex Adapter Hardening

| # | Action | File | Change |
|---|--------|------|--------|
| 3a | WRAP | `apps/wentrex/features/communication/` | Export `useConversation`, `useConversationMessages`, `useConversationMembers`, `useInbox` from adapter |
| 3b | EDIT | `ConversationView.jsx` | Import from `@/features/communication` instead of `@chat` |
| 3c | EDIT | `InboxScreen.jsx` | Import from `@/features/communication` instead of `@chat` |
| 3d | WRAP | `apps/wentrex/features/communication/` | Export `startDirectConversation` wrapper from adapter |
| 3e | VERIFY | All Wentrex src files | Confirm no remaining direct `@chat` imports outside adapters |

### Phase 4: Contracts & Freeze

| # | Action | File | Change |
|---|--------|------|--------|
| 4a | CREATE | `engines/identity/CONTRACT.md` | Document portable public API |
| 4b | CREATE | `engines/chat/CONTRACT.md` | Document portable public API |
| 4c | CREATE | `apps/wentrex/features/identity/CONTRACT.md` | Document adapter rules |
| 4d | CREATE | `apps/wentrex/features/communication/CONTRACT.md` | Document adapter rules |

---

## 7. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Moving resolver files breaks VCSM app | HIGH | VCSM resolver (`vcsmIdentity.resolver.js`) must stay accessible to VCSM. Tag for separate move. |
| Chat engine `startDirectConversation` depends on realm+block injection | MEDIUM | Refactor to accept injected functions; provide Wentrex implementations in setup.js |
| `provision_wentrex_identity` RPC is called by name | LOW | RPC stays in Supabase; only the DAL call location moves |
| Moving files may break import paths | MEDIUM | Run Vite dev after each phase to verify resolution |
| VCSM also consumes identity engine | HIGH | Do not change platform-layer identity functions. Only move Wentrex-specific code. |

---

## 8. Acceptance Criteria

### Identity Engine Independence
- [ ] `engines/identity/src/adapters/index.js` exports zero Wentrex-named functions
- [ ] `engines/identity/src/adapters/index.js` exports zero VCSM-named functions
- [ ] No file inside `engines/identity/src/` queries `learning.*` schema
- [ ] No file inside `engines/identity/src/` queries `vc.*` schema
- [ ] Wentrex consumes identity only through `features/identity/` adapter
- [ ] `wentrexCanAccess()` lives in Wentrex, not engine
- [ ] `wentrexDestinationFromRoleKeys()` lives in Wentrex, not engine
- [ ] `provisionWentrexIdentity()` controller lives in Wentrex, not engine
- [ ] Engine can be consumed by a hypothetical third app with zero Wentrex awareness

### Chat Engine Independence
- [ ] Zero `vc.*` schema references in `engines/chat/src/`
- [ ] `searchActors`, `resolveActorRealm`, `checkBlockRelation` are injectable via config
- [ ] `DirectorySearchResult.model.js` has no `vportName`/`vportSlug` fields
- [ ] Wentrex provides its own search/realm/block implementations in setup.js
- [ ] Engine can be consumed by a hypothetical third app with zero VC awareness

### Wentrex Adapter Purity
- [ ] Zero direct `@chat` imports from Wentrex screens/components
- [ ] Zero direct `@identity` imports from Wentrex screens/components (except `logoutCleanup` which is stateless)
- [ ] All chat hooks consumed through communication adapter re-exports
- [ ] All identity state consumed through `useWentrexIdentity` / `useWentrexActorId`

---

## 9. Recommendation: What to Do Today vs Defer

### DO TODAY (highest leverage, smallest risk)

**Slice 1 — Identity public API cleanup (Phase 1e, 1h, 1i)**
- Remove Wentrex exports from engine's `adapters/index.js`
- Create `wentrexCanAccess.js` and `wentrexDestinationFromRoleKeys.js` in Wentrex adapter
- Update `RequireRole.jsx` to import from Wentrex adapter
- **Why first:** Smallest change, highest signal. Proves the engine contract is portable.

**Slice 2 — Move Wentrex resolver + provisioning out of engine (Phase 1a, 1b, 1c, 1f, 1g)**
- Move `wentrexIdentity.resolver.js` to `apps/wentrex/features/identity/`
- Move `provisionWentrexIdentity.controller.js` to `apps/wentrex/features/identity/`
- Move `provision.rpc.dal.js` to `apps/wentrex/features/identity/`
- Update `setup.js` and `WentrexIdentityContext.jsx` imports
- **Why second:** Completes identity independence. All learning.* queries leave the engine.

**Slice 3 — Chat VC-coupling injection (Phase 2a-2f)**
- Add injectable config slots for actor search, realm, and blocks
- Refactor the three VC-coupled DALs to use config
- Provide Wentrex implementations in `communication/setup.js`
- **Why third:** Removes all external schema dependencies from chat engine.

### DEFER (not today)

- Moving `vcsmIdentity.resolver.js` to `apps/VCSM/` — requires VCSM app changes
- Wentrex adapter hardening (Phase 3) — lower priority, screens work fine today
- Contract docs (Phase 4) — write after implementation proves stable
- `DirectorySearchResult.model.js` cleanup — depends on whether VCSM search surface changes

### Execution Order Today

```
1. Identity Slice 1  (30 min) — public API cleanup
2. Identity Slice 2  (45 min) — resolver/controller move
3. Chat Slice 3      (60 min) — VC-coupling injection
4. Verify            (15 min) — vite dev, import checks
```

---

*End of Phase 0 audit. All findings are confirmed via file reads. No code was modified.*
