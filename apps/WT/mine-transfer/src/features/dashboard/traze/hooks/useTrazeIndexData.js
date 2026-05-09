import { useCallback, useEffect, useMemo, useState } from "react";
import { getTrazeProviderSummary, listTrazeProviders } from "@/features/traze/data/trazeProvider.repo";
import { listTrazeCategories } from "@/features/traze/data/trazeCategory.repo";
import { listTrazeLocations } from "@/features/traze/data/trazeLocation.repo";

const EMPTY_SUMMARY = { providers: [], totals: {}, fetchedAt: null };
const EMPTY_LIST = [];
const EMPTY_LOCATIONS = { countries: [], cities: [], neighborhoods: [], missingNeighborhood: 0, providerCount: 0 };

function useAsyncLoader(loader, initialData) {
  const [state, setState] = useState({ status: "loading", data: initialData, error: null });

  const reload = useCallback(() => {
    let cancelled = false;
    setState((current) => ({ ...current, status: "loading", error: null }));
    loader()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: "error", data: initialData, error });
      });
    return () => {
      cancelled = true;
    };
  }, [loader, initialData]);

  useEffect(() => reload(), [reload]);

  return { ...state, reload };
}

export function useTrazeProviderIndex(filters = {}) {
  const depsKey = JSON.stringify(filters);
  const loader = useMemo(() => () => getTrazeProviderSummary(filters), [depsKey]);
  return useAsyncLoader(
    loader,
    EMPTY_SUMMARY
  );
}

export function useTrazeProvidersIndex(filters = {}) {
  const depsKey = JSON.stringify(filters);
  const loader = useMemo(() => () => listTrazeProviders(filters), [depsKey]);
  return useAsyncLoader(loader, EMPTY_LIST);
}

export function useTrazeCategoryIndex(filters = {}) {
  const depsKey = JSON.stringify(filters);
  const loader = useMemo(() => () => listTrazeCategories(filters), [depsKey]);
  return useAsyncLoader(loader, EMPTY_LIST);
}

export function useTrazeLocationIndex(filters = {}) {
  const depsKey = JSON.stringify(filters);
  const loader = useMemo(() => () => listTrazeLocations(filters), [depsKey]);
  return useAsyncLoader(loader, EMPTY_LOCATIONS);
}
