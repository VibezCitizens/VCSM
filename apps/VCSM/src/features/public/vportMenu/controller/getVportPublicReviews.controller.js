import readPublicVportReviewSummaryDAL from "@/features/public/vportMenu/dal/readPublicVportReviewSummary.dal";
import readPublicVportReviewsDAL from "@/features/public/vportMenu/dal/readPublicVportReviews.dal";
import readPublicVportReviewDimensionsDAL from "@/features/public/vportMenu/dal/readPublicVportReviewDimensions.dal";
import {
  normalizePublicReviewSummary,
  normalizePublicReviewCards,
  normalizePublicReviewDimensions,
} from "@/features/public/vportMenu/model/vportPublicReviews.model";

/**
 * Controller: load public review summary + first page of reviews + dimensions.
 * Called on initial mount. Use getVportPublicReviewsPageController for pagination.
 */
export async function getVportPublicReviewsController(targetActorId) {
  if (!targetActorId) throw new Error("getVportPublicReviewsController: targetActorId is required");

  const [summaryRaw, reviewsResult, dimensionsRaw] = await Promise.all([
    readPublicVportReviewSummaryDAL(targetActorId),
    readPublicVportReviewsDAL(targetActorId),
    readPublicVportReviewDimensionsDAL(targetActorId),
  ]);

  return {
    summary: normalizePublicReviewSummary(summaryRaw),
    reviews: normalizePublicReviewCards(reviewsResult.rows),
    hasMore: reviewsResult.hasMore,
    dimensions: normalizePublicReviewDimensions(dimensionsRaw),
  };
}

/**
 * Controller: load the next page of reviews for pagination.
 */
export async function getVportPublicReviewsPageController(targetActorId, { cursor }) {
  if (!targetActorId) throw new Error("getVportPublicReviewsPageController: targetActorId is required");

  const result = await readPublicVportReviewsDAL(targetActorId, { cursor });
  return {
    reviews: normalizePublicReviewCards(result.rows),
    hasMore: result.hasMore,
  };
}

export default getVportPublicReviewsController;
