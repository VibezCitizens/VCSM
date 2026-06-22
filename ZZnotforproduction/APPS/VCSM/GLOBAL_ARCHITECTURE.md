---
name: vcsm.global-architecture
description: Global architecture state rollup — built from feature CURRENT_STATUS.md and ARCHITECTURE.md sub-documents
metadata:
  type: global-architecture
  generated-by: DR. STRANGE
  ticket: TICKET-DRSTRANGE-GLOBAL-DOCS-V2-0001
  date: 2026-06-05
  source: Feature CURRENT_STATUS.md files (2026-06-04 ARCHITECT run)
---

# GLOBAL ARCHITECTURE — VCSM Platform

**Generated:** 2026-06-05
**Source:** Feature CURRENT_STATUS.md (all 37 features, ARCHITECT v1.1.0, last run 2026-06-04)
**Command:** DR. STRANGE — TICKET-DRSTRANGE-GLOBAL-DOCS-V2-0001

> This document consumes ARCHITECT sub-documents only. No source code was read.

---

## Architecture State Summary

| State | Count | Features |
|---|---|---|
| STABLE | 26 | actors, app, auth, block, chat, debug, explore, feed, hydration, identity, invite, join, legal, media, moderation, onboarding, portfolio, post, public, reviews, services, settings, shared, social, state, styles |
| EVOLVING | 8 | ads, booking, dashboard, notifications, professional, profiles, upload, vport |
| FLAGGED | 3 | ui, vgrid, void |

---

## Spaghetti Score Summary

| Score | Count | Features |
|---|---|---|
| CLEAN | 17 | actors, app, block, debug, identity, invite, join, legal, media, portfolio, public, reviews, state, styles, ui, vgrid, void |
| WATCH | 20 | ads, auth, booking, chat, dashboard, explore, feed, hydration, moderation, notifications, onboarding, post, professional, profiles, services, settings, shared, social, upload, vport |

---

## Independence Status Summary

| Status | Count | Features |
|---|---|---|
| INDEPENDENT | 4 | actors, services, styles, ui |
| MOSTLY INDEPENDENT | 28 | ads, app, auth, block, booking, dashboard, debug, explore, feed, identity, invite, join, legal, media, moderation, notifications, onboarding, portfolio, post, professional, public, reviews, settings, shared, social, state, upload, vport |
| DEPENDENT | 3 | chat, hydration, profiles |
| UNKNOWN | 1 | vgrid |

---

## Module Completeness Status

| Status | Count | Features |
|---|---|---|
| MOSTLY COMPLETE | 32 | (all except below) |
| INCOMPLETE | 2 | portfolio, reviews |
| FRAGMENTED | 3 | ui, vgrid, void |

---

## Feature Architecture Detail

| Feature | Arch State | Spaghetti | Independence | Module Status | Top Architecture Gap |
|---|---|---|---|---|---|
| actors | STABLE | CLEAN | INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md placeholder |
| ads | EVOLVING | WATCH | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md placeholder; actorId ownership gate absent |
| app | STABLE | CLEAN | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md placeholder; auth session flow undocumented |
| auth | STABLE | WATCH | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md placeholder; test coverage 1 file / 56 source |
| block | STABLE | CLEAN | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md placeholder |
| booking | EVOLVING | WATCH | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md ACTIVE; state machine governance gap; TICKET-BOOKING-RPC-001 open |
| chat | STABLE | WATCH | DEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md placeholder; no inbox folder semantics documented |
| dashboard | EVOLVING | WATCH | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md CLOSED (ACTIVE as of 2026-06-05); VEN-CARD-001 new THOR blocker |
| debug | STABLE | CLEAN | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md placeholder; LoginDebugPanel has no detected import site |
| explore | STABLE | WATCH | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md placeholder |
| feed | STABLE | WATCH | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md placeholder; visibility rules and pagination undocumented |
| hydration | STABLE | WATCH | DEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md placeholder; inline raw DB query against vport.profile_actor_access |
| identity | STABLE | CLEAN | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md ACTIVE; zero test coverage on auth-critical bootstrap |
| invite | STABLE | CLEAN | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md placeholder |
| join | STABLE | CLEAN | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md placeholder; QR and invite join flows undocumented |
| legal | STABLE | CLEAN | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md placeholder; legally sensitive consent flows undocumented |
| media | STABLE | CLEAN | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md placeholder; consumed by 6+ features |
| moderation | STABLE | WATCH | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md ACTIVE; CRITICAL security; zero test coverage |
| notifications | EVOLVING | WATCH | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md ACTIVE; 43-file cross-platform module; zero test coverage |
| onboarding | STABLE | WATCH | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md ACTIVE; CRITICAL security active; kind-branching documented |
| portfolio | STABLE | CLEAN | MOSTLY INDEPENDENT | INCOMPLETE | BEHAVIOR.md placeholder; consuming features lack authoritative reference |
| post | STABLE | WATCH | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md stub; 15 write surfaces, 18 controllers undocumented |
| professional | EVOLVING | WATCH | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md placeholder; professional role auth gate missing |
| profiles | EVOLVING | WATCH | DEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md ACTIVE; 374 files, 12 engines, CRITICAL security active |
| public | STABLE | CLEAN | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md placeholder; zero test coverage on anonymous lead path |
| reviews | STABLE | CLEAN | MOSTLY INDEPENDENT | INCOMPLETE | BEHAVIOR.md placeholder; engine setup undocumented |
| services | STABLE | WATCH | INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md ACTIVE; CRITICAL security active |
| settings | STABLE | WATCH | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md ACTIVE; deletion state machine documented; irreversible writes |
| shared | STABLE | WATCH | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md placeholder; most widely consumed module |
| social | STABLE | WATCH | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md ACTIVE; follow state machine documented |
| state | STABLE | CLEAN | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md ACTIVE; DELETED_ACCOUNT_SENTINEL and boot-time path documented |
| styles | STABLE | CLEAN | INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md placeholder; no token naming contract |
| ui | FLAGGED | CLEAN | INDEPENDENT | FRAGMENTED | BEHAVIOR.md placeholder; no adapter boundary; consumers import internal paths |
| upload | EVOLVING | WATCH | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md ACTIVE; three post modes documented |
| vgrid | FLAGGED | CLEAN | UNKNOWN | FRAGMENTED | BEHAVIOR.md placeholder; scaffold only; data model undefined |
| void | FLAGGED | CLEAN | INDEPENDENT | FRAGMENTED | BEHAVIOR.md placeholder; /void publicly accessible with no auth gate |
| vport | EVOLVING | WATCH | MOSTLY INDEPENDENT | MOSTLY COMPLETE | BEHAVIOR.md ACTIVE; security governance blocked |

---

## ARCHITECT Coverage

| Metric | Value |
|---|---|
| ARCHITECT run on all 37 features | YES |
| Scanner version | 1.1.0 |
| Last global run | 2026-06-04 |
| Dashboard additional run | 2026-06-05 |
| Module-level ARCHITECT coverage | PARTIAL (dashboard modules covered via WOLVERINE sprint) |

---

## Architecture Blockers

### Critical Architecture Gaps
1. **BEHAVIOR.md PLACEHOLDER across 24/37 features** — 13 features now have ACTIVE BEHAVIOR.md (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001: booking, identity, moderation, notifications, onboarding, profiles, services, settings, social, state, upload, vport + dashboard). All downstream governance (VENOM, LOKI, SENTRY, SPIDER-MAN) for the remaining 24 features is anchored to a behavior contract that does not yet exist.
2. **ui feature: FLAGGED + FRAGMENTED** — No adapter boundary; direct internal-path imports by consumers.
3. **vgrid feature: FLAGGED + UNKNOWN independence** — Scaffold only; no data model or engine dependency defined.
4. **void feature: FLAGGED + /void public without auth gate** — 18+ realm gating not designed.
5. **hydration: inline raw DB query** — vcsmActorHydrator.js bypasses DAL layer; inline query against vport.profile_actor_access.
6. **profiles: DEPENDENT, 374 files, 30 write surfaces** — Most complex feature with zero behavior contract.

### TICKET-BOOKING-RPC-001 (Open)
- booking feature: raw INSERT/UPDATE without DB state machine; no customer_actor_id injection protection at DB layer.

### Missing Architecture Docs
- Feature-level ARCHITECTURE.md files are present for all 37 features.
- No dedicated ARCHITECTURE.md at module level (except dashboard/modules/dashboard/ and dashboard/modules/leads/).

---

## Recommended Next Commands

| Priority | Feature | Command |
|---|---|---|
| P0 | booking | CARNAGE (migration/state machine), SPIDER-MAN (BEHAVIOR.md now ACTIVE) |
| P0 | profiles | SPIDER-MAN (BEHAVIOR.md now ACTIVE) |
| P0 | notifications | SPIDER-MAN (BEHAVIOR.md now ACTIVE) |
| P0 | auth | LOGAN (BEHAVIOR.md — still PLACEHOLDER) |
| P0 | identity | SPIDER-MAN (BEHAVIOR.md now ACTIVE), IRONMAN |
| P1 | void | CARNAGE (realm gate design), LOGAN (BEHAVIOR.md) |
| P1 | ui | IRONMAN (adapter boundary) |
| P1 | hydration | IRONMAN (DAL boundary), LOGAN (BEHAVIOR.md) |
