import { useCallback, useEffect, useState } from "react";
import { resolveBookingContext } from "@booking";

export default function useBookingContextResolver({
  profileId,
  resourceId = null,
  locationId = null,
  serviceId = null,
  enabled = true,
} = {}) {
  const [context, setContext]   = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState(null);

  const resolve = useCallback(async () => {
    if (!enabled || !profileId) {
      setContext(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await resolveBookingContext({ profileId, resourceId, locationId, serviceId });
      setContext(result);
    } catch (e) {
      setError(e);
      setContext(null);
    } finally {
      setIsLoading(false);
    }
  }, [profileId, resourceId, locationId, serviceId, enabled]);

  useEffect(() => { resolve(); }, [resolve]);

  return {
    context,
    mode:     context?.mode ?? null,
    resource: context?.resource ?? null,
    resources: context?.resources ?? [],
    location: context?.location ?? null,
    organization: context?.organization ?? null,
    pricing:  context?.pricing ?? null,
    isLoading,
    error,
    reload:   resolve,
  };
}
