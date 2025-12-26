// ============================================================
//  BLOCK SYSTEM — PUBLIC EXPORTS
// ------------------------------------------------------------
//  @File: index.js
//  @System: Blocking
//  @RefactorBatch: 2025-12
//  @Status: FINAL
// ------------------------------------------------------------
//  PURPOSE:
//   • Single import surface for the block system
//   • Keeps other features decoupled from internal structure
// ============================================================

/* ===================== DAL ===================== */
export { isActorBlocked } from "./dal/block.check.dal";
export {
  fetchBlockedActors,
  fetchBlockedByActors,
} from "./dal/block.read.dal";
export {
  blockActor,
  unblockActor,
} from "./dal/block.write.dal";

/* ===================== HELPERS ===================== */
export { applyBlockSideEffects } from "./helpers/applyBlockSideEffects";

/* ===================== HOOKS ===================== */
export { useBlockActions } from "./hooks/useBlockActions";
export { useBlockStatus } from "./hooks/useBlockStatus";

/* ===================== UI ===================== */
export { default as BlockButton } from "./ui/BlockButton";
export { default as BlockConfirmModal } from "./ui/BlockConfirmModal";
export { default as BlockedState } from "./ui/BlockedState";
