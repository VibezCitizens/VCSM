import { useCallback, useMemo } from "react";
import { useIdentity } from "@/state/identity/identityContext";
import { publishExchangeRateUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller";

export function usePublishExchangeRatePost({ actorId }) {
  const { identity, availableActors } = useIdentity();
  const identityActorId = useMemo(() => {
    if (identity?.kind === "user") return identity.actorId ?? null;
    // Acting-as-VPORT: resolve the owning user-kind actor to satisfy the ownership gate.
    const userActor = availableActors?.find((a) => a.actorKind === "user");
    return userActor?.actorId ?? null;
  }, [identity, availableActors]);

  const publishExchangeRatePost = useCallback(
    async ({ baseCurrency, quoteCurrency, buyRate, sellRate }) => {
      if (!actorId) return { published: false, status: "skipped", reason: "no_actor" };
      if (!identityActorId) return { published: false, status: "failed", reason: "no_identity" };
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
