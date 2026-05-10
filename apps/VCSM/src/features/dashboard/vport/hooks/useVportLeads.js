import { useCallback, useEffect, useState } from "react";
import { useIdentity } from "@/state/identity/identityContext";
import {
  deleteVportLeadController,
  listVportLeadsController,
  markVportLeadContactedController,
} from "@/features/dashboard/vport/controller/vportLeads.controller";

export function useVportLeads(actorId) {
  const { identity } = useIdentity();
  const sessionActorId = identity?.actorId ?? null;
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
      const next = await listVportLeadsController(actorId, { limit: 150 }, sessionActorId);
      setLeads(next ?? []);
      return next ?? [];
    } catch (e) {
      setError(e?.message || "Failed to load leads.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [actorId, sessionActorId]);

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
        }, sessionActorId);
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
    [actorId, sessionActorId]
  );

  const deleteLead = useCallback(
    async (leadId) => {
      if (!actorId || !leadId) return false;

      setActionError("");
      setBusyLeadId(leadId);
      try {
        await deleteVportLeadController(actorId, { leadId }, sessionActorId);
        setLeads((prev) => prev.filter((item) => item.id !== leadId));
        return true;
      } catch (e) {
        setActionError(e?.message || "Could not delete this lead.");
        throw e;
      } finally {
        setBusyLeadId(null);
      }
    },
    [actorId, sessionActorId]
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
