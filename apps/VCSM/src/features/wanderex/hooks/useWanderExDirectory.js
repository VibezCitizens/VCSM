import { useCallback, useEffect, useMemo, useState } from "react";
import { listWanderExDirectoryProfilesDAL } from "@/features/wanderex/dal/wanderexPublic.read.dal";

export function useWanderExDirectory(filters) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cards, setCards] = useState([]);
  const [facets, setFacets] = useState({ categories: [], cities: [] });

  const normalizedFilters = useMemo(
    () => ({
      category: String(filters?.category || "").trim().toLowerCase(),
      city: String(filters?.city || "").trim(),
      openNow: Boolean(filters?.openNow),
      bookable: Boolean(filters?.bookable),
      topRated: Boolean(filters?.topRated),
      limit: Number(filters?.limit) || 60,
    }),
    [filters]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listWanderExDirectoryProfilesDAL(normalizedFilters);
      setCards(Array.isArray(result?.cards) ? result.cards : []);
      setFacets(result?.facets || { categories: [], cities: [] });
    } catch (err) {
      setError(err);
      setCards([]);
      setFacets({ categories: [], cities: [] });
    } finally {
      setLoading(false);
    }
  }, [normalizedFilters]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    loading,
    error,
    cards,
    facets,
    refresh: load,
  };
}

export default useWanderExDirectory;
