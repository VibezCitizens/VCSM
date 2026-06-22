# Feature Contract: block

**Status:** CLEAN  
**Risk:** LOW  
**Files:** 18 (scanner 2026-06-05)  
**Inbound imports:** 15  
**Outbound imports:** 4  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`block` owns the actor blocking system:
- Block an actor
- Unblock an actor
- Block guard (gate access to profile/chat for blocked actors)
- Block status hooks

`block` is a **Layer 1 infrastructure feature** consumed broadly (15 inbound imports) by profiles, social, chat, and any surface that restricts access for blocked actors.

---

## 2. Non-Goals

`block` must not own:
- Social graph (follow/subscribe) — that is `social/`
- Profile rendering — that is `profiles/`
- Chat messaging — that is `chat/`
- Moderation (reporting) — that is `moderation/`

---

## 3. Public API / Adapter Boundary

**Known adapters (confirmed by scanner):**
- `block/adapters/hooks/useBlockActorAction.adapter` — consumed by `feed/hooks/useCentralFeedActions.js`
- `block/adapters/` — additional exports consumed by 15 features

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `block/adapters/` | `hooks/useBlockActorAction.adapter` confirmed |
| hooks | `block/hooks/` | `useBlockActions.js`, `useBlockActorAction.js` confirmed |
| guards | `block/guards/` | Profile/chat access guard |
| controllers | `block/controllers/` or `controller/` | Block/unblock logic |
| dal | `block/dal/` | Block record data access |
| model | `block/model/` | Block status shapes |

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `feed` | Block action invalidates feed cache — BIDIR SAFE (Pair 3) | YES — `useBlockActions.js` and `useBlockActorAction.js` → `feed/adapters/feedCache.adapter` |
| `identity` | Active actor | Confirmed by outbound count |

---

## 6. Prohibited Dependencies

`block` must not import from:
- `profiles/` — profiles consumes block, not the reverse
- `social/` — block and social are separate systems
- `chat/` — chat consumes block guard, not the reverse
- `feed/` DAL or controllers — only `feed/adapters/feedCache.adapter` (confirmed CLEAN)

---

## 7. DAL / Controller Rules

**DAL rules:**
- May query block records (`vc.actor_blocks` or equivalent)
- Must use explicit column projections
- Must not determine authorization — the controller decides whether blocking is allowed

**Controller rules:**
- Block action must verify actor context (cannot block yourself, cannot block if already blocked)
- Must invalidate feed cache after successful block (via `feed/adapters/feedCache.adapter`)
- Must not import Supabase directly

---

## 8. Known Coupling

**Bidirectional pair — LEGITIMATE:**
- `block` ↔ `feed` — Pair 3 (QUERY-INVALIDATION)

**No violations.** Zero scanner violations.

---

## 9. Risk Notes

**LOW.** Clean feature with clear boundary. The feed cache invalidation pattern is correct and well-managed through the adapter.

---

## 10. Migration Notes

No pending migration.

---

## 11. Unknowns

- TODO: Identify all 15 inbound consumers (feed is 1; 14 others unknown)
- TODO: Confirm remaining 2 outbound imports (4 total — feed + identity + 2 unknown)
- TODO: Confirm whether block has its own `guards/` subfolder or if guards are part of hooks
