import { useEffect, useRef, useState } from "react";
import { searchActorsAdapter } from "@/features/actors/adapters/actors.adapter";

// Debounced wrapper around the shared actor-search adapter — the SAME pipeline behind
// /explore and team-member search (searchActorsAdapter → searchActors controller →
// identity.search_actor_directory RPC). No new search logic is introduced here; this
// only adds debounce + request-race protection + local result state.
//
// Returns adapter result rows: [{ actorId, kind, displayName, username, avatarUrl }].
export default function useCustomerSearch({ query, viewerActorId, limit = 8, enabled = true } = {}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    const q = (query ?? "").trim();
    if (!enabled || q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const id = ++reqId.current;
    const timer = setTimeout(() => {
      searchActorsAdapter({ query: q, limit, viewerActorId })
        .then((rows) => {
          if (id === reqId.current) setResults(Array.isArray(rows) ? rows : []);
        })
        .catch(() => {
          if (id === reqId.current) setResults([]);
        })
        .finally(() => {
          if (id === reqId.current) setLoading(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [query, viewerActorId, limit, enabled]);

  return { results, loading };
}
