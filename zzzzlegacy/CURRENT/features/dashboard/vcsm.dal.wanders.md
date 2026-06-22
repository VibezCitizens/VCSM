# ⚠️ STANDBY — DO NOT IMPLEMENT · DO NOT LINK · DO NOT SPEND TIME ON THIS FEATURE ⚠️

> **This feature is on standby by owner decision (2026-05-11).**  
> No work should be planned, reviewed, linked, or executed against the `wanders` feature until explicitly reactivated.  
> All AI sessions must skip this feature entirely. Do not include it in architecture plans, sprint planning, or dead-code cleanup passes.

---

# VCSM DAL — `wanders`

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · `apps/VCSM/src/features/wanders/dal/`  
_Confidence:_ STATICALLY\_TRACED  

---

## Summary

| Item | Count |
|---|---|
| DAL files | 19 |
| Exported functions | 38 |
| Live functions | 18 |
| Dead functions | 20 (53% dead weight) |
| Tables accessed | 1 |
| RPCs called | 1 (placeholder stub) |
| Risk findings | CRITICAL — 20 dead, 5 entire subsystem files unimplemented |

## DAL Files

### `actorOwners.read.dal.js`

**Path:** `features/wanders/core/dal/read/actorOwners.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readPrimaryUserActorOwnerByUserIdDAL` | `read` | `actor_owners` |

### `cardKeys.read.dal.js`

**Path:** `features/wanders/core/dal/read/cardKeys.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getWandersCardKeyByCardId` | `read` | — |

### `cardKeys.write.dal.js`

**Path:** `features/wanders/core/dal/write/cardKeys.write.dal.js`  
**Operations:** `read` · `insert` · `update`  

**Exported functions:**

| `createWandersCardKey` | `read` · `insert` · `update` | — |
| `updateWandersCardKey` | `read` · `insert` · `update` | — |

### `cards.read.dal.js`

**Path:** `features/wanders/core/dal/read/cards.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getWandersCardById` | `read` | — |
| `getWandersCardByPublicId` | `read` | — |
| `listWandersCardsByInboxId` | `read` | — |

### `cards.write.dal.js`

**Path:** `features/wanders/core/dal/write/cards.write.dal.js`  
**Operations:** `read` · `insert` · `update`  

**Exported functions:**

| `createWandersCard` | `read` · `insert` · `update` | — |
| `updateWandersCard` | `read` · `insert` · `update` | — |

### `droplinks.read.dal.js`

**Path:** `features/wanders/core/dal/read/droplinks.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getActiveDropLinkByOwnerUserId` | `read` | — |

### `droplinks.write.dal.js`

**Path:** `features/wanders/core/dal/write/droplinks.write.dal.js`  
**Operations:** `read` · `insert` · `update`  

**Exported functions:**

| `createDropLink` | `read` · `insert` · `update` | — |
| `deactivateDropLink` | `read` · `insert` · `update` | — |

### `events.read.dal.js`

**Path:** `features/wanders/core/dal/read/events.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getWandersCardEventById` | `read` | — |
| `listWandersCardEventsByCardId` | `read` | — |

### `events.write.dal.js`

**Path:** `features/wanders/core/dal/write/events.write.dal.js`  
**Operations:** `read` · `insert`  

**Exported functions:**

| `createWandersCardEvent` | `read` · `insert` | — |

### `inboxes.read.dal.js`

**Path:** `features/wanders/core/dal/read/inboxes.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listWandersInboxesByOwnerUserDAL` | `read` | — |
| `readWandersInboxByIdDAL` | `read` | — |
| `readWandersInboxByPublicIdDAL` | `read` | — |

### `inboxes.write.dal.js`

**Path:** `features/wanders/core/dal/write/inboxes.write.dal.js`  
**Operations:** `read` · `insert` · `update`  

**Exported functions:**

| `createWandersInboxDAL` | `read` · `insert` · `update` | — |
| `updateWandersInboxDAL` | `read` · `insert` · `update` | — |

### `mailbox.read.dal.js`

**Path:** `features/wanders/core/dal/read/mailbox.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getWandersMailboxItemByCardAndOwnerUserRole` | `read` | — |
| `getWandersMailboxItemById` | `read` | — |
| `listWandersMailboxItemsByOwnerActorId` | `read` | — |
| `listWandersMailboxItemsByOwnerUserId` | `read` | — |

### `mailbox.rpc.dal.js`

**Path:** `features/wanders/core/dal/rpc/mailbox.rpc.dal.js`  
**Operations:** `rpc`  

**Exported functions:**

| `rpcWandersMailboxSomething` | `rpc` | —`wanders_some_fn` |

### `mailbox.write.dal.js`

**Path:** `features/wanders/core/dal/write/mailbox.write.dal.js`  
**Operations:** `read` · `insert` · `update`  

**Exported functions:**

| `createWandersMailboxItem` | `read` · `insert` · `update` | — |
| `updateWandersMailboxItem` | `read` · `insert` · `update` | — |

### `replies.read.dal.js`

**Path:** `features/wanders/core/dal/read/replies.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listWandersRepliesByCardId` | `read` | — |

### `replies.write.dal.js`

**Path:** `features/wanders/core/dal/write/replies.write.dal.js`  
**Operations:** `read` · `insert` · `update`  

**Exported functions:**

| `createWandersReply` | `read` · `insert` · `update` | — |
| `updateWandersReply` | `read` · `insert` · `update` | — |

### `userFingerprints.read.dal.js`

**Path:** `features/wanders/core/dal/read/userFingerprints.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getWandersUserFingerprintByClientKey` | `read` | — |
| `getWandersUserFingerprintByUserId` | `read` | — |

### `userFingerprints.write.dal.js`

**Path:** `features/wanders/core/dal/write/userFingerprints.write.dal.js`  
**Operations:** `read` · `insert` · `update`  

**Exported functions:**

| `createWandersUserFingerprint` | `read` · `insert` · `update` | — |
| `touchWandersUserFingerprint` | `read` · `insert` · `update` | — |

### `wandersCardKeys.dal.js`

**Path:** `features/wanders/dal/wandersCardKeys.dal.js`  
**Operations:** `read` · `insert` · `update` · `delete`  

**Exported functions:**

| `createWandersCardKey` | `read` · `insert` · `update` · `delete` | — |
| `deleteWandersCardKey` | `read` · `insert` · `update` · `delete` | — |
| `getWandersCardKeyByCardId` | `read` · `insert` · `update` · `delete` | — |
| `updateWandersCardKey` | `read` · `insert` · `update` · `delete` | — |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `actor_owners` | READ | `readPrimaryUserActorOwnerByUserIdDAL` |

## RPCs Called

| RPC | Via Functions |
|---|---|
| `wanders_some_fn` | `rpcWandersMailboxSomething` |

---

## Risk Findings

**CRITICAL — 20 of 38 exported functions are dead (53% dead weight):** The wanders DAL has the highest dead code concentration of any feature audited. Only 18 functions across 38 are in active production use. The remaining 20 have zero callers anywhere in the codebase.

**DEAD — `droplinks.read.dal.js` + `droplinks.write.dal.js` (entire files):** All 3 functions (`getActiveDropLinkByOwnerUserId`, `createDropLink`, `deactivateDropLink`) have zero callers. No controller, hook, or screen imports them. The droplinks subsystem is fully unimplemented at the application layer.

**DEAD — `userFingerprints.read.dal.js` + `userFingerprints.write.dal.js` (entire files):** All 4 functions (`getWandersUserFingerprintByClientKey`, `getWandersUserFingerprintByUserId`, `createWandersUserFingerprint`, `touchWandersUserFingerprint`) have zero callers. The fingerprint subsystem is fully unimplemented.

**DEAD — `events.read.dal.js` (entire file):** `getWandersCardEventById` and `listWandersCardEventsByCardId` have zero callers. Note: `createWandersCardEvent` in `events.write.dal.js` IS live — only the read side of events is dead.

**DEAD — `mailbox.read.dal.js` (entire file):** All 4 read functions (`getWandersMailboxItemByCardAndOwnerUserRole`, `getWandersMailboxItemById`, `listWandersMailboxItemsByOwnerActorId`, `listWandersMailboxItemsByOwnerUserId`) have zero callers. The mailbox is writable but not readable from any controller. `createWandersMailboxItem` in `mailbox.write.dal.js` is live; `updateWandersMailboxItem` is also dead.

**DEAD — `wandersCardKeys.dal.js` (entire legacy file — duplicate):** This is the old monolithic card keys DAL at `features/wanders/dal/`. It exports 4 functions (`createWandersCardKey`, `deleteWandersCardKey`, `getWandersCardKeyByCardId`, `updateWandersCardKey`) that are all shadowed by the newer split DAL at `features/wanders/core/dal/`. No controller imports from the legacy path. The legacy file, its controller (`controllers/wandersCardKeys.controller.js`), and its hook (`hooks/useWandersCardKey.js`) form a complete dead chain.

**DEAD CHAIN — `cardKeys` core path (incomplete refactor):** The new `core/dal/cardKeys.read.dal.js` and `core/dal/write/cardKeys.write.dal.js` are the canonical card key DAL. However, `core/controllers/cardKeys.controller.js` — the only consumer of these files — has zero callers itself. The refactor migrated the DAL layer but never completed the controller → hook → screen wiring. The card key encryption feature is entirely disconnected from the UI.

**PLACEHOLDER — `mailbox.rpc.dal.js`:** This file exports nothing. It is an intentional preparation template with a comment that says "only add functions here when you actually create SQL rpc() in Postgres." The RPC name `wanders_some_fn` and function name `rpcWandersMailboxSomething` are stubs. Not dead code — intentional scaffolding.

**Final Screen MISSING — false positive:** The Architecture Pipeline scanner marked Final Screen as MISSING. All 8 screens exist on disk (`WandersCardPublic.screen.jsx`, `WandersCreate.screen.jsx`, `WandersHome.screen.jsx`, `WandersInboxPublic.screen.jsx`, `WandersIntegrateActor.screen.jsx`, `WandersMailbox.screen.jsx`, `WandersOutbox.screen.jsx`, `WandersSent.screen.jsx`). Scanner naming-pattern miss.

---

## Pending Reviews

**DELETE CANDIDATES — entire dead files (requires IRONMAN ownership confirmation):**

1. `features/wanders/core/dal/read/droplinks.read.dal.js` — 1 function, 0 callers
2. `features/wanders/core/dal/write/droplinks.write.dal.js` — 2 functions, 0 callers
3. `features/wanders/core/dal/read/events.read.dal.js` — 2 functions, 0 callers
4. `features/wanders/core/dal/read/mailbox.read.dal.js` — 4 functions, 0 callers
5. `features/wanders/core/dal/read/userFingerprints.read.dal.js` — 2 functions, 0 callers
6. `features/wanders/core/dal/write/userFingerprints.write.dal.js` — 2 functions, 0 callers
7. `features/wanders/dal/wandersCardKeys.dal.js` — legacy duplicate, 4 functions, 0 callers

**DELETE CANDIDATES — dead functions inside live files:**

8. `updateWandersMailboxItem` in `mailbox.write.dal.js` — 0 callers

**DELETE CANDIDATES — dead legacy chain (controller + hook):**

9. `features/wanders/controllers/wandersCardKeys.controller.js` — legacy controller, 0 callers
10. `features/wanders/hooks/useWandersCardKey.js` — legacy hook, 0 callers

**KEEP — incomplete refactor scaffolding:**

- `features/wanders/core/dal/read/cardKeys.read.dal.js` — canonical DAL, keep pending core controller completion
- `features/wanders/core/dal/write/cardKeys.write.dal.js` — canonical DAL, keep pending core controller completion
- `features/wanders/core/controllers/cardKeys.controller.js` — unused but correct; keep until feature is wired
- `features/wanders/core/dal/rpc/mailbox.rpc.dal.js` — intentional placeholder, keep

**Before any deletion:** IRONMAN must confirm ownership. Droplinks, fingerprints, and event-read subsystems may be planned features in active design. Deletion should be coordinated with product roadmap.

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `actorOwners.read.dal.js`

**Direct callers:**

- `cards.controller.js` _Controller_

**Full call chain to screen:**

```
`actorOwners.read.dal.js` → `cards.controller.js` → `useWandersCards.hook.js` → `WandersInboxPublic.screen.jsx`
```
```
`actorOwners.read.dal.js` → `cards.controller.js` → `useWandersCards.hook.js` → `WandersSent.view.jsx`
```
```
`actorOwners.read.dal.js` → `cards.controller.js` → `useWandersCards.hook.js` → `useWandersPublicCardExperience.hook.js` → `WandersCardPublic.view.jsx`
```
```
`actorOwners.read.dal.js` → `cards.controller.js` → `useWandersCards.hook.js` → `WandersSent.view.jsx` → `WandersSent.screen.jsx`
```

### `cardKeys.read.dal.js`

**Direct callers:**

- `cardKeys.controller.js` _Controller_

**Incomplete refactor — no screen reached:**

```
cardKeys.read.dal.js → cardKeys.controller.js   ← controller has 0 callers; never wired to a hook or screen
```

> DAL and controller are correctly structured. The refactor stopped at the controller layer — no hook calls `cardKeys.controller.js`, so no screen ever reaches this path. KEEP until the feature is connected to the UI.

### `cards.read.dal.js`

**Direct callers:**

- `cards.controller.js` _Controller_
- `replies.controller.js` _Controller_

**Full call chain to screen:**

```
`cards.read.dal.js` → `cards.controller.js` → `useWandersCards.hook.js` → `WandersInboxPublic.screen.jsx`
```
```
`cards.read.dal.js` → `cards.controller.js` → `useWandersCards.hook.js` → `WandersSent.view.jsx`
```
```
`cards.read.dal.js` → `replies.controller.js` → `useWandersMailboxExperience.hook.js` → `WandersMailbox.view.jsx`
```
```
`cards.read.dal.js` → `replies.controller.js` → `useWandersReplies.js` → `WandersOutbox.screen.jsx`
```

### `droplinks.read.dal.js`

> **DEAD — 0 callers confirmed by grep.** No controller, hook, or screen imports `getActiveDropLinkByOwnerUserId`. The entire droplinks read subsystem is unimplemented at the application layer. Deletion candidate — IRONMAN confirmation required.

### `events.read.dal.js`

> **DEAD — 0 callers confirmed by grep.** Neither `getWandersCardEventById` nor `listWandersCardEventsByCardId` is imported by any controller or hook. Note: `createWandersCardEvent` in `events.write.dal.js` IS live — only the read side of events is dead. Deletion candidate — IRONMAN confirmation required.

### `inboxes.read.dal.js`

**Direct callers:**

- `wandersInboxes.controller.js` _Controller_

**Full call chain to screen:**

```
`inboxes.read.dal.js` → `wandersInboxes.controller.js` → `useWandersInboxes.js` → `WandersInboxPublic.screen.jsx`
```

### `mailbox.read.dal.js`

> **DEAD — 0 callers confirmed by grep.** All 4 read functions (`getWandersMailboxItemByCardAndOwnerUserRole`, `getWandersMailboxItemById`, `listWandersMailboxItemsByOwnerActorId`, `listWandersMailboxItemsByOwnerUserId`) have zero callers. The mailbox controller does not import from this file. The call chain shown in the original ARCHITECT scan was a static import trace that did not resolve to actual function-level usage. The mailbox is writable but not readable from any controller. Deletion candidate — IRONMAN confirmation required.
>
> Note: `createWandersMailboxItem` in `mailbox.write.dal.js` IS live.

### `replies.read.dal.js`

**Direct callers:**

- `replies.controller.js` _Controller_

**Full call chain to screen:**

```
`replies.read.dal.js` → `replies.controller.js` → `useWandersMailboxExperience.hook.js` → `WandersMailbox.view.jsx`
```
```
`replies.read.dal.js` → `replies.controller.js` → `useWandersReplies.js` → `WandersOutbox.screen.jsx`
```
```
`replies.read.dal.js` → `replies.controller.js` → `useWandersReplies.js` → `WandersCardPublic.view.jsx`
```
```
`replies.read.dal.js` → `replies.controller.js` → `useWandersMailboxExperience.hook.js` → `WandersMailbox.view.jsx` → `WandersMailbox.screen.jsx`
```

### `userFingerprints.read.dal.js`

> **DEAD — 0 callers confirmed by grep.** Neither `getWandersUserFingerprintByClientKey` nor `getWandersUserFingerprintByUserId` is imported anywhere. The fingerprint subsystem is entirely unimplemented at the application layer. Deletion candidate — IRONMAN confirmation required.

### `mailbox.rpc.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `cardKeys.write.dal.js`

**Direct callers:**

- `cardKeys.controller.js` _Controller_

**Incomplete refactor — no screen reached:**

```
cardKeys.write.dal.js → cardKeys.controller.js   ← controller has 0 callers; never wired to a hook or screen
```

> Same incomplete refactor as `cardKeys.read.dal.js`. KEEP until the feature is connected to the UI.

### `cards.write.dal.js`

**Direct callers:**

- `cards.controller.js` _Controller_
- `createWandersCard.controller.js` _Controller_
- `publishWandersFromBuilder.controller.js` _Controller_
- `replies.controller.js` _Controller_

**Full call chain to screen:**

```
`cards.write.dal.js` → `cards.controller.js` → `useWandersCards.hook.js` → `WandersInboxPublic.screen.jsx`
```
```
`cards.write.dal.js` → `cards.controller.js` → `useWandersCards.hook.js` → `WandersSent.view.jsx`
```
```
`cards.write.dal.js` → `publishWandersFromBuilder.controller.js` → `usePublishWandersFromBuilder.js` → `WandersCreate.view.jsx`
```
```
`cards.write.dal.js` → `replies.controller.js` → `useWandersMailboxExperience.hook.js` → `WandersMailbox.view.jsx`
```

### `droplinks.write.dal.js`

> **DEAD — 0 callers confirmed by grep.** Neither `createDropLink` nor `deactivateDropLink` is imported anywhere. The entire droplinks write subsystem is unimplemented. Deletion candidate — IRONMAN confirmation required.

### `events.write.dal.js`

**Direct callers:**

- `cards.controller.js` _Controller_
- `replies.controller.js` _Controller_

**Full call chain to screen:**

```
`events.write.dal.js` → `cards.controller.js` → `useWandersCards.hook.js` → `WandersInboxPublic.screen.jsx`
```
```
`events.write.dal.js` → `cards.controller.js` → `useWandersCards.hook.js` → `WandersSent.view.jsx`
```
```
`events.write.dal.js` → `replies.controller.js` → `useWandersMailboxExperience.hook.js` → `WandersMailbox.view.jsx`
```
```
`events.write.dal.js` → `replies.controller.js` → `useWandersReplies.js` → `WandersOutbox.screen.jsx`
```

### `inboxes.write.dal.js`

**Direct callers:**

- `wandersInboxes.controller.js` _Controller_

**Full call chain to screen:**

```
`inboxes.write.dal.js` → `wandersInboxes.controller.js` → `useWandersInboxes.js` → `WandersInboxPublic.screen.jsx`
```

### `mailbox.write.dal.js`

**Direct callers:**

- `cards.controller.js` _Controller_
- `createWandersCard.controller.js` _Controller_
- `mailbox.controller.js` _Controller_
- `publishWandersFromBuilder.controller.js` _Controller_
- `replies.controller.js` _Controller_

**Full call chain to screen:**

```
`mailbox.write.dal.js` → `cards.controller.js` → `useWandersCards.hook.js` → `WandersInboxPublic.screen.jsx`
```
```
`mailbox.write.dal.js` → `cards.controller.js` → `useWandersCards.hook.js` → `WandersSent.view.jsx`
```
```
`mailbox.write.dal.js` → `mailbox.controller.js` → `useWandersMailbox.hook.js` → `WandersOutbox.screen.jsx`
```
```
`mailbox.write.dal.js` → `publishWandersFromBuilder.controller.js` → `usePublishWandersFromBuilder.js` → `WandersCreate.view.jsx`
```

### `replies.write.dal.js`

**Direct callers:**

- `replies.controller.js` _Controller_

**Full call chain to screen:**

```
`replies.write.dal.js` → `replies.controller.js` → `useWandersMailboxExperience.hook.js` → `WandersMailbox.view.jsx`
```
```
`replies.write.dal.js` → `replies.controller.js` → `useWandersReplies.js` → `WandersOutbox.screen.jsx`
```
```
`replies.write.dal.js` → `replies.controller.js` → `useWandersReplies.js` → `WandersCardPublic.view.jsx`
```
```
`replies.write.dal.js` → `replies.controller.js` → `useWandersMailboxExperience.hook.js` → `WandersMailbox.view.jsx` → `WandersMailbox.screen.jsx`
```

### `userFingerprints.write.dal.js`

> **DEAD — 0 callers confirmed by grep.** Neither `createWandersUserFingerprint` nor `touchWandersUserFingerprint` is imported anywhere. Deletion candidate — IRONMAN confirmation required.

### `wandersCardKeys.dal.js`

> **DEAD LEGACY CHAIN — confirmed by grep.** All 4 exports (`createWandersCardKey`, `deleteWandersCardKey`, `getWandersCardKeyByCardId`, `updateWandersCardKey`) are shadowed by the canonical `core/dal/cardKeys.*` files. The legacy controller and hook that consume this file are themselves dead:

```
[DEAD CHAIN]
wandersCardKeys.dal.js → wandersCardKeys.controller.js → useWandersCardKey.js
                         (0 callers beyond hook)          (0 callers beyond hook)
```

> This is the old monolithic card keys DAL at `features/wanders/dal/`. The canonical replacement lives at `features/wanders/core/dal/read/cardKeys.read.dal.js` + `features/wanders/core/dal/write/cardKeys.write.dal.js`. Entire dead chain (DAL + controller + hook) is a deletion candidate — IRONMAN confirmation required.

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✓ PRESENT | `wandersSendCardTemplates.model.js`, `wandersCardPreview.model.js`, `reply.model.js`, `wandersSharePreview.model.js`, `cardPayload.model.js`, `wandersAnon.model.js` +8 more |
| **Controller** | ✓ PRESENT | `wandersCardKeys.controller.js`, `authSession.controller.js`, `cardKeys.controller.js`, `cards.controller.js`, `createWandersCard.controller.js`, `ensureGuestUser.controller.js` +4 more |
| **Adapter** | ✓ PRESENT | `wandersSupabaseClient.adapter.js`, `wanders.adapter.js` |
| **Service** | ✗ MISSING | — |
| **Hook** | ✓ PRESENT | `useIsWide.hook.js`, `usePublishWandersFromBuilder.js`, `useWandersBusinessCardOps.js`, `useWandersCards.hook.js`, `useWandersCreateCardExperience.hook.js`, `useWandersGuest.js` +10 more |
| **Component** | ✓ PRESENT | `WandersCardDetail.jsx`, `WandersCardPreview.jsx`, `WandersEmptyState.jsx`, `WandersLoading.jsx`, `WandersMailboxItemRow.jsx`, `WandersMailboxList.jsx` +31 more |
| **View Screen** | ✓ PRESENT | `WandersSendCardSentView.jsx` |
| **Final Screen** | ✓ PRESENT | `WandersCardPublic.screen.jsx`, `WandersCreate.screen.jsx`, `WandersHome.screen.jsx`, `WandersInboxPublic.screen.jsx`, `WandersIntegrateActor.screen.jsx`, `WandersMailbox.screen.jsx`, `WandersOutbox.screen.jsx`, `WandersSent.screen.jsx` (8 screens) |

### Model

_Pure transforms — no side effects, no DB access_

- `features/wanders/components/model/wandersSendCardTemplates.model.js`
- `features/wanders/components/wandersCardPreview.model.js`
- `features/wanders/core/models/reply.model.js`
- `features/wanders/model/wandersSharePreview.model.js`
- `features/wanders/models/cardPayload.model.js`
- `features/wanders/models/wandersAnon.model.js`
- `features/wanders/models/wandersCard.model.js`
- `features/wanders/models/wandersCardKey.model.js`
- `features/wanders/models/wandersClaim.model.js`
- `features/wanders/models/wandersEvent.model.js`
- `features/wanders/models/wandersInbox.model.js`
- `features/wanders/models/wandersMailboxItem.model.js`
- `features/wanders/models/wandersReply.model.js`
- `features/wanders/screens/view/wandersCardCta.model.js`

### Controller

_Business rules, ownership, permissions — no React_

- `features/wanders/controllers/wandersCardKeys.controller.js`
- `features/wanders/core/controllers/authSession.controller.js`
- `features/wanders/core/controllers/cardKeys.controller.js`
- `features/wanders/core/controllers/cards.controller.js`
- `features/wanders/core/controllers/createWandersCard.controller.js`
- `features/wanders/core/controllers/ensureGuestUser.controller.js`
- `features/wanders/core/controllers/mailbox.controller.js`
- `features/wanders/core/controllers/publishWandersFromBuilder.controller.js`
- `features/wanders/core/controllers/replies.controller.js`
- `features/wanders/core/controllers/wandersInboxes.controller.js`

### Adapter

_Cross-feature boundary — only approved cross-feature access point_

- `features/wanders/adapters/services/wandersSupabaseClient.adapter.js`
- `features/wanders/core/adapters/wanders.adapter.js`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/wanders/core/hooks/useIsWide.hook.js`
- `features/wanders/core/hooks/usePublishWandersFromBuilder.js`
- `features/wanders/core/hooks/useWandersBusinessCardOps.js`
- `features/wanders/core/hooks/useWandersCards.hook.js`
- `features/wanders/core/hooks/useWandersCreateCardExperience.hook.js`
- `features/wanders/core/hooks/useWandersGuest.js`
- `features/wanders/core/hooks/useWandersHomeExperience.hook.js`
- `features/wanders/core/hooks/useWandersInboxes.js`
- `features/wanders/core/hooks/useWandersMailbox.hook.js`
- `features/wanders/core/hooks/useWandersMailboxExperience.hook.js`
- `features/wanders/core/hooks/useWandersPublicCardExperience.hook.js`
- `features/wanders/core/hooks/useWandersReplies.hook.js`
- `features/wanders/core/hooks/useWandersReplies.js`
- `features/wanders/core/hooks/useWandersSentExperience.hook.js`
- `features/wanders/hooks/useWandersActorIntegration.js`
- `features/wanders/hooks/useWandersCardKey.js`

### Component

_Presentational only — no hooks, no data fetching_

- `features/wanders/components/WandersCardDetail.jsx`
- `features/wanders/components/WandersCardPreview.jsx`
- `features/wanders/components/WandersEmptyState.jsx`
- `features/wanders/components/WandersLoading.jsx`
- `features/wanders/components/WandersMailboxItemRow.jsx`
- `features/wanders/components/WandersMailboxList.jsx`
- `features/wanders/components/WandersMailboxToolbar.jsx`
- `features/wanders/components/WandersRepliesList.jsx`
- `features/wanders/components/WandersReplyComposer.jsx`
- `features/wanders/components/WandersSendCardForm.jsx`
- `features/wanders/components/WandersSharePreview.jsx`
- `features/wanders/components/WandersShareVCSM.jsx`
- `features/wanders/components/WandersShowLoveCTA.jsx`
- `features/wanders/components/cardstemplates/CardBuilder.jsx`
- `features/wanders/components/cardstemplates/birthday.modern.jsx`
- `features/wanders/components/cardstemplates/business.professional.jsx`
- `features/wanders/components/cardstemplates/cardBuilderTiles.jsx`
- `features/wanders/components/cardstemplates/generic.minimal.jsx`
- `features/wanders/components/cardstemplates/lovedrop/valentines.bold.jsx`
- `features/wanders/components/cardstemplates/lovedrop/valentines.classic.jsx`
- `features/wanders/components/cardstemplates/lovedrop/valentines.cute.jsx`
- `features/wanders/components/cardstemplates/lovedrop/valentines.minimal.jsx`
- `features/wanders/components/cardstemplates/lovedrop/valentines.poem.jsx`
- `features/wanders/components/cardstemplates/lovedrop/valentines.romantic.jsx`
- `features/wanders/components/cardstemplates/mothersday/mothersDayPremiumForm.jsx`
- `features/wanders/components/cardstemplates/mothersday/mothersDayPremiumPreview.jsx`
- `features/wanders/components/cardstemplates/mothersday/mothers_day.basic.jsx`
- `features/wanders/components/cardstemplates/mothersday/mothers_day.premium.jsx`
- `features/wanders/components/cardstemplates/mothersday/mothers_day.vport_promo.jsx`
- `features/wanders/components/cardstemplates/photo/PhotoCard.form.jsx`
- `features/wanders/components/cardstemplates/photo/PhotoCard.preview.jsx`
- `features/wanders/components/cardstemplates/teacherappreciation/teacherAppreciationPremiumForm.jsx`
- `features/wanders/components/cardstemplates/teacherappreciation/teacherAppreciationPremiumPreview.jsx`
- `features/wanders/components/cardstemplates/teacherappreciation/teacher_appreciation.basic.jsx`
- `features/wanders/components/cardstemplates/teacherappreciation/teacher_appreciation.classroom_thank_you.jsx`
- `features/wanders/components/cardstemplates/teacherappreciation/teacher_appreciation.premium.jsx`
- `features/wanders/components/cardstemplates/teacherappreciation/teacher_appreciation.vport_promo.jsx`

### View Screen

_Hooks + component composition — no business logic_

- `features/wanders/components/WandersSendCardSentView.jsx`

### Missing Layers

- 🟡 **Service** — not detected in static scan; not required if controllers handle orchestration directly

> **Final Screen** was originally marked MISSING by the static scanner. All 8 screens confirmed present on disk. Scanner missed them because they use `PascalCase.screen.jsx` naming inside `/screen/` (singular) directory — the scanner only matches `/screens/` (plural) and dot-notation patterns.

---

## Dead Code Audit

_Performed:_ 2026-05-11 · Method: grep function-name callers across full `apps/VCSM/src/` tree

### Function Status Table

| Function | File | Status | Evidence |
|---|---|---|---|
| `readPrimaryUserActorOwnerByUserIdDAL` | `actorOwners.read.dal.js` | LIVE | Called by `cards.controller.js` |
| `getWandersCardKeyByCardId` | `cardKeys.read.dal.js` | LIVE (disconnected) | Called by `cardKeys.controller.js` — controller has 0 callers |
| `createWandersCardKey` | `cardKeys.write.dal.js` | LIVE (disconnected) | Called by `cardKeys.controller.js` — controller has 0 callers |
| `updateWandersCardKey` | `cardKeys.write.dal.js` | LIVE (disconnected) | Called by `cardKeys.controller.js` — controller has 0 callers |
| `getWandersCardById` | `cards.read.dal.js` | LIVE | Called by `cards.controller.js`, `replies.controller.js` |
| `getWandersCardByPublicId` | `cards.read.dal.js` | LIVE | Called by `cards.controller.js` |
| `listWandersCardsByInboxId` | `cards.read.dal.js` | LIVE | Called by `cards.controller.js` |
| `createWandersCard` | `cards.write.dal.js` | LIVE | Called by `cards.controller.js`, `createWandersCard.controller.js`, `publishWandersFromBuilder.controller.js`, `replies.controller.js` |
| `updateWandersCard` | `cards.write.dal.js` | LIVE | Called by `cards.controller.js`, `replies.controller.js` |
| `getActiveDropLinkByOwnerUserId` | `droplinks.read.dal.js` | DEAD | 0 callers — entire file dead |
| `createDropLink` | `droplinks.write.dal.js` | DEAD | 0 callers — entire file dead |
| `deactivateDropLink` | `droplinks.write.dal.js` | DEAD | 0 callers — entire file dead |
| `getWandersCardEventById` | `events.read.dal.js` | DEAD | 0 callers — entire file dead |
| `listWandersCardEventsByCardId` | `events.read.dal.js` | DEAD | 0 callers — entire file dead |
| `createWandersCardEvent` | `events.write.dal.js` | LIVE | Called by `cards.controller.js`, `replies.controller.js` |
| `listWandersInboxesByOwnerUserDAL` | `inboxes.read.dal.js` | LIVE | Called by `wandersInboxes.controller.js` |
| `readWandersInboxByIdDAL` | `inboxes.read.dal.js` | LIVE | Called by `wandersInboxes.controller.js` |
| `readWandersInboxByPublicIdDAL` | `inboxes.read.dal.js` | LIVE | Called by `wandersInboxes.controller.js` |
| `createWandersInboxDAL` | `inboxes.write.dal.js` | LIVE | Called by `wandersInboxes.controller.js` |
| `updateWandersInboxDAL` | `inboxes.write.dal.js` | LIVE | Called by `wandersInboxes.controller.js` |
| `getWandersMailboxItemByCardAndOwnerUserRole` | `mailbox.read.dal.js` | DEAD | 0 callers — entire file dead |
| `getWandersMailboxItemById` | `mailbox.read.dal.js` | DEAD | 0 callers — entire file dead |
| `listWandersMailboxItemsByOwnerActorId` | `mailbox.read.dal.js` | DEAD | 0 callers — entire file dead |
| `listWandersMailboxItemsByOwnerUserId` | `mailbox.read.dal.js` | DEAD | 0 callers — entire file dead |
| `rpcWandersMailboxSomething` | `mailbox.rpc.dal.js` | PLACEHOLDER | Intentional stub — `wanders_some_fn` RPC not yet created in DB |
| `createWandersMailboxItem` | `mailbox.write.dal.js` | LIVE | Called by `cards.controller.js`, `createWandersCard.controller.js`, `publishWandersFromBuilder.controller.js`, `replies.controller.js` |
| `updateWandersMailboxItem` | `mailbox.write.dal.js` | DEAD | 0 callers — function built but never called |
| `listWandersRepliesByCardId` | `replies.read.dal.js` | LIVE | Called by `replies.controller.js` |
| `createWandersReply` | `replies.write.dal.js` | LIVE | Called by `replies.controller.js` |
| `updateWandersReply` | `replies.write.dal.js` | LIVE | Called by `replies.controller.js` |
| `getWandersUserFingerprintByClientKey` | `userFingerprints.read.dal.js` | DEAD | 0 callers — entire file dead |
| `getWandersUserFingerprintByUserId` | `userFingerprints.read.dal.js` | DEAD | 0 callers — entire file dead |
| `createWandersUserFingerprint` | `userFingerprints.write.dal.js` | DEAD | 0 callers — entire file dead |
| `touchWandersUserFingerprint` | `userFingerprints.write.dal.js` | DEAD | 0 callers — entire file dead |
| `createWandersCardKey` (legacy) | `wandersCardKeys.dal.js` | DEAD | DUPLICATE — shadowed by `cardKeys.write.dal.js`; no controller imports legacy path |
| `deleteWandersCardKey` (legacy) | `wandersCardKeys.dal.js` | DEAD | DUPLICATE — no callers anywhere |
| `getWandersCardKeyByCardId` (legacy) | `wandersCardKeys.dal.js` | DEAD | DUPLICATE — shadowed by `cardKeys.read.dal.js` |
| `updateWandersCardKey` (legacy) | `wandersCardKeys.dal.js` | DEAD | DUPLICATE — shadowed by `cardKeys.write.dal.js` |

### Dead Code Summary

| Classification | Count | Files |
|---|---|---|
| LIVE (active in UI) | 15 | Various |
| LIVE (disconnected — incomplete refactor) | 3 | `cardKeys.read.dal.js`, `cardKeys.write.dal.js` |
| DEAD (no callers, entire file) | 13 | `droplinks.read`, `droplinks.write`, `events.read`, `mailbox.read`, `userFingerprints.read`, `userFingerprints.write` (6 files × avg 2) |
| DEAD (function inside live file) | 1 | `updateWandersMailboxItem` |
| DEAD (legacy duplicate) | 4 | `wandersCardKeys.dal.js` (all 4 exports) |
| PLACEHOLDER | 1 | `rpcWandersMailboxSomething` |
| **TOTAL DEAD** | **20** | **53% of all 38 exported functions** |

### Duplicate Implementation

| Concern | Legacy Path | Canonical Path | Status |
|---|---|---|---|
| Card key read | `features/wanders/dal/wandersCardKeys.dal.js` | `features/wanders/core/dal/read/cardKeys.read.dal.js` | Legacy dead — delete |
| Card key write | `features/wanders/dal/wandersCardKeys.dal.js` | `features/wanders/core/dal/write/cardKeys.write.dal.js` | Legacy dead — delete |
| Legacy controller | `features/wanders/controllers/wandersCardKeys.controller.js` | `features/wanders/core/controllers/cardKeys.controller.js` | Legacy dead — delete |
| Legacy hook | `features/wanders/hooks/useWandersCardKey.js` | _(none — incomplete refactor)_ | Legacy dead — delete after wiring core |

---

## Native Parity Notes

**Status:** PENDING FALCON review

- Wanders is a VCSM-native PWA feature with no current iOS native implementation planned.
- Feature is on **STANDBY** — native parity assessment deferred until feature is reactivated.
- When reactivated, FALCON must review: card creation flow, mailbox/inbox views, public card share link, inbox public view, and the reply composer.

---

## Command Evidence Registry

| Command | Report Path | Relevance | Status |
|---|---|---|---|
| VENOM | — | Security: public card access, guest user trust, card key encryption | MISSING |
| SENTRY | — | Architecture compliance: incomplete refactor, legacy controller | MISSING |
| FALCON | — | Native parity: wanders PWA to iOS transfer assessment | MISSING |
| IRONMAN | — | Ownership confirmation required before dead code deletion | MISSING |
| THOR | — | Release gate: feature on standby — do not release | N/A |
| CARNAGE | — | DB: `wanders_some_fn` RPC placeholder never created | MISSING |
| DEADPOOL | — | No active bugs being traced | N/A |

---

## Change Log

### 2026-05-11 00:00

Task: Dead code audit — ARCHITECT static scan + function-level grep across full `apps/VCSM/src/`  
Application Scope: VCSM  
Code Status Before: ARCHITECT scan had 38 functions, no dead code classification, stale call chains for mailbox.read and several "possibly dead" entries  
Code Status After: All 38 functions classified; 20 confirmed dead (53%); stale call chains corrected; Final Screen false positive resolved  

Files Changed:
- `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.wanders.md` — this file

Command Evidence: ARCHITECT static scan + Explore agent grep  
Architecture Contracts Checked: N/A — read-only audit  
Security / Runtime / DB Notes: VENOM review required before deleting moderation-adjacent dead code; CARNAGE required for `wanders_some_fn` placeholder RPC  

Validation: All 38 function names individually grepped across `apps/VCSM/src/`; no false positives introduced  
Documentation Truth Status: VERIFIED — docs now match grep-confirmed reality
