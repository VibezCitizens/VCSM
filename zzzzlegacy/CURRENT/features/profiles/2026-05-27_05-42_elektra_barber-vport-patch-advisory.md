# ELEKTRA Security Report

**Date:** 2026-05-27
**Scope:** VCSM
**Reviewer:** ELEKTRA
**Scan Trigger:** BLACKWIDOW referral — barber VPORT module adversarial findings (BW-BAR-01 through BW-BAR-08)
**Findings Summary:** 3 HIGH | 2 MEDIUM | 2 LOW | 1 INFO
**False Positives Rejected:** 2
**Suggested Patches:** 8

---

## Executive Summary

The barber/barbershop VPORT module contains three confirmed HIGH-severity IDOR/BOLA vulnerabilities in write-path controllers that accept caller-supplied actor identity without verifying session ownership through `actor_owners`. Two controllers (`publishBarbershopPortfolioUpdateAsPostController`, `publishBarbershopHoursUpdateAsPostController`) have no ownership gate at all; one controller (`acceptTeamRequestController`) relies on string equality that cannot bind to a session. The QR join path (`acceptQrJoin`) is the most severe finding: any authenticated actor can force-enroll a victim barber VPORT into a barbershop by supplying an arbitrary `barberVportActorId`. All four HIGH/CRITICAL chains are one-to-three call-depth and patchable at the controller layer with a single `assertActorOwnsVportActorController` guard per finding. None require DB schema changes — though DB command must verify RLS as a defense-in-depth layer.

---

## ELEKTRA SCAN TARGET

```
Feature / Route / Engine: Barber / Barbershop VPORT — join flows, team management, system post publish
Application Scope: VCSM
Reason for scan: Patch advisory for all BYPASSED and PARTIAL findings from BlackWidow BW-BAR-01 through BW-BAR-08
Scan trigger: BLACKWIDOW referral
```

---

## ENTRY POINT MAP

```
Route / API / Controller                                    Input sources           Validation present
joinBarbershopQr.controller.js::acceptQrJoin               barberVportActorId      NO
vportTeamInvite.controller.js::acceptTeamRequestController callerActorId           WEAK (string equality)
publishBarbershopPortfolioUpdateAsPost.controller.js        actorId                 NO
publishBarbershopHoursUpdateAsPost.controller.js            actorId                 NO
joinBarbershopAccount.controller.js::useExistingVport...    vportActorId            WEAK (owner_user_id)
vportTeam.controller.js::sendTeamRequestController          context.resourceId      PARTIAL (no payload redaction)
vportTeam.controller.js::getBarberTeamRequestsController    barberVportActorId      NO
vportBarbershopPost.read.dal.js::resolveVportBarbershopName actorId                 NO is_deleted filter
```

---

## High Findings

---

### SECURITY FINDING

```
Finding ID:         ELEK-2026-05-27-001
Title:              QR Join Controller Accepts Arbitrary VPORT Actor ID — No Ownership Verification
Category:           IDOR/BOLA
Severity:           HIGH
Status:             Open
Scope:              VCSM
Location:           apps/VCSM/src/features/join/controllers/joinBarbershopQr.controller.js:18–21
Source:             barberVportActorId — caller-supplied parameter with no origin validation
Sink:               acceptJoinResourceDAL(token, barberVportActorId, ...) →
                    UPDATE vport.resources SET member_actor_id = barberVportActorId
                    [ engines/join DAL / joinInvite.dal.js:32–47 ]
Trust Boundary:     joinBarbershopQr.controller.js entry — where ownership should be asserted
Impact:             Any authenticated actor can supply a victim barber VPORT's actorId, accepting a
                    QR join on their behalf. The victim VPORT is linked as staff at the barbershop
                    without the VPORT owner's knowledge or consent. The attacker needs: (1) a live QR
                    join token (scannable in the barbershop), and (2) the victim's barberVportActorId
                    (available from public profile surface).
Evidence:
  export async function acceptQrJoin(token, barberVportActorId) {
    return acceptJoinResourceDAL(token, barberVportActorId, {
      join_token_used_at: new Date().toISOString(),
    });
  }
  // No assertActorOwnsVportActorController. No session binding. No ownership check.
Reproduction Steps:
  1. Scan a barbershop's QR join code — obtain token (vport.resources UUID).
  2. Identify target barber VPORT actorId from public profile page.
  3. Authenticate as any user (not the target barber owner).
  4. Call acceptQrJoin(token, victim_barber_vport_actor_id) from own session.
  5. Observe: vport.resources row updated — member_actor_id = victim, is_active = true.
  6. Victim barber is now listed as staff at the barbershop.
Existing Defense:   UI hook (useJoinBarbershop.js) correctly scopes barberVportActorId to
                    the current user's VPORT via findCurrentUserBarberVport. This is the only guard.
Why Defense Is Insufficient:
  UI-level only. The controller is callable directly from browser DevTools or any script
  with an authenticated session. The hook protection does not survive direct invocation.
Recommended Fix:    Add callerActorId parameter to acceptQrJoin. Verify caller owns the VPORT via
                    assertActorOwnsVportActorController before calling acceptJoinResourceDAL.
Suggested Patch:

  FILE: apps/VCSM/src/features/join/controllers/joinBarbershopQr.controller.js

  ADD IMPORT (top of file):
    import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

  CHANGE acceptQrJoin function:

  // BEFORE:
  export async function acceptQrJoin(token, barberVportActorId) {
    return acceptJoinResourceDAL(token, barberVportActorId, {
      join_token_used_at: new Date().toISOString(),
    });
  }

  // AFTER:
  export async function acceptQrJoin(token, barberVportActorId, callerActorId) {
    if (!callerActorId) throw new Error("acceptQrJoin: callerActorId required");
    // Verify the calling session owns the VPORT being enrolled.
    await assertActorOwnsVportActorController({
      requestActorId: callerActorId,
      targetActorId: barberVportActorId,
    });
    return acceptJoinResourceDAL(token, barberVportActorId, {
      join_token_used_at: new Date().toISOString(),
    });
  }

  FILE: apps/VCSM/src/features/join/hooks/useJoinBarbershop.js

  CHANGE acceptQr action (line ~170):

  // BEFORE:
  const acceptQr = useCallback(async () => {
    if (!barberVport?.actor_id) return;
    setWorking(true);
    setError("");
    try {
      await acceptQrJoin(token, barberVport.actor_id);

  // AFTER:
  const acceptQr = useCallback(async () => {
    if (!barberVport?.actor_id) return;
    const callerActorId = identity?.actorId ?? null;
    if (!callerActorId) return;
    setWorking(true);
    setError("");
    try {
      await acceptQrJoin(token, barberVport.actor_id, callerActorId);

  NOTE: `identity` is already destructured at line ~43 of the hook.

Follow-up Command:  DB (verify vport.resources UPDATE RLS for pending_onboarding rows as defense-in-depth)
```

---

### SECURITY FINDING

```
Finding ID:         ELEK-2026-05-27-002
Title:              acceptTeamRequestController Uses String Equality — No Session Ownership Binding
Category:           IDOR/BOLA
Severity:           HIGH
Status:             Open
Scope:              VCSM
Location:           apps/VCSM/src/features/dashboard/vport/controller/vportTeamInvite.controller.js:13–28
Source:             callerActorId — caller-supplied, checked only by string equality against DB record
Sink:               acceptTeamRequestDAL(resourceId, resource.meta) →
                    UPDATE vport.resources SET is_active = true, meta.status = 'linked'
                    [ vportTeamInvite.write.dal.js:32–51 ]
Trust Boundary:     acceptTeamRequestController lines 23–25 — string equality check
Impact:             Attacker harvests member_actor_id (from notification linkPath) and resourceId
                    (from notification context payload) for a pending team request. Attacker calls
                    acceptTeamRequestController(member_actor_id, resourceId) from their own session.
                    String check passes. Team request force-accepted — victim VPORT enrolled without consent.
Evidence:
  export async function acceptTeamRequestController(callerActorId, resourceId) {
    // ...
    if (!resource.member_actor_id || String(callerActorId) !== String(resource.member_actor_id)) {
      throw new Error("Only the invited barber can accept this team request.");
    }
    // ↑ String equality check. Passes if caller supplies the correct string.
    // No assertActorOwnsVportActorController. No session ownership binding.
    return acceptTeamRequestDAL(resourceId, resource.meta);
  }

  CONTRAST: declineTeamRequestController (same file, lines 44-55) and
  acceptBarbershopInviteController (same file, lines 70-86) BOTH call
  assertActorOwnsVportActorController correctly. The accept path is the only missing gate.

Reproduction Steps:
  1. Barbershop A sends team request to Barber VPORT B.
  2. notification payload arrives at Barber B: context.resourceId = resource UUID,
     linkPath = /actor/{barber_vport_actor_id}/dashboard/team-requests.
  3. Attacker reads notification (or intercepts notification realtime subscription).
  4. Attacker calls acceptTeamRequestController(barber_vport_actor_id_B, resourceId).
  5. String check: callerActorId === member_actor_id → PASSES.
  6. DAL updates resource to linked. Barber B force-enrolled.
Existing Defense:   String equality check on callerActorId vs resource.member_actor_id.
Why Defense Is Insufficient:
  String equality only verifies the caller knows the member_actor_id string. It does NOT verify
  the calling session's authenticated user owns the VPORT with that actorId. Any actor who
  knows the string can pass the check from any authenticated session.
Recommended Fix:    Replace string equality with assertActorOwnsVportActorController, using the
                    caller's USER-kind actorId (from identity) as requestActorId and
                    resource.member_actor_id as targetActorId.
Suggested Patch:

  INTERFACE CHANGE REQUIRED: The controller currently receives barberVportActorId as callerActorId.
  The patch changes callerActorId to be the USER actor ID (from identity context), not the VPORT actor ID.

  FILE: apps/VCSM/src/features/dashboard/vport/controller/vportTeamInvite.controller.js

  // BEFORE:
  export async function acceptTeamRequestController(callerActorId, resourceId) {
    if (!callerActorId) throw new Error("acceptTeamRequestController: callerActorId required");
    if (!resourceId) throw new Error("acceptTeamRequestController: resourceId required");

    const resource = await fetchResourceByIdDAL(resourceId);
    if (!resource) throw new Error("Request not found.");
    if (resource.meta?.status !== "pending_acceptance") {
      throw new Error("This request is no longer pending.");
    }

    if (!resource.member_actor_id || String(callerActorId) !== String(resource.member_actor_id)) {
      throw new Error("Only the invited barber can accept this team request.");
    }

    return acceptTeamRequestDAL(resourceId, resource.meta);
  }

  // AFTER:
  export async function acceptTeamRequestController(callerActorId, resourceId) {
    if (!callerActorId) throw new Error("acceptTeamRequestController: callerActorId required");
    if (!resourceId) throw new Error("acceptTeamRequestController: resourceId required");

    const resource = await fetchResourceByIdDAL(resourceId);
    if (!resource) throw new Error("Request not found.");
    if (resource.meta?.status !== "pending_acceptance") {
      throw new Error("This request is no longer pending.");
    }

    if (!resource.member_actor_id) {
      throw new Error("Team request has no assigned barber actor.");
    }

    // Verify the calling session's actor owns the invited barber VPORT.
    // callerActorId must be a user-kind actor that is an owner of resource.member_actor_id.
    await assertActorOwnsVportActorController({
      requestActorId: callerActorId,
      targetActorId: resource.member_actor_id,
    });

    return acceptTeamRequestDAL(resourceId, resource.meta);
  }

  FILE: apps/VCSM/src/features/dashboard/vport/hooks/useBarberTeamRequests.js

  The hook currently passes barberVportActorId as callerActorId. After the patch, it must pass
  the VIEWER's user-kind actorId instead. Update the hook signature to accept viewerActorId:

  // BEFORE:
  export function useBarberTeamRequests(barberVportActorId) {
    // ...
    const accept = useCallback(async (resourceId) => {
      await acceptTeamRequestController(barberVportActorId, resourceId);

  // AFTER:
  export function useBarberTeamRequests(barberVportActorId, viewerActorId) {
    // ...
    const accept = useCallback(async (resourceId) => {
      await acceptTeamRequestController(viewerActorId, resourceId);

  FILE: apps/VCSM/src/features/dashboard/vport/screens/BarberTeamRequestsScreen.jsx

  Pass viewerActorId to the hook:

  // BEFORE:
  const { requests, loading, error, working, workError, accept, decline } = useBarberTeamRequests(
    isOwner ? actorId : null
  );

  // AFTER:
  const { requests, loading, error, working, workError, accept, decline } = useBarberTeamRequests(
    isOwner ? actorId : null,
    viewerActorId                  // ← already computed above as identity?.actorId ?? null
  );

  NOTE: assertActorOwnsVportActorController is already imported in vportTeamInvite.controller.js (line 11).

Follow-up Command:  DB (verify vport.resources UPDATE RLS for pending_acceptance rows)
```

---

### SECURITY FINDING

```
Finding ID:         ELEK-2026-05-27-003
Title:              publishBarbershopPortfolioUpdateAsPostController — No Actor Ownership Gate
Category:           IDOR/BOLA
Severity:           HIGH
Status:             Open
Scope:              VCSM
Location:           apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/
                    publishBarbershopPortfolioUpdateAsPost.controller.js:15–39
Source:             actorId — caller-supplied, not bound to session
Sink:               createSystemPost({ actorId, post_type: "barbershop_portfolio_update", ... }) →
                    INSERT into vc.posts attributed to actorId
                    [ via posts.adapter ]
Trust Boundary:     Controller entry — no ownership check present
Impact:             Any authenticated actor who knows a barbershop's actorId can publish a system
                    post to the public feed attributed to that barbershop — 1 post per hour per target.
                    An attacker with a list of 100 barbershop actorIds can flood the feed with forged
                    content at 100/hr aggregate rate, each attributed to a different real barbershop.
Evidence:
  export async function publishBarbershopPortfolioUpdateAsPostController({
    actorId,
    portfolioTitle,
    mediaUrl,
  }) {
    if (!actorId) throw new Error("...actorId required");
    // ↑ ONLY check is null guard. No ownership verification.
    const realmId = PUBLIC_REALM_ID;
    if (!realmId) return { published: false, reason: "missing_public_realm" };
    const alreadyPosted = await hasRecentBarbershopPortfolioPostDAL({ actorId });
    if (alreadyPosted) return { published: false, reason: "throttled" };
    // ...
    const created = await createSystemPost({ actorId, text, post_type: "barbershop_portfolio_update", ... });
  }
  // Throttle (hasRecentBarbershopPortfolioPostDAL) is per actorId — does NOT prevent
  // cross-victim attacks (attacker can target N victims, 1 post/hr per victim).
Reproduction Steps:
  1. Obtain any barbershop actorId from public profile URL or hydration store.
  2. Authenticate as any user.
  3. Call publishBarbershopPortfolioUpdateAsPostController({ actorId: victim, portfolioTitle: "...", mediaUrl: null }).
  4. Observe: system post "New portfolio work added by [victim barbershop name]" published to feed.
Existing Defense:   Null guard on actorId; per-actorId throttle (1 post/hr).
Why Defense Is Insufficient:
  Throttle only limits rate per target. Does not verify caller ownership.
  Any authenticated actor can trigger 1 forged post per hour per target indefinitely.
Recommended Fix:    Add callerActorId parameter. Assert ownership via assertActorOwnsVportActorController
                    before any database operation. Update consuming hook to pass identity.actorId.
Suggested Patch:

  FILE: apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/
        publishBarbershopPortfolioUpdateAsPost.controller.js

  ADD IMPORT:
    import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

  // BEFORE:
  export async function publishBarbershopPortfolioUpdateAsPostController({
    actorId,
    portfolioTitle,
    mediaUrl,
  }) {
    if (!actorId) throw new Error("publishBarbershopPortfolioUpdateAsPost: actorId required");

  // AFTER:
  export async function publishBarbershopPortfolioUpdateAsPostController({
    callerActorId,
    actorId,
    portfolioTitle,
    mediaUrl,
  }) {
    if (!actorId) throw new Error("publishBarbershopPortfolioUpdateAsPost: actorId required");
    if (!callerActorId) throw new Error("publishBarbershopPortfolioUpdateAsPost: callerActorId required");

    await assertActorOwnsVportActorController({
      requestActorId: callerActorId,
      targetActorId: actorId,
    });

    // ... rest of controller is unchanged

  FILE: apps/VCSM/src/features/profiles/kinds/vport/hooks/barbershop/usePublishBarbershopPortfolioPost.js

  ADD IMPORT at top:
    import { useIdentity } from "@/state/identity/identityContext";
    // (or use the correct identity hook for this feature area)

  // BEFORE:
  export function usePublishBarbershopPortfolioPost({ actorId }) {
    const publishBarbershopPortfolioPost = useCallback(
      async ({ portfolioTitle, mediaUrl }) => {
        if (!actorId) return { published: false, reason: "no_actor" };
        return publishBarbershopPortfolioUpdateAsPostController({
          actorId,
          portfolioTitle: portfolioTitle ?? null,
          mediaUrl: mediaUrl ?? null,
        });
      },
      [actorId]
    );

  // AFTER:
  export function usePublishBarbershopPortfolioPost({ actorId }) {
    const { identity } = useIdentity();

    const publishBarbershopPortfolioPost = useCallback(
      async ({ portfolioTitle, mediaUrl }) => {
        if (!actorId) return { published: false, reason: "no_actor" };
        const callerActorId = identity?.actorId ?? null;
        if (!callerActorId) return { published: false, reason: "not_authenticated" };
        return publishBarbershopPortfolioUpdateAsPostController({
          callerActorId,
          actorId,
          portfolioTitle: portfolioTitle ?? null,
          mediaUrl: mediaUrl ?? null,
        });
      },
      [actorId, identity]
    );

Follow-up Command:  DB (verify vc.posts INSERT RLS for post_type = 'barbershop_portfolio_update')
```

---

## Medium Findings

---

### SECURITY FINDING

```
Finding ID:         ELEK-2026-05-27-004
Title:              publishBarbershopHoursUpdateAsPostController — No Actor Ownership Gate
Category:           IDOR/BOLA
Severity:           HIGH
Status:             Open
Scope:              VCSM
Location:           apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/
                    publishBarbershopHoursUpdateAsPost.controller.js:45–66
Source:             actorId — caller-supplied
Sink:               createSystemPost({ actorId, post_type: "barbershop_hours_update", ... }) →
                    INSERT into vc.posts
Trust Boundary:     Controller entry — no ownership check
Impact:             Identical to ELEK-2026-05-27-003. Attacker publishes forged hours to victim
                    barbershop's public feed — e.g. "closed every day" — damaging real-world bookings.
Evidence:
  export async function publishBarbershopHoursUpdateAsPostController({ actorId, blocks }) {
    if (!actorId) throw new Error("publishBarbershopHoursUpdateAsPost: actorId required");
    // No ownership check.
    // ...
    const created = await createSystemPost({ actorId, text, post_type: "barbershop_hours_update", ... });
  }
Existing Defense:   Null guard only; per-actorId throttle (1 post/hr per target).
Why Defense Is Insufficient: Same as ELEK-2026-05-27-003.
Recommended Fix:    Add callerActorId + assertActorOwnsVportActorController. Update consuming hook.
Suggested Patch:

  FILE: apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/
        publishBarbershopHoursUpdateAsPost.controller.js

  ADD IMPORT:
    import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

  // BEFORE:
  export async function publishBarbershopHoursUpdateAsPostController({ actorId, blocks }) {
    if (!actorId) throw new Error("publishBarbershopHoursUpdateAsPost: actorId required");

  // AFTER:
  export async function publishBarbershopHoursUpdateAsPostController({ callerActorId, actorId, blocks }) {
    if (!actorId) throw new Error("publishBarbershopHoursUpdateAsPost: actorId required");
    if (!callerActorId) throw new Error("publishBarbershopHoursUpdateAsPost: callerActorId required");

    await assertActorOwnsVportActorController({
      requestActorId: callerActorId,
      targetActorId: actorId,
    });

    // ... rest of controller unchanged

  FILE: apps/VCSM/src/features/profiles/kinds/vport/hooks/barbershop/usePublishBarbershopHoursPost.js

  // BEFORE:
  export function usePublishBarbershopHoursPost({ actorId }) {
    const publishBarbershopHoursPost = useCallback(
      async ({ blocks }) => {
        if (!actorId) return { published: false, reason: "no_actor" };
        return publishBarbershopHoursUpdateAsPostController({ actorId, blocks });
      },
      [actorId]
    );

  // AFTER:
  export function usePublishBarbershopHoursPost({ actorId }) {
    const { identity } = useIdentity();

    const publishBarbershopHoursPost = useCallback(
      async ({ blocks }) => {
        if (!actorId) return { published: false, reason: "no_actor" };
        const callerActorId = identity?.actorId ?? null;
        if (!callerActorId) return { published: false, reason: "not_authenticated" };
        return publishBarbershopHoursUpdateAsPostController({ callerActorId, actorId, blocks });
      },
      [actorId, identity]
    );

    return { publishBarbershopHoursPost };
  }

  ADD IMPORT to hook file:
    import { useIdentity } from "@/state/identity/identityContext";

Follow-up Command:  DB (verify vc.posts INSERT RLS for post_type = 'barbershop_hours_update')
```

> NOTE: ELEK-2026-05-27-004 is classified HIGH severity (same as -003) but appears in the Medium section due to identical structure to -003. THOR must treat both as release blockers.

---

### SECURITY FINDING

```
Finding ID:         ELEK-2026-05-27-005
Title:              useExistingBarberVportAndAccept Uses Non-Canonical owner_user_id Ownership Check
Category:           Auth Bypass
Severity:           MEDIUM
Status:             Open
Scope:              VCSM
Location:           apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js:122–133
Source:             vportActorId — caller-supplied
Sink:               acceptJoinResourceDAL(token, vportActorId) → UPDATE vport.resources
                    [ joinInvite.dal.js:18-49 ]
Trust Boundary:     Ownership check at lines 126–129 using owner_user_id (non-canonical)
Impact:             If a barber VPORT undergoes ownership transfer (new owner added via actor_owners,
                    original owner not purged from vport.profiles.owner_user_id), the original user
                    can still pass this check and accept an invite on behalf of a VPORT they no longer own.
                    Inversely, the new canonical owner may be denied until owner_user_id is updated.
Evidence:
  export async function useExistingBarberVportAndAccept(token, vportActorId, { readCurrentAuthUserDAL } = {}) {
    const user = await readCurrentAuthUserDAL?.();
    if (!user) throw new Error("Not signed in.");

    const existingVport = await readBarberVportByOwnerUserIdDAL(user.id);
    if (!existingVport || String(existingVport.actor_id) !== String(vportActorId)) {
      throw new Error("Caller does not own this barber vport.");
    }
    // ↑ Uses vport.profiles.owner_user_id — NOT actor_owners. Non-canonical ownership check.
    await acceptJoinResourceDAL(token, vportActorId);
  }
Reproduction Steps:
  1. Transfer ownership of Barber VPORT from User A to User B (update actor_owners; owner_user_id not updated).
  2. Original User A calls useExistingBarberVportAndAccept(token, vportActorId).
  3. readBarberVportByOwnerUserIdDAL(userA.id) → finds the VPORT (owner_user_id still = userA.id).
  4. String check passes. Invite accepted on behalf of VPORT now owned by User B.
Existing Defense:   owner_user_id check prevents arbitrary actors. Gap only activates if ownership diverges.
Why Defense Is Insufficient:
  vport.profiles.owner_user_id is not the canonical ownership model. The architecture contract
  defines actor_owners as the single source of truth for VPORT ownership. Checks that bypass
  actor_owners are non-canonical and produce incorrect results when ownership diverges.
Recommended Fix:    Add callerActorId parameter. Replace or augment the owner_user_id check with
                    assertActorOwnsVportActorController.
Suggested Patch:

  FILE: apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js

  ADD IMPORT:
    import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

  // BEFORE:
  export async function useExistingBarberVportAndAccept(token, vportActorId, { readCurrentAuthUserDAL } = {}) {
    const user = await readCurrentAuthUserDAL?.();
    if (!user) throw new Error("Not signed in.");

    const existingVport = await readBarberVportByOwnerUserIdDAL(user.id);
    if (!existingVport || String(existingVport.actor_id) !== String(vportActorId)) {
      throw new Error("Caller does not own this barber vport.");
    }

    await acceptJoinResourceDAL(token, vportActorId);
    return { barberVportActorId: vportActorId };
  }

  // AFTER:
  export async function useExistingBarberVportAndAccept(
    token,
    vportActorId,
    { readCurrentAuthUserDAL, callerActorId } = {}
  ) {
    const user = await readCurrentAuthUserDAL?.();
    if (!user) throw new Error("Not signed in.");

    // Canonical ownership check via actor_owners.
    // callerActorId must be a user-kind actorId that owns vportActorId in actor_owners.
    if (!callerActorId) throw new Error("useExistingBarberVportAndAccept: callerActorId required");
    await assertActorOwnsVportActorController({
      requestActorId: callerActorId,
      targetActorId: vportActorId,
    });

    await acceptJoinResourceDAL(token, vportActorId);
    return { barberVportActorId: vportActorId };
  }

  FILE: apps/VCSM/src/features/join/hooks/useJoinBarbershop.js

  The acceptWithExisting action calls useExistingBarberVportAndAccept. Pass identity.actorId:

  // BEFORE:
  const acceptWithExisting = useCallback(async () => {
    if (!existingVport?.actor_id) return;
    // ...
    await useExistingBarberVportAndAccept(token, existingVport.actor_id);

  // AFTER:
  const acceptWithExisting = useCallback(async () => {
    if (!existingVport?.actor_id) return;
    const callerActorId = identity?.actorId ?? null;
    if (!callerActorId) return;
    // ...
    await useExistingBarberVportAndAccept(token, existingVport.actor_id, {
      readCurrentAuthUserDAL,
      callerActorId,
    });

Follow-up Command:  ARCHITECT (audit all controllers using owner_user_id for ownership — VBR-01 systemic)
```

---

### SECURITY FINDING

```
Finding ID:         ELEK-2026-05-27-006
Title:              Notification Payload Exposes Internal Resource UUID — Feeds Forced-Accept Chain
Category:           IDOR/BOLA
Severity:           MEDIUM
Status:             Open
Scope:              VCSM
Location:           apps/VCSM/src/features/dashboard/vport/controller/vportTeam.controller.js:102–114
Source:             resource?.id — internal vport.resources UUID written to notification context
Sink:               publishVcsmNotification({ context: { resourceId: resource.id } }) →
                    notification record stored with raw UUID
Trust Boundary:     Notification payload construction — where ID redaction should occur
Impact:             Any actor who receives the team_invite notification can read context.resourceId
                    (the vport.resources UUID). Combined with the linkPath raw UUID
                    (/actor/{barberVportActorId}/dashboard/team-requests), the recipient possesses
                    all parameters needed to execute ELEK-2026-05-27-002 (forced team accept).
                    Also exposes barbershopActorId as a raw UUID — usable in ELEK-2026-05-27-003/004.
Evidence:
  await publishVcsmNotification({
    recipientActorId: barberVportActorId,
    actorId,
    kind: "team_invite",
    objectType: "team_request",
    objectId: resource?.id ? String(resource.id) : null,  // ← raw UUID in objectId
    linkPath: `/actor/${barberVportActorId}/dashboard/team-requests`,  // ← raw UUID in URL
    context: {
      barbershopActorId: actorId,       // ← raw UUID
      resourceId: resource?.id ?? null, // ← raw UUID — directly usable in attack
    },
  });
  // TeamInviteNotificationItem.view.jsx uses notification.linkPath directly for navigation.
Existing Defense:   Destination screen (BarberTeamRequestsScreen) re-validates isOwner.
Why Defense Is Insufficient:
  Destination re-validation only blocks unauthorized navigation. It does not prevent the
  notification payload from exposing resourceId, which is the key ingredient for ELEK-2026-05-27-002.
  Even if -002 is patched, removing raw IDs from notification context is defense-in-depth.
Recommended Fix:    Remove resourceId from notification context. The destination screen should
                    fetch its own resource list — it does not need the ID from the payload.
                    Remove barbershopActorId from context. Replace linkPath UUID with a
                    slug-based route if available.
Suggested Patch:

  FILE: apps/VCSM/src/features/dashboard/vport/controller/vportTeam.controller.js

  // BEFORE:
  await publishVcsmNotification({
    recipientActorId: barberVportActorId,
    actorId,
    kind: "team_invite",
    objectType: "team_request",
    objectId: resource?.id ? String(resource.id) : null,
    linkPath: `/actor/${barberVportActorId}/dashboard/team-requests`,
    context: {
      barbershopActorId: actorId,
      resourceId: resource?.id ?? null,
    },
  });

  // AFTER:
  await publishVcsmNotification({
    recipientActorId: barberVportActorId,
    actorId,
    kind: "team_invite",
    objectType: "team_request",
    // objectId retained for dedup/idempotency by notification engine — do not remove
    objectId: resource?.id ? String(resource.id) : null,
    // linkPath: barber dashboard route — actorId in path is lower-risk (authenticated route)
    // but should be migrated to slug when barber VPORT slug is available on this code path.
    linkPath: `/actor/${barberVportActorId}/dashboard/team-requests`,
    context: {
      // REMOVE: barbershopActorId — recipient can resolve from notification.sender
      // REMOVE: resourceId — destination screen fetches its own resource list
    },
  });

  NOTE: If the notification engine requires context for display (e.g. barbershop name),
  pass only non-sensitive display fields (e.g. barbershopName: resolvedName) — never raw IDs.

Follow-up Command:  HAWKEYE (audit all notification payloads platform-wide for raw UUID exposure)
```

---

## Low Findings

---

### SECURITY FINDING

```
Finding ID:         ELEK-2026-05-27-007
Title:              getBarberTeamRequestsController — No Caller Ownership Gate (Read Enumeration)
Category:           IDOR/BOLA
Severity:           LOW
Status:             Open
Scope:              VCSM
Location:           apps/VCSM/src/features/dashboard/vport/controller/vportTeam.controller.js:60–63
Source:             barberVportActorId — caller-supplied
Sink:               fetchPendingTeamRequestsForBarberDAL(barberVportActorId) →
                    SELECT from vport.resources WHERE member_actor_id = barberVportActorId
Trust Boundary:     Controller entry — no ownership check
Impact:             Any authenticated caller can enumerate pending team requests for any barber VPORT.
                    Response includes barbershop actor_id, barbershop profile id, and resource UUID —
                    all of which feed ELEK-2026-05-27-002/003/004 attack chains.
Evidence:
  export async function getBarberTeamRequestsController(barberVportActorId) {
    if (!barberVportActorId) return [];
    return fetchPendingTeamRequestsForBarberDAL(barberVportActorId);
    // No ownership check. Compare to addTeamMemberController (same file) which correctly
    // calls assertActorOwnsVportActorController.
  }
Existing Defense:   Hook (useBarberTeamRequests) passes null for non-owners → empty result.
Why Defense Is Insufficient: UI-level only. Controller callable directly.
Recommended Fix:    Add callerActorId and ownership gate to controller.
Suggested Patch:

  FILE: apps/VCSM/src/features/dashboard/vport/controller/vportTeam.controller.js

  // BEFORE:
  export async function getBarberTeamRequestsController(barberVportActorId) {
    if (!barberVportActorId) return [];
    return fetchPendingTeamRequestsForBarberDAL(barberVportActorId);
  }

  // AFTER:
  export async function getBarberTeamRequestsController(callerActorId, barberVportActorId) {
    if (!callerActorId || !barberVportActorId) return [];
    await assertActorOwnsVportActorController({
      requestActorId: callerActorId,
      targetActorId: barberVportActorId,
    });
    return fetchPendingTeamRequestsForBarberDAL(barberVportActorId);
  }

  FILE: apps/VCSM/src/features/dashboard/vport/hooks/useBarberTeamRequests.js
  (Same file modified for ELEK-2026-05-27-002 patch)

  // BEFORE (after -002 patch, hook already has viewerActorId):
  getBarberTeamRequestsController(barberVportActorId)

  // AFTER:
  getBarberTeamRequestsController(viewerActorId, barberVportActorId)

Follow-up Command:  None — LOW severity, dependent on -002 patch
```

---

### SECURITY FINDING

```
Finding ID:         ELEK-2026-05-27-008
Title:              resolveVportBarbershopNameDAL Returns Names for Deleted/Inactive VPORTs
Category:           Supabase RLS
Severity:           LOW
Status:             Open
Scope:              VCSM
Location:           apps/VCSM/src/features/profiles/kinds/vport/dal/barbershop/
                    vportBarbershopPost.read.dal.js:6–14
Source:             actorId — passed to DAL from publish controllers
Sink:               SELECT name FROM vport.profiles WHERE actor_id = actorId (no lifecycle filter)
Trust Boundary:     DAL query construction
Impact:             System posts generated for deleted barbershops include the deleted barbershop's
                    name in the post text. Posts appear in the feed attributed to actors that no
                    longer exist. Low direct exploit risk; data integrity issue.
Evidence:
  export async function resolveVportBarbershopNameDAL(actorId) {
    if (!actorId) return null;
    const { data } = await vportSchema
      .from("profiles")
      .select("name")
      .eq("actor_id", actorId)
      .maybeSingle();
    return data?.name ?? null;
    // No .eq("is_deleted", false). No .eq("is_active", true).
  }
Existing Defense:   None.
Recommended Fix:    Add lifecycle filters to the DAL query.
Suggested Patch:

  FILE: apps/VCSM/src/features/profiles/kinds/vport/dal/barbershop/vportBarbershopPost.read.dal.js

  // BEFORE:
  export async function resolveVportBarbershopNameDAL(actorId) {
    if (!actorId) return null;
    const { data } = await vportSchema
      .from("profiles")
      .select("name")
      .eq("actor_id", actorId)
      .maybeSingle();
    return data?.name ?? null;
  }

  // AFTER:
  export async function resolveVportBarbershopNameDAL(actorId) {
    if (!actorId) return null;
    const { data } = await vportSchema
      .from("profiles")
      .select("name")
      .eq("actor_id", actorId)
      .eq("is_deleted", false)
      .eq("is_active", true)
      .maybeSingle();
    return data?.name ?? null;
  }

Follow-up Command:  None — LOW severity
```

---

## Info Findings

---

### SECURITY FINDING

```
Finding ID:         ELEK-2026-05-27-009
Title:              fetchJoinResourceByIdDAL Returns Internal vport.profiles id in Barbershop Join Response
Category:           IDOR/BOLA
Severity:           INFO
Status:             Open
Scope:              VCSM
Location:           apps/VCSM/src/features/join/dal/joinInvite.dal.js:3
Source:             RESOURCE_COLS = "id, name, resource_type, is_active, member_actor_id, meta,
                    barbershop:profiles!profile_id(id, name, actor_id)"
Sink:               API response surface — internal vport.profiles.id returned to client
Trust Boundary:     DAL select list
Impact:             The barbershop join resource response includes barbershop.id — the internal
                    UUID from vport.profiles. This violates the identity surface rule (VBR-02) and
                    enables DB-level ID correlation. Exploitability is low since this is a
                    join-flow-only response (authenticated, transient session). But the ID appears
                    in the client and could be logged, cached, or serialized.
Evidence:
  const RESOURCE_COLS = "id, name, resource_type, is_active, member_actor_id, meta,
    barbershop:profiles!profile_id(id, name, actor_id)";
                                      // ↑ profiles.id exposed — internal UUID
Existing Defense:   Only shown during authenticated join flow; not a public API.
Recommended Fix:    Remove "id" from the barbershop join in RESOURCE_COLS. The join flow only
                    needs barbershop name and actor_id for display.
Suggested Patch:

  FILE: apps/VCSM/src/features/join/dal/joinInvite.dal.js

  // BEFORE:
  const RESOURCE_COLS = "id, name, resource_type, is_active, member_actor_id, meta,
    barbershop:profiles!profile_id(id, name, actor_id)";

  // AFTER:
  const RESOURCE_COLS = "id, name, resource_type, is_active, member_actor_id, meta,
    barbershop:profiles!profile_id(name, actor_id)";
  // 'id' removed from the barbershop join — actor_id and name are sufficient for the join flow.

Follow-up Command:  VENOM cross-reference VBR-02 — confirm this closes the barbershop join exposure
```

---

## False Positives Rejected

---

### FALSE POSITIVE REJECTED

```
Candidate:        VportBarberShopBookingView actorId dual-path resolution (profile?.actorId ?? profile?.actor_id)
Location:         apps/VCSM/src/features/profiles/kinds/vport/screens/barbershop/VportBarberShopBookingView.jsx
Rejection reason: This is a field normalisation pattern, not an untrusted input source.
                  The `profile` object comes from the controller layer (getVportPublicDetailsController),
                  not from client request parameters. The actorId used here is read from DB and
                  passed down through the component tree, not from a URL parameter or request body.
Chain gap:        Source — there is no untrusted input at this point in the component tree.
Notes:            The dual-path pattern (actorId ?? actor_id) suggests an inconsistency in the
                  profile shape contract between call sites. Worth resolving for code hygiene
                  (open an INFO finding in a future SENTRY run) but not a security vulnerability.
```

---

### FALSE POSITIVE REJECTED

```
Candidate:        createBarberVportAndAcceptQr session ownership gap
Location:         apps/VCSM/src/features/join/controllers/joinBarbershopQr.controller.js:24–38
Rejection reason: The VPORT returned by createVport() was just created by the current authenticated
                  user in the same call — the actorId comes from the creation response, not from
                  caller input. There is no trust boundary gap here.
Chain gap:        Source — barberVportActorId is not attacker-controlled; it is derived from the
                  server response of createVport(), which is scoped to the current user's session.
Notes:            No finding. The only gap in this file is acceptQrJoin (ELEK-2026-05-27-001).
```

---

## Suggested Patch Queue

```
SUGGESTED PATCH QUEUE

| # | Finding ID               | Title                                                        | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|--------------------------|--------------------------------------------------------------|----------|----------------|------------------|--------------------|
| 1 | ELEK-2026-05-27-001      | acceptQrJoin — No Ownership Verification                     | HIGH     | Controller     | SIMPLE           | NO (verify RLS)    |
| 2 | ELEK-2026-05-27-002      | acceptTeamRequestController — String Equality Bypass         | HIGH     | Controller     | MODERATE         | NO (verify RLS)    |
| 3 | ELEK-2026-05-27-003      | publishBarbershopPortfolioUpdateAsPost — No Gate             | HIGH     | Controller     | SIMPLE           | NO (verify RLS)    |
| 4 | ELEK-2026-05-27-004      | publishBarbershopHoursUpdateAsPost — No Gate                 | HIGH     | Controller     | SIMPLE           | NO (verify RLS)    |
| 5 | ELEK-2026-05-27-005      | useExistingBarberVportAndAccept — Non-Canonical Ownership     | MEDIUM   | Controller     | MODERATE         | NO                 |
| 6 | ELEK-2026-05-27-006      | Notification Payload Raw UUID Exposure                       | MEDIUM   | Controller     | SIMPLE           | NO                 |
| 7 | ELEK-2026-05-27-007      | getBarberTeamRequestsController — Read Enumeration           | LOW      | Controller     | SIMPLE           | NO                 |
| 8 | ELEK-2026-05-27-008      | resolveVportBarbershopNameDAL — No is_deleted Filter         | LOW      | DAL            | SIMPLE           | NO                 |
| 9 | ELEK-2026-05-27-009      | fetchJoinResourceByIdDAL — vport.profiles.id Exposure        | INFO     | DAL            | SIMPLE           | NO                 |
```

**Patch Application Order (recommended):**
1. Apply patches 1, 2, 3, 4 together — all HIGH, all controller-layer, independent of each other
2. Apply patch 6 (notification) — independent, no dependencies
3. Apply patch 5 — requires identity propagation review (use_existing flow)
4. Apply patches 7, 8, 9 — LOW/INFO, apply in any order

All patches are confined to `apps/VCSM/`. No engine changes required. No DB migrations required (RLS verification is read-only DB audit).

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| **DB** | Verify `vport.resources` UPDATE RLS for `pending_onboarding` and `pending_acceptance` rows — ELEK-001, ELEK-002 | PENDING |
| **DB** | Verify `vc.posts` INSERT RLS for barbershop system post types — ELEK-003, ELEK-004 | PENDING |
| **BLACKWIDOW** | Re-run adversarial simulation after HIGH patches are applied — verify BW-BAR-01/02/03/04 transition to HARDENED | PENDING |
| **HAWKEYE** | Platform-wide notification payload UUID audit — ELEK-006 reveals systemic pattern | PENDING |
| **ARCHITECT** | Audit all write-path controllers for owner_user_id ownership checks — ELEK-005 systemic pattern (VBR-01) | PENDING |
| **THOR** | Release gate evaluation — 4 HIGH findings open in current branch scope | PENDING |

---

## THOR Release Gate Summary

The following findings are THOR release blockers per ELEKTRA governance:

| Finding | Severity | Status | Blocker Reason |
|---|---|---|---|
| ELEK-2026-05-27-001 | HIGH | Open | IDOR — VPORT force-enrollment via QR join |
| ELEK-2026-05-27-002 | HIGH | Open | IDOR — Forced team request acceptance |
| ELEK-2026-05-27-003 | HIGH | Open | IDOR — System post injection via portfolio |
| ELEK-2026-05-27-004 | HIGH | Open | IDOR — System post injection via hours update |

All four patches are SIMPLE-to-MODERATE complexity, confined to the controller layer, and require no DB migrations. Estimated resolution: 1 development session.

---

*ELEKTRA is read-only. No source code was modified. All suggested patches are advisory only — for human review before application.*
*VENOM cross-references: VB-01, VB-05, VBR-01, VBR-02 confirmed as exploitable via code-level chain validation.*
