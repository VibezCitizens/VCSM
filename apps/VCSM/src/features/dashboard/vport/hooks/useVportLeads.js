import { useCallback, useEffect, useState } from "react";
import {
  deleteVportLeadController,
  listVportLeadsController,
  markVportLeadContactedController,
} from "@/features/dashboard/vport/controller/vportLeads.controller";

export function useVportLeads(actorId) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyLeadId, setBusyLeadId] = useState(null);

  const refresh = useCallback(async () => {
    if (!actorId) {
      setLeads([]);
      return [];
    }

    setLoading(true);
    setError("");
    try {
      const next = await listVportLeadsController(actorId, { limit: 150 });
      setLeads(next ?? []);
      return next ?? [];
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
          setLeads((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        }
        return updated;
      } catch (e) {
        setActionError(e?.message || "Could not mark this lead as contacted.");
        throw e;
      } finally {
        setBusyLeadId(null);
      }
    },
    [actorId]
  );

  const deleteLead = useCallback(
    async (leadId) => {
      if (!actorId || !leadId) return false;

      setActionError("");
      setBusyLeadId(leadId);
      try {
        await deleteVportLeadController(actorId, { leadId });
        setLeads((prev) => prev.filter((item) => item.id !== leadId));
        return true;
      } catch (e) {
        setActionError(e?.message || "Could not delete this lead.");
        throw e;
      } finally {
        setBusyLeadId(null);
      }
    },
    [actorId]
  );

  return {
    leads,
    loading,
    error,
    actionError,
    busyLeadId,
    refresh,
    markContacted,
    deleteLead,
  };
}

export default useVportLeads;
