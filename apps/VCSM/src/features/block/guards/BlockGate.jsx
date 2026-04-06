// ============================================================
//  BLOCK SYSTEM — VIEW GUARD (ACTOR-BASED)
// ------------------------------------------------------------
//  @File: BlockGate.jsx
//  @System: Blocking
//  @RefactorBatch: 2025-12
//  @Status: FINAL
//  @Scope:
//    • Gate UI rendering based on block relationships
//    • Read-only
//    • Actor-only identity
// ------------------------------------------------------------
//  RULES:
//   • NO Supabase imports
//   • NO DAL calls
//   • NO mutations
//   • NO business rules
//   • Hooks are the ONLY source of truth
// ============================================================

import { useBlockStatus } from '@/features/block/hooks/useBlockStatus';

/**
 * BlockGate
 *
 * @param {string} myActorId        - viewer actor
 * @param {string} targetActorId    - profile / content actor
 * @param {ReactNode} children     - content to render if allowed
 * @param {ReactNode} fallback     - content to render if blocked
 */
export default function BlockGate({
  myActorId,
  targetActorId,
  children,
  fallback = null,
}) {
  const {
    loading,
    canViewProfile,
  } = useBlockStatus(myActorId, targetActorId);

  // While block status is loading, render nothing
  if (loading) return null;

  // If either direction is blocked, render fallback
  if (!canViewProfile) {
    return fallback;
  }

  // Otherwise allow rendering
  return children;
}
