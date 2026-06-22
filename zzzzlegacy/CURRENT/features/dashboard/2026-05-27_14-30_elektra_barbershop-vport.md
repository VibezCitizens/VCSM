# ELEKTRA Security Report

**Date:** 2026-05-27
**Scope:** VCSM
**Reviewer:** ELEKTRA
**Scan Trigger:** BLACKWIDOW referral + VENOM VB-02/VB-03 patch verification + BW-BAR-00x chain validation
**Findings Summary:** 1 HIGH | 3 MEDIUM | 1 LOW | 1 INFO
**False Positives Rejected:** 3
**Suggested Patches:** 6

---

## Executive Summary

The VCSM barbershop module was scanned against the VENOM trust-boundary findings (VB-01 through VB-05) and BLACKWIDOW adversarial findings (BW-BAR-001 through BW-BAR-005). VB-01 and VB-05 (unauthorized system post publication) are confirmed HARDENED — `assertActorOwnsVportActorController` is present and gates both publish controllers. VB-02 (`vport_id` exposure) and VB-03 (`is_deleted` exposure) are confirmed UNMITIGATED — code evidence verified at the DAL layer. A new HIGH finding was confirmed: two resource mutation DALs (`acceptJoinResourceDAL`, `acceptTeamInviteByActorDAL`) accept token/resourceId writes without validating the resource is in a valid state, enabling an authenticated actor to overwrite an already-linked resource slot. A MEDIUM auth bypass was confirmed on the `declineTeamRequestController` isInvitedBarber path. The self-shortcut in `assertActorOwnsVportActorController` is structurally weak but not currently directly exploitable. The most urgent fix is the DAL-level state machine enforcement (ELEK-001).

---

## Scan Target

```
ELEKTRA SCAN TARGET
Feature / Route / Engine: VPORT Dashboard — Barbershop Module
Application Scope: VCSM
Reason: BLACKWIDOW referral + VENOM VB-02/VB-03 retests + BW-BAR chain validation
Scan trigger: BLACKWIDOW referral
```

---

## Entry Point Map

```
ENTRY POINT MAP

1. Route: /join/barbershop/:token (QR + Invite join flows)
   Input sources: token (URL param), barberVportActorId (derived from session/input),
                  callerActorId (from authenticated identity)
   Trusted input boundary: joinBarbershopQr.controller.js — assertActorOwnsVportActorController
   Validation present at boundary: PARTIAL — ownership verified, token state not verified

2. Route: /actor/:actorId/dashboard/team-requests (BarberTeamRequestsScreen)
   Input sources: actorId (URL param), resourceId (from fetched request list),
                  viewerActorId (from identity session)
   Trusted input boundary: vportTeamInvite.controller.js — isInvitedBarber path
   Validation present at boundary: PARTIAL — accept path fully verified; decline path not session-bound

3. Public profile API: /profile/:slug (barbershop public read)
   Input sources: actorId (resolved from slug)
   Trusted input boundary: fetchVportPublicDetailsByActorId — DAL response construction
   Validation present at boundary: PARTIAL — returns vport_id (internal UUID) and is_deleted (lifecycle flag)

4. Ownership assertion primitive: assertActorOwnsVportActorController
   Input sources: requestActorId, targetActorId (caller-supplied)
   Trusted input boundary: self-shortcut check at line 15 vs kind check at line 24
   Validation present at boundary: PARTIAL — self-shortcut precedes kind validation
```

---

## High Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-001
- Title:              Resource slot overwrite via missing state machine guard in join/invite DALs
- Category:           IDOR/BOLA
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/join/dal/joinInvite.dal.js:18-49
                      apps/VCSM/src/features/dashboard/vport/dal/write/vportTeamInvite.write.dal.js:73-95
                      apps/VCSM/src/features/join/controllers/joinBarbershopQr.controller.js:19-28
                      apps/VCSM/src/features/dashboard/vport/controller/vportTeamInvite.controller.js:75-91
- Source:             token param (URL-derived) to acceptQrJoin / acceptBarbershopInviteController —
                      ultimately user-supplied via scanned QR code or invite link
- Sink:               acceptJoinResourceDAL → vportSchema.from("resources").update({ member_actor_id })
                      acceptTeamInviteByActorDAL → vportSchema.from("resources").update({ member_actor_id })
- Trust Boundary:     Controller layer — assertActorOwnsVportActorController (ownership of barberVport)
                      Missing: token/resource state validation before mutation
- Impact:             An authenticated actor who owns any barber VPORT can supply an already-used or
                      already-linked join/invite token and overwrite the member_actor_id field on the
                      resource row, displacing the originally linked barber and hijacking their slot.
                      In the race condition variant, two simultaneous QR scans can both pass the
                      hook-layer status check before either writes join_token_used_at.
- Evidence:
    // joinInvite.dal.js — acceptJoinResourceDAL
    // No status check before update:
    const { data, error } = await vportSchema
      .from("resources")
      .update({
        member_actor_id: barberVportActorId,   // ← overwrites unconditionally
        is_active: true,
        meta: { ...current?.meta, ...extraMeta, status: "linked", accepted_at: ... }
      })
      .eq("id", resourceId)   // ← only guard is resourceId match; no status filter
      .select(RESOURCE_COLS)
      .single();

    // vportTeamInvite.write.dal.js — acceptTeamInviteByActorDAL — same pattern:
    .update({ member_actor_id: barberVportActorId, is_active: true, meta: { status: "linked" } })
    .eq("id", resourceId)   // ← no status state guard

    // joinBarbershopQr.controller.js — acceptQrJoin:
    // ownership check present, but NO token state validation before calling DAL:
    await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: barberVportActorId });
    return acceptJoinResourceDAL(token, barberVportActorId, { join_token_used_at: ... }); // ← no state pre-check

    // vportTeamInvite.controller.js — acceptBarbershopInviteController:
    const resource = await fetchResourceByIdDAL(token);
    if (!resource) throw new Error("Invite not found.");
    // ← NO status check here — resource.meta.status is not validated
    await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: barberVportActorId });
    return acceptTeamInviteByActorDAL(token, barberVportActorId, resource.meta); // ← fires on any resource state

- Reproduction Steps:
    1. Actor A (owns VPORT-A) scans QR, completes join → resource is now linked to VPORT-A
    2. Actor B (owns VPORT-B) obtains same token (e.g., from the same printed QR code)
    3. Actor B calls acceptQrJoin(token, VPORT_B_ID, ActorB_callerActorId)
    4. assertActorOwnsVportActorController passes — ActorB owns VPORT-B
    5. acceptJoinResourceDAL fires with VPORT_B_ID — overwrites member_actor_id
    6. Resource slot now incorrectly shows VPORT-B as the linked barber
    [Race variant: two simultaneous scans before either write; no DB-level single-use lock]

- Existing Defense:
    — hook/UI layer: useJoinBarbershop.js checks meta.status !== "pending_onboarding",
      join_token_used_at, and member_actor_id before allowing the accept action
    — acceptQrJoin controller: ownership assertion (callerActorId must own barberVportActorId)
    — acceptBarbershopInviteController: ownership assertion present

- Why Defense Is Insufficient:
    — The hook-layer guard is a UI gate only; it is not enforced at the controller or DAL layer
    — The controller verifies WHO is acting, not WHAT STATE the resource is in
    — acceptJoinResourceDAL and acceptTeamInviteByActorDAL both fire unconditionally on resourceId match
    — No atomic DB-level single-use enforcement; race window exists between hook-layer read and DAL write

- Recommended Fix:
    Add a resource state pre-check in the controller before calling the DAL.
    For defense-in-depth, add a conditional filter in the DAL so the update only fires
    when the resource is in a valid state (pending). If the guard fails, return null and throw.

- Suggested Patch:
    // ── Patch A: Controller-layer guard (acceptQrJoin) ─────────────────────
    // joinBarbershopQr.controller.js — add state check after ownership assertion:

    export async function acceptQrJoin(token, barberVportActorId, callerActorId) {
      if (!callerActorId) throw new Error("acceptQrJoin: callerActorId required");
      await assertActorOwnsVportActorController({
        requestActorId: callerActorId,
        targetActorId: barberVportActorId,
      });

      // ADD: Validate resource state before accepting
      const resource = await fetchJoinResourceByIdDAL(token);
      if (!resource) throw new Error("Join resource not found.");
      if (resource.meta?.status !== "pending_onboarding") {
        throw new Error("This QR code is no longer valid for joining.");
      }
      if (resource.meta?.join_token_used_at || resource.member_actor_id) {
        throw new Error("This QR code has already been used.");
      }

      return acceptJoinResourceDAL(token, barberVportActorId, {
        join_token_used_at: new Date().toISOString(),
      });
    }

    // ── Patch B: Controller-layer guard (acceptBarbershopInviteController) ──
    // vportTeamInvite.controller.js — add status check after fetchResourceByIdDAL:

    export async function acceptBarbershopInviteController(token, barberVportActorId, callerActorId) {
      if (!token || !barberVportActorId) throw new Error("Token and barber actor ID required.");
      if (!callerActorId) throw new Error("acceptBarbershopInviteController: callerActorId is required.");

      const resource = await fetchResourceByIdDAL(token);
      if (!resource) throw new Error("Invite not found.");

      // ADD: Validate invite is still in pending state
      if (resource.meta?.status !== "pending_acceptance") {
        throw new Error("This invite is no longer pending.");
      }

      await assertActorOwnsVportActorController({
        requestActorId: callerActorId,
        targetActorId: barberVportActorId,
      });

      return acceptTeamInviteByActorDAL(token, barberVportActorId, resource.meta);
    }

    // ── Patch C: DAL-layer defense-in-depth (atomic conditional) ────────────
    // joinInvite.dal.js — acceptJoinResourceDAL — use conditional update:

    export async function acceptJoinResourceDAL(resourceId, barberVportActorId, extraMeta = {}) {
      if (!resourceId || !barberVportActorId) {
        throw new Error("acceptJoinResourceDAL: resourceId and barberVportActorId required");
      }

      const { data: current, error: readError } = await vportSchema
        .from("resources")
        .select("meta")
        .eq("id", resourceId)
        .maybeSingle();

      if (readError) throw readError;

      const { data, error } = await vportSchema
        .from("resources")
        .update({
          member_actor_id: barberVportActorId,
          is_active: true,
          meta: {
            ...(current?.meta || {}),
            ...extraMeta,
            status: "linked",
            accepted_at: new Date().toISOString(),
          },
        })
        .eq("id", resourceId)
        .eq("meta->>status", "pending_onboarding")    // ADD: atomic state guard
        .is("member_actor_id", null)                   // ADD: slot must be unclaimed
        .select(RESOURCE_COLS)
        .maybeSingle();                                // ADD: use maybeSingle — returns null if guard fails

      if (error) throw error;
      if (!data) throw new Error("Resource is no longer available for acceptance.");
      return data;
    }

- Follow-up Command: DB (verify RLS on vport.resources — does update policy enforce
                    status transitions or require pending_onboarding state?)
                    Carnage (if DB-level atomic transition constraint is required via migration)
```

---

## Medium Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-002
- Title:              Decline team request without session ownership — isInvitedBarber path
- Category:           Auth Bypass
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/dashboard/vport/controller/vportTeamInvite.controller.js:31-58
                      apps/VCSM/src/features/dashboard/vport/hooks/useBarberTeamRequests.js:53-65
- Source:             callerActorId param = barberVportActorId from URL params (via hook closure) —
                      indirectly user-influenced (attacker controls which URL they navigate to);
                      resourceId = from notification objectId or fetched request list
- Sink:               declineTeamRequestDAL → vportSchema.from("resources").update({ meta: { status: "declined" } })
                      vportTeamInvite.write.dal.js:53-71
- Trust Boundary:     Controller isInvitedBarber check — string comparison between
                      callerActorId and resource.member_actor_id — no DB ownership verification
- Impact:             Any actor who knows the barberVportActorId (from notification linkPath or
                      public profile) and the resourceId (from notification objectId) can call
                      declineTeamRequestController and decline a team request targeting that barber
                      VPORT without holding an authenticated session that owns the barber VPORT.
                      Notification payloads send both values to the recipient (BW-BAR-005).
- Evidence:
    // vportTeamInvite.controller.js — declineTeamRequestController:
    const isInvitedBarber =
      resource.member_actor_id && String(callerActorId) === String(resource.member_actor_id);

    if (!isInvitedBarber) {
      // ownership check ONLY when not the invited barber
      const vportActorId = resource.owner_actor_id ?? ...;
      await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: vportActorId });
    }
    // ← when isInvitedBarber = true: proceeds directly with no session ownership check

    return declineTeamRequestDAL(resourceId, resource.meta); // ← fires on string comparison match alone

    // useBarberTeamRequests.js:
    const decline = useCallback(async (resourceId) => {
      await declineTeamRequestController(barberVportActorId, resourceId);
      // ← passes barberVportActorId (VPORT actorId), NOT viewerActorId (session user actorId)
      // ← controller never receives the session identity on the decline path
    }, [barberVportActorId]);

- Reproduction Steps:
    1. Attacker's barber VPORT receives a team invite from Barbershop B
    2. Attacker receives team_invite notification → extracts objectId (resourceId) from payload
    3. Attacker extracts barberVportActorId from notification linkPath
    4. Attacker calls declineTeamRequestController(barberVportActorId, resourceId)
    5. isInvitedBarber = String(barberVportActorId) === String(resource.member_actor_id) → TRUE
    6. No ownership assertion fires → declineTeamRequestDAL executes → status = "declined"
    [Attacker need not be the session-authenticated owner of the barber VPORT]

- Existing Defense:
    — Screen-level: useVportOwnership(viewerActorId, actorId) → isOwner gate in BarberTeamRequestsScreen
    — Hook initialization: barberVportActorId passed to hook only when isOwner = true
    — These are UI/hook-layer guards; controller does not independently verify

- Why Defense Is Insufficient:
    — The controller receives barberVportActorId directly and performs only a string comparison
    — The session user's actorId (viewerActorId) is never passed to the decline controller
    — No assertActorOwnsVportActorController on the isInvitedBarber branch
    — The hook-layer isOwner gate is bypassable if the controller is called directly

- Recommended Fix:
    Pass viewerActorId to declineTeamRequestController as an additional parameter.
    On the isInvitedBarber path, call assertActorOwnsVportActorController to verify
    the session user owns the barber VPORT before allowing the decline.

- Suggested Patch:
    // ── Patch: vportTeamInvite.controller.js — add viewerActorId param ────────
    export async function declineTeamRequestController(callerActorId, resourceId, viewerActorId) {
      if (!callerActorId) throw new Error("declineTeamRequestController: callerActorId required");
      if (!resourceId) throw new Error("declineTeamRequestController: resourceId required");

      const resource = await fetchResourceByIdDAL(resourceId);
      if (!resource) throw new Error("Request not found.");
      if (resource.meta?.status !== "pending_acceptance") {
        throw new Error("This request is no longer pending.");
      }

      const isInvitedBarber =
        resource.member_actor_id && String(callerActorId) === String(resource.member_actor_id);

      if (isInvitedBarber) {
        // ADD: Verify session user owns the barber VPORT before allowing decline
        if (!viewerActorId) throw new Error("Session identity required to decline.");
        await assertActorOwnsVportActorController({
          requestActorId: viewerActorId,       // session user actorId
          targetActorId: callerActorId,         // barber VPORT actorId
        });
      } else {
        const vportActorId = resource.owner_actor_id
          ?? (resource.profile_id
              ? await getVportActorIdByProfileIdDAL({ profileId: resource.profile_id })
              : null);
        if (!vportActorId) throw new Error("Could not resolve VPORT ownership.");
        await assertActorOwnsVportActorController({
          requestActorId: callerActorId,
          targetActorId: vportActorId,
        });
      }

      return declineTeamRequestDAL(resourceId, resource.meta);
    }

    // ── Patch: useBarberTeamRequests.js — pass viewerActorId to decline ────────
    const decline = useCallback(async (resourceId) => {
      await declineTeamRequestController(barberVportActorId, resourceId, viewerActorId); // ADD viewerActorId
    }, [barberVportActorId, viewerActorId]);

- Follow-up Command: VENOM (review full trust boundary of the team request lifecycle);
                     BLACKWIDOW (confirm decline-path exploit chain is now blocked after patch)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-003
- Title:              Internal vport_id UUID exposed in public profile response — VB-02 unmitigated
- Category:           IDOR/BOLA
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/profiles/dal/vportPublicDetails.read.dal.js:50
- Source:             newData.id — internal vport.profiles primary key UUID, DB-sourced but surfaced
- Sink:               return object field vport_id: newData.id → HTTP response body → any client
- Trust Boundary:     DAL response construction — vport.profiles.id must never leave the DAL surface
- Impact:             Any client reading the public barbershop profile API (authenticated or not)
                      receives the internal vport.profiles.id UUID in the response object.
                      Enables: correlation of actorId ↔ vport.profiles.id; targeted queries against
                      tables using profileId as FK without slug-based routing protection;
                      enumeration of internal table structure. Violates ARCHITECTURE.md §1.3.
- Evidence:
    // vportPublicDetails.read.dal.js — line 50:
    return {
      actor_id: actorId,
      kind: "vport",
      vport_id: newData.id,   // ← internal vport.profiles primary key UUID — must not surface
      name: newData.name ?? null,
      ...
    };
    // Present in fetch from profiles.select("id, name, slug, bio...") at line 9

- Reproduction Steps:
    1. Visit any public barbershop profile endpoint or trigger getVportPublicDetailsController
    2. Inspect the response object in the browser devtools or network tab
    3. Observe vport_id field containing a raw UUID — this is the vport.profiles.id

- Existing Defense:   None — the field is explicitly constructed and returned

- Why Defense Is Insufficient:
    — No stripping of vport_id before return
    — No model layer that removes internal IDs from the public surface
    — VENOM VB-02 finding was raised 2026-05-10; patch not yet applied

- Recommended Fix:
    Remove vport_id from the return object. If an internal profile ID is required for
    write operations downstream, keep it as a local variable inside the DAL/controller
    and never include it in the returned shape.

- Suggested Patch:
    // vportPublicDetails.read.dal.js — remove vport_id from return:
    if (newData) {
      const pd = newData.public_details || null;
      return {
        actor_id: actorId,
        kind: "vport",
        // REMOVED: vport_id: newData.id,
        name: newData.name ?? null,
        vport_type: null,
        slug: newData.slug ?? null,
        bio: newData.bio ?? null,
        avatar_url: newData.avatar_url ?? null,
        banner_url: newData.banner_url ?? null,
        is_active: newData.is_active ?? null,
        // ... rest of fields unchanged
      };
    }
    // If any downstream controller needs the internal profileId for a write op,
    // that controller must call the DAL directly and use newData.id locally —
    // it must not be propagated through the public response shape.

- Follow-up Command: review-contract (confirm vport_id removal is contract-compliant);
                     Deadpool (trace all consumers of the vport_id field to confirm none break)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-004
- Title:              Self-shortcut in assertActorOwnsVportActorController precedes kind validation
- Category:           Auth Bypass
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js:15-24
- Source:             requestActorId and targetActorId — caller-supplied parameters
- Sink:               return { ok: true, mode: "self" } — grants ownership without DB verification
                      Called before: getActorByIdDAL (kind check) and
                                     readActorOwnerLinkByActorAndUserProfileDAL (DB ownership)
- Trust Boundary:     Self-shortcut at line 15 — only checks string equality, not actor kind or ownership
- Impact:             If requestActorId === targetActorId is satisfied (same UUID passed for both),
                      the ownership gate returns success with NO DB query, NO kind validation, and
                      NO actor_owners check. A VPORT-kind actor could claim ownership of itself
                      without holding a user-kind authenticated session.
                      At all 9 current call sites, callerActorId is sourced from the authenticated
                      session (user-kind), so this is not directly exploitable today. However,
                      any future call site that accidentally passes targetActorId as both params
                      (e.g., during VPORT-to-VPORT operations) silently bypasses all DB verification.
- Evidence:
    // assertActorOwnsVportActor.controller.js:
    export async function assertActorOwnsVportActorController({ requestActorId, targetActorId } = {}) {
      if (!requestActorId) throw new Error(...);
      if (!targetActorId) throw new Error(...);

      // ← SELF-SHORTCUT fires before any validation:
      if (String(requestActorId) === String(targetActorId)) {
        return { ok: true, mode: "self" };   // no DB query, no kind check
      }

      // ← Kind check is AFTER self-shortcut:
      const requesterActor = await getActorByIdDAL({ actorId: requestActorId });
      if (!requesterActor || requesterActor.is_void === true) throw ...
      if (requesterActor.kind !== "user") throw ...  // ← line 24 — never reached if self-match

- Reproduction Steps:
    1. Construct a call: assertActorOwnsVportActorController({
         requestActorId: someVportActorId,
         targetActorId: someVportActorId   // same value
       })
    2. Self-shortcut fires: String(someVportActorId) === String(someVportActorId) → true
    3. Returns { ok: true, mode: "self" } — kind check and actor_owners DB query both skipped
    [At current call sites: not reachable because callerActorId (user-kind) ≠ targetActorId (VPORT-kind)]

- Existing Defense:   Hook and screen layer sources callerActorId from session identity (user-kind),
                      which can never equal a VPORT actorId — prevents the shortcut from firing today

- Why Defense Is Insufficient:
    — Defense is positional (depends on all callers sourcing callerActorId correctly)
    — The primitive itself has no structural guard; a single future misuse bypasses all DB verification
    — Kind validation should be unconditional and must precede or be inside any shortcut logic

- Recommended Fix:
    Move the actor lookup and kind check BEFORE the self-shortcut. After kind is confirmed,
    apply the self-shortcut to skip the DB ownership query (the only intended optimization).

- Suggested Patch:
    // assertActorOwnsVportActor.controller.js — move kind check before self-shortcut:

    export async function assertActorOwnsVportActorController({ requestActorId, targetActorId } = {}) {
      if (!requestActorId) throw new Error("assertActorOwnsVportActorController: requestActorId is required");
      if (!targetActorId) throw new Error("assertActorOwnsVportActorController: targetActorId is required");

      // Always validate the requester actor — kind check is unconditional
      const requesterActor = await getActorByIdDAL({ actorId: requestActorId });
      if (!requesterActor || requesterActor.is_void === true) {
        throw new Error("Requester actor not found.");
      }
      if (requesterActor.kind !== "user") {
        throw new Error("Only actor owners can manage this booking resource.");
      }

      // Self-ownership shortcut: safe now because kind is already verified above
      if (String(requestActorId) === String(targetActorId)) {
        return { ok: true, mode: "self" };
      }

      const requesterProfileId = requesterActor.profile_id ?? null;
      if (!requesterProfileId) {
        throw new Error("Requester actor is missing profile ownership identity.");
      }

      const ownerLink = await readActorOwnerLinkByActorAndUserProfileDAL({
        targetActorId,
        userProfileId: requesterProfileId,
      });

      if (!ownerLink || ownerLink.is_void === true) {
        throw new Error("Actor does not own this vport actor.");
      }

      return { ok: true, mode: "actor_owner", ownerLink };
    }

    // Note: This adds one getActorByIdDAL call to the self-ownership path.
    // This is a write path — the performance cost is acceptable for correctness.

- Follow-up Command: VENOM (validate that the self-shortcut behavior change is consistent
                     with all 9 call sites); review-contract
```

---

## Low Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-005
- Title:              is_deleted lifecycle flag in public profile SELECT; no deletion filter — VB-03 unmitigated
- Category:           IDOR/BOLA (Information Disclosure)
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/profiles/dal/vportPublicDetails.read.dal.js:9-39, 57-58
- Source:             is_deleted, is_active columns from vport.profiles — DB-sourced internal lifecycle flags
- Sink:               HTTP response object → is_active field returned at line 57;
                      is_deleted selected at line 18 — accessible in the raw data object before return
- Trust Boundary:     DAL SELECT list and response construction
- Impact:             (1) A deleted barbershop VPORT is still returned by the DAL — no .eq("is_deleted", false)
                      filter means soft-deleted profiles are served to the public read surface.
                      (2) Clients inspecting network responses can identify moderation state
                      (is_deleted, is_active) from the returned object.
                      (3) A visitor can determine whether a VPORT has been moderated or deactivated.
- Evidence:
    // vportPublicDetails.read.dal.js — SELECT includes is_deleted at line 18:
    .select(`
      id,
      name,
      slug,
      bio,
      avatar_url,
      banner_url,
      is_active,
      is_deleted,     // ← internal lifecycle flag in public SELECT
      public_details:profile_public_details (...)
    `)
    // No filter: .eq("is_deleted", false) is absent

    // Response at line 57:
    is_active: newData.is_active ?? null,
    // is_deleted not in the return object, but newData.is_deleted is accessible before return
    // and is_active (also internal lifecycle) is returned to view layer

- Reproduction Steps:
    1. Query the public profile endpoint for a soft-deleted barbershop VPORT's actorId
    2. DAL returns data (no is_deleted filter) — profile data is served for deleted VPORTs
    3. Client inspects network response and observes is_active field

- Existing Defense:   is_deleted is not in the explicit return object (only is_active is returned)
                      However: no filter prevents deleted VPORTs from being returned

- Why Defense Is Insufficient:
    — The missing .eq("is_deleted", false) filter means deleted VPORT data is returned
    — Consumers can gate on null response, but they receive data when they should receive nothing
    — VENOM VB-03 finding was raised 2026-05-10; neither the filter nor the field removal was applied

- Recommended Fix:
    Add .eq("is_deleted", false) filter to the query. Remove is_deleted from the SELECT list.
    Gate is_active to owner-only visibility (do not return it in the public read shape).

- Suggested Patch:
    // vportPublicDetails.read.dal.js — add deletion filter and clean up SELECT:
    const { data: newData, error: newError } = await vportSchema
      .from("profiles")
      .select(
        `
        id,
        name,
        slug,
        bio,
        avatar_url,
        banner_url,
        is_active,
        public_details:profile_public_details (
          city_id,
          website_url,
          email_public,
          phone_public,
          location_text,
          address,
          hours,
          price_tier,
          highlights,
          languages,
          payment_methods,
          social_links,
          booking_url,
          logo_url,
          accent_color
        )
      `
        // REMOVED: is_deleted from SELECT list
      )
      .eq("actor_id", actorId)
      .eq("is_deleted", false)    // ADD: filter deleted VPORTs at DAL level
      .maybeSingle();

    // In the return object, remove is_active from the public read shape:
    // (is_active can remain available for owner-mode reads via a separate owner DAL)
    return {
      actor_id: actorId,
      kind: "vport",
      // REMOVED: vport_id: newData.id (per ELEK-003)
      name: newData.name ?? null,
      // REMOVED: is_active from public return shape — owner mode only
      ...
    };

- Follow-up Command: DB (verify whether RLS on vport.profiles already filters is_deleted=true;
                     if RLS handles it, code-level filter is defense-in-depth only)
```

---

## Info Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-006
- Title:              Team invite notification exposes resourceId UUID to recipient — amplifier for ELEK-002
- Category:           IDOR/BOLA (Information Disclosure — amplifier)
- Severity:           INFO
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/dashboard/vport/controller/vportTeam.controller.js:102-112
- Source:             resource.id (team request resourceId UUID) — DB-sourced, included in notification payload
- Sink:               publishVcsmNotification({ objectId: resource.id, linkPath: /actor/${barberVportActorId}/... })
                      → notification delivered to barber VPORT recipient with both IDs embedded
- Trust Boundary:     Notification payload construction — values are sent to the intended recipient
- Impact:             On its own: the notification is sent to the intended recipient — this is expected.
                      As an amplifier: the notification payload hands the recipient both the
                      barberVportActorId (from linkPath) and the resourceId (from objectId),
                      which are the exact two inputs required for the ELEK-002 decline path bypass.
                      If ELEK-002 is fixed, this finding becomes purely informational.
- Evidence:
    // vportTeam.controller.js — sendTeamRequestController:
    await publishVcsmNotification({
      recipientActorId: barberVportActorId,
      actorId,
      kind: "team_invite",
      objectType: "team_request",
      objectId: resource?.id ? String(resource.id) : null,  // ← resourceId UUID in payload
      linkPath: `/actor/${barberVportActorId}/dashboard/team-requests`,  // ← actorId UUID in path
      context: {},
    });

- Reproduction Steps:
    [Dependent on ELEK-002 exploitation — see ELEK-002 for steps]

- Existing Defense:   Notification is sent only to the intended recipient (barber VPORT)

- Why Defense Is Insufficient:
    — Only meaningful as an amplifier for ELEK-002
    — Standalone: acceptable — notification recipients are the intended actors
    — Post-ELEK-002-fix: this finding becomes INFO only with no exploit path

- Recommended Fix:
    Fix ELEK-002 first. Once the decline path requires session ownership verification,
    knowing both objectId and barberVportActorId from the notification is no longer sufficient
    to bypass the gate. No immediate change required to the notification payload itself
    unless a broader notification privacy review is warranted.

- Suggested Patch:
    Fix ELEK-002 first. No notification payload change required until ELEK-002 is patched.

- Follow-up Command: VENOM (if a broader notification payload trust boundary review is needed)
```

---

## False Positives Rejected

```
FALSE POSITIVE REJECTED

- Candidate:       emailRedirectTo open redirect via window.location.origin
- Location:        apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js:16
- Rejection reason: Sink link could not be confirmed — window.location.origin is not user-controlled
- Chain gap:        Source
- Notes:           window.location.origin is the browser's own origin — a client cannot supply
                   a different origin through normal browser execution. The emailRedirectTo always
                   points back to the same origin the user is already on. Not an open redirect.
```

```
FALSE POSITIVE REJECTED

- Candidate:       XSS via portfolioTitle in buildPortfolioText
- Location:        apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/publishBarbershopPortfolioUpdateAsPost.controller.js:9-13
- Rejection reason: No HTML sink identified — text is stored in vc.posts.text field and
                   rendered via React component (default text rendering, not innerHTML)
- Chain gap:        Sink
- Notes:           portfolioTitle is stored as plain text. React's default rendering escapes text
                   content. No dangerouslySetInnerHTML was found in the barbershop post rendering
                   surface. This candidate would need confirmation of an innerHTML sink in the
                   feed rendering layer to become valid. Not pursued in this scope.
```

```
FALSE POSITIVE REJECTED

- Candidate:       meta column information disclosure in fetchJoinResourceByIdDAL
- Location:        apps/VCSM/src/features/join/dal/joinInvite.dal.js:3
- Rejection reason: Impact link insufficient — meta fields (status, join_token_used_at, join_expires_at)
                   are required for client-side flow state management and contain no credentials or PII.
                   The token (resourceId UUID) is already known to the client. No sensitive asset
                   is disclosed that the client does not already require to complete the join flow.
- Chain gap:        Impact
- Notes:           Data minimization improvement would be to return only the fields the client
                   needs (status, join_expires_at) rather than the full meta object. Recommend
                   as a future refactor, not a security finding.
```

---

## Chain Validations

```
DATA FLOW TRACE — ELEK-001

Source: token (URL param) → acceptQrJoin controller
Validation at boundary: assertActorOwnsVportActorController (caller owns barberVport)
Intermediate transforms: none — token passed directly to DAL
Sink: acceptJoinResourceDAL → vportSchema.from("resources").update() — joinInvite.dal.js:32-43
Defense at sink: ABSENT — no status/state filter in the .update() call

CHAIN VALIDATION — ELEK-001
Source: confirmed — token from URL parameter, user-supplied
Trust boundary: confirmed — controller ownership check (caller owns VPORT) but no resource state check
Sink: confirmed — joinInvite.dal.js:32-43 and vportTeamInvite.write.dal.js:73-95
Impact: confirmed — member_actor_id overwritten; wrong barber linked to slot
Missing defense: confirmed — no .eq("meta->>status", "pending_onboarding") in DAL; no state
                 pre-check in acceptQrJoin or acceptBarbershopInviteController
Finding Status: VALID
```

```
DATA FLOW TRACE — ELEK-002

Source: callerActorId = barberVportActorId from URL params (via hook closure)
Validation at boundary: string comparison String(callerActorId) === String(resource.member_actor_id)
Intermediate transforms: none
Sink: declineTeamRequestDAL → vportSchema.from("resources").update({ meta: { status: "declined" } })
Defense at sink: ABSENT — DAL has no actor binding

CHAIN VALIDATION — ELEK-002
Source: confirmed — barberVportActorId from URL params passed as callerActorId
Trust boundary: confirmed — isInvitedBarber string check; no assertActorOwnsVportActorController
Sink: confirmed — vportTeamInvite.write.dal.js:53-71
Impact: confirmed — team request status set to "declined" without session ownership verification
Missing defense: confirmed — no assertActorOwnsVportActorController on isInvitedBarber=true path
Finding Status: VALID
```

```
DATA FLOW TRACE — ELEK-003

Source: newData.id from vport.profiles SELECT (DB-sourced internal UUID)
Validation at boundary: none — field included explicitly in return object
Sink: return object { vport_id: newData.id } → HTTP response → any client reader
Defense at sink: ABSENT — no stripping at DAL or model layer

CHAIN VALIDATION — ELEK-003
Source: confirmed — vportPublicDetails.read.dal.js line 50: vport_id: newData.id
Trust boundary: confirmed — DAL response construction; no model layer strips internal ID
Sink: confirmed — public HTTP response body accessible to any authenticated or unauthenticated client
Impact: confirmed — internal vport.profiles UUID exposed; enables correlation attacks
Missing defense: confirmed — vport_id not removed from response
Finding Status: VALID
```

```
DATA FLOW TRACE — ELEK-004

Source: requestActorId and targetActorId — caller-supplied
Validation at boundary: self-shortcut at line 15 fires before kind check at line 24
Sink: return { ok: true, mode: "self" } — grants ownership assertion
Defense at sink: ABSENT — shortcut has no kind check

CHAIN VALIDATION — ELEK-004
Source: confirmed — requestActorId and targetActorId from controller params
Trust boundary: confirmed — line 15 self-shortcut precedes line 24 kind check
Sink: confirmed — returns ownership grant without DB query or kind verification
Impact: partial — not directly exploitable at current call sites; structural path exists
Missing defense: confirmed — kind check does not gate the self-shortcut
Finding Status: VALID (MEDIUM — constrained by current call-site practice)
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-05-27-001 | Resource slot overwrite via missing state machine guard | HIGH | Controller + DAL | MODERATE | YES — verify RLS on vport.resources |
| 2 | ELEK-2026-05-27-003 | vport_id internal UUID in public profile response | MEDIUM | DAL | SIMPLE | NO |
| 3 | ELEK-2026-05-27-004 | Self-shortcut precedes kind validation | MEDIUM | Controller | SIMPLE | NO |
| 4 | ELEK-2026-05-27-002 | Decline team request without session ownership | MEDIUM | Controller + Hook | MODERATE | NO |
| 5 | ELEK-2026-05-27-005 | is_deleted in public SELECT; no deletion filter | LOW | DAL | SIMPLE | NO (verify RLS) |
| 6 | ELEK-2026-05-27-006 | Notification resourceId exposure (amplifier) | INFO | Controller | SIMPLE | NO |

---

## VENOM VB-01 / VB-05 Patch Verification

| VENOM Finding | Status | Evidence |
|---|---|---|
| VB-01 — Portfolio publish missing ownership check | **HARDENED** | `assertActorOwnsVportActorController` present at `publishBarbershopPortfolioUpdateAsPostController` lines 25-28 |
| VB-05 — Hours publish missing ownership check | **HARDENED** | `assertActorOwnsVportActorController` present at `publishBarbershopHoursUpdateAsPostController` lines 50-53 |
| VB-02 — vport_id exposure | **UNMITIGATED** | `vport_id: newData.id` at `vportPublicDetails.read.dal.js:50` — see ELEK-003 |
| VB-03 — is_deleted in public read | **UNMITIGATED** | `is_deleted` in SELECT, no filter — see ELEK-005 |
| VB-04 — Cache invalidation on deactivation | **UNVERIFIED** | Cannot confirm from source scan alone; requires Deadpool or Loki runtime trace |

---

## THOR Release Gate Assessment

| Finding | Severity | THOR Gate |
|---|---|---|
| ELEK-2026-05-27-001 — Resource slot IDOR | HIGH | **RELEASE BLOCKER** — IDOR on write path with confirmed code chain |
| ELEK-2026-05-27-002 — Decline auth bypass | MEDIUM | CAUTION — auth bypass on controller path; fix should precede release |
| ELEK-2026-05-27-003 — vport_id exposure | MEDIUM | CAUTION — VB-02 unmitigated; unresolved VENOM MEDIUM |
| ELEK-2026-05-27-004 — Self-shortcut kind bypass | MEDIUM | CAUTION — structural weakness in shared primitive (9 call sites) |
| ELEK-2026-05-27-005 — is_deleted exposure | LOW | No gate — hardening only |
| ELEK-2026-05-27-006 — Notification amplifier | INFO | No gate — dependent on ELEK-002 fix |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| DB | Verify RLS on vport.resources — does policy enforce pending_onboarding status transitions on update? (ELEK-001) | PENDING |
| DB | Verify RLS on vport.profiles — does policy filter is_deleted=true rows on public read? (ELEK-005) | PENDING |
| Carnage | Evaluate DB-level atomic constraint for vport.resources state machine if RLS is insufficient (ELEK-001) | PENDING |
| VENOM | Cross-reference ELEK-002 and ELEK-004 against trust boundary design for team invite and ownership primitive | PENDING |
| BLACKWIDOW | Confirm ELEK-001 exploit chain after Patch A+C applied; confirm ELEK-002 is blocked after Patch | PENDING |
| review-contract | Confirm vport_id removal (ELEK-003) and self-shortcut fix (ELEK-004) are contract-compliant | PENDING |
| Deadpool | Trace all downstream consumers of vport_id field before removal (ELEK-003); confirm none depend on it | PENDING |
| Thor | Evaluate ELEK-001 as release blocker; assess CAUTION status for ELEK-002/003/004 | PENDING |

---

*ELEKTRA is read-only and non-destructive. No source files were modified. All suggested patches are advisory only — for human review and decision before application.*
