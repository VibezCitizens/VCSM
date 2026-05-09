import { useEffect, useState } from "react";
import { loadTrazeProvider } from "@/features/dashboard/traze/controllers/intake.controller";

export function useTrazeProviderDetail(id) {
  const [state, setState] = useState({ status: "loading", provider: null, error: null });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState({ status: "loading", provider: null, error: null });
    loadTrazeProvider(id)
      .then((provider) => { if (!cancelled) setState({ status: "ready", provider, error: null }); })
      .catch((error)   => { if (!cancelled) setState({ status: "error",  provider: null, error }); });
    return () => { cancelled = true; };
  }, [id]);

  return state;
}
