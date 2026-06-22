---
report: carnage_feed-dal-rls-delta
date: 2026-05-18
scope: VCSM — feed DAL RLS migration status delta
authority: GOVERNANCE_WRITABLE
triggered_by: CEREBRO 2026-05-18 — re-pass on vcsm.dal.feed.md
prior_carnage: zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-14_carnage_feed-dal-rls-verification.md
---

# CARNAGE MIGRATION DELTA — Feed DAL RLS Status (2026-05-18)

**Application Scope:** VCSM  
**Migration type:** RLS policy delta — verification that 2026-05-14 proposals have (or have not) been applied  
**Prior CARNAGE report:** `2026-05-14_carnage_feed-dal-rls-verification.md`  
**Delta window:** 2026-05-14 → 2026-05-18  
**Confidence:** MEDIUM — migration file scan; live schema not directly queryable in this pass

---

## Delta Purpose

The 2026-05-14 CARNAGE full report identified four tables with HIGH or UNCONFIRMED RLS risk and produced three migration proposals (P1/P2/P3) plus one verification query (P4). This delta report confirms whether any of those proposals have been applied in the four days since.

---

## Migration Scan Results (2026-05-14 → 2026-05-18)

Migration directory scanned: `apps/VCSM/supabase/migrations/`

**New migration files containing relevant table names since 2026-05-14:**

| Table | New migration found? | Notes |
|---|---|---|
| `moderation.actions` (P1) | NO | Zero new migration files reference this table |
| `vc.actor_onboarding_steps` (P2) | NO | Zero new migration files reference this table |
| `vc.actor_follows` SF-07 (P3) | NO | No policy drop or function creation found |
| `vc.post_reactions` (P4) | NO | No new verification or policy SQL found |

**Conclusion:** All four proposals from 2026-05-14 are outstanding. No RLS changes have been applied to any of the four tables in scope.

---

## Proposal Status Summary

| Proposal | Description | Status | Blocking |
|---|---|---|---|
| P1 — `moderation.actions` SELECT + INSERT policies | Enable RLS + actor_owners-scoped SELECT + INSERT | OUTSTANDING — not applied | YES — behavioral PII risk |
| P2 — `vc.actor_onboarding_steps` RLS + WITH CHECK | Enable RLS + ALL policy for UPSERT with actor_owners scope | OUTSTANDING — not applied | YES — write path unprotected |
| P3 — `vc.actor_follows` SF-07 | Drop `actor_follows_select_public_subscriber_count`; add `vc.get_follower_count()` SECURITY DEFINER; FORCE RLS | OUTSTANDING — not applied | YES — social graph enumeration confirmed |
| P4 — `vc.post_reactions` SELECT verification | Verification query only — confirm `USING (true)` for authenticated | OUTSTANDING — not confirmed | NO — unconfirmed but likely low risk |

---

## P3 Prerequisite — `subscriberCount.dal.js` Caller Audit

**Status:** NOT COMPLETED

Before dropping `actor_follows_select_public_subscriber_count`, all code that relies on the broad SELECT for counting followers must be migrated to use the `vc.get_follower_count(p_actor_id)` RPC.

The 2026-05-14 report identified `subscriberCount.dal.js` as the primary candidate. This caller audit has not been performed. Until it is complete, P3 cannot be safely applied.

**Prerequisite action:** Grep for all callers of `actor_follows_select_public_subscriber_count` or direct unbounded reads of `actor_follows` where the querying actor is NOT the authenticated user's own actor. Confirm migration to RPC before dropping policy.

---

## New Finding — FA1 Resolution (Cross-Reference, Not CARNAGE Scope)

The BLOCKING iOS stacking context violation (FA1) flagged in the 2026-05-14 CEREBRO pass has been resolved in source code. `FeedConfirmModal`, `PostActionsMenu`, `ReportModal`, `ShareModal`, and `Toast` are now rendered outside `<PullToRefresh>` as fragment siblings. This does not affect RLS scope but unblocks WinterSoldier handoff and THOR evaluation (which was gated on FA1).

---

## Updated Migration Priority

| Priority | Table | Action | Risk |
|---|---|---|---|
| P2 (apply first) | `vc.actor_onboarding_steps` | Enable RLS + ALL policy (actor_owners scope) | HIGH — write path accepts any client actor_id |
| P1 (apply second) | `moderation.actions` | Enable RLS + SELECT + INSERT policies (actor_owners scope) | HIGH — behavioral PII; hidden post list readable |
| P3 (apply third — after prereq) | `vc.actor_follows` | Complete subscriberCount.dal.js audit → drop policy → add function | HIGH — SF-07 social graph enumeration |
| P4 (verify only) | `vc.post_reactions` | Live schema query — confirm SELECT policy shape | LOW — likely safe |

P2 before P1 because `actor_onboarding_steps` has a write surface (UPSERT). P1 before P3 because P3 requires prerequisite work.

---

## Live Schema Inspection — MANDATORY FIRST STEP

Before applying any proposal, run these queries against the live Supabase schema:

```sql
-- Check all four tables
SELECT schemaname, tablename, rowsecurity, forcerls
FROM pg_tables
WHERE (schemaname = 'vc' AND tablename IN ('actor_onboarding_steps', 'post_reactions', 'actor_follows'))
   OR (schemaname = 'moderation' AND tablename = 'actions');

-- Check all existing policies on these tables
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE (schemaname = 'vc' AND tablename IN ('actor_onboarding_steps', 'post_reactions', 'actor_follows'))
   OR (schemaname = 'moderation' AND tablename = 'actions')
ORDER BY schemaname, tablename, cmd, policyname;
```

---

## CARNAGE Delta Status

**`moderation.actions`:** HIGH RISK — P1 OUTSTANDING  
**`vc.actor_onboarding_steps`:** HIGH RISK — P2 OUTSTANDING  
**`vc.actor_follows`:** HIGH RISK — SF-07 OUTSTANDING; P3 prerequisite not complete  
**`vc.post_reactions`:** UNCONFIRMED — P4 verification pending

**OVERALL DELTA STATUS: NO PROGRESS — all proposals outstanding**

All SQL proposals are unchanged from `2026-05-14_carnage_feed-dal-rls-verification.md`. Refer to that document for full SQL text.

---

## Required Handoffs

- **DB** — Run live schema inspection queries before any proposal is applied
- **Wolverine** — Plan and execute P2, P1, P3 in order; P3 requires subscriberCount.dal.js audit first
- **VENOM** — Re-verify after P1 and P2 are applied; confirm SF-07 closed after P3
- **THOR** — Gate production deploy on P1 + P2 applied and verified in staging
- **BLACKWIDOW** — Adversarial simulation of the three write/read attack surfaces (see 2026-05-18 feed-specific report)
