# BLACKWIDOW V2 — Adversarial Runtime Verification Report
# Feature: dashboard | App: VCSM | Date: 2026-06-04

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report Version | BW2.5 V2 |
| Feature | dashboard |
| Application | VCSM |
| Run Date | 2026-06-04 |
| Analyst | BLACKWIDOW V2 |
| Scanner Preflight | FRESH (2026-06-04T19:48:25.152Z, scannerVersion 1.1.0) |
| Behavior Contract | PLACEHOLDER — §9 invariants UNANCHORED |
| VENOM Cross-Reference | 7 findings (1 HIGH, 3 MEDIUM, 2 LOW, 1 MEDIUM governance) |
| ELEKTRA Cross-Reference | NOT RUN |

---

## 2. Scanner Preflight

- Scanner version: 1.1.0
- Maps generated: 2026-06-04T19:48:25.152Z — FRESH (~7h old at run time)
- Security paths attributed to dashboard in scanner: 38
- All 38 paths carry confidence: LOW (no resolved sourceRoute on any path)
- Total platform security paths: 598
- Write execution map: 0 resolved write paths for dashboard (callgraph resolution gap)
- RPC execution map: 0 resolved RPC paths for dashboard

---

## 3. Scanner Inputs

| Map | Status |
|---|---|
| security-path-map.json | Loaded — 38 dashboard paths, all LOW confidence |
| callgraph.json | Loaded — 573 nodes, 897 edges attributed to dashboard |
| write-execution-map.json | Loaded — 0 dashboard resolved paths |
| rpc-execution-map.json | Loaded — 0 dashboard resolved paths |
| dead-export-map.json | Loaded — insertVportResourceDAL confirmed UNUSED_EXPORT (0 consumers) |

---

## 4. Attack Surface Inventory

### 4.1 Write Surfaces (38 total — all LOW confidence paths)

| Table | Operation | DAL Function | Controller Gated |
|---|---|---|---|
| bookings | INSERT | insertVportBookingDAL | createOwnerBookingController / createVportPublicBookingController |
| bookings | UPDATE | updateVportBookingDAL | updateBookingStatusController / rescheduleBookingController |
| resources | INSERT | insertVportResourceDAL | DEAD EXPORT — no live caller |
| resources | INSERT | insertTeamMemberDAL | addTeamMemberController (vportTeamAccess) |
| resources | INSERT | insertLinkedTeamMemberDAL | addTeamMemberController (vportTeamAccess) |
| resources | INSERT | insertTeamRequestDAL | sendTeamRequestController (vportTeam) |
| resources | UPDATE | updateTeamMemberRoleDAL | updateTeamMemberRoleController |
| resources | UPDATE | setTeamMemberActiveDAL | setTeamMemberStatusController |
| resources | UPDATE | acceptTeamRequestDAL | acceptTeamRequestController |
| resources | UPDATE | declineTeamRequestDAL | declineTeamRequestController |
| resources | UPDATE | acceptTeamInviteByActorDAL | acceptBarbershopInviteController |
| resources | DELETE | deleteTeamMemberByIdDAL | removeTeamMemberController |
| resources | DELETE | deleteTeamResourceDAL | (vportTeam) |
| profile_public_details | UPSERT | upsertVportPublicDetailsDAL | saveVportPublicDetailsByActorIdController |
| profile_public_details | UPSERT | saveFlyerPublicDetails | saveFlyerPublicDetailsCtrl |
| portfolio_media | UPDATE | updatePortfolioMediaAssetIdDAL | addPortfolioMediaWithRecord (fire-and-forget) |
| business_card_leads | UPDATE | markVportBusinessCardLeadContactedDAL | markVportLeadContactedController |
| business_card_leads | DELETE | deleteVportBusinessCardLeadDAL | deleteVportLeadController |
| fuel_prices | UPSERT | upsertVportFuelPriceDAL | submitOwnerFuelPriceUpdateController / reviewFuelPriceSuggestionController |
| fuel_prices | UPDATE | updateFuelPriceUnitForActorDAL | updateStationFuelUnitController |
| fuel_price_submissions | INSERT | createFuelPriceSubmissionDAL | submitCitizenFuelPriceSuggestionController |
| fuel_price_submissions | UPDATE | updateFuelPriceSubmissionStatusDAL | reviewFuelPriceSuggestionController |
| fuel_price_submission_reviews | INSERT | createFuelPriceSubmissionReviewDAL | reviewFuelPriceSuggestionController |
| fuel_price_submission_reviews | UPDATE | markFuelPriceSubmissionReviewAppliedDAL | (internal) |
| fuel_price_history | INSERT | createVportFuelPriceHistoryDAL | submitOwnerFuelPriceUpdateController / reviewFuelPriceSuggestionController |
| design_documents | INSERT | dalCreateDesignDocument | (designStudio load controller) |
| design_pages | INSERT | dalCreateDesignPage | ctrlCreateDesignPage |
| design_pages | UPDATE | dalUpdateDesignPageCurrentVersion | ctrlSaveDesignPageScene / ctrlCreateDesignPage |
| design_pages | UPDATE | dalClearDesignPageCurrentVersion | ctrlDeleteDesignPage |
| design_pages | DELETE | dalDeleteDesignPageById | ctrlDeleteDesignPage |
| design_page_versions | INSERT | dalCreateDesignPageVersion | ctrlSaveDesignPageScene / ctrlCreateDesignPage |
| design_page_versions | DELETE | dalDeleteDesignPageVersionsByPageId | ctrlDeleteDesignPage |
| design_assets | INSERT | dalCreateDesignAsset | ctrlUploadDesignAsset |
| design_exports | INSERT | dalCreateDesignExport | ctrlQueueDesignExport |
| design_exports | DELETE | dalDeleteDesignExportsByPageId | ctrlDeleteDesignPage |
| design_render_jobs | INSERT | dalCreateDesignRenderJob | ctrlQueueDesignExport |
| design_render_jobs | DELETE | dalDeleteDesignRenderJobsByPageId | ctrlDeleteDesignPage |

### 4.2 Hook Entry Points (UI-accessible attack surface)

- `useVportBookingActions` — triggers updateBookingStatusController with session actorId
- `useQuickBookingModal` — triggers createOwnerBookingController with session actorId
- `useVportBookingOps` — triggers createVportPublicBookingController (public, no auth required)
- `useFlyerEditor` — triggers saveFlyerPublicDetailsCtrl with vportId prop
- `useDesignStudio` / `useDesignStudioSceneActions` — triggers ctrlSaveDesignPageScene
- `useDesignStudioExports` — triggers ctrlQueueDesignExport
- `useSaveVportSettings` / `useSaveVportPublicDetailsByActorId` — triggers saveVportPublicDetailsByActorIdController
- `useVportLeads` — triggers leads controllers with session actorId
- `useSubmitFuelPriceSuggestion` — triggers submitFuelPriceSuggestionController
- `useGasUnitToggle` / `useUpdateStationFuelUnit` — triggers updateStationFuelUnitController
- `useVportTeam` / `useVportTeamAccess` — triggers team controllers
- `useBarberTeamRequests` — triggers invite/team-request controllers

### 4.3 PRIMARY ATTACK TARGETS (LOW confidence paths per Rule BW-002)

All 38 scanner paths are LOW confidence (no resolved sourceRoute). Highest priority targets:
1. `insertVportResourceDAL` — DEAD EXPORT, no controller gate possible (VEN-DASHBOARD-004 cross-ref)
2. `updateBookingStatusController` — customer path: null `vportActorId` branch
3. `acceptTeamRequestController` — ownership check targets `member_actor_id` not VPORT owner
4. `saveFlyerPublicDetails` (flyer.write.dal.js) — dual ownership model; no RLS backstop known
5. `createVportPublicBookingController` — public endpoint, guest bookings, no auth required

---

## 5. Scanner Signals

- All 38 security paths: LOW confidence — no routes resolved at scanner time
- 0 resolved write execution paths
- 0 resolved RPC paths
- `insertVportResourceDAL`: confirmed UNUSED_EXPORT (dead-export-map, consumerCount=0)
- Callgraph: 573 nodes across 9 layers; no direct hook→DAL edges skipping controllers found in the map
- VENOM cross-reference findings in scope: VEN-DASHBOARD-001 through VEN-DASHBOARD-007 (all OPEN)

---

## 6. Adversarial Path Analysis

---

### 6.1 Attack A — OWNERSHIP BYPASS

**Target:** Can an actor trigger mutations on another actor's resources?

#### A1: updateBookingStatusController — customer null-vportActorId bypass

**Scenario:** Attacker is a non-owner, non-customer actor. They supply a valid `bookingId`
for a booking where `customer_actor_id IS NULL` (guest booking). The controller checks
`isCustomer = customerActorId && String(callerActorId) === String(customerActorId)`.
If `customerActorId = null`, `isCustomer = false`. Then it falls through to the owner branch,
which calls `assertActorOwnsVportActorController`. Ownership is fully verified by DB.

**Source:** `updateVportBooking.controller.js:40-55`
```
const customerActorId = booking.customer_actor_id ?? null;
const isCustomer = customerActorId && String(callerActorId) === String(customerActorId);
if (isCustomer) { ... } else { ... await assertActorOwnsVportActorController(...) }
```

**Result: BLOCKED** — non-owner falls through to `assertActorOwnsVportActorController` which performs DB verification.
**Provenance: [SOURCE_VERIFIED]**

#### A2: createOwnerBookingController — callerActorId ownership on another VPORT's resource

**Scenario:** Attacker supplies `resourceId` belonging to VPORT-B. They provide their own
`callerActorId` (who owns VPORT-A). The controller resolves `vportActorId` from the resource's
`profile_id`, then calls `assertActorOwnsVportActorController`.

**Source:** `createOwnerBooking.controller.js:27-38`
```
const resource = await getVportResourceByIdDAL({ resourceId });
const vportActorId = resource.owner_actor_id ?? await getVportActorIdByProfileIdDAL(...)
await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: vportActorId })
```

**Result: BLOCKED** — ownership verified via DB on the resolved VPORT actor.
**Provenance: [SOURCE_VERIFIED]**

#### A3: saveVportPublicDetailsByActorIdController — actorId from payload vs session

**Scenario:** Attacker sets `actorId` (first param) to a victim VPORT and `requestActorId`
to their own actor.

**Source:** `saveVportPublicDetailsByActorId.controller.js:53-61`
```
await assertActorOwnsVportActorController({ requestActorId, targetActorId: actorId })
```

**Result: BLOCKED** — ownership gate fires before any profile read or write.
**Provenance: [SOURCE_VERIFIED]**

#### A4: insertVportResourceDAL — dead export, no controller gate

**Scenario:** Scanner flagged `insertVportResourceDAL` as a security surface (VEN-DASHBOARD-004).
The dead-export-map confirms `consumerCount = 0`. There is no live UI path that reaches this DAL function
in the dashboard feature.

**Result: UNRESOLVED (BLOCKED-BY-DEATH)** — dead code. Cannot be triggered at runtime through
dashboard feature paths. The concern is whether it could be reached from another feature's controller
without an ownership gate. Since it is an UNUSED_EXPORT at 0 consumers, the current live attack surface
is nil. However the DAL function itself (`vportResource.write.dal.js:5`) contains no ownership check —
if ever wired to a caller, it would be a direct INSERT with no authorization.

**Severity: MEDIUM** — dead export carrying a latent unguarded INSERT.
**Provenance: [SOURCE_VERIFIED] + dead-export-map**
**Finding: BW-DASH-003**

#### A5: leads controllers — PII access ownership gate

**Scenario:** Attacker passes their own `callerActorId` but a victim `actorId` (target VPORT).

**Source:** `vportLeads.controller.js:32-36`
```
await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })
```

**Result: BLOCKED** — DB-backed ownership check on every controller entry point.
**Provenance: [SOURCE_VERIFIED]**

---

### 6.2 Attack B — SESSION MUTATION

**Target:** Is `viewerActorId`/`callerActorId` always from the session (trusted) or can it come from the payload?

#### B1: useVportBookingActions — callerActorId source

**Source:** `useVportBookingActions.js:7`
```
const callerActorId = identity?.actorId ?? null;
```
Identity comes from `useIdentity()` which resolves from the session context, not from props or URL.

**Result: BLOCKED** — callerActorId is session-sourced.
**Provenance: [SOURCE_VERIFIED]**

#### B2: useQuickBookingModal — callerActorId source

**Source:** `useQuickBookingModal.js:8`
```
const callerActorId = identity?.actorId ?? null;
```

**Result: BLOCKED** — same pattern, session-sourced.
**Provenance: [SOURCE_VERIFIED]**

#### B3: useFlyerEditor — vportId as ownerActorId

**Scenario:** `useFlyerEditor` accepts `vportId` as a prop and passes it to `saveFlyerPublicDetailsCtrl`
as `ownerActorId`. This prop comes from the parent component. The controller calls
`requireOwnerActorAccess(ownerActorId)` which performs a DB check via `dalReadActorOwnerRow({ actorId: ownerActorId, userId })`.

**Source:** `useFlyerEditor.js:23`, `flyerEditor.controller.js:33-36`, `designStudio.shared.controller.js:7-21`

**Result: BLOCKED** — even if `vportId` is prop-supplied, `requireOwnerActorAccess` resolves the session
`userId` from `dalReadAuthenticatedUserId()` and verifies it against `actor_owners` in the DB.
**Provenance: [SOURCE_VERIFIED]**

#### B4: Null callerActorId bypass — all owner controllers

**Scenario:** What happens if `callerActorId` is null when passed to owner-only controllers?

**Source (representative):** `updateVportBooking.controller.js:27`
```
if (!callerActorId) throw new Error("callerActorId is required");
```
All owner controllers have explicit null checks at entry (verified across: vportLeads, vportTeamAccess,
vportOwnerStats, saveVportPublicDetails, bookings controllers).

**Result: BLOCKED** — null guard is present on every owner controller entry.
**Provenance: [SOURCE_VERIFIED]**

---

### 6.3 Attack C — RUNTIME ABUSE

**Target:** Can a non-owner actor type reach owner-only paths?

#### C1: createVportPublicBookingController — non-user actor books

**Scenario:** A VPORT actor attempts to book an appointment.

**Source:** `vportPublicBooking.controller.js:57-61`
```
if (requestActorId) {
  const actor = await readActorVportLinkDAL({ actorId: requestActorId });
  if (!actor) throw new Error("Only citizens can book appointments.");
  if (actor.kind !== "user") throw new Error("Switch to your citizen profile to book.");
}
```

**Result: BLOCKED** — actor kind check enforced server-side.
**Provenance: [SOURCE_VERIFIED]**

#### C2: submitFuelPriceSuggestion — ownerUpdate flag controlled by client

**Scenario:** A citizen submits a fuel price suggestion but sets `ownerUpdate = true` to bypass
the suggestion pipeline and directly upsert official prices.

**Source:** `submitFuelPriceSuggestion.controller.js:24-26, 52-63`
```
// ✅ when true, bypass suggestion pipeline and upsert official directly
ownerUpdate = false,
...
if (ownerUpdate) {
  return submitOwnerFuelPriceUpdateController({ ... actorId ... });
}
```

The `ownerUpdate` flag is a parameter accepted by the controller. However, `submitOwnerFuelPriceUpdateController`
independently calls `checkVportOwnershipController({ callerActorId: actorId, targetActorId })` at line 27 of
`submitOwnerFuelPriceUpdate.controller.js` before any write.

**Source:** `submitOwnerFuelPriceUpdate.controller.js:27-28`
```
const isOwner = await checkVportOwnershipController({ callerActorId: actorId, targetActorId });
if (!isOwner) return { ok: false, reason: "not_owner" };
```

**Result: BLOCKED** — even if a non-owner citizen sets `ownerUpdate=true`, the ownership check
in `submitOwnerFuelPriceUpdateController` blocks the write.

**Note:** VEN-DASHBOARD-006 flagged `isOwner` prop as a client-side control. The implementation
shows it is reinforced server-side. VENOM finding is partially mitigated at the owner path.
**Provenance: [SOURCE_VERIFIED]**
**Finding: BW-DASH-001 (INFO — VEN-006 partially mitigated by server-side ownership re-check)**

#### C3: reviewFuelPriceSuggestion — non-owner reviews a submission

**Source:** `reviewFuelPriceSuggestion.controller.js:45-52`
```
const targetActorId = await resolveActorIdFromProfileId(subRow.profile_id);
const isOwner = await checkVportOwnershipController({ callerActorId: decidedByActorId, targetActorId });
if (!isOwner) return { ok: false, reason: "not_owner" };
```

**Result: BLOCKED** — ownership verified from the submission's `profile_id` (not from any caller-supplied value).
**Provenance: [SOURCE_VERIFIED]**

---

### 6.4 Attack D — RLS VERIFICATION

**Target:** For each DAL write surface, is there an ownership filter in the query or is RLS the only barrier?

#### D1: updateVportBookingDAL — dual-column filter

**Source:** `updateVportBooking.write.dal.js:25-31`
```
.update(row).eq("id", bookingId).eq("profile_id", profileId)
```
Both `bookingId` AND `profileId` are required. `profileId` is resolved server-side from `booking.profile_id`
(not caller-supplied) before this DAL is called.

**Result: BLOCKED** — app-layer scoping + controller pre-verification. Not solely reliant on RLS.
**Provenance: [SOURCE_VERIFIED]**

#### D2: upsertVportPublicDetailsDAL — dual ownership model

**Source:** `vportPublicDetails.write.dal.js:27-40`
```
const userId = authData?.user?.id;
const { data: owned } = await supabase.schema("vport").from("profiles")
  .select("id").eq("id", row.profile_id).eq("owner_user_id", userId).maybeSingle();
if (!owned) throw new Error("VPORT not found or not owned by you");
```

This DAL checks `owner_user_id` (user-layer ownership). The controller above it checks `actor_owners`
(actor-layer ownership). Two different ownership models are used for the same write path.

**This is an existing VEN-DASHBOARD-002 finding.** BW confirms it is still open and unresolved.
The dual model creates a risk: if a user owns a VPORT's `owner_user_id` but is not in `actor_owners`,
or vice versa, behavior diverges. Neither check is a full backstop for the other.

**Result: PARTIAL** — two independent ownership checks exist but they verify different identity dimensions.
**Finding: BW-DASH-004 — MEDIUM (cross-references VEN-002, unresolved)**
**Provenance: [SOURCE_VERIFIED]**

#### D3: saveFlyerPublicDetails (flyer.write.dal.js) — no ownership check in DAL, no RLS known

**Source:** `flyer.write.dal.js:1-47`
The DAL performs a direct UPSERT on `vport.profile_public_details` keyed only on `profile_id`.
There is no inline ownership check. The `saveFlyerPublicDetailsCtrl` controller calls `requireOwnerActorAccess`
which checks `actor_owners` in the DB. However, this is controller-only gating.

If `saveFlyerPublicDetails` were called directly (bypassing the controller), no ownership would be enforced.
This is the existing VEN-DASHBOARD-001 finding. BW confirms it is unresolved at the DAL layer.

**Result: PARTIAL** — controller gate present; DAL has no ownership filter.
**Finding: BW-DASH-005 — MEDIUM (cross-references VEN-001, unresolved)**
**Provenance: [SOURCE_VERIFIED]**

#### D4: portfolioMediaRecord.write.dal — callerProfileId scope

**Source:** `portfolioMediaRecord.write.dal.js:13-17`
```
await vport.from('portfolio_media').update({ media_asset_id: mediaAssetId })
  .eq('id', portfolioMediaId).eq('profile_id', callerProfileId)
```
The `callerProfileId` scoping is present and required (throws if missing). Provides app-layer backstop.

**Result: BLOCKED** — profile-scoped UPDATE.
**Provenance: [SOURCE_VERIFIED]**

#### D5: vportTeam write DALs — profile_id scoping

All team write DALs (updateTeamMemberRoleDAL, setTeamMemberActiveDAL, deleteTeamMemberByIdDAL) include
`.eq("profile_id", profileId)` in their UPDATE/DELETE predicates. The `profileId` is resolved server-side
from the authenticated actorId, not accepted from the caller.

**Result: BLOCKED** — profile-scoped writes with server-side profileId resolution.
**Provenance: [SOURCE_VERIFIED]**

---

### 6.5 Attack E — VIEWER CONTEXT FUZZING

**Target:** What happens if null/undefined viewerActorId is passed?

#### E1: updateBookingStatusController — null callerActorId

**Source:** `updateVportBooking.controller.js:27`
```
if (!callerActorId) throw new Error("callerActorId is required");
```
Throws immediately. Execution halts.
**Result: BLOCKED**

#### E2: createOwnerBookingController — null callerActorId

**Source:** `createOwnerBooking.controller.js:18`
```
if (!callerActorId) throw new Error("callerActorId is required");
```
**Result: BLOCKED**

#### E3: declineTeamRequestController — null viewerActorId on invited-barber path

**Source:** `vportTeamInvite.controller.js:54-56`
```
if (!viewerActorId) {
  throw new Error("declineTeamRequestController: viewerActorId required for invited barber path");
}
```
**Result: BLOCKED** — null viewerActorId throws before ownership check.
**Provenance: [SOURCE_VERIFIED]**

#### E4: loadOwnerQuickStatsController — null callerActorId

**Source:** `vportOwnerStats.controller.js:29`
```
if (!callerActorId) throw new Error("callerActorId is required");
```
**Result: BLOCKED**

---

### 6.6 Attack F — MUTATION REPLAY

**Target:** Can completed/cancelled bookings be re-triggered? Can accepted invites be replayed?

#### F1: Booking terminal-state replay

**Scenario:** Attacker calls `updateBookingStatusController` on a booking with status `completed` or `cancelled`.

**Source:** `updateVportBooking.controller.js:35-37`
```
if (TERMINAL_STATUSES.includes(booking.status)) {
  throw new Error(`Booking is already ${booking.status} and cannot be modified.`);
}
```
Terminal check fires BEFORE ownership resolution, preventing any auth bypass side-channel.

**Result: BLOCKED** — terminal state guard is pre-auth.
**Provenance: [SOURCE_VERIFIED]**

#### F2: Reschedule terminal booking

**Source:** `updateVportBooking.controller.js:113-115`
Same terminal guard applied to `rescheduleBookingController`.
**Result: BLOCKED**

#### F3: Team invite replay — acceptTeamInviteByActorDAL atomic guard

**Source:** `vportTeamInvite.write.dal.js:103-120`
```
.update({...}).eq("id", resourceId).eq("member_actor_id", barberVportActorId)
  .eq("meta->>status", "pending_acceptance")
```
The UPDATE only fires when `meta->>status = pending_acceptance`. If the invite has already been
accepted or declined, the predicate does not match and `.maybeSingle()` returns null, causing
`throw new Error("invite is no longer available")`.

**Result: BLOCKED** — atomic state guard in the DB predicate.
**Provenance: [SOURCE_VERIFIED]**

#### F4: acceptTeamRequestDAL atomic guard

**Source:** `vportTeamInvite.write.dal.js:41-66`
Same pattern — `.eq("meta->>status", "pending_acceptance")` ensures atomicity.
**Result: BLOCKED**

---

### 6.7 Attack G — HYDRATION POISONING

**Target:** Does this feature interact with the hydration store? Can actor summaries be poisoned?

Dashboard feature uses direct controller calls (no hydration store integration found in source scan).
The `loadOwnerQuickStatsController` returns computed counters, not actor summaries.
The `probeVportPortfolioController` and `getVportResourceAvailabilityController` are read-only.

No hydration write surface was found in the dashboard feature controllers.

**Result: NOT APPLICABLE** — dashboard feature does not write to the hydration store.
**Provenance: [SOURCE_VERIFIED]**

---

### 6.8 Attack H — URL SURFACE

**Target:** Do notification linkPaths, share links, or deep links expose raw UUIDs?

#### H1: booking_created notification — linkPath suppressed

**Source:** `vportPublicBooking.controller.js:113-118`
```
// VPD-V-020: omit linkPath to prevent raw VPORT UUID from being stored in
// the notification row.
linkPath: null,
```
linkPath is explicitly null.
**Result: BLOCKED**

#### H2: booking_confirmed / booking_cancelled notifications

**Source:** `updateVportBooking.controller.js:80-93`
```
publishVcsmNotification({
  recipientActorId, actorId: callerActorId, kind: eventKey,
  objectType: "booking",
  objectId: String(updated.id),
  context: { ... }
})
```
`objectId` is `updated.id` (a booking UUID). No `linkPath` field is set in this call.
The notification adapter is not passed a `linkPath`, so none is stored.

**Result: BLOCKED** — no linkPath; objectId is an internal system reference, not a public URL.
**Provenance: [SOURCE_VERIFIED]**

#### H3: Fuel price "ownerUpdate" path — no notification found

No notification construction found in fuel price controllers. No URL surface.
**Result: NOT APPLICABLE**

---

### 6.9 Attack I — §9 INVARIANT ATTACK (HIGHEST PRIORITY)

**BEHAVIOR.md status: PLACEHOLDER** — §9 invariants are UNANCHORED.

Since no §9 Must Never Happen clauses are declared, BW derives source-inferred invariants from
the security annotations present in the code:

#### Derived Invariant DI-1: "A booking in terminal status must never be modified"
(from VPD-V-021 annotation in source)

**Attack:** Submit `updateBookingStatusController({ bookingId: <terminal>, status: "confirmed", callerActorId: <owner> })`

**Source:** `updateVportBooking.controller.js:35-37`
Terminal check fires first.
**Result: BLOCKED — DI-1 HOLDS**

#### Derived Invariant DI-2: "customer_actor_id must never accept a caller-supplied value"
(from VPD-V-019 annotation in source)

**Attack:** Submit `createVportPublicBookingController({ ..., customer_actor_id: <victim_actorId> })`

**Source:** `vportPublicBooking.controller.js:82-86`
```
customer_actor_id: requestActorId ?? null,
```
The controller ignores any caller-supplied `customer_actor_id`; only `requestActorId` (the authenticated session actor) is used.
However: the parameter signature does not include `customer_actor_id` at all — it is not destructured
from the input. Injection is structurally blocked.
**Result: BLOCKED — DI-2 HOLDS**

#### Derived Invariant DI-3: "service_label_snapshot must never be taken from client input"
(from VPD-V-019 annotation in source)

**Attack:** Submit `createVportPublicBookingController` with arbitrary `serviceLabelSnapshot` in the payload.

**Source:** `vportPublicBooking.controller.js:68-74`
```
let resolvedLabel = "Appointment";
if (serviceId) {
  const service = await getVportServiceByIdDAL({ serviceId });
  if (service) { resolvedLabel = service.label || ... }
}
```
`resolvedLabel` is always server-resolved. No client-supplied label is used.
**Result: BLOCKED — DI-3 HOLDS**

#### Derived Invariant DI-4: "An accepted/declined team invite must not be accepted again"

**Attack:** Replay `acceptBarbershopInviteController(token, barberVportActorId, callerActorId)` after acceptance.

**Source:** `vportTeamInvite.controller.js:110-111`
```
if (resource.meta?.status !== "pending_acceptance") {
  throw new Error("invite is no longer available");
}
```
And at DAL level: `.eq("meta->>status", "pending_acceptance")` atomic guard.
**Result: BLOCKED — DI-4 HOLDS**

#### Derived Invariant DI-5: "insertVportResourceDAL must not be reachable without an ownership gate"

**Attack:** Trace any caller path to `insertVportResourceDAL` in the dashboard feature.

**Source:** dead-export-map confirms `insertVportResourceDAL` has `consumerCount=0` — it is unreachable.
**Result: NOT EXPLOITABLE (dead export)**
**Finding: BW-DASH-003 — MEDIUM — latent unguarded INSERT if wired in future**

#### Derived Invariant DI-6: "Fuel price ownerUpdate path must not be reachable by non-owners"

**Attack:** Citizen sends `ownerUpdate=true` in submitFuelPriceSuggestionController.

**Source:** As analyzed in C2 above. Ownership re-check blocks.
**Result: BLOCKED — DI-6 HOLDS**

#### Derived Invariant DI-7: "Design studio operations must not be reachable without actor_owners check"

**Attack:** Call `ctrlSaveDesignPageScene({ ownerActorId: <victim>, documentId, pageId, scene })`.

**Source:** `designStudio.pages.controller.js:33`
```
await requireDesignDocumentOwnerAccess({ ownerActorId, documentId });
```
Which calls `requireOwnerActorAccess(ownerActorId)` which does DB-backed actor_owners check.

**Result: BLOCKED — DI-7 HOLDS**

---

## 7. Exploitability Assessment

| Finding ID | Severity | Description | Result | Exploitable |
|---|---|---|---|---|
| BW-DASH-001 | INFO | VEN-006: ownerUpdate client flag — server-side check present | BLOCKED | NO |
| BW-DASH-002 | LOW | BEHAVIOR.md is PLACEHOLDER — all §9 invariants UNANCHORED | UNRESOLVED | GOVERNANCE |
| BW-DASH-003 | MEDIUM | insertVportResourceDAL: UNUSED_EXPORT, latent unguarded INSERT | UNRESOLVED | NO (dead) |
| BW-DASH-004 | MEDIUM | Dual ownership model: actor_owners (controller) vs owner_user_id (DAL) in settings path | PARTIAL | THEORETICAL |
| BW-DASH-005 | MEDIUM | saveFlyerPublicDetails: DAL-only controller gate, no DAL ownership filter | PARTIAL | LOW |
| BW-DASH-006 | LOW | fastCountNewVportLeadsController: caller-supplied profileId bypasses re-resolution | PARTIAL | LOW |

### BW-DASH-006 Detail

**Source:** `vportLeads.controller.js:57-60`
```
export async function fastCountNewVportLeadsController(actorId, callerActorId, profileId) {
  if (!actorId || !callerActorId || !profileId) return 0;
  await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId });
  return readNewLeadsCountByProfileDAL(profileId);
}
```
The `profileId` parameter is accepted from the caller and passed directly to `readNewLeadsCountByProfileDAL`
without server-side resolution from `actorId`. An attacker who can pass ownership verification for their own
`actorId` could supply a different (victim) `profileId` to count leads for that victim VPORT.

This is a READ operation (not a write), but it leaks count-level information about another actor's leads.
Ownership is checked against `actorId` + `callerActorId` — but the `profileId` used for the actual query
is not verified to belong to `actorId`.

**Severity: LOW** — read-only, count-only (not full PII), requires valid actorId ownership for some VPORT.
**Result: PARTIAL** — ownership is gated on actorId, but profileId param is not validated against actorId.
**Provenance: [SOURCE_VERIFIED] — vportLeads.controller.js:57-60**

---

## 8. Source Verification Summary

| File | Lines Read | Key Findings |
|---|---|---|
| updateVportBooking.controller.js | 1-146 | Terminal guard, customer-vs-owner auth, notification URL check |
| vportPublicBooking.controller.js | 1-127 | Actor kind check, customer_actor_id injection block, linkPath null |
| createOwnerBooking.controller.js | 1-59 | Ownership resolved from resource, assertActorOwns called |
| updateVportBooking.write.dal.js | 1-35 | dual-column filter (id + profile_id), pick() column whitelist |
| insertVportBooking.write.dal.js | 1-41 | WRITE_COLS whitelist, DAL-only guard, no ownership check |
| vportPublicDetails.write.dal.js | 1-51 | owner_user_id check at DAL level (VEN-002 dual model confirmed) |
| vportResource.write.dal.js | 1-16 | No ownership check, profile_id only required |
| flyer.write.dal.js | 1-47 | No ownership check in DAL |
| flyerEditor.controller.js | 1-43 | requireOwnerActorAccess called before write |
| designStudio.shared.controller.js | 1-37 | DB-backed actor_owners check via dalReadActorOwnerRow |
| designStudio.pages.controller.js | 1-144 | requireDesignDocumentOwnerAccess on all mutations |
| designStudio.assetsExports.controller.js | 1-119 | requireOwnerActorAccess / requireDesignDocumentOwnerAccess |
| saveVportPublicDetailsByActorId.controller.js | 1-85 | assertActorOwnsVportActorController before any read/write |
| vportOwnerStats.controller.js | 1-69 | assertActorOwnsVportActorController, profile is_active check |
| vportLeads.controller.js | 1-79 | assertActorOwnsVportActorController on all 5 entry points; fastCount caller-profileId issue |
| reviewFuelPriceSuggestion.controller.js | 1-137 | Ownership resolved from subRow.profile_id, status guard |
| submitFuelPriceSuggestion.controller.js | 1-73 | ownerUpdate delegates to submitOwnerFuelPriceUpdate which re-checks ownership |
| submitOwnerFuelPriceUpdate.controller.js | 1-61 | checkVportOwnershipController call, then write |
| updateStationFuelUnit.controller.js | 1-20 | checkVportOwnershipController before write |
| vportTeamAccess.controller.js | 1-156 | assertActorOwnsVportActorController on all mutating entries |
| vportTeamInvite.controller.js | 1-122 | assertActorOwnsVportActorController, terminal state guards |
| vportTeam.write.dal.js | 1-79 | All writes scoped with profile_id predicate |
| vportTeamInvite.write.dal.js | 1-131 | Atomic meta->>status predicate guards on accept/decline |
| portfolioMediaRecord.write.dal.js | 1-20 | callerProfileId scoped UPDATE |
| vportLeads.write.dal.js | 1-57 | profileId + leadId scoped writes |
| useVportBookingActions.js | 1-31 | callerActorId from identity context (session) |
| useQuickBookingModal.js | 1-78 | callerActorId from identity context (session) |
| useFlyerEditor.js | 1-31 | vportId from props, validated by controller |

---

## 9. Confidence Summary

| Category | Result |
|---|---|
| Ownership Bypass | No bypass paths found — all verified BLOCKED |
| Session Mutation | All hooks source actorId from session — BLOCKED |
| Runtime Abuse | Actor kind check enforced; ownerUpdate re-checked server-side — BLOCKED |
| RLS Verification | 2 DAL surfaces without DAL-layer ownership filter (flyer.write.dal.js, insertVportResourceDAL) |
| Viewer Context Fuzzing | All null callerActorId inputs throw at controller entry — BLOCKED |
| Mutation Replay | Terminal booking guard + atomic invite/request state guards — BLOCKED |
| Hydration Poisoning | Dashboard does not interact with hydration store — N/A |
| URL Surface | linkPath suppressed on booking notifications — BLOCKED |
| §9 Invariants | UNANCHORED (BEHAVIOR.md is PLACEHOLDER) — derived invariants DI-1 through DI-7 all HOLD |

**Overall posture:** Strong. No CRITICAL or HIGH severity bypasses found. 3 MEDIUM findings (1 dead-export
latent issue, 1 dual ownership model, 1 flyer DAL ownership gap). 1 LOW (fastCount caller-profileId). 1 LOW
governance gap (BEHAVIOR.md). 1 INFO (ownerUpdate mitigated).

---

## 10. §9 Invariant Attack Map

| Derived Invariant | Attack Attempted | Result |
|---|---|---|
| DI-1: Terminal booking immutable | Write to terminal booking as owner | BLOCKED |
| DI-2: customer_actor_id never from caller | Inject customer_actor_id in public booking | BLOCKED |
| DI-3: service_label_snapshot server-resolved | Supply arbitrary label in public booking | BLOCKED |
| DI-4: Accepted invite not replayable | Replay acceptBarbershopInviteController | BLOCKED |
| DI-5: insertVportResourceDAL gated | Trace caller path to unguarded INSERT | N/A (dead export) |
| DI-6: ownerUpdate not reachable by non-owners | Citizen sets ownerUpdate=true | BLOCKED |
| DI-7: Design studio requires actor_owners | Call ctrlSaveDesignPageScene as non-owner | BLOCKED |

All source-derived invariants hold. BEHAVIOR.md must be written to formally anchor these invariants.

---

## 11. Behavior Contract Attack Summary

BEHAVIOR.md status: PLACEHOLDER
§4 Failure Paths: UNDECLARED
§9 Must Never Happen: UNDECLARED

Consequence: All derived invariants in this report are inferred from source annotations (VPD-V-* tags).
If any annotation is removed or the code is refactored without a BEHAVIOR.md to anchor the invariants,
the invariants become silently unverified in future BW runs.

**Governance finding:** BW-DASH-002 — BEHAVIOR.md must be written.

---

## 12. THOR Impact

| Finding | THOR Blocker |
|---|---|
| BW-DASH-001 (INFO) | NO |
| BW-DASH-002 (LOW — governance) | NO (but deferred to BEHAVIOR.md sprint) |
| BW-DASH-003 (MEDIUM — dead export) | NO (unreachable) |
| BW-DASH-004 (MEDIUM — dual ownership) | NO (pre-existing VEN-002, no new attack found) |
| BW-DASH-005 (MEDIUM — flyer DAL gap) | NO (pre-existing VEN-001, controller gate present) |
| BW-DASH-006 (LOW — fastCount profileId) | NO |

No THOR release blockers introduced. All MEDIUM findings are pre-existing VENOM findings confirmed
by BW as PARTIAL/unresolved but with no confirmed exploit path at runtime.

---

## 13. SPIDER-MAN Test Requirements

| Finding | Required Test |
|---|---|
| BW-DASH-006 | fastCountNewVportLeadsController: assert that passing a profileId belonging to a different actorId does not return data for that actorId (ownership-profileId cross-check) |
| BW-DASH-003 | If insertVportResourceDAL is ever wired to a caller: require VENOM review and add ownership gate before use |
| BW-DASH-004 | Add regression test: saveVportPublicDetailsByActorIdController — verify that a user who owns actor_owners but not owner_user_id (or vice versa) is denied |
| BW-DASH-005 | Add test: calling saveFlyerPublicDetails directly (bypassing controller) — confirm RLS or lack thereof |
| DI-1 | Existing: terminal booking mutation test (confirm via test in updateVportBooking.controller.test.js) |
| DI-2 | Existing: customer_actor_id injection test (confirm via insertVportBooking.write.dal.test.js) |
| DI-4 | Existing: invite replay test (confirm via vportTeamInvite.controller.test.js) |

---

## 14. Findings Table (Complete)

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-DASH-001 | INFO | VEN-006 ownerUpdate client flag — server-side ownership re-check present in submitOwnerFuelPriceUpdate | BLOCKED | DRAFT |
| BW-DASH-002 | LOW | BEHAVIOR.md is PLACEHOLDER — §9 invariants are UNANCHORED, derived invariants only | UNRESOLVED | DRAFT |
| BW-DASH-003 | MEDIUM | insertVportResourceDAL: UNUSED_EXPORT with no caller; DAL has no ownership check — latent unguarded INSERT if wired | UNRESOLVED | DRAFT |
| BW-DASH-004 | MEDIUM | Dual ownership model: assertActorOwnsVportActorController (actor_owners) at controller vs owner_user_id check at DAL in settings/flyer path — cross-references VEN-002 | PARTIAL | DRAFT |
| BW-DASH-005 | MEDIUM | saveFlyerPublicDetails (flyer.write.dal.js): no ownership check in DAL, controller-only gate — cross-references VEN-001 | PARTIAL | DRAFT |
| BW-DASH-006 | LOW | fastCountNewVportLeadsController: caller-supplied profileId not re-validated against actorId — read-only leak of booking count | PARTIAL | DRAFT |

---

*Report generated: 2026-06-04*
*Output: ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_dashboard-adversarial-review.md*
