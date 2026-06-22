import { useCallback, useEffect, useState } from "react";
import {
  countContactedVportLeadsController,
  deleteVportLeadController,
  listVportLeadsController,
  markVportLeadContactedController,
} from "@/features/vportDashboard/dashboard/cards/leads/controller/vportLeads.controller";

// Identity Contract §1.3: caller ownership is derived from the auth session inside
// the controller (assertSessionOwnsVportActorController). The UI never passes a
// caller actor id for authorization.
//
// Data flow (TICKET-LEADS-CONTACTED-LAZY-LOAD-001):
//   - Initial load fetches ACTIVE lead rows + a lightweight contacted head count.
//   - Contacted lead ROWS are never fetched on page load; they are lazy-loaded
//     once, on the first time the user opens the Contacted section (loadContacted).
export function useVportLeads(actorId) {
  const [activeLeads, setActiveLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [contactedCount, setContactedCount] = useState(0);
  const [contactedLeads, setContactedLeads] = useState([]);
  const [contactedLoading, setContactedLoading] = useState(false);
  const [contactedLoadedOnce, setContactedLoadedOnce] = useState(false);
  const [contactedError, setContactedError] = useState("");

  const [actionError, setActionError] = useState("");
  const [busyLeadId, setBusyLeadId] = useState(null);

  // Initial / active read path: active rows + contacted head count only.
  const refresh = useCallback(async () => {
    if (!actorId) {
      setActiveLeads([]);
      setContactedCount(0);
      return [];
    }

    setLoading(true);
    setError("");
    try {
      const [rows, cCount] = await Promise.all([
        listVportLeadsController(actorId, { limit: 150, statusGroup: "active" }),
        countContactedVportLeadsController(actorId),
      ]);
      setActiveLeads(rows ?? []);
      setContactedCount(cCount ?? 0);
      return rows ?? [];
    } catch (e) {
      setError(e?.message || "Failed to load leads.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [actorId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Lazy contacted read path: fetches the contacted rows on demand and reconciles
  // the badge count with the loaded rows. Safe to call repeatedly.
  const loadContacted = useCallback(async () => {
    if (!actorId) return [];

    setContactedLoading(true);
    setContactedError("");
    try {
      const rows = await listVportLeadsController(actorId, { limit: 150, statusGroup: "contacted" });
      setContactedLeads(rows ?? []);
      setContactedCount(rows?.length ?? 0);
      setContactedLoadedOnce(true);
      return rows ?? [];
    } catch (e) {
      setContactedError(e?.message || "Failed to load contacted leads.");
      return [];
    } finally {
      setContactedLoading(false);
    }
  }, [actorId]);

  const markContacted = useCallback(
    async (lead) => {
      if (!actorId || !lead?.id) return null;
      if (lead.isContacted) return lead;

      setActionError("");
      setBusyLeadId(lead.id);
      try {
        const updated = await markVportLeadContactedController(actorId, {
          leadId: lead.id,
          source: lead.source,
        });
        if (updated?.id) {
          // Drop from active queue, bump contacted count.
          setActiveLeads((prev) => prev.filter((item) => item.id !== updated.id));
          setContactedCount((n) => n + 1);
          // If the contacted list is already loaded, surface the just-contacted
          // lead at the top (newest contacted first). If not yet loaded, the
          // first open will fetch it fresh.
          if (contactedLoadedOnce) {
            setContactedLeads((prev) => [updated, ...prev.filter((item) => item.id !== updated.id)]);
          }
        }
        return updated;
      } catch (e) {
        setActionError(e?.message || "Could not mark this lead as contacted.");
        throw e;
      } finally {
        setBusyLeadId(null);
      }
    },
    [actorId, contactedLoadedOnce]
  );

  const deleteLead = useCallback(
    async (leadId) => {
      if (!actorId || !leadId) return false;

      setActionError("");
      setBusyLeadId(leadId);
      try {
        await deleteVportLeadController(actorId, { leadId });
        const wasContacted = contactedLeads.some((item) => item.id === leadId);
        setActiveLeads((prev) => prev.filter((item) => item.id !== leadId));
        setContactedLeads((prev) => prev.filter((item) => item.id !== leadId));
        if (wasContacted) setContactedCount((n) => Math.max(0, n - 1));
        return true;
      } catch (e) {
        setActionError(e?.message || "Could not delete this lead.");
        throw e;
      } finally {
        setBusyLeadId(null);
      }
    },
    [actorId, contactedLeads]
  );

  return {
    activeLeads,
    loading,
    error,
    contactedCount,
    contactedLeads,
    contactedLoading,
    contactedLoadedOnce,
    contactedError,
    actionError,
    busyLeadId,
    refresh,
    loadContacted,
    markContacted,
    deleteLead,
  };
}

export default useVportLeads;
