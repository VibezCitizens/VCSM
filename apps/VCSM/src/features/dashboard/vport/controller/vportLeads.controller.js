import { readVportProfileByActorIdDAL } from "@/features/dashboard/vport/dal/read/vportProfile.read.dal";
import {
  readVportBusinessCardLeadsByProfileDAL,
  readNewLeadsCountByProfileDAL,
} from "@/features/dashboard/vport/dal/read/vportLeads.read.dal";
import {
  deleteVportBusinessCardLeadDAL,
  markVportBusinessCardLeadContactedDAL,
} from "@/features/dashboard/vport/dal/write/vportLeads.write.dal";

function toText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLead(row) {
  const source = toText(row?.source).toLowerCase();
  return {
    id: row?.id ?? null,
    profileId: row?.vport_profile_id ?? null,
    actorId: row?.actor_id ?? null,
    name: toText(row?.name) || "Lead",
    phone: toText(row?.phone) || "",
    email: toText(row?.email) || "",
    message: toText(row?.message) || "",
    source,
    createdAt: row?.created_at ?? null,
    isContacted: source.includes("contacted"),
  };
}

async function resolveProfileId(actorId) {
  if (!actorId) throw new Error("Actor is required.");
  const profile = await readVportProfileByActorIdDAL({ actorId });
  const profileId = profile?.id ?? null;
  if (!profileId) throw new Error("Could not resolve vport profile.");
  return profileId;
}

export async function listVportLeadsController(actorId, { limit = 100 } = {}) {
  const profileId = await resolveProfileId(actorId);
  const rows = await readVportBusinessCardLeadsByProfileDAL(profileId, { limit });
  return rows.map(normalizeLead).filter((lead) => lead.id);
}

export async function markVportLeadContactedController(actorId, { leadId, source } = {}) {
  const profileId = await resolveProfileId(actorId);
  const updated = await markVportBusinessCardLeadContactedDAL({
    profileId,
    leadId,
    source,
  });
  return updated ? normalizeLead(updated) : null;
}

export async function countNewVportLeadsController(actorId) {
  const profileId = await resolveProfileId(actorId);
  return readNewLeadsCountByProfileDAL(profileId);
}

export async function deleteVportLeadController(actorId, { leadId } = {}) {
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
