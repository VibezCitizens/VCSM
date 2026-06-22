# BlackWidow V2 Adversarial Review — professional

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | professional |
| App | VCSM |
| Review Date | 2026-06-04 |
| Reviewer | BLACKWIDOW V2 (BW2.5 V2) |
| Scanner Version | 1.1.0 |
| Scanner Maps Generated | 2026-06-04T19:48:25.152Z (FRESH — approximately 7 hours old) |
| Behavior Contract Status | PLACEHOLDER — §4 and §9 sections do not exist |
| VENOM Findings Cross-Referenced | 7 (VEN-PROFESSIONAL-001 through VEN-PROFESSIONAL-007) |
| ELEKTRA Run | NEVER |
| Total BW Findings | 8 (0 CRITICAL, 3 HIGH, 3 MEDIUM, 2 LOW) |

---

## 2. Scanner Preflight

- Scanner status: FRESH
- Timestamp: 2026-06-04T19:48:25.152Z
- Scanner version: 1.1.0
- Security paths attributed to professional in scanner: 1 (LOW confidence — unresolved sourceRoute)
- Total platform security paths: 598
- Write surfaces detected: 1 (dalMarkProfessionalBriefingsSeen → vc.notifications UPDATE)
- RPC surfaces: 0
- Edge functions: 0

---

## 3. Scanner Inputs Block

### Security Path Map (professional)
- 1 path extracted, confidence: LOW
- Evidence: "write surface discovered without route-confirmed path; potential surface only"
- Write operation: UPDATE on vc.notifications via dalMarkProfessionalBriefingsSeen
- Route: null (unresolved)
- Access: unknown

### Callgraph
- 71 nodes, 64 edges attributed to professional
- By layer: component:27, controller:5, dal:2, hook:2, model:12, module:9, screen:14
- Entry points: useProfessionalBriefings (hook), useEnterpriseWorkspace (hook)
- Controller entries: ctrlListProfessionalBriefings, ctrlMarkProfessionalBriefingsSeen

### Write Execution Map
- Result: 0 paths (professional not resolved in write-execution-map)

### RPC Execution Map
- Result: 0 paths (no RPCs for professional)

---

## 4. Attack Surface Inventory

### Security Paths

| Path | Table | Operation | Confidence | Route Resolved |
|---|---|---|---|---|
| dalMarkProfessionalBriefingsSeen | vc.notifications | UPDATE | HIGH (write extracted) | NO — sourceRoute null |

The single scanner-attributed path is LOW-confidence overall because sourceRoute is null. This is the PRIMARY ATTACK TARGET per Rule BW-002.

### Hook Entry Points (UI-Accessible)

| Hook | File | Writes |
|---|---|---|
| useProfessionalBriefings | briefings/hooks/useProfessionalBriefings.js | markVisibleSeen → ctrlMarkProfessionalBriefingsSeen → dalMarkProfessionalBriefingsSeen |
| useEnterpriseWorkspace | enterprise/hooks/useEnterpriseWorkspace.js | writeWorkspacePrefs (localStorage only, no DB writes) |

### DAL Write Surfaces

| Function | File | Table | Filter |
|---|---|---|---|
| dalMarkProfessionalBriefingsSeen | professionalBriefings.read.dal.js | vc.notifications | .eq('recipient_actor_id', recipientActorId) + .in('id', notificationIds) |

### DAL Read Surfaces

| Function | File | Table | Filter |
|---|---|---|---|
| dalListProfessionalBriefings | professionalBriefings.read.dal.js | vc.notifications | .eq('recipient_actor_id', recipientActorId) |

### Callgraph Backwards Trace — DAL Write to Hook

```
AddForm.jsx (UI)
  → onSubmitHousing / onSubmitFacility callbacks
  → NurseHomeScreenView (local state only — no DAL)

ProfessionalBriefingsScreen.jsx (UI)
  → actorId from useIdentity() [SOURCE_VERIFIED — line 8]
  → ProfessionalBriefingsScreenView.jsx (prop: actorId)
  → useProfessionalBriefings({ actorId })
  → markVisibleSeen() → ctrlMarkProfessionalBriefingsSeen({ actorId, notificationIds })
  → dalMarkProfessionalBriefingsSeen({ recipientActorId: actorId, notificationIds })
  → vc.notifications UPDATE
```

---

## 5. Scanner Signals Block

| Signal | Value |
|---|---|
| Routes confirmed | 0 of 1 path |
| Write surfaces | 1 |
| Read surfaces | 1 |
| RPC surfaces | 0 |
| Low-confidence surfaces | 1 (the only surface) |
| UNANCHORED §9 invariants | ALL (BEHAVIOR.md is PLACEHOLDER) |

The scanner confirms the write path exists and the confidence for the write extraction itself is HIGH (AST-confirmed). The LOW overall path confidence is due to missing sourceRoute — meaning the scanner could not confirm the UI-to-DAL callchain from routing alone. Source code reading in Steps 3–4 above confirms the chain is real and live.

---

## 6. Adversarial Path Analysis

### A. OWNERSHIP BYPASS (§5.1)

**Target:** ctrlMarkProfessionalBriefingsSeen / dalMarkProfessionalBriefingsSeen

**Attack:** An actor passes notificationIds belonging to another actor's notifications. If the UPDATE filters only on notificationIds without a recipient ownership check, and RLS is absent or permissive, the attacker marks another actor's notifications as seen.

**Source Inspection:**

- listProfessionalBriefings.controller.js line 59–68: ctrlMarkProfessionalBriefingsSeen accepts actorId and notificationIds from the caller.
- listProfessionalBriefings.controller.js line 62: Guard is `if (!actorId || notificationIds.length === 0) return` — presence check only. No verification that the supplied notificationIds actually belong to the supplied actorId.
- professionalBriefings.read.dal.js lines 49–55: The UPDATE uses `.eq('recipient_actor_id', recipientActorId).in('id', notificationIds)`. The double filter (recipientActorId AND id IN list) means the UPDATE only affects rows where both conditions match.

**Assessment:** The double-filter pattern in the DAL is an effective ownership corroboration mechanism in the query itself. An attacker supplying foreign notification IDs will receive no matching rows because the `recipient_actor_id` filter will exclude them. However, this ownership check occurs at the DAL layer (query filter), not the controller layer (explicit ownership assertion). If RLS is absent on vc.notifications UPDATE, the DAL double-filter is the sole barrier.

**Finding:** BW-PROF-001 — DAL-level double-filter provides functional ownership protection for the UPDATE path, but there is no controller-layer ownership assertion confirming the actorId owns the supplied notificationIds before issuing the query. This is a defense-in-depth gap, not a bypass, IF RLS is also present.

**Result:** PARTIAL — functionally protected by query filter; controller ownership assertion absent; RLS status unverified.

---

### B. SESSION MUTATION (§5.2)

**Target:** useProfessionalBriefings → actorId origin

**Attack:** Swap the actorId passed to the hook with an attacker-controlled value to read or mark another actor's notifications.

**Source Inspection:**

- ProfessionalBriefingsScreen.jsx line 7–8: `const { identity } = useIdentity()` and `const actorId = identity?.actorId ?? null`. The actorId is sourced from the identity adapter (session-derived). [SOURCE_VERIFIED: ProfessionalBriefingsScreen.jsx:8]
- ProfessionalBriefingsScreen.jsx line 10: `if (!actorId) return <Navigate to="/feed" replace />` — null actorId redirects without rendering the view.
- The actorId is passed as a prop to ProfessionalBriefingsScreenView, which passes it to useProfessionalBriefings.

**Assessment:** actorId originates from the session-trusted identity adapter, not from client payload or URL parameters. No client-controlled actorId injection path exists through the briefings screen.

**Finding:** None — actorId is session-derived. BLOCKED.

**Result:** BLOCKED [SOURCE_VERIFIED: ProfessionalBriefingsScreen.jsx:7-10]

---

### C. RUNTIME ABUSE (§5.3) — Profession Verification Gate

**Target:** ProfessionalAccessScreen → NurseHomeScreen → NurseHomeScreenView

**Attack:** An authenticated but non-nurse user navigates to the professional workspace route. The screen copy says "verified nurses only" but the access check is the hardcoded prop `profession="nurse"` passed from ProfessionalAccessScreen.jsx.

**Source Inspection:**

- ProfessionalAccessScreen.jsx line 38: `<NurseHomeScreen profession="nurse" />` — hardcoded string, not derived from user's verified profession.
- NurseHomeScreen.jsx line 6: Guard is `if (profession !== 'nurse') { return nurse-only UI }` — but since the caller always passes "nurse", this guard can never trigger from ProfessionalAccessScreen.
- No call to any identity check, actor kind check, or DB-verified profession claim in this path. Any authenticated user who can navigate to the professional route will receive the full NurseHomeScreenView.

**Finding:** BW-PROF-002 — HIGH — Profession verification gate is non-functional. ProfessionalAccessScreen hardcodes `profession="nurse"`, bypassing the guard in NurseHomeScreen entirely. Any authenticated user reaches the nurse workspace. This is a runtime-confirmed bypass of the stated access control. [SOURCE_VERIFIED: ProfessionalAccessScreen.jsx:38, NurseHomeScreen.jsx:6]

**Result:** BYPASSED [SOURCE_VERIFIED: ProfessionalAccessScreen.jsx:38]

---

### D. RLS VERIFICATION (§5.4)

**Target:** vc.notifications — dalMarkProfessionalBriefingsSeen (UPDATE) and dalListProfessionalBriefings (SELECT)

**Attack:** If vc.notifications lacks RLS policies for UPDATE and SELECT, the Supabase client operating under any authenticated session could access any row.

**Source Inspection:**

- professionalBriefings.read.dal.js lines 10–38: SELECT uses `.eq('recipient_actor_id', recipientActorId)` — application-layer filter only.
- professionalBriefings.read.dal.js lines 49–55: UPDATE uses `.eq('recipient_actor_id', recipientActorId).in('id', notificationIds)` — application-layer filter only.
- VEN-PROFESSIONAL-002 (open): RLS ownership enforcement on vc.notifications UPDATE unverified.
- VEN-PROFESSIONAL-003 (open): RLS SELECT policy on vc.notifications absent status unverified.
- No DB schema inspection was performed (out of scope for BW — no production DB access).

**Assessment:** Both reads and writes to vc.notifications in the professional feature depend exclusively on application-layer filters. If RLS is absent or too permissive, these filters are bypassable at the SDK level. VENOM has documented this concern as open. BW confirms the attack surface is real and the code provides no redundant protection beyond the query filters.

**Finding:** BW-PROF-003 — HIGH — vc.notifications SELECT and UPDATE in the professional briefings path have no confirmed RLS. Application-layer filters (recipient_actor_id equality) are the sole ownership barrier. Cross-actor notification read and mark-seen are theoretically possible if RLS is absent. Corroborates and extends VEN-PROFESSIONAL-002/003. [SOURCE_VERIFIED: professionalBriefings.read.dal.js:28, 53]

**Result:** UNRESOLVED — RLS status not verifiable from source; application-layer filter confirmed present; breach risk is HIGH if RLS is absent.

---

### E. VIEWER CONTEXT FUZZING (§5.5)

**Target:** ctrlListProfessionalBriefings and ctrlMarkProfessionalBriefingsSeen with null/undefined actorId

**Attack:** Pass null or undefined actorId to both controllers.

**Source Inspection:**

- listProfessionalBriefings.controller.js line 37–39: `if (!actorId) { throw new Error('[professional/briefings] actorId required') }` — null/undefined actorId throws, does not silently continue.
- listProfessionalBriefings.controller.js line 62: `if (!actorId || notificationIds.length === 0) return` — null actorId returns early (silent no-op, not a throw). This is inconsistent with the list controller behavior, but the net effect is safe: no DB operation occurs.
- professionalBriefings.read.dal.js line 8: `if (!recipientActorId) return []` — DAL null guard present.
- professionalBriefings.read.dal.js line 45: `if (!recipientActorId || ...) return` — DAL null guard present on write.

**Assessment:** Null actorId is handled at both controller and DAL layers. No path to a DB operation with null actorId exists.

**Finding:** BW-PROF-004 — LOW — ctrlMarkProfessionalBriefingsSeen silently returns on null actorId (no throw) while ctrlListProfessionalBriefings throws. Inconsistent error contract is an observability gap but not an exploitable security hole. [SOURCE_VERIFIED: listProfessionalBriefings.controller.js:37-38, 62]

**Result:** BLOCKED — no DB reach with null actorId; inconsistency is LOW severity.

---

### F. MUTATION REPLAY (§5.6)

**Target:** dalMarkProfessionalBriefingsSeen — can already-seen notifications be re-triggered?

**Attack:** Call markVisibleSeen repeatedly; pass already-seen notification IDs; re-mark already-seen items.

**Source Inspection:**

- professionalBriefings.read.dal.js lines 49–55: UPDATE sets is_seen = true with no conditional check (e.g., no WHERE is_seen = false).
- useProfessionalBriefings.js lines 49–51: `const unseen = items.filter((item) => !item.isSeen).map((item) => item.id)` — the hook filters to only unseen items before calling the controller.
- The hook-level filter prevents sending already-seen IDs in normal flow. However, a caller could bypass the hook and call ctrlMarkProfessionalBriefingsSeen directly with any notificationIds.

**Assessment:** The replay protection exists only at the hook layer. The controller and DAL perform no idempotency check. For an authenticated actor calling their own notifications, re-marking as seen is a no-op (already true). There is no secondary side effect (no state machine, no financial action, no credit burn). Risk is LOW: the worst outcome is a wasted DB write.

**Finding:** BW-PROF-005 — LOW — Mark-seen has no idempotency guard at controller/DAL layer. Hook-layer filter is the only replay barrier. For this operation (boolean flag) the real-world impact is a wasted DB roundtrip. Not exploitable for harm against this feature. [SOURCE_VERIFIED: professionalBriefings.read.dal.js:49-55, useProfessionalBriefings.js:49-51]

**Result:** BLOCKED at hook layer — LOW severity gap at controller/DAL.

---

### G. HYDRATION POISONING (§5.7)

**Target:** Professional feature — does it interact with the platform hydration store?

**Source Inspection:**

- Survey of all 10 professional JS files and JSX components: no import of any hydration adapter, identity hydration store, or actor cache was found.
- The enterprise workspace uses only static seed data and localStorage prefs.
- The briefings system reads from vc.notifications and renders directly; no hydration store interaction.

**Assessment:** The professional feature does not consume or mutate the hydration store. This attack surface is not applicable.

**Finding:** None — hydration poisoning surface does not exist for this feature.

**Result:** NOT APPLICABLE.

---

### H. URL SURFACE (§5.9) — Open Redirect / Protocol Injection

**Target:** linkPath field from vc.notifications rendered as navigation target

**Attack:** A maliciously crafted notification with `link_path = "javascript:alert(1)"` or `link_path = "https://evil.com"` is stored in the DB and served to the user. When the user clicks a briefing item, the unsanitized linkPath is passed directly to `navigate()`.

**Source Inspection:**

- professionalBriefings.read.dal.js line 22: `link_path` is included in the SELECT column list.
- professionalBriefing.model.js line 55: `linkPath: row.link_path ?? null` — raw DB value passed through without sanitization.
- ProfessionalBriefingsScreenView.jsx line 63–65: `onOpenItem={(item) => { if (item.linkPath) navigate(item.linkPath) }}` — linkPath is passed directly to React Router's navigate(). [SOURCE_VERIFIED: ProfessionalBriefingsScreenView.jsx:63-65]

**Assessment:** React Router's navigate() is not a href setter — it uses the History API internally. For relative paths (e.g., `/feed/123`), it navigates in-app safely. For absolute URLs or javascript: protocols, React Router v6 will attempt to use window.history.pushState with the raw string. In modern React Router v6, `navigate("javascript:...")` does not execute JS but does push a malformed history state. However, `navigate("https://evil.com")` could produce unexpected behavior depending on browser and router version. The VEN-PROFESSIONAL-004 finding (open redirect / JS protocol injection) is confirmed by source inspection.

**Finding:** BW-PROF-006 — MEDIUM — linkPath from vc.notifications is passed unsanitized to navigate(). If a malicious or corrupted notification record contains an absolute URL or protocol-relative path, the navigate() call could trigger unexpected behavior. React Router does not execute javascript: protocols but does not sanitize input. The source of the link_path value (DB-origin, potentially from notification dispatch systems) should be treated as untrusted. Corroborates VEN-PROFESSIONAL-004. [SOURCE_VERIFIED: ProfessionalBriefingsScreenView.jsx:63-65, professionalBriefing.model.js:55]

**Result:** PARTIAL — javascript: execution blocked by React Router; open-redirect to external origin is plausible.

---

### I. §9 INVARIANT ATTACK (HIGHEST PRIORITY)

**Status:** BEHAVIOR.md is PLACEHOLDER. §9 Must Never Happen section does not exist. All §9 invariants are UNANCHORED.

**Inferred Invariants from System Design:**

Based on feature context, platform rules, and VENOM findings, the following behavioral invariants are reasonably inferred:

1. A user must never read another user's notifications through the professional briefings feed.
2. A user must never mark another user's notifications as seen.
3. Professional workspace access must be restricted to verified profession holders.
4. Compliance-domain briefings (HIPAA-tagged notifications) must never leak to non-professionals.

**Attack against Invariant 1 (Cross-actor notification read):**

If a valid actorId is passed to ctrlListProfessionalBriefings for actor B by an authenticated actor A (e.g., by modifying the hook call or invoking the controller directly), and RLS SELECT is absent on vc.notifications, actor A would receive actor B's notifications.

The only application-layer barrier is `.eq('recipient_actor_id', recipientActorId)` in the DAL. The controller does not verify that the calling session matches the actorId parameter. This invariant is UNRESOLVED against RLS absence.

**Attack against Invariant 3 (Profession gate bypass):**

Confirmed BYPASSED — see BW-PROF-002. ProfessionalAccessScreen passes hardcoded `profession="nurse"` to NurseHomeScreen, rendering the gate non-functional. Any authenticated user can reach the nurse workspace.

**Finding:** BW-PROF-007 — MEDIUM — §9 invariants are entirely unanchored (BEHAVIOR.md is PLACEHOLDER). Inferred invariant 3 (profession gate) is confirmed bypassed (BW-PROF-002). Inferred invariant 1 (cross-actor notification isolation) is UNRESOLVED pending RLS verification. [SOURCE_VERIFIED: BEHAVIOR.md status=PLACEHOLDER]

**Finding:** BW-PROF-008 — HIGH — BEHAVIOR.md remains PLACEHOLDER with no §9 Must Never Happen section. The feature has a live DB write surface (vc.notifications UPDATE) and a compliance-domain read surface with no codified security invariants. Corroborates VEN-PROFESSIONAL-001. This is a governance and release blocker. [SOURCE_VERIFIED: BEHAVIOR.md:1-9]

---

## 7. Exploitability Assessment

| Finding | Severity | Exploitability | Pre-conditions |
|---|---|---|---|
| BW-PROF-001 | MEDIUM | LOW | Requires ability to guess foreign notification IDs AND absent RLS |
| BW-PROF-002 | HIGH | HIGH | Any authenticated user; navigate to professional route |
| BW-PROF-003 | HIGH | MEDIUM | Requires absent RLS; Supabase SDK access required |
| BW-PROF-004 | LOW | NONE | No DB reach |
| BW-PROF-005 | LOW | NONE | No harmful outcome; idempotent write |
| BW-PROF-006 | MEDIUM | LOW | Requires malicious notification record in DB |
| BW-PROF-007 | MEDIUM | HIGH (invariant 3) | Any authenticated user |
| BW-PROF-008 | HIGH | N/A (governance) | N/A |

---

## 8. Source Verification Summary

| File | Lines Verified | Status |
|---|---|---|
| briefings/controller/listProfessionalBriefings.controller.js | 1–69 | VERIFIED |
| briefings/dal/professionalBriefings.read.dal.js | 1–57 | VERIFIED |
| briefings/hooks/useProfessionalBriefings.js | 1–81 | VERIFIED |
| briefings/model/professionalBriefing.model.js | 1–98 | VERIFIED |
| briefings/screen/ProfessionalBriefingsScreen.jsx | 1–13 | VERIFIED |
| briefings/view/ProfessionalBriefingsScreenView.jsx | 1–71 | VERIFIED |
| briefings/components/BriefingsList.jsx | 1–80 | VERIFIED |
| screens/ProfessionalAccessScreen.jsx | 1–50 | VERIFIED |
| professional-nurse/screens/NurseHomeScreen.jsx | 1–19 | VERIFIED |
| professional-nurse/screens/NurseHomeScreenView.jsx | 1–158 | VERIFIED |
| professional-nurse/housing/ui/AddHousingExperienceForm.jsx | 1–111 | VERIFIED |
| core/storage/professionalAccess.storage.js | 1–49 | VERIFIED |
| core/config/professionCatalog.config.js | 1–44 | VERIFIED |
| enterprise/hooks/useEnterpriseWorkspace.js | 1–61 | VERIFIED |
| enterprise/model/buildEnterpriseView.model.js | 1–79 | VERIFIED |
| enterprise/data/enterpriseSeed.data.js | 1–160 | VERIFIED |
| ZZnotforproduction/.../BEHAVIOR.md | 1–9 | VERIFIED — PLACEHOLDER |
| ZZnotforproduction/.../SECURITY.md | 1–39 | VERIFIED |

All BYPASSED findings carry SOURCE_VERIFIED citations.

---

## 9. Confidence Summary

| Finding | Confidence | Basis |
|---|---|---|
| BW-PROF-001 | HIGH | Source + scanner corroboration |
| BW-PROF-002 | HIGH | Source — direct code path traced |
| BW-PROF-003 | MEDIUM | Source confirms no app-layer RLS; DB state unverifiable |
| BW-PROF-004 | HIGH | Source — both layers read |
| BW-PROF-005 | HIGH | Source — hook and DAL layers read |
| BW-PROF-006 | HIGH | Source — render path and model traced |
| BW-PROF-007 | HIGH | Source — BEHAVIOR.md confirmed PLACEHOLDER |
| BW-PROF-008 | HIGH | Source — BEHAVIOR.md confirmed PLACEHOLDER |

---

## 10. §9 Invariant Attack Map

| Inferred Invariant | Attack | Result |
|---|---|---|
| Cross-actor notifications must never be readable | Pass foreign actorId to ctrlListProfessionalBriefings | UNRESOLVED — blocked by app-layer filter; RLS unverified |
| Cross-actor notifications must never be mark-seen writable | Pass foreign notificationIds to ctrlMarkProfessionalBriefingsSeen | BLOCKED — double-filter at DAL; RLS unverified |
| Profession verification gate must restrict access | Navigate to professional route as non-nurse user | BYPASSED — hardcoded profession="nurse" renders gate inert |
| linkPath must not enable open redirect or JS injection | Craft malicious link_path in notification DB record | PARTIAL — React Router blocks JS execution; external URL redirect possible |

---

## 11. Behavior Contract Attack Summary

BEHAVIOR.md is in PLACEHOLDER status. Sections §4 (Failure Paths) and §9 (Must Never Happen) do not exist. All security invariants for this feature are unanchored.

Consequence: no baseline exists against which to certify correct behavior. The PLACEHOLDER status itself is a governance finding (BW-PROF-008) because the feature has a live DB write surface and a compliance-domain read surface. This is a THOR release blocker in governance terms.

The inferred invariant mapping above represents the closest available substitute. The profession gate bypass (BW-PROF-002) would be formally classified as a §9 invariant violation if the contract existed.

---

## 12. THOR Impact

| Finding | THOR Impact | Rationale |
|---|---|---|
| BW-PROF-002 | RELEASE BLOCKER | Profession gate is non-functional; workspace advertised as nurse-only is accessible to all authenticated users |
| BW-PROF-003 | RELEASE BLOCKER | vc.notifications read/write isolation unverified; compliance-domain content (HIPAA-tagged briefings) may be cross-actor accessible |
| BW-PROF-008 | RELEASE BLOCKER | DB write surface exists with no codified §9 invariants; BEHAVIOR.md must be authored before release |
| BW-PROF-001 | HOLD | Controller-layer ownership assertion missing; defense-in-depth gap; acceptable pending RLS confirmation |
| BW-PROF-006 | HOLD | linkPath open-redirect risk; sanitization should be added before production notification dispatch |
| BW-PROF-007 | HOLD | §9 invariants unanchored; BEHAVIOR.md authoring required |
| BW-PROF-004 | INFORMATIONAL | No release impact |
| BW-PROF-005 | INFORMATIONAL | No release impact |

Open THOR blockers from this run: BW-PROF-002, BW-PROF-003, BW-PROF-008
Combined with prior VENOM blockers (VEN-PROFESSIONAL-002, VEN-PROFESSIONAL-003), the feature has 5 THOR blockers total.

---

## 13. SPIDER-MAN Test Requirements

The following tests are required to close findings marked as BLOCKED or partially verified. Tests must be added before THOR clearance.

| Test ID | Finding | Description | Type |
|---|---|---|---|
| TEST-PROF-BW-001 | BW-PROF-001 | Assert that UPDATE on vc.notifications does not affect rows where recipient_actor_id does not match | Integration (Supabase) |
| TEST-PROF-BW-002 | BW-PROF-002 | Assert that ProfessionalAccessScreen redirects or blocks non-nurse actors when the session profession is not "nurse" | Unit (component) |
| TEST-PROF-BW-003 | BW-PROF-003 | Assert RLS SELECT policy on vc.notifications blocks cross-actor reads for professional briefings path | DB policy test |
| TEST-PROF-BW-004 | BW-PROF-005 | Assert ctrlMarkProfessionalBriefingsSeen is idempotent — second call with same IDs produces no side effect | Unit (controller) |
| TEST-PROF-BW-005 | BW-PROF-006 | Assert that linkPath values beginning with "http", "https", or "javascript:" are rejected or sanitized before navigate() is called | Unit (component) |
| TEST-PROF-BW-006 | BW-PROF-007 | Once BEHAVIOR.md is authored, assert each §9 invariant is covered by at least one test | Contract test |

---

*Report generated by BLACKWIDOW V2 on 2026-06-04. All findings are DRAFT governance status on first issuance. No production source code was modified.*
