import {
  fetchResourceByIdDAL,
  fetchPendingTeamRequestsForBarberDAL,
} from "@/features/dashboard/vport/dal/read/vportTeamInvite.read.dal";
import {
  acceptTeamRequestDAL,
  acceptTeamInviteByActorDAL,
  declineTeamRequestDAL,
} from "@/features/dashboard/vport/dal/write/vportTeamInvite.write.dal";
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

  if (!resource.member_actor_id || String(callerActorId) !== String(resource.member_actor_id)) {
    throw new Error("Only the invited barber can accept this team request.");
  }

  return acceptTeamRequestDAL(resourceId, resource.meta);
}

export async function declineTeamRequestController(callerActorId, resourceId) {
  if (!callerActorId) throw new Error("declineTeamRequestController: callerActorId required");
  if (!resourceId) throw new Error("declineTeamRequestController: resourceId required");

  const resource = await fetchResourceByIdDAL(resourceId);
  if (!resource) throw new Error("Request not found.");
  if (resource.meta?.status !== "pending_acceptance") {
    throw new Error("This request is no longer pending.");
  }

  const isInvitedBarber =
    resource.member_actor_id && String(callerActorId) === String(resource.member_actor_id);

  if (!isInvitedBarber) {
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

export async function getBarberTeamRequestsController(barberVportActorId) {
  if (!barberVportActorId) return [];
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

  // Verify the authenticated caller actually owns the VPORT they are accepting as.
  await assertActorOwnsVportActorController({
    requestActorId: callerActorId,
    targetActorId: barberVportActorId,
  });

  return acceptTeamInviteByActorDAL(token, barberVportActorId, resource.meta);
}
