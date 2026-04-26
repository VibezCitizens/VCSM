import { dalListOrganizationsByOwnerActor } from '../dal/organization.read.dal.js'
import { mapOrganizationRows } from '../model/Organization.model.js'

export async function listOrganizationsByOwnerActor({ ownerActorId, includeInactive = false }) {
  if (!ownerActorId) throw new Error('[BookingEngine] ownerActorId is required')
  const rows = await dalListOrganizationsByOwnerActor({ ownerActorId, includeInactive })
  return mapOrganizationRows(rows)
}
