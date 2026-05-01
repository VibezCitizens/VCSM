import {
  fetchResourceByIdDAL,
  fetchPendingTeamRequestsForBarberDAL,
} from "@/features/dashboard/vport/dal/read/vportTeamInvite.read.dal";
import {
  acceptTeamRequestDAL,
  acceptTeamInviteByActorDAL,
  declineTeamRequestDAL,
} from "@/features/dashboard/vport/dal/write/vportTeamInvite.write.dal";

export async function acceptTeamRequestController(resourceId) {
  if (!resourceId) throw new Error("acceptTeamRequestController: resourceId required");

  const resource = await fetchResourceByIdDAL(resourceId);
  if (!resource) throw new Error("Request not found.");
  if (resource.meta?.status !== "pending_acceptance") {
    throw new Error("This request is no longer pending.");
  }

  return acceptTeamRequestDAL(resourceId, resource.meta);
}

export async function declineTeamRequestController(resourceId) {
  if (!resourceId) throw new Error("declineTeamRequestController: resourceId required");

  const resource = await fetchResourceByIdDAL(resourceId);
  if (!resource) throw new Error("Request not found.");
  if (resource.meta?.status !== "pending_acceptance") {
    throw new Error("This request is no longer pending.");
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

export async function acceptBarbershopInviteController(token, barberVportActorId) {
  if (!token || !barberVportActorId) throw new Error("Token and barber actor ID required.");
  const resource = await fetchResourceByIdDAL(token);
  if (!resource) throw new Error("Invite not found.");
  return acceptTeamInviteByActorDAL(token, barberVportActorId, resource.meta);
}
