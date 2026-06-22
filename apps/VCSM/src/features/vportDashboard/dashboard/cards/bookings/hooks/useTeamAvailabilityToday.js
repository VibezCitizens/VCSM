import { useCallback, useEffect, useState } from "react";
import { loadTeamAvailabilityDayController } from "@/features/vportDashboard/dashboard/cards/bookings/controller/loadTeamAvailabilityDay.controller";
import { mapLanesToTeamAvailability } from "@/features/vportDashboard/dashboard/cards/bookings/model/teamAvailabilityToday.model";

// Read-only team availability for a single day. Delegates to a session-gated
// controller that reuses the existing resource + availability_rules DALs (no schedule
// logic duplicated). Ownership is derived from the Supabase auth session via
// actor_owners — no callerActorId required, no profiles.user_id, no owner_user_id.
// Errors are captured into state, never thrown — this widget must not break the page.

function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function useTeamAvailabilityToday({ actorId, dateKey, enabled = true, refreshKey = 0 } = {}) {
  const resolvedDateKey = dateKey ?? localDateKey();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!enabled || !actorId) {
      setMembers([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await loadTeamAvailabilityDayController({ actorId, dateKey: resolvedDateKey });
      setMembers(mapLanesToTeamAvailability(result?.lanes));
    } catch (e) {
      setError(e);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, actorId, resolvedDateKey, refreshKey]);

  useEffect(() => { load(); }, [load]);

  return { members, loading, error, dateKey: resolvedDateKey, reload: load };
}
