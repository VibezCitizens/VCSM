// features/vport/vport.public.js
// ============================================================
// MIGRATION BARREL — not a model.
// This file exists only so consumers can reach vport DAL
// functions while CreateVportForm is being refactored into
// a proper hook + controller. Do not add new exports here.
// Remove once CreateVportForm is split (Phase 2 remediation).
// ============================================================

export {
  createVport,
  getVportById,
  getVportBySlug,
  getVportsByIds,
  listMyVports,
  updateVport,
} from "@/features/vport/dal/vport.core.dal";

export { default } from "@/features/vport/dal/vport.core.dal";
