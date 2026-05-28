import {
  fetchResourceByIdDAL,
  fetchPendingTeamRequestsForBarberDAL,
} from "@/features/dashboard/vport/dashboard/cards/team/dal/vportTeamInvite.read.dal";
import {
  acceptTeamRequestDAL,
  acceptTeamInviteByActorDAL,
  declineTeamRequestDAL,
} from "@/features/dashboard/vport/dashboard/cards/team/dal/vportTeamInvite.write.dal";
import { getVportActorIdByProfileIdDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";

export async function acceptTeamRequestController(callerActorId, resourceId) {
  if (!callerActorId) throw new Error("acceptTeamRequestController: callerActorId required");
  if (!resourceId) throw new Error("acceptTeamRequestController: resourceId required");

  const resource = await fetchResourceByIdDAL(resourceId);
  if (!resource) throw new Error("Request not found.");
  if (resource.meta?.status !== "pending_acceptance") {
    throw new Error("This request is no longer pending.");
  }

  await assertActorOwnsVportActorController({
    requestActorId: callerActorId,
    targetActorId: resource.member_actor_id,
  });

  return acceptTeamRequestDAL(resourceId, resource.meta);
}

// ELEK-002: viewerActorId added as third param — the session user's actorId (user-kind).
// callerActorId remains the barber VPORT actorId (VPORT-kind) for the isInvitedBarber check.
// On the isInvitedBarber path, assertActorOwnsVportActorController verifies that the
// authenticated session user (viewerActorId) actually owns the barber VPORT (callerActorId)
// before authorizing the decline. String equality alone is not a sufficient ownership gate.
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
    // ELEK-002: string equality is not a sufficient gate — verify session ownership via DB.
    if (!viewerActorId) {
      throw new Error("declineTeamRequestController: viewerActorId required for invited barber path");
    }
    await assertActorOwnsVportActorController({
      requestActorId: viewerActorId,   // session user (user-kind)
      targetActorId:  callerActorId,   // barber VPORT actor being declined on behalf of
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

export async function getBarberTeamRequestsController(callerActorId, barberVportActorId) {
  if (!callerActorId || !barberVportActorId) return [];
  await assertActorOwnsVportActorController({
    requestActorId: callerActorId,
    targetActorId: barberVportActorId,
  });
  return fetchPendingTeamRequestsForBarberDAL(barberVportActorId);
}

export async function fetchBarbershopInviteController(token) {
  if (!token) return null;
  return fetchResourceByIdDAL(token);
}

export async function acceptBarbershopInviteController(token, barberVportActorId, callerActorId) {
  if (!token || !barberVportActorId) throw new Error("Token and barber actor ID required.");
  // VPD-V-008: callerActorId is required to prevent a caller from accepting an invite
  // on behalf of a VPORT they do not own by supplying an arbitrary barberVportActorId.
  if (!callerActorId) throw new Error("acceptBarbershopInviteController: callerActorId is required.");

  const resource = await fetchResourceByIdDAL(token);
  if (!resource) throw new Error("Invite not found.");

  // ELEK-001: validate invite state before ownership check or DAL write.
  // Prevents accepting an already accepted, declined, or linked invite.
  if (resource.meta?.status !== "pending_acceptance") {
    throw new Error("invite is no longer available");
  }

  // Verify the authenticated caller actually owns the VPORT they are accepting as.
  await assertActorOwnsVportActorController({
    requestActorId: callerActorId,
    targetActorId: barberVportActorId,
  });

  return acceptTeamInviteByActorDAL(token, barberVportActorId, resource.meta);
}
