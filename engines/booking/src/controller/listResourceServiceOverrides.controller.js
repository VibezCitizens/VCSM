import { dalListResourceServiceOverridesByResource } from '../dal/resourceServiceOverride.read.dal.js'
import { mapResourceServiceOverrideRows } from '../model/ResourceServiceOverride.model.js'

export async function listResourceServiceOverrides({ resourceId }) {
  if (!resourceId) throw new Error('[BookingEngine] resourceId is required')
  const rows = await dalListResourceServiceOverridesByResource({ resourceId })
  return mapResourceServiceOverrideRows(rows)
}
