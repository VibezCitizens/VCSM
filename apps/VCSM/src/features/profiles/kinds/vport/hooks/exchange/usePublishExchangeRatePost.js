import { useCallback } from "react";
import { publishExchangeRateUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller";

export function usePublishExchangeRatePost({ actorId }) {
  const publishExchangeRatePost = useCallback(
    async ({ baseCurrency, quoteCurrency, buyRate, sellRate }) => {
      if (!actorId) return { published: false, reason: "no_actor" };
      return publishExchangeRateUpdateAsPostController({
        actorId,
        baseCurrency,
        quoteCurrency,
        buyRate,
        sellRate,
      });
    },
    [actorId]
  );

  return { publishExchangeRatePost };
}
