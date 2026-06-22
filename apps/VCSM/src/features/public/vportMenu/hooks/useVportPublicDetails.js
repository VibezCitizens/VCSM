import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/queryKeys";
import getVportPublicDetailsController from "@/features/public/vportMenu/controller/getVportPublicDetails.controller";

const EMPTY = Object.freeze({
  ok: true,
  actorId: null,
  error: null,
  details: null,
});

export function useVportPublicDetails({ actorId } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.vportMenuDetails(actorId),
    queryFn: () => getVportPublicDetailsController({ actorId }),
    enabled: !!actorId,
    staleTime: 60_000,
    gcTime: 300_000,
  });

  const result = query.data ?? EMPTY;
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.vportMenuDetails(actorId) });

  return {
    result,
    details: result?.details ?? null,
    loading: query.isLoading,
    error: query.error ?? null,
    refresh,
    rpcErrorCode: result?.ok === false ? result?.error ?? "unavailable" : null,
  };
}

export default useVportPublicDetails;
