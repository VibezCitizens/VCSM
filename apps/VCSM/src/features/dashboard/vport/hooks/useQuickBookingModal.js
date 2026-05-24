import { useCallback, useEffect, useState } from "react";
import { useIdentity } from "@/state/identity/identityContext";
import { createOwnerBookingController } from "@/features/dashboard/vport/controller/createOwnerBooking.controller";
import getVportServicesController from "@/features/profiles/kinds/vport/controller/services/getVportServices.controller";

export function useQuickBookingModal({ ownerActorId, resourceId } = {}) {
  const { identity } = useIdentity();
  const callerActorId = identity?.actorId ?? null;
  const [services, setServices] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!ownerActorId) {
      setServices([]);
      return () => { cancelled = true; };
    }

    // Viewer mode (asOwner: false) — only enabled services returned.
    // No callerActorId needed; owner mode is not requested here.
    // Filter to services with a persisted DB id (catalog-only entries are not bookable).
    getVportServicesController({ targetActorId: ownerActorId, asOwner: false })
      .then((result) => {
        if (!cancelled) {
          setServices((result?.services ?? []).filter((s) => Boolean(s.id)));
        }
      })
      .catch(() => {
        if (!cancelled) setServices([]);
      });

    return () => { cancelled = true; };
  }, [ownerActorId]);

  const createBooking = useCallback(async ({
    serviceId,
    startsAt,
    endsAt,
    timezone,
    serviceLabelSnapshot,
    durationMinutes,
    customerName,
    customerNote,
  } = {}) => {
    setError("");
    setSaving(true);
    try {
      return await createOwnerBookingController({
        callerActorId,
        resourceId,
        serviceId,
        startsAt,
        endsAt,
        timezone,
        serviceLabelSnapshot,
        durationMinutes,
        customerName,
        customerNote,
      });
    } catch (err) {
      setError(err?.message || "Failed to create booking.");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [callerActorId, resourceId]);

  return {
    services,
    saving,
    error,
    setError,
    createBooking,
  };
}

export default useQuickBookingModal;
