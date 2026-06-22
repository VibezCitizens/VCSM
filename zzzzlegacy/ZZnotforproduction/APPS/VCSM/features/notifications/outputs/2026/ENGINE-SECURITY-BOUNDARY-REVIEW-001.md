# ENGINE-SECURITY-BOUNDARY-REVIEW-001
# engines/notifications — Architecture & Mutation Security Review
# Date: 2026-06-07
# Scope: /engines/notifications (read-only)
# Trigger: Pre-change review for NOTI-SEC-001 (Deadpool-001 finding)

---

## CRITICAL STRUCTURAL FINDING — Read Before Anything Else

`@notifications` in VCSM does NOT resolve to `engines/notifications/`.

**Alias target (vite.config.js:45-46):**
```
@notifications → apps/VCSM/src/features/notifications/runtime/index.js
```

VCSM runs its own lightweight runtime — a parallel implementation that lives inside the feature folder. The `engines/notifications/` directory is a separate, more complete engine that VCSM does not consume directly. This changes every question below.

---

## Files Reviewed

| File | Role |
|---|---|
| `engines/notifications/CLAUDE.md` | Engine design contract |
| `engines/notifications/index.js` | Entry point (re-exports adapters) |
| `engines/notifications/src/adapters/index.js` | Public API surface |
| `engines/notifications/src/config.js` | DI configuration |
| `engines/notifications/src/types/index.js` | Type definitions |
| `engines/notifications/src/controller/inboxState.controller.js` | markSeen / markRead / dismiss / archive |
| `engines/notifications/src/controller/countUnread.controller.js` | countUnread + cache |
| `engines/notifications/src/controller/getInbox.controller.js` | getInboxNotifications |
| `engines/notifications/src/controller/publishEvent.controller.js` | publishEvent pipeline |
| `engines/notifications/src/dal/inbox.write.dal.js` | inbox_items mutations |
| `engines/notifications/src/dal/inbox.read.dal.js` | inbox_items reads |
| `engines/notifications/src/dal/recipients.read.dal.js` | recipients reads |
| `engines/notifications/src/dal/recipients.write.dal.js` | recipients writes |
| `engines/notifications/src/dal/events.write.dal.js` | events inserts |
| `engines/notifications/src/dal/rendered.write.dal.js` | rendered upserts |
| `engines/notifications/src/events.js` | Internal event bus |
| `engines/notifications/src/services/deliveryOrchestrator.service.js` | Per-channel delivery |
| `apps/VCSM/vite.config.js:45-46` | Alias resolution (critical) |

---

## Q1: Is engines/notifications app-neutral by design?

**YES — confirmed by contract.**

`engines/notifications/CLAUDE.md` is explicit:
- "NEVER add app-specific logic — use dependency injection"
- "The engine NEVER assumes VC-specific concepts. Domain-specific logic is injected via configuration."
- "NEVER import from `apps/VCSM/` or any other engine"
- "NEVER query schemas other than `notification.*`"

The engine serves `vc`, `vport`, `learning`, and `platform` source domains. It knows about `recipient_actor_id` as a column, but it has no knowledge of `actor_owners`, VCSM actor kinds, or auth.uid() → actor resolution rules.

**The engine is intentionally and correctly neutral.**

---

## Q2: Does the engine know about actor_owners? Should it ever?

**No. And no.**

The engine knows `recipient_actor_id` as a DB column — it uses it to scope reads (`countUnread`, `getInboxNotifications`). It does not know what `actor_owners` means, how VCSM resolves actor identity from a Supabase session, or how VPORTs relate to citizen owners.

The DI contract defines three injectable hooks:
- `supabaseClient` — required
- `resolveRecipients(event)` — optional recipient resolver
- `resolveActorCard(actorId)` — optional sender enrichment
- `debugReporter` — optional observability

There is **no `resolveActorOwnership` or `verifyRecipientOwner` DI hook**. The engine was not designed with caller-supplied ownership verification in mind.

Adding `actor_owners` knowledge to the engine would violate its neutrality contract. VCSM must enforce this at its own layer.

---

## Q3: Are recipient mutations currently scoped only by recipient_id?

**YES — in both the engine AND VCSM's runtime.**

Engine (`inbox.write.dal.js`):
```js
// markRead:
.from('inbox_items').update({...}).eq('recipient_id', recipientId)

// dismiss:
.from('inbox_items').update({...}).eq('recipient_id', recipientId)

// archive:
.from('inbox_items').update({...}).eq('recipient_id', recipientId)

// markSeen:
.from('inbox_items').update({...}).in('recipient_id', recipientIds)
```

VCSM runtime (`notificationRuntime.dal.js`) — identical pattern:
```js
// markNotificationReadDAL:
.from('inbox_items').update({...}).eq('recipient_id', recipientId)

// dismissNotificationDAL:
.from('inbox_items').update({...}).eq('recipient_id', recipientId)

// archiveNotificationDAL:
.from('inbox_items').update({...}).eq('recipient_id', recipientId)
```

Neither layer joins back to `notification.recipients` to verify that the session actor matches `recipient_actor_id`. There is no ownership check at the application or engine layer. Both implementations are identical in this gap.

---

## Q4: Is that acceptable if DB RLS exists?

**Only if RLS is verified to be correct. Unknown = not acceptable.**

RLS on `notification.inbox_items` would need to:
1. Resolve the session's auth.uid() → actor(s) they control
2. Join to `notification.recipients WHERE recipient_id = inbox_items.recipient_id`
3. Verify that `notification.recipients.recipient_actor_id` belongs to the session actor

This is a non-trivial RLS policy. It requires a cross-table subquery join that must work correctly for both citizen actors and VPORT actors (where the session user owns the VPORT via `actor_owners`, not directly).

**The RLS status on `notification.inbox_items` has not been verified (NOTI-SEC-001 open).**

Per the Deadpool review: TICKET-BOOKING-RPC-001 (resolved, 2026-06-07) confirmed that `notification.events` has a DB BEFORE INSERT trigger enforcing `source_actor_id` via `vc.actor_owners`. That protection covers the write path. No equivalent confirmation exists for the mutation path on `inbox_items`.

---

## Q5: Should VCSM wrap engine mutations with actor ownership checks?

**YES. Regardless of DB RLS status.**

Defense-in-depth means: the app layer should not rely solely on DB for ownership enforcement when an app-layer check is practical and cheap.

The check VCSM needs before any `markRead`, `dismiss`, or `archive` call:

```js
// Does recipientId belong to actorId?
const { data } = await supabase
  .schema('notification')
  .from('recipients')
  .select('id')
  .eq('id', recipientId)
  .eq('recipient_actor_id', actorId)
  .maybeSingle()

if (!data) return null  // not owned by this actor
```

This is a single indexed lookup. `notification.recipients` is already queried during inbox fetch — this adds one lightweight verification query before the mutation.

**This is a VCSM responsibility — not an engine responsibility.**

---

## Q6: Should the engine expose actor-scoped mutation APIs?

**No — with one exception.**

Option A (`markRead({ recipientId, assertActorId })`): The engine could accept an optional `assertActorId` that it uses to verify `recipient_actor_id` before mutating. This would be domain-neutral (recipient_actor_id is an engine column), not VCSM-specific. This is a reasonable future enhancement.

Option B (engine unchanged): VCSM wraps the mutation at the feature layer with its own ownership check before calling the engine.

**Recommendation: Option B now.** The engine is stable and correct. Adding an optional `assertActorId` parameter is a valid engine evolution but creates a migration task for other consumers. VCSM-side wrapping is faster, safer, and leaves the engine untouched.

If future apps consuming `engines/notifications` need the same protection, add `assertActorId` to the engine at that point.

---

## Q7: Should the DB provide RPCs with auth.uid() enforcement?

**YES — as the final defense layer. But not as the only layer.**

An RPC like:
```sql
CREATE FUNCTION notification.mark_inbox_read(p_recipient_id UUID)
RETURNS SETOF notification.inbox_items AS $$
  -- resolves auth.uid() → actor(s) via vc.actor_owners
  -- validates that recipient_actor_id matches
  -- updates inbox_items
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Advantages:
- Cannot be bypassed by app bugs or API call interception
- Enforces ownership at the database where data lives
- Works correctly for VPORT actors (owner lookup via actor_owners)

Disadvantages:
- Requires a migration (owner approval, manual deploy)
- VPORT ownership logic inside a `notification` schema function is a cross-schema concern that violates the engine's own schema isolation rule

The better DB approach is **RLS on `notification.inbox_items`** that joins through `notification.recipients`:

```sql
-- Allow users to update only their own inbox items
CREATE POLICY "inbox_items_owner_update" ON notification.inbox_items
FOR UPDATE
USING (
  recipient_id IN (
    SELECT id FROM notification.recipients
    WHERE recipient_actor_id IN (
      SELECT id FROM vc.actors
      WHERE profile_id = (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
      OR id IN (
        SELECT actor_id FROM vc.actor_owners WHERE user_id = auth.uid()
      )
    )
  )
);
```

This is the correct final enforcement layer.

---

## Q8: What is the safest change with lowest coupling?

**Three-layer fix, ordered by effort:**

### Layer 1 — VCSM App Layer (do now, no migration)

Add a `verifyNotificationRecipientOwnership(recipientId, actorId)` function to the VCSM notifications feature. Call it before `markRead`, `dismiss`, and `archive` in any controller that exposes these to UI.

Location: `apps/VCSM/src/features/notifications/inbox/controller/` or as a lib utility.

```js
// New: inbox/lib/verifyRecipientOwnership.js
export async function verifyRecipientOwnership(recipientId, actorId) {
  if (!recipientId || !actorId) return false
  const { data } = await supabase
    .schema('notification')
    .from('recipients')
    .select('id')
    .eq('id', recipientId)
    .eq('recipient_actor_id', actorId)
    .maybeSingle()
  return !!data
}
```

No engine change. No migration. VCSM-scoped. Can be added in a single PR.

**Current exposure is low but real:** today no UI calls `markRead`/`dismiss`/`archive` directly — `markSeen` is the only active mutation and it's safe (IDs derived from actor-scoped fetch). But the functions are exported from `@notifications`, and the diagnostics test already calls `markRead` incorrectly. Any future dismiss/archive UI addition is a security footgun without this guard.

### Layer 2 — DB RLS (schedule with next migration cycle)

Add `inbox_items_owner_update` RLS policy (see Q7 above). This is the defense-in-depth layer that makes the system correct even if the app layer has a bug. Schedule as a migration to be authored by Carnage and deployed by the owner.

### Layer 3 — Engine Evolution (defer until needed)

When a second consumer of `engines/notifications` needs ownership-scoped mutations, add optional `assertActorId` to `markRead`/`dismiss`/`archive`. Until then, keep the engine unchanged.

---

## Engine Architecture Verdict

`engines/notifications/` is well-designed and correctly neutral. Its public API surface:

| Export | Scoped By | Safe? |
|---|---|---|
| `publishEvent` | app layer (session guard in VCSM) | YES |
| `getInboxNotifications` | `recipientActorId` param | YES |
| `countUnread` | `recipientActorId` param | YES |
| `invalidateCountUnreadCache` | `actorId` param | YES |
| `markSeen` | `recipientIds[]` (no actor scope) | CONDITIONAL — safe only when IDs come from actor-scoped fetch |
| `markRead` | `recipientId` only | UNSAFE without caller guard |
| `dismiss` | `recipientId` only | UNSAFE without caller guard |
| `archive` | `recipientId` only | UNSAFE without caller guard |
| `evaluatePreference` | `recipientActorId` + `eventKey` | YES |
| `renderNotification` | event data | YES |
| `deliverToRecipient` | recipient row | YES |

The engine's `markRead`/`dismiss`/`archive` gap is not a bug — the engine is intentionally neutral and cannot know how the caller's session maps to actor ownership. This is the app's responsibility.

---

## Security Boundary Recommendation

```
┌─────────────────────────────────────────────────────────────────┐
│ VCSM App Layer (apps/VCSM/src/features/notifications/)          │
│                                                                   │
│  publishVcsmNotification → session guard ✓ + DB trigger ✓       │
│  getNotifications        → recipientActorId scoped read ✓       │
│  countUnread             → recipientActorId scoped ✓            │
│  markSeen (auto)         → IDs from actor-scoped fetch ✓        │
│  markRead / dismiss / archive → OWNERSHIP CHECK MISSING ✗       │
│                          → add verifyRecipientOwnership() here   │
├─────────────────────────────────────────────────────────────────┤
│ VCSM Runtime (@notifications → runtime/index.js)                 │
│                                                                   │
│  All mutations: .eq('recipient_id', recipientId) only           │
│  No actor join. Correct pattern for a neutral layer.            │
│  App layer above must enforce ownership before calling.          │
├─────────────────────────────────────────────────────────────────┤
│ DB Layer (notification.*)                                         │
│                                                                   │
│  notification.events    → DB BEFORE INSERT trigger ✓ (confirmed) │
│  notification.inbox_items → RLS status UNKNOWN (NOTI-SEC-001)   │
│                          → add owner UPDATE policy               │
└─────────────────────────────────────────────────────────────────┘
```

---

## VCSM: Change Now or Wait?

**Change now — before adding any dismiss/archive UI.**

Today: `markRead`, `dismiss`, `archive` have no UI surface in VCSM. The only active mutation is `markSeen` via `autoMarkSeen: true`, and that path is safe because IDs come from an actor-scoped inbox fetch.

The risk window opens the moment a "Dismiss", "Mark as read", or "Archive" button is added to the notification inbox UI. That button will supply a `recipientId` from the rendered notification, and any logged-in user who intercepts or fabricates a request can supply a different `recipientId`.

**The verifyRecipientOwnership guard costs one indexed DB lookup per mutation. It should be added before the UI exposes these actions.**

---

## Recommended Ticket Queue

### NOTI-SEC-001 (existing — update scope)
**Verify DB RLS on notification.inbox_items for UPDATE**
- Check if policy exists
- If present: document in SECURITY.md, close
- If absent: author migration (Carnage), add to migration queue

### NOTI-SEC-002 (new — VCSM app layer)
**Add verifyRecipientOwnership guard before markRead/dismiss/archive**
- Create `inbox/lib/verifyRecipientOwnership.js` in VCSM notifications
- Add guard in any controller that will expose markRead/dismiss/archive to UI
- Low risk: one indexed lookup, no engine change, no migration
- Gate: must be done before any dismiss/archive UI is added

### NOTI-ARCH-006 (new — engine, defer)
**Engine: add optional assertActorId to inbox state mutations**
- `markRead({ recipientId, assertActorId? })`
- `dismiss({ recipientId, assertActorId? })`
- `archive({ recipientId, assertActorId? })`
- Does a `recipients` lookup before the mutation if assertActorId is provided
- Priority: P3 — defer until a second engine consumer needs it

---

*Report written: ENGINE-SECURITY-BOUNDARY-REVIEW-001 — 2026-06-07*
