---
name: vcsm.global-security
description: Global security posture rollup — built from feature SECURITY.md sub-documents
metadata:
  type: global-security
  generated-by: DR. STRANGE
  ticket: TICKET-DRSTRANGE-GLOBAL-DOCS-V2-0001
  date: 2026-06-05
  source: Feature SECURITY.md files (all 37 features)
---

# GLOBAL SECURITY — VCSM Platform

**Generated:** 2026-06-05
**Source:** Feature SECURITY.md sub-documents only. No source code read directly.
**Command:** DR. STRANGE — TICKET-DRSTRANGE-GLOBAL-DOCS-V2-0001

> This document summarizes and links to sub-docs. Full findings are in feature SECURITY.md files and outputs/.

---

## Summary

| Metric | Count |
|---|---|
| Features with CRITICAL findings | 6 |
| Features with HIGH findings | 27 |
| Features with MEDIUM highest | 1 |
| Features with LOW highest | 1 |
| Features with THOR release blocker | 32 |
| Features THOR-clear | 5 |
| Features with VENOM run | 37 |
| Features with ELEKTRA run | 6 |
| Features with BLACKWIDOW run | 37 |
| Features with ELEKTRA never run | 31 |

---

## Security Severity by Feature

### CRITICAL Highest Open Severity (6 features)

| Feature | THOR Blocked | Key Findings | Sub-Doc |
|---|---|---|---|
| booking | YES | VEN-BOOKING-001 (unscoped UPDATE), VEN-BOOKING-002/003 (dead DAL), VEN-BOOKING-007 (customerActorId injection), ELEK chain | [features/booking/SECURITY.md](features/booking/SECURITY.md) |
| moderation | YES | VEN-MODERATION-001/002, BW-MOD-001/002/003 | [features/moderation/SECURITY.md](features/moderation/SECURITY.md) |
| notifications | YES | BW-NOTI-001 (CRITICAL), VEN-NOTIFICATIONS-002, BW-NOTI-004/010 | [features/notifications/SECURITY.md](features/notifications/SECURITY.md) |
| onboarding | YES | VEN-ONBOARDING-001/002, BW-ONBOARD-001/002/004 | [features/onboarding/SECURITY.md](features/onboarding/SECURITY.md) |
| profiles | YES | VEN-PROFILES-002, BW-PROF-001/002/003/004/010/011 | [features/profiles/SECURITY.md](features/profiles/SECURITY.md) |
| services | YES | VEN-SERVICES-001/002/003, BW-SERV-001/009/002/003 | [features/services/SECURITY.md](features/services/SECURITY.md) |

### HIGH Highest Open Severity (27 features)

| Feature | THOR Blocked | Key Findings | Sub-Doc |
|---|---|---|---|
| actors | YES | VEN-ACTORS-001, BW-ACTORS-001, ELEK HTML injection in Edge Function | [features/actors/SECURITY.md](features/actors/SECURITY.md) |
| ads | CLEAR (conditional) | VEN-ADS-001/002/004, BW-ADS-001/002 (conditional: before Supabase migration) | [features/ads/SECURITY.md](features/ads/SECURITY.md) |
| app | CLEAR (conditional) | BW-APP-001/007 (self-exploit or governance gap; no cross-user chain confirmed) | [features/app/SECURITY.md](features/app/SECURITY.md) |
| auth | YES | VEN-AUTH-001 (recovery session), ELEK-001 (dalGetAuthSession cached JWT) | [features/auth/SECURITY.md](features/auth/SECURITY.md) |
| block | YES | VEN-BLOCK-001, VEN-BLOCK-003, BW-BLOCK-001/002/003 | [features/block/SECURITY.md](features/block/SECURITY.md) |
| chat | YES | VEN-CHAT-001/002, BW-CHAT-002, ELEK-001 | [features/chat/SECURITY.md](features/chat/SECURITY.md) |
| dashboard | YES | VEN-CARD-001 (uploadFlyerImageCtrl no ownership check) — scope narrowed from VEN-SHELL-002 | [features/dashboard/SECURITY.md](features/dashboard/SECURITY.md) |
| debug | YES | VEN-DEBUG-001/002 | [features/debug/SECURITY.md](features/debug/SECURITY.md) |
| explore | YES | VEN-EXPLORE-002, BW-EXPLORE-005/006 | [features/explore/SECURITY.md](features/explore/SECURITY.md) |
| feed | YES | BW-FEED-008 | [features/feed/SECURITY.md](features/feed/SECURITY.md) |
| hydration | YES | VEN-HYDRATION-003/007, BW-HYDR-003/004 | [features/hydration/SECURITY.md](features/hydration/SECURITY.md) |
| identity | YES | VEN-IDENTITY-001/002, BW-IDENT-001/002/006/009 | [features/identity/SECURITY.md](features/identity/SECURITY.md) |
| invite | YES | VEN-INVITE-001, BW-INVITE-002/004/005/006 | [features/invite/SECURITY.md](features/invite/SECURITY.md) |
| legal | YES | VEN-LEGAL-001, BW-LEGAL-001/002 | [features/legal/SECURITY.md](features/legal/SECURITY.md) |
| media | YES | VEN-MEDIA-003, BW-MEDIA-001/002/007 | [features/media/SECURITY.md](features/media/SECURITY.md) |
| portfolio | YES | HIGH findings (SECURITY.md present) | [features/portfolio/SECURITY.md](features/portfolio/SECURITY.md) |
| post | YES | VEN-POST-001/002/003, BW-POST-001/004/005/010 | [features/post/SECURITY.md](features/post/SECURITY.md) |
| professional | YES | VEN-PROFESSIONAL-002/003, BW-PROF-002/003/008 | [features/professional/SECURITY.md](features/professional/SECURITY.md) |
| public | YES | VEN-PUBLIC-001/006, BW-PUBLIC-007 | [features/public/SECURITY.md](features/public/SECURITY.md) |
| reviews | YES | VEN-REVIEWS-001/002, BW-REVIEWS-001/002 | [features/reviews/SECURITY.md](features/reviews/SECURITY.md) |
| settings | YES | BW-SETTINGS-001/006/012 | [features/settings/SECURITY.md](features/settings/SECURITY.md) |
| social | YES | VEN-SOCIAL-001/002/003, BW-SOCIAL-001/005/006 | [features/social/SECURITY.md](features/social/SECURITY.md) |
| state | YES | VEN-STATE-004/007, BW-STATE-001/002 | [features/state/SECURITY.md](features/state/SECURITY.md) |
| styles | YES | VEN-STYLES-001, BW-STYLES-001 | [features/styles/SECURITY.md](features/styles/SECURITY.md) |
| upload | YES | VEN-UPLOAD-001/004/005/007, BW-UPLOAD-001/005 | [features/upload/SECURITY.md](features/upload/SECURITY.md) |
| vgrid | YES | BW-VGRID-001/003/005; not releasable in any state | [features/vgrid/SECURITY.md](features/vgrid/SECURITY.md) |
| void | YES | VEN-VOID-001, BW-VOID-001/002/005; missing realm gate | [features/void/SECURITY.md](features/void/SECURITY.md) |
| vport | YES | BW-VPORT-001/002 (conditional: DB RLS UPDATE policy) | [features/vport/SECURITY.md](features/vport/SECURITY.md) |

### MEDIUM / LOW Highest Open Severity

| Feature | Highest | THOR | Notes |
|---|---|---|---|
| join | MEDIUM | CLEAR | No THOR blocker; only MEDIUM-level findings |
| shared | HIGH | CLEAR | HIGH findings present but not THOR-blocking |
| ui | LOW | CLEAR | Lowest security risk; no THOR blocker |

---

## Scanner Coverage

### VENOM Coverage
| Status | Count | Notes |
|---|---|---|
| Run | 37 / 37 | All features covered (2026-06-04 or 2026-06-05) |
| Latest run | dashboard (2026-06-05) | Phase 1b WOLVERINE targeted re-run |

### BLACKWIDOW Coverage
| Status | Count | Notes |
|---|---|---|
| Run | 37 / 37 | All features covered (2026-06-04 or 2026-06-05) |
| Latest run | dashboard (2026-06-05) | WOLVERINE sprint |

### ELEKTRA Coverage
| Status | Count | Notes |
|---|---|---|
| Run | 6 / 37 | actors, app, auth, booking, chat, dashboard |
| NEVER run | 31 / 37 | 84% of features have no ELEKTRA chain-trace coverage |

Features with ELEKTRA never run (priority order):
- CRITICAL: moderation, notifications, onboarding, profiles, services
- HIGH: ads, block, debug, explore, feed, hydration, identity, invite, legal, media, portfolio, post, professional, public, reviews, settings, social, state, styles, upload, vgrid, void, vport
- MEDIUM: join
- LOW: ui, shared

---

## THOR Release Blockers Summary

32/37 features have active THOR release blockers.

**CLEAR (5 features):**
| Feature | Notes |
|---|---|
| ads | Conditionally clear — becomes YES before Supabase migration |
| app | Conditionally clear — BW findings are self-exploit or governance gaps |
| join | No THOR blocker confirmed |
| shared | No THOR blocker confirmed |
| ui | No THOR blocker confirmed |

---

## Open Tickets Affecting Security

| Ticket | Feature | Status | Impact |
|---|---|---|---|
| TICKET-BOOKING-RPC-001 | booking | OPEN | Raw INSERT/UPDATE; customer_actor_id injection; CRITICAL THOR blocker |
| TICKET-PLATFORM-RLS-001 | platform | OPEN | media_assets {public} policy; HIGH governance gap |

---

## ELEKTRA Priority Queue

Features requiring ELEKTRA chain-trace (by severity):

| Priority | Feature | Rationale |
|---|---|---|
| P0 | moderation | CRITICAL findings; no ELEKTRA trace yet |
| P0 | notifications | CRITICAL; cross-platform; no trace |
| P0 | onboarding | CRITICAL; kind-branching; no trace |
| P0 | profiles | CRITICAL; 30 write surfaces; no trace |
| P0 | services | CRITICAL; integration gap; no trace |
| P1 | identity | HIGH; auth-critical bootstrap; no trace |
| P1 | social | HIGH; follow state machine; no trace |
| P1 | state | HIGH; boot-time path; no trace |
| P1 | settings | HIGH; irreversible writes; no trace |
| P1 | upload | HIGH; no trace |
