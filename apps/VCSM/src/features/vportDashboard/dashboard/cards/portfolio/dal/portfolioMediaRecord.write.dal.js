import vport from '@/services/supabase/vportClient'

/**
 * Update portfolio_media.media_asset_id for a given row.
 * Called after platform.media_assets row is created for a portfolio upload.
 *
 * PORT-V-005: callerProfileId is required and scopes the UPDATE to rows the
 * caller owns, providing app-layer defense-in-depth alongside RLS.
 */
export async function updatePortfolioMediaAssetIdDAL({ portfolioMediaId, mediaAssetId, callerProfileId }) {
  if (!portfolioMediaId) throw new Error('updatePortfolioMediaAssetIdDAL: portfolioMediaId required')
  if (!callerProfileId) throw new Error('updatePortfolioMediaAssetIdDAL: callerProfileId required')
  const { error } = await vport
    .from('portfolio_media')
    .update({ media_asset_id: mediaAssetId })
    .eq('id', portfolioMediaId)
    .eq('profile_id', callerProfileId)

  if (error) throw error
}
