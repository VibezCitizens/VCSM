// src/features/profiles/kinds/vport/hooks/services/useVportServicesQuery.js

import { useCallback, useEffect, useRef, useState } from "react";

import getVportServicesController from "@/features/profiles/kinds/vport/controller/services/getVportServices.controller.js";

/**
 * Read-only hook for Services Tab payload.
 * No mutations here.
 *
 * @param {object} params
 * @param {string} params.identityActorId
 * @param {string} params.targetActorId
 * @param {boolean} [params.asOwner=false]
 */
export default function useVportServicesQuery({
  identityActorId,
  targetActorId,
  asOwner = false,
}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetcher = useCallback(async () => {
    if (!targetActorId) {
      setData(null);
      setError(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await getVportServicesController({
        identityActorId,
        targetActorId,
        asOwner,
      });

      if (!mountedRef.current) return null;
      setData(res);
      return res;
    } catch (e) {
      if (!mountedRef.current) return null;
      setError(e);
      setData(null);
      return null;
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [identityActorId, targetActorId, asOwner]);

  useEffect(() => {
    fetcher();
  }, [fetcher]);

  const refetch = useCallback(async () => fetcher(), [fetcher]);

  return {
    data,
    error,
    isLoading,
    refetch,
  };
}