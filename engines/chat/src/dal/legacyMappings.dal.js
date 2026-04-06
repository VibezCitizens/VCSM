// src/dal/legacyMappings.dal.js
// ============================================================
// Legacy Mappings DAL
// ------------------------------------------------------------
// Real schema: chat.legacy_mappings
//   id, source_system, source_table, source_id,
//   target_table, target_id, created_at
// ============================================================

import { getSupabaseClient } from '../config.js'

const LEGACY_MAPPING_COLUMNS = `
  id,
  source_system,
  source_table,
  source_id,
  target_table,
  target_id,
  created_at
`

function getLegacyMappingsTable() {
  return getSupabaseClient()
    .schema('chat')
    .from('legacy_mappings')
}

export async function readLegacyMappingDAL({
  sourceSystem,
  sourceTable,
  sourceId,
}) {
  if (!sourceSystem || !sourceTable || !sourceId) return null

  const { data, error } = await getLegacyMappingsTable()
    .select(LEGACY_MAPPING_COLUMNS)
    .eq('source_system', sourceSystem)
    .eq('source_table', sourceTable)
    .eq('source_id', sourceId)
    .maybeSingle()

  if (error) return null

  return data ?? null
}

export async function insertLegacyMappingDAL({
  sourceSystem,
  sourceTable,
  sourceId,
  targetTable,
  targetId,
}) {
  if (!sourceSystem || !sourceTable || !sourceId || !targetTable || !targetId) {
    return null
  }

  const { data, error } = await getLegacyMappingsTable()
    .insert({
      source_system: sourceSystem,
      source_table: sourceTable,
      source_id: sourceId,
      target_table: targetTable,
      target_id: targetId,
    })
    .select(LEGACY_MAPPING_COLUMNS)
    .maybeSingle()

  if (error) return null

  return data ?? null
}
