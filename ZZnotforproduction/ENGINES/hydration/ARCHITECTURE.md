# ARCHITECTURE — engines/hydration

**Last ARCHITECT Run:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001
**Status:** COMPLETE — anomalies found
**Independence:** PARTIALLY INDEPENDENT

---

## Engine Purpose

Canonical actor summary cache and hydration pipeline. Single source of truth for actor display data (display name, username, photo, vport fields) across VCSM. Fetches via vc.get_actor_summaries RPC, normalizes, and caches in a Zustand store with 5-minute freshness tracking.

## Source Root

`/Users/vcsm/Desktop/VCSM/engines/hydration/`

## No CLAUDE.md

This engine has no CLAUDE.md — scope rules, schema ownership, and DI contract are undocumented. **Governance gap.**

## Public API Alias

`@hydration` — consumed by VCSM (10+ consumer files across features, state, and other engines via DI).

## Layer Structure

```
index.js              — primary export (9+ symbols)
src/
  config.js           — DI (supabaseClient + hydrators, no freeze guard)
  dal.js              — vc.get_actor_summaries RPC (single canonical read)
  extract.js          — actor ID extraction (20 field name patterns)
  normalize.js        — canonical normalization (user vs vport display)
  hydrate.js          — pipeline (extract → skip fresh → fetch → normalize → upsert)
  store.js            — Zustand actor store (5-min TTL, safe merge) [ANOMALY: React in engine]
  useActorSummary.js  — React useMemo hook [ANOMALY: React in engine]
  adapters/index.js   — VESTIGIAL: only 2 exports vs 9+ in main index.js
  controller/hydrateActor.controller.js — delegates to app hydrators (appKey+actorSource)
```

## DB Access

| Schema | Access | Method |
|--------|--------|--------|
| vc | READ (RPC only) | vc.get_actor_summaries(p_actor_ids UUID[]) |

No direct table queries. Single canonical endpoint.

## Cache Behavior

| Feature | Detail |
|---------|--------|
| Type | Zustand store (process-scoped singleton) |
| TTL | 5 minutes |
| Safe merge | Incoming null never overwrites existing non-null |
| Staleness | getMissingOrStale() gates all hydrate calls |

## Architecture Anomalies

| ID | Anomaly | Severity |
|----|---------|----------|
| ANOM-HYDRATE-001 | Zustand + React useMemo in engine (framework-specific) | MEDIUM |
| ANOM-HYDRATE-002 | No CLAUDE.md | MEDIUM |
| ANOM-HYDRATE-003 | adapters/index.js vestigial (2 exports vs 9+ in main index.js) | LOW |
| ANOM-HYDRATE-004 | console.warn in dal.js instead of throw | LOW |
| ANOM-HYDRATE-005 | Duplicate 5-min TTL constant in store.js and hydrate.js | LOW |
| ANOM-HYDRATE-006 | No VCSM setup.js found — DI wiring path unknown | MEDIUM |

## Known Gaps

- CLAUDE.md: MISSING
- BEHAVIOR.md: MISSING — Blue Team blocked
- SECURITY.md: MISSING — VENOM blocked
- Zero tests
- Adapter surface is vestigial (adapters/index.js)

## Full Report

`ZZnotforproduction/ENGINES/hydration/outputs/2026/06/05/ARCHITECT/engine.hydration.architecture.md`
