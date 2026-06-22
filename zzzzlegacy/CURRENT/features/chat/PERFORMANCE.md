# Chat Feature — Performance

**Source:** `2026-05-14_kraven_chat-badge-poll-performance.md`
**KRAVEN input:** LOKI LF-02 handoff — `readChatInboxUnreadRowsDAL` 30s polling frequency x concurrent session load

---

## Target Flow

```
Flow:              Chat badge bootstrap polling — readChatInboxUnreadRowsDAL
Application Scope: VCSM
Entry point:       useChatUnread() — bootstrap.selectors.js
Primary table:     chat.inbox_entries
Poll cadence:      30s (staleTime = refetchInterval = 30_000)
```

---

## Query Analysis

**Badge query:**
```sql
SELECT unread_count
FROM chat.inbox_entries
WHERE actor_id = $actorId
  AND archived = false
  AND archived_until_new = false
```

**Classification:** Point-read with filter on one identity column + two boolean columns. Low cardinality per actor (0–N open conversations). Read-only SELECT — no writes, no RPC.

---

## Index Status

**Status: UNVERIFIED — KF-01 OPEN**

No explicit `CREATE INDEX` DDL for `chat.inbox_entries` found in app-level migration files (`apps/VCSM/supabase/migrations/`). The `chat` schema DDL was produced by the chat engine migration system, not tracked in local app migrations.

Ideal index required:
```sql
CREATE INDEX idx_inbox_entries_actor_unread
  ON chat.inbox_entries (actor_id, archived, archived_until_new)
  WHERE archived = false AND archived_until_new = false;
```

**CARNAGE handoff required** to confirm whether a covering index exists on `(actor_id, archived, archived_until_new)`.

---

## Polling Cadence Analysis

- Poll fires immediately at mount, then every 30 seconds per authenticated session
- Dual invalidation path: mutation-triggered invalidation fires immediately on top of the 30s schedule (LOKI LF-03)
- Native comparison: iOS uses realtime + 20s fallback vs. PWA polling-only at 30s

---

## Open Findings

| Finding | Severity | Status |
|---|---|---|
| KF-01: Index coverage for badge query UNVERIFIED | UNKNOWN | OPEN — CARNAGE must confirm |
| LF-03: Dual invalidation (poll + mutation bust) cost unquantified | LOW | OPEN |
