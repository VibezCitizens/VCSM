import { supabase } from '@/services/supabase/supabaseClient'

const PLATFORM = () => supabase.schema('platform')

const MEDIA_ASSET_PROJECTION = [
  'id',
  'app_id',
  'owner_source',
  'owner_actor_id',
  'scope_domain',
  'scope_type',
  'scope_id',
  'media_kind',
  'media_role',
  'mime_type',
  'size_bytes',
  'width',
  'height',
  'duration_ms',
  'storage_provider',
  'bucket',
  'storage_key',
  'public_url',
  'variants',
  'meta',
  'status',
  'created_by_actor_id',
  'created_at',
  'updated_at',
].join(',')

/**
 * insertMediaAssetDAL — insert one row into platform.media_assets.
 *
 * @param {object} row
 * @param {string} row.app_id
 * @param {string} row.owner_source
 * @param {string} row.owner_actor_id
 * @param {string} row.scope_domain
 * @param {string} row.scope_type
 * @param {string|null} row.scope_id
 * @param {string} row.media_kind
 * @param {string} row.media_role
 * @param {string} row.mime_type
 * @param {number|null} row.size_bytes
 * @param {number|null} row.width
 * @param {number|null} row.height
 * @param {number|null} row.duration_ms
 * @param {string} row.storage_provider
 * @param {string} row.bucket
 * @param {string} row.storage_key
 * @param {string} row.public_url
 * @param {object} row.variants   — must be an object; never null (NOT NULL column)
 * @param {object} row.meta      — must be an object; never null (NOT NULL column)
 * @param {string} row.status
 * @param {string|null} row.created_by_actor_id
 * @returns {Promise<object>} raw database row
 */
export async function insertMediaAssetDAL(row) {
  if (import.meta.env?.DEV) console.log('[insertMediaAssetDAL] inserting:', { scope_type: row.scope_type, owner_actor_id: row.owner_actor_id, scope_id: row.scope_id, storage_key: row.storage_key })

  const { data, error } = await PLATFORM()
    .from('media_assets')
    .insert({
      app_id:              row.app_id,
      owner_source:        row.owner_source,
      owner_actor_id:      row.owner_actor_id,
      scope_domain:        row.scope_domain,
      scope_type:          row.scope_type,
      scope_id:            row.scope_id            ?? null,
      media_kind:          row.media_kind,
      media_role:          row.media_role,
      mime_type:           row.mime_type,
      size_bytes:          row.size_bytes           ?? null,
      width:               row.width               ?? null,
      height:              row.height              ?? null,
      duration_ms:         row.duration_ms         ?? null,
      storage_provider:    row.storage_provider,
      bucket:              row.bucket,
      storage_key:         row.storage_key,
      public_url:          row.public_url,
      variants:            row.variants            ?? {},
      meta:                row.meta                ?? {},
      status:              row.status,
      created_by_actor_id: row.created_by_actor_id ?? null,
    })
    .select(MEDIA_ASSET_PROJECTION)
    .single()

  if (import.meta.env?.DEV) console.log('[insertMediaAssetDAL] result:', { id: data?.id, error: error?.code ?? null, message: error?.message ?? null })
  if (error) throw error
  return data
}
