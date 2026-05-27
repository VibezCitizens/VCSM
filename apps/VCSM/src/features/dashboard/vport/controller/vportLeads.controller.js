import { readVportProfileByActorIdDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
import {
  readVportBusinessCardLeadsByProfileDAL,
  readNewLeadsCountByProfileDAL,
} from "@/features/dashboard/vport/dal/read/vportLeads.read.dal";
import {
  deleteVportBusinessCardLeadDAL,
  markVportBusinessCardLeadContactedDAL,
} from "@/features/dashboard/vport/dal/write/vportLeads.write.dal";
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";
import { normalizeVportLead } from "@/features/dashboard/vport/model/vportLead.model";

// VPD-V-016: The former assertCallerOwns() was a naive actorId string comparison
// with no actor_owners query, no void/kind check, and no DB verification.
// All entry points now use the canonical ownership gate.

async function resolveProfileId(actorId) {
  if (!actorId) throw new Error("Actor is required.");
  const profile = await readVportProfileByActorIdDAL({ actorId });
  const profileId = profile?.id ?? null;
  if (!profileId) throw new Error("Could not resolve vport profile.");
  return profileId;
}

export async function listVportLeadsController(actorId, { limit = 100 } = {}, callerActorId) {
  await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId });
  const profileId = await resolveProfileId(actorId);
  const rows = await readVportBusinessCardLeadsByProfileDAL(profileId, { limit });
  return rows.map(normalizeVportLead).filter((lead) => lead.id);
}

export async function markVportLeadContactedController(actorId, { leadId, source } = {}, callerActorId) {
  await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId });
  const profileId = await resolveProfileId(actorId);
  const updated = await markVportBusinessCardLeadContactedDAL({
    profileId,
    leadId,
    source,
  });
  return updated ? normalizeVportLead(updated) : null;
}

export async function countNewVportLeadsController(actorId, callerActorId) {
  await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId });
  const profileId = await resolveProfileId(actorId);
  return readNewLeadsCountByProfileDAL(profileId);
}

export async function deleteVportLeadController(actorId, { leadId } = {}, callerActorId) {
  await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId });
  const profileId = await resolveProfileId(actorId);
  await deleteVportBusinessCardLeadDAL({
    profileId,
    leadId,
  });
  return true;
}

export default {
  listVportLeadsController,
  countNewVportLeadsController,
  markVportLeadContactedController,
  deleteVportLeadController,
};
