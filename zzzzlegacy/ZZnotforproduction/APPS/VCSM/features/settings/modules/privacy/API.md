---
title: Privacy Module — API Surface
status: ACTIVE
feature: settings
module: privacy
created: 2026-06-07
---

# settings / modules / privacy — API

## Controllers

### actorPrivacy.controller.js
**File:** `apps/VCSM/src/features/settings/privacy/controller/actorPrivacy.controller.js`

| Function | Signature | Notes |
|---|---|---|
| `ctrlGetActorPrivacy` | `(actorId) → { isPrivate }` | Read-only, safe |
| `ctrlSetActorPrivacy` | `({ actorId, callerActorId, isPrivate, refreshActorFn }) → void` | Uses `assertActorOwnsVportActorController` for non-self actors; triggers cache invalidation |

After a successful privacy toggle, `ctrlSetActorPrivacy` calls:
- `invalidateActorPrivacyCacheAdapter` (from social/adapters/privacy)
- `invalidateActorBundleEntry` (from feed/adapters/feedCache)

### Blocks.controller.js
**File:** `apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js`

| Function | Signature | Notes |
|---|---|---|
| `ctrlListMyBlocks` | `(actorId) → Block[]` | Read-only |
| `ctrlSearchActors` | `(query) → Actor[]` | Actor search for block lookup UI |
| `ctrlBlockActor` | `({ callerActorId, actorId, existingBlockedIds }) → void` | String-equality ownership check — PRIVACY-SEC-003 |
| `ctrlUnblockActor` | `({ callerActorId, actorId, existingBlockedIds }) → void` | String-equality ownership check — PRIVACY-SEC-003 |

**Ownership check pattern:** `String(callerActorId) !== String(actorId)` — weaker than
`assertActorOwnsVportActorController`. This is a known gap (PRIVACY-SEC-003).

---

## Hooks

| Hook | File | Purpose |
|---|---|---|
| `useActorPrivacy` | `hooks/useActorPrivacy.js` | Privacy toggle state + setter |
| `useMyBlocks` | `hooks/useMyBlocks.jsx` | Block list context (React context provider + consumer) |
| `useActorLookup` | `hooks/useActorLookup.js` | Actor search for block target lookup |
| `usePendingFollowRequestActions` | `hooks/usePendingFollowRequestActions.js` | Approve/deny pending follow requests |

**Adapter export:**
- `adapters/privacy/hooks/useMyBlocks.adapter.js` → re-exports `useMyBlocks` for external consumers

---

## DAL — Write Surfaces

**File:** `apps/VCSM/src/features/settings/privacy/dal/blocks.dal.js`

| Function | Operation | Target | Notes |
|---|---|---|---|
| `dalInsertBlock` | RPC call | `moderation.block_actor(p_blocker_actor_id, p_blocked_actor_id)` | p_blocker_actor_id = client-supplied actorId — PRIVACY-SEC-001 |
| `dalDeleteBlockByTarget` | DELETE | `moderation.blocks` | |

**File:** `apps/VCSM/src/features/settings/privacy/dal/visibility.dal.js`

| Function | Operation | Target | Notes |
|---|---|---|---|
| `dalSetActorPrivacy` | UPSERT | `vc.actor_privacy_settings` | actor_id = caller-supplied, no DAL session bind — PRIVACY-SEC-002 |

---

## DAL — Read Surfaces

| Function | File | Target |
|---|---|---|
| `dalListMyBlocks(actorId)` | `blocks.dal.js` | `moderation.blocks` |
| `dalGetActorPrivacy(actorId)` | `visibility.dal.js` | `vc.actor_privacy_settings` |
| `dalReadActorKindAndVportId(actorId)` | `blocks.dal.js` | `vc.actors` |

Explicit column select: `BLOCK_COLUMNS` constant used in all block queries.

---

## Models

**File:** `apps/VCSM/src/features/settings/privacy/models/blocks.model.js`

| Function | Purpose |
|---|---|
| `modelBlockRow` | Transforms raw `moderation.blocks` row → view object |
| `modelActorRow` | Transforms actor + profile JOIN row → view object (prefers VPORT avatar/name) |
| `modelActorRows` | Batch version of modelActorRow |

---

## Actor Identity

| Field | Source | Safety |
|---|---|---|
| `actorId` | Parameter passed by hook caller | String-equality check at controller — PRIVACY-SEC-003 |
| `callerActorId` | Parameter passed by hook caller | String-equality check (not `assertActorOwns`) |
| `p_blocker_actor_id` | = actorId passed to `dalInsertBlock` | Client-supplied to RPC — PRIVACY-SEC-001 |
| DAL session bind | NONE for privacy/blocks writes | RLS is sole ownership backstop — PRIVACY-SEC-002 |

---

## Tables / RPCs

| Name | Type | Access | Notes |
|---|---|---|---|
| `vc.actor_privacy_settings` | table | upsert | No session bind at DAL |
| `moderation.blocks` | table | read, delete | |
| `moderation.block_actor` | RPC | write | p_blocker_actor_id client-supplied |
| `vc.actors` | table | read | Actor kind + vportId resolution |

---

## Ownership Validation Path

| Operation | App-layer gate | DB-layer gate | Status |
|---|---|---|---|
| setActorPrivacy | `assertActorOwnsVportActorController` (non-self) | RLS (sole backstop) | PRIVACY-SEC-002 OPEN |
| blockActor | String-equality callerActorId | RPC auth.uid() (unverifiable from source) | PRIVACY-SEC-001, PRIVACY-SEC-003 OPEN |
| unblockActor | String-equality callerActorId | RPC auth.uid() (unverifiable) | PRIVACY-SEC-003 OPEN |

---

## Monitoring Behavior IDs

None assigned. Feature has 0 formal test files.

---

## Deferred Tickets

| Ticket | Description |
|---|---|
| PRIVACY-SEC-001 | p_blocker_actor_id client-supplied; RPC auth.uid() binding unverifiable |
| PRIVACY-SEC-002 | dalSetActorPrivacy no session bind at DAL — RLS sole backstop |
| PRIVACY-SEC-003 | Block/unblock use string-equality not assertActorOwnsVportActorController |
