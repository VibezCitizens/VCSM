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

/* ===================== CONTROLLERS ===================== */
export {
  blockActorController,
  unblockActorController,
  toggleBlockActorController,
} from "./controllers/blockActor.controller";
export { ctrlGetBlockStatus } from "./controllers/getBlockStatus.controller";
export { ctrlGetBlockedActorSet } from "./controllers/getBlockedActorSet.controller";

/* ===================== HOOKS ===================== */
export { useBlockActions } from "./hooks/useBlockActions";
export { useBlockStatus } from "./hooks/useBlockStatus";

/* ===================== UI ===================== */
export { default as BlockButton } from "./ui/BlockButton";
export { default as BlockConfirmModal } from "./ui/BlockConfirmModal";
export { default as BlockedState } from "./ui/BlockedState";
