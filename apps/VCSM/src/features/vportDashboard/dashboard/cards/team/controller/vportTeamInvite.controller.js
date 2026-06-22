import {
  fetchResourceByIdDAL,
  fetchPendingTeamRequestsForBarberDAL,
} from "@/features/vportDashboard/dashboard/cards/team/dal/vportTeamInvite.read.dal";
import {
  acceptTeamRequestDAL,
  acceptTeamInviteByActorDAL,
  declineTeamRequestDAL,
} from "@/features/vportDashboard/dashboard/cards/team/dal/vportTeamInvite.write.dal";
import { getVportActorIdByProfileIdDAL } from "@/features/vportDashboard/dal/read/vportProfile.read.dal";
import { assertSessionOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';

export async function acceptTeamRequestController(callerActorId, resourceId) {
  try {
    if (!callerActorId) throw new Error("acceptTeamRequestController: callerActorId required");
    if (!resourceId) throw new Error("acceptTeamRequestController: resourceId required");

    const resource = await fetchResourceByIdDAL(resourceId);
    if (!resource) throw new Error("Request not found.");
    if (resource.meta?.status !== "pending_acceptance") {
      throw new Error("This request is no longer pending.");
    }

    // Session-derived ownership (IDENTITY-BOUNDARY-006 / ELEK-004): the invited barber
    // accepts while acting as their VPORT, so ownership of the member VPORT is resolved
    // from the auth session via actor_owners rather than the UI-passed caller actor id.
    await assertSessionOwnsVportActorController({ targetActorId: resource.member_actor_id });

    return acceptTeamRequestDAL(resourceId, {
      ...resource.meta,
      __memberActorId: resource.member_actor_id,
    });
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'team.vportTeamInvite.controller', severity: 'error', message: `acceptTeamRequestController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'acceptTeamRequest', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

// ELEK-002 / IDENTITY-BOUNDARY-006: callerActorId is the barber VPORT actorId, used only
// for the isInvitedBarber data discriminator (callerActorId === resource.member_actor_id).
// Ownership is resolved from the auth session via assertSessionOwnsVportActorController
// (actor_owners), so it holds whether the session is acting as a user or as the VPORT.
// String equality alone is not a sufficient ownership gate. viewerActorId is retained for
// signature compatibility but no longer trusted for authorization.
export async function declineTeamRequestController(callerActorId, resourceId, viewerActorId) {
  try {
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
      await assertSessionOwnsVportActorController({ targetActorId: callerActorId });
    } else {
      const vportActorId = resource.owner_actor_id
        ?? (resource.profile_id
            ? await getVportActorIdByProfileIdDAL({ profileId: resource.profile_id })
            : null);

      if (!vportActorId) throw new Error("Could not resolve VPORT ownership.");

      await assertSessionOwnsVportActorController({ targetActorId: vportActorId });
    }

    const declineScope = isInvitedBarber
      ? { __memberActorId: resource.member_actor_id }
      : { __profileId: resource.profile_id };

    return declineTeamRequestDAL(resourceId, {
      ...resource.meta,
      ...declineScope,
    });
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'team.vportTeamInvite.controller', severity: 'error', message: `declineTeamRequestController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'declineTeamRequest', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

export async function getBarberTeamRequestsController(callerActorId, barberVportActorId) {
  try {
    if (!callerActorId || !barberVportActorId) return [];
    await assertSessionOwnsVportActorController({ targetActorId: barberVportActorId });
    return fetchPendingTeamRequestsForBarberDAL(barberVportActorId);
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'team.vportTeamInvite.controller', severity: 'error', message: `getBarberTeamRequestsController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'getBarberTeamRequests', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

export async function fetchBarbershopInviteController(token) {
  if (!token) return null;
  return fetchResourceByIdDAL(token);
}

export async function acceptBarbershopInviteController(token, barberVportActorId, callerActorId) {
  try {
    if (!token || !barberVportActorId) throw new Error("Token and barber actor ID required.");
    // VPD-V-008: callerActorId is required to prevent a caller from accepting an invite
    // on behalf of a VPORT they do not own by supplying an arbitrary barberVportActorId.
    if (!callerActorId) throw new Error("acceptBarbershopInviteController: callerActorId is required.");

    const resource = await fetchResourceByIdDAL(token);
    if (!resource) throw new Error("Invite not found.");

    // ELEK-001: validate invite state before ownership check or DAL write.
    if (resource.meta?.status !== "pending_acceptance") {
      throw new Error("invite is no longer available");
    }

    await assertSessionOwnsVportActorController({ targetActorId: barberVportActorId });

    return acceptTeamInviteByActorDAL(token, barberVportActorId, resource.meta);
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'team.vportTeamInvite.controller', severity: 'error', message: `acceptBarbershopInviteController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'acceptBarbershopInvite', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}
