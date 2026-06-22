# ARCHITECT RLS ASSUMPTION MAP
Generated: 2026-06-07T08:11:08.925Z
Scanner Version: 1.1.0

---

## Overview

This map identifies write surfaces and their assumed RLS protection layer.
ARCHITECT can only detect static patterns — source verification required for all entries.

All entries are [SCANNER_LEAD] unless marked [SOURCE_VERIFIED].

---

## High-Priority Surfaces Requiring RLS Verification

| Surface | Schema | Table | Operation | Feature | App-Layer Auth Detected | Risk |
|---|---|---|---|---|---|---|
| profiles.update | vc | profiles | UPDATE | profiles | UNKNOWN | IDOR if no RLS + no app check |
| actor_follows.upsert | vc | actor_follows | UPSERT | profiles/social | UNKNOWN | Actor impersonation |
| posts.update | vc | posts | UPDATE | post | UNKNOWN | Content ownership |
| resources.update | vc | resources | UPDATE | vportDashboard | UNKNOWN | VPORT ownership |
| notification.create_event | notification | events | RPC | notifications | PARTIAL (ticket DONE 2026-06-07) | Source actor injection |
| block_actor | moderation | — | RPC | block/settings | UNKNOWN | Actor identity |
| create_actor_for_user | vc | — | RPC | auth | UNKNOWN | Privilege escalation |
| moderationAnswers (Traffic) | answers | answers | INSERT/UPDATE | Traffic:answers | UNKNOWN | Unauthenticated write |
| moderationQuestions (Traffic) | answers | questions | UPDATE | Traffic:answers | UNKNOWN | Unauthenticated write |

---

## Scanner Limitation

The scanner detected 0 sourceRoutes for VCSM write surfaces — route-to-write chains are not resolved.
RLS assumption verification must be performed via source inspection by VENOM/ELEKTRA.

---

## Known Patched Surfaces (from session history)

| Surface | Patch | Status | Ticket |
|---|---|---|---|
| notification.create_event | Session-bound source_actor_id + DB trigger | DONE 2026-06-07 | TICKET-ARCH-NOTI-SESSION-001 |
| createBooking.controller | customer_actor_id session-bound | DONE 2026-06-07 | TICKET-BOOKING-RPC-001 |
| reporterActorId in useReportFlow | Removed prop; now derived from useIdentity() | DONE 2026-06-07 | TICKET-MODERATION-REPORTER-CLEANUP-001 |

---

## Schemas with RLS Present (confirmed from DB snapshot)

| Schema | Tables | RLS Status |
|---|---|---|
| vc | actor_owners, profiles, posts, actor_follows | PRESENT (confirmed via prior audit) |
| notification | events | PRESENT (trigger added 2026-06-07) |
| learning | — | PRESENT (wentrex scope) |
| chat | — | PRESENT (engine:chat scope) |
| answers (Traffic) | answers, questions | REQUIRES_VERIFICATION |
