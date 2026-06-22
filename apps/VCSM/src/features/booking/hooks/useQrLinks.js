import { useCallback, useEffect, useRef, useState } from "react";
import { listQrLinksByProfile, createQrLink } from "@booking";
import { resolveVportProfileIdController } from "@/features/booking/controllers/resolveVportProfileId.controller";

/**
 * Hook: load and manage QR links for a VPORT actor.
 *
 * Accepts actorId (canonical identity surface) and resolves to the booking
 * engine's internal profileId via getVportProfileIdByActorIdDAL — the
 * translation is internal and invisible to callers. organizationId and
 * profileId must never be accepted as caller-provided parameters.
 *
 * (VENOM V-003 — identity surface remediation)
 *
 * @param {string|null} actorId  — VCSM actor ID (kind='vport')
 * @param {boolean}     enabled  — set false to defer loading
 */
export default function useQrLinks({ actorId = null, enabled = true } = {}) {
  const [qrLinks, setQrLinks]   = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError]        = useState(null);

  // Resolved internal profileId — derived from actorId at load time.
  // Never surfaced to callers; used only to satisfy the booking engine API.
  const resolvedProfileId = useRef(null);

  const load = useCallback(async () => {
    if (!enabled || !actorId) {
      setQrLinks([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Resolve actorId → profileId via controller (not DAL directly — architecture compliance).
      if (!resolvedProfileId.current) {
        resolvedProfileId.current = await resolveVportProfileIdController({ actorId });
      }
      if (!resolvedProfileId.current) {
        setQrLinks([]);
        return;
      }
      // requestActorId = actorId: the VPORT actor is authorizing access to its own QR links.
      // The engine validates ownership via assertActorOwnsVportActor before the DAL read (V-002 fix).
      const result = await listQrLinksByProfile({ requestActorId: actorId, profileId: resolvedProfileId.current });
      setQrLinks(Array.isArray(result) ? result : []);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [actorId, enabled]);

  // Reset cached profileId when actorId changes so a new actor gets a fresh resolution.
  useEffect(() => { resolvedProfileId.current = null; }, [actorId]);

  useEffect(() => { load(); }, [load]);

  const addQrLink = useCallback(async (params) => {
    setIsPending(true);
    setError(null);
    try {
      const result = await createQrLink(params);
      await load();
      return { ok: true, data: result, error: null };
    } catch (e) {
      setError(e);
      return { ok: false, data: null, error: e };
    } finally {
      setIsPending(false);
    }
  }, [load]);

  return { qrLinks, isLoading, isPending, error, reload: load, addQrLink };
}
