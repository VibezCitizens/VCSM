import { useQuery } from "@tanstack/react-query";
import { resolveAuthenticatedContext } from "@identity";

export const identityEngineQueryKey = (userId) => ["identity", "engine-ctx", userId];

const _identityEngineQueryResolveCounts = new Map();

function logIdentityEngineQueryResolveCount(userId) {
  if (!import.meta.env.DEV) return;

  const key = userId ?? "anonymous";
  const count = (_identityEngineQueryResolveCounts.get(key) ?? 0) + 1;
  _identityEngineQueryResolveCounts.set(key, count);

  console.log("[Query:identity-engine] resolve count", {
    userId: userId?.slice?.(0, 8) ?? null,
    count,
  });
}

function buildQueryOptions(userId, { enabled = true } = {}) {
  return {
    queryKey: identityEngineQueryKey(userId),
    queryFn: async () => {
      logIdentityEngineQueryResolveCount(userId);
      return resolveAuthenticatedContext({ appKey: "vcsm", skipLoginRecord: true });
    },
    enabled: Boolean(userId) && enabled,
    staleTime: 120_000,
    retry: 1,
  };
}

export function useIdentityEngineQuery(userId, options) {
  return useQuery(buildQueryOptions(userId, options));
}

export function useActorLinksQuery(userId, options) {
  return useQuery({ ...buildQueryOptions(userId, options), select: (ctx) => ctx?.availableActors ?? [] });
}

export function useUserAppStateQuery(userId, options) {
  return useQuery({ ...buildQueryOptions(userId, options), select: (ctx) => ctx?.state ?? null });
}

export function useUserAppPreferencesQuery(userId, options) {
  return useQuery({ ...buildQueryOptions(userId, options), select: (ctx) => ctx?.preferences ?? null });
}

export function invalidateIdentityEngineQuery(queryClient, userId) {
  return queryClient.invalidateQueries({ queryKey: identityEngineQueryKey(userId) });
}
