# VCSM Feature Index

**Generated:** 2026-06-06  
**Source:** FEATURE_IMPORT_MAP.md, FEATURES_ARCHITECTURE_REVIEW.md  
**Features:** 34 (scanner) + 3 unlisted (shell, analytics, debug) = 37 total documented

---

## Index Table

| Feature | Files | Role | Status | Risk | Related Tickets |
|---|---|---|---|---|---|
| `auth` | 56 | Platform primitive — login, register, onboarding, reset, session | CLEAN | LOW | — |
| `identity` | 9 | Platform primitive — actor identity resolver | CLEAN | LOW | ARCH-STUBS-001 |
| `actors` | 4 | Thin adapter — actor data lookup | CLEAN | LOW | ARCH-STUBS-001 |
| `media` | 9 | Engine adapter — media upload/access | CLEAN | LOW | ARCH-ENGINESETUP-001 |
| `booking` | 66 | Booking state machine — create/read/update/cancel | CLEAN | MEDIUM | TICKET-BOOKING-RPC-001, ARCH-ENGINESETUP-001 |
| `chat` | 66 | Messaging — inbox, conversation, realtime | CLEAN | MEDIUM | — |
| `dashboard` | 258 | OVERSIZED — flyerBuilder + qrcode + vport dashboard | SPLIT_CANDIDATE + VIOLATIONS | CRITICAL | ARCH-DASH-001, ARCH-BIDIR-001 (Pairs 5,6,7), ARCH-BIDIR-PROFILES-001, ARCH-BIDIR-SETTINGS-001, ARCH-BIDIR-GASPRICES-001 |
| `feed` | 46 | Central feed — data pipeline, pagination, cache | CLEAN | LOW | — |
| `post` | 116 | Post card + comments + vport-type modules | SPLIT_CANDIDATE | MEDIUM | ARCH-POSTMOD-001 |
| `profiles` | 374 | GOD FEATURE — actor profiles + vport-type profile views | SPLIT_CANDIDATE + VIOLATIONS | CRITICAL | ARCH-VPORTPROFILE-001, ARCH-BIDIR-001 (Pairs 5,11,13,14) |
| `vport` | 29 | VPORT creation, preview, core data | CLEAN | LOW | — |
| `settings` | 91 | Account, privacy, profile, vports settings | VIOLATIONS | MEDIUM | ARCH-BIDIR-SETTINGS-001, ARCH-BIDIR-CSS-001 |
| `social` | 44 | Follow, subscribe, friend request, privacy signals | CLEAN | LOW | ARCH-BIDIR-SOCIAL-001 (add adapter) |
| `notifications` | 43 | Notification inbox, types, realtime runtime | CLEAN | LOW | ARCH-BIDIR-CSS-001 |
| `moderation` | 35 | Report, spam, hide — post/comment/chat | CLEAN | LOW | — |
| `public` | 64 | No-auth public surfaces — business card + menu | CLEAN | LOW | ARCH-BIDIR-MODEL-001 |
| `wanders` | 124 | Greeting card system — core + templates | SPLIT_CANDIDATE + VIOLATIONS | MEDIUM | — |
| `wanderex` | 22 | Accommodation booking flow | CLEAN | LOW | DOCS-ORG-001 (FROZEN) |
| `professional` | 33 | Professional profile types — nurse, enterprise, briefings | CLEAN | LOW | — |
| `upload` | 38 | Media upload pipeline | CLEAN | LOW | — |
| `legal` | 26 | Terms, privacy, how-to pages, consent gate | CLEAN | LOW | ARCH-ANALYTICS-001 |
| `explore` | 22 | Search and discovery UI | CLEAN | LOW | — |
| `ads` | 18 | Ad widgets and targeting | VIOLATIONS (CSS) | LOW | ARCH-BIDIR-CSS-001 |
| `block` | 18 | Block/unblock actor, block guard | CLEAN | LOW | — |
| `shell` | 6 | Bottom navigation bar module | CLEAN | LOW | TICKET-BOTTOMNAV-MODULE-REVIEW-001 |
| `initiation` | 16 | App init flow — post-auth, first launch | CLEAN | LOW | — |
| `invite` | 6 | Invite flow screens | CLEAN | LOW | — |
| `join` | 12 | Join/signup screens | CLEAN | LOW | — |
| `vgrid` | 10 | VGrid feature (FROZEN) | FROZEN | LOW | DOCS-ORG-001 |
| `void` | 11 | Void realm (FROZEN) | FROZEN | LOW | DOCS-ORG-001 |
| `analytics` | 1 | Funnel source tracking — targeted for deletion | DEPRECATED | LOW | ARCH-ANALYTICS-001 |
| `hydration` | 2 | Engine setup stub | STUB | LOW | ARCH-STUBS-001, ARCH-ENGINESETUP-001 |
| `portfolio` | 2 | Portfolio engine adapter stub | STUB | LOW | ARCH-STUBS-001, ARCH-ENGINESETUP-001 |
| `reviews` | 1 | Reviews engine setup stub | STUB | LOW | ARCH-STUBS-001, ARCH-ENGINESETUP-001 |
| `ui` | 1 | Single modern UI component stub | STUB | LOW | ARCH-STUBS-001 |
| `debug` | 3 | Dev-only debug panel | STUB | LOW | — |

---

## Status Counts

| Status | Count | Features |
|---|---|---|
| CLEAN | 18 | auth, identity, actors, media, booking, chat, feed, vport, social, notifications, moderation, public, wanderex, professional, upload, legal, explore, block, invite, join, shell, initiation |
| SPLIT_CANDIDATE | 4 | dashboard, post, profiles, wanders |
| VIOLATIONS | 4 | dashboard (23), profiles (18), settings (5), wanders (2) |
| SPLIT_CANDIDATE + VIOLATIONS | 3 | dashboard, profiles, wanders |
| FROZEN | 2 | vgrid, void |
| STUB | 5 | hydration, portfolio, reviews, ui, analytics |
| DEPRECATED | 1 | analytics |

---

## Inbound Dependency Rank (most-consumed features)

Features with high inbound counts are platform primitives. Changes to them require cross-feature impact analysis.

| Rank | Feature | Inbound Imports | Notes |
|---|---|---|---|
| 1 | `booking` | 68 | Most consumed — booking engine consumed widely |
| 2 | `profiles` | 51 | GOD feature, high coupling surface |
| 3 | `identity` | 41 | Platform primitive, consumed by ~41 files |
| 4 | `notifications` | 32 | Widely dispatched to |
| 5 | `moderation` | 23 | Every user-generated content surface |
| 6 | `social` | 20 | Follow/privacy consumed across features |
| 7 | `media` | 19 | Every media-capable feature |
| 8 | `upload` | 15 | Every upload-capable feature |
| 9 | `block` | 15 | Every actor-interaction surface |
| 10 | `feed` | 10 | Central feed pipeline |
| 11 | `post` | 19 | Post card consumed in feed, profiles, notifications |
| 12 | `public` | 4 | Public-facing surfaces (QR, menu) |

---

## Outbound Dependency Rank (features with most dependencies)

Features with high outbound counts have the most coupling. They are highest-risk to split or refactor.

| Rank | Feature | Outbound Imports | Notes |
|---|---|---|---|
| 1 | `profiles` | 110 | GOD feature — imports from 10+ other features |
| 2 | `dashboard` | 85 | Oversized — 3 subsystems each import widely |
| 3 | `chat` | 28 | Realtime + media + identity + moderation |
| 4 | `settings` | 30 | Touches most platform primitives |
| 5 | `notifications` | 10 | Inbox + social + booking integration |
| 6 | `social` | 17 | Follow + privacy + notifications |
| 7 | `post` | 22 | Post card + comments + notifications |
| 8 | `vport` | 11 | VPORT creation touches identity + settings |
| 9 | `feed` | 13 | Feed imports social + block + post |
| 10 | `join` | 8 | Join flow touches auth + identity + legal |

---

## Notes

- File counts from scanner (2026-06-05) may differ slightly from architecture review (2026-06-06) due to scanner run timing.
- `shell` and `debug` are not in scanner output because they have zero cross-feature imports detected. Confirmed present in `apps/VCSM/src/features/`.
- `analytics` appears in the features folder (1 file) and is targeted for deletion by ARCH-ANALYTICS-001. Its 3 import consumers are in `legal/`.
- Scanner shows "onboarding" as a feature (16 files). The actual folder name is `initiation`. These are treated as the same feature in contracts. Naming discrepancy should be resolved by ARCH-NAMING-001.
- `wanders` (124 files) meets split candidate threshold but its 2 violations are in `wanders→public` (controller + model direct access). Lower priority than dashboard/profiles splits.
