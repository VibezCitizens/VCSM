// ============================================================
// Reviews Engine — Public API
// ============================================================
// This is the ONLY file that defines the engine's public surface.
// All external consumers import from here (via engines/reviews/index.js).
// ============================================================

// Configuration
export { configureReviewsEngine } from '../config.js'

// Events
export { EVENTS, on as onReviewEvent, emit } from '../events.js'

// Controllers
export { getReviewFormConfig }   from '../controller/getReviewFormConfig.controller.js'
export { submitReview }          from '../controller/submitReview.controller.js'
export { deleteReview }          from '../controller/deleteReview.controller.js'
export { listReviews }           from '../controller/listReviews.controller.js'
export { getMyActiveReview }     from '../controller/getMyActiveReview.controller.js'
export { getTargetStats }        from '../controller/getReviewStats.controller.js'

// Models (public contract shapes)
export { ReviewModel }           from '../model/Review.model.js'
export { DimensionModel }        from '../model/Dimension.model.js'
export { DimensionRatingModel }  from '../model/DimensionRating.model.js'
export { AuthorCardModel }       from '../model/AuthorCard.model.js'
export { TargetStatsModel }      from '../model/TargetStats.model.js'
