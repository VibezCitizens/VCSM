import { useCallback } from "react";
import { publishBarbershopPortfolioUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/barbershop/publishBarbershopPortfolioUpdateAsPost.controller";

export function usePublishBarbershopPortfolioPost({ actorId }) {
  const publishBarbershopPortfolioPost = useCallback(
    async ({ portfolioTitle, mediaUrl }) => {
      if (!actorId) return { published: false, reason: "no_actor" };
      return publishBarbershopPortfolioUpdateAsPostController({
        actorId,
        portfolioTitle: portfolioTitle ?? null,
        mediaUrl: mediaUrl ?? null,
      });
    },
    [actorId]
  );

  return { publishBarbershopPortfolioPost };
}
