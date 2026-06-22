import { useCallback, useEffect, useState } from "react";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { createOwnerBookingController } from "@/features/vportDashboard/dashboard/cards/bookings/controller/createOwnerBooking.controller";
import { getVportServicesController } from "@/features/profiles/kinds/vport/adapters/services.adapter";

export function useQuickBookingModal({ ownerActorId, resourceId } = {}) {
  const { identity, availableActors } = useIdentity();

  // created_by_actor_id must equal vc.current_actor_id() under the bookings owner-insert
  // RLS (bookings_insert_actor_owner). That DB helper returns the user's CITIZEN
  // (user-kind) actor — the oldest actor for auth.uid() — NOT the active VPORT. Booking
  // while acting as the VPORT would otherwise set created_by to the vport and fail RLS.
  // The booking's vport linkage is carried by resource/profile + the session ownership
  // gate (auth.uid via actor_owners), so the human creator is correctly the citizen actor.
  const citizenActorId = availableActors?.find((a) => a.actorKind === "user")?.actorId ?? null;
  const callerActorId = citizenActorId ?? identity?.actorId ?? null;
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
    customerActorId,
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
        customerActorId,
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
