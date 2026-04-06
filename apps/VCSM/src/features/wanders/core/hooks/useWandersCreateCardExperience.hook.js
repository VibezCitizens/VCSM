// src/features/wanders/core/hooks/useWandersCreateCardExperience.hook.js
// ============================================================================
// WANDERS HOOK — CREATE CARD EXPERIENCE
// Contract: Timing + orchestration for the create flow.
// - may call controllers
// - may call other hooks
// - no Supabase, no DAL
// ============================================================================

import { useCallback, useState } from "react";

import useWandersGuest from "@/features/wanders/core/hooks/useWandersGuest";
import { publishWandersFromBuilder } from "@/features/wanders/core/controllers/publishWandersFromBuilder.controller";

/**
 * @param {{
 *  realmId: string | null,
 *  baseUrl: string,
 *  onCreated?: (result: { publicId: string|null, url: string|null, raw?: any }) => void,
 * }} args
 */
export function useWandersCreateCardExperience({ realmId, baseUrl, onCreated }) {
  const { ensureUser } = useWandersGuest({ auto: true });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = useCallback(
    async (payload) => {
      if (!realmId) return;

      setSubmitting(true);
      setError(null);

      try {
        await Promise.resolve(ensureUser?.());

        const res = await publishWandersFromBuilder({
          realmId,
          baseUrl,
          payload,
        });

        const publicId = res?.publicId || null;
        const url = res?.url || null;

        await Promise.resolve(onCreated?.({ publicId, url, raw: res }));
      } catch (e) {
        setError(e);
      } finally {
        setSubmitting(false);
      }
    },
    [realmId, baseUrl, ensureUser, onCreated]
  );

  return {
    submitting,
    error,
    onSubmit,
  };
}

export default useWandersCreateCardExperience;
