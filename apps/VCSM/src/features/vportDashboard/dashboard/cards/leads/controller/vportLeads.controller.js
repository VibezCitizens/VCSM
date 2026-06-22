import { readVportProfileByActorIdDAL } from "@/features/vportDashboard/dal/read/vportProfile.read.dal";
import {
  readVportBusinessCardLeadsByProfileDAL,
  readNewLeadsCountByProfileDAL,
  readContactedLeadsCountByProfileDAL,
} from "@/features/vportDashboard/dashboard/cards/leads/dal/vportLeads.read.dal";
import {
  deleteVportBusinessCardLeadDAL,
  markVportBusinessCardLeadContactedDAL,
} from "@/features/vportDashboard/dashboard/cards/leads/dal/vportLeads.write.dal";
import { assertSessionOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";
import { normalizeVportLead } from "@/features/vportDashboard/dashboard/cards/leads/model/vportLead.model";
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';

// VPD-V-016: The former assertCallerOwns() was a naive actorId string comparison
// with no actor_owners query, no void/kind check, and no DB verification.
// All entry points now use the canonical ownership gate.
//
// ACCESS POLICY — Owner-only (intentional, not a missing feature):
// vport.business_card_leads contains PII (name, phone, email, message).
// Delegation to team members (manager/staff roles) or org managers is NOT supported by design.
// All four operations (list, count, markContacted, delete) require actor_owners DB verification.
// If delegation is ever required: build assertActorCanManageVport at the app layer first,
// then run VENOM trust-boundary review + Carnage DB policy review before wiring. (BW-008)

async function resolveProfileId(actorId) {
  if (!actorId) throw new Error("Actor is required.");
  const profile = await readVportProfileByActorIdDAL({ actorId });
  const profileId = profile?.id ?? null;
  if (!profileId) throw new Error("Could not resolve vport profile.");
  return profileId;
}

export async function listVportLeadsController(actorId, { limit = 100, statusGroup } = {}) {
  try {
    await assertSessionOwnsVportActorController({ targetActorId: actorId });
    const profileId = await resolveProfileId(actorId);
    const rows = await readVportBusinessCardLeadsByProfileDAL(profileId, { limit, statusGroup });
    return rows.map(normalizeVportLead).filter((lead) => lead.id);
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'leads.vportLeads.controller', severity: 'error', message: `listVportLeadsController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'listVportLeads', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

export async function countContactedVportLeadsController(actorId) {
  try {
    await assertSessionOwnsVportActorController({ targetActorId: actorId });
    const profileId = await resolveProfileId(actorId);
    return readContactedLeadsCountByProfileDAL(profileId);
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'leads.vportLeads.controller', severity: 'error', message: `countContactedVportLeadsController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'countContactedVportLeads', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

export async function markVportLeadContactedController(actorId, { leadId, source } = {}) {
  try {
    await assertSessionOwnsVportActorController({ targetActorId: actorId });
    const profileId = await resolveProfileId(actorId);
    const updated = await markVportBusinessCardLeadContactedDAL({ profileId, leadId, source });
    return updated ? normalizeVportLead(updated) : null;
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'leads.vportLeads.controller', severity: 'error', message: `markVportLeadContactedController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'markVportLeadContacted', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

export async function countNewVportLeadsController(actorId) {
  try {
    await assertSessionOwnsVportActorController({ targetActorId: actorId });
    const profileId = await resolveProfileId(actorId);
    const count = await readNewLeadsCountByProfileDAL(profileId);
    return { count, resolvedProfileId: profileId };
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'leads.vportLeads.controller', severity: 'error', message: `countNewVportLeadsController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'countNewVportLeads', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

export async function fastCountNewVportLeadsController(actorId, profileId) {
  if (!actorId || !profileId) return 0;
  try {
    await assertSessionOwnsVportActorController({ targetActorId: actorId });
    return readNewLeadsCountByProfileDAL(profileId);
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'leads.vportLeads.controller', severity: 'error', message: `fastCountNewVportLeadsController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'fastCountNewVportLeads', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

export async function deleteVportLeadController(actorId, { leadId } = {}) {
  try {
    await assertSessionOwnsVportActorController({ targetActorId: actorId });
    const profileId = await resolveProfileId(actorId);
    await deleteVportBusinessCardLeadDAL({ profileId, leadId });
    return true;
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'leads.vportLeads.controller', severity: 'error', message: `deleteVportLeadController: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'deleteVportLead', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}

export default {
  listVportLeadsController,
  countContactedVportLeadsController,
  countNewVportLeadsController,
  fastCountNewVportLeadsController,
  markVportLeadContactedController,
  deleteVportLeadController,
};
