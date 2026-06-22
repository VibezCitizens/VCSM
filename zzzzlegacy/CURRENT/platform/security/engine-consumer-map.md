# ARCHITECT — Engine Consumer Map
Generated: 2026-05-09

---

## Engine Consumption by Application

### VCSM → Engines Consumed

| Engine | Usage Evidence |
|---|---|
| identity | engines/identity/src/controller/resolveAuthenticatedContext, switchActiveActor, logoutCleanup |
| chat | engines/chat/src/controller/* (full suite — inbox, conversation, messages, policies) |
| booking | engines/booking/src/controller/* (full suite — resources, availability, services, QR) |
| hydration | engines/hydration/src/controller/hydrateActor.controller.js |
| notifications | engines/notifications/src/controller/* (inbox, events, publish, unread) |
| portfolio | engines/portfolio/src/controller/* (items, media, tags) |
| reviews | engines/reviews/src/controller/* (submit, list, stats, dimensions) |
| media | engines/media/src/controller/uploadMedia.controller.js |
| i18n | engines/i18n/ (en/, es/) |

### WENTREX → Engines Consumed

| Engine | Usage Evidence |
|---|---|
| identity | apps/wentrex/src/features/identity/ (own DAL + controller wiring engine resolver pattern) |
| chat | apps/wentrex/src/features/communication/ adapters — wraps engine chat |

### TRAFFIC → Engines Consumed

| Engine | Status |
|---|---|
| identity | NOT CONSUMED — anon-only, no auth |
| chat | NOT CONSUMED |
| booking | NOT CONSUMED |
| hydration | NOT CONSUMED |
| notifications | NOT CONSUMED |
| portfolio | NOT CONSUMED |
| reviews | NOT CONSUMED |
| media | NOT CONSUMED |

TRAFFIC consumes NO engines. It reads exclusively from public Supabase views via its own data layer.

---

## Engines Present But Not Wired Into All Apps

| Engine | VCSM | WENTREX | TRAFFIC |
|---|---|---|---|
| feed | Present in engines/feed/ | No | No |
| i18n | Yes | Yes (own /i18n) | No |

### feed engine
Location: engines/feed/
Status: Present at engine root but appears minimal/experimental.
VCSM has its own feed feature at apps/VCSM/src/features/feed/ with its own DAL and controllers.
Risk: Feed engine may be dead or in-progress — not consumed by any app currently.

---

## Engine Isolation Check

All engines follow inward-only dependency direction.
No engine file imports from apps/VCSM/, apps/wentrex/, or apps/Traffic/.
Hydration engine is app-facing adapter only (no DB access of its own).
