import { useCallback } from "react";
import { publishLocksmithServiceAreaUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/locksmith/publishLocksmithServiceAreaUpdateAsPost.controller";
import { publishLocksmithHoursUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/locksmith/publishLocksmithHoursUpdateAsPost.controller";
import { publishLocksmithPortfolioUpdateAsPostController } from "@/features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller";

export function usePublishLocksmithPost({ actorId }) {
  const publishServiceAreaPost = useCallback(
    async (area) => {
      if (!actorId) return { published: false, reason: "no_actor" };
      return publishLocksmithServiceAreaUpdateAsPostController({ actorId, area });
    },
    [actorId]
  );

  const publishHoursPost = useCallback(
    async ({ blocks }) => {
      if (!actorId) return { published: false, reason: "no_actor" };
      return publishLocksmithHoursUpdateAsPostController({ actorId, blocks });
    },
    [actorId]
  );

  const publishPortfolioPost = useCallback(
    async ({ portfolioTitle, jobType, mediaUrl }) => {
      if (!actorId) return { published: false, reason: "no_actor" };
      return publishLocksmithPortfolioUpdateAsPostController({ actorId, portfolioTitle, jobType, mediaUrl });
    },
    [actorId]
  );

  return { publishServiceAreaPost, publishHoursPost, publishPortfolioPost };
}
