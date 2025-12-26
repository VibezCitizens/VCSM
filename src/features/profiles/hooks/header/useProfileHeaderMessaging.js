/**
 * @Contract: HOOK — CHAT ENTRY BRIDGE
 * ============================================================
 * This hook respects the **Core Layer Contracts (Locked)**.
 *
 * ROLE
 * ------------------------------------------------------------
 * UI-level orchestration hook for the Profile domain.
 *
 * It acts as a **bridge into the chat domain** by delegating
 * all business meaning to:
 *
 *   chat/start/controllers/startDirectConversation
 *
 *
 * RESPONSIBILITIES (ALLOWED)
 * ------------------------------------------------------------
 * - Handle UI intent timing (Message button click)
 * - Read identity context (read-only)
 * - Call a chat START controller
 * - Perform navigation based on controller result
 * - Surface UI feedback (toast)
 *
 *
 * NON-RESPONSIBILITIES (ENFORCED)
 * ------------------------------------------------------------
 * This file MUST NOT:
 * - Import Supabase
 * - Call DAL functions
 * - Resolve actor IDs            (R)(R)(R)(R)(R)(R)
 * - Call chat runtime hooks
 * - Enforce permissions or business rules
 * - Know about RPCs or database schema
 *
 *
 * ARCHITECTURAL GUARANTEE
 * ------------------------------------------------------------
 * Profiles do NOT depend on chat internals.
 * Chat may change freely as long as the start controller
 * contract is preserved.
 *
 * ============================================================
 */// src/features/profiles/shared/profileheader/hooks/useProfileHeaderMessaging.js

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useIdentity } from '@/state/identity/identityContext';
import { startDirectConversation } from '@/features/chat/start/controllers/startDirectConversation.controller';

export function useProfileHeaderMessaging({ profileId }) {
  const navigate = useNavigate();
  const { identity } = useIdentity();

  const handleMessage = useCallback(async () => {
    if (!identity?.actorId) {
      toast.error('Your identity is still loading.');
      return;
    }

    if (!profileId) return;

    try {
      const { conversationId } = await startDirectConversation({
        fromActorId: identity.actorId,
        realmId: identity.realmId,
        picked: { id: profileId, kind: 'user' },
      });

      navigate(`/chat/${conversationId}`);
    } catch (err) {
      console.error('[useProfileHeaderMessaging]', err);
      toast.error('Failed to open chat.');
    }
  }, [identity?.actorId, identity?.realmId, profileId, navigate]);

  return { handleMessage };
}
