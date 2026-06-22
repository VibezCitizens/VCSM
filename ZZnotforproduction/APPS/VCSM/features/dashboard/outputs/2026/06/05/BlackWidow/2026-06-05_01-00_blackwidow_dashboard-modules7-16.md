BLACKWIDOW V2 ADVERSARIAL REVIEW
===================================

## Output Metadata

| Field | Value |
|---|---|
| Feature | dashboard |
| Command | BLACKWIDOW V2 |
| Scope | VCSM:dashboard modules 7–16 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/BlackWidow/2026-06-05_01-00_blackwidow_dashboard-modules7-16.md |
| Timestamp | 2026-06-05T01:00:00Z |
| Governance Status | DRAFT |

---

## 1. BLACKWIDOW Preflight

**VENOM Dependency Gate: PASS**

| Check | Result |
|---|---|
| VENOM report present | PASS — 2026-06-05_01-00_venom_dashboard-modules7-16.md |
| VENOM report status | COMPLETE |
| VENOM report age | 0 days |
| VENOM scope matches | PASS — VCSM:dashboard modules 7–16 |

**ARCHITECT Freshness Gate: PASS**

| Check | Result |
|---|---|
| evidence-bundle.json | FRESH (0 days) |
| architect-security-surface-dashboard-modules.json | FRESH (0 days) |

**Application Scope:** VCSM

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Used For |
|---|---|---|---|---|---|
| security-path-map | 2026-06-05T03:29:11Z | ~0h | FRESH | HIGH | Attack surface inventory |
| write-execution-map | 2026-06-05T03:29:11Z | ~0h | FRESH | HIGH | Write surface caller chains |
| callgraph | 2026-06-05T03:29:11Z | ~0h | FRESH | HIGH | Attack path construction |
| route-execution-map | 2026-06-05T03:29:11Z | ~0h | FRESH | HIGH | Entry point reachability |

Scanner Version: 1.1.0
Overall Preflight: FRESH
Preflight Action: PASSED
Total attack targets: 17 write surfaces, 5 execution chains
HIGH confidence (execution resolved): 4
LOW confidence (PRIMARY TARGETS — resolved via source): 1 (CHAIN-004 resolved VERIFIED_SAFE in VENOM)

---

## 3. Attack Surface Inventory

| Surface | Table | Schema | ARCHITECT Ownership | VENOM Status | BW Priority |
|---|---|---|---|---|---|
| insertVportBookingDAL | bookings | vport | PARTIAL (caller-responsibility) | SOURCE_VERIFIED (callers safe) | ATTACK |
| updateVportBookingDAL | bookings | vport | PRESENT | SOURCE_VERIFIED | ATTACK |
| upsertVportPublicDetailsDAL (settings) | profile_public_details | vport | PARTIAL | VERIFIED_SAFE | VERIFY |
| upsertVportPublicDetailsDAL (flyerBuilder) | profile_public_details | vport | PRESENT | VERIFIED_SAFE | VERIFY |
| designStudio.write.dal (6 ops) | design_docs/pages/versions | ? | PRESENT | VERIFIED_SAFE | VERIFY |
| gasprices DALs (5 ops) | fuel_prices/history/submissions | vport | PRESENT | VERIFIED_SAFE | VERIFY |
| insertVportResourceDAL | resources | vport | PARTIAL (0 consumers confirmed) | LATENT | ATTACK (reachability) |

---

## 4. Scanner Signals

| Attack Vector | Source Map | Callgraph Path | Scanner Confidence | Source Verified | Result | Provenance |
|---|---|---|---|---|---|---|
| Booking update as non-owner | security-path-map | useVportBookingActions→updateBookingStatusController→updateVportBookingDAL | HIGH→verified | YES — controller line: assertActorOwnsVportActorController | BLOCKED | [SOURCE_VERIFIED] |
| Terminal state replay | write-execution-map | →updateBookingStatusController | HIGH | YES — TERMINAL_STATUSES check before auth | BLOCKED | [SOURCE_VERIFIED] |
| Customer actor cancel abuse | security-path-map | customer path in updateBookingStatusController | HIGH | YES — customer can only cancel; owner checks via assertActorOwns | BLOCKED | [SOURCE_VERIFIED] |
| Gas price approval as non-owner | security-path-map | →reviewFuelPriceSuggestionController→checkVportOwnershipController | HIGH | YES — checkVportOwnershipController at top | BLOCKED | [SOURCE_VERIFIED] |
| Settings UPSERT as non-owner | security-path-map | →saveVportPublicDetailsByActorIdController→upsertVportPublicDetailsDAL | MEDIUM→verified | YES — assertActorOwnsVportActorController line 58 | BLOCKED | [SOURCE_VERIFIED] |
| Exchange rate write as non-owner | security-path-map | exchange screen→useUpsertVportRate→upsertVportRateController | LOW→resolved | YES — identityActorId session-derived; line 72 assertActorOwns | BLOCKED | [SOURCE_VERIFIED] |
| Dashboard insertVportResourceDAL reachability | callgraph | [no callers in dashboard module] | PARTIAL | YES — 0 consumers; calendar uses ENGINE DAL | NOT_REACHABLE | [SOURCE_VERIFIED] |
| Calendar resource creation ownership bypass | callgraph | VportDashboardCalendarScreen→useEnsureOwnerResource→ensureOwnerBookingResource | UNKNOWN (ARCHITECT stub) | YES — assertActorOwnsVportActor line 19 | BLOCKED | [SOURCE_VERIFIED] |
| flyerBuilder upload ownership bypass | security-path-map | useFlyerEditor→uploadFlyerImageCtrl | HIGH | YES — VEN-CARD-001; no ownership check confirmed | BYPASSED | [SOURCE_VERIFIED] |
| serviceLabelSnapshot forgery | write-execution-map | →createOwnerBookingController | HIGH | YES — serviceLabelSnapshot accepted from caller | PARTIAL | [SOURCE_VERIFIED] |
| customerName/Note injection | write-execution-map | →createVportPublicBookingController | HIGH | YES — no length limit or sanitization | PARTIAL | [SOURCE_VERIFIED] |
| Design document cross-actor access | callgraph | →requireDesignDocumentOwnerAccess | HIGH | YES — document.owner_actor_id verified | BLOCKED | [SOURCE_VERIFIED] |

---

## 5. Adversarial Path Analysis

### Attack 1 — Booking Ownership Bypass

**Scenario:** Actor B sends a booking status update targeting Actor A's bookingId.

OWNERSHIP BYPASS ATTEMPT
Target: updateVportBookingDAL via updateBookingStatusController
Attack vector: Supply bookingId belonging to Actor A while authenticated as Actor B. The controller fetches booking from bookingId, resolves the VPORT actorId from booking.profile_id, then calls assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: vportActorId }).
Result: BLOCKED
Evidence: assertActorOwnsVportActorController at controller — Actor B does not appear in actor_owners for Actor A's VPORT. Ownership query returns null → throws. updateVportBookingDAL never reached.
Controller gate: PRESENT
Severity: N/A (blocked)

---

### Attack 2 — Terminal State Replay

**Scenario:** Actor (authenticated owner) attempts to re-open a completed or cancelled booking.

MUTATION REPLAY ATTEMPT
Target resource: Booking in state = "completed" or "cancelled" or "no_show"
Resource state at time of replay: TERMINAL
Result: BLOCKED
Evidence: TERMINAL_STATUSES check at line ~18 of updateBookingStatusController — runs BEFORE ownership check. If booking is in terminal state, controller throws immediately regardless of caller identity. No auth bypass possible here; the guard is independent of the auth path.
State check: PRESENT
Severity: N/A (blocked)

Additional note: The terminal check running BEFORE auth means an unauthenticated caller could discover whether a bookingId is in a terminal state (the error message differs from the auth error). This is an INFO-level timing oracle, not a security bypass.

---

### Attack 3 — Customer Actor Cancel Abuse

**Scenario:** Actor B (a citizen who booked with Actor A's VPORT) attempts to change booking status to "completed" or another status only owners can set.

RUNTIME ABUSE ATTEMPT
Target: updateBookingStatusController — customer path
Actor role used: customer (booking.customer_actor_id === callerActorId)
Expected access: DENY for all statuses except "cancelled"
Result: DENIED
Evidence: Controller checks if callerActorId === booking.customer_actor_id. If yes → customer path: status must be "cancelled". Any other status (completed, no_show, pending, confirmed) → throws "Customers may only cancel bookings." Owner path (assertActorOwnsVportActorController) is NOT entered for customers.
Privilege gate: PRESENT
Severity: N/A (blocked)

---

### Attack 4 — Gas Price Approval as Non-Owner

**Scenario:** Actor B submits a "reviewed" status for Actor A's VPORT fuel price submission.

OWNERSHIP BYPASS ATTEMPT
Target: reviewFuelPriceSuggestionController → upsertVportFuelPriceDAL
Attack vector: Supply Actor A's profileId while authenticated as Actor B
Result: BLOCKED
Evidence: Controller resolves actorId from profileId (server-side, not client-supplied actorId), then calls checkVportOwnershipController({ callerActorId, targetActorId: resolvedActorId }). Actor B fails actor_owners lookup → throws.
Controller gate: PRESENT
Severity: N/A (blocked)

---

### Attack 5 — Settings UPSERT as Non-Owner

**Scenario:** Actor B sends a settings save payload targeting Actor A's VPORT actorId.

OWNERSHIP BYPASS ATTEMPT
Target: saveVportPublicDetailsByActorIdController → upsertVportPublicDetailsDAL
Attack vector: Supply actorId belonging to Actor A while requestActorId = Actor B (session-derived)
Result: BLOCKED
Evidence: assertActorOwnsVportActorController({ requestActorId, targetActorId: actorId }) at line 58 — Actor B not in actor_owners for Actor A → throws before any read or write.
Controller gate: PRESENT
Severity: N/A (blocked)

---

### Attack 6 — Exchange Rate Write as Non-Owner

**Scenario:** Actor B attempts to write an exchange rate to Actor A's VPORT.

VIEWER CONTEXT FUZZ ATTEMPT
Target: upsertVportRateController → upsertVportRateDal
Injected context: identityActorId from UI hook with Actor B's session; actorId (target) = Actor A's actorId
Expected result: DENY
Actual result: DENY
Context validation: ENFORCED
Evidence: identityActorId is derived from session identity (identity?.actorId for user-kind, or availableActors.find userKind for vport-kind). Not user-supplied. Line 72: assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId: actorId }) → Actor B not in actor_owners for Actor A → throws.
Severity: N/A (blocked)

**Actor type confusion sub-test:** What if Actor B is authenticated as a vport-kind actor and tries to write to Actor A's VPORT?
- useUpsertVportRate resolves identityActorId = the underlying user-kind actor from availableActors
- assertActorOwnsVportActorController receives the user-kind actorId, not the vport-kind actorId
- actor_owners table stores user→vport mappings — user-kind Actor B not in Actor A's actor_owners → BLOCKED

---

### Attack 7 — Dashboard insertVportResourceDAL Reachability

**Scenario:** Attempt to reach the dashboard-level `insertVportResourceDAL` (which has no WRITE_COLS whitelist) from any UI surface.

CROSS-FEATURE ABUSE ATTEMPT
Source feature: VCSM:dashboard (any module)
Target feature internal: apps/VCSM/src/features/dashboard/vport/dal/write/vportResource.write.dal.js → insertVportResourceDAL
Attack vector: Identify any hook, controller, or adapter that calls this DAL
Result: NOT_REACHABLE
Evidence: Prior BLACKWIDOW run (BW-DASH-003) confirmed 0 consumers. Current VENOM run confirmed this by reading the file directly — insertVportResourceDAL is an export that no dashboard module calls. Calendar resource creation uses engines/booking/src/controller/ensureOwnerBookingResource.controller.js → dalInsertBookingResource (ENGINE-level DAL). The dashboard DAL and the engine DAL are SEPARATE functions in separate files.
Adapter isolation: N/A (no consumers found)
Severity: LOW — LATENT DEAD CODE with dangerous characteristics (no field whitelist). Delete risk exists if a future developer re-discovers and wires this DAL without adding proper ownership + whitelist.

Recommendation: Delete `insertVportResourceDAL` from `vportResource.write.dal.js` to prevent future misuse. The engine owns resource creation.

---

### Attack 8 — Calendar Resource Creation Ownership Bypass

**Scenario:** Actor B navigates to `/actor/[Actor_A_actorId]/dashboard/calendar` and triggers resource creation.

OWNERSHIP BYPASS ATTEMPT
Target: ensureOwnerBookingResource.controller.js (engines/booking) → dalInsertBookingResource
Attack vector: Actor B navigates to Actor A's dashboard calendar route; useEnsureOwnerResource fires with ownerActorId from URL (Actor A's) and requestActorId from session (Actor B's)
Result: BLOCKED
Evidence: ensureOwnerBookingResource line 19: assertActorOwnsVportActor({ requestActorId, targetActorId: ownerActorId }). Actor B fails actor_owners lookup → throws. dalInsertBookingResource never reached.
Additionally: OwnerOnlyDashboardGuard + useVportOwnership renders ownership error BEFORE the resource creation hook fires, so this attack cannot even reach the hook via normal navigation.
Controller gate: PRESENT (engine + screen-level)
Severity: N/A (double-blocked)

---

### Attack 9 — flyerBuilder Image Upload (§13.2 Invariant Attack)

**Scenario:** Actor B uploads a design image to Actor A's VPORT's design_asset storage scope.

OWNERSHIP BYPASS ATTEMPT
Target: uploadFlyerImageCtrl (flyerEditor.controller.js) → uploadMediaController
Attack vector: Authenticated Actor B calls upload with ownerActorId = Actor A's actorId
Result: BYPASSED
Evidence: VEN-CARD-001 — uploadFlyerImageCtrl has no ownership check before uploadMediaController. No call to requireOwnerActorAccess or assertActorOwnsVportActorController. Any authenticated user can upload to any VPORT's design_asset scope.
Controller gate: ABSENT
Blast Radius: MEDIUM — can corrupt target VPORT's design assets; cannot escalate to data exfiltration or account takeover
Severity: HIGH
VENOM Cross-Reference: VEN-CARD-001 (OPEN, THOR BLOCKER)
§13 Invariant violated: §13.2 — "A user must never upload to another VPORT's design_asset storage scope"

---

### Attack 10 — serviceLabelSnapshot Forgery

**Scenario:** VPORT owner creates a booking with an arbitrary service label not in their catalog.

MUTATION REPLAY ATTEMPT
Target resource: createOwnerBookingController → insertVportBookingDAL
Resource state at time of replay: Normal (no terminal state)
Result: PARTIAL
Evidence: serviceLabelSnapshot accepted from caller (falls back to "Appointment" if null). Owner can supply any string. No catalog lookup performed. Public booking path resolves label server-side via readVportServiceByIdDAL.
State check: ABSENT (label validation)
Severity: LOW — self-harm only; owner cannot attack other actors' data via this path. Data integrity concern for reporting/export only.
VENOM Cross-Reference: VEN-MOD7-16-001

---

### Attack 11 — customerName/customerNote Injection

**Scenario:** Unauthenticated user submits booking with oversized or HTML-containing customerName.

VIEWER CONTEXT FUZZ ATTEMPT
Target: createVportPublicBookingController → insertVportBookingDAL
Injected context: customerName = "<script>alert(1)</script>" or 50,000-character string
Expected result: REJECT or SANITIZE
Actual result: STORED (no validation)
Context validation: ABSENT
Evidence: customerName and customerNote accepted without length limit, without HTML stripping, stored to vport.bookings. Risk materializes at render layer if owner's dashboard displays these fields via dangerouslySetInnerHTML (not verified in this run).
Severity: LOW — stored XSS only if render layer is unsafe (React default escaping mitigates in most cases). Payload delivery requires VPORT owner to view the booking in dashboard.
VENOM Cross-Reference: VEN-MOD7-16-002

---

### Attack 12 — Design Document Cross-Actor Access

**Scenario:** Actor B opens Actor A's design document via the flyerBuilder.

OWNERSHIP BYPASS ATTEMPT
Target: requireDesignDocumentOwnerAccess → designStudio.write.dal
Attack vector: Supply document.id for Actor A's document; ownerActorId = Actor B's actorId
Result: BLOCKED
Evidence: requireDesignDocumentOwnerAccess verifies (1) actor_owners lookup via requireOwnerActorAccess(ownerActorId), AND (2) document.owner_actor_id === ownerActorId. Both must pass. Actor B fails step (1) — not in actor_owners for Actor A. Document never fetched.
Controller gate: PRESENT (dual-layer)
Severity: N/A (double-blocked)

---

## 6. Exploitability Assessment

| Surface | Attacks Attempted | BYPASSED | BLOCKED | PARTIAL | NOT_REACHABLE |
|---|---|---|---|---|---|
| updateVportBookingDAL | 3 (owner bypass, terminal replay, customer abuse) | 0 | 3 | 0 | 0 |
| gasprices DALs | 1 (non-owner approval) | 0 | 1 | 0 | 0 |
| upsertVportPublicDetailsDAL | 1 (settings bypass) | 0 | 1 | 0 | 0 |
| upsertVportRateDal | 2 (non-owner, type confusion) | 0 | 2 | 0 | 0 |
| insertVportResourceDAL (dashboard) | 1 (reachability) | 0 | 0 | 0 | 1 |
| dalInsertBookingResource (engine, via calendar) | 1 (calendar resource bypass) | 0 | 1 | 0 | 0 |
| design upload (uploadMediaController) | 1 (cross-actor upload) | 1 | 0 | 0 | 0 |
| insertVportBookingDAL (owner path) | 1 (serviceLabelSnapshot) | 0 | 0 | 1 | 0 |
| insertVportBookingDAL (public path) | 1 (customerName injection) | 0 | 0 | 1 | 0 |
| designStudio.write.dal | 1 (cross-actor doc access) | 0 | 1 | 0 | 0 |

**Total:** 12 scenarios | 1 BYPASSED | 9 BLOCKED | 2 PARTIAL | 1 NOT_REACHABLE

---

## 7. Source Verification Summary

Total attack scenarios attempted: 12
Scenarios source-verified: 12 / 12
BYPASSED findings: 1 — all [SOURCE_VERIFIED]: YES
BLOCKED findings: 9
PARTIAL findings: 2
NOT_REACHABLE findings: 1

Source files read:
- `engines/booking/src/controller/ensureOwnerBookingResource.controller.js` — Attack 7 and 8 (calendar resource chain)
- All other verifications used VENOM run source reads (read in prior session, carried forward)

---

## 8. Confidence Summary

Scenarios from HIGH confidence sources: 10
Scenarios from LOW confidence sources: 1 (CHAIN-004 — resolved to HIGH in VENOM, confirmed here)
[SOURCE_VERIFIED] results: 12
[SCANNER_LEAD] results: 0
BYPASSED findings confirmed [SOURCE_VERIFIED]: YES (VEN-CARD-001 prior confirmation)

---

## 8.1 SOURCE READ SUMMARY

| Command | Source Files Read | Evidence Bundle Used | Full Rediscovery Performed |
|---|---:|---|---|
| BLACKWIDOW | 1 | YES — ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/ARCHITECT/evidence-bundle.json | NO |

Files read (targeted adversarial verification only):
- `engines/booking/src/controller/ensureOwnerBookingResource.controller.js` — reason: Attack 7+8 (calendar resource DAL chain — ARCHITECT misclassified calendar as stub; needed to verify the actual resource creation chain)

---

## 9. §13 Invariant Attack Map

(from BEHAVIOR.md §13 Must Never Happen)

| §13 Invariant | Attack Attempted | Result | Finding |
|---|---|---|---|
| §13.1 — No cross-actor lead/team/booking/settings/portfolio mutation | Booking update with Actor A's bookingId as Actor B | BLOCKED | N/A |
| §13.2 — No upload to another VPORT's design_asset scope | uploadFlyerImageCtrl with forged ownerActorId | BYPASSED | VEN-CARD-001 (existing THOR blocker) |
| §13.3 — Non-owner must not see dashboard card content | N/A — OwnerOnlyDashboardGuard is UI-only; write surfaces independently verified | UI-ONLY GATE — write surfaces BLOCKED independently | N/A |
| §13.4 — No terminal booking mutation | Update completed/cancelled booking | BLOCKED | N/A |
| §13.5 — No void realm for fuel price posts | Gas price submission via void session | BLOCKED (resolvePublicRealmIdDAL always used) | N/A |
| §13.6 — Blocked VPORT cannot access dashboard | N/A — BlockedVportGuard is route-layer; out of scope this run | N/A | N/A |
| §13.7 — Design doc owner must match request | Open Actor A's document as Actor B | BLOCKED (dual-layer: actor_owners + document.owner_actor_id) | N/A |

**§13.2 Violation:** BYPASSED — VEN-CARD-001 is an open THOR blocker confirming §13.2 is currently violated for the flyerBuilder upload path.

---

## 10. Behavior Contract Attack Summary

BEHAVIOR.md: ACTIVE (authored 2026-06-05)
§9 (Must Never Happen) section: Present as §13 in dashboard BEHAVIOR.md

| Invariant | Attack | BLOCKED/BYPASSED | Harness Required |
|---|---|---|---|
| §13.2 | Cross-VPORT upload | BYPASSED (VEN-CARD-001) | SPIDER-MAN TESTREQ: test that uploadFlyerImageCtrl rejects non-owner ownerActorId |
| §13.1 | Cross-actor booking mutation | BLOCKED | SPIDER-MAN TESTREQ: regression test assertActorOwnsVportActorController |
| §13.4 | Terminal booking mutation | BLOCKED | SPIDER-MAN TESTREQ: regression test TERMINAL_STATUSES guard |

---

## 11. THOR Impact

**BYPASSED findings that are THOR release blockers:**
- VEN-CARD-001 — flyerBuilder upload ownership bypass (HIGH, THOR BLOCKER, EXISTING) — §13.2 violated

**BLACKWIDOW-specific THOR impact:**
- No new THOR blockers introduced by this run
- Existing THOR blockers confirmed still open: VEN-CARD-001

**New finding: Dashboard insertVportResourceDAL should be DELETED**
- Not a THOR blocker but a cleanup hygiene item — dead code with dangerous characteristics (no field whitelist, no ownership)
- Recommendation: P3 ticket to delete this function before any future developer creates a new consumer

---

## 12. SPIDER-MAN Test Requirements

| TESTREQ | Source | Priority | Description |
|---|---|---|---|
| TESTREQ-BW-MOD7-16-001 | §13.2 | P0 | When uploadFlyerImageCtrl is patched (VEN-CARD-001), add regression test: non-owner actor cannot upload to target VPORT's design_asset scope |
| TESTREQ-BW-MOD7-16-002 | §13.1 | P1 | Regression: updateBookingStatusController rejects non-owner actor for status changes |
| TESTREQ-BW-MOD7-16-003 | §13.4 | P1 | Regression: terminal booking (completed/cancelled/no_show) cannot be transitioned to any other state |
| TESTREQ-BW-MOD7-16-004 | §13.7 | P1 | Regression: design document write rejected when ownerActorId does not match document.owner_actor_id |
| TESTREQ-BW-MOD7-16-005 | Attack 7 | P2 | Verify: insertVportResourceDAL in dashboard remains unreachable (0 import consumers) — or delete the function |

---

## BLACKWIDOW FINDINGS

### BW-MOD7-16-001
**Severity:** LOW
**Result:** NOT_REACHABLE — LATENT DEAD CODE
**Provenance:** [SOURCE_VERIFIED]
**Status:** OPEN

**Title:** Dashboard `insertVportResourceDAL` has no field whitelist and is dead code — delete to prevent future misuse

BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-MOD7-16-001
- Scenario: Dashboard resource DAL reachability probe
- Target: apps/VCSM/src/features/dashboard/vport/dal/write/vportResource.write.dal.js → insertVportResourceDAL
- Application Scope: VCSM
- Platform Surface: Internal dashboard
- Attack Vector: Any hook/controller wiring insertVportResourceDAL; attempted to find caller chain
- Exploit Chain Type: Dead code re-activation (future developer wires DAL without proper guards)
- Governance Status: DRAFT
- Result: NOT_REACHABLE — 0 consumers confirmed; calendar uses engine DAL (dalInsertBookingResource), not this function
- Evidence: engines/booking/src/controller/ensureOwnerBookingResource.controller.js line 3 imports dalInsertBookingResource (not insertVportResourceDAL). Dashboard DAL has no callers.
- Defense Gate: N/A (unreachable — but dangerous if wired)
- Blast Radius: NONE (current); MEDIUM (if re-activated without guards — owner_actor_id settable by caller)
- Severity: LOW (current risk = 0; future risk = HIGH if wired)
- VENOM Finding Cross-Reference: VEN-DASHBOARD-004 (existing), BW-DASH-003 (existing)
- Recommended Fix: Delete insertVportResourceDAL from vportResource.write.dal.js. Resource creation is owned by engines/booking. The engine controller has proper ownership enforcement. The dashboard DAL is dead code.
- Layer to Fix: DAL — deletion
- Required Follow-up Command: None (low priority; P3 cleanup)

---

### BW-MOD7-16-002
**Severity:** HIGH (EXISTING — confirmed still BYPASSED)
**Result:** BYPASSED [SOURCE_VERIFIED]
**Status:** OPEN — THOR BLOCKER

**Title:** §13.2 violated — uploadFlyerImageCtrl has no ownership check (VEN-CARD-001 re-confirmed)

BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-MOD7-16-002
- Scenario: §13.2 invariant attack — cross-VPORT design asset upload
- Target: flyerEditor.controller.js → uploadFlyerImageCtrl → uploadMediaController
- Application Scope: VCSM
- Platform Surface: flyerBuilder (authenticated)
- Attack Vector: Authenticated Actor B supplies ownerActorId = Actor A's actorId to the upload endpoint; no server-side ownership re-verification
- Exploit Chain Type: Missing pre-condition — no ownership gate before privileged write
- Governance Status: DRAFT
- Result: BYPASSED (confirmed from VEN-CARD-001 source read in Phase 1b; §13.2 invariant violated)
- Evidence: Phase 1b VENOM report — uploadFlyerImageCtrl has no call to requireOwnerActorAccess before uploadMediaController. Controller accepts ownerActorId from caller.
- Defense Gate: ABSENT
- Blast Radius: MEDIUM — write access to target VPORT's design_asset storage scope
- Severity: HIGH
- VENOM Finding Cross-Reference: VEN-CARD-001 (OPEN, THOR BLOCKER)
- Recommended Fix: Add requireOwnerActorAccess(ownerActorId) as first line of uploadFlyerImageCtrl (template in venom-rerun-phase1b.md)
- Layer to Fix: Controller
- Required Follow-up Command: ELEKTRA (patch advisor), THOR (release gate)

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| SPIDER-MAN | TESTREQ-BW-MOD7-16-001 through 005 — regression coverage | PENDING |
| THOR | VEN-CARD-001/BW-MOD7-16-002 — release blocker assessment | PENDING |
| ELEKTRA | Modules 7–16 patch scan | PENDING (this session) |
