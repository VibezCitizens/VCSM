# Engine Independence — Final Report

**Date:** 2026-03-31
**Phases completed:** 0, 1, 2, 3, 4

---

## 1. Executive Summary

Both the identity and chat engines are now fully independent from app-specific assumptions. Wentrex consumes both exclusively through app-owned adapter layers. Contracts and regression guardrails are in place to prevent silent regression.

**Identity engine:** Zero `learning.*` queries. Zero Wentrex-named exports. All app-specific code lives in `apps/wentrex/features/identity/`.

**Chat engine:** Zero `vc.*` queries. Three previously-hardcoded VC dependencies (actor search, realm routing, block checking) are now injectable via config. Wentrex provides its own implementations.

**Wentrex adapters:** Zero direct `@chat` or `@identity` imports from screens/components. All engine consumption goes through `features/identity/` and `features/communication/`.

---

## 2. Remaining Violations

| Item | Status | Location | Plan |
|------|--------|----------|------|
| `vcsmIdentity.resolver.js` queries `vc.*` | Known exception | `engines/identity/src/resolvers/` | Migrate to `apps/VCSM/` when VCSM adapter work begins |
| `createVcsmActorEnricher` exported from identity engine | Known exception | `engines/identity/src/adapters/index.js` | Remove when VCSM provides its own enricher |

Both exceptions are VCSM-related and do not affect Wentrex independence. They are tracked in the regression script with explicit exclusions.

---

## 3. Files Changed

### Phase 1 — Identity Engine Independence

| Action | File |
|--------|------|
| CREATED | `apps/wentrex/src/features/identity/wentrexAccess.js` |
| CREATED | `apps/wentrex/src/features/identity/resolvers/wentrexIdentity.resolver.js` |
| CREATED | `apps/wentrex/src/features/identity/controller/provisionWentrexIdentity.controller.js` |
| CREATED | `apps/wentrex/src/features/identity/dal/provision.rpc.dal.js` |
| EDITED | `engines/identity/src/adapters/index.js` — removed Wentrex exports |
| EDITED | `apps/wentrex/src/features/identity/setup.js` — local resolver import |
| EDITED | `apps/wentrex/src/features/identity/WentrexIdentityContext.jsx` — local controller import |
| EDITED | `apps/wentrex/src/learning/components/RequireRole.jsx` — local access guard import |
| DELETED | `engines/identity/src/resolvers/wentrexIdentity.resolver.js` |
| DELETED | `engines/identity/src/controller/provisionWentrexIdentity.controller.js` |
| DELETED | `engines/identity/src/dal/provision.rpc.dal.js` |

### Phase 2 — Chat Engine Independence

| Action | File |
|--------|------|
| EDITED | `engines/chat/src/config.js` — added searchActors, resolveActorRealmContext, checkBlockRelation config slots |
| EDITED | `engines/chat/src/dal/searchActors.dal.js` — delegates to config.searchActors() |
| EDITED | `engines/chat/src/dal/actorRealm.read.dal.js` — delegates to config.resolveActorRealmContext() |
| EDITED | `engines/chat/src/dal/blockRelations.read.dal.js` — delegates to config.checkBlockRelation() |
| EDITED | `engines/chat/src/model/DirectorySearchResult.model.js` — removed vport_name/vport_slug fallbacks |
| EDITED | `apps/wentrex/src/features/communication/setup.js` — provides searchActors, resolveActorRealmContext, checkBlockRelation |

### Phase 3 — Wentrex Adapter Hardening

| Action | File |
|--------|------|
| EDITED | `apps/wentrex/src/features/communication/index.js` — re-exports chat hooks |
| EDITED | `apps/wentrex/src/features/communication/conversation/screen/ConversationView.jsx` — imports from adapter |
| EDITED | `apps/wentrex/src/features/communication/inbox/screens/InboxScreen.jsx` — imports from adapter |
| EDITED | `apps/wentrex/src/features/identity/useWentrexIdentity.js` — re-exports logoutCleanup |
| EDITED | `apps/wentrex/src/learning/components/TopBar.jsx` — imports from adapter |

### Phase 4 — Contracts and Freeze

| Action | File |
|--------|------|
| CREATED | `engines/identity/CONTRACT.md` |
| CREATED | `engines/chat/CONTRACT.md` |
| CREATED | `apps/wentrex/src/features/identity/CONTRACT.md` |
| CREATED | `apps/wentrex/src/features/communication/CONTRACT.md` |
| CREATED | `scripts/check-engine-boundaries.sh` |

---

## 4. Final Boundary Map

```
┌─────────────────────────────────────────────────────────────────┐
│  WENTREX APP (apps/wentrex/src/)                                │
│                                                                 │
│  learning/screens/components/hooks                              │
│    │  imports from:                                             │
│    │    @/features/identity/useWentrexIdentity.js               │
│    │    @/features/communication/index.js                       │
│    │  NEVER imports from: @identity, @chat                      │
│    ▼                                                            │
│  ┌─────────────────────┐  ┌──────────────────────────────┐     │
│  │ features/identity/  │  │ features/communication/      │     │
│  │                     │  │                              │     │
│  │ wentrexAccess.js    │  │ index.js (re-exports)        │     │
│  │ useWentrexIdentity  │  │ adapters/chatEngine.adapter  │     │
│  │ WentrexIdentity     │  │ policy/wentrexMessaging      │     │
│  │   Context.jsx       │  │ hooks/useIdentity            │     │
│  │ controller/         │  │ setup.js                     │     │
│  │   provision...      │  │                              │     │
│  │ resolvers/          │  │                              │     │
│  │   wentrexIdentity   │  │                              │     │
│  │ dal/provision.rpc   │  │                              │     │
│  │ setup.js            │  │                              │     │
│  └──────────┬──────────┘  └──────────────┬───────────────┘     │
│             │ @identity                   │ @chat               │
└─────────────┼─────────────────────────────┼─────────────────────┘
              ▼                             ▼
┌─────────────────────────┐  ┌──────────────────────────────┐
│  engines/identity/      │  │  engines/chat/               │
│                         │  │                              │
│  PUBLIC:                │  │  PUBLIC:                     │
│  configureIdentityEngine│  │  configureChatEngine         │
│  resolveAuthenticated   │  │  useConversation/Messages/   │
│    Context              │  │    Members/Inbox             │
│  switchActiveActor      │  │  startDirectConversation     │
│  logoutCleanup          │  │  sendMessage/editMessage/... │
│  resolveSessionUser     │  │  getInboxEntries/...         │
│  resolve*Services       │  │  evaluateConversationPolicy  │
│  EVENTS/onIdentityEvent │  │  create*Conversation         │
│                         │  │  searchDirectory             │
│  SCHEMA: platform.*     │  │                              │
│  FORBIDDEN: learning.*  │  │  SCHEMA: chat.*              │
│  FORBIDDEN: vc.*        │  │  FORBIDDEN: vc.*             │
│  (except vcsmIdentity   │  │  FORBIDDEN: learning.*       │
│   resolver — pending)   │  │                              │
└─────────────────────────┘  └──────────────────────────────┘
```

---

## 5. Freeze List

### FROZEN — Do Not Modify Without Review

| Item | Reason |
|------|--------|
| `engines/identity/src/adapters/index.js` | Public API contract — no app-specific exports |
| `engines/identity/CONTRACT.md` | Architecture contract |
| `engines/chat/src/config.js` | Dependency injection interface |
| `engines/chat/CONTRACT.md` | Architecture contract |
| `apps/wentrex/src/features/identity/setup.js` | Engine bootstrap |
| `apps/wentrex/src/features/identity/WentrexIdentityContext.jsx` | Identity provider |
| `apps/wentrex/src/features/identity/CONTRACT.md` | Adapter contract |
| `apps/wentrex/src/features/communication/setup.js` | Engine bootstrap |
| `apps/wentrex/src/features/communication/index.js` | Adapter public surface |
| `apps/wentrex/src/features/communication/CONTRACT.md` | Adapter contract |
| `scripts/check-engine-boundaries.sh` | Regression guardrail |

### EVOLVE — Active Development Allowed

| Item | Direction |
|------|-----------|
| `apps/wentrex/src/features/identity/wentrexAccess.js` | Add new role guards as LMS roles expand |
| `apps/wentrex/src/features/identity/resolvers/wentrexIdentity.resolver.js` | Update role derivation as LMS domain evolves |
| `apps/wentrex/src/features/communication/adapters/chatEngine.adapter.js` | Add new conversation creation patterns |
| `apps/wentrex/src/features/communication/policy/wentrexMessagingPolicy.js` | Expand messaging rules |
| `apps/wentrex/src/learning/` | LMS screen migration (old → new pattern) |

---

## 6. Regression Checks

Run `bash scripts/check-engine-boundaries.sh` before every merge.

| Check | What it catches |
|-------|-----------------|
| Identity engine: no learning.* queries | Prevents re-coupling to Wentrex schema |
| Identity engine: no vc.* queries | Prevents re-coupling to VCSM schema (vcsmIdentity.resolver.js excepted) |
| Identity engine: no Wentrex exports | Prevents app-specific leaks into engine API |
| Chat engine: no vc.* queries | Prevents re-coupling to VCSM schema |
| Chat engine: no learning.* queries | Prevents re-coupling to Wentrex schema |
| Wentrex: no @chat outside adapter | Prevents adapter bypass |
| Wentrex: no @identity outside adapter | Prevents adapter bypass |
| Chat engine: no apps/ imports | Prevents reverse dependency |
| Chat engine: no identity engine imports | Prevents engine cross-dependency |
| Identity engine: no apps/ imports | Prevents reverse dependency |
| Identity engine: no chat engine imports | Prevents engine cross-dependency |

---

## 7. Recommended Next Work

### Tomorrow — High Priority

1. **VCSM enricher migration** — Move `vcsmIdentity.resolver.js` from `engines/identity/src/resolvers/` to `apps/VCSM/` (when VCSM work begins). Remove `createVcsmActorEnricher` from engine public API.

2. **LMS screen migration** — Continue migrating old-pattern screens (direct Supabase queries) to DAL → Controller → Hook → Screen. Start with `StudentAssignmentScreen.jsx` (has `.select('*')` violations).

3. **Fix `.select('*')` violations** — 4 instances in `StudentAssignmentScreen.jsx` need explicit column projections.

### This Week — Medium Priority

4. **Deduplicate DAL files** — 8+ identical DAL functions across `student/`, `staff/`, `administration/`. Consolidate to single canonical location.

5. **Fix 81 broken import paths** — Student/staff/parent controllers import from `@/learning/dal/` but files are at `@/learning/administration/dal/`.

6. **Add realm scoping** to old-pattern screens as defense-in-depth before full migration.

### Backlog — Lower Priority

7. Remove orphaned features (moderation, block, empty ui/)
8. Consolidate parent account creation (3 implementations)
9. Build quizzes, gradebook, announcements (roadmap features)
10. SIS/LTI integrations, analytics

---

*End of report. All boundaries verified by `scripts/check-engine-boundaries.sh` — 11/11 checks passing.*
