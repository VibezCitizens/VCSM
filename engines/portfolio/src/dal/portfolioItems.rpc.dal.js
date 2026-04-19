// ============================================================
// Portfolio Engine — Portfolio Items RPC DAL
// ============================================================
// DEPRECATED: get_vport_portfolio RPC was targeting vc.vport_portfolio_items
// (old schema). That table no longer exists.
//
// Replacement: listPortfolio.controller.js now calls
//   dalGetProfileIdByActorId + dalListPortfolioItemsByProfileId
//   from portfolioItems.read.dal.js directly.
//
// This file is kept empty to avoid broken import errors during
// any incremental migration. Safe to delete once confirmed unused.
// ============================================================
