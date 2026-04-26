import { dalListLocationsByOrganization } from '../dal/location.read.dal.js'
import { mapLocationRows } from '../model/Location.model.js'

export async function listLocationsByOrganization({ organizationId, includeInactive = false }) {
  if (!organizationId) throw new Error('[BookingEngine] organizationId is required')
  const rows = await dalListLocationsByOrganization({ organizationId, includeInactive })
  return mapLocationRows(rows)
}
