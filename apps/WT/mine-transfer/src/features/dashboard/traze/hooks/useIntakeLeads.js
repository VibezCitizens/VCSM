import { useCallback, useEffect, useState } from "react";
import {
  loadIntakeQueue,
  approveIntakeLead,
  rejectIntakeLead,
  convertLeadToProvider,
} from "@/features/dashboard/traze/controllers/intake.controller";

export function useIntakeLeads() {
  const [state, setState] = useState({ status: "loading", leads: [], error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const leads = await loadIntakeQueue();
      setState({ status: "ready", leads, error: null });
    } catch (error) {
      setState({ status: "error", leads: [], error });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function approve(leadId) {
    await approveIntakeLead(leadId);
    await load();
  }

  async function reject(leadId) {
    await rejectIntakeLead(leadId);
    await load();
  }

  async function convert(leadId, options) {
    const provider = await convertLeadToProvider(leadId, options);
    await load();
    return provider;
  }

  return { ...state, approve, reject, convert, reload: load };
}
