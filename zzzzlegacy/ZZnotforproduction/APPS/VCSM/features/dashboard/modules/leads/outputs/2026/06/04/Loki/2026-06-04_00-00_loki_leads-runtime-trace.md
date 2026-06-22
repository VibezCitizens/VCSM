# LOKI RUNTIME REPORT — leads

Application Scope: VCSM
Observed flow: Leads dashboard page load + 60-second count poll + mark-contacted + delete
Entry point: `/actor/:actorId/dashboard/leads` → VportDashboardLeadsScreen → VportDashboardLeadsFinalScreen
Environment: Development (static analysis from source — no live instrumentation attached)
TypeScript output allowed: NO

---

## TRACE IDENTITY

Trace ID: LOKI-LEADS-2026-06-04-001
Route: `/actor/:actorId/dashboard/leads`
Screen: VportDashboardLeadsFinalScreen → VportDashboardLeadsView
Session state class: authenticated VPORT owner (user-kind actor owning a vport-kind actor)
Timestamp: 2026-06-04

Evidence note: All timing values are INFERRED from source analysis — no live instrumentation ran. Observed = static trace. Confidence levels noted per finding.

---

## RUNTIME SUMMARY

Total duration: ~350–450ms estimated (INFERRED)
Primary records returned: N leads (variable — 0–150 per owner)
Total DB reads on initial load: **8 reads** (user-owns-vport case) | **4 reads** (self-ownership case)
Read Amplification Score: 8/N (variable — see analysis)
Worst bottleneck: 8-step serial ownership→profile→data waterfall split across screen gate and controller
Cache behavior summary: NO CACHE anywhere in the load path. Every mount, every action, every poll hits the DB.

---

## EXECUTION FLOW MAP

**Initial page load — user actor owning a vport actor (typical VPORT owner)**

| Step | Operation | Caller | Est. Start | Est. End | Est. Duration | Mode |
|---|---|---|---:|---:|---:|---|
| 1 | `useVportOwnership(viewerActorId, actorId)` fires | VportDashboardLeadsFinalScreen | 0ms | 0ms | — | SERIAL |
| 2 | `checkVportOwnershipController` | useVportOwnership | 0ms | 5ms | ~5ms | SERIAL |
| 3 | `getActorByIdDAL(requestActorId)` → `vc.actors` | assertActorOwnsVportActorController | 5ms | 45ms | ~40ms | SERIAL |
| 4 | `readActorOwnerLinkByActorAndUserProfileDAL` → `vc.actor_owners` | assertActorOwnsVportActorController | 45ms | 85ms | ~40ms | SERIAL |
| 5 | `getActorByIdDAL(targetActorId)` → `vc.actors` | assertActorOwnsVportActorController | 85ms | 125ms | ~40ms | SERIAL |
| 6 | `isOwner = true` → VportDashboardLeadsView renders | — | 125ms | 130ms | ~5ms | — |
| 7 | `useVportLeads(actorId)` fires → `listVportLeadsController` | VportDashboardLeadsView | 130ms | 135ms | ~5ms | SERIAL |
| 8 | `assertActorOwnsVportActorController` (2nd run) | listVportLeadsController | 135ms | 140ms | ~5ms | — |
| 9 | `getActorByIdDAL(requestActorId)` → `vc.actors` **[DUPLICATE of step 3]** | assertActorOwnsVportActorController | 140ms | 180ms | ~40ms | SERIAL |
| 10 | `readActorOwnerLinkByActorAndUserProfileDAL` → `vc.actor_owners` **[DUPLICATE of step 4]** | assertActorOwnsVportActorController | 180ms | 220ms | ~40ms | SERIAL |
| 11 | `getActorByIdDAL(targetActorId)` → `vc.actors` **[DUPLICATE of step 5]** | assertActorOwnsVportActorController | 220ms | 260ms | ~40ms | SERIAL |
| 12 | `resolveProfileId` → `readVportProfileByActorIdDAL` → `vport.profiles` | listVportLeadsController | 260ms | 300ms | ~40ms | SERIAL |
| 13 | `readVportBusinessCardLeadsByProfileDAL` → `vport.business_card_leads` | listVportLeadsController | 300ms | 380ms | ~80ms | SERIAL |
| 14 | `normalizeVportLead` × N → leads render | useVportLeads | 380ms | 400ms | ~20ms | — |

Total execution: **8 serial DB reads, ~380–450ms**

---

**60-second poll — `useVportNewLeadsCount`**

| Step | Operation | Caller | Est. Duration | Mode |
|---|---|---|---:|---|
| 1 | `pollRefresh` fires from `setInterval` (every 60s) | useVportNewLeadsCount | — | — |
| 2 | `fastCountNewVportLeadsController(actorId, callerActorId, profileId)` | pollRefresh | ~5ms | SERIAL |
| 3 | `assertActorOwnsVportActorController` | fastCountNewVportLeadsController | — | — |
| 4 | `getActorByIdDAL(requestActorId)` → `vc.actors` | assertActorOwnsVportActorController | ~40ms | SERIAL |
| 5 | Self-shortcut OR `readActorOwnerLinkByActorAndUserProfileDAL` + `getActorByIdDAL` | assertActorOwnsVportActorController | ~40–80ms | SERIAL |
| 6 | `readNewLeadsCountByProfileDAL(profileId)` → `vport.business_card_leads` COUNT | fastCountNewVportLeadsController | ~30ms | SERIAL |

Total per poll tick: **2–4 DB reads every 60 seconds per open session**

---

**Mark-contacted action**

| Step | Operation | Est. Duration | Mode |
|---|---|---:|---|
| 1 | `markVportLeadContactedController(actorId, { leadId, source }, sessionActorId)` | ~5ms | SERIAL |
| 2 | `assertActorOwnsVportActorController` → 2–3 DB reads | ~80–120ms | SERIAL |
| 3 | `resolveProfileId` → `vport.profiles` SELECT | ~40ms | SERIAL |
| 4 | `markVportBusinessCardLeadContactedDAL` → `vport.business_card_leads` UPDATE + SELECT | ~50ms | SERIAL |

Total: **4–5 DB reads per mark-contacted action**

---

**Delete action**

| Step | Operation | Est. Duration | Mode |
|---|---|---:|---|
| 1 | `deleteVportLeadController(actorId, { leadId }, sessionActorId)` | ~5ms | SERIAL |
| 2 | `assertActorOwnsVportActorController` → 2–3 DB reads | ~80–120ms | SERIAL |
| 3 | `resolveProfileId` → `vport.profiles` SELECT | ~40ms | SERIAL |
| 4 | `deleteVportBusinessCardLeadDAL` → `vport.business_card_leads` DELETE | ~40ms | SERIAL |

Total: **4–5 DB reads per delete action**

---

## DATABASE READ SUMMARY

| Table / View / RPC | Operation | Count (initial load) | Duplicate Fingerprints | Slowest Read | Notes |
|---|---|---:|---:|---:|---|
| `vc.actors` | SELECT id,kind,profile_id,vport_id,is_void | 4 | 2 | ~40ms | requestActorId read twice (screen + controller); targetActorId read twice |
| `vc.actor_owners` | SELECT actor_id,user_id,is_primary,is_void | 2 | 1 | ~40ms | owner link read twice (screen + controller) |
| `vport.profiles` | SELECT id,actor_id,name,slug,is_active,is_deleted | 1 | 0 | ~40ms | profile resolution for data scoping |
| `vport.business_card_leads` | SELECT 9 columns, ORDER created_at DESC, LIMIT 150 | 1 | 0 | ~80ms | primary data read |

Total DB reads (initial load, user→vport case): **8**
Primary records returned: N leads
Read Amplification Score: 8 / N

| Lead count | Amplification | Status |
|---:|---:|---|
| 0 | ∞ | N/A — but 8 reads for no data |
| 1 | 8.0 | HIGH |
| 5 | 1.6 | HEALTHY |
| 20 | 0.4 | HEALTHY |
| 50 | 0.16 | HEALTHY |

---

## DUPLICATE QUERY FINGERPRINTS

| Fingerprint | Count | Caller Chains | Impact |
|---|---:|---|---|
| `table=vc.actors op=select filter=id eq requestActorId` | 2 | screen → checkVportOwnershipController → assertActorOwnsVportActor AND controller → assertActorOwnsVportActor | ~40ms wasted per load |
| `table=vc.actor_owners op=select filter=actor_id+user_id` | 2 | screen → checkVportOwnershipController → assertActorOwnsVportActor AND controller → assertActorOwnsVportActor | ~40ms wasted per load |
| `table=vc.actors op=select filter=id eq targetActorId` | 2 | screen → assertActorOwnsVportActor AND controller → assertActorOwnsVportActor | ~40ms wasted per load |

**3 query fingerprints duplicated on every page load.**
Total wasted DB time from duplicates: ~120ms per load (3 redundant reads × ~40ms each).

---

## TIMING BUDGET STATUS

| Runtime Area | Observed (INFERRED) | Budget | Status |
|---|---:|---:|---|
| Route/screen load | ~380–450ms | 1500ms | ✅ PASS |
| Controller orchestration (listVportLeads full chain) | ~250–320ms | 300ms | ⚠️ WARN |
| DAL total | ~290–380ms | 500ms | ✅ PASS |
| Single DB read max | ~40–80ms | 150ms | ✅ PASS |
| Hydration/render | ~20ms | 500ms | ✅ PASS |
| Poll tick (every 60s) | ~110–160ms | 100ms (count read budget) | ⚠️ WARN |

Controller orchestration is at the edge of the 300ms budget because the controller chain runs 3–5 serial DB reads before reaching the primary data fetch.

---

## CACHE OBSERVATIONS

| Cache | Caller | Status | Evidence | Impact |
|---|---|---|---|---|
| Ownership check result | screen → controller | BYPASS | Screen resolves ownership; controller re-checks unconditionally | 3 duplicate DB reads per load |
| vport profile id | `resolveProfileId` | BYPASS | Resolved fresh on every controller call except `fastCountNewVportLeadsController` | 1 extra DB read on every mark/delete action |
| profileId via `useRef` | `useVportNewLeadsCount.profileIdRef` | HIT (polls only) | `profileIdRef.current` set after first count; used in `fastCountNewVportLeadsController` | Correct — avoids re-resolving profile on 60s polls |
| Leads list | `useVportLeads` | BYPASS | No cache — full re-fetch on every hook mount | Full 8-read chain on every navigation to leads |
| Actor kind / identity | `useIdentity` context | HIT | Context-based, no DB calls | Correct |

**The only cache that exists is `profileIdRef` in `useVportNewLeadsCount`.** Everything else re-queries on every call.

---

## RENDER / HOOK CHURN

| Component / Hook | Trigger | Rerenders | Effect Count | Query Impact | Notes |
|---|---|---:|---:|---:|---|
| VportDashboardLeadsFinalScreen | params change | 1 | 1 (ownership effect) | 3 DB reads | Stable — no churn observed |
| VportDashboardLeadsView | actorId prop | 1 | 0 (no effects) | 0 | Pure render |
| useVportLeads | actorId + sessionActorId change | Stable on first load | 1 (refresh effect) | 5 DB reads | Re-runs if identity reloads |
| useVportNewLeadsCount | actorId + callerActorId change | Stable | 1 (poll effect) | 2–4 DB reads/60s | Interval re-established on any dependency change |
| useVportOwnership | focus / visibilitychange | **N events** | 1 + N re-checks | 3 DB reads per focus | See LOKI-LEADS-006 |

Window focus events fire `checkVportOwnershipController` silently. High-traffic tabs (browser user switching frequently) generate uncached ownership re-checks.

---

## LOKI RUNTIME FINDINGS

---

**LOKI RUNTIME FINDING**
Finding ID: LOKI-LEADS-001
Location: `vportLeads.controller.js` → all 5 controllers + `checkVportOwnership.controller.js`
Application Scope: VCSM
Runtime Risk Category: Duplicate read
Evidence Type: INFERRED
Observation Source: Static analysis of assertActorOwnsVportActorController call pattern — runs at screen gate AND inside every controller
Confidence: HIGH
Current runtime behavior: On every page load, `useVportOwnership` triggers `checkVportOwnershipController` → `assertActorOwnsVportActorController` (3 DB reads: vc.actors×2 + vc.actor_owners×1). Then `listVportLeadsController` immediately runs `assertActorOwnsVportActorController` again (3 identical DB reads). The screen gate result is discarded — not passed to the controller.
Runtime impact: 3 duplicate DB reads per leads page load. ~120ms of wasted latency on every navigation to the leads screen.
Read Amplification: +3 unnecessary reads per load regardless of lead count
Timing impact: ~120ms overhead added to every page load
Caller chain: VportDashboardLeadsFinalScreen → useVportOwnership → checkVportOwnershipController → assertActorOwnsVportActorController [reads vc.actors, vc.actor_owners] — then separately — VportDashboardLeadsView → useVportLeads → listVportLeadsController → assertActorOwnsVportActorController [same reads again]
Cache status: BYPASS — no result sharing between screen gate and controller
Severity: MEDIUM
Recommended handoff: KRAVEN — evaluate whether the screen-gate ownership result can be passed into the hook to avoid the controller re-check on initial load. Note: the double-check is intentional defense-in-depth; if collapsed, VENOM must review the trust model change.
Rationale: The duplication exists because the screen gate is a UX layer and the controller is a security layer — both are correct individually. The cost is 3 redundant DB reads on every page load. An actor-identity token or short-lived session claim could eliminate the duplicate without weakening the security boundary.

---

**LOKI RUNTIME FINDING**
Finding ID: LOKI-LEADS-002
Location: `vportLeads.controller.js` — `resolveProfileId` in listVportLeadsController, markVportLeadContactedController, countNewVportLeadsController, deleteVportLeadController
Application Scope: VCSM
Runtime Risk Category: Duplicate read / Serial bottleneck
Evidence Type: INFERRED
Observation Source: Static analysis — resolveProfileId is called independently in 4 of 5 controllers; no shared cache exists
Confidence: HIGH
Current runtime behavior: Every controller call re-fetches the vport profile from `vport.profiles` to resolve the profileId. The profile does not change between operations in a session. listVportLeadsController fetches the profile; if the owner then marks a lead contacted, the profile is fetched again from scratch.
Runtime impact: 1 extra DB read per action (mark-contacted, delete) beyond what the fast-path uses
Timing impact: ~40ms added to each mark/delete action
Caller chain: useVportLeads.markContacted → markVportLeadContactedController → resolveProfileId → readVportProfileByActorIdDAL → vport.profiles
Cache status: BYPASS — profileId not retained between controller calls from the same hook instance
Severity: LOW
Recommended handoff: KRAVEN — consider whether the hook can retain the resolved profileId after `listVportLeadsController` and pass it to subsequent mutation controllers (analogous to how `useVportNewLeadsCount` uses `profileIdRef`).
Rationale: The fast count path already demonstrates the correct pattern (`profileIdRef`). The lead inbox hook could apply the same pattern to avoid re-resolving the profile on every mark/delete.

---

**LOKI RUNTIME FINDING**
Finding ID: LOKI-LEADS-003
Location: `useVportNewLeadsCount.js` — `setInterval(pollRefresh, 60_000)`
Application Scope: VCSM
Runtime Risk Category: Polling noise / Repeated auth/context resolution
Evidence Type: OBSERVED (source-confirmed)
Observation Source: `POLL_MS = 60_000` constant; `assertActorOwnsVportActorController` inside `fastCountNewVportLeadsController`
Confidence: HIGH
Current runtime behavior: Every 60 seconds, `fastCountNewVportLeadsController` runs `assertActorOwnsVportActorController` which queries `vc.actors` (at minimum 1 read, up to 3 for non-self-ownership). Then `readNewLeadsCountByProfileDAL` runs a COUNT query on `vport.business_card_leads`. Total: 2–4 DB reads per tick.
Runtime impact: Continuous background DB load — 120–240 DB reads per hour per active session. For a VPORT owner who leaves the dashboard open, this is the dominant ongoing DB cost of the leads module.
Read Amplification: 2–4 reads per poll tick returning a single integer
Timing impact: ~110–160ms per poll tick (within reasonable tolerance but includes a full ownership assertion)
Caller chain: setInterval → pollRefresh → fastCountNewVportLeadsController → assertActorOwnsVportActorController → vc.actors + (vc.actor_owners if non-self) → readNewLeadsCountByProfileDAL → vport.business_card_leads COUNT
Cache status: profileId HIT (profileIdRef) | ownership NOT CACHED (re-asserts every tick)
Severity: MEDIUM
Recommended handoff: KRAVEN — evaluate whether ownership assertion is necessary on every poll tick after the session is already established. A session-scoped ownership token or reduced-frequency re-assertion (e.g., every 5 minutes instead of every 60 seconds) could reduce DB load by 60–70%.
Rationale: The ownership assertion on every 60-second count tick is the most defensible choice for security, but the cost is real. The count itself is cheap; the ownership check is not negligible. KRAVEN should model the DB cost at scale (N concurrent sessions).

---

**LOKI RUNTIME FINDING**
Finding ID: LOKI-LEADS-004
Location: `useVportOwnership.js` — window focus + visibilitychange listeners
Application Scope: VCSM
Runtime Risk Category: Repeated auth/context resolution / Polling noise
Evidence Type: OBSERVED (source-confirmed)
Observation Source: `window.addEventListener("focus", onFocus)` + `document.addEventListener("visibilitychange", onVisibility)` in useVportOwnership
Confidence: HIGH
Current runtime behavior: Every time the user focuses the window or the tab becomes visible, `checkVportOwnershipController` re-fires silently. Each re-check issues 1–3 DB reads on `vc.actors` and `vc.actor_owners`. No debounce, no minimum interval, no cache.
Runtime impact: For a user who switches between browser tabs frequently while the leads dashboard is open, this could fire dozens of ownership DB checks per session. Each check is uncached and runs a minimum of 1 DB read.
Timing impact: ~40–120ms per focus event (background, no loading indicator)
Caller chain: window:focus/visibilitychange → useVportOwnership.onFocus/onVisibility → checkVportOwnershipController → assertActorOwnsVportActorController → vc.actors (+vc.actor_owners for non-self)
Cache status: BYPASS — no debounce, no minimum re-check interval
Severity: MEDIUM
Recommended handoff: KRAVEN — add a minimum re-check interval (e.g., skip re-check if ownership was confirmed within the last 60 seconds) or debounce the focus handler with a ref tracking last-checked timestamp.
Rationale: The revocation-on-focus pattern is a valid security behavior (catches revoked ownership). The implementation is correct in intent; the missing piece is a debounce or minimum-interval guard to prevent DB storms on tab-switching.

---

**LOKI RUNTIME FINDING**
Finding ID: LOKI-LEADS-005
Location: `useVportLeads.js:30-35` — list failure catch block
Application Scope: VCSM
Runtime Risk Category: Unknown
Evidence Type: OBSERVED (source-confirmed)
Observation Source: `catch (e) { setError(e?.message || "Failed to load leads.") }` — no throw, no monitoring
Confidence: HIGH
Current runtime behavior: When `listVportLeadsController` fails (ownership assertion error, profile resolution failure, DB error), the catch block sets local error state and returns `[]`. The error is shown as `"Unable to load leads right now."` in production. No monitoring event is fired. Engineering has zero visibility into production lead-load failures.
Runtime impact: Silent production failure — owner sees generic message, engineering sees nothing
Caller chain: useVportLeads.refresh → catch → setError → UI renders error message
Cache status: N/A
Severity: HIGH — leads is a PII module and a revenue-adjacent flow; silent load failure is invisible to operators
Recommended handoff: VENOM (if error includes sensitive stack trace in dev) + SENTRY instrumentation (see recommendations below)
Rationale: Any production failure of the leads inbox should be visible to engineering. The current behavior makes it impossible to know if the leads module is failing for any owners in production.

---

**LOKI RUNTIME FINDING**
Finding ID: LOKI-LEADS-006
Location: `useVportNewLeadsCount.js:25-27` — both catch blocks
Application Scope: VCSM
Runtime Risk Category: Unknown
Evidence Type: OBSERVED (source-confirmed)
Observation Source: `catch { // silent — background badge }` — two empty catch blocks
Confidence: HIGH
Current runtime behavior: Both `refresh()` and `pollRefresh()` in `useVportNewLeadsCount` swallow all errors silently. An ownership assertion failure, a DB error, or a network failure causes the badge to silently show stale or zero count with no indication that anything went wrong. Also: `readNewLeadsCountByProfileDAL` returns 0 on error rather than throwing.
Runtime impact: Leads count badge is silently wrong in production when errors occur. No engineering visibility.
Caller chain: useVportNewLeadsCount.refresh/pollRefresh → catch → silent (no state change, no log)
Severity: MEDIUM
Recommended handoff: SENTRY (see instrumentation recommendations)
Rationale: Background badge errors are intentionally silent for UX, which is correct. But a high-frequency error in the count controller (e.g., DB connectivity issue) should be surfaced to monitoring, not discarded entirely.

---

**LOKI RUNTIME FINDING**
Finding ID: LOKI-LEADS-007
Location: `useVportLeads.js:58-63` and `68-82` — markContacted + deleteLead catch blocks
Application Scope: VCSM
Runtime Risk Category: Unknown
Evidence Type: INFERRED
Observation Source: Catch blocks in useVportLeads set actionError and re-throw; button onClick handlers do not chain `.catch()` → unhandled promise rejection
Confidence: MEDIUM
Current runtime behavior: When `markVportLeadContactedController` or `deleteVportLeadController` throws, the hook catch block sets `actionError` and re-throws. The view's button `onClick` handlers call these without `.catch()`:
  `onClick={() => markContacted(lead)}` — fire-and-forget
  `onClick={() => deleteLead(lead.id)}` — fire-and-forget
The re-thrown error becomes an unhandled promise rejection, which Sentry's global handler may or may not capture depending on configuration.
Runtime impact: Mark-contacted and delete failures may reach Sentry accidentally via unhandled rejection, but not with useful metadata (feature, actorId, operation name, leadId). The error arrives without context.
Severity: MEDIUM
Recommended handoff: SENTRY — explicit capture with metadata is better than accidental unhandled rejection capture
Rationale: The PII delete path in particular should emit a structured, context-rich monitoring event when it fails, not an accidental unhandled rejection.

---

**LOKI RUNTIME FINDING**
Finding ID: LOKI-LEADS-008
Location: `vportLeads.write.dal.js` — `deleteVportBusinessCardLeadDAL`
Application Scope: VCSM
Runtime Risk Category: Unknown — Audit trail
Evidence Type: OBSERVED (source-confirmed)
Observation Source: Hard DELETE with no pre-delete read, no audit record, no event emission
Confidence: HIGH
Current runtime behavior: `deleteVportBusinessCardLeadDAL` executes a hard DELETE on `vport.business_card_leads` scoped by `id` AND `vport_profile_id`. No audit event is emitted. No record is kept of which lead was deleted, what PII it contained, when, or by which actor.
Runtime impact: PII permanently destroyed with no trace. Unrecoverable in production. No ability to answer "who deleted this lead?" post-incident.
Caller chain: VportDashboardLeadsView → useVportLeads.deleteLead → deleteVportLeadController → deleteVportBusinessCardLeadDAL → vport.business_card_leads DELETE
Severity: HIGH — PII deletion with no audit trail
Recommended handoff: VENOM (trust boundary — PII deletion without audit log) + CARNAGE (if soft-delete or audit column migration is needed) + DB (GDPR implications of hard delete)
Rationale: Business card leads contain name, phone, email, and message. Permanently deleting them with no audit record is a GDPR and operational risk. At minimum, a deletion event (actorId, leadId, profileId, timestamp) should be logged to an immutable audit store or the DELETE should be converted to a soft-delete.

---

## HANDOFF MATRIX

| Finding | Recommended Handoff | Reason |
|---|---|---|
| LOKI-LEADS-001 — Duplicate ownership check (screen + controller) | KRAVEN | Performance bottleneck — 120ms overhead per page load |
| LOKI-LEADS-002 — Profile re-resolution in every mutation controller | KRAVEN | Serial DB query avoidable via profileId ref pattern |
| LOKI-LEADS-003 — Ownership assertion on every 60s poll tick | KRAVEN | Ongoing DB cost model + optimization evaluation |
| LOKI-LEADS-004 — Undebounced focus/visibility ownership re-check | KRAVEN | Potential DB storm from tab-switching behavior |
| LOKI-LEADS-005 — Silent lead list failure (no monitoring) | SENTRY + VENOM | Production-invisible failure on PII/revenue surface |
| LOKI-LEADS-006 — Silent count poll failure (empty catch) | SENTRY | High-frequency silent failures in background badge |
| LOKI-LEADS-007 — Mark/delete re-throw → unhandled rejection without context | SENTRY | Accidental capture without metadata; needs structured emit |
| LOKI-LEADS-008 — Hard DELETE of PII with no audit trail | VENOM + CARNAGE + DB | GDPR/compliance risk; PII permanently destroyed, no trace |

---

## OBSERVABILITY GOVERNANCE STATUS

| Area | Coverage | Missing Visibility | Risk |
|---|---|---|---|
| Initial leads load | NONE | Failure mode invisible in production | HIGH |
| Mark-contacted action | NONE (may accidentally hit Sentry) | No structured monitoring context | MEDIUM |
| Delete action (PII) | NONE (may accidentally hit Sentry) | No audit trail; no monitoring context | HIGH |
| Count poll failures | NONE — empty catch | Ongoing DB errors invisible | MEDIUM |
| Ownership assertion timing | NONE | Slow ownership checks undetectable | MEDIUM |
| Focus re-check frequency | NONE | DB storm from tab-switching undetectable | LOW |
| Poll tick timing | NONE | Slow/failed polls invisible | LOW |

---

## OBSERVABILITY GAP REVIEW

| Flow | Current Visibility | Missing Signals | Severity | Recommended Instrumentation |
|---|---|---|---|---|
| Leads list load failure | NONE — local error state only | Controller name, route, actorId, error name | HIGH | `captureMonitoringError` in useVportLeads catch |
| Mark-contacted failure | Accidental unhandled rejection | Feature, operation, leadId, actorId | MEDIUM | Explicit `captureMonitoringError` before re-throw |
| Lead delete failure | Accidental unhandled rejection | Feature, operation, leadId, actorId | MEDIUM | Explicit `captureMonitoringError` before re-throw |
| Lead deletion (PII event) | NONE | actorId, profileId, leadId, timestamp | HIGH | Audit event at DAL or controller level |
| Poll count failure | NONE — empty catch | Feature, tick count, error name | MEDIUM | Low-volume `captureMonitoringError` in poll catch |
| Ownership assertion latency | NONE | Duration, mode (self/actor_owner) | LOW | Dev-only timing log in assertActorOwnsVportActorController |

---

## AUDIT TRAIL WARNINGS

**AUDIT TRAIL WARNING**
Flow: Lead delete (owner deletes a business card lead)
Missing audit evidence: No record of which lead was deleted, what PII it contained, when, or by which actor. The DELETE is hard — row is permanently destroyed.
Operational risk: Post-incident investigation cannot determine what was deleted or by whom. GDPR "right to erasure" documentation requires proof of deletion — a hard DELETE with no audit log provides no evidence trail.
Recommended audit event: Before or after DELETE, emit a deletion record with at minimum: `{ actorId, profileId, leadId, deletedAt }`. This can be a separate `lead_deletion_audit` table, an append-only log, or a monitoring event. Route to CARNAGE + VENOM for design decision.

---

## SENTRY MONITORING GAP REVIEW

| Flow | Location | Current Behavior | Auto-Captured? | Missing Signal | Severity | Recommendation |
|---|---|---|---|---|---|---|
| Leads list load failure | `useVportLeads.js:30-35` | Sets local error state, swallows | NO | Feature, controller, actorId, error name | HIGH | Add `captureMonitoringError` |
| Mark-contacted failure | `useVportLeads.js:58-63` | Sets actionError + re-throws (unhandled rejection) | MAYBE — unstructured | leadId, operation, actorId | MEDIUM | Add explicit capture before re-throw |
| Delete lead failure | `useVportLeads.js:74-81` | Sets actionError + re-throws (unhandled rejection) | MAYBE — unstructured | leadId, operation, actorId | MEDIUM | Add explicit capture before re-throw |
| Count poll failure | `useVportNewLeadsCount.js:25-27` | Empty catch | NO | Feature, tick, error name | MEDIUM | Add low-noise `captureMonitoringError` |
| Count initial refresh failure | `useVportNewLeadsCount.js:22-26` | Empty catch | NO | Feature, actorId | LOW | Optional — badge failure is low priority |
| DAL count error → returns 0 | `vportLeads.read.dal.js:27-29` | Returns 0 silently on error | NO | DB error masked as "0 leads" | MEDIUM | Let DAL throw; let hook decide to capture |

---

## SENTRY INSTRUMENTATION RECOMMENDATIONS

**SENTRY INSTRUMENTATION RECOMMENDATION**
Location: `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportLeads.js` — refresh catch block (line ~30)
Failure type: Lead inbox load failure
Current behavior: Catches controller error, sets local error state — invisible in production
Why Sentry does/does not see it: Handled error, no throw — RouteErrorBoundary and global Sentry will never see it
Recommended call:
```js
import { captureMonitoringError } from "@/services/monitoring/monitoring";

catch (e) {
  if (import.meta.env.PROD) {
    captureMonitoringError(e, {
      feature: "leads",
      controller: "listVportLeadsController",
      operation: "loadInbox",
      route: "leads-dashboard",
    });
  }
  setError(e?.message || "Failed to load leads.");
  return [];
}
```
Production-safe: YES — no PII in payload (actorId intentionally omitted; route + feature + operation is sufficient to triage)
Noise risk: LOW — lead load failures are infrequent; one event per failure, not per render
Payload: sanitized metadata only — no lead data, no contact info, no tokens
Owner: LOKI → SENTRY

---

**SENTRY INSTRUMENTATION RECOMMENDATION**
Location: `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportLeads.js` — markContacted catch block (~line 58) and deleteLead catch block (~line 74)
Failure type: Lead mutation failure (mark-contacted or delete)
Current behavior: Sets actionError, re-throws → unhandled promise rejection (possible accidental Sentry capture without context)
Why Sentry does/does not see it: Re-throw reaches fire-and-forget onClick handler → unhandled rejection. Sentry may capture the raw error without useful context.
Recommended call (for both markContacted and deleteLead):
```js
import { captureMonitoringError } from "@/services/monitoring/monitoring";

catch (e) {
  if (import.meta.env.PROD) {
    captureMonitoringError(e, {
      feature: "leads",
      operation: isMark ? "markContacted" : "deleteLead",
      leadId,  // safe — internal ID, not PII
    });
  }
  setActionError(e?.message || "Could not complete action.");
  throw e;
}
```
Production-safe: YES — leadId is an internal UUID, not PII. No name/phone/email/message in payload.
Noise risk: LOW — mutation failures are rare; owner-facing action errors
Payload: sanitized — feature, operation, leadId (UUID only)
Owner: LOKI → SENTRY

---

**SENTRY INSTRUMENTATION RECOMMENDATION**
Location: `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount.js` — pollRefresh catch block (~line 37)
Failure type: Background count poll failure
Current behavior: Empty catch — completely silent
Why Sentry does/does not see it: Handled empty catch — never reaches Sentry
Recommended call:
```js
catch (e) {
  if (import.meta.env.PROD && e) {
    captureMonitoringError(e, {
      feature: "leads",
      operation: "pollCountRefresh",
      isSilent: true,
    });
  }
  // keep silent for UX — badge stays at last known count
}
```
Production-safe: YES — no payload beyond feature + operation
Noise risk: MEDIUM — if Supabase is intermittently flaky, this could spam. Recommend rate-limiting the capture (e.g., only capture first failure in a session, not every 60s).
Payload: feature, operation only
Owner: LOKI → SENTRY

---

## CORRELATION ID REVIEW

| Flow | Correlation Present | Risk | Recommendation |
|---|---|---|---|
| Leads list load | NO | Low — single-session read | Not required |
| Mark-contacted | NO | MEDIUM — PII mutation with no trace | Add operationId or correlationId to captureMonitoringError |
| Delete lead (PII) | NO | HIGH — permanent PII destruction | Required — leadId + actorId + timestamp minimum |
| Count poll | NO | Low | Not required |

---

## OBSERVABILITY MATURITY

**MINIMAL**

The leads module has zero runtime instrumentation. No logging, no tracing, no monitoring calls, no correlation IDs. The screen-level error boundary (`"Unable to load leads right now."`) provides user-facing feedback but no engineering signal. The PII delete path has no audit trail. The background poll has two empty catch blocks.

The module's security posture at the application layer is strong (all 5 controller paths ownership-gated, source verified). The operational visibility posture is absent.

---

## FINAL LOKI STATUS: **WATCH**

The leads module is not CLEAN because:
1. 3 duplicate DB reads per page load (LOKI-LEADS-001)
2. Ownership assertion on every 60s poll tick (LOKI-LEADS-003)
3. Silent production failures on all error paths (LOKI-LEADS-005, LOKI-LEADS-006)
4. Hard PII deletion with no audit trail (LOKI-LEADS-008 — routes to VENOM + CARNAGE)
5. Observability maturity: MINIMAL

The module is not DEGRADED or CRITICAL because:
- Timing budgets are met (PASS for route load; WARN for controller chain)
- No runaway loops, no query storms under normal conditions
- The existing fast-count profileId cache is correctly implemented
- No production-visible debug output
- No sensitive data leaking through error messages in production

Primary action: Add `captureMonitoringError` to the leads load and delete failure paths (LOKI-LEADS-005, LOKI-LEADS-008). Route PII deletion audit trail gap to VENOM + CARNAGE before next THOR review.
