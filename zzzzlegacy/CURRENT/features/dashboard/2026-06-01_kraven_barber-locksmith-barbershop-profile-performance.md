# KRAVEN PERFORMANCE AUDIT

**Application Scope:** VCSM + ENGINE (hydration engine read)
**Date:** 2026-06-01
**Trigger:** ARCHITECT gate pass — barber, locksmith, barbershop modules cleared SENTRY. KRAVEN is the final non-blocking pass before SPIDER-MAN → THOR.
**LOKI Evidence Status:** MISSING — no runtime traces available. All findings classified as INFERRED or HYPOTHESIS.

---

## KRAVEN TARGET

| Module | Feature / Route | Entry Point | Reason |
|---|---|---|---|
| locksmith | `/vport/[slug]` — Locksmith Profile tab | `useLocksmithProfile(actorId, vportType)` | ARCHITECT flagged 3 parallel uncached DB reads per mount |
| barbershop | `/vport/[slug]` — Team tab | `VportBarberShopTeamView` → `useVportTeam(actorId)` + `useActorSummary` per card | ARCHITECT flagged potential N+1 via per-member actor summary fetches |
| barber | `/join/barbershop/[token]` — Join onboarding | `useJoinBarbershop(token)` | ARCHITECT flagged barberVport lookup on every join page mount |

---

## LOKI EVIDENCE STATUS: MISSING

No LOKI traces available for these modules. All performance assessments are INFERRED from static architecture analysis and code inspection. Confidence is MEDIUM across all findings. LOKI pass is recommended before THOR if these modules serve high-traffic routes in production.

---

## RUNTIME CRITICALITY REVIEW

| Area | Criticality | Reason |
|---|---|---|
| Locksmith profile tab load | Profile-critical | Fires on every public visitor viewing a locksmith VPORT — high read frequency |
| Barbershop team tab load | Profile-critical | Fires on every public visitor viewing a barbershop VPORT team view |
| Barber join flow | Background-only | One-shot per invite — infrequent, not on hot path |

---

## MODULE 1 — LOCKSMITH: `getLocksmithProfileController`

### RUNTIME EVIDENCE

**Observed call chain:**
```
useLocksmithProfile(actorId, vportType)
  → useEffect([actorId, isLocksmith])
  → getLocksmithProfileController(actorId)
  → Promise.all([
      dalListLocksmithServiceAreas(actorId),        // vport.locksmith_service_areas
      dalListLocksmithServiceDetails(actorId),       // vport.locksmith_service_details
      readVportServicesByActor({ actorId }),          // vport.service_catalog (or equivalent)
    ])
  → in-memory gap analysis (service_ids missing detail rows)
  → setServiceAreas / setServiceDetails / setGapServices
```

**Cache:** None — every `useLocksmithProfile` mount fires all 3 reads unconditionally.

**Trigger conditions:**
- Every public visitor landing on a locksmith VPORT profile page
- Every time the locksmith tab is activated (tab switch)
- Both owner and public surfaces share the same hook

### PERFORMANCE PATTERNS

- **Duplicate reads:** NONE — no repeated reads within a single call
- **N+1:** NONE — all reads are single scoped queries (`.eq('actor_id', actorId)`)
- **Serial async chains:** NONE — `Promise.all` correctly parallelizes the 3 reads
- **Controller fan-out:** MODERATE — 3 DB operations per profile view
- **Cache miss:** YES — no TTL cache; every mount hits DB even for repeat visitors to the same profile
- **Payload size risk:** LOW — service area + detail rows are small; unlikely to exceed 5–10 rows for a typical locksmith
- **Hydration cost:** LOW — no actor hydration in this flow

### QUERY AMPLIFICATION ANALYSIS

| Runtime Path | Primary Records | DB Operations | Amplification | Severity |
|---|---|---|---|---|
| Locksmith profile tab mount | 1 profile | 3 parallel reads | 3x | ELEVATED |

### WATERFALL DETECTION

| Caller Chain | Serial Operations | Estimated Delay | Optimization Opportunity |
|---|---|---|---|
| `getLocksmithProfileController` | 0 serial (all parallel via Promise.all) | max(t_areas, t_details, t_services) | TTL cache to eliminate repeat reads |

### CACHE EFFICIENCY REVIEW

| Cache Area | Status | Problem | Runtime Impact |
|---|---|---|---|
| `useLocksmithProfile` read results | INEFFECTIVE | No cache at any layer — DAL, controller, or hook | Every tab visit fires 3 DB reads |
| Service areas TTL | UNKNOWN | Data changes infrequently (owner only mutates); cache would be valid for 2–3 min | MEDIUM savings on repeat public views |

### CONTROLLER FAN-OUT REVIEW

| Controller | DAL Calls | Dependencies | Risk |
|---|---|---|---|
| `getLocksmithProfileController` | 3 (parallel) | 3 DB tables | MODERATE — acceptable for page load, problematic without cache on high-traffic route |

---

### KRAVEN PERFORMANCE FINDING K-BLK-001

- **Finding ID:** K-BLK-001
- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/hooks/locksmith/useLocksmithProfile.js` + `controller/locksmith/getLocksmithProfile.controller.js`
- **Application Scope:** VCSM
- **Runtime Criticality:** Profile-critical
- **Evidence Type:** INFERRED
- **Observation Source:** Static architecture analysis — no LOKI trace
- **Confidence:** MEDIUM
- **Current runtime behavior:** Every mount of `useLocksmithProfile` (including all public visitors) fires 3 parallel DB reads: service areas + service details + enabled services. No TTL cache at any layer. Repeat visits to the same locksmith profile page each generate 3 new DB queries.
- **Detected pattern:** Cache miss — uncached profile data that changes infrequently
- **Query Amplification:** 3x (ELEVATED)
- **Payload/Hydration Impact:** LOW — data payloads are small
- **Controller Fan-Out:** MODERATE (3 parallel reads)
- **Cache Efficiency:** INEFFECTIVE
- **Blast Radius:** Single feature — locksmith profile tab only
- **Estimated impact:** MEDIUM — 3 DB reads per public profile view accumulate at scale; most problematic if a locksmith profile link is shared or indexed
- **Root cause hypothesis:** No caching layer exists between the hook and the controller. Service area/detail data changes infrequently (owner CRUD only) but is fetched on every mount as if it could have changed.
- **Recommended optimization:** Add a 2-minute TTL cache in `useLocksmithProfile` keyed on `actorId`. Because the data is owner-mutated, invalidate on any successful write in `useLocksmithOwner`.

  ```js
  // In useLocksmithProfile.js — add TTL guard before controller call
  const CACHE_TTL_MS = 2 * 60 * 1000;
  const profileCache = new Map(); // actorId → { data, ts }

  // In load():
  const cached = profileCache.get(actorId);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    setServiceAreas(cached.data.serviceAreas);
    setServiceDetails(cached.data.serviceDetails);
    setGapServices(cached.data.gapServices);
    return;
  }
  const result = await getLocksmithProfileController(actorId);
  profileCache.set(actorId, { data: result, ts: Date.now() });
  ```

  Invalidate from `useLocksmithOwner` on successful write:
  ```js
  // After any successful mutation: profileCache.delete(actorId)
  ```

- **Optimization ROI:** HIGH — eliminates 3 DB reads per repeat profile visit; locksmith profiles are relatively static between owner updates
- **Architectural/Security Risk:** LOW — cache is per-actorId, scoped to public-safe data only (no PII, no session data). No ownership boundary concern.
- **Expected improvement:** Eliminates ~100% of repeat reads within 2-minute windows; first-visit cost unchanged
- **Recommended handoff:** ~~WOLVERINE (implementation — Cache Optimization Sprint)~~ **RESOLVED 2026-06-01 (WOLVERINE-K-BLK-001)**
- **Rationale:** Per DEFER-006 precedent (gas station cache) — this is the same pattern. Infrequently-mutated owner data fetched on every public mount should use a TTL cache.
- **Resolution:** `_profileCache` module-level Map with 2-min TTL added to `useLocksmithProfile.js`. Cache hit skips controller + 3 DB reads entirely. `invalidateLocksmithProfileCache(actorId)` called by `useLocksmithOwner.wrap` on every successful mutation before `onSuccess?.()`. `actorId` added to `wrap` dep array.

---

## MODULE 2 — BARBERSHOP: Team View Actor Summaries

### RUNTIME EVIDENCE

**Observed call chain:**
```
VportBarberShopTeamView({ profile, isOwner })
  → useVportTeam(actorId)                    // team hook
  │   → getTeamMembersController(actorId)    // 1 DB read: vport.resources WHERE resource_type='staff'
  │   → hydrateActorsByIds(actorIds)         // 1 BATCH RPC for ALL member actor IDs
  │       → store.getMissingOrStale(actorIds) // skip actors already fresh in store (5-min TTL)
  │       → getActorSummariesByIdsDAL({ actorIds }) // SINGLE RPC — batch fetch
  │       → store.upsertActors(normalized)   // global Zustand cache update
  └── returns { members, loading, error }
  
// Per BarberCard (rendered N times):
BarberCard({ member })
  → useActorSummary(member.member_actor_id)  // Zustand store selector — ZERO network calls
  → useMemo([actorId, actor])               // pure computation from cached data
```

**Cache:** Zustand global actor store — 5-minute TTL via `_hydratedAt` timestamp. On second team view load within 5 minutes, `store.getMissingOrStale(actorIds)` returns empty array → zero DB calls for actor summaries.

### PERFORMANCE PATTERNS

- **N+1:** **CONFIRMED NOT PRESENT** — `useActorSummary` is a pure store selector (Zustand `useActorStore`). It contains no `useEffect`, no `fetch`, no DAL import. It reads from the pre-fetched, pre-populated store.
- **Batch fetch:** CONFIRMED — `hydrateActorsByIds(actorIds)` issues one RPC for all actor IDs simultaneously.
- **Cache efficiency:** EFFECTIVE — 5-minute TTL in Zustand store with stale-skip
- **Duplicate reads:** NONE within a session load

### QUERY AMPLIFICATION ANALYSIS

| Runtime Path | Primary Records | DB Operations | Amplification | Severity |
|---|---|---|---|---|
| Team view initial load (N members) | 1 barbershop profile | 2 (resources + actor batch RPC) | 2x | HEALTHY |
| Team view reload within 5 min | 1 barbershop profile | 1 (resources only; actors from store) | 1x | HEALTHY |

### CACHE EFFICIENCY REVIEW

| Cache Area | Status | Problem | Runtime Impact |
|---|---|---|---|
| Actor summaries (hydration engine) | EFFECTIVE | 5-min TTL Zustand store; stale-skip on re-render | No issue |
| Team member list | PARTIAL | `useVportTeam` refetches `vport.resources` on every mount — no TTL | LOW impact; resources table is small |

---

### KRAVEN PERFORMANCE FINDING K-BLK-002

- **Finding ID:** K-BLK-002
- **Location:** `VportBarberShopTeamView.jsx` → `useVportTeam` → `hydrateActorsByIds`
- **Application Scope:** VCSM + ENGINE
- **Runtime Criticality:** Profile-critical
- **Evidence Type:** INFERRED
- **Confidence:** HIGH (architecture is unambiguous)
- **Current runtime behavior:** Team member list fetches `vport.resources` (1 query) then batch-hydrates all actor summaries (1 RPC). Per-card `useActorSummary` is a Zustand store selector — **no network calls per card**. Actor cache TTL is 5 minutes.
- **Detected pattern:** NONE — this is a CLEAN implementation.
- **Query Amplification:** 2x first load, 1x cached load — HEALTHY
- **Estimated impact:** NONE — no N+1 exists
- **Root cause hypothesis:** N/A — the hydration engine correctly pre-batches before render
- **Recommended optimization:** NONE required. Optional minor: add TTL cache to the `vport.resources` team member list itself (currently refetches on every mount). This is LOW priority since the resources table is small and team composition changes rarely.
- **Optimization ROI:** LOW (optional resources list cache)
- **Expected improvement:** No material improvement needed — system is already efficient

---

## MODULE 3 — BARBER: Join Flow

### RUNTIME EVIDENCE

**Observed call chain:**
```
useJoinBarbershop(token)
  → loadQrJoin(token)                           // 1 read: vport.resources WHERE id=token AND resource_type='staff'
    → if null: loadInviteForJoin(token)          // 1 read: vport.resources (invite path)
  → if identity && QR flow:
    findCurrentUserBarberVport({readCurrentAuthUserDAL})
      → readCurrentAuthUserDAL()                // Supabase auth.getUser()
      → findBarberVportForUserDAL(userId)       // 1 read: vport.profile_categories + profiles join
```

**Frequency:** One-shot per join attempt. Token is consumed on first successful accept.

### PERFORMANCE PATTERNS

- **N+1:** NONE
- **Serial reads:** Minor — `loadQrJoin` then `findCurrentUserBarberVport` are sequential, but both are fast point reads
- **Cache:** Not applicable — join tokens are consumed, caching would be incorrect

---

### KRAVEN PERFORMANCE FINDING K-BLK-003

- **Finding ID:** K-BLK-003
- **Location:** `apps/VCSM/src/features/join/hooks/useJoinBarbershop.js`
- **Application Scope:** VCSM
- **Runtime Criticality:** Background-only (infrequent one-shot flow)
- **Evidence Type:** INFERRED
- **Confidence:** HIGH
- **Current runtime behavior:** Join page mount fires 1–3 read operations sequentially. All reads are simple point queries.
- **Detected pattern:** NONE requiring action — join is one-shot and infrequent
- **Query Amplification:** 2–3x (HEALTHY for one-shot flow)
- **Estimated impact:** NONE — infrequent flow, latency is acceptable
- **Recommended optimization:** None. Join flow latency is acceptable for a one-time action.
- **Optimization ROI:** NONE

---

## KRAVEN PRIORITY MATRIX

| Priority | Finding | Runtime Criticality | Estimated Impact | ROI | Severity |
|---|---|---|---|---|---|
| 1 | K-BLK-001 — locksmith 3-read uncached profile load | Profile-critical | MEDIUM | HIGH | MEDIUM |
| 2 | K-BLK-002 — barbershop team N+1 investigation | Profile-critical | NONE (CLEAN) | N/A | NOT_A_RISK |
| 3 | K-BLK-003 — barber join flow | Background-only | NONE | NONE | LOW |

---

## PAYLOAD / HYDRATION REVIEW

| Runtime Area | Payload Risk | Hydration Risk | Cause |
|---|---|---|---|
| Locksmith service areas + details | LOW | LOW | Small row counts (locksmith typically <20 service areas, <10 details) |
| Barbershop team cards | LOW | NONE | Actor summaries pre-cached by hydration engine before render |
| Barber join resource | LOW | NONE | Single row point read |

---

## OPTIMIZATION SAFETY REVIEW

| Optimization | Architectural Risk | Security Risk | Requires SENTRY/VENOM |
|---|---|---|---|
| K-BLK-001: TTL cache in `useLocksmithProfile` | LOW — public-safe data; no session-sensitive fields | LOW — cache keyed on actorId, not session; service area/detail data is not PII | NO — cache does not bypass ownership; DAL-level ownership still enforced on writes |

---

## FINAL KRAVEN STATUS: LOW RISK — APPROVED FOR THOR EVALUATION

All three modules are performance-safe for release:

- **locksmith**: One medium-priority optimization (K-BLK-001 TTL cache). THOR may gate as CAUTION pending Cache Optimization Sprint, or clear with the understanding that uncached profile reads are acceptable at current scale.
- **barbershop**: CLEAN — no N+1, batch hydration confirmed, 5-minute store cache effective.
- **barber**: CLEAN — join flow is one-shot and efficient.

**Recommended sprint target for K-BLK-001:** Cache Optimization Sprint (DEFER-006 family — same pattern as gas station price cache).
