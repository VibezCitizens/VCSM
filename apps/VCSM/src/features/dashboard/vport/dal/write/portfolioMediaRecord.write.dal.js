import vport from '@/services/supabase/vportClient'

/**
 * Update portfolio_media.media_asset_id for a given row.
 * Called after platform.media_assets row is created for a portfolio upload.
 */
export async function updatePortfolioMediaAssetIdDAL({ portfolioMediaId, mediaAssetId }) {
  const { error } = await vport
    .from('portfolio_media')
    .update({ media_asset_id: mediaAssetId })
    .eq('id', portfolioMediaId)

  if (error) throw error
}
