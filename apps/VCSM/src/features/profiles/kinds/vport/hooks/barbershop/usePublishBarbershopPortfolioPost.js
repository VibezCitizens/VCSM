import { useCallback } from "react";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { publishBarbershopPortfolioUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/barbershop/publishBarbershopPortfolioUpdateAsPost.controller";

export function usePublishBarbershopPortfolioPost({ actorId }) {
  const { identity } = useIdentity();

  const publishBarbershopPortfolioPost = useCallback(
    async ({ portfolioTitle, mediaUrl }) => {
      if (!actorId) return { published: false, status: "skipped", reason: "no_actor" };
      const callerActorId = identity?.actorId ?? null;
      if (!callerActorId) return { published: false, status: "failed", reason: "not_authenticated" };
      return publishBarbershopPortfolioUpdateAsPostController({
        actorId,
        portfolioTitle: portfolioTitle ?? null,
        mediaUrl: mediaUrl ?? null,
        callerActorId,
        vportKind: identity?.vportType ?? null,
      });
    },
    [actorId, identity]
  );

  return { publishBarbershopPortfolioPost };
}
