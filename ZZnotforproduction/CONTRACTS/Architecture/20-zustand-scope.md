# Zustand Scope Rule

> **Source Contract:** [ARCHITECTURE_GOVERNANCE_CONTRACT.md](../ARCHITECTURE_GOVERNANCE_CONTRACT.md)
> **Section:** Zustand Scope Rule

---

## Rule

Zustand is allowed only for UI-only ephemeral state.

---

## Allowed Zustand State

| State Type | Examples |
|---|---|
| Panel state | open/closed panels |
| Navigation state | active tab |
| Draft UI | form draft in progress |
| Modal state | which modal is open |
| Temporary selection | row selections, highlight state |

---

## Forbidden Zustand State

| State Type | Examples |
|---|---|
| Server data | any data fetched from DB or RPC |
| Ownership truth | current actor, actorId, owner flags |
| Permission truth | canEdit, isOwner, roleFlags |
| Profile data | user profile, vport profile |
| Booking data | booking records, availability |
| Notification inbox data | unread counts, notification list |
| Feed data | posts, feed items |

Server truth belongs in React Query or the database.

---

## Rationale

Zustand holding server data creates split ownership: React Query and Zustand both claim to know the truth, but only one reflects the database state. This causes stale reads, race conditions, and cache-invalidation bugs.

---

## Violation Level

| Condition | Level |
|---|---|
| Zustand store holding server data, ownership, or permission truth | HIGH |
