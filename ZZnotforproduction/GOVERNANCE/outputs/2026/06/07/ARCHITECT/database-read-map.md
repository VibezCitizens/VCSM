# ARCHITECT DATABASE READ MAP
Generated: 2026-06-07T08:11:08.925Z
Scanner Version: 1.1.0

---

## Write Surface Summary by Schema

| Schema | Write Surfaces | Operations |
|---|---|---|
| vc | 98 | insert, update, upsert, delete, rpc |
| learning | 70 | insert, update, upsert, delete |
| chat | 65 | insert, update, upsert, delete |
| notification | 20 | insert, update |
| answers | ~10 | insert, update |
| moderation | ~8 | rpc |
| other/unclassified | ~216 | mixed |

---

## Write Surface Summary by App

| App | Write Surfaces | Top Tables |
|---|---|---|
| VCSM | 290 | profiles, resources, posts, actor_onboarding_steps, actor_follows |
| engines | 106 | booking tables, chat tables, portfolio tables |
| wentrex | 33 | learning schema tables |
| Traffic | 58 | answers tables, questions tables |

---

## VCSM Write Surface by Feature

| Feature | Write Surfaces | Primary Tables |
|---|---|---|
| profiles | 28 | profiles, actor_follows, friend_ranks |
| vportDashboard | 24 | resources, portfolio items, ratings |
| settings | 16 | actor_onboarding_steps, privacy settings |
| post | 15 | posts, post_media |
| flyerBuilder | 14 | flyers, flyer_media |
| moderation | 12 | reports, moderation queue |
| auth | 9 | profiles, auth tables |
| notifications | 9 | notification.events |
| booking | 8 | booking tables (via engine:booking) |
| social | 8 | actor_follows, blocks |
| vport | 7 | vport tables |
| upload | 6 | media_assets |
| initiation | 4 | actor_onboarding_steps |
| public | 4 | public tables |
| unclassified (feature=null) | 111 | MIXED — scanner could not classify |

---

## RPC Surfaces by Schema

| Schema | RPC Count | Key Functions |
|---|---|---|
| vc | 30+ | create_actor_for_user, can_view_actor_signal, count_vport_subscribers, get_friend_ranks |
| moderation | 2+ | block_actor |
| notification | 5+ | create_event |
| learning | — | — |
| chat | — | — |

---

## Scanner Limitation — Execution Path Resolution

**CRITICAL FINDING FOR DOWNSTREAM COMMANDS:**

The scanner resolved 0 sourceRoutes and 0 controllers for all 290 VCSM write surfaces.
This is a structural limitation of the scanner's static analysis on a React SPA with client-side routing.

Implication: Write surfaces cannot be automatically chained to their source routes via scanner.
VENOM/ELEKTRA must perform manual source-to-sink tracing.

| Metric | Value | Status |
|---|---|---|
| VCSM write paths with sourceRoute | 0 / 290 | UNRESOLVED |
| VCSM write paths with controller | 5 / 290 | PARTIAL |
| VCSM RPC paths with sourceRoute | 0 / 49 | UNRESOLVED |
| VCSM edge function paths with sourceRoute | 0 / 34 | UNRESOLVED |
| Security paths with route resolved | 0 / 610 | UNRESOLVED |

---

## High-Priority Write Surfaces (Requiring Auth Verification)

| Surface | Table | Operation | Feature | Risk |
|---|---|---|---|---|
| profiles UPDATE | profiles | update | profiles | IDOR risk if actor ownership not checked |
| actor_follows UPSERT | actor_follows | upsert | profiles/social | Actor impersonation if session not bound |
| posts UPDATE/DELETE | posts | update/delete | post | Content ownership if not actor-bound |
| resources UPDATE | resources | update | vportDashboard | VPORT ownership if not checked |
| notification.create_event RPC | notification | rpc | notifications | Source actor injection risk |
| block_actor RPC | moderation | rpc | block/settings | Actor identity spoofing |
| create_actor_for_user RPC | vc | rpc | auth | Privilege escalation if unguarded |
