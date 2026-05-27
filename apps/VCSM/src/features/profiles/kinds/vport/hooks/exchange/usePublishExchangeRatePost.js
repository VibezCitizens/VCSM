import { useCallback, useMemo } from "react";
import { useIdentity } from "@/state/identity/identityContext";
import { publishExchangeRateUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller";

export function usePublishExchangeRatePost({ actorId }) {
  const { identity } = useIdentity();
  const identityActorId = useMemo(() => identity?.actorId ?? null, [identity]);

  const publishExchangeRatePost = useCallback(
    async ({ baseCurrency, quoteCurrency, buyRate, sellRate }) => {
      if (!actorId) return { published: false, reason: "no_actor" };
      if (!identityActorId) return { published: false, reason: "no_identity" };
      return publishExchangeRateUpdateAsPostController({
        identityActorId,
        actorId,
        baseCurrency,
        quoteCurrency,
        buyRate,
        sellRate,
      });
    },
    [actorId, identityActorId]
  );

  return { publishExchangeRatePost };
}
