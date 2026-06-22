# FEATURE_MONITORING_MAP

**Ticket:** FEATURE-MONITORING-MAP-001
**Generated:** 2026-06-07
**Source of truth:** `apps/scanner/maps/feature-map.json` (scannerVersion 1.1.0, generated 2026-06-05)
**Adapter:** `apps/VCSM/src/services/monitoring/vcsmMonitoring.js`
**Audit basis:** IDENTITY-MONITORING-AUDIT-001 (identity fully instrumented — 14 call sites across 6 files)

---

## Scope and Exclusions

- **App scope:** VCSM only (`appId: "VCSM"`). Traffic and Wentrex excluded (separate products).
- **FROZEN (per CLAUDE.md):** `wanders`, `wanderex`, `vgrid` — excluded from all governance.
- **DEV-only skip:** `debug`, `ui` — no production paths to instrument.
- **Engine-boundary rule:** Engine files (`engines/identity/`, `engines/hydration/`, etc.) cannot import VCSM monitoring. Capture engine failures at VCSM call sites in the feature controller or hook that wraps the engine call.

---

## Priority Legend

| Priority | Criteria |
|---|---|
| P0 | Financial, identity-adjacent, access control, security enforcement |
| P1 | Mutation-heavy user features — content, social graph, settings, account ops |
| P2 | Acquisition/funnel, public-facing, read-heavy with DB access |
| P3 | Display-only, stubs, low-mutation utility |
| FROZEN | Governance exclusion per CLAUDE.md |
| DONE | Fully instrumented this sprint |
| SKIP | Dev-only or zero production paths |

---

## Best Placement Layer

The monitoring call sites go into the layer that owns the mutation or error boundary, not the leaf:

| Layer rule | When to use |
|---|---|
| `controller` | Feature has controllers — wrap DAL calls in try/catch, fire on failure |
| `hook` | Hook-heavy feature with async effects (e.g. realtime subscriptions, chat) |
| `adapter` | Cross-feature boundary errors; adapter is the public surface |
| `module` | Stub feature — only configuration or index modules; no controllers |

---

## Feature Map

| # | Feature | Path | Files | Controllers | DALs | Hooks | Tests | Priority | Best Layer | Status | Notes |
|---|---------|------|-------|------------|------|-------|-------|----------|-----------|--------|-------|
| 1 | identity | `features/identity` + `state/identity` | 9 | 2 | 2 | 1 | 0 | P0 | controller + hook | **DONE** | 14 call sites across 6 files (VCSM-MONITORING-INSTRUMENTATION-001) |
| 2 | booking | `features/booking` | 66 | 15 | 22 | 16 | 1 | **P0** | controller | OPEN | TICKET-BOOKING-RPC-001 open; highest mutation density; financial risk |
| 3 | auth | `features/auth` | 56 | 14 | 11 | 9 | 1 | **P0** | controller | OPEN | Session security, access control; already uses `monitoringClient` in hooks but no behavior_id taxonomy |
| 4 | dashboard | `features/dashboard` | 258 | 32 | 37 | 28 | 25 | **P0** | controller | OPEN | Largest feature; owner ops; security sprint (ELEK/VENOM) patched 20+ findings |
| 5 | profiles | `features/profiles` | 374 | 58 | 65 | 64 | 12 | **P0** | controller | OPEN | Largest overall; identity-adjacent; actor ownership enforced here |
| 6 | social | `features/social` | 44 | 10 | 7 | 11 | 3 | P1 | controller | OPEN | Follow/unfollow, block, like mutations; trust graph |
| 7 | settings | `features/settings` | 91 | 15 | 15 | 22 | 0 | P1 | controller | OPEN | Account mutations; privacy, profile, billing settings |
| 8 | post | `features/post` | 116 | 13 | 12 | 15 | 0 | P1 | controller | OPEN | Content creation; 13 adapters expose post surface to feeds |
| 9 | moderation | `features/moderation` | 35 | 7 | 7 | 5 | 0 | P1 | controller | OPEN | Trust/safety; 9 adapters; report and enforcement paths |
| 10 | chat | `features/chat` | 66 | 2 | 2 | 23 | 0 | P1 | hook | OPEN | Hook-heavy (23 hooks); realtime subscription failures surface in effects |
| 11 | block | `features/block` | 18 | 3 | 3 | 3 | 0 | P1 | controller | OPEN | Trust/safety; block/unblock mutations |
| 12 | vport | `features/vport` | 29 | 3 | 4 | 4 | 0 | P1 | controller | OPEN | Business account ops; vport creation, exchange |
| 13 | upload | `features/upload` | 38 | 3 | 8 | 4 | 0 | P1 | controller | OPEN | Storage ops; 8 DALs; media pipeline |
| 14 | notifications | `features/notifications` | 43 | 3 | 3 | 5 | 0 | P1 | hook | OPEN | System events; delivery failures; 21 screens |
| 15 | public | `features/public` | 64 | 6 | 11 | 9 | 0 | P2 | controller | OPEN | Public VPORT pages; read-heavy but 11 DALs |
| 16 | feed | `features/feed` | 46 | 4 | 15 | 8 | 0 | P2 | hook | OPEN | 15 DALs but read-heavy; subscription hooks surface errors |
| 17 | onboarding | `features/onboarding` | 16 | 3 | 4 | 2 | 0 | P2 | controller | OPEN | Acquisition funnel; onboarding completion mutations |
| 18 | join | `features/join` | 12 | 3 | 3 | 1 | 1 | P2 | controller | OPEN | Registration funnel; 3 controllers |
| 19 | actors | `features/actors` | 4 | 1 | 1 | 0 | 0 | P2 | controller | OPEN | Actor search; low mutation surface |
| 20 | legal | `features/legal` | 26 | 2 | 4 | 3 | 0 | P2 | controller | OPEN | Compliance; consent DALs |
| 21 | media | `features/media` | 9 | 2 | 3 | 0 | 0 | P2 | controller | OPEN | Storage operations; no hooks |
| 22 | explore | `features/explore` | 22 | 2 | 1 | 3 | 0 | P3 | hook | OPEN | Mostly read; low mutation risk |
| 23 | invite | `features/invite` | 6 | 1 | 1 | 1 | 0 | P3 | controller | OPEN | Low risk; 1 controller |
| 24 | ads | `features/ads` | 18 | 0 | 1 | 2 | 0 | P3 | hook | OPEN | Display-only; no controllers |
| 25 | void | `features/void` | 11 | 0 | 1 | 1 | 0 | P3 | hook | OPEN | 18+ realm; 1 DAL |
| 26 | portfolio | `features/portfolio` | 2 | 0 | 0 | 0 | 0 | P3 | adapter | OPEN | Stub; adapter + module only |
| 27 | reviews | `features/reviews` | 1 | 0 | 0 | 0 | 0 | P3 | module | OPEN | Stub; module only |
| 28 | hydration | `features/hydration` | 2 | 0 | 0 | 0 | 0 | P3 | module | OPEN | Engine wrapper; capture at call site in controller |
| 29 | wanders | `features/wanders` | 124 | 10 | 19 | 20 | 0 | — | — | **FROZEN** | Per CLAUDE.md governance freeze |
| 30 | wanderex | `features/wanderex` | 22 | 0 | 2 | 8 | 0 | — | — | **FROZEN** | Per CLAUDE.md governance freeze |
| 31 | vgrid | `features/vgrid` | 10 | 0 | 1 | 1 | 0 | — | — | **FROZEN** | Per CLAUDE.md governance freeze |
| 32 | debug | `features/debug` | 3 | 0 | 0 | 0 | 0 | — | — | **SKIP** | Dev-only |
| 33 | ui | `features/ui` | 1 | 0 | 0 | 0 | 0 | — | — | **SKIP** | Single display component |

---

## Recommended Next Feature: booking

**Ticket to open:** `VCSM-MONITORING-BOOKING-001`

### Why booking is first

1. **TICKET-BOOKING-RPC-001 is already open** — customer_actor_id injection and status overpermission confirmed on live DB. Monitoring call sites will surface these failure modes in production immediately.
2. **Highest mutation density after dashboard** — 15 controllers and 22 DALs. More state-machine transitions than any other feature.
3. **Financial risk** — Booking creates, modifies, and cancels appointments that translate to payment events. Silent failures here are the highest-cost bugs on the platform.
4. **Zero current monitoring** — All 15 controllers call DALs bare, with no monitoring capture on failure paths.
5. **Security sprint found findings here** — ELEK/VENOM pass patched booking validation issues. Monitoring confirms the patches hold in production.

### Booking instrumentation targets (preliminary)

Trace the full call path before editing each. Instrument at the controller level wrapping DAL calls:

| behavior_id | Layer | File | Condition |
|---|---|---|---|
| `behavior.booking.create_booking` | controller | `createBooking.controller.js` | DAL write failure |
| `behavior.booking.update_status` | controller | `updateBookingStatus.controller.js` | Invalid state transition or DAL failure |
| `behavior.booking.cancel_booking` | controller | `cancelBooking.controller.js` | DAL failure |
| `behavior.booking.actor_ownership` | controller | Any booking write controller | `actor_id !== viewer.actorId` |
| `behavior.booking.availability_read` | hook | `useAvailability*.js` | No slots returned for active VPORT |
| `behavior.booking.rate_validation` | controller | Rate/price controllers | Rate out of valid range |

Estimated call sites: 8–12 across 4–6 controller files.

---

## Instrumentation Coverage Progress

| Tier | Features | Instrumented | Coverage |
|------|---------|--------------|---------|
| P0 | 5 | 1 | 20% |
| P1 | 9 | 0 | 0% |
| P2 | 7 | 0 | 0% |
| P3 | 7 | 0 | 0% |
| FROZEN | 3 | — | — |
| SKIP | 2 | — | — |
| **Total (active)** | **28** | **1** | **3.6%** |

---

## behavior_id Namespace Convention

All VCSM monitoring events follow: `behavior.[feature].[operation]`

Examples already registered (identity):
```
behavior.identity.realm_resolution
behavior.identity.actor_row_read
behavior.identity.hydrate_actor
behavior.identity.engine_context
behavior.identity.public_identity
behavior.identity.commit_actor
behavior.identity.resolve_actor
behavior.identity.self_heal
behavior.identity.actor_link_read
behavior.identity.switch_actor
```

New features extend the namespace: `behavior.booking.*`, `behavior.auth.*`, etc.
Never reuse a behavior_id across features.

---

## Adapter Import Rule

All feature instrumentation imports from the VCSM adapter only:

```js
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';
// or
import { captureVcsmError, captureIdentityError } from '@/services/monitoring/vcsmMonitoring';
```

Never import `monitoringClient.js` directly from a feature file — that is the transport layer, not the feature API.
