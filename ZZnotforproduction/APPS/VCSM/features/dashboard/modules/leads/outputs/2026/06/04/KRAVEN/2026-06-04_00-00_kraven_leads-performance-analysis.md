# KRAVEN PERFORMANCE ANALYSIS — leads

**Date:** 2026-06-04
**Scope:** VCSM
**Reviewer:** KRAVEN
**LOKI Evidence Status:** PRESENT — full trace from `outputs/2026/06/04/Loki/2026-06-04_00-00_loki_leads-runtime-trace.md`
**Findings Summary:** 2 HIGH | 2 MEDIUM | 1 LOW | 1 INFO
**LOKI Signals Consumed:** LOKI-LEADS-001, -002, -003, -004 (performance) | -005, -006, -007, -008 (observability — routed, not performance findings)

---

## KRAVEN TARGET

```
Feature / Route: leads — dashboard owner inbox + badge count polling
Application Scope: VCSM
Entry point: /actor/:actorId/dashboard/leads → VportDashboardLeadsFinalScreen → VportDashboardLeadsView
Reason for analysis: LOKI-LEADS-001 through -004 all routed to KRAVEN
LOKI status at handoff: WATCH
```

---

## Runtime Evidence

```
RUNTIME EVIDENCE (from LOKI trace — OBSERVED / INFERRED)

Observed controllers:
  assertActorOwnsVportActorController (runs on EVERY ownership check — 2–3 DB reads each call)
  checkVportOwnershipController (runs on screen mount + every window focus/visibility event)
  listVportLeadsController (5 DB reads on initial call)
  countNewVportLeadsController (4–5 DB reads on initial call)
  fastCountNewVportLeadsController (2–4 DB reads on every 60s poll tick)
  markVportLeadContactedController (4–5 DB reads per action)
  deleteVportLeadController (4–5 DB reads per action)

Observed DAL calls (initial page load — user→vport case):
  getActorByIdDAL(requestActorId)   × 2  — once from useVportOwnership, once from listVportLeadsController
  readActorOwnerLinkByActorAndUserProfileDAL × 2  — same duplication
  getActorByIdDAL(targetActorId)    × 2  — same duplication
  readVportProfileByActorIdDAL      × 2  — once for list, once for count
  readVportBusinessCardLeadsByProfileDAL × 1
  readNewLeadsCountByProfileDAL     × 1
  Total: 10 DB calls, 8 unique table reads

Observed tables:
  vc.actors (SELECT by id) — 4 reads per page load (2 duplicated fingerprints × 2 callers)
  vc.actor_owners (SELECT by actor_id+user_id) — 2 reads per page load (1 duplicated fingerprint × 2 callers)
  vport.profiles (SELECT by actor_id) — 2 reads per page load (1 per controller chain)
  vport.business_card_leads — 2 reads per page load (1 list + 1 count)

Duplicate read signals:
  LOKI-LEADS-001: vc.actors × 2 (requestActorId), vc.actors × 2 (targetActorId), vc.actor_owners × 2
                  3 query fingerprints duplicated → ~120ms wasted per page load
  LOKI-LEADS-002: vport.profiles re-fetched on every mutation action
  LOKI-LEADS-003: assertActorOwnsVportActorController fires on every 60s poll tick
  LOKI-LEADS-004: checkVportOwnershipController fires on every window focus event (no debounce)

Timing observations (INFERRED):
  Total page load: ~380–450ms estimated
  Controller orchestration chain: ~250–320ms (WARN — at edge of 300ms budget)
  Duplicate ownership reads contribution: ~120ms (3 extra DB reads × ~40ms each)
  Poll tick: ~110–160ms per tick (WARN — count budget target is 100ms)
  Single DB read: ~40–80ms (within budget)

Only cache that exists: profileIdRef in useVportNewLeadsCount (polls only)
Everything else: uncached — every mount, every action, every poll hits DB cold
```

---

## Query Amplification Analysis

```
QUERY AMPLIFICATION ANALYSIS

| Runtime Path | Primary Records | DB Operations | Amplification | Severity |
|---|---:|---:|---:|---|
| Page load — initial list (N=1 lead) | 1 lead | 8 | 8.0 | HIGH |
| Page load — initial list (N=5 leads) | 5 leads | 8 | 1.6 | HEALTHY |
| Page load — initial list (N=20 leads) | 20 leads | 8 | 0.4 | HEALTHY |
| Page load — zero leads owned | 0 leads | 8 | ∞ (8 reads, no data) | HIGH |
| 60s poll tick — count | 1 integer | 2–4 | 2–4 | SEVERE |
| Mark-contacted action | 1 row updated | 4–5 | 4–5 | SEVERE |
| Delete action | 1 row deleted | 4–5 | 4–5 | SEVERE |
| Window focus re-check | 0 (ownership bool) | 1–3 | ∞ | SEVERE |

Key observation: The amplification for SINGLE-RECORD operations (poll count, mark, delete, focus) is
SEVERE (2–5 DB reads per 1 record), primarily because of assertActorOwnsVportActorController running
2–3 DB reads on every call. The overhead is a fixed cost independent of lead count.
```

---

## Waterfall Detection

```
WATERFALL DETECTION

| Caller Chain | Serial Operations | Estimated Delay | Optimization Opportunity |
|---|---:|---:|---|
| Screen mount → useVportOwnership → assertActorOwnsVportActor (3 reads) → isOwner=true → view renders → useVportLeads → assertActorOwnsVportActor AGAIN (3 reads) → resolveProfileId → readLeads | 8 serial DB reads | ~320–380ms | HIGH — first 3 reads are fully duplicated |
| useVportLeads or useVportNewLeadsCount → assertActorOwnsVportActor (3 reads) → resolveProfileId (1 read) → DAL (1 read) | 5 serial DB reads | ~200–240ms | MEDIUM — reads are sequentially dependent but the ownership check could be cached |
| pollRefresh → assertActorOwnsVportActor (2–3 reads) → readCountDAL (1 read) | 3–4 serial DB reads per 60s tick | ~110–160ms | HIGH — ownership check is 2–3 reads per tick just to count |
| window:focus → checkVportOwnershipController → assertActorOwnsVportActor (1–3 reads) | 1–3 reads per focus event | ~40–120ms | MEDIUM — needs debounce; re-check is correct in intent |
| markVportLeadContactedController: assertActorOwnsVportActor (2–3 reads) → resolveProfileId (1 read) → DAL UPDATE | 4–5 serial DB reads | ~160–200ms | MEDIUM — profileId cache would save 1 read |
| deleteVportLeadController: assertActorOwnsVportActor (2–3 reads) → resolveProfileId (1 read) → DAL DELETE | 4–5 serial DB reads | ~160–200ms | MEDIUM — same as mark |

STRUCTURAL NOTE: All serial dependencies are justified by security constraints except the page-load
duplication (KRA-LEADS-001). The controller chain cannot be parallelized because:
  assertActorOwnsVportActor must precede resolveProfileId (security gate first)
  resolveProfileId must precede the data DAL (profileId needed as query filter)
The ONLY pure waste is the screen-gate repeating what the controller will immediately repeat.
```

---

## Cache Efficiency Review

```
CACHE EFFICIENCY REVIEW

| Cache Area | Status | Problem | Runtime Impact |
|---|---|---|---|
| Ownership assertion result (screen→controller) | BYPASSED | Screen resolves ownership; controller independently re-asserts; result not shared | 120ms wasted per page load |
| vport.profiles profileId — list/count operations | BYPASSED | resolveProfileId called fresh in each controller invocation; no hook-level cache between list and mutations | 40ms per mark/delete action |
| vport.profiles profileId — poll (fast count) | EFFECTIVE | profileIdRef in useVportNewLeadsCount correctly caches resolved ID for poll reuse | Saves ~40ms per poll tick (already optimized) |
| Ownership result — poll tick | BYPASSED | assertActorOwnsVportActorController runs fresh 2–3 DB reads per 60s tick with no TTL or session cache | 80–120ms of the ~110–160ms poll budget is ownership overhead |
| Window focus ownership re-check | BYPASSED | No debounce, no minimum interval, no last-checked ref | DB storm risk on rapid tab-switching |
| Leads list data | BYPASS | Full re-fetch on every hook mount; no session-level caching | Every navigation to leads = full 8-read chain |
| Actor identity | EFFECTIVE | useIdentity context is correctly session-cached | No DB calls for identity resolution |

Efficiency Verdict: ONE effective cache in the entire module (profileIdRef in useVportNewLeadsCount).
Everything else is cold. This is by design for the ownership gate (security intentionality is correct)
but the poll and focus re-checks represent real DB cost that could be reduced without security tradeoff.
```

---

## Runtime Criticality Review

```
RUNTIME CRITICALITY REVIEW

| Area | Criticality | Reason |
|---|---|---|
| Leads page load | Background-only (not feed-critical) | Not on the critical user path; accessed on demand |
| Badge count poll (60s) | Notification-critical | VportLeadsChip is rendered globally on all dashboard routes; poll runs for every VPORT owner with any tab open |
| Mark-contacted | Background-only | Owner-driven action; latency is tolerable |
| Delete action | Background-only | Owner-driven action; latency is tolerable |
| Window focus re-check | Identity-critical | Ownership revocation detection; correctness-critical even if latency isn't |

SCALE CONCERN — Badge Poll:
  The 60s poll runs for EVERY authenticated VPORT owner in the platform, not just those on the leads page.
  VportLeadsChip is in the global layout (RootLayout / BottomNavBar).
  Implication: even VPORT owners who have never opened the leads page are generating 2–4 DB reads
  every 60 seconds — as long as they are logged in and the app is open.

  At scale:
    100 concurrent VPORT owners → 200–400 DB reads/minute just for lead count ownership assertions
    1,000 concurrent VPORT owners → 2,000–4,000 DB reads/minute
  This is the highest-priority performance concern in the module by DB cost at scale.
```

---

## Payload / Hydration Review

```
PAYLOAD / HYDRATION REVIEW

| Runtime Area | Payload Risk | Hydration Risk | Cause |
|---|---|---|---|
| Lead list (up to 150 leads) | MODERATE | LOW | 9 columns × up to 150 rows; PII fields included (name, phone, email, message) in payload to client. normalizeVportLead runs for each row. |
| Lead count badge | NONE | NONE | Single integer |
| Mark-contacted response | LOW | NONE | Returns single normalized lead object |
| Lead model — profileId in domain object | LOW | LOW | Raw UUID unnecessary in domain object (ELEK-005) |

Payload note: The 150-lead inbox is scoped to the VPORT owner only, so there is no cross-actor
payload risk. However, 150 × 9 columns of PII data is the maximum payload per page load.
In practice, most VPORT owners will have far fewer leads.
```

---

## Controller Fan-Out Review

```
CONTROLLER FAN-OUT REVIEW

| Controller | DB Reads (non-self) | DB Reads (self-shortcut) | Dependencies | Risk |
|---|---:|---:|---:|---|
| listVportLeadsController | 5 | 3 | assertActorOwnsVportActor + resolveProfileId + readLeadsDAL | MODERATE |
| countNewVportLeadsController | 5 | 3 | assertActorOwnsVportActor + resolveProfileId + countDAL | MODERATE |
| fastCountNewVportLeadsController | 3–4 | 2 | assertActorOwnsVportActor + countDAL | MODERATE — runs every 60s |
| markVportLeadContactedController | 4–5 | 3 | assertActorOwnsVportActor + resolveProfileId + DAL UPDATE | MODERATE |
| deleteVportLeadController | 4–5 | 3 | assertActorOwnsVportActor + resolveProfileId + DAL DELETE | MODERATE |
| assertActorOwnsVportActorController | 2–3 | 1 | getActorByIdDAL (×1–2) + readActorOwnerLinkDAL (×0–1) | HIGH (called by all 5 above) |

NOTE: assertActorOwnsVportActorController is the universal multiplier. It accounts for 40–60% of
all DB reads in the leads module across every operation. Any optimization to it has platform-wide
impact (9 call sites across dashboard controllers).
```

---

## KRAVEN Performance Findings

---

```
KRAVEN PERFORMANCE FINDING
- Finding ID:          KRA-LEADS-001
- Location:            VportDashboardLeadsFinalScreen.jsx (useVportOwnership) +
                       vportLeads.controller.js (listVportLeadsController)
- Application Scope:   VCSM
- Runtime Criticality: Notification-critical (VportLeadsChip uses the same hook globally)
                       + page-load contribution to all leads page navigations
- Evidence Type:       OBSERVED (LOKI-LEADS-001 — source-confirmed duplicate fingerprints)
- Observation Source:  LOKI trace — 3 duplicated query fingerprints on every page load
- Confidence:          HIGH

- Current runtime behavior:
    On every navigation to /actor/:actorId/dashboard/leads, the following happens:
    (1) VportDashboardLeadsFinalScreen mounts → useVportOwnership fires → checkVportOwnershipController
        → assertActorOwnsVportActorController: reads vc.actors (requestActorId), vc.actor_owners,
          vc.actors (targetActorId) — total 3 DB reads
    (2) isOwner=true → VportDashboardLeadsView renders → useVportLeads fires → listVportLeadsController
        → assertActorOwnsVportActorController: reads the SAME vc.actors (requestActorId), SAME
          vc.actor_owners, SAME vc.actors (targetActorId) — 3 IDENTICAL DB reads
    The screen gate result is never passed to the controller. The controller re-verifies cold.

- Detected pattern:     Duplicate reads — 3 redundant DB reads per page load
- Query Amplification:  +3 unnecessary reads (same 3 queries run twice in sequence)
- Payload/Hydration:    N/A
- Controller Fan-Out:   Double assertActorOwnsVportActorController call chain
- Cache Efficiency:     BYPASSED — screen gate result discarded before controller runs
- Blast Radius:         Single feature — all leads page loads for all VPORT owners
- Estimated impact:     ~120ms overhead on every leads page navigation
                        At 1,000 page loads/day: 120,000ms = 2 minutes of DB time wasted daily just
                        on duplicated ownership reads for one feature

- Root cause hypothesis:
    The screen gate (useVportOwnership) and the controller gate (assertActorOwnsVportActorController)
    are correctly independent by security design — the screen gate is UX-only and the controller
    gate is the real security boundary. However, they execute sequentially with no result sharing.
    The first 3 DB reads are entirely discarded — the controller has no way to know the screen
    already verified the same ownership 50–100ms earlier.

- Recommended optimization:
    Option A (preferred — zero security tradeoff): Controller reads triggered on initial hook mount
    could accept a "skip-recheck" signal valid for a very short TTL (e.g., 5 seconds) if ownership
    was JUST confirmed by the screen. This window is too short to be exploitable (session would
    need to be revoked in the 5ms between screen render and controller call).
    REQUIRES: VENOM review of the trust model change for the READ-ONLY list path. Write operations
    (mark, delete) must NEVER use this shortcut.

    Option B (safer — no trust model change): Combine useVportOwnership and useVportLeads into a
    single hook that performs ONE assertActorOwnsVportActorController call and uses the result for
    both gate rendering and the initial data fetch. This keeps the controller gate as the real
    authority and eliminates the screen's separate call.
    REQUIRES: Moderate refactor of FinalScreen + hook. VENOM review.

    Option C (minimal change): Extend assertActorOwnsVportActorController to accept an optional
    short-lived session-scoped ownership claim (returned from the first call, passed to subsequent
    calls within the same session). First call always hits DB; subsequent calls within the session
    can use the cached claim with a TTL.
    REQUIRES: Shared ownership cache design. Platform-wide impact (9 call sites). Route to ARCHITECT.

- Optimization ROI:     HIGH — 120ms reduction per page load, zero infrastructure change
- Architectural/Security Risk:
    ANY change to the ownership check flow requires VENOM review.
    WRITE operations (markContacted, delete) must ALWAYS re-assert ownership — no exception.
    READ-ONLY paths have more flexibility.
- Expected improvement:  ~120ms reduction in page load time. ~3 DB reads saved per navigation.
- Recommended handoff:   VENOM (trust model review for any READ path optimization)
                         ARCHITECT (platform-wide ownership cache design if Option C)
                         SPIDER-MAN (regression tests for reduced ownership call)
- Rationale:            LOKI-LEADS-001 confirmed identical fingerprints. The duplication is real and
                        architectural, not accidental. The fix requires security review because any
                        change to the ownership verification call count must be deliberate.
```

---

```
KRAVEN PERFORMANCE FINDING
- Finding ID:          KRA-LEADS-002
- Location:            useVportNewLeadsCount.js:30–38 (pollRefresh) +
                       fastCountNewVportLeadsController (assertActorOwnsVportActorController)
- Application Scope:   VCSM
- Runtime Criticality: PLATFORM-WIDE — VportLeadsChip is in the global layout (RootLayout).
                       Every authenticated VPORT owner generates this load, not just those on the
                       leads page. The poll runs indefinitely for any open VCSM session.
- Evidence Type:       OBSERVED (LOKI-LEADS-003 — source-confirmed; POLL_MS=60_000 constant verified)
- Observation Source:  LOKI trace — 2–4 DB reads per tick × every 60 seconds per VPORT owner session
- Confidence:          HIGH

- Current runtime behavior:
    Every 60 seconds, for every authenticated VPORT owner with VCSM open in any tab:
    pollRefresh() → fastCountNewVportLeadsController(actorId, callerActorId, cachedProfileId)
    → assertActorOwnsVportActorController:
        getActorByIdDAL(requestActorId)  — vc.actors SELECT
        (self-shortcut if kind=user AND requestActorId=targetActorId ELSE:)
        readActorOwnerLinkByActorAndUserProfileDAL — vc.actor_owners SELECT
        getActorByIdDAL(targetActorId)   — vc.actors SELECT
    → readNewLeadsCountByProfileDAL — vport.business_card_leads COUNT
    Total: 2–4 DB reads per tick just to return a single integer badge count.

- Detected pattern:     Repeated auth/context resolution on background poll
- Query Amplification:  2–4 DB reads per 1 integer value returned (SEVERE)
- Controller Fan-Out:   assertActorOwnsVportActorController contributing 2–3 of ~3–4 total reads
- Cache Efficiency:     profileId: HIT (profileIdRef) | ownership: BYPASSED (re-asserts each tick)
- Blast Radius:         PLATFORM-WIDE — affects every authenticated VPORT owner with VCSM open
                        Not limited to leads page; runs from RootLayout via VportLeadsChip
- Estimated impact:
    Per-session DB cost: 120–240 DB reads/hour (2–4 reads × 60 ticks/hour)
    Per-session DB cost: 2,880–5,760 DB reads/day (8-hour session)
    At scale:
      100 concurrent VPORT owners → 200–400 reads/minute (12,000–24,000/hour)
      1,000 concurrent VPORT owners → 2,000–4,000 reads/minute (120,000–240,000/hour)
    This is the single highest-volume DB consumer in the leads module by cumulative read count.

- Root cause hypothesis:
    The poll runs assertActorOwnsVportActorController on every tick to prevent a revoked owner
    from continuing to receive count updates. This is a valid security intent. However, the
    cost is 2–3 DB reads per tick for ownership alone — vs 1 DB read for the count itself.
    Ownership is being re-verified at 60s frequency when the risk of revocation during any
    given 60s window is extremely low.

- Recommended optimizations (in order of impact and safety):

    Option A — Reduce poll frequency (LOWEST RISK, IMMEDIATE):
      Change POLL_MS from 60_000 to 180_000 (3 minutes).
      DB cost reduction: ~67% (from 60 ticks/hour to 20 ticks/hour).
      User impact: Badge refreshes every 3 minutes instead of 1. Acceptable for a non-critical
      notification chip; real-time refresh is not a stated requirement.
      Security impact: NONE — ownership is still verified on each tick.
      Effort: ONE line change. POLL_MS = 60_000 → POLL_MS = 180_000.
      ROI: HIGH — 67% reduction in poll DB cost, zero security tradeoff.

    Option B — Session-scoped ownership cache with TTL (MODERATE RISK, HIGHER IMPACT):
      After assertActorOwnsVportActorController succeeds, cache the result with a 5-minute TTL
      stored in a useRef. On poll tick: if ownership was verified within the TTL, skip the
      assertActorOwnsVportActorController call and go directly to readNewLeadsCountByProfileDAL.
      Re-assert ownership every 5 minutes (not every 60s).
      DB cost reduction: ~75–85% of poll ownership reads (ownership DB check every 5 min vs every 1 min)
      Security impact: LOW — the count data is the number of uncontacted leads, not the lead PII.
      A revoked owner could continue seeing a stale count for up to 5 minutes. This is acceptable
      for a badge count but MUST NOT apply to the full list view or any write operation.
      REQUIRES: VENOM review — explicitly for count-only path. Write paths unchanged.

    Option C — Combine Options A + B:
      Poll every 3 minutes, ownership assertion TTL 10 minutes.
      Net DB cost for ownership assertions: ~6 reads/hour (vs 120–240 reads/hour currently).
      94–97% reduction.

- Optimization ROI:     EXTREME (Option C) — largest absolute DB reduction in the module
- Architectural/Security Risk:
    Option A: NONE — same behavior, lower frequency.
    Option B: LOW for count-only path. MUST be scoped to fastCount only. VENOM review required.
    The full list controller (listVportLeadsController) must always re-assert ownership fully.
    Mark/delete operations must always re-assert ownership fully.
- Expected improvement:  Option A: 67% reduction in poll DB reads. ~1 line change.
                         Option C: ~94% reduction. ~10 lines of cache logic + VENOM sign-off.
- Recommended handoff:   VENOM (Option B/C trust model review for count-only cache)
                         SPIDER-MAN (regression: ownership revocation within TTL window still blocks
                         full list and write operations)
- Rationale:            LOKI-LEADS-003 confirms this as the dominant ongoing DB load source.
                        At platform scale, poll ownership assertions become the #1 DB consumer for
                        this module. Option A alone is safe, low-effort, and provides meaningful relief.
```

---

```
KRAVEN PERFORMANCE FINDING
- Finding ID:          KRA-LEADS-003
- Location:            vportLeads.controller.js — resolveProfileId called in markVportLeadContactedController
                       and deleteVportLeadController +
                       useVportLeads.js — no profileId cache between list load and subsequent mutations
- Application Scope:   VCSM
- Runtime Criticality: Background-only — mark/delete are owner-driven actions
- Evidence Type:       OBSERVED (LOKI-LEADS-002 — source-confirmed)
- Observation Source:  LOKI trace — vport.profiles read fresh on every mark/delete, not cached
- Confidence:          HIGH

- Current runtime behavior:
    When the owner marks a lead as contacted or deletes it:
    (1) useVportLeads already has the list loaded — profileId was resolved during listVportLeadsController
    (2) markVportLeadContactedController is called — it calls resolveProfileId AGAIN (fresh DB read)
    (3) Same for deleteVportLeadController
    The profileId never changes within a session (VPORT profile doesn't change), but it is
    re-fetched from vport.profiles on every mark/delete action (~40ms each time).
    
    The fast-count path (useVportNewLeadsCount) already correctly implements the fix:
      profileIdRef.current = result.resolvedProfileId  — set after initial count
      subsequent fast-count calls use the cached ref, not a fresh DB read

- Detected pattern:     Cache miss — profileId re-resolved on every mutation despite being stable
- Query Amplification:  +1 unnecessary read per mutation action
- Cache Efficiency:     BYPASSED — no profileId retention between initial list load and mutations
- Blast Radius:         Single feature — every mark-contacted and delete action
- Estimated impact:     ~40ms per mutation action. Low absolute cost but 100% avoidable.

- Root cause hypothesis:
    The hook (useVportLeads) does not retain the profileId resolved during the initial
    listVportLeadsController call. The existing pattern in useVportNewLeadsCount demonstrates
    the correct solution. The leads hook pre-dates this optimization or wasn't updated to match.

- Recommended optimization:
    In useVportLeads.js, add a profileIdRef analogous to useVportNewLeadsCount.profileIdRef.
    After the initial listVportLeadsController call returns successfully, store the resolved
    profileId in a ref. Pass it to markVportLeadContactedController and deleteVportLeadController
    alongside the leadId.

    Then, update markVportLeadContactedController and deleteVportLeadController to accept an
    optional preResolvedProfileId. If provided and the ownership assertion passes, skip
    the resolveProfileId call and use the cached value.

    This mirrors the fastCountNewVportLeadsController pattern exactly.

    IMPORTANT: The profileId cache must be invalidated if actorId or sessionActorId changes.
    This is handled naturally because useVportLeads.refresh() is re-called on dependency
    changes, which re-resolves and re-caches the profileId.

- Optimization ROI:     MODERATE — ~40ms per action saved
- Architectural/Security Risk:
    LOW. The cached profileId is derived from a server-side DB read after ownership assertion passes.
    It is not user-supplied. Passing a pre-cached profileId to a controller that has already
    asserted ownership is the same pattern as the fast-count controller — safe and precedented.
    CAUTION: The controller must still assert ownership FIRST. The preResolvedProfileId
    only skips the SECOND DB read (profile lookup), not the ownership assertion.
    ELEK-2026-06-04-003 already flagged the inverse risk (caller-supplied profileId bypassing
    affinity) — this optimization is different: the profileId comes from a prior server-verified
    owner-confirmed resolution, not from an external caller.
- Expected improvement:  ~40ms per mark-contacted and delete action. Eliminates 1 unnecessary
                         DB read per mutation.
- Recommended handoff:   SPIDER-MAN (regression: profileId cache invalidated on identity change;
                         mutation controllers still reject non-owner callers)
                         VENOM (low priority — confirm profileId caching pattern is safe)
- Rationale:            LOKI-LEADS-002 confirmed the pattern. The fix already exists in the same
                        module (useVportNewLeadsCount) — applying it to useVportLeads is a 1:1 copy.
```

---

```
KRAVEN PERFORMANCE FINDING
- Finding ID:          KRA-LEADS-004
- Location:            useVportOwnership.js:45–57 — window focus + visibilitychange listeners
- Application Scope:   VCSM
- Runtime Criticality: Identity-critical (ownership revocation detection)
- Evidence Type:       OBSERVED (LOKI-LEADS-004 — source-confirmed)
- Observation Source:  LOKI trace — no debounce, no minimum interval, no last-checked ref
- Confidence:          HIGH

- Current runtime behavior:
    Both "focus" and "visibilitychange" listeners fire checkVportOwnershipController immediately
    with no debounce, no minimum re-check interval, and no tracking of when ownership was last
    verified. A user who switches browser tabs 10 times in 30 seconds generates 10 ownership
    DB re-checks, each issuing 1–3 DB reads on vc.actors and vc.actor_owners.
    A power user with multiple windows, or a developer switching frequently between the app and
    editor, would trigger dozens of ownership re-checks per session.

- Detected pattern:     Polling noise / repeated context resolution
- Query Amplification:  1–3 reads per focus event (returns a boolean, not data)
- Cache Efficiency:     BYPASSED — no last-checked timestamp, no minimum interval
- Blast Radius:         Single feature per session — leads page only (hook unmounts when user leaves)
- Estimated impact:     LOW under normal conditions; MEDIUM for power users or developers.
                        Worst case: ~30 focus events in 5 minutes = 30–90 DB reads for a boolean.

- Root cause hypothesis:
    The focus re-check pattern is correct in security intent — it detects ownership revocation
    without requiring a page refresh. The implementation is missing a last-checked guard.
    A debounce or minimum-interval ref (e.g., "skip re-check if we checked within the last
    30 seconds") would preserve the revocation detection behavior while eliminating the burst.

- Recommended optimization:
    Add a lastCheckedAtRef to useVportOwnership.js.
    In onFocus and onVisibility handlers:
      const now = Date.now();
      if (lastCheckedAtRef.current && now - lastCheckedAtRef.current < 30_000) return;
      lastCheckedAtRef.current = now;
      check(false);
    This preserves revocation detection (checks every 30s minimum on focus)
    while preventing burst DB calls from rapid tab-switching.
    30 seconds is short enough to catch revocation quickly; long enough to absorb tab-switching.

- Optimization ROI:     MODERATE — prevents DB burst from tab-switching; preserves security behavior
- Architectural/Security Risk:
    LOW. The minimum interval is 30s — far shorter than any realistic "window between ownership
    revocation and the next refresh." The security intent (detect revocation quickly) is preserved.
    VENOM should confirm the 30s window is acceptable.
- Expected improvement:  Eliminates burst ownership re-checks. For rapid tab-switching users,
                         reduces from N re-checks to ⌊elapsed_seconds / 30⌋ re-checks.
- Recommended handoff:   VENOM (confirm 30s minimum re-check window is acceptable for revocation)
                         SPIDER-MAN (regression: ownership revocation still detected within 30s)
- Rationale:            LOKI-LEADS-004 confirmed. A 3-line change eliminates the DB burst risk
                        without changing the security model.
```

---

```
KRAVEN PERFORMANCE FINDING
- Finding ID:          KRA-LEADS-005
- Location:            useVportLeads.js + useVportNewLeadsCount.js — dual initial count reads
- Application Scope:   VCSM
- Runtime Criticality: Background-only
- Evidence Type:       INFERRED (from LOKI trace flow map — both hooks mount simultaneously)
- Observation Source:  LOKI execution flow map — steps 7–13 show list+count running in parallel
- Confidence:          MEDIUM

- Current runtime behavior:
    On leads page load, both useVportLeads and useVportNewLeadsCount mount simultaneously.
    useVportLeads → listVportLeadsController: 5 DB reads → returns full leads list
    useVportNewLeadsCount → countNewVportLeadsController: 4–5 DB reads → returns { count, resolvedProfileId }
    These run in parallel (not serial), but both include:
      assertActorOwnsVportActorController — 2–3 DB reads (parallel, but still total 4–6 DB calls)
      resolveProfileId — 1 DB read (parallel, but still total 2 DB calls)
    The leads list already contains all the data needed to compute the uncontacted count:
      list.filter(l => !l.isContacted).length === the count
    On initial load, the count fetch is redundant — the list is already being fetched.

- Detected pattern:     Duplicate data reads — count derivable from list on initial mount
- Query Amplification:  +4–5 DB reads on initial load to fetch a count already computable from list
- Cache Efficiency:     N/A — both reads are parallel on initial mount
- Blast Radius:         Single feature — initial leads page load only
- Estimated impact:     MEDIUM on initial load. LOW overall (parallel execution mitigates wall time).
                        The reads are parallel so they don't add to WALL CLOCK time, but they
                        do add to DB load (4–5 additional DB operations per page load).

- Root cause hypothesis:
    The count hook was designed to run independently (for use outside the leads page, e.g., in the
    chip). On the leads page, it runs alongside the full list fetch redundantly. The component
    design doesn't share data between the two hooks.

- Recommended optimization:
    Option A (minimal): On leads page mount, derive the initial count from the list returned by
    useVportLeads. Pass it to useVportNewLeadsCount as an `initialCount` prop to skip the first
    DB count fetch. Subsequent polls still run independently.
    Option B: listVportLeadsController returns { leads, count } — the count computed as
    SELECT COUNT(*) WHERE source NOT ILIKE '%contacted%' can be added to the list query
    as a Supabase aggregate. One additional query clause vs one full separate read.

- Optimization ROI:     MODERATE — saves 4–5 DB reads on initial page load (parallel, not wall time)
- Architectural/Security Risk: LOW
- Expected improvement:  4–5 fewer DB reads on initial page load. No wall-clock improvement since
                         reads are parallel.
- Recommended handoff:   SPIDER-MAN (regression: count remains accurate after list-derived initialization)
- Rationale:            LOKI suggests parallel execution, so the wall-clock impact is minimal.
                        The DB load reduction is real but secondary to KRA-LEADS-001 and -002.
```

---

```
KRAVEN PERFORMANCE FINDING
- Finding ID:          KRA-LEADS-006
- Location:            assertActorOwnsVportActorController — 3 DB reads per non-self invocation
- Application Scope:   VCSM (platform-wide — 9 call sites)
- Runtime Criticality: Identity-critical / Platform-wide multiplier
- Evidence Type:       INFERRED (LOKI trace + source analysis)
- Observation Source:  LOKI execution flow map — 3 sequential DB reads for non-self ownership
- Confidence:          HIGH

- Current runtime behavior:
    assertActorOwnsVportActorController for the user→vport case (most common for leads):
      1. getActorByIdDAL(requestActorId) — SELECT from vc.actors (verify kind=user, not void)
      2. readActorOwnerLinkByActorAndUserProfileDAL — SELECT from vc.actor_owners (verify ownership)
      3. getActorByIdDAL(targetActorId) — SELECT from vc.actors (verify target not void)
    3 serial DB reads per ownership assertion. This runs before EVERY controller operation.
    
    For the self-shortcut path (requestActorId === targetActorId, kind=user):
      Only 1 DB read (getActorByIdDAL for requester kind check).
    But the VPORT owner use case (user-kind actor owning a vport-kind actor) NEVER hits
    the self-shortcut because requestActorId ≠ targetActorId.

- Detected pattern:     Controller fan-out — ownership gate is the universal read multiplier
- Query Amplification:  3 DB reads per assertion × 2 controllers on page load = 6 of the 8 total reads
                        on page load are from ownership assertions alone
- Estimated impact:     HIGH across the full module; PLATFORM-WIDE across all 9 call sites
- Root cause hypothesis:
    The 3-read pattern is a sound implementation given the current schema. Each read validates
    a different security property (requester exists and valid kind, ownership link exists and not
    void, target exists and not void). The reads are not redundant individually — they are
    redundant at the request level (same request triggers the same reads 2+ times).
    
    A Supabase RPC that performs all 3 checks in a single DB round trip would reduce the
    3-read chain to 1. However, this is a platform-wide change with security implications.

- Recommended optimization:
    PLATFORM-WIDE, not leads-specific. Route to ARCHITECT + CARNAGE.
    Consider a `validate_actor_ownership(requester_actor_id, target_actor_id)` DB function
    that performs all 3 checks in one SQL call. Returns a typed result
    (ok, mode, error_reason). Replaces 3 serial reads with 1 RPC call.
    Estimated impact: 2 fewer DB reads per ownership assertion × all 9 call sites.
    This is the highest-ROI optimization in the leads module but requires platform-wide
    architecture review.

- Optimization ROI:     EXTREME (if implemented platform-wide) — eliminates 2 of 3 DB reads
                        per ownership assertion across all consumers
- Architectural/Security Risk:
    HIGH — any change to the ownership gate logic requires VENOM + BLACKWIDOW re-review.
    A DB function must be thoroughly tested and regression-covered before replacing app-layer logic.
- Expected improvement:  2 DB reads saved per ownership assertion. On leads page load alone:
                         saves 4+ DB reads. Platform-wide: significant.
- Recommended handoff:   ARCHITECT (design evaluation), CARNAGE (migration for DB function),
                         VENOM (trust model review), BLACKWIDOW (adversarial testing of new gate)
- Rationale:            This finding is flagged for planning — not an immediate action. The leads
                        module is a good place to model it because it has the most concentrated
                        ownership assertion usage.
```

---

## KRAVEN Priority Matrix

```
KRAVEN PRIORITY MATRIX

| Priority | Finding | Runtime Criticality | Impact | ROI | Severity |
|---|---|---|---|---|---|
| P0 | KRA-LEADS-002 Option A: Change POLL_MS 60s→180s | Platform-wide (VportLeadsChip runs for all VPORT owners) | 67% reduction in poll DB reads | EXTREME (1-line change) | HIGH |
| P1 | KRA-LEADS-001: Eliminate duplicate ownership read on page load | Per-page-load | ~120ms + 3 DB reads saved per navigation | HIGH | HIGH |
| P2 | KRA-LEADS-004: Add 30s debounce to focus ownership re-check | Per-session tab-switching | Prevents focus-driven DB burst | MODERATE (3-line change) | MEDIUM |
| P3 | KRA-LEADS-003: Cache profileId in useVportLeads for mutations | Per mark/delete action | ~40ms per action, 1 DB read saved | MODERATE | MEDIUM |
| P4 | KRA-LEADS-005: Derive initial count from list, skip count fetch on mount | Initial page load only | 4–5 DB reads saved (parallel, not wall-clock) | MODERATE | LOW |
| P5 | KRA-LEADS-006: Platform-wide ownership gate RPC consolidation | Platform-wide (all 9 call sites) | 2 DB reads saved per assertion everywhere | EXTREME (platform) | INFO (for leads) |
```

---

## Optimization Safety Review

```
OPTIMIZATION SAFETY REVIEW

| Optimization | Architectural Risk | Security Risk | Requires SENTRY/VENOM |
|---|---|---|---|
| KRA-LEADS-002 Option A: poll 60s → 180s | NONE | NONE | No |
| KRA-LEADS-001: Skip controller re-check on initial read-only mount | MODERATE — ownership flow change | MEDIUM — VENOM must confirm READ-ONLY scope and TTL | YES — VENOM required |
| KRA-LEADS-004: 30s focus debounce | LOW | LOW — VENOM should confirm 30s window acceptable | YES — VENOM confirmation |
| KRA-LEADS-003: profileId cache in useVportLeads | LOW | LOW — VENOM should confirm cached-value pattern (same as profileIdRef) | YES — VENOM low-priority |
| KRA-LEADS-005: Count derived from list on initial mount | LOW | NONE | No |
| KRA-LEADS-006: Platform-wide ownership RPC | HIGH | HIGH — VENOM + BLACKWIDOW full re-review | YES — mandatory |

SECURITY CONSTRAINT (non-negotiable):
  All WRITE operations (markVportLeadContactedController, deleteVportLeadController) must
  ALWAYS run assertActorOwnsVportActorController cold — no cache, no shortcut, no TTL.
  The profileId cache (KRA-LEADS-003) is safe because it is derived from a prior server-verified
  owner-confirmed resolution, not from an external caller. But the OWNERSHIP ASSERTION itself
  must never be skipped for writes.
```

---

## Query Amplification at Scale

```
DB COST PROJECTION (SCALE MODEL)

Scenario: 1,000 concurrent VPORT owners with VCSM open, leads chip visible

Current behavior (POLL_MS=60,000):
  Poll ticks/hour: 60 × 1,000 = 60,000 ticks/hour
  DB reads per tick: 3 (self-shortcut) to 4 (user→vport) = avg ~3.5
  Total ownership assertion reads/hour from count poll alone: 210,000 reads/hour

After KRA-LEADS-002 Option A (POLL_MS=180,000):
  Poll ticks/hour: 20 × 1,000 = 20,000 ticks/hour
  DB reads/hour: 70,000 — 67% reduction

After KRA-LEADS-002 Option C (180s poll + 10min ownership TTL):
  Ownership assertion reads/hour: ~12 per session (6 assertions/hour at 10min TTL)
  = 12,000 reads/hour — 94% reduction

Even at moderate scale, the poll ownership assertion is the dominant DB load source
in the leads module. KRA-LEADS-002 Option A is the highest-leverage single-line change
in the entire codebase for this feature.
```

---

## Observability Routing (from LOKI)

These LOKI findings are NOT performance bottlenecks — they are observability gaps routed separately:

| LOKI Finding | Type | Route To |
|---|---|---|
| LOKI-LEADS-005 — silent lead list failure | Observability | SENTRY instrumentation + VENOM |
| LOKI-LEADS-006 — empty count poll catch blocks | Observability | SENTRY instrumentation |
| LOKI-LEADS-007 — unhandled rejection from mark/delete | Observability | SENTRY instrumentation |
| LOKI-LEADS-008 — hard DELETE of PII without audit trail | Compliance/Audit | VENOM + CARNAGE + DB |

---

## Required Follow-up Commands

| Command | Reason | Priority |
|---|---|---|
| VENOM | Trust model review for KRA-LEADS-001 (read-path ownership skip TTL) and KRA-LEADS-004 (30s focus window) | Before implementing P1, P2 |
| SPIDER-MAN | Regression tests: ownership revocation within TTL window still blocks writes; profileId cache invalidation on identity change; count accuracy after list-derived initialization | Before any optimization ships |
| ARCHITECT | Platform-wide ownership gate RPC design (KRA-LEADS-006) | Planning horizon |
| CARNAGE | DB function design for validate_actor_ownership (KRA-LEADS-006) if ARCHITECT approves | Planning horizon |
| BLACKWIDOW | Re-test ownership adversarial scenarios after any optimization ships (KRA-LEADS-001, -002) | After implementation |
