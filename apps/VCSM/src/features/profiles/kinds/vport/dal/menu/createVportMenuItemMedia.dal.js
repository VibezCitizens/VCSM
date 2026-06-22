import vport from '@/services/supabase/vportClient'
import { resolveVportProfileId } from '@/shared/lib/vport/resolveVportProfileId'

const MEDIA_SELECT = 'id,profile_id,item_id,url,kind,sort_order,is_active,media_asset_id,created_at,updated_at'

/**
 * Insert a row into vport.menu_item_media.
 * Called after upload + platform.media_assets recording to link media to the menu item.
 */
export async function createVportMenuItemMediaDAL({ actorId, itemId, url, kind = 'image', sortOrder = 0, mediaAssetId }) {
  if (!actorId) throw new Error('createVportMenuItemMediaDAL: actorId is required')
  if (!itemId)  throw new Error('createVportMenuItemMediaDAL: itemId is required')
  if (!url)     throw new Error('createVportMenuItemMediaDAL: url is required')

  const profileId = await resolveVportProfileId(actorId)
  if (!profileId) return null

  const { data, error } = await vport
    .from('menu_item_media')
    .insert({
      profile_id:     profileId,
      item_id:        itemId,
      url,
      kind,
      sort_order:     typeof sortOrder === 'number' ? sortOrder : 0,
      media_asset_id: mediaAssetId ?? null,
    })
    .select(MEDIA_SELECT)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}
