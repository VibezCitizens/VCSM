import vportClient from '@/services/supabase/vportClient'

// vport.profiles.actor_id is the canonical lookup key — no raw profile ID crosses the boundary.

export async function updateVportAvatarMediaAssetIdDAL({ actorId, mediaAssetId, avatarUrl }) {
  if (!actorId || !mediaAssetId) return
  const patch = { avatar_media_asset_id: mediaAssetId }
  if (avatarUrl) patch.avatar_url = avatarUrl
  const { error } = await vportClient
    .from('profiles')
    .update(patch)
    .eq('actor_id', actorId)
  if (error) throw error
}

export async function updateVportBannerMediaAssetIdDAL({ actorId, mediaAssetId }) {
  if (!actorId || !mediaAssetId) return
  const { error } = await vportClient
    .from('profiles')
    .update({ banner_media_asset_id: mediaAssetId })
    .eq('actor_id', actorId)
  if (error) throw error
}
