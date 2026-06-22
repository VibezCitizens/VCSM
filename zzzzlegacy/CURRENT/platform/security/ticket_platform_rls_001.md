---
name: ticket-platform-rls-001
description: TICKET-PLATFORM-RLS-001 — Audit and harden platform.media_assets {public} RLS policies to {authenticated}
metadata:
  type: project
---

**TICKET-PLATFORM-RLS-001** — platform.media_assets {public} policy role cleanup

**Why:** media_assets_learning_owner_update (live DB confirmed 2026-05-27) is on {public} role for UPDATE. Same drift class as TICKET-0008 (vport bookings/profiles cleanup). anon is blocked by auth.uid() inside the predicate but PostgREST does not reject unauthenticated callers before policy evaluation.

**Known affected policy:**
- media_assets_learning_owner_update — UPDATE — {public} → {authenticated}

**Verification SQL (run before migration):**
```sql
SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'platform'
  AND tablename = 'media_assets'
ORDER BY cmd, policyname;
```

**Goal:** Convert all authenticated-only media_assets policies from {public} to {authenticated} while preserving exact predicates. Do not change policies that are intentionally public (e.g., public read of ready/public media).

**How to apply:** Run verification SQL first to get full live policy inventory before writing migration. Pattern is DROP IF EXISTS + CREATE with identical body, role changed.

[[ticket-booking-rpc-001]]
